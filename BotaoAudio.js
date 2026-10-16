/*
 * BotaoAudio.js
 *
 * Botão de pronúncia usado em TODO o app (alfabeto, lições, palavras,
 * frases, flashcards, missões e prática). Ele não toca nada sozinho:
 * pede ao serviço único (audioService.js) e mostra o estado atual.
 *
 * ESTADOS (o ícone e o texto mudam, para não depender só de cor):
 *   parado ........ alto-falante "Ouvir"
 *   carregando .... ampulheta "Carregando…"  (toque para cancelar)
 *   tocando ....... stop "Tocando…"     (toque para parar)
 *   concluído ..... seta circular "Ouvir de novo" (toque para repetir)
 *   erro .......... alerta "Sem áudio"     (toque para tentar de novo)
 *
 * PROPS:
 *   texto    -> texto em hebraico a ser lido (obrigatório)
 *   titulo   -> (opcional) texto do botão parado, ex.: "Som da letra"
 *   rotulo   -> descrição para leitores de tela (ex.: "Ouvir shalom")
 *   variante -> "grande" (padrão: ícone + texto + mensagem de erro) ou "pequena"
 *               (só o ícone, ideal em listas)
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ESTADO_AUDIO, tocarHebraico } from "./audioService";
import { avisar } from "./avisar";
import { cores } from "./theme";
import Icone from "./Icone";

// Texto e ícone de cada estado.
const VISUAL = {
  parado: { icone: "volume-high", texto: "Ouvir", dica: "Toque para ouvir a pronúncia" },
  carregando: { icone: "hourglass-outline", texto: "Carregando…", dica: "Toque para cancelar" },
  tocando: { icone: "stop-circle", texto: "Tocando…", dica: "Toque para parar" },
  concluido: { icone: "refresh", texto: "Ouvir de novo", dica: "Toque para ouvir novamente" },
  erro: { icone: "alert-circle-outline", texto: "Sem áudio", dica: "Toque para tentar de novo" },
};

// Os botões pequenos não têm espaço para o texto do erro. Mostramos a
// explicação em uma caixa de aviso, mas só uma vez por tipo de erro.
const errosJaAvisados = new Set();

export default function BotaoAudio({ texto, rotulo, variante = "grande", titulo }) {
  const [estado, setEstado] = useState("parado");
  const [erro, setErro] = useState(null);
  const controleRef = useRef(null);
  const montadoRef = useRef(true);
  const pulso = useRef(new Animated.Value(1)).current;
  const pequeno = variante === "pequena";

  // Ao sair da tela, para o áudio que este botão iniciou.
  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
      if (controleRef.current) controleRef.current.parar();
    };
  }, []);

  // Microinteração discreta: o botão "pulsa" levemente enquanto toca.
  useEffect(() => {
    if (estado !== "tocando") {
      pulso.setValue(1);
      return undefined;
    }
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(pulso, { toValue: 1.08, duration: 450, useNativeDriver: Platform.OS !== "web" }),
        Animated.timing(pulso, { toValue: 1, duration: 450, useNativeDriver: Platform.OS !== "web" }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, [estado, pulso]);

  // Recebe os estados do serviço de áudio.
  const aoMudar = useCallback((novoEstado, detalheErro) => {
    if (!montadoRef.current) return;
    setEstado(novoEstado);
    setErro(detalheErro || null);
    if (novoEstado === ESTADO_AUDIO.ERRO && detalheErro && !errosJaAvisados.has(detalheErro.codigo)) {
      errosJaAvisados.add(detalheErro.codigo);
      avisar("Áudio indisponível", detalheErro.mensagem);
    }
  }, []);

  const aoTocar = () => {
    // Se está carregando ou tocando, o toque PARA o áudio.
    if (estado === "carregando" || estado === "tocando") {
      if (controleRef.current) controleRef.current.parar();
      return;
    }
    // Parado, concluído ou com erro: toca (ou repete).
    setErro(null);
    controleRef.current = tocarHebraico(texto, aoMudar);
  };

  const visual = VISUAL[estado] || VISUAL.parado;
  const desativado = !texto;

  return (
    <View style={pequeno ? null : styles.envoltorio}>
      <Animated.View style={{ transform: [{ scale: pulso }] }}>
        <TouchableOpacity
          style={[
            pequeno ? styles.pequeno : styles.grande,
            estado === "tocando" && styles.ativo,
            estado === "erro" && styles.comErro,
            desativado && styles.desativado,
          ]}
          onPress={aoTocar}
          disabled={desativado}
          accessibilityRole="button"
          accessibilityLabel={`${rotulo || "Ouvir pronúncia"}. ${visual.texto}`}
          accessibilityHint={visual.dica}
          accessibilityState={{ busy: estado === "carregando", disabled: desativado }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Icone nome={visual.icone} tamanho={pequeno ? 22 : 22} cor={cores.azulEscuro} />
          {!pequeno ? (
            <Text style={[styles.texto, estado === "tocando" && styles.textoAtivo]}>{estado === "parado" && titulo ? titulo : visual.texto}</Text>
          ) : null}
        </TouchableOpacity>
      </Animated.View>

      {/* Explicação do erro (variante grande) */}
      {!pequeno && estado === "erro" && erro ? (
        <Text style={styles.mensagemErro} accessibilityLiveRegion="polite">
          {erro.mensagem}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  envoltorio: {
    alignItems: "center",
  },
  // Variante pequena: área de toque de 44 x 44 (confortável no celular).
  pequeno: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: cores.fundoSuave,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    alignItems: "center",
    justifyContent: "center",
  },
  grande: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 48,
    paddingHorizontal: 18,
    borderRadius: 999,
    backgroundColor: cores.fundoSuave,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  ativo: {
    backgroundColor: cores.destaqueSuave,
    borderColor: cores.laranja,
  },
  comErro: {
    borderColor: cores.laranja,
    borderStyle: "dashed",
  },
  desativado: {
    opacity: 0.45,
  },
  iconePequeno: {
    fontSize: 18,
  },
  iconeGrande: {
    fontSize: 20,
  },
  texto: {
    color: cores.texto,
    fontWeight: "800",
    fontSize: 14,
  },
  textoAtivo: {
    color: cores.texto,
  },
  mensagemErro: {
    marginTop: 8,
    maxWidth: 300,
    textAlign: "center",
    color: cores.texto,
    backgroundColor: cores.destaqueSuave,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
});
