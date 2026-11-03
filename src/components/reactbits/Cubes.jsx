// CREDIT
// Component inspired from Can Tastemel's original work for the lambda.ai landing page
// https://cantastemel.com
// React Bits <Cubes /> (JS-CSS). WebGL logic is the original, in ./cubesEngine.js.
import { useEffect, useRef } from 'react';
import { mountCubes } from './cubesEngine';
import './Cubes.css';

export const Cubes = ({ rippleTarget, className = '', ...settings }) => {
  const containerRef = useRef(null);
  const key = JSON.stringify(settings);
  useEffect(() => {
    const target = rippleTarget && rippleTarget.current ? rippleTarget.current : null;
    // a fresh canvas per mount: destroy() frees the WebGL context, so a re-mount (StrictMode, prop change) needs a new one
    const canvas = document.createElement('canvas');
    canvas.className = 'cubes-canvas';
    canvas.setAttribute('aria-hidden', 'true');
    containerRef.current.prepend(canvas);
    let api = null;
    try { api = mountCubes(containerRef.current, canvas, { ...settings, rippleTarget: target }); } catch (e) { console.warn('[Cubes] WebGL unavailable:', e?.message); }
    return () => { if (api) api.destroy(); canvas.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return (
    <div ref={containerRef} className={`cubes-container${className ? ` ${className}` : ''}`} />
  );
};

export default Cubes;
