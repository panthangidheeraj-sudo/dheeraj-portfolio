import { useEffect, useLayoutEffect, useState, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { primeWrite, writeOn } from '../components/Cursive';

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);

export { gsap, ScrollTrigger, SplitText };
import { prefersReducedMotion } from './motionPref';

export { prefersReducedMotion };
export const isPhone = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches;

export function useMedia(query: string) {
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setM(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return m;
}

/* ------------------------------------------------------------------------------------------
 * The site's motion vocabulary (see "Portfolio Animation Proposal").
 * Put an attribute on any element; usePageMotion() animates everything inside the page root.
 *
 *   .rv                    M2 fade-up. Headings (h1–h3) with .rv get M1 line rise automatically.
 *   data-m="rise"          M1 line rise: split into lines, each slides up from a mask
 *   data-m="chars"         letters rise one by one from a mask
 *   data-m="fade"          M2 fade-up
 *   data-m="stagger"       M2 on each direct child, one after another
 *   data-m="curtain"       M3 image curtain (data-dir="up|down|left|right|center|middle"); inner <img> settles from 115%
 *   data-m="rule"          M5 hairline draws from the left
 *   data-m="digits"        M6 digits roll up
 *   data-m="words"         closing lines: words light up from dim to full as you scroll through
 *   data-m="glow"          slow 1.5 s fade (backgrounds, lights)
 *
 *   Expressive set (one per section, so no two neighbours move the same way):
 *   data-m="scramble"      text decodes from random glyphs, left to right (labels, numbers, meta lines)
 *   data-m="flip"          letters flip up in 3D, one after another
 *   data-m="skew"          lines slide up through a mask while straightening from a skew
 *   data-m="blur"          letters pull in from wide spacing and blur to sharp
 *   data-m="scatter"       letters fly in from scattered positions, tied to the scroll
 *   data-m="fill"          outlined title fills with ink left to right as you scroll (plain-text titles)
 *   data-m="iris"          image opens from a small circle as you scroll, while zooming out
 *   data-m="block"         a gold bar sweeps across, leaving the image behind it
 *   data-m="tilt"          element swings up from a 3D tilt, like standing up (data-origin="bottom|center")
 *   data-m="deal"          children are dealt in like cards, each with its own spin
 *   data-m="slide"         children slide in from alternating sides
 *   data-m="write"         every script word (.cw) inside writes itself with the pen
 *   data-m="counter"       a number counts up from zero
 *   data-m="wordrise"      words rise one by one out of masks, tipping upright
 *   data-m="diag"          image opens along a diagonal as you scroll
 *   data-m="wipe"          child rows wipe in from the left, one after another
 *   data-speed="0.2"       M4 parallax (desktop only)
 *   data-scrub="hero-…"    layered hero scroll (hero-bg | hero-fg | hero-type | hero-subj)
 *   data-delay="0.2"       extra delay in seconds
 *
 * Reveals play once at 88% of the viewport and never replay. Phones get shorter moves and
 * no parallax; reduced motion gets a plain 0.3 s fade and nothing moves.
 * Content is only hidden once this code runs, so nothing disappears if JS is slow or fails.
 * ---------------------------------------------------------------------------------------- */

const EASE = { out: 'power3.out', rise: 'power4.out' };
// cubic-bezier(0.77, 0, 0.175, 1), the clip-path curtain curve, approximated by a smooth in-out quart
gsap.registerEase('curtain', (p: number) => (p < 0.5 ? 8 * p * p * p * p : 1 - Math.pow(-2 * p + 2, 4) / 2));

const START = 'clamp(top 88%)'; // clamp: elements at the very end of a page still fire at max scroll
const delayOf = (el: Element) => parseFloat((el as HTMLElement).dataset.delay || '0') || 0;

// While the page curtain is still covering the screen, reveals wait for it to lift.
let holdUntil = 0;
export const holdEntrances = (ms: number) => { holdUntil = performance.now() + ms; };
export const entranceWait = () => Math.max(0, holdUntil - performance.now()) / 1000;

const inFirstView = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight * 0.88 && r.bottom > 0 && window.scrollY < 2;
};

