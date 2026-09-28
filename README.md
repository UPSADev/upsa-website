# UPSA Website

Official website for the United Pakistani Students & Alumni Association, plus the **UPSA Mentor Portal**: a members-only area where students and working professionals find each other, connect, and message.

## How it fits together

```text
 Browser
   |
   |  https://unitedpsa.org  (Netlify)
   |  Next.js site:  public pages, events calendar, CMS, and the portal at /portal
   |
   +--> Clerk            sign-up / sign-in / Google login. The only place passwords live.
   |
   +--> Django backend   (separate host)  the portal's data and rules
                          | verifies every request's Clerk token
                          +--> Postgres          profiles, requests, connections, messages
                          +--> Cloudflare R2     profile photos (public) and resumes (private)
                          +--> Clerk API + SMTP  emails members about new activity
```

- **Clerk owns identity.** Django never sees a password. It checks the Clerk token on each request and maps it to a local user.
- **Member emails are never stored** in our database; they stay in Clerk.
- The website (Netlify) and the backend are deployed separately.

## Repository layout

| Path | What it is |
| --- | --- |
| `src/app/` | Next.js pages. `src/app/portal/` is the Mentor Portal. |
| `src/app/portal/_lib/` | Portal data layer: `api.ts` (fetch wrapper), `PortalDataProvider.tsx` (state + all API calls), `types.ts` |
| `src/middleware.ts` | Clerk route protection (portal pages require sign-in) |
| `content/`, `public/admin/config.yml` | Editable site content and the Decap CMS setup |
| `backend/` | Django + Django REST Framework API for the portal |
| `backend/portal/` | Portal models, endpoints, storage, notifications, rate limits |
| `backend/users/` | Clerk token verification |
| `docs/` | Deployment guide, runbook, API reference, calendar notes |

## Local development

You need Node 20+ and Python 3.12+ (developed on 3.14). Run the frontend and backend in two terminals.

### 1. Frontend

```bash
npm install
cp .env.example .env.local      # then fill in the Clerk keys
npm run dev                     # http://localhost:3000
```

`.env.local` needs `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` from the Clerk dashboard. `NEXT_PUBLIC_API_BASE_URL` defaults to `http://localhost:8000`.

### 2. Backend (the portal's API)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows.  macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env            # then edit it (see below)
python manage.py migrate
python manage.py runserver 8000
```

Minimum `backend/.env` for local development:

```text
DJANGO_DEBUG=True
CLERK_ISSUER=https://<your-dev-instance>.clerk.accounts.dev
```

`DJANGO_DEBUG=True` is required locally. Without it Django starts in production mode and refuses to run without `DJANGO_SECRET_KEY`. That is intentional, so a server can never be left in debug mode by accident. Add `CLERK_SECRET_KEY` as well if you want to see notification emails (they print in the server log).

Health check: `http://localhost:8000/api/health/`

### 3. Try it

Open `http://localhost:3000/portal`, sign up, and complete onboarding. To test the two-person flow (request, accept, message) use a second browser profile or a private window with a second account.

### Tests and checks

```bash
cd backend && python manage.py test     # backend test suite
npx tsc --noEmit                        # frontend type check
npm run lint                            # note: the public privacy/terms pages have older lint errors
```

## The website CMS

The site uses Decap CMS with Netlify Identity and Git Gateway.

Local CMS testing:

```bash
npx decap-server
```

Then open `http://localhost:3000/admin`. In production it lives at `/admin` on the site.

Note: `/admin` is behind Clerk's "signed in" check in `src/middleware.ts`, but that only means *any* signed-in account, including any portal member, can load the page. The real protection is Netlify Identity: without an invited Identity login nobody can edit content.

Editable content lives in `content/`. CMS configuration lives in `public/admin/config.yml`.

## Events calendar

The `/events` page reads a public Google Calendar. See [docs/google-calendar.md](docs/google-calendar.md).

## Deploying and operating

- [docs/deployment.md](docs/deployment.md): production setup, step by step, and every environment variable
- [docs/runbook.md](docs/runbook.md): running it day to day, moderating members, backups, and fixing problems
- [docs/api-contract.md](docs/api-contract.md): the portal API reference

The Netlify site builds with `npm run build` (see `netlify.toml`). The backend's start command is in `backend/Procfile`.
