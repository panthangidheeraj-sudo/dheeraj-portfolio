import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { Arrow, Footer, Nav } from '../components/Chrome';
import FlexCarousel from '../components/reactbits/FlexCarousel';
import Cubes from '../components/reactbits/Cubes';
import { useContent } from '../lib/store';
import { entranceWait, gsap, ScrollTrigger, isPhone, prefersReducedMotion, scrambleIn, usePageMotion } from '../lib/motion';
import { CursiveWord, finishWrite, primeWrite, writeOn } from '../components/Cursive';
import { expandFrom, whenIntroDone } from '../lib/transition';

const SKILLS = ['Python', 'Java', 'C', 'TypeScript', 'React', 'Supabase', 'Firebase', 'Web Design', 'Trading Systems', 'IPO Research', 'AI', 'Marketing', 'Content Development'];

const DOORS = [
  { to: '/work', n: 'I', name: 'My Work', desc: 'Projects & builds', frame: '', leaves: 'single-split' },
  { to: '/achievements', n: 'II', name: 'Achievements', desc: 'Hackathons & recognition', frame: 'arch', leaves: 'double' },
  { to: '/offer', n: 'III', name: 'What I Offer', desc: 'Services for clients', frame: '', leaves: 'double-transom' },
  { to: '/contact', n: 'IV', name: 'Contact Me', desc: 'Start a conversation', frame: 'arch', leaves: 'single-knob' }
];

