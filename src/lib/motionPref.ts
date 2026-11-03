// One place that decides "full" vs "reduced" motion.
//  • auto (default): follow the operating-system setting (Windows: Settings → Accessibility → Visual effects → Animation effects).
//  • full / reduced: a visitor's own choice from the footer switch (or ?motion=full / ?motion=reduced), remembered in this browser.
// Everything — GSAP scenes, the cursor, page transitions, WebGL effects and the CSS — reads it from here.

export type MotionMode = 'auto' | 'full' | 'reduced';
const KEY = 'dp-motion';

export const osReducesMotion = () =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function motionMode(): MotionMode {
  if (typeof window === 'undefined') return 'auto';
  try {
    const q = new URLSearchParams(window.location.search).get('motion');
    if (q === 'full' || q === 'reduced') { localStorage.setItem(KEY, q); return q; }
    if (q === 'auto') { localStorage.removeItem(KEY); return 'auto'; }
    const v = localStorage.getItem(KEY);
    if (v === 'full' || v === 'reduced') return v;
  } catch { /* storage blocked: stay on auto */ }
  return 'auto';
}

let cached: MotionMode | null = null;
const mode = () => (cached ??= motionMode());

export const prefersReducedMotion = () => {
  const m = mode();
  return m === 'reduced' || (m === 'auto' && osReducesMotion());
};

export function setMotionMode(m: MotionMode) {
  try { if (m === 'auto') localStorage.removeItem(KEY); else localStorage.setItem(KEY, m); } catch { /* ignore */ }
  window.location.reload(); // every scene is built once at load, so a reload applies the choice cleanly
}

export const currentMotionMode = () => mode();

// CSS: the stylesheets contain @media (prefers-reduced-motion: …) blocks. If the visitor's choice differs from the
// OS setting, flip those blocks on/off so the CSS agrees with the JavaScript.
const orig = new WeakMap<CSSMediaRule, string>();
function walk(rules: CSSRuleList, reduce: boolean) {
  for (const r of Array.from(rules)) {
    if (r instanceof CSSMediaRule) {
      const text = orig.get(r) ?? r.media.mediaText;
      if (/prefers-reduced-motion/.test(text)) {
        orig.set(r, text);
        r.media.mediaText = text.replace(/\(\s*prefers-reduced-motion\s*:\s*(reduce|no-preference)\s*\)/g,
          (_m, v: string) => ((v === 'reduce') === reduce ? '(min-width:0px)' : '(min-width:999999px)'));
        continue;
      }
    }
    const g = r as CSSGroupingRule;
    if (g.cssRules && g.cssRules.length) walk(g.cssRules, reduce);
  }
}
export function syncMotionCss() {
  if (typeof document === 'undefined') return;
  const reduce = prefersReducedMotion();
  document.documentElement.dataset.motion = reduce ? 'reduced' : 'full';
  if (reduce === osReducesMotion()) return; // CSS already matches the OS setting
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; } // cross-origin (fonts)
    walk(rules, reduce);
  }
}
