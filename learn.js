/* Learning modules: Daily Quiz (auto-generated from the existing question bank), Performance Analyzer, Flashcards.
   Everything here is the browser stand-in for Laravel services: HS.dq.run() = `php artisan schedule:run` (Hostinger cron, every minute),
   HS.perf = SQL aggregates / queued jobs, HS.fc = flashcard tables. Questions are NEVER copied: a quiz stores only question ids. */
(function(){
const DB=()=>HS.db,esc=HS.esc;
const get=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}};
const set=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
const me=()=>HS.api&&HS.api.me?HS.api.me():null;
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const allAtt=()=>get('hs_attempts',[]);

/* ======================= timezone helpers ======================= */
const dateKey=(ms,tz)=>new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(ms);
const hmKey=(ms,tz)=>{const p=new Intl.DateTimeFormat('en-GB',{timeZone:tz,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(ms);return p.find(x=>x.type==='hour').value+':'+p.find(x=>x.type==='minute').value};

/* ======================= DAILY QUIZ ======================= */
const SK='hs_dq_settings',DEF={enabled:true,tz:'Asia/Kolkata',genTime:'22:00',publishTime:'06:00',count:5,minutesPerQ:1,diff:{Easy:30,Medium:50,Hard:20},retakes:0,exams:{}};
const dk=q=>q.diff==='Hard'?'Hard':(q.diff==='Moderate'||q.diff==='Medium')?'Medium':'Easy';
function settings(){
  let s=get(SK,null);
  if(!s){s=JSON.parse(JSON.stringify(DEF));DB().publicExams().forEach(e=>{if(DB().questionsOf(e.id).length>=s.count)s.exams[e.id]={enabled:true}});set(SK,s)}
  s=Object.assign({},DEF,s);s.diff=Object.assign({},DEF.diff,s.diff||{});s.exams=s.exams||{};return s}
const saveSettings=s=>set(SK,s);

/* questions that may be used for an exam's daily quiz: active, not excluded, in an enabled section (or exam has no sections) */
function pool(exam){
  const secIds=new Set(DB().activeSections(exam).map(s=>s.id)),has=(exam.sections||[]).length>0;
  return DB().all('questions').filter(q=>q.examId===exam.id&&q.status==='active'&&!q.dailyExcluded&&(!has||secIds.has(q.sectionId)))}

function alloc(total,w,cap){   /* largest-remainder split of `total` by weights w, never above cap */
  const out=w.map(()=>0);cap=cap.map((c,i)=>w[i]>0?c:0);let left=total;
  for(let g=0;left>0&&g<60;g++){const idx=out.map((_,i)=>i).filter(i=>out[i]<cap[i]);if(!idx.length)break;
    const W=idx.reduce((a,i)=>a+w[i],0);let given=0;const fr=[];
    idx.forEach(i=>{const x=left*w[i]/W,f=Math.min(Math.floor(x),cap[i]-out[i]);out[i]+=f;given+=f;fr.push([i,x-Math.floor(x)])});
    left-=given;fr.sort((a,b)=>b[1]-a[1]);for(const [i] of fr){if(left<=0)break;if(out[i]<cap[i]){out[i]++;left--}}}
  return out}

function lastUsedMap(examId){const m={};DB().all('dailyq').filter(x=>x.examId===examId&&x.status!=='failed'&&x.status!=='skipped').forEach(x=>x.qids.forEach(id=>{if(!m[id]||m[id]<x.date)m[id]=x.date}));return m}

/* choose `k` questions from one slot (a section): difficulty quota first, fresh questions before ones used before, least-recently-used if the pool runs out */
function takeFrom(slot,k,diff,used){
  const grp={Easy:[],Medium:[],Hard:[]};slot.forEach(q=>grp[dk(q)].push(q));
  const W=[diff.Easy,diff.Medium,diff.Hard].map(Number),sum=W.reduce((a,b)=>a+b,0),w=sum>0?W:[1,1,1];
  const tgt=alloc(k,w,[grp.Easy.length,grp.Medium.length,grp.Hard.length]),chosen=[],ids=new Set();
  const add=q=>{if(!ids.has(q.id)){ids.add(q.id);chosen.push(q)}};
  ['Easy','Medium','Hard'].forEach((d,i)=>shuffle(grp[d].filter(q=>!used[q.id])).slice(0,tgt[i]).forEach(add));
  if(chosen.length<k)shuffle(slot.filter(q=>!used[q.id]&&!ids.has(q.id))).slice(0,k-chosen.length).forEach(add);
  if(chosen.length<k)shuffle(slot.filter(q=>used[q.id]&&!ids.has(q.id))).sort((a,b)=>(used[a.id]<used[b.id]?-1:used[a.id]>used[b.id]?1:0)).slice(0,k-chosen.length).forEach(add);
  return chosen}

function pick(exam,s,extraUsed){
  const cfg=s.exams[exam.id]||{},n=+cfg.count||+s.count,p=pool(exam);
  if(p.length<n)return {error:`Only ${p.length} eligible question${p.length===1?'':'s'} for ${exam.title}; ${n} needed.`};
  const used=Object.assign(lastUsedMap(exam.id),extraUsed||{});
  const secs=DB().activeSections(exam).filter(sec=>p.some(q=>q.sectionId===sec.id));
  let chosen;
  if(!secs.length)chosen=takeFrom(p,n,s.diff,used);
  else{
    const w=secs.map(sec=>{const v=cfg.secDist&&cfg.secDist[sec.id];return v===undefined||v===''?1:+v}),cap=secs.map(sec=>p.filter(q=>q.sectionId===sec.id).length),cnt=alloc(n,w,cap);
    chosen=[];secs.forEach((sec,i)=>{if(cnt[i])chosen.push(...takeFrom(p.filter(q=>q.sectionId===sec.id),cnt[i],s.diff,used))});
    if(chosen.length<n){const ids=new Set(chosen.map(q=>q.id));chosen.push(...takeFrom(p.filter(q=>!ids.has(q.id)),n-chosen.length,s.diff,used))}   // weights excluded too many sections: top up
  }
  if(chosen.length<n)return {error:`Could only select ${chosen.length} of ${n} questions for ${exam.title}.`};
  const dist={diff:{Easy:0,Medium:0,Hard:0},sec:{}};
  chosen.forEach(q=>{dist.diff[dk(q)]++;const nm=DB().secName(q.examId,q.sectionId);dist.sec[nm]=(dist.sec[nm]||0)+1});
  return {qids:chosen.map(q=>q.id),dist}}

function notify(key,kind,msg){const d=DB();if(d.all('notices').some(x=>x.key===key))return;d.add('notices',{key,kind,msg,read:false})}
const log=(a,detail)=>{try{const k='hs_dq_log',l=get(k,[]);l.push({at:new Date().toISOString(),action:a,detail:detail||''});set(k,l.slice(-200))}catch(e){}};

function makeQuiz(exam,date,s,by,now){
  const rec=DB().all('dailyq').find(x=>x.examId===exam.id&&x.date===date);   // unique (exam, date): duplicate-job protection
  if(rec&&rec.status!=='failed'&&rec.status!=='skipped')return {rec,existing:true};
  let r;try{r=pick(exam,s)}catch(e){r={error:'Generation error: '+e.message,crashed:true}}
  const base={date,examId:exam.id,by,generatedAt:new Date(now).toISOString(),tries:(rec?rec.tries:0)+1};
  if(r.error){const st=r.crashed?'failed':'skipped',row=Object.assign(base,{qids:[],count:0,status:st,note:r.error});
    if(rec)DB().update('dailyq',rec.id,row);else DB().add('dailyq',row);
    notify(`dq|${exam.id}|${date}|${st}`,st==='failed'?'error':'warn',`Daily Quiz for ${exam.title} on ${date} was ${st==='failed'?'not generated (error)':'skipped'}: ${r.error}`);log(st,exam.title+' '+date+': '+r.error);return {skipped:true,error:r.error}}
  const row=Object.assign(base,{qids:r.qids,count:r.qids.length,dist:r.dist,status:'scheduled',note:''});
  const out=rec?DB().update('dailyq',rec.id,row):DB().add('dailyq',row);log('generated',exam.title+' '+date+' ('+row.count+' questions, '+by+')');return {rec:out,created:true}}

/* The scheduler. Safe to call as often as you like. Laravel: Schedule::command('dailyquiz:run')->everyMinute()->withoutOverlapping() */
function run(nowMs){
  const now=nowMs||Date.now(),s=settings(),res={created:0,published:0,skipped:0,failed:0};
  if(!s.enabled)return res;
  const lk=get('hs_dq_lock',0);if(!nowMs&&Date.now()-lk<1500)return res;set('hs_dq_lock',Date.now());
  try{
    const today=dateKey(now,s.tz),tomorrow=dateKey(now+864e5,s.tz),hm=hmKey(now,s.tz),targets=[today];if(hm>=s.genTime)targets.push(tomorrow);
    DB().publicExams().filter(e=>(s.exams[e.id]||{}).enabled).forEach(e=>targets.forEach(d=>{
      const ex=DB().all('dailyq').find(x=>x.examId===e.id&&x.date===d);
      if(ex){   // never generate twice for the same exam and date; only retry a skipped quiz once more questions exist, or a failed one (max 3 tries)
        if(ex.status==='skipped'){if(pool(e).length<(+(s.exams[e.id]||{}).count||+s.count))return}
        else if(ex.status==='failed'){if(ex.tries>=3)return}
        else return}
      const r=makeQuiz(e,d,s,'auto',now);if(r.created)res.created++;else if(r.skipped)res[(DB().all('dailyq').find(x=>x.examId===e.id&&x.date===d)||{}).status==='failed'?'failed':'skipped']++}));
    DB().all('dailyq').filter(x=>x.status==='scheduled').forEach(x=>{
      if(today>x.date||(today===x.date&&hm>=s.publishTime)){DB().update('dailyq',x.id,{status:'published',publishedAt:new Date(now).toISOString()});res.published++;log('published',DB().examName(x.examId)+' '+x.date)}});
  }finally{set('hs_dq_lock',0)}
  return res}

const dq={
  settings,saveSettings,run,pool,dk,dateKey,hmKey,log,logs:()=>get('hs_dq_log',[]),
  today(){return dateKey(Date.now(),settings().tz)},
  /* admin: replace a quiz's questions. Refused when students already attempted it; attempts are never deleted. */
  /* admin: generate (or retry) one quiz now. Duplicate-safe: an existing non-failed quiz for (exam, date) is never replaced here. */
  generate(examId,date,by){const e=DB().get('exams',examId);if(!e)return {ok:false,error:'Examination not found.'};
    const rec=DB().all('dailyq').find(x=>x.examId===examId&&x.date===date);if(rec&&rec.status!=='failed'&&rec.status!=='skipped')return {ok:false,error:'A quiz already exists for this exam and date.'};
    const r=makeQuiz(e,date,settings(),by||'admin',Date.now());if(r.error)return {ok:false,error:r.error};run();return {ok:true,rec:r.rec}},
  publishNow(id){const x=DB().get('dailyq',id);if(!x||x.status!=='scheduled')return false;DB().update('dailyq',id,{status:'published',publishedAt:new Date().toISOString()});log('published (manual)',DB().examName(x.examId)+' '+x.date);return true},
  notices(){return DB().all('notices')},
  attemptsOf(quizId){return allAtt().filter(a=>a.kind==='daily'&&a.dailyId===quizId)},
  regenerate(id){
    const x=DB().get('dailyq',id);if(!x)return {ok:false,error:'Quiz not found.'};
    if(dq.attemptsOf(id).length)return {ok:false,error:'Students have already attempted this quiz, so it cannot be regenerated. Attempts are never deleted.'};
    const e=DB().get('exams',x.examId),s=settings();if(!e)return {ok:false,error:'Exam not found.'};
    const prev={};x.qids.forEach(q=>prev[q]=x.date);          // treat the current set as "just used" so the replacement differs where possible
    const r=pick(e,s,prev);if(r.error)return {ok:false,error:r.error};
    DB().update('dailyq',id,{qids:r.qids,count:r.qids.length,dist:r.dist,regen:(x.regen||0)+1,regeneratedAt:new Date().toISOString(),status:x.status==='skipped'||x.status==='failed'?'scheduled':x.status,note:''});log('regenerated',e.title+' '+x.date);return {ok:true}},
  /* students: the newest date that has a published quiz, one per exam */
  latest(){const t=dq.today(),pub=DB().all('dailyq').filter(x=>x.status==='published'&&x.date<=t&&DB().isPublic(DB().get('exams',x.examId)));
    if(!pub.length)return [];const d=pub.map(x=>x.date).sort().pop();return pub.filter(x=>x.date===d).sort((a,b)=>a.examId-b.examId)},
  minutes(q){return Math.max(1,Math.round(q.qids.length*settings().minutesPerQ))},
  mine(quizId){const u=me();return u?allAtt().filter(a=>a.kind==='daily'&&a.dailyId===quizId&&a.studentId===u.studentId):[]},
  /* the one scored attempt = the student's first submitted attempt; retakes never change ranking or streak */
  scored(quizId){const by={};allAtt().filter(a=>a.kind==='daily'&&a.dailyId===quizId&&a.status==='submitted'&&a.result&&!a.retake).sort((a,b)=>a.submittedAt-b.submittedAt).forEach(a=>{if(!by[a.studentId])by[a.studentId]=a});return Object.values(by)},
  leaderboard(quizId){const users=get('hs_users',[]),me_=me(),rows=dq.scored(quizId).sort((a,b)=>b.result.marks-a.result.marks||a.result.timeTakenSec-b.result.timeTakenSec);
    let rank=0,prev=null;return rows.map((a,i)=>{const key=a.result.marks+'|'+a.result.timeTakenSec;if(key!==prev){rank=i+1;prev=key}
      const u=users.find(x=>x.studentId===a.studentId),nm=u?(u.name.split(' ')[0]+(u.name.split(' ')[1]?' '+u.name.split(' ')[1][0]+'.':'')):'Student';
      return {rank,name:nm,mine:!!me_&&a.studentId===me_.studentId,marks:a.result.marks,max:a.result.max,pct:a.result.percentage,time:a.result.timeTakenSec,studentId:a.studentId}})},
  streak(studentId){const s=settings(),u=studentId||(me()||{}).studentId;if(!u)return {current:0,longest:0};
    const days=new Set(allAtt().filter(a=>a.kind==='daily'&&a.studentId===u&&a.status==='submitted'&&a.submittedAt).map(a=>dateKey(a.submittedAt,s.tz))),sorted=[...days].sort();
    let longest=0,run_=0,prev=null;sorted.forEach(d=>{run_=prev&&(+new Date(d)-+new Date(prev))===864e5?run_+1:1;longest=Math.max(longest,run_);prev=d});
    const t=dq.today(),y=dateKey(Date.now()-864e5,s.tz);let cur=0,d=days.has(t)?t:days.has(y)?y:null;
    while(d&&days.has(d)){cur++;d=dateKey(+new Date(d+'T12:00:00Z')-864e5,'UTC')}
    return {current:cur,longest,doneToday:days.has(t)}},
  achievements(studentId){const u=studentId||(me()||{}).studentId;if(!u)return [];
    const at=allAtt().filter(a=>a.studentId===u&&a.status==='submitted'&&a.result),dqs=at.filter(a=>a.kind==='daily'),st=dq.streak(u),fc=fcStats(u);
    return [['First Daily Quiz completed',dqs.length>=1],['10 Daily Quizzes completed',dqs.length>=10],['3-day streak',st.longest>=3],['7-day streak',st.longest>=7],['Perfect score in a Daily Quiz',dqs.some(a=>a.result.percentage>=100)],
      ['First mock test completed',at.some(a=>a.kind!=='daily')],['100 flashcards reviewed',fc.reviews>=100],['Completed a flashcard deck',fc.decksDone>=1]].map(x=>({label:x[0],earned:x[1]}))}
};

/* ======================= FLASHCARDS ======================= */
const PK='hs_fcprog',HK='hs_fchist',DAYS=[0,1,3,7,14,30],now_=()=>Date.now();
const prog=()=>get(PK,[]);
function pOf(sid,cardId){return prog().find(p=>p.studentId===sid&&p.cardId===cardId)||{studentId:sid,cardId,state:'new',box:0,due:0,reviews:0,wrong:0,bookmark:false,note:'',last:0}}
function putP(p){const l=prog(),i=l.findIndex(x=>x.studentId===p.studentId&&x.cardId===p.cardId);if(i>=0)l[i]=p;else l.push(p);set(PK,l)}
function visibleDecks(sid){return DB().all('decks').filter(d=>(d.owner==='admin'&&d.published)||(d.visibility==='public'&&d.published)||(sid&&d.owner===sid))}
function deckCards(id){return DB().all('cards').filter(c=>c.deckId===id)}
function deckStats(sid,deckId){const cs=deckCards(deckId),ps=cs.map(c=>pOf(sid,c.id));
  const reviewed=ps.filter(p=>p.reviews>0).length,known=ps.filter(p=>p.state==='known').length,revise=ps.filter(p=>p.state==='revise').length;
  return {total:cs.length,reviewed,known,revise,pending:ps.filter(p=>p.reviews>0&&(p.state==='revise'||p.due<=now_())).length,pct:cs.length?Math.round(reviewed/cs.length*100):0}}
function fcStats(sid){const hist=get(HK,[]).filter(h=>h.studentId===sid),decks=visibleDecks(sid);
  return {reviews:hist.length,decksDone:decks.filter(d=>{const s=deckStats(sid,d.id);return s.total>0&&s.reviewed===s.total}).length,
    pending:decks.reduce((n,d)=>n+deckStats(sid,d.id).pending,0)}}
const fc={
  visibleDecks,deckCards,deckStats,stats:fcStats,progress:pOf,
  /* study queue. smart = difficult/revise first, then new cards, then due known cards; known cards that are not due yet are held back */
  queue(sid,deckId,mode){const cs=deckCards(deckId);let l;
    if(mode==='bookmarks')l=cs.filter(c=>pOf(sid,c.id).bookmark);
    else if(mode==='revise')l=cs.filter(c=>pOf(sid,c.id).state==='revise');
    else if(mode==='all')l=shuffle(cs);
    else{const rank=c=>{const p=pOf(sid,c.id);if(p.state==='revise')return 0-Math.min(p.wrong,5)/10;if(p.state==='new')return 1;return p.due<=now_()?2:9};
      l=cs.filter(c=>rank(c)<9).sort((a,b)=>rank(a)-rank(b))}
    return l},
  scheduledLater(sid,deckId){return deckCards(deckId).filter(c=>{const p=pOf(sid,c.id);return p.state==='known'&&p.due>now_()}).length},
  mark(sid,card,result){const p=pOf(sid,card.id);p.reviews++;p.last=now_();
    if(result==='known'){p.state='known';p.box=Math.min(p.box+1,5);p.due=now_()+DAYS[p.box]*864e5}
    else{p.state='revise';p.box=0;p.wrong++;p.due=now_()+10*60000}
    putP(p);const h=get(HK,[]);h.push({studentId:sid,cardId:card.id,deckId:card.deckId,r:result,at:new Date().toISOString()});set(HK,h.slice(-6000));
    const d=DB().get('decks',card.deckId);HS.act('flashcard_reviewed',{examId:d?d.examId:0,subject:d?d.subject:'',topic:d?d.topic:'',tool:'flashcards',deckId:card.deckId});
    const st=deckStats(sid,card.deckId),fk='hs_fcdone_'+sid+'_'+card.deckId;if(st.total&&st.reviewed===st.total&&!get(fk,false)){set(fk,true);HS.act('flashcard_deck_completed',{examId:d?d.examId:0,tool:'flashcards',deckId:card.deckId})}
    return p},
  toggleBookmark(sid,cardId){const p=pOf(sid,cardId);p.bookmark=!p.bookmark;putP(p);return p.bookmark},
  saveNote(sid,cardId,t){const p=pOf(sid,cardId);p.note=String(t||'').slice(0,1000);putP(p)},
  /* student-owned decks: private by default; only the owner can change them; going public needs admin approval */
  createDeck(sid,o){return DB().add('decks',{title:o.title,examId:+o.examId||0,sectionId:0,subject:o.subject||'',topic:o.topic||'',description:o.description||'',published:false,visibility:'private',owner:sid,sample:false})},
  canEdit(sid,d){return !!d&&d.owner===sid&&d.visibility!=='public'&&d.visibility!=='pending'},   // approved public decks are no longer editable by the student
  
  addCard(sid,deckId,o){const d=DB().get('decks',deckId);if(!fc.canEdit(sid,d))return null;return DB().add('cards',{deckId,front:String(o.front).slice(0,500),back:String(o.back).slice(0,1000),expl:o.expl||'',img:'',subject:d.subject,topic:d.topic})},
  parseLines(text){return String(text||'').split(/\r?\n/).map(l=>l.split('::')).filter(p=>p.length>=2&&p[0].trim()&&p.slice(1).join('::').trim()).map(p=>({front:p[0].trim(),back:p.slice(1).join('::').trim()}))},
  submitForApproval(sid,deckId){const d=DB().get('decks',deckId);if(!fc.canEdit(sid,d)||!deckCards(deckId).length)return false;DB().update('decks',deckId,{visibility:'pending',submittedAt:new Date().toISOString()});return true},
  usage(deckId){const h=get(HK,[]).filter(x=>x.deckId===deckId),st=new Set(h.map(x=>x.studentId)),total=deckCards(deckId).length;
    const done=[...st].filter(s=>deckStats(s,deckId).reviewed===total&&total>0).length;return {users:st.size,reviews:h.length,completed:done}}
};

/* ======================= PERFORMANCE ======================= */
const judge=(q,r)=>HS.api.judge(q,r),r2=n=>Math.round(n*100)/100;
const label=(acc,att,min)=>att<min?'Not enough data':acc>=75?'Strong':acc>=50?'Average':'Needs Improvement';
const LCLS={'Strong':'g','Average':'y','Needs Improvement':'r','Not enough data':''};
function analyze(list){
  const done=list.filter(a=>a.status==='submitted'&&a.result).sort((a,b)=>(a.submittedAt||0)-(b.submittedAt||0)),subj={},topic={};
  done.forEach(at=>at.qids.forEach(id=>{const q=DB().get('questions',id);if(!q)return;const j=judge(q,at.answers[id]),sk=q.subject||'Unclassified',tk=sk+'|'+(q.topic||'General');
    [[subj,sk,{name:sk}],[topic,tk,{subject:sk,topic:q.topic||'General'}]].forEach(([m,k,base])=>{const o=m[k]||(m[k]=Object.assign({presented:0,attempted:0,correct:0,wrong:0,marks:0,max:0,examIds:new Set()},base));
      o.presented++;o.max+=q.marks;o.examIds.add(q.examId);if(j!=='skipped'){o.attempted++;if(j==='correct'){o.correct++;o.marks+=q.marks}else{o.wrong++;o.marks+=q.neg}}})}));
  const fin=(o,min)=>{o.accuracy=o.attempted?r2(o.correct/o.attempted*100):0;o.scorePct=o.max?r2(Math.max(o.marks,0)/o.max*100):0;o.label=label(o.accuracy,o.attempted,min);o.examIds=[...o.examIds];return o};
  const subjects=Object.values(subj).map(o=>fin(o,5)).sort((a,b)=>a.accuracy-b.accuracy),topics=Object.values(topic).map(o=>fin(o,3)).sort((a,b)=>a.accuracy-b.accuracy);
  const cnt={};const attempts=done.map(a=>{const key=a.kind+'|'+a.examId;cnt[key]=(cnt[key]||0)+1;return {id:a.id,kind:a.kind||'exam',examId:a.examId,title:a.title||DB().examName(a.examId),no:cnt[key],date:a.submittedAt,marks:a.result.marks,max:a.result.max,pct:a.result.percentage,acc:a.result.accuracy,time:a.result.timeTakenSec,sections:a.result.sections||[],key}});
  const last={};attempts.forEach(x=>{x.delta=last[x.key]===undefined?null:r2(x.pct-last[x.key]);last[x.key]=x.pct});
  const pcts=done.map(a=>a.result.percentage),sum=k=>done.reduce((n,a)=>n+(a.result[k]||0),0),att=sum('attempted'),cor=sum('correct');
  let imp=null;if(pcts.length>=2){const h=Math.floor(pcts.length/2),avg=a=>a.reduce((x,y)=>x+y,0)/a.length;imp=r2(avg(pcts.slice(h))-avg(pcts.slice(0,h)))}
  const best=done.slice().sort((a,b)=>b.result.percentage-a.result.percentage)[0],worst=done.slice().sort((a,b)=>a.result.percentage-b.result.percentage)[0];
  return {n:done.length,exams:done.filter(a=>a.kind!=='daily').length,quizzes:done.filter(a=>a.kind==='daily').length,avg:pcts.length?r2(pcts.reduce((x,y)=>x+y,0)/pcts.length):0,
    highest:best?{pct:best.result.percentage,marks:best.result.marks,max:best.result.max}:null,lowest:worst?{pct:worst.result.percentage,marks:worst.result.marks,max:worst.result.max}:null,
    accuracy:att?r2(cor/att*100):0,correct:cor,wrong:sum('wrong'),attempted:att,studySec:sum('timeTakenSec'),improvement:imp,subjects,topics,attempts,trend:attempts.map(x=>({label:new Date(x.date).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}),pct:x.pct,title:x.title}))}}
