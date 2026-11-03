import { useEffect, useId, useRef, useState } from 'react';
import '../styles/enq.css';
import { emailOk, sendMessage } from '../lib/submit';
import { useContent } from '../lib/store';

const SERVICES: [string, string, string, string[]][] = [
  ['web', 'Web development', 'Project scale', ['Small scale', 'Medium scale', 'Large scale']],
  ['marketing', 'Digital marketing', 'Engagement', ['Individual task / campaign', 'Monthly support', 'Custom marketing requirements']],
  ['ai', 'AI & software development', '', []],
  ['hire', 'Direct development hiring', 'Engagement', ['Task-based', 'Hourly / time-based']],
  ['custom', 'Custom project', '', []]
];
const BUDGETS = ['Under ₹5,000', '₹5,000 – ₹15,000', '₹15,000 – ₹50,000', '₹50,000 – ₹1,50,000', 'Above ₹1,50,000', 'Not sure yet'];
const TIMELINES = ['As soon as possible', 'Within a month', '1 – 3 months', '3 months or more'];
const EMPTY = { name: '', email: '', service: '', scale: '', budget: '', timeline: '', desc: '', links: '', website: '' };
type V = typeof EMPTY;

function validate(v: V) {
  const e: Partial<Record<keyof V, string>> = {};
  if (v.name.trim().length < 2) e.name = 'Please enter your name.';
  if (!v.email.trim()) e.email = 'Please enter your email address.';
  else if (!emailOk(v.email)) e.email = 'That email address doesn’t look right.';
  if (!v.service) e.service = 'Choose the service closest to your project.';
  if (v.desc.trim().length < 20) e.desc = 'A few sentences help me understand the project (at least 20 characters).';
  if (v.links.trim() && v.links.split(/[\s,]+/).filter(Boolean).some((l) => !/^https?:\/\/[^\s.]+\.[^\s]+$/i.test(l))) e.links = 'Links should start with http:// or https://';
  return e;
}

