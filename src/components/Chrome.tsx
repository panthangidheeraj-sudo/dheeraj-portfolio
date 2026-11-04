import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { channelHref, useContent } from '../lib/store';
import { gsap, prefersReducedMotion } from '../lib/motion';
import { currentMotionMode, osReducesMotion, setMotionMode } from '../lib/motionPref';
import { lockScroll, scrollToTarget } from '../lib/smooth';
import { CursiveWord } from './Cursive';

export const NAV = [
  { to: '/', label: 'Home' },
  { to: '/work', label: 'My Work' },
  { to: '/achievements', label: 'Achievements' },
  { to: '/offer', label: 'What I Offer' },
  { to: '/contact', label: 'Contact Me' }
];

export function Arrow({ dir = 'right' }: { dir?: 'right' | 'left' | 'up' | 'diag' }) {
  if (dir === 'up') return <svg width="12" height="18" viewBox="0 0 12 18" fill="none" aria-hidden="true"><path d="M6 17V2M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.2" /></svg>;
  if (dir === 'left') return <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true"><path d="M22 5H2M6 1L2 5l4 4" stroke="currentColor" strokeWidth="1.2" /></svg>;
  if (dir === 'diag') return <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M3 15L15 3M6 3h9v9" stroke="currentColor" strokeWidth="1.3" /></svg>;
  return <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg>;
}

export function Nav() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navRef = useRef<HTMLElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    lockScroll(true);
    return () => { document.removeEventListener('keydown', onKey); lockScroll(false); };
  }, [open]);

  // Entrance: items drop in one by one (the homepage choreographs its own in CSS).
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav || pathname === '/' || prefersReducedMotion()) return;
    const items = nav.querySelectorAll(':scope > .mono, :scope > ul > li, :scope > .menu-btn');
    const tw = gsap.fromTo(items, { autoAlpha: 0, y: -12 }, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.05, delay: 0.35, clearProps: 'transform' });
    return () => { tw.progress(1).kill(); };
  }, [pathname]);

  // After the first screen, the bar tucks away while scrolling down and slides back in when scrolling up.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || pathname.startsWith('/achievements')) return;
    let last = window.scrollY;
    let ticking = false;
    let armTimer = 0;
    const setFloat = (on: boolean) => {
      if (on === nav.classList.contains('is-float')) return;
      window.cancelAnimationFrame(armTimer);
      if (on) {
        // Enter already tucked away (no transition), then allow the slide on the next frames — otherwise the bar
        // pops in at the top of the screen and visibly slides out for a moment.
        nav.classList.remove('is-anim', 'is-shown');
        nav.classList.add('is-float');
        armTimer = requestAnimationFrame(() => { armTimer = requestAnimationFrame(() => nav.classList.add('is-anim')); });
      } else nav.classList.remove('is-float', 'is-shown', 'is-anim');
    };
    const update = () => {
      ticking = false;
      const y = window.scrollY;
      const floating = nav.classList.contains('is-float');
      // Starts floating once the first screen is behind us; once floating it stays until we are back at the very top,
      // so scrolling up never makes the bar vanish and reappear.
      const on = y > window.innerHeight * 0.7 || (floating && y > 8);
      setFloat(on);
      if (on) nav.classList.toggle('is-shown', y < last - 2 ? true : y > last + 2 ? false : nav.classList.contains('is-shown'));
      last = y;
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { window.removeEventListener('scroll', onScroll); window.cancelAnimationFrame(armTimer); nav.classList.remove('is-float', 'is-shown', 'is-anim'); };
  }, [pathname]);

  // Mobile menu: panel wipes down, links rise with their numbers.
  useLayoutEffect(() => {
    const m = menuRef.current;
    if (!open || !m || prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(m, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: 0.55, ease: 'power3.inOut', clearProps: 'clipPath' })
      .fromTo(m.querySelectorAll('li a'), { yPercent: 110 }, { yPercent: 0, duration: 0.7, ease: 'power4.out', stagger: 0.06 }, '-=0.15')
      .fromTo(m.querySelectorAll('.mnav-foot, .mnav-top'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, '-=0.4');
    return () => { tl.kill(); };
  }, [open]);

  return (
    <>
      <nav className="nav" aria-label="Primary" ref={navRef}>
        <Link className="mono" to="/" aria-label="Dheeraj Panthangi — home">DP</Link>
        <ul>
          {NAV.map((n) => (
            <li key={n.to}>
              <NavLink to={n.to} end={n.to === '/'} className={({ isActive }) => 'ulink' + (isActive || (n.to !== '/' && pathname.startsWith(n.to)) ? ' is-on' : '')}>
                <span className="roll"><span>{n.label}</span></span>
              </NavLink>
            </li>
          ))}
        </ul>
        <button className="menu-btn" type="button" onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open}>Menu <i /></button>
      </nav>
      {open && (
        <div className="mnav" role="dialog" aria-modal="true" aria-label="Menu" ref={menuRef}>
          <div className="mnav-top">
            <Link className="mono" to="/" style={{ animation: 'none' }}>DP</Link>
            <button className="menu-btn" type="button" onClick={() => setOpen(false)} style={{ display: 'inline-flex', animation: 'none' }}>Close</button>
          </div>
          <ul>
            {NAV.map((n, i) => (
              <li key={n.to} style={{ overflow: 'hidden' }}><Link to={n.to} onClick={() => setOpen(false)} style={{ display: 'flex' }}><small>{String(i + 1).padStart(2, '0')}</small>{n.label}</Link></li>
            ))}
          </ul>
          <p className="mnav-foot">Dheeraj Panthangi · Portfolio</p>
        </div>
      )}
    </>
  );
}

