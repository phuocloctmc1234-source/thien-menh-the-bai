# Thiên Mệnh Thẻ Bài: Frontend + Backend + Database

```
thebai/
├── frontend/              Game H5 (HTML/CSS/JS thuần, không cần build)
│   ├── index.html
│   ├── css/style.css
│   ├── js/fx.js           Âm thanh + engine hiệu ứng hạt + hiệu ứng từng thẻ
│   ├── js/data.js         Dữ liệu: anh hùng, thẻ bài, bảo vật, kẻ địch, màn chơi
│   ├── js/cards2.js       +40 thẻ cho mỗi nhân vật (120 thẻ) và hiệu ứng mới
│   ├── js/cards3.js       15 thẻ Huyền thoại / nhân vật (chỉ quay được) + hàm chia đều thẻ vào 7 màn
│   ├── js/api.js          Gọi backend (đăng nhập, lưu game, xếp hạng)
│   ├── js/game.js         Logic game, giao diện, bản đồ, trận đấu
│   ├── js/cardsui.js      Tab Thẻ bài: bộ bài ban đầu, sưu tập, quay thẻ
│   ├── js/home.js         Trang chủ, tab Trang bị / Cửa hàng
│   └── manifest.json, sw.js, icon-*.png   (cài lên màn hình chính, chơi offline)
├── backend/               Node.js + Express
│   ├── src/server.js      Điểm khởi động
│   ├── src/app.js         Cấu hình Express, gắn các route
│   ├── src/db.js          Mở database SQLite + tạo bảng
│   ├── src/routes/        auth.js, save.js, runs.js
│   ├── src/middleware/    auth.js (JWT)
│   ├── db/schema.sql      Cấu trúc database
│   └── test/              Kiểm thử API
└── docker-compose.yml
```

## 7 màn, bộ bài ban đầu, Thẻ bài & Quay thẻ

- **7 màn** (`ACTS` trong `data.js`, `MAX_ACT` tự đếm): Rừng Âm U → Hang Băng Giá → Thành Hư Không → Sa Mạc Lửa Cháy → Đầm Lầy Độc Địa →
  Thiên Đình Sấm Sét → Hư Vô Tận Cùng (trùm cuối: Thiên Mệnh Chi Chủ). Mỗi màn mở khi đánh bại trùm màn trước. Thêm màn mới = thêm 1 mục
  vào `ACTS` + `FIRST_CLEAR` + `ISLE` (home.js) + CSS `#battle[data-act=N]` và `.island.aN`. Backend (`runs.js`) có `MAX_ACT = 7`.
- **Chia đều thẻ vào các màn** (`assignActs` cuối `cards3.js`): mọi thẻ thường/tốt/hiếm thuộc **đúng một màn** (`CARDS[id].a`), mỗi màn
  7-8 thẻ/nhân vật và luôn có đủ Thường/Tốt/Hiếm. Phần thưởng và cửa hàng của màn N chỉ cho thẻ của màn N (`heroPool` trong `game.js`).
  Muốn đổi sang "mở dần, thẻ màn trước vẫn rơi ở màn sau": đổi `.a===run.act` thành `.a<=run.act` trong `heroPool`.
- **Sang màn mới, bộ bài bị đặt lại** về **bộ bài ban đầu** (thẻ nhặt + thẻ đã nâng cấp không mang theo; vàng, bảo vật, trang bị giữ nguyên).
- **Tab Thẻ bài 🎴** (`cardsui.js`): 🃏 **Bộ bài** (tự xếp bộ bài ban đầu từ thẻ đã sở hữu, đúng `DECK_SIZE`=10 thẻ; giới hạn bản/độ hiếm ở
  `DECK_COPIES`, `DECK_CAP`; bộ không hợp lệ tự rơi về bộ mặc định), 📚 **Sưu tập** (xem mọi thẻ theo màn + Huyền thoại, bản thường/nâng cấp),
  🎰 **Quay thẻ**. Thẻ "sở hữu" = từng nhặt trong lượt chơi hoặc quay trúng (`owned`); thẻ khởi đầu luôn có.
- **Quay thẻ**: dùng **chìa khóa thẻ 🔑** (riêng với chìa khóa rương 🗝️): ×1 = 1 🔑, ×10 = 9 🔑 (`GACHA`). Tỉ lệ Huyền thoại 3% / Hiếm 15% / Tốt 37% /
  Thường 45%, bảo hiểm đủ 40 lần chắc chắn Huyền thoại (`prog.pity.card`), thẻ chưa có được ưu tiên, trùng thẻ đổi ra xu. 15 **thẻ Huyền thoại**
  mỗi nhân vật (`r:'l'`, `g:1`) chỉ có từ quay thẻ. Nguồn 🔑: trùm (chắc chắn), tinh anh 20%, kho báu 15%, rương vượt ải lần đầu, hoặc mua
  ở Cửa hàng (`HOME_SHOP`, `TKEY_DROP`).
