'use strict';
/* =========================================================
   TRẠNG THÁI LƯỢT CHƠI
========================================================= */
let run=null,B=null,uidN=1;
const mk=(id,up=false)=>({id,up,uid:uidN++});
const V=(def,k,up)=>{const v=def[k];return Array.isArray(v)?v[up?1:0]:v};
const costOf=c=>V(CARDS[c.id],'c',c.up)||0;
const hasRelic=r=>run&&run.relics.includes(r);

/* ---------- Vẽ thẻ ---------- */
function descOf(card,battle,target){
  const def=CARDS[card.id],u=card.up;
  return def.d.replace(/\{(\w)\}/g,(m,k)=>{
    if(k==='P')return battle&&B?` (<b>${B.p.block}</b>)`:'';
    const key={D:'dm',B:'b',X:'x',Y:'y'}[k];const base=V(def,key,u);
    let val=base,cls=u&&Array.isArray(def[key])&&def[key][0]!==def[key][1]?'up':'';
    if(k==='D'&&battle&&B){val=calcDmg(B.p,target||null,base);if(val>base)cls='up';else if(val<base)cls='bad'}
    return `<b class="${cls}">${val}</b>`;
  });
}
function cardHTML(card,battle,target){
  const def=CARDS[card.id];const cst=V(def,'c',card.up);const base=V(def,'c',false);
  return `<div class="card t-${def.t} r-${def.r}"><div class="cost ${cst<base?'cheaper':''}">${cst}</div><div class="gem"></div><div class="art">${def.ic}</div><div class="nm ${card.up?'up':''}">${def.n}${card.up?'+':''}</div><div class="ty">${TYPE_N[def.t]}</div><div class="ds">${descOf(card,battle,target)}</div></div>`;
}

/* ---------- Thanh trên cùng ---------- */
function renderTop(){
  document.querySelectorAll('[data-top]').forEach(el=>{
    if(!run){el.innerHTML='';return}
    const hp=B?B.p.hp:run.hp;
    el.innerHTML=`<span class="pill">${HEROES[run.hero].ic} ${HEROES[run.hero].n}</span><span class="pill">❤️ ${hp}/${run.maxHp}</span><span class="pill">💰 ${run.gold}</span><span class="pill">🗺️ ${run.act}-${run.floor}</span><span class="relics">${run.relics.map(r=>`<span data-relic="${r}">${RELICS[r].ic}</span>`).join('')}</span><span class="sp"></span><button class="ibtn" data-deck>🎴 ${run.deck.length}</button><button class="ibtn" data-home>🏠</button><button class="ibtn" data-snd>${SFX.on?'🔊':'🔇'}</button>`;
  });
}
document.addEventListener('click',e=>{
  const r=e.target.closest('[data-relic]');if(r){const R=RELICS[r.dataset.relic];toast(`${R.ic} <b>${R.n}</b><br>${R.d}`,2600);return}
  if(e.target.closest('[data-deck]')){showPile('Bộ bài của bạn',run.deck);return}
  if(e.target.closest('[data-home]')){if(B&&!B.over){toast('Hãy hoàn thành trận đấu trước. Game được lưu ở bản đồ.');return}refreshMenu();showScreen('menu');return}
  if(e.target.closest('[data-snd]')){SFX.toggle();renderTop();updateSoundBtn()}
});
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));renderTop()}

