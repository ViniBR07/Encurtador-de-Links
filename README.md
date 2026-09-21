# 🔗 Encurtador de Links

Desafio técnico.

API REST em Node.js/Express para encurtar URLs e contabilizar acessos, com uma
interface web simples para criar links e consultar estatísticas.

## Stack

- **Backend:** Node.js + Express
- **Armazenamento:** arquivo JSON local (`data.json`), lido/escrito de forma
  síncrona em `db.js`
- **Frontend:** HTML, CSS e JavaScript puros (sem framework), servidos como
  estáticos pelo próprio Express

Optei por uma stack sem frameworks de frontend para manter o projeto simples de
rodar (um único `npm install` e `npm start`) e para deixar claro, no código, o
fluxo completo de requisição → API → banco → resposta.

Inicialmente usei SQLite via `better-sqlite3`, mas troquei para um arquivo JSON
porque esse pacote exige compilação nativa (node-gyp) na instalação, o que
falhou em ambiente Windows sem as Build Tools do Visual Studio instaladas.
Como o volume de dados de um teste técnico é pequeno, um arquivo JSON
(`db.js` expõe as mesmas funções que a camada SQLite expunha, então o resto do
código não precisou mudar) resolve sem exigir nenhuma dependência nativa —
o projeto roda com `npm install` puro em qualquer máquina.

## Como rodar

Pré-requisitos: Node.js 18+ instalado.

```bash
npm install
npm start
```

A aplicação sobe em `http://localhost:3000`. O arquivo `data.sqlite` é criado
automaticamente na primeira execução (schema definido em `db.js`).

Para desenvolvimento com reload automático:

```bash
npm run dev
```

## Endpoints da API

| Método | Rota                     | Descrição                                                        |
|--------|---------------------------|--------------------------------------------------------------------|
| POST   | `/api/links`              | Cria um link. Body: `{ "url": "https://...", "code": "opcional" }` |
| GET    | `/api/links`               | Lista todos os links com estatísticas                             |
| GET    | `/api/links/:code/stats`  | Retorna estatísticas de um link específico                        |
| GET    | `/:code`                   | Redireciona para a URL original e contabiliza o clique            |

### Exemplo

```bash
curl -X POST http://localhost:3000/api/links \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.anthropic.com/claude"}'
```

Resposta:

```json
{
  "code": "lB-oiO",
  "originalUrl": "https://www.anthropic.com/claude",
  "shortUrl": "http://localhost:3000/lB-oiO",
  "clicks": 0,
  "createdAt": "2026-09-18 01:28:11"
}
```

## Decisões e priorização

- **Código customizado opcional:** além de gerar um código aleatório (via
  `nanoid`), o usuário pode sugerir seu próprio código (ex: `/meulink`). Achei
  que agregava valor real ao caso de uso de um encurtador e o custo de
  implementação era baixo.
- **Validação de URL:** só aceito URLs `http`/`https` bem formadas, retornando
  `400` com mensagem clara em caso de erro. Código customizado inválido ou já
  em uso também retorna erro tratado (`400`/`409`).
- **Contagem de cliques e último acesso:** cada redirecionamento incrementa o
  contador e atualiza o timestamp de último acesso, exibidos na interface.
- **Arquivo JSON em vez de um banco em memória:** garante que os links
  sobrevivem a um restart do servidor, sem exigir configuração extra de
  infraestrutura nem dependências nativas.

## O que ficou de fora (e por quê)

Priorizei ter a API e a interface completas e testadas ponta a ponta. Por
limitação de tempo, não implementei:

- **Autenticação de usuários** — o encurtador é público/single-tenant; não era
  requisito do desafio e adicionaria complexidade desproporcional ao escopo.
- **Testes automatizados (unitários/integração)** — validei manualmente todos
  os fluxos (criação, redirecionamento, estatísticas, erros de validação e
  código duplicado/inexistente), mas não há suíte de testes no repositório.
- **Expiração de links / rate limiting** — melhorias naturais para um produto
  real, fora do escopo do desafio.
- **Paginação na listagem de links** — a lista de links (`GET /api/links`) não
  pagina os resultados; para o volume esperado em um teste técnico não parecia
  necessário, mas seria o próximo passo natural em produção.

## Estrutura do projeto

```
url-shortener/
├── server.js          # rotas da API e servidor Express
├── db.js              # camada de armazenamento (arquivo data.json)
├── package.json
├── public/             # frontend estático
│   ├── index.html
│   ├── style.css
│   └── script.js
└── README.md
```
