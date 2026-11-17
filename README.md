# Thiên Mệnh Thẻ Bài: Frontend + Backend + Database

```
thebai/
├── frontend/              Game H5 (HTML/CSS/JS thuần, không cần build)
│   ├── index.html
│   ├── css/style.css
│   ├── js/fx.js           Âm thanh + engine hiệu ứng hạt + hiệu ứng từng thẻ
│   ├── js/data.js         Dữ liệu: anh hùng, thẻ bài, bảo vật, kẻ địch, màn chơi
│   ├── js/api.js          Gọi backend (đăng nhập, lưu game, xếp hạng)
│   ├── js/game.js         Logic game, giao diện, bản đồ, trận đấu
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

## Chạy trên máy (cần Node.js 22 trở lên)

```bash
cd backend
npm install
cp .env.example .env        # rồi sửa JWT_SECRET thành chuỗi bí mật dài
npm start
```

Mở http://localhost:3000 để chơi. Backend phục vụ luôn frontend, nên không cần cấu hình gì thêm.
Database là file `backend/data/thebai.db`, tự tạo ở lần chạy đầu.

Chạy kiểm thử: `npm test`

## Deploy lên Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/phuocloctmc1234-source/thien-menh-the-bai)

File `render.yaml` dùng gói **free** (khu vực Singapore). Gói free sẽ ngủ sau khoảng 15 phút không ai chơi
và **mất database mỗi lần khởi động lại**. Muốn giữ dữ liệu: đổi `plan: starter` và bật phần `disk` trong `render.yaml`.

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
| DELETE | /api/save | ✔ | Xóa bản lưu (khi kết thúc lượt chơi) |
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
