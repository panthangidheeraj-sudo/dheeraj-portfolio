import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useContent } from '../lib/store';
import type { Content } from '../content/types';

// Local draft of one slice of the content store. Nothing reaches the store until "Save".
export function useSlice<K extends keyof Content>(key: K) {
  const { content, save } = useContent();
  const [draft, setDraftRaw] = useState<Content[K]>(() => structuredClone(content[key]));
  const [dirty, setDirty] = useState(false);
  const setDraft = useCallback((next: Content[K] | ((d: Content[K]) => Content[K])) => {
    setDraftRaw((d) => (typeof next === 'function' ? (next as (d: Content[K]) => Content[K])(d) : next));
    setDirty(true);
  }, []);
  const commit = () => { save({ ...content, [key]: draft }); setDirty(false); };
  const discard = () => { setDraftRaw(structuredClone(content[key])); setDirty(false); };
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  return { draft, setDraft, dirty, commit, discard };
}

export function useToast() {
  const [msg, setMsg] = useState('');
  const t = useRef<number>();
  useEffect(() => () => window.clearTimeout(t.current), []);
  const flash = useCallback((m: string) => { setMsg(m); window.clearTimeout(t.current); t.current = window.setTimeout(() => setMsg(''), 2600); }, []);
  const node = msg ? <div className="toast" role="status"><i />{msg}</div> : null;
  return { flash, node };
}

export function moveItem<T extends { order: number }>(list: T[], i: number, d: -1 | 1): T[] {
  const j = i + d;
  if (j < 0 || j >= list.length) return list;
  const next = list.slice();
  [next[i], next[j]] = [next[j], next[i]];
  return next.map((x, k) => ({ ...x, order: k + 1 }));
}

export const newId = (p: string) => p + Math.random().toString(36).slice(2, 8);
export const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);
export const urlOk = (v: string) => !v.trim() || /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(v.trim());

export function Ord({ label, up, down }: { label: string; up: () => void; down: () => void }) {
  return (
    <div className="ord">
      <button className="ibtn" type="button" onClick={up} aria-label={`Move ${label} up`}><svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 5l4-4 4 4" stroke="currentColor" strokeWidth="1.2" /></svg></button>
      <button className="ibtn" type="button" onClick={down} aria-label={`Move ${label} down`}><svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.2" /></svg></button>
    </div>
  );
}

export function Sw({ on, onClick, children, label }: { on: boolean; onClick: () => void; children?: ReactNode; label?: string }) {
  return <button className={'sw' + (on ? ' on' : '')} type="button" aria-pressed={on} aria-label={label} onClick={onClick}><i />{children}</button>;
}

export function Star({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button className={'ibtn' + (on ? ' star-on' : '')} type="button" aria-pressed={on} onClick={onClick} aria-label={`Featured: ${label}`}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
    </button>
  );
}

export function Del({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button className="ibtn del" type="button" onClick={onClick} aria-label={`Delete ${label}`}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>
    </button>
  );
}

export function Confirm({ title, text, action, onCancel, onConfirm }: { title: string; text: string; action: string; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  }, [onCancel]);
  return (
    <div className="scrim">
      <div className="modal" role="alertdialog" aria-modal="true" aria-labelledby="cf-h" aria-describedby="cf-p">
        <h3 id="cf-h">{title}</h3>
        <p id="cf-p">{text}</p>
        <div>
          <button className="btn" type="button" ref={ref} onClick={onCancel}>Cancel</button>
          <button className="btn danger" type="button" onClick={onConfirm}>{action}</button>
        </div>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: [T, string][]; value: T; onChange: (t: T) => void }) {
  return (
    <div className="tabs" role="tablist">
      {tabs.map(([k, l]) => <button key={k} className={'tab' + (value === k ? ' on' : '')} type="button" role="tab" aria-selected={value === k} onClick={() => onChange(k)}>{l}</button>)}
    </div>
  );
}

export function EdFoot({ dirty, onDiscard, onSave }: { dirty: boolean; onDiscard: () => void; onSave: () => void }) {
  return (
    <div className="ed-foot">
      <span className={dirty ? 'dirty' : ''}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn ghost" type="button" onClick={onDiscard} disabled={!dirty}>Discard</button>
        <button className="btn primary" type="button" onClick={onSave} disabled={!dirty}>Save changes</button>
      </div>
    </div>
  );
}

// Image paths point at files in /public. Upload the file there, then enter its path.
export function PathField({ id, label, value, onChange, hint }: { id: string; label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input className="in" id={id} value={value} placeholder="/media/…" onChange={(e) => onChange(e.target.value)} />
      <span className="hint">{hint || 'Put the file in public/media/ and enter its path, e.g. /media/work/my-project.jpg'}</span>
    </div>
  );
}
