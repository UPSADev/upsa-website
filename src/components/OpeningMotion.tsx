'use client';

import { useEffect, useState } from 'react';

export default function OpeningMotion({ logo }: { logo: string }) {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const versionToken = logo.split('?v=')[1]?.slice(0, 10) ?? '0';
    const INTRO_KEY = `upsa-intro-seen-${versionToken}`;

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
    }, reduceMotion ? 120 : 3800);

    const removeTimer = window.setTimeout(() => {
      setVisible(false);
      document.body.classList.remove('intro-lock');
    }, reduceMotion ? 260 : 4450);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(removeTimer);
      document.body.classList.remove('intro-lock');
    };
  }, [logo]);

  if (!visible) return null;

  return (
    <div className={`opening-motion${leaving ? ' is-leaving' : ''}`} aria-hidden="true">
      <div className="opening-map">
        <span className="opening-line line-a" />
        <span className="opening-line line-b" />
        <span className="opening-line line-c" />
        <span className="opening-line line-d" />
        <span className="opening-line line-e" />
        <span className="opening-line line-f" />
        <span className="opening-line line-g" />
        <span className="opening-line line-h" />
        <span className="opening-line line-i" />
        <span className="opening-line line-j" />
        <span className="opening-line line-k" />
        <span className="opening-line line-l" />

        <span className="opening-dot dot-a" />
        <span className="opening-dot dot-b" />
        <span className="opening-dot dot-c" />
        <span className="opening-dot dot-d" />
        <span className="opening-dot dot-e" />
        <span className="opening-dot dot-f" />
        <span className="opening-dot dot-g" />
        <span className="opening-dot dot-h" />
        <span className="opening-dot dot-i" />
        <span className="opening-dot dot-j" />
        <span className="opening-dot dot-k" />
        <span className="opening-dot dot-l" />
        <span className="opening-dot dot-m" />
        <span className="opening-dot dot-n" />
        <span className="opening-dot dot-o" />
        <span className="opening-dot dot-p" />
      </div>

      <div className="opening-center">
        <div className="opening-wordmark">
          <span>UPSA</span>
          <small>United Pakistani Students &amp; Alumni Association</small>
        </div>
      </div>

      <div className="opening-sweep" />
    </div>
  );
}
