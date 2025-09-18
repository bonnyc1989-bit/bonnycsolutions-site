/* =========================================
   BonnyCsolutions — script.js (v29)
   - 4-video seamless hero loop
   - Stat hover replay accessibility
   - Netlify form helper + footer year
   ========================================= */

   (function () {
    // Footer year
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  
    // Netlify form feedback (simple, client-side)
    const form = document.getElementById('enquiryForm');
    const status = document.getElementById('enquiryStatus');
  
    if (form && status) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        status.textContent = 'Sending…';
  
        const data = new FormData(form);
        // Netlify expects urlencoded body for static forms
        const encoded = new URLSearchParams([...data]).toString();
  
        try {
          const res = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: encoded
          });
          if (res.ok) {
            status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.';
            status.classList.remove('error'); status.classList.add('success');
            form.reset();
          } else {
            status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.';
            status.classList.remove('success'); status.classList.add('error');
          }
        } catch (err) {
          status.textContent = 'Network error. Please email info@bonnycsolutions.com.';
          status.classList.remove('success'); status.classList.add('error');
          console.error(err);
        }
      });
    }
  
    // ---------- HERO: sequential playlist of 4 videos, seamless loop
    const heroVideo = document.getElementById('heroVideo');
    if (heroVideo) {
      const playlist = [
        'images/Soldiers.mp4',
        'images/Iwojima.mp4',
        'images/Boots.mp4',
        'images/B1.mp4'
      ];
      let idx = 0;
  
      // Preload with a source set helper
      const setSrc = (i) => {
        heroVideo.src = playlist[i];
        heroVideo.load();
        const p = heroVideo.play?.();
        if (p && typeof p.then === 'function') p.catch(()=>{});
      };
  
      // Ensure no default loop on the element
      heroVideo.removeAttribute('loop');
  
      heroVideo.addEventListener('ended', () => {
        idx = (idx + 1) % playlist.length;
        setSrc(idx);
      });
  
      // Kick off
      setSrc(idx);
    }
  
    // ---------- Stats: replay hover animation independently
    document.querySelectorAll('.stat').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        el.classList.remove('replay');
        // force reflow to replay transitions on value element if needed
        void el.offsetWidth;
        el.classList.add('replay');
      });
      el.addEventListener('animationend', () => el.classList.remove('replay'));
    });
  })();
  