/* SAMPLE CONTENT ONLY — replaced by MySQL data via Laravel API in the backend phase.
   Paper shape follows the reference video: VARC 24 · DILR 22 · QA 22 = 68 Qs, 204 marks, 40 min/section. */
(function(){
const S=(id,name,mins,n)=>({id,name,minutes:mins,count:n});
const exam={
  id:1, slug:'cat-full-length-mock-1', title:'CAT Full Length Mock 1', category:'full',
  description:'Real 3-section pattern · sectional timers · auto-submit',
  duration:120, totalQuestions:68, totalMarks:204, difficulty:'Moderate', free:true, attempts:1,
  marks:{correct:3,wrongMcq:-1,wrongTita:0},
  sections:[S('VARC','Verbal Ability & Reading Comprehension',40,24),S('DILR','Data Interpretation & Logical Reasoning',40,22),S('QA','Quantitative Ability',40,22)],
  instructions:[
   'This is a timed, full-length mock test that follows the CAT 2025 pattern. Use a laptop or desktop in full screen.',
   'Total duration is 120 minutes with 68 questions carrying 204 marks.',
   'The paper has 3 sections — VARC (24 questions, 40 minutes), DILR (22 questions, 40 minutes), QA (22 questions, 40 minutes).',
   "Sections open in a fixed order and you cannot go back to a completed section. When a section's time ends, it locks automatically and the next one starts.",
   'Marking scheme: +3 for every correct answer (MCQ or TITA), −1 for every wrong MCQ answer, and no penalty for a wrong or unattempted TITA answer.',
   'Unattempted questions score zero.',
   'Use the question palette on the right to move between questions. Colours show answered, not answered, not visited and marked for review.',
   'Your answers save automatically as you select them.',
   'The test is auto-submitted when the timer reaches zero.',
   'Once you submit, the attempt is final — you cannot resume or change answers.'
  ]
};
const Q=[]; let id=0;
function add(sec,o){Q.push(Object.assign({id:++id,section:sec,type:'MCQ',marks:3,neg:-1,passage:null,sol:'Detailed solution will appear here.'},o));}
const L='ABCD';
/* ---- VARC ---- */
const P1=`<p>Every device we discard carries a hidden ledger. Manufacturers argue that sealed designs are lighter, more durable and more resistant to water, and that unauthorised repairs can compromise safety. Both claims contain some truth, but neither is the whole story.</p><p>Repair is often impractical, and the costs are paid by the environment and by consumers who must buy again sooner than they would like — energy spent in manufacture and an addition to a growing stream of electronic waste. If spare parts and manuals are made available, the burden shifts from the buyer's wallet to the producer's design choices — a shift that some regulators now consider overdue.</p>`;
const P2=`<p>Critics sometimes speak as if one of these approaches were simply correct. Yet the right balance depends on purpose. A legal contract demands fidelity to wording, because a small change in wording could alter obligations. A children's rhyme, by contrast, may lose everything if its rhythm and play are sacrificed for literal accuracy.</p><p>What readers rarely notice is that every translation is therefore an interpretation. Two skilled translators of the same novel will produce books that differ not because either has made errors, but because each has judged differently what the original must keep — a reminder that translation is a conversation between two writers.</p>`;
add('VARC',{passage:P1,q:'The passage attributes the decline of repair primarily to:',o:['government rules that banned independent workshops','consumers losing interest in technical skills','a combination of economic changes and design choices','the disappearance of service manuals alone'],a:2});
add('VARC',{passage:P1,q:'According to the passage, the "hidden costs" of discarding a device include all of the following EXCEPT:',o:['energy used to produce it','electronic waste','metals extracted for its manufacture','the cost of hiring regulators'],a:3});
add('VARC',{passage:P1,q:'Which of the following would the author most likely support?',o:['Banning sealed designs entirely','Making spare parts and manuals available','Discouraging consumers from buying new devices','Removing safety rules for repairs'],a:1});
add('VARC',{passage:P1,q:'The manufacturers\' arguments, as presented, are:',o:['entirely false','partly true but incomplete','irrelevant to the discussion','supported by regulators'],a:1});
add('VARC',{passage:P2,q:'The "choice" described in the first paragraph is between:',o:['prose and poetry','old and modern vocabulary','speed and accuracy','fidelity and creative freedom'],a:3});
add('VARC',{passage:P2,q:'Why does the author mention a legal contract?',o:['To show that wording can carry binding consequences','To criticise lawyers','To argue translation is impossible','To compare it with a novel'],a:0});
add('VARC',{passage:P2,q:'Two skilled translators produce different books because:',o:['one of them makes errors','they judge differently what to preserve','the original is unclear','publishers demand it'],a:1});
add('VARC',{passage:P2,q:'The tone of the passage is best described as:',o:['dismissive','balanced and reflective','angry','nostalgic'],a:1});
const gram=[
 ['Which of the following sentences is grammatically correct?',['Neither the manager nor the assistants were informed.','Each of the students have submitted the form.','One of the reasons are the high cost.','The list of items are on the desk.'],0,'"Neither … nor" takes the verb agreeing with the nearer subject (assistants → were).'],
 ['Choose the word that best fills the blank: The committee\'s decision was ______ by new evidence.',['undermined','underlined','undertaken','undone'],0,'"Undermined" fits the sense of weakening.'],
 ['Pick the odd sentence out of the paragraph: (1) Rain fell all night. (2) The river rose. (3) I like mangoes. (4) Roads flooded by dawn.',['1','2','3','4'],2,'Sentence 3 is unrelated to the flood narrative.'],
 ['Select the word closest in meaning to "ephemeral".',['lasting','short-lived','ancient','fragile'],1,'Ephemeral means lasting a very short time.']
];
gram.forEach(g=>add('VARC',{q:g[0],o:g[1],a:g[2],sol:g[3]}));
while(Q.filter(x=>x.section==='VARC').length<24){const n=Q.filter(x=>x.section==='VARC').length+1;
 add('VARC',{q:`Sample VARC question ${n}: choose the sentence that is most clearly and concisely worded.`,o:['Option one reads awkwardly.','Option two is clear and concise.','Option three is wordy and repetitive.','Option four contains an error.'],a:1,sol:'Option two conveys the idea without redundancy.'});}
/* ---- DILR ---- */
const T1=`<div class="set-title">SET 1 — STORE SALES</div><p>The table shows units sold by four stores over three months.</p><table><tr><th>Store</th><th>January</th><th>February</th><th>March</th></tr><tr><td>A</td><td>120</td><td>150</td><td>180</td></tr><tr><td>B</td><td>200</td><td>180</td><td>160</td></tr><tr><td>C</td><td>100</td><td>130</td><td>170</td></tr><tr><td>D</td><td>150</td><td>150</td><td>210</td></tr></table>`;
add('DILR',{passage:T1,q:'Which store sold the most units in total over the three months?',o:['C','A','D','B'],a:3,sol:'Totals: A 450, B 540, C 400, D 510 → B.'});
add('DILR',{passage:T1,type:'TITA',neg:0,q:'By what percentage did Store C\'s sales increase from January to March?',ans:'70',sol:'(170−100)/100 = 70%.'});
add('DILR',{passage:T1,q:'In which month were total sales of all stores the highest?',o:['January','February','March','Equal in all months'],a:2,sol:'Jan 570, Feb 610, Mar 720 → March.'});
add('DILR',{passage:T1,type:'TITA',neg:0,q:'What was the average units sold per month by Store A?',ans:'150',sol:'(120+150+180)/3 = 150.'});
const T2=`<div class="set-title">SET 2 — PROJECT SCHEDULE</div><p>A project has six tasks. Task durations (days): T1=2, T2=3, T3=1, T4=2, T5=3, T6=1. T3 starts after T1; T4 after T2; T5 after T3 and T4; T6 after T5. Tasks may run in parallel when dependencies allow.</p>`;
add('DILR',{passage:T2,q:'What is the minimum completion time in days with unlimited workers?',o:['7','8','9','10'],a:2,sol:'Longest chain: T2→T4→T5→T6 = 3+2+3+1 = 9 days (T1→T3→T5→T6 is only 7).'});
add('DILR',{passage:T2,q:'If only one worker were available, so that tasks must be done one after another, what is the minimum duration in days?',o:['12','10','11','13'],a:0,sol:'Sum of all durations = 2+3+1+2+3+1 = 12.'});
while(Q.filter(x=>x.section==='DILR').length<22){const n=Q.filter(x=>x.section==='DILR').length+1;const t=n%4===0;
 add('DILR',t?{type:'TITA',neg:0,q:`Sample DILR question ${n} (typed answer): what is 12 × ${n}?`,ans:String(12*n),sol:`12 × ${n} = ${12*n}.`}:{q:`Sample DILR question ${n}: which arrangement satisfies all the stated conditions?`,o:['Arrangement P','Arrangement Q','Arrangement R','Arrangement S'],a:n%4,sol:'Check each arrangement against the conditions.'});}
/* ---- QA ---- */
add('QA',{q:'What is the LCM of 12, 18 and 30?',o:['90','120','180','360'],a:2,sol:'12=2²·3, 18=2·3², 30=2·3·5 → LCM = 2²·3²·5 = 180.'});
add('QA',{q:'If 3x + 5 = 20, what is x?',o:['3','4','5','6'],a:2,sol:'3x = 15 → x = 5.'});
add('QA',{type:'TITA',neg:0,q:'A train 150 m long passes a pole in 10 seconds. What is its speed in km/h?',ans:'54',sol:'15 m/s × 18/5 = 54 km/h.'});
add('QA',{q:'The compound interest on ₹10,000 for 2 years at 10% p.a. is:',o:['₹2,000','₹2,100','₹2,200','₹2,400'],a:1,sol:'10000(1.1² − 1) = ₹2,100.'});
add('QA',{type:'TITA',neg:0,q:'How many positive divisors does 360 have?',ans:'24',sol:'360 = 2³·3²·5 → (3+1)(2+1)(1+1) = 24.'});
add('QA',{q:'A and B can finish a job in 12 and 18 days. Working together, they finish it in:',o:['6 days','7.2 days','8 days','15 days'],a:1,sol:'1/12+1/18 = 5/36 → 36/5 = 7.2 days.'});
while(Q.filter(x=>x.section==='QA').length<22){const n=Q.filter(x=>x.section==='QA').length+1;const a=n+3,b=n+7;const t=n%3===0;
 add('QA',t?{type:'TITA',neg:0,q:`Sample QA question ${n} (typed answer): what is ${a} × ${b}?`,ans:String(a*b),sol:`${a} × ${b} = ${a*b}.`}:{q:`Sample QA question ${n}: what is ${a} + ${b}?`,o:[String(a+b-1),String(a+b),String(a+b+1),String(a+b+2)],a:1,sol:`${a} + ${b} = ${a+b}.`});}
Q.forEach((q,i)=>{q.no=i+1;});
const card=(id,slug,title,category,desc,duration,q,marks,diff,free)=>({id,slug,title,category,description:desc,duration,totalQuestions:q,totalMarks:marks,difficulty:diff,free,attempts:1,available:false});
const catalog=[Object.assign({},exam,{available:true}),
 card(2,'cat-full-length-mock-2','CAT Full Length Mock 2','full','Real 3-section pattern · sectional timers · auto-submit',120,68,204,'Moderate',true),
 card(3,'cat-full-length-mock-3','CAT Full Length Mock 3','full','Tougher paper · sectional timers · detailed solutions',120,68,204,'Hard',true),
 card(4,'cat-varc-sectional-1','VARC Sectional Test 1','sectional','24 questions on reading comprehension and verbal ability',40,24,72,'Moderate',true),
 card(5,'cat-dilr-sectional-1','DILR Sectional Test 1','sectional','22 questions on data interpretation and logical reasoning',40,22,66,'Hard',true),
 card(6,'cat-qa-sectional-1','QA Sectional Test 1','sectional','22 questions on quantitative ability including TITA',40,22,66,'Moderate',true),
 card(7,'cat-2024-slot-1','CAT 2024 Slot 1 Paper','pyp','Previous year paper in the real exam interface',120,68,204,'Hard',true),
 card(8,'cat-2023-slot-1','CAT 2023 Slot 1 Paper','pyp','Previous year paper in the real exam interface',120,66,198,'Hard',true)];
window.HS_DATA={exam,catalog,questions:Q};
})();
