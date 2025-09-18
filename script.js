/* =========================================================
   BonnyCsolutions — script.js (final)
   - Gapless 4-video hero loop (requestVideoFrameCallback swap)
   - Stats: hover-only count-up; default = final; no reset; zero-jitter
   - Marquee respects reduced motion
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

  [a, b].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = 'auto';
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

  // prepare first two
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

    if (back.readyState >= 3) doSwap();
    else {
      const handler = () => { back.removeEventListener('canplaythrough', handler); doSwap(); };
      back.addEventListener('canplaythrough', handler, { once: true });
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

  // Reduced motion: freeze
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

/* ---------- Annual Spend: hover-only, no-jitter count-up ---------- */
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

  const animState = new WeakMap(); // stat-value -> { animating, rafId, lastRun, target, suffix }

  // Build ghost + lock dimensions; set final values by default
  const captionHeights = [];
  const lineHeights = [];

  $$('.stat-card').forEach(card => {
    const v = $('.stat-value', card);
    const g = $('.stat-ghost', card);
    const cap = $('.stat-caption', card);
    if (!v || !g) return;

    const target = parseFloat(v.dataset.target || '0');
    const suffix = v.dataset.suffix || '';
    const finalText = finalFormat(target, suffix);

    // show final value by default
    v.textContent = finalText;

    // lock width/height to ghost metrics once
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

    animState.set(v, { animating:false, rafId:0, lastRun:0, target, suffix });

    // Hover-only: replay 0 -> final, then stay final
    const playHover = () => startAnim(v);
    card.addEventListener('mouseenter', playHover);
    card.addEventListener('click', playHover);
  });

  // unify caption & number-line heights across all cards
  requestAnimationFrame(() => {
    const maxCap = captionHeights.length ? Math.max(...captionHeights) : 0;
    const maxLine = lineHeights.length ? Math.max(...lineHeights) : 0;
    document.documentElement.style.setProperty('--stats-caption-h', maxCap ? `${maxCap}px` : 'auto');
    document.documentElement.style.setProperty('--stats-line-h',    maxLine ? `${maxLine}px` : 'auto');
  });

  function startAnim(v){
    const st = animState.get(v);
    if (!st) return;
    const now = performance.now();
    if (st.animating || (now - st.lastRun) < COOLDOWN) return;
    st.lastRun = now;

    if (mqReduce.matches) { v.textContent = v.dataset.final; return; }

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
})();

/* ---------- Marquee: respect reduced motion ---------- */
(() => {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const rows = $$('.seal-row');
  const apply = () => { rows.forEach(r => { r.style.animationPlayState = mq.matches ? 'paused' : 'running'; }); };
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
