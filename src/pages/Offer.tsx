import { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/offer.css';
import { Arrow, Footer, Nav } from '../components/Chrome';
import EnquiryForm from '../components/EnquiryForm';
import Modal from '../components/Modal';
import { channelDisplay, channelHref, pad2, useContent } from '../lib/store';
import { gsap, horizontalScrollScene, isPhone, prefersReducedMotion, ScrollTrigger, SplitText, useMedia, usePageMotion } from '../lib/motion';
import BlueprintArt from '../components/BlueprintArt';
import { priceLabel } from '../content/services';
import type { Service } from '../content/types';

export default function Offer() {
  const root = useRef<HTMLDivElement>(null);
  const { content } = useContent();
  const [openPkg, setOpenPkg] = useState(-1);
  const [detail, setDetail] = useState(-1);
  const [enq, setEnq] = useState<null | { service: string; scale: string }>(null);
  const touch = useMedia('(hover: none)');
  usePageMotion(root);

  // Signature moment: the web blueprints draw themselves; plus the AI prompt typing and the hiring rail drift.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      el.querySelectorAll<HTMLElement>('.bp').forEach((bp, k) => {
        const edges = bp.querySelectorAll('.bp-draw i');
        const parts = bp.querySelectorAll('.bp-n, .bp-name > *, .bp-price > *, .bp-plus');
        const border = getComputedStyle(bp).borderTopColor;
        gsap.set(bp, { borderColor: 'transparent' });
        gsap.set(edges, { autoAlpha: 1, scaleX: (i: number) => (i % 2 ? 1 : 0), scaleY: (i: number) => (i % 2 ? 0 : 1) });
        gsap.set(parts, { autoAlpha: 0, y: 18 });
        const tl = gsap.timeline({ paused: true, delay: k * 0.15 });
        tl.to(edges, { scaleX: 1, scaleY: 1, duration: 0.42, ease: 'power2.inOut', stagger: 0.32 })
          .add(() => bp.classList.add('is-drawn'), 0.3)
          .to(parts, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, clearProps: 'transform' }, 0.6)
          .set(bp, { borderColor: border })
          .to(edges, { autoAlpha: 0, duration: 0.6 }, '-=0.1')
          .add(() => gsap.set(bp, { clearProps: 'borderColor' }));
        ScrollTrigger.create({ trigger: bp, start: 'top 85%', once: true, onEnter: () => { tl.play(); } });
      });
      const prompt = el.querySelector<HTMLElement>('.bubble.me');
      if (prompt) {
        const split = SplitText.create(prompt, { type: 'chars' });
        gsap.set(split.chars, { autoAlpha: 0 });
        const reply = el.querySelector('.bubble:not(.me)');
        gsap.set(reply, { autoAlpha: 0, y: 8 });
        ScrollTrigger.create({ trigger: prompt, start: 'top 85%', once: true, onEnter: () => {
          gsap.timeline({ delay: 0.6 })
            .to(split.chars, { autoAlpha: 1, duration: 0.01, stagger: 0.045, ease: 'none' })
            .to(reply, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '+=0.35');
        } });
      }
      // Web development: the three scales become one pinned sequence beside a blueprint that redraws itself.
      const stage = el.querySelector<HTMLElement>('.bp-stage');
      const art = stage?.querySelector<SVGSVGElement>('.bp-art');
      if (stage && art && window.matchMedia('(min-width: 1024px)').matches) {
        const lay = (k: string) => art.querySelector(`.lay-${k}`) as SVGGElement;
        const lines = (k: string) => lay(k).querySelectorAll<SVGGeometryElement>('.bl');
        const texts = (k: string) => lay(k).querySelectorAll('text');
        art.querySelectorAll<SVGGeometryElement>('.bl').forEach((l) => { const L = l.getTotalLength ? l.getTotalLength() : 400; gsap.set(l, { strokeDasharray: L, strokeDashoffset: L }); });
        gsap.set(art.querySelectorAll('.lay text'), { opacity: 0 });
        const cards = Array.from(stage.querySelectorAll<HTMLElement>('.bp'));
        const setActive = (i: number) => cards.forEach((c, j) => c.classList.toggle('is-active', i === j));
        stage.classList.add('is-scene');
        setActive(0);
        gsap.timeline({ scrollTrigger: { trigger: stage, start: 'center center', end: '+=230%', pin: true, scrub: 0.7, refreshPriority: 2, onUpdate: (st) => setActive(st.progress < 0.36 ? 0 : st.progress < 0.68 ? 1 : 2) } })
          .to(lines('s'), { strokeDashoffset: 0, duration: 1, stagger: 0.05, ease: 'none' })
          .to(texts('s'), { opacity: 1, duration: 0.3 }, '-=0.4')
          .to({}, { duration: 0.5 })
          .to(lay('s'), { opacity: 0, scale: 0.4, x: 120, y: -150, transformOrigin: '50% 50%', duration: 0.7, ease: 'power2.in' })
          .set(lay('m'), { opacity: 1 })
          .to(lines('m'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.03, ease: 'none' }, '-=0.2')
          .to(texts('m'), { opacity: 1, duration: 0.3, stagger: 0.05 }, '-=0.6')
          .to({}, { duration: 0.5 })
          .to(lay('m'), { opacity: 0, scale: 0.75, transformOrigin: '50% 50%', duration: 0.6, ease: 'power2.in' })
          .set(lay('l'), { opacity: 1 })
          .from(lay('l').querySelectorAll('.bl-box'), { y: 46, opacity: 0, duration: 0.8, stagger: 0.07, ease: 'power3.out' }, '-=0.1')
          .to(lines('l'), { strokeDashoffset: 0, duration: 1.2, stagger: 0.02, ease: 'none' }, '<')
          .to(texts('l'), { opacity: 1, duration: 0.3, stagger: 0.03 }, '-=0.5')
          .to({}, { duration: 0.4 });
      }

      // Direct hiring: the bench pins and the tasks slide past; each moves from requested → in progress → done.
      const rail = el.querySelector<HTMLElement>('.bench-rail');
      const bench = rail?.parentElement as HTMLElement | undefined;
      if (rail && bench) {
        gsap.from(rail.children, { x: 60, autoAlpha: 0, duration: 0.8, ease: 'power3.out', stagger: 0.06, scrollTrigger: { trigger: rail, start: 'top 85%', once: true } });
        const tasks = Array.from(rail.querySelectorAll<HTMLElement>('.task'));
        const states: [string, string][] = [['request', 'Requested'], ['progress', 'In progress'], ['done', 'Done']];
        const update = () => {
          const b = bench.getBoundingClientRect();
          tasks.forEach((t) => {
            const r = t.getBoundingClientRect();
            const c = (r.left + r.width / 2 - b.left) / b.width;
            const k = c > 0.62 ? 0 : c > 0.3 ? 1 : 2;
            if (t.dataset.state !== states[k][0]) { t.dataset.state = states[k][0]; const st = t.querySelector('.st'); if (st) st.textContent = states[k][1]; }
          });
        };
        if (horizontalScrollScene(bench, rail, { onUpdate: update })) { bench.classList.add('is-scene'); update(); }
      }

      // Marketing: the word strip is driven by the scroll; the campaign timeline fills stage by stage.
      const mkTrack = el.querySelector<HTMLElement>('.mk-track');
      if (mkTrack) {
        mkTrack.style.animation = 'none';
        gsap.fromTo(mkTrack, { xPercent: 0 }, { xPercent: -32, ease: 'none', scrollTrigger: { trigger: mkTrack, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
      }
      const tlEl = el.querySelector<HTMLElement>('.mk-timeline');
      if (tlEl) {
        const stagesEls = Array.from(tlEl.querySelectorAll('li'));
        gsap.fromTo(tlEl.querySelector('.mk-line'), { scaleX: 0 }, { scaleX: 1, ease: 'none', scrollTrigger: { trigger: tlEl, start: 'top 88%', end: 'top 40%', scrub: 0.5,
          onUpdate: (st) => stagesEls.forEach((li, i) => li.classList.toggle('on', st.progress >= i / (stagesEls.length - 1) - 0.02)) } });
      }

      // AI: the interface leans back into place as you scroll, and data packets travel along the workflow.
      const aiStage = el.querySelector('.ai-stage');
      if (aiStage && !isPhone()) gsap.fromTo(aiStage, { rotateX: 16, y: 60, transformPerspective: 1600, transformOrigin: '50% 100%' }, { rotateX: 0, y: 0, ease: 'none', scrollTrigger: { trigger: aiStage, start: 'top bottom', end: 'center 55%', scrub: 0.6 } });
      const flowPaths = Array.from(el.querySelectorAll<SVGPathElement>('.flow svg path'));
      el.querySelectorAll<SVGCircleElement>('.flow .pkt').forEach((c, i) => {
        const path = flowPaths[i % flowPaths.length];
        if (!path) return;
        gsap.to(c, { motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }, duration: 2.6 + i * 0.6, delay: i * 0.7, ease: 'power1.inOut', repeat: -1, repeatDelay: 0.4,
          scrollTrigger: { trigger: path.closest('.flow'), start: 'top bottom', end: 'bottom top', toggleActions: 'play pause resume pause' } });
      });

      // Custom projects: the heading swells as you pass, the orbit draws itself, the light grows.
      const cus = el.querySelector<HTMLElement>('.custom');
      if (cus) {
        const h = cus.querySelector('h2');
        if (h) gsap.fromTo(h, { scale: 0.84 }, { scale: 1.06, ease: 'none', scrollTrigger: { trigger: cus, start: 'top bottom', end: 'bottom top', scrub: 0.6 } });
        const rings = cus.querySelectorAll<SVGEllipseElement>('.orbit .ol');
        rings.forEach((r) => { const L = r.getTotalLength(); gsap.set(r, { strokeDasharray: L, strokeDashoffset: L }); });
        gsap.to(rings, { strokeDashoffset: 0, duration: 2.2, ease: 'power2.inOut', stagger: 0.25, scrollTrigger: { trigger: cus, start: 'top 70%', once: true } });
        gsap.fromTo(cus.querySelector('.spot'), { opacity: 0.25, scale: 0.7 }, { opacity: 1, scale: 1.25, ease: 'none', scrollTrigger: { trigger: cus, start: 'top bottom', end: 'center center', scrub: 0.6 } });
      }

      // Hero: the lamp's warmth comes up as you begin to scroll past the desk.
      gsap.to(el.querySelector('.h-warm'), { opacity: 1, ease: 'none', scrollTrigger: { trigger: el.querySelector('.hero'), start: 'top top', end: '60% top', scrub: 0.5 } });

      // Services progress: highlights the category in view.
      const prog = el.querySelector<HTMLElement>('.svc-progress');
      if (prog) {
        const links = Array.from(prog.querySelectorAll('a'));
        const secs = links.map((a) => el.querySelector(a.getAttribute('href') || '')).filter(Boolean) as HTMLElement[];
        secs.forEach((sec, i) => ScrollTrigger.create({ trigger: sec, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => { if (st.isActive) links.forEach((a, j) => a.classList.toggle('on', j === i)); } }));
        if (secs.length) ScrollTrigger.create({ trigger: secs[0], endTrigger: secs[secs.length - 1], start: 'top 60%', end: 'bottom 40%', onToggle: (st) => prog.classList.toggle('on', st.isActive) });
      }
    }, el);
    return () => ctx.revert();
  }, []);

  const visible = content.services.filter((s) => s.visible);
  const S = (id: string) => content.services.find((s) => s.id === id) as Service | undefined;
  const num = (id: string) => pad2(visible.findIndex((s) => s.id === id) + 1);
  const openEnq = (service: string, scale = '') => { setDetail(-1); setEnq({ service, scale }); };
  const list = (arr: string[]) => arr.map((t, i) => ({ n: pad2(i + 1), t }));
  const web = S('web'), mkt = S('marketing'), ai = S('ai'), hire = S('hire'), cus = S('custom');
  const det = web && detail >= 0 ? web.packages[detail] : null;
  const ch = content.site.channels.filter((c) => c.enabled && c.value);

  return (
    <div className="dp pg-offer" id="top" ref={root}>
      <Nav />
      <header className="hero" aria-label="Work Offer">
        <div className="layer h-bg" data-scrub="hero-bg"><picture><source media="(max-width: 700px)" srcSet="/media/offer/office-mob-bg.webp" /><img src="/media/offer/office-hero-bg.webp" alt="" width={2400} height={1350} /></picture></div>
        <h1 className="h-type" aria-label="Work Offer" data-scrub="hero-type"><span className="w1" aria-hidden="true">WORK</span><span className="w2" aria-hidden="true">OFFER</span></h1>
        <div className="layer h-fg" data-scrub="hero-fg"><picture><source media="(max-width: 700px)" srcSet="/media/offer/office-mob-fg.webp" /><img src="/media/offer/office-hero-fg.webp" alt="A dark executive office: a walnut desk lit by a brass desk lamp, a leather chair, a laptop, notebook and pen" width={2400} height={1350} /></picture></div>
        <div className="h-shade" /><div className="h-warm" />
        <p className="h-sub">Independent development. Thoughtful execution. Built around your ideas.</p>
        <a className="h-cue" href="#capabilities" aria-label="Scroll to the services"><span className="rail" />Scroll</a>
      </header>

      <section className="intro" id="capabilities" aria-labelledby="intro-h">
        <div className="wrap">
          <p className="label" data-m="scramble"><b>04</b> What I can do</p>
          <h2 data-m="flip" id="intro-h">Capabilities, built around <em>your requirements.</em></h2>
          <p className="body" data-m="rise">From building websites and intelligent applications to technical problem-solving and creative digital work, I take on projects independently and work closely with clients from concept to completion.</p>
          <nav className="index" aria-label="Services" data-m="slide">{visible.map((s, i) => <a key={s.id} href={'#' + s.id}><small>{pad2(i + 1)}</small>{s.title}</a>)}</nav>
        </div>
      </section>

      {web?.visible && (
        <section className="svc" id="web" aria-labelledby="web-h">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="sec-num" data-m="scramble">{num('web')} / Web development</p><h2 className="sec-title" data-m="fill" id="web-h">{web.title}</h2></div>
              <p className="sec-desc" data-m="rise">{web.desc}</p>
            </div>
            <div className="bp-stage">
            <div className="bp-visual"><BlueprintArt /></div>
            <div className="bp-list">
              {web.packages.map((p, i) => {
                const pr = priceLabel(p);
                return (
                  <article key={p.id} className={'bp' + (openPkg === i ? ' open' : '')}>
                    <span className="bp-draw" aria-hidden="true"><i /><i /><i /><i /></span>
                    <button className="bp-head" type="button" aria-expanded={openPkg === i}
                      onClick={() => (touch ? setOpenPkg(openPkg === i ? -1 : i) : setDetail(i))}>
                      <span className="bp-n" aria-hidden="true">{pad2(i + 1)}</span>
                      <span className="bp-name"><small>Scale {pad2(i + 1)}</small><b>{p.name}</b><span>{p.desc}</span></span>
                      <span className="bp-price"><small>{pr.kicker}</small><b className={pr.soft ? 'soft' : ''} {...(pr.soft ? {} : { 'data-m': 'digits', 'data-delay': '0.9' })}>{pr.text}</b></span>
                      <span className="bp-plus" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 0v14M0 7h14" stroke="currentColor" strokeWidth="1.2" /></svg></span>
                    </button>
                    <div className="bp-more"><div>
                      <div className="bp-cols">
                        <div><h4>Included work</h4><ul>{(p.included || []).map((t) => <li key={t}>{t}</li>)}</ul></div>
                        <div><h4>Typical projects</h4><ul>{(p.examples || []).map((t) => <li key={t}>{t}</li>)}</ul></div>
                        <div className="bp-acts">
                          <button className="cta" type="button" onClick={() => openEnq('web', p.name)}>{web.cta} <Arrow /></button>
                          <button className="text-btn" type="button" onClick={() => setDetail(i)}>View full details</button>
                        </div>
                      </div>
                    </div></div>
                  </article>
                );
              })}
            </div>
            </div>
            <p className="note rv">All prices are indicative starting prices. Final quotations depend on project scope, features, complexity, and timeline.</p>
          </div>
        </section>
      )}

      {mkt?.visible && (
        <section className="svc mk" id="marketing" aria-labelledby="mk-h">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="sec-num" data-m="scramble">{num('marketing')} / Digital marketing</p><h2 className="sec-title" data-m="fill" id="mk-h">{mkt.title}</h2></div>
              <p className="sec-desc" data-m="rise">{mkt.desc}</p>
            </div>
          </div>
          <div className="wrap">
            <div className="mk-timeline" aria-label="Campaign stages"><span className="mk-line" aria-hidden="true" /><ol>{['Plan', 'Create', 'Publish', 'Coordinate', 'Review'].map((w) => <li key={w}>{w}</li>)}</ol></div>
          </div>
          <div className="mk-marq" aria-hidden="true"><div className="mk-track">{['Plan', 'Create', 'Publish', 'Coordinate', 'Review', 'Plan', 'Create', 'Publish', 'Coordinate', 'Review'].map((w, i) => <span key={i}>{w}</span>)}</div></div>
          <div className="wrap">
            <div className="mk-grid">
              <div className="mk-visual" aria-hidden="true" data-m="deal">
                <div className="post sq"><div className="art" /><span className="brand">Your brand</span><div className="cap"><i /><i /><i style={{ width: '70%' }} /></div></div>
                <div className="post st"><div className="art" /><div className="cap"><i /><i style={{ width: '50%' }} /></div></div>
                <div className="post ls"><div className="art" /><span className="brand">Launch</span><div className="cap"><i /><i style={{ width: '40%' }} /></div></div>
                <span className="mk-tag">Illustrative mockups</span>
              </div>
              <div className="mk-side"><ul className="offer-list" data-m="stagger">{list(mkt.items).map((it) => <li key={it.n}><small>{it.n}</small>{it.t}</li>)}</ul></div>
            </div>
            <div className="pk-row">{mkt.packages.map((p, i) => <div key={p.id} className="pk" data-m="tilt" data-origin="center" data-delay={(i * 0.12).toFixed(2)}><small>Package {pad2(i + 1)}</small><b>{p.name}</b><span>{p.desc}</span><em>{priceLabel(p).text}</em></div>)}</div>
            <div className="adnote">
              <p><b>Service fee vs. ad spend.</b> My fee covers planning, creative and coordination. Advertising budgets are paid directly to the platforms (Meta, Google and others) and are always separate from my charges. Results depend on many factors, so I don’t promise specific growth figures.</p>
              <button className="cta" type="button" onClick={() => openEnq('marketing')}>{mkt.cta} <Arrow /></button>
            </div>
          </div>
        </section>
      )}

      {ai?.visible && (
        <section className="svc ai" id="ai" aria-labelledby="ai-h">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="sec-num" data-m="scramble">{num('ai')} / AI &amp; software development</p><h2 className="sec-title" data-m="fill" id="ai-h">{ai.title}</h2></div>
              <p className="sec-desc" data-m="rise">{ai.desc}</p>
            </div>
            <div className="ai-stage" aria-hidden="true">
              <div className="win w-main" data-m="curtain" data-dir="middle">
                <div className="win-bar wb"><i /><i /><i /><span>workflow · illustrative</span></div>
                <div className="w-side"><span className="on">Workflows</span><span>Data sources</span><span>Agents</span><span>Integrations</span><span>Logs</span></div>
                <div className="flow">
                  <svg viewBox="0 0 600 480" preserveAspectRatio="none"><path d="M150 70 C 250 70, 230 190, 330 190" /><path d="M150 300 C 250 300, 230 200, 330 200" /><path d="M480 200 C 520 200, 520 360, 430 380" /><circle className="pkt" r="4" cx="-20" cy="-20" /><circle className="pkt" r="4" cx="-20" cy="-20" /><circle className="pkt" r="4" cx="-20" cy="-20" /></svg>
                  <div className="node" style={{ left: '4%', top: '7%' }}><small>trigger</small><b>New form submission</b></div>
                  <div className="node" style={{ left: '4%', top: '56%' }}><small>source</small><b>Database records</b></div>
                  <div className="node live" style={{ left: '52%', top: '34%' }}><small>agent</small><b>Classify &amp; summarise</b></div>
                  <div className="node" style={{ left: '46%', top: '72%' }}><small>action</small><b>Update dashboard · notify</b></div>
                </div>
              </div>
              <div className="win w-code" data-m="tilt" data-origin="center" data-delay="0.25"><div className="win-bar"><i /><i /><i /><span>pipeline.py</span></div>
                <div className="code"><span className="c"># illustrative example</span>{'\n'}<span className="k">def</span> handle(event):{'\n'}    record = db.fetch(event.id){'\n'}    summary = agent.run(<span className="s">"summarise"</span>, record){'\n'}    dashboard.update(record.id, summary){'\n'}    notify(record.owner, summary)</div>
              </div>
              <div className="win w-chat" data-m="tilt" data-origin="center" data-delay="0.45"><div className="win-bar"><i /><i /><i /><span>assistant</span></div>
                <div className="chat"><div className="bubble me">Summarise today’s new enquiries</div><div className="bubble">Working on it<span className="typing" /></div></div>
              </div>
              <span className="ai-label">Illustrative interface — not a client product</span>
            </div>
            <div className="caps" data-m="stagger" data-stagger="0.04">{list(ai.items).map((it) => <div key={it.n}><small>{it.n}</small>{it.t}</div>)}</div>
            <div className="quote-band">
              <div><h3>{ai.packages[0] ? priceLabel(ai.packages[0]).text : 'Project-based quotation'}</h3><p>{ai.pricingNote}</p></div>
              <button className="cta" type="button" onClick={() => openEnq('ai')}>{ai.cta} <Arrow /></button>
            </div>
          </div>
        </section>
      )}

      {hire?.visible && (
        <section className="svc" id="hire" aria-labelledby="hire-h">
          <div className="wrap">
            <div className="sec-head">
              <div><p className="sec-num" data-m="scramble">{num('hire')} / Direct development hiring</p><h2 className="sec-title" data-m="fill" id="hire-h">{hire.title}</h2></div>
              <p className="sec-desc" data-m="rise">{hire.desc}</p>
            </div>
          </div>
          <div className="bench" tabIndex={0} aria-label="Tasks I can take on (scrolls sideways)">
            <div className="bench-rail">{list(hire.items).map((it) => <div key={it.n} className="task" data-state="request"><small>task.{it.n}</small><b>{it.t}</b><span className="st">Requested</span></div>)}</div>
          </div>
          <div className="wrap">
            <div className="eng">{hire.packages.map((p, i) => <div key={p.id} className="eng-card rv"><span className="ltr" aria-hidden="true" data-m="flip">{i ? 'B' : 'A'}</span><small>Engagement {i ? 'B' : 'A'}</small><b>{p.name}</b><p>{p.desc}</p><em>{priceLabel(p).text}</em></div>)}</div>
            <div style={{ marginTop: 36 }}><button className="cta" type="button" onClick={() => openEnq('hire')}>{hire.cta} <Arrow /></button></div>
          </div>
        </section>
      )}

      {cus?.visible && (
        <section className="custom" id="custom" aria-labelledby="cus-h">
          <div className="spot" data-speed="0.4" /><div className="beam" /><div className="lines" />
          <svg className="orbit" viewBox="0 0 800 800" aria-hidden="true">
            <ellipse className="ol" cx="400" cy="400" rx="380" ry="150" />
            <ellipse className="ol" cx="400" cy="400" rx="300" ry="300" />
            <g className="spin"><ellipse className="ol" cx="400" cy="400" rx="380" ry="150" transform="rotate(60 400 400)" /><circle className="sat" cx="780" cy="400" r="3" /></g>
            <g className="spin rev"><ellipse className="ol" cx="400" cy="400" rx="380" ry="150" transform="rotate(-60 400 400)" /><circle className="sat" cx="400" cy="100" r="2.5" /></g>
          </svg>
          <div className="wrap">
            <p className="sec-num" data-m="scramble" style={{ position: 'relative' }}>{num('custom')} / Custom projects</p>
            <h2 data-m="skew" id="cus-h"><span>NOT ON THE LIST?</span><em>LET’S BUILD IT ANYWAY.</em></h2>
            <p className="rv">{cus.desc}</p>
            <p className="small rv">Every custom request is personally reviewed and taken on depending on feasibility, availability and requirements.</p>
            <button className="cta solid" type="button" onClick={() => openEnq('custom')}>{cus.cta} <Arrow /></button>
          </div>
        </section>
      )}

      <section className="enq-sec" id="enquiry" aria-label="Project enquiry">
        <div className="wrap">
          <div className="enq-grid">
            <div className="enq-copy">
              <p className="label" data-m="scramble"><b>06</b> Project enquiry</p>
              <h2 className="rv">Start with a conversation.</h2>
              <p className="rv">I work independently, so your enquiry comes straight to me — no account managers, no hand-offs.</p>
              <ol className="steps" data-m="slide"><li><small>01</small>You share the idea and constraints</li><li><small>02</small>I reply with questions or a quotation</li><li><small>03</small>We agree scope, timeline and price</li><li><small>04</small>I build, with check-ins along the way</li></ol>
            </div>
            <div className="enq-form"><EnquiryForm variant="inline" /></div>
          </div>
        </div>
      </section>

      <section className="final" aria-labelledby="final-h">
        <div className="wrap">
          <h2 data-m="scatter" id="final-h">GOOD IDEAS DESERVE <em>TO BE BUILT.</em></h2>
          <p className="rv">If you have a project in mind, let’s start a conversation.</p>
          <div className="final-ctas rv">
            <button className="cta solid" type="button" onClick={() => openEnq('')}>Start a project</button>
            <Link className="cta" to="/contact">Contact me</Link>
          </div>
          <div className="contacts" data-m="stagger">{ch.map((c) => <a key={c.key} className="ulink" href={channelHref(c.key, c.value)} {...(c.key !== 'email' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{c.key === 'email' ? channelDisplay(c.key, c.value) : c.label + ' ↗'}</a>)}</div>
        </div>
      </section>

      <nav className="svc-progress" aria-label="Service categories">{visible.map((sv) => <a key={sv.id} href={'#' + sv.id}><i /><span>{sv.title}</span></a>)}</nav>
      <Footer />

      {det && web && (
        <Modal label={det.name + ' details'} onClose={() => setDetail(-1)} scope="pg-offer">
          <div className="detail">
            <div className="detail-top"><p className="sec-num">Web development · Scale {pad2(detail + 1)}</p><button className="x" type="button" onClick={() => setDetail(-1)} aria-label="Close details"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" /></svg></button></div>
            <h3>{det.name}</h3>
            <p className="pr">{(() => { const pr = priceLabel(det); return (pr.soft ? '' : pr.kicker + ' ') + pr.text; })()}</p>
            <p className="lead">{det.desc}</p>
            <div className="bp-cols" style={{ margin: '28px 0 0', paddingInline: 0 }}>
              <div><h4>Included work</h4><ul>{(det.included || []).map((t) => <li key={t}>{t}</li>)}</ul></div>
              <div><h4>Typical projects</h4><ul>{(det.examples || []).map((t) => <li key={t}>{t}</li>)}</ul></div>
            </div>
            <p className="note">All prices are indicative starting prices. Final quotations depend on project scope, features, complexity, and timeline.</p>
            <div style={{ marginTop: 28 }}><button className="cta solid" type="button" onClick={() => openEnq('web', det.name)}>{web.cta}</button></div>
          </div>
        </Modal>
      )}
      {enq && (
        <Modal label="Project enquiry" onClose={() => setEnq(null)} scope="pg-offer">
          <EnquiryForm variant="modal" presetService={enq.service} presetScale={enq.scale} onClose={() => setEnq(null)} />
        </Modal>
      )}
    </div>
  );
}
