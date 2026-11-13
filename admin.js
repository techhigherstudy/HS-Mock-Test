/* Admin panel prototype — browser-only. Every action here maps to a Laravel module/policy in the backend phase.
   Permissions are checked on every route and action (backend: middleware + policies). */
(function(){
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=HS.esc;
const KEY='hs_admin_v2',SES='hs_admin_session';
const MODS=[['dashboard','Dashboard','▦','Overview'],
 ['exams','Exam Management','✎','Examinations'],['categories','Exam Categories','▣','Examinations'],['sections','Exam Sections','☷','Examinations'],['mocks','Mock Test Management','⏱','Examinations'],
 ['questions','Question Bank','?','Questions'],['import','Bulk Question Import','⇪','Questions'],
 ['students','Student Management','☺','Students & results'],['attempts','Examination Attempts','▶','Students & results'],['results','Examination Results','✔','Students & results'],
 ['leads','Lead Management','☰','Leads & marketing'],['activity','Lead Activity','◷','Leads & marketing'],['marketing','Marketing Source & Campaigns','◎','Leads & marketing'],['counselling','Counselling & Enquiries','✆','Leads & marketing'],
 ['dailyquiz','Daily Quiz','✦','Learning'],['flashcards','Flashcards','▭','Learning'],['perf','Performance Analytics','◔','Learning'],['engagement','Engagement Analytics','☍','Learning'],['predictor','College Predictor','⌖','Colleges'],['colleges','College Management','⌂','Colleges'],
 ['papers','Previous Year Papers','▤','Library'],['materials','Study Material','✐','Library'],['menu','Free Resources Menu','≡','Library'],
 ['cms','Website Content','▥','Site & system'],['admins','Admin Users','♟','Site & system'],['roles','Roles & Permissions','⚿','Site & system'],['reports','Reports & Exports','⇩','Site & system'],['settings','System Settings','⚙','Site & system'],['sheets','Google Sheets','⇄','Site & system'],['database','Database','⛁','Site & system'],['audit','Activity Logs','✓','Site & system']];
const ACTS=['view','add','edit','delete','publish','export'];
const STAGES=['Registration Completed','Instructions Viewed','Examination Started','Examination Submitted','Result Viewed','Counselling Requested','Lead Assigned','Counsellor Contacted','Follow-up Pending','Interested','Application Started','Admission Completed','Lead Lost'];
const SI=s=>STAGES.indexOf(s);
const allP=()=>Object.fromEntries(MODS.map(m=>[m[0],[...ACTS]]));
const only=(o)=>Object.assign(Object.fromEntries(MODS.map(m=>[m[0],[]])),o);
const ROLES0={
 'Super Admin':allP(),
 'Administrator':only(Object.assign(allP(),{admins:['view'],roles:['view'],database:['view'],settings:['view']})),
 'Content Manager':only({dashboard:['view'],cms:[...ACTS],menu:[...ACTS],papers:[...ACTS],materials:[...ACTS],flashcards:[...ACTS]}),
 'Examination Manager':only({dashboard:['view'],exams:[...ACTS],categories:[...ACTS],sections:[...ACTS],mocks:[...ACTS],questions:[...ACTS],import:[...ACTS],papers:[...ACTS],materials:[...ACTS],dailyquiz:[...ACTS],flashcards:[...ACTS]}),
 'Question Bank Manager':only({questions:[...ACTS],import:[...ACTS]}),
 'Study Material Manager':only({dashboard:['view'],papers:[...ACTS],materials:[...ACTS]}),
 'Lead Manager':only({dashboard:['view'],leads:['view','edit','export'],activity:['view'],students:['view','edit'],marketing:['view','export'],counselling:['view','edit','add'],engagement:['view','export']}),
 'Counselling Manager':only({dashboard:['view'],counselling:['view','add','edit','export'],leads:['view']}),
 'Reports Manager':only({dashboard:['view'],perf:['view','export'],engagement:['view','export'],leads:['view','export'],students:['view','export'],attempts:['view','export'],results:['view','export'],marketing:['view','export'],reports:['view','export'],audit:['view']})};
const ADM0=HS.ADMINS0;
const COUNS=['Anita Sharma','Vikram Rao','Neha Gupta','Imran Khan'], MGRS=['Suresh Iyer','Meera Nair'];

/* ---------- store ---------- */
let S=null;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY))}catch(e){return null}};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function seed(){
  const r=rng(2026),pick=a=>a[Math.floor(r()*a.length)];
  const F=['Aarav','Ananya','Rohan','Sneha','Karan','Isha','Vivek','Pooja','Arjun','Meera','Rahul','Divya','Siddharth','Kavya','Nikhil','Riya','Amit','Tanvi','Harsh','Simran','Yash','Neha','Manish','Ritika'],L=['Sharma','Patil','Reddy','Iyer','Gupta','Khan','Mehta','Nair','Singh','Joshi','Kulkarni','Das','Verma','Bose','Rao'];
  const CITY=[['Pune','Maharashtra'],['Mumbai','Maharashtra'],['Delhi','Delhi'],['Bengaluru','Karnataka'],['Hyderabad','Telangana'],['Chennai','Tamil Nadu'],['Kolkata','West Bengal'],['Jaipur','Rajasthan'],['Ahmedabad','Gujarat'],['Lucknow','Uttar Pradesh']];
  const SRC=[['Google Ads','google','cpc'],['Facebook','facebook','paid-social'],['Instagram','instagram','social'],['WhatsApp','whatsapp','message'],['Organic','google','organic'],['Referral','friend','referral']];
  const CAMP=['cat-2026-launch','free-mock-nov','mba-counselling','retarget-dec'],DEV=['Mobile','Mobile','Desktop','Tablet'],EX=['CAT Full Length Mock 1','CAT Full Length Mock 1','CAT Full Length Mock 1','CAT Full Length Mock 2'];
  const w=[10,10,8,14,10,8,6,6,5,5,3,3,12],tot=w.reduce((a,b)=>a+b),leads=[];
  for(let i=0;i<140;i++){
    let x=r()*tot,si=0;for(;si<w.length;si++){x-=w[si];if(x<0)break}
    const c=pick(CITY),s=pick(SRC),days=Math.floor(Math.pow(r(),1.4)*45),d=new Date(Date.now()-days*864e5-Math.floor(r()*864e5));
    const fn=pick(F),ln=pick(L),sub=si>=3&&si!==12||(si===12&&r()>.5),marks=sub?Math.round(-8+r()*150):null;
    leads.push({leadId:'LD'+(1000+i),studentId:'STU'+(5000+i),name:fn+' '+ln,mobile:String(pick([6,7,8,9])*1e9+Math.floor(r()*1e9)).slice(0,10),email:(fn+'.'+ln+Math.floor(r()*99)).toLowerCase()+'@gmail.com',
      exam:pick(EX),regAt:d.toISOString(),stage:STAGES[si],started:si>=2,submitted:sub,marks,pct:marks===null?null:+(Math.max(marks,0)/204*100).toFixed(1),
      source:s[0],utmSource:s[1],utmMedium:s[2],campaign:pick(CAMP),landing:'/cat-mock-test',city:c[0],state:c[1],country:'India',device:pick(DEV),
      counsellor:si>=6?pick(COUNS):'',manager:si>=6?pick(MGRS):'',followup:si>=8&&si<11?new Date(Date.now()+Math.floor(r()*9-2)*864e5).toISOString().slice(0,10):'',blocked:false,real:false});
  }
  const q=[];
  return {admins:ADM0,roles:ROLES0,audit:[],leads,ov:{},acts:[],questions:q,sheets:{connected:true,sheetName:'higher.study — Data Copy',lastSync:new Date().toISOString(),pending:3,failed:1,synced:1284,log:[]},backups:[],counsel:[]};
}
S=load();if(!S||!S.leads){S=seed();save()}
/* permission migration: modules added in later versions get their default grants; Super Admin is always full access */
(function(){S.roles=S.roles||{};Object.keys(ROLES0).forEach(r=>{if(!S.roles[r])S.roles[r]=JSON.parse(JSON.stringify(ROLES0[r]))});
 Object.keys(S.roles).forEach(r=>MODS.forEach(m=>{if(!Array.isArray(S.roles[r][m[0]]))S.roles[r][m[0]]=((ROLES0[r]||{})[m[0]]||[]).slice()}));
 S.roles['Super Admin']=allP();if(S.showSample===undefined)S.showSample=true;S.imports=S.imports||[];S.saved=S.saved||{};save()})();
let me=null;const sess=()=>{try{return localStorage.getItem(SES)}catch(e){return null}};
me=S.admins.find(a=>a.email===sess()&&a.active)||null;
const can=(m,a='view')=>!!me&&((S.roles[me.role]||{})[m]||[]).includes(a);
const log=(action,module,prev,next)=>{S.audit.unshift({id:Date.now()+Math.random(),admin:me?me.name:'—',adminId:me?me.id:0,action,module,prev:prev??'',next:next??'',at:new Date().toISOString(),ip:'203.0.113.'+(10+(me?me.id:0))});S.audit=S.audit.slice(0,500);save()};
const dt=iso=>iso?new Date(iso).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'—';
const dd=iso=>iso?new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';
const toast=(m,k)=>HS.toast(m,k);

