/* Admin v2 core: generic DataTable (search, multi-filter, date range, sort, pagination, saved filters, filtered/selected/all export),
   form + confirm helpers, and the exam modules (Exam Management, Categories, Sections, Mock Tests).
   In the Laravel phase every `query()` below is a server request (GET /api/admin/<resource>?q=&filters[]=&sort=&page=) and every export is a streamed server download. */
(function(){
const A=window.HSA,DB=HS.db,$=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)],esc=HS.esc,S=()=>A.S();
const X=window.HSX={};
X.allAttempts=()=>{try{return JSON.parse(localStorage.getItem('hs_attempts')||'[]')}catch(e){return[]}};   // every attempt, incl. Daily Quiz
X.attempts=()=>X.allAttempts().filter(a=>a.kind!=='daily');   // mock-test attempts only: existing modules keep working exactly as before
X.users=()=>{try{return JSON.parse(localStorage.getItem('hs_users')||'[]')}catch(e){return[]}};
X.setAttempts=a=>{try{localStorage.setItem('hs_attempts',JSON.stringify(a))}catch(e){}};
X.setUsers=a=>{try{localStorage.setItem('hs_users',JSON.stringify(a))}catch(e){}};
const need=(m,a)=>{if(!A.can(m,a)){A.toast(`Your role is not allowed to ${a} in this module.`,'warn');return false}return true};X.need=need;
const t=iso=>iso?new Date(iso).getTime():0;
const chip=(txt,c)=>`<span class="chip ${c||''}">${esc(txt)}</span>`;X.chip=chip;
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();X.norm=norm;
const page=(title,body,note)=>`${note?`<div class="notice">${note}</div>`:''}${body}`;X.page=page;
const exams=()=>DB.all('exams').filter(e=>!e.deleted);X.exams=exams;
const examOpts=(all)=>exams().map(e=>[e.id,e.title]);X.examOpts=examOpts;
const secOpts=(examId)=>{const e=DB.get('exams',examId);return e?(e.sections||[]).slice().sort((a,b)=>a.order-b.order).map(s=>[s.id,s.name+(s.enabled?'':' (disabled)')]):[]};X.secOpts=secOpts;
X.dstr=iso=>iso?new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):'—';

/* ---------- CSV / Excel ---------- */
const cell=v=>{v=v===null||v===undefined?'':v;if(typeof v==='string'&&/^[=+@]|^-(?![\d.])/.test(v))v="'"+v;return v};
X.toCSV=rows=>'﻿'+rows.map(r=>r.map(v=>`"${String(cell(v)).replace(/"/g,'""')}"`).join(',')).join('\r\n');
X.parseCSV=text=>{text=text.replace(/^﻿/,'');const rows=[];let r=[],c='',q=false;for(let i=0;i<text.length;i++){const ch=text[i];
  if(q){if(ch==='"'&&text[i+1]==='"'){c+='"';i++}else if(ch==='"')q=false;else c+=ch}else if(ch==='"')q=true;else if(ch===','){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()!==''))rows.push(r);r=[]}else c+=ch}
  r.push(c);if(r.some(x=>x.trim()!==''))rows.push(r);return rows};
