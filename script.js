// BonnyCsolutions — script.js (v33)
// - Footer year
// - Animated counters (independent hover replay) with better spacing handled in CSS
// - Netlify AJAX form
// - HERO: double-buffered playlist for gapless playback
(function () {
  // Footer year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Animated stats ----------
  const animateCount = (el) => {
    const to = parseFloat(el.getAttribute('data-count-to') || '0');
    const decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    const suffix = el.getAttribute('data-suffix') || '';
    const prefix = el.getAttribute('data-prefix') || '';
    const dur = 1200;
    const fmt = (n) => n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = `${prefix}${fmt(to * eased)}${suffix}`;
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const statObserver = ('IntersectionObserver' in window)
    ? new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { animateCount(e.target); statObserver.unobserve(e.target); }
        });
      }, { threshold: 0.6 })
    : null;

  document.querySelectorAll('.stat-value').forEach(el => {
    if (statObserver) statObserver.observe(el); else animateCount(el);
  });

  document.querySelectorAll('.stat').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const val = card.querySelector('.stat-value');
      if (!val) return;
      val.textContent = '0';
      animateCount(val);
    });
  });

  // ---------- Netlify AJAX form ----------
  const form = document.getElementById('enquiryForm');
  const status = document.getElementById('enquiryStatus');
  const encode = (data) => new URLSearchParams(data).toString();

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (status) { status.textContent = 'Sending…'; status.className = 'enquiry-status'; }
      const formData = new FormData(form);
      if (formData.get('bot-field')) { if (status) { status.textContent = 'Submission blocked.'; status.classList.add('error'); } return; }

      try {
        await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encode({ 'form-name': form.getAttribute('name') || 'enquiry', ...Object.fromEntries(formData.entries()) })
        });
        if (status) { status.textContent = 'Thanks — we’ll be in touch within 1–3 business days.'; status.classList.add('success'); }
        form.reset();
      } catch (err) {
        if (status) { status.textContent = 'Something went wrong. Please email info@bonnycsolutions.com.'; status.classList.add('error'); }
        console.error(err);
      }
    });
  }

  // ---------- HERO: double-buffered playlist for gapless playback ----------
  const vA = document.getElementById('heroA');
  const vB = document.getElementById('heroB');

  if (vA && vB) {
    const playlist = ["Soldiers.mp4", "Iwojima.mp4", "Boots.mp4", "B1.mp4"];
    let i = 0;         // current index of visible clip
    let active = 0;    // 0 -> vA active; 1 -> vB active
    const vids = [vA, vB];
    const NEAR_END_SEC = 0.20; // pre-start next ~200ms early

    const load = (el, file) => new Promise((resolve, reject) => {
      const cleanup = () => { el.removeEventListener('canplaythrough', onCan); el.removeEventListener('error', onErr); clearTimeout(tid); };
      const onCan = () => { cleanup(); resolve(); };
      const onErr = () => { cleanup(); reject(new Error('video load error')); };
      const tid = setTimeout(() => { cleanup(); reject(new Error('video load timeout')); }, 6000);

      el.pause(); el.removeAttribute('src'); el.load();
      el.src = `images/${file}`; el.muted = true; el.playsInline = true; el.preload = 'auto';
      el.addEventListener('canplaythrough', onCan, { once: true });
      el.addEventListener('error', onErr, { once: true });
    });

    const swap = () => {
      const cur = vids[active];
      const nxt = vids[1 - active];
      cur.classList.remove('active');
      nxt.classList.add('active');
      setTimeout(() => { cur.pause(); cur.currentTime = 0; }, 50);
      active = 1 - active;
    };

    let prestarted = false;
    const onTimeUpdate = () => {
      const cur = vids[active];
      const nxt = vids[1 - active];
      if (!cur.duration || isNaN(cur.duration)) return;
      if (!prestarted && (cur.duration - cur.currentTime) <= NEAR_END_SEC) {
        prestarted = true;
        const p = nxt.play?.(); if (p && typeof p.then === 'function') p.catch(() => {});
      }
    };

    const onEnded = async () => {
      swap();
      prestarted = false;
      i = (i + 1) % playlist.length; // prepare following clip on hidden element
      const hidden = vids[1 - active];
      const nextFile = playlist[(i + 1) % playlist.length];
      try { await load(hidden, nextFile); hidden.pause(); hidden.currentTime = 0; } catch {}
      attachHandlers();
    };

    const detachHandlers = () => {
      vids[active].removeEventListener('timeupdate', onTimeUpdate);
      vids[active].removeEventListener('ended', onEnded);
    };
    const attachHandlers = () => {
      detachHandlers();
      vids[active].addEventListener('timeupdate', onTimeUpdate);
      vids[active].addEventListener('ended', onEnded);
    };

    (async () => {
      await load(vids[active], playlist[i]);
      vids[active].classList.add('active');
      vids[active].play().catch(() => {});
      const hidden = vids[1 - active];
      const nextFile = playlist[(i + 1) % playlist.length];
      try { await load(hidden, nextFile); hidden.pause(); hidden.currentTime = 0; } catch {}
      attachHandlers();
    })();
  }
})();
