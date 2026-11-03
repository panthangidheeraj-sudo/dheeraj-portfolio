import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { achievementCategories, standTypes } from '../content/achievements';
import type { Achievement, AchievementCategory } from '../content/types';
import { pad2 } from '../lib/store';
import { Confirm, Del, EdFoot, Ord, PathField, Star, Sw, Tabs, moveItem, newId, urlOk, useSlice, useToast } from './ui';

const ICONS: Record<string, string> = {
  vitrine: 'M12 36h16M13 36V22h14v14M13 22V8h14v14M13 8l14 0',
  monument: 'M14 36h12M16 36V18h8v18M17 18c0-4 6-4 6 0M20 8v6M16 10h8',
  wall: 'M8 8h24v18H8zM12 12h16v10H12zM30 30h4',
  case: 'M5 24h30v6H5zM7 30v6M33 30v6M6 24l3-6h22l3 6M12 21h7',
  floating: 'M8 10h24v14H8zM14 34h12M12 30c0-2 16-2 16 0'
};
const S = 14; // floor-plan pixels per metre
const toPx = (x: number, z: number) => ({ left: Math.round(126 + x * S), top: Math.round(-z * S) });

// Keep stands inside the building: wall pieces snap to a side wall; floor stands avoid the walls and the partition.
function constrain(e: Achievement, x: number, z: number): Partial<Achievement> {
  z = Math.max(-43, Math.min(-1.5, z));
  if (e.type === 'wall') {
    const right = x >= 0;
    return { x: right ? 8.97 : -8.97, z: Math.round(z * 4) / 4, rot: right ? -90 : 90, room: z > -24 ? 1 : 2 };
  }
  x = Math.max(-7.8, Math.min(7.8, x));
  if (z < -23 && z > -25.2) z = z > -24 ? -23 : -25.2;
  return { x: Math.round(x * 4) / 4, z: Math.round(z * 4) / 4, room: z > -24 ? 1 : 2 };
}

