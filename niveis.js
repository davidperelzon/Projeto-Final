/*
 * niveis.js
 *
 * TODO o conteúdo que depende do nível do usuário fica aqui, separado
 * das telas. Para acrescentar uma lição, palavra, frase ou carta,
 * basta copiar um item de uma das listas abaixo e editar os textos --
 * não é preciso mexer em nenhuma tela.
 *
 * COMO FUNCIONA A SUBIDA DE CATEGORIA:
 *   - Cada usuário acumula XP (pontos).
 *   - Quando o XP atinge o `xpMinimo` de uma categoria, o usuário sobe
 *     para ela e o conteúdo daquele nível é liberado.
 *   - O conteúdo de níveis anteriores continua disponível.
 *
 * COMO O XP É GANHO (cada item rende XP só uma vez por usuário):
 *   - ver uma letra do alfabeto ......... +5 XP   (id "letra:א")
 *   - concluir uma lição ................ XP da lição (id "licao:...")
 *   - marcar uma carta como "Aprendi" ... XP da carta (id "carta:...")
 *   - acertar uma missão de escrita ..... 10 XP (palavra) ou 15 XP (frase)
 *
 * Os valores de XP abaixo foram calculados para que seja sempre
 * possível chegar à categoria seguinte (veja o total de cada nível).
 */

// ---------------------------------------------------------------------
// CATEGORIAS DE APRENDIZADO
// Para mudar a quantidade de XP necessária, altere `xpMinimo`.
// ---------------------------------------------------------------------
export const NIVEIS = [
  {
    id: 1,
    nome: "Iniciante",
    xpMinimo: 0,
    resumo: "Letras, sons e as primeiras palavras.",
  },
  {
    id: 2,
    nome: "Básico",
    xpMinimo: 150,
    resumo: "Vogais (nikkud), pontos nas letras e frases do dia a dia.",
  },
  {
    id: 3,
    nome: "Intermediário",
    xpMinimo: 400,
    resumo: "Gramática: pronomes, gênero, plural e verbos no presente.",
  },
  {
    id: 4,
    nome: "Avançado",
    xpMinimo: 800,
    resumo: "Raízes, passado e futuro, preposições e construções elaboradas.",
  },
];

// Devolve a categoria correspondente a uma quantidade de XP.
export function nivelPorXp(xp) {
  let nivelAtual = NIVEIS[0];
  for (const nivel of NIVEIS) {
    if (xp >= nivel.xpMinimo) nivelAtual = nivel;
  }
  return nivelAtual;
}

// Devolve o nível LIBERADO do usuário.
// Para subir de nível não basta ter o XP: é preciso passar na PROVA DO NÍVEL
// (veja ProvaNivel.js). O número do nível liberado fica em `usuario.nivelLiberado`
// e nunca passa do que o XP permite.
export function nivelDoUsuario(usuario) {
  const porXp = nivelPorXp((usuario && usuario.xp) || 0).id;
  const liberado = Number.isInteger(usuario && usuario.nivelLiberado) ? usuario.nivelLiberado : porXp;
  return nivelPorId(Math.min(Math.max(liberado, 1), porXp));
}

// Devolve a próxima categoria (ou null se já está na última).
export function proximoNivel(nivelAtual) {
  return NIVEIS.find((nivel) => nivel.id === nivelAtual.id + 1) || null;
}

// Devolve os dados de uma categoria pelo número (1 a 4).
export function nivelPorId(id) {
  return NIVEIS.find((nivel) => nivel.id === id) || NIVEIS[0];
}

