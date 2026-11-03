import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, prefersReducedMotion } from '../lib/motion';

/**
 * Desktop cursor: a small dot plus a trailing ring.
 *  - links & buttons      → the ring opens up
 *  - [data-cursor="Text"] → the ring becomes a disc with that label (project images, exhibits, doors…)
 *  - pressing / dragging  → the ring tightens
 *  - text fields          → the normal caret comes back
 * Off on touch screens, with reduced motion, and in the admin.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const { pathname } = useLocation();
  const off = pathname.startsWith('/admin');

  useEffect(() => {
    const d = dot.current, r = ring.current, l = label.current;
    if (!d || !r || !l || off) return;
    if (prefersReducedMotion() || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const html = document.documentElement;
    html.classList.add('has-cursor');
    const dx = gsap.quickTo(d, 'x', { duration: 0.08, ease: 'power3.out' });
    const dy = gsap.quickTo(d, 'y', { duration: 0.08, ease: 'power3.out' });
    const rx = gsap.quickTo(r, 'x', { duration: 0.42, ease: 'power3.out' });
    const ry = gsap.quickTo(r, 'y', { duration: 0.42, ease: 'power3.out' });
    let state = '';
    const set = (s: string, text = '') => {
      if (s === state && l.textContent === text) return;
      state = s;
      r.dataset.state = s;
      d.dataset.state = s;
      l.textContent = text;
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY);
      html.classList.add('cursor-on');
      const t = e.target as HTMLElement;
      const labelled = t.closest?.('[data-cursor]') as HTMLElement | null;
      if (t.closest?.('input, textarea, select, [contenteditable="true"]')) set('text');
      else if (labelled && labelled.dataset.cursor) set('label', labelled.dataset.cursor);
      else if (t.closest?.('a, button, [role="button"], label, summary, .crow')) set('link');
      else set('');
    };
    const onDown = () => r.classList.add('is-down');
    const onUp = () => r.classList.remove('is-down');
    const onLeave = () => html.classList.remove('cursor-on');
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    document.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      document.removeEventListener('mouseleave', onLeave);
      html.classList.remove('has-cursor', 'cursor-on');
    };
  }, [off]);

  if (off) return null;
  return (
    <>
      <div className="cur-ring" ref={ring} aria-hidden="true"><span ref={label} /></div>
      <div className="cur-dot" ref={dot} aria-hidden="true" />
    </>
  );
}
