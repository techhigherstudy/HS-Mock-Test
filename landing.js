(function(){
const {$,$$,esc}=HS;
HS.header([['Home','index.html'],['Mock tests']]);HS.footer();HS.track('website_visited');
{const c=HS.cms();$('#hero-h1').innerHTML=esc(c.heroPre)+' <em>'+esc(c.heroEm)+'</em>';$('#hero-p').textContent=c.heroText}
let cat='all',exams=[];
HS.api.stats().then(s=>{$('#stats').innerHTML=[['Examinations',s.exams],['Registered students',s.students],['Questions',s.questions],['Mock attempts',s.attempts]].map(x=>`<div><b>${x[1]}</b><span>${x[0]}</span></div>`).join('')});
function tabs(){
  const cats=HS.db.all('cats').filter(c=>c.active&&exams.some(e=>e.categoryId===c.id)).sort((a,b)=>a.order-b.order);
  $('#tabs').innerHTML=`<button class="${cat==='all'?'active':''}" data-cat="all">All tests</button>`+cats.map(c=>`<button class="${cat==c.id?'active':''}" data-cat="${c.id}">${esc(c.name)}</button>`).join('');
}
function render(){
  const list=exams.filter(e=>cat==='all'||e.categoryId==cat);
  $('#tests').innerHTML=list.length?list.map(HS.examCard).join(''):`<div class="card empty" style="grid-column:1/-1">New tests in this category are coming soon.</div>`;
}
HS.api.exams().then(e=>{exams=e;tabs();render()});
$('#tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;cat=b.dataset.cat;tabs();render()};
HS.bindStart($('#tests'));
$('#res-cards').innerHTML=HS.menuItems('resources').concat(HS.menuItems('tools')).map(m=>`<a class="card feature" href="${esc(m.href)}" style="display:block"><h3>${esc(m.label)}</h3><p>${{mocks:'Full-length and sectional mocks with real exam interface.',papers:'Download previous year question papers, exam-wise and year-wise.',materials:'Notes, formulae, guides and videos organised by exam and section.',predictor:'Enter your score and see colleges you may be eligible for.'}[m.key]||'Open'}</p></a>`).join('');
$('#cta-counsel').href=HS.counsellingUrl();$('#cta-counsel').addEventListener('click',()=>HS.track('counselling_button_clicked'));
})();
