const form = document.getElementById('shorten-form');
const messageEl = document.getElementById('form-message');
const linksListEl = document.getElementById('links-list');
const refreshBtn = document.getElementById('refresh-btn');

function showMessage(text, type) {
  messageEl.textContent = text;
  messageEl.className = `message ${type}`;
}

function formatDate(isoString) {
  if (!isoString) return '—';
  const date = new Date(isoString.replace(' ', 'T') + 'Z');
  return date.toLocaleString('pt-BR');
}

function renderLinks(links) {
  if (!links.length) {
    linksListEl.innerHTML = '<p class="empty-state">Nenhum link criado ainda.</p>';
    return;
  }

  linksListEl.innerHTML = links
    .map(
      (link) => `
      <div class="link-item">
        <div class="short-url">${link.shortUrl}</div>
        <div class="original-url">${link.originalUrl}</div>
        <div class="stats">
          <span>Cliques: <strong>${link.clicks}</strong></span>
          <span>Criado em: <strong>${formatDate(link.createdAt)}</strong></span>
          <span>Último acesso: <strong>${formatDate(link.lastAccess)}</strong></span>
        </div>
        <button class="copy-btn" data-url="${link.shortUrl}">Copiar</button>
      </div>
    `
    )
    .join('');

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await navigator.clipboard.writeText(btn.dataset.url);
      btn.textContent = 'Copiado!';
      setTimeout(() => (btn.textContent = 'Copiar'), 1500);
    });
  });
}

async function loadLinks() {
  try {
    const res = await fetch('/api/links');
    const links = await res.json();
    renderLinks(links);
  } catch (err) {
    linksListEl.innerHTML = '<p class="empty-state">Erro ao carregar os links.</p>';
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const url = document.getElementById('url').value.trim();
  const code = document.getElementById('code').value.trim();

  showMessage('Criando link...', '');

  try {
    const res = await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, code: code || undefined }),
    });
    const data = await res.json();

    if (!res.ok) {
      showMessage(data.error || 'Erro ao criar o link.', 'error');
      return;
    }

    showMessage(`Link criado: ${data.shortUrl}`, 'success');
    form.reset();
    loadLinks();
  } catch (err) {
    showMessage('Erro de conexão com o servidor.', 'error');
  }
});

refreshBtn.addEventListener('click', loadLinks);

loadLinks();
