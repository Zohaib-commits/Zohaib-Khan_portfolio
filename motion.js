/* ═══════════════════════════════════════════════════════════
   MOTION LAYER
   Smooth scroll (Lenis) + scroll-driven section choreography
   (GSAP ScrollTrigger). One easing family, purposeful motion,
   fully gated for prefers-reduced-motion.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined";
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ── Smooth scroll (Lenis) ──────────────────────────────────
  let lenis = null;
  if (!reduce && typeof Lenis !== "undefined") {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    if (hasGsap) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // ── Anchor navigation (through Lenis when present) ─────────
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (e) => {
      const id = link.getAttribute("href");
      if (!id || id === "#") return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -78, duration: 1.1 });
      else {
        const top = target.getBoundingClientRect().top + window.scrollY - 78;
        window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
      }
    });
  });

  if (reduce || !hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // ── HERO — scroll-exit compression + scroll cue fade ───────
  const heroContainer = $(".hero-container");
  if (heroContainer) {
    gsap.to(heroContainer, {
      yPercent: -6,
      opacity: 0.25,
      scale: 0.985,
      ease: "none",
      scrollTrigger: { trigger: ".hero-section", start: "top top", end: "bottom top", scrub: true },
    });
  }
  const cue = $(".hero-scroll-hint");
  if (cue) {
    gsap.to(cue, {
      opacity: 0,
      ease: "none",
      scrollTrigger: { trigger: ".hero-section", start: "top top", end: "35% top", scrub: true },
    });
  }

  // ── SKILLS — one capability emphasised at a time ───────────
  const skillsGrid = $(".skills-grid");
  const tiles = $$(".skill-tile");
  if (skillsGrid && tiles.length) {
    skillsGrid.classList.add("dimmed");
    tiles.forEach((tile) => {
      ScrollTrigger.create({
        trigger: tile,
        start: "top 62%",
        end: "bottom 42%",
        onToggle: (self) => tile.classList.toggle("is-active", self.isActive),
      });
    });
  }

  // ── PROJECTS — sticky rail tracks the active case study ────
  const casesWrap = $(".cases");
  const cases = $$(".case");
  if (casesWrap && cases.length) {
    casesWrap.classList.add("dimmed");
    const curEl = $("#caseCurrent");
    const catEl = $("#caseCat");
    const fillEl = $("#caseFill");
    const total = cases.length;
    cases.forEach((c, i) => {
      ScrollTrigger.create({
        trigger: c,
        start: "top 58%",
        end: "bottom 42%",
        onToggle: (self) => {
          if (!self.isActive) return;
          cases.forEach((x) => x.classList.remove("is-active"));
          c.classList.add("is-active");
          if (curEl) curEl.textContent = String(i + 1).padStart(2, "0");
          if (catEl) catEl.innerHTML = c.dataset.cat || "";
          if (fillEl) fillEl.style.width = (((i + 1) / total) * 100).toFixed(1) + "%";
        },
      });
    });
    // Default the first case to active so nothing reads as all-dimmed
    cases[0].classList.add("is-active");
    if (curEl) curEl.textContent = "01";
    if (catEl) catEl.innerHTML = cases[0].dataset.cat || "";
    if (fillEl) fillEl.style.width = ((1 / total) * 100).toFixed(1) + "%";
  }

  // ── TESTIMONIALS — sequential editorial reveal ─────────────
  const quotes = $$(".testimonial-card");
  if (quotes.length) {
    quotes.forEach((q) => {
      gsap.set(q, { opacity: 0, y: 34 });
      ScrollTrigger.create({
        trigger: q,
        start: "top 82%",
        once: true,
        onEnter: () => gsap.to(q, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }),
      });
    });
  }

  // ── Recalculate after fonts / layout settle ────────────────
  window.addEventListener("load", () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 700);
})();
