'use client';

import { useState, useEffect, useCallback } from 'react';

interface GalleryGridProps {
  photos: string[];
  city: string;
  title: string;
}

export default function GalleryGrid({ photos, city, title }: GalleryGridProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const open = (i: number) => setActiveIndex(i);
  const close = useCallback(() => setActiveIndex(null), []);

  const prev = useCallback(() => {
    setActiveIndex(i => i !== null ? (i - 1 + photos.length) % photos.length : null);
  }, [photos.length]);

  const next = useCallback(() => {
    setActiveIndex(i => i !== null ? (i + 1) % photos.length : null);
  }, [photos.length]);

  useEffect(() => {
    if (activeIndex === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }

    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [activeIndex, close, prev, next]);

  if (photos.length === 0) return null;

  return (
    <>
      <div className="gallery-grid">
        {photos.map((src, i) => (
          <button
            key={i}
            className="gallery-item gallery-btn"
            onClick={() => open(i)}
            aria-label={`Open photo ${i + 1} of ${photos.length}`}
            type="button"
          >
            <img src={src} alt={`${city} meetup photo ${i + 1}`} loading="lazy" />
            <div className="gallery-item-hover" aria-hidden="true">
              <span>View ↗</span>
            </div>
          </button>
        ))}
      </div>

      {activeIndex !== null && (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${activeIndex + 1} of ${photos.length}`}
          onClick={close}
        >
          <button className="lightbox-close" onClick={close} aria-label="Close lightbox" type="button">
            ✕
          </button>

          <button
            className="lightbox-nav lightbox-prev"
            onClick={e => { e.stopPropagation(); prev(); }}
            aria-label="Previous photo"
            type="button"
          >
            ←
          </button>

          <div className="lightbox-img-wrap" onClick={e => e.stopPropagation()}>
            <img
              src={photos[activeIndex]}
              alt={`${city} meetup photo ${activeIndex + 1}`}
            />
            <div className="lightbox-caption">
              <span className="lc-title">{title}</span>
              <span className="lc-count">{activeIndex + 1} / {photos.length}</span>
            </div>
          </div>

          <button
            className="lightbox-nav lightbox-next"
            onClick={e => { e.stopPropagation(); next(); }}
            aria-label="Next photo"
            type="button"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
