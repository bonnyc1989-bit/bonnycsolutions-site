/* ==================================================
   BonnyCsolutions — script.js (v26)
   - Hero: seamless 4-video loop with preloading
   - Netlify form (status UX)
   - Target Agencies marquee: one set, continuous loop, peel-in
   ================================================== */

   (function() {
    /* ---------- Year in footer ---------- */
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  
    /* ---------- Netlify form UX ---------- */
    const form = document.getElementById('enquiryForm');
    if (form) {
      const status = document.getElementById('enquiryStatus');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = new FormData(form);
        status.textContent = 'Sending…';
        try {
          const res = await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ 'form-name': 'enquiry', ...Object.fromEntries(data) }).toString()
          });
          if (res.ok) {
            status.textContent = 'Thanks — I’ll be in touch within 1–3 business days.';
            status.classList.add('success');
            form.reset();
          } else {
            status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.';
            status.classList.add('error');
          }
        } catch(err) {
          status.textContent = 'Network error. Please email info@bonnycsolutions.com.';
          status.classList.add('error');
        }
      });
    }
  
    /* ---------- HERO: seamless 4-video loop ---------- */
    const heroVideo = document.getElementById('heroVideo');
    const heroSource = document.getElementById('heroSource');
    const playlist = [
      'images/Soldiers.mp4',
      'images/Iwojima.mp4',
      'images/Boots.mp4',
      'images/B1.mp4'
    ];
    let vidIdx = 0;
  
    function setSource(ix) {
      heroSource.src = playlist[ix];
      heroVideo.load();
    }
  
    // Start immediately
    if (heroVideo && heroSource) {
      setSource(vidIdx);
      heroVideo.play().catch(() => {
        // Autoplay blocked: will play on user gesture
        console.warn('Autoplay blocked; video will start on interaction.');
      });
  
      // Preload next by swapping source at 'ended' without delay
      heroVideo.addEventListener('ended', () => {
        vidIdx = (vidIdx + 1) % playlist.length;
        setSource(vidIdx);
        const p = heroVideo.play();
        if (p && typeof p.then === 'function') {
          p.catch(() => {});
        }
      });
    }
  
    /* ---------- Target Agencies marquee ---------- */
    const trackA = document.getElementById('sealsTrackA');
    const trackB = document.getElementById('sealsTrackB');
  
    function startMarquee() {
      if (!trackA || !trackB) return;
  
      // Clone A into B (one time) so there’s exactly one set duplicated
      if (!trackB.hasChildNodes()) {
        trackB.innerHTML = trackA.innerHTML;
      }
  
      // Lay out: place A at x=0, B immediately to the right of A
      const wrap = trackA.parentElement; // .seals-mask
      const aWidth = trackA.scrollWidth;
      const gapBetweenRows = 0; // rows touch end-to-start
      trackA.style.transform = 'translateX(0px)';
      trackB.style.transform = `translateX(${aWidth + gapBetweenRows}px)`;
  
      // Animation speed: pixels per second (tuned for “nice and easy”)
      const speed = 40; // adjust if needed
      let lastTs = performance.now();
      let posA = 0;
      let posB = aWidth + gapBetweenRows;
  
      function step(ts) {
        const dt = (ts - lastTs) / 1000; // seconds
        lastTs = ts;
  
        posA -= speed * dt;
        posB -= speed * dt;
  
        // Loop when a row fully exits left
        if (posA <= -aWidth - gapBetweenRows) {
          posA = posB + aWidth + gapBetweenRows;
        }
        if (posB <= -aWidth - gapBetweenRows) {
          posB = posA + aWidth + gapBetweenRows;
        }
  
        trackA.style.transform = `translateX(${posA}px)`;
        trackB.style.transform = `translateX(${posB}px)`;
  
        requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
  
    // Start marquee after fonts/layout settle
    window.addEventListener('load', () => {
      // Small timeout helps ensure scrollWidth is accurate after images load
      setTimeout(startMarquee, 200);
    });
  })();
  