export function Footer() {
  const { content } = useContent();
  const ch = content.site.channels.filter((c) => c.enabled && c.value);
  const email = ch.find((c) => c.key === 'email');
  const others = ch.filter((c) => c.key !== 'email');
  return (
    <footer className="footer" id="contact">
      <div className="wrap">
        <div className="foot-grid">
          <div>
            <p className="foot-sig" data-m="write" aria-label="Dheeraj Panthangi"><CursiveWord word="Dheeraj" /><CursiveWord word="Panthangi" /></p>
            <p className="foot-line" data-m="fade">Open to internships, freelance projects and collaborations worth building.</p>
          </div>
          <div className="foot-cols" data-m="stagger" data-stagger="0.08">
            {email && (
              <div><h3>Contact</h3><ul><li><a className="ulink" href={channelHref('email', email.value)}>{email.value}</a></li></ul></div>
            )}
            {others.length > 0 && (
              <div><h3>Elsewhere</h3><ul>{others.map((c) => (
                <li key={c.key}><a className="ulink" href={c.value} target="_blank" rel="noopener noreferrer">{c.label} ↗</a></li>
              ))}</ul></div>
            )}
            <div><h3>Pages</h3><ul>{NAV.slice(1).map((n) => <li key={n.to}><Link className="ulink" to={n.to}>{n.label}</Link></li>)}</ul></div>
            <a className="totop" href="#top" aria-label="Back to top" onClick={(e) => { e.preventDefault(); scrollToTarget(0); }}><Arrow dir="up" /></a>
          </div>
        </div>
        <div className="foot-bar">
          <span>© {new Date().getFullYear()} Dheeraj Panthangi</span>
          <MotionSwitch />
        </div>
      </div>
    </footer>
  );
}

/** Footer switch: animations follow the system setting by default; this lets a visitor turn the full motion on or off. */
function MotionSwitch() {
  const reduced = prefersReducedMotion();
  const fromSystem = currentMotionMode() === 'auto' && osReducesMotion();
  return (
    <button type="button" className="motion-switch" aria-pressed={!reduced}
      title={fromSystem ? 'Your device asks for reduced motion, so animations are simplified. Click to play the full animations.' : 'Switch the site animations on or off'}
      onClick={() => setMotionMode(reduced ? 'full' : 'reduced')}>
      <i aria-hidden="true" />Animations: {reduced ? 'simplified' : 'full'}{reduced ? ' — play full' : ''}
    </button>
  );
}