- Dữ liệu mới trong hồ sơ: `tkeys`, `owned`, `deckCfg` (nằm trong `META_KEYS`, được `profileRecord` lưu), bản lưu cũ tự bổ sung giá trị mặc định.
- **Thẻ hiệu ứng = 1 lần/lượt**: thẻ nào có `play` gọi `H.st/stAll/atkSt/atkAllSt/blkSt` (tự nhận biết ở cuối `cards3.js`, cờ `fxc`) chỉ dùng được 1 lần mỗi lượt cho mỗi loại thẻ.
  Bản cùng loại còn lại bị khóa 🔒 tới hết lượt (`B.used`, `isLocked` trong `game.js`), sang lượt mới mở lại. Thẻ chỉ gây sát thương/Giáp/rút bài thì không bị khóa.
- **Hiệu ứng mới** (`STS` trong `data.js`): 🧊 Đóng băng, 🎯 Dấu ấn, 🪫 Suy nhược, 🩸 Chảy máu (lên quái); 🔮 Kết giới, 🏰 Kiên cố, 🧛 Hút máu (cho mình).

## Cơ chế chỉ số & trang bị

- Mỗi anh hùng có **Tấn công (ATK)** và **Phòng thủ (DEF)** cơ bản (`HEROES` trong `data.js`):
  Lạc Phong 6/4, Tuyết Lan 7/3, Thạch Hổ 5/6.
- Thẻ **không còn số cố định**: `dm` = % ATK, `b` = % DEF. Ví dụ ATK 6 → thẻ Chém (`dm:100`) gây 6,
  Chém+ (`dm:150`) gây 9; DEF 4 → thẻ Phòng Thủ (`b:100`) nhận 4 Giáp. Số hiển thị trên thẻ là số đã tính.
  Sức mạnh/Yếu/Dễ vỡ vẫn áp dụng sau khi tính theo ATK. Các giá trị `x`/`y` (Gai, Độc, hồi máu...) vẫn cố định.
- **Trang bị** (`EQUIP` trong `data.js`, 40 món): **6 ô** vũ khí ⚔️ / mũ ⛑️ / giáp 🛡️ / găng tay 🧤 / giày 🥾 / nhẫn 💍, cộng
  `atk`, `def`, `hp` (Máu tối đa). Vũ khí theo từng anh hùng (`h`), 5 ô còn lại dùng chung. 3 độ hiếm (thường/tốt/hiếm).
  Nguồn: 🧰 **rương chìa khóa** (chắc chắn ra 1 món) và 💀 **trùm cuối màn** (30%, `EQUIP_DROP`, đồ hiếm).
  Ải 💎 Kho báu (chỉ vàng, bảo vật và 50% có chìa khóa), trận thường, tinh anh và cửa hàng **không** có trang bị.
  Khi tung đồ: chọn ô trước (ô đang trống xác suất gấp đôi), rồi độ hiếm, rồi món (ưu tiên món chưa có).
  Ô trống thì tự mặc, ngược lại vào túi 🎒 (có so sánh với món đang mặc; mặc/tháo ngoài trận).
- **Chìa khóa 🗝️ & Kho Báu 🧰**: sau trận có thể nhặt chìa khóa (`KEY_DROP` trong `data.js`: ải thường 12%,
  tinh anh 25%, 💎 ải Kho báu 50%, trùm 60%). Bấm nút 🗝️ trên thanh trên cùng (ngoài trận) để mở Kho Báu: mỗi chìa khóa mở 1 rương,
  chắc chắn ra 1 trang bị (+30-60 vàng).
- **Hồ sơ nhân vật**: **mỗi tài khoản chỉ có MỘT nhân vật**. Nhân vật chọn một lần ở lượt chơi đầu tiên (có hộp xác nhận),
  không thể đổi hay tạo thêm (đã bỏ nút "Đặt lại hồ sơ"; backend cũng khóa: `PUT /api/save` trả 409 nếu đổi anh hùng và không
  còn `DELETE /api/save`). **Chết (hoặc thắng, hay bỏ lượt dở để chơi mới) không mất chìa khóa 🗝️ và không mất trang bị**
  (cả đồ đang mặc lẫn túi đồ): lượt mới bắt đầu với bộ đồ đó, Máu tối đa đã cộng sẵn Máu từ trang bị.
  Mọi thứ khác (thẻ, vàng, bảo vật, Máu) vẫn reset mỗi lượt.
  Hồ sơ được lưu cùng chỗ với bản lưu lượt chơi (localStorage, hoặc máy chủ nếu đã đăng nhập): khi hết lượt chơi, bản lưu
  được thay bằng `{hero, keys, equip, bag, coins, gems, xp, prog, hp:0, deck:[]}` nên nút Tiếp tục không hiện nhưng nhân vật,
  chìa khóa, trang bị, xu, ngọc, cấp độ và tiến độ vẫn còn. Đăng xuất sẽ xóa bản lưu tạm trên máy để không lẫn sang tài khoản khác.
