// ---- Backgrounds: dashboard.mp4 (Dashboard only) + pages.mp4 (all other pages) ----
const BG=(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dv=document.getElementById('bgv'),pv=document.getElementById('bgp');
 const run=(v,on)=>{if(on&&!reduce){const p=v.play();if(p&&p.catch)p.catch(()=>{})}else v.pause()};
 return{set(dash){document.body.classList.toggle('dashbg',dash);run(dv,dash);run(pv,!dash)}};
})();

const API='https://script.google.com/macros/s/AKfycbxk17MAfMRBZEmUBZeYH060wkndh0EyhFX9-AzvgDynGlyt_jbsOVWxP_Eu71N3AvUn/exec';           // from Apps Script > Deploy
const BRANCHES=['Branch 1','Branch 2','Branch 3','Branch 4','Branch 5']; // rename to your branches
let PARTNER=0.30, GROWTH=0.10;
let BUDGET={               // monthly budget to spend per category (Rs) - edit these
 'Office rent':40000,'Staff salary':15000,'Buying leads':0,
 'Student complimentary gifts':0,'Electricity':0,'Phone recharge':0,'Wifi':0,'Staff refreshments':0,'Other expenses':0};
let BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
let REVENUE_PER_STUDENT=200000;   // commission earned per student (Rs)
let INTAKES=[['January 2027',20],['May 2027',20],['September 2027',20]];  // [intake, target students] - change on the Budget plan page
const STAFF_TYPES=['Experienced staff','Intern staff','Fresher','Training staff'];
const isStaff=c=>/salary/i.test(c||'');
const targetTotal=()=>INTAKES.reduce((a,[,t])=>a+Number(t||0),0);
const FY_START='2026-04-01';  // financial year start
const OPENING=0;              // opening company balance (Rs) before any transaction here                    // profit share % and growth fund %
const CATS={Income:['University commission','Other income'],
Expense:['Office rent','Staff salary','Buying leads','Student complimentary gifts','Electricity','Phone recharge','Wifi','Staff refreshments','Other expenses'],
Distribution:['Partner profit share paid','Organisation growth payment']};
const $=i=>document.getElementById(i), inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let rows=[];
$('branch').innerHTML=BRANCHES.map(b=>`<option>${b}</option>`).join('');
$('type').innerHTML=Object.keys(CATS).map(t=>`<option>${t}</option>`).join('');
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
$('date').value=today();
const store=c=>{try{localStorage.cfg=JSON.stringify(c)}catch(e){}};
function applyCfg(c){
 if(c){
  if(!c.v||c.v<2)delete c.cats['Experience expense'];   // removed category (settings version 2)
  BUDGET=c.cats;PARTNER=c.partner;GROWTH=c.growth;REVENUE_PER_STUDENT=c.rev;if(c.intakes)INTAKES=c.intakes}
 BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
 CATS.Expense=Object.keys(BUDGET);
 $('intake').innerHTML=INTAKES.map(([n])=>`<option>${esc(n)}</option>`).join('');
 cats();
}
$('stafftype').innerHTML=STAFF_TYPES.map(t=>`<option>${t}</option>`).join('');
try{applyCfg(JSON.parse(localStorage.cfg||'null'))}catch(e){applyCfg(null)}
function cats(){$('cat').innerHTML=CATS[$('type').value].map(c=>`<option>${esc(c)}</option>`).join('');boxes()}
function boxes(){
 const t=$('type').value,inc=t=='Income',stf=t=='Expense'&&isStaff($('cat').value);
 $('stuBox').hidden=!inc;$('stfBox').hidden=!stf;
 $('student').required=inc&&$('cat').value=='University commission';$('staffName').required=stf;
}
cats();
function tab(n){const nb=$('b-'+n);if(nb&&nb.scrollIntoView)nb.scrollIntoView({inline:'center',block:'nearest'});window.scrollTo(0,0);['dash','plan','add','list','sum'].forEach(k=>{$(k).hidden=k!=n;$('b-'+k).className=k==n?'on':''});BG.set(n=='dash')}
async function call(opt,q=''){
 const r=await(await fetch(API+q,opt)).json();
 if(r.error){alert(r.error);throw 0}return r}
