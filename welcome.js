/* IUS AND SONS 1.5.44 — pointer lights and 3D glass tilt for the welcome pages (Home, Sign In, Register, Platform Admin sign-in).
   Visual only: never touches forms or data. Smooth by design: one batched update per frame, no layout reads while moving,
   everything pauses when the window is hidden, and it switches itself off on weak devices or for reduced motion. */
(function(){
  var root=document.documentElement,mm=window.matchMedia;
  var reduce=!!(mm&&mm('(prefers-reduced-motion: reduce)').matches);
  var weak=(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)||(navigator.deviceMemory&&navigator.deviceMemory<=2);
  if(weak)root.classList.add('wl-lite');
  if(reduce)root.classList.add('wl-calm');
  function pause(){root.classList.toggle('wl-paused',document.hidden||!document.hasFocus())}
  document.addEventListener('visibilitychange',pause);addEventListener('blur',pause);addEventListener('focus',pause);pause();
  if(weak||reduce)return;
  var spot=document.createElement('div');spot.className='wl-spot';spot.setAttribute('aria-hidden','true');
  var px=0,py=0,raf=0,hot=null,rc=null,on=false;
  function setHot(n){
    if(hot){hot.classList.remove('hot');hot.style.setProperty('--rx','0deg');hot.style.setProperty('--ry','0deg')}
    hot=n;rc=null;if(n)n.classList.add('hot');
  }
  function frame(){
    raf=0;spot.style.setProperty('--px',px+'px');spot.style.setProperty('--py',py+'px');
    if(!hot)return;
    if(!rc)rc=hot.getBoundingClientRect();
    var x=(px-rc.left)/rc.width,y=(py-rc.top)/rc.height;
    if(x<0)x=0;else if(x>1)x=1;if(y<0)y=0;else if(y>1)y=1;
    var k=hot.classList.contains('wl-card')?4:7;
    hot.style.setProperty('--mx',(x*100)+'%');hot.style.setProperty('--my',(y*100)+'%');
    hot.style.setProperty('--ry',((x-.5)*k*2)+'deg');hot.style.setProperty('--rx',(-(y-.5)*k*2)+'deg');
  }
  addEventListener('pointermove',function(e){
    if(e.pointerType==='touch')return;
    if(!on){on=true;root.classList.add('wl-pointer')}
    px=e.clientX;py=e.clientY;
    var t=e.target.closest?e.target.closest('.wl-tilt'):null;
    if(t!==hot)setHot(t);
    if(!raf)raf=requestAnimationFrame(frame);
  },{passive:true});
  function drop(){on=false;root.classList.remove('wl-pointer');setHot(null)}
  document.addEventListener('pointerleave',drop);
  addEventListener('blur',drop);
  addEventListener('scroll',function(){rc=null},{passive:true,capture:true});
  addEventListener('resize',function(){rc=null},{passive:true});
})();
