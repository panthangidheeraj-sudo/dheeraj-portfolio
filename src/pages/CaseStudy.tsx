import { useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import '../styles/work.css';
import { Arrow, Footer, Nav } from '../components/Chrome';
import { isPlaceholder, pad2, useContent } from '../lib/store';
import { prefersReducedMotion, ScrollTrigger, usePageMotion } from '../lib/motion';
import { expandFrom } from '../lib/transition';
import { catLabel, Closing } from './Work';
import { projectCategories } from '../content/projects';
import NotFound from './NotFound';

export default function CaseStudy() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const root = useRef<HTMLDivElement>(null);
  const { content } = useContent();
  const list = content.projects.filter((p) => p.published).sort((a, b) => a.order - b.order);
  const i = list.findIndex((p) => p.slug === slug);
  usePageMotion(root, [slug]);

  // Sticky section index (desktop) and videos that only play while on screen.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const marks = Array.from(el.querySelectorAll<HTMLElement>('.cs-index a'));
    const secs = Array.from(el.querySelectorAll<HTMLElement>('[data-sec]'));
    const sts = secs.map((s, k) => ScrollTrigger.create({
      trigger: s, start: 'top 55%', end: 'bottom 55%',
      onToggle: (self) => { if (self.isActive) marks.forEach((m, j) => m.classList.toggle('on', j === k)); }
    }));
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      const v = e.target as HTMLVideoElement;
      if (e.isIntersecting && !prefersReducedMotion()) v.play().catch(() => {}); else v.pause();
    }), { threshold: 0.4 });
    el.querySelectorAll('video').forEach((v) => io.observe(v));
    return () => { sts.forEach((s) => s.kill()); io.disconnect(); };
  }, [slug]);

  if (i < 0) return <NotFound />;
  const p = list[i];
  const n = list.length;
  const prev = list[(i - 1 + n) % n];
  const next = list[(i + 1) % n];
  const rkey = p.ratio === '16:9' ? '169' : p.ratio === '9:16' ? '916' : '11';
  const sec = (num: string, t: string, v: string | undefined, ph: string) => (
    <section className="cs-sec" key={num} data-sec={num} id={'s' + num}>
      <div className="cs-head"><span className="cs-num" data-m="scramble">{num}</span><h2 className="cs-h" data-m="skew">{t}</h2></div>
      <p className={'cs-body' + (isPlaceholder(v) ? ' is-ph' : '')} data-m="fade">{v || ph}</p>
    </section>
  );
  const go = (e: React.MouseEvent<HTMLAnchorElement>, to: string, cover: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || prefersReducedMotion()) return;
    e.preventDefault();
    expandFrom(e.currentTarget.querySelector('.pn-thumb') || e.currentTarget, { image: cover }).then(() => navigate(`/work/${to}`));
  };
  const INDEX: [string, string][] = [['01', 'Overview'], ['02', 'Problem'], ['03', 'Approach'], ['04', 'Technologies'], ['05', 'Contribution'], ['06', 'Architecture'], ['07', 'Media'], ['08', 'Challenges'], ['09', 'Outcomes']];
  const cats = p.categories.length ? p.categories.map((k) => projectCategories.find((c) => c.key === k)?.label) : ['[Category]'];

  return (
    <div className="dp pg-work" id="top" ref={root}>
      <Nav />
      <nav className="cs-index" aria-label="Case study sections">
        {INDEX.map(([k, l]) => <a key={k} href={'#s' + k}><b>{k}</b><span>{l}</span></a>)}
      </nav>
      <main className="case" aria-labelledby="case-title">
        <div className="wrap-wide">
          <div className="case-top">
            <button className="back" type="button" onClick={() => navigate('/work')}><Arrow dir="left" />All work</button>
            <span className="case-idx">Project {pad2(i + 1)} / {pad2(n)}</span>
          </div>
          <div className="case-cats" data-m="stagger">{cats.map((c) => <span key={c}>{c}</span>)}</div>
          <h1 className="case-title" id="case-title" data-m="flip" data-delay="0.15">{p.title}</h1>
          <p className="case-lede" data-m="fade" data-delay="0.45">{p.short}</p>
          <div className={'case-hero r-' + rkey}>
            <figure style={{ aspectRatio: p.ratio.replace(':', ' / ') }} data-m="block" data-delay="0.35"><img src={p.cover} alt={p.alt} /></figure>
            <div className="hero-note rv">
              <p className="label"><b>{p.ratio}</b> Cover</p>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#A39D92' }}>Replace the generated cover with a real screenshot or video at any of 9:16, 1:1 or 16:9.</p>
            </div>
          </div>
          <dl className="facts" data-m="slide">
            <div className="fact"><dt>Category</dt><dd>{catLabel(p)}</dd></div>
            <div className="fact"><dt>Technologies</dt><dd>{p.tech.join(', ')}</dd></div>
            <div className="fact"><dt>My role</dt><dd className={p.role ? '' : 'ph'}>{p.role || '[Your role]'}</dd></div>
            <div className="fact"><dt>Links</dt><dd>
              {p.links.github && <a className="ulink" href={p.links.github} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
              {p.links.live && <a className="ulink" href={p.links.live} target="_blank" rel="noopener noreferrer">Live project ↗</a>}
              {!p.links.github && !p.links.live && <span className="ph">[Add GitHub / live links]</span>}
            </dd></div>
          </dl>
          {sec('01', 'Overview', p.overview, '[Overview]')}
          {sec('02', 'Problem statement', p.cs.problem, '[What problem does this solve, and for whom?]')}
          {sec('03', 'Concept & approach', p.cs.approach, '[The idea, and how you approached building it.]')}
          <section className="cs-sec" data-sec="04" id="s04">
            <div className="cs-head"><span className="cs-num" data-m="scramble">04</span><h2 className="cs-h" data-m="skew">Technologies used</h2></div>
            <div className="tech" data-m="deal">{p.tech.map((t) => <span key={t}>{t}</span>)}</div>
          </section>
          {sec('05', 'My contribution', p.role, '[What you personally designed, built or led.]')}
          {sec('06', 'Architecture & implementation', p.cs.architecture, '[How it is put together — stack, services, data flow.]')}
          <section className="media" aria-label="Screenshots and media" data-sec="07" id="s07">
            <div className="cs-head"><span className="cs-num" data-m="scramble">07</span><h2 className="cs-h" data-m="skew">Screenshots &amp; media</h2></div>
            {p.media.length ? p.media.map((m, k) => (
              <figure key={k} className={'mframe ' + (m.ratio === '16:9' ? 'm-wide' : m.ratio === '9:16' ? 'm-tall' : 'm-sq')} style={{ aspectRatio: m.ratio.replace(':', ' / ') }} data-m="iris">
                {m.kind === 'video' ? <video src={m.src} controls muted playsInline loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src={m.src} alt={`${p.title} screenshot ${k + 1}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </figure>
            )) : (
              <>
                <figure className="mframe m-wide" data-m="iris"><span>[Screenshot or video · 16:9]</span></figure>
                <figure className="mframe m-tall" data-m="iris"><span>[Mobile screen · 9:16]</span></figure>
                <figure className="mframe m-sq" data-m="iris"><span>[Detail shot · any ratio]</span></figure>
              </>
            )}
          </section>
          {sec('08', 'Challenges & solutions', p.cs.challenges, '[The hardest problems you hit, and how you solved them.]')}
          {sec('09', 'Outcomes & learnings', p.cs.outcomes, '[What came of it, and what you would do differently.]')}
        </div>
        <nav className="pn" aria-label="More projects" data-m="stagger" data-stagger="0.1">
          <Link className="pn-btn" data-transition="custom" data-cursor="Previous" to={`/work/${prev.slug}`} onClick={(e) => go(e, prev.slug, prev.cover)}>
            <span className="pn-thumb"><img src={prev.cover} alt="" loading="lazy" /></span>
            <span className="pn-txt"><small>← Previous project</small><b>{prev.title}</b></span>
          </Link>
          <Link className="pn-btn next" data-transition="custom" data-cursor="Next" to={`/work/${next.slug}`} onClick={(e) => go(e, next.slug, next.cover)}>
            <span className="pn-thumb"><img src={next.cover} alt="" loading="lazy" /></span>
            <span className="pn-txt"><small>Next project →</small><b>{next.title}</b></span>
          </Link>
        </nav>
      </main>
      <Closing />
      <Footer />
    </div>
  );
}
