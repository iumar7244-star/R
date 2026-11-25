/* IUS AND SONS 1.5.8 — automatic class IDs, student IDs by year + class, and year-end promotion. Uses SCHOOL / persist / esc / uid / $ from dashboard.js */
(function(){
const LADDER={primary:{k:'P',max:7},senior12:{k:'S',max:4},senior34:{k:'S',max:4},tp:{k:'TP',max:7},tj:{k:'TJ',max:3},ts:{k:'TS',max:3},alevel:{k:'S',max:6}};
const ORDER={P:1,S:2,TP:3,TJ:4,TS:5};
const lad=c=>LADDER[c&&c.category]||null;
const lvl=c=>{const nm=String((c&&c.name)||''),m=nm.match(/(\d+)(?!.*\d)/);return m?+m[1]:(/^\s*أول/.test(nm)?1:/^\s*ثاني/.test(nm)?2:/^\s*ثالث/.test(nm)?3:0)};
const abbr=c=>{const L=lad(c),n=lvl(c);if(L&&n)return L.k+n;return String((c&&c.name)||'C').replace(/[^A-Za-z0-9]/g,'').slice(0,4).toUpperCase()||'C'};
const cls=id=>(SCHOOL.classes||[]).find(c=>c.id===id);
const yearNum=id=>((SCHOOL.years||[]).find(y=>y.id===id)||{}).year;
function activeYear(){const ys=SCHOOL.years||[],act=ys.filter(y=>y.status==='active'),pool=act.length?act:ys;return pool.length?Math.max(...pool.map(y=>y.year)):new Date().getFullYear()}
function sorted(){return [...(SCHOOL.classes||[])].sort((a,b)=>{const la=lad(a),lb=lad(b);return (la?ORDER[la.k]:9)-(lb?ORDER[lb.k]:9)||lvl(a)-lvl(b)||String(a.name).localeCompare(b.name)})}

/* ---- class IDs: numbered from the lowest class to the highest, then the year  e.g. 05-P5-2026 ---- */
function ensureClassIds(){if(!SCHOOL||!SCHOOL.classes)return;const yr=activeYear();sorted().forEach((c,i)=>{c.code=String(i+1).padStart(2,'0')+'-'+abbr(c)+'-'+yr})}

/* ---- student IDs: year registered - class - 001, 002 ... going up ---- */
function newStudentCode(yearId,classId){
  const yr=yearNum(yearId)||new Date().getFullYear(),c=cls(classId),pre=yr+'-'+(c?abbr(c):'C')+'-';let max=0;
  (SCHOOL.students||[]).forEach(s=>{const k=String(s.code||'');if(k.startsWith(pre)){const n=parseInt(k.slice(pre.length),10);if(n>max)max=n}});
  return pre+String(max+1).padStart(3,'0');
}
window.IDS={ensureClassIds,newStudentCode,abbr,lvl};

/* every save keeps the class IDs current */
const _persist=persist;persist=function(){ensureClassIds();return _persist.apply(this,arguments)};
ensureClassIds();

/* ---- show the IDs ---- */
const _lc=loadClasses;loadClasses=function(){_lc.apply(this,arguments);document.querySelectorAll('#cl-list .student[data-id]').forEach(card=>{const c=cls(card.dataset.id),b=card.querySelector('.student-head b');if(c&&b&&!card.querySelector('.cls-id'))b.insertAdjacentHTML('afterend','<span class="cls-id">ID: '+esc(c.code||'')+'</span>')})};
const _ls=loadStudents;loadStudents=function(){_ls.apply(this,arguments);document.querySelectorAll('#st-body tr[data-id]').forEach(tr=>{const s=SCHOOL.students.find(x=>x.id===tr.dataset.id);if(!s)return;const c=cls(s.classId),td=tr.children[4];if(td&&c&&c.code)td.insertAdjacentHTML('beforeend','<small class="cls-id">'+esc(c.code)+'</small>'+(s.completed?'<small class="done-tag">Completed</small>':''))})};
const _py=loadYears;loadYears=function(){_py.apply(this,arguments);paintPromoSelects()};

/* button: give existing students the new-style ID */
const msg=$('st-msg');
msg.insertAdjacentHTML('afterend','<button id="st-reid" class="gray" type="button">🔢 Give existing students the new ID format (year-class-001)</button>');
$('st-reid').onclick=()=>{
  const re=/^\d{4}-[A-Z]+\d*-\d{3,}$/,todo=SCHOOL.students.filter(s=>!re.test(String(s.code||'')));
  if(!todo.length){msg.style.color='#14532d';msg.textContent='All students already have IDs in the new format.';return}
  if(!confirm('Change the ID of '+todo.length+' student(s) to the new format (year-class-001)? Printed old IDs will no longer match.'))return;
  todo.forEach(s=>{s.code=newStudentCode(s.yearId,s.classId)});
  persist();loadStudents();loadOverview();msg.style.color='#14532d';msg.textContent=todo.length+' student ID(s) updated.';
};

/* ---- promotion at the end of a year ---- */
function nextClass(c,created){
  const L=lad(c),n=lvl(c);if(!L||!n)return{err:1};if(n>=L.max){const up=(SCHOOL.classes||[]).find(x=>lad(x)&&lad(x).k===L.k&&lvl(x)===n+1);if(up)return{cls:up};return{final:1}}
  const nn=n+1,ex=(SCHOOL.classes||[]).find(x=>lad(x)&&lad(x).k===L.k&&lvl(x)===nn);if(ex)return{cls:ex};
  const nx={id:uid(),name:c.name.replace(/(\d+)(?!.*\d)/,String(nn)),category:L.k==='S'?(nn<=2?'senior12':nn<=4?'senior34':'alevel'):c.category,streams:[]};
  SCHOOL.classes.push(nx);try{addDefaultSubjects(nx)}catch(e){}created.push(nx.id);return{cls:nx};
}
function promote(fromId,toId){
  const prevs={},created=[];let moved=0,done=0,skipped=0;
  SCHOOL.students.forEach(s=>{
    if(s.yearId!==fromId||s.completed)return;
    const cur=[s.classId,s.dualClassId].filter(Boolean).map(cls).filter(Boolean),nxt=[];let bad=false;
    cur.forEach(c=>{const r=nextClass(c,created);if(r.err)bad=true;else if(r.cls)nxt.push(r.cls.id)});
    if(bad||!cur.length){skipped++;return}
    prevs[s.id]={yearId:s.yearId,classId:s.classId,dualClassId:s.dualClassId||'',streamId:s.streamId||'',completed:!!s.completed,hist:(s.history||[]).length};
    if(!nxt.length){s.completed=true;done++;return}
    s.history=s.history||[];s.history.push({yearId:s.yearId,classId:s.classId,dualClassId:s.dualClassId||'',streamId:s.streamId||''});
    s.yearId=toId;s.classId=nxt[0];s.dualClassId=nxt[1]||'';s.streamId='';moved++;
  });
  const from=(SCHOOL.years||[]).find(y=>y.id===fromId),wasActive=from&&from.status==='active';if(from)from.status='closed';
  SCHOOL.lastPromotion={fromId,toId,at:new Date().toISOString(),prevs,created,reopened:!!wasActive,moved,done,skipped};
  persist();refreshAll();
  return{moved,done,skipped,created:created.length};
}
function undoPromotion(){
  const p=SCHOOL.lastPromotion;if(!p)return false;
  SCHOOL.students.forEach(s=>{const v=p.prevs[s.id];if(!v)return;s.yearId=v.yearId;s.classId=v.classId;s.dualClassId=v.dualClassId;s.streamId=v.streamId;s.completed=v.completed;if(!v.completed)delete s.completed;(s.history=s.history||[]).length=v.hist;if(!s.history.length)delete s.history});
  (p.created||[]).forEach(id=>{SCHOOL.classes=SCHOOL.classes.filter(c=>c.id!==id);SCHOOL.subjects=SCHOOL.subjects.filter(sub=>{const had=(sub.classes||[]).includes(id);sub.classes=(sub.classes||[]).filter(x=>x!==id);return !(had&&sub.classes.length===0)})});
  const f=(SCHOOL.years||[]).find(y=>y.id===p.fromId);if(f&&p.reopened)f.status='active';
  SCHOOL.lastPromotion=null;persist();refreshAll();return true;
}
const T=$('yr-body').closest('table');
T.insertAdjacentHTML('afterend',`<div class="promo-box"><h4>🎓 Promote students to the next class</h4>
<p class="hint" style="margin:0 0 10px">When a new academic year is added (or a year is closed) every student moves up one class automatically: Primary 1→7, Senior 1→4, Theology Primary 1→7, Junior and Secondary Theology 1→3. Students in the last class are marked Completed. Old marks and reports stay under the old year. A student in two classes moves in both.</p>
<div class="row"><label>From year<select id="pr-from"></select></label><label>To year<select id="pr-to"></select></label><button id="pr-go" class="green" type="button">Promote now</button><button id="pr-undo" class="gray" type="button">Undo last promotion</button></div><p id="pr-msg" class="msg"></p></div>`);
function paintPromoSelects(){const ys=[...(SCHOOL.years||[])].sort((a,b)=>a.year-b.year),o=ys.map(y=>`<option value="${y.id}">${y.year}</option>`).join('');const f=$('pr-from'),t=$('pr-to');if(!f)return;const pf=f.value,pt=t.value;f.innerHTML=o;t.innerHTML=o;if(pf)f.value=pf;else if(ys.length>1)f.value=ys[ys.length-2].id;if(pt)t.value=pt;else if(ys.length)t.value=ys[ys.length-1].id}
const say=(t,bad)=>{const m=$('pr-msg');m.style.color=bad?'#dc2626':'#14532d';m.textContent=t};
const sum=r=>`${r.moved} student(s) moved up`+(r.done?`, ${r.done} completed their final class`:'')+(r.created?`, ${r.created} new class(es) created`:'')+(r.skipped?`, ${r.skipped} skipped (class name has no number)`:'')+'.';
$('pr-go').onclick=()=>{const a=$('pr-from').value,b=$('pr-to').value;if(!a||!b||a===b){say('Choose two different years.',1);return}if(yearNum(b)<yearNum(a)){say('The "to" year must be later than the "from" year.',1);return}
  if(!confirm('Promote all students of '+yearNum(a)+' into '+yearNum(b)+'? You can undo this straight afterwards.'))return;say(sum(promote(a,b)))};
$('pr-undo').onclick=()=>{if(!SCHOOL.lastPromotion){say('Nothing to undo.',1);return}if(confirm('Undo the last promotion?')){undoPromotion();say('Last promotion undone.')}};
/* automatic: adding a later year promotes the year before it */
const _add=$('yr-add').onclick;
$('yr-add').onclick=function(){
  const before=(SCHOOL.years||[]).map(y=>y.id);_add.apply(this,arguments);
  const added=SCHOOL.years.find(y=>!before.includes(y.id));if(!added)return;
  const prev=SCHOOL.years.filter(y=>y.year<added.year).sort((a,b)=>b.year-a.year)[0];if(!prev)return;
  if(!SCHOOL.students.some(s=>s.yearId===prev.id&&!s.completed))return;
  paintPromoSelects();say('Year '+prev.year+' ended. '+sum(promote(prev.id,added.id))+' (Undo is available below.)');
};
/* automatic: closing a year promotes into the next later year, if there is one */
$('yr-body').addEventListener('click',e=>{
  const btn=e.target.closest('.yr-toggle');if(!btn)return;const y=SCHOOL.years.find(x=>x.id===btn.dataset.id);
  if(!y||y.status!=='closed')return;const nx=SCHOOL.years.filter(z=>z.year>y.year).sort((a,b)=>a.year-b.year)[0];
  if(!nx||!SCHOOL.students.some(s=>s.yearId===y.id&&!s.completed))return;
  say('Year '+y.year+' closed. '+sum(promote(y.id,nx.id)));
});
paintPromoSelects();
ensureClassIds();persist();loadClasses();loadStudents();
})();

