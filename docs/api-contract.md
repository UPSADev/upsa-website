# Portal API Contract

Notes for whoever's building the backend, so you know what the frontend already expects instead of guessing. Field names below match `src/app/portal/_lib/mock-data.ts` on the `umerportal` branch, that's the mock data standing in until this is real.

Every route needs a signed-in user (Clerk JWT) unless I say otherwise. Don't send back more fields than the screen actually shows, no reason to leak stuff.

## Member / profile

```
name
university
major          (optional)
company        (optional, professionals)
role           (optional, job title)
industry       (optional)
location       (optional)
bio
skills[]       (just free text, comma separated on the frontend)
availability.mentor      (bool, off by default)
availability.networking  (bool, off by default)
availability.referrals   (bool, "open to discussing", never a promise)
isProfessional (bool, this drives the Mentor/Professional vs Member tag)
```

Need:
- `GET /api/members/me/` and `PATCH` to update
- `GET /api/members/{id}/` for viewing someone else, but only whatever fields they've made visible, never their email or resume here

## Discover

- `GET /api/professionals/`, paginated
- filters: company, industry, university, availability.mentor, availability.networking
- only show people who've turned mentor or networking on
- skip anyone who's deactivated

## Connection requests

Fields: `fromId`, `toId`, `requestType` (`networking` / `mentorship` / `referral`), `message`, `status` (`pending` / `accepted` / `declined` / `expired` / `cancelled`), `createdAt`.

Don't ever trust `fromId` from the request body, that comes from the auth token.

- `GET /api/requests/?direction=incoming|outgoing`, scoped to whoever's logged in
- `POST /api/requests/` with `toId`, `requestType`, `message`
- `POST /api/requests/{id}/accept/` and `/decline/`, recipient only. Declines don't take a reason, and the requester is the only one who should ever know it was declined
- `POST /api/requests/{id}/cancel/`, requester only, and only while it's still pending
- block a second request if there's already an open one between the same two people
- expire unanswered ones after some number of days, we haven't picked the exact number yet

## Connections

Fields: `status` (`active` / `completed` / `cancelled`), `since`.

- `GET /api/connections/`, mine only
- `POST /api/connections/{id}/complete/` and `/cancel/`, either person in the connection can do these

## Resume

Private, always. Never show it in a list response, only serve it directly to the owner or someone it's been shared with.

- `GET/POST/DELETE /api/resume/`, owner only
- `POST /api/connections/{id}/share-resume/`, owner grants access to that one connection
- `GET /api/resume/{id}/download/` returns a signed URL that expires quickly
- PDF/DOC/DOCX only, check the actual file type server side not just the extension, cap it around 5MB

## Messages

Fields: `connectionId`, `senderId`, `text`, `createdAt`. Only exist inside an active or completed connection.

- `GET` and `POST /api/connections/{id}/messages/`, either person in that connection
- doesn't need to be real time, refresh on load is fine for now, no read receipts or typing indicators

## The important part

Every route above needs to check three things itself, not trust the frontend for any of it: who's actually asking, do they own the thing they're asking about, and are they allowed to do this specific action. If a client sends an id claiming to own something, verify it, don't just believe it.
