/* =========================================================
   BonnyCsolutions — script.js (v29)
   - Gapless 4-video hero loop (double-buffer swap, class-based)
   - Hover count-up for Annual Spend cards
   - Marquee: pause for reduced motion (+ CSS hover pause)
   - Enquiry form status (demo)
   ========================================================= */

/* ---------- Utils ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Footer year ---------- */
(() => { const y = new Date().getFullYear(); const el = $('#year'); if (el) el.textContent = y; })();

/* ---------- HERO: gapless 4-video loop (fixed) ---------- */
(() => {
  const playlist = [
    'images/Soldiers.mp4',
    'images/Iwojima.mp4',
    'images/Boots.mp4',
    'images/B1.mp4'
  ];

  const a = document.getElementById('videoA');
  const b = document.getElementById('videoB');
  if (!a || !b) return;

  [a, b].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = 'auto';
  });

  let cur = 0;          // index for currently visible video in playlist
  let front = a;        // video on top (visible)
  let back = b;         // preloading the next one
  let swapping = false;

  const setSrc = (vid, src) => {
    if (vid.getAttribute('src') !== src) {
      vid.src = src;
      vid.load();
    }
  };

  // prepare first two
  setSrc(front, playlist[cur]);
  const nextIndex = () => (cur + 1) % playlist.length;
  setSrc(back, playlist[nextIndex()]);

  // show first frame as soon as it can play
  front.addEventListener('canplay', () => {
    try { front.play(); } catch {}
    front.classList.add('is-front');
  }, { once: true });

  const SWAP_EARLY_SEC = 0.25; // start swap ~250ms before end

  const onTime = () => {
    if (swapping) return;
    const remain = (front.duration || 0) - (front.currentTime || 0);
    if (remain > 0 && remain <= SWAP_EARLY_SEC) {
      swapping = true;

      const expectedBack = back; // guard against stale listener

      const doSwap = () => {
        if (back !== expectedBack) return; // stale handler; ignore

        try { back.currentTime = 0; back.play(); } catch {}

        // CSS crossfade via class flip
        back.classList.add('is-front');

        setTimeout(() => {
          front.classList.remove('is-front');

          // rotate references
          const tmp = front;
          front = back;
          back = tmp;

          // prepare new "back"
          cur = nextIndex();
          setSrc(back, playlist[nextIndex()]);
          try { back.pause(); back.currentTime = 0; } catch {}

          // rebind listener to the new front
          bindTime();

          swapping = false;
        }, 70);
      };

      if (back.readyState >= 3) {
        doSwap();
      } else {
        const handler = () => { back.removeEventListener('canplaythrough', handler); doSwap(); };
        back.addEventListener('canplaythrough', handler, { once: true });
        try { back.play(); back.pause(); } catch {}
      }
    }
  };

  // bind timeupdate to the current 'front'
  const bindTime = () => {
    a.removeEventListener('timeupdate', onTime);
    b.removeEventListener('timeupdate', onTime);
    front.addEventListener('timeupdate', onTime);
  };
  bindTime();

  // Autoplay kickstart for iOS/Safari if blocked
  const tryStart = () => {
    a.play().catch(()=>{});
    b.play().then(() => b.pause()).catch(()=>{});
  };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click', tryStart, { once: true });

  // Respect reduced motion: freeze on first frame
  const mq = matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotionPref = () => {
    const vids = [a, b];
    if (mq.matches) {
      vids.forEach(v => { try { v.pause(); v.currentTime = 0; } catch {} });
      a.classList.add('is-front');
      b.classList.remove('is-front');
    } else {
      try { front.play(); } catch {}
    }
  };
  mq.addEventListener ? mq.addEventListener('change', applyMotionPref) : mq.addListener(applyMotionPref);
  applyMotionPref();
})();

/* ---------- Annual Spend: count-up on hover ---------- */
(() => {
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const formatVal = (n, suffix) => {
    if (suffix === 'T') return `$${n.toFixed(1)}T`;
    if (suffix === 'B') return `$${Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2)}B`;
    // thousands separator for whole numbers
    return `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  $$('.stat-card').forEach(card => {
    const v = $('.stat-value', card);
    if (!v) return;

    const target = parseFloat(v.dataset.target || '0');
    const suffix = v.dataset.suffix || '';
    v.textContent = formatVal(0, suffix);

    let animating = false;
    const animateTo = () => {
      if (animating) return;
      animating = true;

      const start = performance.now();
      const dur = 900; // ms

      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        const val = target * easeOut(p);
        v.textContent = formatVal(val, suffix);
        if (p < 1) requestAnimationFrame(step);
        else animating = false;
      };
      requestAnimationFrame(step);
    };

    card.addEventListener('mouseenter', animateTo);
    card.addEventListener('click', animateTo); // tap to replay on touch
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
    if (status) {
      status.classList.remove('error','success');
      status.textContent = 'Sending…';
    }

    // Honeypot check
    const hp = (new FormData(form)).get('hp');
    if (hp) {
      if (status) {
        status.textContent = 'Something went wrong.';
        status.className = 'enquiry-status error';
      }
      return;
    }

    // Simulate success (replace with real endpoint if desired)
    setTimeout(() => {
      if (status) {
        status.textContent = 'Thanks! We’ll be in touch shortly.';
        status.className = 'enquiry-status success';
      }
      form.reset();
    }, 600);
  });
})();
