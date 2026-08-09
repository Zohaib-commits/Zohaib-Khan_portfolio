/* ═══════════════════════════════════════════════════════════
   SKILLS & EXPERTISE — scroll-triggered accent-bar reveal.
   Plain IntersectionObserver, no libraries. The CSS holds all
   the motion; this just toggles classes.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const grid = document.querySelector(".skills-grid");
  if (!grid) return;
  const tiles = grid.querySelectorAll(".skill-tile");
  if (!tiles.length) return;

  // Enable the hidden initial state only now that JS is running, so the
  // content is never stuck hidden if this script fails to load.
  grid.classList.add("sk-ready");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    tiles.forEach((tile) => tile.classList.add("sk-in"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (!entry.isIntersecting) return;
        // Slight stagger so cards entering together don't fire at once
        setTimeout(() => entry.target.classList.add("sk-in"), i * 90);
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.18 }
  );

  tiles.forEach((tile) => observer.observe(tile));
})();
