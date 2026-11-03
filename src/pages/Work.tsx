import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import '../styles/work.css';
import { Arrow, Footer, Nav } from '../components/Chrome';
import WorkshopScene from '../components/scenes/WorkshopScene';
import InfiniteSpiral from '../components/reactbits/InfiniteSpiral';
import { pad2, useContent } from '../lib/store';
import { entranceWait, prefersReducedMotion, ScrollTrigger, usePageMotion } from '../lib/motion';
import { expandFrom } from '../lib/transition';
import { projectCategories } from '../content/projects';
import type { Project, Ratio } from '../content/types';

const AR: Record<Ratio, number> = { '16:9': 16 / 9, '9:16': 9 / 16, '1:1': 1 };

// Masonry: skyline packing on a 12 / 6 / 4-column grid. Every image keeps its exact aspect ratio.
function layout(list: Project[], W: number) {
  const C = W >= 900 ? 12 : W >= 560 ? 6 : 4;
  const G = W >= 900 ? 32 : W >= 560 ? 22 : 14;
  const spans = C === 12 ? { m: { '16:9': 6, '9:16': 3, '1:1': 3 }, l: { '16:9': 9, '9:16': 4, '1:1': 6 } }
    : C === 6 ? { m: { '16:9': 4, '9:16': 2, '1:1': 2 }, l: { '16:9': 6, '9:16': 3, '1:1': 4 } }
    : { m: { '16:9': 4, '9:16': 2, '1:1': 2 }, l: { '16:9': 4, '9:16': 2, '1:1': 4 } };
  const u = (W - (C - 1) * G) / C;
  const h = new Array(C).fill(0);
  const pos: Record<string, { x: number; y: number; w: number; h: number; small: boolean }> = {};
  list.forEach((p) => {
    const s = Math.min(C, spans[p.size][p.ratio]);
    const w = s * u + (s - 1) * G;
    const hh = w / AR[p.ratio];
    let best = { score: Infinity, x: 0, y: 0 };
    for (let x = 0; x <= C - s; x++) {
      let y = 0;
      for (let k = x; k < x + s; k++) y = Math.max(y, h[k]);
      let waste = 0;
      for (let k = x; k < x + s; k++) waste += y - h[k];
      const score = y + (waste / s) * 0.9;
      if (score < best.score - 0.5) best = { score, x, y };
    }
    for (let k = best.x; k < best.x + s; k++) h[k] = best.y + hh + G;
    pos[p.id] = { x: Math.round(best.x * (u + G)), y: Math.round(best.y), w: Math.round(w), h: Math.round(hh), small: w < 340 };
  });
  return { pos, height: Math.max(0, Math.max(...h) - G) };
}

export function catLabel(p: Project) {
  const names = p.categories.map((k) => projectCategories.find((c) => c.key === k)?.label).filter(Boolean);
  return names.length ? names.join(' · ') : '[Category]';
}

