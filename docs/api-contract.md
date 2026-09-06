# Portal API Contract

What the frontend needs from the backend. Grounded in the actual mock data types used in the `/portal` skeleton (`src/app/portal/_lib/mock-data.ts`), so field names here match what the frontend already expects.

Every endpoint below requires a signed-in member (Clerk JWT) unless noted. No endpoint should return more fields than the frontend actually uses.

## Member (profile)

Fields the frontend reads and writes:

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `university` | string | |
| `major` | string, optional | |
| `company` | string, optional | professionals only |
| `role` | string, optional | job title, professionals only |
| `industry` | string, optional | |
| `location` | string, optional | |
| `bio` | string | |
| `skills` | string[] | free text, comma-separated in the UI |
| `availability.mentor` | boolean | opt-in, off by default |
| `availability.networking` | boolean | opt-in, off by default |
| `availability.referrals` | boolean | "open to discussing a referral," never a guarantee |
| `isProfessional` | boolean | drives the "Mentor / Professional" vs "Member" tag |

**Endpoints needed:**
- `GET /api/members/me/`: own full profile
- `PATCH /api/members/me/`: update own profile
- `GET /api/members/{id}/`: someone else's profile, only the fields they've made visible, never email or resume

## Discover

- `GET /api/professionals/`: paginated list
- Must support filtering by: `company`, `industry`, `university`, `availability.mentor`, `availability.networking`
- Only returns members with `availability.mentor` or `availability.networking` true
- Never returns members who've deactivated their account

## Connection requests

| Field | Type | Notes |
|---|---|---|
| `fromId` / `toId` | member id | never trust a client-supplied id for who's sending |
| `requestType` | `"networking"` \| `"mentorship"` \| `"referral"` | required, shown before the message |
| `message` | string | required, short |
| `status` | `"pending"` \| `"accepted"` \| `"declined"` \| `"expired"` \| `"cancelled"` | |
| `createdAt` | timestamp | |

**Endpoints needed:**
- `GET /api/requests/?direction=incoming|outgoing`: scoped to the signed-in member only
- `POST /api/requests/`: body needs `toId`, `requestType`, `message`
- `POST /api/requests/{id}/accept/`: recipient only
- `POST /api/requests/{id}/decline/`: recipient only. No reason field, and the fact of a decline should never be visible to anyone but the requester
- `POST /api/requests/{id}/cancel/`: requester only, pending requests only
- Auto-expire unanswered requests after a set number of days (exact number is a non-blocking decision, not fixed yet)
- Reject a new request if an open one already exists between the same two members

## Connections

| Field | Type | Notes |
|---|---|---|
| `status` | `"active"` \| `"completed"` \| `"cancelled"` | |
| `since` | timestamp | when the request was accepted |

**Endpoints needed:**
- `GET /api/connections/`: mine only
- `POST /api/connections/{id}/complete/`: either party
- `POST /api/connections/{id}/cancel/`: either party, active connections only

## Resume

- Private by default. Never returned in any list response, only fetched directly by the owner or an approved connection.
- `GET/POST/DELETE /api/resume/`: owner only
- `POST /api/connections/{id}/share-resume/`: owner only, grants that one connection access
- `GET /api/resume/{id}/download/`: returns a short-lived signed URL, only for the owner or a connection it's been shared with
- Accept PDF, DOC, DOCX only, validate the actual file type server-side (not just the extension), cap size around 5MB

## Messages

| Field | Type | Notes |
|---|---|---|
| `connectionId` | id | messages only exist within an active/completed connection |
| `senderId` | member id | |
| `text` | string | |
| `createdAt` | timestamp | |

**Endpoints needed:**
- `GET /api/connections/{id}/messages/`: either party to that connection only
- `POST /api/connections/{id}/messages/`: same
- Refresh-based is fine. No real-time delivery, no read receipts, no typing indicators needed for the first version.

## The one rule that matters most

Every endpoint above has to check three things on its own, no matter what the frontend sends: who is making this request, do they actually own the thing they're asking for, and are they allowed to do this specific action. Never trust a client-supplied id as proof of ownership.
