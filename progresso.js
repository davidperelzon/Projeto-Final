/*
 * progresso.js
 *
 * Funções simples (sem tela) para o progresso do estudante:
 *   - sequência de dias estudados ("streak")
 *   - meta diária de XP
 *   - histórico dos últimos dias
 *   - conquistas
 * Tudo é calculado a partir dos dados REAIS guardados no usuário
 * (userDB.js): nada é inventado.
 *
 * Como os dias são guardados: um objeto { "2026-10-02": 35, ... } com o
 * XP ganho em cada dia (data no fuso do aparelho).
 */

// Meta diária de XP (altere aqui).
export const META_DIARIA_XP = 30;

// Quantos dias de histórico guardamos.
export const DIAS_GUARDADOS = 90;

const NOMES_DIAS = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

// "2026-10-02" no fuso do aparelho.
export function chaveDia(data = new Date()) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Devolve um novo objeto de dias com `quantidade` XP somados a `data`.
export function somarXpNoDia(dias, quantidade, data = new Date()) {
  const novo = { ...(dias || {}) };
  const chave = chaveDia(data);
  novo[chave] = (novo[chave] || 0) + quantidade;
  // Guarda só os últimos DIAS_GUARDADOS dias.
  const chaves = Object.keys(novo).sort();
  chaves.slice(0, Math.max(0, chaves.length - DIAS_GUARDADOS)).forEach((k) => delete novo[k]);
  return novo;
}

export function xpDoDia(dias, data = new Date()) {
  return (dias && dias[chaveDia(data)]) || 0;
}

// Dia anterior (sem problemas com horário de verão: usa o meio-dia).
function diaAnterior(data) {
  const d = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12);
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Quantos dias seguidos o estudante estudou (ganhou XP).
 * Conta a partir de hoje; se hoje ainda não estudou, conta a partir de
 * ontem (a sequência só "quebra" se ontem também ficou sem estudar).
 */
export function calcularSequencia(dias, data = new Date()) {
  if (!dias) return 0;
  let cursor = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12);
  if (!dias[chaveDia(cursor)]) cursor = diaAnterior(cursor);

  let total = 0;
  // Limite de segurança: o histórico guarda no máximo DIAS_GUARDADOS dias.
  while (total < DIAS_GUARDADOS + 5 && dias[chaveDia(cursor)] > 0) {
    total += 1;
    cursor = diaAnterior(cursor);
  }
  return total;
}

// Últimos `quantidade` dias (do mais antigo ao de hoje), para o gráfico.
export function ultimosDias(dias, quantidade = 7, data = new Date()) {
  const lista = [];
  let cursor = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12);
  for (let i = 0; i < quantidade; i++) {
    lista.unshift({
      chave: chaveDia(cursor),
      rotulo: NOMES_DIAS[cursor.getDay()],
      xp: (dias && dias[chaveDia(cursor)]) || 0,
      hoje: i === 0,
    });
    cursor = diaAnterior(cursor);
  }
  return lista;
}

/**
 * Conquistas. Cada uma mostra `atual` / `meta` e se foi desbloqueada.
 * Para criar uma nova, acrescente um item à lista.
 */
export function listarConquistas({ feitos, xp, sequencia }) {
  const conta = (prefixo) => feitos.filter((id) => id.startsWith(prefixo)).length;
  const itens = [
    { id: "primeira-letra", titulo: "Primeira letra", descricao: "Veja uma letra do alfabeto", atual: conta("letra:"), meta: 1 },
    { id: "alfabeto", titulo: "Alfabeto completo", descricao: "Veja as 22 letras", atual: conta("letra:"), meta: 22 },
    { id: "licoes", titulo: "Estudioso", descricao: "Conclua 3 lições", atual: conta("licao:"), meta: 3 },
    { id: "missoes", titulo: "Escritor iniciante", descricao: "Conclua 5 missões de escrita", atual: conta("missao:"), meta: 5 },
    { id: "quiz", titulo: "Mente afiada", descricao: "Acerte 10 questões diferentes", atual: conta("quiz:"), meta: 10 },
    { id: "constancia", titulo: "Constância", descricao: "Estude 3 dias seguidos", atual: sequencia, meta: 3 },
    { id: "nivel-basico", titulo: "Nível Básico", descricao: "Chegue a 150 XP", atual: xp, meta: 150 },
  ];
  return itens.map((item) => ({ ...item, atual: Math.min(item.atual, item.meta), ok: item.atual >= item.meta }));
}
