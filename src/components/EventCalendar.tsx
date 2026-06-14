'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CalEvent {
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  time?: string;
  location: string;
  category?: string;
  description: string;
  registerUrl?: string;
  status: 'upcoming' | 'past';
  // Google Calendar extras
  startIso?: string;
  endIso?: string;
  allDay?: boolean;
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const EVENT_PALETTE = [
  '#2a7d4f',  // green
  '#b87d0e',  // yellow
  '#c95f1a',  // orange
  '#b84c8a',  // pink
  '#6b7268',  // gray
  '#1a6dbf',  // light blue
  '#7244b8',  // light purple
];

function eventColor(slug: string): string {
  const n = slug.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return EVENT_PALETTE[n % EVENT_PALETTE.length];
}

// ── Add-to-Calendar helpers ───────────────────────────────────

function toUtcStamp(iso: string, allDay?: boolean): string {
  if (allDay) return iso.replace(/-/g, '');
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function calDesc(ev: CalEvent): string {
  return [ev.description, ev.registerUrl ? `Register: ${ev.registerUrl}` : '']
    .filter(Boolean).join('\n\n');
}

function buildGoogleCalUrl(ev: CalEvent): string {
  const start = toUtcStamp(ev.startIso ?? ev.date, ev.allDay);
  const end   = toUtcStamp(ev.endIso   ?? ev.date, ev.allDay);
  const p = new URLSearchParams({
    action:   'TEMPLATE',
    text:     ev.title,
    dates:    `${start}/${end}`,
    details:  calDesc(ev),
    location: ev.location,
  });
  return `https://calendar.google.com/calendar/render?${p}`;
}

function buildOutlookUrl(ev: CalEvent): string {
  const p = new URLSearchParams({
    path:     '/calendar/action/compose',
    rru:      'addevent',
    subject:  ev.title,
    startdt:  ev.startIso ?? ev.date,
    enddt:    ev.endIso   ?? ev.date,
    body:     calDesc(ev),
    location: ev.location,
  });
  return `https://outlook.live.com/calendar/0/action/compose?${p}`;
}

function buildICS(ev: CalEvent): string {
  const start = toUtcStamp(ev.startIso ?? ev.date, ev.allDay);
  const end   = toUtcStamp(ev.endIso   ?? ev.date, ev.allDay);
  const desc  = calDesc(ev).replace(/\n/g, '\\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//UPSA//UPSA Website//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.slug}@upsa.org`,
    `DTSTART${ev.allDay ? ';VALUE=DATE' : ''}:${start}`,
    `DTEND${ev.allDay ? ';VALUE=DATE' : ''}:${end}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${ev.location}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function downloadICS(ev: CalEvent) {
  const blob = new Blob([buildICS(ev)], { type: 'text/calendar;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${ev.title.replace(/[^a-z0-9]/gi, '-')}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── Calendar helpers ──────────────────────────────────────────

function parseDay(iso: string): { y: number; m: number; d: number } | null {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: +m[1], m: +m[2] - 1, d: +m[3] };
}

function fmtDate(iso: string): string {
  const p = parseDay(iso);
  if (!p) return 'Date TBD';
  const d = new Date(p.y, p.m, p.d);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function buildCells(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1).getDay();
  const total    = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

// ── Component ─────────────────────────────────────────────────

export default function EventCalendar({ events }: { events: CalEvent[] }) {
  const today = new Date();
  const [year, setYear]                   = useState(today.getFullYear());
  const [month, setMonth]                 = useState(today.getMonth());
  const [selected, setSelected]           = useState<CalEvent | null>(null);
  const [userNavigated, setUserNavigated] = useState(false);

  useEffect(() => {
    if (userNavigated) return;
    const tick = setInterval(() => {
      const now = new Date();
      setYear(now.getFullYear());
      setMonth(now.getMonth());
    }, 60_000);
    return () => clearInterval(tick);
  }, [userNavigated]);

  function prevMonth() {
    setUserNavigated(true);
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    setUserNavigated(true);
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  }

  const closeModal = useCallback(() => setSelected(null), []);
  useEffect(() => {
    if (!selected) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', h);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = ''; };
  }, [selected, closeModal]);

  const eventsOnDay = (d: number) =>
    events.filter(e => { const p = parseDay(e.date); return p && p.y === year && p.m === month && p.d === d; });

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const monthEvents = events
    .filter(e => { const p = parseDay(e.date); return p && p.y === year && p.m === month; })
    .sort((a, b) => (parseDay(a.date)?.d ?? 0) - (parseDay(b.date)?.d ?? 0));

  const nextEvent = events
    .filter(e => e.status === 'upcoming')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  function jumpToNextEvent() {
    if (!nextEvent) return;
    const p = parseDay(nextEvent.date);
    if (p) { setYear(p.y); setMonth(p.m); setSelected(nextEvent); }
  }

  const cells = buildCells(year, month);

  return (
    <div className="cal-root">
      <div className="cal-nav">
        <button className="cal-nav-btn" onClick={prevMonth} aria-label="Previous month" type="button">←</button>
        <h2 className="cal-nav-title">{MONTHS[month]} {year}</h2>
        <button className="cal-nav-btn" onClick={nextMonth} aria-label="Next month" type="button">→</button>
      </div>

      {/* ── Desktop grid ── */}
      <div className="cal-grid-outer">
        <div className="cal-days-header">
          {DAYS_SHORT.map(d => <div key={d} className="cal-day-label">{d}</div>)}
        </div>
        <div className="cal-grid">
          {cells.map((day, i) => {
            if (day === null) return <div key={`e${i}`} className="cal-cell cal-cell--empty" />;
            const dayEvts = eventsOnDay(day);
            return (
              <div
                key={day}
                className={[
                  'cal-cell',
                  isToday(day) ? 'cal-cell--today' : '',
                  dayEvts.length > 0 ? 'cal-cell--has-events' : '',
                ].join(' ')}
              >
                <span className="cal-cell-num">{day}</span>
                <div className="cal-cell-events">
                  {dayEvts.map(ev => (
                    <button
                      key={ev.slug}
                      className="cal-event-pill"
                      style={{ '--ec': eventColor(ev.slug) } as React.CSSProperties}
                      onClick={() => setSelected(ev)}
                      type="button"
                    >
                      {ev.title}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Mobile list ── */}
      <div className="cal-list">
        {monthEvents.length > 0 ? (
          monthEvents.map(ev => {
            const p     = parseDay(ev.date);
            const color = eventColor(ev.slug);
            return (
              <button
                key={ev.slug}
                className="cal-list-item"
                onClick={() => setSelected(ev)}
                type="button"
              >
                <div className="cli-date-col">
                  <span className="cli-day">{p?.d}</span>
                  <span className="cli-mon">{MONTHS[p?.m ?? 0]?.slice(0, 3)}</span>
                </div>
                <div className="cli-dot" style={{ background: color }} />
                <div className="cli-body">
                  {ev.category && <span className="cli-cat" style={{ color }}>{ev.category}</span>}
                  <span className="cli-title">{ev.title}</span>
                  {ev.location && <span className="cli-loc">{ev.location}</span>}
                </div>
                <span className="cli-arrow">→</span>
              </button>
            );
          })
        ) : (
          <div className="cal-empty">
            <p>No events in {MONTHS[month]} {year}.</p>
            {nextEvent && (
              <button className="cal-empty-jump" onClick={jumpToNextEvent} type="button">
                Jump to next event: {nextEvent.title} →
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Event modal ── */}
      {selected && (
        <div className="cal-modal-bg" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <button className="cal-modal-close" onClick={closeModal} aria-label="Close" type="button">✕</button>

            {selected.category && (
              <div
                className="cal-modal-cat"
                style={{ '--ec': eventColor(selected.slug) } as React.CSSProperties}
              >
                {selected.category}
              </div>
            )}

            <h3 className="cal-modal-title">{selected.title}</h3>

            <div className="cal-modal-meta">
              <span className="cal-modal-meta-item">
                <span className="cal-modal-meta-icon">📅</span>
                {fmtDate(selected.date)}{selected.time ? ` · ${selected.time}` : ''}
              </span>
              {selected.location && (
                <span className="cal-modal-meta-item">
                  <span className="cal-modal-meta-icon">📍</span>
                  {selected.location}
                </span>
              )}
            </div>

            {selected.description && (
              <p className="cal-modal-desc">{selected.description}</p>
            )}

            {/* Register (Google Form) */}
            <div className="cal-modal-foot">
              {selected.registerUrl && (
                <a
                  href={selected.registerUrl}
                  className="cal-modal-register"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Register for this event →
                </a>
              )}
              {selected.status === 'past' && (
                <span className="badge badge-past" style={{ marginLeft: 12 }}>Past Event</span>
              )}
            </div>

            {/* Add to Calendar */}
            <div className="cal-modal-atc">
              <p className="cal-atc-label">Add to your calendar</p>
              <div className="cal-atc-row">
                <a
                  href={buildGoogleCalUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cal-atc-btn"
                >
                  Google
                </a>
                <a
                  href={buildOutlookUrl(selected)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cal-atc-btn"
                >
                  Outlook
                </a>
                <button
                  className="cal-atc-btn"
                  type="button"
                  onClick={() => downloadICS(selected)}
                >
                  Apple
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
