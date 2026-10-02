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
let PARTNERS=[['Partner 1',50],['Partner 2',50]];   // [name, % of the partner pool] - change on the Budget plan page
const NEW_CATS=['Commission paid for student referral','Scholarship for students'];
let BUDGET={               // monthly budget to spend per category (Rs) - edit these
 'Office rent':40000,'Staff salary':15000,'Buying leads':0,
 'Student complimentary gifts':0,'Electricity':0,'Phone recharge':0,'Wifi':0,'Staff refreshments':0,'Commission paid for student referral':0,'Scholarship for students':0,'Other expenses':0};
let BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
let REVENUE_PER_STUDENT=200000;   // commission earned per student (Rs)
let INTAKES=[['January 2027',20],['May 2027',20],['September 2027',20]];  // [intake, target students] - change on the Budget plan page
const STAFF_TYPES=['Experienced staff','Intern staff','Fresher','Training staff'];
const isStaff=c=>/salary/i.test(c||'');
const targetTotal=()=>INTAKES.reduce((a,[,t])=>a+Number(t||0),0);
const FY_START='2026-04-01';  // financial year start
const OPENING=0;              // opening company balance (Rs) before any transaction here                    // profit share % and growth fund %
const CATS={Income:['University commission','Other income'],
Expense:['Office rent','Staff salary','Buying leads','Student complimentary gifts','Electricity','Phone recharge','Wifi','Staff refreshments','Commission paid for student referral','Scholarship for students','Other expenses'],
Distribution:['Partner profit share paid','Organisation growth payment']};
const $=i=>document.getElementById(i), inr=n=>'₹'+Number(n).toLocaleString('en-IN');
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let rows=[];try{rows=JSON.parse(localStorage.rows||'[]')}catch(e){}
const cache=()=>{try{localStorage.rows=JSON.stringify(rows.filter(r=>!String(r.ID).startsWith('tmp')))}catch(e){}};
const setSync=s=>{const d=$('dot');if(d){d.className=s;d.title=s=='off'?'Offline - showing saved data':s=='upd'?'Updating...':'Synced with Google Sheet'}};
$('branch').innerHTML=BRANCHES.map(b=>`<option>${b}</option>`).join('');
$('type').innerHTML=Object.keys(CATS).map(t=>`<option>${t}</option>`).join('');
const today=()=>new Date(Date.now()-new Date().getTimezoneOffset()*6e4).toISOString().slice(0,10);
$('date').value=today();
const store=c=>{try{localStorage.cfg=JSON.stringify(c)}catch(e){}};
function applyCfg(c){
 if(c){
  if(!c.v||c.v<2)delete c.cats['Experience expense'];
  if(!c.v||c.v<3)NEW_CATS.forEach(n=>{if(!(n in c.cats))c.cats[n]=0});
  BUDGET=c.cats;PARTNER=c.partner;GROWTH=c.growth;REVENUE_PER_STUDENT=c.rev;if(c.intakes)INTAKES=c.intakes;if(c.partners)PARTNERS=c.partners}
 BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
 CATS.Expense=Object.keys(BUDGET);
 $('intake').innerHTML=INTAKES.map(([n])=>`<option>${esc(n)}</option>`).join('');
 $('partner').innerHTML=[...PARTNERS.map(p=>p[0]),'All partners'].map(n=>`<option>${esc(n)}</option>`).join('');
 cats();
}
$('stafftype').innerHTML=STAFF_TYPES.map(t=>`<option>${t}</option>`).join('');
try{applyCfg(JSON.parse(localStorage.cfg||'null'))}catch(e){applyCfg(null)}
function cats(){$('cat').innerHTML=CATS[$('type').value].map(c=>`<option>${esc(c)}</option>`).join('');boxes()}
function flags(){
 const t=$('type').value,c=$('cat').value,ex=t=='Expense',f={inc:t=='Income',di:t=='Distribution'};
 f.stf=ex&&isStaff(c);f.gift=ex&&/gift/i.test(c);f.ph=ex&&/phone/i.test(c);f.lead=ex&&/lead/i.test(c);
 f.stu=f.inc||(ex&&/referral|scholarship/i.test(c));return f}
function boxes(){
 const f=flags(),sh=(id,on)=>{$(id).hidden=!on};
 sh('f_student',f.stu);sh('f_university',f.stu);sh('f_intake',f.stu||f.gift||f.di);sh('f_partner',f.di);
 sh('f_staff',f.stf||f.ph);sh('f_stype',f.stf);sh('f_phone',f.ph);sh('f_lead',f.lead);
 $('student').required=f.inc&&$('cat').value=='University commission';
 $('staffName').required=f.stf||f.ph;$('phone').required=f.ph;$('lead').required=f.lead;
}
cats();
function tab(n){const nb=$('b-'+n);if(nb&&nb.scrollIntoView)nb.scrollIntoView({inline:'center',block:'nearest'});window.scrollTo(0,0);['dash','plan','add','list','sum','rst'].forEach(k=>{$(k).hidden=k!=n;$('b-'+k).className=k==n?'on':''});BG.set(n=='dash')}
async function call(opt,q=''){
 const r=await(await fetch(API+q,opt)).json();
 if(r.error){alert(r.error);throw 0}return r}
