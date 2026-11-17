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
};
const STS_FX={str:'buffRed',weak:'debuff',vuln:'debuff',poison:'poisonFx',burn:'burnFx',thorns:'thorns',regen:'heal',energy:'buffGold',plate:'iceArmor',keep:'buffGold'};

const HEROES={
  kiem:{n:'Lạc Phong',title:'Kiếm Khách',ic:'🤺',hp:80,col:'#ff6a5a',relic:'huyhieu',desc:'Bậc thầy đao kiếm. Tấn công dồn dập, tích Sức mạnh và kết liễu bằng đòn chí mạng.',deck:['chem','chem','chem','chem','chem','thu','thu','thu','thu','dam']},
  bang:{n:'Tuyết Lan',title:'Băng Pháp Sư',ic:'🧙‍♀️',hp:68,col:'#5ab8ff',relic:'tinhthe',desc:'Điều khiển băng tuyết và sấm sét. Làm suy yếu kẻ địch, tấn công diện rộng.',deck:['bangtien','bangtien','bangtien','bangtien','bangtien','thu','thu','thu','thu','hankhi']},
  thach:{n:'Thạch Hổ',title:'Võ Tăng',ic:'🧘‍♂️',hp:88,col:'#5fd068',relic:'tranghat',desc:'Thân cứng như đá. Phòng thủ vững chắc, phản đòn bằng Giáp và Gai.',deck:['quyen','quyen','quyen','quyen','thu','thu','thu','thu','thu','chuong']},
};

/* t: atk|skill|pow  r: s(khởi đầu) c u r   tg: one|all|self|rand
   dm=sát thương, b=giáp, x/y = giá trị khác; [thường, nâng cấp] */