// ---------------------------------------------------------------------
// LIÇÕES
// Cada lição tem: id único, nível, título, XP, textos explicativos
// (`paragrafos`) e exemplos em hebraico (`exemplos`).
// Cada exemplo: heb (hebraico), translit (transliteração), pt (tradução).
// O botão de áudio de cada exemplo lê o campo `heb`.
//
// Total de XP das lições: nível 1 = 60 | nível 2 = 120 | nível 3 = 200 | nível 4 = 240
// ---------------------------------------------------------------------
export const LICOES = [
  // ================= NÍVEL 1 · INICIANTE =================
  {
    id: "l1-direcao",
    nivel: 1,
    titulo: "Como o hebraico é escrito",
    xp: 30,
    paragrafos: [
      "O hebraico é escrito e lido da direita para a esquerda, o contrário do português.",
      "O alfabeto tem 22 letras e todas são consoantes. Não existe diferença entre maiúsculas e minúsculas.",
      "No dia a dia as vogais quase não aparecem escritas: quem lê reconhece a palavra pelo contexto. Os sinais de vogal (nikkud) são usados em livros infantis, didáticos e de oração.",
    ],
    exemplos: [
      { heb: "שלום", translit: "shalom", pt: "paz / olá / tchau" },
      { heb: "ספר", translit: "sefer", pt: "livro" },
      { heb: "תודה", translit: "toda", pt: "obrigado(a)" },
    ],
  },
  {
    id: "l1-finais",
    nivel: 1,
    titulo: "Formas finais das letras",
    xp: 30,
    paragrafos: [
      "Cinco letras mudam de desenho quando aparecem no fim de uma palavra: Kaf, Mem, Nun, Pe e Tsadi.",
      "O som continua o mesmo; só a forma muda. Em geral a forma final desce abaixo da linha.",
    ],
    exemplos: [
      { heb: "דרך", translit: "derech", pt: "caminho (Kaf final ך)" },
      { heb: "שלום", translit: "shalom", pt: "paz (Mem final ם)" },
      { heb: "בן", translit: "ben", pt: "filho (Nun final ן)" },
      { heb: "כסף", translit: "kesef", pt: "dinheiro / prata (Pe final ף)" },
      { heb: "ארץ", translit: "eretz", pt: "terra / país (Tsadi final ץ)" },
    ],
  },

  // ================= NÍVEL 2 · BÁSICO =================
  {
    id: "l2-nikkud",
    nivel: 2,
    titulo: "Vogais completas (nikkud)",
    xp: 40,
    paragrafos: [
      "As vogais são pontinhos e tracinhos colocados embaixo, em cima ou ao lado da letra. No hebraico moderno, vários sinais têm o mesmo som.",
      "Som de A: patach (ַ) e kamatz (ָ). Som de E: tsere (ֵ) e segol (ֶ). Som de I: hirik (ִ). Som de O: holam (ֹ). Som de U: kubutz (ֻ) e shuruk (וּ).",
      "O shva (ְ) indica uma pausa curta, ou um E muito rápido, no meio da palavra.",
    ],
    exemplos: [
      { heb: "סֵפֶר", translit: "sefer", pt: "livro" },
      { heb: "בַּיִת", translit: "bayit", pt: "casa" },
      { heb: "שָׁלוֹם", translit: "shalom", pt: "paz / olá" },
    ],
  },
  {
    id: "l2-pontos",
    nivel: 2,
    titulo: "Pontos nas letras: dagesh e shin/sin",
    xp: 40,
    paragrafos: [
      "Algumas letras mudam de som conforme um ponto colocado dentro delas (dagesh). Bet: com ponto (בּ) soa B; sem ponto (ב) soa V. Pe: com ponto (פּ) soa P; sem ponto (פ) soa F. Kaf: com ponto (כּ) soa K; sem ponto (כ) soa um som de garganta, como o CH do alemão em 'Bach'.",
      "A letra Shin tem dois sons, indicados por um ponto em cima: ponto à direita (שׁ) = SH; ponto à esquerda (שׂ) = S.",
      "Atenção: o dagesh também aparece em outras letras, mas ali ele não altera o som no hebraico moderno.",
    ],
    exemplos: [
      { heb: "כֶּלֶב", translit: "kelev", pt: "cachorro (Kaf com ponto: K)" },
      { heb: "סֵפֶר", translit: "sefer", pt: "livro (Pe sem ponto: F)" },
      { heb: "שֶׁמֶשׁ", translit: "shemesh", pt: "sol (Shin: SH)" },
    ],
  },
  {
    id: "l2-saudacoes",
    nivel: 2,
    titulo: "Cumprimentos e cortesia",
    xp: 40,
    paragrafos: [
      "Estas expressões resolvem boa parte das conversas básicas. Repare que 'por favor' e 'de nada' usam a mesma palavra: bevakasha.",
      "Para 'boa noite' existem duas formas: erev tov (ao chegar à noite) e laila tov (ao se despedir para dormir).",
    ],
    exemplos: [
      { heb: "בוקר טוב", translit: "boker tov", pt: "bom dia" },
      { heb: "ערב טוב", translit: "erev tov", pt: "boa noite (ao encontrar alguém)" },
      { heb: "לילה טוב", translit: "laila tov", pt: "boa noite (para dormir)" },
      { heb: "בבקשה", translit: "bevakasha", pt: "por favor / de nada" },
      { heb: "סליחה", translit: "slicha", pt: "desculpe / com licença" },
    ],
  },

  // ================= NÍVEL 3 · INTERMEDIÁRIO =================
  {
    id: "l3-pronomes",
    nivel: 3,
    titulo: "Pronomes e a frase sem verbo 'ser'",
    xp: 50,
    paragrafos: [
      "Em hebraico, 'você', 'vocês', 'eles' e 'elas' mudam conforme o gênero: atá (você, homem), at (você, mulher), atem (vocês, homens), aten (vocês, mulheres), hem (eles), hen (elas).",
      "No presente NÃO existe o verbo 'ser/estar'. Para dizer 'eu sou aluno' basta juntar o pronome e a palavra: 'eu aluno'.",
    ],
    exemplos: [
      { heb: "אני תלמיד", translit: "ani talmid", pt: "eu sou aluno" },
      { heb: "היא מורה", translit: "hi mora", pt: "ela é professora" },
      { heb: "אתה מורה", translit: "atá more", pt: "você (homem) é professor" },
      { heb: "אנחנו תלמידים", translit: "anáchnu talmidim", pt: "nós somos alunos" },
    ],
  },
  {
    id: "l3-genero-plural",
    nivel: 3,
    titulo: "Gênero e plural",
    xp: 50,
    paragrafos: [
      "Todo substantivo é masculino ou feminino. O feminino costuma terminar em ה (a) ou ת (t): talmid (aluno) / talmida (aluna).",
      "Plural masculino: terminação ים (-im). Plural feminino: terminação ות (-ot). Há exceções: shulchan (mesa) é masculino, mas o plural é shulchanot.",
      "O adjetivo vem DEPOIS do substantivo e concorda em gênero e número: yeled tov (menino bom), yalda tova (menina boa), yeladim tovim (meninos bons).",
    ],
    exemplos: [
      { heb: "תלמיד / תלמידה", translit: "talmid / talmida", pt: "aluno / aluna" },
      { heb: "תלמידים / תלמידות", translit: "talmidim / talmidot", pt: "alunos / alunas" },
      { heb: "ילד טוב", translit: "yeled tov", pt: "um menino bom" },
      { heb: "ילדה טובה", translit: "yalda tova", pt: "uma menina boa" },
      { heb: "שולחן / שולחנות", translit: "shulchan / shulchanot", pt: "mesa / mesas" },
    ],
  },
  {
    id: "l3-artigo",
    nivel: 3,
    titulo: "O artigo 'ha-' e as preposições coladas",
    xp: 50,
    paragrafos: [
      "O artigo definido (o, a) é o prefixo ה (ha-), colado na palavra. Não existe artigo indefinido: sefer significa 'livro' ou 'um livro'.",
      "Quando o substantivo é definido, o adjetivo também recebe ה: ha-sefer ha-gadol (o livro grande).",
      "As preposições ב (em), ל (para) e מ (de, a partir de) também se colam à palavra e se fundem com o artigo: ba-bayit (na casa), la-bayit (para a casa), me-ha-bayit (da casa).",
    ],
    exemplos: [
      { heb: "הספר", translit: "ha-sefer", pt: "o livro" },
      { heb: "הספר הגדול", translit: "ha-sefer ha-gadol", pt: "o livro grande" },
      { heb: "בבית", translit: "ba-bayit", pt: "na casa" },
      { heb: "לבית", translit: "la-bayit", pt: "para a casa" },
      { heb: "מהבית", translit: "me-ha-bayit", pt: "da casa" },
    ],
  },
  {
    id: "l3-presente",
    nivel: 3,
    titulo: "Verbos no presente",
    xp: 50,
    paragrafos: [
      "No presente, o verbo NÃO muda conforme a pessoa (eu, você, ele...), e sim conforme o gênero e o número de quem faz a ação.",
      "Quatro formas: masculino singular, feminino singular, masculino plural e feminino plural. Exemplo com o verbo 'ler': kore, koret, korim, korot.",
    ],
    exemplos: [
      { heb: "אני קורא ספר", translit: "ani kore sefer", pt: "eu (homem) leio um livro" },
      { heb: "אני קוראת ספר", translit: "ani koret sefer", pt: "eu (mulher) leio um livro" },
      { heb: "אנחנו קוראים", translit: "anáchnu korim", pt: "nós lemos (homens ou grupo misto)" },
      { heb: "היא אוכלת", translit: "hi ochelet", pt: "ela come" },
    ],
  },

  // ================= NÍVEL 4 · AVANÇADO =================
  {
    id: "l4-raiz",
    nivel: 4,
    titulo: "A raiz de três letras (shoresh)",
    xp: 60,
    paragrafos: [
      "Quase todas as palavras do hebraico nascem de uma raiz de três consoantes que carrega a ideia central. Mudando as vogais e acrescentando prefixos, a raiz forma verbos, substantivos e adjetivos.",
      "Raiz כ-ת-ב (k-t-v), ideia de ESCREVER: katav (escreveu), kotev (escreve), michtav (carta), ktiva (escrita).",
      "Raiz ל-מ-ד (l-m-d), ideia de APRENDER/ENSINAR: lamad (aprendeu), limed (ensinou), talmid (aluno), melamed (professor), limud (estudo).",
    ],
    exemplos: [
      { heb: "כָּתַב", translit: "katav", pt: "escreveu" },
      { heb: "מִכְתָּב", translit: "michtav", pt: "carta" },
      { heb: "לָמַד", translit: "lamad", pt: "aprendeu" },
      { heb: "מְלַמֵּד", translit: "melamed", pt: "professor" },
    ],
  },
  {
    id: "l4-tempos",
    nivel: 4,
    titulo: "Passado e futuro",
    xp: 60,
    paragrafos: [
      "No PASSADO o verbo ganha terminações que indicam a pessoa: katavti (eu escrevi), katavta (você, homem escreveu), katav (ele escreveu), katva (ela escreveu), katavnu (nós escrevemos), katvu (eles escreveram).",
      "No FUTURO a pessoa é indicada por um prefixo: echtov (eu escreverei), tichtov (você escreverá), yichtov (ele escreverá), nichtov (nós escreveremos).",
    ],
    exemplos: [
      { heb: "כתבתי מכתב", translit: "katavti michtav", pt: "eu escrevi uma carta" },
      { heb: "היא כתבה", translit: "hi katva", pt: "ela escreveu" },
      { heb: "אכתוב לך מחר", translit: "echtov lecha machar", pt: "eu escreverei para você (homem) amanhã" },
      { heb: "נכתוב", translit: "nichtov", pt: "nós escreveremos" },
    ],
  },
  {
    id: "l4-preposicoes",
    nivel: 4,
    titulo: "Preposições com pronomes e posse",
    xp: 60,
    paragrafos: [
      "As preposições se fundem aos pronomes. Com ל (para): li (para mim), lecha (para você, homem), lach (para você, mulher), lo (para ele), la (para ela), lanu (para nós).",
      "Não existe o verbo 'ter'. Para dizer que alguém tem algo, usa-se 'yesh' (há) + ל + pessoa: yesh li sefer, literalmente 'há para mim um livro'. Para negar: 'ein' (não há).",
    ],
    exemplos: [
      { heb: "יש לי ספר", translit: "yesh li sefer", pt: "eu tenho um livro" },
      { heb: "אין לי זמן", translit: "ein li zman", pt: "eu não tenho tempo" },
      { heb: "יש לו כלב", translit: "yesh lo kelev", pt: "ele tem um cachorro" },
      { heb: "יש לה בית", translit: "yesh la bayit", pt: "ela tem uma casa" },
    ],
  },
  {
    id: "l4-smichut",
    nivel: 4,
    titulo: "'De' em hebraico: smichut e a palavra 'she-'",
    xp: 60,
    paragrafos: [
      "Para dizer 'X de Y' o hebraico coloca duas palavras lado a lado (smichut). A primeira costuma ficar um pouco encurtada e o artigo, se houver, vai só na segunda: beit sefer (escola, literalmente 'casa de livro'), beit ha-sefer (a escola).",
      "Substantivos femininos terminados em ה trocam o ה por ת na primeira palavra: tmuna (foto) vira tmunat ha-yeled (a foto do menino).",
      "A palavrinha ש (she-) significa 'que' e liga duas orações: ani choshev she-hu ba-bayit (eu penso que ele está em casa).",
    ],
    exemplos: [
      { heb: "בית ספר", translit: "beit sefer", pt: "escola" },
      { heb: "דלת הבית", translit: "delet ha-bayit", pt: "a porta da casa" },
      { heb: "תמונת הילד", translit: "tmunat ha-yeled", pt: "a foto do menino" },
      { heb: "אני חושב שהוא בבית", translit: "ani choshev she-hu ba-bayit", pt: "eu penso que ele está em casa" },
    ],
  },
];

