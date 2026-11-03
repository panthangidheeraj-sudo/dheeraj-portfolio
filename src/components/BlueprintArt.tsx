// Three wireframe "scales" for the Web Development scene in What I Offer.
// Each layer is drawn on with stroke animation (Offer.tsx); lines carry the class "bl".
const Box = ({ x, y, w, h, t, r = 4 }: { x: number; y: number; w: number; h: number; t?: string; r?: number }) => (
  <g className="bl-box">
    <rect className="bl" x={x} y={y} width={w} height={h} rx={r} />
    {t && <text x={x + w / 2} y={y + h / 2 + 4} textAnchor="middle">{t}</text>}
  </g>
);

export default function BlueprintArt() {
  const grid = [];
  for (let i = 1; i < 12; i++) grid.push(<line key={'v' + i} x1={i * 40} y1="0" x2={i * 40} y2="520" />, <line key={'h' + i} x1="0" y1={i * 40 + 20} x2="480" y2={i * 40 + 20} />);
  return (
    <svg className="bp-art" viewBox="0 0 480 520" aria-hidden="true" focusable="false">
      <g className="bp-grid">{grid}</g>

      <g className="lay lay-s">
        <rect className="bl" x="60" y="80" width="360" height="260" rx="8" />
        <path className="bl" d="M60 104 H420" />
        <circle className="bl" cx="78" cy="92" r="3.5" /><circle className="bl" cx="91" cy="92" r="3.5" /><circle className="bl" cx="104" cy="92" r="3.5" />
        <rect className="bl" x="82" y="122" width="316" height="92" rx="4" />
        <path className="bl" d="M82 238 H300 M82 256 H262 M82 274 H226" />
        <rect className="bl" x="82" y="296" width="96" height="26" rx="13" />
        <path className="bl dim" d="M60 372 H420 M60 366 V378 M420 366 V378" />
        <text x="240" y="398" textAnchor="middle">360 PX · ONE PAGE</text>
        <text className="tag" x="60" y="458">01 · Small scale — a focused site</text>
      </g>

      <g className="lay lay-m">
        <Box x={196} y={56} w={88} h={46} t="Home" />
        <path className="bl" d="M240 102 V136 M85 136 H405 M85 136 V168 M195 136 V168 M300 136 V168 M405 136 V168" />
        <Box x={40} y={168} w={90} h={52} t="About" />
        <Box x={150} y={168} w={90} h={52} t="Services" />
        <Box x={255} y={168} w={90} h={52} t="Booking" />
        <Box x={365} y={168} w={80} h={52} t="Admin" />
        <path className="bl" d="M300 220 V270 M405 220 V250 H290 V270" />
        <ellipse className="bl" cx="240" cy="284" rx="62" ry="14" />
        <path className="bl" d="M178 284 V344 M302 284 V344 M178 344 A62 14 0 0 0 302 344" />
        <text x="240" y="322" textAnchor="middle">DATABASE</text>
        <text className="tag" x="40" y="458">02 · Medium scale — pages, data, admin</text>
      </g>

      <g className="lay lay-l">
        <Box x={36} y={44} w={124} h={46} t="Web app" />
        <Box x={178} y={44} w={124} h={46} t="Mobile" />
        <Box x={320} y={44} w={124} h={46} t="Dashboard" />
        <path className="bl" d="M98 90 V120 H382 V90 M240 90 V150" />
        <Box x={130} y={150} w={220} h={48} t="API" r={24} />
        <path className="bl" d="M240 198 V226 M96 226 H384 M96 226 V250 M240 226 V250 M384 226 V250" />
        <Box x={40} y={250} w={112} h={46} t="Auth" />
        <Box x={184} y={250} w={112} h={46} t="Payments" />
        <Box x={328} y={250} w={112} h={46} t="Analytics" />
        <path className="bl" d="M96 296 V330 H384 V296 M150 330 V356 M330 330 V356" />
        <Box x={90} y={356} w={120} h={46} t="Database" />
        <Box x={270} y={356} w={120} h={46} t="Storage" />
        <text className="tag" x="36" y="458">03 · Large scale — a full-stack platform</text>
      </g>
    </svg>
  );
}
