// THE MUSEUM — Three.js engine for the Achievements page.
// Every exhibit is generated from data ({ type, x, z, rot, size, light, cert, ... }); nothing is hard-coded per achievement.
// In the React build this is split into R3F components (<Museum/>, <Exhibit type=…/>, <CameraRig/>) with GSAP for the tweens.
import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { isSoftwareGL } from '../lib/releaseGL.js';

const HALL_W = 18, HALL_H = 7;
const Z_ENTRY = 0, Z_PART = -24, Z_END = -44;
const EYE = 1.68;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

export function mount(container, canvas, opts = {}) {
  const cb = Object.assign({ onProgress() {}, onReady() {}, onIntroDone() {}, onHover() {}, onFocus() {}, onEntered() {} }, opts.callbacks || {});
  const reduced = !!opts.reducedMotion;
  const low = opts.quality === 'low';
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !low, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  if (!renderer.getContext()) return null;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, low ? 1.25 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = low ? 1.12 : 1.24;
  renderer.setClearColor(0x000000, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.FogExp2(0x000000, low ? 0.035 : 0.018);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 140);
  const disposables = [];
  const keep = (x) => (disposables.push(x), x);

  // ---------- loading ----------
  const manager = new THREE.LoadingManager();
  let readyFired = false;
  manager.onProgress = (_, a, b) => cb.onProgress(b ? a / b : 1);
  manager.onLoad = () => { if (!readyFired) { readyFired = true; cb.onProgress(1); cb.onReady(); } };
  manager.onError = () => {};
  const readyTimer = setTimeout(() => { if (!readyFired) { readyFired = true; cb.onProgress(1); cb.onReady(); } }, 8000);
  const loader = new THREE.TextureLoader(manager);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  const tex = (url, onLoad) => {
    const t = loader.load(url, onLoad);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(16, maxAniso);
    return keep(t);
  };
  const TEXT_SS = low ? 1 : 2; // text/plaque canvases are drawn at 2x so engraving and lettering stay crisp up close
  const canvasTex = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w * TEXT_SS; c.height = h * TEXT_SS;
    const g = c.getContext('2d');
    g.scale(TEXT_SS, TEXT_SS);
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(16, maxAniso);
    t.userData.redraw = () => { g.setTransform(TEXT_SS, 0, 0, TEXT_SS, 0, 0); g.clearRect(0, 0, w, h); draw(g, w, h); t.needsUpdate = true; };
    return keep(t);
  };

  // ---------- environment map: black room with soft ceiling strips (gives glass & metal believable reflections) ----------
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x020202);
  const stripMat = new THREE.MeshBasicMaterial({ color: 0xfff0dc });
  [-3, 0, 3].forEach((x) => { const s = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.05, 30), stripMat); s.position.set(x, 6, 0); envScene.add(s); });
  const side = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2, 20), new THREE.MeshBasicMaterial({ color: 0x3a3226 }));
  side.position.set(8, 2, 0); envScene.add(side);
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;
  scene.environmentIntensity = 0.55;
  envScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });

  // ---------- procedural textures ----------
  const stoneTex = canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#1b1a19'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { const v = 20 + Math.random() * 22; g.fillStyle = `rgba(${v},${v - 1},${v - 2},${Math.random() * 0.6})`; g.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
    g.strokeStyle = 'rgba(120,112,100,0.06)'; g.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) { g.beginPath(); let x = Math.random() * w, y = 0; g.moveTo(x, y); while (y < h) { x += (Math.random() - 0.5) * 40; y += 20 + Math.random() * 30; g.lineTo(x, y); } g.stroke(); }
  });
  stoneTex.wrapS = stoneTex.wrapT = THREE.RepeatWrapping;

  // ---------- materials ----------
  const M = {
    wall: keep(new THREE.MeshStandardMaterial({ color: 0x171716, roughness: 0.9, metalness: 0 })),
    ceil: keep(new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 1 })),
    beam: keep(new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.85 })),
    stone: keep(new THREE.MeshStandardMaterial({ color: 0x9a948a, map: stoneTex, roughness: 0.42, metalness: 0.05 })),
    lacquer: keep(new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.22, metalness: 0.25 })),
    velvet: keep(new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 1 })),
    brass: keep(new THREE.MeshStandardMaterial({ color: 0xc8b38a, roughness: 0.3, metalness: 1 })),
    steel: keep(new THREE.MeshStandardMaterial({ color: 0xb7b4ae, roughness: 0.36, metalness: 1 })),
    fixture: keep(new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5, metalness: 0.6 })),
    cove: keep(new THREE.MeshBasicMaterial({ color: 0x7a6a48 })),
    led: keep(new THREE.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false })),
    hit: keep(new THREE.MeshBasicMaterial({ visible: false }))
  };
  const glassMats = [];
  const glassMat = () => {
    const m = keep(low
      ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.1, depthWrite: false })
      : new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0, transmission: 1, thickness: 0.04, ior: 1.5, transparent: true, opacity: 1, envMapIntensity: 1.2, specularIntensity: 1 }));
    glassMats.push(m);
    return m;
  };
  const geo = (g) => keep(g);
  const box = (w, h, d, mat) => new THREE.Mesh(geo(new THREE.BoxGeometry(w, h, d)), mat);

  // ---------- architecture ----------
  const arch = new THREE.Group();
  scene.add(arch);
  const zLen = Z_ENTRY - Z_END;
  const zMid = (Z_ENTRY + Z_END) / 2;
  // floor
  if (!low) {
    const mirror = new Reflector(geo(new THREE.PlaneGeometry(HALL_W, zLen + 12)), {
      clipBias: 0.003, textureWidth: Math.round((container.clientWidth || 1200) * 0.6), textureHeight: Math.round((container.clientHeight || 800) * 0.6), color: 0x6f6f6f
    });
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(0, 0, zMid + 6);
    arch.add(mirror);
    const overlayMat = keep(new THREE.MeshStandardMaterial({ color: 0x8a847a, map: stoneTex, roughness: 0.5, transparent: true, opacity: 0.88 }));
    stoneTex.repeat.set(4, 12);
    const overlay = new THREE.Mesh(geo(new THREE.PlaneGeometry(HALL_W, zLen + 12)), overlayMat);
    overlay.rotation.x = -Math.PI / 2; overlay.position.set(0, 0.003, zMid + 6);
    arch.add(overlay);
    const before = mirror.onBeforeRender;
    mirror.onBeforeRender = function (...a) { overlay.visible = false; cones.visible = false; before.apply(this, a); overlay.visible = true; cones.visible = true; };
    disposables.push({ dispose: () => mirror.dispose && mirror.dispose() });
  } else {
    const floorMat = keep(new THREE.MeshStandardMaterial({ color: 0x5a554e, map: stoneTex, roughness: 0.28, metalness: 0.35 }));
    stoneTex.repeat.set(4, 12);
    const floor = new THREE.Mesh(geo(new THREE.PlaneGeometry(HALL_W, zLen + 12)), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, zMid + 6);
    arch.add(floor);
  }
  // ceiling + coffers
  const ceil = new THREE.Mesh(geo(new THREE.PlaneGeometry(HALL_W, zLen)), M.ceil);
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, HALL_H, zMid); arch.add(ceil);
  for (let z = Z_ENTRY - 3; z > Z_END; z -= 3) { const b = box(HALL_W, 0.42, 0.22, M.beam); b.position.set(0, HALL_H - 0.21, z); arch.add(b); }
  [-3, 3].forEach((x) => { const t = box(0.12, 0.06, zLen, M.fixture); t.position.set(x, HALL_H - 0.45, zMid); arch.add(t); const l = box(0.05, 0.01, zLen - 0.4, M.led); l.position.set(x, HALL_H - 0.485, zMid); arch.add(l); });
  // soft warm light-lines low on both walls (they also glow in the mirror floor)
  [-1, 1].forEach((sd) => { const l = box(0.03, 0.03, zLen - 0.4, M.led); l.position.set(sd * (HALL_W / 2 - 0.03), 0.22, zMid); arch.add(l); });
  // side walls with shadow-gap at the floor and a faint warm cove line
  [-1, 1].forEach((s) => {
    const w = box(0.4, HALL_H, zLen + 0.4, M.wall); w.position.set(s * (HALL_W / 2 + 0.2), HALL_H / 2, zMid); arch.add(w);
    const c = box(0.02, 0.012, zLen, M.cove); c.position.set(s * (HALL_W / 2 - 0.02), 0.06, zMid); arch.add(c);
    for (let z = Z_ENTRY - 6; z > Z_END; z -= 6) { const j = box(0.02, HALL_H, 0.01, M.velvet); j.position.set(s * (HALL_W / 2 - 0.005), HALL_H / 2, z); arch.add(j); }
  });
  // entrance wall with doorway
  const door = { w: 3.4, h: 4.4 };
  const entryWall = (z, gapW, gapH, thick) => {
    const sideW = (HALL_W - gapW) / 2;
    [-1, 1].forEach((s) => { const p = box(sideW, HALL_H, thick, M.wall); p.position.set(s * (gapW / 2 + sideW / 2), HALL_H / 2, z); arch.add(p); });
    const lintel = box(gapW, HALL_H - gapH, thick, M.wall); lintel.position.set(0, gapH + (HALL_H - gapH) / 2, z); arch.add(lintel);
    const thr = box(gapW, 0.008, thick, M.brass); thr.position.set(0, 0.004, z); arch.add(thr);
  };
  entryWall(Z_ENTRY, door.w, door.h, 0.5);
  entryWall(Z_PART, 4.4, 4.8, 0.7);
  const endWall = box(HALL_W, HALL_H, 0.4, M.wall); endWall.position.set(0, HALL_H / 2, Z_END - 0.2); arch.add(endWall);
  // vestibule outside the entrance
  const vest = box(HALL_W + 6, HALL_H, 0.4, M.wall); vest.position.set(0, HALL_H / 2, 12.5); arch.add(vest);

  // ---------- lights ----------
  const hemi = new THREE.HemisphereLight(0x3a352d, 0x0a0907, 0);
  scene.add(hemi);
  const cones = new THREE.Group();
  scene.add(cones);
  const coneMat = (opacity) => keep(new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uOpacity: { value: opacity }, uColor: { value: new THREE.Color(0xffe9c8) } },
    vertexShader: 'varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
    fragmentShader: 'uniform float uOpacity; uniform vec3 uColor; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f=pow(abs(dot(vN,vV)),1.6); float fade=pow(vUv.y,1.8); gl_FragColor=vec4(uColor, uOpacity*f*fade); }'
  }));
  const lights = []; // { light, base, factor, cone, coneBase, group:'entry'|'hall1'|'hall2'|'closing', id }
  const fixtureGeo = geo(new THREE.CylinderGeometry(0.08, 0.1, 0.24, 20));
  const addSpot = (pos, target, { intensity = 90, angle = 0.32, penumbra = 0.6, group = 'hall1', id = null, cone = true } = {}) => {
    const l = new THREE.SpotLight(0xfff0da, 0, 0, angle, penumbra, 2);
    l.position.copy(pos); l.target.position.copy(target);
    scene.add(l); scene.add(l.target);
    const fx = new THREE.Mesh(fixtureGeo, M.fixture);
    fx.position.copy(pos); fx.lookAt(target); fx.rotateX(Math.PI / 2); scene.add(fx);
    let coneMesh = null;
    if (cone && !low) {
      const dir = new THREE.Vector3().subVectors(pos, target);
      const h = dir.length() * 0.92;
      const r = h * Math.tan(angle) * 0.82;
      coneMesh = new THREE.Mesh(geo(new THREE.ConeGeometry(r, h, 40, 1, true)), coneMat(0));
      coneMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      coneMesh.position.copy(pos).addScaledVector(dir.clone().negate(), h / 2);
      cones.add(coneMesh);
    }
    const rec = { light: l, base: intensity, factor: 0, target: 0, cone: coneMesh, coneBase: 0.055, group, id, aim: target.clone(), ph: Math.random() * 6.28 };
    lights.push(rec);
    return rec;
  };
  // entrance downlights (outside) and door wash
  addSpot(new THREE.Vector3(-1.2, 6.5, 3.2), new THREE.Vector3(-0.6, 0, 1.4), { intensity: 260, angle: 0.36, group: 'entry' });
  addSpot(new THREE.Vector3(1.2, 6.5, 3.2), new THREE.Vector3(0.6, 0, 1.4), { intensity: 260, angle: 0.36, group: 'entry' });
  addSpot(new THREE.Vector3(0, 6.6, -3), new THREE.Vector3(0, 0, -1.5), { intensity: 160, angle: 0.5, group: 'entry', cone: false });
  // portal and corridor washes
  addSpot(new THREE.Vector3(0, 6.6, Z_PART + 2.2), new THREE.Vector3(0, 0, Z_PART + 0.8), { intensity: 150, angle: 0.42, group: 'hall1', cone: false });
  addSpot(new THREE.Vector3(0, 6.6, Z_PART - 2.2), new THREE.Vector3(0, 0, Z_PART - 0.8), { intensity: 150, angle: 0.42, group: 'hall2', cone: false });
  // architectural wall-grazers: reveal the black walls without lighting the room flat (skipped on low-power devices)
  if (!low) [-1, 1].forEach((sd) => [-4, -15, -29, -40].forEach((z) => addSpot(new THREE.Vector3(sd * 7.4, 6.75, z), new THREE.Vector3(sd * 9, 0.6, z), { intensity: 110, angle: 0.62, penumbra: 1, group: z > Z_PART ? 'hall1' : 'hall2', cone: false })));

  // ---------- floating dust: tiny motes that catch the light and drift slowly through the halls ----------
  let dust = null;
  if (!low) {
    const N = 420, pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 13;
      pos[i * 3 + 1] = 0.4 + Math.random() * 5.6;
      pos[i * 3 + 2] = Z_END + 2 + Math.random() * (6 - Z_END - 2);
      seed[i] = Math.random() * 100;
    }
    const dg = geo(new THREE.BufferGeometry());
    dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    dg.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
    const dm = keep(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uAmt: { value: 0 }, uPx: { value: 1 } },
      vertexShader: 'uniform float uTime; uniform float uPx; attribute float aSeed; varying float vA; void main(){ vec3 p=position; p.x+=sin(uTime*0.07+aSeed)*0.6; p.y+=sin(uTime*0.05+aSeed*1.7)*0.4; p.z+=cos(uTime*0.06+aSeed*0.6)*0.6; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=clamp(46.0/(-mv.z),1.0,4.5)*uPx; vA=0.25+0.4*fract(aSeed*3.1); gl_Position=projectionMatrix*mv; }',
      fragmentShader: 'uniform float uAmt; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); float a=smoothstep(0.5,0.0,d)*vA*uAmt; gl_FragColor=vec4(vec3(1.0,0.92,0.78)*a,a); }'
    }));
    dust = new THREE.Points(dg, dm);
    dust.frustumCulled = false;
    scene.add(dust);
  }

  // ---------- engraved plaque ----------
  const plaqueTex = (title, sub) => canvasTex(640, 210, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#cdb88f'); gr.addColorStop(0.5, '#a89069'); gr.addColorStop(1, '#c4ad83');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    for (let i = 0; i < h; i += 2) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; g.fillRect(0, i, w, 1); }
    g.fillStyle = '#2b251c';
    g.font = '400 46px "Cormorant Garamond", Garamond, serif';
    let t = title; while (g.measureText(t).width > w - 60 && t.length > 4) t = t.slice(0, -2);
    if (t !== title) t = t.trim() + '…';
    g.fillText(t, 30, 92);
    g.font = '500 20px "Instrument Sans", Arial, sans-serif';
    g.fillText(sub.toUpperCase(), 32, 150);
  });

  // ---------- big sign hung above each exhibit: what it is, in large type ----------
  const signTex = (kicker, headline) => canvasTex(1024, 300, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center';
    const ls = (v) => { if ('letterSpacing' in g) g.letterSpacing = v; };
    ls('5px');
    g.font = '500 27px "Instrument Sans", Arial, sans-serif';
    g.fillStyle = '#d9c08a';
    if (kicker) g.fillText(kicker.toUpperCase(), w / 2, 56);
    let size = 138;
    ls('3px');
    g.font = `600 ${size}px "Instrument Sans", Arial, sans-serif`;
    while (g.measureText(headline).width > w - 64 && size > 52) { size -= 4; g.font = `600 ${size}px "Instrument Sans", Arial, sans-serif`; }
    const base = 56 + 36 + size * 0.78;
    g.shadowColor = 'rgba(255,204,128,0.85)'; g.shadowBlur = 34; g.fillStyle = '#fff4e0';
    g.fillText(headline, w / 2, base);
    g.shadowBlur = 14; g.fillText(headline, w / 2, base);
    g.shadowBlur = 0;
    g.fillStyle = '#c8b38a'; g.fillRect(w / 2 - 90, base + 26, 180, 2);
    ls('0px');
  });
  // a certificate standing inside glass: scales to its own aspect ratio once loaded, anchored at its bottom edge
  const certInGlass = (url, maxW, maxH, glow = 0.32) => {
    const holder = new THREE.Group();
    const mat = keep(new THREE.MeshStandardMaterial({ color: 0xc4c4c4, roughness: 0.75, metalness: 0, emissive: 0xffffff, emissiveIntensity: glow }));
    const mesh = new THREE.Mesh(geo(new THREE.PlaneGeometry(1, 1)), mat);
    const fit = (img) => {
      const a = img && img.width ? img.width / img.height : 1.4;
      let w = maxW, h = w / a;
      if (h > maxH) { h = maxH; w = h * a; }
      mesh.scale.set(w, h, 1); mesh.position.y = h / 2;
      holder.userData.size = { w, h };
    };
    const map = tex(url, (t) => fit(t.image));
    mat.map = map; mat.emissiveMap = map;
    fit(null);
    holder.add(mesh);
    return holder;
  };

  // ---------- exhibit objects ----------
  const makeObject = (kind, s) => {
    const g = new THREE.Group();
    if (kind === 'chip') {
      const stand = box(0.02, 0.16, 0.02, M.steel); stand.position.y = 0.08; g.add(stand);
      const chip = new THREE.Group();
      chip.add(box(0.24, 0.024, 0.24, M.lacquer));
      const die = box(0.1, 0.006, 0.1, keep(new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.2, metalness: 0.7 }))); die.position.y = 0.015; chip.add(die);
      for (let i = -5; i <= 5; i++) { [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => { const p = box(a ? 0.02 : 0.008, 0.004, a ? 0.008 : 0.02, M.brass); p.position.set(a * 0.13 + (a ? 0 : i * 0.02), 0, b * 0.13 + (b ? 0 : i * 0.02)); chip.add(p); }); }
      chip.position.y = 0.18; chip.rotation.x = 0.55; g.add(chip);
    } else if (kind === 'auger') {
      const base = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.11, 0.12, 0.03, 40)), M.lacquer); base.position.y = 0.015; g.add(base);
      const shaft = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.012, 0.012, 0.46, 16)), M.steel); shaft.position.y = 0.26; g.add(shaft);
      class Helix extends THREE.Curve { getPoint(t, o = new THREE.Vector3()) { const a = t * Math.PI * 10; const r = 0.07 * (1 - t * 0.35); return o.set(Math.cos(a) * r, 0.06 + t * 0.36, Math.sin(a) * r); } }
      const hel = new THREE.Mesh(geo(new THREE.TubeGeometry(new Helix(), 260, 0.008, 8, false)), M.brass); g.add(hel);
    } else if (kind === 'vessel') {
      const pts = [[0, 0], [0.11, 0], [0.11, 0.025], [0.05, 0.04], [0.035, 0.09], [0.03, 0.2], [0.06, 0.24], [0.13, 0.33], [0.15, 0.42], [0.145, 0.43], [0.12, 0.35], [0.0, 0.3]].map(([x, y]) => new THREE.Vector2(x, y));
      const lathe = new THREE.Mesh(geo(new THREE.LatheGeometry(pts, 72)), M.brass); g.add(lathe);
    } else if (kind === 'prism') {
      const p = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.045, 0.11, 0.62, 6)), M.steel); p.position.y = 0.33; g.add(p);
      const ring = new THREE.Mesh(geo(new THREE.TorusGeometry(0.16, 0.006, 12, 80)), M.brass); ring.position.y = 0.36; ring.rotation.x = Math.PI / 2.4; g.add(ring);
    }
    g.scale.setScalar(s);
    return g;
  };

  // ---------- exhibits from data ----------
  const exhibits = new Map();
  const hits = [];
  const spinners = [];
  const floaters = [];
  const certMaterial = (url) => keep(new THREE.MeshStandardMaterial({ map: tex(url), roughness: 0.82, metalness: 0 }));

  (opts.exhibits || []).forEach((ex) => {
    const s = clamp(ex.size || 1, 0.7, 1.4);
    const g = new THREE.Group();
    g.position.set(ex.x, 0, ex.z);
    g.rotation.y = THREE.MathUtils.degToRad(ex.rot || 0);
    scene.add(g);
    const sub = [ex.org, ex.date].filter(Boolean).join(' · ');
    const plaqueMat = keep(new THREE.MeshStandardMaterial({ map: plaqueTex(ex.title, sub), metalness: 0.85, roughness: 0.34 }));
    const glassEdges = [];
    const glassParts = [];
    const edgeMat = keep(new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
    const addGlass = (w, h, d, y) => {
      const gl = box(w, h, d, glassMat()); gl.position.y = y; g.add(gl);
      const e = new THREE.LineSegments(geo(new THREE.EdgesGeometry(gl.geometry)), edgeMat); e.position.y = y; g.add(e);
      glassParts.push({ mesh: gl, edge: e, y, lift: 0 });
      glassEdges.push(edgeMat);
    };
    let focusLocal, viewLocal, spotLocal, hitBox, angle = 0.3, inten = 95, dyn = null;
    if (ex.type === 'vitrine') {
      const ped = box(0.8 * s, 1.0, 0.8 * s, M.stone); ped.position.y = 0.5; g.add(ped);
      const cap = box(0.82 * s, 0.025, 0.82 * s, M.lacquer); cap.position.y = 1.0125; g.add(cap);
      const gh = 0.62 * s;
      addGlass(0.78 * s, gh, 0.78 * s, 1.025 + gh / 2);
      const glow = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.6 * s, 0.6 * s)), keep(new THREE.MeshBasicMaterial({ color: 0x3a3428 })));
      glow.rotation.x = -Math.PI / 2; glow.position.y = 1.027; g.add(glow);
      const obj = makeObject(ex.object || 'chip', s * 1.1); obj.position.y = 1.03; g.add(obj); spinners.push(obj);
      const pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.42, 0.138)), plaqueMat); pl.position.set(0, 0.86, 0.4 * s + 0.002); g.add(pl);
      focusLocal = new THREE.Vector3(0, 1.03 + gh * 0.45, 0); viewLocal = new THREE.Vector3(0, 1.62, 2.1 + s * 0.3);
      spotLocal = new THREE.Vector3(0, 6.6, 1.3); angle = 0.2 * s; inten = 420;
      hitBox = [0.9 * s, 1.7, 0.9 * s, 0.85];
    } else if (ex.type === 'monument') {
      const plinth = box(0.78 * s, 0.08, 0.78 * s, M.lacquer); plinth.position.y = 0.04; g.add(plinth);
      const ped = box(0.56 * s, 1.24, 0.56 * s, M.stone); ped.position.y = 0.08 + 0.62; g.add(ped);
      const top = box(0.6 * s, 0.03, 0.6 * s, M.brass); top.position.y = 1.335; g.add(top);
      const obj = makeObject(ex.object || 'vessel', s * 1.15); obj.position.y = 1.35; g.add(obj); spinners.push(obj);
      const pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.42, 0.138)), plaqueMat); pl.position.set(0, 1.12, 0.28 * s + 0.002); g.add(pl);
      focusLocal = new THREE.Vector3(0, 1.55, 0); viewLocal = new THREE.Vector3(0, 1.7, 2.5 + s * 0.3);
      spotLocal = new THREE.Vector3(0, 6.7, 0.9); angle = 0.17 * s; inten = 560;
      hitBox = [0.8 * s, 2.0, 0.8 * s, 1.0];
    } else if (ex.type === 'showcase') {
      // the certificate itself, standing on a small brass ledge inside a tall glass case, lit from within
      const W = 1.32 * s, D = 0.7 * s, gh = 1.0 * s;
      const ped = box(W, 1.0, D, M.stone); ped.position.y = 0.5; g.add(ped);
      const cap = box(W + 0.02, 0.025, D + 0.02, M.lacquer); cap.position.y = 1.0125; g.add(cap);
      addGlass(W - 0.02, gh, D - 0.02, 1.025 + gh / 2);
      const bed = new THREE.Mesh(geo(new THREE.PlaneGeometry(W - 0.12, D - 0.12)), keep(new THREE.MeshBasicMaterial({ color: 0x4a402e }))); bed.rotation.x = -Math.PI / 2; bed.position.y = 1.027; g.add(bed);
      const ledge = box(W * 0.78, 0.02, 0.1, M.brass); ledge.position.set(0, 1.04, 0.1 * s); g.add(ledge);
      const holder = certInGlass(ex.cert, (W - 0.22), gh - 0.16, 0.05 * clamp(ex.light || 1, 0.6, 1.4));
      holder.position.set(0, 1.05, 0.08 * s); holder.rotation.x = -0.16; g.add(holder);
      const halo = new THREE.Mesh(geo(new THREE.PlaneGeometry(W * 1.25, gh * 1.15)), haloMat); halo.position.set(0, 1.025 + gh * 0.52, -D / 2 + 0.06); g.add(halo);
      const strip = box(W - 0.14, 0.012, 0.012, M.led); strip.position.set(0, 1.025 + gh - 0.02, D / 2 - 0.07); g.add(strip);
      const strip2 = box(W - 0.14, 0.012, 0.012, M.led); strip2.position.set(0, 1.025 + gh - 0.02, -D / 2 + 0.07); g.add(strip2);
      const pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.44, 0.145)), plaqueMat); pl.position.set(0, 0.62, D / 2 + 0.002); g.add(pl);
      focusLocal = new THREE.Vector3(0, 1.05 + gh * 0.5, 0); viewLocal = new THREE.Vector3(0, 1.62, 2.0 + s * 0.2);
      dyn = { w: W + 0.3, y: 1.62, base: 2.0 + s * 0.2 };
      spotLocal = new THREE.Vector3(0, 6.6, 1.5); angle = 0.26 * s; inten = 80;
      hitBox = [W + 0.12, 2.1, D + 0.12, 1.05];
    } else if (ex.type === 'wall') {
      const cw = 1.4 * s, ch = cw / (ex.aspect || 1.415);
      const back = box(cw + 0.36, ch + 0.36, 0.03, M.velvet); back.position.set(0, 1.75, 0.015); g.add(back);
      const fw = 0.035, fd = 0.05;
      [[0, ch / 2 + fw / 2, cw + fw * 2, fw], [0, -ch / 2 - fw / 2, cw + fw * 2, fw], [-cw / 2 - fw / 2, 0, fw, ch], [cw / 2 + fw / 2, 0, fw, ch]].forEach(([x, y, w, h]) => { const f = box(w, h, fd, M.brass); f.position.set(x, 1.75 + y, 0.05); g.add(f); });
      const cert = new THREE.Mesh(geo(new THREE.PlaneGeometry(cw, ch)), certMaterial(ex.cert)); cert.position.set(0, 1.75, 0.045); g.add(cert);
      const pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.36, 0.118)), plaqueMat); pl.position.set(cw / 2 + 0.42, 1.3, 0.012); g.add(pl);
      focusLocal = new THREE.Vector3(0, 1.72, 0); viewLocal = new THREE.Vector3(0, 1.68, 1.55 + s * 1.15);
      spotLocal = new THREE.Vector3(0, 6.6, 2.6); angle = 0.15 * s + 0.03; inten = 125;
      hitBox = [cw + 0.5, ch + 0.5, 0.3, 1.75];
    } else if (ex.type === 'case') {
      const W = 1.7 * s, D = 0.9 * s;
      const body = box(W, 0.78, D, M.lacquer); body.position.y = 0.39; g.add(body);
      const rim = box(W + 0.02, 0.02, D + 0.02, M.brass); rim.position.y = 0.79; g.add(rim);
      const bed = box(W - 0.06, 0.01, D - 0.06, M.velvet); bed.position.y = 0.8; g.add(bed);
      addGlass(W - 0.02, 0.14, D - 0.02, 0.87);
      const strip = box(W - 0.1, 0.004, 0.01, keep(new THREE.MeshBasicMaterial({ color: 0x5a4c36 }))); strip.position.set(0, 0.935, -D / 2 + 0.05); g.add(strip);
      const docs = [ex.cert].concat(ex.photos || []).slice(0, 3);
      const sizes = [[0.62, 0.44], [0.4, 0.3], [0.36, 0.27]];
      const spots = [[-0.32, 0.02, 0.05], [0.42, -0.08, -0.08], [0.46, 0.17, 0.06]];
      docs.forEach((url, i) => {
        const [w, h] = sizes[i]; const [x, z, r] = spots[i];
        const p = new THREE.Mesh(geo(new THREE.PlaneGeometry(w * s, h * s)), certMaterial(url));
        p.rotation.x = -Math.PI / 2; p.rotation.z = r; p.position.set(x * s, 0.807 + i * 0.001, z * s); g.add(p);
      });
      const pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.42, 0.138)), plaqueMat); pl.position.set(0, 0.6, D / 2 + 0.002); g.add(pl);
      focusLocal = new THREE.Vector3(0, 0.82, 0); viewLocal = new THREE.Vector3(0, 2.05, 1.25 + s * 0.4);
      spotLocal = new THREE.Vector3(0, 6.7, 0.6); angle = 0.2 * s + 0.04; inten = 210;
      hitBox = [W + 0.1, 1.1, D + 0.1, 0.5];
    } else {
      // floating
      const plinth = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.62 * s, 0.66 * s, 0.06, 64)), M.lacquer); plinth.position.y = 0.03; g.add(plinth);
      const ring = new THREE.Mesh(geo(new THREE.TorusGeometry(0.6 * s, 0.006, 8, 120)), keep(new THREE.MeshBasicMaterial({ color: 0x8a7650 }))); ring.rotation.x = Math.PI / 2; ring.position.y = 0.062; g.add(ring);
      const panel = new THREE.Group();
      const pw = 1.6 * s, ph = pw * 9 / 16;
      const screenMat = keep(new THREE.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveMap: tex(ex.cert), emissiveIntensity: 1.15, roughness: 0.2, metalness: 0 }));
      const screen = new THREE.Mesh(geo(new THREE.PlaneGeometry(pw, ph)), screenMat); panel.add(screen);
      const back = box(pw + 0.04, ph + 0.04, 0.02, M.lacquer); back.position.z = -0.012; panel.add(back);
      const front = box(pw + 0.04, ph + 0.04, 0.008, glassMat()); front.position.z = 0.008; panel.add(front);
      panel.position.y = 1.72; g.add(panel); floaters.push({ obj: panel, phase: Math.random() * 6 });
      const pl = new THREE.Mesh(geo(new THREE.PlaneGeometry(0.42, 0.138)), plaqueMat); pl.rotation.x = -Math.PI / 2.6; pl.position.set(0, 0.11, 0.64 * s); g.add(pl);
      focusLocal = new THREE.Vector3(0, 1.72, 0); viewLocal = new THREE.Vector3(0, 1.72, 1.9 + s * 0.35);
      spotLocal = new THREE.Vector3(0, 6.6, 1.6); angle = 0.18 * s; inten = 170;
      hitBox = [pw + 0.2, 2.2, 0.8, 1.1];
    }
    // soft contact shadow
    if (ex.type !== 'wall') {
      const sh = new THREE.Mesh(geo(new THREE.PlaneGeometry(1.8 * s, 1.8 * s)), shadowMat);
      sh.rotation.x = -Math.PI / 2; sh.position.y = 0.006; g.add(sh);
      const pool = new THREE.Mesh(geo(new THREE.PlaneGeometry(4.2 * s, 4.2 * s)), poolMat);
      pool.rotation.x = -Math.PI / 2; pool.position.y = 0.012; g.add(pool);
    }
    // the sign: kicker + headline in large type, hung from the ceiling (flush on the wall for wall pieces)
    const signMat = keep(new THREE.MeshBasicMaterial({ map: signTex(ex.kicker || '', ex.headline || ex.title), transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false }));
    const signW = (ex.type === 'wall' ? 2.9 : 3.2) * clamp(s, 0.9, 1.25), signH = signW * 300 / 1024;
    const signY = ex.type === 'wall' ? 3.15 : 3.35;
    const sign = new THREE.Mesh(geo(new THREE.PlaneGeometry(signW, signH)), signMat);
    sign.position.set(0, signY, ex.type === 'wall' ? 0.03 : 0); sign.renderOrder = 5; g.add(sign);
    if (ex.type !== 'wall') {
      [-1, 1].forEach((sd) => { const len = HALL_H - (signY + signH / 2); const cb = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.004, 0.004, len, 6)), M.fixture); cb.position.set(sd * (signW / 2 - 0.12), signY + signH / 2 + len / 2, 0); g.add(cb); });
    }
    const hb = box(hitBox[0], hitBox[1], hitBox[2], M.hit); hb.position.y = hitBox[3]; hb.userData.id = ex.id; g.add(hb); hits.push(hb);
    g.updateMatrixWorld(true);
    const focus = g.localToWorld(focusLocal.clone());
    const view = g.localToWorld(viewLocal.clone());
    view.y = viewLocal.y;
    const spotPos = g.localToWorld(spotLocal.clone());
    const zone = ex.z > Z_PART ? 'hall1' : 'hall2';
    const spot = addSpot(spotPos, focus, { intensity: inten * 1.25 * clamp(ex.light || 1, 0.5, 1.5), angle, group: zone, id: ex.id });
    exhibits.set(ex.id, { data: ex, group: g, focus, view, viewLocal, dyn, spot, signMat, edgeMats: glassEdges, glass: glassParts, z: ex.z });
  });

  // ---------- closing wall ----------
  const closingTex = canvasTex(2048, 900, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.textAlign = 'center';
    g.fillStyle = '#d8d1c4';
    g.font = '500 30px "Instrument Sans", Arial, sans-serif';
    g.fillText('T H E   M U S E U M   ·   F I N A L   R O O M', w / 2, 120);
    g.font = '300 118px "Cormorant Garamond", Garamond, serif';
    g.fillText('EVERY MILESTONE IS PART', w / 2, 330);
    g.fillText('OF A LARGER JOURNEY.', w / 2, 470);
    g.fillStyle = '#c8b38a';
    g.font = '400 150px "Mrs Saint Delafield", "Brush Script MT", cursive';
    g.fillText('Dheeraj Panthangi', w / 2, 700);
  });
  const closingMat = keep(new THREE.MeshStandardMaterial({ map: closingTex, transparent: true, roughness: 0.9, emissive: 0xffffff, emissiveMap: closingTex, emissiveIntensity: 0.18 }));
  const closing = new THREE.Mesh(geo(new THREE.PlaneGeometry(8.2, 3.6)), closingMat);
  closing.position.set(0, 3.0, Z_END + 0.02); scene.add(closing);
  const closingHit = box(8.4, 3.8, 0.3, M.hit); closingHit.position.set(0, 3.0, Z_END + 0.2); closingHit.userData.id = 'closing'; scene.add(closingHit); hits.push(closingHit);
  addSpot(new THREE.Vector3(-3, 6.7, Z_END + 3.2), new THREE.Vector3(-2, 3, Z_END), { intensity: 300, angle: 0.42, group: 'closing', id: 'closing', cone: false });
  addSpot(new THREE.Vector3(3, 6.7, Z_END + 3.2), new THREE.Vector3(2, 3, Z_END), { intensity: 300, angle: 0.42, group: 'closing', id: 'closing', cone: false });
  exhibits.set('closing', { data: { id: 'closing' }, focus: new THREE.Vector3(0, 2.9, Z_END), view: new THREE.Vector3(0, 1.75, Z_END + 8.5), spot: null, edgeMats: [], z: Z_END });

  // ---------- camera rig ----------
  const ENTRY = { pos: new THREE.Vector3(0, 1.75, 10.5), look: new THREE.Vector3(0, 2.0, -8) };
  const HOME = { pos: new THREE.Vector3(0, EYE, -2.6), look: new THREE.Vector3(0, 1.5, -16) };
  const rig = { pos: ENTRY.pos.clone(), look: ENTRY.look.clone(), offYaw: 0, offPitch: 0, parYaw: 0, parPitch: 0 };
  let tween = null;
  const tweenTo = (pos, look, dur, done) => {
    if (reduced) dur = 0.01;
    tween = { fromP: rig.pos.clone(), fromL: rig.look.clone(), toP: pos.clone(), toL: look.clone(), t: 0, dur, done };
  };
  const applyCamera = () => {
    const dir = new THREE.Vector3().subVectors(rig.look, rig.pos);
    const dist = dir.length() || 1;
    let yaw = Math.atan2(-dir.x, -dir.z);
    let pitch = Math.asin(clamp(dir.y / dist, -1, 1));
    yaw += rig.offYaw + rig.parYaw;
    pitch = clamp(pitch + rig.offPitch + rig.parPitch, -0.9, 0.9);
    camera.position.copy(rig.pos);
    camera.lookAt(rig.pos.x - Math.sin(yaw) * Math.cos(pitch), rig.pos.y + Math.sin(pitch), rig.pos.z - Math.cos(yaw) * Math.cos(pitch));
  };

  // ---------- state ----------
  let phase = 'dark'; // dark → lit → entering → inside
  let mode = 'cinematic';
  let focusId = null;
  let prevPose = null;
  let hoverId = null;
  let introT = 0;
  let closingT = 0;
  const vel = new THREE.Vector3();
  const order = (opts.exhibits || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)).map((e) => e.id).concat('closing');
  const keys = {};
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, down: false, sx: 0, sy: 0, moved: false, id: -1 };
  const ray = new THREE.Raycaster();

  let enterT = 0;
  // lights come up front-to-back: entrance first, then each exhibit by its depth in the building
  const delayOf = (r) => clamp(-r.light.position.z / 44, 0, 1);
  const setTargets = () => {
    lights.forEach((r) => {
      let f = 0;
      if (phase === 'dark') f = 0;
      else if (phase === 'lit') f = r.group === 'entry' ? 1 : r.group === 'hall1' && introT > 0.9 + delayOf(r) * 2.2 ? 0.45 : 0;
      else if (phase === 'entering') f = r.group === 'entry' || enterT > 0.4 + delayOf(r) * 3.2 ? 1 : r.group === 'hall1' ? 0.45 : 0;
      else f = 1;
      if (r.group === 'closing' && phase === 'inside') {
        f = focusId === 'closing' ? (closingT > (r.light.position.x < 0 ? 0.5 : 1.1) ? 1.9 : 0.12) : 0.35;
      } else if (focusId) {
        if (r.id === focusId) f = 1.9; else if (r.group !== 'entry') f *= 0.32; else f *= 0.4;
      } else if (hoverId && r.id === hoverId && phase === 'inside') f = 1.25;
      r.target = f;
    });
    exhibits.forEach((e, id) => e.edgeMats.forEach((m) => { m.userData.target = id === focusId ? 0.75 : focusId ? 0.08 : 0.18; }));
  };

  const doFocus = (id) => {
    const e = exhibits.get(id);
    if (!e || phase !== 'inside') return;
    if (!focusId) prevPose = { pos: rig.pos.clone(), look: rig.look.clone() };
    focusId = id; hoverId = null; closingT = 0;
    rig.offYaw = 0; rig.offPitch = 0;
    setTargets();
    if (e.dyn) { // fit the whole certificate in frame whatever the screen shape (phones are narrow)
      const hf = 2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * camera.aspect);
      const d = Math.max(e.dyn.base, (e.dyn.w * 1.08) / (2 * Math.tan(hf / 2)));
      e.view = e.group.localToWorld(new THREE.Vector3(0, e.dyn.y, d)); e.view.y = e.dyn.y;
    }
    tweenTo(e.view, e.focus, 2.0);
    cb.onHover(null);
    cb.onFocus(id);
  };
  const doClose = () => {
    if (!focusId) return;
    focusId = null;
    setTargets();
    const p = prevPose || HOME;
    tweenTo(p.pos, p.look, 1.7);
    cb.onFocus(null);
  };

  // ---------- input ----------
  const local = (e) => { const r = container.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r.width, r.height]; };
  const pick = () => {
    ray.setFromCamera({ x: pointer.nx, y: pointer.ny }, camera);
    const hit = ray.intersectObjects(hits, false)[0];
    return hit && hit.distance < 30 ? hit.object.userData.id : null;
  };
  const onMove = (e) => {
    const [x, y, w, h] = local(e);
    pointer.nx = (x / w) * 2 - 1; pointer.ny = -(y / h) * 2 + 1;
    if (pointer.down) {
      const dx = e.clientX - pointer.x, dy = e.clientY - pointer.y;
      if (Math.abs(e.clientX - pointer.sx) + Math.abs(e.clientY - pointer.sy) > 5) pointer.moved = true;
      if (pointer.moved && !tween) {
        const k = mode === 'free' ? 0.0042 : 0.0026;
        rig.offYaw = mode === 'free' ? rig.offYaw + dx * k : clamp(rig.offYaw + dx * k, -0.9, 0.9);
        rig.offPitch = clamp(rig.offPitch + dy * k * 0.7, -0.45, 0.45);
      }
    }
    pointer.x = e.clientX; pointer.y = e.clientY;
    if (!pointer.down && phase === 'inside' && e.pointerType !== 'touch') {
      const id = pick();
      if (id !== hoverId && !focusId) { hoverId = id; setTargets(); cb.onHover(id); }
      container.style.cursor = id && !focusId ? 'pointer' : mode === 'free' ? 'grab' : 'default';
    }
  };
  const onDown = (e) => {
    if (e.button > 0) return;
    pointer.down = true; pointer.moved = false; pointer.sx = pointer.x = e.clientX; pointer.sy = pointer.y = e.clientY; pointer.id = e.pointerId;
    const [x, y, w, h] = local(e); pointer.nx = (x / w) * 2 - 1; pointer.ny = -(y / h) * 2 + 1;
  };
  const onUp = (e) => {
    if (!pointer.down) return;
    pointer.down = false;
    if (!pointer.moved && phase === 'inside') {
      const id = pick();
      if (id && id !== focusId) doFocus(id);
      else if (!id && focusId) doClose();
    }
  };
  const onLeave = () => { pointer.down = false; if (hoverId) { hoverId = null; setTargets(); cb.onHover(null); } };
  const onKey = (e) => {
    const k = e.key.toLowerCase();
    if (mode === 'free' && ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { keys[k] = e.type === 'keydown'; e.preventDefault(); return; }
    if (e.type !== 'keydown') return;
    if (k === 'escape' && focusId) { doClose(); e.preventDefault(); }
    else if ((k === 'arrowright' || k === 'arrowdown') && phase === 'inside') { api.next(); e.preventDefault(); }
    else if ((k === 'arrowleft' || k === 'arrowup') && phase === 'inside') { api.prev(); e.preventDefault(); }
  };
  container.addEventListener('pointermove', onMove);
  container.addEventListener('pointerdown', onDown);
  window.addEventListener('pointerup', onUp);
  container.addEventListener('pointerleave', onLeave);
  container.addEventListener('keydown', onKey);
  container.addEventListener('keyup', onKey);

  // ---------- resize / visibility ----------
  // Adaptive quality: weak GPUs (integrated graphics, software rendering) get cheaper glass and a lower
  // resolution after a short measurement, so the walk-through stays smooth instead of stuttering.
  let pixelCap = low ? 1.25 : 1.75;
  let tier = low ? 2 : 0; // 0 full · 1 cheap glass + DPR 1 · 2 lowest (DPR 0.75)
  container.dataset.quality = String(tier);
  const perf = { n: 0, start: 0, last: 0, max: 0 };
  const mountedAt = performance.now();
  const downgrade = () => {
    tier += 1;
    if (tier === 1) {
      glassMats.forEach((m) => {
        if (m.isMeshPhysicalMaterial) { m.transmission = 0; m.transparent = true; m.opacity = 0.1; m.depthWrite = false; m.needsUpdate = true; }
      });
      pixelCap = 1;
    } else pixelCap = 0.75;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelCap));
    container.dataset.quality = String(tier);
    resize();
  };
  // Measures ~20 frames (or 3 s on very slow machines); below 30 fps it steps the quality down a tier,
  // then re-checks, so a weak laptop settles on something smooth within a few seconds. The single slowest
  // frame is ignored so one-off shader compiles don't cause a false downgrade.
  const watchPerf = (now) => {
    if (tier >= 2 || now - mountedAt < 1500) return;
    if (!perf.last || now - perf.last > 4000) { perf.last = now; perf.start = now; perf.n = 0; perf.max = 0; return; } // tab was idle: restart
    const gap = now - perf.last;
    perf.last = now;
    if (perf.n < 0) { perf.n++; perf.start = now; return; }
    perf.n++; perf.max = Math.max(perf.max, gap);
    const el = now - perf.start;
    if (perf.n >= 20 || (perf.n >= 4 && el > 3000)) {
      const fps = ((perf.n - 1) * 1000) / Math.max(1, el - perf.max);
      perf.start = now; perf.n = 0; perf.max = 0;
      if (fps < 30) downgrade();
      else perf.n = -150; // healthy: look again after a few seconds, in case the walk-through gets heavier
    }
  };
  const inset = { cur: 0, target: 0 };
  const resize = () => {
    const w = Math.max(1, container.clientWidth), h = Math.max(1, container.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w < 700 ? 64 : w < 1100 ? 56 : 50;
    camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(container); resize();
  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; }, { threshold: 0.01 });
  io.observe(container);

  // ---------- loop ----------
  const clock = new THREE.Clock();
  let raf = 0, alive = true;
  const tmpF = new THREE.Vector3();
  const frame = () => {
    raf = requestAnimationFrame(frame);
    if (!alive || !visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reduced) watchPerf(performance.now());

    // intro: lights come up in sequence after load
    if (phase === 'dark' && readyFired) { introT += dt; if (introT > (reduced ? 0 : 0.6)) { phase = 'lit'; setTargets(); } }
    if (phase === 'lit' && introT < 99) { introT += dt; setTargets(); if (introT > (reduced ? 0.1 : 3.6)) { introT = 99; setTargets(); cb.onIntroDone(); } }
    if (phase === 'entering') { enterT += dt; setTargets(); }

    // lights ease toward targets, staggered by depth on the way in
    lights.forEach((r) => {
      const speed = phase === 'entering' || phase === 'lit' ? 1.1 : 2.6;
      r.factor = damp(r.factor, r.target, reduced ? 50 : speed, dt);
      r.light.intensity = r.base * r.factor;
      if (r.cone) r.cone.material.uniforms.uOpacity.value = r.coneBase * Math.min(r.factor, 1.4) * (focusId && r.id !== focusId ? 0.4 : 1);
    });
    hemi.intensity = damp(hemi.intensity, phase === 'dark' ? 0 : focusId ? 0.32 : 0.85, 2, dt);
    exhibits.forEach((e) => { if (e.signMat && e.spot) e.signMat.opacity = damp(e.signMat.opacity, clamp(e.spot.factor * 1.25, 0, 1), 6, dt); });
    if (focusId === 'closing') { const before = closingT; closingT += dt; if ((before < 0.5 && closingT >= 0.5) || (before < 1.1 && closingT >= 1.1)) setTargets(); }
    closingMat.emissiveIntensity = damp(closingMat.emissiveIntensity, focusId === 'closing' && closingT > 1.3 ? 0.42 : 0.12, 1.4, dt);
    if (!reduced) {
      // spotlights drift a few centimetres, so the light on each exhibit feels alive
      lights.forEach((r) => { if (r.id && r.id !== focusId) { r.light.target.position.x = r.aim.x + Math.sin(t * 0.32 + r.ph) * 0.07; r.light.target.position.z = r.aim.z + Math.cos(t * 0.27 + r.ph) * 0.05; } });
    }
    // the glass of a selected vitrine or case lifts away; it settles back when closed
    exhibits.forEach((e, id) => (e.glass || []).forEach((gp) => {
      gp.lift = damp(gp.lift, id === focusId ? 0.24 : 0, reduced ? 50 : 2.4, dt);
      gp.mesh.position.y = gp.y + gp.lift; gp.edge.position.y = gp.y + gp.lift;
    }));
    exhibits.forEach((e) => e.edgeMats.forEach((m) => { if (m.userData.target != null) m.opacity = damp(m.opacity, m.userData.target, 3, dt); }));

    // restrained motion
    if (!reduced) {
      spinners.forEach((o) => { o.rotation.y += dt * 0.12; });
      floaters.forEach((f) => { f.obj.position.y = 1.72 + Math.sin(t * 0.8 + f.phase) * 0.035; f.obj.rotation.y = Math.sin(t * 0.35 + f.phase) * 0.06; });
    }

    // camera
    if (tween) {
      tween.t = Math.min(1, tween.t + dt / tween.dur);
      const k = ease(tween.t);
      rig.pos.lerpVectors(tween.fromP, tween.toP, k);
      rig.look.lerpVectors(tween.fromL, tween.toL, k);
      rig.offYaw = damp(rig.offYaw, 0, 3, dt); rig.offPitch = damp(rig.offPitch, 0, 3, dt);
      if (tween.t >= 1) { const d = tween.done; tween = null; if (d) d(); }
    } else if (mode === 'free' && phase === 'inside' && !focusId) {
      const fw = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0);
      const st = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0);
      const dir = new THREE.Vector3().subVectors(rig.look, rig.pos); dir.y = 0; dir.normalize();
      dir.applyAxisAngle(new THREE.Vector3(0, 1, 0), rig.offYaw);
      const right = new THREE.Vector3(-dir.z, 0, dir.x);
      const spd = keys.shift ? 4.2 : 2.4;
      const want = new THREE.Vector3().addScaledVector(dir, fw * spd).addScaledVector(right, st * spd);
      vel.x = damp(vel.x, want.x, reduced ? 50 : 7, dt); vel.z = damp(vel.z, want.z, reduced ? 50 : 7, dt); // ease in and glide to a stop
      if (vel.lengthSq() > 0.0004) {
        const next = rig.pos.clone().addScaledVector(vel, dt);
        next.x = clamp(next.x, -HALL_W / 2 + 0.7, HALL_W / 2 - 0.7);
        next.z = clamp(next.z, Z_END + 0.8, Z_ENTRY - 0.8);
        if (next.z < Z_PART + 0.7 && next.z > Z_PART - 0.7 && Math.abs(next.x) > 1.9) next.z = rig.pos.z;
        let blocked = false;
        exhibits.forEach((e) => { if (e.group && e.data.type !== 'wall' && Math.hypot(next.x - e.group.position.x, next.z - e.group.position.z) < 0.85 * (e.data.size || 1)) blocked = true; });
        if (!blocked) { const d = next.clone().sub(rig.pos); rig.pos.add(d); rig.look.add(d); }
      }
    }
    // gentle parallax from the pointer (not in free mode, not on touch)
    const pAim = mode === 'cinematic' && !pointer.down && !reduced ? 1 : 0;
    rig.parYaw = damp(rig.parYaw, -pointer.nx * 0.045 * pAim, 2.2, dt);
    rig.parPitch = damp(rig.parPitch, pointer.ny * 0.03 * pAim, 2.2, dt);
    if (dust) {
      const u = dust.material.uniforms;
      u.uTime.value = t; u.uPx.value = renderer.getPixelRatio();
      u.uAmt.value = damp(u.uAmt.value, phase === 'dark' ? 0 : focusId ? 0.55 : 1, 1.6, dt);
    }
    // phones: slide the picture up while the details sheet is open, so the exhibit sits above it
    inset.cur = damp(inset.cur, inset.target, 5, dt);
    if (inset.cur > 0.5) camera.setViewOffset(container.clientWidth, container.clientHeight, 0, inset.cur / 2, container.clientWidth, container.clientHeight);
    else if (camera.view) { camera.clearViewOffset(); inset.cur = 0; }
    applyCamera();
    renderer.render(scene, camera);
  };
  frame();

  // fonts must be ready before plaques/closing wall are painted; repaint once they arrive
  if (document.fonts && document.fonts.load) {
    Promise.all(['400 46px "Cormorant Garamond"', '300 118px "Cormorant Garamond"', '500 20px "Instrument Sans"', '600 120px "Instrument Sans"', '500 27px "Instrument Sans"', '400 150px "Mrs Saint Delafield"'].map((f) => document.fonts.load(f).catch(() => {})))
      .then(() => { if (!alive) return; disposables.forEach((d) => { if (d && d.isCanvasTexture && d.userData.redraw) d.userData.redraw(); }); });
  }

  // ---------- public API ----------
  const api = {
    enter() {
      if (phase !== 'lit') return;
      phase = 'entering'; setTargets();
      tweenTo(HOME.pos, HOME.look, 4.2, () => { phase = 'inside'; setTargets(); cb.onEntered(); });
    },
    setInset(px) { inset.target = Math.max(0, Math.min(px || 0, container.clientHeight * 0.55)); },
    focus: (id) => doFocus(id),
    close: () => doClose(),
    next() { const i = focusId ? order.indexOf(focusId) : -1; doFocus(order[(i + 1) % order.length]); },
    prev() { const i = focusId ? order.indexOf(focusId) : 0; doFocus(order[(i - 1 + order.length) % order.length]); },
    toEntrance() { if (phase !== 'inside') return; focusId = null; setTargets(); cb.onFocus(null); tweenTo(HOME.pos, HOME.look, 2.4); },
    setMode(m) { mode = m === 'free' ? 'free' : 'cinematic'; if (mode === 'cinematic') { rig.offPitch = 0; } container.style.cursor = mode === 'free' ? 'grab' : 'default'; container.focus({ preventScroll: true }); },
    destroy() {
      alive = false;
      clearTimeout(readyTimer);
      cancelAnimationFrame(raf);
      ro.disconnect(); io.disconnect();
      container.removeEventListener('pointermove', onMove);
      container.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      container.removeEventListener('pointerleave', onLeave);
      container.removeEventListener('keydown', onKey);
      container.removeEventListener('keyup', onKey);
      scene.traverse((o) => { if (o.isLight && o.dispose) o.dispose(); });
      disposables.forEach((d) => { try { d.dispose(); } catch (e) {} });
      envRT.dispose(); pmrem.dispose();
      renderer.dispose();
      if (!isSoftwareGL(renderer.getContext())) renderer.forceContextLoss(); // free the WebGL context right away (browsers cap live contexts)
    }
  };
  return api;
}

// soft radial contact shadow, shared by every floor exhibit
const shadowMat = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,0.75)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
})();

// warm pool of light on the floor under each stand, and the glow behind a certificate in its case
const poolMat = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 128, 6, 128, 128, 128);
  gr.addColorStop(0, 'rgba(255,226,170,0.55)'); gr.addColorStop(0.45, 'rgba(255,214,150,0.16)'); gr.addColorStop(1, 'rgba(255,214,150,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
})();
const haloMat = (() => {
  const c = document.createElement('canvas'); c.width = 256; c.height = 192;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(128, 96, 10, 128, 96, 130);
  gr.addColorStop(0, 'rgba(255,236,200,0.65)'); gr.addColorStop(1, 'rgba(255,236,200,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 256, 192);
  return new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
})();

export function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; }
}
