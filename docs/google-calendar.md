# Google Calendar Integration

How the events on the website actually connect to Google Calendar, so nobody has to guess or reverse engineer it later.

## Where it's used

The `/events` page and the calendar widget on the homepage both pull live from Google Calendar. This is a separate system from `content/events/*.md`, which only feeds the individual event detail pages at `/events/<slug>`. Those two don't talk to each other, so an event only shows up on the actual interactive calendar if it's created in Google Calendar, not by adding a markdown file.

## The two env vars it needs

`GOOGLE_CALENDAR_ID` and `GOOGLE_API_KEY`, both read in `src/lib/google-calendar.ts`. If either one is missing, the calendar just shows an empty list and logs a warning, it doesn't crash the site.

- `GOOGLE_CALENDAR_ID` is the calendar's ID, found in Google Calendar settings under "Integrate calendar"
- `GOOGLE_API_KEY` is a plain API key from Google Cloud Console with the Calendar API enabled, it only needs read access to a public calendar, nothing fancy

Both need to be set wherever the site is deployed (Netlify env vars), and optionally in `.env.local` for local dev if you want to test against the real calendar.

## What gets pulled in

Every event from now onward, up to 50 of them, ordered by start time. Past events don't show on the calendar. It refreshes every 5 minutes since that's the page's revalidate window, so an edit made in Google Calendar can take a few minutes to actually show up on the site, it's not instant.

## How fields map from Google Calendar to the website

- Title becomes the event title
- Start and end time show in Chicago time on the site regardless of what timezone you were in when you created the event
- Location shows as-is, but any URL inside it gets stripped out automatically
- Description shows on the event popup, minus whatever gets stripped out, see below

## Two things you can put in the description that get treated specially

**Registration link.** If the description has a Google Form link anywhere in it, either a `forms.gle/...` link or a `docs.google.com/forms/...` link, the site finds it automatically and turns it into the "Register for this event" button. You don't have to do anything special, just paste the form link somewhere in the description text.

If there's more than one link in the description and you want to be sure the right one gets picked, tag it explicitly instead:

```
[register: https://forms.gle/your-real-link]
```

That tag always wins over just scanning the text for a link.

**Category.** Add this anywhere in the description:

```
[category: Workshop]
```

Valid ones are Social, Cultural, Professional, Workshop, Seminar, Meetup, Webinar, Gala. Anything else still shows up, just as whatever text you typed.

Both tags get stripped out of what visitors actually see, they're only there for the site to read.

## If Register goes to a broken form

If clicking Register says the file doesn't exist, that's almost always the actual Google Form being broken, restricted, or deleted, not a website bug. The site just shows whatever link it found in the description. If there's genuinely no registration link at all, the site falls back to a placeholder link that also won't work, which is really just a sign nobody's added the real form link yet for that event.

## If the description isn't showing on the website

The description only shows if there's real text left over after the registration link and any tags get stripped out. If an event's entire description is just the form link and nothing else, there's nothing left once that link is removed, so the popup skips the description and only shows the register button. Add a sentence or two about the event itself if you want a description to actually show up.

## Where the code lives

All of this logic is in `src/lib/google-calendar.ts`. The calendar widget that renders it is `src/components/EventCalendar.tsx`. There's also a plain JSON route at `src/app/api/events/route.ts` that exposes the same data if something else on the site ever needs it.
