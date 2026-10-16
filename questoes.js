/*
 * questoes.js
 *
 * Gera as QUESTÕES da área "Praticar" e as mini-atividades das lições.
 * Nenhuma questão é escrita à mão: elas são montadas a partir dos dados
 * que o app já tem (letrasHebraicas.js e niveis.js). Para ter mais
 * questões, basta acrescentar letras, palavras ou vogais nesses arquivos.
 *
 * TIPOS DE QUESTÃO:
 *   letra-nome  ... vê uma letra hebraica -> escolhe o nome dela
 *   som-letra   ... OUVE o som da letra (o nome falado) -> escolhe a letra
 *   nome-letra  ... vê o nome -> escolhe a letra
 *   heb-pt      ... vê a palavra em hebraico -> escolhe o significado
 *   pt-heb      ... vê o significado -> escolhe a palavra em hebraico
 *   ouvir       ... OUVE a palavra -> escolhe qual palavra ouviu
 *   vogal-som   ... vê o sinal da vogal -> escolhe o som
 *   completar   ... palavra com uma letra faltando -> escolhe a letra
 *   ordenar     ... monta a palavra tocando nas letras na ordem certa
 *   associar    ... liga 4 palavras em hebraico aos seus significados
 *   ditado      ... OUVE a palavra e ESCREVE em hebraico no teclado virtual
 *
 * FORMATO DE UMA QUESTÃO:
 *   id         -> "quiz:..." (guarda o XP: cada questão rende XP uma vez)
 *   item       -> chave do conteúdo (ex.: "pal:shalom"), usada para
 *                 registrar ERROS e recomendar revisão
 *   tipo       -> um dos tipos acima
 *   instrucao  -> o que o aluno deve fazer
 *   enunciado  -> o que aparece em destaque (pode ser hebraico)
 *   enunciadoHeb -> true se o enunciado é hebraico (fonte maior, RTL)
 *   audio      -> texto em hebraico para o botão de áudio (opcional)
 *   opcoes     -> [{ id, texto, heb, nota }] (não existe em "ordenar")
 *   correta    -> id da opção certa
 *   ordenar    -> { letras: [...embaralhadas], resposta: "texto" } (só em "ordenar")
 *   pares      -> [{ id, heb, pt }] (só em "associar")
 *   resposta / aceitas -> texto esperado (só em "ditado")
 *   explicacao -> explicação mostrada depois de responder
 *   xp         -> pontos ao acertar (0 nas mini-atividades das lições)
 */

import { LETRAS, FORMAS_FINAIS, audioDaLetra } from "./letrasHebraicas";
import { PALAVRAS, VOGAIS } from "./niveis";
import { normalizarHebraico } from "./dadosMissoes";
import { montarSessaoCultura, nomeCultura, questaoCulturaProva } from "./questoesCultura";

// XP de cada questão acertada pela primeira vez (altere aqui).
export const XP_QUESTAO = 5;

// Quantas opções de resposta aparecem.
const NUM_OPCOES = 4;

// ---------------------------------------------------------------------
// FUNÇÕES AUXILIARES
// ---------------------------------------------------------------------

// Embaralha uma lista (devolve uma cópia nova).
export function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Sorteia até `n` itens diferentes de uma lista.
function sortear(lista, n) {
  return embaralhar(lista).slice(0, n);
}

