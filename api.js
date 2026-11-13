/* HS.api — mock backend on top of HS.db (browser storage). Each method names the Laravel endpoint it becomes. */
(function(){
const K={user:'hs_user',users:'hs_users',att:'hs_attempts'};
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const uid=p=>p+Date.now().toString(36).toUpperCase()+Math.floor(Math.random()*999);
const clock={offset:0,now(){return Date.now()+this.offset}};   // backend: server time; the browser clock is never trusted
const DB=()=>HS.db;

// Demo student for testing (prototype only)
(function(){const us=get(K.users,[]);if(!us.some(u=>u.email==='demo@higher.study')){us.push({studentId:'STU-DEMO',leadId:'LD-DEMO',name:'Demo Student',mobile:'9876543210',email:'demo@higher.study',pw:btoa('Demo@12345'),at:new Date().toISOString(),utm:{},attr:{}});set(K.users,us)}})();

const allAtt=()=>get(K.att,[]);
const saveAtt=a=>set(K.att,a);
function me(){return get(K.user,null)}
function myAttempts(){const u=me();return u?allAtt().filter(a=>a.studentId===u.studentId&&a.kind!=='daily'):[]}   // mock tests only
function myDaily(){const u=me();return u?allAtt().filter(a=>a.studentId===u.studentId&&a.kind==='daily'):[]}

/* ---------- scoring (per question type) ---------- */
const norm=s=>String(s??'').trim().toLowerCase();
function isAnswered(v){return v!==undefined&&v!==null&&v!==''&&!(Array.isArray(v)&&!v.length)}
function judge(q,r){
  if(!isAnswered(r))return 'skipped';
  switch(q.type){
    case 'MSQ':{const a=[...r].sort().join(','),c=[...(q.correct||[])].sort().join(',');return a===c?'correct':'wrong'}
    case 'NUM':{const x=parseFloat(r),y=parseFloat(q.correct);return (isFinite(x)&&isFinite(y)?Math.abs(x-y)<1e-6:norm(r)===norm(q.correct))?'correct':'wrong'}
    case 'TEXT':return norm(r)===norm(q.correct)?'correct':'wrong';
    default:return +r===+q.correct?'correct':'wrong';         // MCQ, TF
  }
}
function score(at){
  const e=DB().get('exams',at.examId),qs=at.qids.map(id=>DB().get('questions',id)).filter(Boolean);
  const secMap={};(at.secs.length?at.secs:[{id:0,name:'All questions'}]).forEach(s=>secMap[s.id]={id:s.name,key:s.id,name:s.name,total:0,attempted:0,correct:0,wrong:0,skipped:0,marks:0,max:0});
  const detail=[];
  qs.forEach(q=>{const s=secMap[q.sectionId]||secMap[Object.keys(secMap)[0]];s.total++;s.max+=q.marks;
    const j=judge(q,at.answers[q.id]);let m=0;
    if(j==='correct'){s.correct++;s.attempted++;m=q.marks}else if(j==='wrong'){s.wrong++;s.attempted++;m=q.neg}else s.skipped++;
    s.marks=Math.round((s.marks+m)*100)/100;detail.push({qid:q.id,status:j,marks:m})});
  const secs=Object.values(secMap);
  const t=secs.reduce((a,s)=>({attempted:a.attempted+s.attempted,correct:a.correct+s.correct,wrong:a.wrong+s.wrong,skipped:a.skipped+s.skipped,marks:a.marks+s.marks,max:a.max+s.max}),{attempted:0,correct:0,wrong:0,skipped:0,marks:0,max:0});
  t.marks=Math.round(t.marks*100)/100;
  const pct=t.max?+(Math.max(t.marks,0)/t.max*100).toFixed(2):0;
  const pass=at.kind!=='daily'&&e&&e.passMarks>0?t.marks>=e.passMarks:null;
  return {sections:secs,detail,...t,total:qs.length,percentage:pct,accuracy:t.attempted?+(t.correct/t.attempted*100).toFixed(1):0,
    timeTakenSec:Math.max(0,Math.round(((at.submittedAt||clock.now())-at.startedAt)/1000)),passed:pass};
}
const publicQ=q=>{const {correct,expl,...r}=q;return r};

HS.api={
  clock,me,
  /* GET /api/exams (published only) */ async exams(){await sleep(40);return DB().publicExams().map(decorate)},
  exam(id){const e=DB().get('exams',id);return e&&!e.deleted?decorate(e):null},
  /* GET /api/stats */ async stats(){const us=get(K.users,[]);return {exams:DB().publicExams().length,students:us.filter(u=>u.email!=='demo@higher.study').length,questions:DB().all('questions').filter(q=>q.status==='active').length,attempts:allAtt().length}},
  /* POST /api/register */ async register(p){
    await sleep(700);const users=get(K.users,[]);
    if(users.some(u=>u.mobile===p.mobile||u.email===p.email))throw {field:'email',message:'This mobile or email is already registered. Please log in.'};
    const a=HS.attr?HS.attr.snapshot():{};
    const u={studentId:uid('STU'),leadId:uid('LD'),name:p.name,mobile:p.mobile,email:p.email,pw:btoa(p.password),at:new Date().toISOString(),examId:p.examId||0,
      utm:HS.attr?HS.attr.utm(a.last):{},attr:{first:a.first||{},last:a.last||{},landing:a.landing||location.href,referrer:a.referrer||document.referrer||'',device:a.device,browser:a.browser,examId:p.examId||0}};
    users.push(u);set(K.users,users);set(K.user,u);try{HS.act&&HS.act.link(u)}catch(e){}HS.track('registration_completed',{exam:p.examId?DB().examName(p.examId):''});
    try{HS.ads&&HS.ads.conversion(u)}catch(e){}
    return u},
  /* POST /api/login */ async login(p){await sleep(500);const u=get(K.users,[]).find(x=>(x.email===p.id||x.mobile===p.id)&&x.pw===btoa(p.password));
    if(!u)throw {field:'password',message:'Incorrect details. Please try again.'};if(u.blocked)throw {field:'password',message:'This account is blocked. Contact support.'};set(K.user,u);return u},
  logout(){try{localStorage.removeItem(K.user)}catch(e){}},

  /* ---------- attempts ---------- */
  attempts:myAttempts,dailyAttempts:myDaily,
  /* POST /api/daily-quizzes/:id/attempts  (server picks the option order and keeps the mapping) */
  startDaily(quiz){
    const u=me();if(!u)return {ok:false,error:'login'};
    const mine=allAtt().filter(a=>a.studentId===u.studentId&&a.kind==='daily'&&a.dailyId===quiz.id),open=mine.find(a=>a.status==='in_progress');
    if(open)return {ok:true,attempt:open,resumed:true};
    const S=HS.dq.settings(),done=mine.filter(a=>a.status==='submitted').length;
    if(done>0&&done>S.retakes)return {ok:false,error:'limit'};
    const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
    const n=clock.now(),qids=shuffle(quiz.qids),perm={};
    qids.forEach(id=>{const q=DB().get('questions',id);if(q&&(q.type==='MCQ'||q.type==='MSQ'))perm[id]=shuffle(q.options.map((_,i)=>i))});
    const minutes=Math.max(1,Math.round(quiz.qids.length*S.minutesPerQ));
    const at={id:uid('DQA'),kind:'daily',dailyId:quiz.id,retake:done>0,title:'Daily Quiz · '+DB().examName(quiz.examId)+' · '+quiz.date,examId:quiz.examId,studentId:u.studentId,leadId:u.leadId,startedAt:n,status:'in_progress',
      secs:[],qids,timer:'global',secIdx:0,secEnds:[],endsAt:n+minutes*60000,minutes,answers:{},visited:{},marked:{},lastQ:{},perm};
    const all=allAtt();all.push(at);saveAtt(all);HS.track('daily_quiz_started',{exam:DB().examName(quiz.examId)});try{HS.act('daily_quiz_started',{examId:quiz.examId,tool:'daily-quiz'})}catch(x){}
    return {ok:true,attempt:at}},
  attemptById(id){const u=me();const a=allAtt().find(x=>x.id===id);return a&&u&&a.studentId===u.studentId?a:null},
  /* what a student can do for an exam right now: start | resume | view | limit | soon */
  state(examId){
    const e=DB().get('exams',examId);if(!e||!DB().isPublic(e))return {kind:'hidden'};
    if(!DB().isLive(e))return {kind:'soon'};
    const mine=myAttempts().filter(a=>a.examId===e.id),open=mine.find(a=>a.status==='in_progress'),done=mine.filter(a=>a.status==='submitted');
    if(open)return e.allowResume?{kind:'resume',attempt:open}:{kind:'resume-blocked',attempt:open};
    if(e.attemptLimit>0&&mine.length>=e.attemptLimit)return {kind:'limit',attempt:done[done.length-1],used:mine.length,limit:e.attemptLimit};
    return {kind:'start',used:mine.length,limit:e.attemptLimit,last:done[done.length-1]};
  },
  /* POST /api/exams/:id/attempts */ start(examId){
    const u=me();if(!u)return {ok:false,error:'login'};
    const st=this.state(examId);
    if(st.kind==='resume')return {ok:true,attempt:st.attempt,resumed:true};
    if(st.kind!=='start')return {ok:false,error:st.kind};
    const e=DB().get('exams',examId),p=DB().buildPaper(e),n=clock.now(),sectional=e.sectionTimers&&p.secs.length>0&&p.secs.every(s=>s.minutes>0);
    const at={id:uid('ATT'),examId:e.id,studentId:u.studentId,leadId:u.leadId,startedAt:n,status:'in_progress',secs:p.secs,qids:p.qids,timer:sectional?'section':'global',
      secIdx:0,secEnds:sectional?[n+p.secs[0].minutes*60000]:[],endsAt:n+e.duration*60000,answers:{},visited:{},marked:{},lastQ:{}};
    const all=allAtt();all.push(at);saveAtt(all);HS.track('exam_started',{exam:e.title});return {ok:true,attempt:at};},
  paper(at){return at.qids.map(id=>DB().get('questions',id)).filter(Boolean).map(publicQ).map(q=>{const p=at.perm&&at.perm[q.id];return p?Object.assign({},q,{options:p.map(i=>q.options[i])}):q})},
  saveState(at){const all=allAtt(),i=all.findIndex(x=>x.id===at.id);if(i>=0){all[i]=at;saveAtt(all)}return at},
  advance(at,startAt){const n=startAt??clock.now();at.secIdx++;at.secEnds[at.secIdx]=n+at.secs[at.secIdx].minutes*60000;return this.saveState(at)},
  /* POST /api/attempts/:id/submit  (idempotent) */ submit(at,auto){
    if(at.status==='submitted')return at;
    const e=DB().get('exams',at.examId);
    if(at.kind==='daily'&&at.perm&&!at.converted){   // answers were given against shuffled options: map back to the original option numbers before scoring
      at.dispAnswers=JSON.parse(JSON.stringify(at.answers));
      Object.keys(at.answers).forEach(id=>{const p=at.perm[id],v=at.answers[id];if(p&&isAnswered(v))at.answers[id]=Array.isArray(v)?v.map(i=>p[i]).sort():p[v]});at.converted=true}
    at.status='submitted';at.auto=!!auto;
    at.submittedAt=Math.min(clock.now(),at.timer==='section'?at.secEnds[at.secs.length-1]||clock.now():at.endsAt);
    at.result=score(at);this.saveState(at);HS.track(at.kind==='daily'?'daily_quiz_completed':'exam_submitted',{exam:e?e.title:''});try{HS.act&&HS.act(at.kind==='daily'?'daily_quiz_completed':'exam_completed',{examId:at.examId,tool:at.kind==='daily'?'daily-quiz':'mock-test'})}catch(x){}
    try{HS.sheet&&HS.sheet.results(at,at.qids.map(id=>DB().get('questions',id)).filter(Boolean).filter(q=>isAnswered(at.answers[q.id])).map((q,i)=>{const r=at.answers[q.id],j=judge(q,r);
      return {question_no:at.qids.indexOf(q.id)+1,section:DB().secName(q.examId,q.sectionId),type:q.type,response:Array.isArray(r)?r.map(x=>'ABCDEF'[x]).join(','):(q.type==='MCQ'||q.type==='TF')?'ABCDEF'[r]:r,is_correct:j==='correct'?'Yes':'No',marks_awarded:j==='correct'?q.marks:q.neg}}))}catch(x){}
    return at},
  /* answer keys: only after submission (or never, if the exam hides solutions) */
  review(at){const e=DB().get('exams',at.examId);if(!at||at.status!=='submitted')return null;
    return {showSolutions:!e||e.showSolutions!=='never',questions:at.qids.map(id=>DB().get('questions',id)).filter(Boolean),detail:Object.fromEntries((at.result&&at.result.detail||[]).map(d=>[d.qid,d]))}},
  judge,isAnswered,
  /* student dashboard numbers */
  summary(){
    const at=myAttempts(),done=at.filter(a=>a.status==='submitted'),open=at.filter(a=>a.status==='in_progress');
    const passed=done.filter(a=>a.result&&a.result.passed===true).length,failed=done.filter(a=>a.result&&a.result.passed===false).length;
    const marks=done.reduce((n,a)=>n+a.result.marks,0),avg=done.length?done.reduce((n,a)=>n+a.result.percentage,0)/done.length:0;
    const best=done.slice().sort((a,b)=>b.result.percentage-a.result.percentage)[0];
    return {attempted:at.length,completed:done.length,inProgress:open.length,passed,failed,marks:Math.round(marks*100)/100,avg:+avg.toFixed(1),best:best?{exam:DB().examName(best.examId),pct:best.result.percentage}:null};
  },
  reset(){try{localStorage.removeItem(K.att)}catch(e){}}
};
function decorate(e){const live=DB().isLive(e);return Object.assign({},e,{available:live,totalQuestions:DB().buildPaper(e).qids.length,category:DB().catName(e.categoryId),
  attempts:e.attemptLimit||0})}
})();