const perf={
  analyze,label,LCLS,mine(){const u=me();return analyze(u?allAtt().filter(a=>a.studentId===u.studentId):[])},
  /* anonymised comparison: only offered when at least 10 different students attempted the exam */
  cohort(examId){const by={};allAtt().filter(a=>a.examId===examId&&a.kind!=='daily'&&a.status==='submitted'&&a.result).forEach(a=>{(by[a.studentId]=by[a.studentId]||[]).push(a.result.percentage)});
    const ids=Object.keys(by);if(ids.length<10)return null;return {students:ids.length,avg:r2(ids.reduce((n,i)=>n+by[i].reduce((x,y)=>x+y,0)/by[i].length,0)/ids.length)}},
  /* rule-based advice: every sentence is built from the student's real numbers; nothing is invented */
  suggest(a){
    const out=[],mats=DB().all('materials').filter(m=>m.published),decks=fc.visibleDecks((me()||{}).studentId),norm=s=>String(s||'').toLowerCase();
    const weakS=a.subjects.filter(s=>s.label==='Needs Improvement'||(s.label==='Average'&&s.accuracy<65)).slice(0,3);
    weakS.forEach(s=>{const tops=a.topics.filter(t=>t.subject===s.name&&t.label!=='Not enough data'&&t.accuracy<s.accuracy-10).slice(0,2);
      const text=tops.length?`Your accuracy in ${s.name} is ${s.accuracy}%, but your ${tops.map(t=>`${t.topic} accuracy is ${t.accuracy}%`).join(' and ')}. We recommend practising more questions from ${tops.length>1?'these topics':'this topic'}.`:`Your accuracy in ${s.name} is ${s.accuracy}% (${s.correct} of ${s.attempted} attempted correct). Practise more ${s.name} questions.`;
      const eid=s.examIds[0],links=[];
      const m=mats.find(x=>norm(x.subject)===norm(s.name)||(eid&&x.examId===eid&&norm(x.subject).includes(norm(s.name).slice(0,4))));if(m)links.push({t:'Study material: '+m.title,h:'materials.html'});
      const d=decks.find(x=>norm(x.subject)===norm(s.name));if(d)links.push({t:'Flashcards: '+d.title,h:'flashcards.html?deck='+d.id});
      if(eid&&(settings().exams[eid]||{}).enabled)links.push({t:'Take today\'s Daily Quiz',h:'daily.html'});
      out.push({kind:'subject',text,links,subject:s.name})});
    const attemptedEx=new Set(a.attempts.filter(x=>x.kind!=='daily').map(x=>x.examId));
    const rec=DB().publicExams().filter(e=>DB().isLive(e)&&!attemptedEx.has(e.id)&&(a.attempts.length===0||a.attempts.some(x=>DB().get('exams',x.examId)&&DB().get('exams',x.examId).categoryId===e.categoryId))).slice(0,3);
    if(rec.length)out.push({kind:'mock',text:'Recommended mock tests you have not attempted yet:',links:rec.map(e=>({t:e.title,h:'instructions.html?e='+e.id}))});
    return out}
};

