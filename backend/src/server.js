require('dotenv').config();
const path = require('path');
const { openDb } = require('./db');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('Thiếu JWT_SECRET (ít nhất 16 ký tự). Sao chép .env.example thành .env và đặt chuỗi bí mật.');
  process.exit(1);
}
const frontendDir = process.env.FRONTEND_DIR === undefined ? path.join(__dirname, '..', '..', 'frontend') : process.env.FRONTEND_DIR;
(async () => {
  const db = await openDb(process.env.DB_PATH || path.join(__dirname, '..', 'data', 'thebai.db'));
  console.log(process.env.TURSO_DATABASE_URL ? 'Database: Turso (lưu lâu dài)' : 'Database: file cục bộ (trên Render free sẽ mất khi khởi động lại)');
  const app = createApp({ db, jwtSecret: JWT_SECRET, frontendDir: frontendDir || null, corsOrigin: process.env.CORS_ORIGIN || '*' });
  app.listen(PORT, () => console.log(`Thiên Mệnh Thẻ Bài chạy tại http://localhost:${PORT}`));
})().catch(e => { console.error('Không mở được database:', e.message); process.exit(1); });
