// BonnyCsolutions — script.js (v25)
// - Footer year
// - Stats counters (on view)
// - Lightbox
// - Netlify form (AJAX)
// - HERO: play 4 MP4s in sequence, loop the set

(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Stats counters
  const animateCount = (el) => {
    const toRaw = el.getAttribute('data-count-to');
    if (!toRaw) return;
    const to = parseFloat(toRaw);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const dur = 1200, start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(to * eased);
      el.textContent = `${prefix}${val.toLocaleString()}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const statObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries)=>entries.forEach(e=>{ if(e.isIntersecting){ animateCount(e.target); statObserver.unobserve(e.target); } }), {threshold:.6})
    : null;
  document.querySelectorAll('.stat-value').forEach(el => statObserver ? statObserver.observe(el) : animateCount(el));

  // Lightbox for showcase
  const dlg = document.querySelector('.lightbox');
  const dlgImg = document.querySelector('.lightbox-img');
  const dlgCap = document.querySelector('.lightbox-caption');
  const dlgClose = document.querySelector('.lightbox-close');
  const openLightbox = (src, cap) => { if (!dlg) return; dlgImg.src = src; dlgCap.textContent = cap || ''; dlg.showModal(); };
  const closeLightbox = () => { if (dlg?.open) dlg.close(); };
  document.querySelectorAll('.gallery figure').forEach(fig => {
    fig.addEventListener('click', () => {
      const img = fig.querySelector('img');
      openLightbox(img?.src || '', fig.querySelector('figcaption')?.textContent || '');
    });
  });
  dlgClose?.addEventListener('click', closeLightbox);
  dlg?.addEventListener('click', (e) => {
    const rect = dlg.querySelector('img')?.getBoundingClientRect();
    if (!rect || e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) closeLightbox();
  });

  // Netlify AJAX submit
  const form = document.getElementById('enquiryForm');
  const status = document.getElementById('enquiryStatus');
  const encode = (data) => new URLSearchParams(data).toString();
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status && (status.textContent = 'Sending…', status.className = 'enquiry-status');
      const formData = new FormData(form);
      if (formData.get('bot-field')) { status && (status.textContent = 'Submission blocked.', status.classList.add('error')); return; }
      try {
        await fetch('/', { method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
          body: encode({ 'form-name': form.getAttribute('name') || 'enquiry', ...Object.fromEntries(formData.entries()) }) });
        status && (status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.', status.classList.add('success'));
        form.reset();
      } catch (err) {
        status && (status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.', status.classList.add('error'));
        console.error(err);
      }
    });
  }

  // HERO: sequential playlist (Soldiers → Iwojima → Boots → B1 → repeat)
  const heroVideo = document.getElementById('heroVideo');
  const srcEl = document.getElementById('heroSource');
  if (heroVideo && srcEl) {
    const playlist = ["Soldiers.mp4", "Iwojima.mp4", "Boots.mp4", "B1.mp4"]; // must exist in /images
    let idx = 0;

    const playIndex = (i) => {
      srcEl.src = `images/${playlist[i]}`;
      heroVideo.load();
      const p = heroVideo.play?.();
      if (p && typeof p.then === 'function') {
        p.catch(() => console.warn('Autoplay blocked; poster will remain until user interacts.'));
      }
    };

    heroVideo.removeAttribute('loop'); // each plays once
    heroVideo.addEventListener('ended', () => {
      idx = (idx + 1) % playlist.length;
      playIndex(idx);
    });

    playIndex(idx); // start
  }
})();
