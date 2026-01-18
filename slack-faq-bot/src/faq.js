// Função para normalizar texto (remove acentos, pontuação e minúsculas)
function normalize(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove pontuação
    .replace(/\s+/g, ' ') // Remove espaços duplos
    .trim();
}

const faqList = [
  {
    id: 'reembolso',
    category: 'Pagamentos',
    keywords: ['dinheiro', 'devolucao', 'gasto', 'despesa', 'nota', 'fiscal', 'comprovante'],
    question: 'Como pedir reembolso?',
    answer: 'Para solicitar reembolso, preencha o formulário de despesas e envie para o financeiro junto com os comprovantes.'
  },
  {
    id: 'horario',
    category: 'Ponto',
    keywords: ['expediente', 'funcionamento', 'aberto', 'fechado', 'entrada', 'saida', 'jornada'],
    question: 'Qual o horário de atendimento?',
    answer: 'Nosso horário de atendimento é de segunda a sexta-feira, das 09:00 às 18:00.'
  },
  {
    id: 'senha',
    category: 'Sistemas',
    keywords: ['acesso', 'login', 'esqueci', 'recuperar', 'portal', 'resetar'],
    question: 'Esqueci a senha, o que fazer?',
    answer: 'Para recuperar sua senha, acesse o portal do colaborador e clique em "Esqueci minha senha".'
  }
];

function searchFaq(query) {
  if (!query) return { best: null, suggestions: [] };

  const normQuery = normalize(query);
  // Tokeniza e remove palavras muito curtas (stopwords básicas implícitas)
  const tokens = normQuery.split(' ').filter(t => t.length > 2);

  if (tokens.length === 0) return { best: null, suggestions: [] };

  const scored = faqList.map(item => {
    let score = 0;
    const normQuestion = normalize(item.question);
    const normCategory = normalize(item.category);
    const itemKeywords = (item.keywords || []).map(k => normalize(k));

    tokens.forEach(token => {
      // Peso 3: Match em keywords explícitas
      if (itemKeywords.some(k => k.includes(token))) score += 3;
      // Peso 2: Match na pergunta
      if (normQuestion.includes(token)) score += 2;
      // Peso 1: Match na categoria
      if (normCategory.includes(token)) score += 1;
    });

    return { item, score };
  });

  // Filtra scores > 0 e ordena decrescente
  const results = scored
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score);

  if (results.length === 0) return { best: null, suggestions: [] };

  // Limiar para considerar "resposta exata"
  const THRESHOLD = 3;
  const bestMatch = results[0];

  if (bestMatch.score >= THRESHOLD) {
    return { best: bestMatch.item, suggestions: [] };
  } else {
    // Retorna top 3 sugestões
    return { best: null, suggestions: results.slice(0, 3).map(r => r.item) };
  }
}

function getFaqById(id) {
  return faqList.find(item => item.id === id);
}

module.exports = { faqList, searchFaq, getFaqById };
