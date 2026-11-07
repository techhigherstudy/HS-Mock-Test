/* HS — shared helpers: layout (header/footer), toasts, modals, tracking */
window.HS=window.HS||{};
(function(){
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
HS.$=$;HS.$$=$$;
HS.esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
HS.icons={
 chev:'<svg class="chev" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m2 4 4 4 4-4"/></svg>',
 search:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
 eye:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
 eyeoff:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 3l18 18M10.6 6.2A9.8 9.8 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.4 7.6C3.9 9.3 2 12 2 12s3.6 7 10 7c1.6 0 3-.4 4.3-1"/></svg>',
 lock:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>',
 user:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>'
};
/* ---- marketing attribution: first touch + latest touch, kept across pages in this browser (backend: stored on the lead in MySQL) ---- */
HS.attr=(function(){
  const FK='hs_touch_first',LK='hs_touch_last',PK=['utm_source','utm_medium','utm_campaign','utm_id','utm_term','utm_content','gclid','gbraid','wbraid','fbclid'];
  const jget=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},jset=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}};
  const dev=()=>/Tablet|iPad/i.test(navigator.userAgent)?'Tablet':/Mobi|Android/i.test(navigator.userAgent)?'Mobile':'Desktop';
  const br=()=>{const u=navigator.userAgent;return /Edg\//.test(u)?'Edge':/OPR\//.test(u)?'Opera':/Chrome\//.test(u)?'Chrome':/Firefox\//.test(u)?'Firefox':/Safari\//.test(u)?'Safari':'Other'};
  function params(){const q=new URLSearchParams(location.search),o={};PK.forEach(k=>{const v=q.get(k);if(v)o[k]=v.slice(0,200)});return o}
  function refInfo(){let r=document.referrer||'';if(!r)return {host:'',external:false};try{const h=new URL(r).hostname;return {host:h,external:h!==location.hostname}}catch(e){return {host:'',external:false}}}
  function build(p,ref){
    const paid=p.gclid||p.gbraid||p.wbraid;
    let source=p.utm_source,medium=p.utm_medium;
    if(!source){if(paid)source='google';else if(p.fbclid)source='facebook';else if(ref.external){source=/google\./.test(ref.host)?'google':/bing\./.test(ref.host)?'bing':/yahoo\./.test(ref.host)?'yahoo':/duckduckgo\./.test(ref.host)?'duckduckgo':ref.host}}
    if(!medium){if(paid)medium='cpc';else if(p.fbclid)medium='paid-social';else if(ref.external)medium=/google\.|bing\.|yahoo\.|duckduckgo\./.test(ref.host)?'organic':'referral'}
    return {source:source||'direct',medium:medium||'none',campaign:p.utm_campaign||'',campaign_id:p.utm_id||'',term:p.utm_term||'',content:p.utm_content||'',gclid:p.gclid||'',gbraid:p.gbraid||'',wbraid:p.wbraid||'',fbclid:p.fbclid||'',
      landing:location.href.slice(0,500),referrer:(document.referrer||'').slice(0,500),at:new Date().toISOString()};
  }
  function capture(){
    const p=params(),ref=refInfo(),has=Object.keys(p).length>0||ref.external,t=build(p,ref);
    if(!jget(FK))jset(FK,t);
    if(has||!jget(LK))jset(LK,t);                         // internal navigation never overwrites a real source
  }
  capture();
  return {first:()=>jget(FK)||{},last:()=>jget(LK)||{},device:dev,browser:br,
    snapshot(){return {first:jget(FK)||{},last:jget(LK)||{},landing:(jget(FK)||{}).landing||location.href,referrer:(jget(FK)||{}).referrer||document.referrer||'',device:dev(),browser:br()}},
    utm(t){t=t||{};return {utm_source:t.source,utm_medium:t.medium,utm_campaign:t.campaign,utm_term:t.term,utm_content:t.content,gclid:t.gclid}}};
})();
/* ---- consent + Google Ads conversion (fires once per student, only after consent, never sends personal data) ---- */
HS.consent={get(){try{return localStorage.getItem('hs_consent')}catch(e){return null}},set(v){try{localStorage.setItem('hs_consent',v)}catch(e){}},
  banner(){
    if(this.get()||document.getElementById('hs-consent')||/admin|exam\.html/.test(location.pathname))return;
    const d=document.createElement('div');d.id='hs-consent';d.className='consent';
    d.innerHTML='<p>We use cookies and similar storage to remember your progress and, with your permission, to measure which ads lead to registrations. No personal details are sent to advertising platforms.</p><div><button class="btn btn-ghost" data-c="denied">Decline</button><button class="btn btn-primary" data-c="granted">Accept</button></div>';
    d.onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;HS.consent.set(b.dataset.c);d.remove()};
    document.body.appendChild(d)}};
