// React Bits <FlexCarousel /> (JS-CSS). Original engine in ./flexCarouselEngine.js (ogl),
// with one addition: `drift` — continuous movement that slows on hover and pauses while interacting.
import { useEffect, useRef, useState } from 'react';
import { mount } from './flexCarouselEngine';
import './FlexCarousel.css';

const Digits = ({ value }) => (
  <span className="flex-carousel__digits">
    {String(value).padStart(2, '0').split('').map((digit, index) => (
      <span key={index} className="flex-carousel__digit">
        <span className="flex-carousel__reel" style={{ transform: `translateY(${-Number(digit) * 10}%)` }}>
          {'0123456789'.split('').map((n) => <span key={n}>{n}</span>)}
        </span>
      </span>
    ))}
  </span>
);

const FlexCarousel = ({
  items = [],
  preset = 'liquid',
  intro = 'rise',
  cardHeight = 0.5,
  gap = 12,
  radius = 0,
  squeeze = 0.2,
  focusOnClick = true,
  captions = true,
  captureWheel = true,
  drift = 0,
  hoverDrift = 0.35,
  driftResume = 2.2,
  onChange,
  className = '',
  style,
  ariaLabel = 'Image carousel'
}) => {
  const containerRef = useRef(null);
  const cbRef = useRef({ onChange });
  cbRef.current = { onChange };
  const [active, setActive] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const itemsKey = items.map((i) => i.src).join('|');

  useEffect(() => {
    if (!containerRef.current || !items.length) return undefined;
    // A fresh canvas per mount: destroy() releases the old WebGL context, and React (StrictMode in dev,
    // or a prop change) can mount again straight after — reusing that canvas would get a dead context.
    const opts = { items, preset, intro, cardHeight, gap, radius, squeeze, focusOnClick, captureWheel, drift, hoverDrift, driftResume };
    const cbs = {
      onChange: (i, item) => { setActive(i); cbRef.current.onChange?.(i, item); },
      onReveal: () => setRevealed(true),
      onFocusChange: (open) => setFocusOpen(open)
    };
    let engine = null, canvas = null, retry = 0, tries = 0, dead = false;
    const start = () => {
      if (dead || !containerRef.current) return;
      canvas?.remove();
      canvas = document.createElement('canvas');
      canvas.className = 'fc-canvas';
      canvas.setAttribute('aria-hidden', 'true');
      containerRef.current.prepend(canvas);
      try { engine = mount(containerRef.current, canvas, opts, cbs); } catch (e) { if (tries) console.warn('[FlexCarousel] WebGL unavailable, showing the drifting strip instead:', e?.message); engine = null; }
      if (engine) {
        setFailed(false);
        // if the GPU drops the context later (driver reset, too many contexts), rebuild it
        canvas.addEventListener('webglcontextlost', () => { if (dead) return; const e = engine; engine = null; e?.destroy(); if (tries < 3) { tries++; retry = window.setTimeout(start, 500); } }, { once: true });
      } else if (tries < 1) {
        tries++;
        retry = window.setTimeout(start, 400); // one more try: a context can fail transiently while another is being freed
      } else {
        canvas.remove();
        setFailed(true);
      }
    };
    start();
    return () => { dead = true; window.clearTimeout(retry); const e = engine; engine = null; e?.destroy(); canvas?.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, preset, intro, cardHeight, gap, radius, squeeze, focusOnClick, captureWheel, drift]);

  const current = items[active] || items[0];
  const label = current ? current.title || current.alt || `Image ${active + 1}` : '';
  return (
    <div ref={containerRef} className={`flex-carousel ${className}`.trim()}
      style={{ ...style, '--flex-carousel-half': `${Math.min(Math.max(cardHeight, 0.05), 1) * 50}%` }}
      role="region" aria-roledescription="carousel" aria-label={ariaLabel} tabIndex={0}>
      {failed && (
        <div className="flex-carousel__fallback">
          <div className="flex-carousel__drift">
            {[0, 1].map((k) => items.map((it, i) => (
              <figure key={k + '-' + i} aria-hidden={k === 1} onClick={() => { setActive(i); cbRef.current.onChange?.(i, it); }}>
                <img src={it.src} alt={k ? '' : it.alt || ''} loading="lazy" />
                <figcaption>{it.title}{it.subtitle && <small>{it.subtitle}</small>}</figcaption>
              </figure>
            )))}
          </div>
        </div>
      )}
      {captions && current && revealed && !failed && (
        <div className="flex-carousel__caption" aria-hidden="true">
          <span key={active} className="flex-carousel__title">
            {current.title || current.alt}
            {current.subtitle && <span className="flex-carousel__subtitle">{current.subtitle}</span>}
          </span>
          <span className="flex-carousel__count" data-hidden={focusOpen ? '' : undefined}>
            <Digits value={active + 1} />
            <span className="flex-carousel__slash">/</span>
            <span>{String(items.length).padStart(2, '0')}</span>
          </span>
        </div>
      )}
      <div className="flex-carousel__live" aria-live="polite" aria-atomic="true">{`${label}, ${active + 1} of ${items.length}`}</div>
    </div>
  );
};

export default FlexCarousel;
