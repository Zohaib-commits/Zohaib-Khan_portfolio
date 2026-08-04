/* ═══════════════════════════════════════════════════════════
   SCROLL DEMO — Lenis (smooth scroll) + GSAP ScrollTrigger
   Effects: momentum scroll, parallax, word reveal, pinned
   horizontal gallery, sticky split, count-up stats.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  gsap.registerPlugin(ScrollTrigger);

  // ── 1. Smooth momentum scrolling (Lenis) ──────────────────
  // Skipped entirely when the visitor prefers reduced motion.
  if (!reduceMotion) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // ── 2. Split the intro line into words for a scrubbed reveal
  const revealRoot = $(".reveal-words");
  const words = [];
  if (revealRoot) {
    (function wrap(node) {
      Array.from(node.childNodes).forEach((kid) => {
        if (kid.nodeType === 3) {
          const parts = kid.textContent.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach((p) => {
            if (p.trim() === "") {
              frag.appendChild(document.createTextNode(p));
            } else {
              const s = document.createElement("span");
              s.textContent = p;
              words.push(s);
              frag.appendChild(s);
            }
          });
          node.replaceChild(frag, kid);
        } else if (kid.nodeType === 1) {
          wrap(kid); // keep <b>/<span> styling, split their text too
        }
      });
    })(revealRoot);
  }

  // ── 3. Generic fade-up reveal (IntersectionObserver) ──────
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  $$(".fade-up").forEach((el) => io.observe(el));

  // ── 4. Count-up stats ─────────────────────────────────────
  const countIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const target = parseInt(el.dataset.count, 10);
        countIO.unobserve(el);
        if (reduceMotion) { el.textContent = String(target); return; }
        const dur = 1400, t0 = performance.now();
        (function tick(now) {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = String(Math.round(target * eased));
          if (p < 1) requestAnimationFrame(tick);
        })(t0);
      });
    },
    { threshold: 0.6 }
  );
  $$("[data-count]").forEach((el) => countIO.observe(el));

  // Total count in the gallery header
  const total = $$(".h-panel").length;
  const hTotalEl = $("#hTotal");
  if (hTotalEl) hTotalEl.textContent = String(total).padStart(2, "0");

  // Everything below is scrubbed motion — skip if reduced motion.
  if (reduceMotion) return;

  // ── 5. Top scroll-progress bar ────────────────────────────
  gsap.to("#progressBar", {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });

  // ── 6. Hero parallax + fade ───────────────────────────────
  $$("[data-parallax]").forEach((el) => {
    const depth = parseFloat(el.dataset.parallax) || 0.2;
    gsap.to(el, {
      yPercent: depth * 45, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
    });
  });
  gsap.to("[data-hero-el]", {
    yPercent: -24, opacity: 0, ease: "none", stagger: 0.03,
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
  });

  // ── 7. Intro word-by-word reveal ──────────────────────────
  if (words.length) {
    gsap.to(words, {
      opacity: 1, ease: "none", stagger: 0.4,
      scrollTrigger: { trigger: revealRoot, start: "top 78%", end: "top 32%", scrub: true },
    });
  }

  // ── 8. Sticky core rotate/scale ───────────────────────────
  gsap.to("#stickyCore", {
    scale: 1.55, rotate: 200, ease: "none",
    scrollTrigger: { trigger: ".sticky-sec", start: "top center", end: "bottom center", scrub: true },
  });

  // ── 9. Horizontal pinned gallery (desktop) / swipe (mobile)
  const mm = gsap.matchMedia();
  const track = $("#hTrack");
  const fill = $("#hFill");
  const current = $("#hCurrent");

  mm.add("(min-width: 821px)", () => {
    const distance = () => track.scrollWidth - window.innerWidth;
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ".h-section",
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          if (fill) fill.style.width = (self.progress * 100).toFixed(1) + "%";
          if (current) {
            const n = Math.min(total, Math.floor(self.progress * total) + 1);
            current.textContent = String(n).padStart(2, "0");
          }
        },
      },
    });
    return () => tween.scrollTrigger && tween.scrollTrigger.kill();
  });

  mm.add("(max-width: 820px)", () => {
    const vp = $(".h-viewport");
    vp.style.overflowX = "auto";
    vp.style.scrollSnapType = "x proximity";
    $$(".h-panel").forEach((p) => (p.style.scrollSnapAlign = "start"));
    return () => {
      vp.style.overflowX = "";
      vp.style.scrollSnapType = "";
    };
  });

  // ── Recalculate once fonts/layout settle ──────────────────
  window.addEventListener("load", () => ScrollTrigger.refresh());
  setTimeout(() => ScrollTrigger.refresh(), 600);
})();
