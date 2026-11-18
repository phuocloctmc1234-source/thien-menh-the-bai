'use strict';
/* =========================================================
   TRẠNG THÁI LƯỢT CHƠI
========================================================= */
let run=null,B=null,uidN=1;
const mk=(id,up=false)=>({id,up,uid:uidN++});
const V=(def,k,up)=>{const v=def[k];return Array.isArray(v)?v[up?1:0]:v};
const costOf=c=>V(CARDS[c.id],'c',c.up)||0;
const hasRelic=r=>run&&run.relics.includes(r);

/* ---------- Chỉ số & trang bị ----------
   Sát thương thẻ = Tấn công × dm%, Giáp thẻ = Phòng thủ × b%. Trang bị cộng thẳng vào Tấn công/Phòng thủ/Máu tối đa. */
const sc=(stat,pct)=>Math.round(stat*pct/100);
/* Chống khóa choáng vĩnh viễn (Đóng băng). */
const FREEZE_IMM=1;     // sau khi bị đóng băng, kẻ địch miễn nhiễm đóng băng 1 lượt hành động => luôn hành động ít nhất 1 trong 2 lượt
const SLOT_KEYS=Object.keys(SLOTS);
function ensureGear(r){if(!r.equip)r.equip={};if(!r.bag)r.bag=[];if(!r.upg)r.upg={};if(!r.scrolls)r.scrolls={};
  // bản lưu cũ có 3 ô: ô "phụ kiện" (acc) nay là ô Nhẫn (cùng mã & chỉ số vật phẩm nên Máu tối đa giữ nguyên)
  if(r.equip.acc!==undefined){const a=r.equip.acc;delete r.equip.acc;if(a){if(!r.equip.ring)r.equip.ring=a;else r.bag.push(a)}}
  for(const s of SLOT_KEYS)if(r.equip[s]===undefined)r.equip[s]=null}
function gearBonus(r=run){const t={atk:0,def:0,hp:0};if(!r)return t;ensureGear(r);
  for(const s of SLOT_KEYS){const it=EQUIP[r.equip[s]];if(it)for(const k in t)t[k]+=it[k]||0}
  const sb=setBonus(r);for(const k in t)t[k]+=sb[k]; // thưởng bộ trang bị (cộng thẳng vào chỉ số)
  const ub=upgBonusAll(r);for(const k in t)t[k]+=ub[k]; // thưởng cường hóa theo ô (upgrade.js)
  return t}
/* Bộ trang bị: số món đang mặc theo bộ, và tổng thưởng của các mốc 2/4/6 đã đạt (xem sets.js) */
function setCounts(r){const c={};for(const s of SLOT_KEYS){const it=EQUIP[r.equip&&r.equip[s]];if(it&&it.set)c[it.set]=(c[it.set]||0)+1}return c}
function setBonus(r=run){const t={atk:0,def:0,hp:0,block:0,e1:0,d1:0,st:{},es:{}};if(!r||!r.equip)return t;
  const c=setCounts(r);
  for(const id in c)for(const n of [2,4,6])if(c[id]>=n){const b=SETS[id].b[n];
    for(const k of ['atk','def','hp','block','e1','d1'])t[k]+=b[k]||0;
    for(const k in b.st||{})t.st[k]=(t.st[k]||0)+b.st[k];
    for(const k in b.es||{})t.es[k]=Math.max(t.es[k]||0,b.es[k])}
  return t}
/* Bảng thưởng bộ: chỉ các bộ đang mặc (all=false) hoặc toàn bộ các bộ của lớp nhân vật (all=true) */
function setPanelHTML(R,all){
  const c=setCounts(R),ids=Object.keys(SETS).filter(id=>all?SETS[id].h===R.hero:c[id]).sort((x,y)=>(c[y]||0)-(c[x]||0)); // bộ đang mặc nhiều nhất lên đầu
  if(!ids.length)return '<p class="muted">Chưa mặc món nào thuộc bộ trang bị.</p>';
  const worn=Object.values(R.equip).filter(Boolean),have=new Set([...R.bag,...worn]);
  return ids.map(id=>{const S=SETS[id],n=c[id]||0;
    const pcs=S.pieces.map(pid=>`<span class="spc ${worn.includes(pid)?'on':have.has(pid)?'bag':''}" title="${EQUIP[pid].n}">${EQUIP[pid].ic}</span>`).join('');
    return `<div class="setbox r-${S.r}${n>=6?' full':''}"><div class="seth"><b>${S.n}</b><em>${RAR_N[S.r]}</em><span>${n}/6</span></div><div class="spcs">${pcs}</div><ul>${[2,4,6].map(k=>`<li class="${n>=k?'on':''}"><b>(${k})</b> ${setBonusText(S.b[k])}</li>`).join('')}</ul></div>`}).join('')}
/* Mỗi cấp tăng chỉ số cơ bản tùy theo lớp nhân vật (cộng dồn, làm tròn xuống) */
const LEVEL_GROWTH={kiem:{hp:5,atk:.8,def:.3},bang:{hp:3.5,atk:1,def:.2},thach:{hp:6,atk:.5,def:.6}};
function baseStats(hero,xp){const h=HEROES[hero],g=LEVEL_GROWTH[hero]||{hp:4,atk:.6,def:.4},n=Math.max(0,lvlInfo(xp||0).l-1);
  return{hp:h.hp+Math.floor(g.hp*n),atk:h.atk+Math.floor(g.atk*n),def:h.def+Math.floor(g.def*n)}}
function heroStats(r=run){
  if(!r)return{atk:6,def:5,hp:80};
  const h=baseStats(r.hero,r.xp),g=gearBonus(r);return{atk:h.atk+g.atk,def:h.def+g.def,hp:r.maxHp,bonus:g}}
function equipStatsHTML(it){return Object.keys(STAT_N).filter(k=>it[k]).map(k=>`${STAT_N[k].ic} +${it[k]}`).join(' · ')+(it.set?` · <span class="setchip">🔸 ${SETS[it.set].n}</span>`:'')}
/* Đối tượng đang thao tác: lượt chơi (run) hoặc, ở trang chủ, hồ sơ nhân vật (me) */
let me=null;const G=()=>run||me;
/* Dữ liệu bền vững của tài khoản đi theo cả lượt chơi lẫn hồ sơ: xu, ngọc, kinh nghiệm, tiến độ các màn */
const META_KEYS=['coins','gems','xp','prog','tkeys','owned','deckCfg','daily','upg','scrolls']; // tkeys: chìa khóa thẻ 🔑 · owned: thẻ đã sở hữu · deckCfg: bộ bài ban đầu tự xếp
function ensureMeta(r){r.coins=r.coins||0;r.gems=r.gems||0;r.xp=r.xp||0;if(!r.prog)r.prog={};
  const p=r.prog;p.best=p.best||{};p.cleared=p.cleared||{};p.claimed=p.claimed||{};p.pity=p.pity||{};r.tkeys=r.tkeys||0;if(!r.owned)r.owned={};if(r.deckCfg===undefined)r.deckCfg=null;return r}
function lvlInfo(xp){let l=1,need=50;while(xp>=need){xp-=need;l++;need=50+25*(l-1)}return{l,cur:xp,need}}
function addXp(n){const R=ensureMeta(G());const a=lvlInfo(R.xp).l;const hp0=baseStats(R.hero,R.xp).hp;R.xp+=n;const b=lvlInfo(R.xp).l;
  if(b>a){const dh=baseStats(R.hero,R.xp).hp-hp0;if(R.maxHp!==undefined){R.maxHp+=dh;R.hp+=dh}
    R.gems+=2*(b-a);SFX.buff();toast(`⭐ Lên cấp <b>${b}</b>! +${2*(b-a)} 💠`,2600)}}
/* ---------- Bộ bài ban đầu & thẻ sở hữu ----------
   Thẻ khởi đầu (r:'s') luôn dùng được; các thẻ khác phải quay trúng ở tab Thẻ bài (R.owned). */
const isOwned=(R,id)=>!!CARDS[id]&&(CARDS[id].r==='s'||!!(R.owned&&R.owned[id]));
function deckProblem(ids,R,partial){ // trả về lời giải thích nếu bộ bài không hợp lệ, '' nếu hợp lệ (partial: bỏ qua kiểm tra đủ số thẻ)
  if(!Array.isArray(ids)||ids.length>DECK_SIZE||(!partial&&ids.length!==DECK_SIZE))return `Cần đúng ${DECK_SIZE} thẻ (đang có ${Array.isArray(ids)?ids.length:0}).`;
  const cnt={},rar={};
  for(const id of ids){const d=CARDS[id];
    if(!d||(d.h!==R.hero&&d.h!=='*'))return 'Có thẻ không dùng được cho nhân vật này.';
    if(!isOwned(R,id))return `Chưa sở hữu thẻ ${d.n}.`;
    cnt[id]=(cnt[id]||0)+1;rar[d.r]=(rar[d.r]||0)+1;
    if(cnt[id]>DECK_COPIES[d.r])return `${d.n}: tối đa ${DECK_COPIES[d.r]} bản.`}
  if((rar.r||0)+(rar.l||0)>DECK_CAP.rl)return `Tối đa ${DECK_CAP.rl} thẻ Hiếm + Huyền thoại.`;
  if((rar.l||0)>DECK_CAP.l)return `Tối đa ${DECK_CAP.l} thẻ Huyền thoại.`;
  return''}
