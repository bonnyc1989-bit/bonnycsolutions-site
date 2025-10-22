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
  'images/Soldiers.opt.mp4',
  'images/Iwojima.opt.mp4',
  'images/Boots.mp4',
  'images/B1.opt.mp4',
];

const A = document.getElementById('videoA');
const B = document.getElementById('videoB');
if (!A || !B) return;

const conn = navigator.connection || {};
const saveData = !!conn.saveData;
const slow     = /(^2g$|3g)/.test(conn.effectiveType || '');
const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
if (saveData || slow || mqReduce.matches) return;

[A, B].forEach(v => { v.muted = true; v.playsInline = true; v.loop = false; v.preload = 'metadata'; });

const HAVE_FUTURE_DATA = 3;
const WATCHDOG_MS = 4000;
const delay = (ms) => new Promise(r => setTimeout(r, ms));
const once  = (el, ev) => new Promise(r => el.addEventListener(ev, r, { once: true }));

const setSrc = (vid, src) => { if (vid.getAttribute('src') !== src) { try { vid.removeAttribute('src'); vid.load(); } catch {} vid.src = src; try { vid.load(); } catch {} } };

function ready(vid, ms = WATCHDOG_MS) {
  return new Promise(res => {
    if (vid.readyState >= HAVE_FUTURE_DATA) return res(true);
    let done = false;
    const finish = ok => { if (done) return; done = true; clearTimeout(t); clean(); res(ok); };
    const onCan  = () => finish(true);
    const onFail = () => finish(false);
    const clean  = () => { vid.removeEventListener('canplay', onCan); ['error','stalled','abort','emptied'].forEach(ev => vid.removeEventListener(ev, onFail)); };
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

  const nudge = () => { if (document.hidden || mqReduce.matches) return; if (front.paused) front.play().catch(()=>{}); };
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
  } finally { clearInterval(nudgeTimer); }
}

window.addEventListener('load', () => { setTimeout(() => { playForever().catch(()=>{}); }, 700); }, { once: true });
const tryStart = () => { A.play().catch(()=>{}); B.play().then(() => B.pause()).catch(()=>{}); };
document.addEventListener('touchstart', tryStart, { once: true, passive: true });
document.addEventListener('click',      tryStart, { once: true });

const applyMotionPref = () => {
  if (mqReduce.matches) {
    [A, B].forEach(v => { try { v.pause(); v.currentTime = 0; } catch {} });
    A.classList.add('is-front'); B.classList.remove('is-front');
  }
};
mqReduce.addEventListener ? mqReduce.addEventListener('change', applyMotionPref)
                          : mqReduce.addListener(applyMotionPref);
})();

/* ---------- Annual Spend ---------- */
(() => {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const finalFormat = (target, suffix) => suffix === 'T' ? `$${target.toFixed(1)}T` : suffix === 'B' ? `$${target.toFixed(2)}B` : `$${target}`;
  const COOLDOWN = 1200;
  const animState = new WeakMap();

  $$('.stat-card').forEach(card => {
    const v = $('.stat-value', card);
    const g = $('.stat-ghost', card);
    const target = parseFloat(v.dataset.target || '0');
    const suffix = v.dataset.suffix || '';
    v.textContent = finalFormat(target, suffix);
    requestAnimationFrame(() => { g.textContent = v.textContent; });
    animState.set(v, { animating: false, lastRun: 0, target, suffix });

    const startAnim = () => {
      const st = animState.get(v);
      const now = performance.now();
      if (st.animating || (now - st.lastRun) < COOLDOWN) return;
      st.lastRun = now;
      st.animating = true;
      const dur = 900; const start = now;
      v.textContent = '$0';
      const step = (t) => {
        const p = Math.min(1, (t - start) / dur);
        const n = target * easeOut(p);
        v.textContent = suffix === 'T' ? `$${n.toFixed(1)}T` : suffix === 'B' ? `$${n.toFixed(2)}B` : `$${n}`;
        if (p < 1) requestAnimationFrame(step);
        else st.animating = false;
      };
      requestAnimationFrame(step);
    };

    card.addEventListener('mouseenter', startAnim);
    card.addEventListener('focusin', startAnim);
  });
})();

/* ---------- Enquiry form (demo only) ---------- */
(() => {
  const form = document.getElementById('enquiryForm'); if (!form) return;
  const status = document.getElementById('enquiryStatus');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';
    setTimeout(() => { status.textContent = 'Thanks! We’ll be in touch shortly.'; form.reset(); }, 600);
  });
})();
