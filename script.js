/* =========================================
   BonnyCsolutions — script.js (v30)
   - Seamless dual-video hero playlist (no gap)
   - Simple form status (front-end only)
   ========================================= */

   (function () {
    /* Year in footer */
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  
    /* -----------------------------
       HERO: 4-video playlist, seamless
       We use two <video> tags and crossfade.
       ----------------------------- */
    const vids = ['images/Soldiers.mp4', 'images/Iwojima.mp4', 'images/Boots.mp4', 'images/B1.mp4'];
    const a = document.getElementById('heroVideoA');
    const b = document.getElementById('heroVideoB');
    if (a && b) {
      const els = [a, b];
      let cur = 0;     // which element is currently visible
      let idx = 0;     // index in playlist
  
      function setSrc(el, src) {
        if (!src) return;
        if (el.src !== location.origin + '/' + src && el.getAttribute('src') !== src) {
          el.setAttribute('src', src);
          el.load();
        }
      }
  
      function play(el) {
        const p = el.play();
        if (p && typeof p.then === 'function') p.catch(() => {});
      }
  
      // Prepare both with first two videos
      setSrc(a, vids[idx % vids.length]); idx++;
      setSrc(b, vids[idx % vids.length]);
  
      // Start the first one when ready
      a.addEventListener('canplay', () => play(a), { once: true });
  
      function queueNext(nextEl) {
        // Preload the next-in-queue for the other tag
        const nextSrc = vids[(idx + 1) % vids.length];
        setSrc(nextEl, nextSrc);
      }
  
      function swap() {
        const visible = els[cur];
        const hidden  = els[1 - cur];
  
        // Ensure hidden el is ready; if not, wait for canplay
        const readyOrPlay = () => {
          // fade
          visible.classList.remove('visible');
          hidden.classList.add('visible');
          play(hidden);
          // advance playlist position
          idx = (idx + 1) % vids.length;
          // queue next on the now-hidden element
          queueNext(visible);
          cur = 1 - cur;
        };
  
        if (hidden.readyState >= 3) { // HAVE_FUTURE_DATA
          readyOrPlay();
        } else {
          hidden.addEventListener('canplay', readyOrPlay, { once: true });
        }
      }
  
      // When current ends, swap immediately
      a.addEventListener('ended', swap);
      b.addEventListener('ended', swap);
  
      // Also pre-queue the third video
      queueNext(a);
    }
  
    /* -----------------------------
       Enquiry form (front-end only)
       ----------------------------- */
    const form = document.getElementById('enquiryForm');
    if (form) {
      const status = document.getElementById('enquiryStatus');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (status) {
          status.textContent = 'Thanks — I’ll be in touch within 1–3 business days.';
          setTimeout(() => (status.textContent = ''), 6000);
        }
        form.reset();
      });
    }
  })();
  