export default function Work() {
  const root = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { content } = useContent();
  const [filter, setFilter] = useState<string>('all');
  const [gw, setGw] = useState(1312);
  const lastPos = useRef<Record<string, { x: number; y: number; w: number; h: number; small: boolean }>>({});

  const all = useMemo(() => content.projects.filter((p) => p.published).sort((a, b) => a.order - b.order), [content.projects]);
  const shown = useMemo(() => all.filter((p) => filter === 'all' || p.categories.includes(filter as never)), [all, filter]);
  const L = useMemo(() => layout(shown, gw), [shown, gw]);
  usePageMotion(root);

  useLayoutEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setGw(Math.round(el.clientWidth) || 1312));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Tiles enter differently by shape: tall ones rise out of a bottom mask, wide ones wipe in from the left,
  // squares open from their centre with a slight turn. The image inside keeps drifting with the scroll.
  useEffect(() => {
    const el = galleryRef.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(el.querySelectorAll('.tile')).forEach((tile, i) => {
        const t = tile.querySelector<HTMLElement>('.tile-in');
        if (!t) return;
        const r = tile.dataset.ratio;
        const from = r === '9:16' ? { clipPath: 'inset(100% 0% 0% 0%)', y: 90 }
          : r === '16:9' ? { clipPath: 'inset(0% 100% 0% 0%)', x: -70 }
          : { clipPath: 'inset(50% 50% 50% 50%)', scale: 0.7, rotate: -4 };
        gsap.set(t, from);
        ScrollTrigger.create({ trigger: tile, start: 'clamp(top 92%)', once: true, onEnter: () => {
          gsap.to(t, { clipPath: 'inset(0% 0% 0% 0%)', x: 0, y: 0, scale: 1, rotate: 0, duration: r === '1:1' ? 1.1 : 1.3, ease: 'expo.out', delay: (i % 3) * 0.1, clearProps: 'clipPath,x,y,scale,rotate' });
        } });
        const img = t.querySelector('.tile-par');
        if (img) gsap.fromTo(img, { yPercent: -6, scale: 1.1 }, { yPercent: 6, scale: 1, ease: 'none', scrollTrigger: { trigger: tile, start: 'top bottom', end: 'bottom top', scrub: true } });
      });
    }, el);
    return () => ctx.revert();
  }, [all.length]);

  // Opening title: letters tip up out of a mask in 3D, then drift apart in a slow wave as you scroll on.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const letters = gsap.utils.toArray<HTMLElement>(el.querySelectorAll('.intro .big .ltr'));
    const ctx = gsap.context(() => {
      letters.forEach((l) => { l.style.animation = 'none'; });
      gsap.fromTo(letters, { yPercent: 115, rotateX: -70, rotate: (i: number) => (i % 2 ? 7 : -7), transformPerspective: 900, transformOrigin: '50% 100%' },
        { yPercent: 0, rotateX: 0, rotate: 0, duration: 1.4, ease: 'expo.out', stagger: 0.07, delay: 0.25 + entranceWait() });
      gsap.to(letters, {
        yPercent: (i: number) => -14 - i * 7, rotate: (i: number) => (i % 2 ? 3 : -3), opacity: 0.25, ease: 'none',
        scrollTrigger: { trigger: el.querySelector('.intro'), start: 'top top', end: 'bottom top', scrub: 0.6 }
      });
    }, el);
    return () => ctx.revert();
  }, []);

  // Filter indicator: a gold line slides under the active category.
  useLayoutEffect(() => {
    const ul = root.current?.querySelector<HTMLElement>('.filter-list');
    const on = ul?.querySelector<HTMLElement>('.fbtn.on');
    const ind = ul?.querySelector<HTMLElement>('.f-ind');
    if (!ul || !on || !ind) return;
    const a = ul.getBoundingClientRect(), b = on.getBoundingClientRect();
    gsap.to(ind, { x: b.left - a.left, y: b.bottom - a.top - 1, width: b.width, duration: prefersReducedMotion() ? 0 : 0.6, ease: 'expo.out' });
  }, [filter, gw]);

  // Hover: the tile leans toward the cursor in 3D (desktop).
  const tiltTile = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReducedMotion()) return;
    const inner = e.currentTarget.querySelector<HTMLElement>('.tile-in');
    if (!inner) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(inner, { rotateY: px * 10, rotateX: -py * 10, transformPerspective: 900, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
  };
  const untiltTile = (e: React.MouseEvent<HTMLElement>) => {
    const inner = e.currentTarget.querySelector('.tile-in');
    if (inner) gsap.to(inner, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
  };

  // Click-through: the tile's cover grows to fill the screen, then the case study opens beneath it.
  const open = (p: Project, from?: Element | null) => {
    if (!from) { navigate(`/work/${p.slug}`); return; }
    expandFrom(from, { image: p.cover }).then(() => navigate(`/work/${p.slug}`));
  };

  const letters: [string, string][] = [['M', ''], ['y', ''], [' ', ''], ['W', 'it'], ['o', 'it'], ['r', 'it'], ['k', 'it']];
  const shownIds = new Map(shown.map((p, i) => [p.id, i]));

  return (
    <div className="dp pg-work" id="top" ref={root}>
      <Nav />
      <main>
        <header className="intro">
          <div className="work-glow" aria-hidden="true" />
          <div className="work-scene"><WorkshopScene /></div>
          <div className="wrap-wide">
            <div className="intro-top"><p className="label" data-m="scramble"><b>02</b> My Work</p><span className="showing">Index · <b data-m="counter" data-delay="0.6">{pad2(all.length)}</b> projects</span></div>
            <h1 className="big" aria-label="My Work">
              {letters.map(([ch, cls], i) => <span key={i} className={'ltr' + (cls ? ' ' + cls : '')} style={{ animationDelay: 250 + i * 70 + 'ms' }} aria-hidden="true">{ch}</span>)}
            </h1>
            <div className="intro-grid">
              <p className="sub" data-m="skew" data-delay="0.5">Things I’ve imagined, engineered and brought to life.</p>
              <div className="intro-side" data-m="stagger" data-delay="0.7">
                <p>Software, AI, engineering and design work — hackathon builds, client and personal projects, and the systems I use myself. Each one opens into a full case study.</p>
                <div className="count"><b data-m="counter" data-delay="0.9">{pad2(all.length)}</b> projects in the index</div>
              </div>
            </div>
            <a className="cue" href="#gallery" aria-label="Scroll to the gallery"><span className="rail" />Scroll to explore</a>
          </div>
        </header>

        <section className="spiral-sec" aria-labelledby="spiral-h">
          <div className="wrap-wide spiral-grid">
            <div className="spiral-side">
              <p className="label" data-m="scramble"><b>—</b> In motion</p>
              <h2 className="spiral-h" data-m="flip" id="spiral-h">Every build, <em>in one loop.</em></h2>
              <p className="rv">Scroll or drag to turn it, hover to pause. Click any card to open its case study.</p>
            </div>
            <div className="spiral-wrap" data-m="glow" data-cursor="Open">
              <InfiniteSpiral items={all.map((p) => ({ id: p.id, src: p.cover, alt: p.alt, label: p.title + ' — open case study', href: `/work/${p.slug}` }))}
                animationMode="all" speed={0.55} radius={170} cardWidth={100} cardHeight={100} verticalSpacing={60} perspective={1000}
                cardRadius={10} centerScale={1.2} edgeBlur={6} cardsPerTurn={7} pauseOnHover
                onItemClick={(item: { id: string }) => { const p = all.find((x) => x.id === item.id); if (p) open(p); }} />
            </div>
            <div className="spiral-side right"><div className="spiral-stat rv"><b data-m="digits">{pad2(all.length)}</b>Projects · one loop</div></div>
          </div>
        </section>

        <section className="gallery-sec" id="gallery" aria-label="Project gallery">
          <div className="wrap-wide">
            <div className="filters">
              <ul className="filter-list" aria-label="Filter projects by category" data-m="stagger" data-stagger="0.05">
                <span className="f-ind" aria-hidden="true" />
                {projectCategories.map((c) => {
                  const n = c.key === 'all' ? all.length : all.filter((p) => p.categories.includes(c.key as never)).length;
                  return <li key={c.key}><button type="button" className={'fbtn' + (filter === c.key ? ' on' : '')} aria-pressed={filter === c.key} onClick={() => setFilter(c.key)}>{c.label}<sup>{pad2(n)}</sup></button></li>;
                })}
              </ul>
              <p className="showing rv" aria-live="polite" style={{ margin: 0 }}>Showing <b>{pad2(shown.length)}</b> of {pad2(all.length)}</p>
            </div>
            <div className="gallery" ref={galleryRef} style={{ height: L.height, marginTop: 48 }}>
              {all.map((p, gi) => {
                const on = shownIds.has(p.id);
                const pos = on ? L.pos[p.id] : lastPos.current[p.id] || { x: 0, y: 0, w: 300, h: 300, small: false };
                if (on) lastPos.current[p.id] = pos;
                return (
                  <a key={p.id} href={`/work/${p.slug}`} data-transition="custom" data-cursor="Explore" data-ratio={p.ratio} className={'tile' + (on ? '' : ' is-out') + (pos.small ? ' is-small' : '')}
                    style={{ transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`, width: pos.w, height: pos.h, ['--d' as string]: (on ? shownIds.get(p.id)! * 45 : 0) + 'ms' }}
                    onMouseMove={tiltTile} onMouseLeave={untiltTile}
                    onClick={(e) => { e.preventDefault(); if (e.metaKey || e.ctrlKey) { window.open(`/work/${p.slug}`, '_blank'); return; } open(p, e.currentTarget.querySelector('.tile-in')); }} tabIndex={on ? 0 : -1} aria-hidden={!on} aria-label={`${p.title} — ${catLabel(p)}. Open case study.`}>
                    <div className="tile-in">
                      <div className="tile-par"><img src={p.cover} alt={p.alt} loading="lazy" decoding="async" /></div>
                      <div className="tile-shade" />
                      <span className="tile-num">{pad2(gi + 1)}</span>
                      <div className="tile-info">
                        <span className="tile-cat">{catLabel(p)}</span>
                        <h3 className="tile-title">{p.title}</h3>
                        <p className="tile-desc">{p.short}</p>
                        <span className="tile-cta">Explore project</span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Closing />
      <Footer />
    </div>
  );
}

export function Closing() {
  return (
    <section className="closing" aria-labelledby="close-h">
      <div className="wrap">
        <svg className="idea" viewBox="0 0 240 240" aria-hidden="true">
          <g><circle className="ring" cx="120" cy="120" r="110" /><circle className="ring" cx="120" cy="120" r="110" /><circle className="ring" cx="120" cy="120" r="110" /></g>
          <circle className="orbit" cx="120" cy="120" r="62" />
          <g className="sat"><circle cx="182" cy="120" r="2.6" /></g>
          <circle className="core" cx="120" cy="120" r="5" />
        </svg>
        <h2 data-m="scatter" id="close-h">Every project starts <em>with an idea.</em></h2>
        <p className="rv">Have one worth building? I’m open to collaborations, freelance projects and internships.</p>
        <div className="closing-ctas rv">
          <Link className="cta-main" to="/contact">Contact me <Arrow /></Link>
          <Link className="ulink text-cta" to="/">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
