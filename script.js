/* =========================================================
   BonnyCsolutions — script.js (hardened)
   - Gapless 4-video hero loop; no early bail on Save-Data
   - Stats: on-view auto + hover/focus; RM-friendly; IO fallback
   - Departments marquee: fixed, measured, RM-aware
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

  // Do NOT bail out on Save-Data; just lighten preload
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

  // Ensure first two are correct (HTML provides a fallback already)
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

  // Autoplay nudge (iOS/Safari) — also covers Save-Data users who click
  const tryStart = () => {
    a.play().catch(()=>{});
    b.play().then(() => b.pause()).catch(()=>{});
  };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click', tryStart, { once: true });

  // Reduced motion: freeze on first frame
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

/* ---------- Annual Spend: on-view + hover/focus; RM-friendly ---------- */
(() => {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
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

  const COOLDOWN = 1200;
  const animState = new WeakMap(); // v -> { animating, rafId, lastRun, target, suffix }

  const captionHeights = [];
  const lineHeights = [];

  function startAnim(v, respectRM = false) {
    const st = animState.get(v);
    if (!st) return;
    const now = performance.now();

    // If we're auto-playing and RM is on, show final but don't animate.
    if (respectRM && mqReduce.matches) { v.textContent = v.dataset.final; return; }

    if (st.animating || (now - st.lastRun) < COOLDOWN) return;
    st.lastRun = now;

    st.animating = true;
    const target = parseFloat(v.dataset.targetNum || '0');
    const suffix = v.dataset.suffix || '';
    const start = now;
    const dur = 900;

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

    // show final value by default
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

    const playHover = () => startAnim(v, /* respectRM */ false);

    // Pointer, keyboard, and touch activation
    card.addEventListener('mouseenter', playHover);
    card.addEventListener('click', playHover);
    card.tabIndex = 0;
    card.addEventListener('focusin', playHover);
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); playHover(); }
    });
  });

  // Normalize heights across cards
  requestAnimationFrame(() => {
    const maxCap = captionHeights.length ? Math.max(...captionHeights) : 0;
    const maxLine = lineHeights.length ? Math.max(...lineHeights) : 0;
    document.documentElement.style.setProperty('--stats-caption-h', maxCap ? `${maxCap}px` : 'auto');
    document.documentElement.style.setProperty('--stats-line-h',    maxLine ? `${maxLine}px` : 'auto');
  });

  // Auto-play once when stats come into view; respect RM.
  const stats = document.querySelector('.stats');
  if (stats) {
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) {
          $$('.stat-card .stat-value', stats).forEach(v => startAnim(v, /* respectRM */ true));
          io.disconnect();
        }
      }, { threshold: 0.35 });
      io.observe(stats);
    } else {
      // Fallback: auto-play on load if RM is off
      if (!mqReduce.matches) {
        $$('.stat-card .stat-value', stats).forEach(v => startAnim(v, /* respectRM */ false));
      }
    }
  }
})();

/* ---------- Departments marquee: seamless, responsive, reduced-motion aware ---------- */
(() => {
  const track = $('.seal-track');
  const row = track ? $('.seal-row', track) : null;
  if (!track || !row) return;

  // Duplicate the sequence once for seamless looping
  if (!row.dataset.cloned) {
    const originals = Array.from(row.children);
    originals.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.appendChild(clone);
    });
    row.dataset.cloned = 'true';
    row.dataset.originalCount = String(originals.length);
  }

  const computeAndApply = () => {
    // Measure real width of the original set for accuracy
    const originalsCount = parseInt(row.dataset.originalCount || '0', 10) || (row.children.length / 2) || 1;
    let contentWidth = 0;
    for (let i = 0; i < originalsCount; i++) {
      contentWidth += row.children[i].getBoundingClientRect().width;
    }
    // Add gap width (flex gap isn't part of offsetWidth)
    const styles = getComputedStyle(document.documentElement);
    const gap  = parseFloat(styles.getPropertyValue('--seal-gap')) || 56;
    contentWidth += Math.max(0, originalsCount - 1) * gap;

    row.style.setProperty('--scroll-width', `${Math.ceil(contentWidth)}px`);

    // Restart animation cleanly
    row.classList.remove('marquee');
    // eslint-disable-next-line no-unused-expressions
    row.offsetHeight;
    row.classList.add('marquee');
  };

  computeAndApply();
  window.addEventListener('resize', computeAndApply);

  // Reduced motion: pause (do not remove animation entirely)
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyRM = () => { row.style.animationPlayState = mq.matches ? 'paused' : 'running'; };
  mq.addEventListener ? mq.addEventListener('change', applyRM) : mq.addListener(applyRM);
  applyRM();

  // Hover pause handled by CSS (.seal-track:hover .seal-row)
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
--END SCRIPT--
