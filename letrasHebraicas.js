/*
 * src/data/letrasHebraicas.js
 *
 * Dados estruturados das 22 letras do alfabeto hebraico e das 5 formas
 * finais (sofit). Ficam separados dos componentes de tela de propósito,
 * para que seja fácil adicionar ou corrigir palavras/frases no futuro
 * sem precisar mexer em nenhuma lógica de interface.
 *
 * Formato de cada letra:
 * {
 *   letra:                  caractere hebraico,
 *   nome:                   nome tradicional da letra, em português,
 *   transliteracao:         transliteração aproximada da LETRA em si,
 *   pronuncia:              explicação simples de como a letra soa,
 *   exemplo:                palavra hebraica de exemplo que usa a letra,
 *   exemploTransliteracao:  transliteração da palavra de exemplo,
 *   traducao:                traducao da palavra de exemplo para português,
 *   audioTexto:             texto enviado ao mecanismo de fala (voz em hebraico)
 * }
 *
 * Nota sobre pronúncia: as explicações abaixo descrevem a pronúncia
 * moderna (israelense) do hebraico. Em vários pontos, duas letras
 * diferentes soam de forma igual ou muito parecida hoje em dia --
 * por exemplo, Alef e Ayin, Tav e Tet, Kaf (sem daguesh) e Het. Isso
 * é mencionado propositalmente em cada pronúncia: não é um erro do
 * conteúdo, é uma característica real do hebraico falado atualmente,
 * e vale a pena o estudante saber disso desde o início.
 */

