// ---- Backgrounds: ripple (Dashboard) + rings (all other pages) ----
const BG=(()=>{
 const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 function loop(fn){let run=false;const t0=performance.now();
  function f(now){if(!run)return;fn((now-t0)/1000);requestAnimationFrame(f)}
  return{on(v){if(v&&!run){run=true;reduce?fn(0):requestAnimationFrame(f)}else if(!v)run=false}}}

 // Ripple (WebGL) - settings
 const RC={speed:.6,density:2.2,step:.12,wave:.9,tint:[.93,.93,.94]};
 const VERT='attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}';
 const FRAG=`precision highp float;uniform vec2 uRes;uniform float uTime,uDensity,uStep,uWave;uniform vec3 uTint;
 float H(vec2 p){float r=length(p);float a=atan(p.y,p.x);
  float rr=r*(1.0+0.07*sin(a*2.0+uTime*0.35)+0.04*sin(a*3.0-uTime*0.25));
  float wave=uWave*sin(rr*0.9-uTime*0.8)*exp(-r*0.12);
  float s=pow(rr,0.75)*uDensity-uTime*0.25;return wave+uStep*fract(s);}
 void main(){vec2 uv=(gl_FragCoord.xy-0.5*uRes)/uRes.y;
  vec3 ro=vec3(0.0,6.5,4.6);vec3 fw=normalize(vec3(0.0,-0.35,0.0)-ro);
  vec3 rt=normalize(cross(fw,vec3(0.0,1.0,0.0)));vec3 up=cross(rt,fw);
  vec3 rd=normalize(fw+uv.x*rt*1.1+uv.y*up*1.1);vec3 col=uTint;
  if(rd.y<-0.02){float t=-ro.y/rd.y;vec2 p=(ro+rd*t).xz;float e=0.0035*t;
   float h=H(p);float hx=H(p+vec2(e,0.0));float hz=H(p+vec2(0.0,e));
   vec3 n=normalize(vec3(-(hx-h)/e,1.0,-(hz-h)/e));vec3 L=normalize(vec3(-0.55,0.75,0.35));
   float diff=clamp(dot(n,L),0.0,1.0);float sky=0.5+0.5*n.y;
   float shade=0.42+0.50*diff+0.18*sky;shade=mix(shade,0.92,smoothstep(14.0,40.0,t));col=uTint*shade;}
  float v=smoothstep(1.25,0.25,length(uv*vec2(0.9,1.1)));col*=mix(0.9,1.0,v);gl_FragColor=vec4(col,1.0);}`;
 const rc=document.getElementById('bgRipple'),gl=rc.getContext('webgl');
 let ripple={on(){}},rsize=()=>{};
 if(gl){
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return o};
  const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VERT));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FRAG));
  gl.linkProgram(pr);gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER,gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const U=n=>gl.getUniformLocation(pr,n);
  gl.uniform1f(U('uDensity'),RC.density);gl.uniform1f(U('uStep'),RC.step);gl.uniform1f(U('uWave'),RC.wave);gl.uniform3fv(U('uTint'),RC.tint);
  rsize=()=>{const d=Math.min(devicePixelRatio||1,1.5);rc.width=innerWidth*d;rc.height=innerHeight*d;
   gl.viewport(0,0,rc.width,rc.height);gl.uniform2f(U('uRes'),rc.width,rc.height)};
  rsize();
  ripple=loop(t=>{gl.uniform1f(U('uTime'),t*RC.speed);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)});
 }

 // Rings (canvas 2D) - settings
 const CF={rings:9,centerRadius:.37,ringGap:.13,speed:1,bg:'#eef2f7',light:[246,249,252],dark:[226,233,241],shadow:'rgba(80,100,135,0.32)'};
 const kc=document.getElementById('bgRings'),ctx=kc.getContext('2d');let W,H,dpr;
 const ksize=()=>{dpr=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;kc.width=W*dpr;kc.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};
 ksize();
 const discs=Array.from({length:CF.rings},(_,i)=>({dir:i%2?1:-1,spin:.12+.05*((i*7)%5),phase:i*1.7,gapMax:i===0?0:.5+.18*((i*3)%5),gapRate:.35+.08*((i*5)%4)}));
 const ease=x=>x*x*(3-2*x),TAU=Math.PI*2;
 function drawRings(t){
  ctx.fillStyle=CF.bg;ctx.fillRect(0,0,W,H);const cx=W/2,cy=H/2;
  for(let i=CF.rings-1;i>=0;i--){const d=discs[i];
   const r=(CF.centerRadius+CF.ringGap*i)*H*(1+.012*Math.sin(t*.6+i)),rot=d.phase+d.dir*d.spin*t;
   const cyc=.5+.5*Math.sin(t*d.gapRate+d.phase),gap=d.gapMax*ease(Math.max(0,cyc*1.4-.4));
   const g=ctx.createLinearGradient(cx,cy-r,cx,cy+r),[lr,lg,lb]=CF.light,[dr,dg,db]=CF.dark,k=i/CF.rings*.35;
   g.addColorStop(0,`rgb(${lr-k*20},${lg-k*20},${lb-k*16})`);g.addColorStop(1,`rgb(${dr-k*20},${dg-k*20},${db-k*16})`);
   ctx.save();ctx.shadowColor=CF.shadow;ctx.shadowBlur=28;ctx.shadowOffsetY=8;ctx.fillStyle=g;ctx.beginPath();
   if(gap<.001)ctx.arc(cx,cy,r,0,TAU);else{ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,rot+gap,rot+TAU);ctx.closePath()}
   ctx.fill();ctx.restore();}
  const v=ctx.createRadialGradient(cx,cy,H*.3,cx,cy,Math.max(W,H)*.75);
  v.addColorStop(0,'rgba(255,255,255,0.10)');v.addColorStop(1,'rgba(160,180,205,0.10)');ctx.fillStyle=v;ctx.fillRect(0,0,W,H);}
 const rings=loop(t=>drawRings(t*CF.speed));

 addEventListener('resize',()=>{rsize();ksize();if(reduce){drawRings(0)}});
 return{set(dash){document.body.classList.toggle('dashbg',dash);ripple.on(dash);rings.on(!dash)}};
})();

