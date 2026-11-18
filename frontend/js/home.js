'use strict';
/* =========================================================
   TRANG CHỦ
   - Hồ sơ nhân vật: mỗi tài khoản chỉ có MỘT nhân vật, chọn một lần ở lượt đầu và không thể đổi/tạo thêm
   - Các màn (đảo): tiến độ, kỷ lục, 3 rương thưởng vượt ải lần đầu
   - Xu 🪙, ngọc 💠, cấp độ, cửa hàng, trang bị, Kho Báu, xếp hạng, cài đặt
   Dữ liệu nằm cùng bản lưu của tài khoản (hồ sơ hoặc lượt đang dở) nên không cần đổi backend.
   `me` (khai báo trong game.js) = hồ sơ đang xem ở trang chủ.
========================================================= */
let homeAct=0,meActive=false; // meActive: bản lưu là một lượt chơi đang dở (có thể Tiếp tục)
const isActive=sv=>!!(sv&&sv.hp>0&&Array.isArray(sv.deck)&&sv.deck.length&&!sv.profile);
const actUnlocked=a=>a<=1||!!(me&&me.prog&&me.prog.cleared[a-1]);
const bestOf=a=>(me&&me.prog&&me.prog.best[a])||0;
const hasHero=()=>!!(me&&me.hero&&HEROES[me.hero]);

/* Lưu thay đổi thực hiện ở trang chủ (mặc/tháo đồ, mở rương, mua hàng...) */
function persistHome(){if(run||!me)return;API.save(meActive?me:profileRecord(me))}
function goHome(){run=null;B=null;setTab('home');refreshMenu();showScreen('menu')}

/* Nạp hồ sơ từ bản lưu rồi vẽ lại trang chủ */
async function refreshMenu(){
  const sv=await API.loadSave();homeAct=0;draft=null;
  if(sv&&sv.hero&&HEROES[sv.hero]){
    me=sv;meActive=isActive(sv);ensureMeta(me);ensureGear(me);me.keys=me.keys||0;
    if(!meActive){ // hồ sơ: dựng Máu tối đa theo trang bị đang mặc để dùng chung hàm trang bị
      const g=cleanGear(me.equip,me.bag,me.hero);me.equip=g.equip;me.bag=g.bag;me.profile=true;
      me.maxHp=HEROES[me.hero].hp+gearBonus(me).hp;me.hp=me.maxHp}
  }else{me=null;meActive=false}
  renderHome();
}

/* Màn mặc định: màn có rương đang chờ nhận, rồi màn của lượt đang dở, rồi màn cao nhất đã mở khóa */
function readyIn(a){return actUnlocked(a)&&ACT_CHESTS.some(m=>bestOf(a)>=m&&!me.prog.claimed[a+'-'+m])}
function defaultAct(){if(!hasHero())return 1;for(let a=1;a<=MAX_ACT;a++)if(readyIn(a))return a; // có rương chờ nhận thì mở đúng màn đó
  if(meActive&&me.act&&actUnlocked(me.act))return me.act;for(let a=MAX_ACT;a>=1;a--)if(actUnlocked(a))return a;return 1}

