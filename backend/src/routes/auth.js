const express = require('express');
const bcrypt = require('bcryptjs');

const USER_RE = /^[a-zA-Z0-9_]{3,20}$/;

// Giới hạn số lần thử đăng nhập đơn giản (theo IP, trong bộ nhớ)
function limiter(max, windowMs) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now(), key = req.ip;
    const arr = (hits.get(key) || []).filter(t => now - t < windowMs);
    if (arr.length >= max) return res.status(429).json({ error: 'Thử quá nhiều lần, vui lòng đợi một lát' });
    arr.push(now); hits.set(key, arr); next();
  };
}

module.exports = (db, auth) => {
  const r = express.Router();
  const lim = limiter(20, 10 * 60 * 1000);
  const findUser = db.prepare('SELECT * FROM users WHERE username = ?');
  const insertUser = db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');

  r.post('/register', lim, (req, res) => {
    const { username, password } = req.body || {};
    if (!USER_RE.test(username || '')) return res.status(400).json({ error: 'Tên đăng nhập 3-20 ký tự, chỉ gồm chữ không dấu, số và _' });
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) return res.status(400).json({ error: 'Mật khẩu cần từ 6 ký tự' });
    if (findUser.get(username)) return res.status(409).json({ error: 'Tên đăng nhập đã có người dùng' });
    const info = insertUser.run(username, bcrypt.hashSync(password, 10));
    const user = { id: info.lastInsertRowid, username };
    res.status(201).json({ token: auth.sign(user), user });
  });

  r.post('/login', lim, (req, res) => {
    const { username, password } = req.body || {};
    const u = findUser.get(username || '');
    if (!u || !bcrypt.compareSync(String(password || ''), u.password_hash)) return res.status(401).json({ error: 'Sai tên đăng nhập hoặc mật khẩu' });
    res.json({ token: auth.sign(u), user: { id: u.id, username: u.username } });
  });

  r.get('/me', auth.required, (req, res) => res.json({ user: req.user }));
  return r;
};
