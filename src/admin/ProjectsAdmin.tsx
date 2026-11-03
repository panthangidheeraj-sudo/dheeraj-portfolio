import { useState } from 'react';
import { Link } from 'react-router-dom';
import { projectCategories } from '../content/projects';
import type { CategoryKey, Project, Ratio } from '../content/types';
import { pad2 } from '../lib/store';
import { Confirm, Del, EdFoot, Ord, PathField, Star, Sw, Tabs, moveItem, newId, urlOk, useSlice, useToast } from './ui';

const RATIOS: [Ratio, number, number][] = [['9:16', 9, 16], ['1:1', 14, 14], ['16:9', 20, 11]];
const CASE: [keyof Project['cs'], string, string][] = [
  ['problem', 'Problem', 'What problem does this project solve, and for whom?'],
  ['approach', 'Approach', 'How did you approach it? Key decisions.'],
  ['architecture', 'Technical architecture', 'Stack, services, data flow.'],
  ['challenges', 'Challenges', 'What was hard, and how you handled it.'],
  ['outcomes', 'Outcomes', 'Results you can stand behind — no invented numbers.']
];
// Desktop / tablet / mobile column spans, matching the gallery layout.
const SPANS = {
  m: { '16:9': [6, 4, 4], '9:16': [3, 2, 2], '1:1': [3, 2, 2] },
  l: { '16:9': [9, 6, 4], '9:16': [4, 3, 2], '1:1': [6, 4, 4] }
} as const;
const span = (r: Ratio, s: 'm' | 'l') => SPANS[s][r];

