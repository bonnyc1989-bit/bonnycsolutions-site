// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

/* ===== HERO: swap to video when ready (image poster first) ===== */
const heroVideo = document.getElementById("heroVideo");
if (heroVideo) {
  const tryPlay = () => heroVideo.play().catch(() => {});
  heroVideo.muted = true;
  heroVideo.addEventListener("canplaythrough", () => {
    heroVideo.classList.add("ready");   // fade in over the image
    tryPlay();
  });
  window.addEventListener("load", tryPlay);
}

/* ===== BUDGET: count-up when visible ===== */
const bubbles = document.querySelectorAll(".budget-bubble");
if (bubbles.length) {
  const format = (n, suffix) => `$${n.toFixed(1)}${suffix}`;

  const runCounter = (el) => {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const numEl = el.querySelector(".budget-number");
    let start = null;

    function step(ts) {
      if (!start) start = ts;
      const p = Math.min(1, (ts - start) / 1200);        // 1.2s
      const eased = 0.2 + 0.8 * p * p;                   // ease-in
      const val = Math.min(target * eased, target);
      numEl.textContent = format(val, suffix);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        runCounter(e.target);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.35 });

  bubbles.forEach(b => io.observe(b));
}

/* ===== CONTACT: Netlify XHR (stay on page) ===== */
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
    .catch(() => alert("Submission failed. Please try again."));
  });
}