export const LETRAS = [
  {
    letra: "א",
    nome: "Alef",
    transliteracao: "— / som de vogal",
    pronuncia:
      "Não tem som próprio. Na maioria das palavras é muda e serve de apoio para a vogal que vem junto dela.",
    exemplo: "אבא",
    exemploTransliteracao: "Abá",
    traducao: "pai",
    audioTexto: "אבא",
  },
  {
    letra: "ב",
    nome: "Beit",
    transliteracao: "B / V",
    pronuncia:
      "Com um ponto no meio (daguesh) soa como \"B\" de bola. Sem o ponto soa como \"V\" de vela.",
    exemplo: "בית",
    exemploTransliteracao: "Báyit",
    traducao: "casa",
    audioTexto: "בית",
  },
  {
    letra: "ג",
    nome: "Gimel",
    transliteracao: "G",
    pronuncia: "Som de \"G\" como em \"gato\" — sempre duro, nunca como em \"gelo\".",
    exemplo: "גמל",
    exemploTransliteracao: "Gamál",
    traducao: "camelo",
    audioTexto: "גמל",
  },
  {
    letra: "ד",
    nome: "Dalet",
    transliteracao: "D",
    pronuncia: "Som de \"D\" como em \"dado\".",
    exemplo: "דלת",
    exemploTransliteracao: "Délet",
    traducao: "porta",
    audioTexto: "דלת",
  },
  {
    letra: "ה",
    nome: "Hei",
    transliteracao: "H",
    pronuncia:
      "Som de \"H\" bem suave, como uma leve expiração de ar. No final de algumas palavras quase não se ouve.",
    exemplo: "הר",
    exemploTransliteracao: "Har",
    traducao: "montanha",
    audioTexto: "הר",
  },
  {
    letra: "ו",
    nome: "Vav",
    transliteracao: "V / U / O",
    pronuncia:
      "Como consoante soa \"V\" de vela. Também pode funcionar como vogal, com som de \"U\" ou \"O\".",
    exemplo: "ורד",
    exemploTransliteracao: "Véred",
    traducao: "rosa",
    audioTexto: "ורד",
  },
  {
    letra: "ז",
    nome: "Zayin",
    transliteracao: "Z",
    pronuncia: "Som de \"Z\" como em \"zebra\".",
    exemplo: "זית",
    exemploTransliteracao: "Záyit",
    traducao: "azeitona",
    audioTexto: "זית",
  },
  {
    letra: "ח",
    nome: "Het",
    transliteracao: "H gutural",
    pronuncia:
      "Som gutural, produzido no fundo da garganta — parecido com o \"J\" do espanhol (como em \"Jose\"). É diferente do Resh (ר).",
    exemplo: "חלב",
    exemploTransliteracao: "Haláv",
    traducao: "leite",
    audioTexto: "חלב",
  },
  {
    letra: "ט",
    nome: "Tet",
    transliteracao: "T",
    pronuncia: "Som de \"T\". Na pronúncia moderna soa igual ao Tav (ת).",
    exemplo: "טוב",
    exemploTransliteracao: "Tov",
    traducao: "bom",
    audioTexto: "טוב",
  },
  {
    letra: "י",
    nome: "Yud",
    transliteracao: "Y / I",
    pronuncia:
      "Como consoante soa \"Y\" (parecido com o início de \"iogurte\"). Também pode funcionar como vogal \"I\".",
    exemplo: "ים",
    exemploTransliteracao: "Yam",
    traducao: "mar",
    audioTexto: "ים",
  },
  {
    letra: "כ",
    nome: "Kaf",
    transliteracao: "K / Kh",
    pronuncia:
      "Com daguesh soa \"K\". Sem daguesh soa como um som gutural parecido com o Het (ח).",
    exemplo: "כלב",
    exemploTransliteracao: "Kélev",
    traducao: "cachorro",
    audioTexto: "כלב",
  },
  {
    letra: "ל",
    nome: "Lamed",
    transliteracao: "L",
    pronuncia: "Som de \"L\" como em \"lua\".",
    exemplo: "לב",
    exemploTransliteracao: "Lev",
    traducao: "coração",
    audioTexto: "לב",
  },
  {
    letra: "מ",
    nome: "Mem",
    transliteracao: "M",
    pronuncia: "Som de \"M\" como em \"mesa\".",
    exemplo: "מים",
    exemploTransliteracao: "Máyim",
    traducao: "água",
    audioTexto: "מים",
  },
  {
    letra: "נ",
    nome: "Nun",
    transliteracao: "N",
    pronuncia: "Som de \"N\" como em \"nuvem\".",
    exemplo: "נר",
    exemploTransliteracao: "Ner",
    traducao: "vela",
    audioTexto: "נר",
  },
  {
    letra: "ס",
    nome: "Samech",
    transliteracao: "S",
    pronuncia:
      "Som de \"S\" como em \"sol\". Soa igual ao Shin quando ele tem o ponto à esquerda (chamado Sin).",
    exemplo: "ספר",
    exemploTransliteracao: "Séfer",
    traducao: "livro",
    audioTexto: "ספר",
  },
  {
    letra: "ע",
    nome: "Ayin",
    transliteracao: "— / som gutural",
    pronuncia:
      "Na pronúncia moderna costuma ser muda, de forma parecida com o Alef (א). Historicamente tinha um som gutural próprio, ainda preservado em algumas tradições de leitura.",
    exemplo: "עיר",
    exemploTransliteracao: "Ir",
    traducao: "cidade",
    audioTexto: "עיר",
  },
  {
    letra: "פ",
    nome: "Pei",
    transliteracao: "P / F",
    pronuncia: "Com daguesh soa \"P\". Sem daguesh soa \"F\".",
    exemplo: "פרח",
    exemploTransliteracao: "Pérach",
    traducao: "flor",
    audioTexto: "פרח",
  },
  {
    letra: "צ",
    nome: "Tsadik",
    transliteracao: "TS",
    pronuncia: "Som de \"TS\", como em \"pizza\".",
    exemplo: "צל",
    exemploTransliteracao: "Tsel",
    traducao: "sombra",
    audioTexto: "צל",
  },
  {
    letra: "ק",
    nome: "Kuf",
    transliteracao: "K",
    pronuncia:
      "Som de \"K\". Na pronúncia moderna soa igual ao Kaf com daguesh (כּ).",
    exemplo: "קול",
    exemploTransliteracao: "Kol",
    traducao: "voz / som",
    audioTexto: "קול",
  },
  {
    letra: "ר",
    nome: "Resh",
    transliteracao: "R",
    pronuncia:
      "Som gutural produzido na garganta, mais parecido com o \"R\" do francês do que com o \"R\" do português.",
    exemplo: "ראש",
    exemploTransliteracao: "Rosh",
    traducao: "cabeça",
    audioTexto: "ראש",
  },
  {
    letra: "ש",
    nome: "Shin",
    transliteracao: "SH / S",
    pronuncia:
      "Com o ponto à direita soa \"SH\". Com o ponto à esquerda (chamado Sin) soa \"S\", igual ao Samekh.",
    exemplo: "שמש",
    exemploTransliteracao: "Shémesh",
    traducao: "sol",
    audioTexto: "שמש",
  },
  {
    letra: "ת",
    nome: "Taf",
    transliteracao: "T",
    pronuncia: "Som de \"T\". Na pronúncia moderna soa igual ao Tet (ט).",
    exemplo: "תפוח",
    exemploTransliteracao: "Tapuách",
    traducao: "maçã",
    audioTexto: "תפוח",
  },
];