export default function ProjectsAdmin() {
  const { draft: list, setDraft, dirty, commit, discard } = useSlice('projects');
  const { flash, node } = useToast();
  const [selId, setSelId] = useState(list[0]?.id || '');
  const [tab, setTab] = useState<'card' | 'case' | 'media'>('card');
  const [confirmId, setConfirmId] = useState('');
  const [tagDraft, setTagDraft] = useState('');
  const [mediaDraft, setMediaDraft] = useState('');
  const sorted = [...list].sort((a, b) => a.order - b.order);
  const sel = list.find((p) => p.id === selId) || sorted[0];
  const upd = (id: string, patch: Partial<Project>) => setDraft((l) => l.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const reorder = (i: number, d: -1 | 1) => setDraft(moveItem(sorted, i, d));
  const save = () => {
    const bad = list.find((p) => !urlOk(p.links.github) || !urlOk(p.links.live));
    if (bad) { setSelId(bad.id); setTab('card'); flash(`Fix the links on “${bad.title}” first — they must start with https://`); return; }
    const dupe = list.find((p, i) => list.findIndex((q) => q.slug === p.slug) !== i);
    if (dupe) { setSelId(dupe.id); flash(`Two projects use the slug “${dupe.slug}”. Slugs must be unique.`); return; }
    commit(); flash('Projects saved');
  };
  const add = () => {
    const id = newId('p');
    const p: Project = { id, slug: 'new-project-' + id.slice(-4), title: '[Project title]', short: '[Short description]', overview: '', categories: [], tech: [], cover: '/media/work/placeholder-10.jpg', alt: '', ratio: '1:1', size: 'm', role: '', links: { github: '', live: '' }, cs: {}, media: [], featured: false, published: false, order: list.length + 1 };
    setDraft([...sorted, p]); setSelId(id); setTab('card'); flash('Draft project added — it stays hidden until you publish it');
  };
  const sp = sel ? span(sel.ratio, sel.size) : [0, 0, 0];

  return (
    <>
      <header className="top">
        <div>
          <p className="crumb">Content / Projects</p>
          <h1>Projects</h1>
          <p>{pad2(list.length)} projects · {pad2(list.filter((p) => p.published).length)} published · {pad2(list.filter((p) => p.featured).length)} featured</p>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link className="btn" to="/work">Preview gallery</Link>
          <button className="btn primary" type="button" onClick={add}>+ New project</button>
        </div>
      </header>

      <div className="cols">
        <section className="list" aria-labelledby="list-h">
          <div className="list-head"><h2 id="list-h">Gallery order</h2><span>Top of the list appears first</span></div>
          <ul className="rows">
            {sorted.map((p, i) => (
              <li key={p.id} className={'row' + (p.id === sel?.id ? ' sel' : '')}>
                <Ord label={p.title} up={() => reorder(i, -1)} down={() => reorder(i, 1)} />
                <button className="pick" type="button" onClick={() => setSelId(p.id)}>
                  <span className="thumb"><img src={p.cover} alt="" loading="lazy" /></span>
                  <span className="pick-t"><b>{p.title}</b><small>{p.categories.map((c) => projectCategories.find((x) => x.key === c)?.label).join(' · ') || 'No category'}</small></span>
                </button>
                <span className="chip">{p.ratio}</span>
                <Sw on={p.published} onClick={() => upd(p.id, { published: !p.published })} label={`Published: ${p.title}`}>{p.published ? 'Live' : 'Draft'}</Sw>
                <Star on={p.featured} onClick={() => upd(p.id, { featured: !p.featured })} label={p.title} />
                <Del onClick={() => setConfirmId(p.id)} label={p.title} />
              </li>
            ))}
          </ul>
        </section>

        {sel && (
          <section className="editor" aria-labelledby="ed-h">
            <div className="ed-head">
              <div><h2 id="ed-h">{sel.title}</h2><p>/work/{sel.slug}</p></div>
              <span className={'chip' + (sel.published ? ' gold' : '')}>{sel.published ? 'Published' : 'Draft'}</span>
            </div>
            <Tabs tabs={[['card', 'Card & details'], ['case', 'Case study'], ['media', 'Media']]} value={tab} onChange={setTab} />

            {tab === 'card' && (
              <div className="ed-body">
                <div className="two">
                  <div className="field"><label htmlFor="f-title">Title</label><input className="in" id="f-title" value={sel.title} onChange={(e) => upd(sel.id, { title: e.target.value })} /></div>
                  <div className="field"><label htmlFor="f-slug">Slug</label><input className="in" id="f-slug" value={sel.slug} onChange={(e) => upd(sel.id, { slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-') })} /></div>
                </div>
                <div className="field"><label htmlFor="f-short">Short description</label><textarea className="in" id="f-short" rows={2} value={sel.short} onChange={(e) => upd(sel.id, { short: e.target.value })} /><span className="hint">Shown on hover in the gallery. One sentence.</span></div>
                <div className="field"><label htmlFor="f-ov">Overview</label><textarea className="in" id="f-ov" rows={4} value={sel.overview} onChange={(e) => upd(sel.id, { overview: e.target.value })} /></div>
                <div className="field"><label htmlFor="f-role">Your role</label><input className="in" id="f-role" value={sel.role} onChange={(e) => upd(sel.id, { role: e.target.value })} /></div>
                <div className="field"><span className="flabel">Categories</span>
                  <div className="chips">{projectCategories.filter((c) => c.key !== 'all').map((c) => {
                    const on = sel.categories.includes(c.key as CategoryKey);
                    return <button key={c.key} className={'chip' + (on ? ' gold' : '')} type="button" aria-pressed={on} style={{ cursor: 'pointer', background: 'none' }}
                      onClick={() => upd(sel.id, { categories: on ? sel.categories.filter((k) => k !== c.key) : [...sel.categories, c.key as CategoryKey] })}>{c.label}</button>;
                  })}</div>
                </div>
                <div className="field"><span className="flabel">Cover image</span>
                  <div className="cover">
                    <div className="cover-prev" style={{ aspectRatio: sel.ratio.replace(':', '/') }}><img src={sel.cover} alt="Cover preview" /></div>
                  </div>
                </div>
                <PathField id="f-cover" label="Cover path" value={sel.cover} onChange={(v) => upd(sel.id, { cover: v })} />
                <div className="field"><label htmlFor="f-alt">Cover description (alt text)</label><input className="in" id="f-alt" value={sel.alt} onChange={(e) => upd(sel.id, { alt: e.target.value })} /></div>
                <div className="field"><span className="flabel">Display ratio</span>
                  <div className="seg">{RATIOS.map(([r, w, h]) => <button key={r} className={sel.ratio === r ? 'on' : ''} type="button" onClick={() => upd(sel.id, { ratio: r })}><i style={{ width: w, height: h }} />{r}</button>)}</div>
                </div>
                <div className="field"><span className="flabel">Gallery size</span>
                  <div className="seg">{([['m', 'Standard'], ['l', 'Large']] as const).map(([k, l]) => <button key={k} className={sel.size === k ? 'on' : ''} type="button" onClick={() => upd(sel.id, { size: k })}>{l}</button>)}</div>
                  <div className="grid-prev" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} className={i < sp[0] ? 'hl' : ''} />)}</div>
                  <span className="hint">Desktop {sp[0]} of 12 columns · tablet {sp[1]} of 6 · mobile {sp[2]} of 4. List order sets placement.</span>
                </div>
                <div className="field"><span className="flabel">Technology tags</span>
                  <div className="tags">
                    {sel.tech.map((t, i) => <span className="tag" key={t + i}>{t}<button className="ibtn" type="button" onClick={() => upd(sel.id, { tech: sel.tech.filter((_, j) => j !== i) })} aria-label={`Remove ${t}`}>×</button></span>)}
                    <input className="in" style={{ width: 180, minHeight: 36 }} placeholder="Add tag, press Enter" aria-label="Add technology tag" value={tagDraft} onChange={(e) => setTagDraft(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && tagDraft.trim()) { e.preventDefault(); upd(sel.id, { tech: [...sel.tech, tagDraft.trim()] }); setTagDraft(''); } }} />
                  </div>
                </div>
                <div className="two">
                  <div className="field"><label htmlFor="f-gh">GitHub repository</label><input className={'in' + (urlOk(sel.links.github) ? '' : ' bad')} id="f-gh" placeholder="https://github.com/…" value={sel.links.github} onChange={(e) => upd(sel.id, { links: { ...sel.links, github: e.target.value } })} /><span className="hint">Leave empty to hide the button.</span></div>
                  <div className="field"><label htmlFor="f-live">Live deployment</label><input className={'in' + (urlOk(sel.links.live) ? '' : ' bad')} id="f-live" placeholder="https://…" value={sel.links.live} onChange={(e) => upd(sel.id, { links: { ...sel.links, live: e.target.value } })} /><span className="hint">Leave empty to hide the button.</span></div>
                </div>
                <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                  <Sw on={sel.published} onClick={() => upd(sel.id, { published: !sel.published })}>Published</Sw>
                  <Sw on={sel.featured} onClick={() => upd(sel.id, { featured: !sel.featured })}>Featured on homepage</Sw>
                </div>
              </div>
            )}

            {tab === 'case' && (
              <div className="ed-body">
                <p className="hint" style={{ margin: 0 }}>Empty sections are hidden on the case-study page.</p>
                {CASE.map(([k, l, ph]) => (
                  <div className="field" key={k}><label htmlFor={'cs-' + k}>{l}</label><textarea className="in" id={'cs-' + k} rows={4} placeholder={ph} value={sel.cs[k] || ''} onChange={(e) => upd(sel.id, { cs: { ...sel.cs, [k]: e.target.value } })} /></div>
                ))}
              </div>
            )}

            {tab === 'media' && (
              <div className="ed-body">
                <div className="field"><label htmlFor="m-add">Add screenshot or video</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="in" id="m-add" style={{ flex: '1 1 260px' }} placeholder="/media/work/evento-1.jpg or .mp4" value={mediaDraft} onChange={(e) => setMediaDraft(e.target.value)} />
                    <button className="btn" type="button" onClick={() => { const s = mediaDraft.trim(); if (!s) return; upd(sel.id, { media: [...sel.media, { src: s, ratio: '16:9', kind: /\.(mp4|webm|mov)$/i.test(s) ? 'video' : 'image' }] }); setMediaDraft(''); }}>Add</button>
                  </div>
                  <span className="hint">Put files in public/media/work/ first. Mix 16:9, 9:16 and 1:1 freely.</span>
                </div>
                {sel.media.length === 0 && <p className="hint" style={{ margin: 0 }}>No media yet. The case-study page shows labelled empty frames until media is added.</p>}
                <div className="media-grid">
                  {sel.media.map((m, i) => (
                    <div className="mitem" key={m.src + i}>
                      <div className="mbox" style={{ aspectRatio: m.ratio.replace(':', '/') }}>{m.kind === 'video' ? <video src={m.src} muted playsInline /> : <img src={m.src} alt="Media preview" />}</div>
                      <div className="seg" style={{ display: 'flex' }}>{RATIOS.map(([r]) => <button key={r} className={m.ratio === r ? 'on' : ''} type="button" style={{ flex: 1, padding: '0 6px', justifyContent: 'center', fontSize: 11 }} onClick={() => upd(sel.id, { media: sel.media.map((x, j) => (j === i ? { ...x, ratio: r } : x)) })}>{r}</button>)}</div>
                      <button className="btn ghost danger" type="button" style={{ minHeight: 36 }} onClick={() => upd(sel.id, { media: sel.media.filter((_, j) => j !== i) })}>Remove</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <EdFoot dirty={dirty} onDiscard={discard} onSave={save} />
          </section>
        )}
      </div>

      {confirmId && (
        <Confirm title={`Delete “${list.find((p) => p.id === confirmId)?.title}”?`} text="This removes the project and its case study. Unpublish it instead if you might want it back. Nothing is final until you save." action="Delete project"
          onCancel={() => setConfirmId('')} onConfirm={() => { setDraft(sorted.filter((p) => p.id !== confirmId).map((p, k) => ({ ...p, order: k + 1 }))); if (selId === confirmId) setSelId(''); setConfirmId(''); flash('Project removed — save to confirm'); }} />
      )}
      {node}
    </>
  );
}