// Safety net: if a layout shift ever leaves a scroll trigger's start point out of reach (or a jump such as the
// End key skips it), anything that is actually on screen still plays. Content is never left hidden.
type Pending = { el: Element; fire: () => void };
const pending = new Set<Pending>();
let netOn = false;
function sweepPending() {
  pending.forEach((p) => {
    if (!p.el.isConnected) { pending.delete(p); return; }
    if (p.el.getBoundingClientRect().top < window.innerHeight * 0.96) p.fire();
  });
}
function armNet() {
  if (netOn || typeof window === 'undefined') return;
  netOn = true;
  window.addEventListener('scroll', sweepPending, { passive: true });
  window.addEventListener('resize', sweepPending);
  window.setInterval(() => { if (pending.size) sweepPending(); }, 600);
}

function once(trigger: Element, play: () => gsap.core.Animation | void) {
  let fired = false;
  let st: ScrollTrigger | null = null;
  const entry: Pending = { el: trigger, fire: () => { /* set below */ } };
  const go = () => {
    if (fired) return;
    fired = true;
    pending.delete(entry);
    st?.kill();
    const w = entranceWait();
    if (w) gsap.delayedCall(w, () => { play(); }); else play();
  };
  if (inFirstView(trigger)) { go(); return; } // already on screen at load: play now
  entry.fire = go;
  st = ScrollTrigger.create({ trigger, start: START, once: true, onEnter: go });
  pending.add(entry);
  armNet();
}

type Ctx = { phone: boolean; reduce: boolean };

function setupReduced(root: HTMLElement) {
  const els = root.querySelectorAll<HTMLElement>('.rv, [data-m]:not([data-m="words"]):not([data-m="rule"]):not([data-m="write"]):not([data-m="fill"]):not([data-m="iris"]):not([data-m="diag"])');
  els.forEach((el) => {
    gsap.set(el, { autoAlpha: 0 });
    once(el, () => gsap.to(el, { autoAlpha: 1, duration: 0.3, ease: 'none' }));
  });
}

function splitRise(el: HTMLElement, type: 'lines' | 'chars', c: Ctx) {
  let played = false;
  let anim: gsap.core.Tween | null = null;
  const dur = type === 'chars' ? 1.0 : 0.9;
  const stagger = type === 'chars' ? 0.035 : 0.08;
  gsap.set(el, { autoAlpha: 1 });
  const split: SplitText = SplitText.create(el, {
    type: type === 'chars' ? 'words,chars' : 'lines',
    mask: type,
    autoSplit: true,
    onSplit(self) {
      if (played) { anim = null; return; } // already revealed: a re-split (resize, fonts) must not hide it again
      const parts = type === 'chars' ? self.chars : self.lines;
      gsap.set(parts, { yPercent: 110 });
      anim = gsap.to(parts, {
        yPercent: 0, duration: c.phone ? dur * 0.8 : dur, ease: EASE.rise, stagger, delay: delayOf(el), paused: true,
        onComplete: () => { if (type === 'lines') split.revert(); }
      });
      return anim;
    }
  });
  once(el, () => { played = true; anim?.play(); });
}

function fadeUp(els: HTMLElement[], c: Ctx) {
  if (!els.length) return;
  const y = c.phone ? 16 : 24;
  gsap.set(els, { autoAlpha: 0, y });
  const now = els.filter(inFirstView);
  if (now.length) gsap.to(now, { autoAlpha: 1, y: 0, duration: c.phone ? 0.65 : 0.8, ease: EASE.out, stagger: 0.06, delay: entranceWait() + 0.1, clearProps: 'transform' });
  els = els.filter((e) => !now.includes(e));
  if (!els.length) return;
  ScrollTrigger.batch(els, {
    start: START, once: true, interval: 0.08,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1, y: 0, duration: c.phone ? 0.65 : 0.8, ease: EASE.out,
      stagger: 0.06, delay: delayOf(batch[0] as Element) + entranceWait(), overwrite: true, clearProps: 'transform'
    })
  });
}

const CLIP_FROM: Record<string, string> = {
  up: 'inset(100% 0% 0% 0%)', down: 'inset(0% 0% 100% 0%)', left: 'inset(0% 100% 0% 0%)', right: 'inset(0% 0% 0% 100%)', center: 'inset(0% 50% 0% 50%)', middle: 'inset(50% 0% 50% 0%)'
};

function curtain(el: HTMLElement, c: Ctx) {
  const dir = el.dataset.dir || 'up';
  const img = el.querySelector('img, video');
  gsap.set(el, { clipPath: CLIP_FROM[dir] || CLIP_FROM.up });
  if (img) gsap.set(img, { scale: 1.15 });
  once(el, () => {
    const tl = gsap.timeline({ delay: delayOf(el) });
    tl.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: c.phone ? 1 : 1.2, ease: 'curtain', clearProps: 'clipPath' }, 0);
    if (img) tl.to(img, { scale: 1, duration: c.phone ? 1.2 : 1.5, ease: EASE.out }, 0);
    return tl;
  });
}