X.save=(name,text,mime)=>{const b=new Blob([text],{type:mime||'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)};
let xlsxP=null;
X.xlsx=()=>{if(window.XLSX)return Promise.resolve(window.XLSX);if(xlsxP)return xlsxP;
  return xlsxP=new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=()=>window.XLSX?ok(window.XLSX):no(new Error('x'));s.onerror=()=>{xlsxP=null;no(new Error('Excel library could not be loaded'))};document.head.appendChild(s)})};
X.writeXLSX=async(name,rows)=>{try{const L=await X.xlsx(),ws=L.utils.aoa_to_sheet(rows.map(r=>r.map(cell))),wb=L.utils.book_new();L.utils.book_append_sheet(wb,ws,'Export');L.writeFile(wb,name.replace(/\.csv$/,'.xlsx'));return true}
  catch(e){const html='<html><head><meta charset="utf-8"></head><body><table>'+rows.map(r=>'<tr>'+r.map(v=>`<td>${esc(cell(v))}</td>`).join('')+'</tr>').join('')+'</table></body></html>';X.save(name.replace(/\.csv$/,'.xls'),html,'application/vnd.ms-excel');A.toast('Excel library unavailable, saved as an Excel-compatible .xls instead.','warn');return false}};

/* ---------- confirm + forms ---------- */
let cf=null;X.cf=()=>cf;
X.confirm=(title,msg,yes,label,danger)=>{cf={yes};A.openModal(`<h3>${esc(title)}</h3><p style="color:var(--muted);margin:0 0 16px">${msg}</p><div class="ml"><button class="btn-s ${danger?'d':'p'}" data-xa="cf-yes" ${danger?'style="border-color:var(--danger)"':''}>${esc(label||'Confirm')}</button><button class="btn-s" data-xa="cf-no">Cancel</button></div>`)};
X.form=(o)=>{ /* o:{title,fields,values,onSave,saveLabel,extra} */
  const v=o.values||{};cf={files:{},fields:o.fields,onSave:o.onSave,custom:o.custom};
  const inp=f=>{const id='fm-'+f.k,val=v[f.k]??f.def??'',ph=f.placeholder?` placeholder="${esc(f.placeholder)}"`:'',rq=f.req?' *':'';
    let el='';
    if(f.type==='html')return `<div class="full">${f.html}</div>`;
    if(f.type==='textarea')el=`<textarea id="${id}" rows="${f.rows||3}"${ph}>${esc(val)}</textarea>`;
    else if(f.type==='select'){const opts=typeof f.options==='function'?f.options(v):f.options;el=`<select id="${id}" ${f.disabled?'disabled':''}>${f.blank!==undefined?`<option value="">${esc(f.blank)}</option>`:''}${opts.map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(val)?'selected':''}>${esc(o[1])}</option>`).join('')}</select>`}
    else if(f.type==='check')return `<div class="${f.full?'full':''}"><label style="font-weight:600"><input type="checkbox" id="${id}" style="width:auto" ${val?'checked':''}> ${esc(f.label)}</label>${f.hint?`<small style="display:block;color:var(--muted)">${esc(f.hint)}</small>`:''}</div>`;
    else if(f.type==='file')el=`<input type="file" id="${id}" data-xfile="${f.k}" data-max="${f.maxKB||800}" accept="${esc(f.accept||'')}"><small id="${id}-n" style="color:var(--muted)">${v[f.k+'Name']?'Current file: '+esc(v[f.k+'Name'])+' (leave empty to keep)':'No file chosen'}</small>`;
    else el=`<input id="${id}" type="${f.type||'text'}" value="${esc(val)}"${ph}${f.min!==undefined?` min="${f.min}"`:''}${f.step?` step="${f.step}"`:''}${f.disabled?' disabled':''}>`;
    return `<div class="${f.full?'full':''}"><label for="${id}">${esc(f.label)}${rq}</label>${el}${f.hint?`<small style="display:block;color:var(--muted);margin-top:2px">${esc(f.hint)}</small>`:''}<div class="ferr" id="${id}-e" style="color:var(--danger);font-size:12px;display:none"></div></div>`};
  A.openModal(`<h3>${esc(o.title)}</h3><div class="form-g">${o.fields.map(inp).join('')}</div>${o.extra||''}<div id="fm-err" style="color:var(--danger);font-size:13px;margin-top:10px;display:none"></div><div class="ml" style="margin-top:14px"><button class="btn-s p" data-xa="form-save">${esc(o.saveLabel||'Save')}</button><button class="btn-s" data-xa="cf-no">Cancel</button></div>`);
  const m=$('#modal');m.style.maxWidth=o.wide?'760px':'';
  o.fields.filter(f=>f.dep).forEach(f=>{const d=$('#fm-'+f.dep);if(d)d.addEventListener('change',()=>{const cur={};o.fields.forEach(g=>{const e=$('#fm-'+g.k);if(e)cur[g.k]=e.type==='checkbox'?e.checked:e.value});const sel=$('#fm-'+f.k);sel.innerHTML=(f.blank!==undefined?`<option value="">${esc(f.blank)}</option>`:'')+f.options(cur).map(x=>`<option value="${esc(x[0])}">${esc(x[1])}</option>`).join('')})});
};
X.readForm=()=>{const out={},bad=[];(cf.fields||[]).forEach(f=>{const e=$('#fm-'+f.k);if(!e)return;let val;
  if(f.type==='check')val=e.checked;else if(f.type==='file')val=cf.files[f.k]||null;else{val=e.value;if(typeof val==='string'&&f.type!=='textarea')val=val.trim();if(f.type==='number'&&val!=='')val=+val}
  const er=$('#fm-'+f.k+'-e');if(er){er.style.display='none'}
  if(f.req&&(val===''||val===null||val===undefined||(f.type==='number'&&Number.isNaN(val)))){bad.push([f.k,f.label+' is required.'])}
  else if(f.type==='number'&&val!==''&&f.min!==undefined&&val<f.min)bad.push([f.k,f.label+' must be at least '+f.min+'.']);
  out[f.k]=val});return {out,bad}};
X.showErr=(k,msg)=>{const e=$('#fm-'+k+'-e');if(e){e.textContent=msg;e.style.display='block'}else{const g=$('#fm-err');if(g){g.textContent=msg;g.style.display='block'}}A.toast(msg,'warn')};
X.readImage=(file,maxKB,cb)=>{if(file.size>maxKB*1024){A.toast(`File is too large for browser storage (max ${maxKB} KB in this prototype; the backend stores files on disk).`,'warn');return false}const r=new FileReader();r.onload=()=>cb({name:file.name,data:r.result});r.readAsDataURL(file);return true};

/* ---------- DataTable ---------- */
const DTS=X.DTS={},ST={};X.ST=ST;
const stOf=id=>ST[id]||(ST[id]={q:'',f:{},from:'',to:'',sort:DTS[id].sort||null,page:1,per:DTS[id].per||20,sel:new Set()});
function query(cfg,st,ignoreFilters){
  let rows=cfg.rows();if(ignoreFilters)return rows;
  const q=st.q.trim().toLowerCase();if(q)rows=rows.filter(r=>cfg.search(r).toLowerCase().includes(q));
  (cfg.filters||[]).forEach(f=>{const v=st.f[f.k];if(v===undefined||v==='')return;rows=rows.filter(r=>f.match(r,v))});
  if(cfg.dateKey&&(st.from||st.to)){const a=st.from?+new Date(st.from):0,b=st.to?+new Date(st.to)+864e5:Infinity;rows=rows.filter(r=>{const x=t(cfg.dateKey(r));return x>=a&&x<b})}
  if(st.sort){const c=cfg.cols.find(c=>c.k===st.sort.k);if(c){const g=c.sortVal||c.get;rows=rows.slice().sort((x,y)=>{const a=g(x),b=g(y);const r=(typeof a==='number'&&typeof b==='number')?a-b:String(a??'').localeCompare(String(b??''),undefined,{numeric:true});return st.sort.dir==='desc'?-r:r})}}
  return rows}
X.query=id=>query(DTS[id],stOf(id));
const savedKey=id=>(A.me()?A.me().id:0)+':'+id;
function toolbar(id){const cfg=DTS[id],st=stOf(id),sv=(S().saved[savedKey(id)]||[]),canX=A.can(cfg.mod,'export');
  return `<div class="filters dt-bar">
   <div><label>Search</label><input data-xs="${id}" value="${esc(st.q)}" placeholder="${esc(cfg.searchHint||'Search…')}" style="min-width:210px"></div>
   ${(cfg.filters||[]).map(f=>{const v=st.f[f.k]??'';
     if(f.type==='text')return `<div><label>${esc(f.label)}</label><input data-xf="${f.k}" data-dtid="${id}" value="${esc(v)}" placeholder="${esc(f.placeholder||'')}"></div>`;
     if(f.type==='num')return `<div><label>${esc(f.label)}</label><input type="number" data-xf="${f.k}" data-dtid="${id}" value="${esc(v)}" style="min-width:90px;width:100px"></div>`;
     return `<div><label>${esc(f.label)}</label><select data-xf="${f.k}" data-dtid="${id}"><option value="">All</option>${f.options().map(o=>`<option value="${esc(o[0])}" ${String(o[0])===String(v)?'selected':''}>${esc(o[1])}</option>`).join('')}</select></div>`}).join('')}
   ${cfg.dateKey?`<div><label>${esc(cfg.dateLabel||'Date')} from</label><input type="date" data-xd="from" data-dtid="${id}" value="${st.from}"></div><div><label>to</label><input type="date" data-xd="to" data-dtid="${id}" value="${st.to}"></div>`:''}
   <div><button class="btn-s" data-xa="clear" data-dtid="${id}">Clear all filters</button></div>
   <div class="ml"><select data-xsaved="${id}" style="min-width:140px"><option value="">Saved filters…</option>${sv.map((s,i)=>`<option value="${i}">${esc(s.name)}</option>`).join('')}</select><button class="btn-s" data-xa="savefilter" data-dtid="${id}">Save filter</button>${sv.length?`<button class="btn-s d" data-xa="delsaved" data-dtid="${id}" title="Delete the selected saved filter">×</button>`:''}</div>
   <div class="ml" style="margin-left:auto">${cfg.toolbarHtml?cfg.toolbarHtml():''}${canX?`<button class="btn-s p" data-xa="export" data-dtid="${id}">Export…</button>`:''}</div></div>`}
function body(id){const cfg=DTS[id],st=stOf(id),all=cfg.rows().length,rows=query(cfg,st),per=st.per,pages=Math.max(1,Math.ceil(rows.length/per));st.page=Math.min(st.page,pages);
  const pr=rows.slice((st.page-1)*per,st.page*per),ids=pr.map(cfg.id),selOn=cfg.select!==false&&cfg.bulk&&cfg.bulk.length,allPage=pr.length&&ids.every(i=>st.sel.has(i));
  const bulk=selOn&&st.sel.size?`<div class="ml dt-bulk" style="margin:0 0 8px;padding:8px 12px;background:var(--brand-soft);border-radius:8px"><b>${st.sel.size} selected</b>${cfg.bulk.filter(b=>A.can(cfg.mod,b.perm)).map(b=>`<button class="btn-s ${b.danger?'d':''}" data-xa="bulk" data-b="${b.k}" data-dtid="${id}">${esc(b.label)}</button>`).join('')}<a href="#" data-xa="clearsel" data-dtid="${id}" style="color:var(--brand)">clear selection</a></div>`:'';
  const hasAct=!!cfg.rowActions;
  return `<div class="ml" style="justify-content:space-between;margin-bottom:8px"><span><b>${rows.length.toLocaleString('en-IN')}</b> record${rows.length===1?'':'s'}${rows.length!==all?` (filtered from ${all.toLocaleString('en-IN')})`:''}${selOn&&rows.length>pr.length?` · <a href="#" data-xa="selall" data-dtid="${id}" style="color:var(--brand)">select all ${rows.length} matching</a>`:''}</span>
    <span class="ml">Rows <select data-xper="${id}" style="min-width:70px">${[10,20,50,100].map(n=>`<option ${n===per?'selected':''}>${n}</option>`).join('')}</select></span></div>${bulk}
   <div class="tw"><table class="t"><thead><tr>${selOn?`<th><input type="checkbox" data-xa="selpage" data-dtid="${id}" ${allPage?'checked':''}></th>`:''}${cfg.cols.map(c=>`<th ${c.sort===false?'':`class="xsort" data-xa="sort" data-k="${c.k}" data-dtid="${id}" style="cursor:pointer" aria-sort="${st.sort&&st.sort.k===c.k?(st.sort.dir==='asc'?'ascending':'descending'):'none'}"`}>${esc(c.label)}${st.sort&&st.sort.k===c.k?(st.sort.dir==='asc'?' ▲':' ▼'):''}</th>`).join('')}${hasAct?'<th>Actions</th>':''}</tr></thead>
   <tbody>${pr.map(r=>`<tr data-rid="${esc(cfg.id(r))}" style="cursor:default">${selOn?`<td><input type="checkbox" data-xsel="${esc(cfg.id(r))}" data-dtid="${id}" ${st.sel.has(cfg.id(r))?'checked':''}></td>`:''}${cfg.cols.map(c=>`<td ${c.wrap?'style="white-space:normal;min-width:240px"':''}>${c.html?c.html(r):esc(c.get(r)??'')}</td>`).join('')}${hasAct?`<td><div class="ml" style="flex-wrap:nowrap">${cfg.rowActions(r)}</div></td>`:''}</tr>`).join('')||`<tr><td colspan="${cfg.cols.length+(selOn?1:0)+(hasAct?1:0)}" style="text-align:center;padding:34px;color:var(--muted)">${all?'No records match these filters.':(cfg.empty||'Nothing here yet.')}</td></tr>`}</tbody></table></div>
   <div class="pager"><span>Page ${st.page} of ${pages}</span><div class="ml"><button class="btn-s" data-xa="pg" data-d="-1" data-dtid="${id}" ${st.page<=1?'disabled':''}>‹ Prev</button><button class="btn-s" data-xa="pg" data-d="1" data-dtid="${id}" ${st.page>=pages?'disabled':''}>Next ›</button></div></div>`}
X.dt=(id,cfg)=>{if(cfg)DTS[id]=cfg;if(X.pending&&X.pending[id]){const st=stOf(id);st.f=Object.assign({},X.pending[id]);st.page=1;delete X.pending[id]}return `<div class="dt" data-dt="${id}">${toolbar(id)}<div class="dt-body">${body(id)}</div></div>`};
X.dtRefresh=(id,full)=>{const el=$(`.dt[data-dt="${id}"]`);if(!el){A.render();return}if(full)el.innerHTML=toolbar(id)+`<div class="dt-body">${body(id)}</div>`;else $('.dt-body',el).innerHTML=body(id)};
X.reg=(id,cfg)=>{DTS[id]=cfg};

/* export */
function exportModal(id){const cfg=DTS[id],st=stOf(id),n=query(cfg,st).length,sel=st.sel.size,tot=cfg.rows().length;
  A.openModal(`<h3>Export ${esc(cfg.title)}</h3><div class="form-g"><div class="full"><label>What to export</label><select id="xe-scope"><option value="filtered">Filtered records (${n})</option>${sel?`<option value="selected">Selected records (${sel})</option>`:''}<option value="all">All records (${tot})</option></select></div>
   <div><label>Format</label><select id="xe-fmt"><option value="csv">CSV</option><option value="xlsx">Excel (.xlsx)</option></select></div><div></div>
   <div class="full"><label>Columns</label><div style="border:1px solid var(--line);border-radius:8px;max-height:200px;overflow:auto;padding:6px 10px">${cfg.cols.filter(c=>c.x!==false).map(c=>`<label style="display:block;font-weight:600"><input type="checkbox" data-xcol="${c.k}" checked> ${esc(c.label)}</label>`).join('')}</div></div>
   <div class="full ml"><button class="btn-s p" data-xa="doexport" data-dtid="${id}">Download</button><button class="btn-s" data-xa="cf-no">Cancel</button></div></div>`)}
async function doExport(id){const cfg=DTS[id],st=stOf(id);if(!need(cfg.mod,'export'))return;
  const sc=$('#xe-scope').value,fmt=$('#xe-fmt').value,cols=cfg.cols.filter(c=>c.x!==false&&$(`[data-xcol="${c.k}"]`)&&$(`[data-xcol="${c.k}"]`).checked);
  if(!cols.length){A.toast('Choose at least one column.','warn');return}
  let rows=sc==='all'?cfg.rows():sc==='selected'?cfg.rows().filter(r=>st.sel.has(cfg.id(r))):query(cfg,st);
  const data=[cols.map(c=>c.label),...rows.map(r=>cols.map(c=>c.get(r)))],name=`${cfg.file||id}-${new Date().toISOString().slice(0,10)}.csv`;
  if(fmt==='csv')X.save(name,X.toCSV(data));else await X.writeXLSX(name,data);
  A.log(`Exported ${rows.length} ${cfg.title} (${sc}, ${fmt})`,cfg.title,'',cols.length+' columns');A.closeModal();A.toast(`Exported ${rows.length} record${rows.length===1?'':'s'}.`)}
X.exportAll=async(id,fmt)=>{const cfg=DTS[id];if(!need(cfg.mod,'export'))return;const rows=cfg.rows(),cols=cfg.cols.filter(c=>c.x!==false),data=[cols.map(c=>c.label),...rows.map(r=>cols.map(c=>c.get(r)))],name=`${cfg.file||id}-${new Date().toISOString().slice(0,10)}.csv`;
  if(fmt==='xlsx')await X.writeXLSX(name,data);else X.save(name,X.toCSV(data));A.log(`Exported ${rows.length} ${cfg.title} (all, ${fmt})`,cfg.title);A.toast(`Exported ${rows.length} records.`)};

/* ---------- events ---------- */
document.addEventListener('input',e=>{const el=e.target;
  if(el.dataset.xs){const st=stOf(el.dataset.xs);st.q=el.value;st.page=1;X.dtRefresh(el.dataset.xs)}
  else if(el.dataset.xf&&(el.type==='text'||el.type==='number')){const id=el.dataset.dtid,st=stOf(id);st.f[el.dataset.xf]=el.value;st.page=1;X.dtRefresh(id)}});
document.addEventListener('change',e=>{const el=e.target;
  if(el.dataset.xf&&el.tagName==='SELECT'){const id=el.dataset.dtid,st=stOf(id),f=DTS[id].filters.find(f=>f.k===el.dataset.xf);st.f[el.dataset.xf]=el.value;st.page=1;
    (DTS[id].filters||[]).forEach(g=>{if(g.dependsOn===el.dataset.xf)st.f[g.k]=''});X.dtRefresh(id,!!(f&&f.rerender))}
  else if(el.dataset.xd){const st=stOf(el.dataset.dtid);st[el.dataset.xd]=el.value;st.page=1;X.dtRefresh(el.dataset.dtid)}
  else if(el.dataset.xper){const st=stOf(el.dataset.xper);st.per=+el.value;st.page=1;X.dtRefresh(el.dataset.xper)}
  else if(el.dataset.xsel){const st=stOf(el.dataset.dtid);el.checked?st.sel.add(el.dataset.xsel):st.sel.delete(el.dataset.xsel);X.dtRefresh(el.dataset.dtid)}
  else if(el.dataset.xsaved!==undefined&&el.value!==''){const id=el.dataset.xsaved,s=(S().saved[savedKey(id)]||[])[+el.value];if(s){const st=stOf(id);st.q=s.q;st.f=Object.assign({},s.f);st.from=s.from;st.to=s.to;st.page=1;X.dtRefresh(id,true);A.toast('Saved filter applied.')}}
  else if(el.dataset.xfile){const f=el.files[0];if(!f)return;const k=el.dataset.xfile;if(!X.readImage(f,+el.dataset.max,o=>{cf.files[k]=o;const n=$('#fm-'+k+'-n');if(n)n.textContent='Selected: '+o.name}))el.value=''}});
X.actions={};   // modules register extra data-xa handlers here
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-xa]');if(!b)return;const a=b.dataset.xa,id=b.dataset.dtid;if(b.tagName==='A')e.preventDefault();
  switch(a){
   case'cf-no':A.closeModal();cf=null;$('#modal').style.maxWidth='';return;
   case'cf-yes':{const y=cf&&cf.yes;A.closeModal();cf=null;if(y)y();return}
   case'form-save':{if(!cf||!cf.onSave)return;const {out,bad}=X.readForm();if(bad.length){bad.forEach(x=>{const er=$('#fm-'+x[0]+'-e');if(er){er.textContent=x[1];er.style.display='block'}});A.toast(bad[0][1],'warn');return}
     const r=cf.onSave(out);if(typeof r==='string'){const g=$('#fm-err');g.textContent=r;g.style.display='block';A.toast(r,'warn');return}if(r===false)return;A.closeModal();cf=null;return}
   case'sort':{const st=stOf(id),k=b.dataset.k;st.sort=st.sort&&st.sort.k===k?(st.sort.dir==='asc'?{k,dir:'desc'}:null):{k,dir:'asc'};X.dtRefresh(id);return}
   case'pg':{const st=stOf(id);st.page+=+b.dataset.d;X.dtRefresh(id);return}
   case'clear':{const st=stOf(id);st.q='';st.f={};st.from='';st.to='';st.page=1;X.dtRefresh(id,true);return}
   case'selpage':{const cfg=DTS[id],st=stOf(id),rows=query(cfg,st).slice((st.page-1)*st.per,st.page*st.per);rows.forEach(r=>b.checked?st.sel.add(cfg.id(r)):st.sel.delete(cfg.id(r)));X.dtRefresh(id);return}
   case'selall':{const cfg=DTS[id],st=stOf(id);query(cfg,st).forEach(r=>st.sel.add(cfg.id(r)));X.dtRefresh(id);return}
   case'clearsel':stOf(id).sel.clear();X.dtRefresh(id);return;
   case'export':if(need(DTS[id].mod,'export'))exportModal(id);return;
   case'doexport':await doExport(id);return;
   case'savefilter':{const st=stOf(id);X.form({title:'Save this filter',fields:[{k:'name',label:'Name',req:true,placeholder:'e.g. Google Ads leads this month'}],saveLabel:'Save',onSave:v=>{const k=savedKey(id),l=S().saved[k]=S().saved[k]||[];l.push({name:v.name,q:st.q,f:Object.assign({},st.f),from:st.from,to:st.to});A.save();X.dtRefresh(id,true);A.toast('Filter saved.')}});return}
   case'delsaved':{const sel=$(`[data-xsaved="${id}"]`);if(!sel||sel.value===''){A.toast('Choose a saved filter first.','warn');return}const l=S().saved[savedKey(id)];l.splice(+sel.value,1);A.save();X.dtRefresh(id,true);return}
   case'bulk':{const cfg=DTS[id],st=stOf(id),bk=cfg.bulk.find(x=>x.k===b.dataset.b);if(!need(cfg.mod,bk.perm))return;const ids=[...st.sel];bk.run(ids,()=>{st.sel.clear();X.dtRefresh(id,true)});return}
  }
  if(X.actions[a])X.actions[a](b,e)});

/* ============ EXAM MANAGEMENT ============ */
const attemptsOf=eid=>X.attempts().filter(a=>a.examId===eid).length;
const examStatus=e=>e.archived?'Archived':e.published?'Published':'Draft';
X.reg('exams',{mod:'exams',title:'Exams',file:'exams',searchHint:'Search exam name, category…',
  rows:()=>exams(),id:e=>String(e.id),search:e=>[e.title,DB.catName(e.categoryId),e.description].join(' '),dateKey:e=>e.createdAt,dateLabel:'Created',per:20,sort:{k:'created',dir:'desc'},
  filters:[{k:'cat',label:'Category',options:()=>DB.all('cats').map(c=>[c.id,c.name]),match:(e,v)=>e.categoryId==v},
   {k:'status',label:'Status',options:()=>[['Published','Published'],['Draft','Draft (unpublished)'],['Archived','Archived']],match:(e,v)=>examStatus(e)===v},
   {k:'vis',label:'Visibility',options:()=>[['public','Public'],['registered','Registered students only'],['hidden','Hidden (link only)']],match:(e,v)=>(e.visibility||'public')===v},
   {k:'name',label:'Exam name',type:'text',placeholder:'contains…',match:(e,v)=>e.title.toLowerCase().includes(v.toLowerCase())}],
  cols:[{k:'title',label:'Examination',get:e=>e.title,html:e=>`<b>${esc(e.title)}</b>${e.sample?'':''}`},{k:'cat',label:'Category',get:e=>DB.catName(e.categoryId)},
   {k:'status',label:'Status',get:examStatus,html:e=>chip(examStatus(e),e.archived?'':e.published?'g':'y')},{k:'vis',label:'Visibility',get:e=>e.visibility||'public'},
   {k:'dur',label:'Minutes',get:e=>e.duration},{k:'marks',label:'Total marks',get:e=>DB.maxMarks(e)||e.totalMarks||0},{k:'pass',label:'Pass marks',get:e=>e.passMarks||0},
   {k:'secs',label:'Sections',get:e=>(e.sections||[]).length},{k:'qs',label:'Questions',get:e=>DB.qCount(e.id)},{k:'date',label:'Exam date',get:e=>e.examDate||''},{k:'att',label:'Attempts',get:e=>attemptsOf(e.id)},
   {k:'created',label:'Created',get:e=>X.dstr(e.createdAt),sortVal:e=>t(e.createdAt)}],
  rowActions:e=>[A.can('exams','edit')&&`<button class="btn-s" data-xa="ex-edit" data-id="${e.id}">Edit</button>`,A.can('exams','publish')&&!e.archived&&`<button class="btn-s" data-xa="ex-pub" data-id="${e.id}">${e.published?'Unpublish':'Publish'}</button>`,
    A.can('exams','publish')&&`<button class="btn-s" data-xa="ex-arch" data-id="${e.id}">${e.archived?'Restore':'Archive'}</button>`,A.can('exams','add')&&`<button class="btn-s" data-xa="ex-dup" data-id="${e.id}">Duplicate</button>`,A.can('exams','delete')&&`<button class="btn-s d" data-xa="ex-del" data-id="${e.id}">Delete</button>`].filter(Boolean).join(''),
  toolbarHtml:()=>A.can('exams','add')?'<button class="btn-s p" data-xa="ex-new">+ Add examination</button>':''});
A.P.exams=()=>page('', `<p style="margin:0 0 12px;color:var(--muted)">Create unlimited examinations. Sections, questions and settings are managed per exam, and nothing is hard-coded: a new exam appears on the website as soon as it is published and has questions.</p>`+X.dt('exams'));
function examForm(e){const n=!e;e=e||{};
  X.form({title:n?'Add examination':'Edit examination: '+e.title,wide:true,saveLabel:n?'Create examination':'Save changes',values:Object.assign({},e,{negInput:Math.abs(e.defaultNeg||0),instrText:(e.instructions||[]).join('\n'),published:n?false:e.published,showSolutions:e.showSolutions||'after',visibility:e.visibility||'public',attemptLimit:e.attemptLimit||0,allowResume:n?true:e.allowResume,duration:e.duration||60,defaultMarks:e.defaultMarks??1,free:n?true:e.free,difficulty:e.difficulty||'Moderate',categoryId:e.categoryId||''}),
   fields:[{k:'title',label:'Examination name',req:true,full:true,placeholder:'e.g. MAT Full Length Mock 1'},{k:'categoryId',label:'Exam category',type:'select',options:()=>DB.all('cats').map(c=>[c.id,c.name]),blank:'Select…',req:true},
    {k:'logo',label:'Logo (image)',type:'file',accept:'image/*',maxKB:150,hint:'Optional. PNG/JPG up to 150 KB in this prototype.'},
    {k:'description',label:'Description',type:'textarea',full:true},{k:'instrText',label:'Instructions (one per line, shown to students before the test)',type:'textarea',full:true,rows:5},
    {k:'duration',label:'Duration (minutes)',type:'number',min:1,req:true},{k:'totalMarks',label:'Total marks (declared)',type:'number',min:0,hint:'The paper total is calculated from the questions; this is shown if no questions exist yet.'},
    {k:'passMarks',label:'Passing marks',type:'number',min:0},{k:'defaultMarks',label:'Default marks per question',type:'number',min:0,step:'any'},{k:'negInput',label:'Negative marking (marks lost per wrong answer)',type:'number',min:0,step:'any',hint:'0 means no negative marking.'},
    {k:'examDate',label:'Exam date',type:'date'},{k:'difficulty',label:'Difficulty',type:'select',options:[['Easy','Easy'],['Moderate','Moderate'],['Hard','Hard']]},
    {k:'eligibility',label:'Eligibility details',type:'textarea',full:true,rows:2},{k:'info',label:'Examination information',type:'textarea',full:true,rows:2},
    {k:'visibility',label:'Visibility for students',type:'select',options:[['public','Public (listed for everyone)'],['registered','Only logged-in students'],['hidden','Hidden (open only by direct link)']]},
    {k:'attemptLimit',label:'Attempts allowed (0 = unlimited)',type:'number',min:0},{k:'showSolutions',label:'Answer key & solutions',type:'select',options:[['after','Show after submission'],['never','Never show']]},
    {k:'allowResume',label:'Allow students to resume an unfinished attempt',type:'check',full:true},{k:'sectionTimers',label:'Sectional timers: sections run in fixed order, each with its own time limit (needs minutes on every section)',type:'check',full:true},
    {k:'free',label:'Free test',type:'check'},{k:'published',label:'Published (visible to students)',type:'check'}],
   onSave:v=>{
    if(!need('exams',n?'add':'edit'))return false;
    if(v.published&&!need('exams','publish'))return false;
    if(exams().some(x=>x.id!==e.id&&x.title.toLowerCase()===v.title.toLowerCase()))return 'An examination with this name already exists.';
    if(v.totalMarks&&v.passMarks>v.totalMarks)return 'Passing marks cannot exceed total marks.';
    const p={title:v.title,categoryId:+v.categoryId,description:v.description,instructions:v.instrText.split('\n').map(x=>x.trim()).filter(Boolean),duration:v.duration,totalMarks:v.totalMarks||0,passMarks:v.passMarks||0,defaultMarks:v.defaultMarks||1,defaultNeg:-Math.abs(v.negInput||0),examDate:v.examDate,difficulty:v.difficulty,eligibility:v.eligibility,info:v.info,visibility:v.visibility,attemptLimit:v.attemptLimit||0,showSolutions:v.showSolutions,allowResume:v.allowResume,sectionTimers:v.sectionTimers,free:v.free,published:v.published};
    if(v.logo)p.logo=v.logo.data;
    if(n){const r=DB.add('exams',Object.assign({slug:v.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''),logo:'',archived:false,deleted:false,sections:[]},p));A.log('Created examination','Exam Management','',r.title)}
    else{DB.update('exams',e.id,p);A.log('Edited examination','Exam Management',e.title,p.title)}
    A.toast(n?'Examination created.':'Examination saved.');A.render();return true}})}
Object.assign(X.actions,{
 'ex-new':()=>need('exams','add')&&examForm(),
 'ex-edit':b=>need('exams','edit')&&examForm(DB.get('exams',b.dataset.id)),
 'ex-pub':b=>{if(!need('exams','publish'))return;const e=DB.get('exams',b.dataset.id);if(!e.published&&!DB.buildPaper(e).qids.length)A.toast('Published, but students will see "Coming soon" until the exam has active questions.','warn');DB.update('exams',e.id,{published:!e.published});A.log((e.published?'Unpublished':'Published')+' examination','Exam Management','',e.title);A.render()},
 'ex-arch':b=>{if(!need('exams','publish'))return;const e=DB.get('exams',b.dataset.id);DB.update('exams',e.id,{archived:!e.archived});A.log((e.archived?'Restored':'Archived')+' examination','Exam Management','',e.title);A.render()},
 'ex-dup':b=>{if(!need('exams','add'))return;const e=DB.get('exams',b.dataset.id),c=JSON.parse(JSON.stringify(e));delete c.id;c.title=e.title+' (Copy)';c.slug=c.slug+'-copy';c.published=false;c.createdAt=new Date().toISOString();DB.add('exams',c);A.log('Duplicated examination (settings and sections, not questions)','Exam Management','',e.title);A.toast('Duplicated as an unpublished draft. Questions are not copied: add or copy them explicitly.');A.render()},
 'ex-del':b=>{if(!need('exams','delete'))return;const e=DB.get('exams',b.dataset.id),n=attemptsOf(e.id);if(n){A.toast(`${n} student attempt${n>1?'s exist':' exists'} for this exam, so it cannot be deleted. Archive it instead to keep the history.`,'warn');return}
   X.confirm('Delete examination?',`<b>${esc(e.title)}</b> will be removed from the website and admin lists. Its questions stay stored but are hidden.`,()=>{DB.update('exams',e.id,{deleted:true,published:false});A.log('Deleted examination','Exam Management',e.title,'');A.render()},'Delete',true)}});

/* ============ CATEGORIES ============ */
X.reg('cats',{mod:'categories',title:'Exam categories',file:'exam-categories',rows:()=>DB.all('cats'),id:c=>String(c.id),search:c=>c.name,per:20,sort:{k:'order',dir:'asc'},
  filters:[{k:'active',label:'Status',options:()=>[['1','Active'],['0','Inactive']],match:(c,v)=>(c.active?'1':'0')===v}],
  cols:[{k:'name',label:'Category',get:c=>c.name,html:c=>`<b>${esc(c.name)}</b>`},{k:'order',label:'Order',get:c=>c.order},{k:'ex',label:'Examinations',get:c=>exams().filter(e=>e.categoryId===c.id).length},{k:'st',label:'Status',get:c=>c.active?'Active':'Inactive',html:c=>chip(c.active?'Active':'Inactive',c.active?'g':'')}],
  rowActions:c=>[A.can('categories','edit')&&`<button class="btn-s" data-xa="cat-edit" data-id="${c.id}">Edit</button>`,A.can('categories','publish')&&`<button class="btn-s" data-xa="cat-tog" data-id="${c.id}">${c.active?'Deactivate':'Activate'}</button>`,A.can('categories','delete')&&`<button class="btn-s d" data-xa="cat-del" data-id="${c.id}">Delete</button>`].filter(Boolean).join(''),
  toolbarHtml:()=>A.can('categories','add')?'<button class="btn-s p" data-xa="cat-new">+ Add category</button>':''});
A.P.categories=()=>X.dt('cats');
function catForm(c){const n=!c;c=c||{};X.form({title:n?'Add category':'Edit category',values:{name:c.name,order:c.order||DB.all('cats').length+1,active:n?true:c.active},fields:[{k:'name',label:'Category name',req:true,full:true,placeholder:'e.g. NEET'},{k:'order',label:'Display order',type:'number',min:1},{k:'active',label:'Active',type:'check'}],
  onSave:v=>{if(!need('categories',n?'add':'edit'))return false;if(DB.all('cats').some(x=>x.id!==c.id&&x.name.toLowerCase()===v.name.toLowerCase()))return 'This category already exists.';
   if(n)DB.add('cats',{name:v.name,slug:v.name.toLowerCase().replace(/\W+/g,'-'),order:v.order||99,active:v.active});else DB.update('cats',c.id,{name:v.name,slug:v.name.toLowerCase().replace(/\W+/g,'-'),order:v.order||c.order,active:v.active});
   A.log(n?'Added category':'Edited category','Exam Categories','',v.name);A.render();return true}})}
Object.assign(X.actions,{'cat-new':()=>need('categories','add')&&catForm(),'cat-edit':b=>need('categories','edit')&&catForm(DB.get('cats',b.dataset.id)),
 'cat-tog':b=>{if(!need('categories','publish'))return;const c=DB.get('cats',b.dataset.id);DB.update('cats',c.id,{active:!c.active});A.log('Toggled category','Exam Categories','',c.name);A.render()},
 'cat-del':b=>{if(!need('categories','delete'))return;const c=DB.get('cats',b.dataset.id);if(exams().some(e=>e.categoryId===c.id)){A.toast('Move or delete the examinations in this category first.','warn');return}X.confirm('Delete category?',esc(c.name),()=>{DB.remove('cats',c.id);A.log('Deleted category','Exam Categories',c.name,'');A.render()},'Delete',true)}});

/* ============ SECTIONS ============ */
const secRows=()=>exams().flatMap(e=>(e.sections||[]).map(s=>({e,s})));
const secQ=(e,s,all)=>DB.all('questions').filter(q=>q.examId===e.id&&q.sectionId===s.id&&(all||q.status==='active')).length;
X.reg('secs',{mod:'sections',title:'Sections',file:'exam-sections',rows:secRows,id:r=>r.e.id+':'+r.s.id,search:r=>[r.e.title,r.s.name,r.s.description].join(' '),per:20,sort:{k:'exam',dir:'asc'},
  filters:[{k:'exam',label:'Examination',options:()=>examOpts(),match:(r,v)=>r.e.id==v},{k:'en',label:'Status',options:()=>[['1','Enabled'],['0','Disabled']],match:(r,v)=>(r.s.enabled?'1':'0')===v}],
  cols:[{k:'exam',label:'Examination',get:r=>r.e.title},{k:'order',label:'Order',get:r=>r.s.order},{k:'name',label:'Section',get:r=>r.s.name,html:r=>`<b>${esc(r.s.name)}</b>${r.s.description?`<br><small style="color:var(--muted)">${esc(r.s.description)}</small>`:''}`},
   {k:'min',label:'Time limit',get:r=>r.s.minutes||0,html:r=>r.s.minutes?r.s.minutes+' min':'Shared timer'},{k:'plan',label:'Questions in test',get:r=>r.s.questions||0,html:r=>r.s.questions||'All active'},{k:'avail',label:'Active in bank',get:r=>secQ(r.e,r.s)},{k:'total',label:'Total in bank',get:r=>secQ(r.e,r.s,true)},
   {k:'marks',label:'Marks / correct',get:r=>r.s.marks??r.e.defaultMarks},{k:'neg',label:'Negative',get:r=>Math.abs(r.s.neg??r.e.defaultNeg??0)},{k:'st',label:'Status',get:r=>r.s.enabled?'Enabled':'Disabled',html:r=>chip(r.s.enabled?'Enabled':'Disabled',r.s.enabled?'g':'')}],
  rowActions:r=>[A.can('sections','edit')&&`<button class="btn-s" data-xa="sec-edit" data-id="${r.e.id}:${r.s.id}">Edit</button>`,A.can('sections','edit')&&`<button class="btn-s" data-xa="sec-up" data-id="${r.e.id}:${r.s.id}" title="Move earlier">↑</button><button class="btn-s" data-xa="sec-down" data-id="${r.e.id}:${r.s.id}" title="Move later">↓</button>`,
    A.can('sections','publish')&&`<button class="btn-s" data-xa="sec-tog" data-id="${r.e.id}:${r.s.id}">${r.s.enabled?'Disable':'Enable'}</button>`,A.can('sections','delete')&&`<button class="btn-s d" data-xa="sec-del" data-id="${r.e.id}:${r.s.id}">Delete</button>`].filter(Boolean).join(''),
  toolbarHtml:()=>A.can('sections','add')?'<button class="btn-s p" data-xa="sec-new">+ Add section</button>':''});
A.P.sections=()=>`<div class="notice">Sections belong to one examination. Leave an exam with no sections for a single-paper test. <b>Navigation rule:</b> turn on "Sectional timers" in Exam Management to run sections in a fixed order with a time limit each (students cannot go back); leave it off for one shared timer with free movement between sections.</div>`+X.dt('secs');
const getSec=id=>{const [a,b]=id.split(':').map(Number),e=DB.get('exams',a);return {e,s:e&&(e.sections||[]).find(x=>x.id===b)}};
function secForm(r){const n=!r;const e0=r?r.e:null,s=r?r.s:{};
  X.form({title:n?'Add section':'Edit section',saveLabel:n?'Add section':'Save section',values:{examId:e0?e0.id:'',name:s.name,description:s.description,minutes:s.minutes||0,questions:s.questions||0,marks:s.marks??'',neg:s.neg!==undefined?Math.abs(s.neg):'',enabled:n?true:s.enabled},
   fields:[{k:'examId',label:'Examination',type:'select',options:()=>examOpts(),blank:'Select…',req:true,disabled:!n},{k:'name',label:'Section name',req:true,placeholder:'e.g. Logical Reasoning'},{k:'description',label:'Description',full:true},
    {k:'minutes',label:'Time limit (minutes, 0 = shared timer)',type:'number',min:0},{k:'questions',label:'Questions in each test (0 = all active)',type:'number',min:0},
    {k:'marks',label:'Marks per correct answer',type:'number',min:0,step:'any',hint:'Leave empty to use the exam default.'},{k:'neg',label:'Negative marks per wrong answer',type:'number',min:0,step:'any',hint:'Leave empty for the exam default.'},
    {k:'enabled',label:'Enabled',type:'check'},{k:'apply',label:'Apply these marks to questions already in this section',type:'check',full:true}],
   onSave:v=>{if(!need('sections',n?'add':'edit'))return false;const e=n?DB.get('exams',v.examId):e0;if(!e)return 'Choose an examination.';
    if((e.sections||[]).some(x=>x.id!==s.id&&x.name.toLowerCase()===v.name.toLowerCase()))return 'This exam already has a section with that name.';
    const marks=v.marks===''?undefined:v.marks,neg=v.neg===''?undefined:-Math.abs(v.neg);
    if(n){if(!e.sections)e.sections=[];const id=e.sections.reduce((m,x)=>Math.max(m,x.id),0)+1;e.sections.push({id,name:v.name,description:v.description,order:e.sections.length+1,minutes:v.minutes||0,questions:v.questions||0,marks,neg,enabled:v.enabled});A.log('Added section','Exam Sections','',e.title+' / '+v.name)}
    else{Object.assign(s,{name:v.name,description:v.description,minutes:v.minutes||0,questions:v.questions||0,marks,neg,enabled:v.enabled});A.log('Edited section','Exam Sections','',e.title+' / '+v.name);
      if(v.apply){DB.all('questions').filter(q=>q.examId===e.id&&q.sectionId===s.id).forEach(q=>{if(marks!==undefined)q.marks=marks;if(neg!==undefined&&q.type!=='NUM'&&q.type!=='TEXT')q.neg=neg})}}
    DB.save();A.toast('Section saved.');A.render();return true}})}
Object.assign(X.actions,{'sec-new':()=>need('sections','add')&&secForm(),'sec-edit':b=>need('sections','edit')&&secForm(getSec(b.dataset.id)),
 'sec-tog':b=>{if(!need('sections','publish'))return;const r=getSec(b.dataset.id);r.s.enabled=!r.s.enabled;DB.save();A.log('Toggled section','Exam Sections','',r.e.title+' / '+r.s.name);A.render()},
 'sec-up':b=>moveSec(b,-1),'sec-down':b=>moveSec(b,1),
 'sec-del':b=>{if(!need('sections','delete'))return;const r=getSec(b.dataset.id),n=secQ(r.e,r.s,true);if(n){A.toast(`This section still has ${n} question${n>1?'s':''}. Move or delete them in the Question Bank first.`,'warn');return}
   X.confirm('Delete section?',esc(r.e.title+' / '+r.s.name),()=>{r.e.sections=r.e.sections.filter(x=>x.id!==r.s.id);DB.save();A.log('Deleted section','Exam Sections',r.e.title+' / '+r.s.name,'');A.render()},'Delete',true)}});
function moveSec(b,d){if(!need('sections','edit'))return;const r=getSec(b.dataset.id),l=r.e.sections.slice().sort((a,b)=>a.order-b.order),i=l.findIndex(x=>x.id===r.s.id),j=i+d;if(j<0||j>=l.length)return;[l[i],l[j]]=[l[j],l[i]];l.forEach((x,k)=>x.order=k+1);DB.save();A.log('Reordered sections','Exam Sections','',r.e.title);A.render()}

/* ============ MOCK TEST MANAGEMENT ============ */
const liveState=e=>!e.published?'Draft':e.archived?'Archived':DB.isLive(e)?'Live':'No questions';
X.reg('mocks',{mod:'mocks',title:'Mock tests',file:'mock-tests',rows:()=>exams(),id:e=>String(e.id),search:e=>e.title+' '+DB.catName(e.categoryId),per:20,
  filters:[{k:'cat',label:'Category',options:()=>DB.all('cats').map(c=>[c.id,c.name]),match:(e,v)=>e.categoryId==v},{k:'live',label:'Test status',options:()=>['Live','No questions','Draft','Archived'].map(x=>[x,x]),match:(e,v)=>liveState(e)===v},{k:'free',label:'Pricing',options:()=>[['1','Free'],['0','Paid']],match:(e,v)=>(e.free?'1':'0')===v}],
  cols:[{k:'t',label:'Mock test',get:e=>e.title,html:e=>`<b>${esc(e.title)}</b>`},{k:'c',label:'Category',get:e=>DB.catName(e.categoryId)},{k:'s',label:'Test status',get:liveState,html:e=>chip(liveState(e),liveState(e)==='Live'?'g':liveState(e)==='No questions'?'y':'')},
   {k:'q',label:'Questions in paper',get:e=>DB.buildPaper(e).qids.length},{k:'d',label:'Minutes',get:e=>e.duration},{k:'tm',label:'Timer',get:e=>e.sectionTimers?'Per section':'Single'},{k:'al',label:'Attempt limit',get:e=>e.attemptLimit||'Unlimited'},{k:'rs',label:'Resume',get:e=>e.allowResume?'Allowed':'Not allowed'},
   {k:'p',label:'Pricing',get:e=>e.free?'Free':'Paid'},{k:'at',label:'Attempts',get:e=>attemptsOf(e.id)},{k:'avg',label:'Avg %',get:e=>{const d=X.attempts().filter(a=>a.examId===e.id&&a.status==='submitted');return d.length?+(d.reduce((n,a)=>n+a.result.percentage,0)/d.length).toFixed(1):''}}],
  rowActions:e=>[A.can('mocks','edit')&&`<button class="btn-s" data-xa="ex-edit" data-id="${e.id}">Settings</button>`,A.can('mocks','publish')&&`<button class="btn-s" data-xa="ex-pub" data-id="${e.id}">${e.published?'Unpublish':'Publish'}</button>`,`<button class="btn-s" data-xa="mk-att" data-id="${e.id}">Attempts</button>`,`<a class="btn-s" href="instructions.html?e=${e.id}" target="_blank" rel="noopener">Open</a>`].filter(Boolean).join('')});
A.P.mocks=()=>`<div class="notice">A mock test is an examination that students can attempt. "No questions" means it is published but has no active questions yet, so students see "Coming soon".</div>`+X.dt('mocks');
X.pending={};
X.actions['mk-att']=b=>{if(!A.can('attempts'))return A.toast('Your role cannot open Examination Attempts.','warn');X.pending.attempts={exam:b.dataset.id};A.go('attempts')};
})();
