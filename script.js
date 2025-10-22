/* =========================================================
   BonnyCsolutions — script.js (stable infinite hero loop)
   ========================================================= */

/* ---------- Viewport control ---------- */
(() => {
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) return;
  const base = 'width=device-width, initial-scale=1, viewport-fit=cover';
  const isTouch = window.matchMedia('(pointer: coarse)').matches;

  if (isTouch) {
    vp.setAttribute('content', base + ', maximum-scale=1, user-scalable=no');
    const prevent = e => e.preventDefault();
    ['gesturestart','gesturechange','gestureend'].forEach(t =>
      document.addEventListener(t, prevent, { passive:false })
    );
  } else vp.setAttribute('content', base);

  window.addEventListener('orientationchange', () => {
    const touchNow = window.matchMedia('(pointer: coarse)').matches;
    vp.setAttribute('content', base + (touchNow ? ', maximum-scale=1, user-scalable=no' : ''));
  });
})();

/* ---------- Helpers ---------- */
const $  = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ---------- Footer year ---------- */
(() => { const y=new Date().getFullYear(); const el=$('#year'); if(el) el.textContent=y; })();

/* ---------- ABN ---------- */
(() => { const el=document.getElementById('abn'); if(el) el.textContent='99 690 959 089'; })();

/* ---------- HERO loop ---------- */
(() => {
  const files=['images/Soldiers.mp4','images/Iwojima.mp4','images/Boots.mp4','images/B1.mp4'];
  const A=document.getElementById('videoA');
  const B=document.getElementById('videoB');
  if(!A||!B) return;

  const conn=navigator.connection||{};
  const save=!!conn.saveData;
  const slow=/(^2g$|3g)/.test(conn.effectiveType||'');
  const mq=matchMedia('(prefers-reduced-motion: reduce)');
  if(save||slow||mq.matches) return;

  [A,B].forEach(v=>{v.muted=true;v.playsInline=true;v.loop=false;v.preload='metadata';});
  const HAVE=3, WATCHDOG=4000;
  const delay=ms=>new Promise(r=>setTimeout(r,ms));
  const once=(el,ev)=>new Promise(r=>el.addEventListener(ev,r,{once:true}));
  const setSrc=(vid,src)=>{
    if(vid.getAttribute('src')!==src){
      try{vid.removeAttribute('src');vid.load();}catch{}
      vid.src=src; try{vid.load();}catch{}
    }
  };
  const ready=(vid,ms=WATCHDOG)=>new Promise(res=>{
    if(vid.readyState>=HAVE) return res(true);
    let done=false;
    const finish=ok=>{if(done)return;done=true;clearTimeout(t);clean();res(ok);};
    const onCan=()=>finish(true), onFail=()=>finish(false);
    const clean=()=>{vid.removeEventListener('canplay',onCan);
      ['error','stalled','abort','emptied'].forEach(e=>vid.removeEventListener(e,onFail));};
    vid.addEventListener('canplay',onCan,{once:true});
    ['error','stalled','abort','emptied'].forEach(e=>vid.addEventListener(e,onFail,{once:true}));
    const t=setTimeout(onFail,ms);
  });
  const preloadInto=async(vid,i)=>{
    const src=files[(i+files.length)%files.length];
    setSrc(vid,src);
    const ok=await ready(vid);
    return ok;
  };

  async function playForever(){
    let i=0,front=A,back=B;
    await preloadInto(front,i);
    try{front.currentTime=0;await front.play();}catch{}
    front.classList.add('is-front');
    await preloadInto(back,i+1);

    const nudge=()=>{if(document.hidden||mq.matches)return;
      if(front.paused)front.play().catch(()=>{});};
    const timer=setInterval(nudge,4000);

    try{
      for(;;){
        await once(front,'ended');
        let ok=back.readyState>=HAVE||await ready(back);
        if(!ok) await preloadInto(back,i+2);
        try{back.currentTime=0;await back.play();}catch{}
        back.classList.add('is-front');
        await delay(140);
        front.classList.remove('is-front');
        [front,back]=[back,front];
        i=(i+1)%files.length;
        preloadInto(back,i+1);
      }
    }finally{clearInterval(timer);}
  }

  window.addEventListener('load',()=>{setTimeout(()=>playForever().catch(()=>{}),700);},{once:true});
  const unlock=()=>{A.play().catch(()=>{});B.play().then(()=>B.pause()).catch(()=>{});};
  document.addEventListener('touchstart',unlock,{once:true,passive:true});
  document.addEventListener('click',unlock,{once:true});
  const applyPref=()=>{if(mq.matches){[A,B].forEach(v=>{try{v.pause();v.currentTime=0;}catch{}});
    A.classList.add('is-front');B.classList.remove('is-front');}};
  mq.addEventListener?mq.addEventListener('change',applyPref):mq.addListener(applyPref);
})();