const startingDeckIds=R=>{const d=R.deckCfg;return d&&!deckProblem(d,R)?[...d]:[...HEROES[R.hero].deck]};
function gainCard(c){run.deck.push(c)} // thẻ nhặt trong trận chỉ dùng trong lượt chơi này, KHÔNG vào bộ sưu tập (chỉ Quay thẻ mới sở hữu)
function recordProgress(act,n){if(!run)return;ensureMeta(run);if(n>(run.prog.best[act]||0))run.prog.best[act]=Math.min(n,ROWS)}
/* Mặc / tháo trang bị (chỉ ngoài trận). Máu tối đa đổi theo trang bị. */
function equipItem(id){
  const R=G(),it=EQUIP[id];ensureGear(R);const i=R.bag.indexOf(id);if(!it||i<0)return false;
  const h0=gearBonus(R).hp,old=R.equip[it.slot];R.bag.splice(i,1);if(old)R.bag.push(old);
  R.equip[it.slot]=id;shiftMaxHp(R,gearBonus(R).hp-h0);return true}
function shiftMaxHp(R,d){if(!d)return;R.maxHp+=d;R.hp=d>0?R.hp+d:Math.max(1,Math.min(R.hp,R.maxHp))} // đổi Máu tối đa (món + thưởng bộ)
function unequipSlot(slot,silent){
  const R=G(),id=R.equip[slot],it=EQUIP[id];if(!it)return;
  const h0=gearBonus(R).hp;R.equip[slot]=null;R.bag.push(id);shiftMaxHp(R,gearBonus(R).hp-h0);
  if(!silent)SFX.card()}
/* Nhận trang bị: ô trống thì mặc luôn, ngược lại cất vào túi. Trả về true nếu đã mặc. */
function gainEquip(id,quiet){const R=G();ensureGear(R);R.bag.push(id);const it=EQUIP[id];
  if(!R.equip[it.slot]){equipItem(id);SFX.buff();if(!quiet)toast(`${it.ic} Đã mặc <b>${it.n}</b><br>${equipStatsHTML(it)}`,2200);renderTop();return true}
  SFX.coin();if(!quiet)toast(`🎒 Cất <b>${it.n}</b> vào túi. Mở 🎒 để thay trang bị.`,2400);renderTop();return false}
/* Chọn ô trước (ô đang trống có xác suất gấp đôi), rồi độ hiếm, rồi món (ưu tiên món chưa sở hữu) */
function pickGear(R,slot,r){ // một món ngẫu nhiên của ô + độ hiếm, ưu tiên món chưa sở hữu; null nếu không có
  const owned=[...R.bag,...Object.values(R.equip)];
  const all=Object.keys(EQUIP).filter(k=>EQUIP[k].slot===slot&&EQUIP[k].r===r&&(!EQUIP[k].h||EQUIP[k].h===R.hero));
  const fresh=all.filter(k=>!owned.includes(k));return all.length?pick(fresh.length?fresh:all):null}
function rollEquip(kind,minR,force){ // force: ép độ hiếm ('c'|'u'|'r')
  const R=G();let r=force||rollRarity(kind);if(minR==='u'&&r==='c')r='u';
  ensureGear(R);
  const w=SLOT_KEYS.map(k=>R.equip[k]?1:2);let x=Math.random()*w.reduce((p,q)=>p+q,0),slot=SLOT_KEYS[SLOT_KEYS.length-1];
  for(let i=0;i<w.length;i++){x-=w[i];if(x<=0){slot=SLOT_KEYS[i];break}}
  return pickGear(R,slot,r)}
function gearDiff(it){const cur=EQUIP[G().equip[it.slot]];if(!cur)return'<span class="up">ô đang trống</span>';
  const t=Object.keys(STAT_N).filter(k=>(it[k]||0)!==(cur[k]||0)).map(k=>{const v=(it[k]||0)-(cur[k]||0);return`<span class="${v>0?'up':'dn'}">${STAT_N[k].ic}${v>0?'+':''}${v}</span>`}).join(' ');
  return 'so với đang mặc: '+(t||'bằng nhau')}

/* ---------- Vẽ thẻ ---------- */
function descOf(card,battle,target){
  const def=CARDS[card.id],u=card.up;const S=battle&&B?B.p:heroStats(G());
  return def.d.replace(/\{(\w)\}/g,(m,k)=>{
    if(k==='P')return battle&&B?` (<b>${B.p.block}</b>)`:'';
    const key={D:'dm',B:'b',X:'x',Y:'y'}[k];const base=V(def,key,u);
    let val=base,cls=u&&Array.isArray(def[key])&&def[key][0]!==def[key][1]?'up':'';
    if(k==='D'){val=sc(S.atk,base);if(battle&&B){const f=calcDmg(B.p,target||null,val);if(f>val)cls='up';else if(f<val)cls='bad';val=f}}
    else if(k==='B')val=sc(S.def,base);
    return `<b class="${cls}">${val}</b>`;
  });
}
const nmSize=L=>L>18?' s3':L>15?' s2':L>11?' s1':''; // tên thẻ dài thì thu nhỏ chữ cho vừa tấm bảng tên
function cardHTML(card,battle,target){
  const def=CARDS[card.id];const cst=V(def,'c',card.up);const base=V(def,'c',false);
  return `<div class="card t-${def.t} r-${def.r}"><div class="cost ${cst<base?'cheaper':''}">${cst}</div><div class="gem"></div><i class="rar"></i><i class="tico tico-${poseOf(def)}"></i><div class="art">${CARD_ART.has(card.id)?`<img class="cimg" src="img/card/${card.id}.webp" alt="" draggable="false">`:def.ic}</div><div class="nm ${card.up?'up':''}${nmSize(def.n.length+(card.up?1:0))}">${def.n}${card.up?'+':''}</div><div class="ds">${descOf(card,battle,target)}</div></div>`;
}

/* ---------- Thanh trên cùng ---------- */
function renderTop(){
  document.querySelectorAll('[data-top]').forEach(el=>{
    if(!run){el.innerHTML='';return}
    const hp=B?B.p.hp:run.hp;
    el.innerHTML=`<span class="pill">${HEROES[run.hero].ic} ${HEROES[run.hero].n}</span><span class="pill">❤️ ${hp}/${run.maxHp}</span><span class="pill">💰 ${run.gold}</span><span class="pill">🗺️ ${run.act}-${run.floor}</span><span class="relics">${run.relics.map(r=>`<span data-relic="${r}">${RELICS[r].ic}</span>`).join('')}</span><span class="sp"></span><button class="ibtn" data-key>🗝️ ${run.keys||0}</button>${run.tkeys?`<span class="pill">🔑 ${run.tkeys}</span>`:""}<button class="ibtn" data-bag>🎒</button><button class="ibtn" data-deck>🎴 ${run.deck.length}</button><button class="ibtn" data-home>🏠</button><button class="ibtn" data-snd>${SFX.on?'🔊':'🔇'}</button>`;
  });
}
document.addEventListener('click',e=>{
  const r=e.target.closest('[data-relic]');if(r){const R=RELICS[r.dataset.relic];toast(`${R.ic} <b>${R.n}</b><br>${R.d}`,2600);return}
  if(e.target.closest('[data-key]')){showKeyChest();return}
  if(e.target.closest('[data-bag]')){showEquip();return}
  if(e.target.closest('[data-deck]')){showPile('Bộ bài của bạn',run.deck);return}
  if(e.target.closest('[data-home]')){if(B&&!B.over){toast('Hãy hoàn thành trận đấu trước. Game được lưu ở bản đồ.');return}goHome();return}
  if(e.target.closest('[data-snd]')){SFX.toggle();renderTop();updateSoundBtn()}
});
/* Sau khi đóng cửa sổ phụ: làm mới thanh trên cùng và (nếu đang ở trang chủ) cả trang chủ */
function afterModal(){renderTop();if(!run&&typeof renderHome==='function')renderHome()}
function showScreen(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));renderTop()}

