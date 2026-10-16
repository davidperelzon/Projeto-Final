/*
 * audioService.js
 *
 * ÚNICO serviço de áudio do app. Todas as telas (alfabeto, lições,
 * palavras, frases, flashcards, missões, prática) tocam áudio por aqui,
 * através do componente BotaoAudio.js. Não existe outro lugar que
 * chame voz ou áudio.
 *
 * COMO O ÁUDIO FUNCIONA (e por que é assim):
 *   O app NÃO tem arquivos de áudio gravados. A pronúncia vem da VOZ
 *   DO PRÓPRIO APARELHO (síntese de voz, expo-speech) em hebraico (he-IL).
 *   Isso funciona sem internet, sem chave de API e sem servidor, mas
 *   depende de o aparelho/navegador ter uma voz em hebraico instalada.
 *
 * ORDEM DE TENTATIVAS:
 *   1. Voz do aparelho (celular) ou do navegador, em he-IL.
 *   2. SÓ NO NAVEGADOR, se não houver voz em hebraico: áudio online de
 *      reserva (veja CONFIG_AUDIO.urlReserva).
 *   3. Se nada funcionar: estado "erro" com um texto que explica a
 *      causa e como resolver (instalar a voz hebraica).
 *
 * POR QUE O ÁUDIO ANTIGO FALHAVA (causas encontradas):
 *   - Um botão de áudio dentro do App.js tentava carregar o pacote
 *     `expo-av`, que NÃO existe no Expo SDK 57 (foi removido), e caía
 *     em uma URL não oficial do Google Tradutor, que bloqueia/limita
 *     pedidos e não funciona de forma confiável.
 *   - No navegador, `Speech.getAvailableVoicesAsync()` do expo-speech
 *     NUNCA termina quando o navegador não tem nenhuma voz (a promessa
 *     espera um evento que não chega). Por isso o botão ficava em
 *     "carregando" para sempre. Aqui a lista de vozes é lida direto do
 *     navegador, com tempo limite.
 *   - iPhone com a chave lateral no SILENCIOSO: o expo-speech ficava mudo.
 *     Agora a sessão de áudio do app é colocada em "playback" antes da
 *     fala (sessaoAudio.ios.js), então o som sai direto do app.
 *   - Se a voz não começa a falar (sem voz hebraica instalada), o
 *     celular ficava mudo sem avisar. Agora há um "cronômetro de
 *     segurança": se não começar em poucos segundos, o app avisa.
 *
 * ONDE MEXER:
 *   - Velocidade da fala, tempos de espera, áudio de reserva: CONFIG_AUDIO.
 *   - Para usar ARQUIVOS DE ÁUDIO GRAVADOS no futuro, veja o comentário
 *     "ARQUIVOS GRAVADOS" no fim deste arquivo.
 */

import { Platform } from "react-native";
import * as Speech from "expo-speech";
import { prepararTexto } from "./textoAudio";
import { prepararSessaoDeAudio } from "./sessaoAudio";

// ---------------------------------------------------------------------
// CONFIGURAÇÃO (altere aqui)
// ---------------------------------------------------------------------
export const CONFIG_AUDIO = {
  idioma: "he-IL", // hebraico de Israel
  velocidade: 0.8, // 1 = normal; menor = mais devagar (bom para aprender)
  esperaVozesMs: 1500, // quanto esperar o navegador carregar a lista de vozes
  esperaInicioMs: 4000, // se a fala não começar neste tempo, consideramos falha
  tamanhoMaximoTexto: 300, // textos maiores são cortados

  // ÁUDIO ONLINE DE RESERVA -- usado só no NAVEGADOR e só quando ele
  // não tem voz em hebraico. É um endereço NÃO OFICIAL do Google Tradutor:
  // pode parar de funcionar ou ser limitado a qualquer momento. Para
  // desligar, coloque `usarReservaOnlineNaWeb: false`. Para trocar por
  // um serviço seu (ex.: Google Cloud Text-to-Speech, que exige chave e
  // deve ficar em um servidor, NUNCA no app), altere `urlReserva`.
  // Formato esperado da resposta: um arquivo de áudio (mp3).
  usarReservaOnlineNaWeb: true,
  esperaReservaMs: 10000,
  urlReserva: (texto) =>
    `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=he&q=${encodeURIComponent(texto)}`,
};

