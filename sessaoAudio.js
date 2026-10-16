/*
 * sessaoAudio.js  (Android e navegador)
 *
 * Só o iPhone precisa de ajuste de "sessão de áudio" (veja sessaoAudio.ios.js).
 * Nas outras plataformas não há nada a fazer; esta função existe para o
 * resto do app chamar sempre a mesma coisa.
 */
export function prepararSessaoDeAudio() {
  return Promise.resolve();
}
