'use strict';
/* =========================================================
   DỮ LIỆU: TRẠNG THÁI, ANH HÙNG, THẺ BÀI, BẢO VẬT, KẺ ĐỊCH
========================================================= */
const STS={
  str:{n:'Sức mạnh',ic:'💪',d:'Mỗi đòn đánh gây thêm X sát thương.'},
  weak:{n:'Yếu',ic:'🥀',d:'Gây ít hơn 25% sát thương. Giảm 1 mỗi lượt.'},
  vuln:{n:'Dễ vỡ',ic:'💔',d:'Nhận thêm 50% sát thương từ đòn đánh. Giảm 1 mỗi lượt.'},
  poison:{n:'Độc',ic:'☠️',d:'Mất X Máu (xuyên Giáp) đầu lượt, sau đó giảm 1.'},
  burn:{n:'Thiêu đốt',ic:'🔥',d:'Mất X Máu (xuyên Giáp) đầu lượt, sau đó giảm 1.'},
  thorns:{n:'Gai',ic:'🌵',d:'Kẻ tấn công nhận X sát thương mỗi đòn.'},
  regen:{n:'Hồi xuân',ic:'🌿',d:'Hồi X Máu đầu mỗi lượt.'},
  energy:{n:'Chiến ý',ic:'⚡',d:'Nhận thêm X Năng lượng đầu mỗi lượt.'},
  plate:{n:'Băng tâm',ic:'🏔️',d:'Nhận X Giáp đầu mỗi lượt.'},
  keep:{n:'Bất động',ic:'🗿',d:'Giáp không mất đi khi bắt đầu lượt mới.'},
  // ---- trạng thái bổ sung (bộ thẻ mở rộng theo màn) ----
  freeze:{n:'Đóng băng',ic:'🧊',d:'Bỏ qua hành động kế tiếp (X lượt). Trùm chỉ bị đóng băng tối đa 1 lượt.'},
  ward:{n:'Kết giới',ic:'🔮',d:'Chặn hoàn toàn X đòn đánh kế tiếp.'},
  fort:{n:'Kiên cố',ic:'🏰',d:'Mọi Giáp nhận từ thẻ được cộng thêm X.'},
  leech:{n:'Hút máu',ic:'🧛',d:'Hồi X Máu mỗi khi đòn đánh gây sát thương lên Máu.'},
  mark:{n:'Dấu ấn',ic:'🎯',d:'Mỗi đòn đánh trúng gây thêm X sát thương. Giảm 1 mỗi lượt.'},
  sap:{n:'Suy nhược',ic:'🪫',d:'Mỗi đòn đánh gây ít hơn X sát thương. Giảm 1 mỗi lượt.'},
  bleed:{n:'Chảy máu',ic:'🩸',d:'Mất X Máu (xuyên Giáp) mỗi khi ra đòn tấn công, sau đó giảm 1.'},
};
const STS_FX={str:'buffRed',weak:'debuff',vuln:'debuff',poison:'poisonFx',burn:'burnFx',thorns:'thorns',regen:'heal',energy:'buffGold',plate:'iceArmor',keep:'buffGold',freeze:'frost',ward:'shield',fort:'stoneWall',leech:'buffRed',mark:'curse',sap:'debuff',bleed:'claw'};

/* Hình nhân vật (bảng sprite). sheet = dải ngang nhiều khung cùng cỡ: 0 đứng yên · 1 phòng thủ · 2 tấn công · 3 hiệu ứng.
   face = ảnh chân dung vuông (ảnh đại diện, thẻ chọn nhân vật). ar = tỉ lệ rộng/cao của một khung. Nhân vật chưa có art thì dùng emoji (ic). */
const POSES={idle:0,def:1,atk:2,fx:3};
const HERO_ART={
  kiem:{sheet:'img/hero-kiem.webp',face:'img/hero-kiem-face.webp',frames:4,ar:1.0274},
};
const HEROES={
  kiem:{art:HERO_ART.kiem,n:'Lạc Phong',title:'Kiếm Khách',ic:'🤺',hp:80,atk:6,def:4,col:'#ff6a5a',relic:'huyhieu',desc:'Bậc thầy đao kiếm. Tấn công dồn dập, tích Sức mạnh và kết liễu bằng đòn chí mạng.',deck:['chem','chem','chem','chem','chem','thu','thu','thu','thu','dam']},
  bang:{n:'Tuyết Lan',title:'Băng Pháp Sư',ic:'🧙‍♀️',hp:68,atk:7,def:3,col:'#5ab8ff',relic:'tinhthe',desc:'Điều khiển băng tuyết và sấm sét. Làm suy yếu kẻ địch, tấn công diện rộng.',deck:['bangtien','bangtien','bangtien','bangtien','bangtien','thu','thu','thu','thu','hankhi']},
  thach:{n:'Thạch Hổ',title:'Võ Tăng',ic:'🧘‍♂️',hp:88,atk:5,def:6,col:'#5fd068',relic:'tranghat',desc:'Thân cứng như đá. Phòng thủ vững chắc, phản đòn bằng Giáp và Gai.',deck:['quyen','quyen','quyen','quyen','thu','thu','thu','thu','thu','chuong']},
};

/* t: atk|skill|pow  r: s(khởi đầu) c u r   tg: one|all|self|rand
   dm = sát thương theo % TẤN CÔNG của nhân vật, b = giáp theo % PHÒNG THỦ của nhân vật
   (ví dụ dm:100 → gây đúng bằng chỉ số Tấn công; b:160 → nhận 160% chỉ số Phòng thủ)
   x/y = giá trị cố định khác; [thường, nâng cấp] */