// ---------------------------------------------------------------------
// VOGAIS BÁSICAS (aba "Vogais" e questões de vogais na prática)
// sinal = o pontinho/traço; som = como se lê.
// ---------------------------------------------------------------------
export const VOGAIS = [
  { sinal: "\u05B7", nome: "Patach", som: "A" },
  { sinal: "\u05B6", nome: "Segol", som: "E" },
  { sinal: "\u05B4", nome: "Hirik", som: "I" },
  { sinal: "\u05B9", nome: "Holam", som: "O" },
  { sinal: "\u05BB", nome: "Kubutz", som: "U" },
  { sinal: "\u05B8", nome: "Kamatz", som: "A / O" },
];

// ---------------------------------------------------------------------
// PALAVRAS (aba "Palavras") -- por nível.
// heb com vogais (nikkud) para ajudar na leitura e na voz.
// `icone` (opcional): desenho da palavra (nome do conjunto Ionicons) mostrado na lista.
// `aceitas` (opcional): outras escritas que as missões de escrita também
// aceitam como certas (sinônimos ou grafias alternativas).
// ---------------------------------------------------------------------
export const PALAVRAS = [
  { nivel: 1, heb: "שָׁלוֹם", translit: "shalom", pt: "paz / olá", icone: "hand-right" },
  { nivel: 1, heb: "בַּיִת", translit: "bayit", pt: "casa", icone: "home" },
  { nivel: 1, heb: "מַיִם", translit: "mayim", pt: "água", icone: "water" },
  { nivel: 1, heb: "תַּפּוּחַ", translit: "tapuach", pt: "maçã", icone: "nutrition" },
  { nivel: 1, heb: "סֵפֶר", translit: "sefer", pt: "livro", icone: "book" },
  { nivel: 1, heb: "שֶׁמֶשׁ", translit: "shemesh", pt: "sol", icone: "sunny" },
  { nivel: 1, heb: "כֶּלֶב", translit: "kelev", pt: "cachorro", icone: "paw" },
  { nivel: 1, heb: "לֵב", translit: "lev", pt: "coração", icone: "heart" },

  { nivel: 2, heb: "תּוֹדָה", translit: "toda", pt: "obrigado(a)", icone: "heart-circle" },
  { nivel: 2, heb: "בְּבַקָּשָׁה", translit: "bevakasha", pt: "por favor / de nada" },
  { nivel: 2, heb: "סְלִיחָה", translit: "slicha", pt: "desculpe" },
  { nivel: 2, heb: "בּוֹקֶר טוֹב", translit: "boker tov", pt: "bom dia" },
  { nivel: 2, heb: "לַיְלָה טוֹב", translit: "layla tov", pt: "boa noite" },
  { nivel: 2, heb: "כֵּן", translit: "ken", pt: "sim" },
  { nivel: 2, heb: "לֹא", translit: "lo", pt: "não" },

  { nivel: 3, heb: "אֲנִי", translit: "ani", pt: "eu" },
  { nivel: 3, heb: "הוּא", translit: "hu", pt: "ele" },
  { nivel: 3, heb: "הִיא", translit: "hi", pt: "ela" },
  { nivel: 3, heb: "אֲנַחְנוּ", translit: "anáchnu", pt: "nós" },
  { nivel: 3, heb: "תַּלְמִיד", translit: "talmid", pt: "aluno", icone: "school" },
  { nivel: 3, heb: "מוֹרָה", translit: "mora", pt: "professora", icone: "person" },

  { nivel: 4, heb: "מִכְתָּב", translit: "michtav", pt: "carta", icone: "mail" },
  { nivel: 4, heb: "מְלַמֵּד", translit: "melamed", pt: "professor", icone: "person", aceitas: ["מורה"] },
  { nivel: 4, heb: "שׁוֹרֶשׁ", translit: "shoresh", pt: "raiz" },
  { nivel: 4, heb: "מִשְׁפָּט", translit: "mishpat", pt: "frase / sentença" },
  { nivel: 4, heb: "מִילָּה", translit: "mila", pt: "palavra", aceitas: ["מלה"] },
];

