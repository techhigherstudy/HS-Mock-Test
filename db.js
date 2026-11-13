/* HS.db — one shared store for the public site and the admin panel (browser localStorage in this prototype;
   becomes MySQL tables in the Laravel phase: exams, exam_sections, questions, exam_categories, colleges, college_cutoffs, papers, study_materials, menus).
   Everything the pages show comes from here, so the admin panel changes the website without code edits. */
window.HS=window.HS||{};
(function(){
const KEY='hs_db_v1';
const SAMPLE_PDF='data:application/pdf;base64,JVBERi0xLjEKMSAwIG9iajw8L1R5cGUvQ2F0YWxvZy9QYWdlcyAyIDAgUj4+ZW5kb2JqCjIgMCBvYmo8PC9UeXBlL1BhZ2VzL0tpZHNbMyAwIFJdL0NvdW50IDE+PmVuZG9iagozIDAgb2JqPDwvVHlwZS9QYWdlL1BhcmVudCAyIDAgUi9NZWRpYUJveFswIDAgMzAwIDE1MF0vQ29udGVudHMgNCAwIFIvUmVzb3VyY2VzPDwvRm9udDw8L0YxIDUgMCBSPj4+Pj4+ZW5kb2JqCjQgMCBvYmo8PC9MZW5ndGggNzQ+PnN0cmVhbQpCVCAvRjEgMTQgVGYgMjAgODAgVGQgKFNhbXBsZSBmaWxlIC0gcmVwbGFjZSBpbiBBZG1pbiBwYW5lbCkgVGogRVQKZW5kc3RyZWFtIGVuZG9iago1IDAgb2JqPDwvVHlwZS9Gb250L1N1YnR5cGUvVHlwZTEvQmFzZUZvbnQvSGVsdmV0aWNhPj5lbmRvYmoKdHJhaWxlcjw8L1Jvb3QgMSAwIFIvU2l6ZSA2Pj4KJSVFT0Y=';
const now=()=>new Date().toISOString();
let DB=null;


/* ---- Daily Quiz / Flashcards collections (MySQL tables in the Laravel phase: daily_quizzes, daily_quiz_questions, flashcard_decks, flashcards, admin_notices) ---- */
function seedLearn(D){
  const n=now(),mk=(id,title,examId,sectionId,subject,topic,description,cards)=>({deck:{id,title,examId,sectionId,subject,topic,description,published:true,visibility:'public',owner:'admin',sample:true,createdAt:n},cards});
  const sets=[
   mk(1,'CAT Quantitative Aptitude Formulas',1,3,'Quantitative Ability','Formulae','Core formulas for quick revision (sample deck: edit or replace in Admin > Flashcards).',[
    ['Sum of the first n natural numbers','n(n + 1) / 2'],['Amount under compound interest','A = P(1 + r/100)^n'],['Profit percentage','(Profit / Cost price) × 100'],
    ['Average speed for equal distances at speeds a and b','2ab / (a + b)'],['Days taken together if A needs a days and B needs b days','ab / (a + b)'],['Probability of an event','Favourable outcomes / Total outcomes'],
    ['Number of diagonals in an n-sided polygon','n(n − 3) / 2'],['Sum of n terms of a GP (r ≠ 1)','a(r^n − 1) / (r − 1)']]),
   mk(2,'CAT VARC Vocabulary',1,1,'VARC','Vocabulary','Frequently used words (sample deck).',[
    ['Ephemeral','Lasting for a very short time'],['Ubiquitous','Present or found everywhere'],['Equivocal','Open to more than one interpretation; ambiguous'],
    ['Pragmatic','Dealing with things in a sensible, practical way'],['Laconic','Using very few words'],['Obfuscate','To make something unclear or hard to understand']]),
   mk(3,'GATE Engineering Mathematics Essentials',3,2,'Engineering Mathematics','Linear Algebra & Calculus','Short reminders (sample deck).',[
    ['Rank–nullity theorem','rank(A) + nullity(A) = number of columns of A'],['Characteristic equation of A','det(A − λI) = 0'],['Derivative of ln x','1 / x'],
    ['Integral of e^x','e^x + C'],['P(A ∪ B)','P(A) + P(B) − P(A ∩ B)'],['Sum of the eigenvalues of a matrix','Trace of the matrix'],['Product of the eigenvalues of a matrix','Determinant of the matrix']])];
  const decks=[],cards=[];sets.forEach(s=>{decks.push(s.deck);s.cards.forEach(c=>cards.push({id:cards.length+1,deckId:s.deck.id,front:c[0],back:c[1],expl:'',img:'',subject:s.deck.subject,topic:s.deck.topic,createdAt:n}))});
  return {decks,cards,dailyq:[],notices:[]};
}
const LEARN_MENU=[{key:'daily',label:'Daily Quiz Challenge',href:'daily.html'},{key:'perf',label:'My Performance',href:'performance.html'},{key:'flash',label:'Flashcard Learning',href:'flashcards.html'}];
function migrate(d){let ch=false;
  if(!d.decks){Object.assign(d,seedLearn());ch=true}
  ['dailyq','notices','cards','decks'].forEach(k=>{if(!d[k]){d[k]=[];ch=true}});
  LEARN_MENU.forEach(m=>{if(!d.menu.some(x=>x.key===m.key)){d.menu.push({id:d.menu.reduce((a,x)=>Math.max(a,x.id),0)+1,group:'tools',key:m.key,label:m.label,href:m.href,order:d.menu.filter(x=>x.group==='tools').length+1,visible:true});ch=true}});
  return ch}

function seed(){
  const D=window.HS_DATA||{exam:{sections:[],instructions:[]},questions:[]};
  let id=0;const nid=()=>++id;
  const cats=['CAT','GATE','CUET','MAT','XAT','SNAP','NMAT'].map((n,i)=>({id:i+1,name:n,slug:n.toLowerCase(),order:i+1,active:true}));
  const catId=n=>cats.find(c=>c.name===n).id;
  const exams=[],questions=[];
  const mkExam=o=>{const e=Object.assign({id:0,slug:'',title:'',categoryId:1,description:'',logo:'',difficulty:'Moderate',free:true,published:true,archived:false,deleted:false,duration:60,totalMarks:0,passMarks:0,
    examDate:'',eligibility:'',info:'',visibility:'public',attemptLimit:0,allowResume:true,sectionTimers:false,showSolutions:'after',defaultMarks:1,defaultNeg:0,instructions:[],sections:[],createdAt:now()},o);
    e.id=exams.length+1;e.slug=e.slug||e.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');exams.push(e);return e};
  const sec=(i,name,desc,minutes,count,marks,neg)=>({id:i,name,description:desc||'',order:i,minutes:minutes||0,questions:count||0,marks,neg,enabled:true});
  const addQ=(exam,secId,o)=>{const q=Object.assign({id:0,examId:exam.id,sectionId:secId||0,subject:'',topic:'',type:'MCQ',q:'',img:'',passage:'',options:[],correct:0,expl:'',marks:exam.defaultMarks,neg:exam.defaultNeg,diff:'Moderate',status:'active',createdAt:now()},o);
    q.neg=-Math.abs(q.neg||0);q.id=questions.length+1;questions.push(q);return q};

  /* --- CAT Full Length Mock 1 (the reference exam from the video) --- */
  const ce=D.exam;
  const cat1=mkExam({title:ce.title,categoryId:catId('CAT'),description:ce.description,difficulty:ce.difficulty,duration:ce.duration,totalMarks:ce.totalMarks,passMarks:61,
    sectionTimers:true,allowResume:true,attemptLimit:1,defaultMarks:3,defaultNeg:-1,instructions:ce.instructions.slice(),
    eligibility:'Bachelor’s degree with at least 50% marks (45% for reserved categories) or equivalent.',info:'Sectional timers: VARC, DILR and QA 40 minutes each, fixed order.',
    sections:ce.sections.map((s,i)=>sec(i+1,s.id,s.name,s.minutes,s.count,3,-1))});
  const sid={};cat1.sections.forEach(s=>sid[s.name]=s.id);
  (D.questions||[]).forEach(o=>{
    addQ(cat1,sid[o.section],{subject:o.section,topic:o.section==='VARC'?'Reading Comprehension':o.section==='DILR'?'Data Interpretation':'Arithmetic',type:o.type==='TITA'?'NUM':'MCQ',q:o.q,passage:o.passage||'',
      options:o.o||[],correct:o.type==='TITA'?String(o.ans):o.a,expl:o.sol||'',marks:3,neg:o.type==='TITA'?0:1})});
  mkExam({title:'CAT Full Length Mock 2',categoryId:catId('CAT'),description:'Real 3-section pattern · sectional timers · auto-submit',duration:120,totalMarks:204,passMarks:61,sectionTimers:true,attemptLimit:1,defaultMarks:3,defaultNeg:-1,
    sections:ce.sections.map((s,i)=>sec(i+1,s.id,s.name,s.minutes,s.count,3,-1)),instructions:ce.instructions.slice()});

  /* --- GATE Mock Test 1: custom sections, one global timer --- */
  const gate=mkExam({title:'GATE Mock Test 1',categoryId:catId('GATE'),description:'General Aptitude and Engineering Mathematics practice paper (sample)',difficulty:'Moderate',duration:60,totalMarks:18,passMarks:7,
    sectionTimers:false,allowResume:true,attemptLimit:0,defaultMarks:1,defaultNeg:-0.33,
    instructions:['One timer runs for the whole paper; you can move between sections freely.','General Aptitude questions carry 1 mark (negative 0.33).','Engineering Mathematics questions carry 2 marks (negative 0.66). MSQ has no partial credit; NUMERICAL answers have no negative marking.','Submit before the timer ends or the paper is submitted automatically.'],
    sections:[sec(1,'General Aptitude','Verbal and numerical aptitude',0,6,1,-0.33),sec(2,'Engineering Mathematics','Linear algebra, calculus, basics',0,6,2,-0.66)]});
  const GA=[['Choose the word closest in meaning to "candid".',['frank','secretive','polite','rude'],0,'"Candid" means open and honest, so "frank".'],
   ['If 5 workers complete a task in 12 days, how many days will 10 workers take at the same rate?',['3','6','12','24'],1,'Work = 5×12 = 60 worker-days; 60/10 = 6 days.'],
   ['Fill in the blank: She ____ to the market every Sunday.',['go','goes','going','gone'],1,'Third-person singular present: "goes".'],
   ['A shop gives 20% discount on a ₹500 item. The selling price is:',['₹380','₹400','₹420','₹450'],1,'500 × 0.8 = 400.'],
   ['Which number completes the series 2, 6, 12, 20, ?',['28','30','32','36'],1,'Differences 4, 6, 8, 10 → 20 + 10 = 30.'],
   ['Choose the correct spelling.',['Accommodation','Acommodation','Accomodation','Acomodation'],0,'Two c’s and two m’s.']];
  GA.forEach(g=>addQ(gate,1,{subject:'General Aptitude',topic:'Mixed',q:g[0],options:g[1],correct:g[2],expl:g[3],marks:1,neg:0.33}));
  const em=[
   {type:'MCQ',q:'The value of the determinant |1 2; 3 4| is:',options:['-2','2','10','-10'],correct:0,expl:'1×4 − 2×3 = −2.',topic:'Linear Algebra'},
   {type:'MCQ',q:'The derivative of x³ at x = 2 equals:',options:['6','8','12','3'],correct:2,expl:'3x² = 12 at x = 2.',topic:'Calculus'},
   {type:'MSQ',q:'Which of the following are prime numbers? (select all)',options:['2','9','11','15'],correct:[0,2],expl:'2 and 11 are prime.',topic:'Number Theory'},
   {type:'NUM',q:'Evaluate the integral of 2x dx from 0 to 1.',correct:'1',expl:'x² evaluated from 0 to 1 = 1.',topic:'Calculus',neg:0},
   {type:'NUM',q:'What is the sum of the first 10 natural numbers?',correct:'55',expl:'10×11/2 = 55.',topic:'Series',neg:0},
   {type:'MCQ',q:'If A is a 3×3 matrix with det(A) = 4, then det(2A) equals:',options:['8','16','32','64'],correct:2,expl:'det(kA) = k³ det(A) = 8×4 = 32.',topic:'Linear Algebra'}];
  em.forEach(o=>addQ(gate,2,Object.assign({subject:'Engineering Mathematics',marks:2,neg:o.neg===0?0:0.66},o)));

  /* --- CUET Practice Test: no sections, mixed question types --- */
  const cuet=mkExam({title:'CUET Practice Test',categoryId:catId('CUET'),description:'Short mixed-type practice test with no sections (sample)',difficulty:'Easy',duration:30,totalMarks:40,passMarks:16,
    sectionTimers:false,allowResume:false,attemptLimit:3,defaultMarks:5,defaultNeg:-1,
    instructions:['This test has no sections and one 30-minute timer.','Each question carries 5 marks. Wrong MCQ / True-False answers lose 1 mark.','If you leave the test it is submitted with your saved answers.'],sections:[]});
  [{type:'MCQ',q:'Which of the following is the capital of Australia?',options:['Sydney','Canberra','Melbourne','Perth'],correct:1,expl:'Canberra is the capital.',subject:'General Knowledge'},
   {type:'MCQ',q:'The chemical symbol for gold is:',options:['Ag','Au','Gd','Go'],correct:1,expl:'Au, from Latin aurum.',subject:'Chemistry'},
   {type:'MSQ',q:'Select all even numbers.',options:['2','3','8','10'],correct:[0,2,3],expl:'2, 8 and 10 are even.',subject:'Mathematics',neg:0},
   {type:'NUM',q:'What is 15% of 200?',correct:'30',expl:'0.15 × 200 = 30.',subject:'Mathematics',neg:0},
   {type:'TF',q:'The Earth revolves around the Sun.',options:['True','False'],correct:0,expl:'True.',subject:'Science'},
   {type:'TEXT',q:'Name the largest planet in our solar system.',correct:'Jupiter',expl:'Jupiter.',subject:'Science',neg:0},
   {type:'MCQ',q:'Which of these is a noun?',options:['run','quickly','happiness','beautiful'],correct:2,expl:'"Happiness" is a noun.',subject:'English'},
   {type:'NUM',q:'If x + 7 = 19, what is x?',correct:'12',expl:'x = 12.',subject:'Mathematics',neg:0}].forEach(o=>addQ(cuet,0,o));

  /* --- sample colleges (clearly fictional; replace through Admin > College Management) --- */
  const colleges=[
   {id:1,name:'Demo Institute of Management',short:'DIM',color:'#ca452e',city:'Pune',state:'Maharashtra',type:'Private',published:true,sample:true,fees:'₹ 18 lakh (total)',admissionUrl:'https://higher.study/colleges',
    eligibility:'Graduation with 50% marks. Valid CAT score.',courses:['MBA','PGDM'],
    cutoffs:[{id:1,examId:1,course:'MBA',category:'General',metric:'score',value:85,year:2025},{id:2,examId:1,course:'MBA',category:'OBC',metric:'score',value:78,year:2025}]},
   {id:2,name:'Sample School of Business',short:'SSB',color:'#7c3aed',city:'Bengaluru',state:'Karnataka',type:'Private',published:true,sample:true,fees:'₹ 12 lakh (total)',admissionUrl:'https://higher.study/colleges',
    eligibility:'Graduation. CAT / MAT score accepted.',courses:['MBA'],
    cutoffs:[{id:3,examId:1,course:'MBA',category:'All',metric:'score',value:70,year:2025}]},
   {id:3,name:'Example Technical University',short:'ETU',color:'#16803f',city:'Hyderabad',state:'Telangana',type:'Government',published:true,sample:true,fees:'₹ 60,000 per year',admissionUrl:'https://higher.study/colleges',
    eligibility:'B.E./B.Tech. Valid GATE score.',courses:['M.Tech'],
    cutoffs:[{id:4,examId:2+1,course:'M.Tech',category:'General',metric:'score',value:55,year:2025}]},
   {id:4,name:'Illustrative Arts & Science College',short:'IASC',color:'#d97706',city:'Delhi',state:'Delhi',type:'Government',published:true,sample:true,fees:'₹ 25,000 per year',admissionUrl:'https://higher.study/colleges',
    eligibility:'Class 12 pass. CUET score.',courses:['B.A.','B.Sc.','B.Com.'],
    cutoffs:[{id:5,examId:4,course:'B.Com.',category:'General',metric:'score',value:70,year:2025},{id:6,examId:4,course:'B.A.',category:'All',metric:'score',value:60,year:2025}]}];
  const papers=[{id:1,title:'CAT 2024 Slot 1 Question Paper (sample file)',examId:1,year:2024,sectionId:0,description:'Sample entry. Upload the real paper in Admin > Previous Year Papers.',fileName:'sample.pdf',fileData:SAMPLE_PDF,url:'',published:true,createdAt:now()},
   {id:2,title:'GATE 2024 General Aptitude Paper (sample file)',examId:3,year:2024,sectionId:1,description:'Sample entry for the section-wise paper listing.',fileName:'sample.pdf',fileData:SAMPLE_PDF,url:'',published:true,createdAt:now()}];
  const materials=[{id:1,title:'CAT Quant formulae sheet (sample file)',examId:1,sectionId:3,subject:'Quantitative Ability',topic:'Formulae',type:'formula',description:'Sample entry. Upload a real PDF in Admin > Study Material.',fileName:'sample.pdf',fileData:SAMPLE_PDF,url:'',published:true,createdAt:now()},
   {id:2,title:'How to prepare for GATE Engineering Mathematics (sample guide)',examId:3,sectionId:2,subject:'Engineering Mathematics',topic:'Preparation',type:'guide',description:'Sample entry linking to the blog.',fileName:'',fileData:'',url:'https://higher.study/blog',published:true,createdAt:now()},
   {id:3,title:'CUET English basics (sample notes)',examId:4,sectionId:0,subject:'English',topic:'Grammar',type:'notes',description:'Sample entry.',fileName:'sample.pdf',fileData:SAMPLE_PDF,url:'',published:true,createdAt:now()}];
  const menu=[{id:1,group:'resources',key:'mocks',label:'Mock Tests',href:'mocks.html',order:1,visible:true},{id:2,group:'resources',key:'papers',label:'Previous Year Papers',href:'papers.html',order:2,visible:true},
   {id:3,group:'resources',key:'materials',label:'Exam Study Material',href:'materials.html',order:3,visible:true},{id:4,group:'tools',key:'predictor',label:'College Predictor',href:'predictor.html',order:1,visible:true}];
  const L=seedLearn();return {v:1,cats,exams,questions,colleges,papers,materials,menu,predLog:[],next:{},decks:L.decks,cards:L.cards,dailyq:[],notices:[]};
}

function load(){
  if(DB)return DB;
  try{const s=localStorage.getItem(KEY);if(s)DB=JSON.parse(s)}catch(e){}
  if(!DB||!DB.exams){DB=seed();LEARN_MENU.forEach(m=>DB.menu.push({id:DB.menu.length+1,group:'tools',key:m.key,label:m.label,href:m.href,order:DB.menu.length,visible:true}));persist()}else if(migrate(DB))persist();
  return DB;
}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(DB));return true}catch(e){if(window.HS&&HS.toast)HS.toast('Browser storage is full. Remove large files or old data.','warn');return false}}

