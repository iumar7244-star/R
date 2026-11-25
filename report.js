const SUBJECTS={
  senior12:["English Language","Mathematics","Biology","Chemistry","Physics","Geography","History & Political Education","Entrepreneurship Education","Physical Education (PE)","General Science","Kiswahili"],
  alevel:[],
  senior34:["English Language","Mathematics","Biology","Chemistry","Physics","Geography","History & Political Education"],
  primary:["English","Mathematics","Integrated Science","Social Studies"],
  tp:["القرآن","التربية الإسلامية","الفقه","اللغة العربية"],
  tj:["الحفظ والتفسير","التلاوة والتجويد","الإملاء والخط","الأدب والنصوص","إنشاء والمطالعة","النحو والصرف","فقه العبادات","الحديث","العقيدة","التاريخ"],
  ts:["الحفظ والتفسير","التلاوة والتجويد","الإملاء والخط","الأدب والنصوص","إنشاء والمطالعة","النحو والصرف","فقه العبادات","الحديث","العقيدة","التاريخ","مصطلح الحديث","أصول الفقه","أصول التفسير","فقه المعاملات","الأديان والفرق"]
};
const ELECTIVES={
  senior12:{options:["Arabic Language","Luganda","Art","Religious Education","Other / Custom Subject"],max:1},
  senior34:{options:["Arabic Language","Luganda","Kiswahili","Art","Entrepreneurship Education","Religious Education","Other / Custom Subject"],max:2}
};
const ENF=["Inter","Roboto","Segoe UI","Lato","Open Sans","Poppins","Nunito","Calibri","Times New Roman","Georgia","Montserrat","Arial"],ARF=["Noto Sans Arabic","Cairo","Tajawal","Almarai","Readex Pro","Amiri","Traditional Arabic","Sakkal Majalla","Changa","Kufam","Scheherazade New","Harmattan"];
const CATEGORY_NAMES={alevel:"Senior 5 & 6 (A-Level)",senior12:"Senior 1 & 2 (O-Level)",senior34:"Senior 3 & 4 (O-Level)",primary:"Primary School",tp:"التعليم الديني الابتدائي",tj:"أول إعدادي - ثالث إعدادي",ts:"أول ثانوي - ثالث ثانوي"};
const $=id=>document.getElementById(id);
ENF.forEach(x=>$('fontEn').add(new Option(x,x)));ARF.forEach(x=>$('fontAr').add(new Option(x,x)));
$('fontEn').value='Arial';$('fontAr').value='Noto Sans Arabic';
let students=[],badge='';
const uid=()=>Math.random().toString(36).slice(2);
const loadSchools=()=>JSON.parse(localStorage.getItem('ius_sons_local_schools_v1')||'[]');
const sessionId=()=>localStorage.getItem('ius_sons_local_session_v1');
let SCHOOL=loadSchools().find(s=>s.id===sessionId())||null;

