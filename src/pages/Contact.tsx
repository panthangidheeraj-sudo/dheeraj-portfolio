import { useLayoutEffect, useRef, useState } from 'react';
import '../styles/contact.css';
import { CafeBack, CafeFront, CafeFrontFx, CafeGlow, CafeRain } from '../components/scenes/CafeScene';
import { Footer, Nav } from '../components/Chrome';
import { channelDisplay, channelHref, pad2, useContent } from '../lib/store';
import { gsap, prefersReducedMotion, ScrollTrigger, usePageMotion } from '../lib/motion';
import { emailOk, sendMessage } from '../lib/submit';
import { scrollToTarget } from '../lib/smooth';

const ICONS: Record<string, string> = {
  email: 'M3 6h18v12H3zM3 7l9 7 9-7',
  linkedin: 'M4 4h16v16H4zM8 10v6M8 7.5v.01M12 16v-6M12 13c0-2 1-3 2.5-3S17 11 17 13v3',
  github: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14',
  instagram: 'M5 5h14v14H5zM12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM16.5 7.5v.01'
};
const EMPTY = { name: '', email: '', org: '', subject: '', message: '', website: '' };
type V = typeof EMPTY;
const KEYS = ['name', 'email', 'subject', 'message'] as const;

function validate(v: V) {
  const e: Partial<Record<keyof V, string>> = {};
  if (v.name.trim().length < 2) e.name = 'Please tell me your name.';
  if (!v.email.trim()) e.email = 'Please add your email so I can reply.';
  else if (!emailOk(v.email)) e.email = 'That email address doesn’t look right.';
  if (v.subject.trim().length < 3) e.subject = 'A short subject helps me find your message.';
  if (v.message.trim().length < 10) e.message = 'Your message needs a little more (at least 10 characters).';
  if (v.message.length > 5000) e.message = 'Please keep your message under 5,000 characters.';
  return e;
}

