import { useMemo } from 'react';
import { Pos, SliceBox, type VB } from './SliceBox';
import '../../styles/scenes.css';

/**
 * MY WORK — "The bench".
 * Where the work actually happens: a night-time maker's bench. A laptop streams code, a circuit board blinks,
 * a soldering iron glows and smokes, and a small wireframe model floats up out of the board — the idea
 * becoming a thing. Pure vector + CSS animation, so it costs nothing to run and is sharp on any screen.
 */

const rng = (seed: number) => () => (seed = (seed * 16807) % 2147483647) / 2147483647;


/* The moving light on the bench: streaming code, blinking LEDs, the floating model, iron glow, smoke and embers.
   Each moving piece is its own HTML element (see SliceBox) so it animates on the GPU instead of re-painting the SVG. */
const VB: VB = [0, 0, 1600, 600];
const LEDS: [number, number, string, string][] = [[720, 470, '#ff4d5e', 'l1'], [738, 472, '#5dffb0', 'l2'], [980, 460, '#6fe3ff', 'l3'], [1000, 464, '#ffc45a', 'l4'], [1018, 468, '#ff7ad0', 'l5']];
function BenchFx({ code }: { code: { y: number; segs: { x: number; w: number; c: string }[] }[] }) {
  const H = code.length * 14 * 2 + 16;
  return (
    <SliceBox vb={VB}>
      <Pos x={540} y={264} w={268} h={168} className="screen-clip">
        <svg className="code-scroll" viewBox={`0 0 268 ${H}`} width="100%" style={{ display: 'block' }}>
          <g transform="translate(16 8)">
            {[...code, ...code].map((l, i) => <g key={i} transform={`translate(0 ${l.y + (i >= code.length ? code.length * 14 : 0)})`}>{l.segs.map((sg, j) => <rect key={j} x={sg.x} y="0" width={sg.w} height="5" rx="2.5" fill={sg.c} opacity=".85" />)}</g>)}
          </g>
        </svg>
        <i className="caret" />
      </Pos>
      {LEDS.map(([x, y, c, k]) => <Pos key={k} x={x} y={y} w={36} className={'led ' + k} style={{ background: `radial-gradient(closest-side,${c} 0,${c} 16%,${c}66 36%,transparent 100%)`, borderRadius: '50%' }} />)}
      <Pos x={850} y={474} w={190} h={30} className="holo-pool" style={{ background: 'radial-gradient(closest-side,rgba(111,227,255,.45),transparent)', borderRadius: '50%' }} />
      <Pos x={850} y={346} w={120} className="holo">
        <svg viewBox="-60 -60 120 120" width="100%" height="100%" fill="none" strokeLinejoin="round" style={{ display: 'block' }}>
          <path d="M0 -44 L40 -22 V22 L0 44 L-40 22 V-22 Z M0 -44 V0 M-40 -22 L0 0 L40 -22 M0 0 V44" stroke="#6fe3ff" strokeWidth="7" opacity=".28" />
          <path d="M0 -44 L40 -22 V22 L0 44 L-40 22 V-22 Z M0 -44 V0 M-40 -22 L0 0 L40 -22 M0 0 V44" stroke="#d9f8ff" strokeWidth="1.4" />
          <g fill="#d9f8ff"><circle cx="0" cy="-44" r="2.6" /><circle cx="40" cy="-22" r="2.6" /><circle cx="-40" cy="-22" r="2.6" /><circle cx="0" cy="44" r="2.6" /></g>
        </svg>
      </Pos>
      <Pos x={1102} y={458} w={92} className="tip-glow" style={{ background: 'radial-gradient(closest-side,rgba(255,178,90,.95),rgba(255,106,26,0))', borderRadius: '50%' }} />
      {[[1102, 0], [1108, 1], [1096, 2], [1104, 3]].map(([x, i]) => <Pos key={i} x={x} y={424} w={34} h={60} className={'smoke m' + i} style={{ background: 'radial-gradient(closest-side,rgba(219,233,245,.5),transparent)', borderRadius: '50%' }} />)}
      {[0, 1, 2, 3, 4].map((i) => <Pos key={i} x={1098 + i * 4} y={452} w={3 + (i % 2)} className={'ember e' + i} style={{ background: '#ffb25a', borderRadius: '50%' }} />)}
    </SliceBox>
  );
}

