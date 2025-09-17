// BonnyCsolutions — script.js (v31)
// - Footer year
// - Animated counters (isolated hover replay)
// - Netlify AJAX form
// - HERO: robust 4-video playlist (no <source>; error/timeout skip)

(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Animated stats ----------
  const animateCount = (el) => {
    const to = parseFloat(el.getAttribute('data-count-to') || '0');
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const dur = 1200;
    const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${prefix}${fmt(to * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const statObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { animateCount(e.target); statObserver.unobserve(e.target); }
        });
      }, { threshold: 0.6 })
    : null;

  document.querySelectorAll('.stat-value').forEach(el => {
    if (statObserver) statObserver.observe(el); else animateCount(el);
  });

  document.querySelectorAll('.stat').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const val = card.querySelector('.stat-value');
      if (!val) return;
      val.textContent = '0';
      animateCount(val);
    });
  });

  // ---------- Netlify AJAX form ----------
  const form = document.getElementById('enquiryForm');
  const status = document.getElementById('enquiryStatus');
  const encode = (data) => new URLSearchParams(data).toString();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) { status.textContent = 'Sending…'; status.className = 'enquiry-status'; }
      const formData = new FormData(form);
      if (formData.get('bot-field')) { if (status) { status.textContent = 'Submission blocked.'; status.classList.add('error'); } return; }

      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode({ 'form-name': form.getAttribute('name') || 'enquiry', ...Object.fromEntries(formData.entries()) })
        });
        if (status) { status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.'; status.classList.add('success'); }
        form.reset();
      } catch (err) {
        if (status) { status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.'; status.classList.add('error'); }
        console.error(err);
      }
    });
  }

  // ---------- HERO: robust playlist ----------
  const vid = document.getElementById('heroVideo');
  if (vid) {
    const playlist = ["Soldiers.mp4", "Iwojima.mp4", "Boots.mp4", "B1.mp4"]; // /images
    let i = 0;
    let timeoutId = null;

    const nextIndex = () => (i = (i + 1) % playlist.length);

    const clearGuards = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      vid.oncanplay = vid.onerror = vid.onstalled = null;
    };

    const loadAndPlay = (file) => {
      clearGuards();

      // Force a hard reload of the media element (important for Safari/Chrome)
      vid.pause();
      vid.removeAttribute('src');
      vid.load();

      // Set new source directly on the video element (no <source>)
      vid.src = `images/${file}`;
      vid.currentTime = 0;

      // Guards:
      vid.oncanplay = () => { /* ready to go */ };
      vid.onerror = () => {
        console.warn('Video error, skipping:', file, vid.error);
        nextIndex();
        loadAndPlay(playlist[i]);
      };
      vid.onstalled = () => {
        console.warn('Video stalled, skipping:', file);
        nextIndex();
        loadAndPlay(playlist[i]);
      };

      // Timeout guard in case neither 'error' nor 'stalled' fires
      timeoutId = setTimeout(() => {
        if (vid.readyState < 2) {
          console.warn('Video timeout, skipping:', file);
          nextIndex();
          loadAndPlay(playlist[i]);
        }
      }, 7000);

      const p = vid.play?.();
      if (p && typeof p.then === 'function') {
        p.catch(() => console.warn('Autoplay blocked; playback will start after first interaction.'));
      }
    };

    vid.addEventListener('ended', () => {
      nextIndex();
      loadAndPlay(playlist[i]);
    });

    // Kick off
    loadAndPlay(playlist[i]);
  }
})();
