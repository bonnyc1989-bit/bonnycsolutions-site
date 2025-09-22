/* =========================================================
   BonnyCsolutions — script.js (with mobile viewport lock)
   ========================================================= */

/* ---------- Viewport: lock zoom on touch devices, keep desktop flexible ---------- */
(() => {
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) return;

  const base = 'width=device-width, initial-scale=1, viewport-fit=cover';
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (isTouch) {
    vp.setAttribute('content', base + ', maximum-scale=1, user-scalable=no');
    const prevent = (e) => { e.preventDefault(); };
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(t =>
      document.addEventListener(t, prevent, { passive: false })
    );
  } else {
    vp.setAttribute('content', base);
  }

  window.addEventListener('orientationchange', () => {
    const touchNow = window.matchMedia('(pointer: coarse)').matches;
    vp.setAttribute('content', base + (touchNow ? ', maximum-scale=1, user-scalable=no' : ''));
  });
})();

/* ---------- Utils ---------- */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Footer year ---------- */
(() => { const y = new Date().getFullYear(); const el = $('#year'); if (el) el.textContent = y; })();

/* ---------- HERO: robust, gapless 4‑video loop with watchdog & skips ---------- */
(() => {
  const playlist = [
    'images/Soldiers.mp4',
    'images/Iwojima.mp4',
    'images/Boots.mp4',
    'images/B1.mp4',
  ];

  const a = document.getElementById('videoA');
  const b = document.getElementById('videoB');
  if (!a || !b) return;

  // Respect user/data conditions (poster only in these cases)
  const conn = navigator.connection || {};
  const saveData = !!conn.saveData;
  const slow = /(^2g$|3g)/.test(conn.effectiveType || '');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (saveData || slow || mqReduce.matches) return;

  // Base setup
  [a, b].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = 'metadata';
  });

  let cur = 0;
  let front = a;
  let back = b;

  const HAVE_FUTURE_DATA = 3;      // readyState threshold
  const SWAP_EARLY_SEC = 0.18;     // swap ~180ms before the end for gapless feel
  const WATCHDOG_MS   = 1200;      // if next video isn't ready in ~1.2s, skip it

  const setSrc = (el, src) => {
    if (el.getAttribute('src') !== src) {
      try { el.removeAttribute('src'); el.load(); } catch {}
      el.src = src;
      try { el.load(); } catch {}
    }
  };
  const nextIndex = () => (cur + 1) % playlist.length;

  // Load a target index into an element and call cb(true|false) with a watchdog
  const loadInto = (el, idx, cb) => {
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      el.removeEventListener('canplay', onCan);
      ['error', 'stalled', 'abort'].forEach(ev => el.removeEventListener(ev, onFail));
      cb(ok);
    };
    const onCan  = () => finish(true);
    const onFail = () => finish(false);
    const timer  = setTimeout(onFail, WATCHDOG_MS);

    setSrc(el, playlist[idx]);
    if (el.readyState >= HAVE_FUTURE_DATA) return onCan();
    el.addEventListener('canplay', onCan, { once: true });
    ['error', 'stalled', 'abort'].forEach(ev => el.addEventListener(ev, onFail, { once: true }));
  };

  // Preload first + second, then play
  const primeStart = () => {
    loadInto(front, 0, () => {
      try { front.currentTime = 0; front.play(); } catch {}
      front.classList.add('is-front');
    });
    loadInto(back, 1 % playlist.length, () => {});
  };

  // Preload the clip after `idx` into `back`, skipping any that fail
  const preloadNextAfter = (idx) => {
    const target = (idx + 1) % playlist.length;
    loadInto(back, target, ok => {
      if (!ok) {
        // Skip a bad one and move to the next; keep trying once
        const skip = (target + 1) % playlist.length;
        loadInto(back, skip, () => {});
      }
    });
  };

  // Swap to back (which should be preloaded); if not ready, wait with watchdog/skip
  const doSwap = () => {
    const go = () => {
      try { back.currentTime = 0; back.play(); } catch {}
      back.classList.add('is-front');

      setTimeout(() => {
        front.classList.remove('is-front');
        [front, back] = [back, front];
        cur = nextIndex();
        preloadNextAfter(cur);       // prepare the following clip
      }, 160);
    };

    if (back.readyState >= HAVE_FUTURE_DATA) go();
    else {
      // ensure readiness (with timeout/skip); then go
      const idx = nextIndex();
      loadInto(back, idx, () => go());
    }
  };

  // Watch the current (front) video and request an early swap
  const useRvfc = typeof front.requestVideoFrameCallback === 'function';
  const watchFront = () => {
    if (useRvfc) {
      const tick = (_, meta) => {
        const t = meta?.mediaTime ?? front.currentTime ?? 0;
        const remain = (front.duration || 0) - t;
        if (remain > 0 && remain <= SWAP_EARLY_SEC) doSwap();
        else front.requestVideoFrameCallback(tick);
      };
      front.requestVideoFrameCallback(tick);
    } else {
      const onTime = () => {
        const remain = (front.duration || 0) - (front.currentTime || 0);
        if (remain > 0 && remain <= SWAP_EARLY_SEC) {
          front.removeEventListener('timeupdate', onTime);
          doSwap();
        }
      };
      a.removeEventListener('timeupdate', onTime);
      b.removeEventListener('timeupdate', onTime);
      front.addEventListener('timeupdate', onTime);
    }
  };

  // Kick off after first paint work to protect LCP
  window.addEventListener('load', () => {
    setTimeout(() => {
      primeStart();
      watchFront();
    }, 800);
  }, { once: true });

  // Resume/pause if motion preference flips at runtime
  const applyMotionPref = () => {
    if (mqReduce.matches) {
      [a, b].forEach(v => { try { v.pause(); v.currentTime = 0; } catch {} });
      a.classList.add('is-front');
      b.classList.remove('is-front');
    } else {
      try { front.play(); } catch {}
    }
  };
  mqReduce.addEventListener ? mqReduce.addEventListener('change', applyMotionPref)
                             : mqReduce.addListener(applyMotionPref);

  // User gesture unlock (some browsers gate autoplay even when muted)
  const tryStart = () => {
    a.play().catch(()=>{});
    b.play().then(() => b.pause()).catch(()=>{});
  };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click',      tryStart, { once: true });
})();