export default function WorkshopScene() {
  const code = useMemo(() => {
    const r = rng(11);
    const cols = ['#6fd3ff', '#ffc87a', '#9be8b4', '#d2b8ff', '#f4efe6'];
    return Array.from({ length: 26 }, (_, i) => {
      const indent = [0, 0, 18, 18, 36, 18, 0][Math.floor(r() * 7)];
      const segs: { x: number; w: number; c: string }[] = [];
      let x = indent;
      for (let k = 0; k < 1 + Math.floor(r() * 3); k++) { const w = 18 + r() * 60; segs.push({ x, w, c: cols[Math.floor(r() * cols.length)] }); x += w + 8; }
      return { y: i * 14, segs };
    });
  }, []);

  return (
    <>
    <svg className="scene-svg" viewBox="0 0 1600 600" preserveAspectRatio="xMidYMax slice" role="img" aria-label="A maker’s bench at night: a laptop streaming code, a blinking circuit board with a floating wireframe model, and a glowing soldering iron">
      <defs>
        <linearGradient id="ws-bench" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a3340" /><stop offset=".08" stopColor="#151b24" /><stop offset="1" stopColor="#07090d" /></linearGradient>
        <linearGradient id="ws-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe9ff" stopOpacity=".34" /><stop offset="1" stopColor="#bfe9ff" stopOpacity="0" /></linearGradient>
        <linearGradient id="ws-screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0d1a2c" /><stop offset="1" stopColor="#070d18" /></linearGradient>
        <linearGradient id="ws-alu" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#2b3340" /><stop offset=".5" stopColor="#5b6778" /><stop offset="1" stopColor="#2b3340" /></linearGradient>
        <linearGradient id="ws-pcb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#0f4a3a" /><stop offset="1" stopColor="#072b22" /></linearGradient>
        <radialGradient id="ws-tip" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#ffb25a" stopOpacity=".95" /><stop offset="1" stopColor="#ff6a1a" stopOpacity="0" /></radialGradient>
        <radialGradient id="ws-screenGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#58b8ff" stopOpacity=".38" /><stop offset="1" stopColor="#58b8ff" stopOpacity="0" /></radialGradient>
        <radialGradient id="ws-holo" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#6fe3ff" stopOpacity=".42" /><stop offset="1" stopColor="#6fe3ff" stopOpacity="0" /></radialGradient>
        <filter id="ws-b6" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="ws-b3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id="ws-b12" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="12" /></filter>
        <clipPath id="ws-clip"><rect x="-134" y="-96" width="268" height="168" rx="4" /></clipPath>
        <pattern id="ws-peg" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="11" cy="11" r="1.6" fill="#8fb4cc" opacity=".5" /></pattern>
        <linearGradient id="ws-pegFade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".8" /><stop offset="1" stopColor="#fff" stopOpacity=".8" /></linearGradient>
        <mask id="ws-pegMask"><rect width="1600" height="420" fill="url(#ws-pegFade)" /></mask>
      </defs>

      {/* pegboard wall with hung tools */}
      <g mask="url(#ws-pegMask)" opacity=".5">
        <rect x="0" y="0" width="1600" height="420" fill="url(#ws-peg)" />
        <g fill="none" stroke="#9fc4dc" strokeOpacity=".5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1190 120 v108 M1182 120 h16 M1186 228 h8" />{/* screwdriver */}
          <path d="M1250 118 l-18 56 a14 14 0 1 0 28 8 l-10 -64 z" transform="translate(30 6)" />{/* pliers-ish */}
          <circle cx="1352" cy="150" r="30" /><path d="M1352 180 v70" />{/* hand mirror / probe */}
          <path d="M1430 110 v130 M1418 110 h24 M1424 240 h12" />
          <path d="M470 150 h86 a14 14 0 0 1 0 28 h-86 z" />{/* spanner */}
        </g>
      </g>

      <polygon points="1290,176 1120,520 1440,520" fill="url(#ws-cone)" />
      <ellipse cx="560" cy="420" rx="320" ry="90" fill="url(#ws-screenGlow)" />

      {/* BENCH */}
      <path d="M0 400 H1600 V600 H0 Z" fill="url(#ws-bench)" />
      <rect x="0" y="399" width="1600" height="2" fill="#7fa0b8" opacity=".35" />
      <g stroke="#000" strokeOpacity=".3" strokeWidth="1"><path d="M0 440 H1600 M0 492 H1600" /></g>

      {/* LAPTOP */}
      <g transform="translate(540 392)">
        <ellipse cx="0" cy="26" rx="230" ry="16" fill="#000" opacity=".55" filter="url(#ws-b6)" />
        <g transform="translate(0 -104)">
          <rect x="-146" y="-108" width="292" height="188" rx="10" fill="#0a0e15" stroke="#3d4757" strokeWidth="2" />
          <g transform="translate(0 -12)">
            <rect x="-134" y="-96" width="268" height="168" rx="4" fill="url(#ws-screen)" />
            <rect x="-134" y="-96" width="268" height="168" rx="4" fill="#fff" opacity=".035" />
            <path d="M-134 -96 H-30 L-134 10 Z" fill="#fff" opacity=".05" />
          </g>
        </g>
        <path d="M-170 -24 H170 L206 26 H-206 Z" fill="url(#ws-alu)" />
        <path d="M-206 26 H206 V32 H-206 Z" fill="#171c25" />
        <path d="M-150 -12 H150" stroke="#10151c" strokeWidth="3" opacity=".6" />
        <path d="M-60 6 H60" stroke="#10151c" strokeWidth="9" strokeLinecap="round" opacity=".5" />
      </g>

      {/* CIRCUIT BOARD */}
      <g transform="translate(850 478)">
        <ellipse cx="0" cy="46" rx="220" ry="16" fill="#000" opacity=".55" filter="url(#ws-b6)" />
        <path d="M-200 -42 L170 -52 L206 36 L-176 52 Z" fill="#031812" />
        <path d="M-196 -46 L168 -56 L200 28 L-172 44 Z" fill="url(#ws-pcb)" />
        <g stroke="#d6ae5c" strokeOpacity=".7" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-160 -30 H-90 L-70 -8 H-20" /><path d="M-150 10 H-100 L-84 -4" /><path d="M-30 -36 H40 L58 -16 H120" /><path d="M-20 20 H60 L76 4 H150" /><path d="M120 -40 V-10 L140 8" /><path d="M-120 28 H-40" />
        </g>
        {/* chips */}
        <rect x="-62" y="-20" width="74" height="40" rx="4" fill="#0a0d12" stroke="#2f3947" strokeWidth="1.5" transform="skewY(-3)" />
        <circle cx="-52" cy="-10" r="2.4" fill="#2f3947" />
        <rect x="52" y="-12" width="36" height="24" rx="3" fill="#0a0d12" stroke="#2f3947" strokeWidth="1.5" transform="skewY(-3)" />
        <rect x="-150" y="-34" width="44" height="14" rx="2" fill="#1b1f27" stroke="#3a4352" strokeWidth="1.2" />
        {/* resistors */}
        {[[-110, 14], [-92, 18], [100, 22]].map(([x, y], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${i * 14 - 10})`}><rect x="-12" y="-4" width="24" height="8" rx="4" fill="#d9c9a0" /><rect x="-5" y="-4" width="3" height="8" fill="#a33a2c" /><rect x="1" y="-4" width="3" height="8" fill="#2a2f3a" /><rect x="7" y="-4" width="3" height="8" fill="#c8a24a" /></g>
        ))}
        {/* pin header */}
        <g fill="#c8a24a">{Array.from({ length: 10 }, (_, i) => <rect key={i} x={-120 + i * 12} y="34" width="6" height="8" transform={`rotate(-3 ${-120 + i * 12} 34)`} />)}</g>
      </g>

      {/* SOLDERING IRON */}
      <g transform="translate(1150 0)">
        <ellipse cx="60" cy="486" rx="120" ry="12" fill="#000" opacity=".5" filter="url(#ws-b6)" />
        {/* stand */}
        <path d="M-6 484 q18 -40 52 -36 l6 8 q-30 -2 -42 28 z" fill="#2a303b" />
        <path d="M20 452 l40 -10" stroke="#5a6678" strokeWidth="5" strokeLinecap="round" />
        {/* iron */}
        <g transform="translate(20 452) rotate(-14)">
          <rect x="-4" y="-8" width="150" height="16" rx="8" fill="#191d26" />
          <rect x="-4" y="-8" width="150" height="4" rx="2" fill="#3a4354" />
          <rect x="-36" y="-5" width="34" height="10" rx="2" fill="#aab4c4" />
          <path d="M-36 -3 L-72 -.5 L-36 3 Z" fill="#d6dce6" />
        </g>
      </g>

      <circle cx="1102" cy="458" r="3.4" fill="#ffe2b0" />

      {/* solder spool */}
      <g transform="translate(1030 470)">
        <ellipse cx="4" cy="22" rx="46" ry="9" fill="#000" opacity=".5" filter="url(#ws-b3)" />
        <ellipse cx="0" cy="4" rx="44" ry="16" fill="#9aa4b4" /><ellipse cx="0" cy="-12" rx="44" ry="16" fill="#cdd5e1" /><ellipse cx="0" cy="-12" rx="14" ry="5" fill="#2a303b" />
        <path d="M-40 -8 q40 22 80 0" stroke="#707b8c" strokeWidth="6" fill="none" />
      </g>

      {/* desk lamp */}
      <g stroke="#0a0d12" strokeLinecap="round" fill="none">
        <path d="M1412 500 L1392 340 L1330 214" strokeWidth="8" />
        <path d="M1412 500 L1392 340 L1330 214" stroke="#566174" strokeWidth="3" />
      </g>
      <ellipse cx="1412" cy="504" rx="48" ry="9" fill="#10141b" /><ellipse cx="1412" cy="500" rx="40" ry="6" fill="#2a303b" />
      <circle cx="1392" cy="340" r="7" fill="#3a4354" /><circle cx="1330" cy="214" r="6" fill="#3a4354" />
      <g transform="translate(1318 196) rotate(30)">
        <path d="M-6 -22 H64 L82 24 H-24 Z" fill="#161b24" stroke="#3b4658" strokeWidth="2" />
        <ellipse cx="29" cy="24" rx="53" ry="8" fill="#e9f7ff" opacity=".95" />
      </g>
    </svg>
    <BenchFx code={code} />
    </>
  );
}