/* ---------- Modal chọn thẻ ---------- */
function showPile(title,cards){
  const m=$('#modal');const sorted=[...cards].sort((a,b)=>(a.id>b.id?1:-1));
  m.innerHTML=`<h3>${title} (${cards.length})</h3><div class="grid">${sorted.map(c=>cardHTML(c)).join('')||'<p>Trống</p>'}</div><button class="btn ghost" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=()=>m.classList.remove('on');
}
function pickCard(title,cards,{cancel=true,preview}={}){
  return new Promise(res=>{
    const m=$('#modal');
    m.innerHTML=`<h3>${title}</h3><div class="grid">${cards.map((c,i)=>`<div class="pickable" data-i="${i}">${cardHTML(preview?preview(c):c)}</div>`).join('')||'<p>Không có thẻ phù hợp</p>'}</div>${cancel?'<button class="btn ghost" data-close>Hủy</button>':''}`;
    m.classList.add('on');
    m.querySelectorAll('.pickable').forEach(p=>p.onclick=()=>{m.classList.remove('on');res(+p.dataset.i)});
    const cb=m.querySelector('[data-close]');if(cb)cb.onclick=()=>{m.classList.remove('on');res(-1)};
    if(!cards.length&&!cancel){m.innerHTML+='<button class="btn ghost" data-ok>OK</button>';m.querySelector('[data-ok]').onclick=()=>{m.classList.remove('on');res(-1)}}
  });
}

/* =========================================================
   BẢN ĐỒ
========================================================= */
const NODE_IC={battle:'⚔️',elite:'👹',rest:'🔥',shop:'🛒',event:'❓',treasure:'💎',boss:'💀'};
const ROWS=9,COLS=4;
function genMap(act){
  const nodes={},edges=new Set();
  const key=(r,c)=>r+'_'+c;
  const starts=shuffle([0,1,2,3]).slice(0,3);starts.push(ri(0,3));
  for(const s of starts){let c=s;for(let r=0;r<ROWS-1;r++){nodes[key(r,c)]=nodes[key(r,c)]||{r,c};if(r<ROWS-2){let nc=Math.max(0,Math.min(COLS-1,c+ri(-1,1)));edges.add(key(r,c)+'>'+key(r+1,nc));c=nc}}}
  // loại cạnh cắt chéo đơn giản: chấp nhận
  for(const k in nodes){const n=nodes[k];let t;
    if(n.r===0)t='battle';else if(n.r===4)t='treasure';else if(n.r===ROWS-2)t='rest';
    else{const x=Math.random();if(n.r>=3&&x<.13)t='elite';else if(n.r>=2&&x<.27)t='shop';else if(n.r>=3&&x<.39)t='rest';else if(x<.6)t='event';else t='battle';if(n.r===1&&t!=='event')t='battle'}
    n.t=t}
  nodes.boss={r:ROWS-1,c:1.5,t:'boss'};
  for(const k in nodes)if(nodes[k].r===ROWS-2)edges.add(k+'>boss');
  return{nodes,edges:[...edges],done:[]};
}
function availNodes(){
  const M=run.map;if(!run.pos)return Object.keys(M.nodes).filter(k=>M.nodes[k].r===0);
  return M.edges.filter(e=>e.split('>')[0]===run.pos).map(e=>e.split('>')[1]);
}
function showMap(){
  showScreen('map');API.save(run);const M=run.map;const grid=$('#mapgrid');const rowH=78;const h=ROWS*rowH+40;
  grid.style.height=h+'px';$('#acthdr').textContent=`Màn ${run.act}: ${ACTS[run.act].n}`;
  const X=n=>((n.c+.5)/COLS*100),Y=n=>h-30-n.r*rowH;
  const av=availNodes();
  let svg=`<svg>`;for(const e of M.edges){const [a,b]=e.split('>');const A=M.nodes[a],Bn=M.nodes[b];const vis=M.done.includes(a)&&(M.done.includes(b)||av.includes(b)&&run.pos===a);svg+=`<line x1="${X(A)}%" y1="${Y(A)}" x2="${X(Bn)}%" y2="${Y(Bn)}" stroke="${vis?'#ffcf4a':'rgba(255,255,255,.22)'}" stroke-width="${vis?3:2}" stroke-dasharray="${vis?'0':'5 6'}"/>`}svg+='</svg>';
  let html=svg;
  for(const k in M.nodes){const n=M.nodes[k];const cls=[n.t==='boss'?'boss':'',M.done.includes(k)?'done':'',run.pos===k?'cur':'',av.includes(k)?'avail':'locked'].join(' ');
    const ic=n.t==='boss'?ENEMIES[ACTS[run.act].boss].ic:NODE_IC[n.t];
    html+=`<button class="mnode ${cls}" data-k="${k}" style="left:${X(n)}%;top:${Y(n)}px">${ic}</button>`}
  grid.innerHTML=html;
  grid.querySelectorAll('.mnode').forEach(b=>b.onclick=()=>{const k=b.dataset.k;if(!av.includes(k)){const n=M.nodes[k];toast(nodeName(n.t));return}SFX.card();enterNode(k)});
  // cuộn tới vị trí hiện tại
  const wrap=$('#mapwrap');const curRow=run.pos?M.nodes[run.pos].r:0;requestAnimationFrame(()=>{wrap.scrollTop=Math.max(0,(h-30-curRow*rowH)-wrap.clientHeight*.65+80)});
}
function nodeName(t){return{battle:'⚔️ Chiến đấu',elite:'👹 Kẻ địch tinh anh (phần thưởng bảo vật)',rest:'🔥 Lửa trại: nghỉ ngơi hoặc rèn thẻ',shop:'🛒 Cửa hàng',event:'❓ Sự kiện bí ẩn',treasure:'💎 Kho báu',boss:'💀 Trùm cuối màn'}[t]}
function enterNode(k){
  run.pos=k;run.map.done.push(k);run.floor++;const t=run.map.nodes[k].t;const A=ACTS[run.act];
  if(t==='battle'){const pool=run.fights<2?A.easy:A.normal;run.fights++;startBattle(pick(pool),'battle')}
  else if(t==='elite')startBattle(pick(A.elite),'elite');
  else if(t==='boss')startBattle([A.boss],'boss');
  else if(t==='rest')showRest();else if(t==='shop')showShop();else if(t==='event')showEvent();else if(t==='treasure')showTreasure();
}

/* =========================================================
   TRẬN ĐẤU
========================================================= */
const H={ // bộ hàm dùng trong thẻ bài
  pt(u){const r=u.el.querySelector('.sprite').getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}},
  alive(){return B.enemies.filter(e=>!e.dead)},
  async atk(t,d,fx,hits=1,raw){let total=0;if(!t||t.dead)return 0;lunge(B.p);
    for(let i=0;i<hits;i++){if(t.dead||B.over)break;total+=await hit(B.p,t,d,fx,i,raw);if(hits>1)await wait(70)}await wait(120);return total},
  async atkAll(d,fx){lunge(B.p);const ts=H.alive();await FXR[fx](H.pt(B.p),ts.map(H.pt));for(const t of ts)applyDmg(t,calcDmg(B.p,t,d),B.p);await wait(200)},
  async atkRand(d,fx,hits){for(let i=0;i<hits;i++){const al=H.alive();if(!al.length||B.over)break;await hit(B.p,pick(al),d,fx,i);await wait(90)}await wait(100)},
  async blk(n,fx='shield'){bubble(B.p);await FXR[fx](H.pt(B.p));B.p.block+=n;popNum(B.p,'+'+n+' 🛡','blk');renderUnit(B.p)},
  async st(u,k,n,silent){if(!u||u.dead)return;if(!silent&&STS_FX[k])await FXR[STS_FX[k]](H.pt(B.p),H.pt(u));else if(silent&&(k==='weak'||k==='vuln'))FX.burst(H.pt(u).x,H.pt(u).y,{n:6,c:'#b45cff',sp:80,life:.5,s:8});
    u.st[k]=(u.st[k]||0)+n;popNum(u,`${STS[k].ic} ${STS[k].n}${n>1||k!=='keep'&&k!=='energy'?' '+n:''}`,'info');renderUnit(u);if(u===B.p)renderHand()},
  async draw(n){await drawCards(n)},
  gainE(n){B.energy+=n;const e=$('#energy');e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');updateHUD()},
  async heal(n,silent){if(!silent)await FXR.heal(H.pt(B.p));else FXR.heal(H.pt(B.p));const a=Math.min(n,run.maxHp-B.p.hp);B.p.hp+=a;popNum(B.p,'+'+a,'heal');renderUnit(B.p);renderTop()},
  loseHp(n){B.p.hp=Math.max(0,B.p.hp-n);popNum(B.p,'-'+n,'dmg');renderUnit(B.p);renderTop()},
};
function calcDmg(src,tgt,base){let d=base+(src.st.str||0);if(src.st.weak)d*=.75;if(tgt&&tgt.st.vuln)d*=1.5;return Math.max(0,Math.floor(d))}
async function hit(src,tgt,base,fx,i,raw){const dmg=raw?base:calcDmg(src,tgt,base);await FXR[fx](H.pt(src),H.pt(tgt),i);return applyDmg(tgt,dmg,src)}
function applyDmg(t,dmg,src,noThorns){
  if(t.dead)return 0;
  const blocked=Math.min(t.block,dmg);t.block-=blocked;const loss=dmg-blocked;t.hp=Math.max(0,t.hp-loss);
  if(loss>0){popNum(t,'-'+loss,'dmg'+(loss>=20?' crit':''));flashHit(t);SFX.hit();if(loss>=20)shake(true)}
  else{popNum(t,blocked?'Chặn!':'0','blk');SFX.block();bubble(t)}
  if(src&&src!==t&&!noThorns&&t.st.thorns>0&&!src.dead){const p=H.pt(src);FX.burst(p.x,p.y,{n:10,c:['#5fe06a','#c8ff7a'],sp:260,life:.3,k:'spark',s:2,l:12});applyDmg(src,t.st.thorns,null,true)}
  renderUnit(t);if(t===B.p)renderTop();
  if(t.hp<=0&&t!==B.p)die(t);
  return loss;
}
function die(e){e.dead=true;e.el.classList.add('dead');const p=H.pt(e);FX.burst(p.x,p.y,{n:30,c:['#fff','#d38bff','#ffcf6a'],sp:300,life:.7,s:9});FX.ring(p.x,p.y,'#fff',10,90,.5,5);run.kills++;setTimeout(()=>e.el&&e.el.classList.add('gone'),650)}
function flashHit(u){u.el.classList.remove('hit');void u.el.offsetWidth;u.el.classList.add('hit')}
function lunge(u){u.el.classList.add('lunge');setTimeout(()=>u.el.classList.remove('lunge'),170)}
function bubble(u){const b=document.createElement('div');b.className='bubble';u.el.querySelector('.body').appendChild(b);setTimeout(()=>b.remove(),650)}
function aura(u,c){const a=document.createElement('div');a.className='aura';a.style.setProperty('--ac',c);u.el.querySelector('.body').appendChild(a);setTimeout(()=>a.remove(),950)}
function popNum(u,txt,cls){const p=H.pt(u);const d=document.createElement('div');d.className='num '+cls;d.textContent=txt;d.style.left=(p.x+rnd(-18,18))+'px';d.style.top=(p.y-20+rnd(-10,10))+'px';$('#floaters').appendChild(d);d.addEventListener('animationend',()=>d.remove())}

function unitEl(u,hero){
  const d=document.createElement('div');d.className='unit'+(hero?' hero':'')+(u.boss||u.elite?' big':'');
  d.innerHTML=`<div class="intent"></div><div class="lw"><div class="body"><span class="sprite">${u.ic}</span></div></div><div class="shadow"></div><div class="bars"><div class="hpbar"><div class="lag"></div><div class="fill"></div><span></span></div><div class="blk"></div></div><div class="sts"></div>`;
  if(hero)d.querySelector('.intent').style.visibility='hidden';
  u.el=d;return d;
}
function renderUnit(u){
  if(!u.el)return;const el=u.el;const f=Math.max(0,u.hp/u.maxHp);
  el.querySelector('.fill').style.transform=`scaleX(${f})`;el.querySelector('.lag').style.transform=`scaleX(${f})`;
  el.querySelector('.hpbar span').textContent=`${u.hp}/${u.maxHp}`;
  el.classList.toggle('hasblk',u.block>0);el.querySelector('.blk').textContent=u.block;
  el.querySelector('.sts').innerHTML=Object.entries(u.st).filter(([k,v])=>v>0).map(([k,v])=>`<span title="${STS[k].n}">${STS[k].ic}${k==='keep'?'':v}</span>`).join('');
  if(u!==B.p){const m=u.intent;let s='';if(m&&!u.dead){
      if(m.d!=null){const d=calcDmg(u,B.p,m.d);s+=`<span class="i-atk">⚔️${d}${m.h>1?'×'+m.h:''}</span> `}
      if(m.b)s+=`<span class="i-blk">🛡️</span>`;if(m.s)s+=`<span class="i-buf">💪</span>`;
      if(m.weak||m.vuln||m.poison||m.burn)s+=`<span class="i-deb">🌀</span>`;if(m.heal)s+=`<span class="i-heal">💚</span>`}
    el.querySelector('.intent').innerHTML=s}
}
function intentText(e){const m=e.intent;if(!m)return'';const a=[];
  if(m.d!=null)a.push(`tấn công ${calcDmg(e,B.p,m.d)} sát thương${m.h>1?' × '+m.h+' lần':''}`);
  if(m.b)a.push(`nhận ${m.b} Giáp`);if(m.s)a.push(`tăng ${m.s} Sức mạnh`);if(m.heal)a.push(`hồi ${m.heal} Máu`);
  if(m.weak)a.push(`gây ${m.weak} Yếu`);if(m.vuln)a.push(`gây ${m.vuln} Dễ vỡ`);if(m.poison)a.push(`gây ${m.poison} Độc`);if(m.burn)a.push(`gây ${m.burn} Thiêu đốt`);
  return 'Ý định: '+a.join(', ')}
function unitInfo(u){const sts=Object.entries(u.st).filter(([k,v])=>v>0).map(([k,v])=>`${STS[k].ic} <b>${STS[k].n} ${k==='keep'?'':v}</b>: ${STS[k].d.replace('X',v)}`);
  toast(`<b>${u.n}</b> ❤️ ${u.hp}/${u.maxHp}${u.block?' 🛡️ '+u.block:''}${u!==B.p&&u.intent?'<br>'+intentText(u):''}${sts.length?'<br>'+sts.join('<br>'):''}`,3200)}

function startBattle(group,kind){
  showScreen('battle');
  const hero=HEROES[run.hero];
  B={kind,turn:0,energy:0,busy:true,over:false,hand:[],disc:[],exh:[],
    draw:shuffle(run.deck.map(c=>({...c}))),
    p:{n:hero.n,ic:hero.ic,hp:run.hp,maxHp:run.maxHp,block:0,st:{}},
    enemies:group.map(id=>{const d=ENEMIES[id];const hp=ri(d.hp[0],d.hp[1]);return{...d,id,hp,maxHp:hp,block:0,st:{},hist:[],step:0}})};
  const arena=$('#arena');arena.className='act'+run.act;
  const hs=$('#heroSide'),es=$('#enemySide');hs.innerHTML='';es.innerHTML='';
  hs.appendChild(unitEl(B.p,true));B.enemies.forEach(e=>{es.appendChild(unitEl(e))});
  B.enemies.forEach(e=>e.el.addEventListener('click',()=>onEnemyTap(e)));
  B.p.el.addEventListener('click',()=>{if(sel){const c=B.hand.find(x=>x.uid===sel);if(c&&CARDS[c.id].tg!=='one'){playCard(sel,null);return}}unitInfo(B.p)});
  // bảo vật đầu trận
  if(hasRelic('huyhieu'))B.p.st.str=(B.p.st.str||0)+1;
  if(hasRelic('nhan'))B.p.st.str=(B.p.st.str||0)+1;
  if(hasRelic('giap'))B.p.block+=8;
  if(hasRelic('bua'))B.p.st.thorns=(B.p.st.thorns||0)+3;
  for(const e of B.enemies){if(hasRelic('tinhthe'))e.st.weak=1;if(hasRelic('mat'))e.st.vuln=1}
  renderUnit(B.p);B.enemies.forEach(renderUnit);renderHand();updateHUD();
  banner(kind==='boss'?'⚠️ TRÙM XUẤT HIỆN':kind==='elite'?'Kẻ địch tinh anh!':'Chiến đấu!');
  setTimeout(startTurn,900);
}
function chooseIntent(e){
  let idx;
  if(e.boss){idx=e.step%e.m.length;e.step++}
  else{const h=e.hist;let opts=e.m.map((m,i)=>i);if(e.m.length>1&&h.length>=2&&h[h.length-1]===h[h.length-2])opts=opts.filter(i=>i!==h[h.length-1]);
    if(e.m.length>1&&h.length&&(e.m[h[h.length-1]].s||e.m[h[h.length-1]].b&&!e.m[h[h.length-1]].d))opts=opts.filter(i=>i!==h[h.length-1]);
    const tot=opts.reduce((s,i)=>s+(e.m[i].w||1),0);let x=Math.random()*tot;idx=opts[0];for(const i of opts){x-=e.m[i].w||1;if(x<=0){idx=i;break}}}
  e.hist.push(idx);e.intent=e.m[idx];
}
async function tickStart(u){
  const p=H.pt(u);
  for(const k of ['poison','burn']){if(u.st[k]>0&&!u.dead){const n=u.st[k];if(k==='poison')FXR.poisonFx(p,p);else FXR.burnFx(p,p);await wait(220);u.hp=Math.max(0,u.hp-n);popNum(u,'-'+n,k==='poison'?'psn':'burn');flashHit(u);u.st[k]--;renderUnit(u);if(u===B.p)renderTop();if(u.hp<=0&&u!==B.p)die(u);await wait(150)}}
  if(u===B.p&&!u.dead){
    if(u.st.regen>0){FXR.heal(p);const a=Math.min(u.st.regen,run.maxHp-u.hp);u.hp+=a;if(a)popNum(u,'+'+a,'heal');await wait(200)}
    if(u.st.plate>0){FXR.iceArmor(p);await wait(300);u.block+=u.st.plate;popNum(u,'+'+u.st.plate+' 🛡','blk')}
    renderUnit(u);renderTop();
  }
}
function decay(u){for(const k of ['weak','vuln'])if(u.st[k]>0)u.st[k]--;renderUnit(u)}
async function startTurn(){
  if(B.over)return;B.turn++;const p=B.p;
  if(!p.st.keep)p.block=0;
  B.maxE=3+(p.st.energy||0);B.energy=B.maxE+(B.turn===1&&hasRelic('loi')?1:0);
  renderUnit(p);
  await tickStart(p);if(checkEnd())return;
  for(const e of H.alive())chooseIntent(e);B.enemies.forEach(renderUnit);
  if(B.turn>1)banner('Lượt của bạn');
  updateHUD();
  await drawCards(5+(B.turn===1&&hasRelic('dongho')?2:0));
  B.busy=false;updateHUD();renderHand();
}
async function drawCards(n){
  const fresh=new Set();
  for(let i=0;i<n;i++){
    if(!B.draw.length){if(!B.disc.length)break;B.draw=shuffle(B.disc);B.disc=[];toast('♻️ Xáo lại chồng bài bỏ',1000)}
    if(B.hand.length>=10){toast('Tay bài đã đầy!');break}
    const c=B.draw.pop();B.hand.push(c);fresh.add(c.uid);
  }
  if(fresh.size){SFX.card();renderHand(fresh);updateHUD();await wait(120+fresh.size*60)}
}
async function endTurn(){
  if(!B||B.busy||B.over)return;B.busy=true;sel=null;
  B.disc.push(...B.hand);B.hand=[];renderHand();decay(B.p);updateHUD();
  banner('Lượt của kẻ địch');await wait(700);
  for(const e of B.enemies){if(e.dead||B.over)continue;e.block=0;renderUnit(e)}
  for(const e of B.enemies){
    if(e.dead||B.over)continue;
    await tickStart(e);if(checkEnd())return;if(e.dead)continue;
    await doMove(e);if(checkEnd())return;decay(e);await wait(220);
  }
  if(!B.over)startTurn();
}
async function doMove(e){
  const m=e.intent;if(!m)return;const ep=H.pt(e),pp=H.pt(B.p);
  if(m.b){bubble(e);await FXR.shield(ep);e.block+=m.b;popNum(e,'+'+m.b+' 🛡','blk');renderUnit(e)}
  if(m.s){aura(e,'rgba(255,80,60,.8)');await FXR.buffRed(ep);e.st.str=(e.st.str||0)+m.s;popNum(e,'💪 +'+m.s,'info');renderUnit(e)}
  if(m.heal){await FXR.heal(ep);const a=Math.min(m.heal,e.maxHp-e.hp);e.hp+=a;popNum(e,'+'+a,'heal');renderUnit(e)}
  if(m.d!=null){for(let i=0;i<(m.h||1);i++){if(e.dead||B.p.hp<=0)break;lunge(e);await wait(90);await hit(e,B.p,m.d,m.fx||'claw',i);await wait(m.h>1?110:60)}}
  if(B.p.hp<=0||e.dead)return;
  if(m.weak||m.vuln){await FXR.debuff(ep,pp);if(m.weak)B.p.st.weak=(B.p.st.weak||0)+m.weak;if(m.vuln)B.p.st.vuln=(B.p.st.vuln||0)+m.vuln;popNum(B.p,(m.weak?'🥀 Yếu ':'')+(m.vuln?'💔 Dễ vỡ':''),'info')}
  if(m.poison){if(m.d==null)await FXR.spit(ep,pp);else FXR.poisonFx(ep,pp);B.p.st.poison=(B.p.st.poison||0)+m.poison;popNum(B.p,'☠️ Độc '+m.poison,'psn')}
  if(m.burn){FXR.burnFx(ep,pp);B.p.st.burn=(B.p.st.burn||0)+m.burn;popNum(B.p,'🔥 Thiêu đốt '+m.burn,'burn')}
  renderUnit(B.p);renderHand();
}
function checkEnd(){
  if(B.over)return true;
  if(B.p.hp<=0){
    if(hasRelic('long')&&!run.phoenix){run.phoenix=true;B.p.hp=Math.floor(run.maxHp*.3);FXR.buffGold(H.pt(B.p));FXR.heal(H.pt(B.p));toast('🪶 Lông Phượng bùng cháy! Bạn hồi sinh!',2200);renderUnit(B.p);renderTop();return false}
    B.over=true;run.hp=0;SFX.lose();setTimeout(()=>gameOver(false),900);return true}
  if(!H.alive().length){B.over=true;run.hp=B.p.hp;SFX.win();banner('CHIẾN THẮNG!');setTimeout(()=>battleWon(),1300);return true}
  return false;
}
function updateHUD(){
  if(!B)return;const e=$('#energy');e.textContent=`${B.energy}/${B.maxE||3}`;e.classList.toggle('empty',B.energy<=0);
  $('#drawPile').textContent='🂠 '+B.draw.length;$('#discPile').textContent='♻️ '+B.disc.length;
  $('#endBtn').disabled=B.busy||B.over;
  run.hp=B.p.hp;renderTop();
}

/* ---------- Tay bài & thao tác kéo / chạm ---------- */
let sel=null,drag=null;
const handEl=$('#hand');
function renderHand(fresh){
  if(!B)return;
  const tgt=sel?null:null;
  handEl.innerHTML='';
  B.hand.forEach((c,i)=>{const s=document.createElement('div');s.className='slot';s.dataset.uid=c.uid;
    if(costOf(c)>B.energy||B.busy&&!B.over&&false)s.classList.add('unplayable');
    if(sel===c.uid)s.classList.add('sel');
    s.innerHTML=cardHTML(c,true,tgt);
    if(fresh&&fresh.has(c.uid)){const cd=s.firstChild;cd.classList.add('drawn');cd.style.animationDelay=([...fresh].indexOf(c.uid)*70)+'ms'}
    s.addEventListener('pointerdown',ev=>onCardDown(ev,c,s));
    handEl.appendChild(s)});
  layoutHand();markTargets();
}
function layoutHand(){
  const slots=[...handEl.children];const n=slots.length;if(!n)return;
  const cw=slots[0].offsetWidth||100;const avail=handEl.clientWidth-16;
  const step=n>1?Math.min(cw*.95,(avail-cw)/(n-1)):0;
  slots.forEach((s,i)=>{const off=i-(n-1)/2,x=off*step,rot=off*Math.min(5,26/n),y=off*off*1.4;
    if(s.classList.contains('drag'))return;
    if(s.classList.contains('sel')){s.style.transform=`translateX(calc(-50% + ${x}px)) translateY(-${cw*.32}px) scale(1.14)`;s.style.zIndex=100}
    else{s.style.transform=`translateX(calc(-50% + ${x}px)) translateY(${y}px) rotate(${rot}deg)`;s.style.zIndex=i+1}});
}
addEventListener('resize',()=>{layoutHand()});
function markTargets(){
  if(!B)return;const c=sel&&B.hand.find(x=>x.uid===sel);const need=c&&CARDS[c.id].tg==='one';
  B.enemies.forEach(e=>e.el&&e.el.classList.toggle('targetable',!!need&&!e.dead));
}
function enemyAt(x,y){for(const e of H.alive()){const r=e.el.getBoundingClientRect();if(x>=r.left-10&&x<=r.right+10&&y>=r.top-10&&y<=r.bottom+10)return e}return null}
function canPlay(c,s){if(B.busy||B.over)return false;if(costOf(c)>B.energy){toast('⚡ Không đủ năng lượng!',1100);if(s){s.classList.remove('nope');void s.offsetWidth;s.classList.add('nope')}return false}return true}
function onCardDown(ev,c,s){
  if(!B||B.busy||B.over)return;ev.preventDefault();SFX.unlock();
  drag={c,s,x0:ev.clientX,y0:ev.clientY,moved:false,id:ev.pointerId};
  try{s.setPointerCapture(ev.pointerId)}catch(e){}
  s.onpointermove=e=>onCardMove(e);s.onpointerup=e=>onCardUp(e);s.onpointercancel=()=>{drag=null;s.classList.remove('drag');layoutHand()};
}
function onCardMove(ev){
  if(!drag)return;const d=drag;const dx=ev.clientX-d.x0,dy=ev.clientY-d.y0;
  if(!d.moved&&Math.hypot(dx,dy)>12){if(costOf(d.c)>B.energy){canPlay(d.c,d.s);drag=null;return}d.moved=true;d.s.classList.add('drag');sel=d.c.uid;handEl.querySelectorAll('.slot').forEach(x=>x.classList.toggle('sel',x===d.s));markTargets()}
  if(d.moved){const hr=handEl.getBoundingClientRect();const cw=d.s.offsetWidth,ch=d.s.offsetHeight;
    d.s.style.transform=`translate(${ev.clientX-hr.left-hr.width/2-cw/2}px,${ev.clientY-hr.bottom+ch*.55+6}px) scale(1.08)`;
    const en=enemyAt(ev.clientX,ev.clientY);B.enemies.forEach(e=>e.el.classList.toggle('tgthover',e===en&&CARDS[d.c.id].tg==='one'))}
}
function onCardUp(ev){
  if(!drag)return;const d=drag;drag=null;d.s.onpointermove=d.s.onpointerup=null;
  B.enemies.forEach(e=>e.el.classList.remove('tgthover'));
  if(d.moved){
    d.s.classList.remove('drag');const def=CARDS[d.c.id];const hr=handEl.getBoundingClientRect();const above=ev.clientY<hr.top-10;
    if(def.tg==='one'){let t=enemyAt(ev.clientX,ev.clientY);if(!t&&above&&H.alive().length===1)t=H.alive()[0];if(t&&canPlay(d.c)){playCard(d.c.uid,t);return}}
    else if(above&&canPlay(d.c,d.s)){playCard(d.c.uid,null);return}
    sel=null;renderHand();return;
  }
  // chạm
  const c=d.c;
  if(sel===c.uid){const def=CARDS[c.id];
    if(def.tg!=='one'){if(canPlay(c,d.s))playCard(c.uid,null);return}
    if(H.alive().length===1){if(canPlay(c,d.s))playCard(c.uid,H.alive()[0]);return}
    sel=null;renderHand();return}
  if(costOf(c)>B.energy){canPlay(c,d.s);return}
  sel=c.uid;SFX.card();handEl.querySelectorAll('.slot').forEach(x=>x.classList.toggle('sel',+x.dataset.uid===c.uid));layoutHand();markTargets();
  const def=CARDS[c.id];if(def.tg==='one'&&H.alive().length>1)toast('🎯 Chạm vào kẻ địch để dùng thẻ',1100);else toast('Chạm lần nữa để dùng thẻ',1000);
}
function onEnemyTap(e){
  if(!B||e.dead)return;
  if(sel&&!B.busy){const c=B.hand.find(x=>x.uid===sel);if(c){const def=CARDS[c.id];if(canPlay(c)){if(def.tg==='one'){playCard(c.uid,e);return}playCard(c.uid,null);return}return}}
  unitInfo(e);
}
$('#arena').addEventListener('click',ev=>{if(ev.target.closest('.unit'))return;if(sel&&B&&!B.busy){const c=B.hand.find(x=>x.uid===sel);if(c&&CARDS[c.id].tg!=='one'&&canPlay(c)){playCard(c.uid,null);return}sel=null;renderHand()}});
async function playCard(uid,target){
  const i=B.hand.findIndex(c=>c.uid===uid);if(i<0||B.busy||B.over)return;
  const card=B.hand[i],def=CARDS[card.id],cst=costOf(card);
  if(cst>B.energy)return;if(def.tg==='one'&&(!target||target.dead))return;
  B.busy=true;sel=null;
  const slot=handEl.querySelector(`[data-uid="${uid}"]`);const r=slot&&slot.querySelector('.card').getBoundingClientRect();
  B.energy-=cst;B.hand.splice(i,1);
  flyCard(card,r,target);renderHand();updateHUD();SFX.card();
  if(def.t==='pow')aura(B.p,'rgba(200,120,255,.8)');
  await wait(230);
  const ctx={u:card.up,t:target,D:V(def,'dm',card.up),B:V(def,'b',card.up),X:V(def,'x',card.up),Y:V(def,'y',card.up),card};
  try{await def.play(ctx)}catch(err){console.error(err)}
  if(def.t!=='pow'){(def.ex?B.exh:B.disc).push(card)}
  B.enemies.forEach(renderUnit);updateHUD();
  if(checkEnd())return;
  B.busy=false;renderHand();updateHUD();
}
function flyCard(card,r,target){
  if(!r)return;const el=document.createElement('div');el.className='flycard';el.innerHTML=cardHTML(card,true);
  el.style.left=r.left+'px';el.style.top=r.top+'px';document.body.appendChild(el);
  const def=CARDS[card.id];const to=target?H.pt(target):def.tg==='all'||def.tg==='rand'?{x:innerWidth*.62,y:H.pt(B.p).y}:H.pt(B.p);
  const dx=to.x-(r.left+r.width/2),dy=to.y-(r.top+r.height/2);
  const glow=def.t==='atk'?'#ff6a4a':def.t==='skill'?'#5ac8ff':'#d08bff';
  const an=el.animate([{transform:'translate(0,0) scale(1) rotate(0)',opacity:1,filter:'brightness(1)'},{transform:`translate(${dx*.25}px,${dy*.25-60}px) scale(1.15) rotate(0)`,opacity:1,filter:`brightness(1.4) drop-shadow(0 0 16px ${glow})`,offset:.35},{transform:`translate(${dx}px,${dy}px) scale(.25) rotate(${dx>0?20:-20}deg)`,opacity:0,filter:`brightness(2.5) drop-shadow(0 0 20px ${glow})`}],{duration:380,easing:'cubic-bezier(.3,.6,.4,1)'});
  an.onfinish=()=>{el.remove();FX.burst(to.x,to.y,{n:10,c:glow,sp:160,life:.35,s:7})};
}
$('#endBtn').onclick=()=>{SFX.unlock();endTurn()};
$('#drawPile').onclick=()=>B&&showPile('Chồng bài rút (thứ tự ẩn)',B.draw);
$('#discPile').onclick=()=>B&&showPile('Chồng bài bỏ',B.disc);

/* =========================================================
   PHẦN THƯỞNG, LỬA TRẠI, CỬA HÀNG, SỰ KIỆN, KHO BÁU
========================================================= */
function heroPool(r){return Object.keys(CARDS).filter(k=>CARDS[k].h===run.hero&&(!r||CARDS[k].r===r)&&CARDS[k].r!=='s')}
function rollRarity(kind){const x=Math.random();if(kind==='boss')return'r';const rare=kind==='elite'?.18:.07,unc=kind==='elite'?.45:.33;return x<rare?'r':x<rare+unc?'u':'c'}
function cardChoices(kind,n=3){const out=[];let guard=0;while(out.length<n&&guard++<50){const id=pick(heroPool(rollRarity(kind)));if(id&&!out.includes(id))out.push(id)}return out.map(id=>mk(id))}
function randomRelic(){const pool=RELIC_POOL.filter(r=>!run.relics.includes(r));return pool.length?pick(pool):null}
function gainRelic(r){if(!r)return;run.relics.push(r);if(RELICS[r].get)RELICS[r].get();SFX.coin();renderTop()}
function panel(html){showScreen('panel');const pb=$('#panelBody');pb.innerHTML=html;pb.scrollTop=0;return pb}

function battleWon(){
  const kind=B.kind;
  let heal=0;if(hasRelic('tranghat'))heal+=5;if(hasRelic('ngoc'))heal+=6;
  run.hp=Math.min(run.maxHp,B.p.hp+heal);
  B=null;
  let gold=kind==='boss'?ri(90,110):kind==='elite'?ri(30,45):ri(14,24);if(hasRelic('tui'))gold=Math.round(gold*1.5);
  const items=[{t:'gold',v:gold},{t:'card',v:cardChoices(kind)}];
  if(kind==='elite'||kind==='boss'){const r=randomRelic();if(r)items.push({t:'relic',v:r})}
  showReward(items,kind,heal);
}
function showReward(items,kind,heal){
  const pb=panel(`<h2>🏆 Phần thưởng</h2>${heal?`<p>📿 Hồi ${heal} Máu</p>`:''}<div class="rewards" id="rw"></div><button class="btn" id="rwDone">Tiếp tục →</button>`);
  const rw=$('#rw');
  items.forEach((it,i)=>{const b=document.createElement('button');b.className='opt';
    if(it.t==='gold')b.innerHTML=`💰 Nhận <b>${it.v}</b> vàng`;
    if(it.t==='card')b.innerHTML=`🎴 Thêm một thẻ vào bộ bài`;
    if(it.t==='relic')b.innerHTML=`${RELICS[it.v].ic} Bảo vật: <b>${RELICS[it.v].n}</b><br><small>${RELICS[it.v].d}</small>`;
    b.onclick=async()=>{
      if(it.t==='gold'){run.gold+=it.v;SFX.coin();b.remove();renderTop()}
      if(it.t==='relic'){gainRelic(it.v);b.remove()}
      if(it.t==='card'){const i2=await pickCard('Chọn 1 thẻ',it.v,{cancel:true});if(i2>=0){run.deck.push(it.v[i2]);SFX.coin();b.remove();renderTop()}}
    };rw.appendChild(b)});
  $('#rwDone').onclick=()=>afterNode(kind);
}
function afterNode(kind){
  if(kind==='boss'){
    if(run.act>=3){gameOver(true);return}
    run.act++;run.map=genMap(run.act);run.pos=null;run.fights=0;run.hp=run.maxHp;
    panel(`<h2>Màn ${run.act}: ${ACTS[run.act].n}</h2><div class="relicbig">${run.act===2?'🏔️':'🏰'}</div><p>Bạn đã đánh bại trùm! Máu được hồi đầy. Hành trình tiếp tục...</p><button class="btn" id="go">Lên đường</button>`);
    $('#go').onclick=showMap;return}
  showMap();
}
async function upgradeFlow(title){
  const ups=run.deck.filter(c=>!c.up);
  const i=await pickCard(title,ups,{cancel:true,preview:c=>({...c,up:true})});
  if(i<0)return false;ups[i].up=true;SFX.buff();toast(`✨ Đã nâng cấp ${CARDS[ups[i].id].n}+`);return true;
}
function showRest(){
  const heal=Math.floor(run.maxHp*.3);
  panel(`<h2>🔥 Lửa trại</h2><p>Ngọn lửa ấm áp xua tan bóng tối. Bạn muốn làm gì?</p><div class="opts"><button class="opt" id="rHeal">😴 <b>Nghỉ ngơi</b>: hồi ${heal} Máu (${run.hp}/${run.maxHp})</button><button class="opt" id="rUp">⚒️ <b>Rèn luyện</b>: nâng cấp 1 thẻ bài</button></div>`);
  $('#rHeal').onclick=()=>{run.hp=Math.min(run.maxHp,run.hp+heal);SFX.heal();toast(`💚 Hồi ${heal} Máu`);showMap()};
  $('#rUp').onclick=async()=>{if(await upgradeFlow('Chọn thẻ để nâng cấp'))showMap()};
}
function showTreasure(){
  const r=randomRelic();const g=ri(25,45);
  panel(`<h2>💎 Kho báu</h2><div class="chest" id="chest">🧰</div><p>Chạm để mở rương</p>`);
  $('#chest').onclick=()=>{
    run.gold+=g;if(r)gainRelic(r);
    const rect=$('#chest').getBoundingClientRect();const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    FX.burst(x,y,{n:40,c:['#ffd24a','#fff1a0','#ffffff'],sp:380,life:.8,s:8,g:300,vy:-200});FX.ring(x,y,'#ffd24a',10,140,.5,6);SFX.coin();
    panel(`<h2>💎 Kho báu</h2>${r?`<div class="relicbig">${RELICS[r].ic}</div><p><b>${RELICS[r].n}</b><br>${RELICS[r].d}</p>`:''}<p>💰 +${g} vàng</p><button class="btn" id="go">Tiếp tục →</button>`);
    $('#go').onclick=showMap;
  };
}
function showShop(){
  const prices={c:[45,60],u:[70,90],r:[140,170]};
  const cards=[...cardChoices('battle',3),...cardChoices('elite',2)].map(c=>({c,p:ri(...prices[CARDS[c.id].r]),sold:false}));
  const relics=[randomRelic(),randomRelic()].filter((r,i,a)=>r&&a.indexOf(r)===i).map(r=>({r,p:ri(140,175),sold:false}));
  let removeCost=75,removed=false;
  function draw(){
    panel(`<h2>🛒 Cửa hàng của Lão Mèo Đen</h2><p>“Hàng tốt, giá phải chăng, meo~” · Bạn có 💰 <b>${run.gold}</b></p>
      <div class="cardrow">${cards.map((x,i)=>`<div class="pickable ${x.sold?'sold':''}" data-c="${i}">${cardHTML(x.c)}<span class="price">💰 ${x.p}</span></div>`).join('')}</div>
      <div class="opts">${relics.map((x,i)=>`<button class="opt" data-r="${i}" ${x.sold?'disabled':''}>${RELICS[x.r].ic} <b>${RELICS[x.r].n}</b> · 💰 ${x.p}<br><small>${RELICS[x.r].d}</small></button>`).join('')}
      <button class="opt" id="rm" ${removed?'disabled':''}>🗑️ <b>Loại bỏ 1 thẻ</b> khỏi bộ bài · 💰 ${removeCost}</button></div>
      <button class="btn" id="leave">Rời cửa hàng →</button>`);
    document.querySelectorAll('[data-c]').forEach(el=>el.onclick=()=>{const x=cards[+el.dataset.c];if(x.sold)return;if(run.gold<x.p){toast('💰 Không đủ vàng!');return}run.gold-=x.p;x.sold=true;run.deck.push(x.c);SFX.coin();draw()});
    document.querySelectorAll('[data-r]').forEach(el=>el.onclick=()=>{const x=relics[+el.dataset.r];if(run.gold<x.p){toast('💰 Không đủ vàng!');return}run.gold-=x.p;x.sold=true;gainRelic(x.r);draw()});
    $('#rm').onclick=async()=>{if(run.gold<removeCost){toast('💰 Không đủ vàng!');return}const i=await pickCard('Chọn thẻ để loại bỏ',run.deck);if(i<0)return;run.gold-=removeCost;run.deck.splice(i,1);removed=true;SFX.coin();draw()};
    $('#leave').onclick=showMap;
  }
  draw();
}
const EVENTS=[
  {t:'⛩️ Đền Thờ Cổ',d:'Một ngôi đền phủ rêu xanh, bức tượng thần đá vẫn tỏa ánh sáng nhạt.',o:[
    {l:'🙏 <b>Cầu nguyện</b>: nâng cấp 1 thẻ bài',f:async()=>{await upgradeFlow('Thần linh ban phước: chọn thẻ để nâng cấp')}},
    {l:'💰 <b>Lấy đồng tiền cúng</b>: +40 vàng, mất 5 Máu',f:()=>{run.gold+=40;run.hp=Math.max(1,run.hp-5);SFX.coin()}},
    {l:'🚶 Rời đi',f:()=>{}}]},
  {t:'🧳 Lữ Khách Bí Ẩn',d:'Kẻ đội mũ trùm mỉm cười: “Máu của ngươi đổi lấy kho báu của ta, thế nào?”',o:[
    {l:'🩸 <b>Đồng ý</b>: mất 10 Máu, nhận 1 bảo vật ngẫu nhiên',f:()=>{run.hp=Math.max(1,run.hp-10);const r=randomRelic();if(r){gainRelic(r);toast(`${RELICS[r].ic} Nhận ${RELICS[r].n}`)}}},
    {l:'🚶 Từ chối',f:()=>{}}]},
  {t:'💧 Suối Linh Tuyền',d:'Dòng suối trong vắt lấp lánh như chứa đựng sinh khí của cả khu rừng.',o:[
    {l:'🥤 <b>Uống nước</b>: hồi 25 Máu',f:()=>{run.hp=Math.min(run.maxHp,run.hp+25);SFX.heal()}},
    {l:'🛁 <b>Tắm suối</b>: +6 Máu tối đa',f:()=>{run.maxHp+=6;run.hp+=6;SFX.buff()}}]},
  {t:'📦 Rương Bị Nguyền',d:'Chiếc rương khắc đầy bùa chú. Bên trong vọng ra tiếng leng keng của vàng.',o:[
    {l:'🔓 <b>Mở rương</b>: +85 vàng, mất 8 Máu',f:()=>{run.gold+=85;run.hp=Math.max(1,run.hp-8);SFX.coin()}},
    {l:'🚶 Bỏ qua',f:()=>{}}]},
  {t:'📜 Thầy Đồ Lang Thang',d:'Ông lão râu bạc đưa cho bạn một cuộn bí kíp: “Chọn lấy một chiêu thức hợp với ngươi.”',o:[
    {l:'📖 <b>Học chiêu</b>: chọn 1 trong 3 thẻ',f:async()=>{const ch=cardChoices('elite');const i=await pickCard('Chọn bí kíp',ch,{cancel:true});if(i>=0)run.deck.push(ch[i])}},
    {l:'🗑️ <b>Quên chiêu cũ</b>: loại bỏ 1 thẻ',f:async()=>{const i=await pickCard('Chọn thẻ để loại bỏ',run.deck,{cancel:true});if(i>=0)run.deck.splice(i,1)}}]},
];
function showEvent(){
  const ev=pick(EVENTS);
  panel(`<h2>${ev.t}</h2><p>${ev.d}</p><div class="opts">${ev.o.map((o,i)=>`<button class="opt" data-o="${i}">${o.l}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-o]').forEach(b=>b.onclick=async()=>{await ev.o[+b.dataset.o].f();renderTop();showMap()});
}
function gameOver(win){
  B=null;API.clearSave();
  API.submitRun({hero:run.hero,win:!!win,act:run.act,floor:run.floor,kills:run.kills,gold:run.gold,deckSize:run.deck.length}).then(r=>{const el=$('#scoreLine');if(!el)return;el.innerHTML=r?`🏅 Điểm: <b>${r.score}</b> · Hạng <b>#${r.rank}</b> toàn máy chủ`:(API.loggedIn?'':'Đăng nhập để lưu điểm lên bảng xếp hạng.')});
  const pb=panel(win?`<h2>👑 CHIẾN THẮNG VẺ VANG!</h2><div class="relicbig">🏆</div><p>${HEROES[run.hero].n} đã đánh bại Ma Vương Hư Không và mang lại ánh sáng cho ba vùng đất!</p><p>Kẻ địch đã hạ: <b>${run.kills}</b> · Bộ bài: <b>${run.deck.length}</b> thẻ · Vàng: <b>${run.gold}</b></p><p id="scoreLine"></p><button class="btn" id="again">Chơi lại</button>`
    :`<h2 style="color:#ff6a6a">💀 THẤT BẠI</h2><p>${HEROES[run.hero].n} đã gục ngã ở Màn ${run.act}, tầng ${run.floor}.</p><p>Kẻ địch đã hạ: <b>${run.kills}</b></p><p id="scoreLine"></p><button class="btn" id="again">Thử lại</button>`);
  if(win){SFX.win();const go=()=>{for(let k=0;k<4;k++)setTimeout(()=>{const x=rnd(innerWidth*.2,innerWidth*.8),y=rnd(innerHeight*.2,innerHeight*.5);FX.burst(x,y,{n:40,c:['#ffd24a','#ff6ad5','#5ff5ff','#6dff9a'],sp:340,life:1,s:6,g:200})},k*300)};go()}
  $('#again').onclick=()=>{run=null;refreshMenu();showScreen('menu')};
}

/* =========================================================
   MENU & KHỞI ĐỘNG
========================================================= */
function initMenu(){
  const fc=$('#floatcards');const ics=['🗡️','❄️','🛡️','🔥','⚡','🐉','💎','🌙','🔮','👊'];
  for(let i=0;i<10;i++){const s=document.createElement('span');s.textContent=ics[i];s.style.left=(i*10+rnd(0,6))+'%';s.style.animationDelay=(-rnd(0,9))+'s';s.style.animationDuration=rnd(8,14)+'s';fc.appendChild(s)}
  const hs=$('#heroes');
  for(const k in HEROES){const h=HEROES[k];const b=document.createElement('button');b.className='hero-card';b.style.setProperty('--hc',h.col);
    b.innerHTML=`<div class="hic">${h.ic}</div><div><b>${h.n}</b><small>${h.title}</small><p>${h.desc}</p><div class="hstat">❤️ ${h.hp} Máu · ${RELICS[h.relic].ic} ${RELICS[h.relic].n}: ${RELICS[h.relic].d}</div></div>`;
    b.onclick=()=>{SFX.unlock();SFX.buff();startRun(k)};hs.appendChild(b)}
  $('#btnStart').onclick=()=>{SFX.unlock();SFX.card();showScreen('heroSel')};
  $('#btnBack').onclick=()=>showScreen('menu');
  $('#btnSound').onclick=()=>{SFX.unlock();SFX.toggle();updateSoundBtn()};
  $('#btnHelp').onclick=()=>{const m=$('#modal');m.innerHTML=`<h3>📖 Hướng dẫn</h3><div class="help"><ul>
    <li><b>Mục tiêu:</b> vượt qua 3 màn, mỗi màn có một trùm cuối. Chọn đường đi trên bản đồ.</li>
    <li><b>Năng lượng ⚡:</b> mỗi lượt có 3 năng lượng. Số ở góc thẻ là chi phí.</li>
    <li><b>Dùng thẻ:</b> kéo thẻ lên kẻ địch, hoặc chạm thẻ rồi chạm kẻ địch. Thẻ không cần mục tiêu: kéo lên hoặc chạm 2 lần.</li>
    <li><b>Giáp 🛡️:</b> chặn sát thương, mất đi đầu lượt sau.</li>
    <li><b>Ý định:</b> biểu tượng trên đầu kẻ địch cho biết chúng sắp làm gì (⚔️ tấn công, 🛡️ phòng thủ, 💪 tăng sức, 🌀 gây hiệu ứng xấu).</li>
    <li><b>Hiệu ứng:</b> 💪 Sức mạnh, 🥀 Yếu, 💔 Dễ vỡ, ☠️ Độc, 🔥 Thiêu đốt, 🌵 Gai. Chạm vào nhân vật để xem chi tiết.</li>
    <li><b>Tiêu hao:</b> thẻ bị loại khỏi trận sau khi dùng. <b>Năng lực:</b> hiệu lực đến hết trận.</li>
    <li>Thắng trận để nhận vàng, thẻ mới và bảo vật. Nâng cấp thẻ ở 🔥 Lửa trại.</li></ul></div><button class="btn" data-close>Đã hiểu</button>`;m.classList.add('on');m.querySelector('[data-close]').onclick=()=>m.classList.remove('on')};
}
function updateSoundBtn(){$('#btnSound').textContent=SFX.on?'🔊 Âm thanh: Bật':'🔇 Âm thanh: Tắt'}
function startRun(k){
  const h=HEROES[k];
  run={hero:k,hp:h.hp,maxHp:h.hp,gold:99,deck:h.deck.map(id=>mk(id)),relics:[h.relic],act:1,floor:0,map:genMap(1),pos:null,kills:0,fights:0,phoenix:false};
  showMap();
}
initMenu();
/* ---------- Tài khoản, tiếp tục, bảng xếp hạng ---------- */
const HERO_SHORT={kiem:'🤺',bang:'🧙‍♀️',thach:'🧘‍♂️'};
async function refreshMenu(){
  const acc=$('#account');
  acc.innerHTML=API.loggedIn?`👤 <b>${API.user.username}</b> · <a id="lnkStats">Thống kê</a> · <a id="lnkOut">Đăng xuất</a>`:`Chơi khách (lưu trên máy) · <a id="lnkIn">Đăng nhập / Đăng ký</a>`;
  const i=$('#lnkIn');if(i)i.onclick=showLogin;
  const o=$('#lnkOut');if(o)o.onclick=()=>{API.logout();refreshMenu()};
  const st=$('#lnkStats');if(st)st.onclick=showStats;
  const sv=await API.loadSave();const b=$('#btnContinue');
  if(sv&&sv.hero&&sv.hp>0){b.style.display='';b.textContent=`▶️ Tiếp tục: ${HEROES[sv.hero].n} · Màn ${sv.act}-${sv.floor}`;b.onclick=()=>{SFX.unlock();resumeRun(sv)}}else b.style.display='none';
}
function resumeRun(sv){run=sv;uidN=Math.max(0,...run.deck.map(c=>c.uid||0))+1;showMap()}
function closeModal(){$('#modal').classList.remove('on')}
function showLogin(){
  const m=$('#modal');
  m.innerHTML=`<h3>👤 Tài khoản</h3><p style="max-width:320px;text-align:center;opacity:.85;margin:0">Đăng nhập để lưu game lên máy chủ, chơi tiếp trên máy khác và lên bảng xếp hạng.</p>
  <form class="form" id="fLogin"><input id="fU" placeholder="Tên đăng nhập" autocomplete="username" maxlength="20"><input id="fP" type="password" placeholder="Mật khẩu (từ 6 ký tự)" autocomplete="current-password" maxlength="100"><div class="err" id="fErr"></div>
  <div class="row"><button class="btn" type="submit" data-act="login">Đăng nhập</button><button class="btn ghost" type="button" data-act="reg">Đăng ký</button></div></form><button class="btn ghost" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=closeModal;
  const go=async act=>{const u=$('#fU').value.trim(),p=$('#fP').value;$('#fErr').textContent='Đang xử lý...';
    try{const local=await API.loadSave();act==='reg'?await API.register(u,p):await API.login(u,p);
      const remote=await API.loadSave();if(local&&!remote)await API.save(local);
      closeModal();toast(`Xin chào, <b>${API.user.username}</b>!`);refreshMenu()}
    catch(e){$('#fErr').textContent=e.message==='Failed to fetch'?'Không kết nối được máy chủ':e.message}};
  $('#fLogin').onsubmit=e=>{e.preventDefault();go('login')};
  m.querySelector('[data-act="reg"]').onclick=()=>go('reg');
}
async function showLeaderboard(hero){
  const m=$('#modal');m.classList.add('on');
  m.innerHTML=`<h3>🏆 Bảng xếp hạng</h3><div class="tabs">${[['','Tất cả'],['kiem','🤺 Kiếm Khách'],['bang','🧙‍♀️ Băng Pháp Sư'],['thach','🧘‍♂️ Võ Tăng']].map(([k,n])=>`<button data-h="${k}" class="${(hero||'')===k?'on':''}">${n}</button>`).join('')}</div><div id="lbBody">Đang tải...</div><button class="btn ghost" data-close>Đóng</button>`;
  m.querySelector('[data-close]').onclick=closeModal;
  m.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>showLeaderboard(b.dataset.h));
  try{const {leaderboard:L}=await API.leaderboard(hero);
    $('#lbBody').innerHTML=L.length?`<table class="lb"><tr><th>#</th><th>Người chơi</th><th></th><th>Tiến độ</th><th>Điểm</th></tr>${L.map((r,i)=>`<tr class="${API.user&&r.username===API.user.username?'me':''}"><td>${i<3?['🥇','🥈','🥉'][i]:i+1}</td><td>${r.username}</td><td>${HERO_SHORT[r.hero]||''}</td><td>${r.win?'👑 Thắng':'Màn '+r.act+'-'+r.floor}</td><td><b>${r.score}</b></td></tr>`).join('')}</table>`:'<p>Chưa có ai trên bảng. Hãy là người đầu tiên!</p>'}
  catch(e){$('#lbBody').innerHTML='<p>Không kết nối được máy chủ.</p>'}
}
async function showStats(){
  const m=$('#modal');m.classList.add('on');m.innerHTML='<h3>📊 Thống kê</h3><div id="stBody">Đang tải...</div><button class="btn ghost" data-close>Đóng</button>';
  m.querySelector('[data-close]').onclick=closeModal;
  try{const s=await API.stats();$('#stBody').innerHTML=`<table class="lb"><tr><td>Số lượt chơi</td><td><b>${s.runs}</b></td></tr><tr><td>Số lần thắng</td><td><b>${s.wins}</b></td></tr><tr><td>Điểm cao nhất</td><td><b>${s.best}</b></td></tr><tr><td>Kẻ địch đã hạ</td><td><b>${s.kills}</b></td></tr>${s.byHero.map(h=>`<tr><td>${HERO_SHORT[h.hero]} ${HEROES[h.hero].title}</td><td>${h.runs} lượt · ${h.wins} thắng · cao nhất ${h.best}</td></tr>`).join('')}</table>`}
  catch(e){$('#stBody').innerHTML='<p>Không tải được thống kê.</p>'}
}
$('#btnRank').onclick=()=>{SFX.unlock();showLeaderboard('')};
refreshMenu();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__game={get run(){return run},get B(){return B},CARDS,ENEMIES,FXR,playCard,endTurn,startRun,enterNode,availNodes,startBattle,showMap};
