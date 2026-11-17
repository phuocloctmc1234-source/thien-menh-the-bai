const express = require('express');

module.exports = (db, auth) => {
  const r = express.Router();
  r.use(auth.required);
  const get = db.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?');
  const put = db.prepare(`INSERT INTO saves (user_id, data, hero, act, floor, updated_at) VALUES (?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, hero = excluded.hero, act = excluded.act, floor = excluded.floor, updated_at = excluded.updated_at`);
  const del = db.prepare('DELETE FROM saves WHERE user_id = ?');

  // Lấy bản lưu
  r.get('/', (req, res) => {
    const row = get.get(req.user.id);
    res.json(row ? { data: JSON.parse(row.data), updatedAt: row.updated_at } : { data: null });
  });
  // Ghi đè bản lưu
  r.put('/', (req, res) => {
    const data = req.body && req.body.data;
    if (!data || typeof data !== 'object' || !data.hero || !Array.isArray(data.deck)) return res.status(400).json({ error: 'Dữ liệu lưu không hợp lệ' });
    put.run(req.user.id, JSON.stringify(data), String(data.hero), data.act | 0, data.floor | 0);
    res.json({ ok: true });
  });
  // Xóa bản lưu (khi kết thúc lượt chơi)
  r.delete('/', (req, res) => { del.run(req.user.id); res.json({ ok: true }); });
  return r;
};
