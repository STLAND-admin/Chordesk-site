/**
 * Procedural, deliberately schematic Duo grip model (no hardware dimensions claimed).
 * createGripScene(canvas) -> setView(front|back|orbit), setGrip(right|bottom),
 * setAction(overview|keyboard|trackpad), setPlaying(boolean), resize(), dispose().
 * Right grip: right index/middle operate the rear half; bottom grip: both hands do.
 * Both thumbs always stay on the front keyboard. All input remains browser-local.
 */
import * as THREE from './vendor/three.module.js';

const TAU = Math.PI * 2;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;
const vec = (a) => new THREE.Vector3(...a);

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function textureFrom(draw, w, h) {
  const source = document.createElement('canvas');
  source.width = w;
  source.height = h;
  const ctx = source.getContext('2d');
  if (!ctx) throw new Error('无法创建 3D 示意图的屏幕纹理。');
  draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(source);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundedRect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
}

function frontTexture() {
  return textureFrom((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h * .75);
    bg.addColorStop(0, '#324b79');
    bg.addColorStop(.6, '#7585bb');
    bg.addColorStop(1, '#c5abc7');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffffb5';
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillText('REMOTE DESKTOP', 38, 44);
    ctx.textAlign = 'right';
    ctx.fillText('DEMO', w - 38, 44);
    ctx.textAlign = 'left';

    // A real display area occupies the upper three quarters, with a sample app.
    roundedRect(ctx, 106, 106, 810, 568, 22, '#17213b35');
    roundedRect(ctx, 94, 94, 810, 568, 22, '#f9fafc');
    roundedRect(ctx, 94, 94, 810, 62, 22, '#edf0f5');
    ctx.fillStyle = '#edf0f5';
    ctx.fillRect(94, 124, 810, 32);
    ['#f08083', '#e8c465', '#79c9a9'].forEach((c, i) => {
      ctx.beginPath(); ctx.arc(126 + i * 28, 124, 8, 0, TAU); ctx.fillStyle = c; ctx.fill();
    });
    ctx.font = '600 22px system-ui, sans-serif';
    ctx.fillStyle = '#495566';
    ctx.fillText('A little room to think', 340, 132);
    ctx.font = '700 54px system-ui, sans-serif';
    ctx.fillStyle = '#27344e';
    ctx.fillText('Keep your hands.', 150, 245);
    ctx.fillText('Move your ideas.', 150, 312);
    ctx.fillStyle = '#718094';
    ctx.font = '27px system-ui, sans-serif';
    ctx.fillText('Monitor above. Input below.', 150, 380);
    roundedRect(ctx, 150, 430, 692, 132, 16, '#e8edf8');
    ctx.fillStyle = '#8192c5';
    [0, 1, 2].forEach(i => roundedRect(ctx, 177, 457 + i * 30, [492, 614, 356][i], 10, 5, '#a3afd1'));
    ctx.fillStyle = '#263245';
    ctx.beginPath(); ctx.moveTo(744, 563); ctx.lineTo(744, 601); ctx.lineTo(755, 591); ctx.lineTo(765, 611); ctx.lineTo(775, 606); ctx.lineTo(765, 586); ctx.lineTo(782, 586); ctx.closePath(); ctx.fill();

    const keyboardY = h * .75;
    ctx.fillStyle = '#d3d9e4'; ctx.fillRect(0, keyboardY, w, h - keyboardY);
    ctx.fillStyle = '#a8b3c4'; ctx.fillRect(0, keyboardY, w, 2);
    const rows = [
      ['esc', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'],
      ['tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
      ['⇧', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '↵'],
      ['⌘', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '↑'],
      ['ctrl', '⌥', '⌘', 'space', '←', '↓', '→'],
    ];
    const gap = 7, rowH = 41, y0 = keyboardY + 13;
    rows.forEach((row, ri) => {
      const weights = row.map(k => k === 'space' ? 5.3 : (k.length > 1 ? 1.25 : 1));
      const total = weights.reduce((a, b) => a + b, 0);
      const unit = (w - 40 - gap * (row.length - 1)) / total;
      let x = 20;
      row.forEach((k, ki) => {
        const kw = unit * weights[ki];
        roundedRect(ctx, x, y0 + ri * (rowH + gap) + 2, kw, rowH, 7, '#aeb8c9');
        roundedRect(ctx, x, y0 + ri * (rowH + gap), kw, rowH - 1, 7, '#f6f7fb');
        ctx.fillStyle = '#33435b'; ctx.font = '500 21px system-ui, sans-serif';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(k === 'space' ? '' : k, x + kw / 2, y0 + ri * (rowH + gap) + rowH / 2);
        x += kw + gap;
      });
    });
  }, 1024, 1024);
}

function rearTexture() {
  return textureFrom((ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, '#183b45'); bg.addColorStop(1, '#162a38');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#66dcc52a'; ctx.lineWidth = 1;
    for (let x = 24; x < w; x += 30) for (let y = 24; y < h; y += 30) {
      ctx.beginPath(); ctx.arc(x, y, 1.3, 0, TAU); ctx.stroke();
    }
    ctx.strokeStyle = '#70e4cd88'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(28, 28, w - 56, h - 56, 24); ctx.stroke();
    // No orientation-dependent wording: the plane rotates with the hardware.
    ctx.strokeStyle = '#75e6d277'; ctx.lineWidth = 4;
    [-1, 1].forEach(s => {
      ctx.beginPath(); ctx.moveTo(w / 2 + s * 35, h / 2 - 65);
      ctx.lineTo(w / 2 + s * 35, h / 2 + 65); ctx.stroke();
    });
  }, 512, 1024);
}