/* Bố cục đảo của từng màn: [biểu tượng, trái %, trên %, cỡ chữ] */
const ISLE={
  1:[['🌲',14,6,34],['🌳',32,20,30],['🌲',52,2,38],['🌲',70,18,32],['🌲',48,34,36],['🌳',24,42,28]],
  2:[['❄️',14,8,28],['⛰️',30,12,44],['🧊',58,10,32],['❄️',72,26,26],['⛰️',46,32,36],['🧊',20,44,26]],
  3:[['🏰',40,2,52],['💀',16,22,28],['🔮',68,24,30],['🌋',54,36,34],['👁️',24,44,26],['🌙',78,6,26]],
  4:[['🏜️',40,2,50],['🌵',14,24,32],['🔥',68,20,34],['🏺',52,34,30],['🌵',24,42,26],['☀️',78,4,30]],
  5:[['🌿',14,8,30],['🐊',60,26,34],['🍄',30,24,32],['🪷',72,8,28],['🌳',46,4,40],['🐸',22,42,26]],
  6:[['⛈️',38,0,52],['⚡',16,22,30],['☁️',66,20,34],['🌩️',52,36,32],['☁️',24,42,28],['🌈',78,6,28]],
  7:[['🌌',40,2,52],['🪐',16,22,30],['☄️',70,22,28],['🕳️',50,36,32],['👁️',24,44,26],['✨',80,6,26]],
};
function islandHTML(a,open){
  return `<div class="isl-shape"><i class="isl-top"></i><i class="isl-front"></i><i class="stream"></i></div>`+
    ISLE[a].map(([ic,x,y,s])=>`<span class="tree" style="left:${x}%;top:${y}%;font-size:${s}px">${ic}</span>`).join('')+
    `<span class="isl-badge">${a}</span>`+(open?'':'<span class="isl-lock">🔒</span>');
}
function rewardText(r){return[r.coins&&`🪙 ${r.coins}`,r.gems&&`💠 ${r.gems}`,r.keys&&`🗝️ ${r.keys}`,r.tk&&`🔑 ${r.tk}`,r.eq&&'🎁 trang bị'].filter(Boolean).join(' · ')}

/* Thanh trên (ảnh nhân vật, cấp, xu, ngọc) và huy hiệu chìa khóa ở thanh dưới */
function renderHead(){
  const has=hasHero();if(has)ensureMeta(me);
  const L=lvlInfo(has?me.xp:0);
  $('#hAv').innerHTML=has?heroFace(me.hero):'❔';
  $('#hLvl').textContent=L.l;$('#hXp').style.width=Math.round(L.cur/L.need*100)+'%';
  $('#hCoins').textContent=has?me.coins:0;$('#hGems').textContent=has?me.gems:0;
  const keys=has?(me.keys||0):0,nk=$('#navKeyN');nk.textContent=keys;nk.style.display=keys?'':'none';
  const tk=has?(me.tkeys||0):0,nt=$('#navCardsN');nt.textContent=tk;nt.style.display=tk?'':'none';
}
function renderHome(){
  const has=hasHero();renderHead();
  if(!homeAct)homeAct=defaultAct();
  const a=homeAct,A=ACTS[a],open=actUnlocked(a),best=has?bestOf(a):0;
  $('#islName').textContent=`Màn ${a}: ${A.n}`;
  $('#islSub').innerHTML=open?`Kết quả tốt nhất (<b>${best}/${ROWS}</b>)`:`🔒 Đánh bại trùm Màn ${a-1} để mở khóa`;
  $('#islPrev').disabled=a<=1;$('#islNext').disabled=a>=MAX_ACT;
  const isl=$('#island');isl.className='island a'+a+(open?'':' locked');isl.innerHTML=islandHTML(a,open);
  let rec='1-0';for(let x=MAX_ACT;x>=1;x--)if(has&&bestOf(x)>0){rec=x+'-'+bestOf(x);break}
  $('#hRec').textContent=rec;
  $('#hChests').innerHTML=ACT_CHESTS.map((m,i)=>{
    const st=!has||!open?'lock':me.prog.claimed[a+'-'+m]?'done':best>=m?'ready':'lock';
    return `<button class="hchest ${st}" data-ci="${i}"><span class="cg">🧰</span><span class="cb">${st==='ready'?'!':st==='done'?'✔':'🔒'}</span><small>${a}-${m}</small></button>`}).join('<span class="dots"></span>');
  const bs=$('#btnStart'),bc=$('#btnContinue');
  bs.textContent=has?'Phiêu lưu mới!':'Chọn nhân vật!';bs.disabled=has&&!open;
  bc.style.display=meActive?'':'none';if(meActive)bc.textContent=`▶ Tiếp tục · Màn ${me.act}-${me.floor}`;
  renderPane();
}

