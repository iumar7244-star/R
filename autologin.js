/* Remembered school: if a school was signed in on this device, its profile is remembered (also after the app is closed).
   When the app is started again the password is asked before the dashboard opens; once it was entered in this run of the app,
   the home page goes straight to the dashboard. The school stays remembered until the user presses Logout. */
(function(){
  var U='ius_unlocked_v1';
  function go(){
    try{
      /* a fresh start of the app (the start-up splash is playing) forgets that the password was entered */
      if(window.IUS_SPLASH_PLAY===true){try{sessionStorage.removeItem(U)}catch(e){}localStorage.removeItem(U)}
      const sid=localStorage.getItem('ius_sons_local_session_v1');if(!sid)return;
      const s=JSON.parse(localStorage.getItem('ius_sons_local_schools_v1')||'[]').find(x=>x.id===sid);
      if(!s||s.status==='suspended')return;
      var ok=localStorage.getItem(U)==='1'||sessionStorage.getItem(U)==='1';
      location.replace(ok?'dashboard.html':'auth.html?view=unlock');
    }catch(e){}
  }
  if(window.IUS_INTRO_DONE)go();else document.addEventListener('ius-intro-done',go,{once:true});
})();
