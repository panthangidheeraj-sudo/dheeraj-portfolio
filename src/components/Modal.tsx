import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { lockScroll } from '../lib/smooth';

// Accessible modal: traps focus, closes on Escape / backdrop click, restores focus, locks page scroll.
export default function Modal({ label, onClose, children, scope }: { label: string; onClose: () => void; children: ReactNode; scope: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () => Array.from(el?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])') || []);
    focusables()[0]?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    lockScroll(true);
    return () => { document.removeEventListener('keydown', onKey); lockScroll(false); prev?.focus(); };
  }, [onClose]);
  return createPortal(
    <div className={'dp ' + scope} style={{ position: 'static' }}>
      <div className="scrim" role="dialog" aria-modal="true" aria-label={label} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="sheet" ref={ref}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
