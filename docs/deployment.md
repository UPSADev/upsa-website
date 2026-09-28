# Deploying the UPSA site and portal

The website (Netlify) and the portal backend (a separate host) are deployed independently. Do the steps in this order, because later steps need values from earlier ones.

## Before you start

You need accounts for: GitHub, Netlify, Clerk, Cloudflare (R2), a backend host (Railway, or Render + Neon), and an SMTP email provider (Resend, Brevo, or similar). The backend requires **Python 3.12 or newer**.

## 1. Clerk production instance

The backend and site currently point at a Clerk *development* instance. For launch:

1. In the Clerk dashboard, create/enable the **production** instance for the domain and follow Clerk's production checklist (DNS records, and your own Google OAuth credentials if you use Google login).
2. Note three values from the production instance: the **publishable key**, the **secret key**, and the **issuer** (Dashboard, API Keys, Advanced; it looks like `https://clerk.unitedpsa.org`). You can also read `iss` from any session token.

The production issuer differs from the development one. Using the wrong one makes every portal request fail with "Invalid Clerk token".

## 2. Cloudflare R2 (file storage)

Create **two buckets**. They are separate on purpose:

| Bucket | Holds | Access |
| --- | --- | --- |
| private (e.g. `upsa-resumes`) | resumes | **No public access. Never attach a public domain.** Resumes are only served through the API after a permission check. |
| public (e.g. `upsa-photos`) | profile photos | Attach a public custom domain (e.g. `photos.unitedpsa.org`) so an image tag can load them. |

Then create an R2 API token with read/write on both buckets. Keep: account id, access key id, secret access key.

## 3. Backend host

Deploy the `backend/` folder (set the service's root directory to `backend`).

- **Start command:** it is in `backend/Procfile`. It runs migrations, collects static files, then starts gunicorn. If your host asks for a start command, use the same line.
- **Database:** add a Postgres database on the host and set `DATABASE_URL` to its connection string.
- **Health check path:** `/api/health/`
- Set the environment variables listed below.

Railway: about $5 per month, one dashboard, Postgres included. Render + Neon: free, but the app sleeps when idle, so the first request after a quiet spell is slow.

### Backend environment variables

| Variable | Required | Example / notes |
| --- | --- | --- |
| `DJANGO_SECRET_KEY` | **yes** | Long random value: `python -c "import secrets; print(secrets.token_urlsafe(60))"`. Django refuses to start without it. |
| `DJANGO_ALLOWED_HOSTS` | **yes** | The backend's own hostname, e.g. `api.unitedpsa.org` (comma separated for several). |
| `FRONTEND_ORIGINS` | **yes** | The website's origin(s), with `https://`, no trailing slash, comma separated. Include the `www` variant if people use it. Also used to reject tokens issued for other sites. |
| `CLERK_ISSUER` | **yes** | The **production** issuer from step 1. |
| `DATABASE_URL` | **yes** | `postgres://user:pass@host:5432/dbname` |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | **yes** | From step 2. |
| `R2_PRIVATE_BUCKET` | **yes** | Resume bucket name. |
| `R2_PUBLIC_BUCKET` | **yes** | Photo bucket name. |
| `R2_PUBLIC_BASE_URL` | **yes** | Public URL of the photo bucket, e.g. `https://photos.unitedpsa.org` |
| `CLERK_SECRET_KEY` | for emails | Same production secret key as the site. Used only to look up a member's email at send time. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS` | for emails | Your SMTP provider's settings. Without `EMAIL_HOST`, notification emails are simply off. |
| `DEFAULT_FROM_EMAIL` | for emails | e.g. `UPSA Portal <no-reply@unitedpsa.org>`. Must be an address your provider allows. |
| `PORTAL_BASE_URL` | optional | Where email links point. Defaults to the first `FRONTEND_ORIGINS` entry. |
| `DJANGO_SSL_REDIRECT` | optional | `true` by default. Set `false` only if the host already redirects http to https. |
| `CLERK_AUTHORIZED_PARTIES` | optional | Defaults to `FRONTEND_ORIGINS`. |

Do **not** set `DJANGO_DEBUG` on a server.

After the first deploy, create an admin login for moderation. Open the host's shell and run `python manage.py createsuperuser`. The admin panel is at `https://<backend>/admin/`.

## 4. Netlify (the website)

Set these in Site settings, Environment variables, then trigger a new deploy. **`NEXT_PUBLIC_*` values are baked in at build time, so changing one needs a rebuild.**

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Production publishable key |
| `CLERK_SECRET_KEY` | Production secret key |
| `NEXT_PUBLIC_API_BASE_URL` | The backend's public URL, e.g. `https://api.unitedpsa.org`. **If this is missing the site quietly falls back to `http://localhost:8000` and the portal will not work.** |
| `GOOGLE_CALENDAR_ID`, `GOOGLE_API_KEY` | For the events calendar (see `docs/google-calendar.md`) |

The build settings are already in `netlify.toml`.

## 5. Verify the live site

Do this once after the first deploy, and again after any change to environment variables.

1. `https://<backend>/api/health/` returns `{"success": true, ...}`.
2. Sign up a **new** account at `/portal/sign-up`. You should land on onboarding.
3. Upload a profile photo. It should display, and its URL should be on your photo domain.
4. Finish onboarding, edit the profile, upload and delete a resume.
5. With a second account (private window): in the admin panel, make that account a professional (see "Making someone a mentor or professional" in the runbook; there is no button for this in the portal yet), then have it turn on "Open to networking" in Settings. From the first account, find it in Discover, send a request, accept it from the other side, and exchange a message. Check that the request showed up without reloading (it refreshes every 10 seconds).
6. Share the resume with the connection and download it from the other account. Confirm a third, unconnected account cannot.
7. Check the browser console and Network tab for errors (CORS errors mean `FRONTEND_ORIGINS` is wrong).
8. If email is set up, confirm a notification email arrives and contains no message text.
9. Open a resume's storage location in R2 and confirm the private bucket has no public URL.

## Rolling back

- **Website:** in Netlify, Deploys, open the last good deploy and choose "Publish deploy".
- **Backend:** redeploy the previous commit from the host's dashboard. Migrations only ever add columns so far, so an older backend still runs against a newer database, but check before rolling back past a migration.
- **Database:** restore from the host's backup (see the runbook).
