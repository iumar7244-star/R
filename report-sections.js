/* IUS AND SONS 1.5.15 — Report Generator: five icon boxes, one open at a time, each opening directly under itself. */
(function(){
  const items=[...document.querySelectorAll('.rg-item')];
  const set=(it,on)=>{it.classList.toggle('open',on);it.querySelector('.rg-box').setAttribute('aria-expanded',on?'true':'false')};
  items.forEach(it=>it.querySelector('.rg-box').addEventListener('click',()=>{
    const was=it.classList.contains('open');
    items.forEach(o=>set(o,false));
    if(!was){set(it,true);if(window.matchMedia('(max-width:760px)').matches)setTimeout(()=>it.querySelector('.rg-box').scrollIntoView({behavior:'smooth',block:'start'}),60)}
  }));
})();
(function(){
  if(location.hash==='#reportDesigner'){const b=document.getElementById('rgb-designer');if(b)b.click()}
  if(!document.documentElement.classList.contains('embed')||window.parent===window)return;
  const pg=document.getElementById('iusReportPage');if(!pg)return;
  const post=()=>{try{parent.postMessage({iusReportHeight:Math.ceil(pg.getBoundingClientRect().height)+6,iusReportReady:true},'*')}catch(e){}};
  if(window.ResizeObserver)new ResizeObserver(post).observe(pg);
  addEventListener('load',post);post();
})();
addEventListener('message',e=>{const d=e.data;if(!d||d.iusOpen!=='des')return;const it=document.querySelector('.rg-item[data-k="designer"]');if(it&&!it.classList.contains('open'))it.querySelector('.rg-box').click()});
