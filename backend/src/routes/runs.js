const express = require('express');

const HEROES = ['kiem', 'bang', 'thach'];
// Điểm do server tính, không nhận điểm từ client
function calcScore({ win, act, floor, kills, gold }) {
  return floor * 10 + kills * 5 + (act - 1) * 150 + Math.min(gold, 2000) + (win ? 1000 : 0);
}
const int = (v, min, max) => Number.isInteger(v) && v >= min && v <= max;

module.exports = (db, auth) => {
  const r = express.Router();
  const insert = db.prepare(`INSERT INTO runs (user_id, hero, win, act, floor, kills, gold, deck_size, score)
    VALUES (@user_id, @hero, @win, @act, @floor, @kills, @gold, @deck_size, @score)`);
  const rankOf = db.prepare('SELECT COUNT(*) + 1 AS rank FROM runs WHERE score > ?');

  // Ghi nhận một lượt chơi đã kết thúc
  r.post('/runs', auth.required, (req, res) => {
    const b = req.body || {};
    const win = b.win ? 1 : 0;
    if (!HEROES.includes(b.hero) || !int(b.act, 1, 3) || !int(b.floor, 0, 40) || !int(b.kills, 0, 200) || !int(b.gold, 0, 99999) || !int(b.deckSize, 0, 200))
      return res.status(400).json({ error: 'Dữ liệu lượt chơi không hợp lệ' });
    if (win && (b.act !== 3 || b.floor < 9 * 3)) return res.status(400).json({ error: 'Kết quả không hợp lệ' });
    const row = { user_id: req.user.id, hero: b.hero, win, act: b.act, floor: b.floor, kills: b.kills, gold: b.gold, deck_size: b.deckSize };
    row.score = calcScore(row);
    const info = insert.run(row);
    res.status(201).json({ id: info.lastInsertRowid, score: row.score, rank: rankOf.get(row.score).rank });
  });

  // Lịch sử của tôi
  r.get('/runs/me', auth.required, (req, res) => {
    res.json({ runs: db.prepare('SELECT id, hero, win, act, floor, kills, gold, deck_size AS deckSize, score, created_at AS createdAt FROM runs WHERE user_id = ? ORDER BY id DESC LIMIT 20').all(req.user.id) });
  });

  // Thống kê của tôi
  r.get('/stats/me', auth.required, (req, res) => {
    const total = db.prepare('SELECT COUNT(*) AS runs, COALESCE(SUM(win),0) AS wins, COALESCE(MAX(score),0) AS best, COALESCE(SUM(kills),0) AS kills FROM runs WHERE user_id = ?').get(req.user.id);
    const byHero = db.prepare('SELECT hero, COUNT(*) AS runs, SUM(win) AS wins, MAX(score) AS best FROM runs WHERE user_id = ? GROUP BY hero').all(req.user.id);
    res.json({ ...total, byHero });
  });

  // Bảng xếp hạng: điểm cao nhất của mỗi người chơi
  r.get('/leaderboard', (req, res) => {
    const hero = HEROES.includes(req.query.hero) ? req.query.hero : null;
    const rows = db.prepare(`
      SELECT u.username, r.hero, r.win, r.act, r.floor, r.score, r.created_at AS createdAt
      FROM runs r JOIN users u ON u.id = r.user_id
      WHERE r.id = (SELECT r2.id FROM runs r2 WHERE r2.user_id = r.user_id ${hero ? 'AND r2.hero = @hero' : ''} ORDER BY r2.score DESC, r2.id ASC LIMIT 1)
      ORDER BY r.score DESC LIMIT 20`).all(hero ? { hero } : {});
    res.json({ leaderboard: rows });
  });
  return r;
};
module.exports.calcScore = calcScore;
