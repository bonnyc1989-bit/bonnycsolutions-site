/* =========================================
   BonnyCsolutions — script.js (v24)
   - Seamless 4-video background loop (dual video cross-fade)
   - Per-card hover count-up (isolated)
   - Enquiry form helper + footer year
   ========================================= */

/* ---------- Utils ---------- */
const qs = (s, el = document) => el.querySelector(s);
const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

/* ---------- Footer year ---------- */
qs('#year').textContent = new Date().getFullYear();

/* ---------- Enquiry form (basic success/fail) ---------- */
const form = qs('#enquiryForm');
if (form) {
  const status = qs('#enquiryStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';
    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      });
      if (res.ok) {
        status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.';
        status.classList.add('success');
        form.reset();
      } else {
        status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.';
        status.classList.add('error');
      }
    } catch (err) {
      status.textContent = 'Network error. Please try again shortly.';
      status.classList.add('error');
    }
  });
}

/* =========================================
   HERO: seamless loop of 4 videos via dual elements
   ========================================= */
(function setupHeroLoop(){
  const list = [
    'images/Soldiers.mp4',
    'images/Iwojima.mp4',
    'images/Boots.mp4',
    'images/B1.mp4'
  ];

  const vidA = qs('#heroVideoA');
  const vidB = qs('#heroVideoB');
  if (!vidA || !vidB) return;

  // set attributes (muted for autoplay)
  [vidA, vidB].forEach(v => {
    v.muted = true;
    v.loop = false;
    v.playsInline = true;
  });

  let idx = 0;
  let active = vidA;     // currently visible video
  let standby = vidB;    // preloading next

  function source(el, url){
    el.src = url;
    try { el.load(); } catch(_) {}
  }

  function crossfade(){
    active.classList.remove('is-active');
    standby.classList.add('is-active');
    // swap refs
    const tmp = active;
    active = standby;
    standby = tmp;
  }

  function queueNext(){
    const nextIdx = (idx + 1) % list.length;
    source(standby, list[nextIdx]);
  }

  function playCurrent(){
    source(active, list[idx]);
    // when active reaches end, crossfade and advance
    active.onended = () => {
      // small guard: if readyState is low, delay briefly
      crossfade();
      idx = (idx + 1) % list.length;
      // after crossfade, make sure the newly-visible "active" continues
      active.play().catch(()=>{});
      // prepare the following clip
      queueNext();
    };

    // start playback
    active.play().then(()=>{
      // preload the very next clip immediately
      queueNext();
      // show the first video
      active.classList.add('is-active');
    }).catch(()=>{
      // Autoplay blocked — show panel and wait for a user action
      console.warn('Autoplay blocked; video will begin after user interacts.');
      const resume = () => {
        active.play().then(()=>{
          active.classList.add('is-active');
          queueNext();
          window.removeEventListener('pointerdown', resume);
          window.removeEventListener('keydown', resume);
        }).catch(()=>{});
      };
      window.addEventListener('pointerdown', resume);
      window.addEventListener('keydown', resume);
    });
  }

  playCurrent();
})();

/* =========================================
   STATS: per-card hover count-up (independent)
   ========================================= */
(function setupStats(){
  // quick sanity: ensure page contains the section header (already checked true by you)
  if (!/Annual\s+Spend\s+2025/i.test(document.body.textContent)) return;

  const cards = qsa('.card.stat');
  if (!cards.length) return;

  // format number with up to 2 decimals, trimming trailing zeros
  function format(n){
    const s = n.toFixed(2);
    return s.replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
  }

  cards.forEach(card => {
    const valueEl = qs('.stat-value', card);
    const suffixEl = qs('.stat-suffix', card);
    const target = parseFloat(card.dataset.target);
    const suffix = card.dataset.suffix || '';

    // ensure suffix shows correctly even before hover
    if (suffixEl) suffixEl.textContent = suffix;

    let animId = null;

    function animate(){
      cancelAnimationFrame(animId);
      const duration = 900; // ms per hover
      const start = performance.now();

      function tick(t){
        const p = Math.min(1, (t - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const current = target * eased;
        valueEl.textContent = format(current);
        if (p < 1) {
          animId = requestAnimationFrame(tick);
        }
      }
      animId = requestAnimationFrame(tick);
    }

    // restart from 0 on each hover
    card.addEventListener('mouseenter', () => {
      valueEl.textContent = '0';
      animate();
    });
  });
})();

