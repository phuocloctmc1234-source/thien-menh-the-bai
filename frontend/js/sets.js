/* =========================================================
   BỘ TRANG BỊ: 18 bộ (mỗi lớp nhân vật 6 bộ), mỗi bộ 6 món (vũ khí, mũ, giáp, găng tay, giày, nhẫn).
   Món của bộ chỉ anh hùng thuộc lớp đó dùng được (h) và rơi cùng các món khác theo độ hiếm (c/u/r).
   Mặc đủ 2 / 4 / 6 món cùng bộ để mở thưởng bộ (cộng dồn). Thưởng gồm:
     atk/def/hp  = cộng thẳng vào chỉ số (hp tính vào Máu tối đa)
     block       = Giáp nhận ngay ở lượt đầu mỗi trận
     st          = trạng thái nhận khi bắt đầu trận (str, thorns, regen, plate, ward, fort, keep, leech...)
     es          = trạng thái đặt lên MỌI kẻ địch khi bắt đầu trận (weak, vuln...)
     e1 / d1     = thêm Năng lượng / số thẻ rút ở lượt đầu mỗi trận
   ========================================================= */
const SET_SLOTS=['weapon','helm','armor','gloves','boots','ring'];
const SET_SLOT_PTS={weapon:2.2,helm:2.2,armor:3,gloves:1.8,boots:2.2,ring:2.2};      // điểm chỉ số của 1 món cho mỗi bậc độ hiếm (Thường=1, Tốt=2, Hiếm=3)
const SET_SLOT_W={weapon:[.8,.1,.1],helm:[.1,.5,.4],armor:[.05,.55,.4],gloves:[.5,.4,.1],boots:[.1,.3,.6],ring:[.45,.1,.45]}; // tỉ lệ atk/def/hp theo ô

