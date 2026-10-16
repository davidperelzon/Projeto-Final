/*
 * fotos.js
 *
 * Fotos usadas no app. TODAS vêm do Wikimedia Commons (domínio público ou
 * licença livre) e são carregadas pela internet na hora de usar, pelo endereço
 * oficial `Special:FilePath` do Commons. Nada é copiado para dentro do app.
 *
 * Cada foto tem o autor e a licença, mostrados como crédito na tela.
 * Se uma foto não carregar (sem internet, arquivo renomeado), a tela mostra um
 * bloco de cor no lugar: o app continua funcionando.
 *
 * COMO TROCAR OU ACRESCENTAR UMA FOTO:
 *   1. Abra a página do arquivo em commons.wikimedia.org e copie o nome exato
 *      (sem "File:"), por exemplo "Jerusalem Dome of the rock BW 14.JPG".
 *   2. Confira autor e licença na própria página.
 *   3. Acrescente um item abaixo.
 * Para trabalhar sem internet, baixe a imagem para assets/ e troque `urlFoto`
 * para usar `require(...)`.
 */

export const FOTOS = {
  jerusalem: {
    arquivo: "Jerusalem Dome of the rock BW 14.JPG",
    legenda: "Jerusalém: a Cúpula da Rocha, na Cidade Antiga",
    autor: "Berthold Werner",
    licenca: "domínio público",
  },
  "tel-aviv": {
    arquivo: "Skyline of Gush Dan, Tel Aviv, Israel (2003).jpg",
    legenda: "Tel Aviv e a região metropolitana de Gush Dan",
    autor: "Pixie",
    licenca: "CC BY-SA 3.0",
  },
  haifa: {
    arquivo: "Bahá'í gardens by David Shankbone.jpg",
    legenda: "Haifa: jardins no Monte Carmelo",
    autor: "David Shankbone",
    licenca: "CC BY-SA 3.0",
  },
  eilat: {
    arquivo: "Elifaz 152PAN.jpg",
    legenda: "Eilat e Aqaba, vistas do outro lado do Mar Vermelho",
    autor: "Beivushtang",
    licenca: "CC BY-SA 3.0",
  },
  herzl: {
    arquivo: "Theodor Herzl.jpg",
    legenda: "Theodor Herzl",
    autor: "autor desconhecido",
    licenca: "domínio público",
  },
  "ben-yehuda": {
    arquivo: "Eliezer Ben-Yehuda at his desk in Jerusalem - c1912.jpg",
    legenda: "Eliezer Ben-Yehuda em sua mesa, em Jerusalém (por volta de 1912)",
    autor: "Shlomo Narinsky",
    licenca: "domínio público",
  },
  "ben-gurion": {
    arquivo: "Declaration of State of Israel 1948.jpg",
    legenda: "Ben-Gurion proclama o Estado de Israel, em Tel Aviv, 14/05/1948",
    autor: "Rudi Weissenstein",
    licenca: "domínio público",
  },
  "golda-meir": {
    arquivo: "Golda Meir 03265u-2.jpg",
    legenda: "Golda Meir, em 1973",
    autor: "Marion S. Trikosko (Library of Congress)",
    licenca: "domínio público",
  },
};

// Endereço da imagem no Commons, já no tamanho pedido (largura em pixels).
export function urlFoto(id, largura = 800) {
  const foto = FOTOS[id];
  if (!foto) return null;
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(foto.arquivo)}?width=${largura}`;
}

export function creditoFoto(id) {
  const foto = FOTOS[id];
  return foto ? `Foto: ${foto.autor} · ${foto.licenca} · Wikimedia Commons` : "";
}
