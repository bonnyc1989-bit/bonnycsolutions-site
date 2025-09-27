/* =========================================================
   BonnyCsolutions — script.js (stable infinite hero loop)
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

/* ---------- HERO: robust infinite 4-video loop ---------- */
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

  // Respect user/data conditions -> show posters only
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

  // Helpers
  const HAVE_FUTURE_DATA = 3;
  const WATCHDOG_MS = 4000; // give slow networks a bit more room
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  const once  = (el, ev) => new Promise(r => el.addEventListener(ev, r, { once: true }));

  const setSrc = (vid, src) => {
    if (vid.getAttribute('src') !== src) {
      try { vid.removeAttribute('src'); vid.load(); } catch {}
      vid.src = src;
      try { vid.load(); } catch {}
    }
  };

  function ready(vid, ms = WATCHDOG_MS) {
    return new Promise(res => {
      if (vid.readyState >= HAVE_FUTURE_DATA) return res(true);
      let done = false;
      const finish = ok => { if (done) return; done = true; clearTimeout(t); clean(); res(ok); };
      const onCan  = () => finish(true);
      const onFail = () => finish(false);
      const clean  = () => {
        vid.removeEventListener('canplay', onCan);
        ['error','stalled','abort','emptied'].forEach(ev => vid.removeEventListener(ev, onFail));
      };
      vid.addEventListener('canplay', onCan, { once: true });
      ['error','stalled','abort','emptied'].forEach(ev => vid.addEventListener(ev, onFail, { once: true }));
      const t = setTimeout(onFail, ms);
    });
  }

  async function preloadInto(vid, srcIdx) {
    const src = files[(srcIdx + files.length) % files.length];
    setSrc(vid, src);
    const ok = await ready(vid);
    return ok;
  }

  // Loop driver: preload next, play current, await ended, swap, repeat
  async function playForever() {
    let i = 0;
    let front = A;
    let back  = B;

    // Initial prime: current + next
    await preloadInto(front, i);
    try { front.currentTime = 0; await front.play(); } catch {}
    front.classList.add('is-front');
    await preloadInto(back, i + 1);

    // Keep nudging playback occasionally (browsers sometimes pause muted media)
    const nudge = () => {
      if (document.hidden || mqReduce.matches) return;
      if (front.paused) front.play().catch(()=>{});
    };
    const nudgeTimer = setInterval(nudge, 4000);

    try {
      for (;;) {
        // Wait until the current clip ends
        await once(front, 'ended');

        // Ensure the next is ready (if not, wait; if it fails, skip once)
        let ok = back.readyState >= HAVE_FUTURE_DATA || await ready(back);
        if (!ok) { await preloadInto(back, i + 2); } // skip a troubled file

        // Play the back clip and bring it to front
        try { back.currentTime = 0; await back.play(); } catch {}
        back.classList.add('is-front');
        await delay(140);
        front.classList.remove('is-front');

        // Rotate
        [front, back] = [back, front];
        i = (i + 1) % files.length;

        // Start preloading the following clip
        preloadInto(back, i + 1);
      }
    } finally {
      clearInterval(nudgeTimer);
    }
  }

  // Start after paint to protect LCP
  window.addEventListener('load', () => {
    setTimeout(() => { playForever().catch(()=>{}); }, 700);
  }, { once: true });

  // Autoplay gesture unlock
  const tryStart = () => { A.play().catch(()=>{}); B.play().then(() => B.pause()).catch(()=>{}); };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click',      tryStart, { once: true });

  // Respect reduced-motion toggled while the page is open
  const applyMotionPref = () => {
    if (mqReduce.matches) {
      [A, B].forEach(v => { try { v.pause(); v.currentTime = 0; } catch {} });
      A.classList.add('is-front');
      B.classList.remove('is-front');
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
      const n = target * (1 - Math.pow(1 - p, 3));
      v.textContent = (suffix === 'T') ? `$${n.toFixed(1)}T`
                  : (suffix === 'B') ? `$${n.toFixed(Number.isInteger(target) ? 0 : 2)}B`
                  : `$${Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
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