export function createGripScene(canvas) {
  if (!(canvas instanceof HTMLCanvasElement)) throw new TypeError('createGripScene requires a canvas.');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (error) {
    throw new Error('当前浏览器无法启动 WebGL；请使用页面的二维交互原型。', { cause: error });
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0xf0f3f6, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  canvas.style.touchAction = 'none';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(37, 1, .1, 70);
  const assembly = new THREE.Group();
  scene.add(assembly);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8b96aa, 2.2));
  const keyLight = new THREE.DirectionalLight(0xfff7ed, 3.2);
  keyLight.position.set(-4, 7, 8); keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  Object.assign(keyLight.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: .5, far: 25 });
  keyLight.shadow.normalBias = .025;
  scene.add(keyLight);
  const rim = new THREE.DirectionalLight(0xc3e8ff, 2.5); rim.position.set(4, 2, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, .8); fill.position.set(-4, 1, -4); scene.add(fill);

  const material = {
    frame: new THREE.MeshStandardMaterial({ color: 0x303640, metalness: .62, roughness: .32 }),
    casing: new THREE.MeshStandardMaterial({ color: 0x424b56, metalness: .2, roughness: .55 }),
    hinge: new THREE.MeshStandardMaterial({ color: 0x1d242d, metalness: .5, roughness: .4 }),
    skin: new THREE.MeshStandardMaterial({ color: 0xc99e85, metalness: 0, roughness: .68 }),
    nail: new THREE.MeshStandardMaterial({ color: 0xe2c3af, metalness: 0, roughness: .48 }),
    cuff: new THREE.MeshStandardMaterial({ color: 0xa4b2c0, metalness: 0, roughness: .9 }),
    front: new THREE.MeshBasicMaterial({ map: frontTexture() }),
    rear: new THREE.MeshBasicMaterial({ map: rearTexture() }),
  };
  const sphereGeometry = new THREE.SphereGeometry(1, 16, 12);
  const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 14);

  function mesh(geometry, mat, parent = assembly) {
    const m = new THREE.Mesh(geometry, mat);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function ellipsoid(scale, mat, parent = assembly) {
    const m = mesh(sphereGeometry, mat, parent); m.scale.set(...scale); return m;
  }
  function face(w, h, r, mat, parent = assembly) {
    const g = new THREE.ShapeGeometry(roundedShape(w, h, r), 16);
    // ShapeGeometry's default UVs use world coordinates; normalize for canvas maps.
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + .5, pos.getY(i) / h + .5);
    return mesh(g, mat, parent);
  }
  const hardware = new THREE.Group(); assembly.add(hardware);
  const shellGeometry = new THREE.ExtrudeGeometry(roundedShape(4.22, 4.22, .23), {
    depth: .18, bevelEnabled: true, bevelSegments: 3, bevelSize: .035, bevelThickness: .035, steps: 1, curveSegments: 12,
  });
  const shell = mesh(shellGeometry, material.frame, hardware); shell.position.z = -.09;
  const back = face(4.12, 4.12, .2, material.casing, hardware); back.rotation.y = Math.PI; back.position.z = -.13;
  const hinge = mesh(new THREE.BoxGeometry(.035, 4.10, .02), material.hinge, hardware); hinge.position.z = -.145;
  // Small camera island on the opposite half gives the back a clear reading.
  const cameraIsland = face(.61, .72, .15, material.hinge, hardware);
  cameraIsland.rotation.y = Math.PI; cameraIsland.position.set(-1.57, 1.57, -.16);
  [-.16, .16].forEach(y => {
    const lens = mesh(new THREE.CylinderGeometry(.105, .105, .025, 24), material.frame, hardware);
    lens.rotation.x = Math.PI / 2; lens.position.set(-1.57, 1.57 + y, -.19);
    const glass = ellipsoid([.075, .075, .012], new THREE.MeshStandardMaterial({ color: 0x081b2a, metalness: .3, roughness: .1 }), hardware);
    glass.position.set(-1.57, 1.57 + y, -.208);
  });
  const screen = face(4.01, 4.01, .15, material.front); screen.position.z = .151;
  screen.castShadow = false;
  const rearAssembly = new THREE.Group(); assembly.add(rearAssembly);
  const rearScreen = face(1.96, 4.01, .15, material.rear, rearAssembly);
  rearScreen.position.set(1.025, 0, -.158); rearScreen.rotation.y = Math.PI; rearScreen.castShadow = false;

  const shadow = mesh(new THREE.PlaneGeometry(18, 18), new THREE.ShadowMaterial({ color: 0x6c798b, opacity: .10 }), scene);
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -3.12; shadow.castShadow = false;

  function placeBone(m, a, b, radius) {
    m.position.copy(a).add(b).multiplyScalar(.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.scale.set(radius, a.distanceTo(b), radius);
  }

  const fingers = [], palms = [], wrists = [];
  const rings = [];
  const ringGeometry = new THREE.RingGeometry(.115, .135, 36);
  function contactRing(front, handSide) {
    const ring = mesh(ringGeometry, new THREE.MeshBasicMaterial({
      color: front ? 0xa58afb : 0x53e7cb, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false,
    }));
    ring.castShadow = false; ring.receiveShadow = false;
    rings.push({ mesh: ring, front, handSide });
    return ring;
  }
  const mirrored = (points, s) => points.map(p => [p[0] * s, p[1], p[2]]);
  function addFinger(side, type, rightPoints, bottomPoints, radius, active) {
    const bones = [0, 1, 2].map(() => mesh(cylinderGeometry, material.skin));
    const joints = [0, 1, 2, 3].map(() => ellipsoid([radius, radius, radius], material.skin));
    const nail = ellipsoid([radius * .55, radius * .8, .014], material.nail);
    const front = type === 'thumb';
    fingers.push({
      side, type, radius, front, active, bones, joints, nail,
      from: mirrored(rightPoints, side).map(vec), to: mirrored(bottomPoints, side).map(vec),
      ring: active || front ? contactRing(front, side) : null,
    });
  }

  [-1, 1].forEach(side => {
    const palm = ellipsoid([.42, .68, .31], material.skin);
    palm.rotation.z = -side * .19;
    palms.push({ mesh: palm, from: vec([side * 2.23, -1.04, -.02]), to: vec([side * 2.20, -1.48, -.03]) });
    const wrist = mesh(cylinderGeometry, material.skin);
    const cuff = mesh(cylinderGeometry, material.cuff);
    wrists.push({ side, wrist, cuff });
    addFinger(side, 'thumb', [[2.15, -1.38, .12], [1.80, -1.20, .40], [1.35, -1.34, .43], [.98, -1.51, .30]],
      [[2.16, -1.75, .12], [1.80, -1.58, .42], [1.35, -1.54, .43], [.98, -1.54, .30]], .18, false);
    addFinger(side, 'index', [[2.18, -.49, -.05], [2.23, -.12, -.39], [1.71, -.10, -.52], [1.24, -.24, -.295]],
      [[2.20, -1.00, -.06], [2.23, -.90, -.39], [1.73, -1.10, -.52], [1.27, -1.33, -.295]], .137, true);
    addFinger(side, 'middle', [[2.26, -.78, -.06], [2.29, -.62, -.43], [1.78, -.62, -.55], [1.31, -.75, -.305]],
      [[2.26, -1.32, -.06], [2.27, -1.29, -.43], [1.77, -1.48, -.55], [1.29, -1.66, -.305]], .145, true);
    addFinger(side, 'ring', [[2.28, -1.06, -.08], [2.31, -1.12, -.43], [1.90, -1.17, -.49], [1.57, -1.29, -.285]],
      [[2.27, -1.60, -.08], [2.29, -1.72, -.43], [1.94, -1.81, -.49], [1.66, -1.89, -.285]], .132, false);
    addFinger(side, 'pinky', [[2.25, -1.37, -.06], [2.29, -1.49, -.37], [2.00, -1.57, -.43], [1.77, -1.68, -.255]],
      [[2.22, -1.87, -.06], [2.22, -2.06, -.35], [1.98, -2.13, -.40], [1.77, -2.10, -.25]], .109, false);
  });

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches, disposed = false;
  let currentView = 'orbit', currentAction = 'overview', gripTarget = 0, gripBlend = 0;
  let yaw = .60, pitch = .18, targetYaw = yaw, targetPitch = pitch;
  let distance = 10.8, lastTime = 0, animationTime = 0, frameId = 0;
  let dragging = false, dragPoint = null;

  function resize() {
    if (disposed) return;
    const bounds = canvas.getBoundingClientRect();
    const w = Math.max(1, bounds.width), h = Math.max(1, bounds.height);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    distance = 10.8 * Math.max(1, 1.12 / camera.aspect);
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  function setView(view) {
    if (!['front', 'back', 'orbit'].includes(view)) return;
    currentView = view;
    const next = view === 'back' ? Math.PI : view === 'front' ? 0 : .65;
    targetYaw = yaw + Math.atan2(Math.sin(next - yaw), Math.cos(next - yaw));
    targetPitch = view === 'orbit' ? .18 : .04;
  }
  function setGrip(grip) {
    if (!['right', 'bottom'].includes(grip)) return;
    gripTarget = grip === 'bottom' ? 1 : 0;
  }
  function setAction(action) {
    if (!['overview', 'keyboard', 'trackpad'].includes(action)) return;
    currentAction = action;
    setView(action === 'trackpad' ? 'back' : action === 'keyboard' ? 'front' : 'orbit');
  }
  function setPlaying(value) { playing = Boolean(value); }
  function pointerDown(event) {
    if (event.button !== 0) return;
    dragging = true; dragPoint = [event.clientX, event.clientY];
    canvas.setPointerCapture(event.pointerId); canvas.style.cursor = 'grabbing';
  }
  function pointerMove(event) {
    if (!dragging || !dragPoint) return;
    targetYaw -= (event.clientX - dragPoint[0]) * .009;
    targetPitch = clamp(targetPitch + (event.clientY - dragPoint[1]) * .006, -.55, .62);
    dragPoint = [event.clientX, event.clientY];
  }
  function pointerUp(event) {
    dragging = false; dragPoint = null; canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointerdown', pointerDown);
  canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp);
  canvas.addEventListener('pointercancel', pointerUp);

  function animate(ms) {
    if (disposed) return;
    const dt = Math.min(.05, lastTime ? (ms - lastTime) / 1000 : 0);
    lastTime = ms;
    if (playing && !dragging) animationTime += dt;
    const damping = reducedMotion.matches ? 1 : 1 - Math.exp(-dt * 8);
    gripBlend = lerp(gripBlend, gripTarget, damping);
    yaw = lerp(yaw, targetYaw, damping);
    pitch = lerp(pitch, targetPitch, damping);
    hardware.rotation.z = -Math.PI / 2 * gripBlend;
    rearAssembly.rotation.z = hardware.rotation.z;
    // A tiny sway reads as held, while the camera remains under the visitor's control.
    const sway = currentView === 'orbit' && playing && !dragging ? Math.sin(animationTime * .28) * .10 : 0;
    camera.position.set(Math.sin(yaw + sway) * Math.cos(pitch) * distance,
      Math.sin(pitch) * distance - .28, Math.cos(yaw + sway) * Math.cos(pitch) * distance);
    camera.lookAt(0, -.28, 0);

    palms.forEach(p => p.mesh.position.copy(p.from).lerp(p.to, gripBlend));
    wrists.forEach(({ side, wrist, cuff }) => {
      const top = vec([side * 2.29, lerp(-1.51, -1.92, gripBlend), -.035]);
      const end = vec([side * 2.65, lerp(-2.33, -2.68, gripBlend), -.15]);
      placeBone(wrist, top, end, .285);
      const sleeveStart = end.clone().lerp(top, .20);
      const sleeveEnd = end.clone().add(vec([side * .10, -.28, -.03]));
      placeBone(cuff, sleeveStart, sleeveEnd, .318);
    });
    fingers.forEach((f, index) => {
      const points = f.from.map((p, i) => p.clone().lerp(f.to[i], gripBlend));
      const rearActive = f.active && (f.side > 0 || gripBlend > .85);
      const roleActive = f.front ? currentAction !== 'trackpad' : rearActive && currentAction !== 'keyboard';
      const phase = animationTime * (f.front ? 3.8 : 1.5) + (f.side < 0 ? Math.PI : 0) + (f.type === 'middle' ? .3 : 0);
      if (roleActive && playing) {
        if (f.front) {
          const tap = Math.max(0, Math.sin(phase));
          points[3].z += tap * .075;
          points[2].z += tap * .035;
          points[3].x += Math.sin(phase * .32) * .08;
        } else {
          const slide = Math.sin(phase) * .10;
          points[3].y += slide;
          points[2].y += slide * .5;
          points[3].x += Math.cos(phase) * .025;
        }
      }
      f.bones.forEach((bone, i) => placeBone(bone, points[i], points[i + 1], f.radius * (1 - i * .085)));
      f.joints.forEach((joint, i) => {
        joint.position.copy(points[i]);
        joint.scale.setScalar(f.radius * (1 - Math.max(0, i - 1) * .085));
      });
      f.nail.position.copy(points[3]);
      f.nail.position.z += f.front ? f.radius * .79 : -f.radius * .76;
      f.nail.rotation.z = f.front ? f.side * .75 : f.side * .68;
      if (f.ring) {
        f.ring.visible = roleActive;
        f.ring.position.copy(points[3]);
        f.ring.position.z = f.front ? .159 : -.167;
        const pulse = playing ? (Math.sin(animationTime * 3 + index) + 1) / 2 : .4;
        f.ring.scale.setScalar(1.25 + pulse * .6);
        f.ring.material.opacity = .40 + (1 - pulse) * .42;
      }
    });
    renderer.render(scene, camera);
    frameId = requestAnimationFrame(animate);
  }
  frameId = requestAnimationFrame(animate);

  function dispose() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frameId);
    observer.disconnect();
    canvas.removeEventListener('pointerdown', pointerDown);
    canvas.removeEventListener('pointermove', pointerMove);
    canvas.removeEventListener('pointerup', pointerUp);
    canvas.removeEventListener('pointercancel', pointerUp);
    const geometries = new Set(), materials = new Set(), textures = new Set();
    scene.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => {
        materials.add(m);
        Object.values(m).forEach(v => { if (v?.isTexture) textures.add(v); });
      });
    });
    textures.forEach(t => t.dispose()); materials.forEach(m => m.dispose()); geometries.forEach(g => g.dispose());
    renderer.dispose();
  }
  return { setView, setGrip, setAction, setPlaying, resize, dispose };
}
