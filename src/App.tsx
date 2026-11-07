import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import Home from './pages/Home';
import Work from './pages/Work';
import CaseStudy from './pages/CaseStudy';
import Offer from './pages/Offer';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import { gsap, holdEntrances, prefersReducedMotion, refreshScroll } from './lib/motion';
import { coverThenGo, hasOverlay, markIntroDone, registerNavigate, releaseOverlay, revealPage, shouldShowIntro, type Dir } from './lib/transition';
import Cursor from './components/Cursor';
import { scrollToTarget, startSmooth, stopSmooth } from './lib/smooth';
import { useContent } from './lib/store';
import { CursiveWord, writeOn } from './components/Cursive';

// On refresh, start at the top so every entrance animation plays again (browsers would restore the old scroll spot).
if (typeof window !== 'undefined') {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!window.location.hash) window.scrollTo(0, 0);
}

// Decided once per page load (StrictMode renders twice; this must not).
const SHOW_INTRO = typeof window !== 'undefined' && shouldShowIntro(window.location.pathname);
if (!SHOW_INTRO) markIntroDone();

// Three.js only downloads when someone opens the museum; the admin only when someone opens /admin.
const loadAchievements = () => import('./pages/Achievements');
const Achievements = lazy(loadAchievements);
// fetch the 3D gallery's code while the browser is idle, so opening it later doesn't wait on the download (skipped on Data Saver)
if (typeof window !== 'undefined' && !(navigator as { connection?: { saveData?: boolean } }).connection?.saveData) {
  const warm = () => { loadAchievements().catch(() => {}); };
  if ('requestIdleCallback' in window) (window as unknown as { requestIdleCallback: (f: () => void, o: { timeout: number }) => void }).requestIdleCallback(warm, { timeout: 8000 });
  else setTimeout(warm, 5000);
}
const AdminLayout = lazy(() => import('./admin/AdminLayout'));

const TITLES: [RegExp, string][] = [
  [/^\/$/, 'Dheeraj Panthangi — Portfolio'],
  [/^\/work\/?$/, 'My Work — Dheeraj Panthangi'],
  [/^\/work\/.+/, 'Case study — Dheeraj Panthangi'],
  [/^\/achievements/, 'Achievements — Dheeraj Panthangi'],
  [/^\/offer/, 'What I Offer — Dheeraj Panthangi'],
  [/^\/contact/, 'Contact — Dheeraj Panthangi'],
  [/^\/admin/, 'Admin — Dheeraj Panthangi']
];

function RouteEffects() {
  const { pathname, hash } = useLocation();
  useLayoutEffect(() => {
    if (!hash) scrollToTarget(0, { immediate: true });
  }, [pathname, hash]);
  useEffect(() => {
    document.title = TITLES.find(([r]) => r.test(pathname))?.[1] || 'Dheeraj Panthangi';
    let t = 0;
    if (hash) {
      // wait for the page (and lazy chunks) to render, then jump to the anchor
      let tries = 0;
      const go = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) scrollToTarget(el);
        else if (tries++ < 20) t = window.setTimeout(go, 100);
      };
      t = window.setTimeout(go, 60);
    }
    const r = window.setTimeout(refreshScroll, 400);
    return () => { window.clearTimeout(t); window.clearTimeout(r); };
  }, [pathname, hash]);
  return null;
}

function Loading() {
  return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: '#8C877E', font: "500 11px 'Instrument Sans', sans-serif", letterSpacing: '.3em', textTransform: 'uppercase' }} role="status">Loading…</div>;
}