/* setNames(hậu tố, tên vũ khí, tên giáp): tên 6 món theo thứ tự SET_SLOTS */
const setNames=(x,w,a='Giáp')=>[w,`Mão ${x}`,`${a} ${x}`,`Thủ ${x}`,`Ngoa ${x}`,`Giới ${x}`];
const SET_DEFS=[
  // ---------- LẠC PHONG · Kiếm Khách ----------
  {id:'k1',h:'kiem',r:'c',fl:[1,1,1],n:'Bộ Lữ Khách',p:['Kiếm Lữ Hành','Mũ Lữ Khách','Áo Choàng Lữ Hành','Bao Tay Lữ Hành','Giày Đường Xa','Nhẫn Đồng Hành'],
    b:{2:{hp:5},4:{atk:1,block:4},6:{st:{str:1}}}},
  {id:'k2',h:'kiem',r:'c',fl:[.6,1.5,1],n:'Bộ Hộ Vệ Thành',p:['Kiếm Vệ Binh','Mũ Vệ Binh','Giáp Vệ Binh','Găng Vệ Binh','Giày Vệ Binh','Nhẫn Vệ Binh'],
    b:{2:{def:1},4:{hp:8},6:{block:6,st:{thorns:1}}}},
  {id:'k3',h:'kiem',r:'u',fl:[1.6,.5,.6],n:'Bộ Liệt Phong',p:setNames('Liệt Phong','Liệt Phong Kiếm'),
    b:{2:{atk:1},4:{st:{str:1}},6:{atk:2,d1:1}}},
  {id:'k4',h:'kiem',r:'u',fl:[.9,.5,1.6],n:'Bộ Huyết Nguyệt',p:setNames('Huyết Nguyệt','Huyết Nguyệt Đao'),
    b:{2:{hp:10},4:{st:{leech:1}},6:{atk:2,st:{regen:2}}}},
  {id:'k5',h:'kiem',r:'r',fl:[1.5,.8,1],n:'Bộ Xích Long',p:setNames('Xích Long','Xích Long Kiếm'),
    b:{2:{atk:2},4:{st:{str:1},es:{vuln:1}},6:{atk:3,st:{str:1,leech:2}}}},
  {id:'k6',h:'kiem',r:'r',fl:[1.1,1.1,1.1],n:'Bộ Thiên Kiếm',p:setNames('Thiên Kiếm','Thiên Kiếm Thần Khí'),
    b:{2:{atk:1,def:1},4:{hp:12,st:{str:1}},6:{atk:2,st:{str:1},es:{weak:1,vuln:1},e1:1}}},
  // ---------- TUYẾT LAN · Băng Pháp Sư ----------
  {id:'b1',h:'bang',r:'c',fl:[1,1,1],n:'Bộ Học Đồ Pháp',p:['Trượng Học Đồ','Mũ Học Đồ','Áo Học Đồ','Bao Tay Học Đồ','Giày Học Đồ','Nhẫn Học Đồ'],
    b:{2:{hp:4},4:{atk:1,es:{weak:1}},6:{block:5,st:{plate:1}}}},
  {id:'b2',h:'bang',r:'c',fl:[.6,1.4,1],n:'Bộ Tuyết Trắng',p:['Trượng Tuyết Trắng','Mũ Tuyết Trắng','Áo Tuyết Trắng','Bao Tay Tuyết Trắng','Giày Tuyết Trắng','Nhẫn Tuyết Trắng'],
    b:{2:{def:1},4:{hp:6,block:4},6:{st:{plate:2}}}},
  {id:'b3',h:'bang',r:'u',fl:[1.3,.9,.9],n:'Bộ Hàn Băng',p:setNames('Hàn Băng','Hàn Băng Trượng','Bào'),
    b:{2:{atk:1},4:{es:{weak:1,vuln:1}},6:{atk:2,st:{plate:2}}}},
  {id:'b4',h:'bang',r:'u',fl:[1.6,.5,.7],n:'Bộ Lôi Vân',p:setNames('Lôi Vân','Lôi Vân Trượng','Bào'),
    b:{2:{atk:1},4:{d1:1},6:{atk:2,es:{vuln:2}}}},
  {id:'b5',h:'bang',r:'r',fl:[1.2,1,1.2],n:'Bộ Thiên Sương',p:setNames('Thiên Sương','Thiên Sương Tinh Trượng','Bào'),
    b:{2:{atk:2},4:{hp:10,st:{ward:1}},6:{atk:2,e1:1,es:{weak:2}}}},
  {id:'b6',h:'bang',r:'r',fl:[1.2,1.1,1],n:'Bộ Cực Quang',p:setNames('Cực Quang','Cực Quang Trượng','Bào'),
    b:{2:{atk:1,def:1},4:{es:{weak:2,vuln:1},st:{plate:2}},6:{atk:3,es:{weak:2,vuln:2},st:{ward:1}}}},
  // ---------- THẠCH HỔ · Võ Tăng ----------
  {id:'t1',h:'thach',r:'c',fl:[1,1.1,1],n:'Bộ Võ Đồ',p:['Quyền Thủ Võ Đồ','Khăn Võ Đồ','Áo Võ Đồ','Quấn Tay Võ Đồ','Giày Võ Đồ','Nhẫn Võ Đồ'],
    b:{2:{def:1},4:{hp:8},6:{block:6,st:{thorns:1}}}},
  {id:'t2',h:'thach',r:'c',fl:[.5,1,1.6],n:'Bộ Hộ Pháp Thạch',p:['Quyền Thủ Hộ Pháp','Mũ Hộ Pháp','Giáp Hộ Pháp','Hộ Uyển Hộ Pháp','Giày Hộ Pháp','Nhẫn Hộ Pháp'],
    b:{2:{hp:8},4:{def:1},6:{st:{regen:1}}}},
  {id:'t3',h:'thach',r:'u',fl:[.7,1.6,.8],n:'Bộ Kim Cang',p:['Kim Cang Quyền Thủ','Mão Kim Cang','Giáp Kim Cang','Hộ Uyển Kim Cang','Ngoa Kim Cang','Giới Kim Cang'],
    b:{2:{def:1},4:{st:{thorns:2}},6:{def:2,st:{fort:1}}}},
  {id:'t4',h:'thach',r:'u',fl:[.6,1,1.6],n:'Bộ Địa Long',p:['Địa Long Quyền Thủ','Mão Địa Long','Giáp Địa Long','Hộ Uyển Địa Long','Ngoa Địa Long','Giới Địa Long'],
    b:{2:{hp:10},4:{block:8},6:{def:2,st:{regen:2}}}},
  {id:'t5',h:'thach',r:'r',fl:[.8,1.6,1.1],n:'Bộ Đại Lực Kim Thân',p:['Đại Lực Quyền Thủ','Mão Đại Lực','Giáp Kim Thân','Hộ Uyển Đại Lực','Ngoa Đại Lực','Giới Đại Lực'],
    b:{2:{def:2},4:{hp:12,st:{thorns:3}},6:{def:3,st:{keep:1}}}},
  {id:'t6',h:'thach',r:'r',fl:[1,1.3,1.2],n:'Bộ La Hán Bất Hoại',p:['La Hán Quyền Thủ','Mão La Hán','Giáp La Hán','Hộ Uyển La Hán','Ngoa La Hán','Giới La Hán'],
    b:{2:{atk:1,def:1},4:{hp:10,st:{fort:2}},6:{atk:2,st:{ward:1,thorns:3}}}},
];