async function load(){try{const r=await call({});rows=r.rows;if(r.budget){store(r.budget);applyCfg(r.budget)}render()}catch(e){}}
async function save(ev){ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target));$('msg').textContent='Saving...';
 if(d.type!='Income'){d.student=d.intake=d.university=''}
 if(!(d.type=='Expense'&&isStaff(d.category))){d.staff=d.stafftype=''}
 try{await call({method:'POST',body:JSON.stringify(d)});$('msg').textContent='Saved ✓';const f=ev.target;f.amount.value='';f.description.value='';f.student.value='';f.staff.value='';load()}
 catch(e){$('msg').textContent='Not saved'}}
async function del(id){if(confirm('Delete this transaction?')){await call({method:'POST',body:JSON.stringify({action:'delete',id})});load()}}
function sum(t,f=()=>1){return rows.filter(r=>r.Type==t&&f(r)).reduce((a,r)=>a+Number(r.Amount),0)}
function kpi(a,v,c=''){return`<div class="card kpi ${c}">${a}<b data-v="${v}">0</b></div>`}
function count(){document.querySelectorAll('[data-v]').forEach(el=>{const t=+el.dataset.v,t0=performance.now();(function f(n){const p=Math.min(1,(n-t0)/900);el.textContent=inr(Math.round(t*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(f)})(t0)})}
function dash(){
 const e=new Date(FY_START);e.setFullYear(e.getFullYear()+1);const E=e.toISOString().slice(0,10);
 const fy=r=>String(r.Date)>=FY_START&&String(r.Date)<E;
 const inc=sum('Income',fy),exp=sum('Expense',fy),bud=BUDGET_MONTHLY*12,pct=Math.round(exp/bud*100);
 const bal=OPENING+sum('Income')-sum('Expense')-sum('Distribution');
 $('dk').innerHTML=kpi('Company balance',bal,'big')+kpi('Net profit',inc-exp,'big')+kpi('Total income',inc)+kpi('Total expenses',exp)+kpi('Yearly expense budget',bud)+kpi('Budget left',bud-exp);
 count();
 setTimeout(()=>{$('bar').style.width=Math.min(pct,100)+'%';$('bar').style.background=pct>80?'var(--red)':'var(--navy)'},100);
 $('bt').textContent=pct+'% of '+inr(bud)+' used - '+inr(bud-exp)+' left';
 const ms=[...new Set(rows.map(r=>String(r.Date).slice(0,7)))].sort().slice(-6);
 const d=ms.map(m=>{const f=r=>String(r.Date).startsWith(m);return[m,sum('Income',f),sum('Expense',f)]});
 const mx=Math.max(1,...d.flat().filter(x=>typeof x=='number'));
 $('ch').innerHTML=d.map(([m,i,x])=>`<div class="mo"><div class="bars"><i style="background:var(--navy)" data-h="${i/mx*100}" title="${inr(i)}"></i><i style="background:var(--red)" data-h="${x/mx*100}" title="${inr(x)}"></i></div>${m}</div>`).join('')||'<p>No data yet</p>';
 setTimeout(()=>document.querySelectorAll('[data-h]').forEach(b=>b.style.height=b.dataset.h+'%'),100);
}
function intakeStats(n,t){const en=rows.filter(r=>r.Type=='Income'&&r.Intake==n).length,inc=sum('Income',r=>r.Intake==n);return{en,inc,pc:t?Math.min(100,Math.round(en/t*100)):0}}
function intakeCard(){
 $('it').innerHTML=INTAKES.map(([n,t])=>{const s=intakeStats(n,t);
  return`<div style="margin:12px 0"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px"><b>${esc(n)}</b><span>${s.en} of ${t} students &middot; ${inr(s.inc)} of ${inr(t*REVENUE_PER_STUDENT)}</span></div><div class=bar><i style="width:${s.pc}%"></i></div></div>`}).join('')||'<p>No intakes set. Add them on the Budget plan page.</p>';
}
let editing=false,draft=null;
function editBudget(){draft={cats:Object.entries(BUDGET),intakes:INTAKES.map(x=>[x[0],x[1]]),rev:REVENUE_PER_STUDENT,partner:PARTNER*100,growth:GROWTH*100};editing=true;plan()}
function cancelEdit(){editing=false;plan()}
function addRow(){draft.cats.push(['New category',0]);plan()}
function delRow(i){draft.cats.splice(i,1);plan()}
function addIntake(){draft.intakes.push(['New intake',0]);plan()}
function delIntake(i){draft.intakes.splice(i,1);plan()}
async function saveBudget(){
 const cats={};draft.cats.forEach(([n,m])=>{n=String(n).trim();if(n)cats[n]=Math.max(0,Number(m)||0)});
 const intakes=draft.intakes.map(([n,t])=>[String(n).trim(),Math.max(0,Math.round(Number(t)||0))]).filter(x=>x[0]);
 const c={v:2,cats,intakes,rev:Number(draft.rev)||0,partner:(Number(draft.partner)||0)/100,growth:(Number(draft.growth)||0)/100};
 applyCfg(c);store(c);editing=false;render();
 try{await call({method:'POST',body:JSON.stringify({action:'saveBudget',budget:c})})}catch(e){alert('Budget saved on this device only - could not reach the Google Sheet.')}
}
function plan(){
 const e=new Date(FY_START);e.setFullYear(e.getFullYear()+1);const E=e.toISOString().slice(0,10);
 const fy=r=>String(r.Date)>=FY_START&&String(r.Date)<E;
 const yB=BUDGET_MONTHLY*12,tt=targetTotal(),yInc=tt*REVENUE_PER_STUDENT,prof=yInc-yB;
 const ps=Math.max(0,prof)*PARTNER,gf=Math.max(0,prof)*GROWTH,save=prof-ps-gf;
 const saved=sum('Income',fy)-sum('Expense',fy)-sum('Distribution',fy);
 $('pk').innerHTML=kpi('Budget to spend / month',BUDGET_MONTHLY,'big')+kpi('Budget to spend / year',yB,'big')+kpi('Amount to save / year',save,'big')+kpi('Saved so far (actual)',saved)+kpi('Planned income ('+tt+' students)',yInc)+kpi('Planned profit / year',prof)+kpi('Partner share ('+Math.round(PARTNER*1000)/10+'%)',ps)+kpi('Growth fund ('+Math.round(GROWTH*1000)/10+'%)',gf);
 if(editing){
  const inp=(l,k)=>`<div><label>${l}</label><input type=number step=any value="${draft[k]}" oninput="draft.${k}=this.value"></div>`;
  $('pi').innerHTML='';
  $('pw').innerHTML='<h3>Edit budget</h3><div class=grid>'+inp('Commission per student (₹)','rev')+inp('Partner profit share (%)','partner')+inp('Growth fund (%)','growth')+'</div>'+
  '<h4>Intakes and student targets</h4><div class="wrap ed"><table><tr><th>Intake name</th><th style="width:130px">Target students</th><th style="width:40px"></th></tr>'+
  draft.intakes.map(([n,t],i)=>`<tr><td><input value="${esc(n)}" oninput="draft.intakes[${i}][0]=this.value"></td><td><input type=number min=0 value="${t}" oninput="draft.intakes[${i}][1]=this.value"></td><td><button class=x onclick="delIntake(${i})">✕</button></td></tr>`).join('')+
  '</table></div><button class=btn style="background:var(--navy)" onclick="addIntake()">+ Add intake</button>'+
  '<h4>Monthly expense budget</h4><div class="wrap ed"><table><tr><th>Category name</th><th style="width:150px">Monthly budget (₹)</th><th style="width:40px"></th></tr>'+
  draft.cats.map(([n,m],i)=>`<tr><td><input value="${esc(n)}" oninput="draft.cats[${i}][0]=this.value"></td><td><input type=number min=0 value="${m}" oninput="draft.cats[${i}][1]=this.value"></td><td><button class=x onclick="delRow(${i})">✕</button></td></tr>`).join('')+
  '</table></div><button class=btn style="background:var(--navy)" onclick="addRow()">+ Add category</button><p><button class=btn onclick="saveBudget()">Save budget</button> <button class=btn style="background:#8a94a8" onclick="cancelEdit()">Cancel</button></p><p class=note>Renaming a category does not change old transactions. They keep their old name and appear under "Other spending" in the table.</p>';
  return}
 let te=0,ti=0;
 const irows=INTAKES.map(([n,t])=>{const s=intakeStats(n,t);te+=s.en;ti+=s.inc;
  return`<tr><td>${esc(n)}</td><td class=r>${t}</td><td class=r>${s.en}</td><td class=r>${Math.max(0,t-s.en)}</td><td class=r>${inr(t*REVENUE_PER_STUDENT)}</td><td class=r>${inr(s.inc)}</td><td><div class=bar><i style="width:${s.pc}%"></i></div></td></tr>`}).join('');
 $('pi').innerHTML='<h3>Student targets by intake</h3><p class=note>Each income entry with an intake counts as one student. Change targets with Edit budget below.</p><div class=wrap><table><tr><th>Intake</th><th class=r>Target students</th><th class=r>Enrolled</th><th class=r>Still needed</th><th class=r>Target income</th><th class=r>Income so far</th><th style="width:130px">Progress</th></tr>'+irows+
  `<tr><td><b>Total</b></td><td class=r><b>${tt}</b></td><td class=r><b>${te}</b></td><td class=r><b>${Math.max(0,tt-te)}</b></td><td class=r><b>${inr(yInc)}</b></td><td class=r><b>${inr(ti)}</b></td><td></td></tr></table></div>`;
 let ts=0,tl=0;
 const rowsHtml=Object.keys(BUDGET).map(c=>{const y=BUDGET[c]*12,sp=sum('Expense',r=>fy(r)&&r.Category==c),left=y-sp,pc=y?Math.round(sp/y*100):(sp>0?100:0);ts+=sp;tl+=left;
  return`<tr><td>${esc(c)}</td><td class=r>${BUDGET[c]?inr(BUDGET[c]):'-'}</td><td class=r>${y?inr(y):'-'}</td><td class=r>${inr(sp)}</td><td class="r ${left<0?'ex':''}">${inr(left)}</td><td><div class=bar><i style="width:${Math.min(pc,100)}%;background:${pc>80?'var(--red)':'var(--navy)'}"></i></div></td></tr>`}).join('');
 const other=sum('Expense',fy)-ts;
 const oth=other>0?`<tr><td>Other spending (not in list)</td><td class=r>-</td><td class=r>-</td><td class=r>${inr(other)}</td><td class="r ex">${inr(-other)}</td><td></td></tr>`:'';
 if(other>0){ts+=other;tl-=other}
 $('pw').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h3>Budget by category (this financial year)</h3><button class=btn style="margin:0" onclick="editBudget()">Edit budget</button></div><div class=wrap><table><tr><th>Category</th><th class=r>Monthly budget</th><th class=r>Yearly budget</th><th class=r>Spent so far</th><th class=r>Left to spend</th><th style="width:130px">Used</th></tr>'+rowsHtml+oth+
 `<tr><td><b>Total</b></td><td class=r><b>${inr(BUDGET_MONTHLY)}</b></td><td class=r><b>${inr(yB)}</b></td><td class=r><b>${inr(ts)}</b></td><td class="r ${tl<0?'ex':''}"><b>${inr(tl)}</b></td><td></td></tr></table></div>`;
}
const det=r=>[r.Student&&esc(r.Student)+(r.Intake?' &middot; '+esc(r.Intake):'')+(r.University?' &middot; '+esc(r.University):''),r['Staff name']&&esc(r['Staff name'])+(r['Staff type']?' ('+esc(r['Staff type'])+')':'')].filter(Boolean).join('');
const uniq=k=>[...new Set(rows.map(r=>r[k]).filter(Boolean))];
function render(){plan();dash();intakeCard();
 $('unis').innerHTML=uniq('University').map(u=>`<option value="${esc(u)}">`).join('');
 $('staffs').innerHTML=uniq('Staff name').map(u=>`<option value="${esc(u)}">`).join('');
 const s=[...rows].reverse();
 $('t').innerHTML='<tr><th>Date</th><th>Branch</th><th>Type</th><th>Category</th><th>Details</th><th>Description</th><th class=r>Amount</th><th></th></tr>'+
 s.map(r=>`<tr><td>${esc(r.Date)}</td><td>${esc(r.Branch)}</td><td class="${r.Type=='Income'?'in':r.Type=='Expense'?'ex':''}">${esc(r.Type)}</td><td>${esc(r.Category)}</td><td>${det(r)}</td><td>${esc(r.Description)}</td><td class=r>${inr(r.Amount)}</td><td><button class=x title=Delete onclick="del('${esc(r.ID)}')">✕</button></td></tr>`).join('');
 const inc=sum('Income'),exp=sum('Expense'),net=inc-exp,ps=Math.max(0,net)*PARTNER,gf=Math.max(0,net)*GROWTH;
 const k=[['Total income',inc],['Total expenses',exp],['Net profit',net],['Partner share due ('+Math.round(PARTNER*1000)/10+'%)',ps],['Growth fund due ('+Math.round(GROWTH*1000)/10+'%)',gf],['Partner share paid',sum('Distribution',r=>r.Category=='Partner profit share paid')]];
 $('kpi').innerHTML=k.map(([a,b])=>`<div class="card kpi">${a}<b>${inr(b)}</b></div>`).join('');
 // staff salary by type and by person
 const st=rows.filter(r=>r.Type=='Expense'&&isStaff(r.Category)),byT={},byP={};
 st.forEach(r=>{const t=r['Staff type']||'Not specified',n=r['Staff name']||'-',a=Number(r.Amount);
  (byT[t]=byT[t]||{n:new Set(),a:0}).n.add(n);byT[t].a+=a;
  const key=n+'|'+t;(byP[key]=byP[key]||{n,t,a:0,c:0});byP[key].a+=a;byP[key].c++});
 $('ss').innerHTML=st.length?'<table><tr><th>Staff type</th><th class=r>Staff</th><th class=r>Total paid</th></tr>'+[...STAFF_TYPES,'Not specified'].filter(t=>byT[t]).map(t=>`<tr><td>${esc(t)}</td><td class=r>${byT[t].n.size}</td><td class=r>${inr(byT[t].a)}</td></tr>`).join('')+'</table><table style="margin-top:14px"><tr><th>Staff name</th><th>Type</th><th class=r>Payments</th><th class=r>Total paid</th></tr>'+Object.values(byP).sort((x,y)=>y.a-x.a).map(p=>`<tr><td>${esc(p.n)}</td><td>${esc(p.t)}</td><td class=r>${p.c}</td><td class=r>${inr(p.a)}</td></tr>`).join('')+'</table>':'<p>No staff salary entries yet.</p>';
 // commission by university
 const byU={};rows.filter(r=>r.Type=='Income'&&r.University).forEach(r=>{const u=byU[r.University]=byU[r.University]||{c:0,a:0};u.c++;u.a+=Number(r.Amount)});
 $('su').innerHTML='<tr><th>University</th><th class=r>Students</th><th class=r>Commission</th></tr>'+(Object.entries(byU).sort((x,y)=>y[1].a-x[1].a).map(([u,v])=>`<tr><td>${esc(u)}</td><td class=r>${v.c}</td><td class=r>${inr(v.a)}</td></tr>`).join('')||'<tr><td colspan=3>No student commission entries yet.</td></tr>');
 const ms=[...new Set(rows.map(r=>String(r.Date).slice(0,7)))].sort().reverse();
 $('m').innerHTML='<tr><th>Month</th><th class=r>Income</th><th class=r>Expenses</th><th class=r>Net</th></tr>'+ms.map(m=>{const f=r=>String(r.Date).startsWith(m),i=sum('Income',f),e=sum('Expense',f);return`<tr><td>${m}</td><td class=r>${inr(i)}</td><td class=r>${inr(e)}</td><td class=r>${inr(i-e)}</td></tr>`}).join('')}
if(API.startsWith('http'))load();else render();
BG.set(true);
