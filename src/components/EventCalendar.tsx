'use client';

import { useState, useEffect, useCallback } from 'react';

export interface CalEvent {
  slug: string;
  title: string;
  date: string;
  time?: string;
  location: string;
  category: string;
  description: string;
  registerUrl?: string;
  status: 'upcoming' | 'past';
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const CATEGORY_COLORS: Record<string, string> = {
  Social:       'var(--moss)',
  Cultural:     '#b86b1b',
  Professional: '#1b5090',
  Workshop:     '#6b3a9f',
  Seminar:      '#1b5090',
  Meetup:       'var(--moss)',
  Webinar:      '#6b3a9f',
  Gala:         '#b86b1b',
};

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
  const total = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= total; d++) cells.push(d);
  return cells;
}

export default function EventCalendar({ events }: { events: CalEvent[] }) {
  const today = new Date();
  const [year, setYear]           = useState(today.getFullYear());
  const [month, setMonth]         = useState(today.getMonth());
  const [selected, setSelected]   = useState<CalEvent | null>(null);
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
                      style={{ '--ec': CATEGORY_COLORS[ev.category] ?? 'var(--moss)' } as React.CSSProperties}
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

      <div className="cal-list">
        {monthEvents.length > 0 ? (
          monthEvents.map(ev => {
            const p = parseDay(ev.date);
            const color = CATEGORY_COLORS[ev.category] ?? 'var(--moss)';
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
                  <span className="cli-cat" style={{ color }}>{ev.category}</span>
                  <span className="cli-title">{ev.title}</span>
                  <span className="cli-loc">{ev.location}</span>
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

      {selected && (
        <div className="cal-modal-bg" onClick={closeModal} role="dialog" aria-modal="true">
          <div className="cal-modal" onClick={e => e.stopPropagation()}>
            <button className="cal-modal-close" onClick={closeModal} aria-label="Close" type="button">✕</button>
            <div
              className="cal-modal-cat"
              style={{ '--ec': CATEGORY_COLORS[selected.category] ?? 'var(--moss)' } as React.CSSProperties}
            >
              {selected.category}
            </div>
            <h3 className="cal-modal-title">{selected.title}</h3>
            <div className="cal-modal-meta">
              <span className="cal-modal-meta-item">
                <span className="cal-modal-meta-icon">📅</span>
                {fmtDate(selected.date)}{selected.time ? ` · ${selected.time}` : ''}
              </span>
              <span className="cal-modal-meta-item">
                <span className="cal-modal-meta-icon">📍</span>
                {selected.location}
              </span>
            </div>
            <p className="cal-modal-desc">{selected.description}</p>
            <div className="cal-modal-foot">
              {selected.registerUrl ? (
                <a href={selected.registerUrl} className="cal-modal-register" target="_blank" rel="noopener">
                  Register Now →
                </a>
              ) : (
                <span className="cal-modal-noreg">Registration details coming soon.</span>
              )}
              {selected.status === 'past' && (
                <span className="badge badge-past" style={{ marginLeft: 12 }}>Past Event</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
