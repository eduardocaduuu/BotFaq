# Slack FAQ Bot (Grupo Alcina Maria) - Socket Mode

Este projeto cria um bot de FAQ no Slack baseado no documento de duvidas internas.

## O que o bot faz
- Comando `/faq` abre uma modal com:
  - campo opcional de busca (texto livre)
  - seletor de topicos
- O bot responde com uma **mensagem efemera** (so para quem chamou) no canal onde o comando foi usado.

## Por que precisa de backend (Render ou similar)
Mesmo usando Socket Mode (sem URL publica), o bot precisa **rodar 24/7** em algum lugar (um processo Node.js). Entao voce nao precisa de uma rota HTTP publica, mas precisa sim de um *runtime* (Render, Railway, VM, etc.).

## Setup no Slack (passo a passo)
1) Crie um app em https://api.slack.com/apps
2) Ative **Socket Mode**
   - Basic Information -> App-Level Tokens -> Create Token
   - Nome: socket
   - Escopo: `connections:write`
   - Copie o token `xapp-...` (SLACK_APP_TOKEN)
3) OAuth & Permissions
   - Adicione os Bot Token Scopes:
     - `chat:write`
     - `commands`
     - `users:read` (para mostrar nome do usuario no rodape)
   - Instale/Reinstale o app no workspace
   - Copie o Bot User OAuth Token `xoxb-...` (SLACK_BOT_TOKEN)
4) Basic Information -> App Credentials
   - Copie o Signing Secret (SLACK_SIGNING_SECRET)
5) Slash Command
   - Features -> Slash Commands -> Create New Command
   - Command: `/faq`
   - Request URL: pode colocar `https://example.com` (nao sera usada em Socket Mode, mas o Slack pede um valor)
   - Short description: FAQ interno
   - Save
6) Reinstale o app (quando o Slack pedir)

## Rodar local
```bash
cd slack-faq-bot
cp .env.example .env
# preencha os valores reais no .env
npm install
npm start
```

## Deploy no Render (plano gratuito)
O Render **nao oferece instancia gratuita para Background Worker** (apenas Web Service tem free). Por isso, este projeto sobe como **Web Service** com Socket Mode.

1) No Render: New -> **Web Service**
2) Conecte seu repo
3) Em *Environment Variables*, adicione:
   - `SLACK_BOT_TOKEN`
   - `SLACK_APP_TOKEN`
   - `SLACK_SIGNING_SECRET`
   - `BOT_NAME` (opcional)
4) Deploy

### Mantendo acordado (opcional)
No free tier, Web Services podem "dormir" apos um tempo sem trafego. Este bot expõe `GET /health`.
Se quiser reduzir "cold start", voce pode configurar um monitor HTTP (ex.: UptimeRobot) para pingar `https://SEU-SERVICO.onrender.com/health` periodicamente.

## Personalizar as respostas
Edite `src/faq.js`.

