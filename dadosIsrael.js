/*
 * israel.js
 *
 * Dados da aba "Israel": lugares do mapa e personalidades históricas.
 * Fica separado da tela (Israel.js) para ser fácil corrigir ou acrescentar
 * itens sem mexer em código.
 *
 * REGRAS DESTE CONTEÚDO:
 *   - Só entram fatos conferidos em fontes públicas confiáveis (veja o campo
 *     `fontes` de cada pessoa). Nada de citações inventadas.
 *   - Onde as fontes divergem (ex.: local exato de uma morte, causa de
 *     morte), o texto simplesmente NÃO afirma.
 *   - Fotos: não incluídas de propósito. Para adicionar retratos de domínio
 *     público (ex.: Wikimedia Commons), salve o arquivo em assets/ e
 *     acrescente o crédito do autor/licença no campo `credito`.
 *
 * PARA ACRESCENTAR UMA PESSOA: copie um item de PERSONALIDADES e edite.
 * PARA ACRESCENTAR UM LUGAR: copie um item de LUGARES. As coordenadas
 * (lat, lon) são usadas para posicionar o ponto no mapa esquemático.
 */

// ---------------------------------------------------------------------
// MAPA ESQUEMÁTICO
// A área mostrada vai de 29,3°N a 33,4°N e de 34,1°E a 36,0°E.
// ---------------------------------------------------------------------
export const AREA_MAPA = { latMin: 29.3, latMax: 33.4, lonMin: 34.1, lonMax: 36.0 };

// Tipo: "cidade" ou "agua".
export const LUGARES = [
  {
    id: "jerusalem",
    nome: "Jerusalém",
    tipo: "cidade",
    heb: "ירושלים",
    translit: "Yerushalayim",
    lat: 31.7683,
    lon: 35.2137,
    texto: "Cidade sagrada para judeus, cristãos e muçulmanos e sede do governo israelense (Knesset).",
  },
  {
    id: "tel-aviv",
    nome: "Tel Aviv",
    tipo: "cidade",
    heb: "תל אביב",
    translit: "Tel Aviv",
    lat: 32.0853,
    lon: 34.7818,
    texto: "Cidade litorânea fundada em 1909 e hoje um dos principais centros econômicos e culturais do país.",
  },
  {
    id: "haifa",
    nome: "Haifa",
    tipo: "cidade",
    heb: "חיפה",
    translit: "Chaifa",
    lat: 32.794,
    lon: 34.9896,
    texto: "Principal cidade do norte, construída no Monte Carmelo, com um dos maiores portos do país.",
  },
  {
    id: "tiberiades",
    nome: "Tiberíades",
    tipo: "cidade",
    heb: "טבריה",
    translit: "Tverya",
    lat: 32.7959,
    lon: 35.5312,
    texto: "Cidade às margens do Mar da Galileia, importante na tradição judaica.",
  },
  {
    id: "nazare",
    nome: "Nazaré",
    tipo: "cidade",
    heb: "נצרת",
    translit: "Natzrat",
    lat: 32.6996,
    lon: 35.3035,
    texto: "Cidade da Baixa Galileia, no norte, ligada à tradição cristã.",
  },
  {
    id: "beer-sheva",
    nome: "Be'er Sheva",
    tipo: "cidade",
    heb: "באר שבע",
    translit: "Be'er Sheva",
    lat: 31.2518,
    lon: 34.7913,
    texto: "A principal cidade do deserto do Negev, no sul do país.",
  },
  {
    id: "eilat",
    nome: "Eilat",
    tipo: "cidade",
    heb: "אילת",
    translit: "Eilat",
    lat: 29.5577,
    lon: 34.9519,
    texto: "Cidade no extremo sul, na costa do Mar Vermelho (Golfo de Aqaba).",
  },
  {
    id: "mar-da-galileia",
    nome: "Mar da Galileia",
    tipo: "agua",
    heb: "הכנרת",
    translit: "HaKinneret",
    lat: 32.82,
    lon: 35.59,
    texto: "O maior lago de água doce de Israel, também chamado de Kinneret.",
  },
  {
    id: "mar-morto",
    nome: "Mar Morto",
    tipo: "agua",
    heb: "ים המלח",
    translit: "Yam HaMelach",
    lat: 31.5,
    lon: 35.47,
    texto: "Lago muito salgado, situado a mais de 400 metros abaixo do nível do mar: uma das regiões mais baixas da superfície terrestre.",
  },
];

// ---------------------------------------------------------------------
// VIAGEM PELO PAÍS: cada nível do app "leva" o aluno a uma cidade. É um
// recurso de motivação do app (não um fato histórico): ao passar na prova
// de um nível, a próxima cidade da viagem é liberada no mapa e na trilha.
// ---------------------------------------------------------------------
export const CIDADE_POR_NIVEL = {
  1: "jerusalem",
  2: "tel-aviv",
  3: "haifa",
  4: "eilat",
};

// Curiosidade cultural mostrada na faixa de cada unidade da trilha.
// (Só fatos conferidos; veja as fontes em PERSONALIDADES e LUGARES.)
export const CURIOSIDADE_POR_NIVEL = {
  1: "A palavra \"alfabeto\" em hebraico, alef-bet (אלף־בית), vem das duas primeiras letras.",
  2: "Shalom (שלום) significa \"paz\" e é usada para dizer olá e tchau.",
  3: "Eliezer Ben-Yehuda lutou para o hebraico voltar a ser falado no dia a dia.",
  4: "No hebraico, quase toda palavra nasce de uma raiz de três consoantes.",
};

