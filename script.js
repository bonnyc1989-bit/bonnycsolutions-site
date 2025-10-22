// === HERO VIDEO HANDLER ===
// Ensures autoplay works smoothly on mobile and desktop
document.addEventListener("DOMContentLoaded", () => {
  const vid = document.getElementById("videoA");
  if (vid) {
    vid.play().catch(() => {
      // If autoplay is blocked, unmute workaround
      vid.muted = true;
      vid.play().catch(() => {});
    });
  }
});

// === SEALS AUTO-SCROLL ===
// Continuously scroll the seals row right→left in an infinite loop
const sealRow = document.querySelector(".seal-row");
let scrollPos = 0;
function animateSeals() {
  if (!sealRow) return;
  scrollPos -= 0.5; // speed of scroll
  sealRow.style.transform = `translateX(${scrollPos}px)`;
  if (Math.abs(scrollPos) >= sealRow.scrollWidth / 2) {
    scrollPos = 0;
  }
  requestAnimationFrame(animateSeals);
}
if (sealRow) animateSeals();

// Pause scroll on hover
const sealTrack = document.querySelector(".seal-track");
if (sealTrack) {
  sealTrack.addEventListener("mouseenter", () => cancelAnimationFrame(animateSeals));
  sealTrack.addEventListener("mouseleave", () => animateSeals());
}

// === BUDGET COUNTER ANIMATION ===
const counters = document.querySelectorAll(".budget-bubble");
let budgetAnimated = false;

function animateCounters() {
  if (budgetAnimated) return;
  const triggerPoint = window.innerHeight * 0.8;
  counters.forEach((bubble) => {
    const rect = bubble.getBoundingClientRect();
    if (rect.top < triggerPoint) {
      const target = parseFloat(bubble.getAttribute("data-target"));
      const suffix = bubble.getAttribute("data-suffix") || "";
      const span = bubble.querySelector("span");
      let count = 0;
      const speed = target / 200; // adjust speed here
      const update = () => {
        count += speed;
        if (count >= target) {
          count = target;
          budgetAnimated = true;
        } else {
          requestAnimationFrame(update);
        }
        span.textContent = `$${count.toFixed(1)}${suffix}`;
      };
      update();
    }
  });
}
window.addEventListener("scroll", animateCounters);

// === FADE-IN ON SCROLL ===
const fadeEls = document.querySelectorAll(".section");
function fadeOnScroll() {
  fadeEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.style.transition = "opacity 1s ease, transform 1s ease";
    }
  });
}
window.addEventListener("scroll", fadeOnScroll);
window.addEventListener("load", fadeOnScroll);

// === NETLIFY FORM SUCCESS ===
const form = document.querySelector('form[name="contact"]');
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(formData).toString(),
    })
      .then(() => {
        form.querySelector(".form-success").hidden = false;
        form.reset();
      })
      .catch((error) => alert(error));
  });
}

// === FOOTER YEAR AUTO ===
const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();