/* ---------- Rương thưởng vượt ải lần đầu ---------- */
function equipLine(E,worn){return `${E.ic} <b>${E.n}</b> <span class="eqr r-${E.r}">${SLOTS[E.slot].n}</span><br>${equipStatsHTML(E)} · ${worn?'đã mặc':'cất vào túi 🎒'}`}
function rewardModal(title,lines,glyph='🎁'){
  const m=$('#modal');
  m.innerHTML=`<h3>${title}</h3><div class="chest" id="rchest">${glyph}</div><div class="keyloot">${lines.map(l=>`<div>${l}</div>`).join('')}</div><button class="btn" data-close>Tuyệt!</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=()=>{m.classList.remove('on');afterModal()};
  const r=$('#rchest').getBoundingClientRect();SFX.coin();
  FX.burst(r.left+r.width/2,r.top+r.height/2,{n:40,c:['#ffd24a','#fff1a0','#ffffff'],sp:380,life:.8,s:8,g:300,vy:-200});
}
function claimChest(a,i){
  const m=ACT_CHESTS[i],key=a+'-'+m,R=FIRST_CLEAR[a][i];if(!hasHero())return false;ensureMeta(me);
  if(me.prog.claimed[key]||bestOf(a)<m||!actUnlocked(a))return false;
  me.prog.claimed[key]=1;const lines=[];
  if(R.coins){me.coins+=R.coins;lines.push(`🪙 +${R.coins} xu`)}
  if(R.gems){me.gems+=R.gems;lines.push(`💠 +${R.gems} ngọc`)}
  if(R.keys){me.keys=(me.keys||0)+R.keys;lines.push(`🗝️ +${R.keys} chìa khóa`)}
  if(R.tk){me.tkeys=(me.tkeys||0)+R.tk;lines.push(`🔑 +${R.tk} chìa khóa thẻ (quay thẻ ở tab Thẻ bài)`)}
  if(R.eq){const id=rollEquip(R.eq,'u'),worn=gainEquip(id,true);lines.push(equipLine(EQUIP[id],worn))}
  persistHome();renderHome();
  rewardModal(`🧰 Rương vượt ải ${key}`,lines);return true;
}
function onChestTap(i){
  const a=homeAct,m=ACT_CHESTS[i],key=a+'-'+m;
  if(!hasHero()){toast('Hãy chọn nhân vật và bắt đầu hành trình trước.');return}
  if(me.prog.claimed[key]){toast(`✔ Đã nhận rương ${key}`);return}
  if(actUnlocked(a)&&bestOf(a)>=m){claimChest(a,i);return}
  toast(`🔒 Rương ${key}: vượt tới tầng ${m} của Màn ${a} lần đầu để mở.<br>Thưởng: ${rewardText(FIRST_CLEAR[a][i])}`,3200);
}

/* ---------- Các tab của trang chủ: Phiêu lưu · Trang bị · Cửa hàng ---------- */
let tab='home';
const TAB_NAV={home:'navHome',bag:'navBag',shop:'navShop',cards:'navCards'};
function syncTab(){$('#hwrap').dataset.tab=tab;for(const k in TAB_NAV)$('#'+TAB_NAV[k]).classList.toggle('on',k===tab)}
function setTab(t){
  if(t!=='home'&&!hasHero()){toast('Hãy chọn nhân vật trước (bấm “Chọn nhân vật!”).');return}
  closeSheet();tab=t;syncTab();renderPane();
}
function renderPane(){
  if(tab!=='home'&&!hasHero()){tab='home';syncTab()}
  if(tab==='bag')renderBag();else if(tab==='shop')renderShop();else if(tab==='cards')renderCards();
}
const showBag=()=>setTab('bag'),showHomeShop=()=>setTab('shop');

/* ---------- Tab Trang bị 🎒 ---------- */
const SLOTS_L=['gloves','ring','boots'],SLOTS_R=['weapon','helm','armor'];
const SORTS=['Mặc định','Độ hiếm','Theo ô'];let bagSort=0;
const RK={c:0,u:1,r:2},slotIdx=it=>SLOT_KEYS.indexOf(it.slot);
const gearScore=it=>(it.atk||0)*3+(it.def||0)*3+(it.hp||0)/3; // dùng để gắn dấu ▲ "tốt hơn đồ đang mặc"
const isUpgrade=it=>{const cur=EQUIP[me.equip[it.slot]];return !cur||gearScore(it)>gearScore(cur)};
const statShort=it=>['atk','def','hp'].filter(k=>it[k]).map(k=>STAT_N[k].ic+it[k]).join(' ');

function slotTile(s){const it=EQUIP[me.equip[s]];
  return `<button class="bslot ${it?'r-'+it.r:'empty'}" data-slot="${s}" aria-label="${SLOTS[s].n}"><span class="bsg">${it?it.ic:SLOTS[s].ic}</span>${it?'':`<small>${SLOTS[s].n}</small>`}</button>`}

/* Số lần hợp nhất có thể: 3 món trong túi cùng ô + cùng độ hiếm (Thường/Tốt) → 1 món cùng ô, độ hiếm kế tiếp */
function mergePlan(R=me){let n=0;
  for(const s of SLOT_KEYS){let c=0,u=0;for(const id of R.bag){const it=EQUIP[id];if(it.slot!==s)continue;if(it.r==='c')c++;else if(it.r==='u')u++}
    const a=Math.floor(c/3);n+=a+Math.floor((u+a)/3)}
  return n}
function doMerge(){
  const R=G();ensureGear(R);const out=[];
  for(const r of ['c','u'])for(const s of SLOT_KEYS)for(;;){
    const idx=[];R.bag.forEach((id,i)=>{if(idx.length<3&&EQUIP[id].slot===s&&EQUIP[id].r===r)idx.push(i)});
    if(idx.length<3)break;
    const nid=pickGear(R,s,r==='c'?'u':'r');if(!nid)break;
    idx.reverse().forEach(i=>R.bag.splice(i,1));R.bag.push(nid);out.push(nid)}
  return out}

function renderBag(){
  if(!hasHero())return;const R=me;ensureGear(R);ensureMeta(R);
  const h=HEROES[R.hero],st=heroStats(R);
  $('#bCoins').textContent=R.coins;$('#bHero').innerHTML=heroSprite(R.hero);$('#bHeroN').textContent=h.n;
  $('#bSlotsL').innerHTML=SLOTS_L.map(slotTile).join('');$('#bSlotsR').innerHTML=SLOTS_R.map(slotTile).join('');
  const g=st.bonus,pl=k=>g[k]?`<i>+${g[k]}</i>`:'';
  $('#bStats').innerHTML=`<div class="bst atk"><span class="sg">⚔️</span><b>${st.atk}${pl('atk')}</b><small>TẤN CÔNG</small></div><div class="bst def"><span class="sg">🛡️</span><b>${st.def}${pl('def')}</b><small>PHÒNG THỦ</small></div><div class="bst hp"><span class="sg">❤️</span><b>${R.maxHp}${pl('hp')}</b><small>MÁU</small></div>`;
  let items=R.bag.map((id,i)=>({id,i,it:EQUIP[id]}));
  const byRar=(a,b)=>RK[b.it.r]-RK[a.it.r],bySlot=(a,b)=>slotIdx(a.it)-slotIdx(b.it);
  if(bagSort===1)items.sort((a,b)=>byRar(a,b)||bySlot(a,b)||a.i-b.i);
  else if(bagSort===2)items.sort((a,b)=>bySlot(a,b)||byRar(a,b)||a.i-b.i);
  const cells=Math.max(12,Math.ceil(items.length/4)*4);
  $('#bGrid').innerHTML=items.map(({i,it})=>`<button class="bitem r-${it.r}" data-bi="${i}"><span class="big">${it.ic}</span><span class="bsl">${SLOTS[it.slot].ic}</span>${isUpgrade(it)?'<i class="bup">▲</i>':''}<small>${statShort(it)}</small></button>`).join('')+'<span class="bcell"></span>'.repeat(cells-items.length);
  $('#bEmpty').style.display=items.length?'none':'';
  $('#bSort').textContent=SORTS[bagSort]+' ▾';
  const n=mergePlan(R),mb=$('#bMerge');mb.textContent=n?`Hợp nhất! (${n})`:'Hợp nhất!';mb.classList.toggle('dim',!n);
}

/* Bảng chi tiết trang bị (chạm vào ô đang mặc hoặc món trong túi) */
function closeSheet(){const sh=$('#isheet');sh.classList.remove('on');sh.innerHTML=''}
function openItem(src,ref){
  if(!hasHero())return;const id=src==='bag'?me.bag[ref]:me.equip[ref],it=EQUIP[id];if(!it)return;
  const stats=Object.keys(STAT_N).filter(k=>it[k]).map(k=>`<li><span>${STAT_N[k].ic} ${STAT_N[k].n}</span><b>+${it[k]}</b></li>`).join('');
  const sh=$('#isheet');
  sh.innerHTML=`<div class="isc r-${it.r}"><button class="isx" data-sx aria-label="Đóng">✕</button><div class="israr">${RAR_N[it.r]}</div><div class="isic">${it.ic}</div><h4>${it.n}</h4><div class="issub">${SLOTS[it.slot].ic} ${SLOTS[it.slot].n}${it.h?' · '+HEROES[it.h].n:''}</div><ul class="isst">${stats}</ul><div class="iscmp">${src==='bag'?gearDiff(it):'Đang mặc'}</div><div class="isbtn">${src==='bag'?`<button class="wbtn gold" data-sa="eq">Mặc</button><button class="wbtn" data-sa="sell">Bán 🪙 ${SELL_PRICE[it.r]}</button>`:`<button class="wbtn" data-sa="un">Tháo</button>`}</div></div>`;
  sh.classList.add('on');
  sh.onclick=e=>{
    if(e.target===sh||e.target.closest('[data-sx]')){closeSheet();return}
    const a=e.target.closest('[data-sa]');if(!a)return;
    if(a.dataset.sa==='eq'){equipItem(id);SFX.buff()}
    else if(a.dataset.sa==='un')unequipSlot(ref);
    else{if(it.r==='r'&&!confirm(`Bán ${it.n} (Hiếm) lấy ${SELL_PRICE.r} xu?`))return;
      me.bag.splice(ref,1);me.coins+=SELL_PRICE[it.r];SFX.coin();toast(`🪙 +${SELL_PRICE[it.r]} xu`,1200)}
    closeSheet();persistHome();renderHead();renderBag();
  };
}
function showBagInfo(){
  const m=$('#modal');
  m.innerHTML=`<h3>🎒 Trang bị</h3><div class="infotext"><p>Có <b>6 ô</b>: vũ khí, mũ, giáp, găng tay, giày, nhẫn. Trang bị cộng thẳng vào Tấn công, Phòng thủ và Máu tối đa.</p><p>Chạm trang bị trong túi để <b>Mặc</b> hoặc <b>Bán</b> lấy xu (Thường ${SELL_PRICE.c} · Tốt ${SELL_PRICE.u} · Hiếm ${SELL_PRICE.r}). Chạm ô đang mặc để <b>Tháo</b>. Dấu <b class="up">▲</b> là món tốt hơn đồ đang mặc.</p><p><b>Hợp nhất</b>: 3 món cùng ô và cùng độ hiếm trong túi → 1 món cùng ô, độ hiếm cao hơn (Thường → Tốt → Hiếm).</p><p>Trang bị được giữ qua mọi lượt chơi, kể cả khi thất bại.</p></div><button class="btn" data-close>Đã hiểu</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=closeModal;
}
function initBag(){
  $('#paneBag').onclick=e=>{
    const sl=e.target.closest('[data-slot]');if(sl){const s=sl.dataset.slot;if(me.equip[s])openItem('slot',s);else toast(`${SLOTS[s].ic} Ô ${SLOTS[s].n} đang trống`,1200);return}
    const bi=e.target.closest('[data-bi]');if(bi){openItem('bag',+bi.dataset.bi)}
  };
  $('#bSort').onclick=()=>{bagSort=(bagSort+1)%SORTS.length;SFX.card();renderBag()};
  $('#bMerge').onclick=()=>{
    if(!mergePlan()){toast('Cần 3 trang bị trong túi cùng ô và cùng độ hiếm (Thường hoặc Tốt) để hợp nhất.',2600);return}
    const out=doMerge();persistHome();renderHead();renderBag();
    lootModal('🔨 Hợp nhất',out.map(id=>({id})),`${out.length} lần hợp nhất, 3 món → 1 món cao hơn`);
  };
  $('#bInfo').onclick=showBagInfo;
}