HS.ads={conversion(u){
  const c=HS.cfg();if(!c.GADS_ID||!c.GADS_LABEL||HS.consent.get()!=='granted'||!u)return;
  let fired=[];try{fired=JSON.parse(localStorage.getItem('hs_ads_fired')||'[]')}catch(e){}
  if(fired.includes(u.leadId))return;fired.push(u.leadId);try{localStorage.setItem('hs_ads_fired',JSON.stringify(fired.slice(-500)))}catch(e){}
  if(!window.gtag){window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(c.GADS_ID);document.head.appendChild(s);gtag('js',new Date());gtag('config',c.GADS_ID)}
  gtag('event','conversion',{send_to:c.GADS_ID+'/'+c.GADS_LABEL,transaction_id:u.leadId})}};   // transaction_id lets Google drop duplicates
/* ---- lead/event tracking (backend: POST /api/events → lead_activities, never overwritten) ---- */
HS.track=function(type,extra){
  try{const k='hs_events';const ev=JSON.parse(localStorage.getItem(k)||'[]');
  ev.push({id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,page:location.pathname,at:new Date().toISOString(),extra:extra||null});
  localStorage.setItem(k,JSON.stringify(ev.slice(-300)));}catch(e){}
  try{HS.sheet&&HS.sheet.event(type,extra)}catch(e){}
};
/* ---- toast ---- */
HS.toast=function(msg,kind){
  let w=$('.toast-wrap');if(!w){w=document.createElement('div');w.className='toast-wrap';document.body.appendChild(w)}
  const t=document.createElement('div');t.className='toast '+(kind||'');t.innerHTML=`<i>${kind==='warn'?'!':'✓'}</i><span>${HS.esc(msg)}</span>`;
  w.appendChild(t);setTimeout(()=>{t.style.opacity=0;t.style.transition='.3s';setTimeout(()=>t.remove(),300)},2800);
};
/* ---- simple modal helpers ---- */
HS.openModal=id=>{const o=document.getElementById(id);if(o){o.classList.add('open');document.body.style.overflow='hidden'}};
HS.closeModal=id=>{const o=document.getElementById(id);if(o){o.classList.remove('open');document.body.style.overflow=''}};
/* ---- site header / footer (becomes Blade partials, menu from CMS) ---- */
HS.cmsDefault={heroPre:'Prepare for CAT with',heroEm:'online mock tests',heroText:'Practice with realistic mock examinations, improve your preparation, evaluate your performance and identify areas for improvement.',
 menu:[{t:'Colleges',href:'https://higher.study/colleges'},{t:'Courses',href:'https://higher.study/courses'},{t:'Exams',href:'https://higher.study/exams'},{t:'Blog',href:'https://higher.study/blog'},{t:'Free Resources',badge:'FREE',href:'#'},{t:'Tools',dd:1,href:'#'}],
 footerText:'Realistic mock tests, instant analysis and free counselling to help you get into your dream college.',contactEmail:'support@higher.study',banner:{on:false,text:''}};
HS.cms=function(){try{return Object.assign({},HS.cmsDefault,JSON.parse(localStorage.getItem('hs_cms')||'{}'))}catch(e){return HS.cmsDefault}};
HS.menu=HS.cms().menu.map(m=>{const d=HS.cmsDefault.menu.find(x=>x.t===m.t);return Object.assign({},m,m.href?{}:{href:d&&d.href||'#'})});
HS.ADMINS0=[{id:1,name:'Super Admin',email:'admin@higher.study',pw:'Admin@12345',role:'Super Admin',active:true},
 {id:2,name:'Priya (Content)',email:'content@higher.study',pw:'Content@12345',role:'Content Manager',active:true},
 {id:3,name:'Rahul (Leads)',email:'leads@higher.study',pw:'Leads@12345',role:'Lead Manager',active:true}];
/* Admin sign-in from the main login popup. Reads the same admin list the panel uses (includes admins created in the panel). Backend phase: one /login endpoint returns the role. */
HS.adminAuth=function(id,pw){try{const st=JSON.parse(localStorage.getItem('hs_admin_v2')||'null'),list=(st&&st.admins)||HS.ADMINS0;
  const a=list.find(x=>x.email.toLowerCase()===String(id).trim().toLowerCase()&&x.pw===pw&&x.active);
  if(a){localStorage.setItem('hs_admin_session',a.email);localStorage.setItem('hs_admin_via','main');return a}}catch(e){}return null};
