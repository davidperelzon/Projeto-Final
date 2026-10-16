/*
 * textoAudio.js
 *
 * Funções PURAS (sem React nem Expo) usadas tanto pelo app (audioService.js)
 * quanto pelo script que gera os arquivos de áudio (scripts/gerar-audios.mjs).
 * Assim o texto que o app procura é SEMPRE igual ao texto com que o
 * arquivo de áudio foi gerado.
 */

// Deixa o texto mais amigável para voz: tira o apoio visual "◌", troca "/"
// por pausa e "-" (raízes como כ-ת-ב) por espaço.
export function prepararTexto(texto) {
  if (typeof texto !== "string") return "";
  return texto
    .normalize("NFC")
    .replace(/\u25CC/g, "")
    .replace(/\s*\/\s*/g, " , ")
    .replace(/[-–—]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