// ---------------------------------------------------------------------
// PERSONALIDADES HISTÓRICAS
// ---------------------------------------------------------------------
export const PERSONALIDADES = [
  {
    id: "herzl",
    nome: "Theodor Herzl",
    heb: "הרצל",
    periodo: "1860–1904",
    resumo: "Jornalista e advogado, considerado o pai do sionismo político.",
    bio: "Nasceu em Pest (hoje parte de Budapeste) e estudou Direito em Viena. Em 1896 publicou o livro O Estado Judeu (Der Judenstaat) e, em 1897, convocou o Primeiro Congresso Sionista, em Basileia, na Suíça, onde foi eleito presidente da Organização Sionista.",
    importancia: "Organizou o movimento sionista moderno, que se tornou a base política do que viria a ser o Estado de Israel.",
    curiosidade: "Seus restos mortais foram levados para Israel em 1949 e sepultados no Monte Herzl, em Jerusalém.",
    fontes: "Wikipédia (en); IEG-Mainz / European History Online",
  },
  {
    id: "ben-yehuda",
    nome: "Eliezer Ben-Yehuda",
    heb: "אליעזר בן יהודה",
    periodo: "1858–1922",
    resumo: "Pai do hebraico moderno: lutou para que o hebraico voltasse a ser língua falada.",
    bio: "Nascido Eliezer Perelman, chegou a Jerusalém em 1881. Dedicou a vida a transformar o hebraico, usado durante séculos sobretudo em estudo e oração, em língua do dia a dia. Com a família, criou o primeiro lar de língua hebraica; seu filho Ben-Zion (Itamar Ben-Avi) é considerado a primeira criança criada em hebraico nos tempos modernos.",
    importancia: "Criou muitas palavras novas para conceitos modernos e, em 1910, começou a publicar o Dicionário Completo do Hebraico Antigo e Moderno, concluído depois de sua morte. Teve papel central no Comitê da Língua Hebraica, antecessor da Academia da Língua Hebraica.",
    curiosidade: "Morreu em 16 de dezembro de 1922, cerca de um mês depois de as autoridades britânicas reconhecerem o hebraico como língua oficial dos judeus na Palestina.",
    fontes: "My Jewish Learning; Jewish Currents; Foz Museum",
  },
  {
    id: "ben-gurion",
    nome: "David Ben-Gurion",
    heb: "דוד בן גוריון",
    periodo: "1886–1973",
    resumo: "Líder sionista e primeiro primeiro-ministro de Israel.",
    bio: "Nasceu em Płońsk (então Império Russo, hoje Polônia) e se estabeleceu na Palestina em 1906. Em 14 de maio de 1948, em Tel Aviv, proclamou o estabelecimento do Estado de Israel.",
    importancia: "Foi o primeiro primeiro-ministro e o primeiro ministro da Defesa do país, e é lembrado como o \"pai fundador\" de Israel.",
    curiosidade: "Adotou o sobrenome hebraico Ben-Gurion. Depois de deixar o governo, mudou-se para o kibutz Sde Boker, no deserto do Negev, onde está sepultado.",
    fontes: "Encyclopaedia Britannica; Jewish Agency for Israel",
  },
  {
    id: "golda-meir",
    nome: "Golda Meir",
    heb: "גולדה מאיר",
    periodo: "1898–1978",
    resumo: "Quarta primeira-ministra de Israel e a primeira mulher a ocupar o cargo.",
    bio: "Nasceu Golda Mabovitch em Kiev (então Império Russo). Em 1906 a família emigrou para Milwaukee, nos Estados Unidos, onde ela se tornou professora e ativista do sionismo trabalhista. Mudou-se para a Palestina em 1921 e foi uma das signatárias da Declaração de Independência de Israel, em 1948.",
    importancia: "Foi ministra do Trabalho, ministra das Relações Exteriores e, de 1969 a 1974, primeira-ministra de Israel.",
    curiosidade: "Hebraizou o sobrenome para Meir em 1956, quando assumiu o Ministério das Relações Exteriores.",
    fontes: "Encyclopaedia Britannica; Ministério das Relações Exteriores de Israel",
  },
];

// ---------------------------------------------------------------------
// DADOS PARA OS QUIZZES DE CULTURA (sem texto para ler: o aluno aprende
// respondendo). Cada nível tem uma personalidade; a cidade do nível está em
// CIDADE_POR_NIVEL. As pistas são frases curtas, conferidas nas fontes de
// PERSONALIDADES e LUGARES.
// ---------------------------------------------------------------------
export const PESSOA_POR_NIVEL = {
  1: "herzl",
  2: "ben-gurion",
  3: "ben-yehuda",
  4: "golda-meir",
};

export const PISTA_PESSOA = {
  herzl: "Escreveu «O Estado Judeu» e organizou o 1º Congresso Sionista.",
  "ben-gurion": "Proclamou o Estado de Israel em 14 de maio de 1948.",
  "ben-yehuda": "Lutou para o hebraico voltar a ser falado no dia a dia.",
  "golda-meir": "Foi a primeira mulher a ser primeira-ministra de Israel.",
};

export const PISTA_LUGAR = {
  jerusalem: "Cidade sagrada para judeus, cristãos e muçulmanos.",
  "tel-aviv": "Cidade litorânea fundada em 1909.",
  haifa: "Cidade no Monte Carmelo, com um grande porto.",
  eilat: "Cidade no extremo sul, no Mar Vermelho.",
  tiberiades: "Cidade às margens do Mar da Galileia.",
  nazare: "Cidade da Baixa Galileia, no norte.",
  "beer-sheva": "Principal cidade do deserto do Negev.",
  "mar-morto": "Lago muito salgado, bem abaixo do nível do mar.",
  "mar-da-galileia": "O maior lago de água doce de Israel.",
};
