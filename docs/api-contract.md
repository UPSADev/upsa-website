# Portal API reference

The Django backend behind the Mentor Portal. This describes what is built and running. The code is in `backend/portal/` (`views.py`, `serializers.py`, `urls.py`) and is covered by `backend/portal/tests.py`.

Base URL: `http://localhost:8000` locally, the deployed backend in production. Every path below starts with `/api/`.

## Conventions

**Authentication.** Every endpoint except `GET /api/health/` needs the signed-in member's Clerk session token:

```text
Authorization: Bearer <Clerk session token>
```

The backend verifies the token's signature, issuer, expiry (with 10 seconds of clock tolerance) and the site it was issued to, then maps it to a local user, creating one on first sight. The website gets the token from Clerk's `getToken()`. Nothing in a request body is ever trusted as "who is asking": the caller always comes from the token.

**Ids.** Every id is an integer. A member's id is the same everywhere (`id`, `fromId`, `toId`, `memberIds`, `senderId`).

**Times.** ISO 8601 UTC strings, e.g. `2026-09-28T01:00:53.789497Z`.

**Ownership is checked in the query.** Asking for something that isn't yours returns **404**, the same as something that doesn't exist, so ids can't be probed.

**Errors.**

| Status | Meaning |
| --- | --- |
| 400 | Validation failed. The body is a message, a list of messages, or `{field: [messages]}`. |
| 401 / 403 | Missing, invalid or expired token. |
| 404 | Not found, or not yours. |
| 429 | Rate limit hit. See below. |

**Rate limits** (per signed-in member): 600 requests/minute overall. Writes only: connection requests 30/day, messages 60/minute, uploads (resume and photo) 20/hour. Reads are never counted against the write limits.

## Health

`GET /api/health/` (no auth) returns `{"success": true, "message": "UPSA Django backend is running!"}`.

## The signed-in user

`GET /api/users/me/` returns `{"id": <int>, "clerk_id": "<clerk user id>"}`. Useful for checking a token works.

## Profiles

A profile is created empty the first time `/api/members/me/` is called.

```text
id                  integer (read only)
name, headline      strings
university, major   strings
company, role       strings (professionals)
industry, location  strings
bio                 string
skills              array of strings
availability        { mentor, networking, referrals }   booleans, all off by default
isProfessional      boolean, drives the "Mentor / Professional" vs "Member" tag
deactivated         boolean, hides the profile from Discover and from other members
avatarUrl, hasAvatar   read only; the photo (see below)
emailNotifications  boolean, default true. Only the owner ever sees this field.
```

| Method and path | Notes |
| --- | --- |
| `GET /api/members/me/` | Your profile. |
| `PATCH /api/members/me/` | Partial update of any field above except `id`, `avatarUrl`, `hasAvatar`. If you send `availability`, send all three keys. |
| `GET /api/members/{id}/` | Someone else's profile. 404 if they are deactivated. Never includes email or resume, and omits `emailNotifications`. |

**Profile photo.** JPG, PNG or WEBP, up to 5 MB.

| Method and path | Notes |
| --- | --- |
| `POST /api/members/me/avatar/` | Multipart form, field `file`. Returns 201 and the profile. Replaces any existing photo (the old file is deleted). |
| `DELETE /api/members/me/avatar/` | Removes the photo and its file. Returns 200 and the profile. |

The upload must be a real image (it is decoded and checked), no more than 25 million pixels, and is stored as a small WebP of at most 256 pixels on its longest side. The original is not kept. `avatarUrl` is a full URL when R2 is configured (public photos are cached by browsers and the CDN for a year; every upload gets a new name), or a path on the backend in local development.

## Discover

`GET /api/professionals/`: paginated, 20 per page, ordered by name. Response is `{count, next, previous, results: [profile, ...]}`; `next` is `null` on the last page.

Lists only members who are a professional, not deactivated, and have **mentor or networking turned on**.

| Query parameter | Effect |
| --- | --- |
| `page` | Page number, default 1 |
| `search` | Case-insensitive match on name, headline, role, company or skills |
| `company`, `industry`, `university` | Case-insensitive partial match |
| `availability.mentor=true` | Only people open to mentoring |
| `availability.networking=true` | Only people open to networking |

