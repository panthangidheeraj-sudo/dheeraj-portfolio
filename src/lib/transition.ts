import { gsap, prefersReducedMotion } from './motion';

// Click-through transitions: an element (a door, a project cover) grows to fill the screen,
// the route changes underneath it, then it fades away to reveal the new page.

let overlay: HTMLDivElement | null = null;
let intro: { done: () => void; promise: Promise<void> } | null = null;

export function expandFrom(el: Element, opts: { image?: string; background?: string } = {}): Promise<void> {
  if (prefersReducedMotion()) return Promise.resolve();
  const r = el.getBoundingClientRect();
  overlay?.remove();
  const o = document.createElement('div');
  o.className = 'xfer';
  o.setAttribute('aria-hidden', 'true');
  Object.assign(o.style, {
    position: 'fixed', zIndex: '220', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px',
    background: opts.background || '#0E0E0D', pointerEvents: 'none', overflow: 'hidden'
  });
  if (opts.image) {
    const img = document.createElement('img');
    img.src = opts.image;
    img.alt = '';
    Object.assign(img.style, { width: '100%', height: '100%', objectFit: 'cover', display: 'block' });
    o.appendChild(img);
  }
  document.body.appendChild(o);
  overlay = o;
  return new Promise((resolve) => {
    gsap.to(o, {
      left: 0, top: 0, width: window.innerWidth, height: window.innerHeight,
      duration: 0.75, ease: 'power3.inOut', onComplete: resolve
    });
  });
}

/** True when a click-through overlay is covering the screen (the normal page curtain is skipped then). */
export const hasOverlay = () => !!overlay;

/** Called after the new page has mounted. */
export function releaseOverlay() {
  const o = overlay;
  if (!o) return;
  overlay = null;
  gsap.to(o, { autoAlpha: 0, duration: 0.6, delay: 0.25, ease: 'power2.out', onComplete: () => o.remove() });
}

// ---- first-visit intro (DP monogram loader) ----
export function introGate() {
  if (!intro) {
    let done = () => {};
    const promise = new Promise<void>((r) => { done = r; });
    intro = { done, promise };
  }
  return intro;
}
/** Resolves when the first-visit loader has finished (immediately when it isn't shown). */
export const whenIntroDone = () => introGate().promise;
export const markIntroDone = () => introGate().done();

/** The DP loader plays on every full page load (including refresh), never on in-app page changes. */
export function shouldShowIntro(path: string) {
  return !(prefersReducedMotion() || path.startsWith('/admin'));
}

// ---- page transitions: five dark panels close over the page, the next title rises, then they lift away ----
let ptEl: HTMLDivElement | null = null;
let covered = false;
let navFn: ((to: string) => void) | null = null;
export const registerNavigate = (fn: (to: string) => void) => { navFn = fn; };

function ensurePanels() {
  if (ptEl) return ptEl;
  const el = document.createElement('div');
  el.className = 'pt';
  el.setAttribute('aria-hidden', 'true');
  el.innerHTML = '<div class="pt-panels"><i></i><i></i><i></i><i></i><i></i></div><div class="pt-title"><span><b></b></span><small></small></div>';
  document.body.appendChild(el);
  ptEl = el;
  return el;
}

export type Dir = 'up' | 'left' | 'right';

function setTitle(el: HTMLDivElement, title: string, sub: string) {
  const b = el.querySelector('.pt-title b') as HTMLElement;
  b.innerHTML = title;
  (el.querySelector('.pt-title small') as HTMLElement).textContent = sub;
}

/** Close the panels over the current page, then change route. */
export function coverThenGo(to: string, title: string, sub = '', dir: Dir = 'up') {
  if (prefersReducedMotion() || !navFn) { navFn?.(to); return; }
  const el = ensurePanels();
  const panels = el.querySelectorAll('.pt-panels i');
  setTitle(el, title, sub);
  el.style.visibility = 'visible';
  gsap.killTweensOf([panels, el.querySelector('.pt-title b'), el.querySelector('.pt-title small')]);
  const from = dir === 'right' ? 'end' : 'start';
  gsap.timeline({ onComplete: () => { covered = true; navFn?.(to); } })
    .fromTo(panels, { scaleY: 0, transformOrigin: '50% 100%' }, { scaleY: 1, duration: 0.6, ease: 'power3.inOut', stagger: { each: 0.06, from } })
    .fromTo(el.querySelector('.pt-title b'), { yPercent: 110 }, { yPercent: 0, duration: 0.6, ease: 'power4.out' }, 0.35)
    .fromTo(el.querySelector('.pt-title small'), { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.4 }, 0.5);
}

/** Lift the panels to reveal the new page (closing them instantly first if a back/forward jump skipped the cover). */
export function revealPage(title: string, sub = '', dir: Dir = 'up') {
  if (prefersReducedMotion()) return;
  const el = ensurePanels();
  const panels = el.querySelectorAll('.pt-panels i');
  const b = el.querySelector('.pt-title b'), sm = el.querySelector('.pt-title small');
  if (!covered) {
    setTitle(el, title, sub);
    el.style.visibility = 'visible';
    gsap.set(panels, { scaleY: 1 });
    gsap.set(b, { yPercent: 0 });
    gsap.set(sm, { autoAlpha: 1, y: 0 });
  }
  covered = false;
  const from = dir === 'right' ? 'end' : 'start';
  gsap.timeline({ delay: 0.25, onComplete: () => { el.style.visibility = 'hidden'; } })
    .to([b, sm], { yPercent: -110, autoAlpha: 0, duration: 0.45, ease: 'power3.in' })
    .to(panels, { scaleY: 0, transformOrigin: '50% 0%', duration: 0.75, ease: 'power3.inOut', stagger: { each: 0.06, from } }, 0.2);
}
