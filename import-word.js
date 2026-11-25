/* IUS AND SONS 1.5.19 — Import marks from a Word (.docx) table into Enter Results.
   Self-contained and offline. It only fills the marks grid on screen; nothing is saved until the user presses "Save Results".
   Uses SCHOOL / $ / esc / loadResultGrid / resultSubjects / inClassY / gridTotals from dashboard.js. */
(function(){
  const host=document.getElementById('view-results');
  if(!host||typeof SCHOOL==='undefined'||!SCHOOL)return;

  /* ---------- UI (added under the existing buttons; nothing existing is changed) ---------- */
  const box=document.createElement('div');
  box.id='wi-box';box.style.cssText='margin:12px 0;padding:12px;border:1px dashed #94a3b8;border-radius:10px';
  box.innerHTML=`<b>Import marks from a file (Word, Excel or CSV)</b>
    <p class="hint" style="margin:4px 0 8px">Choose Year, Term, Assessment and Class above. Use one Word (.docx) table with one student per row and one subject per column. Keep each subject heading exactly as shown in the class Subjects tab. The preview checks names, codes, duplicate rows and marks; nothing is saved until you press Save Results.</p>
    <input type="file" id="wi-file" accept=".docx,.xlsx,.csv" style="max-width:260px">
    <button type="button" id="wi-template" class="gray">Download Word template for this class</button>
    <p id="wi-msg" class="msg"></p><div id="wi-preview"></div>`;
  const anchor=$('rs-msg');anchor.parentNode.insertBefore(box,anchor.nextSibling);
  const say=(t,bad)=>{const m=$('wi-msg');m.style.color=bad?'#dc2626':'#059669';m.textContent=t};

  /* ---------- reading a .docx (a zip file) without any library ---------- */
  async function inflate(data){
    if(typeof DecompressionStream==='undefined')throw new Error('This device cannot decompress Word files. Update the app/browser.');
    let ds;try{ds=new DecompressionStream('deflate-raw')}catch(e){throw new Error('This device cannot read compressed Word files. Update the app/browser.')}
    // Drain the readable stream while writing. Waiting for writer.write() to finish
    // before reading can stall on backpressure when Word expands document.xml.
    const output=new Response(ds.readable).arrayBuffer();
    const w=ds.writable.getWriter();
    try{await w.write(data);await w.close();return new Uint8Array(await output)}
    catch(e){try{await w.abort(e)}catch(_){}throw e}
  }
  function crc32(data){let c=0xFFFFFFFF;for(let i=0;i<data.length;i++){c^=data[i];for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1}return(c^0xFFFFFFFF)>>>0}
  async function readZipEntry(buf,wanted){
    const dv=new DataView(buf.buffer,buf.byteOffset,buf.byteLength);let e=-1;
    for(let i=buf.length-22;i>=Math.max(0,buf.length-70000);i--){if(dv.getUint32(i,true)===0x06054b50){e=i;break}}
    if(e<0)throw new Error('This is not a valid Word (.docx) file.');
    if(dv.getUint16(e+4,true)!==0||dv.getUint16(e+6,true)!==0)throw new Error('This Word file uses a multi-disk ZIP format that is not supported. Save it again as a normal .docx file.');
    const n=dv.getUint16(e+10,true);let p=dv.getUint32(e+16,true);
    if(n===0xFFFF||p===0xFFFFFFFF)throw new Error('This Word file uses ZIP64 format, which is not supported by this importer. Save it again as a normal .docx file.');
    for(let k=0;k<n;k++){
      if(p+46>buf.length||dv.getUint32(p,true)!==0x02014b50)throw new Error('The Word file archive is damaged. Please save a fresh .docx copy.');
      const flags=dv.getUint16(p+8,true),method=dv.getUint16(p+10,true),expectedCrc=dv.getUint32(p+16,true),csize=dv.getUint32(p+20,true),usize=dv.getUint32(p+24,true),nl=dv.getUint16(p+28,true),xl=dv.getUint16(p+30,true),cl=dv.getUint16(p+32,true),off=dv.getUint32(p+42,true);
      if(p+46+nl+xl+cl>buf.length)throw new Error('The Word file archive is damaged.');
      const name=new TextDecoder().decode(buf.subarray(p+46,p+46+nl));
      if(name===wanted){
        if(flags&1)throw new Error('Password-protected Word files are not supported. Remove the password and try again.');
        if(method!==0&&method!==8)throw new Error('This Word file uses an unsupported compression method. Save it again as a normal .docx file.');
        if(csize===0xFFFFFFFF||usize===0xFFFFFFFF||off===0xFFFFFFFF)throw new Error('This Word file uses ZIP64 format, which is not supported.');
        if(off+30>buf.length||dv.getUint32(off,true)!==0x04034b50)throw new Error('The Word file archive is damaged.');
        const lnl=dv.getUint16(off+26,true),lxl=dv.getUint16(off+28,true),st=off+30+lnl+lxl;
        if(st+csize>buf.length)throw new Error('The Word file archive is incomplete.');
        const raw=buf.subarray(st,st+csize),out=method===0?raw:await inflate(raw);
        if(out.length!==usize||crc32(out)!==expectedCrc)throw new Error('The Word document failed its integrity check. Save it again in Microsoft Word and retry.');
        return out;
      }
      p+=46+nl+xl+cl;
    }
    throw new Error('No document text found in this file. Save it as a Word Document (.docx) and try again.');
  }
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  function cellText(tc){return [...tc.getElementsByTagNameNS(W,'p')].map(p=>[...p.getElementsByTagNameNS(W,'t')].map(t=>t.textContent).join('')).join(' ').replace(/\s+/g,' ').trim()}
  async function readTables(file){
    const xml=new TextDecoder().decode(await readZipEntry(new Uint8Array(await file.arrayBuffer()),'word/document.xml'));
    const doc=new DOMParser().parseFromString(xml,'application/xml');
    if(doc.getElementsByTagName('parsererror').length)throw new Error('The Word file could not be read.');
    return [...doc.getElementsByTagNameNS(W,'tbl')].map(tb=>[...tb.getElementsByTagNameNS(W,'tr')].filter(tr=>tr.parentNode===tb).map(tr=>[...tr.childNodes].filter(c=>c.localName==='tc').map(cellText)));
  }

  /* ---------- matching ---------- */
  const norm=s=>String(s||'').toLowerCase().normalize('NFKD').replace(/[ً-ٰٟـ̀-ͯ]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}\s]/gu,' ').replace(/\s+/g,' ').trim();
  function lev(a,b){const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let p=Array.from({length:n+1},(_,i)=>i);for(let i=1;i<=m;i++){const c=[i];for(let j=1;j<=n;j++)c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));p=c}return p[n]}
  const sim=(a,b)=>{const L=Math.max(a.length,b.length);return L?1-lev(a,b)/L:1};
  const tokens=s=>norm(s).split(' ').filter(Boolean).sort().join(' ');
  // Never guess a subject from a similar spelling: a wrong subject is worse than a rejected heading.
  const ALIAS={maths:'mathematics',math:'mathematics',mtc:'mathematics',eng:'english',sci:'science',sst:'social studies','soc studies':'social studies','social study':'social studies',lit:'literature',bio:'biology',chem:'chemistry',phy:'physics',physic:'physics',geo:'geography',hist:'history',agric:'agriculture',comp:'computer',ict:'computer studies'};
  function matchSubject(h,subs){const x=norm(h);if(!x)return null;let r=subs.filter(s=>norm(s.name)===x);if(r.length===1)return r[0];if(r.length>1)return null;
    // forgiving but safe: only when exactly one subject fits (abbreviation, prefix or extra words such as “English Language”)
    const a=ALIAS[x];if(a){r=subs.filter(s=>norm(s.name)===a||norm(s.name).startsWith(a));if(r.length===1)return r[0]}
    if(x.length>=3){r=subs.filter(s=>{const n=norm(s.name);return n.startsWith(x)||x.startsWith(n)||n.replace(/ /g,'')===x.replace(/ /g,'')});if(r.length===1)return r[0]}
    return null}
  function matchStudent(name,code,studs){
    const c=String(code||'').trim().toLowerCase();
    if(c){const byCode=studs.filter(s=>String(s.code||'').trim().toLowerCase()===c);if(byCode.length!==1)return null;const candidate=byCode[0];
      // A matching admission code with a different name is shown for manual review, not silently accepted.
      return norm(name)===norm(candidate.name)||tokens(name)===tokens(candidate.name)?{s:candidate,how:'code'}:null;
    }
    const x=norm(name);if(!x)return null;
    const r=studs.filter(s=>norm(s.name)===x||tokens(s.name)===tokens(name));
    return r.length===1?{s:r[0],how:'exact'}:null;
  }
  function suggestStudent(name,code,studs){
    const c=String(code||'').trim().toLowerCase();if(c){const r=studs.filter(s=>String(s.code||'').trim().toLowerCase()===c);if(r.length===1)return r[0]}
    const x=norm(name);if(!x)return null;
    const scored=studs.map(s=>({s,v:Math.max(sim(x,norm(s.name)),sim(tokens(name),tokens(s.name)))})).sort((a,b)=>b.v-a.v);
    return scored[0]&&scored[0].v>=0.72&&(!scored[1]||scored[0].v-scored[1].v>=0.08)?scored[0].s:null;
  }
  const isNum=v=>/^\s*\d+([.,]\d+)?\s*%?\s*$/.test(v);
  const cleanMark=v=>String(v).replace(/\s*\/\s*100\s*$/,'').replace(/(\d),(\d)/,'$1.$2');
  const EMPTYMARK=/^(abs|absent|x|n\/?a|nil|—|–|-|\.)$/i;

  /* ---------- import ---------- */
  let plan=null;
  window.__iusImportPending=()=>!!plan;
  function analyse(tables){
    const c=$('rs-class').value,y=$('rs-year').value,term=$('rs-term').value,assessment=$('rs-assessment').value;
    const subs=resultSubjects(c),studs=SCHOOL.students.filter(s=>inClassY(s,c,y));
    const rows=[],unmatchedCols=new Set(),usedCols=new Map(),fatalIssues=[];let tablesUsed=0;
    tables.forEach((t,ti)=>{
      if(t.length<2)return;
      let hi=-1,cols=[];
      for(let i=0;i<Math.min(t.length,4);i++){
        const m=t[i].map(h=>matchSubject(h,subs));
        const hasName=t[i].some(h=>/name|student|pupil|learner|اسم|الطالب|الطالبه/i.test(String(h||'')));
        const hasSubjectHeading=t[i].some(h=>{const z=String(h||'').trim();return z&&!/^(code|no\.?|id|number|reg|adm|student\s*(no|id|code)|total|avg|average|position|pos|rank|grade|comment|remarks?|#|s\/?n|المجموع|المعدل|الترتيب)$/i.test(z)});
        if(m.some(Boolean)||(hasName&&hasSubjectHeading)){hi=i;cols=m;break}
      }
      if(hi<0)return;tablesUsed++;
      const head=t[hi];
      let nameCol=head.findIndex((h,i)=>!cols[i]&&/name|student|pupil|learner|اسم|الطالب|الطالبه/i.test(h));
      const codeCol=head.findIndex((h,i)=>!cols[i]&&i!==nameCol&&/^(code|no\.?|id|number|reg|adm|student\s*(no|id|code)|رقم)/i.test(h.trim()));
      if(nameCol<0)nameCol=head.findIndex((h,i)=>!cols[i]&&i!==codeCol);
      if(nameCol<0){fatalIssues.push(`Table ${ti+1}: no student-name column was identified.`);return}
      const metadata=/^(total|avg|average|position|pos|rank|grade|comment|remarks?|no\.?|#|s\/?n|المجموع|المعدل|الترتيب)$/i;
      const seenSub=new Set();
      head.forEach((h,i)=>{
        const title=String(h||'').trim();
        if(cols[i]){if(seenSub.has(cols[i].id))fatalIssues.push(`Table ${ti+1}: subject “${cols[i].name}” appears more than once. Keep only one column for each subject.`);seenSub.add(cols[i].id);usedCols.set(cols[i].id,cols[i]);return}
        if(i===nameCol||i===codeCol||!title||metadata.test(title)||/^unnamed/i.test(title))return;
        // New subject headings are prepared during preview and only created after confirmation.
        let sub=usedCols.has('__newsub__'+norm(title))?usedCols.get('__newsub__'+norm(title)):null;
        if(!sub){sub=SCHOOL.subjects.find(z=>norm(z.name)===norm(title));if(sub&&Array.isArray(sub.classes)&&sub.classes.length&&!sub.classes.includes(c))sub=null;}
        if(!sub)sub={id:'__newsub__'+norm(title),name:title,classes:[c],__new:true};
        cols[i]=sub;usedCols.set(sub.id,sub);if(seenSub.has(sub.id))fatalIssues.push(`Table ${ti+1}: subject “${sub.name}” appears more than once. Keep only one column for each subject.`);seenSub.add(sub.id);
      });
      t.slice(hi+1).forEach((r,ri)=>{
        const name=(r[nameCol]||'').trim(),code=codeCol>=0?(r[codeCol]||'').trim():'';
        if(!name&&!code)return;
        if(/^(total|average|mean|class)$/i.test(name))return;
        let m=matchStudent(name,code,studs),suggestion=m?null:suggestStudent(name,code,studs),marks={},bad=[];
        cols.forEach((sub,i)=>{if(!sub)return;let v=(r[i]||'').trim();if(v===''||EMPTYMARK.test(v))return;v=cleanMark(v);if(!isNum(v)){bad.push(`${sub.name}: “${v}” is not a number from 0 to 100`);return}const n=parseFloat(v);if(!Number.isFinite(n)||n<0||n>100){bad.push(`${sub.name}: “${v}” is outside 0–100`);return}marks[sub.id]=Math.round(n*100)/100});
        if(!m&&!suggestion&&name){m={s:{id:`__newstudent__${ti}_${ri}`,name,code,gender:'',yearId:y,classId:c,dualClassId:'',streamId:''},how:'new'};}
        rows.push({name,code,m,suggestion,marks,bad,skip:false,table:ti+1,row:ri+hi+2});
      });
    });
    const recognized=[...usedCols.values()];
    if(rows.some(r=>r.bad.length))fatalIssues.push('One or more marks are invalid. Correct those cells in Word and import the file again; no marks will be applied while invalid marks remain.');
    return{subs,studs,rows,unmatchedCols:[...unmatchedCols],usedCols:recognized,tablesUsed,fatalIssues,context:{classId:c,year:y,term,assessment}};
  }
  function show(p){
    const counts=new Map();p.rows.forEach(r=>{if(r.m&&!r.skip)counts.set(String(r.m.s.id),(counts.get(String(r.m.s.id))||0)+1)});
    const duplicateIds=new Set([...counts].filter(([,n])=>n>1).map(([id])=>id));
    const needsChoice=(r)=>!r.m||r.skip||duplicateIds.has(String(r.m.s.id));
    const ok=p.rows.filter(r=>r.m&&!r.skip&&!duplicateIds.has(String(r.m.s.id))&&!r.bad.length),skipped=p.rows.filter(r=>r.skip),unresolved=p.rows.filter(r=>!r.m&&!r.skip),duplicates=p.rows.filter(r=>r.m&&!r.skip&&duplicateIds.has(String(r.m.s.id)));
    const head=`<tr><th>Word name / code</th><th>Student in school</th>${p.usedCols.map(s=>`<th>${esc(s.name)}</th>`).join('')}<th>Validation</th></tr>`;
    const body=p.rows.map((r,ri)=>`<tr style="${r.skip?'opacity:.55':(!r.m?'background:#fee2e2':(r.bad.length||duplicateIds.has(String(r.m.s.id))?'background:#fef9c3':''))}"><td>${esc(r.name||r.code)}${r.code?`<small style="display:block">Code: ${esc(r.code)}</small>`:''}<small style="display:block">Table ${r.table}, row ${r.row}</small></td><td>${r.m&&r.m.how==='new'?`<b>${esc(r.m.s.name)}</b><small style="display:block;color:#047857">New student — will be registered in ${esc(SCHOOL.classes.find(z=>z.id===p.context.classId)?.name||'selected class')}</small>`:needsChoice(r)?`<select data-wi-row="${ri}" style="min-width:190px;max-width:260px"><option value="">Choose student…</option><option value="__new__">Register “${esc(r.name)}” as a new student</option><option value="__skip__"${r.skip?' selected':''}>Skip this row (do not import)</option>${p.studs.map(st=>`<option value="${esc(st.id)}"${r.m&&String(r.m.s.id)===String(st.id)&&!r.skip?' selected':''}>${esc(st.name)}${st.code?` — ${esc(st.code)}`:''}</option>`).join('')}</select>`:esc(r.m.s.name)+(r.m.how==='code'?' <small>(code + name)</small>':'')} ${r.suggestion&&!r.m?`<small style="display:block">Possible match: ${esc(r.suggestion.name)} — choose that student or explicitly register a new one.</small>`:''}</td>${p.usedCols.map(s=>`<td>${r.marks[s.id]??''}</td>`).join('')}<td>${esc(r.bad.join('; '))}${r.skip?'Skipped by user':(!r.m?'Student needs to be matched or explicitly skipped':(duplicateIds.has(String(r.m.s.id))?'Duplicate student assignment — choose a different student or skip one row':''))}</td></tr>`).join('');
    const blockers=[...p.fatalIssues];
    if(unresolved.length)blockers.push(`${unresolved.length} row(s) still need a student match or must be explicitly skipped.`);
    if(duplicates.length)blockers.push('The same school student is assigned to more than one Word row. Resolve duplicate assignments before importing.');
    $('wi-preview').innerHTML=`<p><b>${ok.length}</b> row(s) ready to import; <b>${unresolved.length}</b> need matching${skipped.length?`; <b>${skipped.length}</b> explicitly skipped`:''}. ${p.usedCols.length} exact subject heading(s) recognised.</p>
      ${blockers.length?`<div style="padding:9px 11px;margin:8px 0;border-radius:8px;background:#fee2e2;color:#991b1b"><b>Import blocked until corrected:</b><ul style="margin:5px 0 0 18px">${blockers.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:''}
      <div style="overflow-x:auto"><table class="datatable"><thead>${head}</thead><tbody>${body}</tbody></table></div>
      <p class="hint">Safety checks: subject headings must match exactly; names are not automatically fuzzy-matched. Yellow rows need review. Blank mark cells are left unchanged. Nothing is saved until you press “Save Results” after filling the grid.</p>
      <button type="button" id="wi-apply" class="green"${blockers.length||!ok.length?' disabled':''}>Fill the grid with these marks</button> <button type="button" id="wi-cancel" class="gray">Cancel</button>`;
    $('wi-cancel').onclick=()=>{plan=null;$('wi-preview').innerHTML='';say('');$('wi-file').value=''};
    document.querySelectorAll('[data-wi-row]').forEach(sel=>sel.onchange=()=>{const r=p.rows[Number(sel.dataset.wiRow)];if(!r)return;const v=sel.value;if(v==='__skip__'){r.m=null;r.skip=true}else if(v==='__new__'){r.m={s:{id:`__newstudent__manual_${sel.dataset.wiRow}`,name:r.name,code:r.code,gender:'',yearId:p.context.year,classId:p.context.classId,dualClassId:'',streamId:''},how:'new'};r.skip=false}else if(v){const st=p.studs.find(x=>String(x.id)===v);r.m=st?{s:st,how:'manual'}:null;r.skip=false}else{r.m=null;r.skip=false}show(p)});
    $('wi-apply').onclick=()=>{try{apply()}catch(err){say(err.message||'The import could not be completed.',true)}};
  }
  function apply(){
    if(!plan)return;
    const now={classId:$('rs-class').value,year:$('rs-year').value,term:$('rs-term').value,assessment:$('rs-assessment').value};
    if(Object.keys(now).some(k=>String(now[k])!==String(plan.context[k]))){
      // Something (for example the linked Report window) moved the selection after the preview. The preview belongs to the planned
      // year/term/assessment/class, so go back to it instead of refusing to fill.
      const map={classId:'rs-class',year:'rs-year',term:'rs-term',assessment:'rs-assessment'};
      Object.keys(map).forEach(k=>{const el=$(map[k]);if(el&&String(el.value)!==String(plan.context[k])&&[...el.options].some(o=>o.value===String(plan.context[k])))el.value=plan.context[k]});
      if(typeof loadResultGrid==='function')loadResultGrid();if(typeof writeSel==='function')writeSel();
      const again={classId:$('rs-class').value,year:$('rs-year').value,term:$('rs-term').value,assessment:$('rs-assessment').value};
      if(Object.keys(again).some(k=>String(again[k])!==String(plan.context[k]))){say('The selected year, term, assessment or class no longer exists. Choose them again and import the file again.',true);return}
    }
    const counts=new Map();plan.rows.forEach(r=>{if(r.m&&!r.skip)counts.set(String(r.m.s.id),(counts.get(String(r.m.s.id))||0)+1)});
    if(plan.fatalIssues.length||plan.rows.some(r=>!r.m&&!r.skip||r.bad.length)||[...counts.values()].some(n=>n>1)){say('Safety check failed. Resolve every validation warning in the preview before importing.',true);return}
    if(typeof gridDirty!=='undefined'&&gridDirty){say('The marks grid contains unsaved edits. Press “Save Results” first, then import the Word file again. Nothing was imported.',true);return}
    const incomingCodes=plan.rows.filter(r=>r.m&&!r.skip&&r.m.how==='new'&&r.code).map(r=>String(r.code).trim().toLowerCase());
    const duplicateIncoming=incomingCodes.find((code,i)=>incomingCodes.indexOf(code)!==i);
    const duplicateExisting=incomingCodes.find(code=>SCHOOL.students.some(st=>String(st.code||'').trim().toLowerCase()===code));
    if(duplicateIncoming||duplicateExisting){say(`Admission code ${duplicateIncoming||duplicateExisting} already exists in this import or the school records. Resolve the duplicate before importing. No records were changed.`,true);return}
    // Count replacements using currently existing subject/student rows before changing any records.
    const trNow=id=>[...document.querySelectorAll('#rs-body tr[data-id]')].find(x=>String(x.dataset.id)===String(id));
    let anticipatedOver=0;
    plan.rows.forEach(r=>{if(!r.m||r.skip||r.m.how==='new')return;const row=trNow(r.m.s.id);if(!row)return;Object.entries(r.marks).forEach(([sid,v])=>{const inp=[...row.querySelectorAll('.result-mark')].find(i=>i.dataset.sub===sid);if(inp&&inp.value!==''&&+inp.value!==v)anticipatedOver++})});
    if(anticipatedOver&&!confirm(`${anticipatedOver} existing mark(s) will be replaced by the Word values. Continue?`))return;
    // Create/link new subject headings only after the user confirms the preview.
    const subjectMap={};
    plan.usedCols.forEach(sub=>{
      if(!sub.__new){subjectMap[sub.id]=sub.id;return}
      let ex=SCHOOL.subjects.find(z=>norm(z.name)===norm(sub.name));
      if(ex){if(!Array.isArray(ex.classes))ex.classes=[];if(ex.classes.length&&!ex.classes.includes(plan.context.classId))ex.classes.push(plan.context.classId);else if(!ex.classes.length){}subjectMap[sub.id]=ex.id;}
      else {const id=typeof uid==='function'?uid():`sub-${Date.now()}-${Math.random()}`;SCHOOL.subjects.push({id,name:sub.name,classes:[plan.context.classId]});subjectMap[sub.id]=id;}
    });
    // Register unmatched students directly into the selected class and academic year.
    const newStudentMap={};
    plan.rows.forEach(r=>{if(!r.m||r.skip||r.m.how!=='new')return;
      const code=String(r.code||'').trim()||(typeof IDS!=='undefined'&&IDS.newStudentCode?IDS.newStudentCode(plan.context.year,plan.context.classId):`NEW-${Date.now()}-${Math.floor(Math.random()*10000)}`);
      if(SCHOOL.students.some(st=>String(st.code||'').trim().toLowerCase()===code.toLowerCase())){throw new Error(`Admission code ${code} already exists. Resolve the duplicate before importing.`)}
      const id=typeof uid==='function'?uid():`st-${Date.now()}-${Math.random()}`;
      const st={...r.m.s,id,code,name:r.name,yearId:plan.context.year,classId:plan.context.classId,dualClassId:'',streamId:''};
      SCHOOL.students.push(st);newStudentMap[r.m.s.id]=st.id;r.m={s:st,how:'new-registered'};
    });
    // Translate provisional subject IDs to real IDs before rebuilding the grid.
    plan.rows.forEach(r=>{const next={};Object.entries(r.marks).forEach(([sid,v])=>{next[subjectMap[sid]||sid]=v});r.marks=next});
    persist();loadResultGrid();
    const tr=id=>[...document.querySelectorAll('#rs-body tr[data-id]')].find(x=>String(x.dataset.id)===String(id));
    let filled=0,over=0,missingTargets=0;const todo=[];
    plan.rows.forEach(r=>{if(!r.m||r.skip)return;const row=tr(r.m.s.id);if(!row){missingTargets++;return}Object.entries(r.marks).forEach(([sid,v])=>{const inp=[...row.querySelectorAll('.result-mark')].find(i=>i.dataset.sub===sid);if(!inp){missingTargets++;return}if(inp.value!==''&&+inp.value!==v)over++;todo.push([inp,v])})});
    if(missingTargets){persist();say(`${missingTargets} mark field(s) could not be found in the current grid. The new student/subject records were added, but no marks were placed. Please reload the selected class and retry the marks import.`,true);return}
    todo.forEach(([inp,v])=>{inp.value=v;inp.dispatchEvent(new Event('input',{bubbles:true}));filled++});
    persist();plan=null;$('wi-preview').innerHTML='';$('wi-file').value='';
    const registered=Object.keys(newStudentMap).length;
    say(`${registered} new student(s) registered; ${filled} mark(s) placed in the grid. Review the marks, then press “Save Results” to save results. Student and subject records have been saved.`,false);
    $('rs-body').scrollIntoView({behavior:'smooth',block:'start'});
  }
  /* ---------- Excel (.xlsx) and CSV readers: same table shape as Word ---------- */
  function parseCSV(text){
    text=text.replace(/^﻿/,'');const first=text.split(/\r?\n/)[0]||'';const d=(first.match(/\t/g)||[]).length>(first.match(/[,;]/g)||[]).length?'\t':((first.match(/;/g)||[]).length>(first.match(/,/g)||[]).length?';':',');
    const rows=[];let row=[],cur='',q=false;
    for(let i=0;i<text.length;i++){const ch=text[i];
      if(q){if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++}else q=false}else cur+=ch}
      else if(ch==='"')q=true;else if(ch===d){row.push(cur.trim());cur=''}
      else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cur.trim());rows.push(row);row=[];cur=''}
      else cur+=ch}
    if(cur!==''||row.length){row.push(cur.trim());rows.push(row)}
    return [rows.filter(r=>r.some(c=>c!==''))];
  }
  async function readXlsx(file){
    const buf=new Uint8Array(await file.arrayBuffer());
    const td=u=>new TextDecoder().decode(u);
    const X=s=>new DOMParser().parseFromString(s,'application/xml');
    let shared=[];try{const d=X(td(await readZipEntry(buf,'xl/sharedStrings.xml')));shared=[...d.getElementsByTagName('si')].map(si=>[...si.getElementsByTagName('t')].filter(t=>!t.parentNode||t.parentNode.localName!=='rPh').map(t=>t.textContent).join(''))}catch(e){}
    let sheet=null;
    for(let n=1;n<=6&&!sheet;n++){try{sheet=X(td(await readZipEntry(buf,'xl/worksheets/sheet'+n+'.xml')))}catch(e){}}
    if(!sheet)throw new Error('No worksheet was found in this Excel file.');
    const col=ref=>{const m=/^([A-Z]+)/.exec(ref||'');let n=0;if(m)for(const ch of m[1])n=n*26+ch.charCodeAt(0)-64;return n-1};
    const rows=[...sheet.getElementsByTagName('row')].map(r=>{const out=[];let next=0;
      [...r.getElementsByTagName('c')].forEach(c=>{const idx=c.getAttribute('r')?col(c.getAttribute('r')):next;next=idx+1;
        const t=c.getAttribute('t'),vEl=c.getElementsByTagName('v')[0];let val='';
        if(t==='s')val=shared[+((vEl&&vEl.textContent)||0)]||'';
        else if(t==='inlineStr')val=[...c.getElementsByTagName('t')].map(x=>x.textContent).join('');
        else if(vEl)val=vEl.textContent;
        out[idx]=String(val).trim()});
      return Array.from(out,v=>v||'')}).filter(r=>r.some(c=>c!==''));
    return [rows];
  }
  async function readAny(f){
    if(/\.docx$/i.test(f.name))return readTables(f);
    if(/\.xlsx$/i.test(f.name))return readXlsx(f);
    if(/\.(csv|txt|tsv)$/i.test(f.name))return parseCSV(await f.text());
    throw new Error('Please choose a Word (.docx), Excel (.xlsx) or CSV (.csv) file. Older .doc/.xls files must be saved again in the newer format.');
  }
  $('wi-file').onchange=async e=>{
    const f=e.target.files[0];if(!f)return;$('wi-preview').innerHTML='';plan=null;
    // reset right away so choosing the same file again always works (after fixing the class/term, for example)
    const resetInput=()=>{try{e.target.value=''}catch(_){}};
    if(f.size>25*1024*1024){resetInput();say('This file is larger than 25 MB. Save a smaller file and try again.',true);return}
    if(!$('rs-class').value||!$('rs-year').value||!$('rs-term').value||!$('rs-assessment').value){resetInput();say('Choose the academic year, term, assessment and class first.',true);return}
    say('Reading and validating the file…');
    try{
      const tables=await readAny(f);resetInput();plan=analyse(tables);
      if(!plan.tablesUsed){const hdr=(tables[0]&&tables[0][0]||[]).filter(Boolean).slice(0,8).join(' | ');say('No table with subject headings for this class was found.'+(hdr?` The first row of your file says: “${hdr}”. `:' ')+'Download the template and keep each subject heading as shown.',true);plan=null;return}
      say('Preview ready — check every row and resolve the validation warnings below.');show(plan);
      // nothing to fix → fill the grid straight away (the preview stays for checking)
      const clean=!plan.fatalIssues.length&&plan.rows.length&&plan.rows.every(r=>r.m&&!r.bad.length)&&!plan.rows.some(r=>r.m&&r.m.how==='new')&&!plan.usedCols.some(s=>s.__new);
      const ids=plan.rows.map(r=>String(r.m&&r.m.s.id));
      if(clean&&new Set(ids).size===ids.length)try{apply()}catch(err){say(err.message||'The import could not be completed.',true)}
    }catch(err){resetInput();plan=null;say(err.message||'The file could not be read.',true)}
  };

  /* ---------- template: a real .docx with this class's students and subjects ---------- */
  const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
  const crc=b=>{let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=crcT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0};
  function zipStore(files){
    const enc=new TextEncoder(),parts=[],cd=[];let off=0;
    files.forEach(([name,text])=>{
      const n=enc.encode(name),d=enc.encode(text),c=crc(d),h=new DataView(new ArrayBuffer(30));
      h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x0800,true);h.setUint32(14,c,true);h.setUint32(18,d.length,true);h.setUint32(22,d.length,true);h.setUint16(26,n.length,true);
      parts.push(new Uint8Array(h.buffer),n,d);
      const e=new DataView(new ArrayBuffer(46));
      e.setUint32(0,0x02014b50,true);e.setUint16(4,20,true);e.setUint16(6,20,true);e.setUint16(8,0x0800,true);e.setUint32(16,c,true);e.setUint32(20,d.length,true);e.setUint32(24,d.length,true);e.setUint16(28,n.length,true);e.setUint32(42,off,true);
      cd.push(new Uint8Array(e.buffer),n);off+=30+n.length+d.length;
    });
    const csz=cd.reduce((a,b)=>a+b.length,0),end=new DataView(new ArrayBuffer(22));
    end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,csz,true);end.setUint32(16,off,true);
    return new Blob([...parts,...cd,new Uint8Array(end.buffer)],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  const x=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  $('wi-template').onclick=()=>{
    const c=$('rs-class').value,y=$('rs-year').value,cls=SCHOOL.classes.find(k=>k.id===c);
    if(!cls){say('Choose a class first.',true);return}
    const subs=resultSubjects(c),studs=SCHOOL.students.filter(s=>inClassY(s,c,y));
    if(!subs.length){say('This class has no subjects yet. Add them in the Subjects tab.',true);return}
    const cell=(t,b)=>`<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/></w:tcPr><w:p><w:r>${b?'<w:rPr><w:b/></w:rPr>':''}<w:t xml:space="preserve">${x(t)}</w:t></w:r></w:p></w:tc>`;
    const row=(a,b)=>`<w:tr>${a.map(t=>cell(t,b)).join('')}</w:tr>`;
    const tbl=`<w:tbl><w:tblPr><w:tblBorders>${['top','left','bottom','right','insideH','insideV'].map(k=>`<w:${k} w:val="single" w:sz="4" w:space="0" w:color="808080"/>`).join('')}</w:tblBorders></w:tblPr>${row(['Code','Student',...subs.map(s=>s.name)],true)}${studs.map(s=>row([s.code||'',s.name,...subs.map(()=>'')])).join('')}</w:tbl>`;
    const doc=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="${W}"><w:body><w:p><w:r><w:rPr><w:b/></w:rPr><w:t>${x(cls.name)} — marks (type marks 0–100 only; keep the first row as it is)</w:t></w:r></w:p>${tbl}<w:p/><w:sectPr><w:pgSz w:w="16838" w:h="11906" w:orient="landscape"/></w:sectPr></w:body></w:document>`;
    const blob=zipStore([
      ['[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
      ['_rels/.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
      ['word/document.xml',doc]]);
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`marks-template-${cls.name.replace(/[^\w؀-ۿ-]+/g,'_')}.docx`;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500);
    say('Template downloaded. Fill in the marks in Word, save it, then import it here.');
  };
})();
