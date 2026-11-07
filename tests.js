/* Shared exam-card renderer (landing page + Mock Tests page). */
(function(){
const esc=HS.esc;
const tone=['#ca452e','#7c3aed','#16803f','#d97706','#0e7490','#be185d','#4338ca'];
HS.examCard=function(e){
  const cta=HS.examCta(e),mine=HS.api.me()?HS.api.state(e.id):null;
  const logo=e.logo?`<img src="${esc(e.logo)}" alt="" class="tc-logo">`:`<div class="tc-logo tc-init" style="background:${tone[(e.categoryId||0)%tone.length]}">${esc((e.category||'EX').slice(0,4))}</div>`;
  const secs=(e.sections||[]).filter(s=>s.enabled).length;
  return `<article class="card test-card">
    <div class="tc-top">${logo}<span class="chip b">${esc(e.category)}</span></div>
    <h3>${esc(e.title)}</h3><p>${esc(e.description||'')}</p>
    <div class="meta">${e.duration} min · ${e.totalQuestions} questions · ${e.totalMarks} marks · ${esc(e.difficulty)} · ${e.free?'Free':'Paid'}${secs?` · ${secs} sections`:''}${e.attemptLimit?` · ${e.attemptLimit} attempt${e.attemptLimit>1?'s':''}`:''}</div>
    ${cta.disabled?`<button class="btn btn-ghost" disabled style="opacity:.7;cursor:not-allowed">${cta.label}</button>`:`<button class="btn btn-primary" data-start="${e.id}">${cta.label}</button>`}</article>`;
};
HS.bindStart=function(root){root.addEventListener('click',ev=>{const b=ev.target.closest('[data-start]');if(b)HS.startExam(+b.dataset.start)})};
})();