const CARDS={
  thu:{n:'Phòng Thủ',c:1,t:'skill',r:'s',h:'*',ic:'🛡️',b:[100,160],tg:'self',d:'Nhận {B} Giáp.',play:async c=>H.blk(c.B,'shield')},
  // ---- KIẾM KHÁCH ----
  chem:{n:'Chém',c:1,t:'atk',r:'s',h:'kiem',ic:'🗡️',dm:[100,150],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'slash')},
  dam:{n:'Đâm Xuyên',c:2,t:'atk',r:'s',h:'kiem',ic:'🔱',dm:[135,165],x:[2,3],tg:'one',d:'Gây {D} sát thương. Gây {X} Dễ vỡ.',play:async c=>{await H.atk(c.t,c.D,'pierce');await H.st(c.t,'vuln',c.X)}},
  song:{n:'Song Kiếm',c:1,t:'atk',r:'c',h:'kiem',ic:'⚔️',dm:[85,115],tg:'one',d:'Gây {D} sát thương 2 lần.',play:c=>H.atk(c.t,c.D,'slash',2)},
  loc:{n:'Lốc Xoáy Kiếm',c:1,t:'atk',r:'c',h:'kiem',ic:'🌪️',dm:[115,165],tg:'all',d:'Gây {D} sát thương lên TẤT CẢ kẻ địch.',play:c=>H.atkAll(c.D,'whirl')},
  khi:{n:'Kiếm Khí',c:1,t:'atk',r:'c',h:'kiem',ic:'🌙',dm:[135,185],tg:'one',d:'Gây {D} sát thương. Rút 1 thẻ.',play:async c=>{await H.atk(c.t,c.D,'wave');await H.draw(1)}},
  phan:{n:'Phản Đòn',c:1,t:'skill',r:'c',h:'kiem',ic:'🌵',b:[100,140],x:[2,3],tg:'self',d:'Nhận {B} Giáp và {X} Gai.',play:async c=>{await H.blk(c.B,'shield');await H.st(B.p,'thorns',c.X)}},
  huyet:{n:'Huyết Chiến',c:0,t:'skill',r:'c',h:'kiem',ic:'🩸',x:[2,2],y:[4,2],tg:'self',d:'Mất {Y} Máu. Nhận {X} Năng lượng.',play:async c=>{await FXR.blood(H.pt(B.p));H.loseHp(c.Y);H.gainE(c.X)}},
  hoa:{n:'Hỏa Kiếm',c:2,t:'atk',r:'u',h:'kiem',ic:'🔥',dm:[200,265],x:[3,5],tg:'one',d:'Gây {D} sát thương. Gây {X} Thiêu đốt.',play:async c=>{await H.atk(c.t,c.D,'fire');await H.st(c.t,'burn',c.X)}},
  no:{n:'Nộ Khí',c:1,t:'pow',r:'u',h:'kiem',ic:'😤',x:[2,3],tg:'self',d:'Nhận {X} Sức mạnh.',play:c=>H.st(B.p,'str',c.X)},
  lien:{n:'Chém Liên Hoàn',c:2,t:'atk',r:'u',h:'kiem',ic:'🌀',dm:[65,85],tg:'one',d:'Gây {D} sát thương 4 lần.',play:c=>H.atk(c.t,c.D,'slash',4)},
  tram:{n:'Trảm Long',c:3,t:'atk',r:'r',h:'kiem',ic:'🐉',dm:[500,665],tg:'one',ex:1,d:'Gây {D} sát thương. Tiêu hao.',play:c=>H.atk(c.t,c.D,'bigSlash')},
  chieny:{n:'Chiến Ý',c:[2,1],t:'pow',r:'r',h:'kiem',ic:'⚡',tg:'self',d:'Đầu mỗi lượt nhận thêm 1 Năng lượng.',play:c=>H.st(B.p,'energy',1)},
  // ---- BĂNG PHÁP SƯ ----
  bangtien:{n:'Băng Tiễn',c:1,t:'atk',r:'s',h:'bang',ic:'❄️',dm:[100,150],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'iceShard')},
  hankhi:{n:'Hàn Khí',c:1,t:'atk',r:'s',h:'bang',ic:'🌬️',dm:[65,100],x:[2,3],tg:'one',d:'Gây {D} sát thương. Gây {X} Yếu.',play:async c=>{await H.atk(c.t,c.D,'frost');await H.st(c.t,'weak',c.X,true)}},
  baotuyet:{n:'Bão Tuyết',c:2,t:'atk',r:'c',h:'bang',ic:'🌨️',dm:[115,165],tg:'all',d:'Gây {D} sát thương và 1 Yếu lên TẤT CẢ kẻ địch.',play:async c=>{await H.atkAll(c.D,'blizzard');for(const e of H.alive())H.st(e,'weak',1,true)}},
  sam:{n:'Lôi Điện',c:1,t:'atk',r:'c',h:'bang',ic:'⚡',dm:[165,235],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'lightning')},
  banggiap:{n:'Băng Giáp',c:1,t:'skill',r:'c',h:'bang',ic:'🧊',b:[160,220],tg:'self',d:'Nhận {B} Giáp.',play:c=>H.blk(c.B,'iceArmor')},
  linhluc:{n:'Linh Lực',c:[1,0],t:'skill',r:'c',h:'bang',ic:'✨',x:[2,2],tg:'self',d:'Rút {X} thẻ.',play:async c=>{await FXR.arcane(H.pt(B.p));await H.draw(c.X)}},
  nguyen:{n:'Lời Nguyền',c:1,t:'skill',r:'u',h:'bang',ic:'🔮',x:[2,3],tg:'one',ex:1,d:'Gây {X} Yếu và {X} Dễ vỡ. Tiêu hao.',play:async c=>{await FXR.curse(H.pt(B.p),H.pt(c.t));H.st(c.t,'weak',c.X,true);H.st(c.t,'vuln',c.X,true)}},
  tinhthe:{n:'Tinh Thể Ma Lực',c:0,t:'skill',r:'u',h:'bang',ic:'💎',x:[2,3],tg:'self',ex:1,d:'Nhận {X} Năng lượng. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(c.X)}},
  hapthu:{n:'Hấp Thụ',c:2,t:'atk',r:'u',h:'bang',ic:'🧛',dm:[135,200],x:[4,6],tg:'one',d:'Gây {D} sát thương. Hồi {X} Máu.',play:async c=>{await H.atk(c.t,c.D,'drain');await H.heal(c.X,true)}},
  bangtam:{n:'Băng Tâm',c:1,t:'pow',r:'u',h:'bang',ic:'🏔️',x:[3,5],tg:'self',d:'Đầu mỗi lượt nhận {X} Giáp.',play:c=>H.st(B.p,'plate',c.X)},
  phapluc:{n:'Pháp Lực',c:1,t:'pow',r:'u',h:'bang',ic:'🌟',x:[2,3],tg:'self',d:'Nhận {X} Sức mạnh.',play:async c=>{await FXR.buffBlue(H.pt(B.p));H.st(B.p,'str',c.X,true)}},
  locset:{n:'Lốc Sét',c:2,t:'atk',r:'r',h:'bang',ic:'🌩️',dm:[85,115],tg:'rand',d:'Gây {D} sát thương 4 lần lên kẻ địch ngẫu nhiên.',play:c=>H.atkRand(c.D,'chain',4)},
  thienthach:{n:'Thiên Thạch',c:3,t:'atk',r:'r',h:'bang',ic:'☄️',dm:[365,500],tg:'all',d:'Gây {D} sát thương lên TẤT CẢ kẻ địch.',play:c=>H.atkAll(c.D,'meteor')},
  // ---- VÕ TĂNG ----
  quyen:{n:'Quyền',c:1,t:'atk',r:'s',h:'thach',ic:'👊',dm:[100,150],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'punch')},
  chuong:{n:'Chưởng Phong',c:2,t:'atk',r:'s',h:'thach',ic:'🖐️',dm:[115,165],b:[140,200],tg:'one',d:'Gây {D} sát thương. Nhận {B} Giáp.',play:async c=>{await H.atk(c.t,c.D,'palm');await H.blk(c.B,'shield')}},
  lienquyen:{n:'Liên Quyền',c:1,t:'atk',r:'c',h:'thach',ic:'🥊',dm:[50,65],tg:'one',d:'Gây {D} sát thương 3 lần.',play:c=>H.atk(c.t,c.D,'punch',3)},
  tuong:{n:'Tường Đá',c:2,t:'skill',r:'c',h:'thach',ic:'🧱',b:[300,400],tg:'self',d:'Nhận {B} Giáp.',play:c=>H.blk(c.B,'stoneWall')},
  kiencuong:{n:'Kiên Cường',c:1,t:'skill',r:'c',h:'thach',ic:'⛰️',b:[120,180],tg:'self',d:'Nhận {B} Giáp. Rút 1 thẻ.',play:async c=>{await H.blk(c.B,'shield');await H.draw(1)}},
  dongdat:{n:'Động Đất',c:2,t:'atk',r:'c',h:'thach',ic:'🌋',dm:[100,150],tg:'all',d:'Gây {D} sát thương và 1 Dễ vỡ lên TẤT CẢ kẻ địch.',play:async c=>{await H.atkAll(c.D,'quake');for(const e of H.alive())H.st(e,'vuln',1,true)}},
  thien:{n:'Thiền Định',c:1,t:'skill',r:'c',h:'thach',ic:'🧘',x:[6,9],tg:'self',ex:1,d:'Hồi {X} Máu. Tiêu hao.',play:c=>H.heal(c.X)},
  gaida:{n:'Gai Đá',c:1,t:'pow',r:'u',h:'thach',ic:'🌵',x:[3,5],tg:'self',d:'Nhận {X} Gai.',play:c=>H.st(B.p,'thorns',c.X)},
  phanchan:{n:'Phản Chấn',c:[1,0],t:'atk',r:'u',h:'thach',ic:'💥',tg:'one',d:'Gây sát thương bằng số Giáp hiện có{P}.',play:c=>H.atk(c.t,B.p.block,'shockwave',1,true)},
  hoixuan:{n:'Hồi Xuân',c:1,t:'pow',r:'u',h:'thach',ic:'🌿',x:[2,3],tg:'self',d:'Đầu mỗi lượt hồi {X} Máu.',play:c=>H.st(B.p,'regen',c.X)},
  chankhi:{n:'Chân Khí',c:0,t:'skill',r:'u',h:'thach',ic:'☯️',b:[60,120],tg:'self',ex:1,d:'Nhận 1 Năng lượng và {B} Giáp. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(1);await H.blk(c.B,'shield')}},
  kimcang:{n:'Kim Cang Quyền',c:2,t:'atk',r:'r',h:'thach',ic:'🏯',dm:[235,300],tg:'one',d:'Gây {D} sát thương. Nhận Giáp bằng sát thương gây ra.',play:async c=>{const d=await H.atk(c.t,c.D,'smash');if(d>0)await H.blk(d,'shield')}},
  batdong:{n:'Bất Động',c:[2,1],t:'pow',r:'r',h:'thach',ic:'🗿',tg:'self',d:'Giáp không còn mất đi khi bắt đầu lượt mới.',play:c=>H.st(B.p,'keep',1)},
};
const TYPE_N={atk:'Tấn công',skill:'Kỹ năng',pow:'Năng lực'};

