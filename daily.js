(function(){
const {$,esc}=HS,u=HS.api.me(),L='ABCDEF';
HS.header([['Home','index.html'],['Daily Quiz Challenge']]);HS.footer();
if(!u){
  $('#page').innerHTML=`<section class="dash-hero"><h1>Daily Quiz Challenge</h1><p>A fresh short quiz every day, picked from our mock-test question bank. Build a streak and see where you stand on the leaderboard.</p></section>
   <div class="card empty"><h3 style="margin:0 0 6px">Create a free account to take today's quiz</h3><p>It takes a minute. Your scores, streak and progress are saved to your account.</p><button class="btn btn-primary" id="go">Login / Register</button></div>`;
  $('#go').onclick=()=>HS.auth.open('register',{next:'daily.html'});HS.act('daily_quiz_viewed',{tool:'daily-quiz'});return}
HS.act('daily_quiz_viewed',{tool:'daily-quiz'});
const mm=s=>HS.hms(s),quizzes=HS.dq.latest(),st=HS.dq.streak(),dqS=HS.dq.settings();
const card=q=>{const e=HS.db.get('exams',q.examId),mine=HS.dq.mine(q.id),open=mine.find(a=>a.status==='in_progress'),done=mine.filter(a=>a.status==='submitted').sort((a,b)=>a.startedAt-b.startedAt),first=done[0];
  const canRetake=done.length>0&&done.length<=dqS.retakes&&!open;
  let act,stat;
  if(open){stat='<span class="chip y">In progress</span>';act=`<a class="btn btn-primary" href="exam.html?a=${encodeURIComponent(open.id)}">Resume quiz</a>`}
  else if(first){stat=`<span class="chip g">Completed · ${first.result.marks}/${first.result.max} (${first.result.percentage}%)</span>`;act=`<a class="btn btn-primary" href="result.html?a=${encodeURIComponent(first.id)}">View result</a>${canRetake?`<button class="btn btn-ghost" data-start="${q.id}">Practise again (not scored)</button>`:''}`}
  else{stat='<span class="chip b">Ready</span>';act=`<button class="btn btn-primary" data-start="${q.id}">Start quiz</button>`}
  return `<article class="card dq-card"><h3>${esc(e.title)}</h3><div class="meta"><span class="pill">${new Date(q.date+'T12:00:00').toLocaleDateString('en-IN',{weekday:'short',day:'2-digit',month:'short',year:'numeric'})}</span><span class="pill">${q.qids.length} questions</span><span class="pill">${HS.dq.minutes(q)} min</span></div><div>${stat}</div><div class="btnrow" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px">${act}</div></article>`};
const lbHtml=q=>{const rows=HS.dq.leaderboard(q.id);if(!rows.length)return '<p class="muted">No scored attempts yet. Be the first on the board.</p>';
  const top=rows.slice(0,10),me=rows.find(r=>r.mine),show=me&&!top.includes(me)?top.concat([me]):top;
  return `<div class="tbl-wrap"><table class="tbl lb"><thead><tr><th>Rank</th><th>Student</th><th>Score</th><th>%</th><th>Time</th></tr></thead><tbody>${show.map(r=>`<tr class="${r.mine?'me':''}"><td>${r.rank}</td><td>${esc(r.name)}${r.mine?' (you)':''}</td><td>${r.marks}/${r.max}</td><td>${r.pct}%</td><td>${mm(r.time)}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:13px;margin:8px 0 0">Ranked by score, then by time. Only each student's first attempt counts. Only first names and an initial are shown.</p>`};
const past=HS.dq.dailyAttempts?[]:[];
const hist=HS.api.dailyAttempts().filter(a=>a.status==='submitted'&&!a.retake).sort((a,b)=>b.submittedAt-a.submittedAt).slice(0,10);
$('#page').innerHTML=`
 <section class="dash-hero"><h1>Daily Quiz Challenge</h1><p>A fresh quiz every day, picked from the mock-test question bank. One scored attempt per quiz.</p></section>
 <div class="dash-kpis" style="grid-template-columns:repeat(4,1fr)">${[['Current streak',st.current+(st.current===1?' day':' days')],['Longest streak',st.longest+(st.longest===1?' day':' days')],['Today',st.doneToday?'Done':'Not done yet'],['Quizzes completed',hist.length&&HS.api.dailyAttempts().filter(a=>a.status==='submitted'&&!a.retake).length||0]].map(k=>`<div class="kpi card"><small>${k[0]}</small><b>${k[1]}</b></div>`).join('')}</div>
 <h2 class="sec-h">Latest quizzes</h2>
 ${quizzes.length?`<div class="dq-grid">${quizzes.map(card).join('')}</div>`:`<div class="card empty"><h3 style="margin:0 0 6px">No quiz is published yet</h3><p>Today's quiz appears automatically at ${esc(dqS.publishTime)} (${esc(dqS.tz)}). Meanwhile, try a full mock test.</p><a class="btn btn-primary" href="mocks.html">Browse mock tests</a></div>`}
 ${quizzes.length?`<h2 class="sec-h">Leaderboard</h2><div class="tabs-s" id="lbt">${quizzes.map((q,i)=>`<button data-q="${q.id}" class="${i?'':'on'}">${esc(HS.db.get('exams',q.examId).title)}</button>`).join('')}</div><div class="card panel-c" id="lb"></div>`:''}
 <h2 class="sec-h">Achievements</h2><div class="ach">${HS.dq.achievements().map(a=>`<span class="${a.earned?'on':''}">${a.earned?'✓ ':''}${esc(a.label)}</span>`).join('')}</div>
 ${hist.length?`<h2 class="sec-h">Your recent quizzes</h2><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Quiz</th><th>Date</th><th>Score</th><th></th></tr></thead><tbody>${hist.map(a=>`<tr><td>${esc(a.title)}</td><td>${new Date(a.submittedAt).toLocaleDateString()}</td><td>${a.result.marks}/${a.result.max} (${a.result.percentage}%)</td><td><a class="btn btn-ghost" href="result.html?a=${encodeURIComponent(a.id)}">View result</a></td></tr>`).join('')}</tbody></table></div>`:''}
 <div class="soft-cta"><p>Want to prepare for your next entrance exam? Get free guidance.</p><a class="btn btn-ghost" href="${esc(HS.counsellingUrl())}" target="_blank" rel="noopener" data-counsel="daily-quiz">Talk to a counsellor</a></div>`;
const showLb=id=>{const q=quizzes.find(x=>x.id===+id);if(!q)return;$('#lb').innerHTML=lbHtml(q);HS.act('leaderboard_viewed',{examId:q.examId,tool:'daily-quiz',quizId:q.id})};
if(quizzes.length){showLb(quizzes[0].id);$('#lbt').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;$$('#lbt button').forEach(x=>x.classList.toggle('on',x===b));showLb(b.dataset.q)})}
function $$(s){return[...document.querySelectorAll(s)]}
$('#page').addEventListener('click',e=>{const b=e.target.closest('[data-start]');if(!b)return;const q=HS.db.get('dailyq',b.dataset.start);b.disabled=true;
  const r=HS.api.startDaily(q);if(!r.ok){HS.toast(r.error==='limit'?'You have already used your scored attempt for this quiz.':'Could not start the quiz.','warn');b.disabled=false;return}location.href='exam.html?a='+encodeURIComponent(r.attempt.id)});
})();