HS.counsellingUrl=()=>(window.HS_CONFIG&&HS_CONFIG.COUNSELLING_URL)||'https://higher.study/enquiry/admissions-2026';
HS.isExternal=u=>/^https?:\/\//i.test(u)&&!u.startsWith(location.origin);
HS.GROUPS={'free resources':'resources','tools':'tools'};
HS.menuItems=g=>{try{return HS.db.all('menu').filter(m=>m.group===g&&m.visible).sort((a,b)=>a.order-b.order)}catch(e){return[]}};
HS.header=function(crumbs){
  const u=HS.api&&HS.api.me();
  const nav=HS.menu.map(m=>{const g=HS.GROUPS[String(m.t).toLowerCase()],kids=g?HS.menuItems(g):[];
    const badge=m.badge?`<span class="badge-free">${HS.esc(m.badge)}</span>`:'';
    if(kids.length)return `<div class="dd"><a href="#" class="dd-t" aria-haspopup="true" aria-expanded="false">${HS.esc(m.t)}${badge}${HS.icons.chev}</a><div class="dd-menu">${kids.map(k=>`<a href="${HS.esc(k.href)}"${HS.isExternal(k.href)?' target="_blank" rel="noopener"':''}>${HS.esc(k.label)}</a>`).join('')}</div></div>`;
    return `<a href="${HS.esc(m.href||'#')}"${HS.isExternal(m.href||'')?' target="_blank" rel="noopener"':''}>${HS.esc(m.t)}${badge}</a>`}).join('');
  let adm=null;try{adm=localStorage.getItem('hs_admin_session')}catch(e){}
  const admBtn=adm?`<a class="btn btn-outline" href="admin.html">Admin panel</a>`:'';
  const right=admBtn+(u?`<a class="btn btn-outline" href="dashboard.html">My dashboard</a><a href="#" id="signout" style="font-weight:600">Sign out</a>`:`<button class="btn btn-primary btn-lg" data-open-register style="padding:14px 28px">Login / Register</button>`);
  const cr=(crumbs||[]).map((c,i)=>i===crumbs.length-1?`<span class="cur">${HS.esc(c[0])}</span>`:`<a href="${c[1]||'#'}">${HS.esc(c[0])}</a><span>›</span>`).join('');
  const bn=HS.cms().banner;document.getElementById('site-header').innerHTML=(bn&&bn.on&&bn.text?`<div style="background:var(--yellow);color:#4a2a00;text-align:center;padding:8px 16px;font-weight:700;font-size:14px">${HS.esc(bn.text)}</div>`:'')+`
  <header class="site-header"><div class="container bar">
    <a class="brand" href="index.html"><img src="logo.svg" alt="higher.study logo"><span>higher.study</span></a>
    <nav class="nav" id="nav">${nav}</nav>
    <div class="header-actions">${right}<button class="icon-btn hide-sm" aria-label="Search">${HS.icons.search}</button><button class="icon-btn hamburger" id="burger" aria-label="Menu"><svg width="26" height="26" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.2" fill="none"><path d="M3 6h18M3 12h18M3 18h18"/></svg></button></div>
  </div></header>
  <div class="crumbs"><div class="container">${cr}</div></div>`;
  $('#burger').onclick=()=>$('#nav').classList.toggle('open');
  $$('.dd-t').forEach(t=>t.onclick=e=>{e.preventDefault();e.stopPropagation();const d=t.parentElement,o=!d.classList.contains('open');$$('.dd.open').forEach(x=>x.classList.remove('open'));d.classList.toggle('open',o);t.setAttribute('aria-expanded',o)});
  document.addEventListener('click',e=>{if(!e.target.closest('.dd'))$$('.dd.open').forEach(x=>x.classList.remove('open'))});
  const so=$('#signout');if(so)so.onclick=e=>{e.preventDefault();HS.api.logout();location.href='index.html'};
  HS.consent.banner();
};
HS.footer=function(){
  const el=document.getElementById('site-footer');if(!el)return;
  el.innerHTML=`<footer class="site-footer"><div class="container"><div class="cols">
   <div><h4>higher.study</h4><p>${HS.esc(HS.cms().footerText)}</p><p>${HS.esc(HS.cms().contactEmail)}</p></div>
   <div><h4>Free Resources</h4>${HS.menuItems('resources').map(k=>`<a href="${HS.esc(k.href)}">${HS.esc(k.label)}</a>`).join('')}</div>
   <div><h4>Tools</h4>${HS.menuItems('tools').map(k=>`<a href="${HS.esc(k.href)}">${HS.esc(k.label)}</a>`).join('')}<a href="https://higher.study/blog" target="_blank" rel="noopener">Blog</a></div>
   <div><h4>Company</h4><a href="#">About</a><a href="#">Contact</a><a href="#">Terms</a><a href="#">Privacy Policy</a></div>
  </div><div class="copy">\u00a9 ${new Date().getFullYear()} higher.study. All rights reserved.</div></div></footer>`;
};
HS.fmt=sec=>{sec=Math.max(0,Math.floor(sec));const h=String(Math.floor(sec/3600)).padStart(2,'0'),m=String(Math.floor(sec%3600/60)).padStart(2,'0'),s=String(sec%60).padStart(2,'0');return `${h}:${m}:${s}`};


})();

