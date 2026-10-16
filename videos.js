/*
 * videos.js
 *
 * Atalhos para VÍDEOS no YouTube sobre cada assunto. O app não guarda nem
 * incorpora vídeos: o botão abre a BUSCA do YouTube já com o tema pronto.
 * Assim nenhum link pode "quebrar" e você não depende de um vídeo
 * específico continuar no ar.
 *
 * Para trocar o assunto de um vídeo, edite o texto em BUSCAS.
 */
import { Linking, Platform } from "react-native";

export const BUSCAS = {
  alfabeto: "alfabeto hebraico para iniciantes alef bet pronúncia",
  vogais: "nikkud vogais hebraico para iniciantes",
  saudacoes: "hebraico para iniciantes cumprimentos shalom boker tov",
  pronomes: "hebraico para iniciantes pronomes gramática",
  verbos: "hebraico verbos presente passado futuro iniciantes",
  raizes: "raízes de três letras hebraico shoresh",
  israel: "Israel cultura cidades Jerusalém Tel Aviv documentário",
  ditado: "hebraico escutar e escrever iniciantes",
};

// Escolhe o assunto de busca de uma lição pelo id.
export function buscaDaLicao(licaoId) {
  if (/direcao|finais/.test(licaoId)) return BUSCAS.alfabeto;
  if (/nikkud|pontos/.test(licaoId)) return BUSCAS.vogais;
  if (/saudacoes/.test(licaoId)) return BUSCAS.saudacoes;
  if (/pronomes|genero|artigo/.test(licaoId)) return BUSCAS.pronomes;
  if (/presente|tempos|preposicoes|smichut/.test(licaoId)) return BUSCAS.verbos;
  if (/raiz/.test(licaoId)) return BUSCAS.raizes;
  return BUSCAS.alfabeto;
}

export function abrirVideos(busca) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(busca)}`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  Linking.openURL(url).catch(() => {});
}
