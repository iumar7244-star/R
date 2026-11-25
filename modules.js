/* IUS AND SONS 1.4.0 - dashboard redesign + new modules (Fees, Attendance, Timetable, Library, Inventory, Discipline, Reports hub, Settings, Users). Uses SCHOOL/persist/esc/uid from dashboard.js */
(function(){
const Q=s=>document.querySelector(s),R={},main=Q('.appMain'),S=()=>SCHOOL,arr=k=>S()[k]=S()[k]||[];
const today=()=>new Date().toISOString().slice(0,10),N=n=>(+n||0).toLocaleString('en-US');
const expectedFee=st=>{const sf=(S().studentFees||{})[st.id];return sf&&sf.amount!==undefined&&sf.amount!==null&&sf.amount!==''?Math.max(0,+sf.amount||0):Math.max(0,+((S().feeStr||{})[st.classId])||0)};
const go=v=>{const b=Q('.navlink[data-view="'+v+'"]');b&&b.click()};
const logAct=t=>{arr('log').unshift({d:today(),t});S().log=S().log.slice(0,60)};
const sName=id=>(S().students.find(s=>s.id===id)||{}).name||'—',cName=id=>(S().classes.find(c=>c.id===id)||{}).name||'—',tName=id=>((S().teachers||[]).find(t=>t.id===id)||{}).name||'—';
const opts=(a,sel)=>a.map(([v,t])=>`<option value="${esc(v)}"${v===sel?' selected':''}>${esc(t)}</option>`).join('');
const clOpts=sel=>opts(S().classes.map(c=>[c.id,c.name]),sel),stOpts=sel=>opts(S().students.map(s=>[s.id,s.name]),sel);
const sec=(id,t)=>{const s=document.createElement('section');s.id='view-'+id;s.className='view';s.style.display='none';s.innerHTML='<h2>'+t+'</h2><div class="body"></div>';main.appendChild(s)};
const body=id=>Q('#view-'+id+' .body');
const table=(h,rows,cls)=>`<div style="overflow-x:auto"><table class="datatable ${cls||''}"><thead><tr>${h.map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${rows.join('')||'<tr><td colspan="'+h.length+'">Nothing yet.</td></tr>'}</tbody></table></div>`;
/* top bar */
const THEME_KEY='ius_sons_appearance_v2';
const THEME_PRESETS={
  navy:{name:'Navy Blue + Deep Blue (Default)',sidebar:'#0B2545',topbar:'#123F70'},
  forest:{name:'Forest Green',sidebar:'#123D2A',topbar:'#185638'},
  purple:{name:'Royal Purple',sidebar:'#3B174A',topbar:'#57266B'},
  coffee:{name:'Coffee Brown',sidebar:'#713B16',topbar:'#96551F'},
  teal:{name:'Deep Teal',sidebar:'#103B46',topbar:'#17616B'}
};
const DESIGN_THEMES={classic:'Classic',vivid:'Vivid',glass:'Liquid Glass'};
/* 1.5.35: after sign-in the Classic design (the 1.5.26 look) in Light Mode is the default; Liquid Glass (the 1.5.34 look) is a theme. */
const DEFAULT_APPEARANCE={mode:'light',design:'classic',preset:'navy',sidebar:'#0B2545',topbar:'#123F70'};
function applyDesign(d=appearance.design,save=true){
 appearance.design=DESIGN_THEMES[d]?d:'classic';if(save)localStorage.setItem(THEME_KEY,JSON.stringify(appearance));
 if(window.IUS_THEME)IUS_THEME.applyDesign();
 const p=document.getElementById('themeDesignQuick');if(p&&p.value!==appearance.design)p.value=appearance.design;
}
function readAppearance(){try{return {...DEFAULT_APPEARANCE,...JSON.parse(localStorage.getItem(THEME_KEY)||'{}')}}catch(e){return {...DEFAULT_APPEARANCE}}}
let appearance=readAppearance();
function applyTheme(mode=appearance.mode,save=true){
 appearance.mode=mode;document.body.classList.toggle('dark-mode',mode==='dark');
 document.documentElement.style.setProperty('--ius-sidebar',appearance.sidebar||DEFAULT_APPEARANCE.sidebar);
 document.documentElement.style.setProperty('--ius-topbar',appearance.topbar||DEFAULT_APPEARANCE.topbar);
 const b=document.getElementById('themeQuickToggle');if(b)b.textContent=mode==='dark'?'☀ Light Mode':'🌙 Dark Mode';
 const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.content=mode==='dark'?'#162B36':(appearance.topbar||DEFAULT_APPEARANCE.topbar);
 if(save)localStorage.setItem(THEME_KEY,JSON.stringify(appearance));
}
applyTheme(appearance.mode,false);
const tb=document.createElement('div');tb.className='topbar';tb.innerHTML=`<div><h1>IUS AND SONS REPORT AND SCHOOL MANAGEMENT SYSTEM</h1><p>Better Management &nbsp;|&nbsp; Brighter Future</p></div><div class="tb-r"><label class="theme-pick" title="Design theme"><span aria-hidden="true">🎨</span><select id="themeDesignQuick" class="theme-toggle" aria-label="Design theme">${Object.entries(DESIGN_THEMES).map(([k,v])=>`<option value="${k}"${appearance.design===k?' selected':''}>${v}</option>`).join('')}</select></label><button id="themeQuickToggle" class="theme-toggle" type="button">${appearance.mode==='dark'?'☀ Light Mode':'🌙 Dark Mode'}</button><span>📅 <b>${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</b><br>${new Date().toLocaleDateString('en-GB',{weekday:'long'})}</span><span class="chip">👤 <b>${esc(SCHOOL.admin||'Admin')}</b><br><small>Administrator</small></span></div>`;main.prepend(tb);
tb.querySelector('#themeDesignQuick').addEventListener('change',e=>{appearance=readAppearance();applyDesign(e.target.value);const ds=document.getElementById('themeDesign');if(ds)ds.value=appearance.design});
tb.querySelector('#themeQuickToggle').addEventListener('click',()=>applyTheme(document.body.classList.contains('dark-mode')?'light':'dark'));
/* ===== DASHBOARD ===== */
const dayCnt=d=>{const o={P:0,A:0,L:0};Object.entries(S().att||{}).forEach(([k,v])=>{if(k.startsWith(d+'|'))Object.values(v).forEach(x=>o[x]++)});return o};
function feeCalc(){const fs=S().feeStr||{},pay=arr('fees');return{fs,pay,exp:S().students.reduce((a,s)=>a+expectedFee(s),0),col:pay.reduce((a,p)=>a+(+p.amt||0),0)}}
R.overview=()=>{
 const st=S().students,cl=S().classes,{fs,pay,exp,col}=feeCalc(),out=Math.max(0,exp-col),pct=exp?Math.round(col/exp*100):0,P=dayCnt(today()).P;
 const cards=[['blue','🎓','Total Students',st.length,'View Students','students'],['green','👩‍🏫','Total Teachers',(S().teachers||[]).length,'View Teachers','teachers'],['purple','👥','Total Classes',cl.length,'View Classes','classes'],['orange','🪙','Fees Collected','UGX '+N(col),'View Fee Report','fees'],['red','💲','Outstanding Fees','UGX '+N(out),'View Balances','fees'],['teal','✅','Attendance Today',P+' / '+st.length,'View Attendance','attendance']];
 const cnt=cl.map(c=>[c.name,st.filter(s=>inClass(s,c.id)).length]),mx=Math.max(10,...cnt.map(x=>x[1])),bw=Math.min(40,300/Math.max(1,cnt.length));
 const bars=cnt.map(([n,v],i)=>{const h=v/mx*140,x=40+i*(bw+10);return `<rect x="${x}" y="${160-h}" width="${bw}" height="${h}" fill="#0f62e6"/><text x="${x+bw/2}" y="${155-h}" font-size="10" text-anchor="middle">${v}</text><text x="${x+bw/2}" y="175" font-size="10" text-anchor="middle">${esc(n.slice(0,5))}</text>`}).join('');
 const C=2*Math.PI*40,dash=C*pct/100;
 const days=[...new Set(Object.keys(S().att||{}).map(k=>k.split('|')[0]))].sort().slice(-5),dc=days.map(dayCnt),amx=Math.max(10,...dc.map(o=>o.P+o.A+o.L));
 const line=(k,col2)=>{const pts=dc.map((o,i)=>[40+i*(days.length>1?300/(days.length-1):0),160-o[k]/amx*140]);return `<polyline fill="none" stroke="${col2}" stroke-width="2" points="${pts.map(p=>p.join(',')).join(' ')}"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${col2}"/>`).join('')};
 const qa=[['blue','👤➕','Add Student','students'],['green','👩‍🏫','Add Teacher','teachers'],['purple','💳','Record Fee Payment','fees'],['orange','📅','Mark Attendance','attendance'],['teal','📄','Enter Marks','results'],['pink','📑','Generate Reports','reports'],['navy','👥','Add Class','classes'],['cyan','📖','Add Subject','subjects'],['purple','📚','Manage Library','library'],['red','📦','Update Inventory','inventory'],['olive','🛡️','Record Discipline','discipline'],['navy','⚙️','User Accounts','users']];
 const rows=cl.filter(c=>fs[c.id]||st.some(s=>s.classId===c.id)).map(c=>{const members=st.filter(s=>s.classId===c.id),ids=members.map(s=>s.id),e=members.reduce((a,s)=>a+expectedFee(s),0),k=pay.filter(p=>ids.includes(p.sid)).reduce((a,p)=>a+(+p.amt||0),0);return [c.name,e,k,Math.max(0,e-k)]});
 const T=rows.reduce((a,r)=>[a[0]+r[1],a[1]+r[2],a[2]+r[3]],[0,0,0]);
 const feeGraphRows=cl.map(c=>{const members=st.filter(s=>s.classId===c.id),ids=members.map(s=>s.id),expected=members.reduce((a,s)=>a+expectedFee(s),0),paid=pay.filter(p=>ids.includes(p.sid)).reduce((a,p)=>a+(+p.amt||0),0);return {name:c.name,expected,paid,balance:Math.max(0,expected-paid)}}).filter(r=>r.expected||r.paid);
 const gh=Math.max(150,feeGraphRows.length*44+35),gmax=Math.max(1,...feeGraphRows.map(r=>r.expected)),gscale=300/gmax;
 const feeGraph=feeGraphRows.map((r,i)=>{const y=24+i*44;return `<text x="8" y="${y+10}" font-size="11">${esc(r.name.slice(0,18))}</text><rect x="145" y="${y}" width="${Math.max(0,r.expected*gscale)}" height="12" rx="3" fill="#dbeafe"/><rect x="145" y="${y+15}" width="${Math.max(0,Math.min(r.expected,r.paid)*gscale)}" height="12" rx="3" fill="#16a34a"/><text x="${Math.min(465,150+Math.max(r.expected,r.paid)*gscale)}" y="${y+10}" font-size="10">${N(r.expected)}</text>`}).join('');
 Q('#newDash').innerHTML=`<h2 style="margin:0">🏠 Dashboard</h2><p class="hint">Welcome to IUS AND SONS School Management System</p>
 <div class="dcards">${cards.map(c=>`<div class="dc c-${c[0]}" data-go="${c[5]}">${c[1]}<br><small>${c[2]}</small><b>${c[3]}</b><small>${c[4]} →</small></div>`).join('')}</div>
 <div class="dgrid"><div class="panel"><h4>Student Enrollment by Class</h4><svg viewBox="0 0 400 185" width="100%"><line x1="35" y1="160" x2="395" y2="160" stroke="#ccd"/>${bars}</svg></div>
 <div class="panel"><h4>Fee Collection Status</h4><div style="display:flex;align-items:center;gap:12px"><svg viewBox="0 0 100 100" width="150"><circle cx="50" cy="50" r="40" fill="none" stroke="${exp?'#ef3b4f':'#ddd'}" stroke-width="16"/><circle cx="50" cy="50" r="40" fill="none" stroke="#16a34a" stroke-width="16" stroke-dasharray="${dash} ${C}" transform="rotate(-90 50 50)"/><text x="50" y="52" text-anchor="middle" font-size="16" font-weight="700">${pct}%</text><text x="50" y="64" text-anchor="middle" font-size="7">Collected</text></svg><div style="font-size:13px"><b style="color:#16a34a">■ Collected</b><br>UGX ${N(col)} (${pct}%)<br><br><b style="color:#ef3b4f">■ Outstanding</b><br>UGX ${N(out)} (${exp?100-pct:0}%)</div></div></div>
 <div class="panel"><h4>Attendance Overview <small style="float:right;font-weight:400"><span style="color:#16a34a">●</span> Present <span style="color:#f59e0b">●</span> Absent <span style="color:#ef3b4f">●</span> Late</small></h4><svg viewBox="0 0 400 185" width="100%"><line x1="35" y1="160" x2="395" y2="160" stroke="#ccd"/>${line('P','#16a34a')}${line('A','#f59e0b')}${line('L','#ef3b4f')}${days.map((d,i)=>`<text x="${40+i*(days.length>1?300/(days.length-1):0)}" y="177" font-size="10" text-anchor="middle">${d.slice(5)}</text>`).join('')}</svg></div></div>
 <div class="dgrid"><div class="panel"><h4>Quick Actions</h4><div class="qa">${qa.map(q=>`<button class="c-${q[0]}" data-go="${q[3]}">${q[1]}<br>${q[2]}</button>`).join('')}</div></div>
 <div class="panel"><h4>Recent Records</h4>${table(['Date','Description','User'],arr('log').slice(0,8).map(l=>`<tr><td>${l.d}</td><td>${esc(l.t)}</td><td>Admin</td></tr>`),'dt')}</div>
 <div class="panel"><h4>Fee Collection by Class</h4><div class="fee-graph-legend"><span style="color:#64748b">■ Expected fees</span> &nbsp; <span style="color:#16a34a">■ Collected fees</span></div><div class="fee-graph-wrap"><svg viewBox="0 0 500 ${gh}" width="100%" role="img" aria-label="Expected and collected fees by class">${feeGraph||'<text x="10" y="30">Add classes and students to view fee graph.</text>'}</svg></div><table class="dt"><tr><th>Class</th><th>Expected (UGX)</th><th>Collected (UGX)</th><th>Balance (UGX)</th></tr>${rows.map(r=>`<tr><td>${esc(r[0])}</td><td>${N(r[1])}</td><td>${N(r[2])}</td><td>${N(r[3])}</td></tr>`).join('')}<tr class="tot"><td>Total</td><td>${N(T[0])}</td><td>${N(T[1])}</td><td>${N(T[2])}</td></tr></table></div></div>
 <div class="dfoot"><span>IUS AND SONS REPORT AND SCHOOL MANAGEMENT SYSTEM | Offline Version</span><i>Education is the key to a better tomorrow</i></div>`;
 document.querySelectorAll('#newDash [data-go]').forEach(e=>e.onclick=()=>go(e.dataset.go));
};
/* ===== SCHOOL FEES ===== */
sec('fees','School Fees');
R.fees=()=>{const {fs,pay}=feeCalc(),b=body('fees'),tm=['Term 1','Term 2','Term 3'].map(t=>[t,t]);
 b.innerHTML=`<h3>Fee structure (standard fee per student, UGX)</h3><div class="grid">${S().classes.map(c=>`<label>${esc(c.name)}<input type="number" min="0" class="fsI" data-id="${c.id}" value="${fs[c.id]||''}"></label>`).join('')||'<p>Add classes first.</p>'}</div><button id="fsSave">Save structure</button>
 <h3>Individual student fee / bursary</h3><p class="hint">Set a different fee for a student or mark a student as receiving a bursary. Leave the individual fee blank to use the standard class fee. For a fully sponsored student, enter 0.</p><div class="grid"><label>Student<select id="sfStudent">${stOpts()}</select></label><label>Fee payable (UGX)<input id="sfAmount" type="number" min="0" placeholder="Blank = class fee"></label><label style="flex-direction:row;align-items:center;gap:8px"><input id="sfBursary" type="checkbox" style="width:auto"> Bursary student</label></div><button id="sfSave">Save student fee</button> <button id="sfClear" class="gray">Use class fee</button><p id="sfMsg" class="msg"></p><div id="sfList"></div>
 <h3>Record payment</h3><div class="grid"><label>Student<select id="pSt">${stOpts()}</select></label><label>Amount (UGX)<input id="pAmt" type="number"></label><label>Term<select id="pTm">${opts(tm)}</select></label><label>Date<input id="pDt" type="date" value="${today()}"></label></div><button class="green" id="pAdd">+ Record Payment</button><p id="pMsg" class="msg"></p>
 <h3 class="dg">Student Payment Percentage</h3><p class="hint">Students are grouped by how much of their expected fee has been paid. Fully sponsored students with a fee of UGX 0 are shown separately.</p><div class="payment-bands">${(()=>{const bands=[['Below 10%',p=>p<10],['10% to below 25%',p=>p>=10&&p<25],['25% to below 50%',p=>p>=25&&p<50],['50% to below 75%',p=>p>=50&&p<75],['75% to 100%',p=>p>=75]];const data=S().students.map(st=>{const e=expectedFee(st),paid=pay.filter(p=>p.sid===st.id).reduce((a,p)=>a+(+p.amt||0),0),pct=e>0?Math.min(100,paid/e*100):null;return {st,e,paid,pct}});return bands.map(([label,test])=>{const group=data.filter(x=>x.pct!==null&&test(x.pct));return `<div class="payment-band"><div class="payment-band-head"><b>${label}</b><span>${group.length} student${group.length===1?'':'s'}</span></div><div class="payment-band-list">${group.map(x=>`<div><span>${esc(x.st.name)} · ${esc(cName(x.st.classId))}</span><b>${x.pct.toFixed(1)}%</b></div>`).join('')||'<small>No students in this range.</small>'}</div></div>`}).join('')+`<div class="payment-band"><div class="payment-band-head"><b>Fully sponsored / no fee set</b><span>${data.filter(x=>x.pct===null).length} student(s)</span></div><div class="payment-band-list">${data.filter(x=>x.pct===null).map(x=>`<div><span>${esc(x.st.name)} · ${esc(cName(x.st.classId))}</span><b>0 fee</b></div>`).join('')||'<small>No students in this group.</small>'}</div></div>`})() }</div>
 <h3>Balances</h3>${table(['Student','Class','Fee type','Expected','Paid','Balance'],S().students.map(s=>{const e=expectedFee(s),k=pay.filter(p=>p.sid===s.id).reduce((a,p)=>a+(+p.amt||0),0),sf=(S().studentFees||{})[s.id];return `<tr><td>${esc(s.name)}</td><td>${esc(cName(s.classId))}</td><td>${sf?.bursary?'Bursary':sf&&sf.amount!==''&&sf.amount!=null?'Individual fee':'Standard fee'}</td><td>${N(e)}</td><td>${N(k)}</td><td class="${e>k?'bad':''}">${N(Math.max(0,e-k))}</td></tr>`}))}
 <h3>Payments</h3>${table(['Date','Student','Term','Amount',''],pay.slice().reverse().map(p=>`<tr><td>${p.date}</td><td>${esc(sName(p.sid))}</td><td>${p.term}</td><td>${N(p.amt)}</td><td><button class="danger pDel" data-id="${p.id}">✕</button></td></tr>`))}`;
 const drawStudentFees=()=>{const records=S().studentFees||{};Q('#sfList').innerHTML=table(['Student','Class','Bursary','Fee payable (UGX)'],S().students.filter(st=>records[st.id]).map(st=>{const rec=records[st.id];return `<tr><td>${esc(st.name)}</td><td>${esc(cName(st.classId))}</td><td>${rec.bursary?'Yes':'No'}</td><td>${N(rec.amount!==''&&rec.amount!=null?rec.amount:expectedFee(st))}</td></tr>`}))};
 const loadStudentFee=()=>{const rec=(S().studentFees||{})[Q('#sfStudent').value];Q('#sfAmount').value=rec&&rec.amount!==undefined&&rec.amount!==null?rec.amount:'';Q('#sfBursary').checked=!!(rec&&rec.bursary)};
 Q('#sfStudent').onchange=loadStudentFee;loadStudentFee();drawStudentFees();
 Q('#sfSave').onclick=()=>{const sid=Q('#sfStudent').value;if(!sid){Q('#sfMsg').textContent='Add a student first.';return}const raw=Q('#sfAmount').value.trim();if(raw!==''&&(+raw<0||!Number.isFinite(+raw))){Q('#sfMsg').textContent='Enter a valid fee amount.';return}S().studentFees=S().studentFees||{};S().studentFees[sid]={amount:raw===''?'':+raw,bursary:Q('#sfBursary').checked};logAct('Individual fee updated - '+sName(sid));persist();R.fees()};
 Q('#sfClear').onclick=()=>{const sid=Q('#sfStudent').value;if(S().studentFees)delete S().studentFees[sid];persist();R.fees()};
 Q('#fsSave').onclick=()=>{S().feeStr=S().feeStr||{};document.querySelectorAll('.fsI').forEach(i=>S().feeStr[i.dataset.id]=+i.value||0);persist();logAct('Fee structure updated');R.fees()};
 Q('#pAdd').onclick=()=>{const a=+Q('#pAmt').value;if(!Q('#pSt').value||a<=0){Q('#pMsg').textContent='Choose a student and enter an amount.';return}arr('fees').push({id:uid(),sid:Q('#pSt').value,amt:a,term:Q('#pTm').value,date:Q('#pDt').value});logAct('Fee Payment (UGX '+N(a)+') - '+sName(Q('#pSt').value));persist();R.fees()};
 b.querySelectorAll('.pDel').forEach(x=>x.onclick=()=>{if(confirm('Delete this payment?')){S().fees=S().fees.filter(p=>p.id!==x.dataset.id);persist();R.fees()}});
};
/* ===== ATTENDANCE ===== */
sec('attendance','Attendance');
R.attendance=()=>{const b=body('attendance');b.innerHTML=`<div class="grid"><label>Date<input id="aDt" type="date" value="${today()}"></label><label>Class<select id="aCl">${clOpts()}</select></label></div><div id="aList"></div><button class="green" id="aSave">💾 Save Attendance</button><p id="aMsg" class="msg"></p>`;
 const draw=()=>{const key=Q('#aDt').value+'|'+Q('#aCl').value,cur=(S().att||{})[key]||{},st=S().students.filter(s=>inClass(s,Q('#aCl').value));Q('#aList').innerHTML=table(['Student','Present','Absent','Late'],st.map(s=>`<tr><td>${esc(s.name)}</td>${['P','A','L'].map(k=>`<td><input type="radio" name="a${s.id}" value="${k}" data-s="${s.id}"${(cur[s.id]||'P')===k?' checked':''}></td>`).join('')}</tr>`))};
 Q('#aDt').onchange=Q('#aCl').onchange=draw;draw();
 Q('#aSave').onclick=()=>{const o={};document.querySelectorAll('#aList input:checked').forEach(i=>o[i.dataset.s]=i.value);S().att=S().att||{};S().att[Q('#aDt').value+'|'+Q('#aCl').value]=o;logAct('Attendance Updated - '+cName(Q('#aCl').value));persist();Q('#aMsg').textContent='Saved.'}};
/* ===== GENERIC CRUD MODULES ===== */
const D7=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'].map(d=>[d,d]);
const stat=r=>(+r.qty>=10?'<span class="ok">In Stock</span>':+r.qty>0?'<span class="lo">Low</span>':'<span class="bad">Out</span>');
const M={
 timetable:{t:'Timetable',f:[['cls','Class','class'],['day','Day',D7],['time','Time (e.g. 08:00 - 08:40)'],['subject','Subject'],['teacher','Teacher','teacher'],['room','Room']]},
 library:{t:'Library',f:[['title','Title'],['author','Author'],['cat','Category'],['copies','Copies','number'],['avail','Available now','number']],act:r=>`<button class="gray lb" data-d="-1" data-id="${r.id}">Issue</button><button class="gray lb" data-d="1" data-id="${r.id}">Return</button>`},
 inventory:{t:'Inventory',f:[['item','Item name'],['cat','Category',[['Stationery','Stationery'],['Equipment','Equipment'],['Furniture','Furniture'],['Books','Books'],['Other','Other']]],['qty','Quantity','number'],['unit','Unit (Boxes, Pieces...)']],extra:['Status',stat]},
 discipline:{t:'Discipline',f:[['sid','Student','student'],['incident','Incident'],['date','Date','date'],['action','Action taken']]},
 users:{t:'User Accounts',f:[['username','Username'],['full','Full name'],['role','Role',['Admin','Teacher','Librarian','Accountant','Principal'].map(x=>[x,x])],['status','Status',[['Active','Active'],['Inactive','Inactive']]],['password','Password (stored hashed)','password']]}
};
const sha=async t=>{try{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}catch(e){return 'plain:'+t}};
const show=(f,v)=>f[2]==='class'?cName(v):f[2]==='student'?sName(v):f[2]==='teacher'?tName(v):f[2]==='password'?'••••':esc(v??'');
Object.keys(M).forEach(k=>{sec(k,M[k].t);let ed=null;R[k]=()=>{const m=M[k],rows=arr(k),b=body(k),cur=rows.find(r=>r.id===ed)||{};
 const inp=f=>`<label>${f[1]}${f[2]==='class'?`<select data-k="${f[0]}">${clOpts(cur[f[0]])}</select>`:f[2]==='student'?`<select data-k="${f[0]}">${stOpts(cur[f[0]])}</select>`:f[2]==='teacher'?`<select data-k="${f[0]}">${opts((S().teachers||[]).map(t=>[t.id,t.name]),cur[f[0]])}</select>`:Array.isArray(f[2])?`<select data-k="${f[0]}">${opts(f[2],cur[f[0]])}</select>`:`<input data-k="${f[0]}" type="${f[2]||'text'}" value="${f[2]==='password'?'':esc(cur[f[0]]??'')}"${f[2]==='date'&&!cur[f[0]]?` value="${today()}"`:''}>`}</label>`;
 b.innerHTML=`<div class="grid">${m.f.map(inp).join('')}</div><button id="${k}Save">${ed?'💾 Update':'+ Add'}</button>${ed?`<button class="gray" id="${k}Cancel">Cancel</button>`:''}<p class="msg" id="${k}Msg"></p>`+table([...m.f.filter(f=>f[2]!=='password').map(f=>f[1].split(' (')[0]),...(m.extra?[m.extra[0]]:[]),'Actions'],rows.map(r=>`<tr>${m.f.filter(f=>f[2]!=='password').map(f=>`<td>${show(f,r[f[0]])}</td>`).join('')}${m.extra?`<td>${m.extra[1](r)}</td>`:''}<td>${m.act?m.act(r):''}<button class="gray ed" data-id="${r.id}">✎</button><button class="danger dl" data-id="${r.id}">🗑</button></td></tr>`));
 Q('#'+k+'Save').onclick=async()=>{const o={};b.querySelectorAll('[data-k]').forEach(e=>o[e.dataset.k]=e.value.trim());if(!m.f.slice(0,2).every(f=>o[f[0]])){Q('#'+k+'Msg').textContent='Please fill in the first fields.';return}
  if(o.password!==undefined){if(o.password){o.salt=uid();o.hash=await sha(o.salt+o.password)}else if(cur.hash){o.salt=cur.salt;o.hash=cur.hash}delete o.password}
  if(ed)Object.assign(cur,o);else{o.id=uid();if(k==='library'&&o.avail==='')o.avail=o.copies;rows.push(o)}logAct(m.t+(ed?' updated':' record added'));ed=null;persist();R[k]()};
 if(ed)Q('#'+k+'Cancel').onclick=()=>{ed=null;R[k]()};
 b.querySelectorAll('.ed').forEach(x=>x.onclick=()=>{ed=x.dataset.id;R[k]()});
 b.querySelectorAll('.dl').forEach(x=>x.onclick=()=>{if(confirm('Delete this record?')){S()[k]=rows.filter(r=>r.id!==x.dataset.id);persist();R[k]()}});
 b.querySelectorAll('.lb').forEach(x=>x.onclick=()=>{const r=rows.find(q=>q.id===x.dataset.id);r.avail=Math.max(0,Math.min(+r.copies||0,(+r.avail||0)+(+x.dataset.d)));logAct('Library: '+r.title+(x.dataset.d<0?' issued':' returned'));persist();R[k]()})}});
/* ===== REPORTS HUB ===== */
sec('reports','Reports');
R.reports=()=>{body('reports').innerHTML=`<div class="rcards noprint"><div class="rcard" data-g="gen"><span>🖨️</span>1) Report Generator<br><small>Student report cards</small></div><div class="rcard" data-g="des"><span>🎨</span>2) Report Designer<br><small>Layouts &amp; templates</small></div><div class="rcard" data-r="st"><span>📋</span>Student List</div><div class="rcard" data-r="fee"><span>💳</span>Fee Collection</div><div class="rcard" data-r="att"><span>📅</span>Attendance Summary</div></div><div id="repOut"></div>`;
 const W={st:()=>['Student List',table(['Name','Gender','Class'],S().students.map(s=>`<tr><td>${esc(s.name)}</td><td>${esc(s.gender||'')}</td><td>${esc(classLabel(s))}</td></tr>`))],
 fee:()=>{const {fs,pay}=feeCalc();return['Fee Collection',table(['Student','Class','Expected','Paid','Balance'],S().students.map(s=>{const e=expectedFee(s),k=pay.filter(p=>p.sid===s.id).reduce((a,p)=>a+(+p.amt||0),0);return `<tr><td>${esc(s.name)}</td><td>${esc(cName(s.classId))}</td><td>${N(e)}</td><td>${N(k)}</td><td>${N(Math.max(0,e-k))}</td></tr>`}))]},
 att:()=>['Attendance Summary',table(['Date','Present','Absent','Late'],[...new Set(Object.keys(S().att||{}).map(k=>k.split('|')[0]))].sort().reverse().map(d=>{const o=dayCnt(d);return `<tr><td>${d}</td><td>${o.P}</td><td>${o.A}</td><td>${o.L}</td></tr>`}))]};
 document.querySelectorAll('[data-g]').forEach(e=>e.onclick=()=>rfShow(e.dataset.g));
 document.querySelectorAll('[data-r]').forEach(e=>e.addEventListener('click',()=>{if(RF.host)RF.host.style.display='none'}));
 document.querySelectorAll('[data-r]').forEach(e=>e.onclick=()=>{const [t,h]=W[e.dataset.r]();Q('#repOut').innerHTML=`<h3>${esc(S().name)} — ${t}</h3>${h}<button class="noprint" onclick="window.print()">🖨️ Print / Save PDF</button>`})};
/* ===== SETTINGS ===== */
R.settings=()=>{const s=S().settings=S().settings||{};appearance=readAppearance();const mode=appearance.mode||'light';
 Q('#setBody').innerHTML=`<h3>Appearance</h3><div class="theme-settings"><h4>Theme Customisation</h4>
 <label for="themeDesign">Design theme<select id="themeDesign">${Object.entries(DESIGN_THEMES).map(([k,v])=>`<option value="${k}"${(appearance.design||'classic')===k?' selected':''}>${v}${k==='classic'?' (Default)':''}</option>`).join('')}</select></label>
 <label for="themeMode">Display mode<select id="themeMode"><option value="light"${mode==='light'?' selected':''}>Light Mode</option><option value="dark"${mode==='dark'?' selected':''}>Dark Mode</option></select></label>
 <label for="themePreset">Colour combination<select id="themePreset">${Object.entries(THEME_PRESETS).map(([k,v])=>`<option value="${k}"${appearance.preset===k?' selected':''}>${v.name}</option>`).join('')}<option value="custom"${!THEME_PRESETS[appearance.preset]?' selected':''}>Custom colours</option></select></label>
 <div class="theme-colors"><label>Sidebar colour<input id="themeSidebar" type="color" value="${appearance.sidebar}"></label><label>Upper bar colour<input id="themeTopbar" type="color" value="${appearance.topbar}"></label></div>
 <div class="theme-preview"><aside id="themePreviewSide">IUS AND SONS<br><small>Dashboard<br>Students<br>School Fees<br>Reports</small></aside><div id="themePreviewMain"><header id="themePreviewTop">IUS AND SONS REPORT AND SCHOOL MANAGEMENT SYSTEM</header><div class="theme-preview-content">Live preview · Sidebar and upper bar</div></div></div>
 <button id="saveTheme">Save Theme</button> <button id="resetTheme" class="gray">Reset to Default</button> <button id="cancelTheme" class="gray">Cancel</button><p id="themeMsg" class="msg"></p>
 <p class="hint">Your theme is saved locally and works offline. Theme changes affect appearance only, not school records.</p></div><hr><h3>School Settings</h3><div class="grid"><label>Address<input id="seA" value="${esc(s.address||'')}"></label><label>Phone<input id="seP" value="${esc(s.phone||S().phone1||'')}"></label><label>Email<input id="seE" value="${esc(s.email||S().email||'')}"></label><label>Motto<input id="seM" value="${esc(s.motto||'')}"></label><label>Current term<select id="seT">${opts(['Term 1','Term 2','Term 3'].map(t=>[t,t]),s.term)}</select></label></div><button id="seS">Save Settings</button><p id="seMsg" class="msg"></p>`;
 const paintPreview=()=>{const side=Q('#themeSidebar').value,top=Q('#themeTopbar').value;Q('#themePreviewSide').style.background=side;Q('#themePreviewTop').style.background=top;Q('#themePreviewSide').style.color=Q('#themePreviewTop').style.color='#fff'};
 Q('#themePreset').onchange=()=>{const v=Q('#themePreset').value;if(THEME_PRESETS[v]){Q('#themeSidebar').value=THEME_PRESETS[v].sidebar;Q('#themeTopbar').value=THEME_PRESETS[v].topbar}paintPreview()};
 ['#themeSidebar','#themeTopbar'].forEach(id=>Q(id).oninput=()=>{Q('#themePreset').value='custom';paintPreview()});paintPreview();
 Q('#saveTheme').onclick=()=>{appearance={mode:Q('#themeMode').value,design:Q('#themeDesign').value,preset:Q('#themePreset').value,sidebar:Q('#themeSidebar').value,topbar:Q('#themeTopbar').value};applyTheme(appearance.mode);applyDesign(appearance.design);Q('#themeMsg').textContent='Theme saved on this device.';};
 Q('#resetTheme').onclick=()=>{appearance={...DEFAULT_APPEARANCE};Q('#themeMode').value=DEFAULT_APPEARANCE.mode;Q('#themeDesign').value=DEFAULT_APPEARANCE.design;Q('#themePreset').value='navy';Q('#themeSidebar').value=appearance.sidebar;Q('#themeTopbar').value=appearance.topbar;paintPreview();applyTheme(DEFAULT_APPEARANCE.mode);applyDesign(DEFAULT_APPEARANCE.design);Q('#themeMsg').textContent='Default theme restored (Classic design, Light Mode, Navy Blue + Deep Blue).'};
 Q('#cancelTheme').onclick=()=>{appearance=readAppearance();R.settings()};
;Q('#seS').onclick=()=>{Object.assign(s,{address:Q('#seA').value,phone:Q('#seP').value,email:Q('#seE').value,motto:Q('#seM').value,term:Q('#seT').value});persist();Q('#seMsg').textContent='Saved on this device.'}};

/* ===== VISITORS (1.5.8): who visited, on which date, with a week-by-week view ===== */
sec('visitors','Visitors');
R.visitors=()=>{
 const b=body('visitors'),list=arr('visitors'),pad=n=>String(n).padStart(2,'0');
 const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
 const mondayOf=s=>{const d=new Date(s+'T12:00:00');d.setDate(d.getDate()-((d.getDay()+6)%7));return d};
 const now=new Date(),todayL=ymd(now),nowT=pad(now.getHours())+':'+pad(now.getMinutes());
 const sel=(Q('#vWeek')&&Q('#vWeek').value)||todayL;
 const mon=mondayOf(sel),days=[...Array(7)].map((_,i)=>{const d=new Date(mon);d.setDate(mon.getDate()+i);return ymd(d)});
 const inWeek=list.filter(v=>days.includes(v.date)).sort((x,y)=>(x.date+(x.tin||'')).localeCompare(y.date+(y.tin||'')));
 const names=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 b.innerHTML=`<div class="grid"><label>Visitor name<input id="vName"></label><label>Phone<input id="vPhone" type="tel"></label><label>Purpose of visit<input id="vPurpose"></label><label>Person / office visited<input id="vWho" list="vWhoList"><datalist id="vWhoList">${(S().teachers||[]).map(t=>`<option value="${esc(t.name)}">`).join('')}</datalist></label><label>Date of visit<input id="vDate" type="date" value="${todayL}"></label><label>Time in<input id="vIn" type="time" value="${nowT}"></label></div>
 <button class="green" id="vAdd">+ Record Visitor</button><p class="msg" id="vMsg"></p>
 <h3 class="dg">Visitors in a week</h3><div class="grid"><label>Show the week that contains<input id="vWeek" type="date" value="${sel}"></label></div>
 <div class="vweek">${days.map((d,i)=>{const n=list.filter(v=>v.date===d).length;return `<div class="vday${d===todayL?' today':''}"><small>${names[i]}</small><b>${n}</b><span>${d.slice(5)}</span></div>`}).join('')}<div class="vday total"><small>Week total</small><b>${inWeek.length}</b><span>${days[0].slice(5)} → ${days[6].slice(5)}</span></div></div>`+
 table(['Date','Visitor','Phone','Purpose','Visiting','In','Out',''],inWeek.map(v=>`<tr><td>${v.date}</td><td>${esc(v.name)}</td><td>${esc(v.phone||'')}</td><td>${esc(v.purpose||'')}</td><td>${esc(v.who||'')}</td><td>${esc(v.tin||'')}</td><td>${v.tout?esc(v.tout):`<button class="gray vOut" data-id="${v.id}">Sign out</button>`}</td><td><button class="danger vDel" data-id="${v.id}">✕</button></td></tr>`));
 Q('#vWeek').onchange=R.visitors;
 Q('#vAdd').onclick=()=>{const n=Q('#vName').value.trim();if(!n){Q('#vMsg').textContent='Enter the visitor\'s name.';return}
  list.push({id:uid(),name:n,phone:Q('#vPhone').value.trim(),purpose:Q('#vPurpose').value.trim(),who:Q('#vWho').value.trim(),date:Q('#vDate').value||todayL,tin:Q('#vIn').value,tout:''});
  logAct('Visitor: '+n);persist();R.visitors();Q('#vMsg').textContent='Visitor recorded.'};
 b.querySelectorAll('.vOut').forEach(x=>x.onclick=()=>{const v=list.find(q=>q.id===x.dataset.id);const d=new Date();v.tout=pad(d.getHours())+':'+pad(d.getMinutes());persist();R.visitors()});
 b.querySelectorAll('.vDel').forEach(x=>x.onclick=()=>{if(confirm('Delete this visitor record?')){S().visitors=list.filter(v=>v.id!==x.dataset.id);persist();R.visitors()}});
};
document.querySelectorAll('.navlink[data-view]').forEach(b=>b.addEventListener('click',()=>{const f=R[b.dataset.view];f&&f()}));
R.overview();
})();

