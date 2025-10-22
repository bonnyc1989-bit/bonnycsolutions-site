// Year in footer
document.getElementById("year").textContent = new Date().getFullYear();

/* ===== HERO: reveal video when ready ===== */
const heroVideo = document.getElementById("heroVideo");
if (heroVideo) {
  const tryPlay = () => heroVideo.play().catch(() => {});
  heroVideo.muted = true;
  heroVideo.addEventListener("canplaythrough", () => {
    heroVideo.classList.add("ready");
    tryPlay();
  });
  window.addEventListener("load", tryPlay);
}

/* ===== BUDGET: count-up on hover (white digits) ===== */
(() => {
  const bubbles = document.querySelectorAll(".budget-bubble");
  if (!bubbles.length) return;

  const fmt = (n, suffix) => `$${n.toFixed(1)}${suffix}`;

  function animateCount(el, duration = 1200) {
    const target = parseFloat(el.dataset.target || "0");
    const suffix = el.dataset.suffix || "";
    const numEl  = el.querySelector(".budget-number");

    if (el._rafId) cancelAnimationFrame(el._rafId);

    let start = null;
    function step(ts) {
      if (!start) start = ts;
      const t = Math.min(1, (ts - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const val = target * eased;
      numEl.textContent = fmt(val, suffix);

      if (t < 1) {
        el._rafId = requestAnimationFrame(step);
      } else {
        numEl.textContent = fmt(target, suffix);
        el._rafId = null;
      }
    }
    el._rafId = requestAnimationFrame(step);
  }

  // initialize and wire hover
  bubbles.forEach((b) => {
    const n = b.querySelector(".budget-number");
    if (n) n.textContent = "$0";

    b.addEventListener("mouseenter", () => animateCount(b));
    b.addEventListener("mouseleave", () => {
      if (b._rafId) cancelAnimationFrame(b._rafId);
      const n2 = b.querySelector(".budget-number");
      if (n2) n2.textContent = "$0";
      b._rafId = null;
    });
  });
})();

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