const RELICS={
  huyhieu:{n:'Huy Hiệu Kiếm',ic:'🎖️',d:'Bắt đầu mỗi trận với 1 Sức mạnh.'},
  tinhthe:{n:'Tinh Thể Băng',ic:'💠',d:'Đầu mỗi trận, gây 1 Yếu lên tất cả kẻ địch.'},
  tranghat:{n:'Tràng Hạt',ic:'📿',d:'Hồi 5 Máu sau mỗi trận.'},
  ngoc:{n:'Ngọc Hồi Sinh',ic:'🔴',d:'Hồi 6 Máu sau mỗi trận.'},
  nhan:{n:'Nhẫn Sức Mạnh',ic:'💍',d:'Bắt đầu mỗi trận với 1 Sức mạnh.'},
  giap:{n:'Giáp Cổ',ic:'🥋',d:'Bắt đầu mỗi trận với 8 Giáp.'},
  dongho:{n:'Đồng Hồ Cát',ic:'⏳',d:'Lượt đầu mỗi trận rút thêm 2 thẻ.'},
  loi:{n:'Lõi Năng Lượng',ic:'🔋',d:'Lượt đầu mỗi trận nhận thêm 1 Năng lượng.'},
  bua:{n:'Bùa Gai',ic:'🦔',d:'Bắt đầu mỗi trận với 3 Gai.'},
  tui:{n:'Túi Vàng',ic:'👝',d:'Nhận thêm 50% vàng sau trận.'},
  tim:{n:'Tim Rồng',ic:'💗',d:'Tăng 12 Máu tối đa.',get(){run.maxHp+=12;run.hp+=12}},
  mat:{n:'Mắt Thần',ic:'🧿',d:'Kẻ địch bắt đầu trận với 1 Dễ vỡ.'},
  long:{n:'Lông Phượng',ic:'🪶',d:'Lần đầu gục ngã, hồi sinh với 30% Máu.'},
};
/* =========================================================
   TRANG BỊ: 6 ô (vũ khí, mũ, giáp, găng tay, giày, nhẫn). Cộng thẳng vào chỉ số nhân vật.
   atk = Tấn công, def = Phòng thủ, hp = Máu tối đa. h = chỉ anh hùng đó dùng được.
========================================================= */
const EQUIP_DROP=.3; // tỉ lệ rơi trang bị từ trùm cuối màn. Rương chìa khóa LUÔN ra trang bị; ải 💎 Kho báu thì không. Trang bị được giữ qua các lượt chơi (hồ sơ).
// tỉ lệ rơi chìa khóa 🗝️: ải thường ít, tinh anh vừa, ải 💎 Kho báu (mỗi màn có đúng 1) khá cao, trùm nhiều nhất
const KEY_DROP={battle:.12,elite:.25,treasure:.5,boss:.6};