/* ---------- Kho Báu 🧰: dùng chìa khóa 🗝️ mở rương, rương CHẮC CHẮN ra 1 trang bị ---------- */
function showKeyChest(lines=[]){
  const R=G();if(!R)return;if(B&&!B.over){toast('Không thể mở rương khi đang chiến đấu');return}
  const m=$('#modal');const k=R.keys||0;
  if(!k&&!lines.length){toast('🗝️ Bạn chưa có chìa khóa. Chìa khóa rơi từ ải thường (ít) và trùm (nhiều).',2600);return}
  m.innerHTML=`<h3>🧰 Kho Báu</h3><div class="chest ${lines.length?'':'shut'}" id="kchest">${lines.length?'🎁':'🧰'}</div>
    ${lines.length?`<div class="keyloot">${lines.map(l=>`<div>${l}</div>`).join('')}</div>`:'<p class="muted">Rương khóa chặt. Dùng 1 chìa khóa để mở: chắc chắn nhận 1 trang bị (6 ô: vũ khí, mũ, giáp, găng tay, giày, nhẫn).</p>'}
    <p>Chìa khóa: 🗝️ <b>${k}</b></p>
    <button class="btn" id="kopen" ${k?'':'disabled'}>🗝️ Mở rương (-1)</button><button class="btn ghost" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=()=>{m.classList.remove('on');afterModal()};
  $('#kopen').onclick=()=>{$('#kopen').disabled=true;openKeyChest()};
}
function openKeyChest(){
  const R=G();if(!(R.keys>0))return null;R.keys--;dailyAdd('chest');
  const rect=$('#kchest').getBoundingClientRect();FX.burst(rect.left+rect.width/2,rect.top+rect.height/2,{n:40,c:['#ffd24a','#fff1a0','#ffffff'],sp:380,life:.8,s:8,g:300,vy:-200});
  const g=ri(30,60);if(run)run.gold+=g;else{ensureMeta(R);R.coins+=g} // trong lượt chơi: vàng; ở trang chủ: xu
  const id=rollEquip('elite');const E=EQUIP[id];const worn=gainEquip(id);
  const scLine=grantScrolls(R,1); // mỗi rương Kho Báu kèm 1 cuộn cường hóa
  renderTop();persistHome();
  showKeyChest([`${E.ic} <b>${E.n}</b> <span class="eqr r-${E.r}">${SLOTS[E.slot].n}</span><br>${equipStatsHTML(E)} · ${worn?'đã mặc':'cất vào túi 🎒'}`,run?`💰 +${g} vàng`:`🪙 +${g} xu`,scLine]);
  return id;
}

/* ---------- Màn trang bị 🎒 ---------- */
function showEquip(){
  const R=G();if(!R)return;ensureGear(R);const m=$('#modal');const inBattle=!!(B&&!B.over);
  const st=heroStats(R),h=HEROES[R.hero],g=st.bonus;
  const bn=k=>g[k]?` <small class="plus">(+${g[k]})</small>`:'';
  const slotHTML=SLOT_KEYS.map(s=>{const it=EQUIP[R.equip[s]];
    return `<button class="eqslot ${it?'r-'+it.r:'empty'}" data-un="${s}" ${it&&!inBattle?'':'disabled'}><span class="eqs">${SLOTS[s].ic} ${SLOTS[s].n}</span>${it?`<b>${it.ic} ${it.n}</b><small>${equipStatsHTML(it)}</small>`:'<i>Trống</i>'}</button>`}).join('');
  const bagHTML=R.bag.map((id,i)=>{const it=EQUIP[id];const ok=!it.h||it.h===R.hero;
    return `<button class="eqitem r-${it.r}" data-eq="${i}" ${inBattle||!ok?'disabled':''}><b>${it.ic} ${it.n}</b><span class="eqr r-${it.r}">${SLOTS[it.slot].n}</span><small>${equipStatsHTML(it)}${ok?'':' · (anh hùng khác)'}</small><small class="cmp">${gearDiff(it)}</small></button>`}).join('');
  m.innerHTML=`<h3>🎒 Trang bị · ${h.ic} ${h.n}</h3>
    <div class="eqstats"><span>❤️ <b>${R.maxHp}</b>${bn('hp')}</span><span>⚔️ Tấn công <b>${st.atk}</b>${bn('atk')}</span><span>🛡️ Phòng thủ <b>${st.def}</b>${bn('def')}</span></div>
    <div class="eqslots">${slotHTML}</div>
    <h4>Bộ trang bị</h4><div class="setlist">${setPanelHTML(R,false)}</div>
    <h4>Túi đồ (${R.bag.length})</h4><div class="eqbag">${bagHTML||'<p class="muted">Chưa có trang bị nào trong túi.</p>'}</div>
    ${inBattle?'<p class="muted">Không thể đổi trang bị khi đang chiến đấu.</p>':'<p class="muted">Chạm trang bị trong túi để mặc, chạm ô trang bị để tháo.</p>'}
    <button class="btn ghost" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=()=>{m.classList.remove('on');afterModal()};
  m.querySelectorAll('[data-un]').forEach(b=>b.onclick=()=>{unequipSlot(b.dataset.un);persistHome();showEquip();renderTop()});
  m.querySelectorAll('[data-eq]').forEach(b=>b.onclick=()=>{equipItem(R.bag[+b.dataset.eq]);dailyAdd('equip');SFX.buff();persistHome();showEquip();renderTop()});
}

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
  recordProgress(run.act,run.map.done.length); // tiến độ ải để mở rương vượt ải lần đầu
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
  async blk(n,fx='shield'){if(n>0)n+=B.p.st.fort||0;bubble(B.p);await FXR[fx](H.pt(B.p));B.p.block+=n;popNum(B.p,'+'+n+' 🛡','blk');renderUnit(B.p)},
  async st(u,k,n,silent){if(!u||u.dead)return;
    if(k==='freeze'&&u!==B.p){ // chống khóa choáng vĩnh viễn: đóng băng tối đa 1 lượt, rồi miễn nhiễm vài lượt hành động
      if(u.st.freeze>0||u.frzImm>0){popNum(u,'🛡 Kháng băng','info');return}
      n=u.boss||u.elite?1:Math.min(n,1)}
    if(!silent&&STS_FX[k])await FXR[STS_FX[k]](H.pt(B.p),H.pt(u));else if(silent&&(k==='weak'||k==='vuln'))FX.burst(H.pt(u).x,H.pt(u).y,{n:6,c:'#b45cff',sp:80,life:.5,s:8});
    u.st[k]=(u.st[k]||0)+n;popNum(u,`${STS[k].ic} ${STS[k].n}${n>1||k!=='keep'&&k!=='energy'?' '+n:''}`,'info');renderUnit(u);if(u===B.p)renderHand()},
  async draw(n){await drawCards(n)},
  // ---- hàm gộp cho bộ thẻ mở rộng (cards2.js): [[trạng thái, số],...] ----
  async atkSt(t,d,fx,sts,hits=1){const r=await H.atk(t,d,fx,hits);for(const [k,n] of sts)await H.st(t,k,n,true);return r},
  async atkAllSt(d,fx,sts){await H.atkAll(d,fx);for(const [k,n] of sts)for(const e of H.alive())await H.st(e,k,n,true)},
  async stAll(k,n){for(const e of H.alive()){FXR.debuff(H.pt(B.p),H.pt(e));await H.st(e,k,n,true)}await wait(160)},
  async blkSt(b,sts,fx='shield'){await H.blk(b,fx);for(const [k,n] of sts)await H.st(B.p,k,n)},
  gainE(n){B.energy+=n;const e=$('#energy');e.classList.remove('pop');void e.offsetWidth;e.classList.add('pop');updateHUD()},
  async heal(n,silent){if(!silent)await FXR.heal(H.pt(B.p));else FXR.heal(H.pt(B.p));const a=Math.min(n,run.maxHp-B.p.hp);B.p.hp+=a;popNum(B.p,'+'+a,'heal');renderUnit(B.p);renderTop()},
  loseHp(n){B.p.hp=Math.max(0,B.p.hp-n);popNum(B.p,'-'+n,'dmg');renderUnit(B.p);renderTop()},
};
function calcDmg(src,tgt,base){let d=base+(src.st.str||0)-(src.st.sap||0);if(src.st.weak)d*=.75;if(tgt&&tgt.st.vuln)d*=1.5;if(tgt&&tgt.st.mark)d+=tgt.st.mark;return Math.max(0,Math.floor(d))}
async function hit(src,tgt,base,fx,i,raw){const dmg=raw?base:calcDmg(src,tgt,base);await FXR[fx](H.pt(src),H.pt(tgt),i);return applyDmg(tgt,dmg,src)}
function applyDmg(t,dmg,src,noThorns){
  if(t.dead)return 0;
  if(src&&src!==t&&dmg>0&&t.st.ward>0){t.st.ward--;popNum(t,'🔮 Miễn sát thương!','blk');bubble(t);SFX.block();renderUnit(t);return 0}
  const blocked=Math.min(t.block,dmg);t.block-=blocked;const loss=dmg-blocked;t.hp=Math.max(0,t.hp-loss);
  if(loss>0){popNum(t,'-'+loss,'dmg'+(loss>=20?' crit':''));flashHit(t);SFX.hit();if(loss>=20)shake(true)}
  else{popNum(t,blocked?'Chặn!':'0','blk');SFX.block();bubble(t)}
  if(loss>0&&src===B.p&&t!==B.p&&B.p.st.leech>0){const a=Math.min(B.p.st.leech,run.maxHp-B.p.hp);if(a>0){B.p.hp+=a;popNum(B.p,'+'+a,'heal');renderUnit(B.p);renderTop()}}
  if(src&&src!==t&&!noThorns&&t.st.thorns>0&&!src.dead){const p=H.pt(src);FX.burst(p.x,p.y,{n:10,c:['#5fe06a','#c8ff7a'],sp:260,life:.3,k:'spark',s:2,l:12});applyDmg(src,t.st.thorns,null,true)}
  renderUnit(t);if(t===B.p)renderTop();
  if(t.hp<=0&&t!==B.p)die(t);
  return loss;
}
function die(e){e.dead=true;e.el.classList.add('dead');const p=H.pt(e);FX.burst(p.x,p.y,{n:30,c:['#fff','#d38bff','#ffcf6a'],sp:300,life:.7,s:9});FX.ring(p.x,p.y,'#fff',10,90,.5,5);run.kills++;dailyAdd('kill');setTimeout(()=>e.el&&e.el.classList.add('gone'),650)}
function flashHit(u){u.el.classList.remove('hit');void u.el.offsetWidth;u.el.classList.add('hit')}
function lunge(u){u.el.classList.add('lunge');setTimeout(()=>u.el.classList.remove('lunge'),170)}
function bubble(u){const b=document.createElement('div');b.className='bubble';u.el.querySelector('.body').appendChild(b);setTimeout(()=>b.remove(),650)}
function aura(u,c){const a=document.createElement('div');a.className='aura';a.style.setProperty('--ac',c);u.el.querySelector('.body').appendChild(a);setTimeout(()=>a.remove(),950)}
function popNum(u,txt,cls){const p=H.pt(u);const d=document.createElement('div');d.className='num '+cls;d.textContent=txt;d.style.left=(p.x+rnd(-18,18))+'px';d.style.top=(p.y-20+rnd(-10,10))+'px';$('#floaters').appendChild(d);d.addEventListener('animationend',()=>d.remove())}

