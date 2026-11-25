const $=id=>document.getElementById(id);const KEY='ius_sons_local_schools_v1',SESSION='ius_sons_local_session_v1';
const load=()=>JSON.parse(localStorage.getItem(KEY)||'[]');const save=x=>localStorage.setItem(KEY,JSON.stringify(x));
let schools=load(),SCHOOL=schools.find(s=>s.id===localStorage.getItem(SESSION));
if(!SCHOOL){location.href='auth.html?view=login'}
function persist(){schools=load();const i=schools.findIndex(s=>s.id===SCHOOL.id);if(i>=0){if(schools[i].reportTemplates)SCHOOL.reportTemplates=schools[i].reportTemplates;/* saved report designs belong to the Report Designer window */schools[i]=SCHOOL;save(schools)}}
function esc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function uid(){return crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random())}
function refreshBadge(){ $('schoolBadgeMini').innerHTML=`${SCHOOL.badge_url?`<img src="${SCHOOL.badge_url}">`:''}<span>${esc(SCHOOL.name)}</span>` }
function refreshAll(){refreshBadge();loadOverview();loadYears();loadClasses();loadSubjects();loadTeachers();loadStudents();loadResultSelectors();$('pf-name').value=SCHOOL.name||'';$('pf-location').value=SCHOOL.location||'';$('pf-pobox').value=SCHOOL.pobox||'';$('pf-tel').value=SCHOOL.tel||'';if(SCHOOL.badge_url){$('pf-badge-preview').src=SCHOOL.badge_url;$('pf-badge-preview').style.display='block'}}
// navigation
document.querySelectorAll('.navlink[data-view]').forEach(b=>b.onclick=()=>{document.querySelectorAll('.navlink').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.style.display='none');$('view-'+b.dataset.view).style.display='block';if(b.dataset.view==='students')loadStudents();if(b.dataset.view==='results')loadResultSelectors()});
$('logoutBtn').onclick=()=>{localStorage.removeItem(SESSION);location.href='auth.html?view=login'};
function loadOverview(){$('overviewCards').innerHTML=`<div class="card"><b>${SCHOOL.students.length}</b><span>Students</span></div><div class="card"><b>${(SCHOOL.teachers||[]).length}</b><span>Teachers &amp; Staff</span></div><div class="card"><b>${SCHOOL.years.length}</b><span>Academic Years</span></div><div class="card"><b>${SCHOOL.classes.length}</b><span>Classes</span></div>`;renderPeople()}
$('pf-badge').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{SCHOOL.badge_url=r.result;$('pf-badge-preview').src=r.result;$('pf-badge-preview').style.display='block'};r.readAsDataURL(f)};
$('pf-save').onclick=()=>{SCHOOL.name=$('pf-name').value.trim()||SCHOOL.name;SCHOOL.location=$('pf-location').value.trim();SCHOOL.pobox=$('pf-pobox').value.trim();SCHOOL.tel=$('pf-tel').value.trim();persist();refreshBadge();$('pf-msg').textContent='Saved on this device.'};
function loadYears(){let a=SCHOOL.years;$('yr-body').innerHTML=a.map(y=>`<tr><td>${y.year}</td><td>${y.status}</td><td><button class="gray yr-toggle" data-id="${y.id}">${y.status==='active'?'Close':'Reopen'}</button></td></tr>`).join('')||'<tr><td colspan="3">No academic years yet.</td></tr>';document.querySelectorAll('.yr-toggle').forEach(b=>b.onclick=()=>{let y=a.find(x=>x.id===b.dataset.id);y.status=y.status==='active'?'closed':'active';persist();loadYears();loadResultSelectors()});$('st-year').innerHTML=a.map(y=>`<option value="${y.id}">${y.year}</option>`).join('');$('cl-year').innerHTML=a.map(y=>`<option value="${y.id}">${y.year}</option>`).join('')}
$('yr-add').onclick=()=>{let y=parseInt($('yr-input').value,10);if(!y)return;if(SCHOOL.years.some(x=>x.year===y)){$('yr-input').value='';return}SCHOOL.years.push({id:uid(),year:y,status:'active'});SCHOOL.years.sort((a,b)=>b.year-a.year);$('yr-input').value='';persist();loadYears();loadOverview()};
/* ===== Dual enrolment: one Primary class + one Theology Primary class on the SAME student record (classId + dualClassId) ===== */
const SECULAR_CATS=['primary','senior12','senior34','alevel'],THEO_CATS=['tp','tj','ts'];
const dualOther=cat=>SECULAR_CATS.includes(cat)?THEO_CATS:THEO_CATS.includes(cat)?SECULAR_CATS:null;
const clsById=id=>(SCHOOL.classes||[]).find(c=>c.id===id);
function dualCheck(classId,class2){
  if(!class2)return '';
  const a=clsById(classId),b=clsById(class2);
  if(!a||!b)return 'Choose a valid class.';
  if(a.id===b.id)return 'The second class must be different from the first class.';
  const secA=SECULAR_CATS.includes(a.category),secB=SECULAR_CATS.includes(b.category);
  if(secA===secB)return 'The second class must be from the other section: one secular class + one theology class.';
  return '';
}
function dualOptions(classId,selected){
  const c=clsById(classId),o=dualOther(c&&c.category);
  if(!o)return '<option value="">— no second class for this class —</option>';
  const opts=(SCHOOL.classes||[]).filter(x=>o.includes(x.category));
  return '<option value="">— none (one class only) —</option>'+opts.map(x=>`<option value="${x.id}"${x.id===selected?' selected':''}>${esc(x.name)}</option>`).join('');
}
const inClass=(s,id)=>s.classId===id||s.dualClassId===id;
/* 1.5.8: a promoted student keeps the classes of earlier years in s.history, so old marks/reports stay reachable */
function enrol(s,y){if(!y||s.yearId===y)return{classId:s.classId,dualClassId:s.dualClassId||'',streamId:s.streamId||''};const h=(s.history||[]).find(x=>x.yearId===y);return h?{classId:h.classId,dualClassId:h.dualClassId||'',streamId:h.streamId||''}:null}
function inClassY(s,id,y){const e=enrol(s,y);return !!e&&(e.classId===id||e.dualClassId===id)}
const classLabel=s=>{const a=(clsById(s.classId)||{}).name||'',b=s.dualClassId?(clsById(s.dualClassId)||{}).name:'';return b?`${a} + ${b}`:a};
function refreshClass2(){const el=$('st-class2');if(!el)return;el.innerHTML=dualOptions($('st-class').value,'')}
function updateStreamOptions(){refreshClass2();let c=SCHOOL.classes.find(x=>x.id===$('st-class').value);$('st-stream').innerHTML='<option value="">— none —</option>'+(c?.streams||[]).map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join('')}
function loadClasses(){let a=SCHOOL.classes;$('cl-list').innerHTML=a.map(c=>`<div class="student" data-id="${c.id}"><div class="student-head"><b>${esc(c.name)}</b><input class="stream-input" placeholder="Add stream e.g. East" style="max-width:160px"><button class="green stream-add">+ Stream</button><button class="gray cl-defsub">+ Category Subjects</button><button class="gray cl-showstudents">Show Students</button><button class="danger cl-remove">Remove Class</button></div><div class="streamTags">${(c.streams||[]).map(s=>`<span class="tag">${esc(s.name)}</span>`).join(' ')||"<span class='hint'>No streams — this class is not split.</span>"}</div><div class="classStudentList" style="display:none"></div></div>`).join('')||'<p>No classes yet.</p>';$('st-class').innerHTML=a.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');a.forEach(c=>{let card=document.querySelector(`#cl-list .student[data-id="${c.id}"]`);if(!card)return;card.querySelector('.stream-add').onclick=()=>{let n=card.querySelector('.stream-input').value.trim();if(!n)return;c.streams=c.streams||[];c.streams.push({id:uid(),name:n});persist();loadClasses();updateStreamOptions()};card.querySelector('.cl-defsub').onclick=()=>{const r=addDefaultSubjects(c);persist();loadSubjects();loadResultSelectors();$('cl-msg').style.color='#059669';$('cl-msg').textContent=r.created+r.linked?`${r.created+r.linked} subject(s) added to ${c.name}.`:`${c.name} already has all its category subjects.`};card.querySelector('.cl-remove').onclick=()=>{if(confirm(`Remove ${c.name}?`)){SCHOOL.classes=SCHOOL.classes.filter(x=>x.id!==c.id);SCHOOL.students.forEach(s=>{if(s.dualClassId===c.id)s.dualClassId='';if(s.classId===c.id&&s.dualClassId){s.classId=s.dualClassId;s.dualClassId=''}});SCHOOL.subjects=SCHOOL.subjects.filter(sub=>{const had=(sub.classes||[]).includes(c.id);sub.classes=(sub.classes||[]).filter(id=>id!==c.id);return !(had&&sub.classes.length===0)});persist();loadClasses();loadSubjects();loadResultSelectors();loadOverview()}};card.querySelector('.cl-showstudents').onclick=()=>{let l=card.querySelector('.classStudentList');l.style.display='block';let list=SCHOOL.students.filter(s=>inClass(s,c.id));l.innerHTML=list.length?'<b>Students:</b> '+list.map(s=>`${esc(s.name)} (${esc(s.code)})`).join(', '):'<span class="hint">No students in this class.</span>'}});$('st-class').onchange=updateStreamOptions;if(a.length)updateStreamOptions()}
const DEFAULT_SUBJECTS={
  senior12:["English Language","Mathematics","Biology","Chemistry","Physics","Geography","History & Political Education","Entrepreneurship Education","Physical Education (PE)","General Science","Kiswahili"],
  alevel:[],
  senior34:["English Language","Mathematics","Biology","Chemistry","Physics","Geography","History & Political Education"],
  primary:["English","Mathematics","Integrated Science","Social Studies"],
  tp:["القرآن","التربية الإسلامية","الفقه","اللغة العربية"],
  tj:["الحفظ والتفسير","التلاوة والتجويد","الإملاء والخط","الأدب والنصوص","إنشاء والمطالعة","النحو والصرف","فقه العبادات","الحديث","العقيدة","التاريخ"],
  ts:["الحفظ والتفسير","التلاوة والتجويد","الإملاء والخط","الأدب والنصوص","إنشاء والمطالعة","النحو والصرف","فقه العبادات","الحديث","العقيدة","التاريخ","مصطلح الحديث","أصول الفقه","أصول التفسير","فقه المعاملات","الأديان والفرق"]
};
function addDefaultSubjects(cls){
  let created=0,linked=0;
  (DEFAULT_SUBJECTS[cls.category]||[]).forEach(name=>{
    const ex=SCHOOL.subjects.find(s=>String(s.name).trim().toLowerCase()===name.toLowerCase());
    if(!ex){SCHOOL.subjects.push({id:uid(),name,classes:[cls.id]});created++}
    else if(Array.isArray(ex.classes)&&ex.classes.length&&!ex.classes.includes(cls.id)){ex.classes.push(cls.id);linked++}
  });
  return {created,linked};
}
$('cl-add').onclick=()=>{let n=$('cl-input').value.trim();if(!n)return;if(SCHOOL.classes.some(c=>c.name.toLowerCase()===n.toLowerCase())){alert('That class already exists.');return}const cls={id:uid(),name:n,category:$('cl-category').value,streams:[]};SCHOOL.classes.push(cls);const r=addDefaultSubjects(cls);$('cl-input').value='';persist();loadClasses();loadSubjects();loadResultSelectors();loadOverview();$('cl-msg').style.color='#059669';$('cl-msg').textContent=`Class added. ${r.created+r.linked} subject(s) for ${$('cl-category').selectedOptions[0].text} were added automatically — see the Subjects tab.`};
function classSortKey(c){
  const n=String(c.name||'').match(/(\d+)/),ar=/^\s*أول/.test(c.name)?1:/^\s*ثاني/.test(c.name)?2:/^\s*ثالث/.test(c.name)?3:0,num=n?parseInt(n[1],10):(ar||999);
  const cat=c.category||'';
  // Pair Primary 1 with Theology Primary 1, then Primary 2 with Theology Primary 2, etc.
  const group=(cat==='primary'||cat==='tp')?0:cat==='tj'?1:cat==='ts'?2:cat==='senior12'?3:cat==='senior34'?4:5;
  const pairOrder=cat==='primary'?0:cat==='tp'?1:2;
  return [group,num,pairOrder,String(c.name||'').toLowerCase()];
}
function classDisplayName(c){
  const n=String(c.name||'').trim();
  if(c.category==='tp')return (SCHOOL&&SCHOOL.schoolType==='secondary')||/^theology/i.test(n)?n:`Theology ${n}`;
  return n;
}
function loadSubjects(){
  const sortClasses=list=>[...list].sort((a,b)=>{const x=classSortKey(a),y=classSortKey(b);return x[1]-y[1]||String(a.name||'').localeCompare(String(b.name||''))});
  const pick=$('sub-class-picker');
  if(pick){
    const selected=new Set([...pick.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value));
    const classes=SCHOOL.classes||[];
    const primary=sortClasses(classes.filter(c=>c.category==='primary'));
    const theology=sortClasses(classes.filter(c=>c.category==='tp'));
    const other=sortClasses(classes.filter(c=>c.category!=='primary'&&c.category!=='tp'));
    const options=list=>list.map(c=>`<label class="sub-class-option"><input type="checkbox" value="${esc(c.id)}"${selected.has(String(c.id))?' checked':''}><span>${esc(classDisplayName(c))}</span></label>`).join('')||'<p class="hint">No classes added.</p>';
    const sec=SCHOOL.schoolType==='secondary',grp=(t,l)=>l.length||!sec?`<div class="sub-class-group"><b>${t}</b>${options(l)}</div>`:'';pick.innerHTML=sec?(()=>{const g=(c,t)=>{const l=sortClasses(classes.filter(x=>x.category===c));return l.length?`<div class="sub-class-group"><b>${t}</b>${options(l)}</div>`:''};return g('senior12','Senior 1 & 2 (O-Level)')+g('senior34','Senior 3 & 4 (O-Level)')+g('alevel','Senior 5 & 6 (A-Level)')+g('tp','شعبة')+g('tj','أول إعدادي – ثالث إعدادي')+g('ts','أول ثانوي – ثالث ثانوي')})():`<div class="sub-class-group"><b>Primary School</b>${options(primary)}</div><div class="sub-class-group"><b>Theology Primary</b>${options(theology)}</div>${other.length?`<div class="sub-class-group sub-class-other"><b>Other classes</b>${options(other)}</div>`:''}`;
  }
  $('sub-body').innerHTML=SCHOOL.subjects.map(s=>{
    const assigned=(s.classes||[]).map(id=>(SCHOOL.classes.find(c=>c.id===id)||{}).name).filter(Boolean);
    const shown=assigned.length?assigned.join(', '):'All classes';
    return `<tr><td>${esc(s.name)}</td><td>${esc(shown)}</td><td><button class="gray sub-edit" data-id="${s.id}">Edit Classes</button><button class="danger sub-remove" data-id="${s.id}">Remove</button></td></tr>`;
  }).join('')||'<tr><td colspan="3">No subjects yet.</td></tr>';
  document.querySelectorAll('.sub-remove').forEach(b=>b.onclick=()=>{if(!confirm('Remove this subject?'))return;SCHOOL.subjects=SCHOOL.subjects.filter(s=>s.id!==b.dataset.id);persist();loadSubjects();loadResultSelectors()});
  document.querySelectorAll('.sub-edit').forEach(b=>b.onclick=()=>{
    const sub=SCHOOL.subjects.find(x=>x.id===b.dataset.id); if(!sub||!pick)return;
    [...pick.querySelectorAll('input[type=checkbox]')].forEach(o=>o.checked=(sub.classes||[]).includes(o.value));
    $('sub-input').value=sub.name;
    $('sub-input').dataset.editId=sub.id;
    $('sub-add').textContent='Save Subject';
    $('sub-input').focus();
  });
}
$('sub-add').onclick=()=>{
  let n=$('sub-input').value.trim();if(!n)return;
  const selected=[...($('sub-class-picker')?.querySelectorAll('input[type=checkbox]:checked')||[])].map(o=>o.value);
  const editId=$('sub-input').dataset.editId;
  if(editId){
    const sub=SCHOOL.subjects.find(s=>s.id===editId); if(sub){sub.name=n;sub.classes=selected;}
    delete $('sub-input').dataset.editId;
    $('sub-add').textContent='+ Add Subject';
  }else{
    if(SCHOOL.subjects.some(s=>s.name.toLowerCase()===n.toLowerCase())){alert('That subject already exists.');return;}
    SCHOOL.subjects.push({id:uid(),name:n,classes:selected});
  }
  $('sub-input').value='';
  [...$('sub-class-picker').querySelectorAll('input[type=checkbox]')].forEach(o=>o.checked=false);
  persist();loadSubjects();loadResultSelectors();
};

function loadTeachers(){renderPeople()}
/* teacher/staff add: see Extra details section */
function avatar(s,big){const c=big?'avatar big':'avatar';return s.photo&&/^data:image\//.test(s.photo)?`<img class="${c}" src="${s.photo}" alt="">`:`<span class="${c} ph">${esc((s.name||'?').trim().charAt(0).toUpperCase())}</span>`}
function loadStudents(){let list=SCHOOL.students;$('st-body').innerHTML=list.map(s=>`<tr data-id="${esc(s.id)}" class="st-row"><td>${avatar(s)}</td><td>${esc(s.code)}</td><td><a href="#" class="st-link">${esc(s.name)}</a></td><td>${esc(s.gender)}</td><td>${esc(classLabel(s))}</td><td>${esc(s.dob||'')}</td><td>${esc(s.parentName||'')}${s.parentRel?' ('+esc(s.parentRel)+')':''}</td><td>${esc(s.parentPhone||'')}</td></tr>`).join('')||'<tr><td colspan="8">No students yet.</td></tr>';renderPeople()}

// Bulk gender manager: scoped to Student Registration and saved through the existing persistence path.
function loadGenderManager(){
 const cls=$('gm-class'),body=$('gm-body');if(!cls||!body)return;
 const prior=cls.value;
 cls.innerHTML='<option value="">All classes</option>'+(SCHOOL.classes||[]).map(c=>`<option value="${esc(c.id)}">${esc(classLabel({classId:c.id}))}</option>`).join('');
 if((SCHOOL.classes||[]).some(c=>c.id===prior))cls.value=prior;
 const q=($('gm-search').value||'').trim().toLowerCase(),cid=cls.value;
 const list=(SCHOOL.students||[]).filter(s=>(!cid||s.classId===cid||s.dualClassId===cid)&&(!q||`${s.name||''} ${s.code||''}`.toLowerCase().includes(q)))
   .sort((a,b)=>(a.gender?1:0)-(b.gender?1:0)||String(a.name||'').localeCompare(String(b.name||'')));
 body.innerHTML=list.map(s=>`<tr data-gm-row="${esc(s.id)}"><td><input type="checkbox" class="gm-check" value="${esc(s.id)}" aria-label="Select ${esc(s.name)}"></td><td>${esc(s.name||'')}</td><td>${esc(s.code||'')}</td><td>${esc(classLabel(s))}</td><td><select class="gm-row-gender" data-id="${esc(s.id)}" aria-label="Gender for ${esc(s.name)}"><option value=""${!s.gender?' selected':''}>Choose gender</option><option value="Male"${s.gender==='Male'?' selected':''}>Male</option><option value="Female"${s.gender==='Female'?' selected':''}>Female</option></select> <small>Current: ${esc(s.gender||'Missing')}</small></td></tr>`).join('')||'<tr><td colspan="5">No matching students.</td></tr>';
}
function initGenderManager(){
 if(!$('gm-body')||$('gm-body').dataset.ready)return;
 $('gm-body').dataset.ready='1';
 $('gm-class').addEventListener('change',loadGenderManager);
 $('gm-search').addEventListener('input',loadGenderManager);
 $('gm-select-visible').addEventListener('click',()=>{$('gm-body').querySelectorAll('.gm-check').forEach(x=>x.checked=true)});
 $('gm-clear').addEventListener('click',()=>{$('gm-body').querySelectorAll('.gm-check').forEach(x=>x.checked=false)});
 $('gm-apply').addEventListener('click',()=>{
   const ids=[...$('gm-body').querySelectorAll('.gm-check:checked')].map(x=>x.value),bulk=$('gm-gender').value,msg=$('gm-msg');
   if(!ids.length){msg.textContent='Select at least one student.';return}
   // If a bulk gender is chosen, apply it to checked rows; otherwise use each checked row's individual choice.
   if(bulk)ids.forEach(id=>{const sel=$('gm-body').querySelector(`.gm-row-gender[data-id="${CSS.escape(id)}"]`);if(sel)sel.value=bulk});
   const updates=ids.map(id=>{const s=(SCHOOL.students||[]).find(x=>String(x.id)===String(id)),sel=$('gm-body').querySelector(`.gm-row-gender[data-id="${CSS.escape(id)}"]`);return {id,name:s?.name||'',gender:sel?.value||''}});
   const missing=updates.filter(x=>!x.gender);if(missing.length){msg.textContent=`Choose Male or Female for ${missing.length} selected student(s), or choose a bulk gender above.`;msg.style.color='#b45309';return}
   const summary=updates.map(x=>`${x.name}: ${x.gender}`);if(!confirm(`Confirm gender assignments for ${updates.length} student(s)?\n\n${summary.slice(0,10).join('\n')}${summary.length>10?'\n…':''}`))return;
   let changed=0;updates.forEach(u=>{const st=(SCHOOL.students||[]).find(x=>String(x.id)===String(u.id));if(st&&st.gender!==u.gender){st.gender=u.gender;changed++}});
   persist();loadStudents();loadGenderManager();loadOverview();
   msg.textContent=`Confirmed. Updated ${changed} student(s).`;msg.style.color='#15803d';
 });
 loadGenderManager();
}

$('st-add').onclick=async()=>{let n=$('st-name').value.trim(),y=$('st-year').value,c=$('st-class').value;if(!n||!y||!c){$('st-msg').textContent='Enter name, academic year and class.';return}const c2=$('st-class2').value,derr=dualCheck(c,c2);if(derr){$('st-msg').style.color='#dc2626';$('st-msg').textContent=derr;return}$('st-msg').style.color='';let photo='';const pf=$('st-photo').files[0];if(pf){try{photo=await shrinkPhoto(pf,240)}catch(err){$('st-msg').textContent=err.message;return}}const code=IDS.newStudentCode(y,c);SCHOOL.students.push({id:uid(),code,name:n,gender:$('st-gender').value,yearId:y,classId:c,dualClassId:c2||'',streamId:$('st-stream').value,photo,...readF(STX.concat(STP,STA),'sx-')});$('st-name').value='';$('st-photo').value='';buildStForm();persist();loadStudents();loadOverview();$('st-msg').textContent='Student added.'};
function loadResultSelectors(){let years=SCHOOL.years,classes=SCHOOL.classes;$('rs-year').innerHTML=years.map(y=>`<option value="${y.id}">${y.year}</option>`).join('');$('rs-class').innerHTML=classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');loadResultGrid()}
function grade(m){return m>=80?'A':m>=70?'B':m>=60?'C':m>=50?'D':'E'}
$('view-profile').style.display='block';document.querySelectorAll('.navlink').forEach(x=>x.classList.remove('active'));document.querySelector('.navlink[data-view="profile"]').classList.add('active');refreshAll();initGenderManager();

$('bk-export').onclick=()=>{
  const blob=new Blob([JSON.stringify({app:'ius-sons',version:1,exported:new Date().toISOString(),school:SCHOOL})],{type:'application/json'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);
  a.download='IUS-backup-'+(SCHOOL.school_code||SCHOOL.id).toString().replace(/[^\w-]/g,'')+'-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500);
  $('bk-msg').style.color='#059669';$('bk-msg').textContent='Backup downloaded.';
};
$('bk-import').onclick=()=>$('bk-file').click();
$('bk-file').onchange=e=>{
  const f=e.target.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{
    try{
      const d=JSON.parse(r.result);
      if(d.app!=='ius-sons'||!d.school||!d.school.id||!Array.isArray(d.school.students))throw new Error('bad');
      if(!confirm('Restore "'+d.school.name+'" from this backup? This replaces the data currently saved on this device for that school.'))return;
      const all=load(),i=all.findIndex(s=>s.id===d.school.id);
      if(i>=0)all[i]=d.school;else all.push(d.school);
      save(all);localStorage.setItem(SESSION,d.school.id);location.reload();
    }catch(err){$('bk-msg').style.color='#dc2626';$('bk-msg').textContent='That file is not a valid IUS AND SONS backup.'}
  };
  r.readAsText(f);e.target.value='';
};

/* ===== Student profile + photo ===== */
function shrinkPhoto(file,max){return new Promise((res,rej)=>{const fr=new FileReader();fr.onerror=()=>rej(new Error('Could not read that file.'));fr.onload=()=>{const img=new Image();img.onerror=()=>rej(new Error('That file is not a valid image.'));img.onload=()=>{const W=max,H=Math.round(max*1.2),c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,W,H);const k=Math.max(W/img.width,H/img.height),w=img.width*k,h=img.height*k;g.drawImage(img,(W-w)/2,(H-h)*0.25,w,h);res(c.toDataURL('image/jpeg',0.82))};img.src=fr.result};fr.readAsDataURL(file)})}
let PROFILE_ID=null;
const profStudent=()=>SCHOOL&&SCHOOL.students.find(s=>s.id===PROFILE_ID);
function paintProfile(){const s=profStudent();if(!s)return;$('sp-photo').innerHTML=avatar(s,true);$('sp-name').textContent=s.name;const cl=(SCHOOL.classes.find(c=>c.id===s.classId)||{}).name||'—',yr=(SCHOOL.years.find(y=>y.id===s.yearId)||{}).year||'—',st=((SCHOOL.classes.find(c=>c.id===s.classId)||{}).streams||[]).find(x=>x.id===s.streamId);$('sp-info').textContent=`${s.code} · ${s.gender} · ${classLabel(s)||cl}${st?' ('+st.name+')':''} · ${yr}`;$('sp-remove').style.display=s.photo?'':'none';$('sp-form').innerHTML=sForm(s)}
function openProfile(id){PROFILE_ID=id;$('sp-msg').textContent='';paintProfile();$('stModal').style.display='flex'}
$('st-body').onclick=e=>{const r=e.target.closest('tr[data-id]');if(!r)return;e.preventDefault();openProfile(r.dataset.id)};
$('sp-close').onclick=()=>{$('stModal').style.display='none';PROFILE_ID=null};
$('stModal').onclick=e=>{if(e.target===$('stModal'))$('sp-close').onclick()};
$('sp-upload').onclick=()=>$('sp-file').click();
$('sp-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';const s=profStudent();if(!f||!s)return;$('sp-msg').style.color='';$('sp-msg').textContent='Processing photo…';try{s.photo=await shrinkPhoto(f,240)}catch(err){$('sp-msg').textContent=err.message;return}paintProfile();loadStudents();const ok=await Promise.resolve(persist());$('sp-msg').style.color=ok===false?'#dc2626':'#059669';$('sp-msg').textContent=ok===false?'Photo shown but could not be saved — check your connection.':'Photo saved.'};
$('sp-remove').onclick=async()=>{const s=profStudent();if(!s)return;s.photo='';paintProfile();loadStudents();const ok=await Promise.resolve(persist());$('sp-msg').style.color=ok===false?'#dc2626':'#059669';$('sp-msg').textContent=ok===false?'Could not save — check your connection.':'Photo removed.'};

/* ===== Enter Results: every subject of the class for every student ===== */
var gridSel=null,gridDirty=false;
function resultSubjects(classId){return SCHOOL.subjects.filter(s=>(s.classes||[]).length===0||(s.classes||[]).includes(classId))}
function rkey(st,y,t,a,sub){return st+'|'+y+'|'+t+'|'+a+'|'+sub}
function gridTotals(tr){const v=[...tr.querySelectorAll('.result-mark')].map(i=>i.value).filter(x=>x!==''&&!isNaN(+x)).map(Number);tr.querySelector('.rs-total').textContent=v.length?v.reduce((p,q)=>p+q,0):'—';tr.querySelector('.rs-avg').textContent=v.length?(v.reduce((p,q)=>p+q,0)/v.length).toFixed(1):'—'}
function loadResultGrid(){
  if(!SCHOOL)return;
  const y=$('rs-year').value,t=$('rs-term').value,a=$('rs-assessment').value,c=$('rs-class').value;
  const subs=resultSubjects(c),students=SCHOOL.students.filter(s=>inClassY(s,c,y));
  const idx=new Map();SCHOOL.results.forEach(r=>idx.set(rkey(r.studentId,r.yearId,r.term,r.assessment,r.subjectId),r));
  gridSel={y,t,a,c,subs:subs.map(s=>s.id)};gridDirty=false;
  $('rs-head').innerHTML=subs.length?`<tr><th>Code</th><th>Student</th>${subs.map(s=>`<th>${esc(s.name)}</th>`).join('')}<th>Total</th><th>Avg</th></tr>`:'';
  if(!subs.length){$('rs-body').innerHTML='<tr><td>No subjects are assigned to this class yet. Add them in the Subjects tab.</td></tr>';return}
  $('rs-body').innerHTML=students.map(s=>`<tr data-id="${esc(s.id)}"><td>${esc(s.code)}</td><td style="white-space:nowrap"><b>${esc(s.name)}</b></td>${subs.map(sub=>{const r=idx.get(rkey(s.id,y,t,a,sub.id));return `<td><input class="result-mark" data-sub="${esc(sub.id)}" type="number" inputmode="decimal" min="0" max="100" step="any" value="${r?r.mark:''}" style="width:68px"></td>`}).join('')}<td class="rs-total">—</td><td class="rs-avg">—</td></tr>`).join('')||`<tr><td colspan="${subs.length+4}">No students in this class for the selected year.</td></tr>`;
  document.querySelectorAll('#rs-body tr[data-id]').forEach(tr=>{gridTotals(tr);tr.querySelectorAll('.result-mark').forEach(i=>i.oninput=()=>{const v=i.value;i.style.outline=(v!==''&&(isNaN(+v)||+v<0||+v>100))?'2px solid #dc2626':'';gridDirty=true;gridTotals(tr)})});
}
function saveResultGrid(){
  if(!gridSel)return Promise.resolve(true);
  const {y,t,a}=gridSel,idx=new Map();SCHOOL.results.forEach(r=>idx.set(rkey(r.studentId,r.yearId,r.term,r.assessment,r.subjectId),r));
  let bad=0,remove=new Set();
  document.querySelectorAll('#rs-body tr[data-id]').forEach(tr=>{tr.querySelectorAll('.result-mark').forEach(i=>{
    const v=i.value.trim(),k=rkey(tr.dataset.id,y,t,a,i.dataset.sub),ex=idx.get(k);
    if(v===''){if(ex)remove.add(ex);return}
    const n=+v;if(isNaN(n)||n<0||n>100){bad++;return}
    const m=Math.round(n*100)/100;
    if(ex)ex.mark=m;else SCHOOL.results.push({id:uid(),studentId:tr.dataset.id,yearId:y,term:t,assessment:a,subjectId:i.dataset.sub,mark:m});
  })});
  if(remove.size)SCHOOL.results=SCHOOL.results.filter(r=>!remove.has(r));
  try{localStorage.setItem('ius_sel_v1',JSON.stringify({year:y,term:t,assessment:a,classId:gridSel.c,src:'dashboard',ts:Date.now()}))}catch(e){}
  gridDirty=false;
  $('rs-msg').style.color=bad?'#dc2626':'';
  $('rs-msg').textContent=bad?`Saving… (${bad} mark(s) outside 0–100 were skipped)`:'Saving…';
  return Promise.resolve(persist()).then(ok=>{$('rs-msg').style.color=ok===false?'#dc2626':(bad?'#dc2626':'#059669');$('rs-msg').textContent=ok===false?'Could not save — check your connection and try again.':(bad?`Saved. ${bad} mark(s) outside 0–100 were skipped.`:'Results saved. They now appear in the report generator.');return ok!==false});
}
$('rs-save').onclick=()=>{saveResultGrid()};
$('rs-load').onclick=()=>loadResultGrid();
['rs-year','rs-term','rs-assessment','rs-class'].forEach(id=>{$(id).onchange=async()=>{if(gridDirty)await saveResultGrid();loadResultGrid();writeSel()}});

$('sp-delete').onclick=async()=>{
  const s=profStudent();if(!s)return;
  if(!confirm(`Delete ${s.name}?\n\nTheir photo and ALL their marks will also be deleted. This cannot be undone.`))return;
  SCHOOL.students=SCHOOL.students.filter(x=>x.id!==s.id);
  SCHOOL.results=SCHOOL.results.filter(r=>r.studentId!==s.id);
  $('stModal').style.display='none';PROFILE_ID=null;
  loadStudents();loadOverview();loadResultGrid();
  const ok=await Promise.resolve(persist());
  $('st-msg').style.color=ok===false?'#dc2626':'#059669';
  $('st-msg').textContent=ok===false?'Could not save the deletion — check your connection and try again.':`${s.name} was deleted.`;
};

/* ===== Linked windows: choosing a class/term/year here moves the Report Generator window too (and back) ===== */
var selTs=0;
function writeSel(){try{const o={year:$('rs-year').value,term:$('rs-term').value,assessment:$('rs-assessment').value,classId:$('rs-class').value,src:'dashboard',ts:Date.now()};selTs=o.ts;localStorage.setItem('ius_sel_v1',JSON.stringify(o))}catch(e){}}
function applyRemoteSel(){
  try{
    const s=JSON.parse(localStorage.getItem('ius_sel_v1')||'null');
    if(!s||s.src==='dashboard'||!(s.ts>selTs)||!SCHOOL)return;
    if(window.__iusImportPending&&window.__iusImportPending())return; // don't move the selection while a marks import is waiting
    selTs=s.ts;
    const has=(id,v)=>[...$(id).options].some(o=>o.value===v);let changed=false;
    [['rs-year',s.year],['rs-term',s.term],['rs-assessment',s.assessment],['rs-class',s.classId]].forEach(([id,v])=>{if(v&&has(id,v)&&$(id).value!==v){$(id).value=v;changed=true}});
    if(changed)Promise.resolve(gridDirty?saveResultGrid():null).then(loadResultGrid);
  }catch(e){}
}
setInterval(applyRemoteSel,700);window.addEventListener('storage',e=>{if(e.key==='ius_sel_v1')applyRemoteSel()});


/* ===== Extra details: students (DOB, NIN, parent/guardian, alternative contact) and teachers/staff ===== */
const STX=[['dob','Date of Birth','date'],['nin','NIN (National ID No.), if any','text'],['address','Home Address','text']];
const STP=[['parentRel','Parent','select',['Father','Mother']],['parentName','Parent Full Name','text'],['parentPhone','Parent Contact (phone)','tel']];
const STA=[['altName','Alternative Contact Name','text'],['altRel','Relationship to Student','text'],['altPhone','Alternative Contact Phone','tel']];
const ROLES=['Teacher','Head Teacher','Deputy Head Teacher','Director of Studies','Bursar','Secretary','Librarian','Matron / Patron','Security','Cook','Cleaner','Driver','Other staff'];
const TCX=[['role','Role / Position','select',ROLES],['gender','Gender','select',['Male','Female']],['dob','Date of Birth','date'],['nin','NIN (National ID No.), if any','text'],['address','Home Address','text']];
function fld(f,p,v){const id=p+f[0];if(f[2]==='select')return `<label>${f[1]}<select id="${id}">${f[3].map(o=>`<option${o===v?' selected':''}>${o}</option>`).join('')}</select></label>`;return `<label>${f[1]}<input id="${id}" type="${f[2]}" value="${esc(v||'')}"></label>`}
const fields=(F,p,o)=>F.map(f=>fld(f,p,(o||{})[f[0]])).join('');
const readF=(F,p)=>{const o={};F.forEach(f=>o[f[0]]=$(p+f[0]).value.trim());return o};
function age(d){if(!d)return '';const b=new Date(d);if(isNaN(b))return '';const n=new Date();let a=n.getFullYear()-b.getFullYear();if(n<new Date(n.getFullYear(),b.getMonth(),b.getDate()))a--;return a>=0&&a<120?a:''}
function buildStForm(){$('st-extra').innerHTML=fields(STX,'sx-');$('st-parent').innerHTML=fields(STP,'sx-');$('st-alt').innerHTML=fields(STA,'sx-')}
buildStForm();
$('tc-extra').innerHTML=fields(TCX,'tx-');
function sForm(s){return `<div class="grid"><label>Full Name<input id="spx-name" value="${esc(s.name)}"></label><label>Gender<select id="spx-gender"><option${s.gender==='Male'?' selected':''}>Male</option><option${s.gender==='Female'?' selected':''}>Female</option></select></label>${fields(STX,'spx-',s)}<label>Second class (optional)<select id="spx-class2">${dualOptions(s.classId,s.dualClassId||'')}</select></label></div><h4 class="sub-h">Parent / Guardian</h4><div class="grid">${fields(STP,'spx-',s)}</div><h4 class="sub-h">Alternative person to contact</h4><div class="grid">${fields(STA,'spx-',s)}</div>`}
$('sp-save').onclick=async()=>{const s=profStudent();if(!s)return;const n=$('spx-name').value.trim();if(!n){$('sp-msg').style.color='#dc2626';$('sp-msg').textContent='Name cannot be empty.';return}const c2=$('spx-class2')?$('spx-class2').value:(s.dualClassId||''),derr=dualCheck(s.classId,c2);if(derr){$('sp-msg').style.color='#dc2626';$('sp-msg').textContent=derr;return}s.dualClassId=c2||'';s.name=n;s.gender=$('spx-gender').value;Object.assign(s,readF(STX.concat(STP,STA),'spx-'));await Promise.resolve(persist());paintProfile();loadStudents();loadOverview();$('sp-msg').style.color='#059669';$('sp-msg').textContent='Details saved.'};

let TC_ID=null;const tcStaff=()=>SCHOOL.teachers.find(t=>t.id===TC_ID);
function tavatar(t,big){const c=big?'avatar big':'avatar';return t.photo&&/^data:image\//.test(t.photo)?`<img class="${c}" src="${t.photo}" alt="">`:`<span class="${c} ph">${esc((t.name||'?').trim().charAt(0).toUpperCase())}</span>`}
function paintStaff(){const t=tcStaff();if(!t)return;$('tp-photo').innerHTML=tavatar(t,true);$('tp-name').textContent=t.name;$('tp-info').textContent=t.role||'Teacher';$('tp-remove').style.display=t.photo?'':'none';$('tp-form').innerHTML=`<div class="grid"><label>Full Name<input id="tpx-name" value="${esc(t.name)}"></label><label>Email<input id="tpx-email" type="email" value="${esc(t.email)}"></label><label>Phone<input id="tpx-phone" type="tel" value="${esc(t.phone)}"></label>${fields(TCX,'tpx-',t)}</div>`}
function openStaff(id){TC_ID=id;$('tp-msg').textContent='';paintStaff();$('tcModal').style.display='flex'}
$('tp-close').onclick=()=>{$('tcModal').style.display='none';TC_ID=null};
$('tcModal').onclick=e=>{if(e.target===$('tcModal'))$('tp-close').onclick()};
$('tp-save').onclick=async()=>{const t=tcStaff();if(!t)return;const n=$('tpx-name').value.trim();if(!n){$('tp-msg').style.color='#dc2626';$('tp-msg').textContent='Name cannot be empty.';return}t.name=n;t.email=$('tpx-email').value.trim();t.phone=$('tpx-phone').value.trim();Object.assign(t,readF(TCX,'tpx-'));await Promise.resolve(persist());paintStaff();renderPeople();$('tp-msg').style.color='#059669';$('tp-msg').textContent='Details saved.'};
$('tp-upload').onclick=()=>$('tp-file').click();
$('tp-file').onchange=async e=>{const f=e.target.files[0];e.target.value='';const t=tcStaff();if(!f||!t)return;try{t.photo=await shrinkPhoto(f,240)}catch(err){$('tp-msg').textContent=err.message;return}await Promise.resolve(persist());paintStaff();renderPeople();$('tp-msg').style.color='#059669';$('tp-msg').textContent='Photo saved.'};
$('tp-remove').onclick=async()=>{const t=tcStaff();if(!t)return;t.photo='';await Promise.resolve(persist());paintStaff();renderPeople()};
$('tp-delete').onclick=async()=>{const t=tcStaff();if(!t)return;if(!confirm(`Delete ${t.name} from teachers & staff? This cannot be undone.`))return;SCHOOL.teachers=SCHOOL.teachers.filter(x=>x.id!==t.id);$('tcModal').style.display='none';TC_ID=null;await Promise.resolve(persist());renderPeople();loadOverview()};
$('tc-add').onclick=async()=>{const n=$('tc-name').value.trim();if(!n){$('tc-msg').textContent='Enter the full name.';return}let photo='';const pf=$('tc-photo').files[0];if(pf){try{photo=await shrinkPhoto(pf,240)}catch(err){$('tc-msg').textContent=err.message;return}}SCHOOL.teachers.push({id:uid(),name:n,email:$('tc-email').value.trim(),phone:$('tc-phone').value.trim(),photo,...readF(TCX,'tx-')});['tc-name','tc-email','tc-phone','tc-photo'].forEach(i=>$(i).value='');$('tc-extra').innerHTML=fields(TCX,'tx-');persist();loadOverview();$('tc-msg').style.color='#059669';$('tc-msg').textContent='Added.'};

function currentPayrollPeriod(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function moneyPayroll(n){return (+n||0).toLocaleString('en-US')}
function renderTeacherPayroll(){
  const root=$('tc-payroll');if(!root)return;
  const staff=SCHOOL.teachers||[],profiles=SCHOOL.teacherPayProfiles=SCHOOL.teacherPayProfiles||{},payments=SCHOOL.teacherSalaryPayments=SCHOOL.teacherSalaryPayments||[];
  if(!staff.length){root.innerHTML='<h3>Teacher Salary &amp; Payment Profiles</h3><p>Add a teacher or staff member first.</p>';return}
  const selected=$('pay-teacher')?.value||staff[0].id,period=$('pay-period')?.value||currentPayrollPeriod(),t=staff.find(x=>x.id===selected)||staff[0],profile=profiles[t.id]||{},days=profile.daysWorkedByPeriod?.[period]??0;
  const due=profile.payType==='daily'?(+profile.rate||0)*(+days||0):(+profile.rate||0),paid=payments.filter(x=>x.teacherId===t.id&&x.period===period).reduce((a,x)=>a+(+x.amount||0),0),balance=Math.max(0,due-paid),pct=due>0?Math.min(100,Math.round(paid/due*100)):0,status=due<=0?'NILL':paid<=0?'NILL':paid>=due?'Fully paid':'Partly paid';
  root.innerHTML=`<h3>Teacher Salary &amp; Payment Profiles</h3><p class="hint">Set each teacher's monthly salary or daily rate, then record payments. All values are stored locally with the school records.</p>
   <div class="grid"><label>Teacher<select id="pay-teacher">${staff.map(x=>`<option value="${esc(x.id)}"${x.id===t.id?' selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label>Salary period<input id="pay-period" type="month" value="${esc(period)}"></label><label>Payment basis<select id="pay-type"><option value="monthly"${(profile.payType||'monthly')==='monthly'?' selected':''}>Monthly salary</option><option value="daily"${profile.payType==='daily'?' selected':''}>Daily payment</option></select></label><label id="pay-rate-label">${profile.payType==='daily'?'Rate per day (UGX)':'Full monthly salary (UGX)'}<input id="pay-rate" type="number" min="0" value="${esc(profile.rate??'')}" placeholder="Enter salary / rate"></label><label>Salary starts from<input id="pay-start" type="date" value="${esc(profile.startDate||'')}"></label><label id="pay-days-label" style="${profile.payType==='daily'?'':'display:none'}">Days worked in selected period<input id="pay-days" type="number" min="0" max="31" value="${esc(days)}"></label></div>
   <button id="pay-profile-save">Save salary profile</button><p class="msg" id="pay-profile-msg"></p>
   <div class="payroll-summary"><div><small>Full amount for period</small><b>UGX ${moneyPayroll(due)}</b></div><div><small>Paid so far</small><b>UGX ${moneyPayroll(paid)}</b></div><div><small>Balance remaining</small><b>UGX ${moneyPayroll(balance)}</b></div><div><small>Payment progress</small><b>${due>0?pct+'%':'NILL'} · ${status}</b></div></div>
   <h4>Record salary payment</h4><div class="grid"><label>Amount paid (UGX)<input id="pay-amount" type="number" min="1" placeholder="Enter amount paid"></label><label>Payment date<input id="pay-date" type="date" value="${new Date().toISOString().slice(0,10)}"></label><label>Note / reference<input id="pay-note" placeholder="Optional"></label></div><button id="pay-record">Record salary payment</button><p class="msg" id="pay-record-msg"></p>
   <h4>Payments for ${esc(period)}</h4>${payments.filter(x=>x.teacherId===t.id&&x.period===period).length?`<div style="overflow-x:auto"><table class="datatable"><thead><tr><th>Date</th><th>Amount (UGX)</th><th>Note / reference</th></tr></thead><tbody>${payments.filter(x=>x.teacherId===t.id&&x.period===period).map(x=>`<tr><td>${esc(x.date||'')}</td><td>${moneyPayroll(x.amount)}</td><td>${esc(x.note||'—')}</td></tr>`).join('')}</tbody></table></div>`:'<p>No salary payments recorded for this period.</p>'}
   <h4>All teacher payment profiles</h4><div style="overflow-x:auto"><table class="datatable"><thead><tr><th>Teacher</th><th>Basis</th><th>Full amount this period</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>${staff.map(x=>{const pr=profiles[x.id]||{},d=pr.daysWorkedByPeriod?.[period]||0,full=pr.payType==='daily'?(+pr.rate||0)*d:(+pr.rate||0),got=payments.filter(z=>z.teacherId===x.id&&z.period===period).reduce((a,z)=>a+(+z.amount||0),0);return `<tr><td>${esc(x.name)}</td><td>${pr.payType==='daily'?'Daily':'Monthly'}</td><td>${moneyPayroll(full)}</td><td>${moneyPayroll(got)}</td><td>${moneyPayroll(Math.max(0,full-got))}</td><td>${full<=0||got<=0?'NILL':got>=full?'Fully paid':'Partly paid'}</td></tr>`}).join('')}</tbody></table></div>`;
  $('pay-teacher').onchange=renderTeacherPayroll;$('pay-period').onchange=renderTeacherPayroll;
  $('pay-type').onchange=()=>{$('pay-rate-label').firstChild.textContent=$('pay-type').value==='daily'?'Rate per day (UGX)':'Full monthly salary (UGX)';$('pay-days-label').style.display=$('pay-type').value==='daily'?'':'none'};
  $('pay-profile-save').onclick=async()=>{const rate=$('pay-rate').value.trim(),type=$('pay-type').value,daysRaw=$('pay-days')?.value||'0';if(rate===''||!Number.isFinite(+rate)||+rate<0){$('pay-profile-msg').textContent='Enter a valid salary or daily rate.';return}const old=profiles[t.id]||{};profiles[t.id]={...old,payType:type,rate:+rate,startDate:$('pay-start').value,daysWorkedByPeriod:{...(old.daysWorkedByPeriod||{}),[period]:Math.max(0,Math.min(31,+daysRaw||0))}};await Promise.resolve(persist());renderTeacherPayroll()};
  $('pay-record').onclick=async()=>{const amount=+$('pay-amount').value;if(!profiles[t.id]){$('pay-record-msg').textContent='Save the salary profile first.';return}if(!Number.isFinite(amount)||amount<=0){$('pay-record-msg').textContent='Enter an amount greater than zero.';return}payments.push({id:uid(),teacherId:t.id,period,date:$('pay-date').value,amount,note:$('pay-note').value.trim()});await Promise.resolve(persist());renderTeacherPayroll()};
}
function renderPeople(){
  const q=($('ov-search')?.value||'').toLowerCase().trim(),cn=s=>classLabel(s);
  const sts=SCHOOL.students.filter(s=>!q||[s.name,s.code,cn(s),s.parentName,s.parentPhone].join(' ').toLowerCase().includes(q));
  $('ov-sc').textContent=`(${SCHOOL.students.length})`;$('ov-tc').textContent=`(${SCHOOL.teachers.length})`;
  $('ov-students').innerHTML=sts.map(s=>{const st=((SCHOOL.classes.find(c=>c.id===s.classId)||{}).streams||[]).find(x=>x.id===s.streamId),a=age(s.dob);return `<div class="pcard" data-sid="${esc(s.id)}">${avatar(s)}<div><b>${esc(s.name)}</b><small>${esc(s.code)} · ${esc(s.gender)} · ${esc(cn(s))}${st?' ('+esc(st.name)+')':''}</small><small>DOB: ${esc(s.dob||'—')}${a!==''?' (age '+a+')':''}${s.nin?' · NIN: '+esc(s.nin):''}</small><small>${s.parentName?esc(s.parentRel||'Parent')+': '+esc(s.parentName)+' · '+esc(s.parentPhone||'no phone'):'Parent: not entered'}</small>${s.altName||s.altPhone?`<small>Alt: ${esc(s.altName)}${s.altRel?' ('+esc(s.altRel)+')':''} · ${esc(s.altPhone)}</small>`:''}</div></div>`}).join('')||'<p>No students found.</p>';
  const tcs=SCHOOL.teachers,list=tcs.map(t=>`<div class="pcard" data-tid="${esc(t.id)}">${tavatar(t)}<div><b>${esc(t.name)}</b><small>${esc(t.role||'Teacher')}${t.gender?' · '+esc(t.gender):''}</small><small>${esc(t.phone||'')}${t.email?' · '+esc(t.email):''}</small><small>${t.dob?'DOB: '+esc(t.dob):''}${t.nin?' · NIN: '+esc(t.nin):''}</small></div></div>`).join('')||'<p>No teachers or staff yet.</p>';
  $('ov-staff').innerHTML=list;$('tc-list').innerHTML=list;renderTeacherPayroll();
}
$('ov-search').oninput=renderPeople;
document.addEventListener('click',e=>{const s=e.target.closest('[data-sid]'),t=e.target.closest('[data-tid]');if(s)openProfile(s.dataset.sid);else if(t)openStaff(t.dataset.tid)});
renderPeople();

/* ===== App version + link to administrator update ===== */
(async()=>{const el=$('pf-ver');if(!el||!window.iusUpdater)return;try{const s=await window.iusUpdater.status();const v=s.running==='update'?s.updateVersion:s.builtinVersion;el.innerHTML=`Application version <b>${esc(v)}</b> · <a href="admin.html">Application update (administrator)</a>`}catch(e){}})();

/* ---- show only what belongs to this school's type (primary or secondary) ---- */
const TYPE_CATS={primary:['primary','tp'],secondary:['senior12','senior34','alevel','tp','tj','ts']};
function allowedCats(){return TYPE_CATS[SCHOOL&&SCHOOL.schoolType]||null}
function applyTypeFilter(){const a=allowedCats();if(!a)return;const sel=$('cl-category');if(sel){[...sel.options].forEach(o=>{if(!a.includes(o.value))o.remove();else if(o.value==='tp'&&SCHOOL.schoolType==='secondary')o.textContent='شعبة'})}}
try{applyTypeFilter()}catch(e){}

/* ---- schools made before 1.5.53 choose their type once ---- */
(function(){
 if(!SCHOOL||SCHOOL.schoolType)return;
 const w=document.createElement('div');w.id='typeAsk';
 w.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,.62);display:flex;align-items:center;justify-content:center;padding:16px';
 w.innerHTML='<div style="background:#fff;color:#0f172a;border-radius:18px;max-width:460px;width:100%;padding:22px;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:inherit"><h3 style="margin:0 0 6px;color:#1e3a8a">What type of school is this?</h3><p style="margin:0 0 14px;font-size:.92rem;color:#475569">Choose once so the app only shows the classes, subjects and report types that belong to your school. Your existing data is not changed.</p><div style="display:grid;gap:8px"><button data-t="primary" style="padding:12px;border-radius:12px;border:0;background:#1e3a8a;color:#fff;font-weight:700;cursor:pointer">Primary School <small style="display:block;font-weight:400;opacity:.85">Primary + Theology Primary</small></button><button data-t="secondary" style="padding:12px;border-radius:12px;border:0;background:#1e3a8a;color:#fff;font-weight:700;cursor:pointer">Secondary School <small style="display:block;font-weight:400;opacity:.85">Senior 1–6 + Theology Junior / Secondary</small></button><button data-t="all" style="padding:10px;border-radius:12px;border:1.5px solid #cbd5e1;background:#fff;color:#334155;cursor:pointer">Show everything (skip)</button></div></div>';
 w.querySelectorAll('button').forEach(b=>b.onclick=()=>{SCHOOL.schoolType=b.dataset.t;persist();location.reload()});
 document.body.appendChild(w);
})();
