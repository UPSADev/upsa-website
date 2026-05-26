# UPSA Content Guide

## Gallery — Adding Photos to an Event

Photos live in the event's markdown file under `content/meetups/`.

Open the file for the city you want to update, e.g. `content/meetups/chicago-spring-2026.md`, and add image paths to the `photos` array:

```yaml
---
title: Chicago Meetup — Spring 2026
city: Chicago
state: Illinois
stateCode: IL
date: 2026-04-12
status: past
coverImage: /images/meetups/chicago/cover.jpg
photos:
  - /images/meetups/chicago/photo-01.jpg
  - /images/meetups/chicago/photo-02.jpg
  - /images/meetups/chicago/photo-03.jpg
displayOnHomepage: true
homepageOrder: 1
---
```

- Place photos under `public/images/meetups/<city-slug>/`
- Add them to the `photos:` list in any order
- The gallery card carousel and photo count update automatically — no code changes needed
- `coverImage` is shown on the homepage collage; it can be the same as your first photo

To **create a new city**, duplicate an existing meetup file and update all fields. The filename becomes the URL slug (e.g. `dallas-summer-2026.md` → `/meetups/dallas-summer-2026`).

---

## Calendar — Adding an Event

Events appear in the homepage calendar. Each event is a markdown file under `content/events/`.

Create a new file, e.g. `content/events/houston-networking-july-2026.md`:

```yaml
---
title: Houston Networking Night
date: 2026-07-18
location: Houston, TX
category: Social
description: A casual evening for UPSA members in the Houston area.
registerUrl: https://forms.gle/YOUR_GOOGLE_FORM_LINK
status: upcoming
---
```

- `date` — ISO format: `YYYY-MM-DD`
- `category` — any label you want displayed (Social, Professional, Cultural, Workshop, etc.)
- `registerUrl` — paste the full Google Form URL here (see section below)
- `status` — use `upcoming` to show in the calendar; change to `past` to hide it

---

## Calendar — Adding a Registration Link (Google Form)

1. Create or open your Google Form
2. Click **Send** → copy the link (shorten it with the "Shorten URL" checkbox if you want a cleaner link)
3. Paste the full URL into the `registerUrl` field of the event or workshop file:

```yaml
registerUrl: https://forms.gle/abc123XYZ
```

The "Register" button on the event card and detail page will point to this link automatically.

For workshops, the field works the same way — open `content/workshops/<slug>.md` and set `registerUrl`.

---

## Calendar — Removing an Event

**Option 1 — Mark as past** (keeps the record, hides from calendar):

Open the event file and change `status`:

```yaml
status: past
```

**Option 2 — Delete the file** (permanent):

Delete the file from `content/events/` or `content/workshops/`. The event will disappear from the calendar and all pages immediately on next deploy.

---

## File Structure Reference

```
content/
  events/          ← calendar events
  workshops/       ← workshops and seminars
  meetups/         ← city gallery meetups
  team/            ← leadership team members
  pages/
    home.md        ← homepage text and stats
    site.md        ← nav, footer links, logo

public/
  images/
    meetups/       ← gallery photos (organized by city)
    logos/         ← university and org logos
    banner/        ← hero background images
    landmarks/     ← about section photos
```
