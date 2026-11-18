const test = require('node:test');
const assert = require('node:assert');
const { openDb } = require('../src/db');
const { createApp } = require('../src/app');

test('luồng API: đăng ký, lưu game, ghi lượt chơi, xếp hạng', async () => {
  const app = createApp({ db: await openDb(':memory:'), jwtSecret: 'test-secret-1234567890', frontendDir: null });
  const srv = app.listen(0); const base = `http://localhost:${srv.address().port}/api`;
  const call = async (m, p, body, token) => { const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); return { s: r.status, j: await r.json() }; };
  try {
    let r = await call('POST', '/auth/register', { username: 'jay_01', password: 'matkhau1' });
    assert.equal(r.s, 201); const tok = r.j.token;
    assert.equal((await call('POST', '/auth/register', { username: 'JAY_01', password: 'matkhau1' })).s, 409);
    assert.equal((await call('POST', '/auth/login', { username: 'jay_01', password: 'sai' })).s, 401);
    assert.equal((await call('POST', '/auth/login', { username: 'jay_01', password: 'matkhau1' })).s, 200);
    assert.equal((await call('GET', '/save')).s, 401);
    assert.equal((await call('GET', '/save', null, tok)).j.data, null);
    assert.equal((await call('PUT', '/save', { data: { hero: 'kiem', deck: [{ id: 'chem' }], act: 1, floor: 3 } }, tok)).s, 200);
    assert.equal((await call('GET', '/save', null, tok)).j.data.floor, 3);
    // nhân vật bị khóa: không đổi được sang anh hùng khác, cũng không có API xóa bản lưu để chọn lại
    assert.equal((await call('PUT', '/save', { data: { hero: 'bang', deck: [{ id: 'chem' }], act: 1, floor: 1 } }, tok)).s, 409);
    assert.equal((await call('GET', '/save', null, tok)).j.data.hero, 'kiem');
    assert.equal((await call('PUT', '/save', { data: { hero: 'kiem', deck: [], act: 1, floor: 0, hp: 0, profile: true } }, tok)).s, 200);
    assert.equal((await call('DELETE', '/save', null, tok)).s, 404);
    assert.equal((await call('GET', '/save', null, tok)).j.data.hero, 'kiem');
    r = await call('POST', '/runs', { hero: 'kiem', win: false, act: 1, floor: 9, kills: 12, gold: 50, deckSize: 14 }, tok);
    assert.equal(r.s, 201); assert.equal(r.j.score, 9 * 10 + 12 * 5 + 50); assert.equal(r.j.rank, 1);
    assert.equal((await call('POST', '/runs', { hero: 'kiem', win: true, act: 1, floor: 3, kills: 1, gold: 1, deckSize: 1 }, tok)).s, 400);
    assert.equal((await call('POST', '/runs', { hero: 'kiem', win: true, act: 3, floor: 27, kills: 30, gold: 1, deckSize: 10 }, tok)).s, 400); // thắng phải ở màn cuối (7)
    assert.equal((await call('POST', '/runs', { hero: 'kiem', win: false, act: 8, floor: 5, kills: 1, gold: 1, deckSize: 10 }, tok)).s, 400); // quá số màn
    assert.equal((await call('POST', '/runs', { hero: 'kiem', win: true, act: 7, floor: 63, kills: 120, gold: 300, deckSize: 10 }, tok)).s, 201);
    r = await call('GET', '/leaderboard');
    assert.equal(r.j.leaderboard[0].username, 'jay_01');
    r = await call('GET', '/stats/me', null, tok); assert.equal(r.j.runs, 2);
  } finally { srv.close(); }
});
