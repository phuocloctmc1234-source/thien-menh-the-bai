'use strict';
/* =========================================================
   TAB THẺ BÀI 🎴 (trang chủ)
   - 🃏 Bộ bài: tự xếp BỘ BÀI BAN ĐẦU từ các thẻ đã sở hữu. Sang mỗi màn mới, bộ bài trong lượt chơi được đặt lại về bộ này.
   - 📚 Sưu tập: xem mọi thẻ của nhân vật theo từng màn (+ thẻ Huyền thoại), thẻ nào đã có, thẻ nào chưa.
   - 🎰 Quay thẻ: dùng chìa khóa thẻ 🔑 để quay, có cả thẻ Huyền thoại (chỉ có từ đây).
   Dữ liệu (me.owned, me.deckCfg, me.tkeys, me.prog.pity.card) nằm cùng hồ sơ nên lưu qua persistHome().
   Phụ thuộc: me/hasHero/persistHome (home.js), cardHTML/deckProblem/startingDeckIds/isOwned (game.js).
========================================================= */
let cdSub='deck',cdAct=1,draft=null;
const CD_TABS=[['deck','🃏 Bộ bài'],['col','📚 Sưu tập'],['gacha','🎰 Quay thẻ']];
const RAR_ORD={l:0,r:1,u:2,c:3,s:4};
// kích thước thẻ theo độ rộng màn hình (to hơn trên điện thoại, có giới hạn trên màn lớn)
// Bộ bài/danh sách/sưu tập: cỡ thẻ tính theo bề rộng khung (--dkw, --pw ở style.css) nên luôn vừa chiều ngang, không có thanh cuộn ngang.
const CW_DECK='var(--dkw)',CW_POOL='var(--pw)',CW_COL='var(--pw)',CW_PULL='clamp(70px,18vw,110px)',CW_INFO='clamp(120px,36vw,170px)';

/* Thẻ thu nhỏ kèm tên bên dưới (chữ trong thẻ quá nhỏ khi thu nhỏ nên tên được in riêng cho dễ đọc) */
function miniCard(id,{cw=70,up=false,cap=true}={}){
  const d=CARDS[id];
  return `<span class="mc rt-${d.r}" data-cid="${id}" style="--cw:${typeof cw==='number'?cw+'px':cw}">${cardHTML({id,up})}${cap?`<small>${d.n}</small>`:''}</span>`;
}
const heroCardIds=h=>Object.keys(CARDS).filter(k=>CARDS[k].h===h||CARDS[k].h==='*');
const sortIds=ids=>ids.sort((x,y)=>RAR_ORD[CARDS[x].r]-RAR_ORD[CARDS[y].r]||(CARDS[x].a||0)-(CARDS[y].a||0)||(Array.isArray(CARDS[x].c)?CARDS[x].c[0]:CARDS[x].c)-(Array.isArray(CARDS[y].c)?CARDS[y].c[0]:CARDS[y].c));

function renderCards(){
  if(!hasHero())return;ensureMeta(me);hideTip();
  const h=HEROES[me.hero],pane=$('#paneCards');
  pane.innerHTML=`<div class="cdhead"><div class="cdhero"><span>${h.ic}</span><b>${h.n}</b></div><div class="cdkeys" title="Chìa khóa thẻ">🔑 <b>${me.tkeys}</b></div></div>
    <div class="cdtabs">${CD_TABS.map(([k,n])=>`<button data-sub="${k}" class="${cdSub===k?'on':''}">${n}</button>`).join('')}</div>
    <div class="cdbody" id="cdBody"></div>`;
  ({deck:renderDeckEd,col:renderCollection,gacha:renderGacha})[cdSub]();
  const nk=$('#navCardsN');if(nk){nk.textContent=me.tkeys;nk.style.display=me.tkeys?'':'none'}
}

