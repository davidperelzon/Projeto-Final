/*
 * sessaoAudio.ios.js  (somente iPhone/iPad)
 *
 * POR QUE EXISTE: no iPhone o áudio de um app segue a CHAVE LATERAL
 * (modo silencioso). Por padrão a voz do app fica muda quando a chave está
 * no silencioso. Para o som sair direto do app, sem o usuário precisar
 * desligar o silencioso, a "sessão de áudio" do app precisa estar na
 * categoria "playback" (reprodução). É o que `playsInSilentMode: true` faz.
 *
 * Observação: o "Não perturbe"/Foco do iPhone não silencia áudio de apps;
 * quem bloqueia o som é a chave lateral de silencioso e o volume.
 *
 * É chamado uma vez, antes da primeira fala (veja audioService.js).
 * Se falhar, o app segue funcionando (só ficaria sujeito ao silencioso).
 */
import { setAudioModeAsync } from "expo-audio";

let preparada = null;

export function prepararSessaoDeAudio() {
  if (!preparada) {
    preparada = setAudioModeAsync({
      playsInSilentMode: true, // toca mesmo com a chave lateral no silencioso
      interruptionMode: "duckOthers", // abaixa o volume de outros apps enquanto fala
      shouldPlayInBackground: false,
      allowsRecording: false,
    }).catch(() => {
      preparada = null; // tenta de novo na próxima fala
    });
  }
  return preparada;
}
