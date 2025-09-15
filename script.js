// -------------------------------
// Utilities
// -------------------------------
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

// Smooth scroll with offset (for sticky header)
function smoothScrollTo(y) {
  if (prefersReduced) {
    window.scrollTo(0, y);
  } else {
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

function scrollToTarget(target) {
  const header = document.querySelector('.nav');
  const rect = target.getBoundingClientRect();
  const headerH = header ? header.offsetHeight : 0;
  const y = rect.top + window.pageYOffset - (headerH + 8); // slight gap
  smoothScrollTo(y);

  // Set focus for accessibility (without showing outline on click users)
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
}

// Update the URL hash without jumping the page
function updateHash(id) {
  const hash = id.startsWith('#') ? id : `#${id}`;
  history.pushState(null, '', hash);
}

// Current year in footer
(function setYear(){
  const y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();

// -------------------------------
// In-page smooth links
// -------------------------------
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (!id || id.length <= 1) return;
    const target = document.querySelector(id);
    if (!target) return;

    e.preventDefault();
    scrollToTarget(target);
    updateHash(id);
  });
});

// Handle direct hash loads (e.g., /#contact)
window.addEventListener('load', () => {
  const hash = window.location.hash;
  if (hash) {
    const target = document.querySelector(hash);
    if (target) scrollToTarget(target);
  }
});

// -------------------------------
// Netlify Forms — progressive enhancement (AJAX)
// -------------------------------
const enquiryForm = document.querySelector('form[name="enquiry"]');
const statusEl = document.getElementById('enquiryStatus');

function encode(data) {
  return Object.keys(data)
    .map(k => encodeURIComponent(k) + '=' + encodeURIComponent(data[k]))
    .join('&');
}

if (enquiryForm && statusEl) {
  enquiryForm.addEventListener('submit', async (e) => {
    // If JS fails, Netlify still accepts native post—so only prevent when we handle it here.
    e.preventDefault();

    const submitBtn = enquiryForm.querySelector('button[type="submit"]');
    const formData = new FormData(enquiryForm);

    // Honeypot: if bot-field has a value, quietly succeed (don’t reveal anything)
    if (formData.get('bot-field')) {
      statusEl.textContent = 'Thanks — your enquiry was sent.';
      statusEl.classList.remove('error');
      statusEl.classList.add('success');
      enquiryForm.reset();
      return;
    }

    // Ensure Netlify sees the form name (works with your hidden input too)
    if (!formData.get('form-name')) {
      formData.set('form-name', 'enquiry');
    }

    // Disable UI while sending
    submitBtn?.setAttribute('disabled', 'true');
    statusEl.textContent = 'Sending…';
    statusEl.classList.remove('error', 'success');

    try {
      const body = encode(Object.fromEntries(formData));
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        credentials: 'same-origin',
        redirect: 'follow'
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // Success
      statusEl.textContent = 'Thanks — your enquiry was sent.';
      statusEl.classList.remove('error');
      statusEl.classList.add('success');
      enquiryForm.reset();

      // Optional: clear status after a few seconds
      window.setTimeout(() => {
        statusEl.textContent = '';
        statusEl.classList.remove('success');
      }, 5000);

    } catch (err) {
      statusEl.textContent = 'Couldn’t send just now. Please try again.';
      statusEl.classList.remove('success');
      statusEl.classList.add('error');
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
}