/* ---------- 🃏 Bộ bài ban đầu ---------- */
const countIn=(ids,id)=>ids.filter(x=>x===id).length;
const canAdd=id=>draft.length<DECK_SIZE&&!deckProblem([...draft,id],me,true);
function renderDeckEd(){
  const R=me;if(!draft)draft=startingDeckIds(R);
  const prob=deckProblem(draft,R),isDefault=JSON.stringify(draft)===JSON.stringify(HEROES[R.hero].deck);
  const slots=[...Array(DECK_SIZE)].map((_,i)=>draft[i]?`<button class="dkslot" data-rm="${i}" aria-label="Bỏ thẻ">${miniCard(draft[i],{cw:CW_DECK})}</button>`:'<span class="dkslot empty">+</span>').join('');
  const owned=sortIds(heroCardIds(R.hero).filter(k=>isOwned(R,k)));
  const pool=owned.map(id=>{const d=CARDS[id],n=countIn(draft,id),ok=canAdd(id);
    return `<button class="dkc ${ok?'':'off'}" data-add="${id}">${miniCard(id,{cw:CW_POOL})}<i class="dkn">${n}/${DECK_COPIES[d.r]}</i></button>`}).join('');
  const nR=draft.filter(i=>CARDS[i].r==='r').length,nL=draft.filter(i=>CARDS[i].r==='l').length;
  $('#cdBody').innerHTML=`<div class="dkbox">
      <div class="dktitle"><b>Bộ bài ban đầu</b><span class="${prob?'bad':'good'}">${draft.length}/${DECK_SIZE}</span></div>
      <div class="dkslots">${slots}</div>
      <div class="dkmsg ${prob?'bad':'good'}">${prob?(draft.length<DECK_SIZE?`Chọn thêm ${DECK_SIZE-draft.length} thẻ ở bên dưới.`:prob):'✔ Bộ bài hợp lệ. Bấm Lưu để dùng cho các lượt chơi sau.'}</div>
      <div class="dkrules">Mỗi thẻ tối đa: Khởi đầu ${DECK_COPIES.s} · Thường ${DECK_COPIES.c} · Tốt ${DECK_COPIES.u} · Hiếm ${DECK_COPIES.r} · Huyền thoại ${DECK_COPIES.l}.<br>Tối đa ${DECK_CAP.rl} thẻ Hiếm + Huyền thoại (hiện có ${nR+nL}), trong đó tối đa ${DECK_CAP.l} Huyền thoại (hiện có ${nL}).</div>
      <div class="dkact"><button class="wbtn" data-dk="reset" ${isDefault?'disabled':''}>↺ Mặc định</button><button class="wbtn gold" data-dk="save" ${prob?'disabled':''}>💾 Lưu bộ bài</button></div>
      <div class="dknote">${me.deckCfg?'Đang dùng bộ bài tự xếp.':'Đang dùng bộ bài mặc định của nhân vật.'} Sang mỗi màn mới, bộ bài được đặt lại về bộ này.${meActive?' (Lượt đang chơi dở sẽ dùng bộ mới từ màn kế tiếp.)':''}</div>
    </div>
    <div class="dkright"><div class="dktitle"><b>Thẻ đã sở hữu (${owned.length})</b><small>chạm để thêm</small></div>
    <div class="dkpool">${pool}</div>
    <p class="cdhint">Chỉ 🎰 quay thẻ mới thêm thẻ vào bộ sưu tập. Thẻ nhặt trong trận chỉ dùng trong lượt chơi đó.</p></div>`;
  $('#cdBody').classList.add('dkmode');
}
function saveDeck(){
  const R=me;if(deckProblem(draft,R))return;
  const def=JSON.stringify(draft)===JSON.stringify(HEROES[R.hero].deck);
  R.deckCfg=def?null:[...draft];persistHome();SFX.buff();toast('💾 Đã lưu bộ bài ban đầu',1400);renderCards();
}