/* IUS AND SONS 1.5.9 — Student Registration: students shown in one coloured box per class (colour chosen by the owner).
   The old table stays in the page (hidden) so every existing function keeps working. */
(function(){
const PAL=['#1677e8','#059669','#7c3aed','#d97706','#dc2626','#0891b2','#be185d','#65a30d','#4f46e5','#0f766e'];
const table=$('st-body').closest('table');
table.insertAdjacentHTML('beforebegin','<div id="st-boxes"></div>');table.style.display='none';
const ink=h=>{const n=parseInt(h.slice(1),16),r=n>>16,g=(n>>8)&255,b=n&255;return (r*299+g*587+b*114)/1000>150?'#0f172a':'#ffffff'};
const colour=(c,i)=>((SCHOOL.classColors||{})[c.id])||PAL[i%PAL.length];
function paint(){
  const host=$('st-boxes');if(!host)return;
  const cls=[...(SCHOOL.classes||[])].sort((a,b)=>String(a.code||a.name).localeCompare(String(b.code||b.name),undefined,{numeric:true}));
  const sts=SCHOOL.students||[],known=new Set(cls.map(c=>c.id));
  const stu=s=>`<div class="cb-st" data-id="${esc(s.id)}">${avatar(s)}<span><b>${esc(s.name)}</b><small>${esc(s.code||'')} · ${esc(s.gender||'')}${s.completed?' · Completed':''}</small></span></div>`;
  const make=(c,i,list)=>{const col=c?colour(c,i):'#64748b';return `<div class="cb" ${c?'data-cid="'+esc(c.id)+'"':''} style="--bx:${col};--bt:${ink(col)}"><div class="cb-h"><div><b>${esc(c?c.name:'No class')}</b>${c&&c.code?'<small>ID: '+esc(c.code)+'</small>':''}</div><span class="cb-n">${list.length}</span>${c?'<input type="color" class="cb-color" value="'+col+'" title="Choose the colour of this class">':''}</div><div class="cb-list">${list.map(stu).join('')||'<p class="hint">No students yet.</p>'}</div></div>`};
  let html=cls.map((c,i)=>make(c,i,sts.filter(s=>s.classId===c.id||s.dualClassId===c.id))).join('');
  const orphan=sts.filter(s=>!known.has(s.classId)&&!known.has(s.dualClassId));
  if(orphan.length)html+=make(null,0,orphan);
  host.innerHTML=html||'<p>No classes or students yet.</p>';
}
$('st-boxes').addEventListener('click',e=>{const r=e.target.closest('.cb-st');if(r)openProfile(r.dataset.id)});
$('st-boxes').addEventListener('input',e=>{const i=e.target.closest('.cb-color');if(!i)return;const b=i.closest('.cb');b.style.setProperty('--bx',i.value);b.style.setProperty('--bt',ink(i.value))});
$('st-boxes').addEventListener('change',e=>{const i=e.target.closest('.cb-color');if(!i)return;SCHOOL.classColors=SCHOOL.classColors||{};SCHOOL.classColors[i.closest('.cb').dataset.cid]=i.value;persist()});
const _l=loadStudents;loadStudents=function(){const r=_l.apply(this,arguments);paint();return r};
paint();
})();

