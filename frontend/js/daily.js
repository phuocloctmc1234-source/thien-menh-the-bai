'use strict';
/* =========================================================
   NHIỆM VỤ HẰNG NGÀY
   - Mỗi ngày (giờ máy, đổi lúc 0h) có 9 nhiệm vụ: 3 dễ (10 điểm), 3 vừa (15 điểm), 3 khó (25 điểm) = 150 điểm, nhưng điểm NĂNG ĐỘNG
     tối đa chỉ 100: người chơi tự chọn làm việc hợp mình. Đủ 100 điểm thì các nhiệm vụ còn lại bị khóa, không làm thêm được.
   - Làm xong nhiệm vụ là tự cộng điểm. Đạt các mốc 20/40/60/80/100 điểm thì mở được rương quà tương ứng (chạm rương để nhận).
   - Bộ nhiệm vụ chọn theo ngày (cùng một ngày thì mọi thiết bị thấy cùng bộ) và được lưu cùng hồ sơ: hồ sơ.daily
       { d:'YYYY-MM-DD', q:[mã nhiệm vụ], prog:{mã:số đã làm}, ms:{mốc:1 đã nhận} }
   - Các nơi trong game gọi dailyAdd(sự kiện, số lượng): kill, battle, elite, boss, flawless, card, atk, skill, pow, chest, equip.
   ========================================================= */
const DAILY_QUESTS={ // t = bậc độ khó (1 dễ · 2 vừa · 3 khó), ev = sự kiện được đếm
  kill15:{t:1,ev:'kill',goal:15,n:'Hạ 15 kẻ địch'},
  battle3:{t:1,ev:'battle',goal:3,n:'Thắng 3 trận chiến'},
  card25:{t:1,ev:'card',goal:25,n:'Dùng 25 thẻ bài'},
  atk12:{t:1,ev:'atk',goal:12,n:'Dùng 12 thẻ Tấn công'},
  skill10:{t:1,ev:'skill',goal:10,n:'Dùng 10 thẻ Kỹ năng'},
  elite1:{t:2,ev:'elite',goal:1,n:'Đánh bại 1 kẻ địch tinh anh'},
  flaw1:{t:2,ev:'flawless',goal:1,n:'Thắng 1 trận mà không mất Máu'},
  chest1:{t:2,ev:'chest',goal:1,n:'Mở 1 rương Kho Báu (🗝️)'},
  pow3:{t:2,ev:'pow',goal:3,n:'Dùng 3 thẻ Năng lực'},
  equip1:{t:2,ev:'equip',goal:1,n:'Mặc hoặc thay 1 trang bị'},
  upg1:{t:2,ev:'upgrade',goal:1,n:'Cường hóa 1 cấp trang bị'},
  boss1:{t:3,ev:'boss',goal:1,n:'Đánh bại 1 trùm'},
  kill35:{t:3,ev:'kill',goal:35,n:'Hạ 35 kẻ địch'},
  battle8:{t:3,ev:'battle',goal:8,n:'Thắng 8 trận chiến'},
  elite2:{t:3,ev:'elite',goal:2,n:'Đánh bại 2 kẻ địch tinh anh'},
  card60:{t:3,ev:'card',goal:60,n:'Dùng 60 thẻ bài'},
};
const DAILY_PTS={1:10,2:15,3:25};   // điểm mỗi nhiệm vụ theo bậc
const DAILY_MS=[                    // mốc điểm năng động → quà (coins = xu 🪙, gems = ngọc 💠, keys = chìa khóa 🗝️, tk = chìa khóa thẻ 🔑, eq = 1 trang bị)
  {p:20,r:{coins:100}},
  {p:40,r:{coins:150,keys:1,sc:1}},
  {p:60,r:{gems:10,tk:1}},
  {p:80,r:{coins:300,keys:2,sc:2}},
  {p:100,r:{gems:25,tk:2,sc:3,eq:'elite'}},
];
const DAILY_MAX=100;            // điểm năng động tối đa mỗi ngày
const DAILY_PER_TIER=3;         // số nhiệm vụ mỗi bậc → 9 nhiệm vụ, tổng 150 điểm (nhiều hơn mức tối đa để có lựa chọn)
const DAILY_IC={kill:'⚔️',battle:'🏆',elite:'👹',boss:'👑',flawless:'🛡️',card:'🎴',atk:'🗡️',skill:'✨',pow:'💫',chest:'🧰',equip:'🎽',upgrade:'⬆️'};
const dailyRewardShort=r=>[r.coins&&`🪙${r.coins}`,r.gems&&`💠${r.gems}`,r.keys&&`🗝️${r.keys}`,r.tk&&`🔑${r.tk}`,r.sc&&`📜${r.sc}`,r.eq&&'🎁'].filter(Boolean).join(' ');

