/* =========================================================
   BonnyCsolutions — script.js (final, hardened)
   - 4‑video hero loop (rVFC swap) + iOS nudge; no Save‑Data bail
   - Stats: ALWAYS on-view + replay on hover/focus/click
   - Target Departments: measurement-free seamless marquee
   - Enquiry form demo
   ========================================================= */

/* ---------- Utils ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Footer year ---------- */
(() => { const y = new Date().getFullYear(); const el = $('#year'); if (el) el.textContent = y; })();

/* ---------- HERO: gapless 4-video loop (rVFC-based) ---------- */
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

  // Do NOT bail on Save‑Data; just reduce preload
  const saveData = navigator.connection && navigator.connection.saveData;
  [a, b].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = saveData ? 'metadata' : 'auto';
  });

  let cur = 0;          // index of currently visible video in playlist
  let front = a;        // video on top (visible)
  let back = b;         // preloading the next one
  let swapping = false;

  const setSrc = (vid, src) => {
    if (vid.getAttribute('src') !== src) {
      vid.src = src;
      vid.load();
    }
  };
  const nextIndex = () => (cur + 1) % playlist.length;

  // Ensure first two are correct (HTML has fallbacks already)
  setSrc(front, playlist[cur]);
  setSrc(back, playlist[nextIndex()]);

  const primeDecode = (v) => { try { v.play(); v.pause(); } catch {} };

  // show first frame as soon as it can play
  front.addEventListener('canplay', () => {
    try { front.play(); } catch {}
    front.classList.add('is-front');
  }, { once: true });

  const SWAP_EARLY_SEC = 0.18; // crossfade ~180ms before end
  const useRvfc = typeof front.requestVideoFrameCallback === 'function';

  const watchFront = () => {
    if (useRvfc) {
      const cb = (_, meta) => {
        if (swapping) return;
        const remain = (front.duration || 0) - (meta.mediaTime || front.currentTime || 0);
        if (remain > 0 && remain <= SWAP_EARLY_SEC) startSwap();
        else front.requestVideoFrameCallback(cb);
      };
      front.requestVideoFrameCallback(cb);
    } else {
      const onTime = () => {
        if (swapping) return;
        const remain = (front.duration || 0) - (front.currentTime || 0);
        if (remain > 0 && remain <= SWAP_EARLY_SEC) { front.removeEventListener('timeupdate', onTime); startSwap(); }
      };
      a.removeEventListener('timeupdate', onTime);
      b.removeEventListener('timeupdate', onTime);
      front.addEventListener('timeupdate', onTime);
    }
  };

  const startSwap = () => {
    if (swapping) return;
    swapping = true;

    const expectedBack = back;

    const doSwap = () => {
      if (back !== expectedBack) return;

      try { back.currentTime = 0; back.play(); } catch {}
      back.classList.add('is-front');

      setTimeout(() => {
        front.classList.remove('is-front');

        const tmp = front; front = back; back = tmp;

        cur = nextIndex();
        setSrc(back, playlist[nextIndex()]);
        try { back.pause(); back.currentTime = 0; } catch {}
        primeDecode(back);

        watchFront();
        swapping = false;
      }, 180); // keep in sync with CSS transition
    };

    // Use 'canplay' for better cross‑browser reliability
    if (back.readyState >= 3) doSwap();
    else {
      const handler = () => { back.removeEventListener('canplay', handler); doSwap(); };
      back.addEventListener('canplay', handler, { once: true });
      primeDecode(back);
    }
  };

  watchFront();

  // Autoplay nudge (iOS/Safari)
  const tryStart = () => {
    a.play().catch(()=>{});
    b.play().then(() => b.pause()).catch(()=>{});
  };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click', tryStart, { once: true });

  // Reduced motion: freeze on first frame for RM users
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

