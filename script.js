// ---- Backgrounds: dashboard.mp4 (Dashboard only) + pages.mp4 (all other pages) ----
const BG=(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dv=document.getElementById('bgv'),pv=document.getElementById('bgp');
 const run=(v,on)=>{if(on&&!reduce)v.play().catch(()=>{});else v.pause()};
 return{set(dash){document.body.classList.toggle('dashbg',dash);run(dv,dash);run(pv,!dash)}};
})();

const API='https://script.google.com/macros/s/AKfycbxk17MAfMRBZEmUBZeYH060wkndh0EyhFX9-AzvgDynGlyt_jbsOVWxP_Eu71N3AvUn/exec';           // from Apps Script > Deploy
const BRANCHES=['Branch 1','Branch 2','Branch 3','Branch 4','Branch 5']; // rename to your branches
let PARTNER=0.30, GROWTH=0.10;
let BUDGET={               // monthly budget to spend per category (Rs) - edit these
 'Office rent':40000,'Staff salary':15000,'Experience expense':30000,'Buying leads':0,
 'Student complimentary gifts':0,'Electricity':0,'Phone recharge':0,'Wifi':0,'Staff refreshments':0,'Other expenses':0};
let BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
let STUDENTS_PER_MONTH=5, REVENUE_PER_STUDENT=200000;  // planned income = students x revenue
const FY_START='2026-04-01';  // financial year start
const OPENING=0;              // opening company balance (Rs) before any transaction here                    // profit share % and growth fund %
const CATS={Income:['University commission','Other income'],
Expense:['Office rent','Staff salary','Experience expense','Buying leads','Student complimentary gifts','Electricity','Phone recharge','Wifi','Staff refreshments','Other expenses'],
Distribution:['Partner profit share paid','Organisation growth payment']};
const $=i=>document.getElementById(i), inr=n=>'₹'+Number(n).toLocaleString('en-IN');
let rows=[];
$('branch').innerHTML=BRANCHES.map(b=>`<option>${b}</option>`).join('');
$('type').innerHTML=Object.keys(CATS).map(t=>`<option>${t}</option>`).join('');
$('date').valueAsDate=new Date();
function applyCfg(c){
 if(c){BUDGET=c.cats;PARTNER=c.partner;GROWTH=c.growth;STUDENTS_PER_MONTH=c.students;REVENUE_PER_STUDENT=c.rev}
 BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
 CATS.Expense=Object.keys(BUDGET);
 if($('cat'))cats();
}
try{applyCfg(JSON.parse(localStorage.cfg||'null'))}catch(e){}
function cats(){$('cat').innerHTML=CATS[$('type').value].map(c=>`<option>${c}</option>`).join('')}cats();
function tab(n){['dash','plan','add','list','sum'].forEach(k=>{$(k).hidden=k!=n;$('b-'+k).className=k==n?'on':''});BG.set(n=='dash')}
async function call(opt,q=''){
 const r=await(await fetch(API+q,opt)).json();
 if(r.error){alert(r.error);throw 0}return r}