/* Rương thưởng vượt ải LẦN ĐẦU (trang chủ): mỗi màn có 3 rương ở các tầng ACT_CHESTS (mỗi màn có 9 tầng, tầng cuối là trùm).
   Đạt tới tầng đó lần đầu thì rương mở khóa, nhận một lần duy nhất. coins = xu 🪙, gems = ngọc 💠, keys = chìa khóa 🗝️,
   eq = rơi 1 trang bị chắc chắn ('elite' = từ tốt trở lên, 'boss' = đồ hiếm). */
const ACT_CHESTS=[3,6,9];
const FIRST_CLEAR={
  1:[{coins:60,keys:1},{coins:120,gems:3,keys:1},{coins:220,gems:6,keys:2,tk:1,eq:'elite'}],
  2:[{coins:100,keys:1},{coins:180,gems:5,keys:1},{coins:320,gems:10,keys:2,tk:1,eq:'boss'}],
  3:[{coins:140,keys:1},{coins:240,gems:8,keys:2,tk:1},{coins:500,gems:20,keys:3,tk:2,eq:'boss'}],
  4:[{coins:180,keys:1},{coins:300,gems:10,keys:2,tk:1},{coins:600,gems:24,keys:3,tk:2,eq:'boss'}],
  5:[{coins:220,keys:1},{coins:360,gems:12,keys:2,tk:1},{coins:700,gems:28,keys:3,tk:2,eq:'boss'}],
  6:[{coins:260,keys:1,tk:1},{coins:420,gems:14,keys:2,tk:1},{coins:800,gems:32,keys:3,tk:3,eq:'boss'}],
  7:[{coins:300,keys:2,tk:1},{coins:500,gems:18,keys:3,tk:2},{coins:1200,gems:50,keys:4,tk:5,eq:'boss'}],
};
/* Cửa hàng trang chủ: mua bằng xu 🪙 hoặc ngọc 💠 */
const HOME_SHOP=[
  {id:'k1',ic:'🗝️',n:'Chìa khóa ×1',d:'Mở 1 rương Kho Báu (chắc chắn có trang bị)',cur:'coins',p:150,keys:1},
  {id:'k5',ic:'🗝️',n:'Chìa khóa ×5',d:'Gói 5 chìa khóa, rẻ hơn mua lẻ',cur:'gems',p:10,keys:5},
  {id:'t1',ic:'🔑',n:'Chìa khóa thẻ ×1',d:'Quay 1 lần ở tab Thẻ bài',cur:'coins',p:800,tkeys:1},
  {id:'t5',ic:'🔑',n:'Chìa khóa thẻ ×5',d:'Gói 5 chìa khóa thẻ, rẻ hơn',cur:'gems',p:80,tkeys:5},
];

/* ---------- BỘ BÀI BAN ĐẦU & QUAY THẺ ----------
   Mỗi khi sang màn mới, bộ bài bị ĐẶT LẠI về bộ bài ban đầu (bộ mặc định của nhân vật hoặc bộ bạn tự xếp ở tab Thẻ bài).
   Chỉ thẻ đã SỞ HỮU (từng nhặt trong lượt chơi hoặc quay trúng) mới xếp được vào bộ bài ban đầu.
   Thẻ Huyền thoại (l) chỉ có từ quay thẻ, bằng chìa khóa thẻ 🔑 riêng. */