/* IUS AND SONS 1.5.13 — Teacher Management: two staff groups (Teaching / Non-teaching).
   Click a group box and the profile box of each person in it appears. Click a person to open the full profile as before. */
(function(){
const TEACHING=r=>/teacher|director of studies/i.test(r||'Teacher');
let open='';
const money=n=>(+n||0).toLocaleString('en-US');
/* live salary figures for one person, read straight from the payroll records every time */
function pay(t,period){
  const pr=(SCHOOL.teacherPayProfiles||{})[t.id]||null,all=(SCHOOL.teacherSalaryPayments||[]).filter(x=>x.teacherId===t.id);
  const daily=!!pr&&pr.payType==='daily',days=pr&&pr.daysWorkedByPeriod?(pr.daysWorkedByPeriod[period]||0):0;
  const due=pr?(daily?(+pr.rate||0)*days:(+pr.rate||0)):0,paid=all.filter(x=>x.period===period).reduce((a,x)=>a+(+x.amount||0),0);
  return{pr,all,daily,days,due,paid,bal:Math.max(0,due-paid),pct:due>0?Math.min(100,Math.round(paid/due*100)):0,status:due<=0||paid<=0?'NILL':paid>=due?'Fully paid':'Partly paid'};
}
const monthName=p=>{try{return new Date(p+'-01T00:00').toLocaleString('en-US',{month:'long',year:'numeric'})}catch(e){return p}};
function payBox(t){
  const p=pay(t,currentPayrollPeriod());
  if(!p.pr)return '<div class="sf-pay none"><b>💰 Salary: not set yet</b><small>Open the profile to set it up</small></div>';
  return `<div class="sf-pay"><b>💰 ${p.daily?'UGX '+money(p.pr.rate)+' per day':'UGX '+money(p.pr.rate)+' per month'}</b><small>${esc(monthName(currentPayrollPeriod()))}: paid UGX ${money(p.paid)} · balance UGX ${money(p.bal)}</small><div class="sf-bar"><i style="width:${p.pct}%"></i></div><small>${p.due>0?p.pct+'% · ':''}${p.status}</small></div>`;
}
function paintStaff2(){
  const host=$('tc-list');if(!host)return;
  const all=SCHOOL.teachers||[],tc=all.filter(t=>TEACHING(t.role)),nt=all.filter(t=>!TEACHING(t.role));
  const card=t=>`<div class="pcard" data-tid="${esc(t.id)}">${tavatar(t)}<div><b>${esc(t.name)}</b><small>${esc(t.role||'Teacher')}${t.gender?' · '+esc(t.gender):''}</small><small>${esc(t.phone||'')}${t.email?' · '+esc(t.email):''}</small><small>${t.dob?'DOB: '+esc(t.dob):''}${t.nin?' · NIN: '+esc(t.nin):''}</small>${payBox(t)}</div></div>`;
  const grp=(k,icon,title,list)=>`<div class="sf-cat ${k}${open===k?' on':''}" data-cat="${k}"><span class="sf-ic">${icon}</span><div><b>${title}</b><small>${open===k?'Click to hide':'Click to show profiles'}</small></div><span class="sf-n">${list.length}</span></div>`;
  const shown=open==='t'?tc:open==='n'?nt:null;
  host.classList.remove('people');
  host.innerHTML=`<div class="sf-cats">${grp('t','👩‍🏫','1. Teaching Staff',tc)}${grp('n','🛠️','2. Non-Teaching Staff',nt)}</div>`+
    (shown?`<div class="people sf-people ${open}">${shown.map(card).join('')||'<p class="hint">No one in this group yet.</p>'}</div>`:'<p class="hint">Click Teaching Staff or Non-Teaching Staff to see their profiles.</p>');
}
$('tc-list').addEventListener('click',e=>{const c=e.target.closest('.sf-cat');if(!c)return;open=open===c.dataset.cat?'':c.dataset.cat;paintStaff2()});
const _rp=renderPeople;renderPeople=function(){const r=_rp.apply(this,arguments);paintStaff2();return r};
/* any salary save / payment refreshes the boxes at once */
const _rt=renderTeacherPayroll;renderTeacherPayroll=function(){const r=_rt.apply(this,arguments);paintStaff2();return r};

/* the full profile window also shows the salary and payment profile */
const _ps=paintStaff;paintStaff=function(){
  const r=_ps.apply(this,arguments),t=tcStaff(),f=$('tp-form');if(!t||!f)return r;
  const per=currentPayrollPeriod(),p=pay(t,per),rows=p.all.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))).slice(0,12);
  const total=p.all.reduce((a,x)=>a+(+x.amount||0),0);
  f.insertAdjacentHTML('beforeend',`<div class="tp-pay"><h4>💰 Salary &amp; payment profile</h4>`+
   (p.pr?`<p class="hint" style="margin:0 0 8px">${p.daily?'Daily payment: UGX '+money(p.pr.rate)+' per day ('+p.days+' day(s) worked in '+esc(monthName(per))+')':'Monthly salary: UGX '+money(p.pr.rate)}${p.pr.startDate?' · starts '+esc(p.pr.startDate):''}</p>`:'<p class="hint" style="margin:0 0 8px">No salary has been set for this person yet.</p>')+
   `<div class="payroll-summary"><div><small>Full amount · ${esc(monthName(per))}</small><b>UGX ${money(p.due)}</b></div><div><small>Paid so far</small><b>UGX ${money(p.paid)}</b></div><div><small>Balance remaining</small><b>UGX ${money(p.bal)}</b></div><div><small>Progress</small><b>${p.due>0?p.pct+'%':'NILL'} · ${p.status}</b></div></div>`+
   `<h4 style="margin:12px 0 6px">Payment history <small>(all paid: UGX ${money(total)})</small></h4>`+
   (rows.length?`<div style="overflow-x:auto"><table class="datatable"><thead><tr><th>Date</th><th>Month</th><th>Amount (UGX)</th><th>Note</th></tr></thead><tbody>${rows.map(x=>`<tr><td>${esc(x.date||'')}</td><td>${esc(x.period||'')}</td><td>${money(x.amount)}</td><td>${esc(x.note||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">No payments recorded yet.</p>')+
   `<button type="button" class="gray" id="tp-pay-go" data-pid="${esc(t.id)}">Set salary / record a payment</button></div>`);
  return r;
};
$('tp-form').addEventListener('click',e=>{const b=e.target.closest('#tp-pay-go');if(!b)return;const id=b.dataset.pid;$('tp-close').click();const sel=$('pay-teacher');if(sel)sel.value=id;renderTeacherPayroll();const r=$('tc-payroll');if(r)r.scrollIntoView({behavior:'smooth',block:'start'})});
paintStaff2();
})();