export default function EnquiryForm({ variant = 'inline', presetService = '', presetScale = '', onClose }: { variant?: 'inline' | 'modal'; presetService?: string; presetScale?: string; onClose?: () => void }) {
  const uid = useId().replace(/:/g, '');
  const { content } = useContent();
  const to = content.site.channels.find((c) => c.key === 'email')?.value || '';
  const [v, setV] = useState<V>({ ...EMPTY, service: presetService, scale: presetScale });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState<null | 'sent' | 'mailto'>(null);
  const busy = useRef(false);
  useEffect(() => { setV((x) => ({ ...x, service: presetService || x.service, scale: presetScale })); }, [presetService, presetScale]);

  const errs = touched ? validate(v) : {};
  const def = SERVICES.find((s) => s[0] === v.service);
  const id = (k: string) => `${uid}-${k}`;
  const set = (k: keyof V) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setV((x) => ({ ...x, [k]: e.target.value, ...(k === 'service' ? { scale: '' } : {}) }));
  const cls = (k: keyof V) => 'in' + (errs[k] ? ' bad' : '');
  const a11y = (k: keyof V) => ({ 'aria-invalid': !!errs[k], 'aria-describedby': id(k + '-m') });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy.current) return; // no duplicate submissions
    const found = validate(v);
    if (Object.keys(found).length) {
      setTouched(true); setFailed(false);
      const first = (['name', 'email', 'service', 'desc', 'links'] as const).find((k) => found[k]);
      if (first) document.getElementById(id(first))?.focus();
      return;
    }
    busy.current = true; setTouched(true); setSending(true); setFailed(false);
    try {
      const res = await sendMessage({
        to, subject: `Project enquiry — ${def?.[1] || v.service}${v.scale ? ' · ' + v.scale : ''}`, fromName: v.name.trim(), replyTo: v.email.trim(), botcheck: v.website,
        fields: { Name: v.name.trim(), Email: v.email.trim(), Service: def?.[1] || v.service, 'Scale / engagement': v.scale, Budget: v.budget, Timeline: v.timeline, Project: v.desc.trim(), References: v.links.trim() }
      });
      if (res.mode === 'mailto') window.location.href = res.href;
      setDone(res.mode);
    } catch {
      setFailed(true); // everything typed is kept
    } finally {
      busy.current = false; setSending(false);
    }
  };

  return (
    <section className="enq-scope" aria-labelledby={id('h')}>
      <div className="enq-in">
        {!done ? (
          <div>
            <div className="enq-top">
              <div>
                <p className="eyebrow">Project enquiry</p>
                <h2 id={id('h')}>Tell me what you’re building.</h2>
                <p className="lead">Every enquiry comes straight to me. Share as much or as little as you have — I’ll reply with questions or a quotation.</p>
              </div>
              {variant === 'modal' && <button className="x" type="button" onClick={onClose} aria-label="Close enquiry form"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.3" /></svg></button>}
            </div>
            <form noValidate onSubmit={submit} data-m="stagger" data-stagger="0.05">
              {failed && <div className="banner" role="alert">Your enquiry couldn’t be sent just now. Nothing you typed has been lost — please try again in a moment.</div>}
              <div className="f"><label htmlFor={id('name')}>Full name <b>*</b></label><input className={cls('name')} id={id('name')} autoComplete="name" value={v.name} onChange={set('name')} {...a11y('name')} /><span className="msg" id={id('name-m')}>{errs.name}</span></div>
              <div className="f"><label htmlFor={id('email')}>Email address <b>*</b></label><input className={cls('email')} id={id('email')} type="email" autoComplete="email" inputMode="email" value={v.email} onChange={set('email')} {...a11y('email')} /><span className="msg" id={id('email-m')}>{errs.email}</span></div>
              <div className="f"><label htmlFor={id('service')}>Service <b>*</b></label>
                <select className={cls('service')} id={id('service')} value={v.service} onChange={set('service')} {...a11y('service')}>
                  <option value="">Choose a service</option>
                  {SERVICES.map((s) => <option key={s[0]} value={s[0]}>{s[1]}</option>)}
                </select><span className="msg" id={id('service-m')}>{errs.service}</span></div>
              {def && def[3].length > 0 && (
                <div className="f"><label htmlFor={id('scale')}>{def[2]}</label>
                  <select className="in" id={id('scale')} value={v.scale} onChange={set('scale')}><option value="">Not sure yet</option>{def[3].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              )}
              <div className="f"><label htmlFor={id('budget')}>Approximate budget</label>
                <select className="in" id={id('budget')} value={v.budget} onChange={set('budget')}><option value="">Prefer not to say</option>{BUDGETS.map((b) => <option key={b}>{b}</option>)}</select></div>
              <div className="f"><label htmlFor={id('timeline')}>Desired timeline</label>
                <select className="in" id={id('timeline')} value={v.timeline} onChange={set('timeline')}><option value="">Flexible</option>{TIMELINES.map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="f wide"><label htmlFor={id('desc')}>Project description <b>*</b></label><textarea className={cls('desc')} id={id('desc')} placeholder="What are you building, who is it for, and what should it do?" value={v.desc} onChange={set('desc')} {...a11y('desc')} /><span className="msg" id={id('desc-m')}>{errs.desc}</span></div>
              <div className="f wide"><label htmlFor={id('links')}>Reference links <span style={{ textTransform: 'none', letterSpacing: 0, color: '#8C877E' }}>— optional</span></label><input className={cls('links')} id={id('links')} placeholder="https://… (separate several with commas)" value={v.links} onChange={set('links')} {...a11y('links')} /><span className="msg" id={id('links-m')}>{errs.links}</span></div>
              <div className="sr-only" aria-hidden="true"><label htmlFor={id('website')}>Leave this empty</label><input id={id('website')} tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} /></div>
              <div className="actions">
                <p>Your details are used only to reply to this enquiry. Fields marked * are required.</p>
                <button className="send" type="submit" disabled={sending} aria-busy={sending}>{sending && <span className="spin" aria-hidden="true" />}{sending ? 'Sending…' : 'Send enquiry'}</button>
              </div>
            </form>
          </div>
        ) : (
          <div className="done" role="status">
            {done === 'sent' ? (
              <>
                <p className="eyebrow">Enquiry received</p>
                <h2>THANK YOU FOR REACHING OUT.</h2>
                <p>Your enquiry has been received. I’ll review the details and get back to you.</p>
              </>
            ) : (
              <>
                <p className="eyebrow">Almost there</p>
                <h2>FINISH IN YOUR EMAIL APP.</h2>
                <p>Your email app should have opened with the enquiry already written — press send there and it comes straight to me. If nothing opened, write to <a href={`mailto:${to}`}>{to}</a>.</p>
              </>
            )}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="again" type="button" onClick={() => { setV({ ...EMPTY }); setTouched(false); setDone(null); }}>Send another enquiry</button>
              {variant === 'modal' && <button className="again" type="button" onClick={onClose}>Close</button>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