/* Chỉ số một món của bộ: chia "điểm" theo ô và theo xu hướng của bộ (fl = trọng số atk/def/hp); 1 điểm = 1 atk = 1 def = ~3,5 Máu */
function setPieceStats(slot,r,fl){
  const t={c:1,u:2,r:3}[r],pts=SET_SLOT_PTS[slot]*t;let w=SET_SLOT_W[slot].map((x,i)=>x*fl[i]);const s=w[0]+w[1]+w[2];w=w.map(x=>x/s);
  const o={atk:Math.round(pts*w[0]),def:Math.round(pts*w[1]),hp:Math.round(pts*w[2]*3.5)};
  if(slot==='weapon'&&!o.atk)o.atk=1;
  if(!o.atk&&!o.def&&!o.hp)o.def=1;
  for(const k in o)if(!o[k])delete o[k];
  return o}

/* Mô tả một mốc thưởng bộ (tự sinh từ dữ liệu) */
function setBonusText(b){
  const t=[];
  if(b.atk)t.push(`+${b.atk} Tấn công`);if(b.def)t.push(`+${b.def} Phòng thủ`);if(b.hp)t.push(`+${b.hp} Máu tối đa`);
  if(b.block)t.push(`${b.block} Giáp ở lượt đầu mỗi trận`);
  for(const k in b.st||{})t.push(`Đầu trận: ${STS[k].ic} ${b.st[k]} ${STS[k].n}`);
  for(const k in b.es||{})t.push(`Kẻ địch bắt đầu trận với ${STS[k].ic} ${b.es[k]} ${STS[k].n}`);
  if(b.e1)t.push(`+${b.e1} Năng lượng ở lượt đầu`);
  if(b.d1)t.push(`Rút thêm ${b.d1} thẻ ở lượt đầu`);
  return t.join(' · ')}

const SETS={}; // ảnh món bộ: img/equip/<mã>.webp (SET_ART_IDS = các mã đã có ảnh, món khác dùng emoji)
const SET_ART_IDS=new Set('k1_weapon k1_helm k1_armor k1_gloves k1_boots k1_ring k2_weapon k2_helm k2_armor k2_gloves k2_boots k2_ring k3_weapon k3_helm k3_armor k3_gloves k3_boots k3_ring k4_weapon k4_helm k4_armor k4_gloves k4_boots k4_ring k5_weapon k5_helm k5_armor k5_gloves k5_boots k5_ring k6_weapon k6_helm k6_armor k6_gloves k6_boots k6_ring b1_weapon b1_helm b1_armor b1_gloves b1_boots b1_ring b2_weapon b2_helm b2_armor b2_gloves b2_boots b2_ring b3_weapon b3_helm b3_armor b3_gloves b3_boots b3_ring b4_weapon b4_helm b4_armor b4_gloves b4_boots b4_ring b5_weapon b5_helm b5_armor b5_gloves b5_boots b5_ring b6_weapon b6_helm b6_armor b6_gloves b6_boots b6_ring t1_weapon t1_helm t1_armor t1_gloves t1_boots t1_ring t2_weapon t2_helm t2_armor t2_gloves t2_boots t2_ring t3_weapon t3_helm t3_armor t3_gloves t3_boots t3_ring t4_weapon t4_helm t4_armor t4_gloves t4_boots t4_ring t5_weapon t5_helm t5_armor t5_gloves t5_boots t5_ring t6_weapon t6_helm t6_armor t6_gloves t6_boots t6_ring'.split(' '));
for(const d of SET_DEFS){
  SETS[d.id]={...d,pieces:SET_SLOTS.map(s=>`${d.id}_${s}`)};
  SET_SLOTS.forEach((slot,i)=>{
    const id=`${d.id}_${slot}`;
    EQUIP[id]={n:d.p[i],ic:'✨',slot,r:d.r,h:d.h,set:d.id,...setPieceStats(slot,d.r,d.fl)};
    if(SET_ART_IDS.has(id))EQUIP[id].ic=`<img class="eic" src="img/equip/${id}.webp" alt="" draggable="false">`})}
