/* ═══════════════════════════════════════════════════════════
   ZOHAIB KHAN — AI ENGINEER PORTFOLIO
   Core interactions. Scroll motion lives in motion.js.
   ═══════════════════════════════════════════════════════════ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── Navbar background on scroll ────────────────────────────
  const navbar = document.getElementById('navbar');
  if (navbar) {
    const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ── Mobile menu ────────────────────────────────────────────
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      navLinks.classList.toggle('open');
    });
    navLinks.querySelectorAll('.nav-link').forEach((link) =>
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
      })
    );
  }

  // ── Generic reveal-on-enter (baseline for simple elements) ─
  // Section-specific scroll choreography is handled in motion.js.
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('visible'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const siblings = Array.from(entry.target.parentElement.querySelectorAll(':scope > .reveal'));
          const idx = Math.max(0, siblings.indexOf(entry.target));
          entry.target.style.setProperty('--reveal-delay', (idx * 0.08) + 's');
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );
    revealEls.forEach((el) => revealObserver.observe(el));

    // Failsafe: guarantee above-the-fold content is shown even if the
    // observer never fires (e.g. background tab at load).
    const revealInView = () => {
      revealEls.forEach((el) => {
        if (el.getBoundingClientRect().top < window.innerHeight * 0.98) {
          el.classList.add('visible');
        }
      });
    };
    window.addEventListener('load', revealInView);
    setTimeout(revealInView, 1200);
  }

  // ── Stats count-up ─────────────────────────────────────────
  const statNumbers = document.querySelectorAll('.stat-number');
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

  function animateCounter(el) {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    const duration = 1600, start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = Math.round(easeOutQuart(p) * target) + suffix;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    })(start);
  }

  const statsSection = document.getElementById('stats');
  if (statsSection && statNumbers.length) {
    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          statNumbers.forEach(animateCounter);
          statsObserver.disconnect();
        });
      },
      { threshold: 0.5 }
    );
    statsObserver.observe(statsSection);
  }

  // ── Contact form (mailto) ──────────────────────────────────
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    const nameInput    = document.getElementById('contactName');
    const emailInput   = document.getElementById('contactEmail');
    const reasonInput  = document.getElementById('contactReason');
    const messageInput = document.getElementById('contactMessage');
    const submitBtn    = document.getElementById('submitBtn');

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    const shakeField = (el) => { el.classList.add('error'); setTimeout(() => el.classList.remove('error'), 600); };

    function setLoading(loading) {
      submitBtn.innerHTML = loading
        ? '<i data-lucide="loader-2"></i> Sending...'
        : '<i data-lucide="send"></i> Send Message';
      submitBtn.disabled = loading;
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = nameInput.value.trim();
      const email = emailInput.value.trim();
      const reason = reasonInput.value;
      const message = messageInput.value.trim();

      let valid = true;
      if (!name) { shakeField(nameInput); valid = false; }
      if (!validateEmail(email)) { shakeField(emailInput); valid = false; }
      if (!reason) { shakeField(reasonInput); valid = false; }
      if (!message) { shakeField(messageInput); valid = false; }
      if (!valid) return;

      setLoading(true);
      const subject = encodeURIComponent(`[Portfolio] ${reason}, from ${name}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nReason: ${reason}\n\nMessage:\n${message}`);
      const mailtoLink = `mailto:developwithzohaib@gmail.com?subject=${subject}&body=${body}`;
      setTimeout(() => {
        window.location.href = mailtoLink;
        setLoading(false);
        contactForm.reset();
      }, 700);
    });

    [nameInput, emailInput, reasonInput, messageInput].forEach((input) => {
      if (input) input.addEventListener('input', () => input.classList.remove('error'));
    });
  }

  // ── Scroll-spy: active section in nav ──────────────────────
  const sections = document.querySelectorAll('section[id]');
  const pillLinks = document.querySelectorAll('.pill-link');
  const navAnchors = document.querySelectorAll('.nav-link');

  function updateActiveNav() {
    let currentSection = '';
    sections.forEach((section) => {
      if (window.scrollY >= section.offsetTop - 160) currentSection = section.id;
    });
    navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + currentSection));
    pillLinks.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + currentSection));
  }
  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  // ── Profile image fallback ─────────────────────────────────
  const profileImg = document.getElementById('profile-img');
  if (profileImg) {
    profileImg.addEventListener('error', function () {
      this.src = 'https://avatars.githubusercontent.com/u/230161691?v=4';
    });
  }

  // ── Icons ──────────────────────────────────────────────────
  if (typeof lucide !== 'undefined') lucide.createIcons();
});
