'use client';

import { useEffect, useRef } from 'react';

type DotKind = 0 | 1 | 2;

function isLand(lng: number, lat: number): boolean {
  if (lng >= -168 && lng <= -52  && lat >= 7   && lat <= 72)  return true;
  if (lng >= -73  && lng <= -12  && lat >= 60  && lat <= 83)  return true;
  if (lng >= -82  && lng <= -34  && lat >= -56 && lat <= 13)  return true;
  if (lng >= -10  && lng <= 65   && lat >= 35  && lat <= 72)  return true;
  if (lng >= -18  && lng <= 52   && lat >= -35 && lat <= 38)  return true;
  if (lng >= 26   && lng <= 148  && lat >= 1   && lat <= 78)  return true;
  if (lng >= 95   && lng <= 142  && lat >= -10 && lat <= 22)  return true;
  if (lng >= 113  && lng <= 154  && lat >= -44 && lat <= -10) return true;
  if (lat <= -66) return true;
  return false;
}

function xy(lng: number, lat: number, w: number, h: number): [number, number] {
  return [((lng + 180) / 360) * w, ((90 - lat) / 180) * h];
}

const PK: [number, number][] = [[67.0, 24.9], [74.3, 31.5], [73.0, 33.7]];
const US: [number, number][] = [[-74.0, 40.7], [-87.6, 41.9], [-95.4, 29.8], [-118.2, 34.0]];
const ROUTES: [number, number][] = [[0,0],[1,1],[2,2],[0,3],[1,0]];

type Dot = [number, number, DotKind];
type Particle = { t: number; speed: number; pk: number; us: number };

function buildDots(w: number, h: number): Dot[] {
  const out: Dot[] = [];
  const step = 3;
  for (let lat = 83; lat >= -66; lat -= step) {
    for (let lng = -180; lng <= 180; lng += step) {
      if (!isLand(lng, lat)) continue;
      const isPak = lng >= 59 && lng <= 78  && lat >= 23 && lat <= 38;
      const isUSA = lng >= -126 && lng <= -65 && lat >= 24 && lat <= 50;
      out.push([((lng + 180) / 360) * w, ((90 - lat) / 180) * h, isPak ? 1 : isUSA ? 2 : 0]);
    }
  }
  return out;
}

function renderDots(dots: Dot[], w: number, h: number): HTMLCanvasElement {
  const oc = document.createElement('canvas');
  oc.width = w; oc.height = h;
  const c = oc.getContext('2d')!;
  for (const [x, y, k] of dots) {
    c.beginPath();
    c.arc(x, y, k === 0 ? 1 : 2, 0, Math.PI * 2);
    c.fillStyle = k === 1 ? 'rgba(74,222,128,0.62)' : k === 2 ? 'rgba(212,175,55,0.55)' : 'rgba(90,140,90,0.13)';
    c.fill();
  }
  return oc;
}

