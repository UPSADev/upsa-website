'use client';

import { useState, useRef } from 'react';

export interface MeetupCard {
  slug: string;
  city: string;
  state: string;
  date: string;
  description: string;
  photos: string[];
}

function MeetupCardItem({ card }: { card: MeetupCard }) {
  const [idx, setIdx] = useState(0);
  const touchX = useRef<number | null>(null);
  const { photos, city, state, date, description } = card;
  const count = photos.length;

  const prev = (e: React.MouseEvent) => {
    e.preventDefault();
    setIdx(i => (i - 1 + count) % count);
  };
  const next = (e: React.MouseEvent) => {
    e.preventDefault();
    setIdx(i => (i + 1) % count);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const delta = touchX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 40) delta > 0
      ? setIdx(i => (i + 1) % count)
      : setIdx(i => (i - 1 + count) % count);
    touchX.current = null;
  };

  return (
    <div className="gcard">
      <div
        className="gcard-img"
        onTouchStart={count > 1 ? onTouchStart : undefined}
        onTouchEnd={count > 1 ? onTouchEnd : undefined}
      >
        {count > 0
          ? <img src={photos[idx]} alt={`${city} meetup`} loading="lazy" />
          : <div className="gcard-placeholder">{city[0]}</div>
        }
        {count > 1 && (
          <>
            <button className="gcard-arrow gcard-prev" onClick={prev} aria-label="Previous photo">&#8249;</button>
            <button className="gcard-arrow gcard-next" onClick={next} aria-label="Next photo">&#8250;</button>
            <span className="gcard-slide-pos">{idx + 1} / {count}</span>
          </>
        )}
      </div>

      <div className="gcard-body">
        <div className="gcard-top">
          <span className="gcard-city">{city}</span>
          <span className="gcard-state-tag">{state}</span>
        </div>
        <span className="gcard-date">{date}</span>
        {description && <p className="gcard-desc">{description}</p>}
        {count > 0 && (
          <span className="gcard-count">{count} {count === 1 ? 'Photo' : 'Photos'}</span>
        )}
      </div>
    </div>
  );
}

export default function GalleryClient({ cards, states }: { cards: MeetupCard[]; states: string[] }) {
  const [active, setActive] = useState<string | null>(null);
  const visible = active ? cards.filter(c => c.state === active) : cards;

  return (
    <>
      <div className="gf-bar">
        <button
          className={`gf-pill${!active ? ' gf-active' : ''}`}
          onClick={() => setActive(null)}
        >
          All
        </button>
        {states.map(s => (
          <button
            key={s}
            className={`gf-pill${active === s ? ' gf-active' : ''}`}
            onClick={() => setActive(active === s ? null : s)}
          >
            {s}
          </button>
        ))}
      </div>

      {visible.length === 0 && (
        <p style={{ color: 'var(--ink-3)', fontSize: 15, paddingTop: 40 }}>
          No meetups for this state yet.
        </p>
      )}

      <div className="gcards">
        {visible.map(c => (
          <MeetupCardItem key={c.slug} card={c} />
        ))}
      </div>
    </>
  );
}
