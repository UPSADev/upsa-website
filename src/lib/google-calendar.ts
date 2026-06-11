// Server-only — never import this in client components.
// Uses Google Calendar API v3 with a public-calendar API key.
// Results are cached by Next.js for 5 minutes (revalidate: 300).

export interface CalEvent {
  slug: string;
  title: string;
  date: string;       // YYYY-MM-DD (Chicago time)
  endDate?: string;   // YYYY-MM-DD — only set for multi-day events
  time?: string;      // e.g. "6:00 PM – 8:00 PM CT"
  location: string;
  category?: string;  // only set via [category: X] tag in the description
  description: string;
  registerUrl?: string;
  status: 'upcoming' | 'past';
  // extras for modal / add-to-calendar
  startIso?: string;  // raw ISO from Google Calendar
  endIso?: string;
  allDay?: boolean;
}

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? '';
const API_KEY     = process.env.GOOGLE_API_KEY     ?? '';

// Placeholder shown while real per-event Google Form links aren't set up yet.
const DUMMY_REGISTER_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSe-dummy-registration-form/viewform';

const VALID_CATEGORIES = new Set([
  'Social', 'Cultural', 'Professional',
  'Workshop', 'Seminar', 'Meetup', 'Webinar', 'Gala',
]);

// ── helpers ──────────────────────────────────────────────────

// Registration link: an explicit [register: URL] tag wins; otherwise the
// first Google Forms link found in the description is used.
function extractRegisterLink(text: string): string | undefined {
  const tag = text.match(/\[register:\s*(https?:\/\/[^\s\]]+)\]/i);
  if (tag) return tag[1];
  const form = text.match(/https?:\/\/(?:forms\.gle|docs\.google\.com\/forms)\/[^\s<>"'\]]+/i);
  if (form) return form[0].replace(/[.,;)]+$/, '');
  return undefined;
}

function extractCategory(text: string): string | undefined {
  const m = text.match(/\[(?:category|type):\s*([^\]]+)\]/i);
  if (!m) return undefined;
  const raw   = m[1].trim();
  const found = [...VALID_CATEGORIES].find(c => c.toLowerCase() === raw.toLowerCase());
  return found ?? raw;
}

// Google Calendar descriptions come back as HTML — convert to plain text.
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:p|div|li)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function toChicagoDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
}

function toChicagoTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    timeZone:  'America/Chicago',
    hour:      'numeric',
    minute:    '2-digit',
    hour12:    true,
  });
}

// ── main fetch ───────────────────────────────────────────────

export async function getGoogleCalendarEvents(): Promise<CalEvent[]> {
  if (!CALENDAR_ID || !API_KEY) {
    console.warn('[google-calendar] GOOGLE_CALENDAR_ID or GOOGLE_API_KEY not set — returning empty list.');
    return [];
  }

  const timeMin = new Date().toISOString();
  const url     = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events`,
  );
  url.searchParams.set('key',           API_KEY);
  url.searchParams.set('timeMin',       timeMin);
  url.searchParams.set('singleEvents',  'true');
  url.searchParams.set('orderBy',       'startTime');
  url.searchParams.set('maxResults',    '50');

  let data: { items?: unknown[] };
  try {
    const res = await fetch(url.toString(), { next: { revalidate: 300 } });
    if (!res.ok) {
      const body = await res.text();
      console.error('[google-calendar] API error', res.status, body);
      return [];
    }
    data = await res.json();
  } catch (err) {
    console.error('[google-calendar] Fetch failed:', err);
    return [];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = (data.items ?? []) as any[];

  return items.map((item, i) => {
    const allDay   = !!item.start?.date;
    const startIso = item.start?.dateTime ?? item.start?.date ?? '';
    const endIso   = item.end?.dateTime   ?? item.end?.date   ?? '';

    const date    = allDay ? (item.start.date as string) : toChicagoDate(startIso);
    const endDate = allDay ? (item.end?.date  as string) : toChicagoDate(endIso);

    const rawDesc  = (item.description as string | undefined) ?? '';
    const rawLoc   = (item.location    as string | undefined) ?? '';

    // TODO: remove dummy fallback once real Google Form links are added to calendar events
    const registerUrl = extractRegisterLink(rawDesc) ?? DUMMY_REGISTER_URL;
    const category    = extractCategory(rawDesc);
    const cleanDesc   = stripHtml(rawDesc)
      .replace(/\[(?:category|type|register):[^\]]+\]/gi, '')
      .replace(/https?:\/\/(?:forms\.gle|docs\.google\.com\/forms)\/[^\s<>"'\]]+/gi, '')
      .trim();

    // Strip any URL from the visible location string
    const cleanLoc  = rawLoc.replace(/https?:\/\/\S+/g, '').trim();

    let time: string | undefined;
    if (!allDay && startIso && endIso) {
      time = `${toChicagoTime(startIso)} – ${toChicagoTime(endIso)} CT`;
    }

    return {
      slug:        `gc-${(item.id as string | undefined) ?? String(i)}`,
      title:       (item.summary as string | undefined) ?? 'Untitled Event',
      date,
      endDate:     endDate !== date ? endDate : undefined,
      time,
      location:    cleanLoc,
      category,
      description: cleanDesc,
      registerUrl,
      status:      'upcoming' as const,
      startIso,
      endIso,
      allDay,
    };
  });
}