const DECK_SIZE=10;
const DECK_COPIES={s:5,c:3,u:2,r:1,l:1}; // số bản tối đa của cùng 1 thẻ theo độ hiếm
const DECK_CAP={rl:3,l:2};               // tối đa 3 thẻ Hiếm+Huyền thoại, trong đó tối đa 2 thẻ Huyền thoại
const RARITY_N={s:'Khởi đầu',c:'Thường',u:'Tốt',r:'Hiếm',l:'Huyền thoại'};
const GACHA={rates:{l:.03,r:.15,u:.37,c:.45},pity:40,cost1:1,cost10:9,dup:{c:15,u:40,r:120,l:400}}; // pity: đủ 40 lần chắc chắn ra Huyền thoại; dup: xu nhận khi quay trúng thẻ đã có
const TKEY_DROP={battle:.03,elite:.2,treasure:.15,boss:1}; // tỉ lệ rơi chìa khóa thẻ
/* Rương trong tab Cửa hàng. cur: 'keys' (tiêu chìa khóa 🗝️) hoặc 'gems' (tiêu ngọc 💠); p = giá ×1, p10 = giá ×10.
   'common' chính là rương Kho Báu (mở bằng 1 chìa khóa, tỉ lệ độ hiếm như rương Kho Báu).
   Rương còn lại luôn từ Tốt trở lên: rare = tỉ lệ ra Hiếm, và cứ pity lần mở mà chưa ra Hiếm thì lần thứ pity chắc chắn
   ra Hiếm (bộ đếm lưu trong prog.pity). */
const SHOP_CHESTS={
  special:{n:'Rương Đặc Biệt',ic:'🎁',cur:'gems',p:10,p10:90,rare:.4,pity:10},
  common:{n:'Rương Thường',ic:'🧰',cur:'keys',p:1},
  rare:{n:'Rương Hiếm',ic:'👑',cur:'keys',p:3,rare:.25,pity:10},
};
const RAR_N={c:'Thường',u:'Tốt',r:'Hiếm'};
const SELL_PRICE={c:15,u:40,r:100}; // bán trang bị trong túi đồ lấy xu 🪙
const SLOTS={weapon:{n:'Vũ khí',ic:'⚔️'},helm:{n:'Mũ',ic:'⛑️'},armor:{n:'Giáp',ic:'🛡️'},gloves:{n:'Găng tay',ic:'🧤'},boots:{n:'Giày',ic:'🥾'},ring:{n:'Nhẫn',ic:'💍'}};
const STAT_N={atk:{n:'Tấn công',ic:'⚔️'},def:{n:'Phòng thủ',ic:'🛡️'},hp:{n:'Máu',ic:'❤️'}};
const EQUIP={
  // ---- vũ khí (theo anh hùng) ----
  kiemsat:{n:'Kiếm Sắt',ic:'🗡️',slot:'weapon',r:'c',h:'kiem',atk:2},
  kiemthep:{n:'Kiếm Thép Tinh Luyện',ic:'⚔️',slot:'weapon',r:'u',h:'kiem',atk:4},
  longhuyet:{n:'Long Huyết Kiếm',ic:'🐉',slot:'weapon',r:'r',h:'kiem',atk:6,hp:8},
  truongmoc:{n:'Trượng Gỗ Linh',ic:'🪄',slot:'weapon',r:'c',h:'bang',atk:2},
  truongbang:{n:'Trượng Băng Tinh',ic:'❄️',slot:'weapon',r:'u',h:'bang',atk:4},
  truongloi:{n:'Thiên Lôi Trượng',ic:'⚡',slot:'weapon',r:'r',h:'bang',atk:6,def:1},
  gangsat:{n:'Găng Sắt',ic:'🥊',slot:'weapon',r:'c',h:'thach',atk:1,def:1},
  gangdong:{n:'Găng Đồng Hộ Pháp',ic:'🧤',slot:'weapon',r:'u',h:'thach',atk:3,def:1},
  gangkim:{n:'Kim Cang Thủ',ic:'🏯',slot:'weapon',r:'r',h:'thach',atk:5,def:2},
  // ---- giáp (dùng chung) ----
  aovai:{n:'Áo Vải Dày',ic:'👕',slot:'armor',r:'c',def:2},
  giada:{n:'Giáp Da',ic:'🦺',slot:'armor',r:'c',def:1,hp:10},
  giapxich:{n:'Giáp Xích',ic:'⛓️',slot:'armor',r:'u',def:3,hp:8},
  giapthep:{n:'Giáp Thép',ic:'🥋',slot:'armor',r:'u',def:4},
  giaprong:{n:'Giáp Vảy Rồng',ic:'🐲',slot:'armor',r:'r',def:6,hp:15},
  // ---- nhẫn (dùng chung; trước đây là ô phụ kiện) ----
  nhandong:{n:'Nhẫn Đồng',ic:'💍',slot:'ring',r:'c',atk:1},
  daychuyen:{n:'Dây Chuyền Bạc',ic:'📿',slot:'ring',r:'c',hp:12},
  vongtay:{n:'Vòng Tay Hộ Pháp',ic:'🔗',slot:'ring',r:'u',atk:2,def:1},
  ngocbi:{n:'Ngọc Bội Bình An',ic:'🟢',slot:'ring',r:'u',def:2,hp:10},
  buathien:{n:'Bùa Thiên Mệnh',ic:'🔯',slot:'ring',r:'r',atk:3,def:3,hp:10},
  // ---- vũ khí bổ sung ----
  doandao:{n:'Đoản Đao',ic:'🔪',slot:'weapon',r:'c',h:'kiem',atk:1,def:1},
  kiemlua:{n:'Kiếm Lửa',ic:'🔥',slot:'weapon',r:'u',h:'kiem',atk:3,hp:8},
  truongdong:{n:'Trượng Đồng',ic:'🔱',slot:'weapon',r:'c',h:'bang',atk:1,def:1},
  truongluu:{n:'Trượng Lưu Ly',ic:'🔮',slot:'weapon',r:'u',h:'bang',atk:3,hp:8},
  gangbac:{n:'Găng Bạc Quyền',ic:'🥋',slot:'weapon',r:'c',h:'thach',atk:2,hp:5},
  gangvang:{n:'Găng Vàng Phá Thạch',ic:'💥',slot:'weapon',r:'u',h:'thach',atk:3,hp:8},
  // ---- mũ (dùng chung) ----
  monon:{n:'Nón Vải',ic:'🧢',slot:'helm',r:'c',def:1,hp:5},
  mulinh:{n:'Mũ Da Lính',ic:'👒',slot:'helm',r:'c',hp:10},
  musat:{n:'Mũ Sắt',ic:'⛑️',slot:'helm',r:'u',def:2,hp:6},
  muxich:{n:'Mũ Xích Hộ Vệ',ic:'🪖',slot:'helm',r:'u',def:3},
  mulong:{n:'Mũ Rồng Thiêng',ic:'👑',slot:'helm',r:'r',atk:1,def:3,hp:12},
  // ---- găng tay (dùng chung) ----
  baotayvai:{n:'Bao Tay Vải',ic:'🧤',slot:'gloves',r:'c',atk:1},
  baotayda:{n:'Bao Tay Da',ic:'🧤',slot:'gloves',r:'c',def:1,hp:5},
  baotaythep:{n:'Bao Tay Thép',ic:'🦾',slot:'gloves',r:'u',atk:2,def:1},
  baotayphap:{n:'Bao Tay Pháp Sư',ic:'✋',slot:'gloves',r:'u',atk:2,hp:6},
  baotaythan:{n:'Bao Tay Thần Lực',ic:'🖐️',slot:'gloves',r:'r',atk:3,def:2},
  // ---- giày (dùng chung) ----
  giaycoc:{n:'Giày Cỏ',ic:'🥿',slot:'boots',r:'c',hp:8},
  giayda:{n:'Giày Da',ic:'👞',slot:'boots',r:'c',def:1,hp:4},
  giaysat:{n:'Giày Sắt',ic:'🥾',slot:'boots',r:'u',def:2,hp:5},
  giaygio:{n:'Giày Gió',ic:'👟',slot:'boots',r:'u',atk:1,hp:8},
  giayphong:{n:'Giày Phong Vân',ic:'🪽',slot:'boots',r:'r',atk:1,def:2,hp:12},
};
const RELIC_POOL=['ngoc','nhan','giap','dongho','loi','bua','tui','tim','mat','long'];