/* ---------- Annual Spend: ALWAYS on-view + replay on interaction ---------- */
(() => {
  const easeOut = t => 1 - Math.pow(1 - t, 3);

  const finalFormat = (target, suffix) => {
    if (suffix === 'T') return `$${target.toFixed(1)}T`;
    if (suffix === 'B') {
      const isInt = Number.isInteger(target);
      return `$${isInt ? target.toFixed(0) : target.toFixed(2)}B`;
    }
    return `$${Math.round(target).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatVal = (n, target, suffix) => {
    if (suffix === 'T') return `$${n.toFixed(1)}T`;
    if (suffix === 'B') {
      const isInt = Number.isInteger(target);
      return `$${n.toFixed(isInt ? 0 : 2)}B`;
    }
    return `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const COOLDOWN = 500; // allow quick replays but avoid double-triggers
  const animState = new WeakMap(); // v -> { animating, rafId, lastRun, target, suffix }

  const captionHeights = [];
  const lineHeights = [];

  function startAnim(v) {
    const st = animState.get(v);
    if (!st) return;
    const now = performance.now();
    if (st.animating || (now - st.lastRun) < COOLDOWN) return;
    st.lastRun = now;

    st.animating = true;
    const target = parseFloat(v.dataset.targetNum || '0');
    const suffix = v.dataset.suffix || '';
    const start = now;
    const dur = 900;

    // start from visible 0
    v.textContent = suffix ? (suffix === 'T' ? '$0.0T' : '$0B') : '$0';

    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      const n = target * easeOut(p);
      v.textContent = formatVal(n, target, suffix);
      if (p < 1) st.rafId = requestAnimationFrame(step);
      else { st.animating = false; v.textContent = v.dataset.final; }
    };
    st.rafId = requestAnimationFrame(step);
  }

  $$('.stat-card').forEach((card, i) => {
    const v = $('.stat-value', card);
    const g = $('.stat-ghost', card);
    const cap = $('.stat-caption', card);
    if (!v || !g) return;

    const target = parseFloat(v.dataset.target || '0');
    const suffix = v.dataset.suffix || '';
    const finalText = finalFormat(target, suffix);

    // A11y: link value to caption
    if (cap) {
      if (!cap.id) cap.id = `statcap-${i+1}`;
      v.setAttribute('aria-labelledby', cap.id);
    }

    // show final value by default (no jitter), but we will animate to it
    v.textContent = finalText;

    requestAnimationFrame(() => {
      g.textContent = finalText;
      const w = Math.ceil(g.offsetWidth);
      const h = Math.ceil(g.offsetHeight);
      v.classList.add('stat-live');
      v.style.width  = w + 'px';
      v.style.height = h + 'px';
      lineHeights.push(h);
      if (cap) captionHeights.push(Math.ceil(cap.offsetHeight));
      v.dataset.final = finalText;
      v.dataset.targetNum = String(target);
      v.dataset.suffix = suffix;
    });

    animState.set(v, { animating: false, rafId: 0, lastRun: 0, target, suffix });

    // Interaction replay (always allowed)
    const play = () => startAnim(v);
    card.addEventListener('mouseenter', play);
    card.addEventListener('click', play);
    card.tabIndex = 0;
    card.addEventListener('focusin', play);
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); play(); }
    });
  });

  // Normalize heights across cards
  requestAnimationFrame(() => {
    const maxCap = captionHeights.length ? Math.max(...captionHeights) : 0;
    const maxLine = lineHeights.length ? Math.max(...lineHeights) : 0;
    document.documentElement.style.setProperty('--stats-caption-h', maxCap ? `${maxCap}px` : 'auto');
    document.documentElement.style.setProperty('--stats-line-h',    maxLine ? `${maxLine}px` : 'auto');
  });

  // Auto-play once when stats come into view (ALWAYS)
  const stats = document.querySelector('.stats');
  if (stats) {
    const animateAll = () => $$('.stat-card .stat-value', stats).forEach(v => startAnim(v));
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { animateAll(); io.disconnect(); }
      }, { threshold: 0.35 });
      io.observe(stats);
    } else {
      // Fallback: if observer unavailable, animate on load
      animateAll();
    }
  }
})();

/* ---------- Departments marquee: measurement-free seamless loop ---------- */
(() => {
  const track = $('.seal-track');
  const row = track ? $('.seal-row') : null;
  if (!track || !row) return;

  // Duplicate the sequence once so the row contains 2× content
  if (!row.dataset.cloned) {
    const originals = Array.from(row.children);
    originals.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      // ensure cloned images paint when they enter from the right
      if (clone.tagName === 'IMG') clone.setAttribute('loading', 'eager');
      row.appendChild(clone);
    });
    row.dataset.cloned = 'true';
  }

  // Reduced motion: pause via CSS (nothing to do here)
  // Hover pause handled by CSS
})();

/* ---------- Enquiry form (demo only) ---------- */
(() => {
  const form = $('#enquiryForm'); if (!form) return;
  const status = $('#enquiryStatus');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (status) {
      status.classList.remove('error', 'success');
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
