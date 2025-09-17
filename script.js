// BonnyCsolutions — script.js (v24)
// - Footer year
// - Reveal on scroll (IntersectionObserver)
// - Animated stats counters
// - Lightbox for showcase images
// - Enquiry form AJAX (Netlify)
// - HERO: play 4 videos sequentially, loop the set

(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Reveal on scroll
  const io = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.2 })
    : null;
  document.querySelectorAll('.reveal').forEach(el => {
    if (io) io.observe(el); else el.classList.add('visible');
  });

  // Animated stats counters
  const animateCount = (el) => {
    const toRaw = el.getAttribute('data-count-to');
    if (!toRaw) return;
    const to = parseFloat(toRaw);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const dur = 1200;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(from + (to - from) * eased);
      el.textContent = `${prefix}${val.toLocaleString()}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
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

  // Lightbox
  const dlg = document.querySelector('.lightbox');
  const dlgImg = document.querySelector('.lightbox-img');
  const dlgCap = document.querySelector('.lightbox-caption');
  const dlgClose = document.querySelector('.lightbox-close');
  const openLightbox = (src, cap) => { if (dlg) { dlgImg.src = src; dlgCap.textContent = cap || ''; dlg.showModal(); } };
  const closeLightbox = () => { if (dlg && dlg.open) dlg.close(); };
  document.querySelectorAll('.gallery figure').forEach(fig => {
    fig.addEventListener('click', () => {
      const img = fig.querySelector('img');
      const cap = fig.querySelector('figcaption')?.textContent || '';
      if (img) openLightbox(img.src, cap);
    });
  });
  if (dlgClose) dlgClose.addEventListener('click', closeLightbox);
  if (dlg) dlg.addEventListener('click', (e) => {
    const rect = dlg.querySelector('img')?.getBoundingClientRect();
    if (!rect || (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom)) {
      closeLightbox();
    }
  });

  // Enquiry form AJAX (Netlify)
  const form = document.getElementById('enquiryForm');
  const status = document.getElementById('enquiryStatus');
  const encode = (data) => new URLSearchParams(data).toString();
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) { status.textContent = 'Sending…'; status.classList.remove('success', 'error'); }
      const formData = new FormData(form);
      if (formData.get('bot-field')) { if (status) { status.textContent = 'Submission blocked.'; status.classList.add('error'); } return; }
      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode({ 'form-name': form.getAttribute('name') || 'enquiry', ...Object.fromEntries(formData.entries()) }),
        });
        if (status) { status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.'; status.classList.add('success'); }
        form.reset();
      } catch (err) {
        if (status) { status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.'; status.classList.add('error'); }
        console.error(err);
      }
    });
  }

  // HERO: sequential playlist of 4 videos, loop the set
  const heroVideo = document.getElementById('heroVideo');
  if (heroVideo) {
    const srcEl = document.getElementById('heroSource');
    // Ensure these filenames exist in /images
    const playlist = ["Soldiers.mp4", "Iwojima.mp4", "Boots.mp4", "B1.mp4"];
    let idx = 0;

    const playIndex = (i) => {
      srcEl.src = `images/${playlist[i]}`;
      heroVideo.load();
      const p = heroVideo.play?.();
      if (p && typeof p.then === 'function') {
        p.catch(() => {
          // Autoplay might be blocked on some devices; poster image remains visible.
          console.warn('Autoplay blocked; video will remain paused until user interacts.');
        });
      }
    };

    heroVideo.removeAttribute('loop'); // important: we play each once, not loop one video
    heroVideo.addEventListener('ended', () => {
      idx = (idx + 1) % playlist.length;
      playIndex(idx);
    });

    // Kick off sequence
    playIndex(idx);
  }
})();
