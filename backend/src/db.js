const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');

// Database dùng libSQL (SQLite tương thích):
//  - TURSO_DATABASE_URL (+ TURSO_AUTH_TOKEN): database trên Turso, dữ liệu KHÔNG mất khi server khởi động lại
//  - không có: dùng file SQLite cục bộ (DB_PATH) hoặc ':memory:' (dùng cho test)
const toRow = (rs, row) => Object.fromEntries(rs.columns.map((c, i) => [c, typeof row[i] === 'bigint' ? Number(row[i]) : row[i]]));

async function openDb(file, opts = {}) {
  const url = opts.url || process.env.TURSO_DATABASE_URL;
  const authToken = opts.authToken || process.env.TURSO_AUTH_TOKEN;
  let client;
  if (url) client = createClient({ url, authToken });
  else {
    if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
    client = createClient({ url: file === ':memory:' ? ':memory:' : 'file:' + path.resolve(file) });
  }
  await client.executeMultiple(fs.readFileSync(path.join(__dirname, '..', 'db', 'schema.sql'), 'utf8'));
  const run = (sql, args = []) => client.execute({ sql, args });
  return {
    async get(sql, args) { const rs = await run(sql, args); return rs.rows[0] ? toRow(rs, rs.rows[0]) : undefined; },
    async all(sql, args) { const rs = await run(sql, args); return rs.rows.map(r => toRow(rs, r)); },
    async run(sql, args) { const rs = await run(sql, args); return { changes: rs.rowsAffected, lastInsertRowid: Number(rs.lastInsertRowid) }; },
  };
}
module.exports = { openDb };