/* 1.5.17 — the report page is loaded once in the background and kept alive, so opening it is instant */
const RF={host:null,frame:null,h:0,ready:false,want:null};
function rfMake(){
  if(RF.host)return;const v=document.getElementById('view-reports');if(!v)return;
  const host=document.createElement('div');host.id='repHost';host.className='view noprint';host.style.cssText='height:0;overflow:hidden;visibility:hidden;margin:0;padding:0;border:0';
  host.innerHTML='<iframe id="repFrame" title="Report Generator" style="width:100%;height:0;border:0;display:block;background:transparent" src="report.html?embed=1"></iframe>';
  v.parentNode.insertBefore(host,v.nextSibling);RF.host=host;RF.frame=host.firstChild;
}
function rfApply(){
  const w=RF.want;if(!w||!RF.host)return;
  RF.host.style.cssText='display:block';RF.frame.style.height=RF.h+'px';
  try{RF.frame.contentWindow.postMessage({iusOpen:w},'*')}catch(e){}
  RF.want=null;
}
function rfShow(which){rfMake();RF.want=which;if(RF.ready)rfApply()}
addEventListener('message',ev=>{
  const d=ev.data;if(!RF.frame||ev.source!==RF.frame.contentWindow||!d)return;
  if(d.iusReportHeight>40){RF.h=d.iusReportHeight;if(RF.host&&RF.host.style.display!=='none')RF.frame.style.height=RF.h+'px'}
  if(d.iusReportReady&&!RF.ready){RF.ready=true;rfApply()}
});
setTimeout(rfMake,1200);

/* 1.5.16 — the sidebar shortcuts "1) Report Generator" / "2) Report Designer" open inside the dashboard, never a new window */
document.querySelectorAll('a.navlink.sub[href^="report.html"]').forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();const des=/reportDesigner/.test(a.getAttribute('href')||'');
  const nav=document.querySelector('.navlink[data-view="reports"]');if(nav)nav.click();
  setTimeout(()=>{const c=document.querySelector('[data-g="'+(des?'des':'gen')+'"]');if(c)c.click()},0);
}));
