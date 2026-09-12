/* ==========================================================
   PRAYAS STUDIO — script.js
   Sections:
   1. Utilities
   2. Header / mobile nav
   3. Custom cursor
   4. Scroll reveal (blade-wipe on headings)
   5. Global ember particle background (Canvas 2D)
   6. Hero 3D blade scene (Three.js)
   7. Contact form (front-end only)
   ========================================================== */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarsePointer = window.matchMedia('(hover: none)').matches;

/* ---------------- 1. Utilities ---------------- */
function lerp(a, b, t){ return a + (b - a) * t; }
function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

/* ---------------- 2. Header / mobile nav ---------------- */
(function headerNav(){
  const header = document.getElementById('site-header');
  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');

  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  toggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

/* ---------------- 3. Custom cursor ---------------- */
(function customCursor(){
  const dot = document.getElementById('cursor-glow');
  if (!dot || isCoarsePointer) return;

  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let cx = mx, cy = my;

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
  });

  const interactive = 'a, button, input, select, textarea, .work-card, [role="button"]';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(interactive)) dot.classList.add('is-active');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(interactive)) dot.classList.remove('is-active');
  });

  function tick(){
    cx = lerp(cx, mx, 0.18);
    cy = lerp(cy, my, 0.18);
    dot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  }
  tick();
})();

/* ---------------- 4. Scroll reveal ---------------- */
(function scrollReveal(){
  const targets = document.querySelectorAll('[data-reveal]');
  if (!targets.length) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    targets.forEach(t => t.classList.add('in-view'));
    return;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add('in-view'), i * 90);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  targets.forEach(t => io.observe(t));
})();

