import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Content } from '../content/types';
import { projects } from '../content/projects';
import { achievements } from '../content/achievements';
import { services } from '../content/services';
import { site } from '../content/site';

// Frontend-only content store.
// Defaults come from src/content/*. The local admin (dev mode only) can override them in this browser;
// "Export" in the admin downloads JSON you can paste back into src/content to publish the change.
// When a backend is added, swap load/save for API calls — the pages don't change.

const KEY = 'dp-content-v1';
export const defaults: Content = { projects, achievements, services, site };

function load(): Content {
  if (!import.meta.env.DEV) return defaults;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaults;
    const saved = JSON.parse(raw) as Partial<Content>;
    return { ...defaults, ...saved };
  } catch {
    return defaults;
  }
}

interface Store {
  content: Content;
  save: (next: Content) => void;
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<Content>(load);
  const save = useCallback((next: Content) => {
    setContent(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* storage full or blocked — keep in memory */ }
  }, []);
  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    setContent(defaults);
  }, []);
  const value = useMemo(() => ({ content, save, reset }), [content, save, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContent() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useContent must be used inside ContentProvider');
  return c;
}

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const isPlaceholder = (s?: string) => !s || s.trim().charAt(0) === '[';

export function channelHref(key: string, value: string) {
  return key === 'email' ? 'mailto:' + value : value;
}
export function channelDisplay(key: string, value: string) {
  return key === 'email' ? value : value.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}
