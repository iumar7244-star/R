/* IUS AND SONS 1.5.30 — start-up splash screen (replaces the old start-up videos).
   1.5.37: shown from the very first frame (no blue screen first) and kept for 4 seconds from the moment the app opens.
   Black screen with the glass logo, shown once when the app/site is started; every other page opens straight away.
   Tap the screen to skip. */
(function(){
  const splash=document.getElementById('iusSplash');
  const page=document.getElementById('iusPageAfterIntro')||document.getElementById('iusReportPage');
  window.playIUSIntro=function(){};            // kept for compatibility: no replays
  if(!page) return;
  const SK='ius_intro_played_v2',AK='ius_alive_v2';
  const L={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
  const S={get(k){try{return sessionStorage.getItem(k)}catch(e){return null}},set(k,v){try{sessionStorage.setItem(k,v)}catch(e){}}};
  // "Another page of the app is already open" = heartbeat fresher than 6 s.
  const alreadyStarted=typeof window.IUS_SPLASH_PLAY==='boolean'?!window.IUS_SPLASH_PLAY:(S.get(SK)==='1'||(Date.now()-(+L.get(AK)||0))<4500);
  const SPLASH_MS=6500;
  const bar=c=>{try{window.iusWindow&&window.iusWindow.bar(c)}catch(e){}};   // Windows app: colour of the strip behind the window buttons
  const beat=()=>L.set(AK,String(Date.now()));
  beat();setInterval(beat,2000);
  function reveal(){page.classList.add('show');window.IUS_INTRO_DONE=true;document.dispatchEvent(new Event('ius-intro-done'))}
  if(!splash||alreadyStarted){if(splash)splash.remove();document.documentElement.classList.remove('ius-splashing');bar('#0B2545');reveal();return}
  S.set(SK,'1');
  if(!splash.querySelector('.sp-stage'))splash.innerHTML='<div class="sp-stage sp2"><div class="sp2-disc"></div><div class="sp2-brand"><div class="sp2-logo"><img src="logo.webp" alt=""><i class="sp-shine"></i></div><div class="sp2-name">IUS AND SONS</div><div class="sp2-sub">School Results Management System</div></div><svg class="sp2-deco" viewBox="0 0 420 130" preserveAspectRatio="xMidYMax meet" aria-hidden="true"><g class="f1"><path d="M14 112V56q38-14 52 4 14-18 52-4v56q-38-12-52 6-14-18-52-6z"/></g><g class="f2"><path d="M180 38l64 24-64 24-64-24z"/><path d="M146 76v22q34 20 68 0V76l-34 14z"/><path d="M240 66v34" stroke="rgba(255,255,255,.14)" stroke-width="5" fill="none"/></g><g class="f3"><path d="M292 112L336 44l18 11-44 68z"/><path d="M292 112l18 11-22 6z"/></g><g class="f4"><rect x="372" y="66" width="38" height="52" rx="9"/><rect x="366" y="60" width="50" height="12" rx="6"/></g></svg><button type="button" class="sp2-go" aria-label="Get started"><span>Get Started</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button><div class="sp2-wave"></div></div>';
  let done=false;
  const calm=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function finish(){
    if(done)return;done=true;
    document.documentElement.classList.remove('ius-splashing');bar('#06122F');reveal();
    if(calm){splash.classList.add('hide');setTimeout(()=>splash.remove(),700);return}
    splash.classList.add('leaving');                         // curved wave rises and uncovers the page (like the reference video)
    setTimeout(()=>splash.classList.add('hide'),1000);
    setTimeout(()=>splash.remove(),1700);
  }
  splash.addEventListener('click',finish);          // tap anywhere or press Get Started
  document.addEventListener('keydown',function k(e){if(e.key==='Enter'||e.key===' '){finish();document.removeEventListener('keydown',k)}});
  setTimeout(finish,Math.max(0,SPLASH_MS-((window.performance&&performance.now)?performance.now():0)));   // moves on by itself if nobody taps
})();