function rule(el: HTMLElement) {
  gsap.set(el, { scaleX: 0, transformOrigin: '0% 50%' });
  once(el, () => gsap.to(el, { scaleX: 1, duration: 1, ease: 'power3.inOut', delay: delayOf(el) }));
}

function digits(el: HTMLElement, c: Ctx) {
  gsap.set(el, { autoAlpha: 1 });
  const split = SplitText.create(el, { type: 'chars', mask: 'chars' });
  gsap.set(split.chars, { yPercent: 100 });
  once(el, () => gsap.to(split.chars, { yPercent: 0, duration: c.phone ? 0.5 : 0.6, ease: EASE.out, stagger: 0.05, delay: delayOf(el) }));
}

function words(el: HTMLElement) {
  const split = SplitText.create(el, { type: 'words', wordsClass: 'm-word' });
  gsap.fromTo(split.words, { opacity: 0.14 }, {
    opacity: 1, ease: 'none', stagger: 0.1,
    scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: 0.6 }
  });
}

function stagger(el: HTMLElement, c: Ctx) {
  const kids = Array.from(el.children) as HTMLElement[];
  const y = c.phone ? 14 : 22;
  gsap.set(kids, { autoAlpha: 0, y });
  once(el, () => gsap.to(kids, {
    autoAlpha: 1, y: 0, duration: 0.7, ease: EASE.out, stagger: parseFloat(el.dataset.stagger || '0.06'), delay: delayOf(el), clearProps: 'transform'
  }));
}

function glow(el: HTMLElement) {
  gsap.set(el, { autoAlpha: 0 });
  ScrollTrigger.create({ trigger: el, start: 'top 75%', once: true, onEnter: () => { gsap.to(el, { autoAlpha: 1, duration: 1.5, ease: 'power2.out' }); } });
}

function parallax(root: HTMLElement) {
  gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-speed]')).forEach((node) => {
    const speed = parseFloat(node.dataset.speed || '0.2');
    const section = (node.closest('section, header, figure') as HTMLElement) || node;
    gsap.fromTo(node, { yPercent: -speed * 20 }, {
      yPercent: speed * 20, ease: 'none',
      scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });
}

function heroScrub(root: HTMLElement) {
  gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-scrub]')).forEach((node) => {
    const hero = (node.closest('header') as HTMLElement) || node;
    const kind = node.dataset.scrub;
    const to = kind === 'hero-fg' ? { yPercent: 26, scale: 1.4, opacity: 0.25 }
      : kind === 'hero-bg' ? { yPercent: 12, scale: 1.06 }
      : kind === 'hero-type' ? { yPercent: -18, opacity: 0 }
      : { yPercent: 10 };
    gsap.to(node, { ...to, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  });
}

// ---------------------------------------------------------------- expressive set
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/#*+<>';

/** Decode an element's text from random glyphs (keeps child elements intact). */
export function scrambleIn(el: HTMLElement, duration = 0.9, delay = 0) {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);
  const orig = nodes.map((n) => n.data);
  const total = orig.reduce((a, t) => a + t.length, 0) || 1;
  const rnd = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const render = (p: number) => {
    let i = 0;
    nodes.forEach((n, k) => {
      let out = '';
      for (const ch of orig[k]) {
        out += i / total < p || ch === ' ' || ch === '\u00a0' ? ch : rnd();
        i++;
      }
      n.data = out;
    });
  };
  const st = { p: 0 };
  let last = 0;
  render(0);
  return gsap.to(st, {
    p: 1, duration, delay, ease: 'power1.inOut',
    onStart: () => { gsap.set(el, { autoAlpha: 1 }); },
    onUpdate: () => { const now = performance.now(); if (now - last > 45) { last = now; render(st.p); } },
    onComplete: () => nodes.forEach((n, k) => { n.data = orig[k]; })
  });
}

function scramble(el: HTMLElement) {
  gsap.set(el, { autoAlpha: 0 });
  once(el, () => scrambleIn(el, 0.9, delayOf(el)));
}