export default function Home() {
  const root = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLElement>(null);
  const { content } = useContent();
  const navigate = useNavigate();
  const myselfRef = useRef<SVGSVGElement>(null);
  const firstRef = useRef<SVGSVGElement>(null);
  const lastRef = useRef<SVGSVGElement>(null);
  const workRef = useRef<HTMLElement>(null);
  const [showCarousel, setShowCarousel] = useState(false);
  usePageMotion(root);

  // Hero: "Myself →" and the name write themselves in script, then the details settle in.
  useLayoutEffect(() => {
    const el = root.current;
    const words = [myselfRef.current, firstRef.current, lastRef.current];
    if (!el) return;
    if (prefersReducedMotion()) { words.forEach(finishWrite); return; }
    const arrow = el.querySelector<SVGPathElement>('.sig .arrow path');
    const later = el.querySelectorAll('.hero-meta, .scroll-cue');
    words.forEach(primeWrite);
    gsap.set(arrow, { strokeDasharray: 160, strokeDashoffset: 160 });
    gsap.set(later, { autoAlpha: 0, y: 16 });
    let tl: gsap.core.Timeline | null = null;
    let cancelled = false;
    whenIntroDone().then(() => {
      if (cancelled) return;
      tl = gsap.timeline({ delay: 0.8 + entranceWait() })
        .add(writeOn(myselfRef.current, 3300))
        .to(arrow, { strokeDashoffset: 0, duration: 0.55, ease: 'power2.inOut' }, '-=0.1')
        .add(writeOn(firstRef.current, 2900), '-=0.2')
        .add(writeOn(lastRef.current, 2900), '-=0.05')
        .add(() => { const meta = el.querySelector<HTMLElement>('.hero-meta'); if (meta) { gsap.set(meta, { y: 0 }); scrambleIn(meta, 1.1); } }, '-=0.6')
        .to(el.querySelector('.scroll-cue'), { autoAlpha: 1, y: 0, duration: 0.8, ease: 'power3.out', clearProps: 'transform' }, '<0.4');
    });
    return () => { cancelled = true; tl?.kill(); };
  }, []);

  // Hero exit: the photograph folds into a rounded card and dims while the name splits apart; doors follow the pointer.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const hero = el.querySelector<HTMLElement>('.hero');
      if (hero) {
        const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: 0.5 };
        gsap.fromTo(hero, { clipPath: 'inset(0% 0% 0% 0% round 0px)' }, { clipPath: isPhone() ? 'inset(0% 3% 12% 3% round 18px)' : 'inset(0% 4% 16% 4% round 28px)', ease: 'none', scrollTrigger: st });
        gsap.to(el.querySelector('.hero-shade'), { opacity: 1, ease: 'none', scrollTrigger: st });
        const [first, last] = Array.from(el.querySelectorAll<HTMLElement>('.name .cw'));
        if (first && last) {
          gsap.to(first, { xPercent: -18, ease: 'none', scrollTrigger: st });
          gsap.to(last, { xPercent: 14, ease: 'none', scrollTrigger: st });
        }
        gsap.to(el.querySelector('.sig'), { y: -40, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '40% top' } });
      }
      // about: frame corners slide in from outside the frame
      const corners = el.querySelectorAll('.about-figure .corner');
      if (corners.length) {
        gsap.set(corners, { opacity: 0, x: (i: number) => (i % 2 ? 26 : -26), y: (i: number) => (i < 2 ? -26 : 26) });
        ScrollTrigger.create({ trigger: el.querySelector('.about-figure'), start: 'top 75%', once: true,
          onEnter: () => { gsap.to(corners, { opacity: 1, x: 0, y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.08, delay: 0.3 }); } });
      }
    }, el);
    // doors lean toward the pointer, their shadows and floor light shift away from it
    const hall = el.querySelector<HTMLElement>('.hall');
    const doors = Array.from(el.querySelectorAll<HTMLElement>('.door'));
    const fine = window.matchMedia('(pointer: fine)').matches;
    const onMove = (e: PointerEvent) => {
      doors.forEach((d) => {
        const r = d.getBoundingClientRect();
        const px = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.5));
        const py = gsap.utils.clamp(-1, 1, (e.clientY - (r.top + r.height / 2)) / (window.innerHeight * 0.6));
        gsap.to(d, { '--px': px, '--py': py, duration: 0.8, ease: 'power3.out', overwrite: 'auto' });
      });
    };
    const onLeave = () => gsap.to(doors, { '--px': 0, '--py': 0, duration: 1.2, ease: 'power3.out', overwrite: 'auto' });
    if (hall && fine) { hall.addEventListener('pointermove', onMove); hall.addEventListener('pointerleave', onLeave); }
    return () => { ctx.revert(); if (hall) { hall.removeEventListener('pointermove', onMove); hall.removeEventListener('pointerleave', onLeave); } };
  }, []);

  // Selected work: mount the carousel as it approaches, so its rise intro plays in view.
  useEffect(() => {
    const el = workRef.current;
    if (!el || showCarousel) return;
    const io = new IntersectionObserver((e) => { if (e.some((x) => x.isIntersecting)) { setShowCarousel(true); io.disconnect(); } }, { rootMargin: '0px 0px -25% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [showCarousel]);

  // Toolkit marquee: speeds up with scroll speed, leans into it, and reverses when scrolling up (desktop).
  useEffect(() => {
    const track = root.current?.querySelector<HTMLElement>('.skills .track');
    if (!track || prefersReducedMotion() || isPhone()) return;
    track.style.animation = 'none';
    const loop = gsap.to(track, { xPercent: -50, duration: 60, ease: 'none', repeat: -1 });
    const lean = gsap.quickTo(track, 'skewX', { duration: 0.5, ease: 'power3.out' });
    let dir = 1;
    let settle: gsap.core.Tween | null = null;
    const st = ScrollTrigger.create({
      trigger: track, start: 'top bottom', end: 'bottom top',
      onUpdate(self) {
        const v = self.getVelocity();
        if (self.direction !== dir) dir = self.direction;
        loop.timeScale(dir * (1 + Math.min(Math.abs(v) / 300, 6)));
        lean(gsap.utils.clamp(-6, 6, -v / 220));
        settle?.kill();
        settle = gsap.delayedCall(0.2, () => { gsap.to(loop, { timeScale: dir, duration: 0.8, overwrite: true }); lean(0); });
      }
    });
    const hover = () => gsap.to(loop, { timeScale: dir * 3.2, duration: 0.6, ease: 'power2.out', overwrite: true }), leave = () => gsap.to(loop, { timeScale: dir, duration: 1, ease: 'power2.out', overwrite: true });
    track.addEventListener('mouseenter', hover); track.addEventListener('mouseleave', leave);
    return () => { settle?.kill(); st.kill(); loop.kill(); gsap.set(track, { clearProps: 'all' }); track.removeEventListener('mouseenter', hover); track.removeEventListener('mouseleave', leave); };
  }, []);

  const featured = useMemo(
    () => content.projects.filter((p) => p.published && p.featured && p.title.charAt(0) !== '[').sort((a, b) => a.order - b.order),
    [content.projects]
  );
  const items = useMemo(() => featured.map((p) => ({ src: p.cover, alt: p.alt, title: p.title, subtitle: p.short.replace(/\.$/, '') })), [featured]);
  const [active, setActive] = useState(0);
  const cur = featured[active] || featured[0];
  const firstActive = useRef(true);
  useEffect(() => {
    if (firstActive.current) { firstActive.current = false; return; }
    const d = root.current?.querySelector('.work-detail');
    if (!d || prefersReducedMotion()) return;
    const tl = gsap.timeline();
    tl.fromTo(d.querySelector('h3'), { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' })
      .fromTo(d.querySelector('.feat-desc'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.5 }, 0.08)
      .fromTo(d.querySelectorAll('.tags span'), { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.4, stagger: 0.05 }, 0.15);
    return () => { tl.progress(1).kill(); };
  }, [active]);

  const openDoor = (e: React.MouseEvent<HTMLAnchorElement>, to: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || prefersReducedMotion()) return;
    e.preventDefault();
    const door = e.currentTarget;
    door.classList.add('is-opening');
    const opening = door.querySelector('.opening') || door;
    expandFrom(opening, { background: 'radial-gradient(120% 90% at 50% 40%, #3a2f1f 0%, #16130f 45%, #0E0E0D 100%)' }).then(() => navigate(to));
  };

  return (
    <div className="dp pg-home" id="top" ref={root}>
      <header className="hero" aria-label="Introduction">
        <div className="hero-layer hero-bg" data-scrub="hero-bg"><img src="/media/home/hero.jpg" alt="" width={1536} height={1024} /></div>
        <div className="hero-glow" />
        <div className="hero-layer hero-subj" data-scrub="hero-subj"><img src="/media/home/subject.webp" alt="Dheeraj Panthangi standing by the sea, leaning against a lamp post" width={1536} height={1024} /></div>
        <div className="hero-shade" />
        <Nav />
        <div className="hero-copy">
          <div className="hero-copy-in" data-scrub="hero-type">
            <div className="sig" aria-hidden="true">
              <CursiveWord word="Myself" ref={myselfRef} />
              <svg className="arrow" viewBox="0 0 104 26" fill="none"><path d="M2 15 C 24 11, 52 17, 72 13 S 92 11, 99 12 M86 3 C 90 7, 95 10, 99 12 C 94 15, 90 19, 87 23" stroke="#C8B38A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <h1 className="name">
              <span className="sr-only">Dheeraj Panthangi</span>
              <CursiveWord word="Dheeraj" ref={firstRef} />
              <CursiveWord word="Panthangi" ref={lastRef} />
            </h1>
            <div className="hero-meta"><span>Engineering Student</span><span>Software · Markets · Design</span><span>India</span></div>
          </div>
        </div>
        <a className="scroll-cue" href="#about" aria-label="Scroll to About"><span className="t">Scroll</span><span className="rail" /></a>
      </header>

      <section className="about" id="about" ref={aboutRef} aria-labelledby="about-h">
        <div className="about-bg" aria-hidden="true" data-m="glow">
          <Cubes gridSize={10} faceColor="#120F17" edgeColor="#ffffff" maxAngle={45} radius={3} rippleTarget={aboutRef} />
          <div className="about-veil" />
        </div>
        <div className="wrap">
          <div className="about-grid">
            <div className="about-copy">
              <p className="label" data-m="scramble" style={{ margin: 0 }}><b>01</b> About me</p>
              <h2 className="h2" data-m="wordrise" id="about-h">Between code, markets <em>&amp; design.</em></h2>
              <p className="lede" data-m="words">I’m Dheeraj Panthangi — a second-year B.Tech student in Computer Science (CSE Core) at GITAM.</p>
              <p className="body" data-m="rise">I’ve designed and developed websites for local businesses and clients, built systematic trading systems and IPO research frameworks, and shipped software for hackathons and personal projects. Alongside the engineering, I work on content, marketing, design and AI.</p>
              <dl className="facts" data-m="slide">
                <div className="fact"><dt>Studying</dt><dd>B.Tech, CSE Core<small>GITAM · 2nd year</small></dd></div>
                <div className="fact"><dt>Building</dt><dd>Websites, trading systems &amp; AI<small>Freelance and personal projects</small></dd></div>
                <div className="fact"><dt>Hackathons</dt><dd>Tech Zephyr 4.0 &amp; Google WowFest<small>IIT Bhubaneswar · and many more, counting</small></dd></div>
                <div className="fact"><dt>Beyond code</dt><dd>Content, marketing &amp; design<small>Research and creative work</small></dd></div>
              </dl>
              <p className="quote" data-m="rise">Do what you like and always do it right.</p>
            </div>
            <figure className="about-figure">
              <span className="corner tl" aria-hidden="true" /><span className="corner tr" aria-hidden="true" /><span className="corner bl" aria-hidden="true" /><span className="corner br" aria-hidden="true" />
              <div className="frame" data-m="diag"><div className="portrait"><img src="/media/home/portrait.jpg" alt="Portrait of Dheeraj Panthangi outdoors, with the sea behind him" loading="lazy" data-speed="0.25" /></div></div>
              <figcaption className="figcap" data-m="scramble"><span>Fig. 01 — Portrait</span><span>Rushikondha, 2025</span></figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="skills" aria-labelledby="skills-h">
        <div className="wrap"><p className="label" data-m="scramble" id="skills-h" style={{ margin: 0 }}><b>02</b> Toolkit</p></div>
        <div className="marquee" aria-hidden="true">
          <div className="track">
            {[0, 1].map((k) => <ul key={k}>{SKILLS.map((s) => <li key={s}>{s}</li>)}</ul>)}
          </div>
        </div>
        <div className="wrap">
          <div className="skill-index">
            <div><h3 data-m="scramble">Human languages</h3><p data-m="rise">Telugu<br />English<br />Hindi</p></div>
            <div><h3 data-m="scramble" data-delay="0.08">Computer languages</h3><p data-m="rise" data-delay="0.08">C<br />Python<br />Java<br />TypeScript<br />JSON</p></div>
            <div><h3 data-m="scramble" data-delay="0.16">Frameworks</h3><p data-m="rise" data-delay="0.16">Render<br />Supabase<br />Firebase<br />Netlify</p></div>
            <div><h3 data-m="scramble" data-delay="0.24">Tools</h3><p data-m="rise" data-delay="0.24">Figma<br />Obsidian<br />Google AI Studio<br />Google Antigravity<br />Claude Pro</p></div>
            <div><h3 data-m="scramble" data-delay="0.32">Practice</h3><p data-m="rise" data-delay="0.32">Web design &amp; development<br />Systematic trading<br />IPO research · AI work<br />Marketing<br />Content development</p></div>
          </div>
        </div>
      </section>

      <section className="work" id="work" ref={workRef} aria-labelledby="work-h">
        <div className="wrap">
          <div className="work-head">
            <div>
              <p className="label" data-m="scramble" style={{ margin: 0 }}><b>03</b> Selected work</p>
              <h2 className="h2" data-m="skew" id="work-h">Things I’ve <em>built.</em></h2>
            </div>
            <p className="work-hint" data-m="scramble">Drag, swipe or use the arrow keys<br />Click a project to bring it forward</p>
          </div>
        </div>
        <div className="fc-stage" data-cursor="Drag">
          {showCarousel && items.length > 0 && (
            <FlexCarousel items={items} preset="liquid" intro="rise" cardHeight={0.5} gap={12} squeeze={0.2} focusOnClick captions
              captureWheel={false} drift={64} hoverDrift={0.3} driftResume={2.2} onChange={(i: number) => setActive(i)} ariaLabel="Selected projects" />
          )}
        </div>
        {cur && (
          <div className="wrap">
            <div className="work-detail" data-m="fade">
              <div>
                <h3>{String(active + 1).padStart(2, '0')} — {cur.title}</h3>
                <p className="feat-desc">{cur.overview}</p>
                <div className="tags">{cur.tech.filter((t) => t.charAt(0) !== '[').slice(0, 4).map((t) => <span key={t}>{t}</span>)}</div>
              </div>
              <div className="ctas">
                <Link className="cta-main" to={`/work/${cur.slug}`}>View project <Arrow /></Link>
                {cur.links.github && <a className="ulink" href={cur.links.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="doors" id="doors" aria-labelledby="doors-h">
        <div className="wrap">
          <div className="doors-head">
            <p className="label" data-m="scramble" style={{ margin: 0 }}><b>04</b> Enter</p>
            <h2 className="h2" data-m="blur" id="doors-h">Four doors. <em>Choose one.</em></h2>
            <p className="rv">Each one opens onto a different part of my work.</p>
          </div>
          <div className="hall">
            <div className="door-row">
              {DOORS.map((d, i) => (
                <Link key={d.to} className="door" data-transition="custom" data-cursor="Enter" to={d.to} aria-label={`${d.name} — ${d.desc}`} onClick={(e) => openDoor(e, d.to)}
                  data-m="tilt" data-origin="bottom" data-delay={(i * 0.14).toFixed(2)}>
                  <div className={'door-frame' + (d.frame ? ' ' + d.frame : '')}>
                    <div className="opening">
                      {d.leaves === 'double-transom' && <div className="transom" />}
                      {d.leaves.startsWith('single') ? (
                        <div className="leaf single">
                          {d.leaves === 'single-split' ? <><span className="inset split" /><span className="inset" /><span className="pull" /></> : <><span className="inset" /><span className="knob" /></>}
                        </div>
                      ) : (
                        <>
                          <div className="leaf l"><span className="inset" /><span className="pull" /></div>
                          <div className="leaf r"><span className="inset" /><span className="pull" /></div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="door-spill" />
                  <div className="door-meta"><span className="door-num">{d.n}</span><span className="door-name">{d.name}</span><span className="door-desc">{d.desc}</span></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