async function load(){setSync('upd');
 try{const t0=Date.now(),r=await call({});CLOCK.sync(r.now,t0,Date.now());rows=r.rows;cache();if(r.budget){store(r.budget);applyCfg(r.budget)}render();setSync('')}
 catch(e){setSync('off')}}
async function save(ev){ev.preventDefault();const fm=ev.target,d=Object.fromEntries(new FormData(fm)),f=flags();
 if(!f.stu){d.student=d.university=''}if(!(f.stu||f.gift||f.di))d.intake='';if(!f.di)d.partner='';
 if(!(f.stf||f.ph))d.staff='';if(!f.stf)d.stafftype='';if(!f.ph)d.phone='';if(!f.lead)d.lead='';
 const row={ID:'tmp'+Date.now(),Date:d.date,Branch:d.branch,Type:d.type,Category:d.category,Description:d.description,Amount:Number(d.amount),'Payment mode':d.mode,Student:d.student,Intake:d.intake,University:d.university,'Staff name':d.staff,'Staff type':d.stafftype,'Phone number':d.phone,'Lead source':d.lead,Partner:d.partner};
 rows.push(row);render();$('msg').textContent='Saving...';
 try{await call({method:'POST',body:JSON.stringify(d)});$('msg').textContent='Saved ✓';fm.amount.value='';fm.description.value='';fm.student.value='';fm.staff.value='';fm.phone.value='';load()}
 catch(e){rows=rows.filter(r=>r!==row);render();$('msg').textContent='Not saved - please try again'}}
async function restart(ev){ev.preventDefault();const f=ev.target,d={action:'restart',mobile:f.mobile.value.trim(),password:f.password.value};
 $('rmsg').textContent='Restarting...';
 try{await call({method:'POST',body:JSON.stringify(d)});rows=[];cache();f.reset();render();$('rmsg').textContent='Done. All entries are cleared. A hidden backup was kept in the Google Sheet.'}
 catch(e){$('rmsg').textContent=e===0?'Not restarted.':'Could not reach the Google Sheet. Nothing was deleted.'}
 f.password.value=''}
async function del(id){if(!confirm('Delete this transaction?'))return;const old=rows;rows=rows.filter(r=>r.ID!=id);cache();render();
 try{await call({method:'POST',body:JSON.stringify({action:'delete',id})});load()}catch(e){rows=old;cache();render()}}
