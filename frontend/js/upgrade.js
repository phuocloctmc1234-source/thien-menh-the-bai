'use strict';
/* =========================================================
   CUỘN CƯỜNG HÓA TRANG BỊ
   - Mỗi Ô trang bị (vũ khí, mũ, giáp, găng tay, giày, nhẫn) có 1 loại cuộn riêng → 6 loại cuộn. Cuộn của ô nào chỉ nâng được ô đó.
   - Cấp cường hóa gắn với Ô (không gắn với món): đổi sang món khác thì cấp vẫn giữ và áp dụng cho món mới. Cấp tối đa UPG_MAX.
   - Mỗi cấp cộng thêm chỉ số cho ô đang mặc (UPG_TOTAL = tổng thưởng khi đạt cấp tối đa, chia đều theo cấp; luôn có Máu nên cấp nào cũng có lợi).
   - Nâng 1 cấp tốn UPG_COST[cấp hiện tại] = số cuộn + xu 🪙 (chỉ nâng ở trang chủ, tab Trang bị → ⬆️ Cường hóa). Không có xác suất thất bại.
   - Nguồn cuộn: rương Kho Báu, trận thường (hiếm), tinh anh, trùm, rương nhiệm vụ hằng ngày, quà sưu tập thẻ, cửa hàng (cuộn ngẫu nhiên).
   - Dữ liệu trong hồ sơ: upg = {ô: cấp}, scrolls = {ô: số cuộn}.
   ========================================================= */
const UPG_MAX=10;
const UPG_TOTAL={ // tổng chỉ số cộng thêm khi ô đạt cấp tối đa
  weapon:{atk:5,hp:10},
  helm:{def:3,hp:10},
  armor:{def:4,hp:15},
  gloves:{atk:2,def:2,hp:10},
  boots:{def:3,hp:10},
  ring:{atk:2,hp:10},
};
const UPG_COST=[ // nâng từ cấp L lên L+1: s = số cuộn, c = xu 🪙
  {s:1,c:50},{s:2,c:80},{s:3,c:120},{s:4,c:180},{s:5,c:250},{s:6,c:340},{s:8,c:450},{s:10,c:600},{s:12,c:800},{s:15,c:1000}]; // số cuộn tăng dần theo cấp (tổng 66 cuộn mỗi ô để lên +10)
const UPG_DROP={battle:.08,elite:.35}; // tỉ lệ rơi 1 cuộn sau trận (trùm luôn rơi 2)
const SCROLL_SLOTS=Object.keys(SLOTS);
const scrollIc=s=>`<img class="eic" src="img/scroll/${s}.webp" alt="" draggable="false">`;
const scrollName=s=>`Cuộn Cường Hóa ${SLOTS[s].n}`;

const upgLevel=(R,slot)=>Math.min(UPG_MAX,(R.upg&&R.upg[slot])||0);
const upgBonus=(slot,lv)=>{const o={atk:0,def:0,hp:0},T=UPG_TOTAL[slot];for(const k in T)o[k]=Math.floor(T[k]*lv/UPG_MAX);return o};
/* Tổng thưởng cường hóa của mọi ô ĐANG CÓ trang bị (cộng vào gearBonus) */
function upgBonusAll(R){const t={atk:0,def:0,hp:0};if(!R||!R.equip)return t;
  for(const s of SCROLL_SLOTS)if(R.equip[s]){const b=upgBonus(s,upgLevel(R,s));for(const k in t)t[k]+=b[k]}return t}
const upgDiffText=(slot,lv)=>{const a=upgBonus(slot,lv),b=upgBonus(slot,lv+1);
  return Object.keys(STAT_N).filter(k=>b[k]>a[k]).map(k=>`${STAT_N[k].ic}+${b[k]-a[k]}`).join(' ')};
const upgTotalText=(slot,lv)=>{const b=upgBonus(slot,lv);return Object.keys(STAT_N).filter(k=>b[k]).map(k=>`${STAT_N[k].ic}+${b[k]}`).join(' ')||'—'};

function gainScroll(slot,n=1,R=G()){if(!R)return;if(!R.scrolls)R.scrolls={};R.scrolls[slot]=(R.scrolls[slot]||0)+n}
const randomScrollSlot=()=>SCROLL_SLOTS[Math.floor(Math.random()*SCROLL_SLOTS.length)];
/* Tặng n cuộn ngẫu nhiên (mỗi cuộn một ô ngẫu nhiên); trả về dòng mô tả để hiện trong bảng quà */
function grantScrolls(R,n){const got={};for(let i=0;i<n;i++){const s=randomScrollSlot();gainScroll(s,1,R);got[s]=(got[s]||0)+1}
  return `${scrollIc(Object.keys(got)[0])} +${n} cuộn cường hóa (${Object.keys(got).map(s=>`${SLOTS[s].n}${got[s]>1?' ×'+got[s]:''}`).join(', ')})`}