// Estados que o botão de áudio mostra.
export const ESTADO_AUDIO = {
  CARREGANDO: "carregando",
  TOCANDO: "tocando",
  CONCLUIDO: "concluido",
  PARADO: "parado",
  ERRO: "erro",
};

// Códigos de erro e o texto que o usuário vê.
export const ERROS_AUDIO = {
  SEM_VOZ: "SEM_VOZ",
  RESERVA_FALHOU: "RESERVA_FALHOU",
  BLOQUEADO_NAVEGADOR: "BLOQUEADO_NAVEGADOR",
  MOTOR: "MOTOR",
  TEXTO_VAZIO: "TEXTO_VAZIO",
};

export function mensagemDeErro(codigo) {
  switch (codigo) {
    case ERROS_AUDIO.SEM_VOZ:
      if (Platform.OS === "web") {
        return "Este navegador não tem voz em hebraico. Use o Microsoft Edge (tem vozes online em hebraico) ou instale o idioma hebraico no sistema.";
      }
      if (Platform.OS === "ios") {
        return "Seu iPhone não tem voz em hebraico. Instale em Ajustes > Acessibilidade > Conteúdo Falado > Vozes > Hebraico.";
      }
      return "Seu celular não tem voz em hebraico. Instale em Configurações > Sistema > Idiomas > Saída de texto para voz (Google Text-to-Speech) > hebraico.";
    case ERROS_AUDIO.RESERVA_FALHOU:
      return "Não foi possível carregar o áudio online. Verifique a internet ou use o Microsoft Edge, que tem voz em hebraico.";
    case ERROS_AUDIO.BLOQUEADO_NAVEGADOR:
      return "O navegador bloqueou o áudio. Toque no botão de novo.";
    case ERROS_AUDIO.TEXTO_VAZIO:
      return "Não há texto para ouvir.";
    default:
      return "Não foi possível tocar o áudio neste aparelho.";
  }
}

// ---------------------------------------------------------------------
// ESTADO INTERNO: só existe UMA reprodução por vez
// ---------------------------------------------------------------------
let sessaoAtual = null;
let contadorSessoes = 0;
let cacheTemVoz = null; // guarda o resultado da checagem de voz (só quando é confiável)

// Envia um novo estado ao botão que pediu o áudio. Estados finais
// (concluído, parado, erro) só são enviados UMA vez por reprodução.
function notificar(sessao, estado, codigoErro) {
  if (!sessao || sessao.finalizada) return;
  const final = estado !== ESTADO_AUDIO.CARREGANDO && estado !== ESTADO_AUDIO.TOCANDO;
  if (final) sessao.finalizada = true;
  if (sessao.limpar && final) sessao.limpar();
  if (sessao.aoMudar) {
    try {
      sessao.aoMudar(estado, codigoErro ? { codigo: codigoErro, mensagem: mensagemDeErro(codigoErro) } : null);
    } catch (erro) {
      // Um erro dentro da tela não pode derrubar o áudio.
    }
  }
}

// Interrompe tudo o que estiver tocando agora (voz e áudio online).
function interromper(sessao) {
  if (!sessao) return;
  sessao.parando = true;
  try {
    Speech.stop();
  } catch (erro) {
    // ignora
  }
  if (sessao.elementoAudio) {
    try {
      sessao.elementoAudio.pause();
      sessao.elementoAudio.removeAttribute && sessao.elementoAudio.removeAttribute("src");
      sessao.elementoAudio.load && sessao.elementoAudio.load();
    } catch (erro) {
      // ignora
    }
  }
  if (sessao.cronometros) sessao.cronometros.forEach((id) => clearTimeout(id));
}

// ---------------------------------------------------------------------
// VOZES DISPONÍVEIS
// ---------------------------------------------------------------------

