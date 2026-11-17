const path = require('path');
const express = require('express');
const cors = require('cors');
const { makeAuth } = require('./middleware/auth');

function createApp({ db, jwtSecret, frontendDir, corsOrigin = '*' }) {
  const app = express();
  const auth = makeAuth(jwtSecret);
  app.disable('x-powered-by');
  app.use(cors({ origin: corsOrigin === '*' ? true : corsOrigin.split(',').map(s => s.trim()) }));
  app.use(express.json({ limit: '300kb' }));

  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.use('/api/auth', require('./routes/auth')(db, auth));
  app.use('/api/save', require('./routes/save')(db, auth));
  app.use('/api', require('./routes/runs')(db, auth));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Không tìm thấy API' }));

  if (frontendDir) app.use(express.static(path.resolve(frontendDir)));
  app.use((err, req, res, next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON không hợp lệ' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Dữ liệu quá lớn' });
    console.error(err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  });
  return app;
}
module.exports = { createApp };
