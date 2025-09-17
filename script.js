// BonnyCsolutions — script.js (v26)
// - Footer year
// - Annual Spend counters: decimals/prefix/suffix, start on view, replay on hover
// - Lightbox
// - Netlify form (AJAX)
// - HERO: play 4 MP4s in sequence, loop the set

(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Animated stats (supports decimals; hover to replay) ----------
  const animateCount = (el) => {
    const to = parseFloat(el.getAttribute('data-count-to') || '0');
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const dur = 1200; // ms

    const fmt = (n) => n.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = to * eased;
      el.textContent = `${prefix}${fmt(val)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // Start counters when visible
  const statObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            animateCount(e.target);
            statObserver.unobserve(e.target);
          }
        });
      }, { threshold: 0.6 })
    : null;

  document.querySelectorAll('.stat-value').forEach(el => {
    if (statObserver) statObserver.observe(el); else animateCount(el);
  });

  // Replay counters on hover
  document.querySelectorAll('.stat').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const val = card.querySelector('.stat-value');
      if (!val) return;
      val.textContent = '0';
      animateCount(val);
    });
  });

  // ---------- Showcase lightbox ----------
  const dlg = document.querySelector('.lightbox');
  const dlgImg = document.querySelector('.lightbox-img');
  const dlgCap = document.querySelector('.lightbox-caption');
  const dlgClose = document.querySelector('.lightbox-close');

  const openLightbox = (src, cap) => {
    if (!dlg) return;
    dlgImg.src = src;
    dlgCap.textContent = cap || '';
    dlg.showModal();
  };
  const closeLightbox = () => { if (dlg?.open) dlg.close(); };

  document.querySelectorAll('.gallery figure').forEach(fig => {
    fig.addEventListener('click', () => {
      const img = fig.querySelector('img');
      const cap = fig.querySelector('figcaption')?.textContent || '';
      if (img) openLightbox(img.src, cap);
    });
  });
  dlgClose?.addEventListener('click', closeLightbox);
  dlg?.addEventListener('click', (e) => {
    const rect = dlg.querySelector('img')?.getBoundingClientRect();
    if (!rect || e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeLightbox();
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

  // ---------- HERO: sequential playlist (4 MP4s), loop the set ----------
  const heroVideo = document.getElementById('heroVideo');
  const srcEl = document.getElementById('heroSource');
  if (heroVideo && srcEl) {
    // These filenames must exist in /images
    const playlist = ["Soldiers.mp4", "Iwojima.mp4", "Boots.mp4", "B1.mp4"];
    let idx = 0;

    const playIndex = (i) => {
      srcEl.src = `images/${playlist[i]}`;
      heroVideo.load();
      const p = heroVideo.play?.();
      if (p && typeof p.then === 'function') {
        p.catch(() => console.warn('Autoplay blocked; poster remains until user interacts.'));
      }
    };

    heroVideo.removeAttribute('loop'); // each video plays once
    heroVideo.addEventListener('ended', () => {
      idx = (idx + 1) % playlist.length;
      playIndex(idx);
    });

    playIndex(idx); // start sequence
  }
})();