function flip(el: HTMLElement, c: Ctx) {
  gsap.set(el, { autoAlpha: 1 });
  const split = SplitText.create(el, { type: 'words,chars' });
  gsap.set(split.chars, { rotateX: -100, autoAlpha: 0, transformPerspective: 700, transformOrigin: '50% 50% -0.4em' });
  once(el, () => gsap.to(split.chars, {
    rotateX: 0, autoAlpha: 1, duration: c.phone ? 0.8 : 1.1, ease: 'expo.out', stagger: 0.03, delay: delayOf(el),
    onComplete: () => split.revert()
  }));
}

function wordRise(el: HTMLElement, c: Ctx) {
  gsap.set(el, { autoAlpha: 1 });
  const split = SplitText.create(el, { type: 'words', mask: 'words' });
  gsap.set(split.words, { yPercent: 115, rotate: 6, transformOrigin: '0% 100%' });
  once(el, () => gsap.to(split.words, {
    yPercent: 0, rotate: 0, duration: c.phone ? 0.9 : 1.15, ease: 'expo.out', stagger: 0.09, delay: delayOf(el),
    onComplete: () => split.revert()
  }));
}

/** Diagonal wipe tied to the scroll, with the image settling inside it. */
function diag(el: HTMLElement) {
  const img = el.querySelector('img, video');
  const st = { trigger: el, start: 'top 92%', end: 'center 50%', scrub: 0.6 };
  gsap.fromTo(el, { clipPath: 'polygon(0% 0%, 0% 0%, -60% 100%, -60% 100%)' }, { clipPath: 'polygon(0% 0%, 160% 0%, 100% 100%, -60% 100%)', ease: 'none', scrollTrigger: st });
  if (img) gsap.fromTo(img, { scale: 1.3, rotate: 2 }, { scale: 1, rotate: 0, ease: 'none', scrollTrigger: st });
}

function skew(el: HTMLElement, c: Ctx) {
  gsap.set(el, { autoAlpha: 1 });
  const split = SplitText.create(el, { type: 'lines', mask: 'lines' });
  gsap.set(split.lines, { yPercent: 120, skewY: 8, transformOrigin: '0% 100%' });
  once(el, () => gsap.to(split.lines, {
    yPercent: 0, skewY: 0, duration: c.phone ? 0.9 : 1.2, ease: 'expo.out', stagger: 0.1, delay: delayOf(el),
    onComplete: () => split.revert()
  }));
}

function blurIn(el: HTMLElement, c: Ctx) {
  const ls = getComputedStyle(el).letterSpacing;
  gsap.set(el, { autoAlpha: 0, filter: 'blur(18px)', letterSpacing: c.phone ? '0.12em' : '0.32em' });
  once(el, () => gsap.to(el, {
    autoAlpha: 1, filter: 'blur(0px)', letterSpacing: ls === 'normal' ? '0em' : ls, duration: 1.5, ease: 'expo.out', delay: delayOf(el),
    clearProps: 'filter,letterSpacing'
  }));
}

function scatter(el: HTMLElement, c: Ctx) {
  const split = SplitText.create(el, { type: 'words,chars' });
  const k = c.phone ? 0.4 : 1;
  gsap.fromTo(split.chars, {
    x: () => gsap.utils.random(-320, 320) * k, y: () => gsap.utils.random(-180, 180) * k,
    rotate: () => gsap.utils.random(-90, 90), scale: () => gsap.utils.random(0.4, 1.6), autoAlpha: 0
  }, {
    x: 0, y: 0, rotate: 0, scale: 1, autoAlpha: 1, ease: 'power2.out', stagger: { amount: 0.35, from: 'random' },
    scrollTrigger: { trigger: el, start: 'top 92%', end: 'center 58%', scrub: 0.8 }
  });
}

function fill(el: HTMLElement) {
  el.dataset.text = el.textContent || '';
  el.classList.add('m-fill');
  el.style.setProperty('--fill', '0%');
  gsap.to(el, {
    '--fill': '100%', ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 86%', end: 'top 40%', scrub: 0.5 }
  });
}

