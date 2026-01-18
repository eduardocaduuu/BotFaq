const { App } = require('@slack/bolt');
require('dotenv').config();

const { searchFaq, getFaqById } = require('./faq');
const TEXTS = require('./texts-ptbr');
const { startHealthServer } = require('./health');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true
});

// Função utilitária para abrir a modal
async function openFaqModal({ client, trigger_id, initialSearch }) {
  const view = {
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
          },
          initial_value: initialSearch || undefined
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
  };

  await client.views.open({
    trigger_id,
    view
  });
}

// Listener do comando /faq
app.command('/faq', async ({ command, ack, client }) => {
  await ack();

  try {
    await openFaqModal({ client, trigger_id: command.trigger_id });
  } catch (error) {
    console.error('Erro ao abrir modal:', error);
  }
});

// Evento: App Home Opened
app.event('app_home_opened', async ({ event, client, logger }) => {
  try {
    await client.views.publish({
      user_id: event.user,
      view: {
        type: 'home',
        blocks: [
          { type: 'header', text: { type: 'plain_text', text: TEXTS.HOME_HEADER } },
          { type: 'section', text: { type: 'mrkdwn', text: TEXTS.HOME_SUBHEADER } },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: TEXTS.BTN_OPEN_FAQ }, style: 'primary', action_id: 'home_open_faq' }
            ]
          },
          { type: 'divider' },
          { type: 'section', text: { type: 'mrkdwn', text: '*Navegue por temas:*' } },
          {
            type: 'actions',
            elements: [
              { type: 'button', text: { type: 'plain_text', text: TEXTS.CAT_PONTO }, action_id: 'home_cat_ponto' },
              { type: 'button', text: { type: 'plain_text', text: TEXTS.CAT_PAGAMENTOS }, action_id: 'home_cat_pagamentos' },
              { type: 'button', text: { type: 'plain_text', text: TEXTS.CAT_FERIAS }, action_id: 'home_cat_ferias' },
              { type: 'button', text: { type: 'plain_text', text: TEXTS.CAT_BENEFICIOS }, action_id: 'home_cat_beneficios' }
            ]
          },
          { type: 'context', elements: [{ type: 'mrkdwn', text: TEXTS.HOME_CONTEXT }] }
        ]
      }
    });
    logger.info(`Home publicada para ${event.user}`);
  } catch (error) {
    logger.error('Erro ao publicar Home:', error);
  }
});

// Action: Botão "Abrir FAQ" da Home
app.action('home_open_faq', async ({ ack, body, client }) => {
  await ack();
  try {
    await openFaqModal({ client, trigger_id: body.trigger_id });
  } catch (error) {
    console.error('Erro ao abrir modal via home:', error);
  }
});

// Action: Botões de Categoria (Regex)
app.action(/^home_cat_/, async ({ ack, body, client, action }) => {
  await ack();
  
  const map = {
    'home_cat_ponto': 'horario',
    'home_cat_pagamentos': 'pagamento',
    'home_cat_ferias': 'ferias',
    'home_cat_beneficios': 'beneficios'
  };
  
  const term = map[action.action_id] || '';
  
  try {
    await openFaqModal({ client, trigger_id: body.trigger_id, initialSearch: term });
  } catch (error) {
    console.error('Erro ao abrir modal via categoria:', error);
  }
});

// Listener da submissão da modal
app.view('faq_submission', async ({ ack, view, client, body }) => {
  await ack();

  const userId = body.user.id;
  const query = view.state.values.search_block.search_input.value;
  const { best, suggestions } = searchFaq(query);

  try {
    if (best) {
      // Resposta exata encontrada
      await client.chat.postMessage({
        channel: userId,
        text: `*${best.question}*\n${best.answer}`
      });
    } else if (suggestions.length > 0) {
      // Sugestões encontradas (score baixo)
      await client.chat.postMessage({
        channel: userId,
        text: TEXTS.SUGGESTION_HEADER,
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: TEXTS.SUGGESTION_HEADER } },
          {
            type: 'actions',
            elements: suggestions.map(item => ({
              type: 'button',
              text: { type: 'plain_text', text: item.question },
              value: item.id,
              action_id: 'faq_suggestion_select'
            }))
          }
        ]
      });
    } else {
      // Nenhuma correspondência
      await client.chat.postMessage({
        channel: userId,
        text: TEXTS.NO_ANSWER_FOUND
      });
    }
  } catch (error) {
    console.error('Erro ao enviar DM:', error);
  }
});

// Action: Seleção de sugestão (botões)
app.action('faq_suggestion_select', async ({ ack, body, client, action }) => {
  await ack();
  
  const item = getFaqById(action.value);
  const text = item 
    ? `*${item.question}*\n${item.answer}` 
    : TEXTS.NO_ANSWER_FOUND;

  try {
    await client.chat.postMessage({
      channel: body.user.id,
      text: text
    });
  } catch (error) {
    console.error('Erro ao responder sugestão:', error);
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
