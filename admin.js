const KEY='ius_sons_local_schools_v1';const load=()=>JSON.parse(localStorage.getItem(KEY)||'[]');const save=x=>localStorage.setItem(KEY,JSON.stringify(x));const $=id=>document.getElementById(id);
/* ---- administrator sign-in (password can be changed below; default is admin / admin123 until then) ---- */
const AK='ius_admin_v1',DEFAULT_PW='admin123';
async function sha(t){try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return 'plain:'+t}}
const adminRec=()=>{try{return JSON.parse(localStorage.getItem(AK)||'null')}catch(e){return null}};
async function pwOk(p){
 const r=adminRec();
 if(!r)return p===DEFAULT_PW;
 /* Older builds could save a plain: fallback when Web Crypto was unavailable.
    Recognize that existing format so users are not locked out after an update. */
 if(typeof r.hash==='string'&&r.hash.startsWith('plain:'))return p===r.hash.slice(6);
 return (await sha(r.salt+p))===r.hash;
}
$('login').onclick=async()=>{const u=$('email').value.trim().toLowerCase();if(u!=='admin'&&u!=='rawdhaismail2@gmail.com'){$('loginMsg').textContent='Use admin (or the platform admin email) as the username.';return}if(!(await pwOk($('password').value))){$('loginMsg').textContent='Incorrect administrator password.';return}$('loginBox').style.display='none';$('panel').style.display='block';$('pwWarn').style.display=adminRec()?'none':'block';loadSchools();loadUpdate()};
$('pwSave').onclick=async()=>{const o=$('pwOld').value,n=$('pwNew').value,n2=$('pwNew2').value,m=$('pwMsg');m.style.color='#dc2626';if(!(await pwOk(o))){m.textContent='Current password is not correct.';return}if(n.length<6){m.textContent='New password must be at least 6 characters.';return}if(n!==n2){m.textContent='The two new passwords do not match.';return}const salt=(crypto.randomUUID?crypto.randomUUID():String(Date.now()));localStorage.setItem(AK,JSON.stringify({salt,hash:await sha(salt+n)}));m.style.color='#059669';m.textContent='Password changed.';$('pwWarn').style.display='none';$('pwOld').value=$('pwNew').value=$('pwNew2').value=''};
/* ---- application update (works inside the Windows app only) ---- */
const U=window.iusUpdater;
function fmtDate(s){try{return new Date(s).toLocaleString()}catch(e){return s||''}}
async function loadUpdate(){
  const info=$('updInfo');
  if(!U){info.textContent='Updates can only be applied inside the IUS AND SONS Windows app. (This is the web/test version.)';$('updControls').style.display='none';return}
  try{
    const s=await U.status();
    info.innerHTML=(s.running==='update'?`Running <b>updated version ${esc(s.updateVersion)}</b> (applied ${esc(fmtDate(s.appliedAt))}).`:`Running the <b>built-in version ${esc(s.builtinVersion)}</b>.`)+(s.notes?`<br>${esc(s.notes)}`:'')+(s.previousVersion?`<br>Previous version kept: ${esc(s.previousVersion)}`:'');
    $('updBack').style.display=s.previousVersion?'':'none';$('updReset').style.display=s.running==='update'||s.updateVersion?'':'none';
  }catch(e){info.textContent='Could not read the update status.'}
}
function updMsg(t,ok){const m=$('updMsg');m.style.color=ok?'#059669':'#dc2626';m.textContent=t}
async function done(r,okText){if(r&&r.ok){updMsg(okText+' The app is restarting…',true);$('updControls').style.display='none'}else updMsg((r&&r.error)||'Something went wrong.',false)}
$('updApply').onclick=async()=>{
  if(!U)return;const f=$('updFile').files[0];if(!f){updMsg('Choose the update .zip file first.',false);return}
  if(!/\.zip$/i.test(f.name)){updMsg('The update must be a .zip file.',false);return}
  if(!confirm('Update the application using "'+f.name+'"?\n\nYour school data is kept. The app will restart.'))return;
  updMsg('Checking and installing the update…',true);
  try{const buf=await f.arrayBuffer();const r=await U.apply(new Uint8Array(buf));await done(r,'Updated to version '+(r&&r.version)+'.')}catch(e){updMsg('Could not apply the update: '+e.message,false)}
};
$('updBack').onclick=async()=>{if(!U||!confirm('Go back to the previous version? The app will restart.'))return;await done(await U.rollback(),'Went back to the previous version.')};
$('updReset').onclick=async()=>{if(!U||!confirm('Remove the update and use the version built into the installer? The app will restart.'))return;await done(await U.reset(),'Now using the built-in version.')};
function loadSchools(){let a=load();$('stats').innerHTML=`<div class="card"><b>${a.length}</b><span>Schools</span></div><div class="card"><b>${a.filter(x=>x.status==='active').length}</b><span>Active</span></div><div class="card"><b>${a.filter(x=>x.status==='suspended').length}</b><span>Suspended</span></div>`;$('schools').innerHTML=a.map(s=>`<div class="student"><div class="student-head"><b>${esc(s.name)}</b><span class="hint">${esc(s.school_code)} · ${s.status}</span><button class="${s.status==='active'?'danger':'green'} toggle" data-id="${s.id}">${s.status==='active'?'Suspend':'Activate'}</button></div><div>${esc(s.location||'')} · ${esc(s.phone1||'')}</div></div>`).join('')||'<p>No schools registered on this device.</p>';document.querySelectorAll('.toggle').forEach(b=>b.onclick=()=>{let a=load(),s=a.find(x=>x.id===b.dataset.id);s.status=s.status==='active'?'suspended':'active';save(a);loadSchools()})}
$('refresh').onclick=loadSchools;$('logout').onclick=()=>location.reload();function esc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