/* ---------- leads data (seed + students registered in this browser) ---------- */
const SRCNAME=(src,med)=>{src=String(src||'direct').toLowerCase();med=String(med||'').toLowerCase();return src==='google'&&/cpc|ppc|paid/.test(med)?'Google Ads':src==='google'?'Organic Search':src==='direct'?'Direct':src==='facebook'||src==='fb'?'Facebook':src==='instagram'?'Instagram':src==='whatsapp'?'WhatsApp':src.charAt(0).toUpperCase()+src.slice(1)};
function realLeads(){
  let us=[],at=[];try{us=JSON.parse(localStorage.getItem('hs_users')||'[]')}catch(e){}try{at=JSON.parse(localStorage.getItem('hs_attempts')||'[]').filter(a=>a.kind!=='daily')}catch(e){}
  return us.filter(u=>u.email!=='demo@higher.study').map(u=>{
    const A=u.attr||{},L=A.last||{},Fi=A.first||{},mine=at.filter(a=>a.studentId===u.studentId),done=mine.filter(a=>a.status==='submitted'),best=done.slice().sort((a,b)=>b.result.percentage-a.result.percentage)[0];
    const st=done.length?'Examination Submitted':mine.length?'Examination Started':'Registration Completed',exId=(mine[0]&&mine[0].examId)||A.examId||u.examId||0;
    return {leadId:u.leadId,studentId:u.studentId,name:u.name,mobile:u.mobile,email:u.email,exam:exId?HS.db.examName(exId):'—',examId:exId,regAt:u.at,stage:st,started:mine.length>0,submitted:done.length>0,
      marks:best?best.result.marks:null,pct:best?best.result.percentage:null,source:SRCNAME(L.source,L.medium),utmSource:L.source||'direct',utmMedium:L.medium||'none',campaign:L.campaign||'none',campaignId:L.campaign_id||'',keyword:L.term||'',adContent:L.content||'',
      gclid:L.gclid||'',gbraid:L.gbraid||'',wbraid:L.wbraid||'',fbclid:L.fbclid||'',firstSource:SRCNAME(Fi.source,Fi.medium),firstMedium:Fi.medium||'none',firstCampaign:Fi.campaign||'none',landing:A.landing||'',referrer:A.referrer||'',browser:A.browser||'',
      city:'—',state:'—',country:'India',device:A.device||'—',counsellor:'',manager:'',followup:'',blocked:!!u.blocked,real:true,attempts:mine.length}});
}
const KW=['cat mock test free','cat online test series','mba entrance coaching','best cat mock'];
function allLeads(){return (S.showSample===false?[]:S.leads).concat(realLeads()).map(l=>{const o=S.ov[l.leadId];const b=Object.assign({sample:!l.real,keyword:l.source==='Google Ads'?KW[parseInt(String(l.leadId).replace(/\D/g,''),10)%4]:'',firstSource:l.source,firstMedium:l.utmMedium,firstCampaign:l.campaign},l);return o?Object.assign(b,o):b})}
function lastAct(l){const a=S.acts.filter(x=>x.leadId===l.leadId);if(a.length)return a[0].at;return new Date(new Date(l.regAt).getTime()+SI(l.stage)*36e5*5).toISOString()}
function timeline(l){
  const base=[['Website Visited',-0.2],['Examination Page Viewed',-0.1],['Start Test Clicked',-0.05],['Registration Popup Opened',-0.03],['Registration Started',-0.02],['Registration Completed',0],['OTP Verified',0.01]];
  const t0=new Date(l.regAt).getTime(),ev=base.map(b=>({t:'System',e:b[0],at:new Date(t0+b[1]*3.6e6).toISOString(),note:l.source+' · '+l.device}));
  STAGES.slice(1,Math.max(SI(l.stage),0)+1).forEach((s,i)=>ev.push({t:'System',e:s,at:new Date(t0+(i+1)*5*3.6e6).toISOString(),note:''}));
  S.acts.filter(a=>a.leadId===l.leadId).forEach(a=>ev.push({t:a.by,e:a.type==='stage'?`Stage: ${a.from} → ${a.to}`:a.type==='assign'?`Assigned to ${a.to}`:`Note: ${a.to}`,at:a.at,note:a.note||''}));
  return ev.sort((a,b)=>new Date(b.at)-new Date(a.at));
}
function updLead(id,patch,desc){const o=S.ov[id]||{};S.ov[id]=Object.assign(o,patch);save()}
function stageChange(l,to,by){const from=l.stage;updLead(l.leadId,{stage:to});S.acts.unshift({leadId:l.leadId,type:'stage',from,to,at:new Date().toISOString(),by:me.name});log(`Changed lead ${l.leadId} stage`,'Lead Management',from,to)}

/* ---------- filters ---------- */
const F={q:'',date:'all',from:'',to:'',exam:'',stage:'',city:'',source:'',medium:'',keyword:'',conv:'',fu:'',campaign:'',counsellor:'',minMarks:'',page:1};
function range(p){const n=new Date(),s=new Date(n.getFullYear(),n.getMonth(),n.getDate()),D=864e5;
  switch(p){case'today':return[+s,+s+D];case'yesterday':return[+s-D,+s];case'7':return[+s-6*D,+s+D];case'15':return[+s-14*D,+s+D];case'30':return[+s-29*D,+s+D];
   case'month':return[+new Date(n.getFullYear(),n.getMonth(),1),+s+D];case'prev':return[+new Date(n.getFullYear(),n.getMonth()-1,1),+new Date(n.getFullYear(),n.getMonth(),1)];
   case'year':return[+new Date(n.getFullYear(),0,1),+s+D];case'custom':return[F.from?+new Date(F.from):0,F.to?+new Date(F.to)+D:Infinity];default:return[0,Infinity]}}
function filtered(extra){const [a,b]=range(F.date),q=F.q.trim().toLowerCase();
  return allLeads().filter(l=>{const t=+new Date(l.regAt);if(t<a||t>=b)return false;
   if(F.exam&&l.exam!==F.exam)return false;if(F.stage&&l.stage!==F.stage)return false;if(F.city&&l.city!==F.city)return false;if(F.source&&l.source!==F.source)return false;
   if(F.campaign&&l.campaign!==F.campaign)return false;if(F.medium&&l.utmMedium!==F.medium)return false;if(F.keyword&&l.keyword!==F.keyword)return false;
   if(F.conv&&(F.conv==='Converted'?l.stage!=='Admission Completed':F.conv==='Lost'?l.stage!=='Lead Lost':(l.stage==='Admission Completed'||l.stage==='Lead Lost')))return false;
   {const td=new Date().toISOString().slice(0,10);if(F.fu==='due'&&!(l.followup&&l.followup<=td))return false;if(F.fu==='upcoming'&&!(l.followup&&l.followup>td))return false;if(F.fu==='none'&&l.followup)return false}if(F.counsellor&&l.counsellor!==F.counsellor)return false;if(F.minMarks!==''&&(l.marks===null||l.marks<+F.minMarks))return false;
   if(q&&![l.name,l.mobile,l.email,l.leadId,l.studentId].some(v=>String(v).toLowerCase().includes(q)))return false;return true}).sort((x,y)=>new Date(y.regAt)-new Date(x.regAt))}