/* Bảng kết quả mở rương / hợp nhất: lưới các món nhận được */
function lootModal(title,items,foot){
  const m=$('#modal');
  m.innerHTML=`<h3>${title}</h3><div class="lootgrid">${items.map(({id,worn})=>{const E=EQUIP[id];
    return `<div class="lt r-${E.r}"><span class="lti">${E.ic}</span><b>${E.n}</b><span class="eqr r-${E.r}">${RAR_N[E.r]} · ${SLOTS[E.slot].n}</span><small>${equipStatsHTML(E)}</small>${worn?'<em>Đã mặc</em>':''}</div>`}).join('')}</div>${foot?`<p class="muted">${foot}</p>`:''}<button class="btn" data-close>Tuyệt!</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=()=>{m.classList.remove('on');afterModal()};
  SFX.coin();FX.burst(innerWidth/2,innerHeight*.28,{n:46,c:['#ffd24a','#fff1a0','#ffffff'],sp:380,life:.8,s:8,g:300,vy:-200});
}

/* ---------- Tab Cửa hàng 🏪 ---------- */
const CUR_IC={coins:'🪙',gems:'💠',keys:'🗝️'};
const haveOf=cur=>cur==='keys'?(me.keys||0):me[cur];
const pityLeft=id=>Math.max(1,SHOP_CHESTS[id].pity-(me.prog.pity[id]||0));
function renderShop(){
  if(!hasHero())return;ensureMeta(me);
  const C=SHOP_CHESTS,S=C.special,keys=me.keys||0;
  const gbtn=(act,label,cost,ok)=>`<button class="gbtn ${ok?'':'no'}" ${act}>${label}<span>${CUR_IC[cost[0]]} ${cost[1]}</span></button>`;
  const kbtn=id=>{const c=C[id],ok=keys>=c.p;return `<button class="kbtn ${ok?'ok':''}" data-open="${id}:1"><span class="kg">🗝️</span><b>${keys}/${c.p}</b></button>`};
  $('#paneShop').innerHTML=`<div class="rib"><span>Rương Đặc Biệt</span></div>
    <div class="spc"><button class="sinfo" data-sinfo aria-label="Tỉ lệ">ⓘ</button>
      <div class="spart"><span class="spg">${S.ic}</span><i style="left:8%;top:12%">✦</i><i style="left:70%;top:6%">✧</i><i style="left:84%;top:58%">✦</i></div>
      <div class="spr"><h3>${S.n}</h3><div class="spd">Nhận đồ <b class="g">Tốt</b> hoặc <b class="y">Hiếm</b></div><div class="sppity">⭐ Chắc chắn <b>Hiếm</b> sau <b>${pityLeft('special')}</b> lần mở</div>
        <div class="spb">${gbtn('data-open="special:1"','Mở ×1',['gems',S.p],me.gems>=S.p)}${gbtn('data-open="special:10"','Mở ×10',['gems',S.p10],me.gems>=S.p10)}</div></div></div>
    <div class="rib"><span>Rương</span></div>
    <div class="cpair">
      <div class="cc"><h4>${C.common.n}</h4><div class="cnote">Đồ Thường → Hiếm</div><div class="cart">${C.common.ic}</div>${kbtn('common')}</div>
      <div class="cc rare"><h4>${C.rare.n}</h4><div class="cnote">Chắc chắn <b>Hiếm</b> sau ${pityLeft('rare')} lần mở</div><div class="cart">${C.rare.ic}</div>${kbtn('rare')}</div>
    </div>
    <div class="rib"><span>Chìa khóa</span></div>
    <div class="cpair">${HOME_SHOP.map(it=>`<div class="cc kk"><h4>${it.n}</h4><div class="cnote">${it.d}</div><div class="cart">${it.ic}</div><button class="gbtn ${me[it.cur]>=it.p?'':'no'}" data-buy="${it.id}"><span>${CUR_IC[it.cur]} ${it.p}</span></button></div>`).join('')}</div>
    <p class="shnote">🪙 Xu: rương vượt ải lần đầu và cuối mỗi lượt chơi · 💠 Ngọc: rương vượt ải và lên cấp · 🗝️ Chìa khóa: rơi từ ải, rương vượt ải hoặc mua ở đây · 🔑 Chìa khóa thẻ: quay thẻ ở tab Thẻ bài (rơi từ trùm).</p>`;
}
function buyItem(id){
  const it=HOME_SHOP.find(x=>x.id===id);if(!it||!hasHero()||me[it.cur]<it.p)return false;
  me[it.cur]-=it.p;
  if(it.keys){me.keys=(me.keys||0)+it.keys;toast(`🗝️ +${it.keys} chìa khóa (có ${me.keys})`,1600)}
  if(it.tkeys){me.tkeys=(me.tkeys||0)+it.tkeys;toast(`🔑 +${it.tkeys} chìa khóa thẻ (có ${me.tkeys})`,1600)}
  SFX.coin();
  persistHome();renderHead();renderPane();return true;
}
/* Mở rương ở cửa hàng. 'common' = Kho Báu (mở bằng hộp thoại có hiệu ứng). Rương Đặc Biệt/Hiếm: từ Tốt trở lên + bảo hiểm Hiếm. Trả về true nếu mở được. */
function openShopChest(id,n=1){
  const c=SHOP_CHESTS[id];if(!c||!hasHero())return false;ensureMeta(me);
  const cost=n===10&&c.p10?c.p10:c.p*n,have=haveOf(c.cur);
  if(have<cost){toast(c.cur==='keys'?`🗝️ Cần ${cost} chìa khóa (có ${have}). Mua thêm ở mục “Chìa khóa” bên dưới.`:`💠 Cần ${cost} ngọc (có ${have}).`,2600);return false}
  if(id==='common'){showKeyChest();return true}
  if(c.cur==='keys')me.keys-=cost;else me[c.cur]-=cost;
  const P=me.prog.pity,got=[];
  for(let i=0;i<n;i++){
    P[id]=(P[id]||0)+1;const rare=P[id]>=c.pity||Math.random()<c.rare;if(rare)P[id]=0;
    const eid=rollEquip(null,null,rare?'r':'u');got.push({id:eid,worn:gainEquip(eid,true)});
  }
  persistHome();renderHead();renderShop();
  lootModal(`${c.ic} ${c.n}${n>1?' ×'+n:''}`,got,got.some(x=>EQUIP[x.id].r==='r')?'':'Chưa ra Hiếm: bộ đếm bảo hiểm tăng lên');
  return true;
}
function initShop(){
  $('#paneShop').onclick=e=>{
    const o=e.target.closest('[data-open]');if(o){const[id,n]=o.dataset.open.split(':');SFX.unlock();openShopChest(id,+n);return}
    const b=e.target.closest('[data-buy]');if(b){const it=HOME_SHOP.find(x=>x.id===b.dataset.buy);if(!buyItem(b.dataset.buy))toast(`${CUR_IC[it.cur]} Chưa đủ ${it.cur==='coins'?'xu':'ngọc'} (cần ${it.p}, có ${me[it.cur]})`,1800);return}
    if(e.target.closest('[data-sinfo]'))toast(`🎁 <b>Rương Đặc Biệt</b>: ${Math.round(SHOP_CHESTS.special.rare*100)}% Hiếm, còn lại Tốt.<br>👑 <b>Rương Hiếm</b>: ${Math.round(SHOP_CHESTS.rare.rare*100)}% Hiếm, còn lại Tốt.<br>Cả hai: cứ ${SHOP_CHESTS.special.pity} lần mở chắc chắn có 1 món Hiếm.`,4200);
  };
}
function initTabs(){initBag();initShop();initCards();syncTab()}

/* ---------- Thẻ nhân vật & cài đặt ---------- */
function showHeroCard(){
  if(!hasHero()){toast('Bạn chưa có nhân vật. Bấm “Chọn nhân vật!” để bắt đầu.');return}
  ensureMeta(me);const m=$('#modal'),h=HEROES[me.hero],L=lvlInfo(me.xp),st=heroStats(me);
  const items=Object.values(me.equip).filter(Boolean).length+me.bag.length;
  m.innerHTML=`<h3>${h.ic} ${h.n}</h3><p class="muted">${h.title}</p>
    <div class="eqstats"><span>⭐ Cấp <b>${L.l}</b></span><span>❤️ <b>${me.maxHp}</b></span><span>⚔️ <b>${st.atk}</b></span><span>🛡️ <b>${st.def}</b></span></div>
    <div class="xpline">Kinh nghiệm ${L.cur}/${L.need}<div class="xpbig"><i style="width:${Math.round(L.cur/L.need*100)}%"></i></div></div>
    <p class="muted">🎒 ${items} trang bị · 🗝️ ${me.keys||0} chìa khóa · 🔑 ${me.tkeys||0} chìa khóa thẻ · 🎴 ${Object.keys(me.owned||{}).length} thẻ đã nhặt/quay · Kỷ lục ${$('#hRec').textContent}</p>
    <p class="muted">🔒 Mỗi tài khoản chỉ có một nhân vật, không thể đổi hay tạo thêm.</p>
    <button class="btn ghost" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=closeModal;
}
function showSettings(){
  const m=$('#modal');
  m.innerHTML=`<h3>⚙️ Cài đặt</h3><div class="setlist"><button class="btn ghost" id="btnSound"></button><div class="account" id="account"></div></div><button class="btn" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=closeModal;
  updateSoundBtn();$('#btnSound').onclick=()=>{SFX.unlock();SFX.toggle();updateSoundBtn()};
  $('#account').innerHTML=API.loggedIn?`👤 <b>${API.user.username}</b> · <a id="lnkStats">Thống kê</a> · <a id="lnkOut">Đăng xuất</a>`:`Chơi khách (lưu trên máy) · <a id="lnkIn">Đăng nhập / Đăng ký</a>`;
  const i=$('#lnkIn');if(i)i.onclick=showLogin;
  const o=$('#lnkOut');if(o)o.onclick=()=>{API.logout();closeModal();refreshMenu()};
  const s=$('#lnkStats');if(s)s.onclick=showStats;
}

/* ---------- Bắt đầu / tiếp tục ---------- */
function onStart(){
  SFX.unlock();SFX.card();
  if(!hasHero()){showScreen('heroSel');return}
  if(!actUnlocked(homeAct)){toast(`🔒 Hãy đánh bại trùm Màn ${homeAct-1} trước.`);return}
  if(meActive&&!confirm('Bắt đầu hành trình mới sẽ bỏ lượt chơi đang dở (xu, ngọc, chìa khóa và trang bị vẫn được giữ). Tiếp tục?'))return;
  startRun(me.hero,me,homeAct);
}
function needHero(f){return()=>{if(!hasHero()){toast('Hãy chọn nhân vật trước (bấm “Chọn nhân vật!”).');return}f()}}
function initHome(){
  $('#btnStart').onclick=onStart;
  $('#btnContinue').onclick=()=>{if(meActive){SFX.unlock();resumeRun(me)}};
  $('#islPrev').onclick=()=>{if(homeAct>1){homeAct--;SFX.card();renderHome()}};
  $('#islNext').onclick=()=>{if(homeAct<MAX_ACT){homeAct++;SFX.card();renderHome()}};
  $('#hChests').onclick=e=>{const b=e.target.closest('[data-ci]');if(b)onChestTap(+b.dataset.ci)};
  $('#hAvatar').onclick=showHeroCard;
  $('#btnSettings').onclick=showSettings;
  $('#navShop').onclick=()=>{SFX.unlock();showHomeShop()};
  $('#navBag').onclick=()=>{SFX.unlock();showBag()};
  $('#navCards').onclick=()=>{SFX.unlock();setTab('cards')};
  initTabs();
  $('#navKey').onclick=needHero(showKeyChest);
  $('#navRank').onclick=()=>{SFX.unlock();showLeaderboard('')};
  $('#navHome').onclick=()=>{homeAct=0;setTab('home');renderHome()};
  refreshMenu();
}
initHome();
Object.assign(window.__game,{get me(){return me},get homeAct(){return homeAct},refreshMenu,renderHome,claimChest,onChestTap,buyItem,showHomeShop,showBag,setTab,renderBag,renderShop,openItem,mergePlan,doMerge,openShopChest,get tab(){return tab},showHeroCard,showSettings,onStart,goHome,lvlInfo,addXp,recordProgress,ensureMeta,profileRecord,persistHome});