// ---------------------------------------------------------------------
// FRASES (aba "Frases") -- por nível.
// Escritas sem vogais, como no hebraico do dia a dia.
// ---------------------------------------------------------------------
export const FRASES = [
  { nivel: 1, heb: "שלום!", translit: "shalom!", pt: "Olá!" },
  { nivel: 1, heb: "תודה", translit: "toda", pt: "Obrigado(a)" },
  { nivel: 1, heb: "מה נשמע?", translit: "ma nishma?", pt: "Tudo bem? / Como vão as coisas?" },

  { nivel: 2, heb: "בוקר טוב", translit: "boker tov", pt: "Bom dia" },
  { nivel: 2, heb: "מה שלומך?", translit: "ma shlomcha?", pt: "Como você (homem) está?" },
  { nivel: 2, heb: "אני בסדר", translit: "ani beseder", pt: "Eu estou bem" },
  { nivel: 2, heb: "לא הבנתי", translit: "lo hevanti", pt: "Eu não entendi" },
  { nivel: 2, heb: "אפשר מים?", translit: "efshar mayim?", pt: "Pode ser água? / Posso pegar água?" },

  { nivel: 3, heb: "אני תלמיד", translit: "ani talmid", pt: "Eu sou aluno" },
  { nivel: 3, heb: "היא מורה", translit: "hi mora", pt: "Ela é professora" },
  { nivel: 3, heb: "הספר על השולחן", translit: "ha-sefer al ha-shulchan", pt: "O livro está sobre a mesa" },
  { nivel: 3, heb: "אנחנו קוראים ספר", translit: "anáchnu korim sefer", pt: "Nós lemos um livro" },

  { nivel: 4, heb: "יש לי ספר", translit: "yesh li sefer", pt: "Eu tenho um livro" },
  { nivel: 4, heb: "אין לי זמן", translit: "ein li zman", pt: "Eu não tenho tempo" },
  { nivel: 4, heb: "אני חושב שהוא בבית", translit: "ani choshev she-hu ba-bayit", pt: "Eu penso que ele está em casa" },
  { nivel: 4, heb: "כתבתי מכתב", translit: "katavti michtav", pt: "Eu escrevi uma carta" },
];

