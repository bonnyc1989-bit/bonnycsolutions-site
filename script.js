/* =========================================================
   BonnyCsolutions — script.js (v28)
   - Gapless 4-video hero loop (double-buffer swap)
   - Hover count-up for Annual Spend cards
   - Marquee: pause for reduced motion
   - Enquiry form status (demo)
   ========================================================= */

/* ---------- Utils ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Footer year ---------- */
(() => { const y = new Date().getFullYear(); const el = $('#year'); if (el) el.textContent = y; })();

/* ---------- HERO: gapless 4-video loop ---------- */
(() => {
  const playlist = [
    'images/Soldiers.mp4',
    'images/Iwojima.mp4',
    'images/Boots.mp4',
    'images/B1.mp4'
  ];

  const a = $('#videoA');
  const b = $('#videoB');
  if (!a || !b) return;

  // Common attributes
  [a, b].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = 'auto';
  });

  let cur = 0;          // index in playlist for currently visible video
  let front = a;        // video on top (visible)
  let back = b;         // preloading the next one
  let swapping = false;

  const setSrc = (vid, src) => {
    if (vid.getAttribute('src') !== src) {
      vid.src = src;
      vid.load();
    }
  };

  // Prepare first two
  setSrc(front, playlist[cur]);
  front.addEventListener('canplay', () => {
    try { front.play(); } catch {}
  }, { once:true });

  const nextIndex = () => (cur + 1) % playlist.length;
  setSrc(back, playlist[nextIndex()]);

  // Proactive swap shortly before end to eliminate the blank frame between sources.
  const SWAP_EARLY_SEC = 0.25; // start swap ~250ms before end

  const onTime = () => {
    if (swapping) return;
    const remain = (front.duration || 0) - (front.currentTime || 0);
    if (remain > 0 && remain <= SWAP_EARLY_SEC) {
      swapping = true;

      // Ensure back can play
      const doSwap = () => {
        // z-index/opacity swap for instant cut
        back.style.transition = 'opacity 60ms linear';
        back.style.opacity = '1';

        // Start back
        try { back.currentTime = 0; back.play(); } catch {}

        // After a short blend, hide front and rotate refs
        setTimeout(() => {
          front.style.opacity = '0';

          // rotate references
          const tmp = front;
          front = back;
          back = tmp;

          // Now prepare new "back" with the next source
          cur = nextIndex();
          setSrc(back, playlist[nextIndex()]); // this uses updated cur
          back.pause();
          back.currentTime = 0;
          back.style.transition = '';
          back.style.opacity = '0';
          swapping = false;
        }, 70);
      };

      if (back.readyState >= 3) {
        doSwap();
      } else {
        back.addEventListener('canplaythrough', doSwap, { once:true });
        try { back.play(); back.pause(); } catch {}
      }
    }
  };

  // Keep timeupdate lightweight
  front.addEventListener('timeupdate', onTime);
})();

/* ---------- Annual Spend: count-up on hover ---------- */
(() => {
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const formatVal = (n, suffix) => {
    if (suffix === 'T') return `$${n.toFixed(1)}T`;
    if (suffix === 'B') return `$${n % 1 === 0 ? n.toFixed(0) : n.toFixed(2)}B`;
    return `$${n.toLocaleString()}`;
  };

  const animateTo = (el, target, suffix) => {
    const start = performance.now();
    const from = 0;
    const dur = 900; // ms

    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const val = from + (target - from) * easeOut(p);
      el.textContent = formatVal(val, suffix);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  $$('.stat-card').forEach(card => {
    const v = $('.stat-value', card);
    if (!v) return;
    const target = parseFloat(v.dataset.target || '0');
    const suffix = v.dataset.suffix || '';

    // First render (at rest)
    v.textContent = formatVal(0, suffix);

    card.addEventListener('mouseenter', () => {
      animateTo(v, target, suffix);
    });
    // Optional: tap to replay on touch
    card.addEventListener('click', () => {
      animateTo(v, target, suffix);
    });
  });
})();

/* ---------- Marquee: respect reduced motion ---------- */
(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rows = $$('.seal-row');
  const apply = () => {
    rows.forEach(r => {
      r.style.animationPlayState = mq.matches ? 'paused' : 'running';
    });
  };
  if (rows.length) {
    mq.addEventListener ? mq.addEventListener('change', apply) : mq.addListener(apply);
    apply();
  }
})();

/* ---------- Enquiry form (demo only) ---------- */
(() => {
  const form = $('#enquiryForm'); if (!form) return;
  const status = $('#enquiryStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';

    // Honeypot check
    const hp = (new FormData(form)).get('hp');
    if (hp) {
      status.textContent = 'Something went wrong.';
      status.className = 'enquiry-status error';
      return;
    }

    // Simulate success (replace with real endpoint if desired)
    setTimeout(() => {
      status.textContent = 'Thanks! We’ll be in touch shortly.';
      status.className = 'enquiry-status success';
      form.reset();
    }, 600);
  });
})();