/* Table header colour is only forced onto the table when the user picks something other than the default; the text colour follows the background so it is always readable. */
const HDR_DEFAULT='#1e3a8a';
const hdrCustom=()=>{const el=$('tableHeaderColor');return !!el&&el.value.toLowerCase()!==HDR_DEFAULT};
function onColor(hex){const m=/^#?([0-9a-f]{6})$/i.exec(hex||'');if(!m)return '#fff';const n=parseInt(m[1],16),r=(n>>16)&255,g=(n>>8)&255,b=n&255;return (0.299*r+0.587*g+0.114*b)>150?'#111827':'#ffffff'}
let customTables=[];
const DESIGN_DEFAULTS={badgePosition:'left',badgeSize:130,studentNameSize:'12',studentNameWeight:'bold',headingColor:'#1e3a8a',tableHeaderColor:'#1e3a8a',extraTableColor:'#111827',commentLanguage:'auto',primaryRankingMode:'aggregate',reportTypeSize:'13',reportTypeWeight:'bold',showStudentNo:'1',showDob:'1',showGender:'1',showPhoto:'1',showPosition:'1',showAggregate:'1',showPercentage:'1',showComment:'1',showSignatures:'1',tableFontSize:'10',resultTableFontSize:'10',teacherCommentFontSize:'10',teacherCommentWeight:'normal',reportPadding:'8',rcScheme:'blue',colSubject:'46',rowHeight:'0',labelWidth:'17',photoWidth:'15',summaryWidth:'34'};
const templateStoreKey=()=>`ius_report_templates_v1_${SCHOOL?.id||'manual'}`;
function readTemplates(){if(SCHOOL)return Array.isArray(SCHOOL.reportTemplates)?SCHOOL.reportTemplates:[];try{return JSON.parse(localStorage.getItem(templateStoreKey())||'[]')}catch(e){return[]}}
function refreshTemplateOptions(selected=''){const el=$('savedTemplate');if(!el)return;const cat=$('category')?.value||'';const ts=readTemplates().filter(t=>!t.category||t.category===cat);el.innerHTML='<option value="">Choose a saved template</option>'+ts.map(t=>`<option value="${esc(t.id)}">${esc(t.name)}</option>`).join('');if(selected&&ts.some(t=>t.id===selected))el.value=selected}
function currentDesign(){const d={};Object.keys(DESIGN_DEFAULTS).forEach(k=>{const el=$(k);d[k]=el?(el.type==='checkbox'?(el.checked?'1':'0'):el.value):DESIGN_DEFAULTS[k]});return d}
function applyDesign(d={}){Object.entries({...DESIGN_DEFAULTS,...d}).forEach(([k,v])=>{const el=$(k);if(el){if(el.type==='checkbox')el.checked=String(v)!=='0';else el.value=v}});$('badgeSizeLabel').textContent=$('badgeSize').value+' px';if($('reportTypeSizeLabel'))$('reportTypeSizeLabel').textContent=$('reportTypeSize').value+' pt';if($('reportPaddingLabel'))$('reportPaddingLabel').textContent=$('reportPadding').value+' mm';if($('tableFontSizeLabel'))$('tableFontSizeLabel').textContent=$('tableFontSize').value+' pt';if($('resultTableFontSizeLabel'))$('resultTableFontSizeLabel').textContent=$('resultTableFontSize').value+' pt';if($('teacherCommentFontSizeLabel'))$('teacherCommentFontSizeLabel').textContent=$('teacherCommentFontSize').value+' pt';if(Array.isArray(d.customTables))customTables=d.customTables.map(t=>({id:t.id||uid(),title:t.title||'Additional Information',rows:t.rows||''}));renderCustomTables();rcLabels();build()}
function renderCustomTables(){const host=$('customTablesEditor');if(!host)return;host.innerHTML=customTables.map((t,i)=>`<div class="custom-table-editor" data-table-id="${esc(t.id)}"><div class="custom-table-title"><b>Table ${i+1}</b><button class="danger remove-custom-table" type="button">Remove</button></div><label>Table heading<input class="custom-table-name" value="${esc(t.title)}" placeholder="Table heading"></label><label>Rows (Label | Value)<textarea class="custom-table-rows" rows="3" placeholder="Attendance | 95%&#10;Conduct | Very good">${esc(t.rows)}</textarea></label></div>`).join('')||'<p class="hint">No additional tables yet.</p>';host.querySelectorAll('.custom-table-name').forEach(el=>el.oninput=()=>{const t=customTables.find(x=>x.id===el.closest('[data-table-id]').dataset.tableId);if(t){t.title=el.value;build()}});host.querySelectorAll('.custom-table-rows').forEach(el=>el.oninput=()=>{const t=customTables.find(x=>x.id===el.closest('[data-table-id]').dataset.tableId);if(t){t.rows=el.value;build()}});host.querySelectorAll('.remove-custom-table').forEach(el=>el.onclick=()=>{customTables=customTables.filter(x=>x.id!==el.closest('[data-table-id]').dataset.tableId);renderCustomTables();build()})}
function saveDesignTemplate(){const name=$('templateName').value.trim();if(!name){alert('Enter a name for this design template first.');$('templateName').focus();return}const ts=readTemplates(),id=$('savedTemplate').value||uid(),entry={id,name,category:$('category')?.value||'',design:currentDesign(),customTables:JSON.parse(JSON.stringify(customTables)),updatedAt:new Date().toISOString()};const i=ts.findIndex(t=>t.id===id);if(i>=0)ts[i]=entry;else ts.push(entry);if(SCHOOL){SCHOOL.reportTemplates=ts;persistSchool()}else localStorage.setItem(templateStoreKey(),JSON.stringify(ts));refreshTemplateOptions(id);$('templateName').value=name;alert('Report design template saved on this device for this school.')}
function loadDesignTemplate(){const t=readTemplates().find(x=>x.id===$('savedTemplate').value);if(!t)return;applyDesign({...t.design,customTables:t.customTables});$('templateName').value=t.name}
function deleteDesignTemplate(){const id=$('savedTemplate').value;if(!id){alert('Choose a saved template first.');return}if(!confirm('Delete this saved report design?'))return;const remaining=readTemplates().filter(t=>t.id!==id);if(SCHOOL){SCHOOL.reportTemplates=remaining;persistSchool()}else localStorage.setItem(templateStoreKey(),JSON.stringify(remaining));refreshTemplateOptions()}

function persistSchool(){if(!SCHOOL)return;const all=loadSchools(),i=all.findIndex(s=>s.id===SCHOOL.id);if(i>=0){/* only write what this window owns, so students/classes added meanwhile on the dashboard are never overwritten */all[i]=Object.assign({},all[i],{results:SCHOOL.results,reportTemplates:SCHOOL.reportTemplates});localStorage.setItem('ius_sons_local_schools_v1',JSON.stringify(all));}}
function esc(x){return String(x??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
const theology=()=>['tp','tj','ts'].includes($('category').value);
const isPrimary=()=>['primary','tp'].includes($('category').value);
const isSecondary=()=>['senior12','senior34'].includes($('category').value);
/* ---- Arabic parent comments (1.5.26): 6 performance levels x 2 genders, chosen automatically from the registered student's gender ---- */
const PARENT_COMMENTS_AR=[
  {m:'حقق الطفل تفوقًا أكاديميًا متميزًا، ونرجو تشجيعه على مواصلة التميز.',f:'حققت الطفلة تفوقًا أكاديميًا متميزًا، ونرجو تشجيعها على مواصلة التميز.'},
  {m:'أظهر الطفل أداءً جيدًا جدًا، ونرجو دعمه للمحافظة على هذا المستوى.',f:'أظهرت الطفلة أداءً جيدًا جدًا، ونرجو دعمها للمحافظة على هذا المستوى.'},
  {m:'أحرز الطفل تقدمًا جيدًا، ونرجو تشجيعه على مواصلة الاجتهاد.',f:'أحرزت الطفلة تقدمًا جيدًا، ونرجو تشجيعها على مواصلة الاجتهاد.'},
  {m:'حقق الطفل تقدمًا مقبولًا، ويحتاج إلى مزيد من المراجعة المنتظمة.',f:'حققت الطفلة تقدمًا مقبولًا، وتحتاج إلى مزيد من المراجعة المنتظمة.'},
  {m:'يحتاج الطفل إلى مزيد من الاجتهاد والمراجعة لتحسين مستواه الدراسي.',f:'تحتاج الطفلة إلى مزيد من الاجتهاد والمراجعة لتحسين مستواها الدراسي.'},
  {m:'يحتاج الطفل إلى دعم أكاديمي إضافي وتعاون مستمر بين الأسرة والمدرسة.',f:'تحتاج الطفلة إلى دعم أكاديمي إضافي وتعاون مستمر بين الأسرة والمدرسة.'}
];
const PARENT_GENDER_WARNING_AR='تنبيه: لم يُحدَّد جنس الطالب في سجل التسجيل؛ حدِّد الجنس في Student Registration لتوليد تعليق عربي صحيح.';
function parentLevelIndex(avg){return avg>=90?0:avg>=80?1:avg>=70?2:avg>=60?3:avg>=50?4:5}
function parentGenderValue(v){
  const x=String(v==null?'':v).trim().toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/\s+/g,' ');
  if(['female','f','girl','fem','انثي','بنت','طالبه','طالبة','طفله','طفلة'].includes(x))return'F';
  if(['male','m','boy','ذكر','ولد','طالب','طفل'].includes(x))return'M';
  return'';
}
/* The registered student record is the source of truth: found by its id first, then by admission code, then by a unique name. */
function parentGenderOf(...recs){
  const reg=(typeof SCHOOL!=='undefined'&&SCHOOL&&SCHOOL.students)||[],nm=z=>String(z||'').trim().toLowerCase().replace(/\s+/g,' ');
  const found=[],own=[];
  recs.forEach(r=>{
    if(!r)return;
    let hit=null;const id=r.schoolStudentId||r.id;
    if(id!=null&&id!=='')hit=reg.find(x=>String(x.id)===String(id))||null;
    if(!hit&&r.code){const c=reg.filter(x=>x.code&&String(x.code)===String(r.code));if(c.length===1)hit=c[0]}
    if(!hit&&r.name){const c=reg.filter(x=>nm(x.name)===nm(r.name));if(c.length===1)hit=c[0]}
    if(hit)found.push(hit.gender);
    own.push(r.gender);
  });
  for(const v of [...found,...own]){const g=parentGenderValue(v);if(g)return g}
  return'';
}
function arabicParentComment(avg,gender){return gender?PARENT_COMMENTS_AR[parentLevelIndex(avg)][gender==='F'?'f':'m']:PARENT_GENDER_WARNING_AR}
function pg(m){if(m>=95)return['D1','1'];if(m>=80)return['D2','2'];if(m>=75)return['C3','3'];if(m>=70)return['C4','4'];if(m>=60)return['C5','5'];if(m>=55)return['C6','6'];if(m>=50)return['P7','7'];if(m>=40)return['P8','8'];return['F9','9']}
function tg(m){if(m>=80)return['ممتاز',''];if(m>=70)return['جيد جدا',''];if(m>=60)return['جيد',''];if(m>=50)return['حسن',''];if(m>=40)return['مقبول',''];return['راسب','']}
 /* Primary Theology only: four-subject D1–F9 aggregate scale. Secular and other Theology levels retain their existing grading. */
function tpGrade(m){if(m>=80)return['ممتاز','D1',1];if(m>=70)return['جيد جدا','D2',2];if(m>=65)return['جيد مرتفع','C3',3];if(m>=60)return['جيد منخفض','C4',4];if(m>=55)return['حسن مرتفع','C5',5];if(m>=50)return['حسن منخفض','C6',6];if(m>=45)return['مقبول مرتفع','P7',7];if(m>=40)return['مقبول منخفض','P8',8];return['راسب','F9',9]}
function theologyAggregate(data){const marks=(data?.marks||[]).filter(m=>m!==''&&m!=null&&!isNaN(+m));return{points:marks.reduce((sum,m)=>sum+tpGrade(+m)[2],0),entered:marks.length,count:(data?.marks||[]).length}}
function theologyDivision(points,count){if(count!==4)return{grade:'—',division:'—'};if(points>=4&&points<=12)return{grade:'ممتاز',division:'Division 1'};if(points<=23)return{grade:'جيد جدا',division:'Division 2'};if(points<=29)return{grade:'جيد',division:'Division 3'};if(points<=34)return{grade:'مقبول',division:'Division 4'};return{grade:'راسب',division:'Division U'}}
function gradeSummaryRows(isAr){const ranges=isAr?[[80,100,'ممتاز'],[70,79,'جيد جدا'],[65,69,'جيد مرتفع'],[60,64,'جيد منخفض'],[55,59,'حسن مرتفع'],[50,54,'حسن منخفض'],[45,49,'مقبول مرتفع'],[40,44,'مقبول منخفض'],[0,39,'راسب']]:[[95,100,'D1'],[80,94,'D2'],[75,79,'C3'],[70,74,'C4'],[60,69,'C5'],[55,59,'C6'],[50,54,'P7'],[40,49,'P8'],[0,39,'F9']];const cells=ranges.map(r=>`<td>${r[0]}–${r[1]}</td>`).join(''),grades=ranges.map(r=>`<td>${r[2]}</td>`).join('');return `<table class="grade-summary" dir="${isAr?'rtl':'ltr'}"><tbody><tr><th>Marks Range</th>${cells}</tr><tr><th>Grade</th>${grades}</tr></tbody></table>`}
function olGrade(m){if(m>=80)return['A','Pass with Distinction'];if(m>=70)return['B','Pass with Credit'];if(m>=60)return['C','Pass with Credit'];if(m>=50)return['D','Pass'];return['E','Pass with lower competency']}
function grade(m){return m===''?['—','']: $('category').value==='tp'?tpGrade(+m):theology()?tg(+m):(isSecondary()||$('category').value==='alevel')?olGrade(+m):pg(+m)}
function toArabicDigits(v){return String(v??'').replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[d])}
function total(s){return s.marks.reduce((a,b)=>a+(+b||0),0)}
/* Primary aggregate uses Uganda-style subject grade points: D1=1, D2=2, C3=3 ... F9=9. */
function primaryAggregate(data){const marks=(data?.marks||[]).filter(m=>m!==''&&m!=null&&!isNaN(+m));return {points:marks.reduce((sum,m)=>sum+(+pg(+m)[1]||0),0),entered:marks.length,count:(data?.marks||[]).length};}
function aggregateBand(points,count){if(!count||count!==4)return '—';if(points>=4&&points<=12)return 'I';if(points>=13&&points<=23)return 'II';if(points>=24&&points<=29)return 'III';if(points>=30&&points<=34)return 'IV';if(points>=35&&points<=36)return 'U';return '—';}
function assessmentLabel(v){return ({BEGINNING_TERM:'Beginning of Term',MIDTERM:'Mid-Term',END_TERM:'End of Term'})[v]||String(v||'').replace(/_/g,' ');}
function reportPeriodMeta(isAr=false){const y=(SCHOOL?.years||[]).find(x=>x.id===$('reportYear').value);const year=y?.year||'';const term=$('reportTerm')?.value||'';const assessment=assessmentLabel($('reportAssessment')?.value);return `<br><b>${isAr?'السنة الدراسية':'Academic Year'}:</b> ${esc(year)}<br><b>${isAr?'الفصل':'Term'}:</b> ${esc(term)}<br><b>${isAr?'فترة التقييم':'Examination Period'}:</b> ${esc(assessment)}`;}
function overall(a){return a>=80?'ممتاز':a>=70?'جيد جدا':a>=60?'جيد':a>=50?'حسن':a>=40?'مقبول':'راسب'}
function inferCategory(name){const n=String(name||'').toLowerCase();if(/senior\s*[56]|s[56]\b|s\.\s*[56]/.test(n))return'alevel';if(/senior\s*[12]|s[12]\b|s\.\s*[12]/.test(n))return'senior12';if(/senior\s*[34]|s[34]\b|s\.\s*[34]/.test(n))return'senior34';if(/primary|p[1-7]\b|p\.\s*[1-7]/.test(n))return'primary';if(/junior|j[1-3]\b/.test(n))return'tj';if(/theology.*primary|religious.*primary/.test(n))return'tp';if(/theology.*secondary|religious.*secondary/.test(n))return'ts';return'primary'}
function getSelectedClass(){return SCHOOL?.classes?.find(c=>c.id===$('className').value)||null}
function getSchoolSubjects(classId){
  if(!SCHOOL?.subjects?.length)return[];
  const assigned=SCHOOL.subjects.filter(s=>Array.isArray(s.classes)&&s.classes.length===0||Array.isArray(s.classes)&&s.classes.includes(classId));
  return assigned.map(s=>s.name).filter(Boolean);
}
function currentSubjects(cat=$('category').value){const cls=getSelectedClass();const schoolSubs=cls?getSchoolSubjects(cls.id):[];return schoolSubs.length?schoolSubs:SUBJECTS[cat]||[]}
function makeReportData(cat,subjectList=currentSubjects(cat)){return{marks:subjectList.map(()=>''),customNames:{},subjects:[...subjectList]}}
function ensureSubjects(s,cat){const subs=currentSubjects(cat);if(!Array.isArray(s.subjects)||s.subjects.length!==subs.length||s.subjects.some((x,i)=>x!==subs[i])){const old=Object.fromEntries((s.subjects||[]).map((x,i)=>[x,s.marks?.[i]??'']));s.marks=subs.map(x=>old[x]??'');s.subjects=[...subs];}return s}
function ensureCombined(s){if(!s.combined)s.combined={primary:makeReportData('primary'),tp:makeReportData('tp')};if(!s.combined.primary)s.combined.primary=makeReportData('primary');if(!s.combined.tp)s.combined.tp=makeReportData('tp');return s.combined}
function addStudent(){const cat=$('category').value;const subs=currentSubjects(cat);students.push({id:uid(),name:'',marks:subs.map(()=>''),subjects:[...subs],customNames:{},combined:{primary:makeReportData('primary'),tp:makeReportData('tp')}});render()}
function combinedMode(){return $('perPage').value==='combined'&&$('category').value==='primary'}
const dualMode=()=>['dual1','dual2'].includes($('perPage').value);
function reportEditor(data,key,title){
  const sub=data.subjects||SUBJECTS[key]||[];
  const rows=data.marks.map((m,i)=>{const g=key==='primary'?pg(+m||0):key==='tp'?tpGrade(+m||0):tg(+m||0);return `<div class="subject" data-i="${i}"><input class="subname" readonly value="${esc(sub[i]||'Subject')}"><input class="combined-mark" type="number" min="0" max="100" step="1" inputmode="numeric" data-report="${key}" value="${m}" placeholder="0–100"><div class="grade" dir="auto">${m===''?'—':g[0]}</div></div>`}).join('');
  return `<div class="combined-report-editor" data-report-key="${key}"><div class="combined-title"><b>${title}</b><span class="combined-total">Total: ${total(data)} / ${data.marks.length*100} | Percentage: ${data.marks.length?(total(data)/data.marks.length).toFixed(2):0}%</span><button type="button" class="gray combined-restore" data-report="${key}">Restore</button><button type="button" class="gray combined-clear" data-report="${key}">Clear</button></div>${rows}</div>`;
}
function renderSingle(){
  const cat=$('category').value,sub=currentSubjects(cat),secondary=isSecondary(),cLen=SUBJECTS[cat]?.length||0;
  students.forEach(s=>ensureSubjects(s,cat));
  $('students').innerHTML=students.map((s,n)=>{
    const subjectRows=s.marks.map((m,i)=>{const g=grade(m),isCompulsory=secondary&&i<cLen;return `<div class="subject" data-i="${i}"><input class="subname" ${isCompulsory?'readonly':''} value="${esc(s.customNames?.[i]??s.subjects?.[i]??sub[i]??'Subject')}"><input class="mark" type="number" min="0" max="100" step="1" inputmode="numeric" value="${m}" placeholder="0–100"><div class="grade" dir="auto">${g[0]}</div>${isCompulsory?'':'<button class="danger del">Remove</button>'}</div>`}).join('');
    let electivePicker='';
    if(secondary&&!SCHOOL){const pool=ELECTIVES[cat],used=Math.max(0,s.marks.length-cLen),remaining=pool.max-used;const opts=pool.options.filter(o=>!(s.subjects||[]).includes(o));if(remaining>0)electivePicker=`<div class="electiveRow"><select class="electivePick">${opts.map(o=>`<option>${esc(o)}</option>`).join('')}</select><button class="green addElective">+ Add Elective (${remaining} left)</button></div>`}
    return `<div class="student" data-id="${s.id}"><div class="student-head"><b>${n+1}.</b><input class="name" value="${esc(s.name)}" placeholder="Student full name"><button class="green addsub">+ Add Subject</button><button class="gray restore">Restore Defaults</button><button class="gray clear">Clear Table</button><button class="danger remove">Remove Student</button></div>${subjectRows}${electivePicker}<b class="totalLine">Total: ${total(s)} / ${s.marks.length*100} | Percentage: ${s.marks.length?(total(s)/s.marks.length).toFixed(2):0}%</b></div>`;
  }).join('');
  document.querySelectorAll('.student').forEach(c=>{
    const s=students.find(x=>x.id===c.dataset.id);c.querySelector('.name').oninput=e=>{s.name=e.target.value;build()};c.querySelector('.remove').onclick=()=>{students=students.filter(x=>x!==s);render()};
    c.querySelector('.clear').onclick=()=>{s.marks=s.marks.map(()=> '');render()};c.querySelector('.restore').onclick=()=>{const subs=currentSubjects($('category').value);s.subjects=[...subs];s.marks=subs.map(()=> '');s.customNames={};render()};
    c.querySelector('.addsub').onclick=()=>{s.subjects=s.subjects||currentSubjects($('category').value);s.subjects.push('New Subject');s.marks.push('');render()};
    c.querySelectorAll('.subname').forEach((e,i)=>e.oninput=()=>{s.customNames=s.customNames||{};s.customNames[i]=e.value;build()});
    c.querySelectorAll('.mark').forEach((e,i)=>e.oninput=()=>{let v=e.value.replace(/\D/g,'');s.marks[i]=v===''?'':Math.min(100,parseInt(v,10));if(s.marks[i]!==''&&+e.value>100)e.value=100;c.querySelectorAll('.subject')[i].querySelector('.grade').textContent=grade(s.marks[i])[0];c.querySelector('.totalLine').textContent=`Total: ${total(s)} / ${s.marks.length*100} | Percentage: ${s.marks.length?(total(s)/s.marks.length).toFixed(2):0}%`;build()});
    c.querySelectorAll('.del').forEach(btn=>btn.onclick=()=>{const i=+btn.closest('.subject').dataset.i;s.marks.splice(i,1);s.subjects.splice(i,1);render()});
    const ae=c.querySelector('.addElective');if(ae)ae.onclick=()=>{const choice=c.querySelector('.electivePick').value;s.subjects.push(choice);s.marks.push('');render()};
  });
}
function renderCombined(){
  $('students').innerHTML=students.map((s,n)=>{const data=ensureCombined(s);return `<div class="student combined-student" data-id="${s.id}"><div class="student-head"><b>${n+1}.</b><input class="name" value="${esc(s.name)}" placeholder="Student full name"><button class="danger remove">Remove Student</button></div>${dualMode()?`<p class="combined-hint">One student, <b>one combined report</b>: the Primary School subjects and the التعليم الديني الابتدائي subjects are loaded from the student's two classes. Marks are saved against the correct subject, year and term.</p>`:`<p class="combined-hint">One student, two separate reports. Enter marks independently for each report. The student's name appears only on the first report when printed.</p>`}${reportEditor(data.primary,'primary',dualMode()&&s.dualPair?'Primary School — '+esc(s.dualPair.primary.name):'Primary School Report')}${reportEditor(data.tp,'tp',dualMode()&&s.dualPair?'التعليم الديني الابتدائي — '+esc(s.dualPair.tp.name):'Theology Primary Report')}</div>`}).join('');
  document.querySelectorAll('.combined-student').forEach(c=>{const s=students.find(x=>x.id===c.dataset.id),data=ensureCombined(s);c.querySelector('.name').oninput=e=>{s.name=e.target.value;build()};c.querySelector('.remove').onclick=()=>{students=students.filter(x=>x!==s);render()};
    c.querySelectorAll('.combined-mark').forEach(e=>e.oninput=()=>{const key=e.dataset.report,i=+e.closest('.subject').dataset.i,v=e.value.replace(/\D/g,'');data[key].marks[i]=v===''?'':Math.min(100,parseInt(v,10));const box=e.closest('.combined-report-editor'),d=data[key];box.querySelector('.combined-total').textContent=`Total: ${total(d)} / ${d.marks.length*100} | Percentage: ${d.marks.length?(total(d)/d.marks.length).toFixed(2):0}%`;e.closest('.subject').querySelector('.grade').textContent=v===''?'—':(key==='primary'?pg(+v)[0]:key==='tp'?tpGrade(+v)[0]:tg(+v)[0]);build()});
    c.querySelectorAll('.combined-clear').forEach(btn=>btn.onclick=()=>{data[btn.dataset.report].marks=data[btn.dataset.report].marks.map(()=> '');render()});c.querySelectorAll('.combined-restore').forEach(btn=>btn.onclick=()=>{data[btn.dataset.report]=s.dualPair?dualSection(s,btn.dataset.report):makeReportData(btn.dataset.report);render()});
  });
}
function render(){if(combinedMode()||dualMode())renderCombined();else renderSingle();renderPreview();build()}
function renderPreview(){const old=$('preview').value;$('preview').innerHTML=students.map((s,i)=>`<option value="${s.id}">${i+1}. ${esc(s.name||'Unnamed')}</option>`).join('');if(students.some(s=>s.id===old))$('preview').value=old}
function rank(s){const a=students.map(x=>combinedMode()?total(ensureCombined(x).primary):total(x)).sort((a,b)=>b-a);const score=combinedMode()?total(ensureCombined(s).primary):total(s);return a.indexOf(score)+1}
/* ===== 1.5.53 — blue report-card layout (all categories, 1 / 2 per A4 page, combined). Grading and comments are unchanged. ===== */
const RC_TITLES={alevel:['SENIOR 5 & 6 REPORT CARD (A-LEVEL)',''],primary:['PRIMARY SCHOOL REPORT CARD',''],tp:['THEOLOGY PRIMARY REPORT CARD','التعليم الديني الابتدائي'],tj:['JUNIOR THEOLOGY REPORT CARD','أول إعدادي - ثالث إعدادي'],ts:['SECONDARY THEOLOGY REPORT CARD','أول ثانوي - ثالث ثانوي'],senior12:['SENIOR 1 & 2 REPORT CARD (O-LEVEL)',''],senior34:['SENIOR 3 & 4 REPORT CARD (O-LEVEL)','']};
const chk=id=>{const e=$(id);return !e||!!e.checked};
function fmtDate(v){const m=/^(\d{4})-(\d{2})-(\d{2})/.exec(String(v||''));return m?`${m[3]} / ${m[2]} / ${m[1]}`:String(v||'')}
function rcRec(s){return SCHOOL&&s&&s.schoolStudentId?((SCHOOL.students||[]).find(x=>x.id===s.schoolStudentId)||null):null}
function rcSheetStyle(fontFamily,two,rows){
  const rh=two?(rows<=6?6.2:rows<=9?5.2:4.6):(rows<=4?12:rows<=6?10:rows<=8?8.6:rows<=11?7.4:6.4);
  const acc=$('tableHeaderColor').value;
  return `font-family:${fontFamily};color:${$('fontColor').value};--rc-accent:${acc};--rc-on:${onColor(acc)};--rc-head:${$('headingColor').value||$('fontSchool').value};--report-padding:${$('reportPadding').value}mm;--rc-type:${($('reportTypeSize').value/11).toFixed(3)}em;--rc-typew:${$('reportTypeWeight').value};--rc-tbl:${($('resultTableFontSize').value/11).toFixed(3)}em;--rc-cmt:${($('teacherCommentFontSize').value/11).toFixed(3)}em;--rc-cmtw:${$('teacherCommentWeight').value};--badge-size:${$('badgeSize').value}px;--rh:${+$('rowHeight').value&&!two?$('rowHeight').value:rh}mm;--c-sub:${$('colSubject').value}%;--lw:${$('labelWidth').value}%;--pw:${$('photoWidth').value}%;--sw:${$('summaryWidth').value}%`;
}
function rcHead(){
  const hasBadge=badge&&$('badgePosition').value!=='hidden';
  const l1=[($('pobox')?.value||'').trim()?'P.O. Box '+esc($('pobox').value.trim()):'',($('location')?.value||'').trim()?esc($('location').value.trim()):''].filter(Boolean).join(', ');
  const tel=($('tel')?.value||'').trim();
  return `<div class="rc-head">${hasBadge?`<img class="report-badge rc-badge" src="${badge}" alt="">`:''}<div class="rc-hd-t"><div class="school-title rc-school" style="color:${$('headingColor').value||$('fontSchool').value}">${esc($('school').value||'SCHOOL NAME')}</div>${l1?`<div class="rc-addr">${l1}</div>`:''}${tel?`<div class="rc-addr">Tel: ${esc(tel)}</div>`:''}</div></div>`;
}
function rcTitle(en,ar){return `<div class="rc-title"><b>${esc(en)}</b>${ar?`<span dir="rtl">${esc(ar)}</span>`:''}</div>`}
/* info table: list of [English label, Arabic label, value HTML] shown two per row, optional photo on the right */
function rcInfo(items,isAr,photo){
  const rows=[];for(let i=0;i<items.length;i+=2)rows.push(items.slice(i,i+2));
  const lab=it=>`<th>${it[0]}${isAr?`<i dir="rtl">${it[1]}</i>`:''}</th>`;
  const ph=photo?`<td class="rc-photo" rowspan="${rows.length}"><img class="student-photo" src="${photo}" alt=""></td>`:'';
  return `<table class="rc-info"><tbody>${rows.map((r,ri)=>`<tr>${r.map((it,ci)=>lab(it)+`<td${r.length===1?' colspan="3"':''}>${it[2]}</td>`).join('')}${ri===0?ph:''}</tr>`).join('')}</tbody></table>`;
}
function rcClassComment(data,s,isAr){
  const entered=data.marks.filter(m=>m!==''&&m!=null&&!isNaN(+m));
  const a=entered.length?entered.reduce((x,m)=>x+(+m),0)/entered.length:0;
  const en=a>=90?'Dear Parent/Guardian, your child has demonstrated outstanding academic achievement and a positive attitude towards learning. Please encourage continued excellence.':a>=80?'Dear Parent/Guardian, your child has performed very well this term. Regular revision and your continued encouragement will support further progress.':a>=70?'Dear Parent/Guardian, your child is making very good progress. Consistent effort and support with revision at home can lead to even better results.':a>=60?'Dear Parent/Guardian, your child has made satisfactory progress. Please encourage regular practice and monitor schoolwork to strengthen learning.':a>=50?'Dear Parent/Guardian, your child is developing understanding but needs more consistent effort, especially in weaker subjects. Please support regular revision at home.':'Dear Parent/Guardian, your child needs additional academic support and more consistent study habits. Please work closely with the teachers to address areas of difficulty.';
  const ar=arabicParentComment(a,parentGenderOf(s));
  const cl=$('commentLanguage')?.value||'auto',showAr=cl==='ar'||(cl==='auto'&&isAr);
  const text=!entered.length?'':(cl==='both'?`${en}<br><span dir="rtl" style="font-family:'${$('fontAr').value}'">${ar}</span>`:(showAr?ar:en));
  return {text,rtl:showAr,both:cl==='both'};
}
const HM_TEXT={END_TERM:"We sincerely thank you, dear parents, for your continued support and cooperation throughout the term. We appreciate your efforts in supporting your child\u2019s education and development. We wish you and your family a happy, peaceful, and blessed holiday. We look forward to welcoming the students back next term, ready to continue their learning and growth.",MIDTERM:"Thank you for your continued effort and commitment to learning. Keep working hard, developing new skills, and making good use of your time at school. Stay focused, participate actively in your lessons, and continue striving for improvement."};
function hmBox(isAr){const a=$('reportAssessment')?.value||'',t=HM_TEXT[a]||'';return `<div class="rc-box rc-parent rc-hm"><h4>Headmaster's Comment${isAr?' <i dir="rtl">تعليق مدير المدرسة</i>':''}:</h4><div class="rc-hmtxt${t?'':' rc-lines'}" data-hm="${esc(a)}" dir="ltr">${t}</div></div>`}
function card(s,two,keyOverride,dataOverride,showName=true){
  const key=keyOverride||$('category').value,isO=key==='senior12'||key==='senior34'||key==='alevel',isAr=['tp','tj','ts'].includes(key),data=dataOverride||s,t=total(data),n=data.marks.length,avg=n?t/n:0,sub=data.subjects||currentSubjects(key);
  const rec=rcRec(s)||{},y=(SCHOOL?.years||[]).find(x=>x.id===$('reportYear')?.value);
  const num=v=>isAr?toArabicDigits(v):v;
  /* results table */
  const hasCode=!isAr||key==='tp';
  const th=(en,ar)=>`<th>${en}${isAr?`<i dir="rtl">${ar}</i>`:''}</th>`;
  const head=`<tr>${th('Subjects','المادة')}${th('Marks / 100','العلامة / ١٠٠')}${th('Grade','التقدير')}${hasCode?th(isAr?'Grade Code':'Code / Level','الرمز'):''}</tr>`;
  const rows=data.marks.map((m,i)=>{const g=isO?olGrade(+m||0):(key==='primary'?pg(+m||0):key==='tp'?tpGrade(+m||0):tg(+m||0));return `<tr><td class="rc-sub">${esc(data.customNames?.[i]??sub[i]??'Subject')}</td><td>${num(+m||0)}</td><td dir="auto">${m===''?'—':g[0]}</td>${hasCode?`<td>${m===''?'—':g[1]}</td>`:''}</tr>`}).join('');
  const band=`<div class="rc-band"><span>${isAr?'Total Marks / المجموع':'Total Marks'}: <b>${num(t)} / ${num(n*100)}</b></span>${chk('showPercentage')?`<span>${isAr?'Percentage / النسبة المئوية':'Percentage'}: <b>${num(avg.toFixed(2))}%</b></span>`:''}</div>`;
  /* class summary */
  const lines=[];
  const pos=()=>chk('showPosition')&&lines.push([isAr?'Position / المركز':'Position',`${rank(s)} / ${students.length}`]);
  if(usePositionForCurrentReport(key))pos();
  else if(['primary','tp'].includes(key)){
    if(chk('showAggregate')){const ag=key==='tp'?theologyAggregate(data):primaryAggregate(data),done=ag.entered===ag.count,fin=done?(key==='tp'?theologyDivision(ag.points,ag.count).grade+' – '+theologyDivision(ag.points,ag.count).division:aggregateBand(ag.points,ag.count)):'—';
      lines.push([isAr?'Total Aggregate / مجموع النقاط':'Total Aggregate',done?num(ag.points):'—']);lines.push([isAr?'Final Grade / الدرجة':'Final Grade',fin])}
  }else pos();
  if(isO)lines.push(['Overall Grade',`${olGrade(avg)[0]} — ${olGrade(avg)[1]}`]);else if(key==='ts')lines.push(['Overall Grade / التقدير العام',overall(avg)]);
  const summary=`<div class="rc-box rc-sum"><h4>Class Summary${isAr?' <i dir="rtl">ملخص الصف</i>':''}</h4>${lines.map(l=>`<div class="rc-ln"><span>${l[0]}</span><b>${l[1]}</b></div>`).join('')||'<div class="rc-ln"><span>—</span></div>'}</div>`;
  /* comments (same text and rules as before) */
  const c=rcClassComment(data,s,isAr);
  const cLabel=c.rtl&&!c.both?'تعليق معلم الصف':c.both?"Class Teacher's Comment / تعليق معلم الصف":"Class Teacher's Comment";
  const comment=`<div class="rc-box rc-cm comment" dir="${c.rtl&&!c.both?'rtl':'ltr'}" style="color:${$('fontComment').value};font-family:'${c.rtl?$('fontAr').value:$('fontEn').value}';font-size:var(--rc-cmt,1em);font-weight:var(--rc-cmtw,normal)"><h4>${cLabel}:</h4><div>${c.text}</div></div>`;
  const parent=hmBox(isAr);
  const custom=customTables.map(t=>{const lines=String(t.rows||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);if(!lines.length&&!String(t.title||'').trim())return'';return `<div class="custom-report-table" style="color:${$('extraTableColor').value}"><h3>${esc(t.title||'Additional Information')}</h3><table><tbody>${lines.map(line=>{const p=line.split('|');return `<tr><th>${esc((p.shift()||'').trim())}</th><td>${esc(p.join('|').trim())}</td></tr>`}).join('')}</tbody></table></div>`}).join('');
  const foot=`<div class="rc-foot"><span>Class Teacher's Signature: <i class="ln"></i></span><span>Head Teacher's Signature: <i class="ln"></i></span><span>Date: <i class="ln sm"></i></span></div>`;
  /* student information */
  const items=[];
  if(showName)items.push(['Student Name','اسم الطالب',`<span class="report-student-name" style="color:${$('fontStudent').value};font-size:${($('studentNameSize').value/11).toFixed(3)}em;font-weight:${$('studentNameWeight').value}">${esc(s.name||'—')}</span>`]);
  items.push(['Class','الصف',esc(getClassLabel())]);
  if(showName&&chk('showStudentNo')&&rec.code)items.push(['Student No.','رقم الطالب',esc(rec.code)]);
  items.push(['Academic Year','السنة الدراسية',esc(y?.year||'')]);
  if(showName&&chk('showDob')&&rec.dob)items.push(['Date of Birth','تاريخ الميلاد',esc(fmtDate(rec.dob))]);
  items.push(['Term','الفصل',esc($('reportTerm')?.value||'')]);
  if(showName&&chk('showGender')&&rec.gender)items.push(['Gender','الجنس',esc(rec.gender)]);
  items.push(['Exam Period','فترة التقييم',esc(assessmentLabel($('reportAssessment')?.value))]);
  const photo=showName&&chk('showPhoto')&&s.photo&&/^data:image\//.test(s.photo)?s.photo:'';
  const [tEn,tAr]=RC_TITLES[key]||['SCHOOL REPORT CARD',''];
  const ff=`'${isAr?$('fontAr').value:$('fontEn').value}',${isAr?'Arial,':''}serif`;
  const bd=$('border').value;
  return `<div data-sid="${esc(s.id||'')}" data-cat="${key}" class="report-sheet rc ${two?'two':'one'} ${$('color').value} bd-${bd} tb-${$('tableDesign').value} pos-${$('badgePosition').value} sc-${$('rcScheme').value}${isAr?' ar':''}${showName?'':' nohead'}" style="${rcSheetStyle(ff,two,n)}"><div class="rc-in">${showName?rcHead():''}${rcTitle(tEn,tAr)}${rcInfo(items,isAr,photo)}<div class="rc-res"><table class="rc-tbl" dir="${isAr?'rtl':'ltr'}"><thead>${head}</thead><tbody>${rows}</tbody></table>${band}</div>${chk('showComment')?`<div class="rc-bottom">${summary}${comment}</div>${parent}`:`<div class="rc-bottom one">${summary}</div>`}${custom}${chk('showSignatures')?foot:''}</div></div>`;
}
function schoolContact(){const p=($('pobox')?.value||'').trim(),t=($('tel')?.value||'').trim(),a=[];if(p)a.push('P.O. Box '+esc(p));if(t)a.push('Tel: '+esc(t));return a.length?`<div class="location">${a.join(' · ')}</div>`:''}
function getClassLabel(){const c=getSelectedClass();return c?c.name:($('className').value||'—')}
function isLowerPrimaryClass(){const n=String(getClassLabel()).toLowerCase().replace(/\s+/g,' ');return /\b(p[1-3]|primary\s*[1-3]|primary[1-3]|class\s*[1-3])\b/.test(n)}
function usePositionForCurrentReport(key){return key==='primary'&&$('primaryRankingMode')?.value==='position-lower'&&isLowerPrimaryClass()}
function twoUpMode(){return $('perPage').value==='2'}
function build(){if(!students.length){$('report').innerHTML='';return}let out='';if(dualMode()){students.forEach(s=>{out+=s.dualPair?dualCard(s,$('perPage').value==='dual2'):''})}else if(combinedMode()){students.forEach(s=>{const d=ensureCombined(s);out+=card(s,true,'primary',d.primary,true);out+=card(s,true,'tp',d.tp,false)})}else if(twoUpMode()){students.forEach(s=>out+=card(s,true));}else students.forEach(s=>out+=card(s,false));$('report').innerHTML=out;applyEditable();fitDual()}
function help(){const k=$('category').value;if(k==='senior12')$('gradingHelp').innerHTML=`O-Level grading: A 80–100 · B 70–79 · C 60–69 · D 50–59 · E 0–49. Senior 1 & 2 rules: 11 compulsory subjects + exactly 1 elective when using the built-in curriculum.`;else if(k==='senior34')$('gradingHelp').innerHTML=`O-Level grading: A 80–100 · B 70–79 · C 60–69 · D 50–59 · E 0–49. Senior 3 & 4 rules: 7 core subjects + up to 2 electives when using the built-in curriculum.`;else if(k==='tp')$('gradingHelp').innerHTML=`Primary Theology grading: 80–100 D1 ممتاز · 70–79 D2 جيد جدا · 65–69 C3 جيد مرتفع · 60–64 C4 جيد منخفض · 55–59 C5 حسن مرتفع · 50–54 C6 حسن منخفض · 45–49 P7 مقبول مرتفع · 40–44 P8 مقبول منخفض · 0–39 F9 راسب. Four subjects are summed into the final aggregate and division.`;else if(theology())$('gradingHelp').innerHTML=`Theology grading: 80–100 ممتاز · 70–79 جيد جدا · 60–69 جيد · 50–59 حسن · 40–49 مقبول · below 40 راسب.`;else $('gradingHelp').innerHTML=`Primary grading: F9 0–39 · P8 40–49 · P7 50–54 · C6 55–59 · C5 60–69 · C4 70–74 · C3 75–79 · D2 80–94 · D1 95–100.`}
function populateSchool(){if(!SCHOOL)return;$('school').value=SCHOOL.name||'IUS AND SONS';$('location').value=SCHOOL.location||'';$('pobox').value=SCHOOL.pobox||'';$('tel').value=SCHOOL.tel||'';if(SCHOOL.badge_url&&/^data:image\//.test(SCHOOL.badge_url)){badge=SCHOOL.badge_url;$('badgePreview').src=badge;$('badgePreview').style.display='block'}const classes=SCHOOL.classes||[];$('className').innerHTML=classes.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('')||'<option value="">No classes created yet</option>';const years=SCHOOL.years||[];$('reportYear').innerHTML=years.map(y=>`<option value="${y.id}">${y.year}</option>`).join('')||'<option value="">No academic years</option>';if(classes.length){const c=classes[0];$('className').value=c.id;$('category').value=c.category||inferCategory(c.name)}help();}
let reportDirty=false;
function loadSchoolStudents(){reportDirty=false;if(!SCHOOL){$('studentsMsg').textContent='No school is signed in. Add students manually below.';if(!students.length)addStudent();return}const classId=$('className').value;const yearId=$('reportYear').value;const cat=$('category').value;const subs=currentSubjects(cat);const all=(SCHOOL.students||[]).filter(s=>inClassY(s,classId,yearId));const list=dualMode()?all.filter(s=>stDual(s)):all;students=list.map(st=>{const marks=subs.map(subject=>{const subjectRec=(SCHOOL.subjects||[]).find(x=>x.name===subject);const r=(SCHOOL.results||[]).find(r=>r.studentId===st.id&&r.subjectId===subjectRec?.id&&r.yearId===yearId&&r.term===$('reportTerm').value&&r.assessment===$('reportAssessment').value);return r?.mark??''});return{id:st.id,name:st.name,photo:st.photo||'',marks,subjects:[...subs],customNames:{},schoolStudentId:st.id,combined:{primary:makeReportData('primary'),tp:makeReportData('tp')}}});attachDual();$('studentsMsg').textContent=list.length?`${list.length} student(s) loaded from ${SCHOOL.name}.`:'No students found for this class/year. Add students from the School Dashboard.';dualMsg(all,list);render()}
function saveReportResults(){if(!SCHOOL){$('studentsMsg').textContent='No school account is signed in; changes are only for this report preview.';return}const classId=$('className').value,yearId=$('reportYear').value,term=$('reportTerm').value,assessment=$('reportAssessment').value;const subs=currentSubjects($('category').value);students.forEach(st=>{if(!st.schoolStudentId)return;if(st.dualPair&&st.combined&&(dualMode()||combinedMode())){['primary','tp'].forEach(key=>{const d=st.combined[key],cid=st.dualPair[key].id;d.subjects.forEach((nm,i)=>{const sr=findSubj(nm,cid);if(!sr)return;SCHOOL.results=SCHOOL.results.filter(r=>!(r.studentId===st.schoolStudentId&&r.subjectId===sr.id&&r.yearId===yearId&&r.term===term&&r.assessment===assessment));const mk=d.marks[i];if(mk!==''&&mk!=null)SCHOOL.results.push({id:uid(),studentId:st.schoolStudentId,yearId,term,assessment,subjectId:sr.id,mark:+mk})})});return}st.marks.forEach((mark,i)=>{const subjectName=st.subjects?.[i]||subs[i];const sr=(SCHOOL.subjects||[]).find(x=>x.name===subjectName);if(!sr)return;SCHOOL.results=SCHOOL.results.filter(r=>!(r.studentId===st.schoolStudentId&&r.subjectId===sr.id&&r.yearId===yearId&&r.term===term&&r.assessment===assessment));if(mark!=='')SCHOOL.results.push({id:uid(),studentId:st.schoolStudentId,yearId,term,assessment,subjectId:sr.id,mark:+mark})})});reportDirty=false;persistSchool();$('studentsMsg').textContent='Report marks saved to the school records on this device.'}
$('loadStudents').onclick=loadSchoolStudents;$('add').onclick=addStudent;$('category').onchange=()=>{if(SCHOOL)loadSchoolStudents();else{students=students.map(s=>{const subs=currentSubjects($('category').value);return {...s,marks:subs.map((_,i)=>s.marks[i]||''),subjects:[...subs],customNames:{}}});help();render()}};$('preview').onchange=build;
['school','location','pobox','tel','color','fontEn','fontAr','fontColor','border','tableDesign','fontSchool','fontStudent','fontComment'].forEach(x=>$(x).oninput=build);
/* The general Font Color drives the three special colours until one of them is picked on its own */
['fontSchool','fontStudent','fontComment'].forEach(x=>{$(x).addEventListener('input',()=>{$(x).dataset.custom='1'})});
$('fontColor').addEventListener('input',()=>{['fontSchool','fontStudent','fontComment'].forEach(x=>{if(!$(x).dataset.custom)$(x).value=$('fontColor').value});build()});
$('tableDesign').onchange=build;$('perPage').onchange=()=>{if(SCHOOL)loadSchoolStudents();else render()};
$('category').addEventListener('change',()=>refreshTemplateOptions());
$('fontSchool').addEventListener('input',()=>{$('headingColor').value=$('fontSchool').value;build()});$('headingColor').addEventListener('input',()=>{$('fontSchool').value=$('headingColor').value;build()});
$('badge').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{badge=r.result;$('badgePreview').src=badge;$('badgePreview').style.display='block';build()};r.readAsDataURL(f)};
$('print').onclick=()=>print();$('word').onclick=()=>{
  /* Word cannot read this page's stylesheet, so every element gets its final look written inline. */
  const P=['color','background-color','font-family','font-size','font-weight','font-style','text-align','direction','line-height','padding','margin','border-top','border-right','border-bottom','border-left','border-collapse','border-spacing','border-radius','float'];
  const src=[...$('report').querySelectorAll('*')],root=$('report').cloneNode(true),dst=[...root.querySelectorAll('*')];
  src.forEach((el,i)=>{const cs=getComputedStyle(el);let s='';P.forEach(p=>{const v=cs.getPropertyValue(p);if(v)s+=p+':'+v+';'});if(el.tagName==='IMG')s+='width:'+el.getBoundingClientRect().width+'px;height:'+el.getBoundingClientRect().height+'px;';if(el.tagName==='TABLE'){s=s.replace(/margin:[^;]*;/,'')+'width:100%;margin:12px 0 0 0;';dst[i].setAttribute('width','100%')}dst[i].setAttribute('style',s)});
  root.querySelectorAll('.report-sheet').forEach(sh=>{sh.style.pageBreakAfter='always'});
  const b=new Blob([`<html><head><meta charset="utf-8"></head><body>${root.innerHTML}</body></html>`],{type:'application/msword'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='IUS-and-SONS-Reports.doc';a.click()};
if(SCHOOL){$('className').onchange=()=>{$('category').value=getSelectedClass()?.category||inferCategory(getSelectedClass()?.name);help();refreshTemplateOptions();loadSchoolStudents();writeSel()};const selChanged=()=>{loadSchoolStudents();writeSel()};$('reportYear').onchange=selChanged;$('reportTerm').onchange=selChanged;$('reportAssessment').onchange=selChanged;populateSchool();applyLastSelection();help();refreshTemplateOptions();loadSchoolStudents();}else{$('className').innerHTML='<option value="manual">Senior 1</option>';$('className').value='manual';help();addStudent()}
$('saveResults').onclick=saveReportResults;
['badgePosition','badgeSize','studentNameSize','studentNameWeight','headingColor','tableHeaderColor','extraTableColor','commentLanguage','primaryRankingMode','reportTypeSize','reportTypeWeight','showStudentNo','showDob','showGender','showPhoto','showPosition','showAggregate','showPercentage','showComment','showSignatures','tableFontSize','resultTableFontSize','teacherCommentFontSize','teacherCommentWeight','reportPadding','rcScheme','colSubject','rowHeight','labelWidth','photoWidth','summaryWidth'].forEach(id=>$(id).addEventListener('input',()=>{if(id==='rcScheme')applyScheme();rcLabels();if(id==='badgeSize')$('badgeSizeLabel').textContent=$('badgeSize').value+' px';if($('reportTypeSizeLabel'))$('reportTypeSizeLabel').textContent=$('reportTypeSize').value+' pt';if($('reportPaddingLabel'))$('reportPaddingLabel').textContent=$('reportPadding').value+' mm';if($('tableFontSizeLabel'))$('tableFontSizeLabel').textContent=$('tableFontSize').value+' pt';if($('resultTableFontSizeLabel'))$('resultTableFontSizeLabel').textContent=$('resultTableFontSize').value+' pt';if($('teacherCommentFontSizeLabel'))$('teacherCommentFontSizeLabel').textContent=$('teacherCommentFontSize').value+' pt';build()}));
$('addCustomTable').onclick=()=>{customTables.push({id:uid(),title:`Additional Information ${customTables.length+1}`,rows:'Attendance | \nConduct | '});renderCustomTables();build()};
$('saveTemplate').onclick=saveDesignTemplate;$('loadTemplate').onclick=loadDesignTemplate;$('deleteTemplate').onclick=deleteDesignTemplate;
refreshTemplateOptions();applyDesign(DESIGN_DEFAULTS);


/* ===== Automatic link with the School Dashboard ===== */
function applyLastSelection(){
  try{
    const s=JSON.parse(localStorage.getItem('ius_sel_v1')||'null');if(!s)return;
    const has=(id,v)=>[...$(id).options].some(o=>o.value===v);
    if(s.classId&&has('className',s.classId)){$('className').value=s.classId;const c=getSelectedClass();$('category').value=c?.category||inferCategory(c?.name)}
    if(s.year&&has('reportYear',s.year))$('reportYear').value=s.year;
    if(s.term&&has('reportTerm',s.term))$('reportTerm').value=s.term;
    if(s.assessment&&has('reportAssessment',s.assessment))$('reportAssessment').value=s.assessment;
  }catch(e){}
}
document.addEventListener('input',e=>{if(e.target.closest&&e.target.closest('#students'))reportDirty=true},true);
function refreshSchoolData(){
  if(!SCHOOL||reportDirty)return;
  const apply=fresh=>{if(!fresh||reportDirty)return;SCHOOL=fresh;loadSchoolStudents()};
  if(window.IUS&&IUS.boot){IUS.boot({optional:true}).then(apply).catch(()=>{})}
  else{try{apply(JSON.parse(localStorage.getItem('ius_sons_local_schools_v1')||'[]').find(s=>s.id===SCHOOL.id))}catch(e){}}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshSchoolData()});
window.addEventListener('focus',refreshSchoolData);
window.addEventListener('storage',e=>{if(e.key==='ius_sons_local_schools_v1')refreshSchoolData()});

/* ===== Linked windows: the dashboard's class/term/year selection moves this window too (and back) ===== */
var selTs=0;
function writeSel(){try{const o={year:$('reportYear').value,term:$('reportTerm').value,assessment:$('reportAssessment').value,classId:$('className').value,src:'report',ts:Date.now()};selTs=o.ts;localStorage.setItem('ius_sel_v1',JSON.stringify(o))}catch(e){}}
function applyRemoteSel(){
  try{
    const s=JSON.parse(localStorage.getItem('ius_sel_v1')||'null');
    if(!s||s.src==='report'||!(s.ts>selTs))return;
    selTs=s.ts;
    if(!SCHOOL||reportDirty)return;
    const has=(id,v)=>[...$(id).options].some(o=>o.value===v);let changed=false;
    if(s.classId&&has('className',s.classId)&&$('className').value!==s.classId){$('className').value=s.classId;const c=getSelectedClass();$('category').value=c?.category||inferCategory(c?.name);help();changed=true}
    [['reportYear',s.year],['reportTerm',s.term],['reportAssessment',s.assessment]].forEach(([id,v])=>{if(v&&has(id,v)&&$(id).value!==v){$(id).value=v;changed=true}});
    if(changed)loadSchoolStudents();
  }catch(e){}
}
setInterval(applyRemoteSel,700);window.addEventListener('storage',e=>{if(e.key==='ius_sel_v1')applyRemoteSel()});

/* Opened from the dashboard sidebar "Report Designer": jump straight to the designer once the start-up video is done */
(function(){const go=()=>{const id=(location.hash||'').slice(1),el=id&&document.getElementById(id);if(el)setTimeout(()=>el.scrollIntoView({behavior:'smooth',block:'start'}),150)};if(window.IUS_INTRO_DONE)go();else document.addEventListener('ius-intro-done',go,{once:true})})();

/* ===== Dual enrolment: one student, one Primary class + one التعليم الديني الابتدائي class ===== */
function inClass(s,id){return s.classId===id||s.dualClassId===id}
function enrol(s,y){if(!y||s.yearId===y)return{classId:s.classId,dualClassId:s.dualClassId||'',streamId:s.streamId||''};const h=(s.history||[]).find(x=>x.yearId===y);return h?{classId:h.classId,dualClassId:h.dualClassId||'',streamId:h.streamId||''}:null}
function inClassY(s,id,y){const e=enrol(s,y);return !!e&&(e.classId===id||e.dualClassId===id)}
function stDual(st){
  if(!SCHOOL||!st)return null;
  const e=enrol(st,$('reportYear').value);if(!e||!e.dualClassId)return null;
  const a=SCHOOL.classes.find(c=>c.id===e.classId),b=SCHOOL.classes.find(c=>c.id===e.dualClassId);
  if(!a||!b||a.id===b.id||a.category===b.category)return null;
  const cats=[a.category,b.category];if(!(cats.includes('primary')&&cats.includes('tp')))return null;
  return{primary:a.category==='primary'?a:b,tp:a.category==='tp'?a:b};
}
function subjFor(classId,cat){const s=getSchoolSubjects(classId);return s.length?s:(SUBJECTS[cat]||[])}
function findSubj(name,classId){return (SCHOOL.subjects||[]).find(x=>x.name===name&&(!(x.classes||[]).length||x.classes.includes(classId)))||null}
function storedMark(stId,subjRec){if(!subjRec)return'';const r=(SCHOOL.results||[]).find(r=>r.studentId===stId&&r.subjectId===subjRec.id&&r.yearId===$('reportYear').value&&r.term===$('reportTerm').value&&r.assessment===$('reportAssessment').value);return r?.mark??''}
function dualSubjects(pair,key){
  const cls=pair[key];let subs=subjFor(cls.id,key);
  if(key==='tp'){const ps=new Set(subjFor(pair.primary.id,'primary'));subs=subs.filter(n=>{const r=findSubj(n,cls.id);return !(r&&!(r.classes||[]).length&&ps.has(n))})}
  return subs;
}
function dualSection(o,key){const pair=o.dualPair,subs=dualSubjects(pair,key),id=o.schoolStudentId;return{marks:subs.map(n=>storedMark(id,findSubj(n,pair[key].id))),subjects:subs,customNames:{}}}
function attachDual(){students.forEach(o=>{const rec=(SCHOOL.students||[]).find(x=>x.id===o.schoolStudentId),p=stDual(rec);if(p){o.dualPair=p;o.dualRec=rec;o.combined={primary:dualSection(o,'primary'),tp:dualSection(o,'tp')}}})}
function dualMsg(all,list){if(dualMode()){if(!list.length)$('studentsMsg').textContent='No students in both a Primary and a Theology Primary class were found for this class/year. Assign a second class on the School Dashboard (Students).';else if(all.length>list.length)$('studentsMsg').textContent+=` ${all.length-list.length} student(s) with only one class are not shown here — choose “1 report” for their normal report.`}}
/* Position inside one class, using the same total() as every other report. Students loaded here use their on-screen marks, everybody else their saved marks. */
function dualRank(o,key){
  const cls=o.dualPair[key],yr=$('reportYear').value,members=(SCHOOL.students||[]).filter(x=>inClassY(x,cls.id,yr)),subs=dualSubjects(o.dualPair,key);
  const tot=m=>{const l=students.find(z=>z.schoolStudentId===m.id&&z.combined);if(l&&l.dualPair&&l.dualPair[key].id===cls.id)return total(l.combined[key]);return total({marks:subs.map(n=>storedMark(m.id,findSubj(n,cls.id)))})};
  const mine=tot({id:o.schoolStudentId}),all=members.map(tot).sort((a,b)=>b-a);
  return{pos:all.indexOf(mine)+1||1,of:all.length||1};
}
function dualCard(s,two){
  const pair=s.dualPair,rec=s.dualRec||{},d=s.combined,yrRec=(SCHOOL.years||[]).find(y=>y.id===$('reportYear').value);
  const isLowerPrimaryName=name=>{const n=String(name||'').toLowerCase().replace(/\s+/g,' ');return /\b(p[1-3]|p\.\s*[1-3]|primary\s*(one|two|three|1|2|3)|class\s*[1-3])\b/.test(n)};
  const lowerPrimaryPosition=key=>key==='primary'&&$('primaryRankingMode')?.value==='position-lower'&&isLowerPrimaryName(pair.primary.name);
  const secComment=(data,isAr,student)=>{
    const ent=data.marks.filter(m=>m!==''&&m!=null&&!isNaN(+m)),a=ent.length?ent.reduce((x,m)=>x+(+m),0)/ent.length:0;if(!ent.length)return'';
    const en=a>=90?'Dear Parent/Guardian, your child has demonstrated outstanding academic achievement. Please encourage continued excellence.':a>=80?'Dear Parent/Guardian, your child has performed very well. Regular revision and your continued encouragement will support further progress.':a>=70?'Dear Parent/Guardian, your child is making very good progress. Consistent effort at home can lead to even better results.':a>=60?'Dear Parent/Guardian, your child has made satisfactory progress. Please encourage regular practice at home.':a>=50?'Dear Parent/Guardian, your child needs more consistent effort, especially in weaker subjects. Please support regular revision.':'Dear Parent/Guardian, your child needs additional support. Please work closely with the teachers.';
    const ar=arabicParentComment(a,parentGenderOf(student,student&&student.dualRec));
    let cl=$('commentLanguage')?.value||'auto';if(cl==='auto')cl=isAr?'ar':'en';
    const rtl=cl==='ar',body=cl==='ar'?ar:cl==='en'?en:`${en}<br><span dir="rtl" style="font-family:'${$('fontAr').value}',Arial,sans-serif">${ar}</span>`;
    return `<div class="rc-box rc-cm comment" dir="${rtl?'rtl':'ltr'}" style="color:${$('fontComment').value};font-family:'${rtl?$('fontAr').value:$('fontEn').value}'"><h4>${cl==='ar'?'تعليق معلم الصف':cl==='en'?"Class Teacher's Comment":"Class Teacher's Comment / تعليق معلم الصف"}:</h4><div>${body}</div></div>`;
  };
  const sec=key=>{
    const isAr=key==='tp',data=d[key],sub=data.subjects,cls=pair[key],t=total(data),n=data.marks.length,avg=n?t/n:0;
    const num=v=>isAr?toArabicDigits(v):v;
    const rows=data.marks.map((m,i)=>{
      const g=isAr?tpGrade(+m||0):pg(+m||0);
      return `<tr><td class="rc-sub">${esc(data.customNames?.[i]??sub[i]??'Subject')}</td><td>${num(+m||0)}</td><td dir="auto">${m===''?'—':g[0]}</td><td>${m===''?'—':g[1]}</td>${isAr?`<td>${m===''?'—':num(g[2])}</td>`:''}</tr>`;
    }).join('');
    const th=(en,ar)=>`<th>${en}${isAr?`<i dir="rtl">${ar}</i>`:''}</th>`;
    const head=`<tr>${th('Subjects','المادة')}${th('Marks / 100','العلامة')}${th('Grade','التقدير')}${th('Grade Code','الرمز')}${isAr?th('Points','النقاط'):''}</tr>`;
    const lowerPosition=!isAr&&lowerPrimaryPosition(key);
    const lines=[];
    if(isAr){const ag=theologyAggregate(data),div=theologyDivision(ag.points,ag.count),done=ag.entered===ag.count;lines.push(['Total Aggregate / مجموع النقاط',done?num(ag.points):'—']);lines.push(['Final Grade / الدرجة',done?`${div.grade} – ${div.division}`:'—'])}
    else if(lowerPosition){const r=dualRank(s,'primary');lines.push(['Position',`${r.pos} / ${r.of}`])}
    else lines.push(['Overall Grade',data.marks.some(m=>m!==''&&m!=null&&!isNaN(+m))?pg(avg)[0]:'—']);
    const any=data.marks.some(m=>m!==''&&m!=null);
    const band=`<div class="rc-band"><span>Total Marks: <b>${num(t)} / ${num(n*100)}</b></span><span>${isAr?'Average / المعدل':'Average'}: <b>${any?num(avg.toFixed(1))+'%':'—'}</b></span></div>`;
    const sum=`<div class="rc-box rc-sum"><h4>${isAr?'ملخص <i dir="rtl"></i>Summary':'Summary'}</h4>${lines.map(l=>`<div class="rc-ln"><span>${l[0]}</span><b>${l[1]}</b></div>`).join('')}</div>`;
    return `<section class="rc-sec ${isAr?'ar':''}"><div class="rc-sec-title"><b>${isAr?'التعليم الديني الابتدائي':'Primary School — Secular'}</b>${isAr?'':`<span>${esc(cls.name)}</span>`}</div><div class="rc-res"><table class="rc-tbl" dir="${isAr?'rtl':'ltr'}"><thead>${head}</thead><tbody>${rows}</tbody></table>${band}</div><div class="rc-bottom">${sum}${secComment(data,isAr,s)||'<div class="rc-box rc-cm"></div>'}</div></section>`;
  };
  const photo=chk('showPhoto')&&s.photo&&/^data:image\//.test(s.photo)?s.photo:'';
  const items=[['Student Name','اسم الطالب',`<span class="report-student-name" style="color:${$('fontStudent').value};font-size:${($('studentNameSize').value/11).toFixed(3)}em;font-weight:${$('studentNameWeight').value}">${esc(s.name||'—')}</span>`],['Classes','الصفوف',esc(pair.primary.name)+' + '+esc(pair.tp.name)]];
  if(chk('showStudentNo')&&rec.code)items.push(['Student No.','رقم الطالب',esc(rec.code)]);
  items.push(['Academic Year','السنة الدراسية',esc(yrRec?yrRec.year:'')]);
  if(chk('showDob')&&rec.dob)items.push(['Date of Birth','تاريخ الميلاد',esc(fmtDate(rec.dob))]);
  items.push(['Term','الفصل',esc($('reportTerm').value)]);
  if(chk('showGender')&&rec.gender)items.push(['Gender','الجنس',esc(rec.gender)]);
  items.push(['Exam Period','فترة التقييم',esc(assessmentLabel($('reportAssessment').value))]);
  const foot=`<div class="rc-foot"><span>Class Teacher: <i class="ln"></i></span><span>Headmaster: <i class="ln"></i></span><span>Date: <i class="ln sm"></i></span></div>`;
  const head=hmBox(true);
  return `<div data-sid="${esc(s.id||'')}" data-cat="dual" class="report-sheet rc dual ${two?'two dual-two':'one'} ${$('color').value} bd-${$('border').value} tb-${$('tableDesign').value} pos-${$('badgePosition').value} sc-${$('rcScheme').value}" style="${rcSheetStyle(`'${$('fontEn').value}',serif`,two,10)}"><div class="rc-in">${rcHead()}${rcTitle('COMBINED REPORT CARD','')}${rcInfo(items,false,photo)}${sec('primary')}${sec('tp')}${chk('showComment')?head:''}${chk('showSignatures')?foot:''}</div></div>`;
}
/* Shrink each half-page report until every subject and result fits inside its half of the A4 sheet */
function fitDual(){
  document.querySelectorAll('#report .report-sheet.rc').forEach(el=>{
    const two=el.classList.contains('two');let fs=two?9.5:11;el.style.fontSize=fs+'pt';
    const inn=el.querySelector('.rc-in')||el;while(inn.scrollHeight>inn.clientHeight+1&&fs>4){fs-=0.25;el.style.fontSize=fs+'pt'}
  });
}
window.addEventListener('beforeprint',fitDual);

/* ===== 1.5.53 — click any text on a report card to edit it. Edits are remembered per school and survive re-rendering. ===== */
function EDIT_KEY(){return 'ius_report_text_v1_'+(SCHOOL?.id||'local')}
function readEdits(){try{return JSON.parse(localStorage.getItem(EDIT_KEY())||'{}')}catch(e){return {}}}
function saveEdits(o){try{localStorage.setItem(EDIT_KEY(),JSON.stringify(o))}catch(e){}}
var EDIT_SEL='.rc-school,.rc-addr,.rc-title b,.rc-title span,.rc-info th,.rc-tbl th,.rc-band span,.rc-box h4,.rc-ln span,.rc-foot>span,.rc-sec-title b,.rc-sec-title span,.rc-cm>div,.rc-hmtxt,.custom-report-table h3';
function applyEditable(){
  const ed=readEdits();
  document.querySelectorAll('#report .report-sheet.rc').forEach((sheet,si)=>{
    const sid=sheet.dataset.sid||'';
    let ci=0;sheet.querySelectorAll(EDIT_SEL).forEach(el=>{
      const isCm=el.matches('.rc-cm>div'),isHm=el.matches('.rc-hmtxt');
      const orig=el.dataset.orig=(isCm||isHm)?'':el.innerHTML;
      const key=isHm?'hm:'+el.dataset.hm:isCm?'cm:'+(sheet.dataset.sid||si)+':'+(sheet.dataset.cat||'')+':'+(ci++):'t:'+orig;
      if(ed[key]!=null)el.innerHTML=ed[key];
      el.contentEditable='true';el.spellcheck=false;el.classList.add('rc-ed');
      el.addEventListener('input',()=>{const o=readEdits();o[key]=el.innerHTML;saveEdits(o)});
      el.addEventListener('keydown',e=>{if(e.key==='Enter'&&!isCm&&!isHm){e.preventDefault();el.blur()}});
    });
  });
}
function resetReportText(){if(confirm('Reset all edited report wording to the defaults?')){try{localStorage.removeItem(EDIT_KEY())}catch(e){}build()}}
window.resetReportText=resetReportText;
document.getElementById('resetText')?.addEventListener('click',resetReportText);

/* ===== 1.5.53 — colour schemes and table size controls ===== */
const RC_SCHEMES={mono:'#111827',blue:'#1e3a8a',red:'#b91c1c',yellow:'#eab308',green:'#15803d',purple:'#6d28d9',orange:'#ea580c',teal:'#0f766e',maroon:'#7f1d1d',pink:'#be185d'};
function applyScheme(){const v=$('rcScheme').value,c=RC_SCHEMES[v];if(!c)return;$('tableHeaderColor').value=c;$('headingColor').value=(v==='yellow')?'#a16207':c}
function rcLabels(){[['colSubject',' %'],['labelWidth',' %'],['photoWidth',' %'],['summaryWidth',' %']].forEach(([id,u])=>{const l=$(id+'Label');if(l)l.textContent=$(id).value+u});const r=$('rowHeightLabel');if(r)r.textContent=+$('rowHeight').value?$('rowHeight').value+' mm':'Auto'}

/* ---- show only what belongs to this school's type (primary or secondary) ---- */
(function(){const T={primary:['primary','tp'],secondary:['senior12','senior34','alevel','tp','tj','ts']},a=T[SCHOOL&&SCHOOL.schoolType];if(!a)return;
 [...$('category').options].forEach(o=>{if(!a.includes(o.value))o.remove();else if(o.value==='tp'&&SCHOOL.schoolType==='secondary')o.textContent='شعبة'});
 if(SCHOOL.schoolType==='secondary'){[...$('perPage').options].forEach(o=>{if(['combined','dual1','dual2'].includes(o.value))o.remove()});
  document.querySelectorAll('h4.rg-sub').forEach(h=>{if(/Primary report ranking/i.test(h.textContent)){h.style.display='none';if(h.nextElementSibling)h.nextElementSibling.style.display='none'}})}
 if(!a.includes($('category').value)){$('category').value=a[0]}
 try{help();loadSchoolStudents()}catch(e){}
})();