export default function Contact() {
  const root = useRef<HTMLDivElement>(null);
  const { content } = useContent();
  const cfg = content.site;
  const to = cfg.channels.find((c) => c.key === 'email' && c.enabled)?.value || '';
  const [v, setV] = useState<V>({ ...EMPTY });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState<null | { mode: 'sent' | 'mailto'; subject: string }>(null);
  const busy = useRef(false);
  usePageMotion(root);

  // Signature moment: the letter settles on the desk, the pen stroke signs itself, "Dear Dheeraj," writes on.
  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const letter = el.querySelector('.letter');
      const pen = el.querySelector<SVGPathElement>('.pen path');
      const salute = el.querySelector('.salute');
      const date = el.querySelector('.lhead span');
      if (letter) {
        gsap.set(letter, { autoAlpha: 0, y: 60, rotate: 1.5, transformOrigin: '60% 100%', clipPath: 'inset(0% 0% 100% 0%)' });
        if (salute) gsap.set(salute, { clipPath: 'inset(-30% 100% -40% 0)' });
        if (date) gsap.set(date, { autoAlpha: 0 });
        ScrollTrigger.create({ trigger: letter, start: 'top 85%', once: true, onEnter: () => {
          gsap.timeline()
            .to(letter, { autoAlpha: 1, y: 0, rotate: 0, clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', clearProps: 'transform,clipPath' })
            .to(date, { autoAlpha: 1, duration: 0.6 }, 0.6)
            .to(salute, { clipPath: 'inset(-30% -5% -40% 0)', duration: 1.3, ease: 'power1.inOut' }, 0.8);
        } });
      }
      if (pen) {
        const L = pen.getTotalLength();
        gsap.set(pen, { strokeDasharray: L, strokeDashoffset: L });
        gsap.to(pen, { strokeDashoffset: 0, duration: 1.6, ease: 'power1.inOut', scrollTrigger: { trigger: pen, start: 'top 90%', once: true } });
      }
      // final chapter: the light above the closing line widens as you arrive
      const spot = el.querySelector('.chapter .spot');
      if (spot) gsap.fromTo(spot, { scale: 0.55 }, { scale: 1.2, ease: 'none', scrollTrigger: { trigger: el.querySelector('.chapter'), start: 'top bottom', end: 'center center', scrub: 0.6 } });
      // directory: each icon leans toward the pointer while its row is hovered
      el.querySelectorAll<HTMLElement>('.crow').forEach((row) => {
        const ic = row.querySelector<HTMLElement>('.ic');
        if (!ic || !window.matchMedia('(pointer: fine)').matches) return;
        const qx = gsap.quickTo(ic, 'x', { duration: 0.5, ease: 'power3.out' }), qy = gsap.quickTo(ic, 'y', { duration: 0.5, ease: 'power3.out' });
        row.addEventListener('pointermove', (e) => { const r = ic.getBoundingClientRect(); qx(gsap.utils.clamp(-10, 10, (e.clientX - (r.left + r.width / 2)) * 0.08)); qy(gsap.utils.clamp(-8, 8, (e.clientY - (r.top + r.height / 2)) * 0.2)); });
        row.addEventListener('pointerleave', () => { qx(0); qy(0); });
      });
      const name = el.querySelector('.chapter .name');
      if (name) {
        const ls = getComputedStyle(name).letterSpacing;
        gsap.fromTo(name, { letterSpacing: '0.55em' }, { letterSpacing: ls === 'normal' ? '0em' : ls, ease: 'none', scrollTrigger: { trigger: name, start: 'top bottom', end: 'bottom 65%', scrub: 0.6 } });
      }
    }, el);
    return () => { ctx.revert(); };
  }, []);

  const errs = touched ? validate(v) : {};
  const set = (k: keyof V) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((x) => ({ ...x, [k]: e.target.value }));
  const cls = (k: keyof V) => 'in' + (errs[k] ? ' bad' : '');
  const a11y = (k: keyof V) => ({ 'aria-invalid': !!errs[k], 'aria-describedby': `c-${k}-m` });
  const channels = cfg.channels.filter((c) => c.enabled && c.value.trim());
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return; // no duplicate submissions
    const found = validate(v);
    if (Object.keys(found).length) {
      setTouched(true); setFailed(false);
      const first = KEYS.find((k) => found[k]);
      if (first) document.getElementById('c-' + first)?.focus();
      return;
    }
    busy.current = true; setTouched(true); setSending(true); setFailed(false);
    try {
      const res = await sendMessage({
        to, subject: `Portfolio message — ${v.subject.trim()}`, fromName: v.name.trim(), replyTo: v.email.trim(), botcheck: v.website,
        fields: { Name: v.name.trim(), Email: v.email.trim(), 'Project / organisation': v.org.trim(), Subject: v.subject.trim(), Message: v.message.trim() }
      });
      if (res.mode === 'mailto') window.location.href = res.href;
      setDone({ mode: res.mode, subject: v.subject.trim() });
    } catch {
      setFailed(true); // nothing typed is lost
    } finally {
      busy.current = false; setSending(false);
    }
  };
  const reset = () => { setV({ ...EMPTY }); setTouched(false); setDone(null); setFailed(false); };

  return (
    <div className="dp pg-contact" id="top" ref={root}>
      <Nav />
      <header className="hero" aria-label="Let’s connect">
        <div className="layer h-bg" data-scrub="hero-bg"><CafeBack /><CafeGlow /><CafeRain /></div>
        <h1 className="h-type" aria-label="Let’s connect." data-scrub="hero-type"><span aria-hidden="true">LET’S</span><span aria-hidden="true">CONNECT.</span></h1>
        <div className="layer h-fg" data-scrub="hero-fg"><CafeFront /><CafeFrontFx /></div>
        <div className="h-shade" />
        <p className="h-sub">Every meaningful project begins with a conversation.</p>
        <a className="h-cue" href="#welcome" aria-label="Scroll to the contact section"><span>Take a seat</span><span className="rail" /></a>
      </header>

      <section className="intro" id="welcome" aria-labelledby="intro-h">
        <div className="wrap">
          <p className="eyebrow" data-m="scramble">The conversation starts here</p>
          <h2 data-m="blur" id="intro-h">{cfg.introHeading}</h2>
          <p className="rv">{cfg.introText}</p>
        </div>
      </section>

      {channels.length > 0 && (
        <section className="dir" aria-labelledby="dir-h">
          <div className="wrap">
            <div className="dir-head">
              <div><p className="eyebrow" data-m="scramble">Reach me directly</p><h2 data-m="flip" id="dir-h">Find me around the web</h2></div>
              <p className="rv">Email is the fastest way to reach me. Everything else is linked below.</p>
            </div>
            <ul className="rows" data-m="wipe">
              {channels.map((c, i) => {
                const ext = c.key !== 'email';
                const disp = channelDisplay(c.key, c.value);
                return (
                  <li key={c.key}>
                    <a className="crow" href={channelHref(c.key, c.value)} {...(ext ? { target: '_blank', rel: 'noopener noreferrer' } : {})} aria-label={`${c.label}: ${disp}${ext ? ' (opens in a new tab)' : ''}`}>
                      <span className="no" data-m="scramble" data-delay={(0.3 + i * 0.09).toFixed(2)}>{pad2(i + 1)} /</span>
                      <span className="ic" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d={ICONS[c.key] || ICONS.email} /></svg></span>
                      <span className="lab"><b>{c.label}</b><small>{c.note}</small></span>
                      <span className="val">{disp}</span>
                      <span className="arr" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 15L15 3M6 3h9v9" stroke="currentColor" strokeWidth="1.3" /></svg></span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section className="desk" id="write" aria-labelledby="desk-h">
        <div className="wrap">
          <div className="desk-grid">
            <div className="desk-copy">
              <p className="eyebrow" data-m="scramble">The correspondence desk</p>
              <h2 data-m="skew" id="desk-h">Leave a message</h2>
              <p className="rv">Have something you’d like to discuss? Send me a message and I’ll get back to you.</p>
              <svg className="pen" viewBox="0 0 180 40" fill="none" aria-hidden="true"><path d="M4 30 C 30 8, 48 34, 70 20 S 110 6, 128 22 S 160 30, 176 12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </div>

            <div className="letter">
              <div className="lhead"><b>To Dheeraj Panthangi</b><span>{today}</span></div>

              {!done && (
                <form noValidate onSubmit={submit} aria-label="Contact form">
                  {failed && <div className="banner" role="alert">Your message couldn’t be sent just now. Everything you wrote is still here — please try again in a moment.</div>}
                  <div className="f"><label htmlFor="c-name">Your name <b>*</b></label><input className={cls('name')} id="c-name" autoComplete="name" value={v.name} onChange={set('name')} {...a11y('name')} /><span className="msg" id="c-name-m">{errs.name}</span></div>
                  <div className="f"><label htmlFor="c-email">Email address <b>*</b></label><input className={cls('email')} id="c-email" type="email" autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} {...a11y('email')} /><span className="msg" id="c-email-m">{errs.email}</span></div>
                  <div className="f"><label htmlFor="c-org">Project or organisation <i>— optional</i></label><input className="in" id="c-org" autoComplete="organization" value={v.org} onChange={set('org')} /></div>
                  <div className="f"><label htmlFor="c-subject">Subject <b>*</b></label><input className={cls('subject')} id="c-subject" value={v.subject} onChange={set('subject')} {...a11y('subject')} /><span className="msg" id="c-subject-m">{errs.subject}</span></div>
                  <div className="f wide">
                    <p className="salute" aria-hidden="true">Dear Dheeraj,</p>
                    <label htmlFor="c-message" className="sr-only">Your message (required)</label>
                    <textarea className={cls('message')} id="c-message" placeholder="Write your message here…" value={v.message} onChange={set('message')} {...a11y('message')} />
                    <span className="msg" id="c-message-m">{errs.message}</span>
                  </div>
                  <div className="hp" aria-hidden="true"><label htmlFor="c-website">Leave this empty</label><input id="c-website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></div>
                  <div className="foot">
                    <p>Your details are only used to reply to you. Fields marked * are required.</p>
                    <button className="send" type="submit" disabled={sending} aria-busy={sending}>{sending && <span className="spin" aria-hidden="true" />}{sending ? 'Sending…' : 'Send message →'}</button>
                  </div>
                </form>
              )}

              {/* The envelope only plays when delivery was confirmed by the form service. */}
              {done?.mode === 'sent' && (
                <div className="sealed" role="status" aria-live="polite">
                  <div className="env" aria-hidden="true">
                    <div className="env-back" />
                    <div className="env-letter"><small>Re · {done.subject}</small><b>Dear Dheeraj,</b><i /><i style={{ width: '82%' }} /><i style={{ width: '64%' }} /></div>
                    <div className="env-front" />
                    <div className="env-flap" />
                    <div className="env-seal">DP</div>
                  </div>
                  <p className="k">Delivered with care.</p>
                  <h3>YOUR MESSAGE HAS BEEN RECEIVED.</h3>
                  <p>Thank you for reaching out. I’ll get back to you as soon as possible.</p>
                  <button className="again" type="button" onClick={reset}>Write another message</button>
                </div>
              )}

              {done?.mode === 'mailto' && (
                <div className="sealed handoff" role="status" aria-live="polite">
                  <p className="k">Almost there</p>
                  <h3>FINISH IN YOUR EMAIL APP.</h3>
                  <p>Your email app should have opened with your letter already written — press send there and it comes straight to me.{to && <> If nothing opened, write to <a className="ulink" href={`mailto:${to}`}>{to}</a>.</>}</p>
                  <button className="again" type="button" onClick={reset}>Write another message</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="chapter" aria-labelledby="ch-h">
        <div className="spot" data-m="glow" /><div className="rule" data-m="rule" />
        <div className="wrap">
          <p className="eyebrow" data-m="scramble" style={{ position: 'relative' }}>The next chapter</p>
          <h2 data-m="words" id="ch-h">{cfg.closingHeading}</h2>
          <p className="rv">{cfg.closingText}</p>
          <a className="cta rv" href="#write" onClick={(e) => { e.preventDefault(); const w = document.getElementById('write'); if (w) scrollToTarget(w); setTimeout(() => document.getElementById('c-name')?.focus({ preventScroll: true }), 700); }}>Get in touch <svg width="22" height="10" viewBox="0 0 22 10" fill="none" aria-hidden="true"><path d="M0 5h20M16 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" /></svg></a>
          <span className="name">DHEERAJ PANTHANGI</span>
        </div>
      </section>

      <Footer />
    </div>
  );
}