/* ---------- Annual Spend: on-view + hover replay ---------- */
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
  const animState = new WeakMap();

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

    const playHover = () => startAnim(v);
    card.addEventListener('mouseenter', playHover);
    card.addEventListener('click', playHover);
    card.addEventListener('focusin', playHover);
  });

  requestAnimationFrame(() => {
    const maxCap = captionHeights.length ? Math.max(...captionHeights) : 0;
    const maxLine = lineHeights.length ? Math.max(...lineHeights) : 0;
    document.documentElement.style.setProperty('--stats-caption-h', maxCap ? `${maxCap}px` : 'auto');
    document.documentElement.style.setProperty('--stats-line-h',    maxLine ? `${maxLine}px` : 'auto');
  });

  function startAnim(v) {
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

  const statsSection = document.getElementById('spend');
  if (statsSection && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          $$('.stat-card .stat-value', statsSection).forEach(v => startAnim(v));
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    io.observe(statsSection);
  }
})();

/* ---------- Departments marquee: duplicate once for seamless loop ---------- */
(() => {
  const track = $('.seal-track');
  const row = track ? $('.seal-row', track) : null;
  if (!track || !row) return;

  if (!row.dataset.cloned) {
    const originals = Array.from(row.children);
    originals.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.appendChild(clone);
    });
    row.dataset.cloned = 'true';
  }

  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyRM = () => { row.style.animationPlayState = mq.matches ? 'paused' : 'running'; };
  mq.addEventListener ? mq.addEventListener('change', applyRM) : mq.addListener(applyRM);
  applyRM();
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

    const hp = (new FormData(form)).get('hp');
    if (hp) {
      if (status) {
        status.textContent = 'Something went wrong.';
        status.className = 'enquiry-status error';
      }
      return;
    }

    setTimeout(() => {
      if (status) {
        status.textContent = 'Thanks! We’ll be in touch shortly.';
        status.className = 'enquiry-status success';
      }
      form.reset();
    }, 600);
  });
})();
