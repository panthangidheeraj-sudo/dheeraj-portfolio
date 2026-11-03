import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from './motion';

// Smooth scrolling on desktop (mouse wheel / trackpad). Off on touch screens and for reduced motion,
// where the browser's own scrolling is used. Keeps GSAP ScrollTrigger in sync.

let lenis: Lenis | null = null;
const raf = (t: number) => lenis?.raf(t * 1000);

export function startSmooth() {
  if (lenis || typeof window === 'undefined') return;
  if (prefersReducedMotion() || window.matchMedia('(pointer: coarse)').matches) return;
  lenis = new Lenis({
    duration: 1.05,
    easing: (t) => 1 - Math.pow(1 - t, 3.2),
    // let these scroll natively: dialogs, the mobile menu, the museum stage and anything marked
    prevent: (node: HTMLElement) => !!node.closest?.('[data-lenis-prevent], .scrim, .mnav, .pg-admin')
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(raf);
  gsap.ticker.lagSmoothing(0);
}

export function stopSmooth() {
  if (!lenis) return;
  gsap.ticker.remove(raf);
  lenis.destroy();
  lenis = null;
}

/** Freeze/unfreeze page scrolling (dialogs, menus). */
export function lockScroll(lock: boolean) {
  document.body.style.overflow = lock ? 'hidden' : '';
  if (lock) lenis?.stop(); else lenis?.start();
}

/** Scroll to an element or a position, smoothly when allowed. */
export function scrollToTarget(target: HTMLElement | number, opts: { immediate?: boolean; offset?: number } = {}) {
  if (lenis) { lenis.scrollTo(target, { immediate: opts.immediate, offset: opts.offset ?? 0, duration: 1.2 }); return; }
  const behavior: ScrollBehavior = opts.immediate || prefersReducedMotion() ? 'auto' : 'smooth';
  if (typeof target === 'number') window.scrollTo({ top: target, behavior });
  else target.scrollIntoView({ behavior, block: 'start' });
}
