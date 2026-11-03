import { createContext, useContext, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/**
 * Animated bits of a scene are real HTML elements (not shapes inside the SVG): a CSS transform/opacity
 * animation on its own element runs on the GPU compositor, whereas animating things *inside* an SVG makes
 * the browser re-paint the whole picture every frame — fine on a desktop, janky on a phone.
 *
 * SliceBox gives those elements the same coordinate space as the SVG underneath ("xMidYMax slice" with the
 * same viewBox), so Pos can place them in scene units.
 */
export type VB = [number, number, number, number];
const Ctx = createContext<VB>([0, 0, 1600, 900]);

export function SliceBox({ vb, children }: { vb: VB; children: ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState<CSSProperties>({ visibility: 'hidden' });
  useLayoutEffect(() => {
    const el = outer.current;
    if (!el) return;
    const fit = () => {
      const W = el.clientWidth, H = el.clientHeight;
      if (!W || !H) return;
      const k = Math.max(W / vb[2], H / vb[3]);
      const w = vb[2] * k, h = vb[3] * k;
      setBox({ width: w, height: h, left: (W - w) / 2, top: H - h });
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vb[0], vb[1], vb[2], vb[3]]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={outer} className="scene-slice" aria-hidden="true">
      <div className="scene-box" style={box}><Ctx.Provider value={vb}>{children}</Ctx.Provider></div>
    </div>
  );
}

/** Place a child in scene units: x,y = centre, w,h = size. */
export function Pos({ x, y, w, h, className, style, children }: { x: number; y: number; w: number; h?: number; className?: string; style?: CSSProperties; children?: ReactNode }) {
  const vb = useContext(Ctx);
  const hh = h ?? w;
  return (
    <div className={className} style={{ position: 'absolute', left: ((x - w / 2 - vb[0]) / vb[2]) * 100 + '%', top: ((y - hh / 2 - vb[1]) / vb[3]) * 100 + '%', width: (w / vb[2]) * 100 + '%', height: (hh / vb[3]) * 100 + '%', ...style }}>{children}</div>
  );
}
