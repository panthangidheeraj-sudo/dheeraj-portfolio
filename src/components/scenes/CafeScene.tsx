import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/motionPref';
import { Pos, SliceBox, type VB } from './SliceBox';
import '../../styles/scenes.css';

/**
 * CONTACT — "The window table".
 * A rainy late-night café: you are sitting at a window table, a phone lights up beside a cup of coffee,
 * a neon "@" glows in the glass and the city is a wash of out-of-focus light.
 * Everything is vector (crisp at any size) and split into a back layer (city, glass, rain) and a front
 * layer (window frame, table, props) so the hero's scroll parallax can pull them apart.
 */

const rng = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// Deterministic skyline + bokeh so the picture never changes between renders.
const R = rng(7);
const towers = (() => {
  const out: { x: number; w: number; h: number; wins: { x: number; y: number; on: boolean }[] }[] = [];
  let x = -40;
  while (x < 1680) {
    const w = 46 + R() * 84, h = 130 + R() * 250;
    const wins: { x: number; y: number; on: boolean }[] = [];
    for (let yy = 770 - h + 16; yy < 760; yy += 15) for (let xx = x + 8; xx < x + w - 10; xx += 13) if (R() < 0.34) wins.push({ x: xx, y: yy, on: R() < 0.55 });
    out.push({ x, w, h, wins });
    x += w + 6 + R() * 10;
  }
  return out;
})();
const PAL = ['#ffb25a', '#ff7a45', '#ff5a8a', '#ffd9a0', '#5fd0ff', '#ff9fd0', '#ffe6b8', '#7aa8ff'];
const bokeh = Array.from({ length: 34 }, () => ({
  x: 40 + R() * 1520, y: 470 + R() * 260, r: 10 + R() * 40, c: Math.floor(R() * PAL.length), o: 0.22 + R() * 0.45, d: 3 + R() * 6, dl: -R() * 8
}));
const bokehFar = Array.from({ length: 14 }, () => ({ x: R() * 1600, y: 330 + R() * 180, r: 5 + R() * 14, c: Math.floor(R() * PAL.length), o: 0.12 + R() * 0.25, d: 4 + R() * 7, dl: -R() * 8 }));

const VB_W = '0 0 1600 900';
const VB_N = '635 0 560 900';
const BOX_W: VB = [0, 0, 1600, 900], BOX_N: VB = [635, 0, 560, 900];