// Texto simples (sem acentos) para usar em ids.
function fazerSlug(texto) {
  return String(texto)
    .toLowerCase()
    .replace(/[áàâã]/g, "a")
    .replace(/[éê]/g, "e")
    .replace(/í/g, "i")
    .replace(/[óô]/g, "o")
    .replace(/ú/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Monta a lista de opções (a certa + erradas), embaralhada.
// `certa` e cada item de `erradas` = { texto, heb, nota }.
function montarOpcoes(certa, erradas) {
  const todas = embaralhar([{ ...certa, correta: true }, ...erradas.map((e) => ({ ...e, correta: false }))]);
  const opcoes = todas.map((opcao, indice) => ({
    id: String(indice),
    texto: opcao.texto,
    heb: !!opcao.heb,
    nota: opcao.nota || "",
  }));
  const correta = opcoes[todas.findIndex((opcao) => opcao.correta)].id;
  return { opcoes, correta };
}

// Remove repetições por texto.
function unicos(lista) {
  const vistos = new Set();
  return lista.filter((item) => {
    if (vistos.has(item.texto)) return false;
    vistos.add(item.texto);
    return true;
  });
}

// ---------------------------------------------------------------------
// ITENS DE CONTEÚDO (o que pode virar questão)
// ---------------------------------------------------------------------

const TODAS_LETRAS = [...LETRAS, ...FORMAS_FINAIS];
const NOME_DA_LETRA = {};
TODAS_LETRAS.forEach((item) => {
  NOME_DA_LETRA[item.letra] = item.nome;
});

// Vogais usadas nas questões (o Kamatz fica de fora: soa "A" ou "O").
const VOGAIS_QUIZ = VOGAIS.filter((vogal) => vogal.nome !== "Kamatz");
const SONS_VOGAIS = ["A", "E", "I", "O", "U"];

function itensDeLetras() {
  return TODAS_LETRAS.map((item) => ({
    tipoItem: "letra",
    chave: `letra:${item.letra}`,
    slug: fazerSlug(item.nome),
    dados: item,
  }));
}

function itensDePalavras(nivelId) {
  return PALAVRAS.filter((palavra) => palavra.nivel <= nivelId).map((palavra) => ({
    tipoItem: "palavra",
    chave: `pal:${fazerSlug(palavra.translit)}`,
    slug: fazerSlug(palavra.translit),
    dados: palavra,
  }));
}

function itensDeVogais() {
  return VOGAIS_QUIZ.map((vogal) => ({
    tipoItem: "vogal",
    chave: `vogal:${fazerSlug(vogal.nome)}`,
    slug: fazerSlug(vogal.nome),
    dados: vogal,
  }));
}

// ---------------------------------------------------------------------
// CONSTRUTORES (um por tipo de questão)
// ---------------------------------------------------------------------

function questaoLetraNome(item) {
  const letra = item.dados;
  const outras = sortear(TODAS_LETRAS.filter((l) => l.letra !== letra.letra), NUM_OPCOES - 1);
  const { opcoes, correta } = montarOpcoes(
    { texto: letra.nome },
    outras.map((l) => ({ texto: l.nome, nota: `${l.letra} é a letra ${l.nome}.` }))
  );
  return {
    id: `quiz:letra-nome-${item.slug}`,
    item: item.chave,
    tipo: "letra-nome",
    instrucao: "Qual é o nome desta letra?",
    enunciado: letra.letra,
    enunciadoHeb: true,
    opcoes,
    correta,
    explicacao: `${letra.letra} é a letra ${letra.nome}. Exemplo: ${letra.exemplo} (${letra.exemploTransliteracao}) significa "${letra.traducao}".`,
    xp: XP_QUESTAO,
  };
}

function questaoSomLetra(item) {
  const letra = item.dados;
  // Só letras "normais" (as formas finais têm o mesmo som das normais).
  const outras = sortear(LETRAS.filter((l) => l.letra !== letra.letra), NUM_OPCOES - 1);
  const { opcoes, correta } = montarOpcoes(
    { texto: letra.letra, heb: true },
    outras.map((l) => ({ texto: l.letra, heb: true, nota: `${l.letra} é a letra ${l.nome}.` }))
  );
  return {
    id: `quiz:som-letra-${item.slug}`,
    item: item.chave,
    tipo: "som-letra",
    instrucao: "Ouça o som e escolha a letra.",
    enunciado: "",
    icone: "ear",
    enunciadoHeb: false,
    audio: audioDaLetra(letra.letra),
    opcoes,
    correta,
    explicacao: `Você ouviu a letra ${letra.nome} (${letra.letra}).`,
    xp: XP_QUESTAO,
  };
}

function questaoNomeLetra(item) {
  const letra = item.dados;
  const outras = sortear(TODAS_LETRAS.filter((l) => l.letra !== letra.letra), NUM_OPCOES - 1);
  const { opcoes, correta } = montarOpcoes(
    { texto: letra.letra, heb: true },
    outras.map((l) => ({ texto: l.letra, heb: true, nota: `${l.letra} é a letra ${l.nome}.` }))
  );
  return {
    id: `quiz:nome-letra-${item.slug}`,
    item: item.chave,
    tipo: "nome-letra",
    instrucao: "Qual destas é a letra...",
    enunciado: letra.nome,
    enunciadoHeb: false,
    opcoes,
    correta,
    explicacao: `A letra ${letra.nome} se escreve ${letra.letra}. Exemplo: ${letra.exemplo} (${letra.exemploTransliteracao}) significa "${letra.traducao}".`,
    xp: XP_QUESTAO,
  };
}

// Descrição curta de uma palavra: "בַּיִת (bayit) significa «casa»".
function descreverPalavra(palavra) {
  return `${palavra.heb} (${palavra.translit}) significa "${palavra.pt}".`;
}

function questaoHebPt(item, todas) {
  const palavra = item.dados;
  const outras = sortear(
    unicos(todas.filter((p) => p.pt !== palavra.pt).map((p) => ({ texto: p.pt, nota: descreverPalavra(p) }))),
    NUM_OPCOES - 1
  );
  const { opcoes, correta } = montarOpcoes({ texto: palavra.pt }, outras);
  return {
    id: `quiz:heb-pt-${item.slug}`,
    item: item.chave,
    tipo: "heb-pt",
    instrucao: "O que significa esta palavra?",
    enunciado: palavra.heb,
    enunciadoHeb: true,
    audio: palavra.heb,
    opcoes,
    correta,
    explicacao: descreverPalavra(palavra),
    xp: XP_QUESTAO,
  };
}

function questaoPtHeb(item, todas) {
  const palavra = item.dados;
  const outras = sortear(
    unicos(
      todas
        .filter((p) => p.heb !== palavra.heb)
        .map((p) => ({ texto: p.heb, heb: true, nota: descreverPalavra(p) }))
    ),
    NUM_OPCOES - 1
  );
  const { opcoes, correta } = montarOpcoes({ texto: palavra.heb, heb: true }, outras);
  return {
    id: `quiz:pt-heb-${item.slug}`,
    item: item.chave,
    tipo: "pt-heb",
    instrucao: "Como se escreve em hebraico?",
    enunciado: palavra.pt,
    enunciadoHeb: false,
    opcoes,
    correta,
    explicacao: descreverPalavra(palavra),
    xp: XP_QUESTAO,
  };
}

function questaoOuvir(item, todas) {
  const palavra = item.dados;
  const outras = sortear(
    unicos(
      todas
        .filter((p) => p.heb !== palavra.heb)
        .map((p) => ({ texto: p.heb, heb: true, nota: descreverPalavra(p) }))
    ),
    NUM_OPCOES - 1
  );
  const { opcoes, correta } = montarOpcoes({ texto: palavra.heb, heb: true }, outras);
  return {
    id: `quiz:ouvir-${item.slug}`,
    item: item.chave,
    tipo: "ouvir",
    instrucao: "Ouça e escolha a palavra que você ouviu.",
    enunciado: "",
    icone: "ear",
    enunciadoHeb: false,
    audio: palavra.heb,
    autoOuvir: true,
    opcoes,
    correta,
    explicacao: `Você ouviu ${palavra.heb} (${palavra.translit}), que significa "${palavra.pt}".`,
    xp: XP_QUESTAO,
  };
}

function questaoVogalSom(item) {
  const vogal = item.dados;
  const { opcoes, correta } = montarOpcoes(
    { texto: vogal.som },
    sortear(SONS_VOGAIS.filter((som) => som !== vogal.som), NUM_OPCOES - 1).map((som) => ({ texto: som }))
  );
  return {
    id: `quiz:vogal-som-${item.slug}`,
    item: item.chave,
    tipo: "vogal-som",
    instrucao: "Qual é o som desta vogal?",
    enunciado: "\u25CC" + vogal.sinal,
    enunciadoHeb: true,
    opcoes,
    correta,
    explicacao: `Este sinal é o ${vogal.nome} e soa como "${vogal.som}". Ele aparece embaixo ou em cima da consoante.`,
    xp: XP_QUESTAO,
  };
}

// Palavras sem espaço e com 3 a 5 letras (para completar e ordenar).
function palavraSimples(palavra) {
  const letras = [...normalizarHebraico(palavra.heb)];
  return letras.length >= 3 && letras.length <= 5 && !letras.includes(" ");
}

function questaoCompletar(item) {
  const palavra = item.dados;
  const letras = [...normalizarHebraico(palavra.heb)];
  const posicao = 1 + Math.floor(Math.random() * (letras.length - 1)); // nunca a 1ª letra
  const certa = letras[posicao];
  const mostrada = letras.map((l, i) => (i === posicao ? "_" : l)).join(" ");
  const distratores = sortear(
    TODAS_LETRAS.map((l) => l.letra).filter((l) => l !== certa),
    NUM_OPCOES - 1
  );
  const { opcoes, correta } = montarOpcoes(
    { texto: certa, heb: true, nota: `${certa} é a letra ${NOME_DA_LETRA[certa]}.` },
    distratores.map((l) => ({ texto: l, heb: true, nota: `${l} é a letra ${NOME_DA_LETRA[l]}.` }))
  );
  return {
    id: `quiz:completar-${item.slug}`,
    item: item.chave,
    tipo: "completar",
    instrucao: `Complete a palavra "${palavra.pt}" (leia da direita para a esquerda).`,
    enunciado: mostrada,
    enunciadoHeb: true,
    audio: palavra.heb,
    opcoes,
    correta,
    explicacao: `A palavra é ${palavra.heb} (${palavra.translit}). Faltava a letra ${NOME_DA_LETRA[certa]} (${certa}).`,
    xp: XP_QUESTAO,
  };
}

function questaoOrdenar(item) {
  const palavra = item.dados;
  const resposta = normalizarHebraico(palavra.heb);
  const letras = [...resposta];
  let embaralhadas = embaralhar(letras);
  // Garante que a ordem embaralhada seja diferente da correta (palavras com
  // letras repetidas, como שמש, precisam de mais tentativas).
  for (let tentativa = 0; tentativa < 40 && embaralhadas.join("") === resposta; tentativa++) {
    embaralhadas = embaralhar(letras);
  }
  if (embaralhadas.join("") === resposta) embaralhadas = [...letras.slice(1), letras[0]]; // último recurso: gira as letras
  return {
    id: `quiz:ordenar-${item.slug}`,
    item: item.chave,
    tipo: "ordenar",
    instrucao: `Monte a palavra "${palavra.pt}" tocando nas letras na ordem certa.`,
    enunciado: "",
    icone: "extension-puzzle",
    enunciadoHeb: false,
    audio: palavra.heb,
    ordenar: { letras: embaralhadas, resposta },
    explicacao: `A palavra é ${palavra.heb} (${palavra.translit}), que significa "${palavra.pt}".`,
    xp: XP_QUESTAO,
  };
}

function questaoAssociar(palavras) {
  // 4 palavras com hebraico e significado diferentes entre si.
  const escolhidas = [];
  for (const palavra of embaralhar(palavras)) {
    if (escolhidas.some((e) => e.pt === palavra.pt || normalizarHebraico(e.heb) === normalizarHebraico(palavra.heb))) continue;
    escolhidas.push(palavra);
    if (escolhidas.length === 4) break;
  }
  if (escolhidas.length < 4) return null;
  const pares = escolhidas.map((palavra, indice) => ({ id: String(indice), heb: palavra.heb, pt: palavra.pt, translit: palavra.translit }));
  return {
    id: `quiz:associar-${escolhidas.map((p) => fazerSlug(p.translit)).sort().join("_")}`.slice(0, 80),
    item: null,
    tipo: "associar",
    instrucao: "Toque numa palavra em hebraico e depois no significado dela.",
    enunciado: "",
    icone: "link",
    enunciadoHeb: false,
    pares,
    explicacao: pares.map((par) => `${par.heb} (${par.translit}) = ${par.pt}`).join(" · "),
    xp: XP_QUESTAO,
  };
}

function questaoDitado(item) {
  const palavra = item.dados;
  return {
    id: `quiz:ditado-${item.slug}`,
    item: item.chave,
    tipo: "ditado",
    instrucao: "Ouça e escreva a palavra em hebraico.",
    enunciado: "",
    icone: "pencil",
    enunciadoHeb: false,
    audio: palavra.heb,
    autoOuvir: true,
    resposta: palavra.heb,
    aceitas: palavra.aceitas || [],
    explicacao: `A palavra é ${palavra.heb} (${palavra.translit}), que significa "${palavra.pt}".`,
    xp: XP_QUESTAO,
  };
}

// ---------------------------------------------------------------------
// MONTAGEM DA SESSÃO
// ---------------------------------------------------------------------

// Modos de prática mostrados na tela "Praticar".
export const MODOS_PRATICA = [
  { id: "misto", titulo: "Misto", icone: "shuffle", descricao: "Um pouco de tudo" },
  { id: "revisao", titulo: "Revisão", icone: "refresh", descricao: "Seus pontos fracos" },
  { id: "letras", titulo: "Letras", icone: "text", descricao: "Nomes e formas" },
  { id: "vocabulario", titulo: "Vocabulário", icone: "library", descricao: "Palavras e significados" },
  { id: "som-letra", titulo: "Som da letra", icone: "ear", descricao: "Ouça e ache a letra" },
  { id: "ouvir", titulo: "Som da palavra", icone: "volume-high", descricao: "Ouça e ache a palavra" },
  { id: "vogais", titulo: "Vogais", icone: "musical-notes", descricao: "Sons do nikkud" },
  { id: "montar", titulo: "Montar palavras", icone: "extension-puzzle", descricao: "Ordene as letras" },
  { id: "completar", titulo: "Completar", icone: "create", descricao: "Qual letra falta?" },
  { id: "associar", titulo: "Associar", icone: "link", descricao: "Ligue hebraico e português" },
  { id: "israel", titulo: "Israel", icone: "earth", descricao: "Cidades e personagens" },
  { id: "ditado", titulo: "Ditado", icone: "pencil", descricao: "Ouça e escreva" },
];

// Cria UMA questão para um item, escolhendo um tipo apropriado.
function criarQuestao(item, tipoDesejado, palavrasLiberadas) {
  if (item.tipoItem === "letra") {
    const ehFinal = FORMAS_FINAIS.some((f) => f.letra === item.dados.letra);
    const tipo = tipoDesejado || embaralhar(["letra-nome", "nome-letra", "som-letra"])[0];
    if (tipo === "nome-letra") return questaoNomeLetra(item);
    if (tipo === "som-letra" && !ehFinal) return questaoSomLetra(item);
    return questaoLetraNome(item);
  }
  if (item.tipoItem === "vogal") return questaoVogalSom(item);

  // Palavras
  const tipos = tipoDesejado
    ? [tipoDesejado]
    : embaralhar(["heb-pt", "pt-heb", "ouvir", "completar", "ordenar"]);
  for (const tipo of tipos) {
    if (tipo === "heb-pt") return questaoHebPt(item, palavrasLiberadas);
    if (tipo === "pt-heb") return questaoPtHeb(item, palavrasLiberadas);
    if (tipo === "ouvir") return questaoOuvir(item, palavrasLiberadas);
    if ((tipo === "completar" || tipo === "ordenar") && palavraSimples(item.dados)) {
      return tipo === "completar" ? questaoCompletar(item) : questaoOrdenar(item);
    }
    if (tipo === "ditado") return questaoDitado(item);
  }
  return questaoHebPt(item, palavrasLiberadas);
}

/**
 * Monta a lista de questões de uma sessão.
 *   modo       -> um id de MODOS_PRATICA
 *   nivelId    -> nível do aluno (só entram palavras já liberadas)
 *   quantidade -> quantas questões (padrão 8)
 *   erros      -> { chaveDoItem: nVezesQueErrou } (do usuário)
 * Itens em que o aluno já errou têm MAIS chance de aparecer.
 */
export function montarSessao({ modo = "misto", nivelId = 1, quantidade = 8, erros = {} }) {
  if (modo === "israel") return montarSessaoCultura({ nivelId, quantidade });

  const palavras = itensDePalavras(nivelId);
  const palavrasLiberadas = palavras.map((p) => p.dados);

  let itens = [];
  let tipoFixo = null;

  if (modo === "letras") itens = itensDeLetras();
  else if (modo === "som-letra") {
    itens = itensDeLetras().filter((i) => LETRAS.some((l) => l.letra === i.dados.letra));
    tipoFixo = "som-letra";
  }
  else if (modo === "vocabulario") itens = palavras;
  else if (modo === "ouvir") {
    itens = palavras;
    tipoFixo = "ouvir";
  } else if (modo === "vogais") {
    itens = itensDeVogais();
  } else if (modo === "montar" || modo === "completar") {
    itens = palavras.filter((p) => palavraSimples(p.dados));
    tipoFixo = modo === "montar" ? "ordenar" : "completar";
  } else if (modo === "ditado") {
    itens = palavras;
    tipoFixo = "ditado";
  } else if (modo === "associar") {
    // Cada questão usa 4 palavras: monta até 5 rodadas diferentes.
    const rodadas = [];
    const vistos = new Set();
    for (let tentativa = 0; tentativa < quantidade * 4 && rodadas.length < Math.min(quantidade, 5); tentativa++) {
      const rodada = questaoAssociar(palavrasLiberadas);
      if (rodada && !vistos.has(rodada.id)) {
        vistos.add(rodada.id);
        rodadas.push(rodada);
      }
    }
    return rodadas;
  }
  else if (modo === "revisao") {
    itens = [...itensDeLetras(), ...palavras, ...itensDeVogais()].filter((item) => (erros[item.chave] || 0) > 0);
  } else {
    itens = [...itensDeLetras(), ...palavras, ...itensDeVogais()];
  }

  // Sorteio com peso: quem tem erros aparece mais.
  const candidatos = [];
  itens.forEach((item) => {
    const peso = 1 + 3 * Math.min(erros[item.chave] || 0, 3);
    for (let i = 0; i < peso; i++) candidatos.push(item);
  });

  const escolhidos = [];
  const usados = new Set();
  for (const item of embaralhar(candidatos)) {
    if (usados.has(item.chave)) continue;
    usados.add(item.chave);
    escolhidos.push(item);
    if (escolhidos.length >= quantidade) break;
  }

  const questoes = escolhidos.map((item) => criarQuestao(item, tipoFixo, palavrasLiberadas));
  // No modo misto, evita que todas as questões de letra venham seguidas.
  return modo === "misto" ? embaralhar(questoes) : questoes;
}

/**
 * Mini-atividade de uma lição: perguntas "o que significa?" feitas com os
 * exemplos da própria lição. Não rendem XP (a lição já rende).
 */
export function questoesDaLicao(licao, quantidade = 3) {
  const exemplos = licao.exemplos;
  return sortear(exemplos, Math.min(quantidade, exemplos.length)).map((exemplo, indice) => {
    const outras = sortear(
      unicos(exemplos.filter((e) => e.pt !== exemplo.pt).map((e) => ({ texto: e.pt, nota: `${e.heb} (${e.translit}) significa "${e.pt}".` }))),
      NUM_OPCOES - 1
    );
    const { opcoes, correta } = montarOpcoes({ texto: exemplo.pt }, outras);
    return {
      id: `quiz:licao-${licao.id}-${indice}`,
      item: null,
      tipo: "heb-pt",
      instrucao: "O que significa?",
      enunciado: exemplo.heb,
      enunciadoHeb: true,
      audio: exemplo.heb,
      opcoes,
      correta,
      explicacao: `${exemplo.heb} (${exemplo.translit}) significa "${exemplo.pt}".`,
      xp: 0,
    };
  });
}

// Itens com mais erros, para o card "Revisão recomendada".
// Devolve [{ chave, nome, erros }] em ordem decrescente.
export function itensParaRevisar(erros, nivelId = 4, limite = 5) {
  const mapa = {};
  [...itensDeLetras(), ...itensDePalavras(nivelId), ...itensDeVogais()].forEach((item) => {
    let nome = "";
    // Português primeiro e hebraico no fim, com marca de "esquerda para direita"
    // (\u200E) para o texto misto não embaralhar a ordem das palavras.
    if (item.tipoItem === "letra") nome = `${item.dados.nome} · ${item.dados.letra}\u200E`;
    else if (item.tipoItem === "palavra") nome = `${item.dados.pt} · ${normalizarHebraico(item.dados.heb)}\u200E`;
    else nome = `Vogal ${item.dados.nome}`;
    mapa[item.chave] = nome;
  });
  Object.keys(erros || {}).forEach((chave) => {
    if (chave.startsWith("cult:")) {
      const nome = nomeCultura(chave);
      if (nome) mapa[chave] = nome;
    }
  });
  return Object.keys(erros || {})
    .filter((chave) => mapa[chave] && erros[chave] > 0)
    .sort((a, b) => erros[b] - erros[a])
    .slice(0, limite)
    .map((chave) => ({ chave, nome: mapa[chave], erros: erros[chave] }));
}

/**
 * PROVA DO NÍVEL: 10 questões variadas para liberar o nível seguinte.
 * Usa o conteúdo até o nível que está sendo concluído, com mais peso nas
 * palavras novas desse nível. Não rende XP por questão (a aprovação dá um
 * bônus). Para passar é preciso acertar PROVA_PERCENTUAL_MINIMO %.
 */
export const QUESTOES_NA_PROVA = 10;
export const PROVA_PERCENTUAL_MINIMO = 70;

export function montarProva(nivelId) {
  const palavras = itensDePalavras(nivelId);
  const palavrasLiberadas = palavras.map((p) => p.dados);

  // Letras e vogais entram nas provas dos níveis iniciais; as palavras, sempre.
  let itens = [];
  if (nivelId <= 2) itens = itens.concat(itensDeLetras());
  if (nivelId <= 2) itens = itens.concat(itensDeVogais());
  palavras.forEach((item) => {
    const peso = item.dados.nivel === nivelId ? 3 : 1;
    for (let i = 0; i < peso; i++) itens.push(item);
  });

  const escolhidos = [];
  const usados = new Set();
  for (const item of embaralhar(itens)) {
    if (usados.has(item.chave)) continue;
    usados.add(item.chave);
    escolhidos.push(item);
    if (escolhidos.length >= QUESTOES_NA_PROVA - 2) break;
  }

  const questoes = escolhidos.map((item) => criarQuestao(item, null, palavrasLiberadas));

  // Uma rodada de associar e um ditado garantem variedade.
  const associar = questaoAssociar(palavrasLiberadas);
  if (associar) questoes.push(associar);
  const ditadoItem = embaralhar(palavras.filter((p) => p.dados.nivel === nivelId))[0] || embaralhar(palavras)[0];
  if (ditadoItem) questoes.push(questaoDitado(ditadoItem));

  // Uma das 10 questões é de cultura (cidade ou personalidade do nível).
  const cultura = questaoCulturaProva(nivelId);
  const idiomas = embaralhar(questoes).slice(0, cultura ? QUESTOES_NA_PROVA - 1 : QUESTOES_NA_PROVA);
  if (cultura) idiomas.push(cultura);

  // Prova não rende XP por questão e nunca repete o id de uma prática anterior.
  return embaralhar(idiomas)
    .slice(0, QUESTOES_NA_PROVA)
    .map((questao, i) => ({ ...questao, id: `prova-${nivelId}-${i}-${questao.id}`, xp: 0 }));
}
