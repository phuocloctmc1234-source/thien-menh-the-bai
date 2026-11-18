'use strict';
/* =========================================================
   THẺ HUYỀN THOẠI (r:'l', g:1): 15 thẻ "over power" cho mỗi nhân vật. KHÔNG rơi trong lượt chơi,
   chỉ có thể quay được bằng chìa khóa thẻ 🔑 ở tab Thẻ bài.
   + CHIA ĐỀU thẻ vào 7 màn (hàm assignActs ở cuối file).
========================================================= */
Object.assign(CARDS,{
  /* =================== KIẾM KHÁCH · HUYỀN THOẠI =================== */
  kl_nhatkiem:{n:'Nhất Kiếm Tuyệt Thế',c:2,t:'atk',r:'l',g:1,h:'kiem',ic:'🌈',dm:[800,1000],x:[6,8],tg:'one',d:'Gây {D} sát thương. Gây {X} Chảy máu.',play:c=>H.atkSt(c.t,c.D,'bigSlash',[['bleed',c.X]])},
  kl_vankiem:{n:'Vạn Kiếm Triều Tông',c:2,t:'atk',r:'l',g:1,h:'kiem',ic:'🗡️',dm:[250,320],tg:'all',d:'Gây {D} sát thương lên TẤT CẢ kẻ địch 3 lần.',play:async c=>{for(let i=0;i<3;i++)await H.atkAll(c.D,'whirl')}},
  kl_kiemthan:{n:'Kiếm Thần Hạ Phàm',c:1,t:'pow',r:'l',g:1,h:'kiem',ic:'🔱',x:[5,6],tg:'self',d:'Nhận {X} Sức mạnh.',play:c=>H.st(B.p,'str',c.X)},
  kl_batu:{n:'Bất Tử Chiến Thần',c:2,t:'pow',r:'l',g:1,h:'kiem',ic:'🛡️',x:[3,4],tg:'self',d:'Nhận 4 Sức mạnh và {X} Hút máu.',play:async c=>{await H.st(B.p,'str',4);await H.st(B.p,'leech',c.X)}},
  kl_huyethai:{n:'Huyết Hải Vô Biên',c:1,t:'skill',r:'l',g:1,h:'kiem',ic:'🌊',x:[25,35],tg:'self',ex:1,d:'Hồi {X} Máu và nhận 3 Kết giới. Tiêu hao.',play:async c=>{await H.heal(c.X);await H.st(B.p,'ward',3)}},
  kl_thoigian:{n:'Thời Gian Ngưng Đọng',c:0,t:'skill',r:'l',g:1,h:'kiem',ic:'⏳',x:[3,4],tg:'self',ex:1,d:'Nhận 3 Năng lượng. Rút {X} thẻ. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(3);await H.draw(c.X)}},
  kl_songlong:{n:'Song Long Xuất Hải',c:1,t:'atk',r:'l',g:1,h:'kiem',ic:'🐉',dm:[300,400],tg:'one',d:'Gây {D} sát thương 2 lần.',play:c=>H.atk(c.t,c.D,'bigSlash',2)},
  kl_phathien:{n:'Phá Thiên Kiếm Ý',c:[1,0],t:'skill',r:'l',g:1,h:'kiem',ic:'💥',tg:'self',ex:1,d:'Nhân đôi Sức mạnh hiện có. Tiêu hao.',play:async c=>{const s=B.p.st.str||0;if(s>0)await H.st(B.p,'str',s);else await FXR.buffRed(H.pt(B.p))}},
  kl_kiemvuc:{n:'Kiếm Vực Tuyệt Đối',c:2,t:'skill',r:'l',g:1,h:'kiem',ic:'🌀',x:[4,5],tg:'all',d:'Gây {X} Dễ vỡ, {X} Yếu và {X} Dấu ấn lên TẤT CẢ.',play:async c=>{await H.stAll('vuln',c.X);await H.stAll('weak',c.X);await H.stAll('mark',c.X)}},
  kl_thiendia:{n:'Thiên Địa Đồng Thọ',c:2,t:'skill',r:'l',g:1,h:'kiem',ic:'☯️',b:[600,800],x:[5,7],tg:'self',d:'Nhận {B} Giáp, {X} Gai và 3 Kết giới.',play:async c=>{await H.blk(c.B);await H.st(B.p,'thorns',c.X);await H.st(B.p,'ward',3)}},
  kl_quykiem:{n:'Quỷ Kiếm Đoạt Mệnh',c:1,t:'atk',r:'l',g:1,h:'kiem',ic:'👹',dm:[500,650],tg:'one',d:'Gây {D} sát thương. Hồi Máu bằng sát thương gây ra.',play:async c=>{const d=await H.atk(c.t,c.D,'drain');if(d>0)await H.heal(d,true)}},
  kl_hoaphuong:{n:'Hỏa Phượng Kiếm Trận',c:2,t:'atk',r:'l',g:1,h:'kiem',ic:'🔥',dm:[200,260],x:[8,10],tg:'all',d:'Gây {D} sát thương và {X} Thiêu đốt lên TẤT CẢ.',play:c=>H.atkAllSt(c.D,'meteor',[['burn',c.X]])},
  kl_mathan:{n:'Ma Thần Phụ Thể',c:2,t:'pow',r:'l',g:1,h:'kiem',ic:'😈',x:[1,2],tg:'self',d:'Nhận 3 Sức mạnh và {X} Chiến ý.',play:async c=>{await H.st(B.p,'str',3);await H.st(B.p,'energy',c.X)}},
  kl_chungket:{n:'Chung Kết Chi Kiếm',c:3,t:'atk',r:'l',g:1,h:'kiem',ic:'☄️',dm:[1500,2000],tg:'one',ex:1,d:'Gây {D} sát thương. Tiêu hao.',play:c=>H.atk(c.t,c.D,'bigSlash')},
  kl_luanhoi:{n:'Luân Hồi Kiếm Pháp',c:0,t:'skill',r:'l',g:1,h:'kiem',ic:'♾️',x:[5,6],tg:'self',ex:1,d:'Rút {X} thẻ, nhận 2 Năng lượng và 2 Sức mạnh. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(2);await H.st(B.p,'str',2);await H.draw(c.X)}},

  /* =================== BĂNG PHÁP SƯ · HUYỀN THOẠI =================== */
  bl_tuyetdoi:{n:'Tuyệt Đối Linh Độ',c:3,t:'atk',r:'l',g:1,h:'bang',ic:'🌈',dm:[500,650],tg:'all',d:'Gây {D} sát thương lên TẤT CẢ. Đóng băng 1 lượt.',play:c=>H.atkAllSt(c.D,'blizzard',[['freeze',1]])},
  bl_baophong:{n:'Thiên Địa Băng Phong',c:2,t:'skill',r:'l',g:1,h:'bang',ic:'🧊',x:[3,4],tg:'all',ex:1,d:'Đóng băng TẤT CẢ 2 lượt và gây {X} Dễ vỡ. Tiêu hao.',play:async c=>{await H.stAll('freeze',2);await H.stAll('vuln',c.X)}},
  bl_nguyento:{n:'Nguyên Tố Bùng Nổ',c:2,t:'atk',r:'l',g:1,h:'bang',ic:'💠',dm:[350,450],x:[6,8],tg:'all',d:'Gây {D} sát thương, {X} Thiêu đốt và {X} Độc lên TẤT CẢ.',play:c=>H.atkAllSt(c.D,'meteor',[['burn',c.X],['poison',c.X]])},
  bl_phapthan:{n:'Tinh Thần Pháp Thần',c:1,t:'pow',r:'l',g:1,h:'bang',ic:'🌟',x:[5,6],tg:'self',d:'Nhận {X} Sức mạnh và 1 Chiến ý.',play:async c=>{await H.st(B.p,'str',c.X);await H.st(B.p,'energy',1)}},
  bl_bangiap:{n:'Vĩnh Hằng Băng Giáp',c:1,t:'pow',r:'l',g:1,h:'bang',ic:'🏔️',x:[8,10],tg:'self',d:'Nhận {X} Băng tâm và 3 Kiên cố.',play:async c=>{await H.st(B.p,'plate',c.X);await H.st(B.p,'fort',3)}},
  bl_taisinh:{n:'Đại Pháp Sư Tái Sinh',c:1,t:'skill',r:'l',g:1,h:'bang',ic:'🕊️',x:[20,30],tg:'self',ex:1,d:'Hồi {X} Máu, rút 3 thẻ và nhận 3 Kết giới. Tiêu hao.',play:async c=>{await H.heal(c.X);await H.st(B.p,'ward',3);await H.draw(3)}},
  bl_loithan:{n:'Lôi Thần Giáng Thế',c:2,t:'atk',r:'l',g:1,h:'bang',ic:'🌩️',dm:[250,330],tg:'rand',d:'Gây {D} sát thương 6 lần lên kẻ địch ngẫu nhiên.',play:c=>H.atkRand(c.D,'chain',6)},
  bl_vandoc:{n:'Vạn Độc Quy Tông',c:1,t:'skill',r:'l',g:1,h:'bang',ic:'☠️',x:[15,20],tg:'all',d:'Gây {X} Độc lên TẤT CẢ kẻ địch.',play:c=>H.stAll('poison',c.X)},
  bl_congh:{n:'Ma Pháp Cộng Hưởng',c:0,t:'skill',r:'l',g:1,h:'bang',ic:'✨',x:[3,4],tg:'self',ex:1,d:'Nhận 3 Năng lượng. Rút {X} thẻ. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(3);await H.draw(c.X)}},
  bl_thienco:{n:'Thiên Cơ Đoạt Mệnh',c:1,t:'skill',r:'l',g:1,h:'bang',ic:'🔮',x:[10,14],tg:'one',d:'Gây {X} Dấu ấn, 5 Suy nhược, 5 Dễ vỡ và 3 Yếu.',play:async c=>{await H.st(c.t,'mark',c.X);await H.st(c.t,'sap',5,true);await H.st(c.t,'vuln',5,true);await H.st(c.t,'weak',3,true)}},
  bl_huydiet:{n:'Hủy Diệt Linh Hồn',c:2,t:'atk',r:'l',g:1,h:'bang',ic:'💀',dm:[900,1150],x:[20,25],tg:'one',d:'Gây {D} sát thương. Gây {X} Độc.',play:c=>H.atkSt(c.t,c.D,'darkBolt',[['poison',c.X]])},
  bl_phongtoa:{n:'Thời Không Phong Tỏa',c:1,t:'skill',r:'l',g:1,h:'bang',ic:'⏱️',x:[5,7],tg:'all',d:'Đóng băng TẤT CẢ 1 lượt. Gây {X} Suy nhược.',play:async c=>{await H.stAll('freeze',1);await H.stAll('sap',c.X)}},
  bl_banghoa:{n:'Băng Hỏa Lưỡng Cực',c:1,t:'atk',r:'l',g:1,h:'bang',ic:'☯️',dm:[300,400],x:[5,6],tg:'all',d:'Gây {D} sát thương, {X} Thiêu đốt và {X} Dễ vỡ lên TẤT CẢ.',play:c=>H.atkAllSt(c.D,'blizzard',[['burn',c.X],['vuln',c.X]])},
  bl_vocuc:{n:'Pháp Vực Vô Hạn',c:2,t:'pow',r:'l',g:1,h:'bang',ic:'🌌',x:[2,3],tg:'self',d:'Nhận {X} Chiến ý và 2 Sức mạnh.',play:async c=>{await H.st(B.p,'energy',c.X);await H.st(B.p,'str',2)}},
  bl_thienthach:{n:'Thiên Thạch Hủy Diệt',c:3,t:'atk',r:'l',g:1,h:'bang',ic:'☄️',dm:[1100,1400],tg:'all',ex:1,d:'Gây {D} sát thương lên TẤT CẢ. Tiêu hao.',play:c=>H.atkAll(c.D,'meteor')},

  /* =================== VÕ TĂNG · HUYỀN THOẠI =================== */
  tl_kimthan:{n:'Kim Thân Bất Hoại',c:2,t:'pow',r:'l',g:1,h:'thach',ic:'🌈',x:[6,8],tg:'self',d:'Nhận {X} Kiên cố và 4 Gai.',play:async c=>{await H.st(B.p,'fort',c.X);await H.st(B.p,'thorns',4)}},
  tl_chanthe:{n:'Thiên Địa Chấn Thế',c:[2,1],t:'atk',r:'l',g:1,h:'thach',ic:'🌍',tg:'all',d:'Gây sát thương lên TẤT CẢ bằng 3 lần số Giáp hiện có{P}.',play:c=>H.atkAll(B.p.block*3,'quake')},
  tl_phatquang:{n:'Phật Quang Phổ Chiếu',c:1,t:'skill',r:'l',g:1,h:'thach',ic:'🪷',b:[800,1000],x:[15,20],tg:'self',ex:1,d:'Nhận {B} Giáp, hồi {X} Máu và 3 Kết giới. Tiêu hao.',play:async c=>{await H.blk(c.B,'stoneWall');await H.heal(c.X);await H.st(B.p,'ward',3)}},
  tl_hophap:{n:'Hộ Pháp Kim Cang',c:1,t:'pow',r:'l',g:1,h:'thach',ic:'🏯',x:[4,5],tg:'self',d:'Nhận {X} Hút máu và 3 Kiên cố.',play:async c=>{await H.st(B.p,'leech',c.X);await H.st(B.p,'fort',3)}},
  tl_thaison:{n:'Thái Sơn Áp Đỉnh',c:[3,2],t:'atk',r:'l',g:1,h:'thach',ic:'⛰️',tg:'one',d:'Gây sát thương bằng 4 lần số Giáp hiện có{P}.',play:c=>H.atk(c.t,B.p.block*4,'shockwave',1,true)},
  tl_batdong:{n:'Bất Động Như Sơn',c:1,t:'pow',r:'l',g:1,h:'thach',ic:'🗿',x:[3,5],tg:'self',d:'Giáp không còn mất đi. Nhận {X} Kiên cố.',play:async c=>{await H.st(B.p,'keep',1);await H.st(B.p,'fort',c.X)}},
  tl_thapphuong:{n:'Thập Phương Chấn Động',c:2,t:'atk',r:'l',g:1,h:'thach',ic:'💫',dm:[400,520],x:[3,4],tg:'all',d:'Gây {D} sát thương, {X} Dễ vỡ và {X} Suy nhược lên TẤT CẢ.',play:c=>H.atkAllSt(c.D,'quake',[['vuln',c.X],['sap',c.X]])},
  tl_longho:{n:'Long Hổ Tề Xuất',c:2,t:'atk',r:'l',g:1,h:'thach',ic:'🐯',dm:[600,800],b:[400,500],x:[5,6],tg:'one',d:'Gây {D} sát thương. Nhận {B} Giáp và {X} Gai.',play:async c=>{await H.atk(c.t,c.D,'smash');await H.blkSt(c.B,[['thorns',c.X]],'stoneWall')}},
  tl_hoixuan:{n:'Hồi Xuân Vô Tận',c:1,t:'pow',r:'l',g:1,h:'thach',ic:'🌿',x:[6,8],tg:'self',d:'Nhận {X} Hồi xuân và 4 Gai.',play:async c=>{await H.st(B.p,'regen',c.X);await H.st(B.p,'thorns',4)}},
  tl_phucma:{n:'Kim Cang Phục Ma Quyền',c:2,t:'atk',r:'l',g:1,h:'thach',ic:'👊',dm:[700,900],tg:'one',d:'Gây {D} sát thương. Nhận Giáp bằng sát thương gây ra.',play:async c=>{const d=await H.atk(c.t,c.D,'smash');if(d>0)await H.blk(d,'stoneWall')}},
  tl_nhandoi:{n:'Nhân Đôi Giáp',c:[1,0],t:'skill',r:'l',g:1,h:'thach',ic:'✖️',tg:'self',d:'Nhân đôi số Giáp hiện có{P}. Nhận 2 Kết giới.',play:async c=>{await H.blk(B.p.block,'stoneWall');await H.st(B.p,'ward',2)}},
  tl_vocuc:{n:'Khí Công Vô Cực',c:0,t:'skill',r:'l',g:1,h:'thach',ic:'☯️',b:[300,400],tg:'self',ex:1,d:'Nhận 3 Năng lượng, rút 3 thẻ và {B} Giáp. Tiêu hao.',play:async c=>{await FXR.arcane(H.pt(B.p));H.gainE(3);await H.blk(c.B,'stoneWall');await H.draw(3)}},
  tl_thanho:{n:'Thần Hổ Hộ Thể',c:2,t:'skill',r:'l',g:1,h:'thach',ic:'🐅',b:[700,900],x:[6,8],tg:'self',d:'Nhận {B} Giáp, {X} Gai và 3 Kết giới.',play:async c=>{await H.blkSt(c.B,[['thorns',c.X],['ward',3]],'stoneWall')}},
  tl_thietquyen:{n:'Thiết Quyền Liên Hoàn',c:2,t:'atk',r:'l',g:1,h:'thach',ic:'🥊',dm:[180,230],tg:'one',d:'Gây {D} sát thương 6 lần.',play:c=>H.atk(c.t,c.D,'punch',6)},
  tl_lahan:{n:'La Hán Tái Thế',c:2,t:'pow',r:'l',g:1,h:'thach',ic:'🧘',x:[3,4],tg:'self',d:'Nhận 3 Sức mạnh, {X} Kiên cố và 1 Chiến ý.',play:async c=>{await H.st(B.p,'str',3);await H.st(B.p,'fort',c.X);await H.st(B.p,'energy',1)}},
});

/* =========================================================
   CHIA ĐỀU THẺ VÀO CÁC MÀN
   Mỗi thẻ thường/tốt/hiếm (trừ thẻ khởi đầu và Huyền thoại) thuộc ĐÚNG MỘT màn (CARDS[id].a = 1..MAX_ACT).
   Phần thưởng và cửa hàng của màn N chỉ cho thẻ của màn N (xem heroPool trong game.js). Thẻ đã nhặt ở màn trước
   vẫn xếp được vào bộ bài ban đầu từ tab Thẻ bài.
   Cách chia: mỗi độ hiếm được xếp theo phí rồi chia đều cho các màn (màn sau mạnh hơn), phần dư dồn vào các màn
   đang ít thẻ nhất, nên mỗi màn có số thẻ gần bằng nhau và luôn có đủ Thường / Tốt / Hiếm.
========================================================= */
(function assignActs(){
  const cost=c=>Array.isArray(c.c)?c.c[0]:c.c;
  for(const h of Object.keys(HEROES)){
    const total=Array(MAX_ACT).fill(0);
    for(const r of ['r','u','c']){
      const ids=Object.keys(CARDS).filter(k=>CARDS[k].h===h&&CARDS[k].r===r&&!CARDS[k].g);
      ids.sort((x,y)=>cost(CARDS[x])-cost(CARDS[y])); // sort ổn định: giữ thứ tự khai báo khi cùng phí
      const q=Math.floor(ids.length/MAX_ACT),rem=ids.length%MAX_ACT;
      const cnt=Array(MAX_ACT).fill(q);
      // phần dư: dồn vào các màn đang có ít thẻ nhất (hòa thì ưu tiên màn sau)
      const order=[...total.keys()].sort((x,y)=>total[x]-total[y]||y-x);
      for(let i=0;i<rem;i++)cnt[order[i]]++;
      let a=0,used=0;
      for(const id of ids){while(used>=cnt[a]){a++;used=0}CARDS[id].a=a+1;used++}
      cnt.forEach((n,i)=>total[i]+=n);
    }
  }
})();

/* =========================================================
   THẺ TẠO HIỆU ỨNG: mỗi lượt chỉ dùng 1 lần cho mỗi loại thẻ (khóa tới hết lượt, lượt sau mở lại; xem isLocked trong game.js).
   Tự nhận biết: thẻ nào có hàm play gọi H.st / H.stAll / H.atkSt / H.atkAllSt / H.blkSt thì là thẻ hiệu ứng (fxc:true).
========================================================= */
for(const d of Object.values(CARDS))d.fxc=/\bH\.(st|stAll|atkSt|atkAllSt|blkSt)\(/.test(String(d.play));