/* IUS AND SONS 1.5.25 — School Profile: the owner can update the app, or go back to the previous / built-in version.
   Works inside the Windows app only (it uses the same updater as Platform Admin) and asks for the school password first. */
(function(){
  const view=document.getElementById('view-profile');if(!view)return;
  const U=window.iusUpdater;
  const box=document.createElement('div');box.id='ou-box';
  box.style.cssText='margin:20px 0;padding:16px;border:1px solid #cbd5e1;border-radius:14px';
  box.innerHTML=`<h3 style="margin:0 0 6px">🔄 Application version <small style="font-weight:400">(owner)</small></h3>
    <p id="ou-info" class="hint" style="text-align:left;margin:4px 0 10px"></p>
    <div id="ou-controls">
      <label>School password (to confirm)<input id="ou-pw" type="password" autocomplete="current-password" placeholder="Your school account password"></label>
      <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-top:8px">
        <input id="ou-file" type="file" accept=".zip" style="max-width:260px">
        <button type="button" id="ou-apply" class="green">⬆ Update application</button>
        <button type="button" id="ou-back" class="gray" style="display:none">⬇ Go back to previous version</button>
        <button type="button" id="ou-reset" class="gray" style="display:none">Return to built-in version</button>
      </div>
      <p class="hint" style="text-align:left">Updating or going back restarts the app. Your school data is never touched. “Go back” returns to the version that was running before the last update; “built-in” returns to the version inside the installed app.</p>
    </div><p id="ou-msg" class="msg"></p>`;
  view.appendChild(box);
  const q=id=>document.getElementById(id),esc2=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const msg=(t,ok)=>{const m=q('ou-msg');m.style.color=ok?'#059669':'#dc2626';m.textContent=t};
  const when=s=>{try{return new Date(s).toLocaleString()}catch(e){return s||''}};
  async function refresh(){
    const info=q('ou-info');
    if(!U){info.textContent='Updates can only be applied inside the IUS AND SONS Windows app. (This is the web/test version.)';q('ou-controls').style.display='none';return}
    try{
      const s=await U.status();
      info.innerHTML=(s.running==='update'?`Running <b>updated version ${esc2(s.updateVersion)}</b> (applied ${esc2(when(s.appliedAt))}).`:`Running the <b>built-in version ${esc2(s.builtinVersion)}</b>.`)
        +`<br>Built-in version inside this installation: <b>${esc2(s.builtinVersion)}</b>`+(s.previousVersion?`<br>Previous version available to go back to: <b>${esc2(s.previousVersion)}</b>`:'<br>No previous version is stored yet.');
      q('ou-back').style.display=s.previousVersion?'':'none';
      q('ou-reset').style.display=(s.running==='update'||s.updateVersion)?'':'none';
    }catch(e){info.textContent='Could not read the update status.'}
  }
  const friendly=r=>{const e=(r&&r.error)||'Something went wrong.';return /not allowed/i.test(e)?'This installation does not yet allow updates from School Profile. Install the newest full app (the one that includes this feature) once; after that you can update and go back from here.':e};
  const pwOk=()=>{const p=q('ou-pw').value;if(!p){msg('Type your school password to confirm.',false);return false}if(p!==String(SCHOOL.password||'')){msg('That school password is not correct.',false);return false}return true};
  const done=(r,text)=>{if(r&&r.ok){msg(text+' The app is restarting…',true);q('ou-controls').style.display='none'}else msg(friendly(r),false)};
  q('ou-apply').onclick=async()=>{
    if(!U||!pwOk())return;const f=q('ou-file').files[0];
    if(!f){msg('Choose the update .zip file first.',false);return}
    if(!/\.zip$/i.test(f.name)){msg('The update must be a .zip file.',false);return}
    if(!confirm('Update the application using "'+f.name+'"?\n\nYour school data is kept. The app will restart.'))return;
    msg('Checking and installing the update…',true);
    try{const buf=await f.arrayBuffer();const r=await U.apply(new Uint8Array(buf));done(r,'Updated to version '+(r&&r.version)+'.')}catch(e){msg('Could not apply the update: '+e.message,false)}
  };
  q('ou-back').onclick=async()=>{if(!U||!pwOk())return;if(!confirm('Go back to the previous version? The app will restart. Your school data is kept.'))return;try{done(await U.rollback(),'Went back to the previous version.')}catch(e){msg(e.message,false)}};
  q('ou-reset').onclick=async()=>{if(!U||!pwOk())return;if(!confirm('Return to the built-in version? The app will restart. Your school data is kept.'))return;try{done(await U.reset(),'Returned to the built-in version.')}catch(e){msg(e.message,false)}};
  document.querySelectorAll('.navlink[data-view="profile"]').forEach(a=>a.addEventListener('click',refresh));
  refresh();
})();