const scrollTotal=R=>SCROLL_SLOTS.reduce((s,k)=>s+((R.scrolls&&R.scrolls[k])||0),0);
const upgCanAfford=(R,slot)=>{const L=upgLevel(R,slot);if(L>=UPG_MAX)return false;const c=UPG_COST[L];return ((R.scrolls&&R.scrolls[slot])||0)>=c.s&&(R.coins||0)>=c.c};
/* Số ô có thể nâng ngay (chấm đỏ trên nút ⬆️ Cường hóa); chỉ tính ô đang có trang bị */
const upgReady=R=>SCROLL_SLOTS.filter(s=>R.equip&&R.equip[s]&&upgCanAfford(R,s)).length;

/* Nâng 1 cấp cho một ô (ở trang chủ) */
function upgradeSlot(slot){
  const R=me;if(!hasHero()||!SLOTS[slot])return false;ensureGear(R);ensureMeta(R);
  const L=upgLevel(R,slot);if(L>=UPG_MAX){toast('Ô này đã đạt cấp tối đa',1400);return false}
  const c=UPG_COST[L],have=R.scrolls[slot]||0;
  if(have<c.s){toast(`Thiếu cuộn: cần ${c.s} ${scrollName(slot)} (có ${have})`,1800);return false}
  if(R.coins<c.c){toast(`Thiếu xu: cần 🪙 ${c.c} (có ${R.coins})`,1800);return false}
  const h0=gearBonus(R).hp;R.scrolls[slot]-=c.s;R.coins-=c.c;R.upg[slot]=L+1;
  shiftMaxHp(R,gearBonus(R).hp-h0);dailyAdd('upgrade');SFX.buff();
  persistHome();renderHead();if(typeof renderBag==='function')renderBag();
  return true}

function showUpgrade(){
  if(!hasHero())return;const R=me;ensureGear(R);ensureMeta(R);const m=$('#modal');
  const rows=SCROLL_SLOTS.map(s=>{const L=upgLevel(R,s),max=L>=UPG_MAX,c=max?null:UPG_COST[L],have=R.scrolls[s]||0,it=EQUIP[R.equip[s]];
    const okS=!max&&have>=c.s,okC=!max&&R.coins>=c.c,can=!max&&okS&&okC;
    return `<li class="upr ${max?'max':can?'can':''}">
      <span class="upi">${scrollIc(s)}<b>${have}</b></span>
      <div class="upm"><div class="upn"><b>${SLOTS[s].ic} ${SLOTS[s].n}</b><span class="upl">+${L}<small>/${UPG_MAX}</small></span></div>
        <div class="upbar"><i style="width:${L/UPG_MAX*100}%"></i></div>
        <div class="upd">${it?`<span class="upit">${it.ic} ${it.n}</span> · Đang cộng ${upgTotalText(s,L)}`:`<span class="upit none">Ô trống · chưa cộng chỉ số (cần mặc trang bị)</span>`}</div>
        <div class="upn2">${max?'<b>✔ Cấp tối đa</b>':`Lên +${L+1}: <b>${upgDiffText(s,L)}</b> · <span class="${okS?'ok':'no'}">${scrollIc(s)} ${c.s}</span> <span class="${okC?'ok':'no'}">🪙 ${c.c}</span>`}</div></div>
      <button class="upbtn" data-up="${s}" ${can?'':'disabled'}>${max?'Tối đa':'Nâng cấp'}</button></li>`}).join('');
  m.innerHTML=`<div class="dwrap"><h3>⬆️ Cường hóa trang bị</h3>
    <p class="muted">Mỗi ô dùng một loại cuộn riêng. Cấp gắn với <b>ô</b> nên đổi trang bị vẫn giữ cấp. Tối đa +${UPG_MAX}.</p>
    <div class="upstat">🪙 <b>${R.coins}</b> xu · 📜 <b>${scrollTotal(R)}</b> cuộn</div>
    <ul class="uplist">${rows}</ul>
    <p class="muted">Kiếm cuộn từ rương Kho Báu, tinh anh, trùm, nhiệm vụ hằng ngày, sưu tập thẻ hoặc mua ở 🏪 Cửa hàng.</p>
    <button class="btn" data-close>Đóng</button></div>`;
  m.classList.add('on');
  m.querySelector('[data-close]').onclick=()=>{closeModal();afterModal()};
  m.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>{if(upgradeSlot(b.dataset.up))showUpgrade()});
}
