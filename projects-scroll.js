/* ═══════════════════════════════════════════════════════════
   PROJECTS — pinned horizontal scroll gallery (GSAP ScrollTrigger).
   Desktop: the section pins and cards slide sideways as you scroll.
   Mobile / reduced motion: native horizontal swipe with the same
   progress bar and counter.
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const track = document.getElementById("hpTrack");
  const section = document.getElementById("projects");
  if (!track || !section) return;

  gsap.registerPlugin(ScrollTrigger);

  const cards = track.querySelectorAll(".project-card");
  const total = cards.length;
  const totalEl = document.getElementById("hpTotal");
  const curEl = document.getElementById("hpCurrent");
  const fill = document.getElementById("hpFill");
  const viewport = section.querySelector(".hp-viewport");
  const pad = (n) => String(n).padStart(2, "0");

  if (totalEl) totalEl.textContent = pad(total);

  function setProgress(p) {
    if (fill) fill.style.width = (p * 100).toFixed(1) + "%";
    if (curEl) curEl.textContent = pad(Math.min(total, Math.floor(p * total) + 1));
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Native horizontal swipe (mobile + reduced motion)
  function enableSwipe() {
    viewport.style.overflowX = "auto";
    viewport.style.scrollSnapType = "x proximity";
    cards.forEach((c) => (c.style.scrollSnapAlign = "start"));
    const onScroll = () => {
      const max = track.scrollWidth - viewport.clientWidth;
      setProgress(max > 0 ? viewport.scrollLeft / max : 0);
    };
    viewport.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      viewport.style.overflowX = "";
      viewport.style.scrollSnapType = "";
      viewport.removeEventListener("scroll", onScroll);
    };
  }

  if (reduce) {
    enableSwipe();
    return;
  }

  const mm = gsap.matchMedia();

  // Desktop: pin the section and translate the track horizontally
  mm.add("(min-width: 821px)", () => {
    const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
    const tween = gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => setProgress(self.progress),
      },
    });
    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill();
      tween.kill();
      gsap.set(track, { x: 0 });
    };
  });

  // Mobile: native swipe
  mm.add("(max-width: 820px)", () => enableSwipe());

  // Recalculate pin positions after everything that shifts layout settles.
  // Web fonts loading late is the usual cause of stale pin offsets, which
  // makes the pinned section engage at the wrong scroll position.
  const refresh = () => ScrollTrigger.refresh();
  window.addEventListener("load", refresh);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  setTimeout(refresh, 600);
  setTimeout(refresh, 1600);
})();
