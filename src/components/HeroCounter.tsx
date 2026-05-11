'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

function parseStatValue(value: string) {
  const numeric = Number(value.replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function formatStatValue(value: number, original: string) {
  const hasCommas = original.includes(',');
  return hasCommas ? Math.round(value).toLocaleString('en-US') : String(Math.round(value));
}

export default function HeroCounter({ value, suffix }: { value: string; suffix?: string }) {
  const target = useMemo(() => parseStatValue(value), [value]);
  const [current, setCurrent] = useState(target ? 0 : null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!target) return;

    const node = counterRef.current;
    if (!node) return;

    const targetValue = target;
    let frame = 0;
    let startTime = 0;
    const duration = 1500;

    function animate(time: number) {
      if (!startTime) startTime = time;
      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(targetValue * eased);

      if (progress < 1) {
        frame = window.requestAnimationFrame(animate);
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        frame = window.requestAnimationFrame(animate);
        observer.disconnect();
      },
      { threshold: 0.4 }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [target]);

  return (
    <span className="stat-num" ref={counterRef}>
      {target === null || current === null ? value : formatStatValue(current, value)}
      {suffix && <em>{suffix}</em>}
    </span>
  );
}