function iris(el: HTMLElement) {
  const img = el.querySelector('img, video');
  gsap.fromTo(el, { clipPath: 'circle(14% at 50% 50%)' }, {
    clipPath: 'circle(75% at 50% 50%)', ease: 'none',
    scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 52%', scrub: 0.6 }
  });
  if (img) gsap.fromTo(img, { scale: 1.35 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 95%', end: 'center 52%', scrub: 0.6 } });
}

export function blockReveal(el: HTMLElement, delay = 0) {
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  const bar = document.createElement('span');
  bar.className = 'm-block';
  bar.setAttribute('aria-hidden', 'true');
  const kids = Array.from(el.children) as HTMLElement[];
  el.appendChild(bar);
  gsap.set(kids, { autoAlpha: 0 });
  gsap.set(bar, { scaleX: 0, transformOrigin: '0% 50%' });
  return () => gsap.timeline({ delay })
    .to(bar, { scaleX: 1, duration: 0.55, ease: 'power3.inOut' })
    .set(kids, { autoAlpha: 1 })
    .set(bar, { transformOrigin: '100% 50%' })
    .to(bar, { scaleX: 0, duration: 0.6, ease: 'power3.inOut' })
    .add(() => bar.remove());
}

function block(el: HTMLElement) {
  const play = blockReveal(el, delayOf(el));
  once(el, play);
}

function tilt(el: HTMLElement, c: Ctx) {
  const bottom = (el.dataset.origin || 'bottom') === 'bottom';
  gsap.set(el, { autoAlpha: 0, rotateX: bottom ? 72 : 32, y: bottom ? 40 : 90, z: bottom ? 0 : -120, transformPerspective: 1100, transformOrigin: bottom ? '50% 100%' : '50% 50%' });
  once(el, () => gsap.to(el, { autoAlpha: 1, rotateX: 0, y: 0, z: 0, duration: c.phone ? 1 : 1.4, ease: 'expo.out', delay: delayOf(el), clearProps: 'transform' }));
}

function deal(el: HTMLElement, c: Ctx) {
  const kids = Array.from(el.children) as HTMLElement[];
  const k = c.phone ? 0.5 : 1;
  gsap.set(kids, { autoAlpha: 0, x: (i: number) => (i - (kids.length - 1) / 2) * -160 * k, y: 140 * k, rotate: () => gsap.utils.random(-28, 28), scale: 0.85 });
  once(el, () => gsap.to(kids, { autoAlpha: 1, x: 0, y: 0, rotate: 0, scale: 1, duration: 1.1, ease: 'back.out(1.3)', stagger: 0.14, delay: delayOf(el), clearProps: 'transform' }));
}

function slide(el: HTMLElement, c: Ctx) {
  const kids = Array.from(el.children) as HTMLElement[];
  gsap.set(kids, { autoAlpha: 0, x: (i: number) => (i % 2 ? 1 : -1) * (c.phone ? 50 : 140) });
  once(el, () => gsap.to(kids, { autoAlpha: 1, x: 0, duration: 1, ease: 'expo.out', stagger: 0.09, delay: delayOf(el), clearProps: 'transform' }));
}

/** Rows wipe in from the left, each led by a drawn gold rule. */
function wipe(el: HTMLElement, c: Ctx) {
  const kids = Array.from(el.children) as HTMLElement[];
  gsap.set(kids, { clipPath: 'inset(0% 100% 0% 0%)' });
  once(el, () => gsap.to(kids, { clipPath: 'inset(0% 0% 0% 0%)', duration: c.phone ? 0.9 : 1.2, ease: 'expo.inOut', stagger: 0.12, delay: delayOf(el), clearProps: 'clipPath' }));
}

function write(el: HTMLElement) {
  const words = Array.from(el.querySelectorAll<SVGSVGElement>('svg.cw'));
  words.forEach(primeWrite);
  once(el, () => {
    const tl = gsap.timeline({ delay: delayOf(el) });
    words.forEach((w) => tl.add(writeOn(w, 3400), '-=0.05'));
    return tl;
  });
}

/** Count a number up from zero, keeping its zero-padding (e.g. 00 → 11). */
export function counterAnimation(el: HTMLElement, delay = 0) {
  const raw = (el.textContent || '0').trim();
  const target = parseInt(raw.replace(/\D/g, ''), 10) || 0;
  const width = raw.replace(/\D/g, '').length;
  const o = { v: 0 };
  el.textContent = String(0).padStart(width, '0');
  return gsap.to(o, { v: target, duration: 1.4, delay, ease: 'power3.out', onUpdate: () => { el.textContent = String(Math.round(o.v)).padStart(width, '0'); } });
}
function counter(el: HTMLElement) {
  once(el, () => counterAnimation(el, delayOf(el)));
}

// ---- named building blocks (used by the pages; also handy when adding new sections) ----
export const splitTextReveal = (el: HTMLElement, type: 'lines' | 'chars' = 'lines') => splitRise(el, type, { phone: isPhone(), reduce: false });
export const imageMaskReveal = (el: HTMLElement) => curtain(el, { phone: isPhone(), reduce: false });
export const textScramble = scrambleIn;
export const parallaxLayers = parallax;

/** Pin `pin` and slide `track` sideways as the page scrolls (desktop). Returns the tween, or null when not needed. */
export function horizontalScrollScene(pin: HTMLElement, track: HTMLElement, opts: { onUpdate?: (p: number) => void } = {}) {
  const dist = () => Math.max(0, track.scrollWidth - pin.clientWidth);
  if (isPhone() || prefersReducedMotion() || dist() < 60) return null;
  pin.style.overflow = 'hidden';
  return gsap.to(track, {
    x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: pin, start: 'center center', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, refreshPriority: 1, onUpdate: (st) => opts.onUpdate?.(st.progress) }
  });
}

/** Lean an element toward the pointer while it hovers; spring back on leave. Returns a cleanup function. */
export function magneticElement(el: HTMLElement, strength = 0.3) {
  if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return () => {};
  const move = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - (r.left + r.width / 2)) * strength, y: (e.clientY - (r.top + r.height / 2)) * strength, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
  };
  const leave = () => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.35)', overwrite: 'auto' });
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerleave', leave);
  return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); };
}

