(function(){
const {$,esc}=HS,u=HS.api.me(),sid=u?u.studentId:'',P=new URLSearchParams(location.search);
HS.header([['Home','index.html'],['Flashcard Learning']]);HS.footer();
let view='library',tab='library',S={deck:null,q:[],i:0,flip:false,mode:'smart',seen:0,known:0,rev:0,done:false},F={q:'',exam:'',subject:'',topic:''};
const needLogin=()=>{if(u)return false;HS.auth.open('login',{next:location.pathname.split('/').pop()+location.search});return true};
HS.act('flashcards_opened',{tool:'flashcards'});
const decks=()=>HS.fc.visibleDecks(sid),examOpts=()=>HS.db.publicExams().map(e=>`<option value="${e.id}">${esc(e.title)}</option>`).join('');
const uniq=l=>[...new Set(l.filter(Boolean))].sort();
const pill=(t)=>`<span class="pill" style="font-size:12px;padding:4px 10px">${esc(t)}</span>`;

function library(){
  const all=decks(),sub=uniq(all.map(d=>d.subject)),top=uniq(all.filter(d=>!F.subject||d.subject===F.subject).map(d=>d.topic));
  const list=all.filter(d=>d.owner==='admin'||d.visibility==='public').filter(d=>(!F.exam||d.examId==F.exam)&&(!F.subject||d.subject===F.subject)&&(!F.topic||d.topic===F.topic)&&(!F.q||(d.title+' '+d.subject+' '+d.topic).toLowerCase().includes(F.q.toLowerCase())));
  const fcs=u?HS.fc.stats(sid):null;
  return `<div class="tabs-s"><button data-tab="library" class="on">Deck library</button><button data-tab="mine">My decks</button><button data-tab="bookmarks">Bookmarked cards</button></div>
   ${fcs?`<div class="fc-prog"><span><b>${fcs.reviews}</b> cards reviewed in total</span><span><b>${fcs.pending}</b> pending revisions</span><span><b>${fcs.decksDone}</b> decks completed</span></div>`:''}
   <div class="filters" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px"><input id="f-q" placeholder="Search decks…" value="${esc(F.q)}" style="padding:10px 14px;border:1px solid var(--line);border-radius:10px;min-width:210px">
    <select id="f-exam" class="fi"><option value="">All examinations</option>${examOpts()}</select><select id="f-sub" class="fi"><option value="">All subjects</option>${sub.map(s=>`<option ${s===F.subject?'selected':''}>${esc(s)}</option>`).join('')}</select><select id="f-top" class="fi"><option value="">All topics</option>${top.map(s=>`<option ${s===F.topic?'selected':''}>${esc(s)}</option>`).join('')}</select><button class="btn btn-ghost" id="f-clear">Clear</button></div>
   ${list.length?`<div class="lib-grid">${list.map(d=>{const st=u?HS.fc.deckStats(sid,d.id):{total:HS.fc.deckCards(d.id).length,reviewed:0,known:0,revise:0,pct:0};
     return `<article class="card deck"><h3>${esc(d.title)}</h3><div>${pill(HS.db.examName(d.examId)==='—'?'General':HS.db.examName(d.examId))}${d.subject?' '+pill(d.subject):''}${d.topic?' '+pill(d.topic):''}</div><p class="muted" style="margin:0;font-size:14px">${esc(d.description||'')}</p>
      <div class="prog" aria-label="${st.pct}% reviewed"><i style="width:${st.pct}%"></i></div><small class="muted">${st.total} cards · ${st.reviewed} reviewed · ${st.known} known · ${st.revise} need revision</small>
      <div class="row"><button class="btn btn-primary" data-study="${d.id}">${st.reviewed?'Continue':'Start'}</button>${st.revise?`<button class="btn btn-ghost" data-study="${d.id}" data-mode="revise">Revise (${st.revise})</button>`:''}</div></article>`}).join('')}</div>`
    :`<div class="card empty"><h3 style="margin:0 0 6px">No decks match</h3><p>Try clearing the filters. New decks are added by our team regularly.</p></div>`}
   <div class="soft-cta"><p>Looking for structured preparation resources? Explore Higher.Study.</p><a class="btn btn-ghost" href="https://higher.study/exams" target="_blank" rel="noopener" data-counsel="flashcards">Explore Higher.Study</a></div>`}

function startStudy(id,mode){const d=HS.db.get('decks',id);if(!d)return;if(needLogin())return;
  S={deck:d,mode:mode||'smart',q:HS.fc.queue(sid,id,mode||'smart'),i:0,flip:false,seen:0,known:0,rev:0,done:false};view='study';HS.act('flashcard_deck_opened',{examId:d.examId,subject:d.subject,topic:d.topic,tool:'flashcards',deckId:d.id});render()}
function study(){
  const d=S.deck,st=HS.fc.deckStats(sid,d.id),c=S.q[S.i],later=HS.fc.scheduledLater(sid,d.id);
  const head=`<p><a href="#" id="back">‹ All decks</a></p><h2 style="margin:6px 0 4px">${esc(d.title)}</h2><div class="fc-prog"><span>Total <b>${st.total}</b></span><span>Reviewed <b>${st.reviewed}</b></span><span>Known <b>${st.known}</b></span><span>Need revision <b>${st.revise}</b></span><span>Completion <b>${st.pct}%</b></span></div>
    <div class="deck"><div class="prog" style="max-width:640px;margin:0 auto 12px"><i style="width:${st.pct}%"></i></div></div>
    <div class="fc-bar" style="margin-bottom:10px"><label class="muted">Cards: <select id="mode"><option value="smart" ${S.mode==='smart'?'selected':''}>Smart order (due first)</option><option value="all" ${S.mode==='all'?'selected':''}>All cards, shuffled</option><option value="revise" ${S.mode==='revise'?'selected':''}>Need revision only</option><option value="bookmarks" ${S.mode==='bookmarks'?'selected':''}>Bookmarked only</option></select></label></div>`;
  if(!c||S.done){return `<div class="fc-wrap">${head}<div class="card empty"><h3 style="margin:0 0 6px">${S.q.length?'Session complete':'Nothing to study right now'}</h3><p>${S.q.length?`You reviewed ${S.seen} card${S.seen===1?'':'s'}: ${S.known} known, ${S.rev} to revise.`:'No cards are due in this mode.'}${later?` ${later} known card${later===1?' is':'s are'} scheduled for a later review.`:''}</p><div class="fc-bar"><button class="btn btn-primary" id="again">Study again</button><button class="btn btn-ghost" id="back2">Back to decks</button></div></div></div>`}
  const p=HS.fc.progress(sid,c.id);
  return `<div class="fc-wrap">${head}<p class="muted" style="text-align:center;margin:0">Card ${S.i+1} of ${S.q.length}${later?` · ${later} scheduled for later`:''}</p>
   <div class="fc ${S.flip?'flip':''}" id="card" tabindex="0" role="button" aria-label="Flip card"><div class="fc-in"><div class="fc-f"><small>Question</small>${esc(c.front)}</div><div class="fc-b"><small>Answer</small>${esc(c.back)}${c.expl?`<div style="font-size:14px;font-weight:600;color:var(--muted);margin-top:12px">${esc(c.expl)}</div>`:''}</div></div></div>
   <div class="fc-bar"><button class="btn btn-ghost" id="prev" ${S.i?'':'disabled'}>‹ Previous</button><button class="btn btn-ghost" id="flip">Flip</button><button class="btn btn-ghost" id="next" ${S.i<S.q.length-1?'':'disabled'}>Next ›</button><button class="btn btn-ghost" id="shuf">Shuffle</button><button class="btn btn-ghost" id="bm" aria-pressed="${p.bookmark}">${p.bookmark?'★ Bookmarked':'☆ Bookmark'}</button></div>
   <div class="fc-bar" style="margin-top:12px"><button class="btn btn-warn" id="rev">Need revision</button><button class="btn btn-ok" id="known">Known</button></div>
   <details style="margin-top:14px"><summary class="muted" style="cursor:pointer">Personal note</summary><textarea id="note" rows="3" maxlength="1000" style="width:100%;margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:10px;font-family:inherit" placeholder="Only you can see this note">${esc(p.note)}</textarea></details></div>`}

function mine(){
  if(!u)return `<div class="card empty"><h3>Log in to create your own decks</h3><button class="btn btn-primary" id="login">Login / Register</button></div>`;
  const my=HS.db.all('decks').filter(d=>d.owner===sid);
  const sts={private:'Private',pending:'Waiting for approval',public:'Published'};
  return `<div class="tabs-s"><button data-tab="library">Deck library</button><button data-tab="mine" class="on">My decks</button><button data-tab="bookmarks">Bookmarked cards</button></div>
   <p class="muted">Your decks are private. You can send one for approval and our team may publish it for everyone.</p>
   <div class="card panel-c"><h3>Create a deck</h3><div class="filters" style="display:flex;gap:10px;flex-wrap:wrap"><input id="nd-t" placeholder="Deck title" maxlength="80" style="padding:10px 14px;border:1px solid var(--line);border-radius:10px;flex:1;min-width:200px"><select id="nd-e" class="fi"><option value="">Examination (optional)</option>${examOpts()}</select><input id="nd-s" placeholder="Subject (optional)" maxlength="60" style="padding:10px 14px;border:1px solid var(--line);border-radius:10px"><input id="nd-p" placeholder="Topic (optional)" maxlength="60" style="padding:10px 14px;border:1px solid var(--line);border-radius:10px"><button class="btn btn-primary" id="nd-go">Create deck</button></div></div>
   ${my.map(d=>{const cs=HS.fc.deckCards(d.id);return `<div class="card panel-c" style="margin-top:16px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><h3 style="margin:0">${esc(d.title)} <span class="chip ${d.visibility==='public'?'g':d.visibility==='pending'?'y':''}">${sts[d.visibility]||d.visibility}</span></h3>
     <div style="display:flex;gap:8px;flex-wrap:wrap">${cs.length?`<button class="btn btn-ghost" data-study="${d.id}">Study</button>`:''}${d.visibility==='private'&&cs.length?`<button class="btn btn-ghost" data-submit="${d.id}">Submit for approval</button>`:''}<button class="btn btn-ghost" data-deldeck="${d.id}">Delete deck</button></div></div>
     ${d.rejectNote?`<p class="muted">Admin note: ${esc(d.rejectNote)}</p>`:''}
     <div class="tbl-wrap" style="margin-top:10px"><table class="tbl"><tbody>${cs.map(c=>`<tr><td>${esc(c.front)}</td><td>${esc(c.back)}</td><td style="white-space:nowrap">${d.visibility==='pending'?'':`<button class="btn btn-ghost" data-editc="${c.id}">Edit</button> <button class="btn btn-ghost" data-delc="${c.id}">Delete</button>`}</td></tr>`).join('')||'<tr><td class="muted">No cards yet.</td></tr>'}</tbody></table></div>
     ${d.visibility==='pending'?'<p class="muted">Cards cannot be changed while the deck waits for approval.</p>':`<div class="filters" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px"><input id="ac-f-${d.id}" placeholder="Question or concept" maxlength="500" style="padding:10px 14px;border:1px solid var(--line);border-radius:10px;flex:1;min-width:180px"><input id="ac-b-${d.id}" placeholder="Answer" maxlength="1000" style="padding:10px 14px;border:1px solid var(--line);border-radius:10px;flex:1;min-width:180px"><button class="btn btn-primary" data-addc="${d.id}">Add card</button></div>
     <details style="margin-top:10px"><summary class="muted" style="cursor:pointer">Add many cards from text (one per line: Question :: Answer)</summary><textarea id="bulk-${d.id}" rows="4" style="width:100%;margin-top:8px;padding:10px;border:1px solid var(--line);border-radius:10px;font-family:inherit" placeholder="Derivative of sin x :: cos x"></textarea><button class="btn btn-ghost" data-bulk="${d.id}" style="margin-top:8px">Add these cards</button></details>`}</div>`}).join('')}`}
function bookmarks(){
  const list=HS.db.all('cards').filter(c=>HS.fc.progress(sid,c.id).bookmark&&decks().some(d=>d.id===c.deckId));
  return `<div class="tabs-s"><button data-tab="library">Deck library</button><button data-tab="mine">My decks</button><button data-tab="bookmarks" class="on">Bookmarked cards</button></div>${list.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Question</th><th>Answer</th><th>Deck</th><th></th></tr></thead><tbody>${list.map(c=>`<tr><td>${esc(c.front)}</td><td>${esc(c.back)}</td><td>${esc((HS.db.get('decks',c.deckId)||{}).title||'')}</td><td><button class="btn btn-ghost" data-unbm="${c.id}">Remove</button></td></tr>`).join('')}</tbody></table></div>`:`<div class="card empty"><h3 style="margin:0 0 6px">No bookmarks yet</h3><p>Tap the star on a card while studying to save it here.</p></div>`}`}

function render(){
  let h;if(view==='study')h=study();else if(tab==='mine')h=mine();else if(tab==='bookmarks')h=u?bookmarks():`<div class="card empty"><h3>Log in to see your bookmarks</h3><button class="btn btn-primary" id="login">Login / Register</button></div>`;else h=library();
  $('#page').innerHTML=`<section class="dash-hero"><h1>Flashcard Learning</h1><p>Revise formulas, definitions and concepts. Cards you find hard come back sooner.</p></section>`+h;
  const fe=$('#f-exam');if(fe)fe.value=F.exam}
render();if(P.get('deck'))startStudy(+P.get('deck'));

const cur=()=>S.q[S.i];
function mark(r){const c=cur();if(!c)return;HS.fc.mark(sid,c,r);S.seen++;r==='known'?S.known++:S.rev++;if(S.i<S.q.length-1){S.i++;S.flip=false}else S.done=true;render()}
document.addEventListener('keydown',e=>{if(view!=='study'||S.done||!cur()||/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))return;
  if(e.key===' '||e.key==='Enter'){e.preventDefault();S.flip=!S.flip;render()}else if(e.key==='ArrowRight'&&S.i<S.q.length-1){S.i++;S.flip=false;render()}else if(e.key==='ArrowLeft'&&S.i>0){S.i--;S.flip=false;render()}});
document.addEventListener('input',e=>{const t=e.target;
  if(t.id==='f-q'){F.q=t.value;const pos=t.selectionStart;render();const n=$('#f-q');n.focus();n.setSelectionRange(pos,pos)}
  else if(t.id==='note'&&cur())HS.fc.saveNote(sid,cur().id,t.value)});
document.addEventListener('change',e=>{const t=e.target;
  if(t.id==='f-exam'){F.exam=t.value;render()}else if(t.id==='f-sub'){F.subject=t.value;F.topic='';render()}else if(t.id==='f-top'){F.topic=t.value;render()}
  else if(t.id==='mode'){startStudy(S.deck.id,t.value)}});
document.addEventListener('click',e=>{const t=e.target.closest('button,a,#card');if(!t)return;
  if(t.dataset.tab){tab=t.dataset.tab;view='library';if(tab!=='library'&&!u&&tab==='mine'){}render();return}
  if(t.id==='f-clear'){F={q:'',exam:'',subject:'',topic:''};render();return}
  if(t.dataset.study){startStudy(+t.dataset.study,t.dataset.mode);return}
  if(t.id==='back'||t.id==='back2'){e.preventDefault();view='library';render();return}
  if(t.id==='again'){startStudy(S.deck.id,S.mode);return}
  if(t.id==='login'){needLogin();return}
  if(t.id==='card'||t.id==='flip'){S.flip=!S.flip;render();return}
  if(t.id==='prev'&&S.i>0){S.i--;S.flip=false;render();return}
  if(t.id==='next'&&S.i<S.q.length-1){S.i++;S.flip=false;render();return}
  if(t.id==='shuf'){const c=S.q.slice(S.i);for(let i=c.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[c[i],c[j]]=[c[j],c[i]]}S.q=S.q.slice(0,S.i).concat(c);S.flip=false;render();return}
  if(t.id==='bm'){HS.fc.toggleBookmark(sid,cur().id);render();return}
  if(t.id==='known'){mark('known');return}if(t.id==='rev'){mark('revise');return}
  if(t.dataset.unbm){HS.fc.toggleBookmark(sid,+t.dataset.unbm);render();return}
  if(t.id==='nd-go'){const title=$('#nd-t').value.trim();if(!title){HS.toast('Give the deck a title.','warn');return}HS.fc.createDeck(sid,{title,examId:$('#nd-e').value,subject:$('#nd-s').value.trim(),topic:$('#nd-p').value.trim()});HS.toast('Deck created. Add your cards below.');render();return}
  if(t.dataset.addc){const id=+t.dataset.addc,f=$('#ac-f-'+id).value.trim(),b=$('#ac-b-'+id).value.trim();if(!f||!b){HS.toast('Enter both a question and an answer.','warn');return}HS.fc.addCard(sid,id,{front:f,back:b});render();return}
  if(t.dataset.bulk){const id=+t.dataset.bulk,rows=HS.fc.parseLines($('#bulk-'+id).value);if(!rows.length){HS.toast('No lines in the form Question :: Answer were found.','warn');return}rows.slice(0,200).forEach(r=>HS.fc.addCard(sid,id,r));HS.toast(rows.length+' card(s) added.');render();return}
  if(t.dataset.delc){const c=HS.db.get('cards',t.dataset.delc),d=c&&HS.db.get('decks',c.deckId);if(HS.fc.canEdit(sid,d)){HS.db.remove('cards',c.id);render()}return}
  if(t.dataset.editc){const c=HS.db.get('cards',t.dataset.editc),d=c&&HS.db.get('decks',c.deckId);if(!HS.fc.canEdit(sid,d))return;const f=prompt('Question or concept',c.front);if(f===null)return;const b=prompt('Answer',c.back);if(b===null)return;if(f.trim()&&b.trim()){HS.db.update('cards',c.id,{front:f.trim().slice(0,500),back:b.trim().slice(0,1000)});render()}return}
  if(t.dataset.deldeck){const d=HS.db.get('decks',t.dataset.deldeck);if(HS.fc.canEdit(sid,d)&&confirm('Delete this deck and all its cards?')){HS.db.all('cards').filter(c=>c.deckId===d.id).forEach(c=>HS.db.remove('cards',c.id));HS.db.remove('decks',d.id);render()}return}
  if(t.dataset.submit){if(HS.fc.submitForApproval(sid,+t.dataset.submit)){HS.toast('Sent for approval. It stays private until an admin publishes it.');render()}return}
});
})();