/* Độ khó thích ứng: quái mạnh lên theo trang bị người chơi đang có (trang bị được giữ qua các lượt chơi nên người
   chơi kỳ cựu bắt đầu với bộ đồ đầy đủ). Lượt đầu chưa có đồ thì quái giữ ĐÚNG chỉ số gốc bên dưới.
   Với pA = Tấn công / Tấn công cơ bản, pD = Phòng thủ / Phòng thủ cơ bản, pH = Máu tối đa / Máu cơ bản:
     Máu quái  x (1 + hp  * (pA - 1))        Phòng thủ quái x (1 + def * (pA - 1))
     Tấn công quái x (1 + atk * ((pD + pH) / 2 - 1))
   Đặt các hệ số = 0 để tắt hoàn toàn. */
const GEAR_SCALE={hp:.6,def:.5,atk:.3};

/* Kẻ địch cũng có chỉ số riêng như người chơi: atk (Tấn công), def (Phòng thủ). Đây là chỉ số GỐC (chưa tính độ khó thích ứng).
   m: chiêu thức. d = sát thương theo % atk, b = giáp theo % def, h = số lần đánh,
   s = Sức mạnh, weak/vuln/poison/burn = gây lên người chơi, heal = hồi máu (cố định), w = trọng số chọn chiêu. */
