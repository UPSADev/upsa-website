# Runbook: running the portal day to day

For first-time setup see [deployment.md](deployment.md). This page is for keeping it healthy and handling the things that come up.

## Where things live

| What | Where | Look here when |
| --- | --- | --- |
| The website and portal pages | Netlify | A page is broken or a deploy failed (Deploys tab, build log) |
| Sign-in accounts, passwords, Google login | Clerk dashboard | Someone can't sign in, or you need to remove/ban an account |
| Portal data (profiles, requests, messages) | Postgres on the backend host | Restoring data, reading a record |
| The API | Backend host (logs are in its dashboard) | Errors in the portal, "Failed to fetch" |
| Profile photos and resumes | Cloudflare R2 (two buckets) | Broken photos, storage questions |
| Notification emails | Your SMTP provider's dashboard | An email didn't arrive |
| Errors and crashes | Sentry (sentry.io), if set up - see deployment.md | Something broke and you want to know before a member tells you |

Quick health check: open `https://<backend>/api/health/`. It should say the backend is running.

## The admin panel

`https://<backend>/admin/` (log in with the superuser you created; this is a Django login, separate from Clerk).

You can view and edit **Profiles, Connection requests, Connections, Messages, Resumes**, and **Users** (under Authentication and Authorization). Admins can read messages and see resume file names, so keep the number of admins small and mention this in the privacy policy.

To create another admin: on the host's shell run `python manage.py createsuperuser`.

## Approving a mentor or professional

A member fills in their own company, role, industry and location in Edit Profile, then clicks **Request to be listed as a mentor/professional**. That does not make them discoverable by itself — it only flags them for review. The verified flag (`isProfessional`) that actually controls Discover can only be set by an admin, in the admin panel; the API rejects a member trying to set it on themselves (silently ignored, not an error), so nobody can list themselves without review.

To approve someone:

1. Admin panel, **Portal, Profiles**. The list is sorted by request date, newest first, and you can filter by **Professional requested**.
2. Open the member, check what they filled in under **Professional** (Company, Role, Industry, Location).
3. Tick **Is professional**, then save.
4. They'll show up in Discover once they also have **Open to mentoring** or **Open to networking** turned on in their own Settings — that part is up to them.

Discover lists only verified professionals, so it stays empty until you approve your first few. A member can also be un-verified the same way (untick **Is professional**) — they can't undo that themselves either.

## Moderating a member

| Goal | Do this |
| --- | --- |
| Hide someone from Discover | Profiles, tick **Deactivated**. Their profile page stops loading for others. They can turn it back on themselves in Settings, so this is not a ban. |
| Remove someone completely | Do **both**: (1) Users, delete the user in the admin panel. This also deletes their profile, requests, connections, messages, resume and photo files. (2) In the Clerk dashboard, delete the user. If you only do (1), they can sign in again and start with a blank profile. If you only do (2), their portal data stays behind. |
| Block someone from coming back | In the Clerk dashboard, **Ban** the user. |
| A privacy/deletion request | Same as "Remove someone completely". Note that database backups keep old copies until they expire. |

## Backups

- **Database:** turn on automatic Postgres backups at your host and note the retention period. Also take a manual copy before risky changes:

  ```bash
  pg_dump "$DATABASE_URL" -Fc -f portal-backup.dump
  ```

- **Restore** (into an empty or scratch database first; never straight over live data without a fresh backup):

  ```bash
  pg_restore --clean --no-owner -d "$DATABASE_URL" portal-backup.dump
  ```

- **Files:** photos and resumes are in R2. Consider turning on object versioning, or occasionally copying the buckets.
- **Test a restore** into a scratch database now and then. A backup you have never restored is a hope, not a backup.

## Rotating secrets

| Secret | How to rotate | Then |
| --- | --- | --- |
| Clerk secret key | Clerk dashboard, API Keys, roll the key | Update `CLERK_SECRET_KEY` on Netlify **and** the backend; redeploy the site |
| R2 API token | Cloudflare, create a new token | Update the three `R2_*` credential variables on the backend, then revoke the old token |
| `DJANGO_SECRET_KEY` | Generate a new value | Update it on the backend. It only signs admin-panel sessions, so the only effect is admins logging in again |
| SMTP password | Your email provider | Update `EMAIL_HOST_PASSWORD` on the backend |

If a key is ever exposed (pasted in chat, committed, screenshotted), rotate it immediately.

## Rate limits

Per signed-in member: 600 requests a minute overall, and for writes only 30 connection requests a day, 60 messages a minute, 20 uploads an hour. Change them in `backend/config/settings.py` (`DEFAULT_THROTTLE_RATES`). The counters live in memory, so they reset when the backend restarts and are per server process. Signed-out traffic is not limited by Django; use the host or Cloudflare for that.

## Emails

Members are emailed when they receive a request, have one accepted, or get a message (at most one message email per conversation per 15 minutes). Emails never contain what was written. Members can opt out in Settings. If a send fails the portal keeps working and the backend logs `Could not send notification email`.

## Troubleshooting

| Symptom | Likely cause and fix |
| --- | --- |
| Portal shows "Failed to fetch" | Backend is down, or `NEXT_PUBLIC_API_BASE_URL` is missing or wrong on Netlify (it then falls back to `localhost:8000`), or CORS: check the browser Network tab for a CORS error and add the site to `FRONTEND_ORIGINS`. |
| "Invalid Clerk token" | `CLERK_ISSUER` doesn't match the Clerk instance the site uses (development vs production), or a server clock is far off. |
| "Token was issued for a different site" | The site's address is missing from `FRONTEND_ORIGINS` (check the `www` variant). |
| Backend won't start: "DJANGO_SECRET_KEY is not set" | Set `DJANGO_SECRET_KEY` (server) or `DJANGO_DEBUG=True` (local only). |
| Backend rejects requests with "DisallowedHost" | Add its hostname to `DJANGO_ALLOWED_HOSTS`. |
| Profile photos are broken images | `R2_PUBLIC_BASE_URL` is wrong, or the photo bucket has no public domain, or R2 is not configured and photos were saved to a disk that was wiped. |
| Resume download says not found | Correct behavior unless the requester is the owner or the resume was shared with a connection they belong to. |
| No notification emails | `CLERK_SECRET_KEY` or `EMAIL_HOST` is unset (emails are then off), the from-address isn't allowed by the provider, or the member opted out. Check the backend log. |
| "You're doing that too quickly" | A rate limit was hit. It clears on its own, or on a backend restart. |
| Discover is empty | Nobody is a professional yet (see above), or none have turned on mentoring/networking, or they are deactivated. |
| Not sure what actually broke | If Sentry is set up (see deployment.md), check it first - it has the real stack trace. Not set up yet means errors are only in the host's logs. |
| A member keeps landing on onboarding | Their profile has no name. Finishing onboarding fixes it. |
| Portal works locally but not live | Compare environment variables against [deployment.md](deployment.md); `NEXT_PUBLIC_*` changes need a Netlify rebuild. |

## Routine upkeep

- Monthly: update dependencies (`npm audit`, `pip list --outdated`), run the tests, and deploy.
- After any change to environment variables: run the verification list at the bottom of [deployment.md](deployment.md).
- Quarterly: test a database restore, review who has admin access to each service, and check the R2 private bucket still has no public access.
