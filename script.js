// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

/* ===== HERO: playlist loop (4 videos) ===== */
(() => {
  const video = document.getElementById("heroVideo");
  if (!video) return;

  // ✅ Update with your actual filenames
  const PLAYLIST = [
    "images/hero/boots.mp4",
    "images/hero/b1.mp4",
    "images/hero/b2.mp4",
    "images/hero/b3.mp4"
  ];

  let idx = 0;
  let tryingToPlay = false;

  // Mobile autoplay requirements
  video.muted = true;
  video.setAttribute("playsinline", "");
  video.setAttribute("preload", "metadata");

  const setSource = (i) => {
    idx = (i + PLAYLIST.length) % PLAYLIST.length;
    video.src = PLAYLIST[idx];
    video.load();
  };

  const playSafely = () => {
    if (tryingToPlay) return;
    tryingToPlay = true;
    video.play().catch(() => {
      /* wait for user interaction */
    }).finally(() => {
      tryingToPlay = false;
    });
  };

  // Fade in when first frame is ready
  video.addEventListener("loadeddata", () => {
    video.classList.add("ready");
    playSafely();
  });

  // Advance playlist
  video.addEventListener("ended", () => {
    setSource(idx + 1);
    playSafely();
  });

  // Skip failed file
  video.addEventListener("error", () => {
    setSource(idx + 1);
    playSafely();
  });

  // Retry after user interaction
  const resume = () => playSafely();
  ["touchstart","click","keydown"].forEach(ev =>
    window.addEventListener(ev, resume, { once:true, passive:true })
  );

  // Some devices pause on tab change
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) playSafely();
  });

  // Go
  setSource(0);
})();

/* ===== BUDGET: animate on hover (numbers white) ===== */
(() => {
  const bubbles = document.querySelectorAll(".budget-bubble");
  if (!bubbles.length) return;

  function animateCount(el, duration = 1200) {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const numEl = el.querySelector(".num");

    const start = performance.now();
    function tick(now){
      const t = Math.min(1, (now - start) / duration);
      const val = target * t;
      numEl.textContent = val.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  // Start at final value (static). On hover animate 0 -> final once; on leave stay final.
  bubbles.forEach(b => {
    const target = parseFloat(b.dataset.target || "0");
    const numEl = b.querySelector(".num");
    numEl.textContent = target.toFixed(1);

    let ran = false;
    b.addEventListener("mouseenter", () => {
      if (ran) return;
      // reset to 0 visually and run animation
      b.querySelector(".num").textContent = "0.0";
      animateCount(b);
      ran = true;
    });
  });
})();