const ENEMIES={
  // ---------- MÀN 1 ----------
  nam:{n:'Nấm Độc',ic:'🍄',hp:[16,20],atk:6,def:4,m:[{d:100,fx:'spit',w:2},{poison:3,fx:'spit'}]},
  soi:{n:'Sói Bóng Đêm',ic:'🐺',hp:[24,28],atk:6,def:4,m:[{d:115,fx:'bite',w:2},{d:65,h:2,fx:'claw'},{s:2,w:.6}]},
  doi:{n:'Dơi Máu',ic:'🦇',hp:[11,14],atk:4,def:3,m:[{d:75,h:2,fx:'bite'},{d:75,weak:1,fx:'bite'}]},
  xuong:{n:'Bộ Xương',ic:'💀',hp:[26,30],atk:6,def:5,m:[{d:150,fx:'smash',w:2},{b:160,d:65,fx:'smash'}]},
  nhen:{n:'Nhện Độc',ic:'🕷️',hp:[18,22],atk:5,def:4,m:[{d:100,poison:2,fx:'spit',w:2},{vuln:2}]},
  golem:{n:'Golem Đá',ic:'🗿',hp:[72,78],atk:7,def:6,elite:1,m:[{d:200,fx:'smash'},{b:200,s:2},{d:85,h:2,fx:'smash'}]},
  xavuong:{n:'Xà Vương',ic:'🐍',hp:[150,150],atk:6,def:6,boss:1,m:[{d:100,h:3,fx:'bite'},{d:85,poison:5,fx:'spit'},{d:300,fx:'bite'},{s:3,b:200}]},
  // ---------- MÀN 2 ----------
  hon:{n:'Hồn Ma',ic:'👻',hp:[30,36],atk:10,def:6,m:[{d:100,fx:'darkBolt',w:2},{weak:2,vuln:1}]},
  bocap:{n:'Bọ Cạp Cát',ic:'🦂',hp:[36,42],atk:8,def:7,m:[{d:100,poison:3,fx:'claw',w:2},{b:140,d:75,fx:'claw'}]},
  muc:{n:'Thủy Quái',ic:'🦑',hp:[40,46],atk:7,def:7,m:[{d:70,h:3,fx:'claw',w:2},{b:200},{d:85,weak:2,fx:'spit'}]},
  zombie:{n:'Xác Sống',ic:'🧟',hp:[44,50],atk:10,def:6,m:[{d:130,fx:'smash',w:2},{heal:8,s:1}]},
  thanlan:{n:'Thằn Lằn Lửa',ic:'🦎',hp:[34,38],atk:9,def:6,m:[{d:120,fx:'fireball',w:2},{d:55,burn:4,fx:'fireball'}]},
  quy:{n:'Quỷ Đỏ',ic:'👹',hp:[125,130],atk:10,def:8,elite:1,m:[{d:200,fx:'smash'},{d:70,h:3,fx:'claw'},{s:3,b:190}]},
  banglong:{n:'Băng Long',ic:'🐉',hp:[240,240],atk:13,def:8,boss:1,m:[{d:200,fx:'frostBreath'},{d:60,h:3,fx:'bite'},{b:190,weak:2,vuln:2,fx:'frostBreath'},{s:4}]},
  // ---------- MÀN 3 ----------
  ung:{n:'Ưng Sấm',ic:'🦅',hp:[48,54],atk:8,def:7,m:[{d:90,h:2,fx:'zap',w:2},{d:200,fx:'zap'}]},
  macarong:{n:'Ma Cà Rồng',ic:'🧛',hp:[58,64],atk:13,def:8,m:[{d:100,heal:7,fx:'bite',w:2},{d:60,weak:2,fx:'darkBolt'}]},
  phuthuy:{n:'Phù Thủy',ic:'🧙',hp:[50,56],atk:14,def:8,m:[{d:120,fx:'darkBolt',w:2},{poison:6,fx:'spit'},{s:3}]},
  mat:{n:'Mắt Hư Vô',ic:'👁️',hp:[54,60],atk:10,def:8,m:[{weak:2,vuln:2},{d:90,h:2,fx:'darkBolt',w:2}]},
  baolong:{n:'Bạo Long',ic:'🦖',hp:[180,190],atk:14,def:10,elite:1,m:[{d:200,fx:'bite'},{d:70,h:3,fx:'claw'},{s:4,b:200}]},
  mavuong:{n:'Ma Vương Hư Không',ic:'😈',hp:[360,360],atk:14,def:12,boss:1,m:[{d:85,h:3,fx:'darkBolt'},{d:245,fx:'darkBolt'},{weak:3,vuln:3,poison:5,fx:'darkBolt'},{s:4,b:210}]},
  // ---------- MÀN 4: SA MẠC LỬA CHÁY ----------
  ranlua:{n:'Rắn Lửa',ic:'🐍',hp:[60,68],atk:11,def:9,m:[{d:110,burn:3,fx:'fireball',w:2},{d:65,h:2,fx:'bite'}]},
  bocung:{n:'Bọ Giáp Sắt',ic:'🪲',hp:[66,74],atk:11,def:13,m:[{d:120,fx:'claw',w:2},{b:200},{d:60,b:100,fx:'claw'}]},
  thandencat:{n:'Thần Đèn Cát',ic:'🧞',hp:[56,62],atk:14,def:9,m:[{d:100,fx:'darkBolt',w:2},{weak:2,vuln:2},{s:2}]},
  xacuop:{n:'Xác Ướp Cổ',ic:'🧟',hp:[80,88],atk:12,def:10,m:[{d:140,fx:'smash',w:2},{heal:10,b:150},{poison:4,fx:'spit'}]},
  bocapchua:{n:'Bọ Cạp Chúa',ic:'🦂',hp:[72,78],atk:13,def:10,m:[{d:80,h:2,poison:3,fx:'claw',w:2},{d:170,fx:'claw'}]},
  nhansu:{n:'Nhân Sư Cổ Đại',ic:'🦁',hp:[230,240],atk:15,def:12,elite:1,m:[{d:200,fx:'smash'},{d:70,h:3,fx:'claw'},{s:4,b:200},{weak:2,vuln:2,fx:'darkBolt'}]},
  phaon:{n:'Pharaoh Hỏa Ngục',ic:'🏺',hp:[500,500],atk:16,def:13,boss:1,m:[{d:100,h:3,fx:'fireball'},{d:260,fx:'smash'},{burn:6,weak:2,vuln:2,fx:'fireball'},{s:4,b:220,heal:15}]},
  // ---------- MÀN 5: ĐẦM LẦY ĐỘC ĐỊA ----------
  echdoc:{n:'Ếch Độc',ic:'🐸',hp:[70,78],atk:13,def:11,m:[{d:100,poison:5,fx:'spit',w:2},{d:140,fx:'bite'}]},
  casau:{n:'Cá Sấu Khổng Lồ',ic:'🐊',hp:[92,100],atk:14,def:14,m:[{d:170,fx:'bite',w:2},{b:220},{d:80,h:2,fx:'bite'}]},
  thuyyeu:{n:'Thủy Yêu',ic:'🧜‍♀️',hp:[76,84],atk:15,def:11,m:[{d:110,weak:2,fx:'darkBolt',w:2},{d:60,h:3,fx:'spit'}]},
  namkhong:{n:'Nấm Khổng Lồ',ic:'🍄',hp:[100,110],atk:12,def:13,m:[{poison:7,fx:'spit',w:2},{heal:12,b:150},{d:120,poison:3,fx:'spit'}]},
  troll:{n:'Troll Đầm Lầy',ic:'🧌',hp:[110,120],atk:16,def:13,m:[{d:180,fx:'smash',w:2},{heal:14,s:1},{d:70,h:3,fx:'smash'}]},
  hydra:{n:'Thủy Quái Hydra',ic:'🐲',hp:[300,310],atk:17,def:14,elite:1,m:[{d:90,h:4,fx:'bite'},{d:220,poison:6,fx:'spit'},{s:4,b:220},{heal:18,weak:2,fx:'darkBolt'}]},
  nuvuongdam:{n:'Nữ Vương Đầm Lầy',ic:'🧝‍♀️',hp:[600,600],atk:17,def:14,boss:1,m:[{d:100,poison:6,h:2,fx:'spit'},{d:300,fx:'darkBolt'},{weak:3,vuln:3,poison:8,fx:'darkBolt'},{s:4,b:240,heal:20}]},
  // ---------- MÀN 6: THIÊN ĐÌNH SẤM SÉT ----------
  thienbinh:{n:'Thiên Binh',ic:'💂',hp:[100,110],atk:15,def:14,m:[{d:120,fx:'zap',w:2},{b:200,s:1},{d:70,h:2,fx:'zap'}]},
  cungthu:{n:'Cung Thủ Thiên Giới',ic:'🏹',hp:[90,98],atk:17,def:12,m:[{d:100,h:2,fx:'zap',w:2},{vuln:2,weak:2,fx:'zap'}]},
  tiennu:{n:'Tiên Nữ Sa Ngã',ic:'🧚',hp:[92,100],atk:16,def:13,m:[{d:110,heal:12,fx:'darkBolt',w:2},{weak:3,fx:'darkBolt'},{d:60,burn:4,fx:'zap'}]},
  voichien:{n:'Voi Chiến Thiên Giới',ic:'🐘',hp:[130,140],atk:17,def:17,m:[{d:190,fx:'smash',w:2},{b:240},{d:75,h:3,fx:'smash'}]},
  comay:{n:'Cỗ Máy Thiên Giới',ic:'🤖',hp:[120,130],atk:18,def:18,m:[{d:130,fx:'zap',w:2},{b:260,s:2},{d:60,h:3,fx:'zap'}]},
  thanhlong:{n:'Thanh Long Hộ Pháp',ic:'🐉',hp:[380,400],atk:18,def:17,elite:1,m:[{d:200,fx:'zap'},{d:70,h:4,fx:'zap'},{s:5,b:240},{weak:3,vuln:3,fx:'zap'}]},
  loithan:{n:'Lôi Thần Thiên Đế',ic:'🤴',hp:[760,760],atk:19,def:18,boss:1,m:[{d:90,h:4,fx:'zap'},{d:320,fx:'zap'},{weak:3,vuln:3,burn:8,fx:'zap'},{s:5,b:260}]},
  // ---------- MÀN 7: HƯ VÔ TẬN CÙNG ----------
  diman:{n:'Dị Nhân Hư Vô',ic:'👽',hp:[130,140],atk:18,def:18,m:[{d:110,fx:'darkBolt',w:2},{weak:3,vuln:3},{d:60,h:3,fx:'darkBolt'}]},
  bachtuoc:{n:'Bạch Tuộc Vực Thẳm',ic:'🐙',hp:[140,150],atk:17,def:19,m:[{d:70,h:4,fx:'claw',w:2},{b:260},{d:90,poison:6,fx:'spit'}]},
  huyetcong:{n:'Huyết Công Tước',ic:'🧛‍♂️',hp:[135,145],atk:19,def:18,m:[{d:130,heal:14,fx:'bite',w:2},{d:80,weak:3,fx:'bite'},{s:3}]},
  acmong:{n:'Ác Mộng Hắc Mã',ic:'🐴',hp:[150,160],atk:19,def:20,m:[{d:200,fx:'smash',w:2},{d:80,h:3,fx:'smash'},{s:3,b:220}]},
  nhancau:{n:'Nhãn Cầu Hư Vô',ic:'🧿',hp:[125,135],atk:18,def:17,m:[{weak:3,vuln:3,fx:'darkBolt'},{d:100,h:2,burn:4,fx:'darkBolt',w:2},{d:150,fx:'darkBolt'}]},
  thanma:{n:'Ma Thần Cổ Đại',ic:'👺',hp:[520,540],atk:20,def:21,elite:1,m:[{d:210,fx:'smash'},{d:70,h:4,fx:'darkBolt'},{s:5,b:250},{weak:3,vuln:3,poison:6,fx:'darkBolt'}]},
  thienmenh:{n:'Thiên Mệnh Chi Chủ',ic:'🌌',hp:[1000,1000],atk:21,def:22,boss:1,m:[{d:80,h:5,fx:'darkBolt'},{d:340,fx:'darkBolt'},{weak:4,vuln:4,poison:8,burn:8,fx:'darkBolt'},{s:6,b:300,heal:30},{d:120,h:3,fx:'zap'}]},
};
const ACTS={
  1:{n:'Rừng Âm U',easy:[['nam'],['doi','doi'],['xuong']],normal:[['soi','nam'],['nhen','nhen'],['doi','doi','doi'],['xuong','nam'],['soi','doi']],elite:[['golem']],boss:'xavuong'},
  2:{n:'Hang Băng Giá',easy:[['hon'],['thanlan']],normal:[['hon','thanlan'],['bocap','muc'],['zombie','hon'],['muc','thanlan'],['bocap','hon']],elite:[['quy']],boss:'banglong'},
  3:{n:'Thành Hư Không',easy:[['ung'],['phuthuy']],normal:[['ung','mat'],['macarong','phuthuy'],['mat','mat'],['ung','macarong']],elite:[['baolong']],boss:'mavuong'},
  4:{n:'Sa Mạc Lửa Cháy',easy:[['ranlua'],['bocung']],normal:[['ranlua','thandencat'],['bocung','xacuop'],['bocapchua','ranlua'],['thandencat','xacuop'],['bocapchua','bocung']],elite:[['nhansu']],boss:'phaon'},
  5:{n:'Đầm Lầy Độc Địa',easy:[['echdoc'],['thuyyeu']],normal:[['echdoc','thuyyeu'],['casau','namkhong'],['troll','echdoc'],['namkhong','thuyyeu'],['casau','echdoc']],elite:[['hydra']],boss:'nuvuongdam'},
  6:{n:'Thiên Đình Sấm Sét',easy:[['thienbinh'],['cungthu']],normal:[['thienbinh','cungthu'],['tiennu','comay'],['voichien','cungthu'],['comay','tiennu'],['thienbinh','tiennu']],elite:[['thanhlong']],boss:'loithan'},
  7:{n:'Hư Vô Tận Cùng',easy:[['diman'],['nhancau']],normal:[['diman','huyetcong'],['bachtuoc','nhancau'],['acmong','diman'],['huyetcong','bachtuoc'],['nhancau','acmong']],elite:[['thanma']],boss:'thienmenh'},
};
const MAX_ACT=Object.keys(ACTS).length; // tổng số màn
const ACT_ICON={1:'🌲',2:'🏔️',3:'🏰',4:'🏜️',5:'🐊',6:'⛈️',7:'🌌'};

