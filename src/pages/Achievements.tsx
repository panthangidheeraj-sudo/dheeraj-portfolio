import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/museum.css';
import { Footer, Nav } from '../components/Chrome';
import { isPlaceholder, pad2, useContent } from '../lib/store';
import { achievementCategories, standTypes } from '../content/achievements';
import type { Achievement } from '../content/types';
// Three.js museum engine — every stand is generated from the achievement data (type, position, size, light).
import { mount, webglAvailable } from '../museum/engine';
import { detectSoftwareGL } from '../lib/releaseGL.js';
import { gsap, prefersReducedMotion, SplitText, usePageMotion } from '../lib/motion';

type Engine = { enter(): void; focus(id: string): void; close(): void; next(): void; prev(): void; toEntrance(): void; setMode(m: string): void; destroy(): void } | null;
const catName = (k: string) => achievementCategories.find((c) => c[0] === k)?.[1] || k;
const typeName = (k: string) => standTypes.find((t) => t[0] === k)?.[1] || k;

export default function Achievements() {
  const { content } = useContent();
  const list = useMemo(() => content.achievements.filter((a) => a.published).sort((a, b) => a.order - b.order), [content.achievements]);
  const stageRef = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine>(null);
  // Software-rendered WebGL (hardware acceleration off) would crawl in the 3D museum, so start in the 2D gallery there; ?gl3d forces 3D.
  const forced3d = useRef(typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('gl3d'));
  const [softGL] = useState(() => typeof window !== 'undefined' && !forced3d.current && detectSoftwareGL());
  const [mode2d, setMode2d] = useState(softGL);
  const [webgl, setWebgl] = useState(true);
  const [progress, setProgress] = useState(0);
  const [introDone, setIntroDone] = useState(false);
  const [entering, setEntering] = useState(false);
  const [entered, setEntered] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [explore, setExplore] = useState<'cinematic' | 'free'>('cinematic');
  const [dirOpen, setDirOpen] = useState(false);
  const [dirCat, setDirCat] = useState('all');
  const [query, setQuery] = useState('');
  const [lightbox, setLightbox] = useState('');
  const root = useRef<HTMLDivElement>(null);
  usePageMotion(root, [mode2d]);
  const calm = prefersReducedMotion();

  // Intro title: letters rise in; on Enter they drift apart from the centre as the camera walks in.
  const titleSplit = useRef<SplitText | null>(null);
  useLayoutEffect(() => {
    const t = root.current?.querySelector<HTMLElement>('.museum .intro .title');
    if (!t || calm) return;
    t.style.animation = 'none'; // the letters take over from the CSS rise
    const split = SplitText.create(t, { type: 'chars', mask: 'chars' });
    titleSplit.current = split;
    const tw = gsap.from(split.chars, { yPercent: 110, duration: 1.1, ease: 'power4.out', stagger: 0.06, delay: 1.3 });
    return () => { tw.kill(); split.revert(); t.style.animation = ''; titleSplit.current = null; };
  }, [mode2d, calm]);
  const enterMuseum = () => {
    setEntering(true);
    engine.current?.enter();
    const chars = titleSplit.current?.chars;
    if (chars && !calm) {
      const mid = (chars.length - 1) / 2;
      gsap.to(chars, { x: (i: number) => (i - mid) * 42, autoAlpha: 0, duration: 1, ease: 'power2.in' });
    }
  };

  // On-screen controls fade in one by one after entering; panel, directory and lightbox contents settle in.
  useLayoutEffect(() => {
    if (!entered || calm) return;
    const els = root.current?.querySelectorAll('.hud-top > *, .hud-bottom > *');
    if (els?.length) gsap.from(els, { autoAlpha: 0, y: 12, duration: 0.7, ease: 'power3.out', stagger: 0.12, delay: 0.6 });
  }, [entered, calm]);
  useLayoutEffect(() => {
    if (!focusId || focusId === 'closing' || calm) return;
    const els = root.current?.querySelectorAll('.panel .panel-scroll > *, .panel .panel-foot');
    if (els?.length) gsap.from(els, { autoAlpha: 0, y: 16, duration: 0.6, ease: 'power3.out', stagger: 0.06, delay: 0.15, clearProps: 'transform' });
  }, [focusId, calm]);
  useLayoutEffect(() => {
    if (!dirOpen || calm) return;
    const els = root.current?.querySelectorAll('.dir-list li');
    if (els?.length) gsap.from(els, { autoAlpha: 0, y: 12, duration: 0.5, ease: 'power3.out', stagger: 0.04, delay: 0.15, clearProps: 'transform' });
  }, [dirOpen, calm]);
  useLayoutEffect(() => {
    if (!lightbox || calm) return;
    const img = document.querySelector('.lightbox img');
    if (img) gsap.from(img, { scale: 0.88, autoAlpha: 0, duration: 0.55, ease: 'power3.out' });
  }, [lightbox, calm]);

  useEffect(() => {
    if (mode2d) return;
    const el = stageRef.current;
    if (!el) return;
    if (!webglAvailable()) { setWebgl(false); setMode2d(true); return; }
    const mq = (q: string) => window.matchMedia(q).matches;
    const low = mq('(pointer: coarse)') || el.clientWidth < 820 || ((navigator as { deviceMemory?: number }).deviceMemory ?? 8) < 4;
    let lastP = 0;
    // a fresh canvas per mount: destroy() frees the WebGL context, so a re-mount (StrictMode, back/forward) needs a new one
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    el.prepend(cv);
    engine.current = mount(el, cv, {
      exhibits: list, quality: low ? 'low' : 'high', reducedMotion: prefersReducedMotion(),
      callbacks: {
        onProgress: (p: number) => { if (p - lastP >= 0.05 || p === 1) { lastP = p; setProgress(p); } },
        onIntroDone: () => setIntroDone(true),
        onEntered: () => { setEntered(true); setEntering(false); },
        onHover: (id: string | null) => setHoverId(id),
        onFocus: (id: string | null) => setFocusId(id)
      }
    }) as Engine;
    if (!engine.current) { setWebgl(false); setMode2d(true); }
    return () => { engine.current?.destroy(); engine.current = null; cv.remove(); setEntered(false); setEntering(false); setIntroDone(false); setProgress(0); setFocusId(null); };
  }, [mode2d, list]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightbox(''); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox]);

  const focusEx = list.find((e) => e.id === focusId);
  const hoverEx = list.find((e) => e.id === hoverId);
  const order = list.map((e) => e.id).concat('closing');
  const idx = focusId ? order.indexOf(focusId) : -1;
  const focus = (id: string) => (mode2d ? setFocusId(id) : engine.current?.focus(id));
  const q = query.trim().toLowerCase();
  const dirList = list.filter((e) => (dirCat === 'all' || e.category === dirCat) && (!q || `${e.title} ${e.org} ${catName(e.category)}`.toLowerCase().includes(q)));
  const narrow = typeof window !== 'undefined' && window.innerWidth < 900;
  const closeExhibit = () => (mode2d || !engine.current ? setFocusId(null) : engine.current.close());

  const Panel = ({ ex }: { ex: Achievement }) => (
    <aside className="panel" aria-labelledby="ex-title">
      <div className="panel-scroll">
        <div className="meta"><span>{catName(ex.category)}</span><span>{typeName(ex.type)}</span>{ex.featured && <span>Featured</span>}</div>
        <h2 id="ex-title">{ex.title}</h2>
        <dl><dt>Awarded by</dt><dd className={isPlaceholder(ex.org) ? 'ph' : ''}>{ex.org}</dd><dt>Date</dt><dd className={isPlaceholder(ex.date) ? 'ph' : ''}>{ex.date}</dd></dl>
        <p className="desc">{ex.description}</p>
        <button className="cert-btn" type="button" onClick={() => setLightbox(ex.cert)} aria-label="Enlarge certificate"><img src={ex.cert} alt={`Certificate for ${ex.title}`} /><span>Enlarge</span></button>
        {ex.photos.length > 0 && <div className="photos">{ex.photos.map((p) => <button key={p} type="button" onClick={() => setLightbox(p)} aria-label="Enlarge photograph"><img src={p} alt="Supporting photograph" /></button>)}</div>}
        <div className="links">
          {ex.verify && <a className="ulink" href={ex.verify} target="_blank" rel="noopener noreferrer">Verify credential ↗</a>}
          {ex.pdf && <a className="ulink" href={ex.pdf} target="_blank" rel="noopener noreferrer">Open PDF ↗</a>}
        </div>
      </div>
      <div className="panel-foot">
        {!mode2d ? <div className="tour">
          <button className="round" type="button" onClick={() => engine.current?.prev()} aria-label="Previous exhibit"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M16 5H2M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.2" /></svg></button>
          <button className="round" type="button" onClick={() => engine.current?.next()} aria-label="Next exhibit"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg></button>
        </div> : <span />}
        <button className="close" type="button" onClick={closeExhibit}>Close exhibit ✕</button>
      </div>
    </aside>
  );

  return (
    <div className="dp pg-museum" id="top" ref={root}>
      <Nav />
      {!mode2d && (
        <section className="museum" aria-label="The Museum — interactive 3D exhibition">
          <div className="stage" ref={stageRef} data-lenis-prevent data-cursor={hoverEx && !focusId ? 'View exhibit' : entered && !focusId ? 'Drag to look' : undefined} tabIndex={0} aria-label="3D museum. Use the arrow keys to move between exhibits and Escape to close an exhibit.">
          </div>
          <div className="vig" />
          {!entered && (
            <div className={'intro' + (entering ? ' out' : '')}>
              <p className="kicker">03 · Achievements</p>
              <h1 className="title">THE MUSEUM</h1>
              <p className="tag">Milestones, memories and things I’ve built along the way.</p>
              {!introDone && <div className="load" role="status"><span className="bar"><i style={{ width: Math.round(progress * 100) + '%' }} /></span>Lighting the rooms · {Math.round(progress * 100)}%</div>}
              {introDone && !entering && <button className="enter" type="button" onClick={enterMuseum}>Enter the exhibition <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg></button>}
              <button className="alt" type="button" onClick={() => setMode2d(true)}>View as a 2D exhibition</button>
            </div>
          )}
          {entered && (
            <>
              <div className="hud-top">
                <button className="hbtn" type="button" onClick={() => setDirOpen(!dirOpen)} aria-expanded={dirOpen}>Directory</button>
                <div className="seg mode-ctl" role="group" aria-label="Exploration mode">
                  {(['cinematic', 'free'] as const).map((m) => <button key={m} type="button" className={explore === m ? 'on' : ''} aria-pressed={explore === m} onClick={() => { setExplore(m); engine.current?.setMode(m); }}>{m === 'free' ? 'Free explore' : 'Cinematic'}</button>)}
                </div>
                <button className="hbtn" type="button" onClick={() => engine.current?.toEntrance()}>Entrance</button>
              </div>
              <div className="hud-bottom">
                <nav className="cats" aria-label="Exhibition categories">
                  {achievementCategories.filter((c) => list.some((e) => e.category === c[0])).map((c) => <button key={c[0]} className="cat" type="button" onClick={() => { const f = list.find((e) => e.category === c[0]); if (f) focus(f.id); }}>{c[1]}</button>)}
                </nav>
                <div className="tour">
                  <button className="round" type="button" onClick={() => engine.current?.prev()} aria-label="Previous exhibit"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M16 5H2M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.2" /></svg></button>
                  <span>{idx >= 0 ? `${pad2(idx + 1)} / ${pad2(order.length)}` : `${pad2(order.length)} rooms`}</span>
                  <button className="round" type="button" onClick={() => engine.current?.next()} aria-label="Next exhibit"><svg width="16" height="10" viewBox="0 0 16 10" fill="none" aria-hidden="true"><path d="M0 5h14M10 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg></button>
                </div>
                <p className="help" style={{ margin: 0 }}>{explore === 'free' ? 'WASD or arrows to walk · drag to look · Shift to move faster' : 'Click an exhibit · drag to look around · ← → to tour'}</p>
              </div>
            </>
          )}
          {hoverEx && !focusId && <div className="hover-tip" aria-hidden="true"><small>{catName(hoverEx.category)} · View exhibit</small><b>{hoverEx.title}</b></div>}
          {focusId === 'closing' && (
            <div className="final">
              <Link className="close" to="/">Return to the homepage →</Link>
              <button className="close" type="button" onClick={() => engine.current?.toEntrance()} style={{ borderColor: 'rgba(236,230,218,.2)' }}>Back to the entrance</button>
            </div>
          )}
          {dirOpen && entered && (
            <aside className="dir" aria-label="Exhibition directory">
              <div className="dir-head"><h2>Directory</h2><button className="hbtn" type="button" onClick={() => setDirOpen(false)}>Close</button></div>
              <input className="search" type="search" placeholder="Search achievements" aria-label="Search achievements" value={query} onChange={(e) => setQuery(e.target.value)} />
              <div className="cats">
                {[['all', 'All'] as [string, string]].concat(achievementCategories).map((c) => <button key={c[0]} className={'cat' + (dirCat === c[0] ? ' on' : '')} type="button" aria-pressed={dirCat === c[0]} onClick={() => setDirCat(c[0])}>{c[1]}</button>)}
              </div>
              <ul className="dir-list">
                {dirList.map((e) => (
                  <li key={e.id}><button className="dir-item" type="button" onClick={() => { focus(e.id); if (narrow) setDirOpen(false); }}>
                    <img src={e.cert} alt="" loading="lazy" /><span><b>{e.title}</b><small>{catName(e.category)} · {e.org}</small></span><i aria-label={e.featured ? 'Featured' : undefined}>{e.featured ? '★' : ''}</i>
                  </button></li>
                ))}
              </ul>
              {!dirList.length && <p className="dir-empty">No exhibits match.</p>}
            </aside>
          )}
          {focusEx && <Panel ex={focusEx} />}
        </section>
      )}

      {mode2d && (
        <section className="flat" aria-labelledby="flat-h">
          <div className="wrap">
            <div className="flat-head">
              <div><p className="kicker" style={{ animation: 'none' }}>03 · Achievements</p><h1 id="flat-h" style={{ marginTop: 18 }}>THE MUSEUM</h1><p>Milestones, memories and things I’ve built along the way.</p>{softGL && <p className="sw-note">Your browser is drawing graphics in software, so the lighter 2D gallery is shown. Turn on hardware acceleration in your browser settings for the full 3D museum, or press the button to try it anyway.</p>}</div>
              {webgl && <button className="hbtn" type="button" onClick={() => { forced3d.current = true; setFocusId(null); setMode2d(false); }}>Enter the 3D museum</button>}
            </div>
            {([[1, 'Hall I — Entrance gallery'], [2, 'Hall II — Inner gallery']] as const).map(([room, label]) => (
              <div key={room}>
                <h2 className="room-h" data-m="scramble">{label}</h2>
                <div className="flat-grid">
                  {list.filter((e) => e.room === room).map((e) => (
                    <button key={e.id} className="piece" type="button" onClick={() => setFocusId(e.id)}>
                      <span className="piece-frame" data-m="block"><img src={e.cert} alt={`Certificate for ${e.title}`} loading="lazy" /></span>
                      <small>{catName(e.category)}</small>
                      <b>{e.title}</b>
                      <small style={{ color: '#A39D92', letterSpacing: '.08em', textTransform: 'none', fontSize: 13 }}>{e.org} · {e.date}</small>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flat-final">
              <h2 data-m="scatter">EVERY MILESTONE IS PART<br />OF A LARGER JOURNEY.</h2>
              <p>Dheeraj Panthangi</p>
              <Link className="ulink" to="/" style={{ display: 'inline-block', marginTop: 28, fontSize: 11, letterSpacing: '.22em', textTransform: 'uppercase' }}>Return to the homepage →</Link>
            </div>
          </div>
          {focusEx && <Panel ex={focusEx} />}
        </section>
      )}

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Enlarged document" onClick={() => setLightbox('')}>
          <img src={lightbox} alt="Enlarged certificate or photograph" onClick={(e) => e.stopPropagation()} />
          <button className="close" type="button" onClick={() => setLightbox('')}>Close ✕</button>
        </div>
      )}
      <Footer />
    </div>
  );
}