## Connection requests

```text
id, fromId, toId, requestType, message, status, createdAt
requestType   networking | mentorship | referral
status        pending | accepted | declined | cancelled
```

Requests never expire. They stay pending until accepted, declined or cancelled.

| Method and path | Who | Notes |
| --- | --- | --- |
| `GET /api/requests/?direction=incoming` or `outgoing` | you | Default `incoming`. Not paginated. |
| `POST /api/requests/` | you | Body `{toId, requestType, message}`. `fromId` comes from the token. 400 if you send it to yourself, or if a pending request already exists between the two of you in either direction. Emails the recipient. |
| `POST /api/requests/{id}/accept/` | recipient only, while pending | Returns 201 and the new **connection**. Emails the requester. |
| `POST /api/requests/{id}/decline/` | recipient only, while pending | Returns the request. No reason is taken, and only the requester ever learns of it. |
| `POST /api/requests/{id}/cancel/` | requester only, while pending | Returns the request. |

## Connections

```text
id, requestId, memberIds [a, b], status, since, lastMessage
status        active | completed | cancelled
lastMessage   { text (first 140 characters), senderId, createdAt } or null
```

`lastMessage` is stored on the connection, so listing connections shows a preview of every conversation without a query per conversation.

| Method and path | Notes |
| --- | --- |
| `GET /api/connections/` | Yours only. Not paginated. |
| `POST /api/connections/{id}/complete/` | Either member. Returns the connection. |
| `POST /api/connections/{id}/cancel/` | Either member. Returns the connection. |

## Messages

```text
id, connectionId, senderId, text, createdAt
```

| Method and path | Notes |
| --- | --- |
| `GET /api/connections/{id}/messages/` | The latest 200 messages, oldest first. Either member. A long conversation never gets slower to open. |
| `POST /api/connections/{id}/messages/` | Body `{text}`. 400 if the connection is cancelled. Emails the other member, at most once per conversation per 15 minutes. |

There is no realtime channel, read receipts or typing indicators. An open conversation re-fetches its messages every 5 seconds; everything else uses the change check below.

## Change check

`GET /api/sync/` returns `{"version": "<string>"}`. The version changes whenever one of your requests or connections changes (a connection also changes on every new message), and is `"0"` if you have none. It costs two indexed queries and a few bytes.

The portal calls this every 30 seconds (each tab is randomly offset by up to 20% so tabs never all ask at once) and only downloads profile, requests, connections and resume when the version differs from the last one it saw. Idle tabs therefore cost almost nothing: for a member with 20 conversations this replaced about 150 requests and 390 queries a minute with 2 requests and 4 queries.

## Resume

One resume per member. PDF, DOC or DOCX, up to 5 MB. Private always: it is never included in any list, only served to its owner or a connection it was shared with.

```text
id, fileName, sizeLabel, uploadedAt, sharedWith [connection ids]
```

| Method and path | Notes |
| --- | --- |
| `GET /api/resume/` | Yours, or `null` if none. |
| `POST /api/resume/` | Multipart form, field `file`. Returns 201. Replaces an existing resume (old file deleted). |
| `DELETE /api/resume/` | Returns 204. The file is deleted. |
| `POST /api/connections/{id}/share-resume/` | Grants that one connection access. Returns 204. |
| `GET /api/resume/{id}/download/` | The file itself, streamed. 404 unless you own it or a connection you belong to has been granted it. |

## Emails

The backend emails a member about a new request, an accepted request, and a new message. Emails only say that something happened and link to the portal; they never contain what was written. Members opt out with `emailNotifications`. Addresses are looked up from Clerk at send time and never stored.

## Known limits

- There is no way for a member to set `isProfessional`, company, role, industry or location in the portal screens; an admin does it in the admin panel. The API itself lets a member set `isProfessional` on their own profile.
- Request and message text have no length cap beyond the general request-size limit (about 2.5 MB).
- There is no reporting or blocking between members.
