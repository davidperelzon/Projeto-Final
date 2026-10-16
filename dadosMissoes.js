/*
 * missoes.js
 *
 * MISSÕES DE ESCRITA: o app mostra uma palavra ou frase em PORTUGUÊS e
 * o usuário escreve em HEBRAICO usando o teclado virtual
 * (TecladoHebraico.js). Ao acertar, ganha XP (uma vez por missão).
 *
 * DE ONDE VÊM AS MISSÕES:
 *   Elas são criadas automaticamente a partir das listas PALAVRAS e
 *   FRASES do arquivo niveis.js. Para ADICIONAR UMA MISSÃO NOVA, basta
 *   acrescentar uma palavra ou frase em niveis.js -- não é preciso
 *   mexer aqui. A missão herda o nível (nivel) do item.
 *
 * ATENÇÃO: o id da missão (usado para guardar o XP) vem da
 * transliteração (`translit`). Se você mudar a transliteração de um item
 * já existente, a missão passa a ter outro id e pode render XP de novo.
 *
 * COMO A RESPOSTA É CONFERIDA (função conferirResposta):
 *   - Sinais de vogal (nikkud) e pontuação (? ! . ,) são ignorados.
 *   - Espaços repetidos são ignorados.
 *   - As formas finais (ך ם ן ף ץ) precisam estar corretas; se só elas
 *     estiverem erradas, o app avisa com uma dica em vez de dizer "errado".
 */

import { PALAVRAS, FRASES } from "./niveis";

// XP de cada tipo de missão (altere aqui).
export const XP_MISSAO_PALAVRA = 10;
export const XP_MISSAO_FRASE = 15;

// Quantidade máxima de caracteres aceita na caixa de resposta.
export const MAX_CARACTERES_RESPOSTA = 60;

// Cada forma final e a letra "normal" correspondente.
const FINAL_PARA_NORMAL = { "ך": "כ", "ם": "מ", "ן": "נ", "ף": "פ", "ץ": "צ" };

/**
 * Deixa um texto hebraico "comparável": tira sinais de vogal (nikkud),
 * pontuação e espaços repetidos.
 */
export function normalizarHebraico(texto) {
  let t = String(texto || "");
  try {
    // Separa letra e sinal de vogal (ex.: formas únicas do Unicode). Se o
    // aparelho não suportar, seguimos sem isso.
    if (typeof t.normalize === "function") t = t.normalize("NFD");
  } catch (erro) {
    // ignora: a comparação continua funcionando
  }
  return t
    .replace(/\u05BE/g, " ") // maqaf (hífen hebraico) vira espaço
    .replace(/[\u0591-\u05C7]/g, "") // nikkud e sinais de cantilação
    .replace(/[\u05F3\u05F4!?.,;:"'«»()\[\]\-–—\/\\]/g, " ") // pontuação
    .replace(/\s+/g, " ")
    .trim();
}

// Troca as formas finais pelas letras normais (usado só na comparação).
function semFormasFinais(texto) {
  return texto.replace(/[ךםןףץ]/g, (letra) => FINAL_PARA_NORMAL[letra]);
}

/**
 * Compara o que o usuário digitou com a resposta esperada.
 * `aceitas` = outras escritas que também valem como certas (opcional).
 * Devolve:
 *   "vazio"   -> nada foi digitado
 *   "certo"   -> resposta correta
 *   "finais"  -> certa, exceto pelas formas finais das letras
 *   "errado"  -> resposta diferente
 */
export function conferirResposta(digitado, esperado, aceitas = []) {
  const resposta = normalizarHebraico(digitado);
  if (resposta === "") return "vazio";

  // A resposta esperada e as escritas alternativas (`aceitas`).
  const corretas = [esperado, ...aceitas].map(normalizarHebraico);
  if (corretas.includes(resposta)) return "certo";
  if (corretas.some((c) => semFormasFinais(c) === semFormasFinais(resposta))) return "finais";
  return "errado";
}

// Transforma a transliteração em um texto simples para usar no id.
function fazerSlug(translit) {
  return String(translit)
    .toLowerCase()
    .replace(/á/g, "a")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Monta a lista de missões. Cada missão tem:
 *   id        -> "missao:palavra-shalom" (usado para guardar o XP)
 *   nivel     -> nível mínimo (1 a 4) para liberar a missão
 *   tipo      -> "palavra" ou "frase"
 *   xp        -> pontos ganhos ao acertar
 *   pt        -> texto em português mostrado ao usuário
 *   resposta  -> resposta esperada em hebraico (com ou sem vogais)
 *   aceitas   -> outras escritas aceitas como certas (pode ser lista vazia)
 *   exibicao  -> hebraico mostrado depois de acertar (com vogais, se houver)
 *   translit  -> transliteração (dica)
 */
function montarMissoes() {
  const lista = [];
  const respostasUsadas = new Set(); // evita duas missões com a mesma resposta

  const adicionar = (item, tipo, xp) => {
    const chave = normalizarHebraico(item.heb);
    if (respostasUsadas.has(chave)) return;
    respostasUsadas.add(chave);
    lista.push({
      id: `missao:${tipo}-${fazerSlug(item.translit)}`,
      nivel: item.nivel,
      tipo,
      xp,
      pt: item.pt,
      resposta: item.heb,
      aceitas: item.aceitas || [],
      exibicao: item.heb,
      translit: item.translit,
    });
  };

  // Em cada nível: primeiro as palavras, depois as frases.
  for (let nivel = 1; nivel <= 4; nivel++) {
    PALAVRAS.filter((p) => p.nivel === nivel).forEach((p) =>
      adicionar(p, "palavra", XP_MISSAO_PALAVRA)
    );
    FRASES.filter((f) => f.nivel === nivel).forEach((f) =>
      adicionar(f, "frase", XP_MISSAO_FRASE)
    );
  }

  return lista;
}

export const MISSOES = montarMissoes();