// ---------------------------------------------------------------------
// FLASHCARDS (cartas de revisão) -- por nível.
// frente: o que aparece na carta | verso: a explicação | dica: lembrete.
// audio (opcional): texto em hebraico lido pelo botão de áudio da carta.
// xp: pontos ganhos ao marcar "Aprendi" (só na primeira vez).
// Total de XP das cartas: nível 1 = 100 | nível 2 = 125 | nível 3 = 150 | nível 4 = 150
// ---------------------------------------------------------------------
export const FLASHCARDS = [
  // Nível 1
  { id: "c1-bet", nivel: 1, xp: 25, frente: "בּ", verso: "Bet — com ponto central, soa como B.", dica: "B como em bola." },
  { id: "c1-shin", nivel: 1, xp: 25, frente: "שׁ", verso: "Shin — com o ponto à direita, soa SH.", dica: "Sino / chá." },
  { id: "c1-mem", nivel: 1, xp: 25, frente: "מַ", verso: "Mem com patach: M-A.", dica: "A vogal abre o som da sílaba." },
  { id: "c1-shin-segol", nivel: 1, xp: 25, frente: "שֶׁ", verso: "Shin com segol: SH-E.", dica: "O ponto ajuda a localizar a letra." },

  // Nível 2
  { id: "c2-kaf", nivel: 2, xp: 25, frente: "כּ", verso: "Kaf com ponto (dagesh): som de K, como em כֶּלֶב (kelev, cachorro).", dica: "Com ponto dentro, o som é duro." },
  { id: "c2-pe", nivel: 2, xp: 25, frente: "פ", verso: "Pe sem ponto soa F, como em סֵפֶר (sefer, livro).", dica: "Sem ponto, o som é suave." },
  { id: "c2-sin", nivel: 2, xp: 25, frente: "שׂ", verso: "Sin: o ponto fica à esquerda e o som é S (não SH).", dica: "Esquerda = S. Direita = SH." },
  { id: "c2-toda", nivel: 2, xp: 25, frente: "תּוֹדָה", verso: "Toda: obrigado(a).", dica: "A palavra mais útil para começar.", audio: "תּוֹדָה" },
  { id: "c2-boker", nivel: 2, xp: 25, frente: "בוקר טוב", verso: "Boker tov: bom dia.", dica: "Boker = manhã. Tov = bom.", audio: "בוקר טוב" },

  // Nível 3
  { id: "c3-ani", nivel: 3, xp: 30, frente: "אני", verso: "Ani: eu.", dica: "Serve para homem e mulher.", audio: "אני" },
  { id: "c3-hu-hi", nivel: 3, xp: 30, frente: "הוא / היא", verso: "Hu = ele. Hi = ela.", dica: "Hu termina em U (masculino); Hi termina em I (feminino).", audio: "הוא היא" },
  { id: "c3-artigo", nivel: 3, xp: 30, frente: "הַ", verso: "Ha-: o artigo 'o/a', colado na palavra. Ex.: הַסֵּפֶר (ha-sefer, o livro).", dica: "Não existe artigo 'um/uma'." },
  { id: "c3-plural", nivel: 3, xp: 30, frente: "ים / ות", verso: "Plural: -im (masculino) e -ot (feminino).", dica: "talmidim = alunos; talmidot = alunas." },
  { id: "c3-talmid", nivel: 3, xp: 30, frente: "תלמיד / תלמידה", verso: "Aluno / aluna. O feminino costuma terminar em ה.", dica: "Talmid → talmida.", audio: "תלמיד תלמידה" },

  // Nível 4
  { id: "c4-shoresh", nivel: 4, xp: 30, frente: "כ-ת-ב", verso: "Raiz de ESCREVER: katav (escreveu), michtav (carta), ktiva (escrita).", dica: "Três consoantes carregam a ideia.", audio: "כתב" },
  { id: "c4-katavti", nivel: 4, xp: 30, frente: "כתבתי", verso: "Katavti: eu escrevi (passado).", dica: "-ti no fim = 'eu' no passado.", audio: "כתבתי" },
  { id: "c4-echtov", nivel: 4, xp: 30, frente: "אכתוב", verso: "Echtov: eu escreverei (futuro).", dica: "A (alef) no começo = 'eu' no futuro.", audio: "אכתוב" },
  { id: "c4-yesh-li", nivel: 4, xp: 30, frente: "יש לי", verso: "Yesh li: eu tenho (literalmente 'há para mim').", dica: "Não existe o verbo 'ter'.", audio: "יש לי" },
  { id: "c4-beit-sefer", nivel: 4, xp: 30, frente: "בית ספר", verso: "Beit sefer: escola (literalmente 'casa de livro').", dica: "Smichut: duas palavras juntas = 'X de Y'.", audio: "בית ספר" },
];
