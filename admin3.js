/* Admin v2: Question Bank (multi-exam, multi-section, 5 question types) and Bulk Question Import (CSV / Excel with exam + section columns). */
(function(){
const A=window.HSA,X=window.HSX,DB=HS.db,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=HS.esc,S=()=>A.S(),need=X.need,chip=X.chip,norm=X.norm;
const TYPES=[['MCQ','Multiple choice (one answer)'],['MSQ','Multiple select (all correct, no partial credit)'],['NUM','Numerical answer'],['TF','True / False'],['TEXT','Short text answer']];
const TN=Object.fromEntries(TYPES.map(t=>[t[0],t[1].split(' (')[0]])),DIFF=['Easy','Moderate','Hard'],STAT=['active','inactive','draft'],L='ABCDEF';
const secOf=q=>DB.secName(q.examId,q.sectionId);
const liveExams=()=>X.exams();
const ansText=q=>q.type==='MSQ'?q.correct.map(i=>L[i]).join(', '):(q.type==='MCQ')?L[q.correct]:q.type==='TF'?(q.correct===0?'True':'False'):String(q.correct);
const rows=()=>DB.all('questions').filter(q=>{const e=DB.get('exams',q.examId);return e&&!e.deleted});

/* ================= QUESTION BANK ================= */
const secFilterOpts=()=>{const ex=X.ST.qs&&X.ST.qs.f.exam;if(ex){const e=DB.get('exams',ex);return [['—','(No section)']].concat((e.sections||[]).map(s=>[s.name,s.name]))}return [...new Set(rows().map(secOf))].sort().map(n=>[n,n==='—'?'(No section)':n])};
const distinct=k=>()=>[...new Set(rows().map(q=>q[k]).filter(Boolean))].sort().map(v=>[v,v]);
X.reg('qs',{mod:'questions',title:'Questions',file:'question-bank',rows,id:q=>String(q.id),search:q=>[q.q,q.subject,q.topic,q.expl,DB.examName(q.examId),secOf(q)].join(' '),searchHint:'Search question text, subject, topic…',dateKey:q=>q.createdAt,dateLabel:'Added',per:20,sort:{k:'id',dir:'desc'},
 filters:[{k:'exam',label:'Examination',options:()=>X.examOpts(),match:(q,v)=>q.examId==v,rerender:true},{k:'sec',label:'Section',dependsOn:'exam',options:secFilterOpts,match:(q,v)=>secOf(q)===v},
  {k:'subject',label:'Subject',options:distinct('subject'),match:(q,v)=>q.subject===v},{k:'topic',label:'Topic',options:distinct('topic'),match:(q,v)=>q.topic===v},
  {k:'type',label:'Question type',options:()=>TYPES.map(t=>[t[0],TN[t[0]]]),match:(q,v)=>q.type===v},{k:'diff',label:'Difficulty',options:()=>DIFF.map(d=>[d,d]),match:(q,v)=>q.diff===v},{k:'status',label:'Status',options:()=>STAT.map(s=>[s,s[0].toUpperCase()+s.slice(1)]),match:(q,v)=>q.status===v}],
 cols:[{k:'id',label:'ID',get:q=>q.id},{k:'q',label:'Question',get:q=>q.q,html:q=>esc(q.q.length>110?q.q.slice(0,110)+'…':q.q),wrap:true},{k:'exam',label:'Examination',get:q=>DB.examName(q.examId)},{k:'sec',label:'Section',get:secOf},{k:'subject',label:'Subject',get:q=>q.subject||''},{k:'topic',label:'Topic',get:q=>q.topic||''},
  {k:'type',label:'Type',get:q=>q.type,html:q=>chip(TN[q.type]||q.type,'b')},{k:'ans',label:'Correct answer',get:ansText},{k:'diff',label:'Difficulty',get:q=>q.diff||''},{k:'marks',label:'Marks',get:q=>q.marks},{k:'neg',label:'Negative',get:q=>Math.abs(q.neg||0)},
  {k:'status',label:'Status',get:q=>q.status,html:q=>chip(q.status,q.status==='active'?'g':q.status==='draft'?'y':'')},{k:'expl',label:'Explanation',get:q=>q.expl||'',html:()=>'',x:true},{k:'added',label:'Date added',get:q=>X.dstr(q.createdAt),sortVal:q=>q.createdAt}].map(c=>c.k==='expl'?Object.assign(c,{sort:false,html:q=>q.expl?'✓':'—'}):c),
 select:true,bulk:[{k:'on',label:'Set active',perm:'edit',run:(ids,done)=>bulkSet(ids,{status:'active'},'Activated',done)},{k:'off',label:'Set inactive',perm:'edit',run:(ids,done)=>bulkSet(ids,{status:'inactive'},'Deactivated',done)},
  {k:'diff',label:'Change difficulty',perm:'edit',run:(ids,done)=>X.form({title:`Change difficulty of ${ids.length} questions`,fields:[{k:'d',label:'Difficulty',type:'select',options:DIFF.map(d=>[d,d]),req:true}],onSave:v=>{bulkSet(ids,{diff:v.d},'Changed difficulty of',done);return true}})},
  {k:'move',label:'Move to exam / section',perm:'edit',run:(ids,done)=>moveCopy(ids,'move',done)},{k:'copy',label:'Reuse in another exam (copy)',perm:'add',run:(ids,done)=>moveCopy(ids,'copy',done)},
  {k:'del',label:'Delete',perm:'delete',danger:true,run:(ids,done)=>X.confirm('Delete questions?',`${ids.length} question${ids.length>1?'s':''} will be permanently removed. Past attempt results are not affected.`,()=>{const d=DB.load(),set=new Set(ids.map(Number));d.questions=d.questions.filter(q=>!set.has(q.id));DB.save();A.log(`Deleted ${ids.length} questions`,'Question Bank');A.toast(`Deleted ${ids.length}.`);done()},'Delete',true)}],
 rowActions:q=>[`<button class="btn-s" data-xa="q-view" data-id="${q.id}">View</button>`,A.can('questions','edit')&&`<button class="btn-s" data-xa="q-edit" data-id="${q.id}">Edit</button>`,A.can('questions','add')&&`<button class="btn-s" data-xa="q-copy" data-id="${q.id}">Reuse in…</button>`,A.can('questions','delete')&&`<button class="btn-s d" data-xa="q-del" data-id="${q.id}">Delete</button>`].filter(Boolean).join(''),
 toolbarHtml:()=>(A.can('questions','add')?'<button class="btn-s p" data-xa="q-new">+ Add question</button>':'')+(A.can('import','view')?'<a class="btn-s" href="#import">Bulk import</a>':''),empty:'The question bank is empty. Add a question or use Bulk Question Import.'});
function bulkSet(ids,patch,verb,done){const set=new Set(ids.map(Number));DB.all('questions').forEach(q=>{if(set.has(q.id))Object.assign(q,patch)});DB.save();A.log(`${verb} ${ids.length} questions`,'Question Bank');A.toast(`${verb} ${ids.length} question${ids.length>1?'s':''}.`);done()}
function counts(){const out=[];liveExams().forEach(e=>{const qs=DB.all('questions').filter(q=>q.examId===e.id),secs=(e.sections||[]).slice().sort((a,b)=>a.order-b.order);
  const row=(sec,label,list,plan)=>`<tr><td>${esc(e.title)}</td><td>${esc(label)}</td><td><b>${list.filter(q=>q.status==='active').length}</b></td><td>${list.filter(q=>q.status!=='active').length}</td><td>${list.length}</td><td>${plan}</td></tr>`;
  if(secs.length){secs.forEach(s=>out.push(row(s,s.name+(s.enabled?'':' (disabled)'),qs.filter(q=>q.sectionId===s.id),s.questions||'all')));const un=qs.filter(q=>!secs.some(s=>s.id===q.sectionId));if(un.length)out.push(row(null,'⚠ Not in any section',un,'not used in tests'))}
  else out.push(row(null,'(whole paper)',qs,'all'))});
  return `<details class="panel-a" style="padding:12px 16px"><summary style="cursor:pointer;font-weight:800">Questions available under each examination and section (${DB.all('questions').length} total)</summary><div class="tw" style="margin-top:10px"><table class="t"><thead><tr><th>Examination</th><th>Section</th><th>Active</th><th>Inactive / draft</th><th>Total</th><th>Used per test</th></tr></thead><tbody>${out.join('')||'<tr><td colspan="6">No examinations yet.</td></tr>'}</tbody></table></div></details>`}
A.P.questions=()=>counts()+X.dt('qs');

/* ---- add / edit form ---- */
let qd=null;   // dynamic block state
const dynHTML=(type,st)=>{
  if(type==='MCQ'||type==='MSQ'){const m=type==='MSQ',o=st.options,c=st.correct;
    return `<div id="q-dyn"><label style="font-size:12.5px;font-weight:700">Options &amp; correct answer ${m?'(tick every correct option)':'(select the correct option)'} *</label>${o.map((t,i)=>`<div class="ml" style="margin:6px 0;flex-wrap:nowrap"><input type="${m?'checkbox':'radio'}" name="q-corr" value="${i}" style="width:auto" ${(m?(c||[]).includes(i):c===i)?'checked':''} aria-label="Correct option ${L[i]}"><b style="width:18px">${L[i]}</b><input data-qo="${i}" value="${esc(t)}" placeholder="Option ${L[i]}" style="flex:1">${o.length>2?`<button type="button" class="btn-s d" data-xa="q-rmopt" data-i="${i}">×</button>`:''}</div>`).join('')}${o.length<6?`<button type="button" class="btn-s" data-xa="q-addopt">+ Add option</button>`:''}</div>`}
  if(type==='TF')return `<div id="q-dyn"><label style="font-size:12.5px;font-weight:700">Correct answer *</label><div class="ml"><label><input type="radio" name="q-corr" value="0" style="width:auto" ${st.correct===0?'checked':''}> True</label><label><input type="radio" name="q-corr" value="1" style="width:auto" ${st.correct===1?'checked':''}> False</label></div></div>`;
  if(type==='NUM')return `<div id="q-dyn"><label style="font-size:12.5px;font-weight:700" for="q-ans">Correct numerical answer *</label><input id="q-ans" value="${esc(st.correct??'')}" placeholder="e.g. 42 or 3.14"><small style="color:var(--muted)">Students type the number; it is compared as a number.</small></div>`;
  return `<div id="q-dyn"><label style="font-size:12.5px;font-weight:700" for="q-ans">Correct text answer *</label><input id="q-ans" value="${esc(st.correct??'')}" placeholder="Exact answer (not case-sensitive)"></div>`};
function readDyn(type){
  if(type==='MCQ'||type==='MSQ'){const options=$$('[data-qo]').map(i=>i.value.trim());const chk=$$('[name=q-corr]').filter(i=>i.checked).map(i=>+i.value);return {options,correct:type==='MSQ'?chk:(chk.length?chk[0]:null)}}
  if(type==='TF'){const c=$$('[name=q-corr]').find(i=>i.checked);return {options:['True','False'],correct:c?+c.value:null}}
  return {options:[],correct:($('#q-ans')||{value:''}).value.trim()}}
const fixCorrect=(type,st)=>{if(type==='MSQ'&&!Array.isArray(st.correct))st.correct=st.correct===null||st.correct===undefined||typeof st.correct==='string'?[]:[st.correct];if(type==='MCQ'&&Array.isArray(st.correct))st.correct=st.correct.length?st.correct[0]:null;if(type==='TF'&&typeof st.correct!=='number')st.correct=null;
  if((type==='NUM'||type==='TEXT')&&typeof st.correct!=='string'&&st.correct!==null&&st.correct!==undefined)st.correct='';if((type==='MCQ'||type==='MSQ')&&st.options.length<2){while(st.options.length<4)st.options.push('')}return st};
function qForm(q,preset){const n=!q;q=q||{};
  qd=fixCorrect(q.type||'MCQ',{options:(q.options||['','','','']).slice(),correct:q.correct!==undefined?q.correct:null});
  const exId=q.examId||(preset&&preset.examId)||'';
  X.form({title:n?'Add question':'Edit question #'+q.id,wide:true,saveLabel:n?'Add question':'Save question',
   values:Object.assign({},q,{examId:exId,sectionId:q.sectionId||'',type:q.type||'MCQ',diff:q.diff||'Moderate',status:q.status||'active',negIn:q.neg!==undefined?Math.abs(q.neg):'',marks:q.marks??''}),
   fields:[{k:'examId',label:'Examination',type:'select',options:()=>X.examOpts(),blank:'Select examination…',req:true},{k:'sectionId',label:'Section',type:'select',dep:'examId',options:v=>X.secOpts(+v.examId),blank:'(none / whole paper)'},
    {k:'subject',label:'Subject',placeholder:'e.g. Quantitative Ability'},{k:'topic',label:'Topic',placeholder:'e.g. Percentages'},
    {k:'type',label:'Question type',type:'select',options:TYPES,req:true},{k:'diff',label:'Difficulty',type:'select',options:DIFF.map(d=>[d,d])},
    {k:'q',label:'Question text',type:'textarea',rows:3,req:true,full:true},{k:'img',label:'Question image (optional)',type:'file',accept:'image/*',maxKB:300,full:true,hint:'PNG/JPG up to 300 KB in this prototype.'},
    {k:'_d',type:'html',html:dynHTML(q.type||'MCQ',qd)},
    {k:'expl',label:'Explanation / solution',type:'textarea',rows:3,full:true},{k:'marks',label:'Marks',type:'number',min:0,step:'any',req:true},{k:'negIn',label:'Negative marks (lost on a wrong answer)',type:'number',min:0,step:'any'},
    {k:'status',label:'Question status',type:'select',options:STAT.map(s=>[s,s[0].toUpperCase()+s.slice(1)])}],
   onSave:v=>{if(!need('questions',n?'add':'edit'))return false;
     const dy=readDyn(v.type),e=DB.get('exams',v.examId);if(!e)return 'Choose an examination.';
     const hasSecs=(e.sections||[]).length>0;if(hasSecs&&!v.sectionId)return `"${e.title}" has sections, so choose one. Questions without a section are not used in its tests.`;
     if(v.sectionId&&!(e.sections||[]).some(s=>s.id==v.sectionId))return 'That section does not belong to the selected examination.';
     if(v.q.trim().length<3)return 'Enter the question text.';
     let options=dy.options,correct=dy.correct;
     if(v.type==='MCQ'||v.type==='MSQ'){if(options.some(o=>!o))return 'Fill in every option or remove the empty ones.';if(new Set(options.map(norm)).size!==options.length)return 'Two options are identical.';
       if(v.type==='MCQ'&&correct===null)return 'Select the correct option.';if(v.type==='MSQ'&&!correct.length)return 'Tick at least one correct option.'}
     if(v.type==='TF'&&correct===null)return 'Select True or False.';
     if(v.type==='NUM'){if(correct===''||!isFinite(+correct))return 'Enter a valid number as the correct answer.';correct=String(+correct)}
     if(v.type==='TEXT'&&!correct)return 'Enter the correct text answer.';
     const key=norm(v.q);if(DB.all('questions').some(x=>x.id!==q.id&&x.examId===e.id&&(x.sectionId||0)===(+v.sectionId||0)&&norm(x.q)===key))return 'This question already exists in the same examination and section.';
     const rec={examId:e.id,sectionId:+v.sectionId||0,subject:v.subject,topic:v.topic,type:v.type,q:v.q,img:v.img?v.img.data:(q.img||''),passage:q.passage||'',options,correct,expl:v.expl,marks:v.marks,neg:-Math.abs(v.negIn||0),diff:v.diff,status:v.status};
     if(n){DB.add('questions',rec);A.log('Added question','Question Bank','',v.q.slice(0,80))}else{DB.update('questions',q.id,rec);A.log('Edited question #'+q.id,'Question Bank','',v.q.slice(0,80))}
     A.toast(n?'Question added.':'Question saved.');A.render();return true}});
  // dynamic behaviour
  const rerenderDyn=()=>{const t=$('#fm-type').value,cur=readDyn(qd.type||t);qd.options=cur.options.length?cur.options:qd.options;qd.correct=cur.correct;fixCorrect(t,qd);qd.type=t;$('#q-dyn').outerHTML=dynHTML(t,qd);defaults()};
  const touched={m:!n,n:!n};const defaults=()=>{const e=DB.get('exams',+$('#fm-examId').value),sid=+$('#fm-sectionId').value;if(!e)return;const s=(e.sections||[]).find(x=>x.id===sid),t=$('#fm-type').value;
    if(!touched.m)$('#fm-marks').value=s&&s.marks!==undefined?s.marks:e.defaultMarks;if(!touched.n){$('#fm-negIn').value=(t==='NUM'||t==='TEXT')?0:Math.abs(s&&s.neg!==undefined?s.neg:e.defaultNeg||0)}};
  $('#fm-type').addEventListener('change',rerenderDyn);$('#fm-examId').addEventListener('change',()=>setTimeout(defaults,0));$('#fm-sectionId').addEventListener('change',defaults);
  $('#fm-marks').addEventListener('input',()=>touched.m=true);$('#fm-negIn').addEventListener('input',()=>touched.n=true);
  qd.type=q.type||'MCQ';if(n&&exId)defaults();else if(n)defaults();
  if(preset&&preset.examId){$('#fm-examId').value=preset.examId;$('#fm-examId').dispatchEvent(new Event('change'))}}
Object.assign(X.actions,{'q-new':()=>need('questions','add')&&qForm(),'q-edit':b=>need('questions','edit')&&qForm(DB.get('questions',b.dataset.id)),
 'q-addopt':()=>{const cur=readDyn(qd.type);qd.options=cur.options;qd.correct=cur.correct;qd.options.push('');$('#q-dyn').outerHTML=dynHTML(qd.type,qd)},
 'q-rmopt':b=>{const cur=readDyn(qd.type),i=+b.dataset.i;qd.options=cur.options;qd.options.splice(i,1);const c=cur.correct;qd.correct=Array.isArray(c)?c.filter(x=>x!==i).map(x=>x>i?x-1:x):c===null?null:c===i?null:c>i?c-1:c;$('#q-dyn').outerHTML=dynHTML(qd.type,qd)},
 'q-view':b=>{const q=DB.get('questions',b.dataset.id);A.openModal(`<h3>Question #${q.id}</h3><div class="ml" style="margin-bottom:8px">${chip(DB.examName(q.examId),'b')}${chip(secOf(q))}${chip(TN[q.type])}${chip(q.diff||'')}${chip(q.status,q.status==='active'?'g':'')}</div>${q.passage?`<div style="font-size:13px;color:var(--muted);margin-bottom:8px">${q.passage}</div>`:''}<p style="font-size:16px">${esc(q.q)}</p>${q.img?`<img src="${esc(q.img)}" style="max-width:100%;border-radius:8px">`:''}${(q.options||[]).length?`<ol type="A" style="padding-left:22px">${q.options.map((o,i)=>`<li ${(Array.isArray(q.correct)?q.correct.includes(i):q.correct===i)?'style="color:#16803f;font-weight:700"':''}>${esc(o)}</li>`).join('')}</ol>`:`<p><b>Answer:</b> ${esc(ansText(q))}</p>`}${q.expl?`<p style="background:var(--peach);padding:10px;border-radius:8px"><b>Solution:</b> ${esc(q.expl)}</p>`:''}<p>Marks +${q.marks} · Negative −${Math.abs(q.neg||0)}</p><button class="btn-s" data-xa="cf-no">Close</button>`)},
 'q-copy':b=>need('questions','add')&&moveCopy([b.dataset.id],'copy',()=>A.render()),
 'q-del':b=>{if(!need('questions','delete'))return;const q=DB.get('questions',b.dataset.id);X.confirm('Delete question?',esc(q.q.slice(0,120)),()=>{DB.remove('questions',q.id);A.log('Deleted question #'+q.id,'Question Bank',q.q.slice(0,80),'');A.render()},'Delete',true)}});
function moveCopy(ids,mode,done){
  const copy=mode==='copy';X.form({title:copy?`Reuse ${ids.length} question${ids.length>1?'s':''} in another examination`:`Move ${ids.length} question${ids.length>1?'s':''}`,saveLabel:copy?'Copy questions':'Move questions',
   extra:copy?'<p style="font-size:13px;color:var(--muted)">Questions are only shared between examinations when you choose to. This makes independent copies; the originals stay where they are.</p>':'',
   fields:[{k:'examId',label:'Target examination',type:'select',options:()=>X.examOpts(),blank:'Select…',req:true},{k:'sectionId',label:'Target section',type:'select',dep:'examId',options:v=>X.secOpts(+v.examId),blank:'(none / whole paper)'}],
   onSave:v=>{if(!need('questions',copy?'add':'edit'))return false;const e=DB.get('exams',v.examId),sid=+v.sectionId||0;if((e.sections||[]).length&&!sid)return `"${e.title}" has sections, so choose one.`;
     const d=DB.load(),set=new Set(ids.map(Number));let done_=0,skipped=0;const seen=new Set(d.questions.filter(q=>q.examId===e.id&&(q.sectionId||0)===sid).map(q=>norm(q.q)));let nid=d.questions.reduce((m,q)=>Math.max(m,q.id),0);
     d.questions.filter(q=>set.has(q.id)).forEach(q=>{if(copy||q.examId!==e.id||q.sectionId!==sid){if(seen.has(norm(q.q))){skipped++;return}seen.add(norm(q.q));
       if(copy){const c=JSON.parse(JSON.stringify(q));c.id=++nid;c.examId=e.id;c.sectionId=sid;c.copiedFrom=q.id;c.createdAt=new Date().toISOString();d.questions.push(c)}else{q.examId=e.id;q.sectionId=sid}done_++}});
     DB.save();A.log(`${copy?'Copied':'Moved'} ${done_} questions to ${e.title}`,'Question Bank');A.toast(`${copy?'Copied':'Moved'} ${done_}${skipped?`, skipped ${skipped} already present`:''}.`);done&&done();return true}})}

/* ================= BULK IMPORT ================= */
const imp={name:'',headers:[],raw:[],res:null,o:{exam:'',sec:'',create:false,dup:true}};
const AL={exam:'exam_name',examname:'exam_name',exam_name:'exam_name',section:'section_name',sectionname:'section_name',section_name:'section_name',subject:'subject',topic:'topic',question:'question',question_text:'question',questiontext:'question',
  option_a:'option_a',option_b:'option_b',option_c:'option_c',option_d:'option_d',option_e:'option_e',option_f:'option_f',a:'option_a',b:'option_b',c:'option_c',d:'option_d',correct_answer:'correct_answer',correct:'correct_answer',answer:'correct_answer',explanation:'explanation',solution:'explanation',
  marks:'marks',negative_marks:'negative_marks',negative:'negative_marks',difficulty:'difficulty',status:'status',type:'type',question_type:'type',image_url:'image_url',image:'image_url'};
const hn=h=>{const k=String(h).toLowerCase().trim().replace(/[\s\-]+/g,'_').replace(/[^a-z0-9_]/g,'');return AL[k]||k};
const TEMPLATE=[['exam_name','section_name','subject','topic','question','option_a','option_b','option_c','option_d','correct_answer','explanation','marks','negative_marks','difficulty','status'],
 ['CAT Full Length Mock 1','QA','Arithmetic','Percentages','What is 20% of 150? (EXAMPLE ROW: delete)','20','30','40','50','B','20% of 150 = 30','3','1','Easy','active'],
 ['GATE Mock Test 1','Engineering Mathematics','Calculus','Derivatives','Select all primes (EXAMPLE ROW: delete)','2','4','5','9','A,C','2 and 5 are prime','2','0.66','Moderate','active'],
 ['CUET Practice Test','','Mathematics','Algebra','If x + 3 = 10, x = ? (EXAMPLE ROW: delete)','','','','','7','x = 7','5','0','Easy','active']];
function parseType(raw){const t=String(raw||'').toLowerCase().replace(/[^a-z]/g,'');return {mcq:'MCQ',single:'MCQ',msq:'MSQ',multiple:'MSQ',multi:'MSQ',multipleselect:'MSQ',num:'NUM',numeric:'NUM',numerical:'NUM',tita:'NUM',tf:'TF',truefalse:'TF',text:'TEXT',short:'TEXT'}[t]||''}
function validate(){
  const o=imp.o,defE=o.exam?DB.get('exams',o.exam):null,defS=defE&&o.sec?(defE.sections||[]).find(s=>s.id==o.sec):null;
  const existing=new Set(DB.all('questions').map(q=>q.examId+'|'+(q.sectionId||0)+'|'+norm(q.q))),seen=new Set(),newEx={},items=[];
  imp.raw.forEach((r,idx)=>{
    const g=k=>String(r[k]??'').trim(),errs=[],it={n:idx+2,r,errs,dup:false,plan:{exam:null,sec:null}};
    const exName=g('exam_name')||(defE?defE.title:'');
    let e=null,sec=null,secPlan=null;
    if(!exName)errs.push('Examination is missing: add exam_name or choose a default examination.');
    else{e=X.exams().find(x=>norm(x.title)===norm(exName));
      if(!e){if(o.create){e=newEx[norm(exName)]||(newEx[norm(exName)]={isNew:true,title:exName,sections:[],id:'n:'+norm(exName)});it.plan.exam=exName}else errs.push(`Examination "${exName}" does not exist. Create it first, or tick "Create missing examinations and sections".`)}}
    const sName=g('section_name')||(defS&&(!g('exam_name')||norm(g('exam_name'))===norm(defE.title))?defS.name:'');
    if(e&&!errs.length){const secs=e.sections||[];
      if(secs.length){if(!sName)errs.push(`Section is required for "${e.title}" (${secs.map(s=>s.name).join(', ')}).`);
        else{sec=secs.find(s=>norm(s.name)===norm(sName));if(!sec){if(o.create){secPlan=sName;it.plan.sec=sName}else errs.push(`Section "${sName}" does not exist in "${e.title}". Available: ${secs.map(s=>s.name).join(', ')}.`)}else if(!sec.enabled)errs.push(`Section "${sec.name}" is disabled.`)}}
      else if(sName){const has=!e.isNew&&DB.all('questions').some(q=>q.examId===e.id);
        if(has)errs.push(`"${e.title}" has no sections and already has questions, so section "${sName}" cannot be used. Leave section_name empty, or add the sections first.`);else if(o.create){secPlan=sName;it.plan.sec=sName}else errs.push(`Section "${sName}" does not exist in "${e.title}".`)}}
    const text=g('question');if(text.length<3)errs.push('Question text is missing.');
    const opts=['a','b','c','d','e','f'].map(l=>g('option_'+l)).filter(Boolean),ans=g('correct_answer');
    let type=parseType(g('type'));
    if(!type){if(opts.length>=2)type=/^[a-f]\s*[,;|\/]\s*[a-f]/i.test(ans)||/^[a-f](\s*[,;|\/]\s*[a-f])+$/i.test(ans)?'MSQ':'MCQ';else if(/^(true|false|t|f)$/i.test(ans)&&opts.length===0)type='TF';else type=ans!==''&&isFinite(+ans)?'NUM':'TEXT'}
    let options=opts,correct=null;
    if(!ans)errs.push('correct_answer is missing.');
    else if(type==='MCQ'||type==='MSQ'){if(opts.length<2)errs.push('Multiple-choice questions need at least two options.');else{
      const idxs=(type==='MSQ'?ans.split(/[,;|\/\s]+/):[ans]).filter(Boolean).map(x=>{const m=x.match(/^[A-Fa-f]$/);return m?'abcdef'.indexOf(x.toLowerCase()):opts.findIndex(op=>norm(op)===norm(x))});
      if(!idxs.length||idxs.some(i=>i<0||i>=opts.length))errs.push(`correct_answer "${ans}" does not match the options (use ${opts.map((_,i)=>L[i]).join('/')}${type==='MSQ'?', separated by commas':''}).`);else correct=type==='MSQ'?[...new Set(idxs)].sort():idxs[0]}}
    else if(type==='TF'){const v=ans.toLowerCase();if(['true','t','yes','1'].includes(v))correct=0;else if(['false','f','no','0'].includes(v))correct=1;else errs.push('correct_answer must be True or False.');options=['True','False']}
    else if(type==='NUM'){if(!isFinite(+ans))errs.push(`correct_answer "${ans}" is not a number.`);else correct=String(+ans);options=[]}
    else{correct=ans;options=[]}
    const secObj=sec||null,eObj=e&&!e.isNew?e:null,defM=secObj&&secObj.marks!==undefined?secObj.marks:(eObj?eObj.defaultMarks:1),defN=secObj&&secObj.neg!==undefined?secObj.neg:(eObj?eObj.defaultNeg:0);
    let marks=defM,neg=(type==='NUM'||type==='TEXT')?0:Math.abs(defN||0);
    if(g('marks')!==''){if(!isFinite(+g('marks'))||+g('marks')<0)errs.push('marks must be a positive number.');else marks=+g('marks')}
    if(g('negative_marks')!==''){if(!isFinite(+g('negative_marks')))errs.push('negative_marks must be a number.');else neg=Math.abs(+g('negative_marks'))}
    let diff='Moderate';if(g('difficulty')){const d=DIFF.find(x=>x.toLowerCase()===g('difficulty').toLowerCase())||(/^med/i.test(g('difficulty'))?'Moderate':'');if(!d)errs.push(`difficulty "${g('difficulty')}" must be Easy, Moderate or Hard.`);else diff=d}
    let status='active';if(g('status')){const s=STAT.find(x=>x===g('status').toLowerCase());if(!s)errs.push(`status "${g('status')}" must be active, inactive or draft.`);else status=s}
    if(!errs.length){const key=(e.isNew?e.id:e.id)+'|'+(sec?sec.id:(secPlan?'n:'+norm(secPlan):0))+'|'+norm(text);
      if(existing.has(key)||seen.has(key)){it.dup=true;it.dupWhy=existing.has(key)?'Already in the question bank (same examination, section and text).':'Duplicate of an earlier row in this file.'}seen.add(key);
      it.q={e,sec,secPlan,rec:{subject:g('subject'),topic:g('topic'),type,q:text,img:g('image_url'),passage:'',options,correct,expl:g('explanation'),marks,neg:-neg,diff,status}}}
    items.push(it)});
  imp.res={items,newEx};}
const impStat=()=>{const it=imp.res?imp.res.items:[];const bad=it.filter(x=>x.errs.length),dup=it.filter(x=>!x.errs.length&&x.dup&&imp.o.dup),ok=it.filter(x=>!x.errs.length&&!(x.dup&&imp.o.dup));return {bad,dup,ok,total:it.length}};
A.P.import=()=>{const st=impStat(),can=A.can('import','add'),defE=imp.o.exam?DB.get('exams',imp.o.exam):null;
  return `<div class="notice">Upload a <b>CSV or Excel (.xlsx)</b> file. Columns: <code>exam_name, section_name, subject, topic, question, option_a … option_d (option_e, option_f optional), correct_answer, explanation, marks, negative_marks, difficulty, status</code> (optional: <code>type, image_url</code>). Choose a default examination and section for rows that leave those columns empty. Nothing is saved until you press Import.</div>
  <div class="panel-a"><div class="form-g">
   <div><label>Default examination</label><select id="imp-exam"><option value="">(use the exam_name column)</option>${X.examOpts().map(o=>`<option value="${o[0]}" ${o[0]==imp.o.exam?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>
   <div><label>Default section</label><select id="imp-sec" ${defE?'':'disabled'}><option value="">(use the section_name column)</option>${defE?X.secOpts(defE.id).map(o=>`<option value="${o[0]}" ${o[0]==imp.o.sec?'selected':''}>${esc(o[1])}</option>`).join(''):''}</select></div>
   <div class="full"><label style="font-weight:600"><input type="checkbox" id="imp-create" style="width:auto" ${imp.o.create?'checked':''}> Create missing examinations and sections (otherwise those rows are reported as errors)</label><label style="font-weight:600;display:block;margin-top:6px"><input type="checkbox" id="imp-dup" style="width:auto" ${imp.o.dup?'checked':''}> Skip questions that already exist in the same examination and section</label></div>
   <div class="full ml"><input type="file" id="imp-file" accept=".csv,.xlsx,.xls,text/csv">${can?'':'<span style="color:var(--muted)">Your role can preview but not import.</span>'}<button class="btn-s" data-xa="imp-tpl">Download template (CSV)</button></div></div></div>
  ${imp.last?`<div class="notice" style="background:var(--green-soft);border-color:#bfe5cc;color:#14532d"><b>Last import:</b> ${imp.last.ok} question${imp.last.ok===1?'':'s'} imported successfully${imp.last.bad?`, ${imp.last.bad} row${imp.last.bad===1?'':'s'} skipped. <a href="#" data-xa="imp-err2" style="color:var(--brand);font-weight:700">Download error report</a>`:'.'}</div>`:''}
  ${imp.res?`<div class="kpis-a" style="grid-template-columns:repeat(4,1fr)"><div class="kpi-a"><span>Rows in ${esc(imp.name)}</span><b>${st.total}</b></div><div class="kpi-a hl"><span>Ready to import</span><b>${st.ok.length}</b></div><div class="kpi-a"><span>Duplicates skipped</span><b>${st.dup.length}</b></div><div class="kpi-a"><span>Rows with errors</span><b style="color:${st.bad.length?'var(--danger)':'inherit'}">${st.bad.length}</b></div></div>
   <div class="ml" style="margin-bottom:10px">${can?`<button class="btn-s p" data-xa="imp-go" ${st.ok.length?'':'disabled'}>Import ${st.ok.length} question${st.ok.length===1?'':'s'}</button>`:''}${st.bad.length+st.dup.length?`<button class="btn-s" data-xa="imp-err">Download error report (${st.bad.length+st.dup.length})</button>`:''}<button class="btn-s" data-xa="imp-reset">Clear</button></div>
   ${(()=>{const nx=Object.values(imp.res.newEx),np=new Set(imp.res.items.filter(x=>x.plan.sec&&!x.errs.length).map(x=>(x.q.e.title)+' / '+x.plan.sec));return nx.length||np.size?`<div class="notice">Will create: ${nx.map(e=>'exam <b>'+esc(e.title)+'</b>').concat([...np].map(s=>'section <b>'+esc(s)+'</b>')).join(', ')}.</div>`:''})()}
   <div class="tw" style="max-height:480px"><table class="t"><thead><tr><th>Row</th><th>Result</th><th>Examination</th><th>Section</th><th>Type</th><th>Question</th><th>Details</th></tr></thead><tbody>${imp.res.items.slice(0,300).map(x=>{const bad=x.errs.length,dup=!bad&&x.dup&&imp.o.dup;return `<tr style="cursor:default"><td>${x.n}</td><td>${bad?chip('Error','r'):dup?chip('Duplicate','y'):chip('OK','g')}</td><td>${esc(x.q?x.q.e.title:(x.r.exam_name||''))}</td><td>${esc(x.q?(x.q.sec?x.q.sec.name:x.q.secPlan||'—'):(x.r.section_name||''))}</td><td>${x.q?x.q.rec.type:''}</td><td style="white-space:normal;min-width:220px">${esc(String(x.r.question||'').slice(0,100))}</td><td style="white-space:normal;min-width:240px;color:${bad?'var(--danger)':'var(--muted)'}">${esc(bad?x.errs.join(' '):dup?x.dupWhy:'')}</td></tr>`}).join('')}</tbody></table></div>${imp.res.items.length>300?`<p style="color:var(--muted)">Showing the first 300 of ${imp.res.items.length} rows. All rows are processed on import.</p>`:''}`:''}
  <h3 style="margin-top:22px">Import history</h3><div class="tw"><table class="t"><thead><tr><th>When</th><th>By</th><th>File</th><th>Rows</th><th>Imported</th><th>Duplicates skipped</th><th>Failed</th></tr></thead><tbody>${S().imports.map(h=>`<tr style="cursor:default"><td>${A.dt(h.at)}</td><td>${esc(h.by)}</td><td>${esc(h.file)}</td><td>${h.total}</td><td><b>${h.ok}</b></td><td>${h.dup}</td><td>${h.bad}</td></tr>`).join('')||'<tr><td colspan="7" style="color:var(--muted);text-align:center;padding:20px">No imports yet.</td></tr>'}</tbody></table></div>`};
async function readFile(f){
  imp.name=f.name;let rows;
  if(/\.(xlsx|xls)$/i.test(f.name)){const XL=await X.xlsx(),wb=XL.read(await f.arrayBuffer(),{type:'array'});rows=XL.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1,defval:'',raw:false})}
  else rows=X.parseCSV(await f.text());
  if(!rows.length||rows.length<2){A.toast('The file has no data rows.','warn');return}
  imp.headers=rows[0].map(h=>String(h).trim());const hs=imp.headers.map(hn);
  if(!hs.includes('question')||!hs.includes('correct_answer')){A.toast('Required columns missing: question and correct_answer. Download the template for the layout.','warn');imp.raw=[];imp.res=null;A.render();return}
  imp.rowsRaw=rows.slice(1);imp.raw=imp.rowsRaw.map(r=>{const o={};hs.forEach((h,i)=>{if(!(h in o)||o[h]==='')o[h]=String(r[i]??'').trim()});return o});
  imp.last=null;validate();A.render();A.toast(`Read ${imp.raw.length} rows. Review the preview below.`)}
document.addEventListener('change',e=>{const el=e.target;if(!el.id||!el.id.startsWith('imp-'))return;
  if(el.id==='imp-file'&&el.files[0]){readFile(el.files[0]).catch(err=>A.toast('Could not read the file: '+err.message,'warn'));return}
  if(el.id==='imp-exam'){imp.o.exam=el.value;imp.o.sec=''}if(el.id==='imp-sec')imp.o.sec=el.value;if(el.id==='imp-create')imp.o.create=el.checked;if(el.id==='imp-dup')imp.o.dup=el.checked;
  if(imp.raw.length)validate();A.render()});
Object.assign(X.actions,{'imp-tpl':()=>X.save('question-import-template.csv',X.toCSV(TEMPLATE)),'imp-reset':()=>{imp.raw=[];imp.res=null;imp.name='';A.render()},
 'imp-err':()=>{const st=impStat(),bad=st.bad.concat(st.dup),data=[['row_number','result','reason'].concat(imp.headers)].concat(bad.map(x=>[x.n,x.errs.length?'Error':'Duplicate skipped',x.errs.length?x.errs.join(' '):x.dupWhy].concat((imp.rowsRaw[x.n-2]||[]).map(String))));X.save('question-import-error-report.csv',X.toCSV(data));A.log(`Downloaded import error report (${bad.length} rows)`,'Bulk Question Import')},
 'imp-go':()=>{if(!need('import','add'))return;const st=impStat();if(!st.ok.length)return;
   X.confirm('Import questions?',`${st.ok.length} question${st.ok.length>1?'s':''} will be added. ${st.bad.length} row${st.bad.length===1?'':'s'} with errors and ${st.dup.length} duplicate${st.dup.length===1?'':'s'} will be skipped.`,()=>{
    const d=DB.load();let created={e:0,s:0};
    let cat=d.cats.find(c=>c.name==='Other');
    const realEx={};
    st.ok.forEach(x=>{let e=x.q.e;if(e.isNew){if(!realEx[e.id]){if(!cat){cat={id:d.cats.reduce((m,c)=>Math.max(m,c.id),0)+1,name:'Other',slug:'other',order:99,active:true};d.cats.push(cat)}
        const ne={id:d.exams.reduce((m,x)=>Math.max(m,x.id),0)+1,slug:norm(e.title).replace(/ /g,'-'),title:e.title,categoryId:cat.id,description:'',logo:'',difficulty:'Moderate',free:true,published:false,archived:false,deleted:false,duration:60,totalMarks:0,passMarks:0,examDate:'',eligibility:'',info:'',visibility:'public',attemptLimit:0,allowResume:true,sectionTimers:false,showSolutions:'after',defaultMarks:1,defaultNeg:0,instructions:[],sections:[],createdAt:new Date().toISOString(),createdBy:'import'};
        d.exams.push(ne);realEx[e.id]=ne;created.e++}e=realEx[e.id]}
      let sid=0;if(x.q.sec)sid=x.q.sec.id;else if(x.q.secPlan){let s=(e.sections||[]).find(s=>norm(s.name)===norm(x.q.secPlan));if(!s){s={id:(e.sections||[]).reduce((m,s)=>Math.max(m,s.id),0)+1,name:x.q.secPlan,description:'',order:(e.sections||[]).length+1,minutes:0,questions:0,enabled:true};(e.sections=e.sections||[]).push(s);created.s++}sid=s.id}
      x.final={examId:e.id,sectionId:sid}});
    let nid=d.questions.reduce((m,q)=>Math.max(m,q.id),0);const now=new Date().toISOString(),batch='IMP'+Date.now().toString(36);
    st.ok.forEach(x=>d.questions.push(Object.assign({id:++nid,createdAt:now,importBatch:batch},x.q.rec,x.final)));
    if(!DB.save())return;
    S().imports.unshift({at:now,by:A.me().name,file:imp.name,total:st.total,ok:st.ok.length,dup:st.dup.length,bad:st.bad.length});A.save();
    A.log(`Imported ${st.ok.length} questions from ${imp.name}`,'Bulk Question Import','',`${created.e} exams, ${created.s} sections created`);
    const bad=st.bad.length+st.dup.length,msg=`Imported ${st.ok.length} question${st.ok.length>1?'s':''}${created.e||created.s?` (created ${created.e} exam${created.e===1?'':'s'}, ${created.s} section${created.s===1?'':'s'})`:''}.${bad?` ${bad} row${bad>1?'s were':' was'} skipped; download the error report.`:''}`;
    imp.last=bad?{ok:st.ok.length,bad:bad,report:[['row_number','result','reason'].concat(imp.headers)].concat(st.bad.concat(st.dup).map(x=>[x.n,x.errs.length?'Error':'Duplicate skipped',x.errs.length?x.errs.join(' '):x.dupWhy].concat((imp.rowsRaw[x.n-2]||[]).map(String))))}:{ok:st.ok.length,bad:0};
    imp.raw=[];imp.res=null;imp.name='';A.toast(msg);A.render()},'Import')},
 'imp-err2':()=>{if(imp.last&&imp.last.report){X.save('question-import-error-report.csv',X.toCSV(imp.last.report));A.log('Downloaded import error report','Bulk Question Import')}}});
})();
