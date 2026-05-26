'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface MeetupCard {
  slug: string;
  city: string;
  state: string;
  date: string;
  description: string;
  coverImage: string;
  photoCount: number;
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
          <Link key={c.slug} href={`/meetups/${c.slug}`} className="gcard">
            <div className="gcard-img">
              {c.coverImage
                ? <img src={c.coverImage} alt={c.city} loading="lazy" />
                : <div className="gcard-placeholder">{c.city[0]}</div>
              }
            </div>
            <div className="gcard-body">
              <div className="gcard-top">
                <span className="gcard-city">{c.city}</span>
                <span className="gcard-state-tag">{c.state}</span>
              </div>
              <span className="gcard-date">{c.date}</span>
              {c.description && <p className="gcard-desc">{c.description}</p>}
              {c.photoCount > 0 && (
                <span className="gcard-count">{c.photoCount} photos →</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
