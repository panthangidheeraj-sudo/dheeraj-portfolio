import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ContactChannel, SiteSettings } from '../content/types';
import { emailOk } from '../lib/submit';
import { Sw, useSlice, useToast, EdFoot } from './ui';

const PH: Record<ContactChannel['key'], string> = {
  email: 'you@example.com',
  linkedin: 'https://www.linkedin.com/in/…',
  github: 'https://github.com/…',
  instagram: 'https://www.instagram.com/…'
};
const HOSTS: Record<string, RegExp> = { linkedin: /linkedin\.com\//i, github: /github\.com\//i, instagram: /instagram\.com\//i };

function check(c: ContactChannel) {
  const v = c.value.trim();
  if (!v) return '';
  if (c.key === 'email') return emailOk(v) ? '' : 'That email address doesn’t look right.';
  if (!/^https:\/\/[^\s]+$/i.test(v)) return 'Use the full link, starting with https://';
  if (HOSTS[c.key] && !HOSTS[c.key].test(v)) return `This doesn’t look like a ${c.label} link.`;
  return '';
}

export default function ContactAdmin() {
  const { draft: cfg, setDraft, dirty, commit, discard } = useSlice('site');
  const { flash, node } = useToast();
  const [view, setView] = useState<'content' | 'msgs'>('content');
  const set = (patch: Partial<SiteSettings>) => setDraft((d) => ({ ...d, ...patch }));
  const setCh = (key: string, patch: Partial<ContactChannel>) => set({ channels: cfg.channels.map((c) => (c.key === key ? { ...c, ...patch } : c)) });
  const live = cfg.channels.filter((c) => c.enabled && c.value.trim() && !check(c)).length;
  const KEY = !!import.meta.env.VITE_WEB3FORMS_KEY;

  const save = () => {
    const bad = cfg.channels.find((c) => check(c));
    if (bad) { flash(`Fix the ${bad.label} value first`); document.getElementById('ch-' + bad.key)?.focus(); return; }
    commit(); flash('Contact page saved');
  };

  return (
    <>
      <header className="top">
        <div><p className="crumb">Content / Contact page</p><h1>{view === 'content' ? 'Contact page' : 'Messages'}</h1><p>{live} of {cfg.channels.length} channels live on the site</p></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="seg"><button type="button" className={view === 'content' ? 'on' : ''} onClick={() => setView('content')}>Page content</button><button type="button" className={view === 'msgs' ? 'on' : ''} onClick={() => setView('msgs')}>Messages</button></div>
          <Link className="btn" to="/contact">Preview page</Link>
        </div>
      </header>

      {view === 'msgs' ? (
        <div className="body">
          <section className="card" aria-labelledby="m-h">
            <h2 id="m-h">Where messages go</h2>
            <p className="hint" style={{ margin: 0 }}>
              {KEY
                ? 'Web3Forms is connected. Messages from the correspondence desk are delivered to the inbox linked to your access key, and the envelope animation plays only after Web3Forms confirms delivery.'
                : 'No form service is connected yet, so the correspondence desk opens the visitor’s email app with their letter already written. The site says so plainly — the “Delivered with care” envelope never plays unless delivery is confirmed.'}
            </p>
            <p className="demo">A message inbox with statuses and private notes needs a secure backend (planned: Supabase). Until then, messages arrive in your email.</p>
          </section>
        </div>
      ) : (
        <>
          <div className="body">
            <section className="card" aria-labelledby="ch-h">
              <h2 id="ch-h">Contact channels</h2>
              <p className="hint" style={{ margin: 0 }}>A channel only appears on the site when it’s switched on <em>and</em> has a valid value. Nothing is ever shown as an empty link.</p>
              {cfg.channels.map((c) => {
                const err = check(c);
                const state = !c.enabled ? 'Hidden' : !c.value.trim() ? 'Not set — hidden' : err ? 'Invalid — hidden' : 'Live';
                return (
                  <div className="chan" key={c.key}>
                    <b>{c.label}<small>{state}</small></b>
                    <div className="field">
                      <label className="vh" htmlFor={'ch-' + c.key}>{c.label}</label>
                      <input className={'in' + (err ? ' bad' : '')} id={'ch-' + c.key} type={c.key === 'email' ? 'email' : 'url'} placeholder={PH[c.key]} value={c.value} aria-invalid={!!err} onChange={(e) => setCh(c.key, { value: e.target.value })} />
                      <span className="bad-msg">{err}</span>
                    </div>
                    <Sw on={c.enabled} onClick={() => setCh(c.key, { enabled: !c.enabled })}>Show</Sw>
                  </div>
                );
              })}
            </section>
            <section className="card" aria-labelledby="in-h">
              <h2 id="in-h">Introduction</h2>
              <div className="field"><label htmlFor="f-ih">Heading</label><input className="in" id="f-ih" value={cfg.introHeading} onChange={(e) => set({ introHeading: e.target.value })} /></div>
              <div className="field"><label htmlFor="f-it">Description</label><textarea className="in" id="f-it" value={cfg.introText} onChange={(e) => set({ introText: e.target.value })} /></div>
            </section>
            <section className="card" aria-labelledby="cl-h">
              <h2 id="cl-h">Closing — The next chapter</h2>
              <div className="field"><label htmlFor="f-ch">Heading</label><input className="in" id="f-ch" value={cfg.closingHeading} onChange={(e) => set({ closingHeading: e.target.value })} /></div>
              <div className="field"><label htmlFor="f-ct">Message</label><textarea className="in" id="f-ct" value={cfg.closingText} onChange={(e) => set({ closingText: e.target.value })} /></div>
            </section>
          </div>
          <EdFoot dirty={dirty} onDiscard={discard} onSave={save} />
        </>
      )}
      {node}
    </>
  );
}
