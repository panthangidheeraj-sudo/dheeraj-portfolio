// Freeing a WebGL context early (browsers cap live contexts at ~16) is instant on a real GPU, but on a
// software renderer (Chrome with hardware acceleration off falls back to SwiftShader) the call blocks the
// page for many seconds. So: free it explicitly on hardware, and simply let the canvas be collected on software.
const cache = new WeakMap();

export function isSoftwareGL(gl) {
  if (!gl) return false;
  if (cache.has(gl)) return cache.get(gl);
  let soft = false;
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
    soft = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
  } catch (e) { /* unknown renderer: treat as hardware */ }
  cache.set(gl, soft);
  return soft;
}

export function releaseGL(gl) {
  try {
    if (!gl || isSoftwareGL(gl)) return;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  } catch (e) { /* already lost */ }
}

let softwareChecked = null;
/** True when this browser draws WebGL in software (hardware acceleration off or blocked). Cached after the first call. */
export function detectSoftwareGL() {
  if (softwareChecked !== null) return softwareChecked;
  softwareChecked = false;
  try {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (gl) { softwareChecked = isSoftwareGL(gl); releaseGL(gl); }
  } catch (e) { /* no WebGL at all — the page handles that separately */ }
  return softwareChecked;
}