/* ---------- 📚 Sưu tập ---------- */
/* ---------- Quà hoàn thành bộ sưu tập ---------- */
const colCards=(R,act)=>Object.keys(CARDS).filter(k=>CARDS[k].h===R.hero&&CARDS[k].r!=='s'&&(act==='all'?true:act?CARDS[k].a===act:CARDS[k].g));
const colClaimed=(R,act)=>!!(R.prog&&R.prog.claimed&&R.prog.claimed['col-'+act]);
const colMissing=(R,act)=>colCards(R,act).filter(k=>!isOwned(R,k)).length;
const colReady=(R,act)=>colCards(R,act).length>0&&!colMissing(R,act)&&!colClaimed(R,act);
function colGiftHTML(R,act,label){
  const rw=COL_REWARDS[act],miss=colMissing(R,act),done=colClaimed(R,act),rdy=colReady(R,act);
  return `<div class="colgift ${act==='all'?'all':''} ${done?'done':rdy?'ready':''}"><span class="cgl">${label} <b>${rewardText(rw)}</b></span>${done?'<em>Đã nhận ✔</em>':rdy?`<button data-colclaim="${act}">Nhận quà!</button>`:`<em>Còn ${miss} thẻ</em>`}</div>`}
function claimCollection(act){
  const R=me;if(!hasHero()||!colReady(R,act))return false;ensureMeta(R);
  R.prog.claimed['col-'+act]=1;const r=COL_REWARDS[act],lines=[];
  if(r.coins){R.coins+=r.coins;lines.push(`🪙 +${r.coins} xu`)}
  if(r.gems){R.gems+=r.gems;lines.push(`💠 +${r.gems} ngọc`)}
  if(r.keys){R.keys=(R.keys||0)+r.keys;lines.push(`🗝️ +${r.keys} chìa khóa`)}
  if(r.tk){R.tkeys=(R.tkeys||0)+r.tk;lines.push(`🔑 +${r.tk} chìa khóa thẻ`)}
  if(r.sc)lines.push(grantScrolls(R,r.sc));
  if(r.eq){const id=rollEquip(r.eq,'u'),worn=gainEquip(id,true);lines.push(equipLine(EQUIP[id],worn))}
  persistHome();renderHead();renderCards();
  rewardModal(act==='all'?'🏆 Sưu tập đủ 100% thẻ!':act===0?'🌈 Đủ bộ thẻ Huyền thoại!':`🏅 Đủ bộ thẻ Màn ${act}`,lines,'🏆');return true}

