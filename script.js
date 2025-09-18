/* =========================================
   BonnyCsolutions — script.js (v26)
   - Netlify form UX
   - Hero video: seamless 4-video loop
   - Stat cards: hover replay
   ========================================= */
   (function () {
    // YEAR
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  
    // ----- Netlify form UX -----
    const form = document.getElementById('enquiryForm');
    if (form) {
      const status = document.getElementById('enquiryStatus');
      const encode = (data) =>
        Object.keys(data)
          .map((key) => encodeURIComponent(key) + '=' + encodeURIComponent(data[key]))
          .join('&');
  
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (status) status.textContent = 'Sending…';
        try {
          const formData = new FormData(form);
          const body = encode({
            'form-name': form.getAttribute('name') || 'enquiry',
            ...Object.fromEntries(formData),
          });
          const res = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
          });
          if (res.ok) {
            form.reset();
            if (status) {
              status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.';
              status.classList.remove('error');
              status.classList.add('success');
            }
          } else throw new Error('Network error');
        } catch (err) {
          if (status) {
            status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.';
            status.classList.remove('success');
            status.classList.add('error');
          }
          console.error(err);
        }
      });
    }
  
    // ----- HERO: seamless sequential playlist of 4 videos -----
    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo) {
      const sourceDir = 'images/';
      const playlist = ['Soldiers.mp4', 'Iwojima.mp4', 'Boots.mp4', 'B1.mp4'];
      let idx = 0;
  
      // pre-create hidden buffers to cut switch gap
      const buffers = playlist.map(() => document.createElement('video'));
      buffers.forEach(v => { v.muted = true; v.preload = 'auto'; v.playsInline = true; });
  
      const loadIntoBuffer = (i) => {
        const v = buffers[i];
        if (v.getAttribute('data-loaded') === '1') return v;
        v.src = sourceDir + playlist[i];
        v.load();
        v.setAttribute('data-loaded', '1');
        return v;
      };
  
      // start: load first two
      loadIntoBuffer(0);
      loadIntoBuffer(1);
  
      const playIndex = (i) => {
        const buf = loadIntoBuffer(i);
        // copy currentTime 0 for crisp start
        heroVideo.src = buf.src;
        heroVideo.currentTime = 0;
        heroVideo.play().catch(()=>{});
        // warm next buffer
        const next = (i + 1) % playlist.length;
        loadIntoBuffer(next);
      };
  
      heroVideo.addEventListener('ended', () => {
        idx = (idx + 1) % playlist.length;
        playIndex(idx);
      });
  
      // Autoplay might be blocked on some devices; poster image remains visible.
      heroVideo.addEventListener('error', () => {
        console.warn('Video error; check filenames and formats.');
      });
  
      playIndex(idx);
    }
  
    // ----- Stats hover replay -----
    const nums = document.querySelectorAll('.stat [data-replay]');
    nums.forEach(el => {
      const text = el.textContent;
      const replay = () => {
        el.style.animation = 'none';
        // force reflow
        void el.offsetWidth;
        el.style.animation = '';
        el.textContent = text;
      };
      el.parentElement.addEventListener('mouseenter', replay);
      el.parentElement.addEventListener('focus', replay, true);
    });
  })();
  