export function setupMotion(root: HTMLElement) {
  const c: Ctx = { phone: isPhone(), reduce: prefersReducedMotion() };
  if (c.reduce) { setupReduced(root); return; }
  const q = <T extends Element = HTMLElement>(s: string) => Array.from(root.querySelectorAll<T & HTMLElement>(s));

  const isHeading = (el: Element) => /^H[1-3]$/.test(el.tagName);
  const legacy = q('.rv').filter((el) => !el.dataset.m);
  q('[data-m="rise"]').concat(legacy.filter(isHeading)).forEach((el) => splitRise(el, 'lines', c));
  q('[data-m="chars"]').forEach((el) => splitRise(el, 'chars', c));
  fadeUp(q('[data-m="fade"]').concat(legacy.filter((el) => !isHeading(el))), c);
  q('[data-m="stagger"]').forEach((el) => stagger(el, c));
  q('[data-m="curtain"]').forEach((el) => curtain(el, c));
  q('[data-m="rule"]').forEach((el) => rule(el));
  q('[data-m="digits"]').forEach((el) => digits(el, c));
  q('[data-m="words"]').forEach((el) => words(el));
  q('[data-m="glow"]').forEach((el) => glow(el));
  q('[data-m="scramble"]').forEach((el) => scramble(el));
  q('[data-m="flip"]').forEach((el) => flip(el, c));
  q('[data-m="skew"]').forEach((el) => skew(el, c));
  q('[data-m="blur"]').forEach((el) => blurIn(el, c));
  q('[data-m="scatter"]').forEach((el) => scatter(el, c));
  q('[data-m="fill"]').forEach((el) => fill(el));
  q('[data-m="iris"]').forEach((el) => iris(el));
  q('[data-m="block"]').forEach((el) => block(el));
  q('[data-m="tilt"]').forEach((el) => tilt(el, c));
  q('[data-m="deal"]').forEach((el) => deal(el, c));
  q('[data-m="slide"]').forEach((el) => slide(el, c));
  q('[data-m="write"]').forEach((el) => write(el));
  q('[data-m="counter"]').forEach((el) => counter(el));
  q('[data-m="wordrise"]').forEach((el) => wordRise(el, c));
  q('[data-m="wipe"]').forEach((el) => wipe(el, c));
  q('[data-m="diag"]').forEach((el) => diag(el));
  if (!c.phone) parallax(root);
  heroScrub(root);
}

/** Runs the motion vocabulary inside `root`. Re-runs when `deps` change. */
export function usePageMotion(root: RefObject<HTMLElement>, deps: unknown[] = []) {
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    el.classList.add('js-reveal');
    const ctx = gsap.context(() => setupMotion(el), el);
    // keep trigger positions right when the page grows or shrinks (images, lazy sections, fonts)
    let t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    let lastH = el.offsetHeight;
    const ro = new ResizeObserver(() => {
      if (Math.abs(el.offsetHeight - lastH) < 40) return;
      lastH = el.offsetHeight;
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 200);
    });
    ro.observe(el);
    return () => { window.clearTimeout(t); ro.disconnect(); ctx.revert(); el.classList.remove('js-reveal'); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export function refreshScroll() {
  ScrollTrigger.refresh();
}