export default function HeroWorldMap() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const raw = ref.current;
    if (!raw) return;
    const rawCtx = raw.getContext('2d');
    if (!rawCtx) return;

    // Typed aliases — TypeScript narrows in the outer scope but not in closures,
    // so we capture these as explicitly non-null typed consts.
    const el: HTMLCanvasElement = raw;
    const ctx: CanvasRenderingContext2D = rawCtx;

    let raf = 0;
    let w = 0, h = 0;
    let offscreen: HTMLCanvasElement | null = null;
    let dots: Dot[] = [];

    function resize() {
      const dpr = window.devicePixelRatio || 1;
      w = el.offsetWidth;
      h = el.offsetHeight;
      el.width  = w * dpr;
      el.height = h * dpr;
      ctx.scale(dpr, dpr);
      dots = buildDots(w, h);
      offscreen = renderDots(dots, w, h);
    }

    resize();
    const ro = new ResizeObserver(() => {
      if (el.offsetWidth !== w || el.offsetHeight !== h) resize();
    });
    ro.observe(el);

    const particles: Particle[] = [];
    let lastSpawn = -Infinity;
    let lastT = 0;

    function spawn() {
      const r = ROUTES[Math.floor(Math.random() * ROUTES.length)];
      particles.push({ t: 0, speed: 0.00017 + Math.random() * 0.00013, pk: r[0], us: r[1] });
    }

    function pulse(lng: number, lat: number, r: number, g: number, b: number, phase: number, now: number) {
      const [cx, cy] = xy(lng, lat, w, h);
      const p = (now * 0.00085 + phase) % 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 2 + p * 10, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${r},${g},${b},${(1 - p) * 0.45})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},0.9)`;
      ctx.fill();
    }

    function draw(now: number) {
      const dt = Math.min(now - lastT, 50);
      lastT = now;

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#07120e';
      ctx.fillRect(0, 0, w, h);

      if (offscreen) ctx.drawImage(offscreen, 0, 0);

      const [pkX, pkY] = xy(68.5, 30, w, h);
      const pkG = ctx.createRadialGradient(pkX, pkY, 0, pkX, pkY, w * 0.09);
      pkG.addColorStop(0, 'rgba(34,197,94,0.25)');
      pkG.addColorStop(1, 'rgba(34,197,94,0)');
      ctx.fillStyle = pkG; ctx.fillRect(0, 0, w, h);

      const [usX, usY] = xy(-96, 38, w, h);
      const usG = ctx.createRadialGradient(usX, usY, 0, usX, usY, w * 0.16);
      usG.addColorStop(0, 'rgba(212,175,55,0.2)');
      usG.addColorStop(1, 'rgba(212,175,55,0)');
      ctx.fillStyle = usG; ctx.fillRect(0, 0, w, h);

      for (const [pi, ui] of ROUTES) {
        const [x1, y1] = xy(PK[pi][0], PK[pi][1], w, h);
        const [x2, y2] = xy(US[ui][0], US[ui][1], w, h);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 0.5; ctx.stroke();
      }

      if (now - lastSpawn > 1400 && particles.length < 5) { spawn(); lastSpawn = now; }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.t += p.speed * dt;
        if (p.t >= 1) { particles.splice(i, 1); continue; }
        const alpha = p.t < 0.1 ? p.t / 0.1 : p.t > 0.9 ? (1 - p.t) / 0.1 : 1;

        const [x1, y1] = xy(PK[p.pk][0], PK[p.pk][1], w, h);
        const [x2, y2] = xy(US[p.us][0], US[p.us][1], w, h);
        const px = x1 + (x2 - x1) * p.t;
        const py = y1 + (y2 - y1) * p.t;
        const t0 = Math.max(0, p.t - 0.05);
        const tx = x1 + (x2 - x1) * t0;
        const ty = y1 + (y2 - y1) * t0;

        const trail = ctx.createLinearGradient(tx, ty, px, py);
        trail.addColorStop(0, 'rgba(255,240,180,0)');
        trail.addColorStop(1, `rgba(255,240,180,${0.7 * alpha})`);
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(px, py);
        ctx.strokeStyle = trail; ctx.lineWidth = 1.5; ctx.stroke();

        const glow = ctx.createRadialGradient(px, py, 0, px, py, 10);
        glow.addColorStop(0, `rgba(255,240,180,${0.75 * alpha})`);
        glow.addColorStop(1, 'rgba(255,240,180,0)');
        ctx.fillStyle = glow; ctx.fillRect(px - 10, py - 10, 20, 20);

        ctx.beginPath(); ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,250,200,${alpha})`; ctx.fill();
      }

      PK.forEach(([lng, lat], i) => pulse(lng, lat, 74,  222, 128, i * 0.34, now));
      US.forEach(([lng, lat], i) => pulse(lng, lat, 212, 175, 55,  i * 0.25, now));

      ctx.font = '500 9px "Courier New", monospace';
      const [pklx, pkly] = xy(64, 28.5, w, h);
      ctx.fillStyle = 'rgba(74,222,128,0.6)';
      ctx.fillText('PAKISTAN', pklx, pkly + 22);
      const [uslx, usly] = xy(-108, 46.5, w, h);
      ctx.fillStyle = 'rgba(212,175,55,0.6)';
      ctx.fillText('UNITED STATES', uslx, usly - 10);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return <canvas ref={ref} className="hero-world-map" />;
}
