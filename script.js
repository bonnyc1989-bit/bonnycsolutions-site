/* ----------------------------
   Annual Spend 2025 – count-up
-----------------------------*/
(function () {
  const cards = document.querySelectorAll('.stat-card');       // each box
  const values = document.querySelectorAll('.stat-card .stat-value'); // the $7.0T text

  if (!cards.length || !values.length) return;

  // Parse current text like "$58.8B" -> {num:58.8, suffix:"B"}
  values.forEach(el => {
    const m = el.textContent.trim().match(/\$?\s*([\d.,]+)\s*([BT])/i);
    if (m) {
      el.dataset.target = m[1].replace(/,/g, '');
      el.dataset.suffix = m[2].toUpperCase();     // B or T
      // Keep how many decimals were in the original (e.g., 1 for 58.8, 2 if 64.81)
      const decMatch = m[1].split('.')[1];
      el.dataset.decimals = decMatch ? decMatch.length : 0;
    }
  });

  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  function runCount(el, { duration = 1200 } = {}) {
    // Stop any previous run on this element
    if (el._raf) cancelAnimationFrame(el._raf);

    const target = parseFloat(el.dataset.target || '0');
    const suffix  = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimals || '0', 10);

    const start  = performance.now();
    const from   = 0;

    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const v = from + (target - from) * easeOutCubic(t);
      el.textContent = `$${v.toFixed(decimals)}${suffix}`;
      if (t < 1) {
        el._raf = requestAnimationFrame(tick);
      } else {
        el.textContent = `$${target.toFixed(decimals)}${suffix}`;
      }
    }
    el._raf = requestAnimationFrame(tick);
  }

  // Start once when the boxes first come into view
  const once = new IntersectionObserver((entries) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (isIntersecting && !target.dataset.played) {
        const valueEl = target.querySelector('.stat-value');
        if (valueEl) runCount(valueEl);
        target.dataset.played = '1';
      }
    });
  }, { threshold: 0.35 });

  cards.forEach(card => once.observe(card));

  // Replay only the hovered box
  cards.forEach(card => {
    const valueEl = card.querySelector('.stat-value');
    if (!valueEl) return;
    card.addEventListener('mouseenter', () => runCount(valueEl, { duration: 900 }));
  });
})();