function idiomaDaVoz(voz) {
  return String((voz && (voz.lang || voz.language)) || "")
    .toLowerCase()
    .replace("_", "-");
}

function ehHebraica(voz) {
  const idioma = idiomaDaVoz(voz);
  return idioma.startsWith("he") || idioma.startsWith("iw");
}

// Espera uma promessa por no máximo `ms` milissegundos.
function comTempoLimite(promessa, ms, valorPadrao) {
  return new Promise((resolver) => {
    const id = setTimeout(() => resolver(valorPadrao), ms);
    Promise.resolve(promessa).then(
      (valor) => {
        clearTimeout(id);
        resolver(valor);
      },
      () => {
        clearTimeout(id);
        resolver(valorPadrao);
      }
    );
  });
}

// NAVEGADOR: lê as vozes direto do `speechSynthesis`, com tempo limite.
// (Não usamos Speech.getAvailableVoicesAsync na web: ele pode nunca terminar.)
function listarVozesWeb() {
  if (typeof window === "undefined" || !window.speechSynthesis) return Promise.resolve(null);
  const sintese = window.speechSynthesis;
  const jaCarregadas = sintese.getVoices();
  if (jaCarregadas && jaCarregadas.length > 0) return Promise.resolve(jaCarregadas);

  return new Promise((resolver) => {
    let resolvido = false;
    const terminar = () => {
      if (resolvido) return;
      resolvido = true;
      if (sintese.removeEventListener) sintese.removeEventListener("voiceschanged", terminar);
      resolver(sintese.getVoices() || []);
    };
    if (sintese.addEventListener) sintese.addEventListener("voiceschanged", terminar);
    setTimeout(terminar, CONFIG_AUDIO.esperaVozesMs);
  });
}

// Devolve a lista de vozes, [] se não for possível saber, ou null se o
// navegador não tem síntese de voz.
async function listarVozes() {
  if (Platform.OS === "web") return listarVozesWeb();
  try {
    return await comTempoLimite(Speech.getAvailableVoicesAsync(), 2500, []);
  } catch (erro) {
    return [];
  }
}

/**
 * Descobre se existe voz em hebraico.
 * Devolve "sim", "nao" ou "desconhecido" (lista vazia: em alguns
 * celulares a lista vem vazia mesmo havendo voz -- então tentamos falar).
 */
async function haVozHebraica() {
  if (cacheTemVoz === "sim") return "sim";
  const vozes = await listarVozes();
  if (vozes === null) return "nao"; // navegador sem síntese de voz
  if (vozes.length === 0) return "desconhecido";
  const resultado = vozes.some(ehHebraica) ? "sim" : "nao";
  if (resultado === "sim") cacheTemVoz = "sim";
  return resultado;
}

/**
 * Relatório para a tela de diagnóstico ("Testar áudio" no Perfil).
 * Não toca nada: só informa o que o aparelho oferece.
 */
export async function diagnosticarAudio() {
  const vozes = await listarVozes();
  const lista = vozes || [];
  return {
    plataforma: Platform.OS,
    suporteSintese: vozes !== null,
    totalVozes: lista.length,
    vozesHebraicas: lista.filter(ehHebraica).map((voz) => voz.name || voz.identifier || idiomaDaVoz(voz)),
    reservaOnlineAtiva: Platform.OS === "web" && CONFIG_AUDIO.usarReservaOnlineNaWeb,
    resultado: await haVozHebraica(),
  };
}

// ---------------------------------------------------------------------
// TOCAR
// ---------------------------------------------------------------------

