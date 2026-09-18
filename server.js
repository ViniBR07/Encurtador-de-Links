const path = require('path');
const express = require('express');
const { nanoid } = require('nanoid');
const { statements } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const CODE_LENGTH = 6;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isValidUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function buildShortUrl(req, code) {
  return `${req.protocol}://${req.get('host')}/${code}`;
}

// Cria um novo link encurtado
app.post('/api/links', (req, res) => {
  const { url, code: customCode } = req.body || {};

  if (!url || typeof url !== 'string' || !isValidUrl(url)) {
    return res.status(400).json({
      error: 'URL inválida. Envie um campo "url" começando com http:// ou https://.',
    });
  }

  let code = (customCode || '').trim();

  if (code) {
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(code)) {
      return res.status(400).json({
        error: 'Código customizado inválido. Use de 3 a 20 caracteres alfanuméricos, "-" ou "_".',
      });
    }
    if (statements.findByCode.get(code)) {
      return res.status(409).json({ error: 'Esse código já está em uso.' });
    }
  } else {
    do {
      code = nanoid(CODE_LENGTH);
    } while (statements.findByCode.get(code));
  }

  statements.insertLink.run({ code, original_url: url });
  const link = statements.findByCode.get(code);

  return res.status(201).json({
    code: link.code,
    originalUrl: link.original_url,
    shortUrl: buildShortUrl(req, link.code),
    clicks: link.clicks,
    createdAt: link.created_at,
  });
});

// Lista todos os links com estatísticas básicas
app.get('/api/links', (req, res) => {
  const links = statements.listAll.all().map((link) => ({
    code: link.code,
    originalUrl: link.original_url,
    shortUrl: buildShortUrl(req, link.code),
    clicks: link.clicks,
    createdAt: link.created_at,
    lastAccess: link.last_access,
  }));
  res.json(links);
});

// Retorna estatísticas de um link específico
app.get('/api/links/:code/stats', (req, res) => {
  const link = statements.findByCode.get(req.params.code);
  if (!link) {
    return res.status(404).json({ error: 'Link não encontrado.' });
  }
  res.json({
    code: link.code,
    originalUrl: link.original_url,
    shortUrl: buildShortUrl(req, link.code),
    clicks: link.clicks,
    createdAt: link.created_at,
    lastAccess: link.last_access,
  });
});

// Redireciona para a URL original e contabiliza o acesso
app.get('/:code', (req, res, next) => {
  const { code } = req.params;
  // Evita conflitar com possíveis assets estáticos futuros
  if (code.includes('.')) return next();

  const link = statements.findByCode.get(code);
  if (!link) {
    return res.status(404).json({ error: 'Link não encontrado.' });
  }

  statements.registerClick.run(code);
  return res.redirect(302, link.original_url);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
