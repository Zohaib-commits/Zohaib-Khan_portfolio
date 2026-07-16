/* ═══════════════════════════════════════════════════════════
   ZOHAIB KHAN — AI ENGINEER PORTFOLIO
   JavaScript — Interactive Features
   ═══════════════════════════════════════════════════════════ */

'use strict';

// ─── Wait for DOM ────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // ══════════════════════════════════════════════════════════
  // 1. HERO BACKGROUND — real 3D scene (WebGL) with 2D fallback
  // ══════════════════════════════════════════════════════════
  const heroCanvas    = document.getElementById('heroCanvas');
  const hero3dMount    = document.getElementById('hero3d');
  const heroSectionEl  = document.getElementById('hero');

  function supportsWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmallScreen = window.innerWidth < 768;
  const use3DHero = !prefersReducedMotion && !isSmallScreen && hero3dMount &&
                     typeof THREE !== 'undefined' && supportsWebGL();

  if (use3DHero) {
    if (heroCanvas) heroCanvas.style.display = 'none';
    initHero3DScene(hero3dMount, heroSectionEl);
  } else if (heroCanvas) {
    initHeroParticles2D(heroCanvas);
  }

  function initHero3DScene(container, heroSection) {
    const width  = container.clientWidth  || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene  = new THREE.Scene();
    // Fog matches the page background exactly, so distant nodes/lines fade
    // into it instead of everything reading at the same flat brightness.
    scene.fog = new THREE.Fog(0x0f1115, 7, 13);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0, 9);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Soft round glow sprite (radial gradient baked into a canvas texture)
    // used for every node/pulse instead of hard-edged geometric spheres,
    // which is what actually reads as "glowing light" rather than a flat
    // vector diagram.
    function makeGlowTexture() {
      const size = 128;
      const c = document.createElement('canvas');
      c.width = c.height = size;
      const ctx = c.getContext('2d');
      const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, size, size);
      return new THREE.CanvasTexture(c);
    }
    const glowTex = makeGlowTexture();

    // Signature shape: a layered neural network (input -> hidden -> hidden
    // -> output, like an actual NN diagram), biased toward the photo side
    // so it doesn't sit on top of the headline, with signal pulses
    // continuously traveling along the connections as the automation
    // motif. Rendered as soft glow sprites with real fog depth instead of
    // hard flat circles, so it reads as atmosphere, not a clip-art diagram.
    const group = new THREE.Group();
    scene.add(group);

    const LAYER_SIZES = [4, 6, 5, 3];
    const LAYER_X = [-1.4, 0.3, 2.0, 3.5];
    // Dim + small near the text, brighter + larger near the photo.
    const LAYER_STYLE = [
      { size: 0.16, opacity: 0.22, color: 0x3a72b0 },
      { size: 0.20, opacity: 0.40, color: 0x4aa3ff },
      { size: 0.26, opacity: 0.60, color: 0x4aa3ff },
      { size: 0.32, opacity: 0.85, color: 0x8ccbff },
    ];
    const GAP_OPACITY = [0.045, 0.08, 0.12];

    const nodePositions = [];
    const layerNodeIndices = [];

    LAYER_SIZES.forEach((count, layerIdx) => {
      const indices = [];
      const span = 1.5;
      for (let i = 0; i < count; i++) {
        const y = count > 1 ? (i - (count - 1) / 2) * (span / (count - 1)) : 0;
        const x = LAYER_X[layerIdx] + (Math.random() - 0.5) * 0.22;
        const z = (Math.random() - 0.5) * 2.2;
        indices.push(nodePositions.length);
        nodePositions.push(new THREE.Vector3(x, y + (Math.random() - 0.5) * 0.15, z));
      }
      layerNodeIndices.push(indices);
    });

    // Sparse layer-to-layer connections (1-2 each) so the network stays
    // legible instead of turning into a dense mesh of lines.
    const edges = [];
    const edgesByGap = [];
    for (let l = 0; l < LAYER_SIZES.length - 1; l++) {
      const gapEdges = [];
      layerNodeIndices[l].forEach(aIdx => {
        const targets = [...layerNodeIndices[l + 1]].sort(() => Math.random() - 0.5);
        const connCount = Math.min(1 + Math.floor(Math.random() * 2), targets.length);
        targets.slice(0, connCount).forEach(bIdx => {
          gapEdges.push([aIdx, bIdx]);
          edges.push([aIdx, bIdx]);
        });
      });
      edgesByGap.push(gapEdges);
    }

    edgesByGap.forEach((gapEdges, gapIdx) => {
      const positions = new Float32Array(gapEdges.length * 6);
      gapEdges.forEach(([a, b], i) => {
        const pa = nodePositions[a], pb = nodePositions[b];
        positions.set([pa.x, pa.y, pa.z, pb.x, pb.y, pb.z], i * 6);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.LineBasicMaterial({ color: 0x4aa3ff, transparent: true, opacity: GAP_OPACITY[gapIdx] });
      group.add(new THREE.LineSegments(geo, mat));
    });

    layerNodeIndices.forEach((indices, layerIdx) => {
      const positions = new Float32Array(indices.length * 3);
      indices.forEach((nodeIdx, j) => {
        const p = nodePositions[nodeIdx];
        positions.set([p.x, p.y, p.z], j * 3);
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const style = LAYER_STYLE[layerIdx];
      const mat = new THREE.PointsMaterial({
        map: glowTex,
        color: style.color,
        size: style.size,
        transparent: true,
        opacity: style.opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      group.add(new THREE.Points(geo, mat));
    });

    // Small bright glow sprites that continuously travel along random
    // connections, like signals/data moving through the system.
    const PULSE_COUNT = 8;
    const pulses = [];
    for (let i = 0; i < PULSE_COUNT; i++) {
      const mat = new THREE.SpriteMaterial({
        map: glowTex,
        color: 0xe8f3ff,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(mat);
      sprite.scale.set(0.22, 0.22, 1);
      group.add(sprite);
      pulses.push({
        sprite,
        edge: edges[Math.floor(Math.random() * edges.length)],
        t: Math.random(),
        speed: 0.22 + Math.random() * 0.18,
      });
    }

    // Sparse, static starfield further back for depth parallax as the
    // camera drifts with the mouse. Independent of the network's motion.
    const STAR_COUNT = 70;
    const starPositions = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      const r = 7 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      starPositions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPositions[i * 3 + 2] = -Math.abs(r * Math.cos(phi)) - 4;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    const starMat = new THREE.PointsMaterial({
      map: glowTex,
      color: 0x8ccbff,
      size: 0.09,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
      sizeAttenuation: true,
    });
    scene.add(new THREE.Points(starGeo, starMat));

    // Mouse-driven camera parallax (subtle)
    let mouseNX = 0, mouseNY = 0;
    heroSection.addEventListener('mousemove', (e) => {
      const rect = heroSection.getBoundingClientRect();
      mouseNX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseNY = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    });

    function onResize() {
      const w = container.clientWidth  || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', onResize);

    // Pause rendering when the hero is off-screen or the tab is hidden
    let isVisible = true;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { isVisible = entry.isIntersecting; });
    }, { threshold: 0.05 });
    io.observe(heroSection);

    const clock = new THREE.Clock();
    let camX = 0, camY = 0;

    function animate() {
      requestAnimationFrame(animate);
      if (!isVisible || document.hidden) return;

      const dt = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Gentle sway rather than a full spin, so the input->output
      // structure stays readable instead of tumbling out of view.
      group.rotation.y = Math.sin(elapsed * 0.15) * 0.2;
      group.rotation.x = Math.cos(elapsed * 0.1) * 0.06;

      pulses.forEach(p => {
        p.t += dt * p.speed;
        if (p.t >= 1) {
          p.t = 0;
          p.edge = edges[Math.floor(Math.random() * edges.length)];
        }
        const a = nodePositions[p.edge[0]];
        const b = nodePositions[p.edge[1]];
        p.sprite.position.lerpVectors(a, b, p.t);
      });

      camX += (mouseNX * 1.2 - camX) * 0.04;
      camY += (-mouseNY * 0.8 - camY) * 0.04;
      camera.position.x = camX;
      camera.position.y = camY;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    animate();
  }

  function initHeroParticles2D(heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let width, height;
    let mouseX = -9999, mouseY = -9999;
    const PARTICLE_COUNT = 80;
    const CONNECTION_DIST = 140;
    const REPEL_DIST      = 100;
    const REPEL_FORCE     = 2.5;

    const COLORS = ['#4aa3ff', '#8ccbff', '#2f74b8', '#4aa3ff', '#8ccbff'];

    function resize() {
      width  = heroCanvas.offsetWidth;
      height = heroCanvas.offsetHeight;
      heroCanvas.width  = width;
      heroCanvas.height = height;
    }
    resize();
    window.addEventListener('resize', resize);

    heroCanvas.addEventListener('mousemove', e => {
      const rect = heroCanvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    heroCanvas.addEventListener('mouseleave', () => { mouseX = -9999; mouseY = -9999; });

    // Create particles
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x:   Math.random() * (window.innerWidth),
      y:   Math.random() * (window.innerHeight),
      vx:  (Math.random() - 0.5) * 0.5,
      vy:  (Math.random() - 0.5) * 0.5,
      r:   Math.random() * 2 + 1,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      alpha: Math.random() * 0.5 + 0.3,
    }));

    function drawParticles() {
      ctx.clearRect(0, 0, width, height);

      // Update & draw particles
      particles.forEach(p => {
        // Repel from mouse
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_DIST && dist > 0) {
          const force = (REPEL_DIST - dist) / REPEL_DIST * REPEL_FORCE;
          p.vx += (dx / dist) * force * 0.05;
          p.vy += (dy / dist) * force * 0.05;
        }

        // Damping
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Max speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 1.5) {
          p.vx = (p.vx / speed) * 1.5;
          p.vy = (p.vy / speed) * 1.5;
        }

        p.x += p.vx;
        p.y += p.vy;

        // Wrap around
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Draw dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i];
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.25;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);

            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
            grad.addColorStop(0, a.color);
            grad.addColorStop(1, b.color);
            ctx.strokeStyle = grad;
            ctx.lineWidth = 0.8;
            ctx.globalAlpha = alpha;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }

      requestAnimationFrame(drawParticles);
    }

    drawParticles();
  }

  // ══════════════════════════════════════════════════════════
  // 2. NAVBAR SCROLL EFFECT
  // ══════════════════════════════════════════════════════════
  const navbar = document.getElementById('navbar');
  if (navbar) {
    function handleNavbarScroll() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();
  }

  // ══════════════════════════════════════════════════════════
  // 3. HAMBURGER MENU
  // ══════════════════════════════════════════════════════════
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on link click
    navLinks.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      });
    });
  }

  // ══════════════════════════════════════════════════════════
  // 4. SMOOTH SCROLL
  // ══════════════════════════════════════════════════════════
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const targetId  = link.getAttribute('href');
      const targetEl  = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const offset = 80;
        const top = targetEl.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  // ══════════════════════════════════════════════════════════
  // 5. SECTION REVEAL (IntersectionObserver)
  // ══════════════════════════════════════════════════════════
  const revealEls = document.querySelectorAll('.reveal');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        // Stagger sibling reveals
        const siblings = Array.from(entry.target.parentElement.querySelectorAll('.reveal'));
        const idx = siblings.indexOf(entry.target);
        const delay = idx * 0.1;
        entry.target.style.setProperty('--delay', delay + 's');
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealEls.forEach(el => revealObserver.observe(el));

  // ══════════════════════════════════════════════════════════
  // 6. STATS COUNTER ANIMATION
  // ══════════════════════════════════════════════════════════
  const statNumbers = document.querySelectorAll('.stat-number');

  function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
  }

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const duration = 1800;
    const start = performance.now();

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutQuart(progress);
      const current = Math.round(eased * target);
      el.textContent = current + suffix;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = target + suffix;
      }
    }

    requestAnimationFrame(step);
  }

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        statNumbers.forEach(animateCounter);
        statsObserver.disconnect();
      }
    });
  }, { threshold: 0.5 });

  const statsSection = document.getElementById('stats');
  if (statsSection) statsObserver.observe(statsSection);

  // ══════════════════════════════════════════════════════════
  // 7. 3D CARD TILT
  // ══════════════════════════════════════════════════════════
  const tiltCards = document.querySelectorAll('[data-tilt]');

  tiltCards.forEach(card => {
    let bounds;
    const shimmer = card.querySelector('.card-shimmer');
    const glare   = card.querySelector('.card-glare');

    function getRelativePos(e) {
      bounds = card.getBoundingClientRect();
      const x = e.clientX - bounds.left;
      const y = e.clientY - bounds.top;
      const cx = bounds.width  / 2;
      const cy = bounds.height / 2;
      const nx = (x - cx) / cx;  // -1 to 1
      const ny = (y - cy) / cy;  // -1 to 1
      return { x, y, nx, ny };
    }

    card.addEventListener('mousemove', e => {
      const { nx, ny, x, y } = getRelativePos(e);
      const rotateX = -ny * 10;
      const rotateY =  nx * 10;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`;
      card.style.transition = 'transform 0.1s ease, box-shadow 0.3s ease, border-color 0.3s ease';

      // Move shimmer with cursor
      if (shimmer) {
        const px = (x / bounds.width)  * 100;
        const py = (y / bounds.height) * 100;
        shimmer.style.background = `conic-gradient(from 0deg at ${px}% ${py}%, rgba(74,163,255,0) 0deg, rgba(74,163,255,0.09) 90deg, rgba(74,163,255,0) 180deg, rgba(74,163,255,0.09) 270deg, rgba(74,163,255,0) 360deg)`;
      }

      // Glossy reflection layer follows the cursor for a real "glass" feel
      if (glare) {
        const px = (x / bounds.width)  * 100;
        const py = (y / bounds.height) * 100;
        glare.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(140,203,255,0.3), transparent 55%)`;
      }
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)';
      card.style.transition = 'transform 0.5s ease, box-shadow 0.3s ease, border-color 0.3s ease';
      if (shimmer) {
        shimmer.style.background = '';
      }
      if (glare) {
        glare.style.background = '';
      }
    });
  });

  // ══════════════════════════════════════════════════════════
  // 8. PROFILE IMAGE — 3D depth tilt (rings + photo separate by real Z-depth)
  // ══════════════════════════════════════════════════════════
  const imageFrame    = document.querySelector('.image-frame');
  const heroImageWrap = document.querySelector('.hero-image');

  if (imageFrame && heroImageWrap) {
    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0, currentRotY = 0;

    heroImageWrap.addEventListener('mousemove', (e) => {
      const rect = heroImageWrap.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width  - 0.5;
      const py = (e.clientY - rect.top)  / rect.height - 0.5;
      targetRotY = px * 18;
      targetRotX = -py * 18;
    });

    heroImageWrap.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
    });

    (function animateFrameTilt() {
      currentRotX += (targetRotX - currentRotX) * 0.08;
      currentRotY += (targetRotY - currentRotY) * 0.08;
      imageFrame.style.transform = `rotateX(${currentRotX}deg) rotateY(${currentRotY}deg)`;
      requestAnimationFrame(animateFrameTilt);
    })();
  }

  // ══════════════════════════════════════════════════════════
  // 9. MAGNETIC BUTTONS
  // ══════════════════════════════════════════════════════════
  const magneticBtns = document.querySelectorAll('.magnetic-btn');

  magneticBtns.forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) * 0.35;
      const dy = (e.clientY - cy) * 0.35;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
      btn.style.transition = 'transform 0.1s ease';
    });

    btn.addEventListener('mouseleave', () => {
      btn.style.transform = 'translate(0, 0)';
      btn.style.transition = 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    });
  });

  // ══════════════════════════════════════════════════════════
  // 10. TESTIMONIALS CAROUSEL
  // ══════════════════════════════════════════════════════════
  const track    = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  const prevBtn  = document.getElementById('prevBtn');
  const nextBtn  = document.getElementById('nextBtn');

  if (track && dotsWrap && prevBtn && nextBtn) {
    const cards = track.querySelectorAll('.testimonial-card');
    const total = cards.length;
    let current = 0;
    let autoTimer;

    // How many visible at once
    function getVisible() {
      const w = window.innerWidth;
      if (w < 768) return 1;
      if (w < 1024) return 2;
      return 3;
    }

    // Create dots
    function buildDots() {
      dotsWrap.innerHTML = '';
      const pages = Math.ceil(total / getVisible());
      for (let i = 0; i < pages; i++) {
        const dot = document.createElement('div');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('role', 'button');
        dot.setAttribute('tabindex', '0');
        dot.setAttribute('aria-label', `Go to testimonial page ${i + 1}`);
        dot.addEventListener('click', () => goTo(i));
        dot.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            goTo(i);
          }
        });
        dotsWrap.appendChild(dot);
      }
    }
    buildDots();
    window.addEventListener('resize', buildDots);

    function updateDots() {
      const dots = dotsWrap.querySelectorAll('.carousel-dot');
      dots.forEach((d, i) => d.classList.toggle('active', i === current));
    }

    function goTo(index) {
      const pages = Math.ceil(total / getVisible());
      current = (index + pages) % pages;

      const visible = getVisible();
      const cardWidth = track.parentElement.offsetWidth;
      const gap = 24;

      // Each card takes (cardWidth - gap*(visible-1)) / visible + gap
      const slideWidth = (cardWidth + gap) / visible;
      track.style.transform = `translateX(-${current * visible * slideWidth}px)`;
      track.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
      updateDots();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);

    function startAuto() {
      autoTimer = setInterval(next, 4000);
    }

    function stopAuto() {
      clearInterval(autoTimer);
    }

    startAuto();
    track.addEventListener('mouseenter', stopAuto);
    track.addEventListener('mouseleave', startAuto);

    // Touch / swipe
    let touchStartX = 0;
    track.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      stopAuto();
    }, { passive: true });

    track.addEventListener('touchend', e => {
      const diff = touchStartX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        diff > 0 ? next() : prev();
      }
      startAuto();
    });
  }

  // ══════════════════════════════════════════════════════════
  // 11. CONTACT FORM (mailto)
  // ══════════════════════════════════════════════════════════
  const contactForm = document.getElementById('contactForm');

  if (contactForm) {
    const nameInput    = document.getElementById('contactName');
    const emailInput   = document.getElementById('contactEmail');
    const reasonInput  = document.getElementById('contactReason');
    const messageInput = document.getElementById('contactMessage');
    const submitBtn    = document.getElementById('submitBtn');

    function validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function shakeField(el) {
      el.classList.add('error');
      setTimeout(() => el.classList.remove('error'), 600);
    }

    function setLoading(loading) {
      if (loading) {
        submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Sending...';
        submitBtn.disabled = true;
        lucide.createIcons();
      } else {
        submitBtn.innerHTML = '<i data-lucide="send"></i> Send Message';
        submitBtn.disabled = false;
        lucide.createIcons();
      }
    }

    contactForm.addEventListener('submit', e => {
      e.preventDefault();

      const name    = nameInput.value.trim();
      const email   = emailInput.value.trim();
      const reason  = reasonInput.value;
      const message = messageInput.value.trim();

      let valid = true;

      if (!name) { shakeField(nameInput);    valid = false; }
      if (!validateEmail(email)) { shakeField(emailInput);   valid = false; }
      if (!reason) { shakeField(reasonInput);  valid = false; }
      if (!message) { shakeField(messageInput); valid = false; }

      if (!valid) return;

      setLoading(true);

      const subject = encodeURIComponent(`[Portfolio] ${reason}, from ${name}`);
      const body    = encodeURIComponent(
        `Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\nMessage:\n${message}`
      );

      const mailtoLink = `mailto:developwithzohaib@gmail.com?subject=${subject}&body=${body}`;

      setTimeout(() => {
        window.location.href = mailtoLink;
        setLoading(false);
        contactForm.reset();
      }, 800);
    });

    // Remove error class on input
    [nameInput, emailInput, reasonInput, messageInput].forEach(input => {
      if (input) {
        input.addEventListener('input', () => input.classList.remove('error'));
      }
    });
  }

  // ══════════════════════════════════════════════════════════
  // 12. ACTIVE NAV LINK (scroll spy)
  // ══════════════════════════════════════════════════════════
  const sections  = document.querySelectorAll('section[id]');
  const pillLinks = document.querySelectorAll('.pill-link');
  const navAnchors = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    let currentSection = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 150;
      if (window.scrollY >= sectionTop) {
        currentSection = section.id;
      }
    });

    navAnchors.forEach(a => {
      a.style.color = '';
      a.style.background = '';
      if (a.getAttribute('href') === '#' + currentSection) {
        a.style.color = 'var(--accent)';
        a.style.background = 'var(--accent-dim)';
      }
    });

    pillLinks.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === '#' + currentSection) {
        a.classList.add('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ══════════════════════════════════════════════════════════
  // 13. PROFILE IMAGE FALLBACK
  // ══════════════════════════════════════════════════════════
  const profileImg = document.getElementById('profile-img');
  if (profileImg) {
    profileImg.addEventListener('error', function () {
      this.src = 'https://avatars.githubusercontent.com/u/230161691?v=4';
    });
  }

  // ══════════════════════════════════════════════════════════
  // 14. LUCIDE ICONS INIT
  // ══════════════════════════════════════════════════════════
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

}); // end DOMContentLoaded
