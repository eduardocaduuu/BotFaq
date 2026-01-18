const faqList = [
  {
    id: 'reembolso',
    keyword: 'reembolso',
    question: 'Como pedir reembolso?',
    answer: 'Para solicitar reembolso, preencha o formulário de despesas e envie para o financeiro junto com os comprovantes.'
  },
  {
    id: 'horario',
    keyword: 'horario',
    question: 'Qual o horário de atendimento?',
    answer: 'Nosso horário de atendimento é de segunda a sexta-feira, das 09:00 às 18:00.'
  },
  {
    id: 'senha',
    keyword: 'senha',
    question: 'Esqueci a senha, o que fazer?',
    answer: 'Para recuperar sua senha, acesse o portal do colaborador e clique em "Esqueci minha senha".'
  }
];

function findAnswer(text) {
  if (!text) return null;
  const lowerText = text.toLowerCase();
  return faqList.find(item => lowerText.includes(item.keyword.toLowerCase()));
}

module.exports = { faqList, findAnswer };
