/* ═══════════════════════════════════════════════════════════
   "How I Work" section — scroll-driven orb (no libraries).
   The pinning is pure CSS (position: sticky). This just rotates
   and scales the core as the section moves through the viewport.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const core = document.getElementById("processCore");
  const section = document.getElementById("process");
  if (!core || !section) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  let ticking = false;

  function update() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Progress from 0 (section entering) to 1 (section leaving).
    const progress = (vh - rect.top) / (rect.height + vh);
    const p = Math.max(0, Math.min(1, progress));
    core.style.transform = "rotate(" + (p * 200).toFixed(1) + "deg) scale(" + (1 + p * 0.4).toFixed(3) + ")";
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
