// -------------------------------
// Utilities
// -------------------------------
const prefersReduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? false;

// Smooth scroll with offset (for sticky header)
function smoothScrollTo(y) {
  if (prefersReduced) window.scrollTo(0, y);
  else window.scrollTo({ top: y, behavior: 'smooth' });
}

function scrollToTarget(target) {
  const header = document.querySelector('.nav');
  const rect = target.getBoundingClientRect();
  const headerH = header ? header.offsetHeight : 0;
  const y = rect.top + window.pageYOffset - (headerH + 8);
  smoothScrollTo(y);

  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
}

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

window.addEventListener('load', () => {
  const hash = window.location.hash;
  const target = hash && document.querySelector(hash);
  if (target) scrollToTarget(target);
});

// -------------------------------
// Netlify Forms — AJAX to current path, with fallback
// -------------------------------
const enquiryForm = document.getElementById('enquiryForm');
const statusEl = document.getElementById('enquiryStatus');

function encode(obj) {
  return Object.entries(obj).map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

async function submitViaAjax(form) {
  const formData = new FormData(form);
  if (!formData.get('form-name')) formData.set('form-name', 'enquiry'); // ensure detection

  // Post to the current page path (avoids domain/redirect quirks)
  const postUrl = form.getAttribute('action') || window.location.pathname;

  const res = await fetch(postUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: encode(Object.fromEntries(formData))
  });
  return res;
}

if (enquiryForm && statusEl) {
  enquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = enquiryForm.querySelector('button[type="submit"]');
    const honeypot = enquiryForm.querySelector('[name="bot-field"]');
    const hpVal = honeypot ? honeypot.value : '';

    // Honeypot: if filled, pretend success
    if (hpVal) {
      statusEl.textContent = 'Thanks — your enquiry was sent.';
      statusEl.classList.remove('error');
      statusEl.classList.add('success');
      enquiryForm.reset();
      return;
    }

    submitBtn?.setAttribute('disabled', 'true');
    statusEl.textContent = 'Sending…';
    statusEl.classList.remove('error', 'success');

    try {
      const res = await submitViaAjax(enquiryForm);

      if (res.ok) {
        statusEl.textContent = 'Thanks — your enquiry was sent.';
        statusEl.classList.remove('error');
        statusEl.classList.add('success');
        enquiryForm.reset();
        setTimeout(() => { statusEl.textContent = ''; statusEl.classList.remove('success'); }, 5000);
      } else {
        // Fallback: native submit to Netlify default success page
        enquiryForm.setAttribute('action', window.location.pathname);
        enquiryForm.submit();
      }
    } catch (err) {
      // Network fallback
      enquiryForm.setAttribute('action', window.location.pathname);
      enquiryForm.submit();
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });
}