const CARDS={
  thu:{n:'Phòng Thủ',c:1,t:'skill',r:'s',h:'*',ic:'🛡️',b:[5,8],tg:'self',d:'Nhận {B} Giáp.',play:async c=>H.blk(c.B,'shield')},
  // ---- KIẾM KHÁCH ----
  chem:{n:'Chém',c:1,t:'atk',r:'s',h:'kiem',ic:'🗡️',dm:[6,9],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'slash')},
  dam:{n:'Đâm Xuyên',c:2,t:'atk',r:'s',h:'kiem',ic:'🔱',dm:[8,10],x:[2,3],tg:'one',d:'Gây {D} sát thương. Gây {X} Dễ vỡ.',play:async c=>{await H.atk(c.t,c.D,'pierce');await H.st(c.t,'vuln',c.X)}},
  song:{n:'Song Kiếm',c:1,t:'atk',r:'c',h:'kiem',ic:'⚔️',dm:[5,7],tg:'one',d:'Gây {D} sát thương 2 lần.',play:c=>H.atk(c.t,c.D,'slash',2)},
  loc:{n:'Lốc Xoáy Kiếm',c:1,t:'atk',r:'c',h:'kiem',ic:'🌪️',dm:[7,10],tg:'all',d:'Gây {D} sát thương lên TẤT CẢ kẻ địch.',play:c=>H.atkAll(c.D,'whirl')},
  khi:{n:'Kiếm Khí',c:1,t:'atk',r:'c',h:'kiem',ic:'🌙',dm:[8,11],tg:'one',d:'Gây {D} sát thương. Rút 1 thẻ.',play:async c=>{await H.atk(c.t,c.D,'wave');await H.draw(1)}},
  phan:{n:'Phản Đòn',c:1,t:'skill',r:'c',h:'kiem',ic:'🌵',b:[5,7],x:[2,3],tg:'self',d:'Nhận {B} Giáp và {X} Gai.',play:async c=>{await H.blk(c.B,'shield');await H.st(B.p,'thorns',c.X)}},
  huyet:{n:'Huyết Chiến',c:0,t:'skill',r:'c',h:'kiem',ic:'🩸',x:[2,2],y:[4,2],tg:'self',d:'Mất {Y} Máu. Nhận {X} Năng lượng.',play:async c=>{await FXR.blood(H.pt(B.p));H.loseHp(c.Y);H.gainE(c.X)}},
  hoa:{n:'Hỏa Kiếm',c:2,t:'atk',r:'u',h:'kiem',ic:'🔥',dm:[12,16],x:[3,5],tg:'one',d:'Gây {D} sát thương. Gây {X} Thiêu đốt.',play:async c=>{await H.atk(c.t,c.D,'fire');await H.st(c.t,'burn',c.X)}},
  no:{n:'Nộ Khí',c:1,t:'pow',r:'u',h:'kiem',ic:'😤',x:[2,3],tg:'self',d:'Nhận {X} Sức mạnh.',play:c=>H.st(B.p,'str',c.X)},
  lien:{n:'Chém Liên Hoàn',c:2,t:'atk',r:'u',h:'kiem',ic:'🌀',dm:[4,5],tg:'one',d:'Gây {D} sát thương 4 lần.',play:c=>H.atk(c.t,c.D,'slash',4)},
  tram:{n:'Trảm Long',c:3,t:'atk',r:'r',h:'kiem',ic:'🐉',dm:[30,40],tg:'one',ex:1,d:'Gây {D} sát thương. Tiêu hao.',play:c=>H.atk(c.t,c.D,'bigSlash')},
  chieny:{n:'Chiến Ý',c:[2,1],t:'pow',r:'r',h:'kiem',ic:'⚡',tg:'self',d:'Đầu mỗi lượt nhận thêm 1 Năng lượng.',play:c=>H.st(B.p,'energy',1)},
  // ---- BĂNG PHÁP SƯ ----
  bangtien:{n:'Băng Tiễn',c:1,t:'atk',r:'s',h:'bang',ic:'❄️',dm:[6,9],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'iceShard')},
  hankhi:{n:'Hàn Khí',c:1,t:'atk',r:'s',h:'bang',ic:'🌬️',dm:[4,6],x:[2,3],tg:'one',d:'Gây {D} sát thương. Gây {X} Yếu.',play:async c=>{await H.atk(c.t,c.D,'frost');await H.st(c.t,'weak',c.X,true)}},
  baotuyet:{n:'Bão Tuyết',c:2,t:'atk',r:'c',h:'bang',ic:'🌨️',dm:[7,10],tg:'all',d:'Gây {D} sát thương và 1 Yếu lên TẤT CẢ kẻ địch.',play:async c=>{await H.atkAll(c.D,'blizzard');for(const e of H.alive())H.st(e,'weak',1,true)}},
  sam:{n:'Lôi Điện',c:1,t:'atk',r:'c',h:'bang',ic:'⚡',dm:[10,14],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'lightning')},
  banggiap:{n:'Băng Giáp',c:1,t:'skill',r:'c',h:'bang',ic:'🧊',b:[8,11],tg:'self',d:'Nhận {B} Giáp.',play:c=>H.blk(c.B,'iceArmor')},
  linhluc:{n:'Linh Lực',c:[1,0],t:'skill',r:'c',h:'bang',ic:'✨',x:[2,2],tg:'self',d:'Rút {X} thẻ.',play:async c=>{await FXR.arcane(H.pt(B.p));await H.draw(c.X)}},
  nguyen:{n:'Lời Nguyền',c:1,t:'skill',r:'u',h:'bang',ic:'🔮',x:[2,3],tg:'one',ex:1,d:'Gây {X} Yếu và {X} Dễ vỡ. Tiêu hao.',play:async c=>{await FXR.curse(H.pt(B.p),H.pt(c.t));H.st(c.t,'weak',c.X,true);H.st(c.t,'vuln',c.X,true)}},
  tinhthe:{n:'Tinh Thể Ma Lực',c:0,t:'skill',r:'u',h:'bang',ic:'💎',x:[2,3],tg:'self',ex:1,d:'Nhận {X} Năng lượng. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(c.X)}},
  hapthu:{n:'Hấp Thụ',c:2,t:'atk',r:'u',h:'bang',ic:'🧛',dm:[8,12],x:[4,6],tg:'one',d:'Gây {D} sát thương. Hồi {X} Máu.',play:async c=>{await H.atk(c.t,c.D,'drain');await H.heal(c.X,true)}},
  bangtam:{n:'Băng Tâm',c:1,t:'pow',r:'u',h:'bang',ic:'🏔️',x:[3,5],tg:'self',d:'Đầu mỗi lượt nhận {X} Giáp.',play:c=>H.st(B.p,'plate',c.X)},
  phapluc:{n:'Pháp Lực',c:1,t:'pow',r:'u',h:'bang',ic:'🌟',x:[2,3],tg:'self',d:'Nhận {X} Sức mạnh.',play:async c=>{await FXR.buffBlue(H.pt(B.p));H.st(B.p,'str',c.X,true)}},
  locset:{n:'Lốc Sét',c:2,t:'atk',r:'r',h:'bang',ic:'🌩️',dm:[5,7],tg:'rand',d:'Gây {D} sát thương 4 lần lên kẻ địch ngẫu nhiên.',play:c=>H.atkRand(c.D,'chain',4)},
  thienthach:{n:'Thiên Thạch',c:3,t:'atk',r:'r',h:'bang',ic:'☄️',dm:[22,30],tg:'all',d:'Gây {D} sát thương lên TẤT CẢ kẻ địch.',play:c=>H.atkAll(c.D,'meteor')},
  // ---- VÕ TĂNG ----
  quyen:{n:'Quyền',c:1,t:'atk',r:'s',h:'thach',ic:'👊',dm:[6,9],tg:'one',d:'Gây {D} sát thương.',play:c=>H.atk(c.t,c.D,'punch')},
  chuong:{n:'Chưởng Phong',c:2,t:'atk',r:'s',h:'thach',ic:'🖐️',dm:[7,10],b:[7,10],tg:'one',d:'Gây {D} sát thương. Nhận {B} Giáp.',play:async c=>{await H.atk(c.t,c.D,'palm');await H.blk(c.B,'shield')}},
  lienquyen:{n:'Liên Quyền',c:1,t:'atk',r:'c',h:'thach',ic:'🥊',dm:[3,4],tg:'one',d:'Gây {D} sát thương 3 lần.',play:c=>H.atk(c.t,c.D,'punch',3)},
  tuong:{n:'Tường Đá',c:2,t:'skill',r:'c',h:'thach',ic:'🧱',b:[15,20],tg:'self',d:'Nhận {B} Giáp.',play:c=>H.blk(c.B,'stoneWall')},
  kiencuong:{n:'Kiên Cường',c:1,t:'skill',r:'c',h:'thach',ic:'⛰️',b:[6,9],tg:'self',d:'Nhận {B} Giáp. Rút 1 thẻ.',play:async c=>{await H.blk(c.B,'shield');await H.draw(1)}},
  dongdat:{n:'Động Đất',c:2,t:'atk',r:'c',h:'thach',ic:'🌋',dm:[6,9],tg:'all',d:'Gây {D} sát thương và 1 Dễ vỡ lên TẤT CẢ kẻ địch.',play:async c=>{await H.atkAll(c.D,'quake');for(const e of H.alive())H.st(e,'vuln',1,true)}},
  thien:{n:'Thiền Định',c:1,t:'skill',r:'c',h:'thach',ic:'🧘',x:[6,9],tg:'self',ex:1,d:'Hồi {X} Máu. Tiêu hao.',play:c=>H.heal(c.X)},
  gaida:{n:'Gai Đá',c:1,t:'pow',r:'u',h:'thach',ic:'🌵',x:[3,5],tg:'self',d:'Nhận {X} Gai.',play:c=>H.st(B.p,'thorns',c.X)},
  phanchan:{n:'Phản Chấn',c:[1,0],t:'atk',r:'u',h:'thach',ic:'💥',tg:'one',d:'Gây sát thương bằng số Giáp hiện có{P}.',play:c=>H.atk(c.t,B.p.block,'shockwave',1,true)},
  hoixuan:{n:'Hồi Xuân',c:1,t:'pow',r:'u',h:'thach',ic:'🌿',x:[2,3],tg:'self',d:'Đầu mỗi lượt hồi {X} Máu.',play:c=>H.st(B.p,'regen',c.X)},
  chankhi:{n:'Chân Khí',c:0,t:'skill',r:'u',h:'thach',ic:'☯️',b:[3,6],tg:'self',ex:1,d:'Nhận 1 Năng lượng và {B} Giáp. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(1);await H.blk(c.B,'shield')}},
  kimcang:{n:'Kim Cang Quyền',c:2,t:'atk',r:'r',h:'thach',ic:'🏯',dm:[14,18],tg:'one',d:'Gây {D} sát thương. Nhận Giáp bằng sát thương gây ra.',play:async c=>{const d=await H.atk(c.t,c.D,'smash');if(d>0)await H.blk(d,'shield')}},
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
const RELIC_POOL=['ngoc','nhan','giap','dongho','loi','bua','tui','tim','mat','long'];

/* m: chiêu thức. d=sát thương h=số lần b=giáp s=sức mạnh weak/vuln/poison/burn=gây lên người chơi heal=hồi máu */
const ENEMIES={
  nam:{n:'Nấm Độc',ic:'🍄',hp:[16,20],m:[{d:6,fx:'spit',w:2},{poison:3,fx:'spit'}]},
  soi:{n:'Sói Bóng Đêm',ic:'🐺',hp:[24,28],m:[{d:7,fx:'bite',w:2},{d:4,h:2,fx:'claw'},{s:2,w:.6}]},
  doi:{n:'Dơi Máu',ic:'🦇',hp:[11,14],m:[{d:3,h:2,fx:'bite'},{d:3,weak:1,fx:'bite'}]},
  xuong:{n:'Bộ Xương',ic:'💀',hp:[26,30],m:[{d:9,fx:'smash',w:2},{b:8,d:4,fx:'smash'}]},
  nhen:{n:'Nhện Độc',ic:'🕷️',hp:[18,22],m:[{d:5,poison:2,fx:'spit',w:2},{vuln:2}]},
  golem:{n:'Golem Đá',ic:'🗿',hp:[72,78],elite:1,m:[{d:14,fx:'smash'},{b:12,s:2},{d:6,h:2,fx:'smash'}]},
  xavuong:{n:'Xà Vương',ic:'🐍',hp:[150,150],boss:1,m:[{d:6,h:3,fx:'bite'},{d:5,poison:5,fx:'spit'},{d:18,fx:'bite'},{s:3,b:12}]},
  hon:{n:'Hồn Ma',ic:'👻',hp:[30,36],m:[{d:10,fx:'darkBolt',w:2},{weak:2,vuln:1}]},
  bocap:{n:'Bọ Cạp Cát',ic:'🦂',hp:[36,42],m:[{d:8,poison:3,fx:'claw',w:2},{b:10,d:6,fx:'claw'}]},
  muc:{n:'Thủy Quái',ic:'🦑',hp:[40,46],m:[{d:5,h:3,fx:'claw',w:2},{b:14},{d:6,weak:2,fx:'spit'}]},
  zombie:{n:'Xác Sống',ic:'🧟',hp:[44,50],m:[{d:13,fx:'smash',w:2},{heal:8,s:1}]},
  thanlan:{n:'Thằn Lằn Lửa',ic:'🦎',hp:[34,38],m:[{d:11,fx:'fireball',w:2},{d:5,burn:4,fx:'fireball'}]},
  quy:{n:'Quỷ Đỏ',ic:'👹',hp:[125,130],elite:1,m:[{d:20,fx:'smash'},{d:7,h:3,fx:'claw'},{s:3,b:15}]},
  banglong:{n:'Băng Long',ic:'🐉',hp:[240,240],boss:1,m:[{d:26,fx:'frostBreath'},{d:8,h:3,fx:'bite'},{b:15,weak:2,vuln:2,fx:'frostBreath'},{s:4}]},
  ung:{n:'Ưng Sấm',ic:'🦅',hp:[48,54],m:[{d:7,h:2,fx:'zap',w:2},{d:16,fx:'zap'}]},
  macarong:{n:'Ma Cà Rồng',ic:'🧛',hp:[58,64],m:[{d:13,heal:7,fx:'bite',w:2},{d:8,weak:2,fx:'darkBolt'}]},
  phuthuy:{n:'Phù Thủy',ic:'🧙',hp:[50,56],m:[{d:17,fx:'darkBolt',w:2},{poison:6,fx:'spit'},{s:3}]},
  mat:{n:'Mắt Hư Vô',ic:'👁️',hp:[54,60],m:[{weak:2,vuln:2},{d:9,h:2,fx:'darkBolt',w:2}]},
  baolong:{n:'Bạo Long',ic:'🦖',hp:[180,190],elite:1,m:[{d:28,fx:'bite'},{d:10,h:3,fx:'claw'},{s:4,b:20}]},
  mavuong:{n:'Ma Vương Hư Không',ic:'😈',hp:[360,360],boss:1,m:[{d:12,h:3,fx:'darkBolt'},{d:34,fx:'darkBolt'},{weak:3,vuln:3,poison:5,fx:'darkBolt'},{s:4,b:25}]},
};
const ACTS={
  1:{n:'Rừng Âm U',easy:[['nam'],['doi','doi'],['xuong']],normal:[['soi','nam'],['nhen','nhen'],['doi','doi','doi'],['xuong','nam'],['soi','doi']],elite:[['golem']],boss:'xavuong'},
  2:{n:'Hang Băng Giá',easy:[['hon'],['thanlan']],normal:[['hon','thanlan'],['bocap','muc'],['zombie','hon'],['muc','thanlan'],['bocap','hon']],elite:[['quy']],boss:'banglong'},
  3:{n:'Thành Hư Không',easy:[['ung'],['phuthuy']],normal:[['ung','mat'],['macarong','phuthuy'],['mat','mat'],['ung','macarong']],elite:[['baolong']],boss:'mavuong'},
};

