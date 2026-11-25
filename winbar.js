/* IUS AND SONS 1.5.38 — Windows app: the dashboard's upper bar is joined to the window bar (one bar with the window buttons).
   Runs only inside the Windows app (where window.iusWindow exists) and only on the dashboard page.
   It marks the page so winbar.css applies, and gives the strip behind the window buttons the same colour as the upper bar. */
(function(){
  if(!window.iusWindow)return;
  var root=document.documentElement,HEX=/^#[0-9a-f]{6}$/i,last='';
  root.classList.add('ius-winbar');
  function colour(){
    var c=(root.style.getPropertyValue('--ius-topbar')||'').trim();
    if(!HEX.test(c)){try{c=(JSON.parse(localStorage.getItem('ius_sons_appearance_v2')||'{}')||{}).topbar||''}catch(e){c=''}}
    return HEX.test(c)?c:'#123F70';
  }
  function push(){
    if(root.classList.contains('ius-splashing'))return;          /* the start-up splash keeps the strip black */
    var c=colour();if(c===last)return;last=c;
    try{window.iusWindow.bar(c)}catch(e){}
  }
  document.addEventListener('ius-intro-done',function(){last='';push()});
  try{new MutationObserver(push).observe(root,{attributes:true,attributeFilter:['style']})}catch(e){}
  addEventListener('storage',push);
})();
