import { Link } from 'react-router-dom';
import '../styles/work.css';
import { Footer, Nav } from '../components/Chrome';

export default function NotFound() {
  return (
    <div className="dp pg-work" id="top">
      <Nav />
      <main className="intro" style={{ minHeight: '70vh' }}>
        <div className="wrap-wide">
          <p className="label"><b>404</b> Not found</p>
          <h1 className="big" style={{ fontSize: 'clamp(64px,12vw,160px)' }}>Lost <span className="ltr it">room.</span></h1>
          <p className="sub" style={{ marginTop: 32 }}>This page doesn’t exist — or it moved.</p>
          <p style={{ marginTop: 32 }}><Link className="ulink" to="/">Back to the homepage →</Link></p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