const dailyKey=(d=new Date())=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function dailyRng(seed){let h=2166136261;for(const c of seed){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
  return()=>{h=Math.imul(h^h>>>15,2246822507);h=Math.imul(h^h>>>13,3266489909);h^=h>>>16;return(h>>>0)/4294967296}}
function dailyPick(key){ // DAILY_PER_TIER nhiệm vụ mỗi bậc, xác định theo ngày
  const rnd=dailyRng('thebai-'+key),out=[];
  for(const t of [1,2,3]){const ids=Object.keys(DAILY_QUESTS).filter(k=>DAILY_QUESTS[k].t===t);
    for(let i=ids.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]]}
    out.push(...ids.slice(0,DAILY_PER_TIER))}
  return out}
/* Lấy (và làm mới nếu sang ngày mới) dữ liệu nhiệm vụ của hồ sơ R */
function ensureDaily(R){const k=dailyKey();
  if(!R.daily||R.daily.d!==k)R.daily={d:k,q:dailyPick(k),prog:{},ms:{}};
  else if(!Array.isArray(R.daily.q)||R.daily.q.length!==dailyPick(k).length||R.daily.q.some(id=>!DAILY_QUESTS[id]))R.daily.q=dailyPick(k); // đổi số nhiệm vụ: giữ nguyên tiến độ đã làm trong ngày
  return R.daily}
const dailyDone=(D,id)=>(D.prog[id]||0)>=DAILY_QUESTS[id].goal;
const dailyPoints=D=>Math.min(DAILY_MAX,D.q.reduce((s,id)=>s+(dailyDone(D,id)?DAILY_PTS[DAILY_QUESTS[id].t]:0),0)); // tối đa 100
const dailyFull=D=>dailyPoints(D)>=DAILY_MAX; // đủ điểm: không làm thêm nhiệm vụ nữa
/* Có rương nào nhận được chưa (chấm đỏ ở nút Nhiệm vụ) */
const dailyReady=R=>{const D=ensureDaily(R),p=dailyPoints(D);return DAILY_MS.filter(m=>p>=m.p&&!D.ms[m.p]).length};

/* Ghi nhận một sự kiện trong lúc chơi hoặc ở trang chủ */
function dailyAdd(ev,n=1){
  const R=G();if(!R)return;const D=ensureDaily(R);
  for(const id of D.q){const Q=DAILY_QUESTS[id];if(dailyFull(D))return; // đủ 100 điểm: các nhiệm vụ còn lại bị khóa
    if(Q.ev!==ev||dailyDone(D,id))continue;
    const before=dailyPoints(D);D.prog[id]=Math.min(Q.goal,(D.prog[id]||0)+n);
    if(dailyDone(D,id)){const gain=dailyPoints(D)-before;
      toast(`🎯 Hoàn thành: <b>${Q.n}</b><br>+${gain} điểm năng động${dailyFull(D)?' · <b>Đủ 100 điểm hôm nay!</b>':''}`,2400);SFX.buff();if(!run)updateDailyBadge()}}}

function updateDailyBadge(){const b=$('#dBadge');if(!b)return;const n=hasHero()?dailyReady(me):0;b.textContent=n||'';b.style.display=n?'':'none'}

const dailyReset=()=>{const d=new Date(),e=new Date(d.getFullYear(),d.getMonth(),d.getDate()+1);let s=Math.max(0,Math.floor((e-d)/1000));
  const p=x=>String(x).padStart(2,'0');return `${p(Math.floor(s/3600))}:${p(Math.floor(s%3600/60))}:${p(s%60)}`};
