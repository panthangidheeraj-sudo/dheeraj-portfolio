import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/base.css';
import App from './App';
import { ContentProvider } from './lib/store';
import { syncMotionCss } from './lib/motionPref';

// Apply the visitor's motion choice to the CSS now, and again whenever a lazy chunk adds a stylesheet.
syncMotionCss();
let syncTimer = 0;
new MutationObserver(() => { clearTimeout(syncTimer); syncTimer = window.setTimeout(syncMotionCss, 60); }).observe(document.head, { childList: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ContentProvider>
      <App />
    </ContentProvider>
  </StrictMode>
);