- **Trang chủ** (`frontend/js/home.js`, kiểu game di động): thanh trên có ảnh nhân vật + cấp độ + thanh kinh nghiệm, xu 🪙, ngọc 💠
  và ⚙️ cài đặt (âm thanh, tài khoản). Ở giữa là hòn đảo của từng màn (◀ ▶ để chọn, màn sau mở khi đánh bại trùm màn trước),
  "Kết quả tốt nhất (n/9)", "Kỷ lục", 3 rương thưởng và nút "Phiêu lưu mới!" (bắt đầu từ màn đang chọn) / "Tiếp tục".
  Thanh dưới: 🏪 Cửa hàng, 🎒 Trang bị, 🌍 Phiêu lưu (ba **tab** ngay trong trang chủ), 🧰 Kho báu (huy hiệu = số chìa khóa), 🏆 Xếp hạng.
  Bấm ảnh nhân vật để xem thẻ nhân vật.
- **Hình nhân vật (sprite sheet)**: `HERO_ART` trong `data.js`. Lạc Phong có `img/hero-kiem.webp` (dải 4 khung cùng cỡ: 0 đứng yên, 1 phòng thủ, 2 tấn công, 3 hiệu ứng)
  và `img/hero-kiem-face.webp` (chân dung cho ảnh đại diện/thẻ chọn). Trong trận, thẻ gây sát thương → tư thế tấn công, thẻ chỉ có Giáp → phòng thủ,
  các thẻ còn lại (buff, bốc bài, năng lực...) → hiệu ứng, rồi tự về đứng yên (`poseOf`, `setPose` trong `game.js`). Muốn thêm hình cho nhân vật khác:
  làm dải 4 khung cùng cỡ rồi khai báo thêm vào `HERO_ART` và gắn `art` cho nhân vật; chưa có `art` thì dùng emoji như cũ.
- **Tab Trang bị** (xưởng rèn): nhân vật ở giữa, 6 ô trang bị hai bên (găng tay/nhẫn/giày và vũ khí/mũ/giáp), bảng Tấn công/Phòng thủ/Máu
  (kèm phần cộng từ đồ), túi đồ dạng lưới 4 cột. Chạm món trong túi → bảng chi tiết (so sánh với đồ đang mặc, **Mặc** / **Bán** lấy xu:
  `SELL_PRICE`); chạm ô đang mặc → **Tháo**. Dấu ▲ = tốt hơn đồ đang mặc. Nút sắp xếp quay vòng Mặc định / Độ hiếm / Theo ô (chỉ đổi cách
  hiển thị). Nút **Hợp nhất**: 3 món trong túi cùng ô + cùng độ hiếm → 1 món cùng ô, độ hiếm cao hơn (Thường → Tốt → Hiếm), tự hợp nhất dây chuyền.
  Trong lượt chơi, nút 🎒 trên thanh trên vẫn mở bảng trang bị gọn như trước.
- **Tab Cửa hàng** (`SHOP_CHESTS`, `HOME_SHOP` trong `data.js`): **Rương Đặc Biệt** (💠10 / ×10 = 💠90: từ Tốt trở lên, 40% Hiếm), **Rương Thường**
  (1 🗝️ = Kho Báu), **Rương Hiếm** (3 🗝️: từ Tốt trở lên, 25% Hiếm), và mục Chìa khóa (×1 = 150 xu, ×5 = 10 ngọc). Hai rương đặc biệt/hiếm có
  **bảo hiểm**: cứ 10 lần mở chưa ra Hiếm thì lần thứ 10 chắc chắn ra Hiếm (bộ đếm `prog.pity` lưu cùng hồ sơ).
- **Rương thưởng vượt ải lần đầu**: mỗi màn có 9 tầng; ở các tầng 3, 6, 9 (trùm) có 1 rương (`ACT_CHESTS`, `FIRST_CLEAR` trong
  `data.js`). Lần đầu đi tới tầng đó thì rương sáng lên ở trang chủ, bấm để nhận **một lần duy nhất**: xu, ngọc, chìa khóa, và rương
  cuối mỗi màn còn có 1 trang bị chắc chắn (màn 1: từ tốt trở lên, màn 2-3: đồ hiếm). Chỉnh phần thưởng ở `FIRST_CLEAR`.
