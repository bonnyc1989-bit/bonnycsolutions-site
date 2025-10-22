/* =========================================================
   BonnyCsolutions — script.js (final stable release)
   ========================================================= */

/* ---------- Viewport lock for mobile ---------- */
(() => {
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) return;

  const base = 'width=device-width, initial-scale=1, viewport-fit=cover';
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (isTouch) {
    vp.setAttribute('content', base + ', maximum-scale=1, user-scalable=no');
    const prevent = e => e.preventDefault();
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

/* ---------- Footer Year ---------- */
(() => {
  const y = new Date().getFullYear();
  const el = $('#year');
  if (el) el.textContent = y;
})();

/* ---------- ABN Enforcer ---------- */
(() => {
  const el = document.getElementById('abn');
  if (el) el.textContent = '99 690 959 089';
})();

/* ---------- HERO: Infinite Video Loop ---------- */
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

  const conn = navigator.connection || {};
  const saveData = !!conn.saveData;
  const slow = /(^2g$|3g)/.test(conn.effectiveType || '');
  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  if (saveData || slow || mqReduce.matches) return;

  [A, B].forEach(v => {
    v.muted = true;
    v.playsInline = true;
    v.loop = false;
    v.preload = 'metadata';
  });

  const HAVE_FUTURE_DATA = 3;
  const WATCHDOG_MS = 4000;
  const delay = ms => new Promise(r => setTimeout(r, ms));
  const once = (el, ev) => new Promise(r => el.addEventListener(ev, r, { once: true }));

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

  async function playForever() {
    let i = 0;
    let front = A;
    let back  = B;

    await preloadInto(front, i);
    try { front.currentTime = 0; await front.play(); } catch {}
    front.classList.add('is-front');
    await preloadInto(back, i + 1);

    const nudge = () => {
      if (document.hidden || mqReduce.matches) return;
      if (front.paused) front.play().catch(()=>{});
    };
    const nudgeTimer = setInterval(nudge, 4000);

    try {
      for (;;) {
        await once(front, 'ended');
        let ok = back.readyState >= HAVE_FUTURE_DATA || await ready(back);
        if (!ok) { await preloadInto(back, i + 2); }

        try { back.currentTime = 0; await back.play(); } catch {}
        back.classList.add('is-front');
        await delay(140);
        front.classList.remove('is-front');

        [front, back] = [back, front];
        i = (i + 1) % files.length;
        preloadInto(back, i + 1);
      }
    } finally {
      clearInterval(nudgeTimer);
    }
  }

  window.addEventListener('load', () => {
    setTimeout(() => { playForever().catch(()=>{}); }, 700);
  }, { once: true });

  const tryStart = () => { A.play().catch(()=>{}); B.play().then(() => B.pause()).catch(()=>{}); };
  document.addEventListener('touchstart', tryStart, { once: true, passive: true });
  document.addEventListener('click', tryStart, { once: true });
})();

/* ---------- Annual Spend Animation ---------- */
(() => {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const finalFormat = (target, suffix) => {
    if (suffix === 'T') return `$${target.toFixed(1)}T`;
    if (suffix === 'B') {
      const isInt = Number.isInteger(target);
      return `$${isInt ? target.toFixed(0) : target.toFixed(2)}B`;
    }
    return `$${Math.round(target).toLocaleString()}`;
  };
  const COOLDOWN = 1200;
  const animState = new WeakMap();

  $$('.stat-card').forEach(card => {
    const v = $('.stat-value', card);
    const g = $('.stat-ghost', card);
    if (!v || !g) return;

    const target = parseFloat(v.dataset.target || '0');
    const suffix = v.dataset.suffix || '';
    const finalText = finalFormat(target, suffix);

    v.textContent = finalText;
    g.textContent = finalText;

    animState.set(v, { animating: false, lastRun: 0, target, suffix });

    const playHover = () => startAnim(v);
    card.addEventListener('mouseenter', playHover);
    card.addEventListener('click', playHover);
  });

  function startAnim(v) {
    const st = animState.get(v);
    if (!st) return;
    const now = performance.now();
    if (st.animating || (now - st.lastRun) < COOLDOWN) return;
    st.lastRun = now;

    if (mqReduce.matches) { v.textContent = v.dataset.final; return; }

    st.animating = true;
    const target = st.target;
    const suffix = st.suffix;
    const start = now;
    const dur = 900;
    v.textContent = '$0';

    const step = t => {
      const p = Math.min(1, (t - start) / dur);
      const n = target * easeOut(p);
      v.textContent = finalFormat(n, suffix);
      if (p < 1) requestAnimationFrame(step);
      else st.animating = false;
    };
    requestAnimationFrame(step);
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

/* ---------- Department Seals (fixed layout + animation) ---------- */
(() => {
  const track = document.querySelector('.seal-track');
  const row = track ? track.querySelector('.seal-row') : null;
  if (!track || !row) return;

  // Clone once for seamless loop
  if (!row.dataset.cloned) {
    const originals = Array.from(row.children);
    originals.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      row.appendChild(clone);
    });
    row.dataset.cloned = 'true';
  }

  // Respect motion preference
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyRM = () => {
    row.style.animationPlayState = mq.matches ? 'paused' : 'running';
  };
  mq.addEventListener ? mq.addEventListener('change', applyRM) : mq.addListener(applyRM);
  applyRM();
})();

/* ---------- Enquiry Form ---------- */
(() => {
  const form = $('#enquiryForm');
  if (!form) return;
  const status = $('#enquiryStatus');

  form.addEventListener('submit', e => {
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