/* Hình nhân vật: bảng sprite (art) nếu có, ngược lại emoji. pose: idle | def | atk | fx */
const heroSprite=(k,pose='idle')=>{const a=HEROES[k].art;return a?`<i class="himg" data-pose="${pose}" style="--ar:${a.ar};background-image:url(${a.sheet})"></i>`:HEROES[k].ic};
const heroFace=k=>{const a=HEROES[k].art;return a?`<i class="hface" style="background-image:url(${a.face})"></i>`:HEROES[k].ic};
/* Đổi tư thế trong trận, tự về đứng yên sau ms (lần đổi mới hủy hẹn giờ cũ) */
function setPose(u,pose,ms){const s=u&&u.el&&u.el.querySelector('.himg');if(!s)return;s.dataset.pose=pose;clearTimeout(u.poseT);if(ms)u.poseT=setTimeout(()=>{s.dataset.pose='idle'},ms)}
/* Thẻ gây sát thương → tấn công; thẻ chỉ có Giáp → phòng thủ; còn lại (buff, bốc bài, năng lực...) → hiệu ứng */
const poseOf=def=>def.t==='atk'||def.dm!=null?'atk':def.t!=='pow'&&def.b!=null?'def':'fx';
function unitEl(u,hero){
  const d=document.createElement('div');d.className='unit'+(hero?' hero':'')+(u.boss||u.elite?' big':'');
  d.innerHTML=`<div class="intent"></div><div class="lw"><div class="body"><span class="sprite">${hero&&run&&HEROES[run.hero].art?heroSprite(run.hero):u.art?`<img class="mimg" src="${u.art}" alt="" draggable="false">`:u.ic}</span></div></div><div class="shadow"></div><div class="bars"><div class="hpbar"><div class="lag"></div><div class="fill"></div><span></span></div><div class="blk"></div></div><div class="sts"></div><div class="ustats"></div>`;
  if(hero)d.querySelector('.intent').style.visibility='hidden';
  u.el=d;return d;
}
function renderUnit(u){
  if(!u.el)return;const el=u.el;const f=Math.max(0,u.hp/u.maxHp);
  el.querySelector('.fill').style.transform=`scaleX(${f})`;el.querySelector('.lag').style.transform=`scaleX(${f})`;
  el.querySelector('.hpbar span').textContent=`${u.hp}/${u.maxHp}`;
  el.classList.toggle('hasblk',u.block>0);el.querySelector('.blk').textContent=u.block;
  el.querySelector('.ustats').innerHTML=`<span class="s-atk">⚔️${u.atk}</span><span class="s-def">🛡️${u.def}</span>`;
  el.querySelector('.sts').innerHTML=Object.entries(u.st).filter(([k,v])=>v>0).map(([k,v])=>`<span title="${STS[k].n}">${STS[k].ic}${k==='keep'?'':v}</span>`).join('');
  if(u!==B.p){const m=u.intent;let s='';if(m&&!u.dead&&u.st.freeze>0)s='<span class="i-deb">🧊</span>';else if(m&&!u.dead){
      if(m.d!=null){const d=calcDmg(u,B.p,enemyDmg(u,m));s+=`<span class="i-atk">⚔️${d}${m.h>1?'×'+m.h:''}</span> `}
      if(m.b)s+=`<span class="i-blk">🛡️</span>`;if(m.s)s+=`<span class="i-buf">💪</span>`;
      if(m.weak||m.vuln||m.poison||m.burn)s+=`<span class="i-deb">🌀</span>`;if(m.heal)s+=`<span class="i-heal">💚</span>`}
    el.querySelector('.intent').innerHTML=s}
}
const enemyDmg=(e,m)=>sc(e.atk,m.d),enemyBlk=(e,m)=>sc(e.def,m.b);
function intentText(e){const m=e.intent;if(!m)return'';if(e.st.freeze>0)return'Ý định: bị đóng băng, bỏ qua lượt';const a=[];
  if(m.d!=null)a.push(`tấn công ${calcDmg(e,B.p,enemyDmg(e,m))} sát thương${m.h>1?' × '+m.h+' lần':''}`);
  if(m.b)a.push(`nhận ${enemyBlk(e,m)} Giáp`);if(m.s)a.push(`tăng ${m.s} Sức mạnh`);if(m.heal)a.push(`hồi ${m.heal} Máu`);
  if(m.weak)a.push(`gây ${m.weak} Yếu`);if(m.vuln)a.push(`gây ${m.vuln} Dễ vỡ`);if(m.poison)a.push(`gây ${m.poison} Độc`);if(m.burn)a.push(`gây ${m.burn} Thiêu đốt`);
  return 'Ý định: '+a.join(', ')}
function unitInfo(u){const sts=Object.entries(u.st).filter(([k,v])=>v>0).map(([k,v])=>`${STS[k].ic} <b>${STS[k].n} ${k==='keep'?'':v}</b>: ${STS[k].d.replace('X',v)}`);
  toast(`<b>${u.n}</b> ❤️ ${u.hp}/${u.maxHp} · ⚔️ ${u.atk} · 🛡️ ${u.def}${u.block?' 🛡️ '+u.block:''}${u!==B.p&&u.intent?'<br>'+intentText(u):''}${sts.length?'<br>'+sts.join('<br>'):''}`,3200)}

/* Hệ số độ khó thích ứng (xem GEAR_SCALE trong data.js): chưa có trang bị thì cả ba hệ số = 1 */
function gearScale(){
  const h=baseStats(run.hero,run.xp),S=heroStats();const pA=S.atk/h.atk,pD=S.def/h.def,pH=run.maxHp/h.hp;
  return{hp:1+GEAR_SCALE.hp*Math.max(0,pA-1),def:1+GEAR_SCALE.def*Math.max(0,pA-1),atk:1+GEAR_SCALE.atk*Math.max(0,(pD+pH)/2-1)}}
