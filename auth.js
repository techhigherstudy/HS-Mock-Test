/* Shared login / register popup + "start this exam" routing. Used by every public page. */
(function(){
const {$,$$,esc}=HS;let mode='register',ctx={},injected=false,started=false;

function inject(){
  if(injected)return;injected=true;
  const d=document.createElement('div');
  d.innerHTML=`<div class="overlay" id="reg-overlay" role="dialog" aria-modal="true" aria-labelledby="reg-title"><div class="modal">
    <div class="modal-head"><h3 id="reg-title"></h3><p id="reg-sub"></p><button class="modal-x" data-close aria-label="Close">×</button></div>
    <form class="modal-body" id="reg-form" novalidate>
      <div class="field" data-f="name"><label for="f-name">Full name</label><input id="f-name" type="text" autocomplete="name" placeholder="Your full name"><div class="msg">Please enter your full name.</div></div>
      <div class="field" data-f="mobile"><label for="f-mobile">Mobile number</label><input id="f-mobile" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit mobile number"><div class="msg">Enter a valid 10-digit mobile number.</div></div>
      <div class="field" data-f="email"><label for="f-email">Email address</label><input id="f-email" type="email" autocomplete="email" placeholder="you@example.com"><div class="msg">Enter a valid email address.</div></div>
      <div class="field" data-f="password"><label for="f-pw"><span id="pw-label"></span></label><div class="pw"><input id="f-pw" type="password" autocomplete="new-password" placeholder="Create a strong password"><button type="button" id="pw-toggle" aria-label="Show password"></button></div><div class="msg">Use at least 8 characters.</div></div>
      <div id="reg-checks">
        <label class="check"><input type="checkbox" id="f-terms"><span>I agree to the <a href="#">Terms</a> &amp; <a href="#">Privacy Policy</a> and to receive counseling updates</span></label>
        <label class="check"><input type="checkbox" id="f-wa"><span>Send me exam updates and offers on WhatsApp</span></label>
        <div class="field" data-f="terms" style="margin:-4px 0 8px"><div class="msg">Please accept the Terms to continue.</div></div>
      </div>
      <button class="btn btn-yellow btn-lg" id="reg-submit" type="submit">Start Test</button>
      <div class="modal-foot-link" id="reg-switch"></div>
    </form></div></div>`;
  document.body.appendChild(d.firstElementChild);
  $('#pw-toggle').innerHTML=HS.icons.eye;
  $('#pw-toggle').onclick=()=>{const p=$('#f-pw'),h=p.type==='password';p.type=h?'text':'password';$('#pw-toggle').innerHTML=h?HS.icons.eyeoff:HS.icons.eye};
  $('#f-mobile').addEventListener('input',e=>e.target.value=e.target.value.replace(/\D/g,''));
  $('#reg-overlay').addEventListener('click',e=>{if(e.target.id==='reg-overlay'||e.target.closest('[data-close]'))HS.closeModal('reg-overlay');if(e.target.id==='switch-link')setMode(mode==='register'?'login':'register')});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')HS.closeModal('reg-overlay')});
  $('#reg-form').addEventListener('change',e=>{if(e.target.id==='f-terms')$('[data-f=terms]').classList.remove('err')});
  $('#reg-form').addEventListener('input',e=>{const f=e.target.closest('.field');if(f)f.classList.remove('err');if(!started){started=true;HS.track('registration_started',{exam:examTitle()})}});
  $('#reg-form').addEventListener('submit',submit);
}
const examTitle=()=>ctx.examId?HS.db.examName(ctx.examId):'';
function setMode(m){
  mode=m;const reg=m==='register',t=examTitle();
  $('#reg-title').textContent=reg?(t?`Register to attempt ${t}`:'Register to start your free mock test'):'Log in to your account';
  $('#reg-sub').textContent=reg?'All fields are required. Already registered? Log in below.':'Use your registered email or mobile number.';
  ['name','mobile'].forEach(f=>$(`[data-f=${f}]`).style.display=reg?'':'none');
  $('[data-f=email] label').textContent=reg?'Email address':'Email or mobile number';
  $('#f-email').type=reg?'email':'text';$('#f-email').placeholder=reg?'you@example.com':'Email or 10-digit mobile';
  $('#pw-label').textContent=reg?'Password (only to log back in and view your result)':'Password';
  $('#f-pw').autocomplete=reg?'new-password':'current-password';
  $('#reg-checks').style.display=reg?'':'none';
  $('#reg-submit').textContent=reg?'Start Test':'Log in';
  $('#reg-switch').innerHTML=reg?'Already registered? <a id="switch-link">Log in</a>':'New here? <a id="switch-link">Register</a>';
  $$('#reg-form .field').forEach(f=>f.classList.remove('err'));
}
function flag(f,bad,msg){const el=$(`[data-f=${f}]`);el.classList.toggle('err',bad);if(msg&&bad)el.querySelector('.msg').textContent=msg;return bad}
async function submit(e){
  e.preventDefault();const btn=$('#reg-submit'),pw=$('#f-pw');
  const v={name:$('#f-name').value.trim(),mobile:$('#f-mobile').value.trim(),email:$('#f-email').value.trim(),password:pw.value};
  let bad=false;
  if(mode==='register'){bad|=flag('name',v.name.length<2);bad|=flag('mobile',!/^[6-9]\d{9}$/.test(v.mobile));bad|=flag('email',!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email));bad|=flag('password',v.password.length<8);bad|=flag('terms',!$('#f-terms').checked)}
  else{bad|=flag('email',!v.email,'Enter your email or mobile.');bad|=flag('password',!v.password,'Enter your password.')}
  if(bad)return;
  btn.disabled=true;const old=btn.textContent;btn.textContent=mode==='register'?'Saving your details…':'Logging in…';btn.style.opacity=.6;
  try{
    if(mode==='register'){await HS.api.register({name:v.name,mobile:v.mobile,email:v.email,password:v.password,examId:ctx.examId||0});HS.toast('Details saved.')}
    else{const adm=HS.adminAuth(v.email,v.password);if(adm){HS.toast('Welcome, '+adm.name+'. Opening the admin panel…');setTimeout(()=>location.href='admin.html',500);return}
      await HS.api.login({id:v.email,password:v.password});HS.toast('Welcome back!')}
    setTimeout(()=>{if(ctx.examId)HS.goExam(ctx.examId);else if(ctx.next)location.href=ctx.next;else location.href='dashboard.html'},500);
  }catch(err){flag(err.field||'email',true,err.message||'Something went wrong.');btn.disabled=false;btn.textContent=old;btn.style.opacity=1}
}
HS.auth={open(m,c){inject();ctx=c||{};setMode(m||'register');HS.track('registration_popup_opened',{exam:examTitle()});HS.openModal('reg-overlay');setTimeout(()=>$(m==='login'?'#f-email':'#f-name').focus(),50)}};
document.addEventListener('click',e=>{if(e.target.closest('[data-open-register]')){e.preventDefault();HS.auth.open('login',{})}});

/* ---- decide where a student goes for an exam, following the exam's own rules ---- */
HS.goExam=function(examId){
  const st=HS.api.state(examId);
  switch(st.kind){
    case 'resume':location.href='exam.html?a='+encodeURIComponent(st.attempt.id);break;
    case 'resume-blocked':HS.api.submit(st.attempt,true);HS.toast('This exam cannot be resumed, so your saved answers were submitted.','warn');setTimeout(()=>location.href='result.html?a='+encodeURIComponent(st.attempt.id),900);break;
    case 'limit':HS.toast(`You have used all ${st.limit} attempt${st.limit>1?'s':''} for this exam.`,'warn');setTimeout(()=>location.href=st.attempt?'result.html?a='+encodeURIComponent(st.attempt.id):'dashboard.html',900);break;
    case 'soon':HS.toast('This test is coming soon.','warn');break;
    case 'hidden':HS.toast('This test is not available.','warn');break;
    default:location.href='instructions.html?e='+encodeURIComponent(examId)}
};
HS.startExam=function(examId){
  const e=HS.db.get('exams',examId);HS.track('start_test_clicked',{exam:e?e.title:''});
  if(HS.api.me())HS.goExam(examId);else HS.auth.open('register',{examId});
};
/* start / resume label for a card */
HS.examCta=function(e){
  const st=HS.api.state(e.id);
  switch(st.kind){case 'soon':return {label:'Coming soon',disabled:true};case 'resume':case 'resume-blocked':return {label:'Resume test'};
    case 'limit':return {label:'View result'};default:return {label:st.used?'Attempt again':(e.free?'Start free test':'Start test')}}
};
})();