let dailyTimer=0;
function showDaily(){
  if(!hasHero()){toast('Hãy chọn nhân vật trước để nhận nhiệm vụ',1800);return}
  const R=me,D=ensureDaily(R),pts=dailyPoints(D),m=$('#modal');
  const ms=DAILY_MS.map(x=>{const st=D.ms[x.p]?'done':pts>=x.p?'ready':'lock';
    return `<button class="dmile ${st}" data-ms="${x.p}" style="left:${x.p/DAILY_MAX*100}%"><span class="dg">${st==='done'?'✔':'🎁'}</span><b>${x.p}</b><small>${dailyRewardShort(x.r)}</small></button>`}).join('');
  const full=dailyFull(D);
  const order=D.q.map((id,i)=>({id,i})).sort((u,v)=>dailyDone(D,u.id)-dailyDone(D,v.id)||u.i-v.i); // việc chưa xong lên trước
  const list=order.map(({id})=>{const Q=DAILY_QUESTS[id],v=D.prog[id]||0,ok=v>=Q.goal;
    const lock=!ok&&full;
    return `<li class="dq t${Q.t} ${ok?'ok':''} ${lock?'lock':''}"><span class="dqi">${ok?'✔':lock?'🔒':DAILY_IC[Q.ev]||'🎯'}</span><div class="dqm"><div class="dqn"><b>${Q.n}</b><span class="dqp">+${DAILY_PTS[Q.t]}⚡</span></div><div class="dqbar"><i style="width:${Math.max(v?4:0,Math.min(100,v/Q.goal*100))}%"></i></div></div><span class="dqc">${v}/${Q.goal}</span></li>`}).join('');
  m.innerHTML=`<div class="dwrap"><h3>🎯 Nhiệm vụ hằng ngày</h3>
    <div class="dtop"><div class="dscore"><small>ĐIỂM NĂNG ĐỘNG</small><b>${pts}</b><span>/${DAILY_MAX}</span></div><div class="dreset">⏳ Làm mới sau <b id="dCount">${dailyReset()}</b></div></div>
    <div class="dmeter"><div class="dfill" style="width:${pts/DAILY_MAX*100}%"></div>${ms}</div>
    <p class="muted dhint">${full?'🎉 Đã đủ 100 điểm hôm nay · các nhiệm vụ còn lại đã khóa. Nhớ nhận hết rương quà nhé!':`Có ${D.q.length} nhiệm vụ nhưng chỉ cần đủ 100 điểm: hãy chọn việc hợp với bạn · chạm rương khi đủ điểm để nhận quà`}</p>
    <ul class="dqlist">${list}</ul>
    <button class="btn" data-close>Đóng</button></div>`;
  m.classList.add('on');
  clearInterval(dailyTimer);dailyTimer=setInterval(()=>{const c=$('#dCount');if(!c||!m.classList.contains('on')){clearInterval(dailyTimer);return}
    c.textContent=dailyReset();if(c.textContent==='00:00:00'){clearInterval(dailyTimer);showDaily();updateDailyBadge()}},1000);
  m.querySelector('[data-close]').onclick=()=>{clearInterval(dailyTimer);closeModal();afterModal()};
  m.querySelectorAll('[data-ms]').forEach(b=>b.onclick=()=>{
    const p=+b.dataset.ms;
    if(D.ms[p]){toast('Đã nhận rương này rồi',1200);return}
    if(pts<p){toast(`Cần ${p} điểm năng động (đang có ${pts})`,1600);return}
    claimDailyChest(p)});
}
function claimDailyChest(p){
  const R=me,D=ensureDaily(R),M=DAILY_MS.find(x=>x.p===p);if(!M||D.ms[p]||dailyPoints(D)<p)return;
  ensureMeta(R);D.ms[p]=1;const r=M.r,lines=[];
  if(r.coins){R.coins+=r.coins;lines.push(`🪙 +${r.coins} xu`)}
  if(r.gems){R.gems+=r.gems;lines.push(`💠 +${r.gems} ngọc`)}
  if(r.keys){R.keys=(R.keys||0)+r.keys;lines.push(`🗝️ +${r.keys} chìa khóa`)}
  if(r.tk){R.tkeys=(R.tkeys||0)+r.tk;lines.push(`🔑 +${r.tk} chìa khóa thẻ`)}
  if(r.sc)lines.push(grantScrolls(R,r.sc));
  if(r.eq){const id=rollEquip(r.eq,'u'),worn=gainEquip(id,true);lines.push(equipLine(EQUIP[id],worn))}
  persistHome();renderHead();updateDailyBadge();
  clearInterval(dailyTimer);
  rewardModal(`🎁 Quà năng động ${p}`,lines);
}
function initDaily(){const b=$('#btnDaily');if(b)b.onclick=()=>{SFX.card();showDaily()};updateDailyBadge()}
initDaily();