/* ======================= tiny chart helpers (accessible, no libraries) ======================= */
const charts={
  bars(items,o){o=o||{};return `<div class="hbars">${items.map(i=>`<div class="hbar"><span class="hl" title="${esc(i.label)}">${esc(i.label)}</span><div class="bar" role="img" aria-label="${esc(i.label)} ${i.value}${o.unit||'%'}"><i style="width:${Math.max(0,Math.min(100,i.value))}%;background:${i.color||'var(--brand)'}"></i></div><b>${i.value}${o.unit||'%'}</b></div>`).join('')}</div>`},
  donut(parts){const tot=parts.reduce((n,p)=>n+p.value,0);if(!tot)return '<p class="muted">No answered questions yet.</p>';let off=0;const R=42,C=2*Math.PI*R;
    return `<div class="donut"><svg viewBox="0 0 120 120" role="img" aria-label="${parts.map(p=>p.label+' '+p.value).join(', ')}">${parts.map(p=>{const len=p.value/tot*C,el=`<circle cx="60" cy="60" r="${R}" fill="none" stroke="${p.color}" stroke-width="18" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;off+=len;return el}).join('')}<text x="60" y="64" text-anchor="middle" font-size="15" font-weight="800" fill="var(--ink)">${Math.round(parts[0].value/tot*100)}%</text></svg>
      <ul>${parts.map(p=>`<li><i style="background:${p.color}"></i>${esc(p.label)} <b>${p.value}</b></li>`).join('')}</ul></div>`},
  line(pts){if(!pts.length)return '<p class="muted">Complete a test to see your trend.</p>';const W=560,H=190,pl=34,pb=26,pt=10,x=i=>pts.length===1?W/2:pl+i*(W-pl-14)/(pts.length-1),y=v=>pt+(H-pt-pb)*(1-v/100);
    return `<svg class="line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Percentage over time">${[0,50,100].map(g=>`<line x1="${pl}" x2="${W-8}" y1="${y(g)}" y2="${y(g)}" stroke="var(--line)"/><text x="4" y="${y(g)+4}" font-size="11" fill="var(--muted)">${g}%</text>`).join('')}
      <polyline fill="none" stroke="var(--brand)" stroke-width="2.5" points="${pts.map((p,i)=>x(i)+','+y(p.pct)).join(' ')}"/>${pts.map((p,i)=>`<circle cx="${x(i)}" cy="${y(p.pct)}" r="4.5" fill="var(--brand)"><title>${esc(p.title)}: ${p.pct}% (${esc(p.label)})</title></circle>`).join('')}
      ${pts.length<=8?pts.map((p,i)=>`<text x="${x(i)}" y="${H-6}" font-size="10" text-anchor="middle" fill="var(--muted)">${esc(p.label)}</text>`).join(''):''}</svg>`}
};

HS.dq=dq;HS.fc=fc;HS.perf=perf;HS.charts=charts;
HS.hms=s=>{s=Math.round(s||0);const h=Math.floor(s/3600),m=Math.floor(s%3600/60);return h?`${h}h ${m}m`:m?`${m}m ${s%60}s`:`${s}s`};
try{dq.run()}catch(e){console.warn('daily quiz scheduler',e)}   // stand-in cron: every page load that includes this file ticks the scheduler
})();
