/* ═══════════════════════════════════════════════════════════
   FEATURED PROJECTS — book page-turn (GSAP ScrollTrigger).
   Desktop only: the stage pins and each project leaf turns around
   the left spine, revealing the next page underneath, driven by
   scroll. Mobile and reduced-motion fall back to a static vertical
   stack (handled entirely in CSS; this script no-ops there).
   ═══════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

  const stage = document.getElementById("bookStage");
  const book = document.getElementById("book");
  if (!stage || !book) return;

  const pages = gsap.utils.toArray(".book-page");
  const fill = document.getElementById("bookFill");
  if (pages.length < 2) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);

  const mm = gsap.matchMedia();

  // Desktop: the cinematic pinned page-turn
  mm.add("(min-width: 821px) and (prefers-reduced-motion: no-preference)", () => {
    const n = pages.length;

    // Stack: first page on top, last at the bottom of the pile
    pages.forEach((p, i) => {
      gsap.set(p, { zIndex: n - i, rotateY: 0, transformOrigin: "left center" });
    });

    const tl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: stage,
        start: "top top",
        end: () => "+=" + window.innerHeight * (n - 1),
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => { if (fill) fill.style.width = (self.progress * 100).toFixed(1) + "%"; },
      },
    });

    // Each leaf (except the last) turns over its own 1-unit segment
    pages.forEach((page, i) => {
      if (i === n - 1) return;
      const shade = page.querySelector(".book-shade");
      const gloss = page.querySelector(".book-gloss");
      const nextBody = pages[i + 1].querySelector(".book-page-body");
      const seg = i; // position on the timeline

      // The physical turn: flat -> flipped around the spine
      tl.to(page, { rotateY: -180, ease: "power1.inOut", duration: 1 }, seg);

      // Soft cast shadow + light sweep peak mid-turn
      tl.to(shade, { opacity: 0.6, ease: "power1.in", duration: 0.5 }, seg)
        .to(shade, { opacity: 0, ease: "power1.out", duration: 0.5 }, seg + 0.5);
      tl.to(gloss, { opacity: 0.55, ease: "power1.in", duration: 0.5 }, seg)
        .to(gloss, { opacity: 0, ease: "power1.out", duration: 0.5 }, seg + 0.5);

      // Subtle parallax: the revealed page's content settles in
      if (nextBody) {
        tl.fromTo(
          nextBody,
          { xPercent: 6, opacity: 0.45 },
          { xPercent: 0, opacity: 1, ease: "power2.out", duration: 0.6 },
          seg + 0.4
        );
      }
    });

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
    setTimeout(refresh, 800);

    return () => {
      // matchMedia cleanup: reset any inline transforms
      pages.forEach((p) => gsap.set(p, { clearProps: "all" }));
      pages.forEach((p) => {
        const b = p.querySelector(".book-page-body");
        if (b) gsap.set(b, { clearProps: "all" });
      });
    };
  });
})();