- **Xu, ngọc, cấp độ, cửa hàng**: xu 🪙 = 30% vàng còn lại + 2/mỗi kẻ địch hạ + 100 nếu thắng, cộng khi hết lượt chơi. Ngọc 💠 từ rương
  vượt ải và lên cấp (+2/cấp). Kinh nghiệm: 5 (trận thường), 12 (tinh anh), 30 (trùm), 50 (thắng cả hành trình); cấp n+1 cần 50+25·(n-1) kinh nghiệm.
  Mặc/tháo trang bị, mở rương và mở Kho Báu làm được ngay ở trang chủ. Lượt bắt đầu từ màn > 1 không được ghi lên bảng xếp hạng.
- **Quái** cũng có `atk`/`def`; chiêu thức `d`/`b` là % chỉ số của quái. Bảng `ENEMIES` là chỉ số **gốc** (lượt đầu,
  chưa có đồ). Vì trang bị được giữ qua các lượt (mô phỏng cho thấy sau ~5 lượt người chơi bắt đầu với Tấn công x2.5-3.2,
  Phòng thủ x4-5, Máu x1.5), game có **độ khó thích ứng** (`GEAR_SCALE` trong `data.js`): khi vào trận quái được nhân thêm
  theo trang bị người chơi: Máu và Phòng thủ quái x(1 + 0.6 hoặc 0.5 × mức tăng Tấn công), Tấn công quái x(1 + 0.3 × mức tăng
  trung bình của Phòng thủ và Máu). Chưa có đồ thì hệ số = 1; đặt `GEAR_SCALE` = 0 để tắt. Người chơi vẫn mạnh hơn thật nhờ
  trang bị (tăng ròng khoảng x1.2-1.4 sức công), chỉ là không còn "đi dạo" khi đã đủ đồ.

## Chạy trên máy (cần Node.js 18 trở lên)

```bash
cd backend
npm install
cp .env.example .env        # rồi sửa JWT_SECRET thành chuỗi bí mật dài
npm start
```

Mở http://localhost:3000 để chơi. Backend phục vụ luôn frontend, nên không cần cấu hình gì thêm.
Database là file `backend/data/thebai.db`, tự tạo ở lần chạy đầu.

Chạy kiểm thử: `npm test`

## Chạy bằng Docker

```bash
docker compose up -d --build
```

Nhớ sửa `JWT_SECRET` trong `docker-compose.yml`. Dữ liệu nằm trong volume `thebai-data`.

## Host frontend và backend ở hai nơi khác nhau

- Backend: đặt `FRONTEND_DIR=` (để trống) và `CORS_ORIGIN=https://ten-mien-frontend.com`.
- Frontend: trong `index.html`, sửa dòng `window.API_BASE = ""` thành địa chỉ backend,
  ví dụ `window.API_BASE = "https://api.ten-mien.com"`.

## API

| Phương thức | Đường dẫn | Cần đăng nhập | Mô tả |
|---|---|---|---|
| POST | /api/auth/register | | Đăng ký `{username, password}` → `{token, user}` |
| POST | /api/auth/login | | Đăng nhập → `{token, user}` |
| GET | /api/auth/me | ✔ | Thông tin người dùng |
| GET | /api/save | ✔ | Lấy lượt chơi đang dở |
| PUT | /api/save | ✔ | Lưu lượt chơi `{data}` (tự động mỗi khi về bản đồ) |
| POST | /api/runs | ✔ | Ghi kết quả lượt chơi; **server tự tính điểm** |
| GET | /api/runs/me | ✔ | 20 lượt chơi gần nhất |
| GET | /api/stats/me | ✔ | Thống kê cá nhân |
| GET | /api/leaderboard?hero= | | Top 20 (điểm cao nhất mỗi người, lọc theo anh hùng) |

Gửi token qua header `Authorization: Bearer <token>`.

**Điểm** = tầng × 10 + kẻ địch hạ × 5 + (màn − 1) × 150 + vàng (tối đa 2000) + 1000 nếu thắng.

## Database (SQLite)

- `users`: tài khoản, mật khẩu băm bằng bcrypt
- `saves`: mỗi người một bản lưu (JSON)
- `runs`: lịch sử lượt chơi, dùng cho xếp hạng và thống kê

Muốn đổi sang MySQL/PostgreSQL: chỉ cần thay `src/db.js` và các câu SQL trong `src/routes/`.

## Lưu ý

- Chưa đăng nhập vẫn chơi được (chế độ khách, lưu game trên máy). Khi đăng nhập, bản lưu
  trên máy được đẩy lên server nếu server chưa có bản nào.
- Trận đấu chạy ở trình duyệt, nên người chơi rành kỹ thuật vẫn có thể sửa kết quả gửi lên.
  Server đã kiểm tra số liệu hợp lệ và tự tính điểm, nhưng chống gian lận hoàn toàn thì
  phải chuyển logic trận đấu lên server.