const uniq=k=>[...new Set(allLeads().map(l=>l[k]).filter(v=>v&&v!=='—'))].sort();
const opt=(arr,v,all)=>`<option value="">${all}</option>`+arr.map(x=>`<option ${x===v?'selected':''}>${esc(x)}</option>`).join('');
function filterBar(compact){return `<div class="filters">
 <div><label>Date</label><select data-f="date">${[['all','All time'],['today','Today'],['yesterday','Yesterday'],['7','Last 7 days'],['15','Last 15 days'],['30','Last 30 days'],['month','This month'],['prev','Previous month'],['year','This year'],['custom','Custom range']].map(x=>`<option value="${x[0]}" ${F.date===x[0]?'selected':''}>${x[1]}</option>`).join('')}</select></div>
 ${F.date==='custom'?`<div><label>From</label><input type="date" data-f="from" value="${F.from}"></div><div><label>To</label><input type="date" data-f="to" value="${F.to}"></div>`:''}
 <div><label>Examination</label><select data-f="exam">${opt(uniq('exam'),F.exam,'All exams')}</select></div>
 <div><label>Lead stage</label><select data-f="stage">${opt(STAGES,F.stage,'All stages')}</select></div>
 ${compact?'':`<div><label>City</label><select data-f="city">${opt(uniq('city'),F.city,'All cities')}</select></div>`}
 <div><label>Source</label><select data-f="source">${opt(uniq('source'),F.source,'All sources')}</select></div>
 <div><label>Campaign</label><select data-f="campaign">${opt(uniq('campaign'),F.campaign,'All campaigns')}</select></div>
 <div><label>Medium</label><select data-f="medium">${opt(uniq('utmMedium'),F.medium,'All mediums')}</select></div>
 ${compact?'':`<div><label>Keyword</label><select data-f="keyword">${opt(uniq('keyword'),F.keyword,'All keywords')}</select></div>
 <div><label>Conversion</label><select data-f="conv">${opt(['Converted','Lost','Open'],F.conv,'Any')}</select></div>
 <div><label>Follow-up</label><select data-f="fu">${[['','Any'],['due','Due / overdue'],['upcoming','Upcoming'],['none','Not set']].map(o=>`<option value="${o[0]}" ${F.fu===o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>`}
 ${compact?'':`<div><label>Counsellor</label><select data-f="counsellor">${opt(COUNS,F.counsellor,'All counsellors')}</select></div>
 <div><label>Min. marks</label><input type="number" data-f="minMarks" value="${F.minMarks}" style="min-width:90px;width:90px" placeholder="any"></div>
 <div><label>Search</label><input data-f="q" value="${esc(F.q)}" placeholder="Name, mobile, email, ID"></div>`}
 <div><button class="btn-s" data-act="reset">Reset</button></div></div>`}

/* ---------- columns / export ---------- */
const COLS=[['leadId','Lead ID'],['studentId','Student ID'],['name','Student Name'],['mobile','Mobile Number'],['email','Email'],['exam','Examination'],['regDate','Registration Date'],['regTime','Registration Time'],['stage','Current Lead Stage'],
 ['started','Exam Started'],['submitted','Exam Submitted'],['marks','Marks Obtained'],['pct','Percentage'],['source','Campaign Source'],['utmSource','UTM Source'],['utmMedium','UTM Medium'],['campaign','UTM Campaign'],['city','City'],['state','State'],
 ['keyword','Keyword'],['campaignId','Campaign ID'],['firstSource','First-touch Source'],['firstCampaign','First-touch Campaign'],['gclid','Google Click ID'],['landing','Landing Page'],['referrer','Referrer'],['browser','Browser'],['device','Device'],['counsellor','Assigned Counsellor'],['manager','Assigned Manager'],['followup','Follow-up Date'],['lastAct','Last Activity']];
const cval=(l,k)=>k==='regDate'?dd(l.regAt):k==='regTime'?new Date(l.regAt).toLocaleTimeString('en-IN'):k==='started'||k==='submitted'?(l[k]?'Yes':'No'):k==='lastAct'?dt(lastAct(l)):(l[k]??'');
let visCols=['leadId','name','mobile','exam','regDate','stage','marks','source','city','counsellor','lastAct'];
let expCols=COLS.map(c=>c[0]);let sel=new Set();
const csv=(rows,cols)=>[cols.map(k=>COLS.find(c=>c[0]===k)[1]),...rows.map(l=>cols.map(k=>cval(l,k)))].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n');
function download(name,text,mime){const b=new Blob(['﻿'+text],{type:mime||'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)}

/* ---------- ui helpers ---------- */
const chipFor=s=>{const i=SI(s);return `<span class="chip ${s==='Lead Lost'?'r':s==='Admission Completed'?'g':i>=5?'p':i>=3?'y':'b'}">${esc(s)}</span>`};
const denied=()=>`<div class="denied"><h2>Access denied</h2><p>Your role (<b>${esc(me.role)}</b>) does not have permission for this module.<br>The backend will enforce this with Laravel middleware and policies, not only by hiding menu items.</p></div>`;
const openDrawer=h=>{$('#drawer').innerHTML=h;$('#drawer').classList.add('open');$('#dbg').classList.add('open')};
const closeDrawer=()=>{$('#drawer').classList.remove('open');$('#dbg').classList.remove('open')};
const openModal=h=>{$('#modal').innerHTML=h;$('#mbg').classList.add('open')};const closeModal=()=>$('#mbg').classList.remove('open');
$('#dbg').onclick=closeDrawer;$('#mbg').onclick=e=>{if(e.target.id==='mbg')closeModal()};
const bars=(vals,labels)=>{const m=Math.max(1,...vals);return `<div class="bars">${vals.map(v=>`<div class="b" data-v="${v}" style="height:${v/m*100}%"></div>`).join('')}</div><div class="axis">${labels.map(l=>`<span>${l}</span>`).join('')}</div>`};
const hbars=(pairs)=>{const m=Math.max(1,...pairs.map(p=>p[1]));return pairs.map(p=>`<div class="hbar"><span title="${esc(p[0])}">${esc(p[0])}</span><i style="width:${p[1]/m*100}%"></i><span>${p[1]}</span></div>`).join('')||'<p style="color:var(--muted)">No data for this filter.</p>'};
const count=(arr,f)=>{const m={};arr.forEach(x=>{const k=f(x);m[k]=(m[k]||0)+1});return Object.entries(m).sort((a,b)=>b[1]-a[1])};

/* ================= pages ================= */
const P={};
P.dashboard=()=>{
  const L=filtered(),n=L.length,st=k=>L.filter(l=>SI(l.stage)>=k&&l.stage!=='Lead Lost').length;
  const started=L.filter(l=>l.started).length,sub=L.filter(l=>l.submitted).length,conv=L.filter(l=>l.stage==='Admission Completed').length,lost=L.filter(l=>l.stage==='Lead Lost').length,couns=L.filter(l=>SI(l.stage)>=5&&l.stage!=='Lead Lost').length;
  const K=[['Website visitors (est.)',Math.round(n*4.6)],['Total leads',n],['Registered students',n],['Verified students',Math.round(n*.93)],['Exams started',started],['Exams submitted',sub],['Results generated',sub],['Counselling requests',couns],['Converted leads',conv],['Lost leads',lost]];
  const days=F.date==='today'||F.date==='yesterday'?1:F.date==='7'?7:F.date==='15'?15:30,D=864e5,s0=new Date();s0.setHours(0,0,0,0);
  const dv=[],dl=[];for(let i=days-1;i>=0;i--){const a=+s0-i*D;dv.push(L.filter(l=>{const t=+new Date(l.regAt);return t>=a&&t<a+D}).length);dl.push(new Date(a).getDate())}
  const mv=[],ml=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i,1);const a=+new Date(d.getFullYear(),d.getMonth(),1),b=+new Date(d.getFullYear(),d.getMonth()+1,1);mv.push(allLeads().filter(l=>{const t=+new Date(l.regAt);return t>=a&&t<b}).length);ml.push(d.toLocaleString('en',{month:'short'}))}
  return `<div class="notice"><b>Prototype data.</b> Sample leads plus anyone who registers in this browser. Real data comes from MySQL once the Laravel backend is built. All cards and charts respond to the filters.</div>${filterBar(true)}
  <div class="kpis-a">${K.map((k,i)=>`<div class="kpi-a ${i===1?'hl':''}"><span>${k[0]}</span><b>${k[1].toLocaleString('en-IN')}</b></div>`).join('')}</div>
  <div class="cols2"><div class="panel-a"><h3>Daily lead generation</h3>${bars(dv,dl)}</div><div class="panel-a"><h3>Monthly lead generation</h3>${bars(mv,ml)}</div></div>
  <div class="cols2"><div class="panel-a"><h3>Lead stage distribution</h3>${hbars(count(L,l=>l.stage))}</div>
   <div class="panel-a"><h3>Examination started vs submitted</h3>${hbars([['Registered',n],['Started',started],['Submitted',sub],['Completion rate %',started?Math.round(sub/started*100):0]])}</div></div>
  <div class="cols3"><div class="panel-a"><h3>Examination-wise leads</h3>${hbars(count(L,l=>l.exam))}</div><div class="panel-a"><h3>Campaign-wise leads</h3>${hbars(count(L,l=>l.campaign))}</div><div class="panel-a"><h3>Device-wise visitors</h3>${hbars(count(L,l=>l.device))}</div></div>
  <div class="cols2"><div class="panel-a"><h3>Counselling conversion</h3>${hbars([['Counselling requested',couns],['Contacted',st(7)],['Interested',st(9)],['Application started',st(10)],['Admission completed',conv]])}</div>
   <div class="panel-a"><h3>Registration conversion</h3>${hbars(count(L,l=>l.source))}</div></div>`;
};
function leadRow(l){return `<tr data-id="${l.leadId}"><td><input type="checkbox" data-sel="${l.leadId}" ${sel.has(l.leadId)?'checked':''}></td>${visCols.map(k=>`<td>${k==='stage'?chipFor(l.stage):esc(cval(l,k))}</td>`).join('')}</tr>`}
P.leads=()=>{
  const L=filtered(),per=15,pages=Math.max(1,Math.ceil(L.length/per));F.page=Math.min(F.page,pages);const rows=L.slice((F.page-1)*per,F.page*per);
  const allOnPage=rows.length&&rows.every(l=>sel.has(l.leadId));
  return `${filterBar(false)}<div class="ml" style="justify-content:space-between;margin-bottom:10px"><div class="ml"><b>${L.length.toLocaleString()}</b> leads match${sel.size?` · <b>${sel.size}</b> selected <a href="#" data-act="clearsel" style="color:var(--brand)">clear</a>`:''}${L.length>rows.length?` · <a href="#" data-act="selall" style="color:var(--brand)">select all ${L.length} matching</a>`:''}</div>
   <div class="ml"><button class="btn-s" data-act="cols">Columns</button>${can('leads','export')?`<button class="btn-s p" data-act="export">Export…</button>`:''}</div></div>
  <div class="tw"><table class="t"><thead><tr><th><input type="checkbox" data-act="selpage" ${allOnPage?'checked':''}></th>${visCols.map(k=>`<th>${COLS.find(c=>c[0]===k)[1]}</th>`).join('')}</tr></thead><tbody>${rows.map(leadRow).join('')||`<tr><td colspan="${visCols.length+1}" style="text-align:center;padding:30px;color:var(--muted)">No leads match these filters.</td></tr>`}</tbody></table></div>
  <div class="pager"><span>Page ${F.page} of ${pages}</span><div class="ml"><button class="btn-s" data-act="prev" ${F.page<=1?'disabled':''}>‹ Prev</button><button class="btn-s" data-act="next" ${F.page>=pages?'disabled':''}>Next ›</button></div></div>`;
};
function leadDrawer(id){
  const l=allLeads().find(x=>x.leadId===id);if(!l)return;const ed=can('leads','edit')||can('counselling','edit');
  openDrawer(`<div class="ml" style="justify-content:space-between"><div><h3>${esc(l.name)}</h3><div>${chipFor(l.stage)} <span class="chip">${esc(l.leadId)}</span> ${l.real?'<span class="chip g">Registered here</span>':''}</div></div><button class="btn-s" data-act="closedr">Close</button></div>
  <div class="kv"><span>Mobile</span><span>${esc(l.mobile)}</span><span>Email</span><span>${esc(l.email)}</span><span>Student ID</span><span>${esc(l.studentId)}</span><span>Examination</span><span>${esc(l.exam)}</span><span>Registered</span><span>${dt(l.regAt)}</span>
  <span>Marks</span><span>${l.marks===null?'—':l.marks+' ('+l.pct+'%)'}</span><span>Source</span><span>${esc(l.source)} · ${esc(l.utmMedium)} · ${esc(l.campaign)}</span><span>Location</span><span>${esc(l.city)}, ${esc(l.state)}</span><span>Device</span><span>${esc(l.device)}</span>
  <span>First touch</span><span>${esc(l.firstSource)} · ${esc(l.firstMedium)} · ${esc(l.firstCampaign)}</span><span>Keyword</span><span>${esc(l.keyword||'—')}</span><span>Click IDs</span><span>${esc([l.gclid&&'gclid '+l.gclid,l.gbraid&&'gbraid',l.wbraid&&'wbraid',l.fbclid&&'fbclid'].filter(Boolean).join(' · ')||'—')}</span><span>Landing page</span><span style="word-break:break-all">${esc(l.landing||'—')}</span><span>Referrer</span><span style="word-break:break-all">${esc(l.referrer||'—')}</span><span>Counsellor</span><span>${esc(l.counsellor||'Unassigned')}</span><span>Follow-up</span><span>${esc(l.followup||'—')}</span></div>
  ${ed?`<div class="form-g"><div><label>Change stage</label><select id="d-stage">${STAGES.map(s=>`<option ${s===l.stage?'selected':''}>${s}</option>`).join('')}</select></div>
   <div><label>Assign counsellor</label><select id="d-couns"><option value="">Unassigned</option>${COUNS.map(c=>`<option ${c===l.counsellor?'selected':''}>${c}</option>`).join('')}</select></div>
   <div><label>Follow-up date</label><input type="date" id="d-fu" value="${l.followup||''}"></div><div><label>Remark</label><input id="d-note" placeholder="Add a remark"></div>
   <div class="full"><button class="btn-s p" data-act="savelead" data-id="${l.leadId}">Save changes</button></div></div>`:'<p style="color:var(--muted)">View only — your role cannot edit leads.</p>'}
  <h4 style="margin:18px 0 0">Activity timeline</h4><div class="tl">${timeline(l).map(e=>`<div class="ev"><b>${esc(e.e)}</b><small>${dt(e.at)} · ${esc(e.t)}${e.note?' · '+esc(e.note):''}</small></div>`).join('')}</div>`);
}
P.activity=()=>{const a=S.acts.map(x=>({lead:x.leadId,e:x.type==='stage'?`${x.from} → ${x.to}`:x.type==='assign'?`Assigned to ${x.to}`:x.to,by:x.by,at:x.at}));
  const sys=filtered().slice(0,40).map(l=>({lead:l.leadId+' · '+l.name,e:l.stage,by:'System',at:lastAct(l)}));
  const all=a.concat(sys).sort((x,y)=>new Date(y.at)-new Date(x.at)).slice(0,80);
  return `<div class="notice">Lead activity is append-only: every stage change creates a new record and nothing is overwritten.</div>${filterBar(true)}<div class="tw"><table class="t"><thead><tr><th>Lead</th><th>Event</th><th>By</th><th>Date &amp; time</th></tr></thead><tbody>${all.map(x=>`<tr><td>${esc(x.lead)}</td><td>${esc(x.e)}</td><td>${esc(x.by)}</td><td>${dt(x.at)}</td></tr>`).join('')||'<tr><td colspan=4 style="padding:24px;text-align:center;color:var(--muted)">No activity.</td></tr>'}</tbody></table></div>`};
P.students=()=>{const q=F.q.toLowerCase(),L=allLeads().filter(l=>!q||[l.name,l.email,l.mobile,l.studentId].some(v=>String(v).toLowerCase().includes(q))).slice(0,60);
  return `<div class="filters"><div><label>Search students</label><input data-f="q" value="${esc(F.q)}" placeholder="Name, mobile, email, ID"></div></div><div class="tw"><table class="t"><thead><tr><th>Student ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>Attempts</th><th>Best marks</th><th>Status</th><th></th></tr></thead><tbody>
  ${L.map(l=>`<tr data-id="${l.leadId}"><td>${l.studentId}</td><td>${esc(l.name)}</td><td>${l.mobile}</td><td>${esc(l.email)}</td><td>${l.started?1:0}</td><td>${l.marks??'—'}</td><td>${l.blocked?'<span class="chip r">Blocked</span>':'<span class="chip g">Active</span>'}</td><td>${can('students','edit')?`<button class="btn-s ${l.blocked?'':'d'}" data-act="block" data-id="${l.leadId}">${l.blocked?'Unblock':'Block'}</button>`:''}</td></tr>`).join('')}</tbody></table></div><p style="color:var(--muted);font-size:13px">Showing up to 60 students. Click a row for the profile and timeline.</p>`};
P.counselling=()=>{const L=allLeads().filter(l=>SI(l.stage)>=5&&l.stage!=='Lead Lost').sort((a,b)=>new Date(b.regAt)-new Date(a.regAt)).slice(0,60),ed=can('counselling','edit');
  const pipe=['Counselling Requested','Lead Assigned','Counsellor Contacted','Follow-up Pending','Interested','Application Started','Admission Completed'];
  return `<div class="kpis-a" style="grid-template-columns:repeat(7,1fr)">${pipe.map(s=>`<div class="kpi-a"><span>${s}</span><b>${L.filter(l=>l.stage===s).length}</b></div>`).join('')}</div>
  <div class="ml" style="margin-bottom:12px"><span>Counsellors: ${COUNS.map(c=>`<span class="chip">${c} · ${L.filter(l=>l.counsellor===c).length}</span>`).join(' ')}</span></div>
  <div class="tw"><table class="t"><thead><tr><th>Lead</th><th>Name</th><th>Mobile</th><th>Stage</th><th>Counsellor</th><th>Follow-up</th></tr></thead><tbody>${L.map(l=>`<tr data-id="${l.leadId}"><td>${l.leadId}</td><td>${esc(l.name)}</td><td>${l.mobile}</td><td>${chipFor(l.stage)}</td><td>${esc(l.counsellor||'Unassigned')}</td><td>${esc(l.followup||'—')}</td></tr>`).join('')||'<tr><td colspan=6 style="padding:24px;text-align:center;color:var(--muted)">No counselling leads yet.</td></tr>'}</tbody></table></div>${ed?'<p style="color:var(--muted);font-size:13px">Click a lead to assign a counsellor, change stage, set a follow-up date or add remarks.</p>':''}`};
const examList=()=>{const ov=JSON.parse(localStorage.getItem('hs_exam_ov')||'{}'),nw=JSON.parse(localStorage.getItem('hs_exam_new')||'[]');return HS_DATA.catalog.concat(nw).map(e=>Object.assign({},e,ov[e.id]||{}))};
const setOv=(id,p)=>{const ov=JSON.parse(localStorage.getItem('hs_exam_ov')||'{}');ov[id]=Object.assign(ov[id]||{},p);localStorage.setItem('hs_exam_ov',JSON.stringify(ov))};
P.exams=()=>{const E=examList().filter(e=>!e.deleted),ed=can('exams','edit');
  return `<div class="ml" style="justify-content:space-between;margin-bottom:12px"><span><b>${E.length}</b> examinations · changes appear on the public site immediately</span>${can('exams','add')?'<button class="btn-s p" data-act="newexam">+ Create examination</button>':''}</div>
  <div class="tw"><table class="t"><thead><tr><th>Name</th><th>Category</th><th>Duration</th><th>Questions</th><th>Marks</th><th>Difficulty</th><th>Access</th><th>Status</th><th>Published</th><th></th></tr></thead><tbody>${E.map(e=>`<tr style="cursor:default"><td><b>${esc(e.title)}</b></td><td>${e.category}</td><td>${e.duration} min</td><td>${e.totalQuestions}</td><td>${e.totalMarks}</td><td>${e.difficulty}</td><td>${e.free?'Free':'Paid'}</td><td>${e.available?'<span class="chip g">Live</span>':'<span class="chip y">No questions</span>'}</td>
  <td><label class="sw"><input type="checkbox" data-act="pub" data-id="${e.id}" ${e.published!==false?'checked':''} ${can('exams','edit')?'':'disabled'}><i></i></label></td>
  <td class="ml">${ed?`<button class="btn-s" data-act="editexam" data-id="${e.id}">Edit</button>`:''}${can('exams','add')?`<button class="btn-s" data-act="dupexam" data-id="${e.id}">Duplicate</button>`:''}${can('exams','delete')&&e.id!==1?`<button class="btn-s d" data-act="delexam" data-id="${e.id}">Delete</button>`:''}</td></tr>`).join('')}</tbody></table></div>`};
function examForm(e){const n=!e;e=e||{title:'',category:'full',duration:120,totalQuestions:68,totalMarks:204,difficulty:'Moderate',free:true,description:''};
  openModal(`<h3>${n?'Create examination':'Edit examination'}</h3><div class="form-g"><div class="full"><label>Name</label><input id="x-title" value="${esc(e.title)}"></div><div class="full"><label>Description</label><input id="x-desc" value="${esc(e.description||'')}"></div>
  <div><label>Category</label><select id="x-cat">${[['full','Full Length Mock'],['sectional','Sectional Test'],['pyp','Previous Year Paper']].map(c=>`<option value="${c[0]}" ${e.category===c[0]?'selected':''}>${c[1]}</option>`).join('')}</select></div>
  <div><label>Difficulty</label><select id="x-diff">${['Easy','Moderate','Hard'].map(d=>`<option ${e.difficulty===d?'selected':''}>${d}</option>`).join('')}</select></div>
  <div><label>Duration (min)</label><input type="number" id="x-dur" value="${e.duration}"></div><div><label>Questions</label><input type="number" id="x-q" value="${e.totalQuestions}"></div>
  <div><label>Max marks</label><input type="number" id="x-m" value="${e.totalMarks}"></div><div><label>Access</label><select id="x-free"><option value="1" ${e.free?'selected':''}>Free</option><option value="0" ${e.free?'':'selected'}>Paid</option></select></div>
  <div class="full ml"><button class="btn-s p" data-act="saveexam" data-id="${n?'':e.id}">Save</button><button class="btn-s" data-act="closemodal">Cancel</button></div></div>`)}
const BANK=()=>HS_DATA.questions.map(q=>({id:q.id,section:q.section,type:q.type,q:q.q,marks:q.marks,neg:q.neg,diff:'Moderate',src:'Sample'})).concat(S.questions);
let QF={q:'',sec:''};
P.questions=()=>{let B=BANK().filter(x=>(!QF.sec||x.section===QF.sec)&&(!QF.q||x.q.toLowerCase().includes(QF.q.toLowerCase())));
  return `<div class="ml" style="justify-content:space-between;margin-bottom:12px"><div class="filters" style="margin:0"><div><label>Search</label><input data-qf="q" value="${esc(QF.q)}" placeholder="Search questions"></div><div><label>Section</label><select data-qf="sec"><option value="">All</option>${['VARC','DILR','QA'].map(s=>`<option ${QF.sec===s?'selected':''}>${s}</option>`).join('')}</select></div></div>
  <div class="ml">${can('questions','add')?'<button class="btn-s p" data-act="newq">+ Add question</button><button class="btn-s" data-act="importq">Import CSV</button>':''}${can('questions','export')?'<button class="btn-s" data-act="exportq">Export CSV</button><button class="btn-s" data-act="tplq">Sample template</button>':''}</div></div>
  <div class="tw"><table class="t"><thead><tr><th>#</th><th>Section</th><th>Type</th><th>Question</th><th>Marks</th><th>Negative</th><th>Source</th></tr></thead><tbody>${B.slice(0,100).map(x=>`<tr style="cursor:default"><td>${x.id}</td><td>${x.section}</td><td>${x.type}</td><td style="white-space:normal;min-width:320px">${esc(x.q)}</td><td>${x.marks}</td><td>${x.neg}</td><td>${x.src}</td></tr>`).join('')}</tbody></table></div><div class="pager"><span>${B.length} questions (showing 100)</span></div>
  <p style="color:var(--muted);font-size:13px">Questions you add or import are stored in the bank. Wiring them into live exams happens in the backend phase.</p>`};
function qForm(){openModal(`<h3>Add question</h3><div class="form-g"><div><label>Section</label><select id="q-sec"><option>VARC</option><option>DILR</option><option>QA</option></select></div><div><label>Type</label><select id="q-type"><option>MCQ</option><option>TITA</option></select></div>
  <div class="full"><label>Question text</label><textarea id="q-text" rows="3"></textarea></div>${['A','B','C','D'].map(l=>`<div><label>Option ${l}</label><input id="q-o${l}"></div>`).join('')}
  <div><label>Correct option / answer</label><input id="q-ans" placeholder="A, B, C, D (or the typed answer)"></div><div><label>Explanation</label><input id="q-exp"></div>
  <div class="full ml"><button class="btn-s p" data-act="saveq">Save</button><button class="btn-s" data-act="closemodal">Cancel</button></div></div>`)}
function parseCSV(t){const rows=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'&&t[i+1]==='"'){c+='"';i++}else if(ch==='"')q=false;else c+=ch}else if(ch==='"')q=true;else if(ch===','){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else c+=ch}r.push(c);if(r.some(x=>x.trim()))rows.push(r);return rows}
let pend=[];
function importPreview(text){
  const rows=parseCSV(text);const h=rows.shift().map(x=>x.trim().toLowerCase());const ix=k=>h.indexOf(k);const ex=new Set(BANK().map(b=>b.q.trim().toLowerCase()));const seen=new Set();let valid=[],bad=[],dup=0;
  rows.forEach((r,i)=>{const g=k=>(r[ix(k)]||'').trim();const o={section:g('section').toUpperCase(),type:(g('type')||'MCQ').toUpperCase(),q:g('question'),opts:['option_a','option_b','option_c','option_d'].map(g),ans:g('answer'),marks:+g('marks')||3,neg:g('negative')===''?-1:+g('negative'),expl:g('explanation')};
    const miss=[];if(!['VARC','DILR','QA'].includes(o.section))miss.push('section');if(!o.q)miss.push('question');if(!o.ans)miss.push('answer');if(o.type==='MCQ'&&o.opts.filter(Boolean).length<2)miss.push('options');
    const key=o.q.toLowerCase();if(miss.length)bad.push({row:i+2,why:'Missing/invalid: '+miss.join(', ')});else if(ex.has(key)||seen.has(key)){dup++;bad.push({row:i+2,why:'Duplicate question'})}else{seen.add(key);valid.push(o)}});
  pend=valid;
  openModal(`<h3>Import preview</h3><div class="kpis-a" style="grid-template-columns:repeat(4,1fr)"><div class="kpi-a"><span>Total rows</span><b>${rows.length}</b></div><div class="kpi-a"><span>Valid</span><b style="color:var(--green)">${valid.length}</b></div><div class="kpi-a"><span>Invalid</span><b style="color:var(--danger)">${bad.length-dup}</b></div><div class="kpi-a"><span>Duplicates</span><b>${dup}</b></div></div>
   ${bad.length?`<div class="logline">${bad.slice(0,30).map(b=>`Row ${b.row}: ${b.why}`).join('\n')}</div>`:''}<div class="ml" style="margin-top:14px"><button class="btn-s p" data-act="doimport" ${valid.length?'':'disabled'}>Import ${valid.length} valid questions</button><button class="btn-s" data-act="closemodal">Cancel</button></div>`);
}
P.cms=()=>{const c=HS.cms(),ed=can('cms','edit');return `<div class="notice">Edit the public website here. Open <a href="index.html" target="_blank" style="color:var(--brand);font-weight:700">the landing page</a> in another tab and refresh it to see changes. No code editing needed.</div>
  <div class="panel-a"><h3>Homepage hero</h3><div class="form-g"><div><label>Heading (plain part)</label><input id="c-pre" value="${esc(c.heroPre)}"></div><div><label>Heading (highlighted part)</label><input id="c-em" value="${esc(c.heroEm)}"></div><div class="full"><label>Description</label><textarea id="c-text" rows="2">${esc(c.heroText)}</textarea></div></div></div>
  <div class="panel-a"><h3>Announcement banner</h3><div class="form-g"><div class="full"><label><input type="checkbox" id="c-ban" ${c.banner.on?'checked':''}> Show banner above the header</label></div><div class="full"><label>Banner text</label><input id="c-bantext" value="${esc(c.banner.text)}" placeholder="e.g. CAT Mock 2 goes live on Sunday"></div></div></div>
  <div class="panel-a"><h3>Navigation menu</h3><p style="margin:0 0 8px;color:var(--muted);font-size:13px">One item per line: <code>Title | dropdown (1/0) | badge</code></p><textarea class="fi" id="c-menu" rows="7" style="width:100%">${c.menu.map(m=>`${m.t} | ${m.dd?1:0} | ${m.badge||''}`).join('\n')}</textarea></div>
  <div class="panel-a"><h3>Footer</h3><div class="form-g"><div class="full"><label>About text</label><textarea id="c-foot" rows="2">${esc(c.footerText)}</textarea></div><div><label>Contact email</label><input id="c-mail" value="${esc(c.contactEmail)}"></div></div></div>
  ${ed?'<div class="ml"><button class="btn-s p" data-act="savecms">Publish changes</button><button class="btn-s" data-act="resetcms">Reset to defaults</button></div>':'<p style="color:var(--muted)">View only.</p>'}`};
P.sheets=()=>{const live=HS.sheet.status(),s=S.sheets,tabs=['Website_Visitors','All_Leads','Registrations','Exam_Activity','Exam_Responses','Exam_Results','Lead_Stages','Counselling_Leads','Counsellor_Activity','Website_Content','System_Logs'],ed=can('sheets','edit');
  return `<div class="panel-a"><h3>Live website → Google Sheet queue</h3><div class="kpis-a" style="grid-template-columns:repeat(4,1fr)"><div class="kpi-a"><span>Configured</span><b style="font-size:20px;color:${live.configured?'var(--green)':'var(--danger)'}">${live.configured?'Yes':'No URL set'}</b></div><div class="kpi-a"><span>Waiting to send</span><b>${live.pending}</b></div><div class="kpi-a"><span>Accepted by the sheet</span><b>${live.sent||0}</b></div><div class="kpi-a"><span>Last successful send</span><b style="font-size:15px">${dt(live.lastOk)}</b></div></div>
  ${live.lastErr?`<p style="color:var(--danger);font-size:13px"><b>Not delivered:</b> ${esc(live.lastErr)}. Data stays queued and retries automatically; click "Send queued now" after fixing it.</p>`:''}${live.mode==='unconfirmed'&&!live.lastErr?'<p style="color:var(--muted);font-size:13px">Your browser could not read the sheet reply, so delivery cannot be confirmed here. Check the sheet itself.</p>':''}<div class="ml"><button class="btn-s" data-act="sh-ping">Test connection</button><button class="btn-s p" data-act="sh-flush">Send queued now</button></div><div class="logline" id="ping-out" style="margin-top:12px">Set SHEETS_URL and SHEETS_TOKEN in config.js, then click Test connection.</div></div>
  <div class="notice"><b>Simulated below.</b> The cards and buttons under this line are a preview of the final dashboard (restore from MySQL, failed-record retry) and only change demo counters.</div>
  <div class="kpis-a"><div class="kpi-a"><span>Connection</span><b style="font-size:20px;color:${s.connected?'var(--green)':'var(--danger)'}">${s.connected?'Connected':'Disconnected'}</b></div><div class="kpi-a"><span>Last successful sync</span><b style="font-size:16px">${dt(s.lastSync)}</b></div><div class="kpi-a"><span>Records synchronized</span><b>${s.synced}</b></div><div class="kpi-a"><span>Pending</span><b>${s.pending}</b></div><div class="kpi-a"><span>Failed</span><b style="color:var(--danger)">${s.failed}</b></div></div>
  <div class="panel-a"><h3>${esc(s.sheetName)}</h3><div class="ml">${tabs.map(t=>`<span class="chip">${t}</span>`).join('')}</div>
  ${ed?`<div class="ml" style="margin-top:14px"><button class="btn-s" data-act="sh-test">Test connection</button><button class="btn-s" data-act="sh-sync">Sync pending records</button><button class="btn-s" data-act="sh-retry">Retry failed records</button><button class="btn-s p" data-act="sh-restore">Restore Google Sheets</button><button class="btn-s" data-act="sh-toggle">${s.connected?'Simulate disconnect':'Reconnect'}</button></div>`:''}
  <p style="color:var(--muted);font-size:13px;margin-top:12px">Rule built into the design: deleting rows in Google Sheets never deletes anything in MySQL. Restore re-copies data from MySQL without modifying it.</p></div>
  <div class="panel-a"><h3>Sync log</h3><div class="logline">${s.log.slice(0,40).join('\n')||'No sync activity yet.'}</div></div>`};
P.database=()=>{const L=allLeads();return `<div class="notice">Prototype view of the Database module. Real size, backups and restore run against MySQL in the backend phase.</div>
  <div class="kpis-a"><div class="kpi-a"><span>Connection</span><b style="font-size:20px;color:var(--green)">Healthy (demo)</b></div><div class="kpi-a"><span>Total leads</span><b>${L.length}</b></div><div class="kpi-a"><span>Total students</span><b>${L.length}</b></div><div class="kpi-a"><span>Examinations</span><b>${examList().filter(e=>!e.deleted).length}</b></div><div class="kpi-a"><span>Questions</span><b>${BANK().length}</b></div></div>
  <div class="panel-a"><h3>Backups</h3>${can('database','add')?'<button class="btn-s p" data-act="backup">Download backup (JSON)</button>':''}<div style="margin-top:12px">${S.backups.map(b=>`<div>${dt(b.at)} · ${b.by} · ${b.size} KB</div>`).join('')||'<span style="color:var(--muted)">No backups taken yet.</span>'}</div></div>`};
P.admins=()=>{const ed=can('admins','add');return `<div class="ml" style="justify-content:space-between;margin-bottom:12px"><span><b>${S.admins.length}</b> administrators</span>${ed?'<button class="btn-s p" data-act="newadmin">+ Create administrator</button>':''}</div>
  <div class="tw"><table class="t"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>${S.admins.map(a=>`<tr style="cursor:default"><td>${esc(a.name)}</td><td>${esc(a.email)}</td><td><span class="chip b">${esc(a.role)}</span></td><td>${a.active?'<span class="chip g">Active</span>':'<span class="chip r">Deactivated</span>'}</td>
  <td class="ml">${can('admins','edit')&&a.id!==me.id?`<button class="btn-s" data-act="admtoggle" data-id="${a.id}">${a.active?'Deactivate':'Activate'}</button><button class="btn-s" data-act="admreset" data-id="${a.id}">Reset password</button>`:''}</td></tr>`).join('')}</tbody></table></div>`};
P.roles=()=>{const ed=can('roles','edit');return `<div class="ml" style="justify-content:space-between;margin-bottom:12px"><span>Tick what each role can do. Changes apply on the next click. Try logging in as another admin to see the effect.</span>${can('roles','add')?'<button class="btn-s p" data-act="newrole">+ Custom role</button>':''}</div>
  ${Object.keys(S.roles).map(r=>`<div class="panel-a"><h3>${esc(r)} ${r==='Super Admin'?'<span class="chip g">locked: full access</span>':''}</h3><div class="tw"><table class="t perm"><thead><tr><th>Module</th>${ACTS.map(a=>`<th>${a}</th>`).join('')}</tr></thead><tbody>${MODS.map(m=>`<tr style="cursor:default"><td>${m[1]}</td>${ACTS.map(a=>`<td><input type="checkbox" data-perm="${esc(r)}|${m[0]}|${a}" ${(S.roles[r][m[0]]||[]).includes(a)?'checked':''} ${!ed||r==='Super Admin'?'disabled':''}></td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`).join('')}`};
P.audit=()=>`<div class="notice">Every admin action is recorded: who, what, module, previous and new value, time and IP.</div><div class="tw"><table class="t"><thead><tr><th>Admin</th><th>ID</th><th>Action</th><th>Module</th><th>Previous</th><th>New</th><th>Date &amp; time</th><th>IP</th></tr></thead><tbody>${S.audit.slice(0,150).map(a=>`<tr style="cursor:default"><td>${esc(a.admin)}</td><td>${a.adminId}</td><td style="white-space:normal;min-width:240px">${esc(a.action)}</td><td>${esc(a.module)}</td><td>${esc(a.prev)}</td><td>${esc(a.next)}</td><td>${dt(a.at)}</td><td>${a.ip}</td></tr>`).join('')||'<tr><td colspan=8 style="padding:24px;text-align:center;color:var(--muted)">No admin actions yet. Make a change and it will appear here.</td></tr>'}</tbody></table></div>`;

/* ---------- shell / router ---------- */
let route='dashboard';
function loginView(){
  $('#root').innerHTML=`<div class="a-login"><form class="box" id="lf"><img src="logo.svg" width="48" height="48" alt="" style="border-radius:10px"><h1>Admin sign in</h1><p class="sub">higher.study control panel</p>
  <div class="field" data-f="email"><label>Email</label><input id="a-email" type="email" autocomplete="username"></div><div class="field" data-f="pw"><label>Password</label><input id="a-pw" type="password" autocomplete="current-password"><div class="msg" id="a-err" style="display:none">Incorrect email or password, or the account is deactivated.</div></div>
  <button class="btn btn-primary btn-lg" style="width:100%" type="submit">Sign in</button>
  <div class="demo-box"><b>Demo accounts (prototype only) — click to fill</b>${ADM0.map(a=>`<button type="button" data-fill="${a.email}|${a.pw}">${a.role}<br><span style="color:var(--muted)">${a.email} · ${a.pw}</span></button>`).join('')}</div><p style="text-align:center;margin:14px 0 0"><a href="index.html" style="color:var(--brand)">← Back to website</a></p></form></div>`;
  $('#lf').onsubmit=e=>{e.preventDefault();const a=S.admins.find(x=>x.email===$('#a-email').value.trim().toLowerCase()&&x.pw===$('#a-pw').value&&x.active);
    if(!a){$('#a-err').style.display='block';return}me=a;try{localStorage.setItem(SES,a.email)}catch(e){}log('Signed in','Authentication');boot()};
  $$('[data-fill]').forEach(b=>b.onclick=()=>{const[x,y]=b.dataset.fill.split('|');$('#a-email').value=x;$('#a-pw').value=y})}
function sideLinks(){let g='';return MODS.map(m=>{if(!can(m[0]))return '';const h=m[3]&&m[3]!==g?(g=m[3],`<div class="grp">${m[3]}</div>`):'';return h+`<a href="#${m[0]}" class="${route===m[0]?'on':''}"><span style="width:18px;text-align:center">${m[2]}</span>${m[1]}</a>`}).join('')}
function shell(){
  const first=MODS.find(m=>can(m[0]))?.[0];if(!can(route))route=first||'dashboard';
  $('#root').innerHTML=`<div class="a-shell"><nav class="a-side" id="side"><div class="logo"><img src="logo.svg" alt="">higher.study</div>${sideLinks()}
  <div class="grp">Hidden for your role</div><div style="font-size:12.5px;padding:0 12px;color:#8d7f78">${MODS.filter(m=>!can(m[0])).map(m=>m[1]).join(', ')||'None'}</div></nav>
  <div><div class="a-top"><div class="ml"><button class="btn-s mob-toggle" data-act="menu">☰</button><h2 id="ttl"></h2></div><div class="who"><div><b>${esc(me.name)}</b>${esc(me.role)}</div><a class="btn-s" href="index.html" target="_blank">View site</a><button class="btn-s" data-act="logout">Sign out</button></div></div><main class="a-main" id="main"></main></div></div>`;
  render()}
function render(){const m=MODS.find(x=>x[0]===route);$('#ttl').textContent=m[1];$('#main').innerHTML=can(route)?P[route]():denied();$$('#side a').forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+route))}
function boot(){if(!me){loginView();return}try{if(localStorage.getItem('hs_admin_via')){localStorage.removeItem('hs_admin_via');log('Signed in (from main site login)','Authentication')}}catch(e){}route=(location.hash||'#dashboard').slice(1);if(!P[route])route='dashboard';shell()}
window.addEventListener('hashchange',()=>{if(!me)return;const r=location.hash.slice(1);if(P[r]){route=r;sel.clear();render();$('#side').classList.remove('open')}});

/* ---------- events ---------- */
const refresh=()=>{if(route==='leads'||route==='dashboard'||route==='activity'||route==='students'||route==='counselling'||route==='exams'||route==='questions'||route==='cms'||route==='sheets'||route==='database'||route==='admins'||route==='roles'||route==='audit')render()};
document.addEventListener('input',e=>{const t=e.target;
  if(t.dataset.f==='q'||t.dataset.f==='minMarks'){F[t.dataset.f]=t.value;F.page=1;const pos=t.selectionStart;render();const n=$(`[data-f=${t.dataset.f}]`);if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}}
  if(t.dataset.qf==='q'){QF.q=t.value;const pos=t.selectionStart;render();const n=$('[data-qf=q]');n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}}});
document.addEventListener('change',e=>{const t=e.target;
  if(t.dataset.f&&t.dataset.f!=='q'&&t.dataset.f!=='minMarks'){F[t.dataset.f]=t.value;F.page=1;render()}
  if(t.dataset.qf==='sec'){QF.sec=t.value;render()}
  if(t.dataset.sel){t.checked?sel.add(t.dataset.sel):sel.delete(t.dataset.sel);render()}
  if(t.dataset.perm){const[r,m,a]=t.dataset.perm.split('|');const set=new Set(S.roles[r][m]||[]);t.checked?set.add(a):set.delete(a);S.roles[r][m]=[...set];log(`${t.checked?'Granted':'Revoked'} ${a} on ${m}`,'Roles & Permissions','',r);save()}
  if(t.dataset.act==='pub'){const id=+t.dataset.id;setOv(id,{published:t.checked});log(`${t.checked?'Published':'Unpublished'} exam #${id}`,'Examinations');toast(t.checked?'Published on the website.':'Hidden from the website.')}
  if(t.dataset.act==='selpage'){const L=filtered().slice((F.page-1)*15,F.page*15);L.forEach(l=>t.checked?sel.add(l.leadId):sel.delete(l.leadId));render()}
  if(t.id==='fimp'&&t.files[0]){const fr=new FileReader();fr.onload=()=>importPreview(String(fr.result));fr.readAsText(t.files[0])}});
document.addEventListener('click',e=>{
  const row=e.target.closest('tr[data-id]');const a=e.target.closest('[data-act]');
  if(!a&&row&&!e.target.closest('input,button')&&me&&can('leads')){leadDrawer(row.dataset.id);return}
  if(!a)return;const act=a.dataset.act,id=a.dataset.id;if(a.tagName==='A')e.preventDefault();
  switch(act){
   case'logout':log('Signed out','Authentication');me=null;Object.assign(F,{q:'',date:'all',from:'',to:'',exam:'',stage:'',city:'',source:'',campaign:'',medium:'',keyword:'',conv:'',fu:'',counsellor:'',minMarks:'',page:1});sel.clear();try{localStorage.removeItem(SES)}catch(x){}loginView();break;
   case'menu':$('#side').classList.toggle('open');break;
   case'reset':Object.assign(F,{q:'',date:'all',from:'',to:'',exam:'',stage:'',city:'',source:'',campaign:'',medium:'',keyword:'',conv:'',fu:'',counsellor:'',minMarks:'',page:1});render();break;
   case'prev':F.page--;render();break;case'next':F.page++;render();break;
   case'clearsel':sel.clear();render();break;case'selall':filtered().forEach(l=>sel.add(l.leadId));render();break;
   case'closedr':closeDrawer();break;case'closemodal':closeModal();break;
   case'savelead':{const l=allLeads().find(x=>x.leadId===id);if(!can('leads','edit')&&!can('counselling','edit'))return;const st=$('#d-stage').value,co=$('#d-couns').value,fu=$('#d-fu').value,nt=$('#d-note').value.trim();
     if(st!==l.stage)stageChange(l,st);
     if(co!==l.counsellor){updLead(id,{counsellor:co,manager:co?MGRS[0]:''});S.acts.unshift({leadId:id,type:'assign',to:co||'Unassigned',at:new Date().toISOString(),by:me.name});log(`Assigned lead ${id}`,'Lead Management',l.counsellor||'Unassigned',co||'Unassigned')}
     if(fu!==l.followup){updLead(id,{followup:fu});log(`Set follow-up for ${id}`,'Lead Management',l.followup,fu)}
     if(nt){S.acts.unshift({leadId:id,type:'note',to:nt,at:new Date().toISOString(),by:me.name});log(`Remark on ${id}`,'Lead Management','',nt)}
     save();toast('Lead updated. A new activity record was added.');closeDrawer();render();break}
   case'block':{const l=allLeads().find(x=>x.leadId===id);updLead(id,{blocked:!l.blocked});log(`${l.blocked?'Unblocked':'Blocked'} student ${l.studentId}`,'Students');render();break}
   case'cols':openModal(`<h3>Visible columns</h3><div class="form-g">${COLS.map(c=>`<label style="font-weight:600"><input type="checkbox" data-col="${c[0]}" ${visCols.includes(c[0])?'checked':''}> ${c[1]}</label>`).join('')}<div class="full ml"><button class="btn-s p" data-act="applycols">Apply</button></div></div>`);break;
   case'applycols':visCols=COLS.map(c=>c[0]).filter(k=>$(`[data-col=${k}]`).checked);if(!visCols.length)visCols=['leadId','name'];closeModal();render();break;
   case'export':{const L=filtered();openModal(`<h3>Export leads</h3><div class="form-g"><div class="full"><label>What to export</label><select id="e-scope"><option value="filtered">Filtered leads (${L.length})</option>${sel.size?`<option value="selected">Selected leads (${sel.size})</option>`:''}<option value="today">Today's leads</option><option value="all">All leads (${allLeads().length})</option></select></div>
     <div class="full"><label>Columns &amp; order</label><div id="e-cols" style="border:1px solid var(--line);border-radius:8px;max-height:230px;overflow:auto">${expCols.map(k=>`<div class="ml" style="padding:5px 10px;justify-content:space-between" data-k="${k}"><label style="font-weight:600;margin:0"><input type="checkbox" checked> ${COLS.find(c=>c[0]===k)[1]}</label><span><button class="btn-s" data-act="up" style="padding:2px 8px">▲</button> <button class="btn-s" data-act="down" style="padding:2px 8px">▼</button></span></div>`).join('')}</div></div>
     <div class="full ml"><button class="btn-s p" data-act="doexport">Download CSV</button><button class="btn-s" data-act="closemodal">Cancel</button></div><div class="full" style="font-size:12.5px;color:var(--muted)">CSV opens in Excel. Native .xlsx and background export jobs with progress arrive with the backend.</div></div>`);break}
   case'up':case'down':{const r=a.closest('[data-k]'),sib=act==='up'?r.previousElementSibling:r.nextElementSibling;if(sib)act==='up'?r.parentNode.insertBefore(r,sib):r.parentNode.insertBefore(sib,r);break}
   case'doexport':{const sc=$('#e-scope').value;let L=sc==='filtered'?filtered():sc==='selected'?allLeads().filter(l=>sel.has(l.leadId)):sc==='today'?(()=>{const[a0,b0]=range('today');return allLeads().filter(l=>+new Date(l.regAt)>=a0&&+new Date(l.regAt)<b0)})():allLeads();
     const cols=$$('#e-cols [data-k]').filter(r=>r.querySelector('input').checked).map(r=>r.dataset.k);expCols=$$('#e-cols [data-k]').map(r=>r.dataset.k);
     if(!cols.length){toast('Pick at least one column.','warn');return}
     download(`leads-${new Date().toISOString().slice(0,10)}.csv`,csv(L,cols));log(`Exported ${L.length} leads (${sc})`,'Lead Management','',cols.length+' columns');closeModal();toast(`Exported ${L.length} leads.`);break}
   case'newexam':examForm();break;case'editexam':examForm(examList().find(x=>x.id===+id));break;
   case'saveexam':{const g=k=>$('#'+k).value,p={title:g('x-title').trim(),description:g('x-desc').trim(),category:g('x-cat'),difficulty:g('x-diff'),duration:+g('x-dur'),totalQuestions:+g('x-q'),totalMarks:+g('x-m'),free:g('x-free')==='1'};
     if(!p.title){toast('Enter a name.','warn');return}
     if(id){setOv(+id,p);log(`Edited exam #${id}`,'Examinations','',p.title)}
     else{const nw=JSON.parse(localStorage.getItem('hs_exam_new')||'[]'),n=Object.assign({id:100+nw.length+Math.floor(Math.random()*900),slug:p.title.toLowerCase().replace(/\W+/g,'-'),attempts:1,available:false,published:true},p);nw.push(n);localStorage.setItem('hs_exam_new',JSON.stringify(nw));log('Created exam',  'Examinations','',p.title)}
     closeModal();toast('Saved. Refresh the website to see it.');render();break}
   case'dupexam':{const e=examList().find(x=>x.id===+id),nw=JSON.parse(localStorage.getItem('hs_exam_new')||'[]'),c=Object.assign({},e,{id:100+nw.length+Math.floor(Math.random()*900),title:e.title+' (Copy)',available:false,published:false});nw.push(c);localStorage.setItem('hs_exam_new',JSON.stringify(nw));log('Duplicated exam',  'Examinations',e.title,c.title);render();break}
   case'delexam':setOv(+id,{deleted:true});log(`Deleted exam #${id}`,'Examinations');render();break;
   case'newq':qForm();break;
   case'saveq':{const t=$('#q-text').value.trim(),ans=$('#q-ans').value.trim();if(!t||!ans){toast('Question and answer are required.','warn');return}
     S.questions.push({id:1000+S.questions.length,section:$('#q-sec').value,type:$('#q-type').value,q:t,marks:3,neg:$('#q-type').value==='MCQ'?-1:0,src:'Added by '+me.name});log('Added question','Question Bank','',t.slice(0,60));save();closeModal();render();break}
   case'importq':openModal(`<h3>Import questions (CSV)</h3><p style="color:var(--muted);font-size:14px">Columns: section, type, question, option_a, option_b, option_c, option_d, answer, marks, negative, explanation. You will see a preview before anything is saved.</p><input type="file" id="fimp" accept=".csv" class="fi" style="width:100%"><div class="ml" style="margin-top:12px"><button class="btn-s" data-act="tplq">Download sample template</button><button class="btn-s" data-act="closemodal">Cancel</button></div>`);break;
   case'doimport':pend.forEach((o,i)=>S.questions.push({id:2000+S.questions.length,section:o.section,type:o.type,q:o.q,marks:o.marks,neg:o.neg,src:'Imported'}));log(`Imported ${pend.length} questions`,'Question Bank','',pend.length+' rows');save();toast(`Imported ${pend.length} questions.`);pend=[];closeModal();render();break;
   case'tplq':download('question-template.csv','section,type,question,option_a,option_b,option_c,option_d,answer,marks,negative,explanation\r\nQA,MCQ,"What is 12 + 8?",18,19,20,21,C,3,-1,"12 + 8 = 20"\r\nQA,TITA,"What is 15 x 4?",,,,,60,3,0,"15 x 4 = 60"\r\n');break;
   case'exportq':download('questions.csv',[['id','section','type','question','marks','negative'],...BANK().map(x=>[x.id,x.section,x.type,x.q,x.marks,x.neg])].map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\r\n'));log('Exported questions','Question Bank');break;
   case'savecms':{const c={heroPre:$('#c-pre').value,heroEm:$('#c-em').value,heroText:$('#c-text').value,footerText:$('#c-foot').value,contactEmail:$('#c-mail').value,banner:{on:$('#c-ban').checked,text:$('#c-bantext').value},
      menu:$('#c-menu').value.split('\n').map(l=>l.split('|').map(x=>x.trim())).filter(p=>p[0]).map(p=>({t:p[0],dd:p[1]==='1'?1:0,badge:p[2]||undefined}))};
     try{localStorage.setItem('hs_cms',JSON.stringify(c))}catch(x){}log('Updated website content','Website CMS');toast('Published. Refresh the website to see it.');break}
   case'resetcms':try{localStorage.removeItem('hs_cms')}catch(x){}log('Reset website content','Website CMS');render();break;
   case'sh-ping':{$('#ping-out').textContent='Testing…';HS.sheet.ping().then(r=>{$('#ping-out').textContent=r.ok?`Connected to "${r.name}". Tabs: ${r.tabs.join(', ')}. Cells used: ${r.cells} of ${r.maxCells}.`:'Not connected: '+(r.error||'unknown error')});break}
   case'sh-flush':HS.sheet.flush().then(()=>setTimeout(render,600));break;
   case'sh-test':S.sheets.log.unshift(`${new Date().toISOString()}  Test connection: ${S.sheets.connected?'OK (simulated)':'FAILED – service account unreachable (simulated)'}`);save();render();break;
   case'sh-sync':if(!S.sheets.connected){toast('Disconnected. Records stay pending in MySQL.','warn');break}S.sheets.synced+=S.sheets.pending;S.sheets.log.unshift(`${new Date().toISOString()}  Synced ${S.sheets.pending} pending records`);S.sheets.pending=0;S.sheets.lastSync=new Date().toISOString();log('Sync pending records','Google Sheets');save();render();break;
   case'sh-retry':if(!S.sheets.connected){toast('Disconnected.','warn');break}S.sheets.synced+=S.sheets.failed;S.sheets.log.unshift(`${new Date().toISOString()}  Retried ${S.sheets.failed} failed records (backoff 2s, 4s) → OK`);S.sheets.failed=0;save();render();break;
   case'sh-restore':S.sheets.log.unshift(`${new Date().toISOString()}  Restore: re-copied ${allLeads().length} leads from MySQL to sheet tabs. MySQL unchanged.`);log('Restore Google Sheets','Google Sheets');save();render();break;
   case'sh-toggle':S.sheets.connected=!S.sheets.connected;S.sheets.log.unshift(`${new Date().toISOString()}  ${S.sheets.connected?'Reconnected; pending records will sync':'Disconnected (simulated). Website keeps working; new records queue as pending'}`);save();render();break;
   case'backup':{const d=JSON.stringify({exportedAt:new Date().toISOString(),leads:allLeads(),admins:S.admins.map(a=>({name:a.name,email:a.email,role:a.role})),audit:S.audit});download(`hs-backup-${Date.now()}.json`,d,'application/json');S.backups.unshift({at:new Date().toISOString(),by:me.name,size:Math.round(d.length/1024)});log('Database backup downloaded','Database');save();render();break}
   case'newadmin':openModal(`<h3>Create administrator</h3><div class="form-g"><div><label>Name</label><input id="n-name"></div><div><label>Email</label><input id="n-email" type="email"></div><div><label>Password</label><input id="n-pw" value="Welcome@123"></div><div><label>Role</label><select id="n-role">${Object.keys(S.roles).map(r=>`<option>${r}</option>`).join('')}</select></div><div class="full ml"><button class="btn-s p" data-act="saveadmin">Create</button><button class="btn-s" data-act="closemodal">Cancel</button></div></div>`);break;
   case'saveadmin':{const n=$('#n-name').value.trim(),m=$('#n-email').value.trim().toLowerCase(),p=$('#n-pw').value;if(!n||!/^\S+@\S+\.\S+$/.test(m)||p.length<8){toast('Enter a name, valid email and an 8+ character password.','warn');return}
     if(S.admins.some(x=>x.email===m)){toast('That email already exists.','warn');return}S.admins.push({id:Math.max(...S.admins.map(x=>x.id))+1,name:n,email:m,pw:p,role:$('#n-role').value,active:true});log('Created administrator','Admin Users','',`${n} (${$('#n-role').value})`);save();closeModal();render();break}
   case'admtoggle':{const x=S.admins.find(v=>v.id===+id);x.active=!x.active;log(`${x.active?'Activated':'Deactivated'} administrator`,'Admin Users','',x.email);save();render();break}
   case'admreset':{const x=S.admins.find(v=>v.id===+id);x.pw='Reset@'+Math.floor(1000+Math.random()*9000);log('Reset administrator password','Admin Users','',x.email);save();openModal(`<h3>Password reset</h3><p>Temporary password for <b>${esc(x.email)}</b>:</p><p style="font-size:20px;font-weight:800">${x.pw}</p><button class="btn-s p" data-act="closemodal">Done</button>`);break}
   case'newrole':openModal(`<h3>Custom role</h3><div class="form-g"><div class="full"><label>Role name</label><input id="r-name"></div><div class="full ml"><button class="btn-s p" data-act="saverole">Create</button><button class="btn-s" data-act="closemodal">Cancel</button></div></div>`);break;
   case'saverole':{const n=$('#r-name').value.trim();if(!n||S.roles[n]){toast('Enter a unique role name.','warn');return}S.roles[n]=only({dashboard:['view']});log('Created role','Roles & Permissions','',n);save();closeModal();render();break}
  }});
window.HSA={leadDrawer,S:()=>S,me:()=>me,can,log,save,render:()=>render(),openModal,closeModal,download,toast,dt,dd,P,MODS,ACTS,allLeads,F,boot,STAGES,esc,csv:null,route:()=>route,go:r=>{location.hash='#'+r}};
if(!window.HSA_DEFER)boot();
})();
