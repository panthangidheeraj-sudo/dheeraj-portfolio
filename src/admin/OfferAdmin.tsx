import { useState } from 'react';
import { Link } from 'react-router-dom';
import { priceLabel } from '../content/services';
import type { PriceType, Service, ServicePackage } from '../content/types';
import { pad2 } from '../lib/store';
import { EdFoot, Sw, lines, newId, useSlice, useToast } from './ui';

const PRICE_TYPES: [PriceType, string][] = [
  ['starting', 'Starting at (₹ amount)'], ['fixed', 'Fixed price (₹ amount)'], ['hourly', 'Hourly rate (₹ amount)'], ['monthly', 'Monthly (₹ amount)'],
  ['enquiry', 'Price on enquiry'], ['custom', 'Custom quotation'], ['quote', 'Quoted per task'], ['project', 'Project-based quotation']
];
const AMOUNT_TYPES: PriceType[] = ['starting', 'fixed', 'hourly', 'monthly'];
const KEY = !!import.meta.env.VITE_WEB3FORMS_KEY;

export default function OfferAdmin() {
  const { draft: list, setDraft, dirty, commit, discard } = useSlice('services');
  const { flash, node } = useToast();
  const [selId, setSelId] = useState(list[0]?.id || '');
  const [view, setView] = useState<'svc' | 'enq'>('svc');
  const s = list.find((x) => x.id === selId) || list[0];
  const upd = (patch: Partial<Service>) => setDraft((l) => l.map((x) => (x.id === s.id ? { ...x, ...patch } : x)));
  const updPkg = (pid: string, patch: Partial<ServicePackage>) => upd({ packages: s.packages.map((p) => (p.id === pid ? { ...p, ...patch } : p)) });
  const hasPackages = s.id !== 'custom';

  return (
    <>
      <header className="top">
        <div><p className="crumb">Content / What I Offer</p><h1>{view === 'svc' ? 'Services' : 'Enquiries'}</h1><p>{pad2(list.length)} categories · {pad2(list.filter((x) => x.visible).length)} visible on the site</p></div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="seg"><button type="button" className={view === 'svc' ? 'on' : ''} onClick={() => setView('svc')}>Services</button><button type="button" className={view === 'enq' ? 'on' : ''} onClick={() => setView('enq')}>Enquiries</button></div>
          <Link className="btn" to="/offer">Preview page</Link>
        </div>
      </header>

      {view === 'enq' ? (
        <div className="body">
          <section className="card" aria-labelledby="enq-h">
            <h2 id="enq-h">Where enquiries go</h2>
            {KEY ? (
              <p className="hint" style={{ margin: 0 }}>Web3Forms is connected. Every enquiry is delivered to the inbox linked to your Web3Forms access key, with the visitor’s email set as reply-to.</p>
            ) : (
              <p className="hint" style={{ margin: 0 }}>No form service is connected yet, so the enquiry form opens the visitor’s email app with the enquiry already written, addressed to your email on the Contact page. Add a free Web3Forms key (see the README) to receive enquiries directly.</p>
            )}
            <p className="demo">An inbox with statuses and private notes needs a secure backend (planned: Supabase). Until then your email inbox is the inbox — nothing is stored on the site.</p>
          </section>
        </div>
      ) : (
        <div className="cols">
          <section className="list" aria-labelledby="svc-h">
            <div className="list-head"><h2 id="svc-h">Page sections</h2></div>
            <ul className="rows">
              {list.map((x, i) => (
                <li key={x.id} className={'row' + (x.id === s.id ? ' sel' : '')}>
                  <button className="pick" type="button" onClick={() => setSelId(x.id)}><span className="pick-n">{pad2(i + 1)}</span><span className="pick-t"><b>{x.title}</b><small>{x.packages.length ? `${x.packages.length} package${x.packages.length > 1 ? 's' : ''}` : 'Enquiry only'}</small></span></button>
                  <Sw on={x.visible} onClick={() => setDraft((l) => l.map((y) => (y.id === x.id ? { ...y, visible: !y.visible } : y)))} label={`Visible: ${x.title}`} />
                </li>
              ))}
            </ul>
          </section>

          <section className="editor" aria-labelledby="se-h">
            <div className="ed-head"><div><h2 id="se-h">{s.title}</h2><p>{s.visible ? 'Visible on the site' : 'Hidden'}</p></div></div>
            <div className="ed-body">
              <div className="two">
                <div className="field"><label htmlFor="s-title">Title</label><input className="in" id="s-title" value={s.title} onChange={(e) => upd({ title: e.target.value })} /></div>
                <div className="field"><label htmlFor="s-cta">Button text</label><input className="in" id="s-cta" value={s.cta} onChange={(e) => upd({ cta: e.target.value })} /></div>
              </div>
              <div className="field"><label htmlFor="s-desc">Description</label><textarea className="in" id="s-desc" value={s.desc} onChange={(e) => upd({ desc: e.target.value })} /></div>
              {['marketing', 'ai', 'hire'].includes(s.id) && (
                <div className="field"><label htmlFor="s-items">Offerings — one per line</label><textarea className="in" id="s-items" rows={7} value={s.items.join('\n')} onChange={(e) => upd({ items: lines(e.target.value) })} /></div>
              )}
              {s.id === 'ai' && (
                <div className="field"><label htmlFor="s-note">Pricing note</label><textarea className="in" id="s-note" rows={3} value={s.pricingNote || ''} onChange={(e) => upd({ pricingNote: e.target.value })} /></div>
              )}
              {hasPackages && (
                <div className="field">
                  <div className="list-head" style={{ margin: 0 }}><span className="flabel">Packages &amp; pricing</span>
                    {s.id !== 'ai' && <button className="btn sm" type="button" onClick={() => upd({ packages: [...s.packages, { id: newId('k'), name: 'New package', priceType: 'enquiry', amount: null, showPrice: true, desc: '', included: [], examples: [] }] })}>+ Add package</button>}
                  </div>
                  {s.packages.map((p) => {
                    const amountOn = AMOUNT_TYPES.includes(p.priceType);
                    return (
                      <div className="pkg" key={p.id}>
                        <div className="pkg-head"><b>{p.name}</b><span className="preview-price">{priceLabel(p).kicker} · {priceLabel(p).text}</span></div>
                        <div className="two">
                          <div className="field"><label htmlFor={p.id + '-n'}>Package name</label><input className="in" id={p.id + '-n'} value={p.name} onChange={(e) => updPkg(p.id, { name: e.target.value })} /></div>
                          <div className="field"><label htmlFor={p.id + '-t'}>Price display</label>
                            <select className="in" id={p.id + '-t'} value={p.priceType} onChange={(e) => updPkg(p.id, { priceType: e.target.value as PriceType })}>{PRICE_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
                          <div className="field"><label htmlFor={p.id + '-a'}>Amount (₹)</label>
                            <input className="in" id={p.id + '-a'} type="number" min="0" step="100" placeholder="Not set" disabled={!amountOn} value={p.amount ?? ''}
                              onChange={(e) => updPkg(p.id, { amount: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })} /></div>
                        </div>
                        <div className="field"><label htmlFor={p.id + '-d'}>Package description</label><textarea className="in" id={p.id + '-d'} rows={2} value={p.desc} onChange={(e) => updPkg(p.id, { desc: e.target.value })} /></div>
                        {s.id === 'web' && (
                          <div className="two">
                            <div className="field"><label htmlFor={p.id + '-i'}>Included work — one per line</label><textarea className="in" id={p.id + '-i'} rows={4} value={(p.included || []).join('\n')} onChange={(e) => updPkg(p.id, { included: lines(e.target.value) })} /></div>
                            <div className="field"><label htmlFor={p.id + '-e'}>Typical projects — one per line</label><textarea className="in" id={p.id + '-e'} rows={4} value={(p.examples || []).join('\n')} onChange={(e) => updPkg(p.id, { examples: lines(e.target.value) })} /></div>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          <Sw on={p.showPrice} onClick={() => updPkg(p.id, { showPrice: !p.showPrice })}>Show price on the site</Sw>
                          {s.id !== 'ai' && <button className="btn sm danger" type="button" onClick={() => upd({ packages: s.packages.filter((q) => q.id !== p.id) })}>Remove package</button>}
                        </div>
                      </div>
                    );
                  })}
                  <span className="hint">With no amount set, the site shows “Let’s discuss your requirements”, “Price on enquiry” or “Custom quotation” — never an invented number.</span>
                </div>
              )}
            </div>
            <EdFoot dirty={dirty} onDiscard={discard} onSave={() => { commit(); flash('Services saved'); }} />
          </section>
        </div>
      )}
      {node}
    </>
  );
}