// Tenta falar com a voz do aparelho. Devolve true se funcionou (a fala
// começou ou terminou) e false se falhou (sem voz, sem início, erro).
function falarComVozDoAparelho(texto, sessao) {
  return new Promise((resolver) => {
    let iniciou = false;
    let resolvido = false;
    // `abandonada` = desistimos desta voz (não começou a tempo). Eventos
    // que ela mandar depois são ignorados. É diferente de `sessao.parando`,
    // que significa "o usuário mandou parar".
    let abandonada = false;
    const concluir = (valor) => {
      if (resolvido) return;
      resolvido = true;
      resolver(valor);
    };
    const ignorar = () => abandonada || sessao.parando;

    // Cronômetro de segurança: se a fala não começa, quase sempre é
    // porque não existe voz em hebraico instalada.
    const cronometro = setTimeout(() => {
      if (iniciou || sessao.finalizada || sessao.parando) return;
      abandonada = true;
      try {
        Speech.stop();
      } catch (erro) {
        // ignora
      }
      concluir(false);
    }, CONFIG_AUDIO.esperaInicioMs);
    sessao.cronometros.push(cronometro);

    try {
      Speech.speak(texto, {
        language: CONFIG_AUDIO.idioma,
        rate: CONFIG_AUDIO.velocidade,
        pitch: 1,
        // iPhone: usa a sessão de áudio do app (já em "playback"), assim a voz
        // não obedece à chave de silencioso. Ignorado nas outras plataformas.
        useApplicationAudioSession: true,
        onStart: () => {
          if (ignorar()) return;
          iniciou = true;
          clearTimeout(cronometro);
          notificar(sessao, ESTADO_AUDIO.TOCANDO);
          concluir(true);
        },
        onDone: () => {
          clearTimeout(cronometro);
          if (ignorar()) return;
          iniciou = true;
          notificar(sessao, ESTADO_AUDIO.CONCLUIDO);
          concluir(true);
        },
        onStopped: () => {
          clearTimeout(cronometro);
          if (ignorar()) return; // quem mandou parar (parar()) já avisou o botão
          if (!iniciou) concluir(false);
        },
        onError: () => {
          clearTimeout(cronometro);
          if (ignorar()) return; // erro causado por nós ao parar/desistir: ignora
          if (!iniciou) {
            concluir(false);
          } else {
            notificar(sessao, ESTADO_AUDIO.ERRO, ERROS_AUDIO.MOTOR);
          }
        },
      });
    } catch (erro) {
      clearTimeout(cronometro);
      concluir(false);
    }
  });
}

// NAVEGADOR: toca o áudio online de reserva com um elemento <audio>.
function tocarReservaWeb(texto, sessao) {
  return new Promise((resolver) => {
    const Construtor = typeof window !== "undefined" ? window.Audio : null;
    if (typeof Construtor !== "function") {
      resolver(false);
      return;
    }

    let resolvido = false;
    const concluir = (valor, codigoErro) => {
      if (resolvido) return;
      resolvido = true;
      if (!valor && !sessao.parando) notificar(sessao, ESTADO_AUDIO.ERRO, codigoErro || ERROS_AUDIO.RESERVA_FALHOU);
      resolver(valor);
    };

    const elemento = new Construtor();
    sessao.elementoAudio = elemento;
    const cronometro = setTimeout(() => concluir(false, ERROS_AUDIO.RESERVA_FALHOU), CONFIG_AUDIO.esperaReservaMs);
    sessao.cronometros.push(cronometro);

    elemento.addEventListener("playing", () => {
      clearTimeout(cronometro);
      notificar(sessao, ESTADO_AUDIO.TOCANDO);
      concluir(true);
    });
    elemento.addEventListener("ended", () => {
      clearTimeout(cronometro);
      if (!sessao.parando) notificar(sessao, ESTADO_AUDIO.CONCLUIDO);
      concluir(true);
    });
    elemento.addEventListener("error", () => {
      clearTimeout(cronometro);
      if (!sessao.parando) concluir(false, ERROS_AUDIO.RESERVA_FALHOU);
    });

    elemento.src = CONFIG_AUDIO.urlReserva(texto);
    const promessa = elemento.play();
    if (promessa && typeof promessa.catch === "function") {
      promessa.catch((erro) => {
        clearTimeout(cronometro);
        if (sessao.parando) return;
        const bloqueado = erro && erro.name === "NotAllowedError";
        concluir(false, bloqueado ? ERROS_AUDIO.BLOQUEADO_NAVEGADOR : ERROS_AUDIO.RESERVA_FALHOU);
      });
    }
  });
}

