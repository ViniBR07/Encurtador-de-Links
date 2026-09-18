const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'data.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Cria a tabela de links caso ainda não exista.
db.exec(`
  CREATE TABLE IF NOT EXISTS links (
    code        TEXT PRIMARY KEY,
    original_url TEXT NOT NULL,
    clicks      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    last_access TEXT
  )
`);

const statements = {
  insertLink: db.prepare(
    `INSERT INTO links (code, original_url) VALUES (@code, @original_url)`
  ),
  findByCode: db.prepare(`SELECT * FROM links WHERE code = ?`),
  registerClick: db.prepare(
    `UPDATE links
       SET clicks = clicks + 1,
           last_access = datetime('now')
     WHERE code = ?`
  ),
  listAll: db.prepare(
    `SELECT * FROM links ORDER BY created_at DESC`
  ),
};

module.exports = { db, statements };