function renderCollection(){
  const R=me,h=R.hero;
  const list=sortIds(Object.keys(CARDS).filter(k=>CARDS[k].h===h&&CARDS[k].r!=='s'&&(cdAct?CARDS[k].a===cdAct:CARDS[k].g)));
  const have=list.filter(k=>isOwned(R,k)).length;
  const all=Object.keys(CARDS).filter(k=>CARDS[k].h===h&&CARDS[k].r!=='s'),haveAll=all.filter(k=>isOwned(R,k)).length;
  const cst=a=>colClaimed(R,a)?' got':colReady(R,a)?' rdy':'';  // đã nhận quà / có quà chờ nhận (chấm sáng trên nút)
  const chips=[...Array(MAX_ACT)].map((_,i)=>`<button data-act="${i+1}" class="${cdAct===i+1?'on':''}${cst(i+1)}">${i+1}</button>`).join('')+`<button data-act="0" class="leg ${cdAct===0?'on':''}${cst(0)}">🌈</button>`;
  $('#cdBody').innerHTML=`<div class="coltop"><b>Bộ sưu tập: ${haveAll}/${all.length}</b><small>Chạm thẻ để xem chi tiết</small></div>
    ${colGiftHTML(R,'all','🏆 Đủ 100% thẻ:')}
    <div class="colchips">${chips}</div>
    <div class="coltitle">${cdAct?`Màn ${cdAct}: ${ACTS[cdAct].n}`:'🌈 Thẻ Huyền thoại · chỉ quay được'} <span>${have}/${list.length}</span></div>
    ${colGiftHTML(R,cdAct,cdAct?'🎁 Đủ bộ Màn '+cdAct+':':'🎁 Đủ thẻ Huyền thoại:')}
    <div class="colgrid">${list.map(id=>{const own=isOwned(R,id);
      return `<button class="colc ${own?'':'lock'}" data-info="${id}">${miniCard(id,{cw:CW_COL})}${own?'':'<em>🔒</em>'}</button>`}).join('')}</div>
    <p class="cdhint">${cdAct?'Thẻ của màn này rơi trong trận ở màn đó nhưng chỉ dùng trong lượt chơi; muốn sở hữu vĩnh viễn hãy 🎰 quay thẻ.':'Thẻ Huyền thoại không rơi trong lượt chơi: dùng chìa khóa thẻ 🔑 ở mục Quay thẻ.'}</p>`;
}
function showCardInfo(id){
  const d=CARDS[id],own=isOwned(me,id),m=$('#modal');
  const where=d.g?'🎰 Chỉ có từ Quay thẻ (chìa khóa thẻ 🔑)':`🗺️ Rơi ở Màn ${d.a}: ${ACTS[d.a].n} · sở hữu bằng 🎰 Quay thẻ`;
  m.innerHTML=`<h3>${d.ic} ${d.n}</h3><div class="infocards"><div>${miniCard(id,{cw:CW_INFO,cap:false})}<small>Thường</small></div><div>${miniCard(id,{cw:CW_INFO,up:true,cap:false})}<small>Nâng cấp ✨</small></div></div>
    <p class="muted"><b class="rt-${d.r}t">${RARITY_N[d.r]}</b> · ${TYPE_N[d.t]} · ${where}${d.fxc?' · 🔁 Hiệu ứng: mỗi lượt dùng 1 lần':''}</p><p class="muted">${own?'✔ Đã sở hữu':'🔒 Chưa sở hữu'}</p><button class="btn" data-close>Đóng</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=closeModal;
}

/* ---------- 🎰 Quay thẻ ---------- */
function rollCardRarity(P){
  P.card=(P.card||0)+1;
  if(P.card>=GACHA.pity){P.card=0;return'l'}
  let x=Math.random();const G=GACHA.rates;
  if(x<G.l){P.card=0;return'l'}x-=G.l;
  if(x<G.r)return'r';x-=G.r;
  return x<G.u?'u':'c';
}
function rollCardOf(r,R){
  const pool=Object.keys(CARDS).filter(k=>CARDS[k].h===R.hero&&CARDS[k].r===r&&(r==='l'?CARDS[k].g:!CARDS[k].g));
  const w=pool.map(k=>isOwned(R,k)?1:3); // ưu tiên thẻ chưa có
  let x=Math.random()*w.reduce((a,b)=>a+b,0);
  for(let i=0;i<pool.length;i++){x-=w[i];if(x<=0)return pool[i]}
  return pool[0];
}
function gachaPull(n){
  const cost=n===10?GACHA.cost10:GACHA.cost1*n;
  if(me.tkeys<cost)return null;
  me.tkeys-=cost;const P=me.prog.pity,out=[];
  for(let i=0;i<n;i++){
    const r=rollCardRarity(P),id=rollCardOf(r,me),isNew=!isOwned(me,id);
    if(isNew)me.owned[id]=1;else me.coins+=GACHA.dup[r];
    out.push({id,r,isNew,xu:isNew?0:GACHA.dup[r]});
  }
  return out;
}
function renderGacha(){
  const G=GACHA,pity=me.prog.pity.card||0,left=Math.max(1,G.pity-pity);
  const legs=Object.keys(CARDS).filter(k=>CARDS[k].h===me.hero&&CARDS[k].g),haveL=legs.filter(k=>isOwned(me,k)).length;
  const btn=(n,cost)=>`<button class="gbtn ${me.tkeys>=cost?'':'no'}" data-pull="${n}">Quay ×${n}<span>🔑 ${cost}</span></button>`;
  $('#cdBody').innerHTML=`<div class="gcbanner"><div class="gcart">🎰<i style="left:8%;top:12%">✦</i><i style="left:78%;top:8%">✧</i><i style="left:86%;top:60%">✦</i></div>
      <h3>Quay Thẻ Huyền Thoại</h3><div class="gcd">Nhận thẻ của <b>${HEROES[me.hero].n}</b>, có cả <b class="leg">15 thẻ Huyền thoại</b> over power</div>
      <div class="gcpity">⭐ Chắc chắn <b>Huyền thoại</b> sau <b>${left}</b> lần quay · Đã có ${haveL}/${legs.length}</div>
      <div class="gcbtns">${btn(1,G.cost1)}${btn(10,G.cost10)}</div>
      <div class="gckeys">Bạn có 🔑 <b>${me.tkeys}</b> chìa khóa thẻ · <a data-goshop>Mua thêm</a></div></div>
    <div class="gcrates"><b>Tỉ lệ</b>
      <span class="rt-lt">🌈 Huyền thoại ${Math.round(G.rates.l*100)}%</span><span class="rt-rt">Hiếm ${Math.round(G.rates.r*100)}%</span><span class="rt-ut">Tốt ${Math.round(G.rates.u*100)}%</span><span class="rt-ct">Thường ${Math.round(G.rates.c*100)}%</span>
      <small>Thẻ chưa có được ưu tiên. Quay trúng thẻ đã có sẽ đổi thành xu 🪙 (Thường ${G.dup.c} · Tốt ${G.dup.u} · Hiếm ${G.dup.r} · Huyền thoại ${G.dup.l}). Quay ×10 chỉ tốn ${G.cost10} chìa khóa.</small></div>
    <button class="wbtn" data-golegend>🌈 Xem 15 thẻ Huyền thoại</button>
    <p class="cdhint">🔑 Chìa khóa thẻ rơi từ trùm (chắc chắn), tinh anh, kho báu, rương vượt ải lần đầu hoặc mua ở 🏪 Cửa hàng.</p>`;
}
function showPullResult(res,n){
  const m=$('#modal'),best=res.some(x=>x.r==='l')?'l':res.some(x=>x.r==='r')?'r':'u';
  m.innerHTML=`<h3>🎰 Kết quả quay ×${n}</h3><div class="pullgrid">${res.map(x=>`<div class="pull ${x.r==='l'?'legend':''}">${miniCard(x.id,{cw:CW_PULL})}<b class="${x.isNew?'new':'dup'}">${x.isNew?'MỚI!':'🪙 +'+x.xu}</b></div>`).join('')}</div>
    <p class="muted">${res.some(x=>x.r==='l')?'🌈 Bạn quay trúng thẻ Huyền thoại!':'Chưa ra Huyền thoại: bộ đếm bảo hiểm tăng lên.'} · Còn 🔑 ${me.tkeys}</p><button class="btn" data-close>Tuyệt!</button>`;
  m.classList.add('on');m.querySelector('[data-close]').onclick=()=>{m.classList.remove('on');afterModal()};
  best==='l'?SFX.win():SFX.coin();
  FX.burst(innerWidth/2,innerHeight*.3,{n:best==='l'?90:40,c:best==='l'?['#ff5ad5','#5ad5ff','#ffe36a','#6dff9a','#ffffff']:['#ffd24a','#fff1a0','#ffffff'],sp:420,life:.9,s:8,g:300,vy:-200});
}

/* ---------- Khung thông tin khi rê chuột vào thẻ (máy tính) / nhấn giữ (điện thoại) ---------- */
let cardTip=null,tipId=null,suppressClick=false;
function tipHTML(id){
  const d=CARDS[id],own=isOwned(me,id),c=d.c,cost=Array.isArray(c)?(c[0]===c[1]?c[0]:`${c[0]} (nâng cấp ${c[1]})`):c;
  const where=d.r==='s'?'Thẻ khởi đầu':d.g?'🎰 Chỉ có từ Quay thẻ':`🗺️ Rơi ở Màn ${d.a}: ${ACTS[d.a].n} · sở hữu bằng 🎰 Quay thẻ`;
  return `<div class="tipcard" style="--cw:150px">${cardHTML({id,up:false})}</div>
    <div class="tipinfo"><b class="rt-${d.r}t">${d.ic} ${d.n}</b>
      <span>${RARITY_N[d.r]} · ${TYPE_N[d.t]} · Phí ${cost}${d.ex?' · Tiêu hao':''}</span>${d.fxc?'<span>🔁 Thẻ hiệu ứng: mỗi lượt dùng 1 lần</span>':''}
      <span>${where}</span><span>${own?'✔ Đã sở hữu':'🔒 Chưa sở hữu'}</span>
      <div class="tipup">✨ <b>Nâng cấp:</b> ${descOf({id,up:true})}</div></div>`;
}
function showTip(id,x,y){
  if(!cardTip){cardTip=document.createElement('div');cardTip.id='cardTip';document.body.appendChild(cardTip)}
  if(tipId!==id){cardTip.innerHTML=tipHTML(id);tipId=id}
  cardTip.style.display='flex';moveTip(x,y);
}
function moveTip(x,y){
  if(!cardTip)return;const w=cardTip.offsetWidth,h=cardTip.offsetHeight,pad=10;
  let left=x+18,top=y+14;
  if(left+w>innerWidth-pad)left=x-w-18;      // hết chỗ bên phải thì mở sang trái
  left=Math.max(pad,Math.min(left,innerWidth-w-pad));
  top=Math.max(pad,Math.min(top,innerHeight-h-pad));
  cardTip.style.left=left+'px';cardTip.style.top=top+'px';
}
function hideTip(){if(cardTip)cardTip.style.display='none';tipId=null}

function initCards(){
  const pane=$('#paneCards');
  pane.addEventListener('mouseover',e=>{if(e.pointerType==='touch'||!matchMedia('(hover:hover)').matches)return;const m=e.target.closest('.mc');if(m&&m.dataset.cid)showTip(m.dataset.cid,e.clientX,e.clientY)});
  pane.addEventListener('mousemove',e=>{if(tipId)moveTip(e.clientX,e.clientY)});
  pane.addEventListener('mouseout',e=>{const m=e.target.closest('.mc');if(m&&!m.contains(e.relatedTarget))hideTip()});
  pane.addEventListener('scroll',hideTip,true);
  // điện thoại: nhấn giữ thẻ để xem thông tin (không thêm/bỏ thẻ)
  let lp=null;
  pane.addEventListener('pointerdown',e=>{if(e.pointerType!=='touch')return;const m=e.target.closest('.mc');if(!m||!m.dataset.cid)return;
    clearTimeout(lp);lp=setTimeout(()=>{suppressClick=true;showCardInfo(m.dataset.cid)},450)});
  for(const ev of ['pointerup','pointercancel','pointermove'])pane.addEventListener(ev,()=>clearTimeout(lp));
  pane.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.stopImmediatePropagation();e.preventDefault()}},true);
  pane.onclick=e=>{
    const sub=e.target.closest('[data-sub]');if(sub){cdSub=sub.dataset.sub;SFX.card();renderCards();return}
    const add=e.target.closest('[data-add]');if(add){const id=add.dataset.add;if(canAdd(id)){draft.push(id);SFX.card();renderCards()}else toast(draft.length>=DECK_SIZE?`Bộ bài đã đủ ${DECK_SIZE} thẻ. Chạm một thẻ phía trên để bỏ.`:(deckProblem([...draft,id],me,true)||'Không thêm được'),1800);return}
    const rm=e.target.closest('[data-rm]');if(rm){draft.splice(+rm.dataset.rm,1);SFX.card();renderCards();return}
    const dk=e.target.closest('[data-dk]');if(dk){if(dk.dataset.dk==='save')saveDeck();else{draft=[...HEROES[me.hero].deck];SFX.card();renderCards()}return}
    const cc=e.target.closest('[data-colclaim]');if(cc){const a=cc.dataset.colclaim;claimCollection(a==='all'?'all':+a);return}
    const act=e.target.closest('[data-act]');if(act){cdAct=+act.dataset.act;SFX.card();renderCards();return}
    const info=e.target.closest('[data-info]');if(info){showCardInfo(info.dataset.info);return}
    const pull=e.target.closest('[data-pull]');if(pull){
      SFX.unlock();const n=+pull.dataset.pull,cost=n===10?GACHA.cost10:GACHA.cost1*n;
      if(me.tkeys<cost){toast(`🔑 Cần ${cost} chìa khóa thẻ (có ${me.tkeys}). Mua ở 🏪 Cửa hàng hoặc nhận từ trùm.`,2600);return}
      const res=gachaPull(n);persistHome();renderHead();renderCards();showPullResult(res,n);return}
    if(e.target.closest('[data-goshop]')){setTab('shop');return}
    if(e.target.closest('[data-golegend]')){cdSub='col';cdAct=0;renderCards();return}
  };
}