const API='https://script.google.com/macros/s/AKfycbxk17MAfMRBZEmUBZeYH060wkndh0EyhFX9-AzvgDynGlyt_jbsOVWxP_Eu71N3AvUn/exec';           // from Apps Script > Deploy
const BRANCHES=['Branch 1','Branch 2','Branch 3','Branch 4','Branch 5']; // rename to your branches
const PARTNER=0.30, GROWTH=0.10;
const BUDGET={               // monthly budget to spend per category (Rs) - edit these
 'Office rent':40000,'Staff salary':15000,'Experience expense':30000,'Buying leads':0,
 'Student complimentary gifts':0,'Electricity':0,'Phone recharge':0,'Wifi':0,'Staff refreshments':0,'Other expenses':0};
const BUDGET_MONTHLY=Object.values(BUDGET).reduce((a,b)=>a+b,0);
const STUDENTS_PER_MONTH=5, REVENUE_PER_STUDENT=200000;  // planned income = students x revenue
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
function cats(){$('cat').innerHTML=CATS[$('type').value].map(c=>`<option>${c}</option>`).join('')}cats();
function tab(n){['dash','plan','add','list','sum'].forEach(k=>{$(k).hidden=k!=n;$('b-'+k).className=k==n?'on':''});BG.set(n=='dash')}
async function call(opt,q=''){
 const r=await(await fetch(API+q,opt)).json();
 if(r.error){alert(r.error);throw 0}return r}
async function load(){try{rows=(await call({})).rows;render()}catch(e){}}
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
function plan(){
 const e=new Date(FY_START);e.setFullYear(e.getFullYear()+1);const E=e.toISOString().slice(0,10);
 const fy=r=>String(r.Date)>=FY_START&&String(r.Date)<E;
 const yB=BUDGET_MONTHLY*12,yInc=STUDENTS_PER_MONTH*REVENUE_PER_STUDENT*12,prof=yInc-yB;
 const ps=Math.max(0,prof)*PARTNER,gf=Math.max(0,prof)*GROWTH,save=prof-ps-gf;
 const saved=sum('Income',fy)-sum('Expense',fy)-sum('Distribution',fy);
 $('pk').innerHTML=kpi('Budget to spend / month',BUDGET_MONTHLY,'big')+kpi('Budget to spend / year',yB,'big')+kpi('Amount to save / year',save,'big')+kpi('Saved so far (actual)',saved)+kpi('Planned income / year',yInc)+kpi('Planned profit / year',prof)+kpi('Partner share ('+PARTNER*100+'%)',ps)+kpi('Growth fund ('+GROWTH*100+'%)',gf);
 let ts=0,tl=0;
 $('pt').innerHTML='<tr><th>Category</th><th class=r>Monthly budget</th><th class=r>Yearly budget</th><th class=r>Spent so far</th><th class=r>Left to spend</th><th style="width:130px">Used</th></tr>'+
 Object.keys(BUDGET).map(c=>{const y=BUDGET[c]*12,sp=sum('Expense',r=>fy(r)&&r.Category==c),left=y-sp,pc=y?Math.round(sp/y*100):(sp>0?100:0);ts+=sp;tl+=left;
  return`<tr><td>${c}</td><td class=r>${BUDGET[c]?inr(BUDGET[c]):'-'}</td><td class=r>${y?inr(y):'-'}</td><td class=r>${inr(sp)}</td><td class="r ${left<0?'ex':''}">${inr(left)}</td><td><div class=bar><i style="width:${Math.min(pc,100)}%;background:${pc>80?'var(--red)':'var(--navy)'}"></i></div></td></tr>`}).join('')+
 `<tr><td><b>Total</b></td><td class=r><b>${inr(BUDGET_MONTHLY)}</b></td><td class=r><b>${inr(yB)}</b></td><td class=r><b>${inr(ts)}</b></td><td class="r ${tl<0?'ex':''}"><b>${inr(tl)}</b></td><td></td></tr>`;
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
