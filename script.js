/* ========= helpers ========= */
const qs  = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => Array.from(el.querySelectorAll(s));

/* footer year */
const y = qs('#year'); if (y) y.textContent = new Date().getFullYear();

/* enquiry form */
const form = qs('#enquiryForm');
if (form) {
  const status = qs('#enquiryStatus');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.textContent = 'Sending…';
    try {
      const fd = new FormData(form);
      const res = await fetch(form.action, { method:'POST', headers:{Accept:'application/json'}, body: fd });
      if (res.ok) {
        status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.';
        status.classList.add('success'); form.reset();
      } else {
        status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.';
        status.classList.add('error');
      }
    } catch {
      status.textContent = 'Network error. Please try again shortly.'; status.classList.add('error');
    }
  });
}

/* ========= HERO: seamless 4-video loop (dual cross-fade) ========= */
(function heroLoop(){
  const files = ['images/Soldiers.mp4','images/Iwojima.mp4','images/Boots.mp4','images/B1.mp4'];
  const A = qs('#heroVideoA'), B = qs('#heroVideoB'); if (!A || !B) return;
  [A,B].forEach(v => { v.muted = true; v.loop = false; v.playsInline = true; });

  let i = 0, active = A, standby = B;

  function setSrc(v, url){ v.src = url; try{ v.load(); }catch{} }
  function swap(){ active.classList.remove('is-active'); standby.classList.add('is-active'); const t = active; active = standby; standby = t; }
  function queue(){ const n=(i+1)%files.length; setSrc(standby, files[n]); }

  function start(){
    setSrc(active, files[i]);
    active.onended = () => { swap(); i=(i+1)%files.length; active.play().catch(()=>{}); queue(); };
    active.play().then(()=>{ queue(); active.classList.add('is-active'); })
      .catch(()=>{ const go=()=>{ active.play().then(()=>{active.classList.add('is-active');queue();}); window.removeEventListener('pointerdown',go); window.removeEventListener('keydown',go); }; window.addEventListener('pointerdown',go); window.addEventListener('keydown',go); });
  }
  start();
})();

/* ========= STATS: independent hover count-up ========= */
(function stats(){
  if (!/Annual\s+Spend\s+2025/i.test(document.body.textContent)) return;
  const cards = qsa('.card.stat'); if (!cards.length) return;
  const fmt = n => n.toFixed(2).replace(/\.00$/,'').replace(/(\.\d)0$/, '$1');

  cards.forEach(c=>{
    const vEl = qs('.stat-value', c);
    const target = parseFloat(c.dataset.target);
    let raf;
    c.addEventListener('mouseenter', ()=>{
      cancelAnimationFrame(raf);
      vEl.textContent = '0';
      const dur = 900, t0 = performance.now();
      const tick = t=>{
        const p = Math.min(1, (t - t0)/dur);
        const eased = 1 - Math.pow(1-p,3);
        vEl.textContent = fmt(target*eased);
        if (p<1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });
  });
})();
