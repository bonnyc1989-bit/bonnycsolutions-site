// Viewport adjustment
(() => {
  const vp = document.querySelector('meta[name="viewport"]');
  if (!vp) return;
  const base = 'width=device-width, initial-scale=1, viewport-fit=cover';
  vp.setAttribute('content', base);
})();

// Footer year
(() => {
  const el = document.getElementById('year');
  if (el) el.textContent = new Date().getFullYear();
})();

// Hero video logic
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
  [A,B].forEach(v=>{v.muted=true;v.playsInline=true;v.loop=false;v.preload='metadata';});
  const delay = ms => new Promise(r=>setTimeout(r,ms));
  const once = (el,ev)=>new Promise(r=>el.addEventListener(ev,r,{once:true}));
  const setSrc=(v,s)=>{if(v.src!==s){v.src=s;try{v.load();}catch{}}};
  const ready=v=>new Promise(r=>{
    if(v.readyState>=3)return r(true);
    v.addEventListener('canplay',()=>r(true),{once:true});
    setTimeout(()=>r(false),3000);
  });
  async function playForever(){
    let i=0;let front=A,back=B;
    setSrc(front,files[i]);await ready(front);
    front.play().catch(()=>{});front.classList.add('is-front');
    await ready(back);
    for(;;){
      await once(front,'ended');
      i=(i+1)%files.length;
      setSrc(back,files[i]);await ready(back);
      back.play().catch(()=>{});back.classList.add('is-front');
      await delay(150);
      front.classList.remove('is-front');
      [front,back]=[back,front];
    }
  }
  window.addEventListener('load',()=>playForever().catch(()=>{}),{once:true});
})();