const CURTAIN: [RegExp, string, string, string][] = [
  [/^\/$/, 'Home', '', '01'], [/^\/work\/?$/, 'My ', 'Work', '02'], [/^\/achievements/, 'Achieve', 'ments', '03'],
  [/^\/offer/, 'What I ', 'Offer', '04'], [/^\/contact/, 'Contact ', 'Me', '05']
];
type Content = ReturnType<typeof useContent>['content'];
function titleFor(path: string, content: Content): [string, string] {
  const slug = path.match(/^\/work\/([^/?#]+)/)?.[1];
  const proj = slug ? content.projects.find((p) => p.slug === slug) : null;
  if (proj) return [proj.title, 'Case study'];
  const hit = CURTAIN.find(([r]) => r.test(path));
  return hit ? [hit[1] + (hit[2] ? `<em>${hit[2]}</em>` : ''), hit[3] + ' / Dheeraj Panthangi'] : ['', ''];
}

/** Page transitions: links close five dark panels over the page (see Shell), the route changes, the panels lift. */
function Curtain({ pathname }: { pathname: string }) {
  const { content } = useContent();
  const prev = useRef(pathname);
  useLayoutEffect(() => {
    if (prev.current === pathname) return; // first load (the intro shows instead) or a re-run
    const from = prev.current;
    prev.current = pathname;
    if (pathname.startsWith('/admin')) return;
    if (hasOverlay()) { releaseOverlay(); holdEntrances(500); return; }
    const [t, sub] = titleFor(pathname, content);
    revealPage(t, sub, dirBetween(from, pathname, content));
    holdEntrances(1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
  return null;
}

// Moving to the next case study wipes left-to-right, to the previous one right-to-left.
function dirBetween(from: string, to: string, content: Content): Dir {
  const a = from.match(/^\/work\/(.+)/)?.[1], b = to.match(/^\/work\/(.+)/)?.[1];
  if (!a || !b) return 'up';
  const list = content.projects.filter((p) => p.published).sort((x, y) => x.order - y.order).map((p) => p.slug);
  const i = list.indexOf(a), j = list.indexOf(b);
  return j === (i + 1) % list.length ? 'right' : 'left';
}

/** First visit only: the DP monogram writes itself, then the panel lifts into the page. */
function Intro() {
  const [on, setOn] = useState(SHOW_INTRO);
  const box = useRef<HTMLDivElement>(null);
  const mono = useRef<SVGSVGElement>(null);
  useLayoutEffect(() => {
    if (!on || !box.current) return;
    const tl = gsap.timeline()
      .add(writeOn(mono.current, 1500), 0.25)
      .to(box.current.querySelector('p'), { autoAlpha: 0, duration: 0.3 }, '+=0.15')
      .add(() => markIntroDone())
      .to(box.current, { clipPath: 'inset(0 0 100% 0)', duration: 0.9, ease: 'power3.inOut' }, '<')
      .add(() => setOn(false));
    return () => { tl.kill(); };
  }, [on]);
  if (!on) return null;
  return (
    <div className="site-intro" ref={box} aria-hidden="true">
      <CursiveWord word="DP" ref={mono} />
      <p>Dheeraj Panthangi · Portfolio</p>
    </div>
  );
}

/** 1 px gold line along the top that fills as you scroll (desktop). */
function ScrollProgress({ pathname }: { pathname: string }) {
  const bar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = bar.current;
    if (!el || pathname.startsWith('/admin') || pathname.startsWith('/achievements')) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const y = window.scrollY;
      el.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
      el.classList.toggle('on', pathname !== '/' || y > window.innerHeight * 0.9);
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', on); window.removeEventListener('resize', on); el.classList.remove('on'); };
  }, [pathname]);
  return <div className="scroll-progress" ref={bar} aria-hidden="true" />;
}

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const { content } = useContent();
  const admin = location.pathname.startsWith('/admin');
  const here = useRef(location.pathname);
  here.current = location.pathname;
  useEffect(() => { registerNavigate((to) => navigate(to)); }, [navigate]);

  // Internal links run the panel transition before the route changes (capture phase, ahead of the router).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.('a[href]') as HTMLAnchorElement | null;
      if (!a || a.target === '_blank' || a.hasAttribute('download') || a.dataset.transition === 'custom') return;
      const href = a.getAttribute('href') || '';
      if (!href.startsWith('/') || href.startsWith('//') || href.startsWith('/admin') || here.current.startsWith('/admin')) return;
      const path = href.split('#')[0];
      if (path === here.current || href.includes('#')) return;
      e.preventDefault();
      e.stopPropagation();
      const [t, sub] = titleFor(path, content);
      coverThenGo(path, t, sub, dirBetween(here.current, path, content));
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [content]);
  useEffect(() => { if (admin) stopSmooth(); else startSmooth(); }, [admin]);
  // Magnetic buttons: they lean toward the cursor and spring back when it leaves (mouse only).
  useEffect(() => {
    if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;
    const SEL = '.cta, .cta-main, .send, .enter, .back, .mono, .totop, .menu-btn, .hbtn, .round, .fbtn, .again';
    const onMove = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest?.(SEL) as HTMLElement | null;
      if (!b) return;
      const r = b.getBoundingClientRect();
      gsap.to(b, { x: (e.clientX - (r.left + r.width / 2)) * 0.28, y: (e.clientY - (r.top + r.height / 2)) * 0.4, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
    };
    const onOut = (e: MouseEvent) => {
      const b = (e.target as HTMLElement).closest?.(SEL) as HTMLElement | null;
      if (!b || b.contains(e.relatedTarget as Node)) return;
      gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseout', onOut);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseout', onOut); };
  }, []);
  // Same-page anchor links scroll smoothly (and keep the smooth scroller in sync).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
      const id = a?.getAttribute('href')?.slice(1);
      if (!id) return;
      const el = document.getElementById(decodeURIComponent(id));
      if (!el) return;
      e.preventDefault();
      scrollToTarget(id === 'top' ? 0 : el);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return (
    <>
      <RouteEffects />
      <Intro />
      <Curtain pathname={location.pathname} />
      <Cursor />
      {!admin && <ScrollProgress pathname={location.pathname} />}
      <div className="route-enter" key={location.pathname}>
        <Suspense fallback={<Loading />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/work" element={<Work />} />
            <Route path="/work/:slug" element={<CaseStudy />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/offer" element={<Offer />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin/*" element={<AdminLayout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
