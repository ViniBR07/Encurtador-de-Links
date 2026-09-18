const fs = require('fs');
const path = require('path');

// Armazenamento simples em arquivo JSON.
// Optei por isso em vez de um banco SQLite nativo (ex: better-sqlite3) para
// evitar dependência de compilação nativa (node-gyp/Visual Studio Build
// Tools), que costuma falhar em máquinas Windows sem essas ferramentas
// instaladas. Para o volume de dados de um teste técnico, um arquivo JSON
// lido/escrito de forma síncrona é suficiente e mantém o projeto 100%
// portátil (roda com apenas `npm install`).

const dbPath = path.join(__dirname, 'data.json');

function readAll() {
  if (!fs.existsSync(dbPath)) return [];
  const raw = fs.readFileSync(dbPath, 'utf-8').trim();
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeAll(links) {
  fs.writeFileSync(dbPath, JSON.stringify(links, null, 2), 'utf-8');
}

function nowIso() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

const statements = {
  insertLink: {
    run({ code, original_url }) {
      const links = readAll();
      links.push({
        code,
        original_url,
        clicks: 0,
        created_at: nowIso(),
        last_access: null,
      });
      writeAll(links);
    },
  },

  findByCode: {
    get(code) {
      const links = readAll();
      return links.find((link) => link.code === code) || undefined;
    },
  },

  registerClick: {
    run(code) {
      const links = readAll();
      const link = links.find((item) => item.code === code);
      if (link) {
        link.clicks += 1;
        link.last_access = nowIso();
        writeAll(links);
      }
    },
  },

  listAll: {
    all() {
      const links = readAll();
      return [...links].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    },
  },
};

module.exports = { statements };
