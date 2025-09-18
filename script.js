/* =========================================
   BonnyCsolutions — script.js (v26)
   - Gapless 4-video hero rotation
   - Stats hover replay independence
   - Single-row seals continuous loop (no duplicates visible)
   ========================================= */

   (function () {
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  })();
  
  /* ---------- Netlify form UX ---------- */
  (function () {
    const form = document.getElementById('enquiryForm');
    if (!form) return;
    const status = document.getElementById('enquiryStatus');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!status) return;
  
      status.textContent = 'Sending…';
      status.className = 'enquiry-status';
  
      try {
        const fd = new FormData(form);
        const body = new URLSearchParams(fd).toString();
  
        const res = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body
        });
  
        if (res.ok) {
          status.textContent = 'Thanks — I’ll be in touch within 1–3 business days.';
          status.classList.add('success');
          form.reset();
        } else {
          status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.';
          status.classList.add('error');
        }
      } catch (err) {
        console.error(err);
        status.textContent = 'Network error. Please email info@bonnycsolutions.com.';
        status.classList.add('error');
      }
    });
  })();
  
  /* ---------- HERO: sequential playlist of 4 videos, gapless loop ---------- */
  (function () {
    const heroVideo = document.getElementById('heroVideo');
    if (!heroVideo) return;
  
    // Ensure these filenames exist in /images
    const playlist = ['Soldiers.mp4', 'Iwojima.mp4', 'Boots.mp4', 'B1.mp4'].map(n => `images/${n}`);
    let idx = 0;
  
    // Prepare for fast switches
    heroVideo.playsInline = true;
    heroVideo.muted = true;
    heroVideo.autoplay = true;
  
    const setSrc = (src) => {
      // Using src and load keeps memory low; preloading via fetch improves gap
      heroVideo.src = src;
      heroVideo.load();
    };
  
    const playIndex = (i) => {
      setSrc(playlist[i]);
      heroVideo.play().catch(() => {
        console.warn('Autoplay blocked; user interaction may be required.');
      });
    };
  
    // Kick off
    playIndex(idx);
  
    // Slightly pre-buffer the next video to reduce switch delay
    let nextBuff = null;
    const prebuffer = (src) => {
      try {
        nextBuff = document.createElement('link');
        nextBuff.rel = 'preload';
        nextBuff.as = 'video';
        nextBuff.href = src;
        document.head.appendChild(nextBuff);
      } catch {}
    };
  
    heroVideo.addEventListener('timeupdate', () => {
      if (!nextBuff && heroVideo.duration && heroVideo.currentTime > heroVideo.duration - 2) {
        const next = playlist[(idx + 1) % playlist.length];
        prebuffer(next);
      }
    });
  
    heroVideo.addEventListener('ended', () => {
      idx = (idx + 1) % playlist.length;
      if (nextBuff && nextBuff.parentNode) nextBuff.parentNode.removeChild(nextBuff), (nextBuff = null);
      playIndex(idx);
    });
  })();
  
  /* ---------- Stats: replay animation only on the hovered box ---------- */
  (function () {
    const boxes = document.querySelectorAll('.stat-box');
    if (!boxes.length) return;
  
    boxes.forEach((box) => {
      box.addEventListener('mouseenter', () => {
        box.style.animation = 'none';
        // Force reflow to restart any CSS keyframes (if added later)
        void box.offsetHeight;
        box.style.animation = '';
      });
      box.addEventListener('focus', () => {
        box.style.animation = 'none';
        void box.offsetHeight;
        box.style.animation = '';
      });
    });
  })();
  
  /* ---------- Departments seals: single unique row, continuous loop ---------- */
  (function () {
    const row = document.getElementById('sealRow');
    if (!row) return;
  
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gap = parseFloat(getComputedStyle(row).gap || getComputedStyle(row).columnGap || '32');
    const sealSize = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--seal-size')) || 138;
    const itemWidth = sealSize + gap;
  
    let offset = 0;
    const pxPerSec = 28; // readable pace
    let last = performance.now();
  
    function tick(now) {
      const dt = (now - last) / 1000;
      last = now;
  
      if (!prefersReduced) {
        offset -= pxPerSec * dt;
        // Move first emblem to the end only after fully out of view
        while (-offset >= itemWidth) {
          row.appendChild(row.firstElementChild);
          offset += itemWidth;
        }
        row.style.transform = `translateX(${offset}px)`;
      }
  
      requestAnimationFrame(tick);
    }
  
    requestAnimationFrame(tick);
  })();
  