const $=id=>document.getElementById(id);
const KEY='ius_sons_local_schools_v1';
const SESSION='ius_sons_local_session_v1';
const load=()=>JSON.parse(localStorage.getItem(KEY)||'[]');
const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
const session=()=>localStorage.getItem(SESSION);
/* Verify the saved school password without changing the saved credential.
   Supports the original plain-text account records and legacy prefixed records. */
function schoolPasswordMatches(s, entered){
 const saved=s && s.password;
 if(typeof saved==='string' && saved.startsWith('plain:')) return entered===saved.slice(6);
 return String(saved??'')===String(entered??'');
}
const UNLOCK='ius_unlocked_v1';   /* set once the password was entered in this run of the app */
const setSession=id=>{localStorage.setItem(SESSION,id);try{sessionStorage.setItem(UNLOCK,'1')}catch(e){}try{localStorage.setItem(UNLOCK,'1')}catch(e){}};
const code=()=>{let n=load().length+1;return `1972-2004-${String(n).padStart(3,'0')}`};
function show(view){['register','login','success','unlock','recover'].forEach(v=>{const e=$('view-'+v);if(e)e.style.display=v===view?'block':'none'});document.body.setAttribute('data-view',view)}
const params=new URLSearchParams(location.search);
/* the school that was signed in when the app was closed is remembered: its profile is shown and only the password is asked */
function fillUnlock(){const s=load().find(x=>x.id===session());if(!s||s.status==='suspended')return false;$('unlockName').textContent=s.name||'Your school';$('unlockCode').textContent='School ID: '+s.school_code;const a=$('unlockAvatar');if(s.badge_url){a.src=s.badge_url;a.classList.add('has-badge')}return true}
const pv=params.get('view');show(pv==='register'?'register':(pv==='unlock'&&fillUnlock())?'unlock':'login');
$('toLogin').onclick=e=>{e.preventDefault();show('login')};
$('toRegister').onclick=e=>{e.preventDefault();show('register')};