function sum(t,f=()=>1){return rows.filter(r=>r.Type==t&&f(r)).reduce((a,r)=>a+Number(r.Amount),0)}
const LAST={};
function kpi(a,v,c=''){const p=LAST[a],f=p===undefined?0:p;LAST[a]=v;return`<div class="card kpi ${c}">${a}<b data-v="${v}" data-f="${f}">${inr(f)}</b></div>`}
function count(){document.querySelectorAll('[data-v]').forEach(el=>{const t=+el.dataset.v,f0=+el.dataset.f;if(t===f0)return;el.dataset.f=t;const t0=performance.now();(function f(n){const p=Math.min(1,(n-t0)/600);el.textContent=inr(Math.round(f0+(t-f0)*(1-Math.pow(1-p,3))));if(p<1)requestAnimationFrame(f)})(t0)})}
function dash(){
 const e=new Date(FY_START);e.setFullYear(e.getFullYear()+1);const E=e.toISOString().slice(0,10);
 const fy=r=>String(r.Date)>=FY_START&&String(r.Date)<E;
 const inc=sum('Income',fy),exp=sum('Expense',fy),bud=BUDGET_MONTHLY*12,pct=bud?Math.round(exp/bud*100):0;
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
function editBudget(){draft={cats:Object.entries(BUDGET),intakes:INTAKES.map(x=>[x[0],x[1]]),rev:REVENUE_PER_STUDENT,partner:PARTNER*100,growth:GROWTH*100,partners:PARTNERS.map(x=>[x[0],x[1]])};editing=true;plan()}
function cancelEdit(){editing=false;plan()}
function addRow(){draft.cats.push(['New category',0]);plan()}
function delRow(i){draft.cats.splice(i,1);plan()}
function equalSplit(){const n=draft.partners.length;if(!n)return;const b=Math.floor(10000/n)/100;draft.partners.forEach(p=>p[1]=b);draft.partners[n-1][1]=Math.round((100-b*(n-1))*100)/100}
function setPartners(v){const n=Math.min(20,Math.max(1,Math.round(Number(v))||1));while(draft.partners.length<n)draft.partners.push(['Partner '+(draft.partners.length+1),0]);while(draft.partners.length>n)draft.partners.pop();equalSplit();plan()}
function addPartner(){setPartners(draft.partners.length+1)}
function delPartner(i){draft.partners.splice(i,1);plan()}
function addIntake(){draft.intakes.push(['New intake',0]);plan()}
function delIntake(i){draft.intakes.splice(i,1);plan()}
async function saveBudget(){
 const cats={};draft.cats.forEach(([n,m])=>{n=String(n).trim();if(n)cats[n]=Math.max(0,Number(m)||0)});
 const intakes=draft.intakes.map(([n,t])=>[String(n).trim(),Math.max(0,Math.round(Number(t)||0))]).filter(x=>x[0]);
 const partners=draft.partners.map(([n,p])=>[String(n).trim(),Number(p)||0]).filter(x=>x[0]);
 const c={v:3,cats,intakes,partners,rev:Number(draft.rev)||0,partner:(Number(draft.partner)||0)/100,growth:(Number(draft.growth)||0)/100};
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
  $('pi').innerHTML='';$('pp').innerHTML='';
  $('pw').innerHTML='<h3>Edit budget</h3><div class=grid>'+inp('Commission per student (₹)','rev')+inp('Total partner share (% of net profit)','partner')+inp('Growth fund (%)','growth')+'</div>'+
  '<h4>Partners</h4><div class=grid style="max-width:300px"><div><label>Number of partners</label><input type=number min=1 max=20 value="'+draft.partners.length+'" onchange="setPartners(this.value)"></div></div><div class="wrap ed"><table style="margin-top:10px"><tr><th>Partner name</th><th style="width:150px">Share of partner pool (%)</th><th style="width:40px"></th></tr>'+
  draft.partners.map(([n,p],i)=>`<tr><td><input value="${esc(n)}" oninput="draft.partners[${i}][0]=this.value"></td><td><input type=number min=0 step=any value="${p}" oninput="draft.partners[${i}][1]=this.value"></td><td><button class=x onclick="delPartner(${i})">✕</button></td></tr>`).join('')+
  `</table></div><p class=note>Total: <b class="${Math.abs(draft.partners.reduce((a,p)=>a+Number(p[1]||0),0)-100)>0.01?'ex':''}">${Math.round(draft.partners.reduce((a,p)=>a+Number(p[1]||0),0)*100)/100}%</b> (should be 100%)</p><button class=btn style="background:var(--navy)" onclick="addPartner()">+ Add partner</button> <button class=btn style="background:var(--navy)" onclick="equalSplit();plan()">Split equally</button>`+
  '<h4>Intakes and student targets</h4><div class="wrap ed"><table><tr><th>Intake name</th><th style="width:130px">Target students</th><th style="width:40px"></th></tr>'+
  draft.intakes.map(([n,t],i)=>`<tr><td><input value="${esc(n)}" oninput="draft.intakes[${i}][0]=this.value"></td><td><input type=number min=0 value="${t}" oninput="draft.intakes[${i}][1]=this.value"></td><td><button class=x onclick="delIntake(${i})">✕</button></td></tr>`).join('')+
  '</table></div><button class=btn style="background:var(--navy)" onclick="addIntake()">+ Add intake</button>'+
  '<h4>Monthly expense budget</h4><div class="wrap ed"><table><tr><th>Category name</th><th style="width:150px">Monthly budget (₹)</th><th style="width:40px"></th></tr>'+
  draft.cats.map(([n,m],i)=>`<tr><td><input value="${esc(n)}" oninput="draft.cats[${i}][0]=this.value"></td><td><input type=number min=0 value="${m}" oninput="draft.cats[${i}][1]=this.value"></td><td><button class=x onclick="delRow(${i})">✕</button></td></tr>`).join('')+
  '</table></div><button class=btn style="background:var(--navy)" onclick="addRow()">+ Add category</button><p><button class=btn onclick="saveBudget()">Save budget</button> <button class=btn style="background:#8a94a8" onclick="cancelEdit()">Cancel</button></p><p class=note>Renaming a category does not change old transactions. They keep their old name and appear under "Other spending" in the table.</p>';
  return}

 const actNet=Math.max(0,sum('Income',fy)-sum('Expense',fy)),sp100=PARTNERS.reduce((a,p)=>a+Number(p[1]||0),0);
 const ptab=(cat,pl,now)=>{let tp=0,td=0,tpd=0;const tot=sum('Distribution',r=>fy(r)&&r.Category==cat);
  const rowsH=PARTNERS.map(([n,p])=>{const a=pl*p/100,d=now*p/100,pd=sum('Distribution',r=>fy(r)&&r.Category==cat&&r.Partner==n);tp+=a;td+=d;tpd+=pd;
   return`<tr><td>${esc(n)}</td><td class=r>${p}%</td><td class=r>${inr(a)}</td><td class=r>${inr(d)}</td><td class=r>${inr(pd)}</td><td class="r ${d-pd<0?'ex':''}">${inr(d-pd)}</td></tr>`}).join('');
  const un=tot-tpd;
  return'<div class=wrap><table><tr><th>Partner</th><th class=r>Share</th><th class=r>Planned (year)</th><th class=r>Due now</th><th class=r>Paid</th><th class=r>Balance</th></tr>'+rowsH+
   (un>0?`<tr><td>All partners / not named</td><td class=r>-</td><td class=r>-</td><td class=r>-</td><td class=r>${inr(un)}</td><td class=r>-</td></tr>`:'')+
   `<tr><td><b>Total</b></td><td class=r><b>${Math.round(sp100*100)/100}%</b></td><td class=r><b>${inr(tp)}</b></td><td class=r><b>${inr(td)}</b></td><td class=r><b>${inr(tot)}</b></td><td class="r ${td-tot<0?'ex':''}"><b>${inr(td-tot)}</b></td></tr></table></div>`};
 const pc=v=>Math.round(v*1000)/10;
 $('pp').innerHTML='<h3>Partnership ('+PARTNERS.length+' partner'+(PARTNERS.length==1?'':'s')+')</h3><p class=note>Each partner takes their % of the pool. "Due now" uses the actual profit so far this year.'+(Math.abs(sp100-100)>0.01?' <b class=ex>Partner shares add up to '+sp100+'%, not 100%. Fix this in Edit budget.</b>':'')+'</p>'+
  '<h4>Profit share paid to partners ('+pc(PARTNER)+'% of net profit)</h4>'+ptab('Partner profit share paid',ps,actNet*PARTNER)+
  '<h4>Organisation growth payment by each partner ('+pc(GROWTH)+'% of net profit)</h4>'+ptab('Organisation growth payment',gf,actNet*GROWTH);
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
const det=r=>{const p=[];
 if(r.Student)p.push(esc(r.Student));
 if(r.Partner)p.push('Partner: '+esc(r.Partner));
 if(r['Staff name'])p.push(esc(r['Staff name'])+(r['Staff type']?' ('+esc(r['Staff type'])+')':''));
 if(r['Phone number'])p.push('Phone '+esc(r['Phone number']));
 if(r['Lead source'])p.push('Source: '+esc(r['Lead source']));
 if(r.Intake)p.push(esc(r.Intake));
 if(r.University)p.push(esc(r.University));
 return p.join(' &middot; ')};
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
const CLOCK=(()=>{
 const el=$('clock'),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const dig='<div class="fc"><div class="top"><span></span></div><div class="bot"><span></span></div><div class="ft"><span></span></div><div class="fb"><span></span></div></div>';
 const grp=l=>`<div class="cg"><div class="pair">${dig}${dig}</div><div class="lb">${l}</div></div>`,sep='<div class="sep"><i></i><i></i></div>';
 el.innerHTML=grp('Hours')+sep+grp('Minutes')+sep+grp('Seconds')+'<span id="dot"></span>';
 const ds=[...el.querySelectorAll('.fc')];
 const fmt=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hourCycle:'h23',hour:'2-digit',minute:'2-digit',second:'2-digit'});
 let skew=0;
 function set(d,v){const q=c=>d.querySelector('.'+c+' span'),old=d.dataset.d;
  if(old===v)return;d.dataset.d=v;
  if(old===undefined||reduce){['top','bot','ft','fb'].forEach(c=>q(c).textContent=v);return}
  q('top').textContent=v;q('fb').textContent=v;q('ft').textContent=old;q('bot').textContent=old;
  d.classList.remove('go');void d.offsetWidth;d.classList.add('go');
  setTimeout(()=>{q('bot').textContent=v},620)}
 function tick(){const p=fmt.formatToParts(new Date(Date.now()+skew)),g=t=>p.find(x=>x.type==t).value;
  const s=(g('hour')+g('minute')+g('second')).replace(/^24/,'00');ds.forEach((d,i)=>set(d,s[i]));
  setTimeout(tick,1000-((Date.now()+skew)%1000)+8)}
 tick();
 // if this device's clock is wrong by more than 5 seconds, follow the Google server time instead
 return{sync(sn,t0,t1){const k=Number(sn)-(t0+t1)/2;skew=Math.abs(k)>5000?k:0}}
})();
render();
if(API.startsWith('http'))load();
BG.set(true);