const T={cats:'cats',exams:'exams',questions:'questions',colleges:'colleges',papers:'papers',materials:'materials',menu:'menu'};
HS.db={
  load,save:persist,reset(){DB=seed();persist();return DB},
  all(t){return load()[t]||[]},
  get(t,id){return this.all(t).find(x=>x.id===+id)||null},
  add(t,o){const d=load(),arr=d[t],id=arr.reduce((m,x)=>Math.max(m,x.id||0),0)+1;const r=Object.assign({createdAt:now()},o,{id});arr.push(r);persist();return r},
  update(t,id,patch){const r=this.get(t,id);if(!r)return null;Object.assign(r,patch);persist();return r},
  remove(t,id){const d=load();d[t]=d[t].filter(x=>x.id!==+id);persist()},
  /* helpers */
  catName(id){const c=this.get('cats',id);return c?c.name:'—'},
  examName(id){const e=this.get('exams',id);return e?e.title:'—'},
  secName(examId,sid){const e=this.get('exams',examId);if(!e||!sid)return '—';const s=e.sections.find(x=>x.id===+sid);return s?s.name:'—'},
  isPublic(e){return !!e&&e.published&&!e.archived&&!e.deleted},
  publicExams(){return this.all('exams').filter(e=>this.isPublic(e))},
  activeSections(e){return (e.sections||[]).filter(s=>s.enabled).sort((a,b)=>a.order-b.order)},
  questionsOf(examId,opt){opt=opt||{};return this.all('questions').filter(q=>q.examId===+examId&&(opt.all||q.status==='active'))},
  qCount(examId,secId){return this.all('questions').filter(q=>q.examId===+examId&&q.status==='active'&&(secId===undefined||q.sectionId===+secId)).length},
  /* the paper a new attempt gets: active questions of enabled sections, section order, optional planned count per section */
  buildPaper(e){
    const secs=this.activeSections(e),all=this.questionsOf(e.id);
    if(!secs.length)return {secs:[],qids:all.map(q=>q.id)};
    const out=[],used=[];
    secs.forEach(s=>{let qs=all.filter(q=>q.sectionId===s.id);if(s.questions>0)qs=qs.slice(0,s.questions);if(qs.length){used.push({id:s.id,name:s.name,minutes:s.minutes});qs.forEach(q=>out.push(q.id))}});
    return {secs:used,qids:out};
  },
  isLive(e){return this.isPublic(e)&&this.buildPaper(e).qids.length>0},
  maxMarks(e){return this.buildPaper(e).qids.reduce((n,id)=>n+(this.get('questions',id).marks||0),0)}
};
HS.MAT_TYPES={notes:'Notes',pdf:'PDF document',subject:'Subject-wise material',topic:'Topic-wise material',video:'Video lesson',guide:'Preparation guide',practice:'Practice questions',formula:'Formulae & reference'};
})();