/* ---------------- 5. Global ember particle background ---------------- */
(function emberField(){
  const canvas = document.getElementById('ember-field');
  const ctx = canvas.getContext('2d');
  let w, h, particles, running = true;

  const COUNT = prefersReducedMotion ? 0 : (window.innerWidth < 720 ? 34 : 70);

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  function makeParticle(randomY){
    return {
      x: Math.random() * w,
      y: randomY ? Math.random() * h : h + Math.random() * 60,
      r: Math.random() * 1.8 + 0.4,
      speed: Math.random() * 0.5 + 0.15,
      drift: (Math.random() - 0.5) * 0.4,
      hue: Math.random() > 0.35 ? 'ember' : 'chrome',
      alpha: Math.random() * 0.5 + 0.25,
      flicker: Math.random() * Math.PI * 2
    };
  }

  particles = Array.from({ length: COUNT }, () => makeParticle(true));

  function draw(){
    if (!running) { requestAnimationFrame(draw); return; }
    ctx.clearRect(0, 0, w, h);

    particles.forEach(p => {
      p.y -= p.speed;
      p.x += p.drift;
      p.flicker += 0.05;
      if (p.y < -10) Object.assign(p, makeParticle(false));

      const flick = 0.7 + Math.sin(p.flicker) * 0.3;
      const color = p.hue === 'ember'
        ? `rgba(255, 70, 70, ${p.alpha * flick})`
        : `rgba(217, 221, 227, ${p.alpha * flick * 0.6})`;

      ctx.beginPath();
      ctx.fillStyle = color;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  document.addEventListener('visibilitychange', () => {
    running = !document.hidden;
  });

  if (COUNT > 0) draw();
})();

/* ---------------- 6. Hero 3D blade scene (Three.js) ---------------- */
(function heroScene(){
  const canvas = document.getElementById('hero-canvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const heroSection = document.getElementById('home');
  let width = heroSection.clientWidth;
  let height = heroSection.clientHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 9);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);

  /* ---- Lighting ---- */
  scene.add(new THREE.AmbientLight(0x554455, 0.6));

  const emberLight = new THREE.PointLight(0xff3b3b, 6, 14, 2);
  emberLight.position.set(0, -1.2, 2.5);
  scene.add(emberLight);

  const rimLight = new THREE.DirectionalLight(0xd9dde3, 1.1);
  rimLight.position.set(-4, 4, 3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x8a8e96, 0.35);
  fillLight.position.set(3, -2, -3);
  scene.add(fillLight);

  /* ---- Build the blade ---- */
  const bladeGroup = new THREE.Group();

  // Blade body: tapered profile via an extruded shape
  const bladeShape = new THREE.Shape();
  bladeShape.moveTo(-0.42, 0);
  bladeShape.lineTo(0.42, 0);
  bladeShape.lineTo(0.24, 3.6);
  bladeShape.lineTo(0, 4.35);
  bladeShape.lineTo(-0.24, 3.6);
  bladeShape.lineTo(-0.42, 0);

  const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
    depth: 0.09,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 8
  });
  bladeGeo.center();
  bladeGeo.translate(0, 0.7, 0);

  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xcfd3d9,
    metalness: 0.92,
    roughness: 0.22,
    emissive: 0x220505,
    emissiveIntensity: 0.4
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  bladeGroup.add(blade);

  // Glowing ember core line down the center of the blade
  const coreGeo = new THREE.BoxGeometry(0.05, 3.9, 0.12);
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xff5a3c,
    emissive: 0xff3b1f,
    emissiveIntensity: 2.2,
    roughness: 0.4
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 0.55, 0.02);
  bladeGroup.add(core);

  // Crossguard
  const guardGeo = new THREE.BoxGeometry(1.5, 0.16, 0.2);
  const guardMat = new THREE.MeshStandardMaterial({ color: 0xb9bdc4, metalness: 0.9, roughness: 0.3 });
  const guard = new THREE.Mesh(guardGeo, guardMat);
  guard.position.set(0, -1.28, 0);
  bladeGroup.add(guard);

  // Grip
  const gripGeo = new THREE.CylinderGeometry(0.11, 0.13, 0.9, 16);
  const gripMat = new THREE.MeshStandardMaterial({ color: 0x1a1b1e, roughness: 0.8, metalness: 0.1 });
  const grip = new THREE.Mesh(gripGeo, gripMat);
  grip.position.set(0, -1.78, 0);
  bladeGroup.add(grip);

  // Pommel (glowing ember orb)
  const pommelGeo = new THREE.SphereGeometry(0.2, 24, 24);
  const pommelMat = new THREE.MeshStandardMaterial({
    color: 0xff3b3b,
    emissive: 0xff2020,
    emissiveIntensity: 1.6,
    metalness: 0.4,
    roughness: 0.3
  });
  const pommel = new THREE.Mesh(pommelGeo, pommelMat);
  pommel.position.set(0, -2.32, 0);
  bladeGroup.add(pommel);

  bladeGroup.rotation.z = 0.04;
  bladeGroup.scale.setScalar(0.001); // start hidden, animated in on load
  scene.add(bladeGroup);

  /* ---- Ember particles rising around the blade ---- */
  const PCOUNT = prefersReducedMotion ? 120 : (window.innerWidth < 720 ? 220 : 450);
  const positions = new Float32Array(PCOUNT * 3);
  const speeds = new Float32Array(PCOUNT);
  const colors = new Float32Array(PCOUNT * 3);

  const emberColor = new THREE.Color(0xff5030);
  const chromeColor = new THREE.Color(0xd9dde3);

  for (let i = 0; i < PCOUNT; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 7;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    speeds[i] = Math.random() * 0.012 + 0.004;
    const c = Math.random() > 0.25 ? emberColor : chromeColor;
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }

  const particleGeo = new THREE.BufferGeometry();
  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const particleMat = new THREE.PointsMaterial({
    size: 0.045,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);

  /* ---- Interaction: mouse parallax ---- */
  let targetRotX = 0, targetRotY = 0;
  window.addEventListener('mousemove', (e) => {
    const nx = (e.clientX / window.innerWidth) * 2 - 1;
    const ny = (e.clientY / window.innerHeight) * 2 - 1;
    targetRotY = nx * 0.35;
    targetRotX = ny * 0.18;
  });

  /* ---- Resize handling ---- */
  function onResize(){
    width = heroSection.clientWidth;
    height = heroSection.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  }
  window.addEventListener('resize', onResize);

  /* ---- Load-in animation state ---- */
  let introT = 0;
  const introDuration = prefersReducedMotion ? 0.001 : 1.6; // seconds

  /* ---- Render loop ---- */
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; });

  function animate(){
    requestAnimationFrame(animate);
    if (!visible) return;

    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    if (prefersReducedMotion) {
      // Show the blade fully formed with only a gentle, non-distracting flicker.
      bladeGroup.scale.setScalar(1);
      bladeGroup.rotation.set(0, 0.25, bladeGroup.rotation.z);
      core.material.emissiveIntensity = 1.9;
    } else {
      // intro scale/rotate-in
      if (introT < introDuration) {
        introT += dt;
        const t = clamp(introT / introDuration, 0, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        bladeGroup.scale.setScalar(0.001 + eased * 0.999);
        bladeGroup.rotation.y = (1 - eased) * Math.PI * 1.4;
      } else {
        bladeGroup.rotation.y = lerp(bladeGroup.rotation.y, targetRotY + Math.sin(elapsed * 0.3) * 0.12, 0.04);
      }

      bladeGroup.rotation.x = lerp(bladeGroup.rotation.x, targetRotX, 0.04);
      bladeGroup.position.y = Math.sin(elapsed * 0.6) * 0.15;

      // flicker the emissive core / light for a living-flame feel
      const flicker = 1.8 + Math.sin(elapsed * 8) * 0.3 + Math.sin(elapsed * 17) * 0.15;
      core.material.emissiveIntensity = flicker;
      emberLight.intensity = 5 + Math.sin(elapsed * 6) * 1.2;

      // drift particles upward, wrap around
      const posAttr = particleGeo.attributes.position;
      for (let i = 0; i < PCOUNT; i++) {
        let y = posAttr.getY(i) + speeds[i];
        if (y > 4.2) y = -4.2;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
      particles.rotation.y += 0.0006;
    }

    renderer.render(scene, camera);
  }
  animate();
})();

/* ---------------- 7. Contact form (front-end only) ---------------- */
(function contactForm(){
  const form = document.getElementById('contact-form');
  const note = document.getElementById('form-note');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    // NOTE: This form has no backend. To receive real messages, connect it
    // to a service such as Formspree, Getform, or your own API endpoint.
    note.textContent = "Thanks — this demo form isn't connected to an inbox yet. Wire it up to Formspree or your backend to start receiving messages.";
    form.reset();
  });
})();
