// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

/* ===== HERO: image first, then swap to video when ready ===== */
const heroVideo = document.getElementById("heroVideo");
if (heroVideo) {
  const tryPlay = () => heroVideo.play().catch(() => {});
  heroVideo.muted = true;
  heroVideo.addEventListener("canplaythrough", () => {
    heroVideo.classList.add("ready"); // fade in video over the poster image
    tryPlay();
  });
  // Attempt autoplay on load as well (mobile)
  window.addEventListener("load", tryPlay);
}

/* ===== BUDGET COUNTERS (count-up when visible) ===== */
const bubbles = document.querySelectorAll(".budget-bubble");
if (bubbles.length) {
  const format = (n, suffix) => `$${n.toFixed(1)}${suffix}`;
  const runCounter = (el) => {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const numEl = el.querySelector(".budget-number");
    let val = 0;
    const duration = 1200; // ms
    const start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / duration);
      val = target * (0.2 + 0.8 * p * p); // ease in
      if (p < 1) requestAnimationFrame(tick);
      numEl.textContent = format(Math.min(val, target), suffix);
    };
    requestAnimationFrame(tick);
  };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        runCounter(entry.target);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.35 });

  bubbles.forEach((b) => io.observe(b));
}

/* ===== CONTACT (Netlify form XHR to stay on page) ===== */
const form = document.querySelector('form[name="contact"]');
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(data).toString()
    })
      .then(() => {
        form.reset();
        const ok = form.querySelector(".form-success");
        if (ok) ok.hidden = false;
      })
      .catch((err) => alert("Submission failed. Please try again."));
  });
}