async function load(){try{const r=await call({});rows=r.rows;if(r.budget){localStorage.cfg=JSON.stringify(r.budget);applyCfg(r.budget)}render()}catch(e){}}
async function save(ev){ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target));$('msg').textContent='Saving...';
 try{await call({method:'POST',body:JSON.stringify(d)});$('msg').textContent='Saved ✓';ev.target.amount.value='';ev.target.description.value='';load()}
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
let editing=false,draft=null;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function editBudget(){draft={cats:Object.entries(BUDGET),students:STUDENTS_PER_MONTH,rev:REVENUE_PER_STUDENT,partner:PARTNER*100,growth:GROWTH*100};editing=true;plan()}
function cancelEdit(){editing=false;plan()}
function addRow(){draft.cats.push(['New category',0]);plan()}
function delRow(i){draft.cats.splice(i,1);plan()}
async function saveBudget(){
 const cats={};draft.cats.forEach(([n,m])=>{n=String(n).trim();if(n)cats[n]=Math.max(0,Number(m)||0)});
 const c={cats,students:Number(draft.students)||0,rev:Number(draft.rev)||0,partner:(Number(draft.partner)||0)/100,growth:(Number(draft.growth)||0)/100};
 applyCfg(c);localStorage.cfg=JSON.stringify(c);editing=false;render();
 try{await call({method:'POST',body:JSON.stringify({action:'saveBudget',budget:c})})}catch(e){alert('Budget saved on this device only - could not reach the Google Sheet.')}
}
function plan(){
 const e=new Date(FY_START);e.setFullYear(e.getFullYear()+1);const E=e.toISOString().slice(0,10);
 const fy=r=>String(r.Date)>=FY_START&&String(r.Date)<E;
 const yB=BUDGET_MONTHLY*12,yInc=STUDENTS_PER_MONTH*REVENUE_PER_STUDENT*12,prof=yInc-yB;
 const ps=Math.max(0,prof)*PARTNER,gf=Math.max(0,prof)*GROWTH,save=prof-ps-gf;
 const saved=sum('Income',fy)-sum('Expense',fy)-sum('Distribution',fy);
 $('pk').innerHTML=kpi('Budget to spend / month',BUDGET_MONTHLY,'big')+kpi('Budget to spend / year',yB,'big')+kpi('Amount to save / year',save,'big')+kpi('Saved so far (actual)',saved)+kpi('Planned income / year',yInc)+kpi('Planned profit / year',prof)+kpi('Partner share ('+Math.round(PARTNER*1000)/10+'%)',ps)+kpi('Growth fund ('+Math.round(GROWTH*1000)/10+'%)',gf);
 if(editing){
  const inp=(l,k)=>`<div><label>${l}</label><input type=number step=any value="${draft[k]}" oninput="draft.${k}=this.value"></div>`;
  $('pw').innerHTML='<h3>Edit budget</h3><div class=grid>'+inp('Students planned per month','students')+inp('Revenue per student (₹)','rev')+inp('Partner profit share (%)','partner')+inp('Growth fund (%)','growth')+'</div>'+
  '<table style="margin-top:14px"><tr><th>Category name</th><th style="width:190px">Monthly budget (₹)</th><th style="width:40px"></th></tr>'+
  draft.cats.map(([n,m],i)=>`<tr><td><input value="${esc(n)}" oninput="draft.cats[${i}][0]=this.value"></td><td><input type=number min=0 value="${m}" oninput="draft.cats[${i}][1]=this.value"></td><td><button class=x onclick="delRow(${i})">✕</button></td></tr>`).join('')+
  '</table><button class=btn style="background:var(--navy)" onclick="addRow()">+ Add category</button> <button class=btn onclick="saveBudget()">Save budget</button> <button class=btn style="background:#8a94a8" onclick="cancelEdit()">Cancel</button><p style="font-size:13px">Renaming a category does not change old transactions. They keep their old name and appear under "Other spending" in the table.</p>';
  return}
 let ts=0,tl=0;
 const rowsHtml=Object.keys(BUDGET).map(c=>{const y=BUDGET[c]*12,sp=sum('Expense',r=>fy(r)&&r.Category==c),left=y-sp,pc=y?Math.round(sp/y*100):(sp>0?100:0);ts+=sp;tl+=left;
  return`<tr><td>${esc(c)}</td><td class=r>${BUDGET[c]?inr(BUDGET[c]):'-'}</td><td class=r>${y?inr(y):'-'}</td><td class=r>${inr(sp)}</td><td class="r ${left<0?'ex':''}">${inr(left)}</td><td><div class=bar><i style="width:${Math.min(pc,100)}%;background:${pc>80?'var(--red)':'var(--navy)'}"></i></div></td></tr>`}).join('');
 const other=sum('Expense',fy)-ts;
 const oth=other>0?`<tr><td>Other spending (not in list)</td><td class=r>-</td><td class=r>-</td><td class=r>${inr(other)}</td><td class="r ex">${inr(-other)}</td><td></td></tr>`:'';
 if(other>0){ts+=other;tl-=other}
 $('pw').innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px"><h3>Budget by category (this financial year)</h3><button class=btn style="margin:0" onclick="editBudget()">Edit budget</button></div><div class=wrap><table><tr><th>Category</th><th class=r>Monthly budget</th><th class=r>Yearly budget</th><th class=r>Spent so far</th><th class=r>Left to spend</th><th style="width:130px">Used</th></tr>'+rowsHtml+oth+
 `<tr><td><b>Total</b></td><td class=r><b>${inr(BUDGET_MONTHLY)}</b></td><td class=r><b>${inr(yB)}</b></td><td class=r><b>${inr(ts)}</b></td><td class="r ${tl<0?'ex':''}"><b>${inr(tl)}</b></td><td></td></tr></table></div>`;
}
function render(){plan();dash();
 const s=[...rows].reverse();
 $('t').innerHTML='<tr><th>Date</th><th>Branch</th><th>Type</th><th>Category</th><th>Description</th><th class=r>Amount</th><th></th></tr>'+
 s.map(r=>`<tr><td>${r.Date}</td><td>${r.Branch}</td><td class="${r.Type=='Income'?'in':r.Type=='Expense'?'ex':''}">${r.Type}</td><td>${r.Category}</td><td>${r.Description||''}</td><td class=r>${inr(r.Amount)}</td><td><button class=x title=Delete onclick="del('${r.ID}')">✕</button></td></tr>`).join('');
 const inc=sum('Income'),exp=sum('Expense'),net=inc-exp,ps=Math.max(0,net)*PARTNER,gf=Math.max(0,net)*GROWTH;
 const k=[['Total income',inc],['Total expenses',exp],['Net profit',net],['Partner share due ('+PARTNER*100+'%)',ps],['Growth fund due ('+GROWTH*100+'%)',gf],['Partner share paid',sum('Distribution',r=>r.Category=='Partner profit share paid')]];
 $('kpi').innerHTML=k.map(([a,b])=>`<div class="card kpi">${a}<b>${inr(b)}</b></div>`).join('');
 const ms=[...new Set(rows.map(r=>String(r.Date).slice(0,7)))].sort().reverse();
 $('m').innerHTML='<tr><th>Month</th><th class=r>Income</th><th class=r>Expenses</th><th class=r>Net</th></tr>'+ms.map(m=>{const f=r=>String(r.Date).startsWith(m),i=sum('Income',f),e=sum('Expense',f);return`<tr><td>${m}</td><td class=r>${inr(i)}</td><td class=r>${inr(e)}</td><td class=r>${inr(i-e)}</td></tr>`}).join('')}
if(API.startsWith('http'))load();else render();
BG.set(true);
