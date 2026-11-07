/* Public library pages: Previous Year Papers and Study Material. Only published items of published exams are shown. */
HS.library=function(opt){
  const {$,esc}=HS,K=opt.kind,isP=K==='papers';
  HS.header([['Home','index.html'],['Free Resources'],[opt.crumb]]);HS.footer();HS.track('website_visited');
  const exams=HS.db.publicExams();
  const items=()=>HS.db.all(K).filter(i=>i.published&&exams.some(e=>e.id===i.examId));
  const src=i=>i.fileData||i.url||'';
  const opts=(el,first,list)=>{$(el).innerHTML=`<option value="">${first}</option>`+list.map(x=>`<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('')};
  opts('#ex','All examinations',exams.filter(e=>items().some(i=>i.examId===e.id)).map(e=>[e.id,e.title]));
  if(isP)opts('#yr','All years',[...new Set(items().map(i=>i.year))].sort((a,b)=>b-a).map(y=>[y,y]));
  else opts('#ty','All content types',Object.entries(HS.MAT_TYPES));
  const secs=()=>{const id=+$('#ex').value;const e=exams.find(x=>x.id===id);return e?(e.sections||[]).filter(s=>s.enabled&&items().some(i=>i.examId===id&&i.sectionId===s.id)).map(s=>[s.id,s.name]):[]};
  function fillSec(){const cur=$('#sc').value;opts('#sc',$('#ex').value?'All sections':'Select an exam for sections',secs());$('#sc').value=cur;$('#sc').disabled=!$('#ex').value}
  function render(){
    const q=$('#q').value.trim().toLowerCase(),ex=$('#ex').value,sc=$('#sc').value,yr=isP?$('#yr').value:'',ty=isP?'':$('#ty').value;
    const l=items().filter(i=>(!ex||i.examId==ex)&&(!sc||i.sectionId==sc)&&(!yr||i.year==yr)&&(!ty||i.type===ty)&&(!q||(i.title+' '+(i.description||'')+' '+(i.subject||'')+' '+(i.topic||'')+' '+HS.db.examName(i.examId)).toLowerCase().includes(q)))
      .sort((a,b)=>isP?(b.year-a.year||b.id-a.id):b.id-a.id);
    $('#count').textContent=`${l.length} ${isP?'paper':'item'}${l.length===1?'':'s'}`;
    $('#list').innerHTML=l.length?l.map(i=>{
      const s=src(i),isVideo=!isP&&(i.type==='video'||/youtu|vimeo/.test(i.url||'')),isPdf=/^data:application\/pdf/.test(i.fileData||'')||/\.pdf(\?|$)/i.test(i.url||'');
      const chips=`<span class="chip b">${esc(HS.db.examName(i.examId))}</span>${isP?`<span class="chip">${esc(i.year)}</span>`:`<span class="chip">${esc(HS.MAT_TYPES[i.type]||i.type)}</span>`}${i.sectionId?`<span class="chip">${esc(HS.db.secName(i.examId,i.sectionId))}</span>`:''}${i.subject?`<span class="chip">${esc(i.subject)}</span>`:''}${i.topic?`<span class="chip">${esc(i.topic)}</span>`:''}`;
      const btns=!s?'<span class="chip">File not available</span>':i.fileData?`${isPdf?`<button class="btn btn-ghost" data-pv="${i.id}">Preview</button>`:''}<a class="btn btn-primary" data-dl="${i.id}" href="${i.fileData}" download="${esc(i.fileName||i.title)}">Download</a>`:
        `<a class="btn btn-primary" data-dl="${i.id}" href="${esc(i.url)}" target="_blank" rel="noopener">${isVideo?'Watch video':isPdf?'Open PDF':'Open'}</a>`;
      return `<article class="card lib-item"><div style="display:flex;gap:6px;flex-wrap:wrap">${chips}</div><h3>${esc(i.title)}</h3><p>${esc(i.description||'')}</p><div class="row">${btns}</div></article>`}).join(''):
      `<div class="card empty" style="grid-column:1/-1"><h3 style="margin:0 0 6px">${items().length?'Nothing matches your filters':'Nothing published yet'}</h3><p>${items().length?'Try clearing the filters.':'New '+(isP?'papers':'material')+' will appear here soon.'}</p></div>`;
  }
  fillSec();render();
  $('#ex').addEventListener('change',()=>{$('#sc').value='';fillSec();render()});
  ['q','sc','yr','ty'].forEach(i=>{const el=$('#'+i);if(el)el.addEventListener('input',render)});
  $('#clear').onclick=()=>{['q','ex','sc','yr','ty'].forEach(i=>{const el=$('#'+i);if(el)el.value=''});fillSec();render()};
  $('#list').addEventListener('click',ev=>{
    const p=ev.target.closest('[data-pv]');if(p){const i=HS.db.get(K,p.dataset.pv);$('#pv-t').textContent=i.title;$('#pv').src=i.fileData;HS.openModal('m-pv');HS.track(K+'_previewed',{exam:HS.db.examName(i.examId)});return}
    const d=ev.target.closest('[data-dl]');if(d){const i=HS.db.get(K,d.dataset.dl);HS.track(K+'_opened',{exam:HS.db.examName(i.examId)})}});
  $('#m-pv').addEventListener('click',e=>{if(e.target.id==='m-pv'||e.target.closest('[data-close]')){HS.closeModal('m-pv');$('#pv').src='about:blank'}});
};