/* ---------- Spend counters ---------- */
(() => {
  const mq=matchMedia('(prefers-reduced-motion: reduce)');
  const COOLDOWN=1200, animState=new WeakMap();
  const ease=t=>1-Math.pow(1-t,3);
  const finalFmt=(n,s)=>s==='T'?`$${n.toFixed(1)}T`:
    s==='B'?`$${Number.isInteger(n)?n.toFixed(0):n.toFixed(2)}B`:
    `$${Math.round(n).toLocaleString()}`;

  $$('.stat-card').forEach(c=>{
    const v=$('.stat-value',c), g=$('.stat-ghost',c), cap=$('.stat-caption',c);
    if(!v||!g) return;
    const t=parseFloat(v.dataset.target||'0'), s=v.dataset.suffix||'';
    const fin=finalFmt(t,s);
    v.textContent=fin;
    requestAnimationFrame(()=>{
      g.textContent=fin;
      const w=Math.ceil(g.offsetWidth),h=Math.ceil(g.offsetHeight);
      v.classList.add('stat-live');v.style.width=w+'px';v.style.height=h+'px';
      v.dataset.final=fin;v.dataset.targetNum=String(t);v.dataset.suffix=s;
    });
    animState.set(v,{animating:false,last:0,target:t,suffix:s});
    ['mouseenter','click','focusin'].forEach(ev=>c.addEventListener(ev,()=>start(v)));
  });

  function start(v){
    const st=animState.get(v);if(!st)return;
    const now=performance.now();if(st.animating||now-st.last<COOLDOWN)return;
    st.last=now;
    if(mq.matches){v.textContent=v.dataset.final;return;}
    st.animating=true;
    const tgt=parseFloat(v.dataset.targetNum||'0'), sfx=v.dataset.suffix||'';
    const dur=900,startT=now;
    v.textContent=sfx==='T'?'$0.0T':sfx==='B'?'$0B':'$0';
    const step=t=>{
      const p=Math.min(1,(t-startT)/dur);
      const n=tgt*ease(p);
      v.textContent=finalFmt(n,sfx);
      if(p<1)requestAnimationFrame(step);
      else{st.animating=false;v.textContent=v.dataset.final;}
    };
    requestAnimationFrame(step);
  }

  const sec=document.getElementById('spend');
  if(sec&&'IntersectionObserver'in window){
    const io=new IntersectionObserver(e=>{
      e.forEach(x=>{if(x.isIntersecting){$$('.stat-value',sec).forEach(v=>start(v));io.disconnect();}});
    },{threshold:.3});
    io.observe(sec);
  }
})();

/* ---------- Department seal loop ---------- */
(() => {
  const track=$('.seal-track'), row=track?$('.seal-row',track):null;
  if(!track||!row) return;
  if(!row.dataset.cloned){
    Array.from(row.children).forEach(n=>{
      const c=n.cloneNode(true);c.setAttribute('aria-hidden','true');row.appendChild(c);
    });
    row.dataset.cloned='true';
  }
  const mq=matchMedia('(prefers-reduced-motion: reduce)');
  const apply=()=>{row.style.animationPlayState=mq.matches?'paused':'running';};
  mq.addEventListener?mq.addEventListener('change',apply):mq.addListener(apply);
  apply();
})();

/* ---------- Enquiry form (demo only) ---------- */
(() => {
  const form=$('#enquiryForm'); if(!form) return;
  const status=$('#enquiryStatus');
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(status){status.classList.remove('error','success');status.textContent='Sending…';}
    const hp=(new FormData(form)).get('hp');
    if(hp){if(status){status.textContent='Something went wrong.';status.className='enquiry-status error';}return;}
    setTimeout(()=>{
      if(status){status.textContent='Thanks! We’ll be in touch shortly.';status.className='enquiry-status success';}
      form.reset();
    },600);
  });
})();