/**
 * Toca um texto em hebraico.
 *
 * @param {string} texto   texto em hebraico (com ou sem vogais)
 * @param {(estado: string, erro: {codigo, mensagem}|null) => void} aoMudar
 *        chamada a cada mudança: "carregando" -> "tocando" -> "concluido"
 *        (ou "parado" / "erro").
 * @returns {{ parar: () => void }} controle para interromper esta reprodução.
 */
export function tocarHebraico(texto, aoMudar) {
  // Qualquer reprodução anterior é interrompida (só uma por vez).
  if (sessaoAtual && !sessaoAtual.finalizada) {
    const anterior = sessaoAtual;
    interromper(anterior);
    notificar(anterior, ESTADO_AUDIO.PARADO);
  }

  const sessao = {
    id: ++contadorSessoes,
    aoMudar,
    finalizada: false,
    parando: false,
    cronometros: [],
    elementoAudio: null,
  };
  sessaoAtual = sessao;

  const controle = {
    parar: () => {
      if (sessao.finalizada) return;
      interromper(sessao);
      notificar(sessao, ESTADO_AUDIO.PARADO);
    },
  };

  // prepararTexto (textoAudio.js) tira o apoio visual "◌", troca "/" por pausa e "-" por espaço.
  const limpo = prepararTexto(String(texto || "")).slice(0, CONFIG_AUDIO.tamanhoMaximoTexto);
  if (!limpo) {
    notificar(sessao, ESTADO_AUDIO.ERRO, ERROS_AUDIO.TEXTO_VAZIO);
    return controle;
  }

  notificar(sessao, ESTADO_AUDIO.CARREGANDO);

  // O fluxo roda "em segundo plano"; o botão acompanha pelos estados.
  (async () => {
    const naWeb = Platform.OS === "web";
    // iPhone: libera o som mesmo com a chave lateral no silencioso (sessaoAudio.ios.js).
    await prepararSessaoDeAudio();
    const voz = await haVozHebraica();
    if (sessao.finalizada || sessao.parando) return;

    // 1) Voz do aparelho (quando existe ou quando não dá para saber).
    if (voz !== "nao") {
      const funcionou = await falarComVozDoAparelho(limpo, sessao);
      if (funcionou || sessao.finalizada || sessao.parando) return;
    }

    // 2) Reserva online (somente no navegador).
    if (naWeb && CONFIG_AUDIO.usarReservaOnlineNaWeb) {
      const funcionou = await tocarReservaWeb(limpo, sessao);
      if (funcionou || sessao.finalizada || sessao.parando) return;
      return; // a própria função já avisou o erro
    }

    // 3) Nada funcionou.
    notificar(sessao, ESTADO_AUDIO.ERRO, ERROS_AUDIO.SEM_VOZ);
  })().catch(() => notificar(sessao, ESTADO_AUDIO.ERRO, ERROS_AUDIO.MOTOR));

  return controle;
}

// Para qualquer áudio que esteja tocando.
export function pararAudio() {
  if (sessaoAtual && !sessaoAtual.finalizada) {
    interromper(sessaoAtual);
    notificar(sessaoAtual, ESTADO_AUDIO.PARADO);
  }
}

// Nome antigo, mantido para não quebrar quem já importava `pararFala`.
export const pararFala = pararAudio;

/*
 * ARQUIVOS GRAVADOS (opcional, para o futuro)
 * ------------------------------------------------------------------
 * Se um dia você tiver gravações de voz (ex.: mp3 de cada palavra),
 * o caminho mais confiável é guardá-las em assets/audio/ e tocá-las
 * com o pacote `expo-audio` (compatível com o SDK 57). Para isso:
 *   1. npx expo install expo-audio
 *   2. Crie um mapa { "שלום": require("./assets/audio/shalom.mp3") }.
 *   3. Em `tocarHebraico`, ANTES da voz do aparelho, procure o texto
 *      nesse mapa e toque o arquivo; se não achar, siga o fluxo atual.
 * Assim a pronúncia fica idêntica em todos os aparelhos.
 */
