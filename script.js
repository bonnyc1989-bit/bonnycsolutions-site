/* =========================================================
   BonnyCsolutions — script.js (stable hero playlist)
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
const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------- Footer year ---------- */
(() => { const y = new Date().getFullYear(); const el = $('#year'); if (el) el.textContent = y; })();

/* ---------- HERO: stable 4‑video loop (preload + swap on `ended`) ---------- */
(() => {
  const files = [
    'images/Soldiers.mp4',
    'images/Iwojima.mp4',
    'images/Boots.mp4',
    'images/B1.mp4',
  ];

  const A = document.getElementById('videoA');
  const B = document.getElementById('videoB');
  if (!A || !B) return;

  // Respect user/data conditions -> posters only
  const conn = navigator.connection || {};
  const saveData = !!conn.saveData;
  const slow     = /(^2g$|3g)/.test(conn.effectiveType || '');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (saveData || slow || mqReduce.matches) return;

  // Base video setup
  [A, B].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = 'metadata';
  });

  let i = 0;
  let front = A;
  let back  = B;
  const HAVE_FUTURE_DATA = 3; // readyState >= 3 means "good to play"
  const WATCHDOG_MS = 1500;   // don’t wait forever to preload the next

  const setSrc = (vid, src) => {
    if (vid.getAttribute('src') !== src) {
      try { vid.removeAttribute('src'); vid.load(); } catch {}
      vid.src = src;
      try { vid.load(); } catch {}
    }
  };

  // Return a promise that resolves true/false if clip is ready (or failed/timed out)
  function ready(vid, ms = WATCHDOG_MS) {
    return new Promise(res => {
      let done = false;
      const finish = ok => {
        if (done) return;
        done = true;
        clearTimeout(t);
        vid.removeEventListener('canplay', onCan);
        ['error','stalled','abort','emptied'].forEach(ev => vid.removeEventListener(ev, onFail));
        res(ok);
      };
      const onCan  = () => finish(true);
      const onFail = () => finish(false);

      if (vid.readyState >= HAVE_FUTURE_DATA) return finish(true);
      vid.addEventListener('canplay', onCan, { once: true });
      ['error','stalled','abort','emptied'].forEach(ev => vid.addEventListener(ev, onFail, { once: true }));
      const t = setTimeout(onFail, ms);
    });
  }

  // Preload `srcIdx` into `vid`, resolving when it’s can‑play‑ready (or skip if it fails)
  async function preloadInto(vid, srcIdx) {
    const src = files[srcIdx % files.length];
    setSrc(vid, src);
    const ok = await ready(vid);
    return ok;
  }

  // One‑time prime of first + second clips
  async function prime() {
    // Prepare the first clip into front and play
    await preloadInto(front, i);
    try { front.currentTime = 0; front.play(); } catch {}
    front.classList.add('is-front');

    // Prepare the next into back (keep paused)
    await preloadInto(back, (i + 1) % files.length);

    // Safety: handle swap on ended
    front.onended = onEnded;
  }

  // Swap when the current (front) ends
  async function onEnded() {
    // Play the preloaded back
    try { back.currentTime = 0; back.play(); } catch {}
    back.classList.add('is-front');

    // Small class swap delay feels smoother
    setTimeout(async () => {
      front.classList.remove('is-front');

      // Rotate refs
      [front, back] = [back, front];
      front.onended = onEnded;  // re‑arm

      // Advance index and start preloading the following clip
      i = (i + 1) % files.length;

      // Try the next; if it fails once, skip forward one more
      let ok = await preloadInto(back, (i + 1) % files.length);
      if (!ok) ok = await preloadInto(back, (i + 2) % files.length);
      // If even that failed, we still keep looping the ones that do work.
    }, 140);
  }

  // Start after paint to protect LCP
  window.addEventListener('load', () => {
    setTimeout(() => { prime().catch(()=>{}); }, 700);
  }, { once: true });

  // Autoplay gesture unlock (some browsers still require it even when muted)
  const tryStart = () => {
    A.play().catch(()=>{});
    B.play().then(() => B.pause()).catch(()=>{});
  };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click',      tryStart, { once: true });

  // Respect reduced‑motion if toggled while on page
  const applyMotionPref = () => {
    if (mqReduce.matches) {
      [A, B].forEach(v => { try { v.pause(); v.currentTime = 0; } catch {} });
      A.classList.add('is-front');
      B.classList.remove('is-front');
    } else {
      try { front.play(); } catch {}
    }
  };
  mqReduce.addEventListener ? mqReduce.addEventListener('change', applyMotionPref)
                            : mqReduce.addListener(applyMotionPref);
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
