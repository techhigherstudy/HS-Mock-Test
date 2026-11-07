/* Exam engine (UI). Timing source of truth = HS.api.clock (server clock in the backend phase). Works for any exam:
   sectional timers or one timer, with or without sections, MCQ / MSQ / numerical / true-false / text questions. */
(function(){
const {$,$$,esc}=HS,u=HS.api.me();
if(!u){location.replace('index.html');return}
const at0=HS.api.attemptById(new URLSearchParams(location.search).get('a'));
if(!at0){location.replace('dashboard.html');return}
if(at0.status==='submitted'){location.replace('result.html?a='+encodeURIComponent(at0.id));return}
const at=at0,E=HS.db.get('exams',at.examId)||{title:'Test',allowResume:false,category:''};
const paper=HS.api.paper(at),secs=at.secs.length?at.secs:[],last=Math.max(secs.length-1,0),sectional=at.timer==='section';
const isCat=HS.db.catName(E.categoryId)==='CAT',fmtN=n=>(Math.round(n*100)/100).toString();
document.title=E.title+' — higher.study';
let qi=0,tick=null,leaving=false,exitDest='';

const curSec=()=>sectional?at.secIdx:Math.min(at.lastSec||0,last);
const secQs=()=>secs.length?paper.filter(q=>q.sectionId===secs[curSec()].id):paper;
const hasAns=q=>HS.api.isAnswered(at.answers[q.id]);
const st=q=>{const a=hasAns(q),m=at.marked[q.id],v=at.visited[q.id];return a&&m?'ansmark':m?'mark':a?'ans':v?'na':''};
const save=()=>HS.api.saveState(at);
const persistPos=()=>{at.lastQ=at.lastQ||{};at.lastQ[curSec()]=qi;save()};
const secLabel=()=>secs.length?secs[curSec()].name:'';
const isLastQ=()=>qi===secQs().length-1, isLastSec=()=>!secs.length||curSec()===last;

/* ---- timing ---- */
function expired(){
  if(sectional){while(at.secIdx<last&&HS.api.clock.now()>=at.secEnds[at.secIdx]){HS.api.advance(at,at.secEnds[at.secIdx]);qi=0;movedFlag=true}
    return at.secIdx===last&&HS.api.clock.now()>=at.secEnds[last]}
  return HS.api.clock.now()>=at.endsAt;
}
let movedFlag=false;
function finish(auto){clearInterval(tick);leaving=true;HS.api.submit(at,auto);if(auto)HS.toast('Time is up. Your test was submitted.');setTimeout(()=>location.href='result.html?a='+encodeURIComponent(at.id),auto?900:100)}
const endTime=()=>sectional?at.secEnds[at.secIdx]:at.endsAt;

/* ---- shell ---- */
function shell(){
  $('#app').innerHTML=`
  <div class="ex-top"><div class="container row1" style="max-width:1500px">
    <div class="ex-brand"><div class="ex-logo"><img src="logo.svg" alt="higher.study"></div><div class="ex-title"><b>${esc(E.title)}</b><span>${esc(u.name)}</span></div></div>
    <div class="ex-links"><button class="ex-link" data-exit="index.html">Home</button><button class="ex-link" data-exit="dashboard.html">Dashboard</button><button class="ex-link" data-exit="dashboard.html">Exit</button></div>
    <div class="timer-box"><div><div class="lbl" id="tlabel"></div><div class="time" id="timer">00:00:00</div></div><button class="btn-submit" id="btn-submit-top">Submit Test</button></div>
  </div>
  <div class="ex-secbar" id="secbar-wrap"><div class="container" style="max-width:1500px" id="tabs"></div></div></div>
  <div class="ex-main"><div id="left"></div>
   <aside class="side"><div class="panel user"><div class="avatar">${HS.icons.user}</div><div><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div></div><div class="panel palette" id="pal"></div></aside></div>`;
  $('#btn-submit-top').onclick=openSubmit;
  if(secs.length<2&&!sectional)$('#secbar-wrap').style.display='none';
}
function renderTabs(){
  if(!secs.length)return;
  $('#tabs').innerHTML=`<span class="lab">SECTIONS</span>`+secs.map((s,i)=>{
    const c=sectional?(i<at.secIdx?'locked':i===at.secIdx?'active':'upcoming'):(i===curSec()?'active':'');
    return `<button class="sec-tab ${c}" data-i="${i}">${esc(s.name)}${sectional&&i<at.secIdx?HS.icons.lock:''}</button>`}).join('');
  $('#tlabel').textContent=(sectional?secs[at.secIdx].name+' ':'')+'TIME LEFT';
}
$('#app').addEventListener('click',e=>{
  const t=e.target.closest('.sec-tab');if(!t)return;const i=+t.dataset.i;
  if(sectional){if(i<at.secIdx)HS.toast('This section is closed.','warn');else if(i>at.secIdx)HS.toast('This section opens after you finish the current one.','warn')}
  else if(i!==curSec()){at.lastSec=i;qi=Math.min((at.lastQ&&at.lastQ[i])||0,secQs().length-1);save();renderTabs();renderQ()}
});

/* ---- question ---- */
const typeTag=q=>q.type==='NUM'?(isCat?'TITA':'Numerical'):q.type==='TF'?'True/False':q.type==='TEXT'?'Text':q.type;
function renderQ(){
  const qs=secQs(),q=qs[qi];if(!q){$('#left').innerHTML='<div class="panel qcard">No questions in this section.</div>';return}
  at.visited[q.id]=true;persistPos();const sel=at.answers[q.id];
  let opts='';
  if(q.type==='NUM'||q.type==='TEXT'){
    const num=q.type==='NUM';
    opts=`<div class="tita"><input id="tita" ${num?'inputmode="decimal"':''} autocomplete="off" placeholder="${num?'Type your answer':'Type your answer here'}" value="${esc(sel??'')}">
     ${num?`<div class="keypad">${[1,2,3,4,5,6,7,8,9,'.',0,'-'].map(k=>`<button type="button" data-k="${k}">${k}</button>`).join('')}<button type="button" class="wide" data-k="bk" style="grid-column:span 2">⌫ Backspace</button><button type="button" class="wide" data-k="clr">Clear</button></div>`:''}
     <button type="button" class="save" id="tita-save">Save answer</button></div>`;
  }else{
    const multi=q.type==='MSQ',arr=Array.isArray(sel)?sel:[];
    opts=(multi?'<div class="msq-hint">Select all that apply</div>':'')+q.options.map((o,i)=>{const on=multi?arr.includes(i):sel===i;
      return `<button class="opt ${on?'sel':''}${multi?' msq':''}" data-o="${i}"><span class="k">${multi?(on?'✓':' '):'ABCDEF'[i]}</span><span>${esc(o)}</span></button>`}).join('');
  }
  const final=isLastQ()&&isLastSec(),next=isLastQ()?(isLastSec()?'Submit Test':(sectional?'Next Section':'Save & Next')):'Save & Next';
  const neg=q.neg===0?'0':fmtN(q.neg);
  $('#left').innerHTML=`
   ${q.passage?`<div class="panel passage" id="passage">${q.passage}</div>`:''}
   <div class="panel qcard"><div class="qhead"><div class="qno"><b>Question ${qi+1}</b> of ${qs.length}${secs.length>1?` <span class="qsec">· ${esc(secLabel())}</span>`:''}</div>
     <div class="tags"><span class="tag m">Marks +${fmtN(q.marks)}</span><span class="tag n">Negative ${neg}</span><span class="tag t">${typeTag(q)}</span></div></div>
     <div class="qtext">${esc(q.q)}</div>${q.img?`<img class="qimg" src="${esc(q.img)}" alt="Question figure">`:''}${opts}</div>
   <div class="panel footbar"><div class="l"><button class="btn-pill review" id="b-mark">Mark for Review &amp; Next</button><button class="btn-pill" id="b-clear">Clear Response</button></div>
     <div class="r"><button class="btn-pill" id="b-prev" ${qi===0&&curSec()===0?'disabled':''}>Previous</button><button class="primary ${final?'final':''}" id="b-next">${next}</button></div></div>`;
  renderPal();
}
function renderPal(){
  const qs=secQs(),c={ans:0,na:0,nv:0,mk:0};
  qs.forEach(q=>{const s=st(q);if(s==='ans'||s==='ansmark')c.ans++;else if(s==='na')c.na++;else if(s==='')c.nv++;if(s==='mark'||s==='ansmark')c.mk++});
  $('#pal').innerHTML=`<div class="legend"><span><i style="background:var(--green)"></i>Answered (${c.ans})</span><span><i style="background:var(--danger)"></i>Not answered (${c.na})</span><span><i style="background:#e8e2de;border:1px solid #d6cdc7"></i>Not visited (${c.nv})</span><span><i style="background:var(--purple)"></i>Marked (${c.mk})</span></div>
   <div class="grid">${qs.map((q,i)=>`<button class="qb ${st(q)} ${i===qi?'cur':''}" data-i="${i}" aria-label="Question ${i+1}">${i+1}</button>`).join('')}</div>`;
}

/* ---- interactions ---- */
function go(i){qi=i;renderQ();window.scrollTo({top:0,behavior:'smooth'})}
function nextQ(){
  const n=secQs().length;
  if(qi<n-1){go(qi+1);return}
  if(!sectional&&secs.length&&curSec()<last){at.lastSec=curSec()+1;qi=0;save();renderTabs();renderQ();window.scrollTo(0,0);return}
  renderQ();
}
$('#app').addEventListener('click',e=>{
  const ex=e.target.closest('[data-exit]');if(ex){askExit(ex.dataset.exit||'dashboard.html');return}
  const qs=secQs(),q=qs[qi];if(!q)return;
  const o=e.target.closest('[data-o]');
  if(o){const i=+o.dataset.o;if(q.type==='MSQ'){const a=Array.isArray(at.answers[q.id])?at.answers[q.id].slice():[];const k=a.indexOf(i);k>=0?a.splice(k,1):a.push(i);if(a.length)at.answers[q.id]=a.sort();else delete at.answers[q.id]}else at.answers[q.id]=i;
    save();HS.track('question_answered');renderQ();return}
  const b=e.target.closest('.qb');if(b){go(+b.dataset.i);return}
  const k=e.target.closest('[data-k]');if(k){const inp=$('#tita'),v=k.dataset.k;if(v==='bk')inp.value=inp.value.slice(0,-1);else if(v==='clr')inp.value='';else inp.value+=v;titaSave(inp.value);return}
  if(e.target.id==='tita-save'){titaSave($('#tita').value);HS.toast('Answer saved.');return}
  if(e.target.id==='b-clear'){delete at.answers[q.id];save();renderQ();return}
  if(e.target.id==='b-mark'){at.marked[q.id]=true;save();nextQ();return}
  if(e.target.id==='b-prev'){
    if(qi>0)go(qi-1);else if(!sectional&&curSec()>0){at.lastSec=curSec()-1;const n=secQs().length;qi=n-1;save();renderTabs();renderQ()}return}
  if(e.target.id==='b-next'){
    at.marked[q.id]=false;save();
    if(qi<qs.length-1){go(qi+1);return}
    if(isLastSec())openSubmit();else if(sectional)openSection();else nextQ();return}
});
document.addEventListener('input',e=>{if(e.target.id==='tita')titaSave(e.target.value)});
function titaSave(v){const q=secQs()[qi];if(q.type==='NUM'){v=v.replace(/[^0-9.\-]/g,'');const el=$('#tita');if(el&&el.value!==v)el.value=v}
  if(v.trim()==='')delete at.answers[q.id];else at.answers[q.id]=v;save();renderPal()}

/* ---- modals ---- */
document.addEventListener('click',e=>{if(e.target.closest('[data-close]')||e.target.classList.contains('overlay')){['m-section','m-submit','m-exit'].forEach(HS.closeModal)}});
function openSection(){
  const un=secQs().filter(q=>!hasAns(q)).length,nxt=secs[at.secIdx+1].name;
  $('#m-section-txt').textContent=`You have ${un?`not completed this section. ${un} question${un>1?'s are':' is'} unanswered.`:'answered every question in this section.'} Do you still want to move to ${nxt}? You will not be able to return to this section once you leave.`;
  HS.openModal('m-section');
}
$('#m-section-go').onclick=()=>{HS.closeModal('m-section');HS.api.advance(at);qi=0;renderTabs();renderQ();window.scrollTo(0,0)};
function openSubmit(){
  const ans=paper.filter(hasAns).length,mk=paper.filter(q=>at.marked[q.id]).length;
  $('#m-sum').innerHTML=`<div><span>Total questions</span><b>${paper.length}</b></div><div><span>Answered</span><b>${ans}</b></div><div><span>Not answered</span><b>${paper.length-ans}</b></div><div><span>Marked for review</span><b>${mk}</b></div>`+(secs.length?'<hr>'+
    secs.map(s=>{const qs=paper.filter(q=>q.sectionId===s.id);return `<div><span>${esc(s.name)} — unanswered</span><b>${qs.filter(q=>!hasAns(q)).length}</b></div>`}).join(''):'');
  HS.openModal('m-submit');
}
$('#m-submit-go').onclick=()=>{HS.closeModal('m-submit');finish(false)};
function askExit(dest){
  exitDest=dest;
  $('#m-exit-txt').textContent=E.allowResume?'Your answers and progress are saved. You can resume this test from your dashboard until the timer ends.':'This test cannot be resumed. If you leave now, your saved answers will be submitted.';
  HS.openModal('m-exit');
}
$('#m-exit-go').onclick=()=>{leaving=true;save();
  if(!E.allowResume){HS.api.submit(at,false);location.href='result.html?a='+encodeURIComponent(at.id);return}
  location.href=exitDest||'dashboard.html'};

/* ---- timer ---- */
function loop(){
  if(expired()){finish(true);return}
  if(movedFlag){movedFlag=false;HS.toast('The previous section is closed.','warn');qi=0;renderTabs();renderQ()}
  const left=Math.ceil((endTime()-HS.api.clock.now())/1000),t=$('#timer');t.textContent=HS.fmt(left);t.classList.toggle('low',left<=300);
}
shell();
if(!expired()){
  qi=Math.min((at.lastQ&&at.lastQ[curSec()])||0,Math.max(secQs().length-1,0));
  renderTabs();renderQ();loop();tick=setInterval(loop,250);
  /* browser back must never silently leave or submit: ask first */
  try{history.pushState({ex:1},'',location.href);window.addEventListener('popstate',()=>{history.pushState({ex:1},'',location.href);askExit('dashboard.html')})}catch(e){}
  window.addEventListener('beforeunload',e=>{if(!leaving&&at.status!=='submitted'){e.preventDefault();e.returnValue=''}});
}else finish(true);
})();
