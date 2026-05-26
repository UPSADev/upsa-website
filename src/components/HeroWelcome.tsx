'use client';

import { useEffect, useState } from 'react';

export default function HeroWelcome() {
  const [phase, setPhase] = useState<'en' | 'ur'>('en');

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p === 'en' ? 'ur' : 'en')), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hero-welcome" aria-label="Welcome — Khush Aamadeed">
      <div className="hw-text-wrap">
        <span className={`hw-text hw-en${phase === 'en' ? ' hw-visible' : ''}`}>
          Welcome
        </span>
        <span className={`hw-text hw-ur${phase === 'ur' ? ' hw-visible' : ''}`} lang="ur">
          خوش آمدید
        </span>
      </div>
      <div className="hw-rule" aria-hidden="true" />
    </div>
  );
}