/*
 * Formas finais (sofit). São as mesmas 5 letras (Kaf, Mem, Nun, Pe e
 * Tsadi), só que com um traço diferente, usado apenas quando a letra
 * aparece na última posição de uma palavra. O SOM não muda -- é a
 * mesma letra, só a forma visual é diferente no final da palavra.
 */
export const FORMAS_FINAIS = [
  {
    letra: "ך",
    nome: "Kaf final",
    origem: "כ",
    exemplo: "מלך",
    exemploTransliteracao: "Mélech",
    traducao: "rei",
    audioTexto: "מלך",
  },
  {
    letra: "ם",
    nome: "Mem final",
    origem: "מ",
    exemplo: "שלום",
    exemploTransliteracao: "Shalom",
    traducao: "paz / olá",
    audioTexto: "שלום",
  },
  {
    letra: "ן",
    nome: "Nun final",
    origem: "נ",
    exemplo: "בן",
    exemploTransliteracao: "Ben",
    traducao: "filho",
    audioTexto: "בן",
  },
  {
    letra: "ף",
    nome: "Pei final",
    origem: "פ",
    exemplo: "עוף",
    exemploTransliteracao: "Of",
    traducao: "ave",
    audioTexto: "עוף",
  },
  {
    letra: "ץ",
    nome: "Tsadik final",
    origem: "צ",
    exemplo: "עץ",
    exemploTransliteracao: "Ets",
    traducao: "árvore",
    audioTexto: "עץ",
  },
];

/*
 * SOM DA LETRA
 * A voz do aparelho não consegue falar uma consoante sozinha (ela precisa de
 * vogal). O som mais claro de uma letra isolada é o NOME dela (alef, bet,
 * gimel...). Este mapa guarda o nome de cada letra escrito em hebraico, e é
 * isso que o botão "Som da letra" fala. O áudio da PALAVRA de exemplo é outro.
 */
export const NOME_FALADO_DA_LETRA = {
  "א": "אלף", "ב": "בית", "ג": "גימל", "ד": "דלת", "ה": "הא", "ו": "וו", "ז": "זין",
  "ח": "חית", "ט": "טית", "י": "יוד", "כ": "כף", "ל": "למד", "מ": "מם", "נ": "נון",
  "ס": "סמך", "ע": "עין", "פ": "פא", "צ": "צדי", "ק": "קוף", "ר": "ריש", "ש": "שין", "ת": "תו",
  "ך": "כף", "ם": "מם", "ן": "נון", "ף": "פא", "ץ": "צדי",
};

// Texto que a voz deve falar para o "som da letra".
// Letra sozinha (com ou sem ponto de dagesh/shin) -> o nome dela.
// Sílaba (letra + vogal, ex.: מַ) ou outro texto -> o próprio texto.
export function audioDaLetra(texto) {
  const limpo = String(texto || "").trim();
  const base = limpo.replace(/[\u05BC\u05C1\u05C2]/g, ""); // tira dagesh e pontos do shin/sin
  return NOME_FALADO_DA_LETRA[base] || limpo;
}
