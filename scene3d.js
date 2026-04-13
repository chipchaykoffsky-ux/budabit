import * as THREE from 'three';

const container = document.getElementById('scene3d');
if (container) {
  const rect = () => container.getBoundingClientRect();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.z = 5.5;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const size = rect().width;
  renderer.setSize(size, size);
  container.appendChild(renderer.domElement);

  /* ========== CORE: wireframe icosahedron ========== */
  const coreGeom = new THREE.IcosahedronGeometry(1.4, 1);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0x6366F1,
    wireframe: true,
    transparent: true,
    opacity: 0.85,
  });
  const core = new THREE.Mesh(coreGeom, coreMat);
  scene.add(core);

  /* glowing inner solid */
  const innerGeom = new THREE.IcosahedronGeometry(1.0, 2);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xFF7A59,
    transparent: true,
    opacity: 0.12,
  });
  const inner = new THREE.Mesh(innerGeom, innerMat);
  scene.add(inner);

  /* ========== PARTICLE SPHERE ========== */
  const particleCount = 1800;
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const radii = new Float32Array(particleCount);

  const cIndigo = new THREE.Color(0x4F46E5);
  const cViolet = new THREE.Color(0x7C3AED);
  const cCoral  = new THREE.Color(0xFF7A59);

  for (let i = 0; i < particleCount; i++) {
    // fibonacci sphere + slight jitter
    const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    const r = 2.3 + Math.random() * 0.4;
    radii[i] = r;

    positions[i * 3]     = Math.cos(theta) * Math.sin(phi) * r;
    positions[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * r;
    positions[i * 3 + 2] = Math.cos(phi) * r;

    const t = Math.random();
    const c = t < 0.4 ? cIndigo : t < 0.75 ? cViolet : cCoral;
    colors[i * 3]     = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }

  const particleGeom = new THREE.BufferGeometry();
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const particles = new THREE.Points(particleGeom, particleMat);
  scene.add(particles);

  /* ========== ORBITING RINGS ========== */
  const ringGroup = new THREE.Group();
  scene.add(ringGroup);
  const ringColors = [0x4F46E5, 0x7C3AED, 0xFF7A59];
  ringColors.forEach((col, i) => {
    const g = new THREE.TorusGeometry(2.8 + i * 0.15, 0.015, 12, 120);
    const m = new THREE.MeshBasicMaterial({
      color: col, transparent: true, opacity: 0.55,
    });
    const ring = new THREE.Mesh(g, m);
    ring.rotation.x = Math.random() * Math.PI;
    ring.rotation.y = Math.random() * Math.PI;
    ring.rotation.z = Math.random() * Math.PI;
    ringGroup.add(ring);
  });

  /* ========== INTERACTION ========== */
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  container.addEventListener('mousemove', (e) => {
    const r = rect();
    mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
    mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  });
  container.addEventListener('mouseleave', () => { mouse.tx = 0; mouse.ty = 0; });

  /* ========== RESIZE ========== */
  const onResize = () => {
    const s = rect().width;
    renderer.setSize(s, s);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', onResize);

  /* ========== RAF LOOP ========== */
  const posAttr = particleGeom.attributes.position;
  let t0 = 0;

  const animate = (t) => {
    const dt = (t - t0) * 0.001;
    t0 = t;

    // smooth mouse
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;

    // core rotation
    core.rotation.x += dt * 0.3;
    core.rotation.y += dt * 0.45;
    inner.rotation.x -= dt * 0.2;
    inner.rotation.y -= dt * 0.3;

    // pulse inner
    const pulse = 1 + Math.sin(t * 0.002) * 0.08;
    inner.scale.setScalar(pulse);

    // particle sphere rotation + breathing
    particles.rotation.y += dt * 0.08;
    particles.rotation.x = Math.sin(t * 0.0005) * 0.3;

    // particle breathe
    const breathe = 1 + Math.sin(t * 0.0015) * 0.04;
    for (let i = 0; i < particleCount; i++) {
      const r = radii[i] * breathe;
      const phi = Math.acos(1 - 2 * (i + 0.5) / particleCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.0001;
      posAttr.array[i * 3]     = Math.cos(theta) * Math.sin(phi) * r;
      posAttr.array[i * 3 + 1] = Math.sin(theta) * Math.sin(phi) * r;
      posAttr.array[i * 3 + 2] = Math.cos(phi) * r;
    }
    posAttr.needsUpdate = true;

    // ring rotation
    ringGroup.rotation.x += dt * 0.15;
    ringGroup.rotation.y += dt * 0.2;

    // scene parallax from mouse
    scene.rotation.y = mouse.x * 0.5;
    scene.rotation.x = mouse.y * 0.3;

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
}
