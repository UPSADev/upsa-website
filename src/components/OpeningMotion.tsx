'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

const INTRO_KEY = 'upsa-opening-motion-seen';

export default function OpeningMotion({ logo }: { logo: string }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (window.sessionStorage.getItem(INTRO_KEY) === 'true') {
      const skipTimer = window.setTimeout(() => {
        setVisible(false);
        document.body.classList.remove('intro-lock');
      }, 0);
      return () => window.clearTimeout(skipTimer);
    }

    window.sessionStorage.setItem(INTRO_KEY, 'true');
    document.body.classList.add('intro-lock');

    const leaveTimer = window.setTimeout(() => {
      setLeaving(true);
    }, reduceMotion ? 120 : 1850);

    const removeTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.classList.remove('intro-lock');
    }, reduceMotion ? 260 : 2400);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      document.body.classList.remove('intro-lock');
    };
  }, []);

  if (!visible) return null;

  return (
    <div className={`opening-motion${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      <div className="opening-map">
        <span className="opening-line line-a" />
        <span className="opening-line line-b" />
        <span className="opening-line line-c" />
        <span className="opening-line line-d" />
        <span className="opening-dot dot-a" />
        <span className="opening-dot dot-b" />
        <span className="opening-dot dot-c" />
        <span className="opening-dot dot-d" />
        <span className="opening-dot dot-e" />
      </div>

      <div className="opening-center">
        <div className="opening-logo-wrap">
          <Image
            src={logo}
            alt=""
            width={112}
            height={112}
            priority
            unoptimized
            className="opening-logo"
          />
        </div>
        <div className="opening-wordmark">
          <span>UPSA</span>
          <small>United Pakistani Students & Alumni Association</small>
        </div>
      </div>

      <div className="opening-sweep" />
    </div>
  );
}
