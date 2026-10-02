# Deploying the UPSA site and portal

The website (Netlify) and the portal backend (a separate host) are deployed independently. Do the steps in this order, because later steps need values from earlier ones.

## Before you start

You need accounts for: GitHub, Netlify, Clerk, Cloudflare (R2), a backend host (Azure with the nonprofit grant, or Railway; see "Choosing a host"), and an SMTP email provider (Resend, Brevo, or similar). The backend requires **Python 3.12 or newer**.

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

Which host? For a launch that stays fast as membership grows (about 1,000 at first, 19,000 or more later) see "Choosing a host" below. Do not use Render's free plan: its web service sleeps after 15 idle minutes and takes about a minute to wake, and its free database is deleted after 30 days.

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
| `REDIS_URL` | recommended at scale | Shared cache (e.g. `redis://default:password@host:6379`). Needed once you run more than one server so rate limits and the email cooldown count correctly. |
| `WEB_CONCURRENCY` | optional | Number of gunicorn worker processes, default 3 (each runs 4 threads). Roughly one per CPU core. |
| `DJANGO_SSL_REDIRECT` | optional | `true` by default. Set `false` only if the host already redirects http to https. |
| `CLERK_AUTHORIZED_PARTIES` | optional | Defaults to `FRONTEND_ORIGINS`. |

Do **not** set `DJANGO_DEBUG` on a server.

After the first deploy, create an admin login for moderation. Open the host's shell and run `python manage.py createsuperuser`. The admin panel is at `https://<backend>/admin/`.

## Choosing a host

The backend is light: about 70 MB of memory per process and a few milliseconds per request. What matters is being **always on** (no sleeping), having the **database next to the app**, and being able to add servers as you grow. The portal is built so that an idle tab costs about 2 small requests a minute, so a single modest server carries thousands of members.

| Members online at once | Requests per second (approx.) | A setup that copes |
| --- | --- | --- |
| ~50 (about 1,000 members) | 2 | One small server, one small Postgres |
| ~950 (about 19,000 members) | 30 | 2 CPU cores and 2 GB of memory, a 1 to 2 GB Postgres |
| ~1,900 (a spike after an announcement) | 60 | The same, comfortably; add a second server if it feels tight |

(These assume roughly 5 to 10 percent of members online at once. Confirm with a load test before a big announcement.)

**Recommended: Azure with the nonprofit grant.** Microsoft gives verified nonprofits $2,000 a year in Azure credits, renewing annually. Register at `https://aka.ms/nonprofitgetstarted`; validation takes up to 3 business days and needs your legal nonprofit documentation (equivalent to 501(c)(3) status). Each organization gets one grant tenant, and there is a yearly attestation. Then, in the Azure portal:

1. **App Service** (Linux, Python 3.12 or newer). A Basic or Standard plan with 2 cores is plenty. Turn on **Always On**. Set the startup command to the same line as `backend/Procfile`, without the leading `web:`. Set `WEBSITES_PORT=8000`.
2. **Azure Database for PostgreSQL, Flexible Server** (Burstable is enough to start). Keep automatic backups on. Use its connection string as `DATABASE_URL`.
3. **Azure Cache for Redis** (Basic is enough) for `REDIS_URL`. Optional for a single server.
4. Put all the backend variables above in the App Service's Configuration, Application settings.
5. Add your domain and a managed certificate, then create a **budget alert** so nothing can spend past the credit.

Expect roughly $60 a month for all of it (App Service $13 to $26, Postgres about $12 and up, Redis extra; check the Azure pricing calculator), well inside $2,000 a year.

**If you don't get the grant: Railway.** Billed by actual use ($20 per CPU-month, $10 per GB of memory): about $5 to $10 a month at launch and around $30 to $40 at 19,000 members, including Postgres and Redis. It is the simplest host to run.

**Free options for a small pilot only:** Northflank's free plan has two always-on services and one database, but its free size is small and unpublished, so test it before relying on it. Avoid hosts whose free plans sleep.

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
5. With a second account (private window): fill in company/role/industry/location in Edit Profile and click "Request to be listed as a mentor/professional", then approve it in the admin panel (see "Approving a mentor or professional" in the runbook), then have it turn on "Open to networking" in Settings. From the first account, find it in Discover, send a request, accept it from the other side, and exchange a message. Check that the request showed up without reloading (the portal checks for changes every 30 seconds, and an open conversation refreshes every 5).
6. Share the resume with the connection and download it from the other account. Confirm a third, unconnected account cannot.
7. Check the browser console and Network tab for errors (CORS errors mean `FRONTEND_ORIGINS` is wrong).
8. If email is set up, confirm a notification email arrives and contains no message text.
9. Open a resume's storage location in R2 and confirm the private bucket has no public URL.

## Rolling back

- **Website:** in Netlify, Deploys, open the last good deploy and choose "Publish deploy".
- **Backend:** redeploy the previous commit from the host's dashboard. Migrations only ever add columns so far, so an older backend still runs against a newer database, but check before rolling back past a migration.
- **Database:** restore from the host's backup (see the runbook).
