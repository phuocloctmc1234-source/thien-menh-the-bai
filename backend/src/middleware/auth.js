const jwt = require('jsonwebtoken');

function makeAuth(secret) {
  return {
    sign(user) {
      return jwt.sign({ uid: user.id, name: user.username }, secret, { expiresIn: '30d' });
    },
    // Bắt buộc đăng nhập
    required(req, res, next) {
      const h = req.headers.authorization || '';
      const token = h.startsWith('Bearer ') ? h.slice(7) : null;
      if (!token) return res.status(401).json({ error: 'Bạn cần đăng nhập' });
      try {
        const p = jwt.verify(token, secret);
        req.user = { id: p.uid, username: p.name };
        next();
      } catch {
        res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn, hãy đăng nhập lại' });
      }
    },
  };
}
module.exports = { makeAuth };