/* ---------- Google Sheets copy (secondary). Queue -> Apps Script web app. MySQL stays primary in the backend phase. ---------- */
HS.cfg=()=>window.HS_CONFIG||{};
HS.sid=()=>{try{let s=localStorage.getItem('hs_sid');if(!s){s='S'+Date.now().toString(36)+Math.random().toString(36).slice(2,8);localStorage.setItem('hs_sid',s)}return s}catch(e){return'anon'}};
HS.sheet=(function(){
  const QK='hs_sheet_q',SK='hs_sheet_state';
  const gq=()=>{try{return JSON.parse(localStorage.getItem(QK)||'[]')}catch(e){return[]}};
  const sq=q=>{try{localStorage.setItem(QK,JSON.stringify(q.slice(-1000)))}catch(e){}};
  const gs=()=>{try{return JSON.parse(localStorage.getItem(SK)||'{}')}catch(e){return{}}};
  const ss=o=>{try{localStorage.setItem(SK,JSON.stringify(Object.assign(gs(),o)))}catch(e){}};
  let busy=false;
  const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
  async function flush(force){
    const c=HS.cfg(),q=gq();if(!c.SHEETS_URL||!q.length||busy)return;
    const st=gs();if(!force&&st.nextTry&&Date.now()<st.nextTry)return;
    busy=true;const batch=q.slice(0,25),body=JSON.stringify({token:c.SHEETS_TOKEN,items:batch}),hdr={'Content-Type':'text/plain;charset=utf-8'};
    try{
      let res=null,mode='confirmed';
      try{res=await fetch(c.SHEETS_URL,{method:'POST',headers:hdr,body,keepalive:true})}catch(e){res=null}   // readable reply: lets us see "unauthorized" etc.
      if(res){let j=null;try{j=await res.json()}catch(e){}
        if(j&&j.ok===false)throw new Error('The sheet rejected the data: '+(j.error||'unknown error'));}
      else{await fetch(c.SHEETS_URL,{method:'POST',mode:'no-cors',headers:hdr,body,keepalive:true});mode='unconfirmed'}  // reply unreadable; unique ids make a repeat harmless
      const done=new Set(batch.map(b=>b.eid));sq(gq().filter(b=>!done.has(b.eid)));
      ss({fails:0,nextTry:0,lastOk:new Date().toISOString(),sent:(gs().sent||0)+batch.length,lastErr:'',mode});busy=false;if(gq().length)setTimeout(flush,250);
    }catch(e){const f=(gs().fails||0)+1;ss({fails:f,nextTry:Date.now()+Math.min(300000,2000*Math.pow(2,f)),lastErr:String(e&&e.message||e)});busy=false}
  }
  function send(tab,data,opt){opt=opt||{};const q=gq();q.push({eid:opt.id||tab+'-'+uid(),tab,mode:opt.mode||'append',data,at:new Date().toISOString()});sq(q);flush()}
  const me=()=>{try{return window.HS&&HS.api&&HS.api.me()}catch(e){return null}};
  const exName=id=>{try{return id?HS.db.examName(id):''}catch(e){return''}};
  const STAGE={website_visited:'Website Visited',start_test_clicked:'Start Test Clicked',registration_popup_opened:'Registration Popup Opened',registration_started:'Registration Started',registration_completed:'Registration Completed',instructions_viewed:'Instructions Viewed',exam_started:'Examination Started',exam_submitted:'Examination Submitted',result_viewed:'Result Viewed',counselling_button_clicked:'Counselling Button Clicked'};
  function attrCols(u){const A=(u&&u.attr)||{},F=A.first||{},L=A.last||{};
    return {source:L.source||'direct',utm_source:L.source||'direct',utm_medium:L.medium||'none',utm_campaign:L.campaign||'none',campaign_id:L.campaign_id||'',utm_term:L.term||'',utm_content:L.content||'',gclid:L.gclid||'',gbraid:L.gbraid||'',wbraid:L.wbraid||'',fbclid:L.fbclid||'',
      first_source:F.source||'',first_medium:F.medium||'',first_campaign:F.campaign||'',landing_page:A.landing||'',referrer:A.referrer||'',exam_selected:exName(A.examId||u&&u.examId),device:A.device||'',browser:A.browser||''}}
  function lead(stage,examName,extra){const u=me();if(!u)return;
    send('All_Leads',Object.assign({lead_id:u.leadId,student_id:u.studentId,name:u.name,mobile:u.mobile,email:u.email,registered_at:u.at,stage,exam:examName||'',updated_at:new Date().toISOString()},attrCols(u),extra||{}),{id:u.leadId,mode:'upsert'})}
  function event(type,extra){
    if(type==='question_answered'||!STAGE[type])return;
    const u=me(),ex=(extra&&extra.exam)||'';
    if(type==='website_visited'){try{if(sessionStorage.getItem('hs_v'))return;sessionStorage.setItem('hs_v','1')}catch(e){}
      const L=HS.attr.last();send('Website_Visitors',{session_id:HS.sid(),page:location.pathname,event_type:type,source:L.source||'direct',utm_source:L.source||'direct',utm_medium:L.medium||'none',utm_campaign:L.campaign||'none',gclid:L.gclid||'',device:HS.attr.device(),browser:HS.attr.browser()});return}
    const row={event_time:new Date().toISOString(),lead_id:u?u.leadId:'',student_id:u?u.studentId:'',session_id:HS.sid(),exam:ex,event_type:type,stage:STAGE[type],page:location.pathname,source:HS.attr.last().source||'direct',device:HS.attr.device()};
    send('Lead_Stages',row);
    if(type==='exam_started'||type==='exam_submitted')send('Exam_Activity',{event_time:row.event_time,lead_id:row.lead_id,student_id:row.student_id,exam:ex,event_type:type,session_id:row.session_id});
    if(type==='registration_completed'&&u)send('Registrations',Object.assign({lead_id:u.leadId,student_id:u.studentId,name:u.name,mobile:u.mobile,email:u.email,registered_at:u.at},attrCols(u)),{id:'REG-'+u.leadId,mode:'upsert'});
    if(['registration_completed','exam_started','exam_submitted','result_viewed','instructions_viewed'].includes(type))lead(STAGE[type],ex);
  }
  function results(at,rows){const u=me()||{},r=at.result,ex=exName(at.examId),secs={};r.sections.forEach(s=>secs[String(s.name).replace(/\W+/g,'_')+'_marks']=s.marks);
    send('Exam_Results',Object.assign({attempt_id:at.id,lead_id:u.leadId||'',student_id:u.studentId||'',name:u.name||'',exam:ex,marks:r.marks,max_marks:r.max,percentage:r.percentage,attempted:r.attempted,correct:r.correct,wrong:r.wrong,accuracy:r.accuracy,time_taken_sec:r.timeTakenSec,submitted_at:new Date(at.submittedAt).toISOString()},secs),{id:'RES-'+at.id,mode:'upsert'});
    (rows||[]).forEach(x=>send('Exam_Responses',Object.assign({attempt_id:at.id,lead_id:u.leadId||'',exam:ex},x),{id:'RSP-'+at.id+'-'+x.question_no,mode:'upsert'}));}
  async function ping(){const c=HS.cfg();if(!c.SHEETS_URL)return{ok:false,error:'SHEETS_URL is empty in config.js'};
    try{const r=await fetch(c.SHEETS_URL+(c.SHEETS_URL.includes('?')?'&':'?')+'action=ping&token='+encodeURIComponent(c.SHEETS_TOKEN));return await r.json()}catch(e){return{ok:false,error:'Could not read the reply (browser blocked it or the URL is wrong). Check the sheet for new rows instead.'}}}
  return {send,flush:()=>flush(true),event,lead,results,ping,status:()=>Object.assign({configured:!!HS.cfg().SHEETS_URL,pending:gq().length,sent:0,fails:0},gs())};
})();
setTimeout(()=>{try{HS.sheet.flush()}catch(e){}},1500);
window.addEventListener('online',()=>{try{HS.sheet.flush()}catch(e){}});
