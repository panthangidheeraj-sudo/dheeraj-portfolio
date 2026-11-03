import { forwardRef, useId } from 'react';
import gsap from 'gsap';
import { HANDWRITING } from './handwriting';

const PAD = 40;

/**
 * A script word drawn as SVG. A mask of pen strokes uncovers it, so it can "write itself" with writeOn().
 * `em` is the CSS font size the word is set at (e.g. "clamp(80px, 12vw, 190px)").
 */
export const CursiveWord = forwardRef<SVGSVGElement, { word: string; className?: string; color?: string }>(
  function CursiveWord({ word, className = '', color = 'currentColor' }, ref) {
    const hw = HANDWRITING[word];
    const id = 'cw' + useId().replace(/:/g, '');
    if (!hw) return null;
    const vw = hw.w - PAD * 2, vh = hw.h - PAD * 2;
    return (
      <svg ref={ref} className={'cw ' + className} viewBox={`${PAD} ${PAD} ${vw} ${vh}`} aria-hidden="true" focusable="false"
        style={{ width: `calc(var(--em) * ${(vw / 300).toFixed(3)})`, height: 'auto', overflow: 'visible' }}>
        <defs>
          <mask id={id} maskUnits="userSpaceOnUse" x="0" y="0" width={hw.w} height={hw.h}>
            {hw.strokes.map(([d, len], i) => (
              <path key={i} className="cw-pen" data-len={len} d={d} fill="none" stroke="#fff" strokeWidth={hw.pen} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </mask>
        </defs>
        <path className="cw-ink" d={hw.d} fill={color} mask={`url(#${id})`} />
      </svg>
    );
  }
);

/** Hide the ink so writeOn() can draw it. */
export function primeWrite(svg: SVGSVGElement | null) {
  if (!svg) return;
  const m = svg.querySelector('mask');
  if (m) svg.querySelector('.cw-ink')?.setAttribute('mask', `url(#${m.id})`);
  svg.querySelectorAll<SVGPathElement>('.cw-pen').forEach((p) => {
    const L = Number(p.dataset.len);
    p.style.strokeDasharray = `${L} ${L}`;
    p.style.strokeDashoffset = String(L);
    p.style.visibility = 'hidden'; // a round cap would otherwise leave a dot before the stroke starts
  });
}

/** Show the finished word immediately (reduced motion, or after writing). */
export function finishWrite(svg: SVGSVGElement | null) {
  if (!svg) return;
  svg.querySelectorAll<SVGPathElement>('.cw-pen').forEach((p) => { p.style.strokeDashoffset = '0'; p.style.visibility = ''; });
  svg.querySelector('.cw-ink')?.removeAttribute('mask'); // guarantees every hairline shows
}

/** Timeline that writes the word stroke by stroke. `speed` is in font units per second (word height ≈ 300). */
export function writeOn(svg: SVGSVGElement | null, speed = 2900) {
  const tl = gsap.timeline();
  if (!svg) return tl;
  primeWrite(svg);
  svg.querySelectorAll<SVGPathElement>('.cw-pen').forEach((p) => {
    const L = Number(p.dataset.len);
    tl.to(p, { strokeDashoffset: 0, duration: Math.max(0.06, L / speed), ease: L > 300 ? 'sine.inOut' : 'none', onStart: () => { p.style.visibility = ''; } }, '>-0.015');
  });
  tl.add(() => finishWrite(svg));
  return tl;
}