function startBattle(group,kind){
  showScreen('battle');
  const hero=HEROES[run.hero],gs=gearScale();
  B={kind,hp0:run.hp,turn:0,energy:0,busy:true,over:false,hand:[],disc:[],exh:[],used:new Set(),
    draw:shuffle(run.deck.map(c=>({...c}))),
    p:{n:hero.n,ic:hero.ic,hp:run.hp,maxHp:run.maxHp,atk:heroStats().atk,def:heroStats().def,block:0,st:{}},
    enemies:group.map(id=>{const d=ENEMIES[id];const hp=Math.round(ri(d.hp[0],d.hp[1])*gs.hp);return{...d,id,hp,maxHp:hp,atk:Math.round(d.atk*gs.atk),def:Math.round(d.def*gs.def),block:0,st:{},hist:[],step:0}})};
  const arena=$('#arena');arena.className='act'+run.act;$('#battle').dataset.act=run.act;
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
  // thưởng bộ trang bị: trạng thái đầu trận cho mình, trạng thái xấu cho kẻ địch
  B.set=setBonus(run);for(const k in B.set.st)B.p.st[k]=(B.p.st[k]||0)+B.set.st[k];
  for(const e of B.enemies)for(const k in B.set.es)e.st[k]=Math.max(e.st[k]||0,B.set.es[k]);
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
function decay(u){for(const k of ['weak','vuln','mark','sap'])if(u.st[k]>0)u.st[k]--;renderUnit(u)}
async function startTurn(){
  if(B.over)return;B.turn++;const p=B.p;B.used=new Set(); // sang lượt mới: mở khóa lại các thẻ hiệu ứng
  if(!p.st.keep)p.block=0;
  if(B.turn===1&&B.set&&B.set.block)p.block+=B.set.block; // Giáp từ thưởng bộ (sau khi dọn Giáp đầu lượt)
  B.maxE=3+(p.st.energy||0);B.energy=B.maxE+(B.turn===1?(hasRelic('loi')?1:0)+(B.set?B.set.e1:0):0);
  renderUnit(p);
  await tickStart(p);if(checkEnd())return;
  for(const e of H.alive())chooseIntent(e);B.enemies.forEach(renderUnit);
  if(B.turn>1)banner('Lượt của bạn');
  updateHUD();
  await drawCards(5+(B.turn===1?(hasRelic('dongho')?2:0)+(B.set?B.set.d1:0):0));
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
    if(e.st.freeze>0){e.st.freeze--;e.frzImm=e.boss||e.elite?FREEZE_IMM:1;if(e.boss&&e.step>0)e.step--; // bị choáng không làm mất chiêu của trùm
      FXR.iceArmor(H.pt(e));popNum(e,'🧊 Bị đóng băng!','info');renderUnit(e);await wait(550);decay(e);continue}
    if(e.frzImm>0)e.frzImm--;
    await doMove(e);if(checkEnd())return;
    if(e.st.bleed>0&&!e.dead&&e.intent&&e.intent.d!=null){const n=e.st.bleed;FXR.blood(H.pt(e));await wait(200);e.hp=Math.max(0,e.hp-n);popNum(e,'-'+n,'dmg');flashHit(e);e.st.bleed--;renderUnit(e);if(e.hp<=0)die(e);if(checkEnd())return}
    decay(e);await wait(220);
  }
  if(!B.over)startTurn();
}
async function doMove(e){
  const m=e.intent;if(!m)return;const ep=H.pt(e),pp=H.pt(B.p);
  if(m.b){const nb=enemyBlk(e,m);bubble(e);await FXR.shield(ep);e.block+=nb;popNum(e,'+'+nb+' 🛡','blk');renderUnit(e)}
  if(m.s){aura(e,'rgba(255,80,60,.8)');await FXR.buffRed(ep);e.st.str=(e.st.str||0)+m.s;popNum(e,'💪 +'+m.s,'info');renderUnit(e)}
  if(m.heal){await FXR.heal(ep);const a=Math.min(m.heal,e.maxHp-e.hp);e.hp+=a;popNum(e,'+'+a,'heal');renderUnit(e)}
  if(m.d!=null){for(let i=0;i<(m.h||1);i++){if(e.dead||B.p.hp<=0)break;lunge(e);await wait(90);await hit(e,B.p,enemyDmg(e,m),m.fx||'claw',i);await wait(m.h>1?110:60)}}
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
    if(isLocked(c))s.classList.add('locked');
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
/* Thẻ tạo hiệu ứng (CARDS[id].fxc, tự nhận biết ở cards3.js) chỉ dùng được 1 lần mỗi lượt cho mỗi loại thẻ; sang lượt mới được mở khóa */
const isLocked=c=>!!(B&&B.used&&CARDS[c.id].fxc&&B.used.has(c.id));
function nopeAnim(s){if(s){s.classList.remove('nope');void s.offsetWidth;s.classList.add('nope')}}
function canPlay(c,s){if(B.busy||B.over)return false;if(isLocked(c)){toast('🔒 Thẻ hiệu ứng: mỗi lượt chỉ dùng 1 lần, lượt sau dùng lại được',1500);nopeAnim(s);return false}if(costOf(c)>B.energy){toast('⚡ Không đủ năng lượng!',1100);if(s){s.classList.remove('nope');void s.offsetWidth;s.classList.add('nope')}return false}return true}
function onCardDown(ev,c,s){
  if(!B||B.busy||B.over)return;ev.preventDefault();SFX.unlock();
  drag={c,s,x0:ev.clientX,y0:ev.clientY,moved:false,id:ev.pointerId};
  try{s.setPointerCapture(ev.pointerId)}catch(e){}
  s.onpointermove=e=>onCardMove(e);s.onpointerup=e=>onCardUp(e);s.onpointercancel=()=>{drag=null;s.classList.remove('drag');layoutHand()};
}
function onCardMove(ev){
  if(!drag)return;const d=drag;const dx=ev.clientX-d.x0,dy=ev.clientY-d.y0;
  if(!d.moved&&Math.hypot(dx,dy)>12){if(costOf(d.c)>B.energy||isLocked(d.c)){canPlay(d.c,d.s);drag=null;return}d.moved=true;d.s.classList.add('drag');sel=d.c.uid;handEl.querySelectorAll('.slot').forEach(x=>x.classList.toggle('sel',x===d.s));markTargets()}
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
  if(costOf(c)>B.energy||isLocked(c)){canPlay(c,d.s);return}
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
  if(cst>B.energy||isLocked(card))return;if(def.tg==='one'&&(!target||target.dead))return;
  if(def.fxc)B.used.add(card.id); // khóa các bản cùng loại cho tới hết lượt
  B.busy=true;sel=null;
  const slot=handEl.querySelector(`[data-uid="${uid}"]`);const r=slot&&slot.querySelector('.card').getBoundingClientRect();
  B.energy-=cst;B.hand.splice(i,1);
  flyCard(card,r,target);renderHand();updateHUD();SFX.card();
  if(def.t==='pow')aura(B.p,'rgba(200,120,255,.8)');
  setPose(B.p,poseOf(def));
  await wait(230);
  dailyAdd('card');dailyAdd(def.t); // def.t: atk | skill | pow
  const ctx={u:card.up,t:target,D:sc(B.p.atk,V(def,'dm',card.up)),B:sc(B.p.def,V(def,'b',card.up)),X:V(def,'x',card.up),Y:V(def,'y',card.up),card};
  try{await def.play(ctx)}catch(err){console.error(err)}
  setPose(B.p,poseOf(def),380);
  if(def.t!=='pow'){(def.ex?B.exh:B.disc).push(card)}
  B.enemies.forEach(renderUnit);updateHUD();
  if(checkEnd())return;
  if(def.fxc)await replaceLocked();
  B.busy=false;renderHand();updateHUD();
}
/* Các bản cùng loại bị khóa (thẻ hiệu ứng 1/lượt) được đổi bằng thẻ mới rút từ chồng bài; thẻ bị đổi xuống chồng bỏ sau khi đã rút xong */
async function replaceLocked(){
  const out=[];
  for(let pass=0;pass<12;pass++){
    const lk=B.hand.filter(isLocked);
    if(!lk.length||B.draw.length+B.disc.length===0)break;
    B.hand=B.hand.filter(c=>!isLocked(c));out.push(...lk);renderHand();
    await drawCards(lk.length);
  }
  B.disc.push(...out);
  if(out.length){toast(`🔄 Đổi ${out.length} thẻ bị khóa lấy thẻ mới`,1300);renderHand();updateHUD()}
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
// Mỗi thẻ thuộc đúng 1 màn (a:N, chia đều ở cards3.js): phần thưởng/cửa hàng của màn N chỉ ra thẻ của màn N. Thẻ Huyền thoại (g:1) chỉ có từ quay thẻ.
function heroPool(r){return Object.keys(CARDS).filter(k=>CARDS[k].h===run.hero&&CARDS[k].a===run.act&&!CARDS[k].g&&(!r||CARDS[k].r===r)&&CARDS[k].r!=='s')}
function rollRarity(kind){const x=Math.random();if(kind==='boss')return'r';const rare=kind==='elite'?.18:.07,unc=kind==='elite'?.45:.33;return x<rare?'r':x<rare+unc?'u':'c'}
function cardChoices(kind,n=3){const out=[];let guard=0;while(out.length<n&&guard++<50){const id=pick(heroPool(rollRarity(kind)));if(id&&!out.includes(id))out.push(id)}
  if(out.length<n)for(const id of shuffle(heroPool().filter(k=>!out.includes(k)))){if(out.length>=n)break;out.push(id)} // thiếu thì bù bằng thẻ bất kỳ của màn
  return out.map(id=>mk(id))}
function randomRelic(){const pool=RELIC_POOL.filter(r=>!run.relics.includes(r));return pool.length?pick(pool):null}
function gainRelic(r){if(!r)return;run.relics.push(r);if(RELICS[r].get)RELICS[r].get();SFX.coin();renderTop()}
function panel(html){showScreen('panel');const pb=$('#panelBody');pb.innerHTML=html;pb.scrollTop=0;return pb}

function battleWon(){
  const kind=B.kind;
  let heal=0;if(hasRelic('tranghat'))heal+=5;if(hasRelic('ngoc'))heal+=6;
  run.hp=Math.min(run.maxHp,B.p.hp+heal);
  const flawless=B.p.hp>=B.hp0; // không mất Máu trong trận (nhiệm vụ hằng ngày)
  B=null;addXp(kind==='boss'?30:kind==='elite'?12:5);
  dailyAdd('battle');if(kind==='elite')dailyAdd('elite');if(kind==='boss')dailyAdd('boss');if(flawless)dailyAdd('flawless');
  let gold=kind==='boss'?ri(90,110):kind==='elite'?ri(30,45):ri(14,24);if(hasRelic('tui'))gold=Math.round(gold*1.5);
  const items=[{t:'gold',v:gold},{t:'card',v:cardChoices(kind)}];
  if(Math.random()<(KEY_DROP[kind]||0))items.push({t:'key',v:1}); // chìa khóa: trùm rơi nhiều hơn ải thường
  if(Math.random()<(TKEY_DROP[kind]||0))items.push({t:'tkey',v:1}); // chìa khóa thẻ 🔑 (quay thẻ ở trang chủ): trùm chắc chắn rơi
  if(kind==='elite'||kind==='boss'){const r=randomRelic();if(r)items.push({t:'relic',v:r})}
  // cuộn cường hóa: trùm luôn rơi 2 (ô ngẫu nhiên), tinh anh 35%, trận thường 8%
  if(kind==='boss'){items.push({t:'scroll',v:randomScrollSlot(),n:1},{t:'scroll',v:randomScrollSlot(),n:1})}
  else if(Math.random()<(UPG_DROP[kind]||0))items.push({t:'scroll',v:randomScrollSlot(),n:1});
  // trang bị chỉ rơi từ trùm cuối màn (EQUIP_DROP); mọi rương đều chắc chắn ra trang bị
  if(kind==='boss'&&Math.random()<EQUIP_DROP)items.push({t:'equip',v:rollEquip('boss')}); // trùm luôn rơi đồ hiếm
  showReward(items,kind,heal);
}
function showReward(items,kind,heal){
  const pb=panel(`<h2>🏆 Phần thưởng</h2>${heal?`<p>📿 Hồi ${heal} Máu</p>`:''}<div class="rewards" id="rw"></div><button class="btn" id="rwDone">Tiếp tục →</button>`);
  const rw=$('#rw');
  items.forEach((it,i)=>{const b=document.createElement('button');b.className='opt';
    if(it.t==='gold')b.innerHTML=`💰 Nhận <b>${it.v}</b> vàng`;
    if(it.t==='card')b.innerHTML=`🎴 Thêm một thẻ vào bộ bài`;
    if(it.t==='key')b.innerHTML=`🗝️ Nhặt <b>${it.v}</b> chìa khóa<br><small>Dùng để mở 🧰 Kho Báu (bấm 🗝️ trên thanh trên cùng): mỗi rương chắc chắn có trang bị</small>`;
    if(it.t==='tkey')b.innerHTML=`🔑 Nhặt <b>${it.v}</b> chìa khóa thẻ<br><small>Dùng để quay thẻ (cả thẻ Huyền thoại) ở tab Thẻ bài ngoài trang chủ</small>`;
    if(it.t==='equip'){const E=EQUIP[it.v];b.innerHTML=`${E.ic} Trang bị <span class="eqr r-${E.r}">${SLOTS[E.slot].n}</span>: <b>${E.n}</b><br><small>${equipStatsHTML(E)}</small>`}
    if(it.t==='scroll')b.innerHTML=`${scrollIc(it.v)} <b>${scrollName(it.v)}</b> ×${it.n}<br><small>Cường hóa ô ${SLOTS[it.v].n}: mở ⬆️ Cường hóa ở tab Trang bị (trang chủ)</small>`;
    if(it.t==='relic')b.innerHTML=`${RELICS[it.v].ic} Bảo vật: <b>${RELICS[it.v].n}</b><br><small>${RELICS[it.v].d}</small>`;
    b.onclick=async()=>{
      if(it.t==='gold'){run.gold+=it.v;SFX.coin();b.remove();renderTop()}
      if(it.t==='scroll'){gainScroll(it.v,it.n,run);SFX.coin();toast(`📜 Nhận ${scrollName(it.v)}`,1400);b.remove()}
      if(it.t==='relic'){gainRelic(it.v);b.remove()}
      if(it.t==='equip'){gainEquip(it.v);b.remove()}
      if(it.t==='tkey'){run.tkeys=(run.tkeys||0)+it.v;SFX.coin();toast(`🔑 Có ${run.tkeys} chìa khóa thẻ`,1400);b.remove();renderTop()}
      if(it.t==='key'){run.keys=(run.keys||0)+it.v;SFX.coin();toast(`🗝️ Có ${run.keys} chìa khóa`,1400);b.remove();renderTop()}
      if(it.t==='card'){const i2=await pickCard('Chọn 1 thẻ',it.v,{cancel:true});if(i2>=0){gainCard(it.v[i2]);SFX.coin();b.remove();renderTop()}}
    };rw.appendChild(b)});
  $('#rwDone').onclick=()=>afterNode(kind);
}
function afterNode(kind){
  if(kind==='boss'){
    recordProgress(run.act,ROWS);run.prog.cleared[run.act]=true; // đánh bại trùm = vượt màn (mở khóa màn sau)
    if(run.act>=MAX_ACT){gameOver(true);return}
    run.act++;run.map=genMap(run.act);run.pos=null;run.fights=0;run.hp=run.maxHp;
    run.deck=startingDeckIds(run).map(id=>mk(id)); // sang màn mới: bộ bài đặt lại về bộ bài ban đầu (mất cả thẻ đã nâng cấp)
    panel(`<h2>Màn ${run.act}: ${ACTS[run.act].n}</h2><div class="relicbig">${ACT_ICON[run.act]||'🏰'}</div><p>Bạn đã đánh bại trùm! Máu được hồi đầy.</p><p>🎴 Bộ bài được <b>đặt lại</b> về bộ bài ban đầu (${run.deck.length} thẻ), các thẻ nhặt và nâng cấp ở màn trước không mang theo. Thẻ đã nhặt vẫn nằm trong bộ sưu tập, bạn có thể xếp vào bộ bài ban đầu ở tab <b>Thẻ bài</b>.</p><button class="btn" id="go">Lên đường</button>`);
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
    run.gold+=g;if(r)gainRelic(r); // kho báu: vàng + bảo vật, KHÔNG có trang bị
    const key=Math.random()<KEY_DROP.treasure;if(key)run.keys=(run.keys||0)+1; // có tỉ lệ rơi chìa khóa
    const tk=Math.random()<TKEY_DROP.treasure;if(tk)run.tkeys=(run.tkeys||0)+1;
    const rect=$('#chest').getBoundingClientRect();const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
    FX.burst(x,y,{n:40,c:['#ffd24a','#fff1a0','#ffffff'],sp:380,life:.8,s:8,g:300,vy:-200});FX.ring(x,y,'#ffd24a',10,140,.5,6);SFX.coin();
    panel(`<h2>💎 Kho báu</h2>${r?`<div class="relicbig">${RELICS[r].ic}</div><p><b>${RELICS[r].n}</b><br>${RELICS[r].d}</p>`:''}<p>💰 +${g} vàng</p>${key?`<p>🗝️ <b>+1 chìa khóa</b> (có ${run.keys})</p>`:''}${tk?`<p>🔑 <b>+1 chìa khóa thẻ</b> (có ${run.tkeys})</p>`:''}<button class="btn" id="go">Tiếp tục →</button>`);
    if(key||tk){SFX.buff();renderTop()}
    $('#go').onclick=showMap;
  };
}
function showShop(){
  const prices={c:[45,60],u:[70,90],r:[140,170]};
  const seen=new Set(); // pool mỗi màn nhỏ (7-8 thẻ) nên bỏ thẻ trùng trong cửa hàng
  const cards=[...cardChoices('battle',3),...cardChoices('elite',2)].filter(c=>!seen.has(c.id)&&seen.add(c.id)).map(c=>({c,p:ri(...prices[CARDS[c.id].r]),sold:false}));
  const relics=[randomRelic(),randomRelic()].filter((r,i,a)=>r&&a.indexOf(r)===i).map(r=>({r,p:ri(140,175),sold:false}));
  let removeCost=75,removed=false;
  function draw(){
    panel(`<h2>🛒 Cửa hàng của Lão Mèo Đen</h2><p>“Hàng tốt, giá phải chăng, meo~” · Bạn có 💰 <b>${run.gold}</b></p>
      <div class="cardrow">${cards.map((x,i)=>`<div class="pickable ${x.sold?'sold':''}" data-c="${i}">${cardHTML(x.c)}<span class="price">💰 ${x.p}</span></div>`).join('')}</div>
      <div class="opts">${relics.map((x,i)=>`<button class="opt" data-r="${i}" ${x.sold?'disabled':''}>${RELICS[x.r].ic} <b>${RELICS[x.r].n}</b> · 💰 ${x.p}<br><small>${RELICS[x.r].d}</small></button>`).join('')}
      <button class="opt" id="rm" ${removed?'disabled':''}>🗑️ <b>Loại bỏ 1 thẻ</b> khỏi bộ bài · 💰 ${removeCost}</button></div>
      <button class="btn" id="leave">Rời cửa hàng →</button>`);
    document.querySelectorAll('[data-c]').forEach(el=>el.onclick=()=>{const x=cards[+el.dataset.c];if(x.sold)return;if(run.gold<x.p){toast('💰 Không đủ vàng!');return}run.gold-=x.p;x.sold=true;gainCard(x.c);SFX.coin();draw()});
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
    {l:'📖 <b>Học chiêu</b>: chọn 1 trong 3 thẻ',f:async()=>{const ch=cardChoices('elite');const i=await pickCard('Chọn bí kíp',ch,{cancel:true});if(i>=0)gainCard(ch[i])}},
    {l:'🗑️ <b>Quên chiêu cũ</b>: loại bỏ 1 thẻ',f:async()=>{const i=await pickCard('Chọn thẻ để loại bỏ',run.deck,{cancel:true});if(i>=0)run.deck.splice(i,1)}}]},
];
function showEvent(){
  const ev=pick(EVENTS);
  panel(`<h2>${ev.t}</h2><p>${ev.d}</p><div class="opts">${ev.o.map((o,i)=>`<button class="opt" data-o="${i}">${o.l}</button>`).join('')}</div>`);
  document.querySelectorAll('[data-o]').forEach(b=>b.onclick=async()=>{await ev.o[+b.dataset.o].f();renderTop();showMap()});
}
/* HỒ SƠ: nhân vật chỉ chọn 1 lần và chìa khóa 🗝️ được giữ lại khi thất bại/thắng.
   Lưu cùng chỗ với bản lưu lượt chơi (localStorage hoặc máy chủ): khi hết lượt chơi, bản lưu được thay bằng
   bản "hồ sơ" {hero, keys, hp:0, deck:[]} nên nút Tiếp tục không hiện, nhưng nhân vật và chìa khóa vẫn còn. */
function profileRecord(r){ensureMeta(r);return{hero:r.hero,deck:[],hp:0,act:1,floor:0,keys:r.keys||0,equip:r.equip,bag:r.bag,coins:r.coins,gems:r.gems,xp:r.xp,prog:r.prog,tkeys:r.tkeys||0,owned:r.owned||{},deckCfg:r.deckCfg||null,daily:r.daily||null,upg:r.upg||{},scrolls:r.scrolls||{},profile:true}}
function saveProfile(){return API.save(profileRecord(run))}
/* Làm sạch trang bị mang từ hồ sơ sang lượt mới: bỏ mã không còn tồn tại / không hợp anh hùng, món sai ô vào túi */
function cleanGear(equip,bag,hero){
  const ok=id=>EQUIP[id]&&(!EQUIP[id].h||EQUIP[id].h===hero);
  const t={equip:{...(equip||{})},bag:[...(bag||[])]};ensureGear(t);const g={equip:{},bag:[]};
  for(const k of SLOT_KEYS){const id=t.equip[k];g.equip[k]=null;if(id&&ok(id)){if(EQUIP[id].slot===k)g.equip[k]=id;else g.bag.push(id)}}
  for(const id of t.bag)if(ok(id))g.bag.push(id);
  return g}
/* Chỉ số của hồ sơ (nhân vật + trang bị đang mặc) để hiển thị ở menu */
function profileStats(sv){const h=baseStats(sv.hero,sv.xp),g=cleanGear(sv.equip,sv.bag,sv.hero),b=gearBonus({equip:g.equip,bag:g.bag});
  return{atk:h.atk+b.atk,def:h.def+b.def,hp:h.hp+b.hp,items:Object.values(g.equip).filter(Boolean).length+g.bag.length}}
function gameOver(win){
  B=null;ensureMeta(run);
  const earn=Math.round(run.gold*.3)+run.kills*2+(win?100:0);run.coins+=earn; // đổi một phần vàng + chiến tích thành xu 🪙
  if(win)addXp(50);
  saveProfile();
  (run.startAct>1?Promise.resolve(null):API.submitRun({hero:run.hero,win:!!win,act:run.act,floor:run.floor,kills:run.kills,gold:run.gold,deckSize:run.deck.length})).then(r=>{const el=$('#scoreLine');if(!el)return;el.innerHTML=r?`🏅 Điểm: <b>${r.score}</b> · Hạng <b>#${r.rank}</b> toàn máy chủ`:(API.loggedIn?'':'Đăng nhập để lưu điểm lên bảng xếp hạng.')});
  const pb=panel(win?`<h2>👑 CHIẾN THẮNG VẺ VANG!</h2><div class="relicbig">🏆</div><p>${HEROES[run.hero].n} đã đánh bại Thiên Mệnh Chi Chủ và mang lại ánh sáng cho cả bảy vùng đất!</p><p>Kẻ địch đã hạ: <b>${run.kills}</b> · Bộ bài: <b>${run.deck.length}</b> thẻ · Vàng: <b>${run.gold}</b></p><p>🗝️ Chìa khóa giữ lại: <b>${run.keys||0}</b> · 🎒 Trang bị giữ lại: <b>${Object.values(run.equip).filter(Boolean).length+run.bag.length}</b> món</p><p>🪙 Nhận <b>+${earn}</b> xu</p><p id="scoreLine"></p><button class="btn" id="again">Chơi lại</button> <button class="btn ghost" id="toHome">🏠 Trang chủ</button>`
    :`<h2 style="color:#ff6a6a">💀 THẤT BẠI</h2><p>${HEROES[run.hero].n} đã gục ngã ở Màn ${run.act}, tầng ${run.floor}.</p><p>Kẻ địch đã hạ: <b>${run.kills}</b></p><p>🗝️ Không mất chìa khóa: còn <b>${run.keys||0}</b> · 🎒 Không mất trang bị: <b>${Object.values(run.equip).filter(Boolean).length+run.bag.length}</b> món</p><p>🪙 Nhận <b>+${earn}</b> xu</p><p id="scoreLine"></p><button class="btn" id="again">Thử lại</button> <button class="btn ghost" id="toHome">🏠 Trang chủ</button>`);
  if(win){SFX.win();const go=()=>{for(let k=0;k<4;k++)setTimeout(()=>{const x=rnd(innerWidth*.2,innerWidth*.8),y=rnd(innerHeight*.2,innerHeight*.5);FX.burst(x,y,{n:40,c:['#ffd24a','#ff6ad5','#5ff5ff','#6dff9a'],sp:340,life:1,s:6,g:200})},k*300)};go()}
  $('#toHome').onclick=goHome;
  $('#again').onclick=()=>{const old=run;run=null;startRun(old.hero,old,old.startAct||1)}; // cùng nhân vật, giữ chìa khóa + trang bị + xu/ngọc/tiến độ
}

/* =========================================================
   MENU & KHỞI ĐỘNG
========================================================= */
function initMenu(){
  const hs=$('#heroes');
  for(const k in HEROES){const h=HEROES[k];const b=document.createElement('button');b.className='hero-card';b.style.setProperty('--hc',h.col);
    b.innerHTML=`<div class="hic">${heroFace(k)}</div><div><b>${h.n}</b><small>${h.title}</small><p>${h.desc}</p><div class="hstat">❤️ ${h.hp} · ⚔️ ${h.atk} · 🛡️ ${h.def} · ${RELICS[h.relic].ic} ${RELICS[h.relic].n}: ${RELICS[h.relic].d}</div></div>`;
    b.onclick=()=>{if(me&&me.hero)return; // đã có nhân vật: không được chọn lại
      if(!confirm(`Chọn ${h.n} (${h.title})?\nMỗi tài khoản chỉ có MỘT nhân vật: bạn không thể đổi hoặc tạo thêm nhân vật khác sau này.`))return;SFX.unlock();SFX.buff();startRun(k,{},1)};hs.appendChild(b)}
  $('#btnBack').onclick=()=>showScreen('menu');
  $('#btnHelp').onclick=()=>{const m=$('#modal');m.innerHTML=`<h3>📖 Hướng dẫn</h3><div class="help"><ul>
    <li><b>Mục tiêu:</b> vượt qua <b>7 màn</b>, mỗi màn có một trùm cuối. Chọn đường đi trên bản đồ. <b>Sang màn mới, bộ bài bị đặt lại</b> về bộ bài ban đầu.</li>
    <li><b>Thẻ bài 🎴:</b> ở trang chủ, xem bộ sưu tập (chia theo màn), tự xếp bộ bài ban đầu từ thẻ đã sở hữu, và <b>quay thẻ</b> bằng chìa khóa thẻ 🔑 để có cả thẻ Huyền thoại. Chìa khóa thẻ rơi từ trùm, rương vượt ải hoặc mua ở 🏪 Cửa hàng.</li>
    <li><b>Năng lượng ⚡:</b> mỗi lượt có 3 năng lượng. Số ở góc thẻ là chi phí.</li>
    <li><b>Dùng thẻ:</b> kéo thẻ lên kẻ địch, hoặc chạm thẻ rồi chạm kẻ địch. Thẻ không cần mục tiêu: kéo lên hoặc chạm 2 lần.</li>
    <li><b>Chỉ số ⚔️ Tấn công / 🛡️ Phòng thủ:</b> thẻ tấn công gây sát thương bằng chỉ số Tấn công (nhân theo % của thẻ), thẻ phòng thủ nhận Giáp bằng chỉ số Phòng thủ. Ví dụ Tấn công 6 → thẻ Chém gây 6.</li>
    <li><b>Nhân vật:</b> mỗi tài khoản chỉ có <b>một nhân vật</b>, chọn một lần ở lượt chơi đầu tiên và không thể đổi hay tạo thêm.</li>
    <li><b>Trang chủ:</b> chọn màn ở giữa (◀ ▶), xem tiến độ, kỷ lục và 3 rương thưởng. <b>Rương vượt ải lần đầu 🧰</b> mở khóa khi bạn lần đầu tới tầng 3, 6 và 9 (trùm) của mỗi màn, nhận xu 🪙, ngọc 💠, chìa khóa 🗝️ và trang bị. Đánh bại trùm để mở khóa màn kế tiếp. Xu và ngọc dùng ở 🏪 Cửa hàng. Thắng trận để nhận kinh nghiệm, lên cấp nhận thêm ngọc.</li>
    <li><b>Trang bị 🎒:</b> cộng thêm Tấn công, Phòng thủ, Máu tối đa. 6 ô: vũ khí, mũ, giáp, găng tay, giày, nhẫn. Nguồn: 🧰 rương chìa khóa (chắc chắn có 1 món) và 💀 trùm cuối màn (30%). <b>Thất bại không mất trang bị</b>: bộ đồ được mang sang lượt sau. Bấm 🎒 trên thanh trên cùng để mặc/tháo (ngoài trận).</li>
    <li><b>Chìa khóa 🗝️:</b> rơi từ ải thường (ít), 💎 Kho báu (khá cao) và trùm (nhiều). Bấm 🗝️ trên thanh trên cùng để mở 🧰 Kho Báu (ngoài trận): mỗi chìa khóa mở 1 rương, chắc chắn ra 1 trang bị. <b>Khi thất bại không mất chìa khóa</b>: chúng được mang sang lượt chơi sau.</li>
    <li><b>Giáp 🛡️:</b> chặn sát thương, mất đi đầu lượt sau.</li>
    <li><b>Ý định:</b> biểu tượng trên đầu kẻ địch cho biết chúng sắp làm gì (⚔️ tấn công, 🛡️ phòng thủ, 💪 tăng sức, 🌀 gây hiệu ứng xấu).</li>
    <li><b>Hiệu ứng:</b> 💪 Sức mạnh, 🥀 Yếu, 💔 Dễ vỡ, ☠️ Độc, 🔥 Thiêu đốt, 🌵 Gai. Chạm vào nhân vật để xem chi tiết.</li>
    <li><b>Thẻ hiệu ứng (1 lần/lượt):</b> thẻ gây hiệu ứng (Yếu, Dễ vỡ, Độc, Sức mạnh, Gai, Kết giới...) mỗi lượt chỉ dùng <b>1 lần</b> cho mỗi loại thẻ; sau khi dùng, các bản còn lại cùng loại trên tay sẽ được <b>đổi bằng thẻ mới</b> rút từ chồng bài.</li>
    <li><b>Tiêu hao:</b> thẻ bị loại khỏi trận sau khi dùng. <b>Năng lực:</b> hiệu lực đến hết trận.</li>
    <li>Thắng trận để nhận vàng, thẻ mới và bảo vật. Nâng cấp thẻ ở 🔥 Lửa trại.</li></ul></div><button class="btn" data-close>Đã hiểu</button>`;m.classList.add('on');m.querySelector('[data-close]').onclick=()=>m.classList.remove('on')};
}
function updateSoundBtn(){const b=$('#btnSound');if(b)b.textContent=SFX.on?'🔊 Âm thanh: Bật':'🔇 Âm thanh: Tắt'}
/* carry: hồ sơ/lượt trước (keys, equip, bag, xu, ngọc, xp, tiến độ) được mang sang; act: màn bắt đầu (chỉ màn đã mở khóa) */
function startRun(k,carry={},act=1){
  if(typeof carry==='number')carry={keys:carry};carry=carry||{};
  const h=HEROES[k];const gear=cleanGear(carry.equip,carry.bag,k);
  run={hero:k,hp:h.hp,maxHp:h.hp,gold:99,deck:startingDeckIds({hero:k,deckCfg:carry.deckCfg,owned:carry.owned}).map(id=>mk(id)),relics:[h.relic],act,startAct:act,floor:(act-1)*ROWS,map:genMap(act),pos:null,kills:0,fights:0,phoenix:false,equip:gear.equip,bag:gear.bag,keys:carry.keys||0};
  for(const m of META_KEYS)if(carry[m]!==undefined)run[m]=JSON.parse(JSON.stringify(carry[m]));ensureMeta(run);me=null;
  run.maxHp=baseStats(k,run.xp).hp+gearBonus(run).hp;run.hp=run.maxHp; // cấp độ + trang bị mang theo cộng Máu tối đa ngay từ đầu
  showMap();
}
initMenu();
/* Máy tính: phóng trang chủ theo khung chuẩn 1280x720 để lấp đầy cửa sổ (CSS dùng zoom:var(--z)) */
function fitDesktop(){const z=matchMedia('(min-width:900px) and (min-height:521px)').matches?Math.max(.8,Math.min(innerWidth/1280,innerHeight/720,3)):1;
  document.documentElement.style.setProperty('--z',z.toFixed(3))}
addEventListener('resize',fitDesktop);fitDesktop();
/* ---------- Tài khoản, tiếp tục, bảng xếp hạng ---------- */
/* (trang chủ, hồ sơ, cửa hàng: xem js/home.js) */
const HERO_SHORT={kiem:'🤺',bang:'🧙‍♀️',thach:'🧘‍♂️'};
function resumeRun(sv){run=sv;me=null;ensureGear(run);ensureMeta(run);run.keys=run.keys||0;uidN=Math.max(0,...run.deck.map(c=>c.uid||0))+1;showMap()}
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
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__game={get run(){return run},showKeyChest,openKeyChest,get B(){return B},CARDS,ENEMIES,EQUIP,heroStats,equipItem,gainEquip,FXR,playCard,endTurn,startRun,enterNode,availNodes,startBattle,showMap};
