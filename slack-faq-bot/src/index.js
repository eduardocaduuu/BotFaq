const { App } = require('@slack/bolt');
require('dotenv').config();

const { findAnswer } = require('./faq');
const TEXTS = require('./texts-ptbr');
const { startHealthServer } = require('./health');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// Listener do comando /faq
app.command('/faq', async ({ command, ack, client }) => {
  await ack();

  try {
    await client.views.open({
      trigger_id: command.trigger_id,
      view: {
        type: 'modal',
        callback_id: 'faq_submission',
        title: {
          type: 'plain_text',
          text: TEXTS.MODAL_TITLE
        },
        blocks: [
          {
            type: 'input',
            block_id: 'search_block',
            label: {
              type: 'plain_text',
              text: TEXTS.SEARCH_LABEL
            },
            element: {
              type: 'plain_text_input',
              action_id: 'search_input',
              placeholder: {
                type: 'plain_text',
                text: TEXTS.SEARCH_PLACEHOLDER
              }
            }
          }
        ],
        submit: {
          type: 'plain_text',
          text: TEXTS.SUBMIT_BTN
        },
        close: {
          type: 'plain_text',
          text: TEXTS.CLOSE_BTN
        }
      }
    });
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
  }
});

// Listener da submissão da modal
app.view('faq_submission', async ({ ack, view, client, body }) => {
  await ack();

  const userId = body.user.id;
  const query = view.state.values.search_block.search_input.value;
  const answer = findAnswer(query);

  let text = TEXTS.NO_ANSWER_FOUND;
  if (answer) {
    text = `*${answer.question}*\n${answer.answer}`;
  }

  try {
    // Responde via DM para o usuário
    await client.chat.postMessage({
      channel: userId,
      text: text
    });
  } catch (error) {
    console.error('Erro ao enviar DM:', error);
  }
});

// Inicialização
(async () => {
  const port = process.env.PORT || 3000;
  
  // Inicia o servidor de Health Check
  startHealthServer(port);

  // Inicia o App Bolt
  await app.start(port);
  
  console.log('⚡️ Slack FAQ Bot rodando em Socket Mode!');
  console.log(`Health check disponível na porta ${port}`);
})();
