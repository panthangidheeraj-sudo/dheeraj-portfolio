import { useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import '../styles/admin.css';
import { useContent } from '../lib/store';
import { Confirm } from './ui';
import ProjectsAdmin from './ProjectsAdmin';
import AchievementsAdmin from './AchievementsAdmin';
import OfferAdmin from './OfferAdmin';
import ContactAdmin from './ContactAdmin';

// The admin is a LOCAL editor. It only runs under `npm run dev` on your own computer.
// The deployed site has no admin at all — there is nothing to log into and no keys in the code.
export default function AdminLayout() {
  if (!import.meta.env.DEV) return <ProdNotice />;
  return <DevAdmin />;
}

function ProdNotice() {
  return (
    <div className="pg-admin">
      <main className="main" style={{ alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
        <p className="crumb">Administrator access</p>
        <h1 style={{ fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 'clamp(36px,5vw,56px)', margin: '12px 0 16px' }}>Not available here.</h1>
        <p style={{ maxWidth: 520, color: 'var(--mut)', lineHeight: 1.7 }}>The administrator dashboard will be available once the secure backend is connected.</p>
        <p style={{ marginTop: 28 }}><Link className="btn" to="/">Back to the site</Link></p>
      </main>
    </div>
  );
}

const LINKS: [string, string][] = [['projects', 'Projects'], ['achievements', 'Achievements'], ['offer', 'What I Offer'], ['contact', 'Contact page']];

function DevAdmin() {
  const { content, reset } = useContent();
  const [askReset, setAskReset] = useState(false);
  const [key, setKey] = useState(0);

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'portfolio-content.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className="pg-admin">
      <aside className="side" aria-label="Admin navigation">
        <Link className="brand" to="/"><b>DP</b><span>Admin · local</span></Link>
        <div>
          <p className="side-sec" style={{ margin: 0 }}>Content</p>
          <ul>{LINKS.map(([to, l]) => <li key={to}><NavLink className={({ isActive }) => 'slink' + (isActive ? ' on' : '')} to={to}>{l}</NavLink></li>)}</ul>
        </div>
        <div>
          <p className="side-sec" style={{ margin: 0 }}>Publish</p>
          <ul>
            <li><button className="slink" type="button" onClick={exportJson} style={{ background: 'none', border: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>Export content JSON</button></li>
            <li><button className="slink" type="button" onClick={() => setAskReset(true)} style={{ background: 'none', border: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>Reset to defaults</button></li>
          </ul>
        </div>
        <div className="side-foot">
          <Link className="slink" to="/">View site ↗</Link>
        </div>
      </aside>

      <div className="main" key={key}>
        <p className="demo" style={{ margin: '16px clamp(20px,3vw,40px) 0' }}>
          Local editor — runs only on your computer with <code>npm run dev</code>. Saved changes live in this browser and show on the site here straight away.
          To publish them, use <b>Export content JSON</b> and follow “Publishing admin changes” in the README.
        </p>
        <Routes>
          <Route index element={<Navigate to="projects" replace />} />
          <Route path="projects" element={<ProjectsAdmin />} />
          <Route path="achievements" element={<AchievementsAdmin />} />
          <Route path="offer" element={<OfferAdmin />} />
          <Route path="contact" element={<ContactAdmin />} />
          <Route path="*" element={<Navigate to="projects" replace />} />
        </Routes>
      </div>

      {askReset && (
        <Confirm title="Reset all content?" text="This clears every change saved in this browser and goes back to the content in src/content. Export first if you want to keep anything." action="Reset everything"
          onCancel={() => setAskReset(false)} onConfirm={() => { reset(); setAskReset(false); setKey((k) => k + 1); }} />
      )}
    </div>
  );
}