/* ---- automatic classes, streams and subjects for the chosen school type (1.5.53) ---- */
let regType='primary';
document.querySelectorAll('#regTypeBox .wl-ty').forEach(b=>b.onclick=()=>{if(b.disabled)return;regType=b.dataset.type;document.querySelectorAll('#regTypeBox .wl-ty').forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b?'true':'false')})});
const SEED_SUBJ={
 primary:["English","Mathematics","Integrated Science","Social Studies"],
 senior12:["English Language","Mathematics","Biology","Chemistry","Physics","Geography","History & Political Education","Entrepreneurship Education","Physical Education (PE)","General Science","Kiswahili"],
 senior34:["English Language","Mathematics","Biology","Chemistry","Physics","Geography","History & Political Education"],
 alevel:[],
 tp:["القرآن","التربية الإسلامية","الفقه","اللغة العربية"],
 tj:["الحفظ والتفسير","التلاوة والتجويد","الإملاء والخط","الأدب والنصوص","إنشاء والمطالعة","النحو والصرف","فقه العبادات","الحديث","العقيدة","التاريخ"],
 ts:["الحفظ والتفسير","التلاوة والتجويد","الإملاء والخط","الأدب والنصوص","إنشاء والمطالعة","النحو والصرف","فقه العبادات","الحديث","العقيدة","التاريخ","مصطلح الحديث","أصول الفقه","أصول التفسير","فقه المعاملات","الأديان والفرق"]
};
function seedSchool(school,type){
 const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2);
 const shu=()=>['أ','ب','ج'].map(x=>({id:uid(),name:'شعبة ('+x+')'}));
 const defs=[];
 const add=(name,category,streams)=>defs.push({name,category,streams});
 if(type==='primary'){
  for(let i=1;i<=7;i++)add('Primary '+i,'primary',false);
  for(let i=1;i<=7;i++)add('Theology Primary '+i,'tp',true);
 }else if(type==='secondary'){
  add('Senior 1','senior12',false);add('Senior 2','senior12',false);
  add('Senior 3','senior34',false);add('Senior 4','senior34',false);
  add('Senior 5','alevel',false);add('Senior 6','alevel',false);
  ['شعبة أ','شعبة ب','شعبة ج'].forEach(n=>add(n,'tp',false));
  ['أول إعدادي','ثاني إعدادي','ثالث إعدادي'].forEach(n=>add(n,'tj',false));
  ['أول ثانوي','ثاني ثانوي','ثالث ثانوي'].forEach(n=>add(n,'ts',false));
 }
 school.schoolType=type;
 defs.forEach(d=>{
  const cls={id:uid(),name:d.name,category:d.category,streams:d.streams?shu():[]};school.classes.push(cls);
  (SEED_SUBJ[d.category]||[]).forEach(n=>{const ex=school.subjects.find(s=>String(s.name).trim().toLowerCase()===n.toLowerCase());if(ex)ex.classes.push(cls.id);else school.subjects.push({id:uid(),name:n,classes:[cls.id]})});
 });
}
$('registerBtn').onclick=()=>{
 const name=$('regSchool').value.trim(),email=$('regEmail').value.trim(),phone1=$('regPhone1').value.trim(),phone2=$('regPhone2').value.trim(),admin=$('regName').value.trim(),pass=$('regPassword').value,pass2=$('regPassword2').value;
 if(!name||!email||!phone1||!admin||!pass){$('registerMsg').textContent='Please fill in all required fields.';return}
 if(pass!==pass2){$('registerMsg').textContent='Passwords do not match.';return}
 let schools=load(); if(schools.some(s=>s.email.toLowerCase()===email.toLowerCase())){$('registerMsg').textContent='That email is already registered on this device.';return}
 const school={id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),school_code:code(),name,email,phone1,phone2,admin,password:pass,status:'active',location:'',badge_url:'',years:[],classes:[],subjects:[],teachers:[],students:[],results:[]};seedSchool(school,regType);schools.push(school);save(schools);setSession(school.id);$('schoolIdDisplay').textContent=school.school_code;show('success');
};
$('continueDashboard').onclick=()=>location.href='dashboard.html';
$('loginBtn').onclick=()=>{let c=$('loginCode').value.trim(),p=$('loginPassword').value,school=load().find(s=>s.school_code===c);if(!school){$('loginMsg').textContent='School ID not found on this device.';return}if(school.status==='suspended'){$('loginMsg').textContent='This school account is suspended.';return}if(!schoolPasswordMatches(school,p)){$('loginMsg').textContent='Incorrect password. Please check the password for this School ID.';return}setSession(school.id);location.href='dashboard.html'};
$('unlockBtn').onclick=()=>{const s=load().find(x=>x.id===session());if(!s){show('login');return}if(s.status==='suspended'){$('unlockMsg').textContent='This school account is suspended.';return}if(!schoolPasswordMatches(s,$('unlockPw').value)){$('unlockMsg').textContent='Incorrect password. Please check the password for this saved school account.';return}setSession(s.id);location.href='dashboard.html'};
$('notYou').onclick=e=>{e.preventDefault();localStorage.removeItem(SESSION);$('unlockPw').value='';show('login')};
/* Sign In / Register in the top bar switch instantly, without reloading the page */
document.querySelectorAll('.wl-nav a[data-k=login],.wl-nav a[data-k=reg]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const v=a.dataset.k==='reg'?'register':'login';show(v);try{history.replaceState(null,'','auth.html?view='+v)}catch(x){}}));
/* Enter key submits the form that is showing */
[['regPassword2','registerBtn'],['regPassword','registerBtn'],['loginPassword','loginBtn'],['loginCode','loginBtn'],['unlockPw','unlockBtn']].forEach(([i,b])=>$(i).addEventListener('keydown',e=>{if(e.key==='Enter')$(b).click()}));

/* ---- recover on a new device from a downloaded backup file + the school password (1.5.58) ---- */
let recData=null;
$('toRecover').onclick=()=>{$('recMsg').textContent='';show('recover')};
$('recBack').onclick=e=>{e.preventDefault();show('login')};
$('recFile').onchange=e=>{
 const f=e.target.files[0];recData=null;$('recMsg').textContent='';if(!f){$('recName').textContent='Choose your IUS backup file (.json)';return}
 $('recName').textContent=f.name;const r=new FileReader();
 r.onload=()=>{try{const d=JSON.parse(r.result);if(d.app!=='ius-sons'||!d.school||!d.school.id||!Array.isArray(d.school.students))throw 0;recData=d;$('recMsg').style.color='#059669';$('recMsg').textContent='Backup found: '+(d.school.name||'school')+' ('+(d.school.school_code||'')+'). Enter its password.'}catch(x){recData=null;$('recMsg').style.color='';$('recMsg').textContent='That file is not a valid IUS AND SONS backup.'}};
 r.readAsText(f);
};
$('recBtn').onclick=()=>{
 $('recMsg').style.color='';
 if(!recData){$('recMsg').textContent='Choose your backup file first.';return}
 const s=recData.school;
 if(s.status==='suspended'){$('recMsg').textContent='This school account is suspended.';return}
 if(!schoolPasswordMatches(s,$('recPw').value)){$('recMsg').textContent='Incorrect password for this backup.';return}
 const all=load(),i=all.findIndex(x=>x.id===s.id);
 if(i>=0){if(!confirm('This device already has "'+(all[i].name||'this school')+'". Replace it with the data in the backup file?'))return;all[i]=s}else all.push(s);
 save(all);setSession(s.id);location.href='dashboard.html';
};
['recPw'].forEach(i=>$(i).addEventListener('keydown',e=>{if(e.key==='Enter')$('recBtn').click()}));