function useNarrow() {
  const [n, setN] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches);
  useEffect(() => {
    const m = window.matchMedia('(max-width: 700px)');
    const f = () => setN(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return n;
}

/* The neon "@": a sign that says "write to me", glowing in the window. (No SVG filters: it flickers, and
   filters on animated shapes are what make phones stutter — the glow is a wide translucent stroke.) */
const AT = 'M21 -15 V 8 C 21 24 48 24 48 -2 A 48 48 0 1 0 28 38';
export function CafeBack() {
  const narrow = useNarrow();
  return (
    <svg className="scene-svg" viewBox={narrow ? VB_N : VB_W} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="cb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#040812" /><stop offset=".42" stopColor="#0d1530" /><stop offset=".7" stopColor="#2b1636" /><stop offset="1" stopColor="#4a1f2a" />
        </linearGradient>
        <linearGradient id="cb-street" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff9a55" stopOpacity="0" /><stop offset="1" stopColor="#ff8a4a" stopOpacity=".42" />
        </linearGradient>
        <linearGradient id="cb-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a0b4d7" stopOpacity="0" /><stop offset=".5" stopColor="#a0b4d7" stopOpacity=".1" /><stop offset="1" stopColor="#a0b4d7" stopOpacity="0" /></linearGradient>
        {PAL.map((c, i) => (
          <radialGradient key={i} id={'sbk-' + i} cx=".5" cy=".5" r=".5"><stop offset="0" stopColor={c} stopOpacity=".95" /><stop offset=".72" stopColor={c} stopOpacity=".85" /><stop offset="1" stopColor={c} stopOpacity="0" /></radialGradient>
        ))}
        <radialGradient id="sb-halo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ff3d86" stopOpacity=".5" /><stop offset="1" stopColor="#ff3d86" stopOpacity="0" /></radialGradient>
        <filter id="cb-b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.4" /></filter>
        <filter id="cb-b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="1600" height="900" fill="url(#cb-sky)" />
      <g filter="url(#cb-b2)" opacity=".9" transform="translate(0 -40)">
        {towers.filter((_, i) => i % 2 === 0).map((t, i) => <rect key={i} x={t.x + 20} y={770 - t.h * 0.8} width={t.w} height={t.h * 0.8 + 60} fill="#101a36" />)}
      </g>
      <g filter="url(#cb-b1)">
        {towers.map((t, i) => (
          <g key={i}>
            <rect x={t.x} y={770 - t.h} width={t.w} height={t.h + 140} fill="#080d1c" />
            {t.wins.map((w, j) => <rect key={j} x={w.x} y={w.y} width="6" height="8" fill={w.on ? '#ffc680' : '#31405e'} opacity={w.on ? 0.85 : 0.35} />)}
          </g>
        ))}
      </g>
      <rect y="560" width="1600" height="340" fill="url(#cb-street)" />
      {/* still copy of the lights + neon: the slow-device fallback keeps the picture; the animated layer adds the shimmer */}
      {[...bokehFar, ...bokeh].map((b, i) => <circle key={i} cx={b.x} cy={b.y} r={b.r * 1.35} fill={`url(#sbk-${b.c})`} opacity={b.o * 0.55} />)}
      <circle cx="1010" cy="292" r="250" fill="url(#sb-halo)" opacity=".7" />
      <g transform="translate(1010 292) scale(2.35)" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity=".75">
        <g stroke="#ff3d86" strokeWidth="16" opacity=".22"><circle r="21" /><path d={AT} /></g>
        <g stroke="#ff3d86" strokeWidth="9" opacity=".5"><circle r="21" /><path d={AT} /></g>
        <g stroke="#ffd2e6" strokeWidth="2.6"><circle r="21" /><path d={AT} /></g>
      </g>
    </svg>
  );
}

/* Moving light: out-of-focus bokeh that breathes, and the flickering neon. Soft discs are plain gradients. */
export function CafeGlow() {
  const narrow = useNarrow();
  return (
    <SliceBox vb={narrow ? BOX_N : BOX_W}>
      {[...bokehFar, ...bokeh].map((b, i) => (
        <Pos key={i} x={b.x} y={b.y} w={b.r * 2.7} className="bk" style={{ ['--o' as string]: b.o, background: `radial-gradient(closest-side,${PAL[b.c]} 0,${PAL[b.c]}d9 72%,transparent 100%)`, borderRadius: '50%', animationDuration: b.d + 's', animationDelay: b.dl + 's' }} />
      ))}
      <Pos x={1010} y={292} w={500} className="neon-halo" style={{ background: 'radial-gradient(closest-side,rgba(255,61,134,.55),transparent)' }} />
      <Pos x={1010} y={292} w={300} className="neon">
        <svg viewBox="-150 -150 300 300" width="100%" height="100%" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
          <g transform="scale(2.35)">
            <g stroke="#ff3d86" strokeWidth="16" opacity=".22"><circle r="21" /><path d={AT} /></g>
            <g stroke="#ff3d86" strokeWidth="9" opacity=".5"><circle r="21" /><path d={AT} /></g>
            <g stroke="#ffd2e6" strokeWidth="2.6"><circle r="21" /><path d={AT} /></g>
          </g>
        </svg>
      </Pos>
    </SliceBox>
  );
}

export function CafeFront() {
  const narrow = useNarrow();
  return (
    <svg className="scene-svg" viewBox={narrow ? '635 0 560 900' : '0 0 1600 900'} preserveAspectRatio="xMidYMax slice" role="img" aria-label="A rainy window table at night: a coffee cup, a phone lighting up with a message, a notebook and a candle, in front of a window onto a blurred, neon-lit city">
      <defs>
        <linearGradient id="cf-wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3b2417" /><stop offset=".35" stopColor="#24150d" /><stop offset="1" stopColor="#0e0705" />
        </linearGradient>
        <linearGradient id="cf-sill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6b4a32" /><stop offset=".25" stopColor="#2c1a11" /><stop offset="1" stopColor="#150b07" /></linearGradient>
        <linearGradient id="cf-frame" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#05070b" /><stop offset=".5" stopColor="#10151e" /><stop offset="1" stopColor="#05070b" /></linearGradient>
        <linearGradient id="cf-cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#8d867a" /><stop offset=".3" stopColor="#f1ebdd" /><stop offset=".62" stopColor="#d8d0c0" /><stop offset="1" stopColor="#6e675c" /></linearGradient>
        <linearGradient id="cf-saucer" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6e675c" /><stop offset=".4" stopColor="#ebe4d4" /><stop offset="1" stopColor="#7d766a" /></linearGradient>
        <radialGradient id="cf-coffee" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#6a4125" /><stop offset="1" stopColor="#2a160a" /></radialGradient>
        <linearGradient id="cf-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#9fe0ff" /><stop offset="1" stopColor="#3a7bff" /></linearGradient>
        <radialGradient id="cf-phoneGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#6fc4ff" stopOpacity=".6" /><stop offset="1" stopColor="#6fc4ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="cf-flameGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffb866" stopOpacity=".65" /><stop offset="1" stopColor="#ffb866" stopOpacity="0" /></radialGradient>
        <radialGradient id="cf-neonRef" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ff3d86" stopOpacity=".34" /><stop offset="1" stopColor="#ff3d86" stopOpacity="0" /></radialGradient>
        <linearGradient id="cf-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff8a2a" /><stop offset=".6" stopColor="#ffd27a" /><stop offset="1" stopColor="#fff6dc" /></linearGradient>
        <linearGradient id="cf-page" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#efe6d2" /><stop offset="1" stopColor="#c9bea5" /></linearGradient>
        <filter id="cf-blur6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="cf-blur14" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
        <filter id="cf-blur3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* window frame: two slim mullions and the sill */}
            <rect x="1328" y="0" width="22" height="706" fill="url(#cf-frame)" />
      <rect x="1328" y="0" width="2" height="706" fill="#2a3446" opacity=".7" />
      <rect x="0" y="0" width="1600" height="30" fill="#04060a" opacity=".85" />

      {/* table / sill surface */}
      <path d="M0 704 H1600 V900 H0 Z" fill="url(#cf-wood)" />
      <rect x="0" y="698" width="1600" height="14" fill="url(#cf-sill)" />
      <rect x="0" y="698" width="1600" height="2" fill="#a9825c" opacity=".55" />
      {/* wood grain */}
      <g stroke="#000" strokeOpacity=".22" fill="none" strokeWidth="1.2">
        <path d="M0 742 C 400 736 800 748 1600 738" /><path d="M0 786 C 500 794 900 780 1600 792" /><path d="M0 836 C 300 830 900 842 1600 832" />
      </g>
      {/* neon colour pooling on the table */}
      <ellipse cx="990" cy="760" rx="380" ry="46" fill="url(#cf-neonRef)" style={{ mixBlendMode: 'screen' }} />

      {/* NOTEBOOK + pen (wide screens only show this) */}
      <g transform="translate(570 802) rotate(-4) scale(.85)">
        <ellipse cx="6" cy="64" rx="150" ry="14" fill="#000" opacity=".5" filter="url(#cf-blur6)" />
        <path d="M-140 -58 L128 -66 L140 58 L-132 68 Z" fill="#1a1411" />
        <path d="M-134 -64 L124 -72 L134 52 L-126 62 Z" fill="url(#cf-page)" />
        <path d="M-6 -70 L4 60" stroke="#8a7d62" strokeWidth="2" opacity=".6" />
        <g stroke="#8a7d62" strokeOpacity=".5" strokeWidth="1.2">
          {[-40, -22, -4, 14, 32].map((y) => <path key={y} d={`M-116 ${y} L-18 ${y - 3}`} />)}
          {[-40, -22, -4, 14, 32].map((y) => <path key={'r' + y} d={`M14 ${y - 3} L114 ${y - 6}`} />)}
        </g>
        <path d="M-108 -48 q16 -14 30 0 t30 0 t30 0" stroke="#2f4fb5" strokeOpacity=".55" strokeWidth="2.2" fill="none" />
        {/* pen */}
        <g transform="translate(40 8) rotate(-16)">
          <rect x="-4" y="-5" width="150" height="9" rx="4.5" fill="#101319" />
          <rect x="-4" y="-5" width="150" height="2.4" rx="1.2" fill="#3b4558" />
          <rect x="22" y="-6" width="38" height="3" fill="#c8b38a" />
          <path d="M-4 -5 L-24 -.5 L-4 4 Z" fill="#cdbb95" />
        </g>
      </g>

      {/* PHONE — lights up with a new message */}
      <g transform="translate(780 794) rotate(-9) scale(.86)">
        <ellipse cx="4" cy="58" rx="120" ry="12" fill="#000" opacity=".55" filter="url(#cf-blur6)" />
        <rect x="-112" y="-60" width="224" height="118" rx="16" fill="#07090d" stroke="#3a4152" strokeWidth="1.6" />
        <rect x="-104" y="-52" width="208" height="102" rx="10" fill="url(#cf-screen)" />
        <rect x="-104" y="-52" width="208" height="102" rx="10" fill="#fff" opacity=".07" />
        {/* lock-screen: a soft time block and one message card, no invented text */}
        <rect x="-80" y="-38" width="70" height="12" rx="6" fill="#fff" opacity=".9" />
        <rect x="-80" y="-20" width="44" height="6" rx="3" fill="#fff" opacity=".55" />
        <g>
          <rect x="-84" y="2" width="168" height="36" rx="10" fill="#0b1224" opacity=".78" />
          <rect x="-74" y="10" width="20" height="20" rx="6" fill="#ffd27a" />
          <path d="M-70 16 l6 5 6 -5" stroke="#0b1224" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-44" y="12" width="86" height="5" rx="2.5" fill="#fff" opacity=".85" />
          <rect x="-44" y="22" width="58" height="4" rx="2" fill="#fff" opacity=".45" />
          <circle cx="68" cy="20" r="5" fill="#ff4f6d" />
        </g>
        <path d="M-104 -52 L-30 -52 L-104 20 Z" fill="#fff" opacity=".1" />
      </g>

      {/* COFFEE */}
      <g transform="translate(960 0)">
        <ellipse cx="6" cy="812" rx="150" ry="20" fill="#000" opacity=".55" filter="url(#cf-blur6)" />
        <ellipse cx="0" cy="800" rx="138" ry="26" fill="url(#cf-saucer)" />
        <ellipse cx="0" cy="796" rx="104" ry="17" fill="#cfc7b6" opacity=".7" />
        <path d="M-78 722 C -78 776 -52 800 0 800 C 52 800 78 776 78 722 Z" fill="url(#cf-cup)" />
        <path d="M76 738 C 124 730 124 782 66 782" fill="none" stroke="#d5cdbd" strokeWidth="13" strokeLinecap="round" />
        <path d="M76 738 C 124 730 124 782 66 782" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".35" />
        <ellipse cx="0" cy="722" rx="78" ry="18" fill="#efe8d8" />
        <ellipse cx="0" cy="723" rx="68" ry="14.5" fill="url(#cf-coffee)" />
        <path d="M0 730 c-14 -6 -22 -14 -14 -19 c6 -3 11 0 14 5 c3 -5 8 -8 14 -5 c8 5 0 13 -14 19 z" fill="#d9b48a" opacity=".78" />
        <path d="M-60 716 q 30 -10 62 -8" stroke="#fff" strokeOpacity=".35" strokeWidth="2" fill="none" />
      </g>

      {/* CANDLE */}
      <g transform="translate(1120 0)">
        <ellipse cx="2" cy="800" rx="46" ry="9" fill="#000" opacity=".5" filter="url(#cf-blur6)" />
        <rect x="-34" y="742" width="68" height="58" rx="10" fill="#caa56a" fillOpacity=".16" stroke="#e9cf9f" strokeOpacity=".4" strokeWidth="1.4" />
        <rect x="-29" y="768" width="58" height="28" rx="6" fill="#f1e2bc" opacity=".55" />
        <path d="M-1 770 V 750" stroke="#2a1a10" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M-26 752 q 6 -5 14 -3" stroke="#fff" strokeOpacity=".5" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>

      {/* faint glass reflection over everything on the table */}
      <path d="M0 704 H1600 V780 H0 Z" fill="#fff" opacity=".03" />
    </svg>
  );
}

/* Moving parts of the table: the phone's glow, steam off the coffee, the candle flame. */
export function CafeFrontFx() {
  const narrow = useNarrow();
  return (
    <SliceBox vb={narrow ? BOX_N : BOX_W}>
      <Pos x={780} y={790} w={440} className="phone-glow" style={{ background: 'radial-gradient(closest-side,rgba(111,196,255,.55),transparent)' }} />
      {[[930, 0], [962, 1], [992, 2], [946, 3], [978, 4]].map(([x, i]) => (
        <Pos key={i} x={x} y={690} w={44} h={72} className={'puff p' + i} style={{ background: 'radial-gradient(closest-side,rgba(255,244,228,.5),transparent)', borderRadius: '50%' }} />
      ))}
      <Pos x={1120} y={740} w={300} className="flame-glow" style={{ background: 'radial-gradient(closest-side,rgba(255,184,102,.6),transparent)' }} />
      <Pos x={1120} y={734} w={26} h={40} className="flame">
        <svg viewBox="-13 -20 26 40" width="100%" height="100%" style={{ display: 'block' }}>
          <defs><linearGradient id="fx-flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#ff8a2a" /><stop offset=".6" stopColor="#ffd27a" /><stop offset="1" stopColor="#fff6dc" /></linearGradient></defs>
          <path d="M0 -16 C -10 0 -9 14 0 16 C 9 14 10 0 0 -16 Z" fill="url(#fx-flame)" />
          <ellipse cx="0" cy="10" rx="3.4" ry="5.6" fill="#7fb8ff" opacity=".75" />
        </svg>
      </Pos>
    </SliceBox>
  );
}

/* Rain + beads of water on the glass. Streaks fall, beads slowly gather, wobble and run. */
export function CafeRain() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const g = cv?.getContext('2d');
    if (!cv || !g) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25); // streaks and beads don't need retina
    let w = 0, h = 0;
    const size = () => { w = cv.clientWidth; h = cv.clientHeight; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); };
    size();
    const sprites = new Map<number, HTMLCanvasElement>();
    const sprite = (r: number) => {
      const k = Math.round(r * 2);
      let s = sprites.get(k);
      if (!s) {
        const rr = k / 2, d = Math.ceil(rr * 2 + 6) * dpr;
        s = document.createElement('canvas'); s.width = s.height = d;
        const c = s.getContext('2d')!;
        c.scale(dpr, dpr);
        const m = d / dpr / 2;
        const gr = c.createRadialGradient(m - rr * 0.3, m - rr * 0.35, rr * 0.05, m, m, rr);
        gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(0.35, 'rgba(200,220,255,.16)'); gr.addColorStop(0.85, 'rgba(20,30,60,.28)'); gr.addColorStop(1, 'rgba(255,255,255,.34)');
        c.fillStyle = gr; c.beginPath(); c.ellipse(m, m, rr * 0.86, rr, 0, 0, 6.283); c.fill();
        sprites.set(k, s);
      }
      return s;
    };
    const streaks = Array.from({ length: 110 }, () => ({ x: Math.random(), y: Math.random(), l: 0.035 + Math.random() * 0.09, v: 0.45 + Math.random() * 0.9, a: 0.05 + Math.random() * 0.15 }));
    const beads = Array.from({ length: 54 }, () => ({ x: Math.random(), y: 0.06 + Math.random() * 0.78, r: 1.8 + Math.random() * 5, vy: 0, wait: Math.random() * 7, run: 0, trail: [] as number[] }));
    const draw = (dt: number) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.lineWidth = 1; g.lineCap = 'round';
      for (const s of streaks) {
        s.y += s.v * dt * 0.9; s.x -= s.v * dt * 0.06;
        if (s.y > 1.05) { s.y = -0.1; s.x = Math.random() * 1.1; }
        const x = s.x * w, y = s.y * h, L = s.l * h;
        g.strokeStyle = `rgba(190,212,255,${s.a})`;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x - L * 0.07, y - L); g.stroke();
      }
      for (const b of beads) {
        if (b.run > 0) {
          b.vy = Math.min(b.vy + dt * 0.5, 0.55); const step = b.vy * dt * 60; b.y += step / h; b.run -= step;
          b.trail.push(b.x * w, b.y * h); if (b.trail.length > 30) b.trail.splice(0, 2);
          if (b.run <= 0 || b.y > 0.96) { b.run = 0; b.vy = 0; b.wait = 3 + Math.random() * 8; if (b.y > 0.96) { b.y = 0.04 + Math.random() * 0.2; b.x = Math.random(); } b.trail = []; }
        } else if ((b.wait -= dt) <= 0 && b.r > 3) { b.run = 40 + Math.random() * 220; }
        if (b.trail.length > 3) {
          g.strokeStyle = 'rgba(200,220,255,.09)'; g.lineWidth = Math.max(1, b.r * 0.5);
          g.beginPath(); g.moveTo(b.trail[0], b.trail[1]);
          for (let i = 2; i < b.trail.length; i += 2) g.lineTo(b.trail[i], b.trail[i + 1]);
          g.stroke();
        }
        const sp = sprite(b.r); const sz = sp.width / dpr;
        g.drawImage(sp, b.x * w - sz / 2, b.y * h - sz / 2, sz, sz);
      }
    };
    draw(0);
    if (prefersReducedMotion()) return;
    let raf = 0, last = performance.now(), visible = true;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(cv);
    // Quality governor: if the device can't hold ~20 fps while the hero is on screen, keep the still artwork and
    // drop the animated overlays (rain, bokeh, glows) instead of letting the whole page stutter.
    const hero = cv.closest('.hero');
    let t0 = 0, frames = 0, judged = false, prev = 0, stalls = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) { last = now; t0 = 0; frames = 0; return; }
      if (!judged) {
        if (prev && now - prev > 700 && ++stalls >= 2) { judged = true; hero?.setAttribute('data-lite', ''); cancelAnimationFrame(raf); return; } // frames taking most of a second
        prev = now;
        if (!t0) { t0 = now; frames = 0; }
        else if (now - t0 > 1500) {
          frames++;
          if (now - t0 > 4000) {
            judged = true;
            if (frames / ((now - t0 - 1500) / 1000) < 20) { hero?.setAttribute('data-lite', ''); cancelAnimationFrame(raf); return; }
          }
        }
      }
      const dt = Math.min(0.05, (now - last) / 1000);
      if (dt < 0.028) return; // ~30 fps is plenty for rain
      last = now; draw(dt);
    };
    raf = requestAnimationFrame(loop);
    const ro = new ResizeObserver(size); ro.observe(cv);
    return () => { cancelAnimationFrame(raf); io.disconnect(); ro.disconnect(); };
  }, []);
  return <canvas ref={ref} className="scene-rain" aria-hidden="true" />;
}
