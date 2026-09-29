const API='PASTE_YOUR_WEB_APP_URL_HERE';           // from Apps Script > Deploy
const BRANCHES=['Branch 1','Branch 2','Branch 3','Branch 4','Branch 5']; // rename to your branches
const PARTNER=0.30, GROWTH=0.10;
const BUDGET_MONTHLY=85000;   // total monthly expense budget (yearly budget = x12)
const FY_START='2026-04-01';  // financial year start
const OPENING=0;              // opening company balance (Rs) before any transaction here                    // profit share % and growth fund %
const CATS={Income:['University commission','Other income'],
Expense:['Office rent','Staff salary','Experience expense','Buying leads','Student complimentary gifts','Electricity','Phone recharge','Wifi','Staff refreshments','Other expenses'],
Distribution:['Partner profit share paid','Organisation growth payment']};
const $=i=>document.getElementById(i), inr=n=>'₹'+Number(n).toLocaleString('en-IN');
let pass=sessionStorage.pass||'', rows=[];
$('branch').innerHTML=BRANCHES.map(b=>`<option>${b}</option>`).join('');
$('type').innerHTML=Object.keys(CATS).map(t=>`<option>${t}</option>`).join('');
$('date').valueAsDate=new Date();
function cats(){$('cat').innerHTML=CATS[$('type').value].map(c=>`<option>${c}</option>`).join('')}cats();
function tab(n){['dash','add','list','sum'].forEach(k=>{$(k).hidden=k!=n;$('b-'+k).className=k==n?'on':''});document.body.classList.toggle('dashbg',n=='dash');const v=$('bgv');n=='dash'?v.play().catch(()=>{}):v.pause()}
async function call(opt,q=''){
 if(!pass){pass=prompt('Enter passcode')||'';sessionStorage.pass=pass}
 const r=await(await fetch(API+q,opt)).json();
 if(r.error){pass='';sessionStorage.pass='';alert(r.error);throw 0}return r}
async function load(){try{rows=(await call({}, '?pass='+encodeURIComponent(pass))).rows;render()}catch(e){}}
async function save(ev){ev.preventDefault();const d=Object.fromEntries(new FormData(ev.target));$('msg').textContent='Saving...';
 try{d.pass=pass;await call({method:'POST',body:JSON.stringify(d)});$('msg').textContent='Saved ✓';ev.target.amount.value='';ev.target.description.value='';load()}
 catch(e){$('msg').textContent='Not saved'}}
async function del(id){if(confirm('Delete this transaction?')){await call({method:'POST',body:JSON.stringify({action:'delete',id,pass})});load()}}
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
function render(){dash();
 const s=[...rows].reverse();
 $('t').innerHTML='<tr><th>Date</th><th>Branch</th><th>Type</th><th>Category</th><th>Description</th><th class=r>Amount</th><th></th></tr>'+
 s.map(r=>`<tr><td>${r.Date}</td><td>${r.Branch}</td><td class="${r.Type=='Income'?'in':r.Type=='Expense'?'ex':''}">${r.Type}</td><td>${r.Category}</td><td>${r.Description||''}</td><td class=r>${inr(r.Amount)}</td><td><button class=x title=Delete onclick="del('${r.ID}')">✕</button></td></tr>`).join('');
 const inc=sum('Income'),exp=sum('Expense'),net=inc-exp,ps=Math.max(0,net)*PARTNER,gf=Math.max(0,net)*GROWTH;
 const k=[['Total income',inc],['Total expenses',exp],['Net profit',net],['Partner share due ('+PARTNER*100+'%)',ps],['Growth fund due ('+GROWTH*100+'%)',gf],['Partner share paid',sum('Distribution',r=>r.Category=='Partner profit share paid')]];
 $('kpi').innerHTML=k.map(([a,b])=>`<div class="card kpi">${a}<b>${inr(b)}</b></div>`).join('');
 const ms=[...new Set(rows.map(r=>String(r.Date).slice(0,7)))].sort().reverse();
 $('m').innerHTML='<tr><th>Month</th><th class=r>Income</th><th class=r>Expenses</th><th class=r>Net</th></tr>'+ms.map(m=>{const f=r=>String(r.Date).startsWith(m),i=sum('Income',f),e=sum('Expense',f);return`<tr><td>${m}</td><td class=r>${inr(i)}</td><td class=r>${inr(e)}</td><td class=r>${inr(i-e)}</td></tr>`}).join('')}
if(API.startsWith('http'))load();else render();