export default function AchievementsAdmin() {
  const { draft: list, setDraft, dirty, commit, discard } = useSlice('achievements');
  const { flash, node } = useToast();
  const [selId, setSelId] = useState(list[0]?.id || '');
  const [tab, setTab] = useState<'details' | 'media' | 'exhibit'>('details');
  const [confirmId, setConfirmId] = useState('');
  const [photoDraft, setPhotoDraft] = useState('');
  const drag = useRef('');
  const sorted = [...list].sort((a, b) => a.order - b.order);
  const sel = list.find((e) => e.id === selId) || sorted[0];
  const upd = (id: string, patch: Partial<Achievement>) => setDraft((l) => l.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  const cat = (k: string) => achievementCategories.find((c) => c[0] === k)?.[1] || k;
  const typeName = (k: string) => standTypes.find((t) => t[0] === k)?.[1] || k;

  const save = () => {
    const bad = list.find((e) => !urlOk(e.verify));
    if (bad) { setSelId(bad.id); setTab('details'); flash(`The verification link on “${bad.title}” must start with https://`); return; }
    commit(); flash('Museum saved');
  };
  const add = () => {
    const id = newId('a');
    const a: Achievement = { id, title: '[Achievement title]', org: '[Organisation]', date: '[Date]', category: 'milestones', description: '[Description]', cert: '/media/museum/cert-cert1.jpg', pdf: '', verify: '', photos: [], type: 'case', room: 1, x: 0, z: -12, rot: 0, size: 1, light: 1, featured: false, published: false, order: list.length + 1 };
    setDraft([...sorted, a]); setSelId(id); setTab('details'); flash('Draft exhibit added — it stays off display until you switch it on');
  };
  const planMove = (ev: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const r = ev.currentTarget.getBoundingClientRect();
    const e = list.find((k) => k.id === drag.current);
    if (e) upd(e.id, constrain(e, (ev.clientX - r.left - 126) / S, -(ev.clientY - r.top) / S));
  };
  const nudge = (dx: number, dz: number) => sel && upd(sel.id, constrain(sel, sel.x + dx, sel.z + dz));

  return (
    <>
      <header className="top">
        <div>
          <p className="crumb">Content / Achievements</p>
          <h1>Achievements</h1>
          <p>{pad2(list.length)} exhibits · {pad2(list.filter((e) => e.published).length)} on display · {pad2(list.filter((e) => e.featured).length)} featured</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn" to="/achievements">Preview museum</Link>
          <button className="btn primary" type="button" onClick={add}>+ New achievement</button>
        </div>
      </header>

      <div className="cols">
        <section className="list" aria-labelledby="list-h">
          <div className="list-head"><h2 id="list-h">Tour order</h2></div>
          <ul className="rows">
            {sorted.map((e, i) => (
              <li key={e.id} className={'row' + (e.id === sel?.id ? ' sel' : '')}>
                <Ord label={e.title} up={() => setDraft(moveItem(sorted, i, -1))} down={() => setDraft(moveItem(sorted, i, 1))} />
                <button className="pick" type="button" onClick={() => setSelId(e.id)}>
                  <span className="thumb"><img src={e.cert} alt="" loading="lazy" /></span>
                  <span className="pick-t"><b>{e.title}</b><small>{cat(e.category)} · {typeName(e.type)}</small></span>
                </button>
                <Sw on={e.published} onClick={() => upd(e.id, { published: !e.published })} label={`On display: ${e.title}`} />
                <Star on={e.featured} onClick={() => upd(e.id, { featured: !e.featured })} label={e.title} />
                <Del onClick={() => setConfirmId(e.id)} label={e.title} />
              </li>
            ))}
          </ul>
        </section>

        {sel && (
          <section className="editor" aria-labelledby="ed-h">
            <div className="ed-head">
              <div><h2 id="ed-h">{sel.title}</h2><p>{typeName(sel.type)} · {sel.room === 1 ? 'Hall I' : 'Hall II'}</p></div>
              <span className={'chip' + (sel.published ? ' gold' : '')}>{sel.published ? 'On display' : 'Draft'}</span>
            </div>
            <Tabs tabs={[['details', 'Details'], ['media', 'Certificate & media'], ['exhibit', 'Exhibition']]} value={tab} onChange={setTab} />

            {tab === 'details' && (
              <div className="ed-body">
                <p className="hint" style={{ margin: 0 }}>Only enter real details. Anything in [square brackets] is shown as a placeholder.</p>
                <div className="field"><label htmlFor="a-title">Display title</label><input className="in" id="a-title" value={sel.title} onChange={(e) => upd(sel.id, { title: e.target.value })} /></div>
                <div className="two">
                  <div className="field"><label htmlFor="a-org">Issuing organisation</label><input className="in" id="a-org" value={sel.org} onChange={(e) => upd(sel.id, { org: e.target.value })} /></div>
                  <div className="field"><label htmlFor="a-date">Date (as shown)</label><input className="in" id="a-date" placeholder="e.g. March 2026" value={sel.date} onChange={(e) => upd(sel.id, { date: e.target.value })} /></div>
                </div>
                <div className="field"><label htmlFor="a-cat">Category</label>
                  <select className="in" id="a-cat" value={sel.category} onChange={(e) => upd(sel.id, { category: e.target.value as AchievementCategory })}>{achievementCategories.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                </div>
                <div className="field"><label htmlFor="a-desc">Description</label><textarea className="in" id="a-desc" rows={5} value={sel.description} onChange={(e) => upd(sel.id, { description: e.target.value })} /></div>
                <div className="field"><label htmlFor="a-ver">Verification URL — optional</label><input className={'in' + (urlOk(sel.verify) ? '' : ' bad')} id="a-ver" placeholder="https://…" value={sel.verify} onChange={(e) => upd(sel.id, { verify: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <Sw on={sel.published} onClick={() => upd(sel.id, { published: !sel.published })}>On display</Sw>
                  <Sw on={sel.featured} onClick={() => upd(sel.id, { featured: !sel.featured })}>Featured</Sw>
                </div>
              </div>
            )}

            {tab === 'media' && (
              <div className="ed-body">
                <div className="field"><span className="flabel">Certificate image</span>
                  <div className="cover"><div className="cover-prev"><img src={sel.cert} alt="Certificate preview" /></div></div>
                </div>
                <PathField id="a-cert" label="Certificate image path" value={sel.cert} onChange={(v) => upd(sel.id, { cert: v })} hint="Put the file in public/media/museum/ — landscape images around 2048px wide work best." />
                <PathField id="a-pdf" label="Certificate PDF path — optional" value={sel.pdf} onChange={(v) => upd(sel.id, { pdf: v })} hint="Visitors get an “Open PDF” link in the exhibit panel." />
                <div className="field"><span className="flabel">Supporting photographs</span>
                  <div className="photos">{sel.photos.map((p, i) => <div key={p + i}><img src={p} alt="Supporting photograph" /><button className="ibtn" type="button" onClick={() => upd(sel.id, { photos: sel.photos.filter((_, j) => j !== i) })} aria-label="Remove photograph">×</button></div>)}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="in" style={{ flex: '1 1 240px' }} aria-label="Photograph path" placeholder="/media/museum/photo-….jpg" value={photoDraft} onChange={(e) => setPhotoDraft(e.target.value)} />
                    <button className="btn" type="button" onClick={() => { if (!photoDraft.trim()) return; upd(sel.id, { photos: [...sel.photos, photoDraft.trim()] }); setPhotoDraft(''); }}>Add photo</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 'exhibit' && (
              <div className="ed-body">
                <div className="field"><span className="flabel">Stand type</span>
                  <div className="types">{standTypes.map(([k, l]) => (
                    <button key={k} className={'type' + (sel.type === k ? ' on' : '')} type="button" aria-pressed={sel.type === k}
                      onClick={() => { const next = { ...sel, type: k }; upd(sel.id, { type: k, ...constrain(next, k === 'wall' ? sel.x : Math.abs(sel.x) === 8.97 ? sel.x * 0.55 : sel.x, sel.z) }); }}>
                      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.1" aria-hidden="true"><path d={ICONS[k]} /></svg>{l}
                    </button>
                  ))}</div>
                </div>
                {sel.type === 'monument' && (
                  <div className="field"><label htmlFor="a-obj">Centrepiece</label>
                    <select className="in" id="a-obj" value={sel.object || 'prism'} onChange={(e) => upd(sel.id, { object: e.target.value as Achievement['object'] })}>
                      <option value="prism">Glass prism</option><option value="chip">Processor chip</option><option value="auger">Auger</option><option value="vessel">Vessel</option>
                    </select>
                  </div>
                )}
                <div className="arr">
                  <div className="plan-wrap">
                    <span className="flabel">Floor plan — drag to place</span>
                    <div className="plan" onPointerMove={planMove} onPointerUp={() => { drag.current = ''; }} onPointerLeave={() => { drag.current = ''; }}>
                      <span className="door" style={{ left: 102, width: 48 }} />
                      <span className="room-l" style={{ top: 12 }}>Hall I · Entrance</span>
                      <span className="part" style={{ top: Math.round(24 * S - 4) }} />
                      <span className="portal" style={{ top: Math.round(24 * S - 4), left: 95, width: 62 }} />
                      <span className="room-l" style={{ top: Math.round(24 * S + 12) }}>Hall II</span>
                      <span className="finalw" />
                      {sorted.map((e, i) => {
                        const p = toPx(e.x, e.z);
                        return (
                          <button key={e.id} className={'mk r-' + e.type + (e.id === sel.id ? ' sel' : '') + (e.published ? '' : ' off')} type="button" style={{ left: p.left, top: p.top }}
                            aria-label={`${e.title} — drag to move, or select and use the arrow buttons`}
                            onPointerDown={(ev) => { ev.preventDefault(); setSelId(e.id); drag.current = e.id; }}
                            onClick={() => setSelId(e.id)}><span>{i + 1}</span></button>
                        );
                      })}
                    </div>
                    <span className="hint">Entrance at top · closing wall at bottom</span>
                  </div>
                  <div className="arr-ctl">
                    <div className="field"><span className="flabel">Room</span>
                      <div className="seg">{([1, 2] as const).map((r) => <button key={r} type="button" className={sel.room === r ? 'on' : ''} onClick={() => { if (sel.room !== r) upd(sel.id, constrain(sel, sel.x, r === 1 ? -12 : -34)); }}>{r === 1 ? 'Hall I' : 'Hall II'}</button>)}</div>
                    </div>
                    <div className="field"><span className="flabel">Fine position</span>
                      <div className="seg">
                        <button type="button" onClick={() => nudge(-0.25, 0)} aria-label="Move left">←</button>
                        <button type="button" onClick={() => nudge(0, 0.25)} aria-label="Move towards the entrance">↑</button>
                        <button type="button" onClick={() => nudge(0, -0.25)} aria-label="Move towards the closing wall">↓</button>
                        <button type="button" onClick={() => nudge(0.25, 0)} aria-label="Move right">→</button>
                      </div>
                    </div>
                    <div className="field"><span className="flabel">Facing</span>
                      <div className="seg">
                        <button type="button" disabled={sel.type === 'wall'} onClick={() => upd(sel.id, { rot: ((sel.rot - 15 + 540) % 360) - 180 })}>↺ 15°</button>
                        <button type="button" className="on" style={{ pointerEvents: 'none' }}>{sel.rot}°</button>
                        <button type="button" disabled={sel.type === 'wall'} onClick={() => upd(sel.id, { rot: ((sel.rot + 15 + 540) % 360) - 180 })}>↻ 15°</button>
                      </div>
                      <span className="hint">Wall exhibits snap to the nearest wall and face the room.</span>
                    </div>
                    <div className="field"><label htmlFor="a-size">Display size</label><div className="range"><input id="a-size" type="range" min="0.8" max="1.3" step="0.05" value={sel.size} onChange={(e) => upd(sel.id, { size: +e.target.value })} /><output>{Math.round(sel.size * 100)}%</output></div></div>
                    <div className="field"><label htmlFor="a-light">Spotlight intensity</label><div className="range"><input id="a-light" type="range" min="0.5" max="1.5" step="0.05" value={sel.light} onChange={(e) => upd(sel.id, { light: +e.target.value })} /><output>{Math.round(sel.light * 100)}%</output></div><span className="hint">Limited to 50–150% so no exhibit blows out or disappears.</span></div>
                    <div className="field"><span className="flabel">Position</span><span className="hint">x {sel.x} m · z {sel.z} m · tour stop {sorted.findIndex((e) => e.id === sel.id) + 1}</span></div>
                  </div>
                </div>
              </div>
            )}

            <EdFoot dirty={dirty} onDiscard={discard} onSave={save} />
          </section>
        )}
      </div>

      {confirmId && (
        <Confirm title={`Delete “${list.find((e) => e.id === confirmId)?.title}”?`} text="This removes the exhibit from the museum. Switch it off display instead if you might want it back. Nothing is final until you save." action="Delete exhibit"
          onCancel={() => setConfirmId('')} onConfirm={() => { setDraft(sorted.filter((e) => e.id !== confirmId).map((e, k) => ({ ...e, order: k + 1 }))); if (selId === confirmId) setSelId(''); setConfirmId(''); flash('Exhibit removed — save to confirm'); }} />
      )}
      {node}
    </>
  );
}
