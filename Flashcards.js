/*
 * Flashcards.js
 *
 * Cartas de revisão com:
 *   - animação suave ao virar a carta;
 *   - progresso da rodada ("Faltam 5 de 12") com barra;
 *   - áudio (mesmo BotaoAudio / audioService do resto do app);
 *   - classificação de dificuldade: Difícil, Bom ou Fácil;
 *   - REPETIÇÃO PRIORITÁRIA: carta marcada como "Difícil" volta logo
 *     (3 cartas depois); "Bom" e "Fácil" saem da rodada;
 *   - favoritos (★) e filtro "só favoritos";
 *   - ordem inteligente: cartas difíceis e ainda não vistas vêm primeiro.
 *
 * XP: a primeira vez que o aluno classifica uma carta (qualquer
 * dificuldade), ela rende o XP da carta (campo `xp` em niveis.js).
 *
 * As dificuldades e os favoritos ficam salvos NA CONTA do usuário
 * (userDB.js), então a ordem da próxima rodada considera o que já foi marcado.
 *
 * Onde mexer: as cartas em niveis.js (FLASHCARDS); as cores em theme.js.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotaoAudio from "./BotaoAudio";
import { FLASHCARDS } from "./niveis";
import { audioDaLetra } from "./letrasHebraicas";
import { cores } from "./theme";
import Icone from "./Icone";

// Quantas cartas depois uma carta "Difícil" reaparece.
const REAPARECE_DEPOIS_DE = 3;

const ROTULOS = {
  dificil: "Difícil",
  bom: "Bom",
  facil: "Fácil",
};

// Texto hebraico para o áudio da carta: o campo `audio`, ou a própria
// frente quando ela é uma única palavra/letra em hebraico.
function audioDaCarta(carta) {
  if (carta.audio) return carta.audio;
  const frente = String(carta.frente || "");
  if (/[\u05D0-\u05EA]/.test(frente) && !/[\/\-\s]/.test(frente)) return audioDaLetra(frente);
  return null;
}

// Ordena o baralho: difíceis > novas > boas > fáceis; favoritas sobem um pouco.
function ordenarBaralho(cartas, dificuldades, favoritos) {
  const pontos = { dificil: 3, novo: 2, bom: 1, facil: 0 };
  return cartas
    .map((carta, posicao) => {
      const marca = dificuldades[carta.id] || "novo";
      return { id: carta.id, nota: pontos[marca] + (favoritos.includes(carta.id) ? 0.5 : 0), posicao };
    })
    .sort((a, b) => b.nota - a.nota || a.posicao - b.posicao)
    .map((item) => item.id);
}

export default function Flashcards({ usuario, nivelId, aoGanharXp, aoClassificar, aoFavoritar }) {
  const todas = useMemo(() => FLASHCARDS.filter((carta) => carta.nivel <= nivelId), [nivelId]);
  const porId = useMemo(() => {
    const mapa = {};
    todas.forEach((carta) => {
      mapa[carta.id] = carta;
    });
    return mapa;
  }, [todas]);

  const [soFavoritos, setSoFavoritos] = useState(false);
  const [fila, setFila] = useState(() => ordenarBaralho(todas, usuario.cartas, usuario.favoritos));
  const [totalRodada, setTotalRodada] = useState(todas.length);
  const [virada, setVirada] = useState(false);

  // Animação de virar: a carta "afina" até sumir (escala horizontal 0),
  // troca o conteúdo e volta ao normal.
  const escalaX = useRef(new Animated.Value(1)).current;
  const nativo = Platform.OS !== "web";
  const virar = () => {
    Animated.timing(escalaX, { toValue: 0.02, duration: 110, useNativeDriver: nativo }).start(() => {
      setVirada((valor) => !valor);
      Animated.timing(escalaX, { toValue: 1, duration: 130, useNativeDriver: nativo }).start();
    });
  };

  // Começa uma nova rodada (opcionalmente só com favoritos).
  const novaRodada = (apenasFavoritos) => {
    const base = apenasFavoritos ? todas.filter((c) => usuario.favoritos.includes(c.id)) : todas;
    setFila(ordenarBaralho(base, usuario.cartas, usuario.favoritos));
    setTotalRodada(base.length);
    setVirada(false);
    escalaX.setValue(1);
  };

  const alternarFiltro = () => {
    const novo = !soFavoritos;
    setSoFavoritos(novo);
    novaRodada(novo);
  };

  const atualId = fila[0];
  // Trava contra toque duplo: sem ela, dois toques rápidos classificariam duas cartas.
  const trava = useRef(false);
  useEffect(() => {
    trava.current = false;
  }, [fila]);
  const carta = atualId ? porId[atualId] : null;
  const concluidas = Math.max(0, totalRodada - fila.length);
  const progresso = totalRodada ? (concluidas / totalRodada) * 100 : 0;

  // ----- Rodada concluída (ou sem cartas) -----
  if (!carta) {
    const semFavoritos = soFavoritos && usuario.favoritos.length === 0;
    return (
      <View style={styles.cartao}>
        <Text style={styles.titulo}>{semFavoritos ? "Nenhum favorito ainda" : "Rodada concluída"}</Text>
        <Text style={styles.texto}>
          {semFavoritos
            ? "Toque na estrela de uma carta para guardá-la aqui."
            : `Você revisou ${totalRodada} ${totalRodada === 1 ? "carta" : "cartas"}. As marcadas como Difícil virão primeiro na próxima rodada.`}
        </Text>
        <TouchableOpacity style={styles.botaoPrimario} onPress={() => novaRodada(soFavoritos)} accessibilityRole="button">
          <Text style={styles.botaoPrimarioTexto}>Nova rodada</Text>
        </TouchableOpacity>
        {soFavoritos ? (
          <TouchableOpacity style={styles.botaoLink} onPress={alternarFiltro} accessibilityRole="button">
            <Text style={styles.link}>Ver todas as cartas</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const feita = usuario.feitos.includes(`carta:${carta.id}`);
  const marcaAtual = usuario.cartas[carta.id];
  const favorita = usuario.favoritos.includes(carta.id);
  const audio = audioDaCarta(carta);

  // Classifica a carta, dá o XP (1ª vez) e decide o que acontece com ela.
  const classificar = async (dificuldade) => {
    if (trava.current) return;
    trava.current = true;
    aoClassificar(carta.id, dificuldade);
    await aoGanharXp(`carta:${carta.id}`, carta.xp);
    setVirada(false);
    escalaX.setValue(1);
    setFila((atual) => {
      const resto = atual.slice(1);
      if (dificuldade === "dificil") {
        const posicao = Math.min(REAPARECE_DEPOIS_DE, resto.length);
        return [...resto.slice(0, posicao), carta.id, ...resto.slice(posicao)];
      }
      return resto;
    });
  };

  return (
    <View>
      <View style={styles.cabecalho}>
        <Text style={styles.secao}>Flashcards</Text>
        <TouchableOpacity
          style={[styles.chip, soFavoritos && styles.chipAtivo]}
          onPress={alternarFiltro}
          accessibilityRole="button"
          accessibilityState={{ selected: soFavoritos }}
          accessibilityLabel={soFavoritos ? "Mostrar todas as cartas" : "Mostrar só os favoritos"}
        >
          <Icone nome="star" tamanho={15} cor={cores.laranja} />
          <Text style={[styles.chipTexto, soFavoritos && styles.chipTextoAtivo]}>
            Favoritos ({usuario.favoritos.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.progressoLinha}>
        <Text style={styles.progressoTexto}>
          Faltam {fila.length} de {totalRodada}
        </Text>
        <Text style={styles.progressoTexto}>{Math.round(progresso)}%</Text>
      </View>
      <View style={styles.barraFundo} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: totalRodada, now: concluidas }}>
        <View style={[styles.barraPreenchida, { width: `${Math.max(4, progresso)}%` }]} />
      </View>

      <Animated.View style={[styles.cartao, { transform: [{ scaleX: escalaX }] }]}>
        <View style={styles.cartaoTopo}>
          <Text style={styles.etiqueta}>
            {marcaAtual ? `Marcada: ${ROTULOS[marcaAtual]}` : feita ? "Carta já vista" : `Carta nova · +${carta.xp} XP`}
          </Text>
          <TouchableOpacity
            onPress={() => aoFavoritar(carta.id)}
            style={styles.estrela}
            accessibilityRole="button"
            accessibilityState={{ selected: favorita }}
            accessibilityLabel={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Icone nome={favorita ? "star" : "star-outline"} tamanho={28} cor={cores.laranja} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={virar}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel={virada ? "Carta virada. Toque para ver a frente" : "Toque para ver a resposta"}
        >
          {!virada ? (
            <View style={styles.face}>
              <Text style={styles.frente}>{carta.frente}</Text>
              <Text style={styles.dica}>Toque na carta para ver a resposta</Text>
            </View>
          ) : (
            <View style={styles.face}>
              <Text style={styles.verso}>{carta.verso}</Text>
              <Text style={styles.dicaVerso}>Dica: {carta.dica}</Text>
            </View>
          )}
        </TouchableOpacity>

        {audio ? (
          <View style={styles.audio}>
            <BotaoAudio key={carta.id} texto={audio} rotulo="Ouvir a pronúncia da carta" />
          </View>
        ) : null}

        {!virada ? (
          <TouchableOpacity style={styles.botaoPrimario} onPress={virar} accessibilityRole="button">
            <Text style={styles.botaoPrimarioTexto}>Revelar</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <Text style={styles.pergunta}>Como foi lembrar?</Text>
            <View style={styles.dificuldades}>
              <TouchableOpacity style={[styles.dif, styles.difDificil]} onPress={() => classificar("dificil")} accessibilityRole="button" accessibilityLabel="Difícil: a carta volta logo">
                <Icone nome="sad-outline" tamanho={20} cor={cores.texto} /><Text style={styles.difTexto}>Difícil</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dif} onPress={() => classificar("bom")} accessibilityRole="button" accessibilityLabel="Bom">
                <Icone nome="happy-outline" tamanho={20} cor={cores.texto} /><Text style={styles.difTexto}>Bom</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dif, styles.difFacil]} onPress={() => classificar("facil")} accessibilityRole="button" accessibilityLabel="Fácil">
                <Icone nome="happy" tamanho={20} cor={cores.branco} /><Text style={[styles.difTexto, styles.difTextoClaro]}>Fácil</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.ajuda}>Difícil = a carta volta logo. Bom e Fácil = sai da rodada.</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    flexWrap: "wrap",
  },
  secao: { fontSize: 20, fontWeight: "800", color: cores.texto },
  chip: {
    flexDirection: "row",
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
  },
  chipAtivo: { backgroundColor: cores.destaqueSuave, borderColor: cores.laranja },
  chipTexto: { color: cores.texto, fontWeight: "800", fontSize: 12 },
  chipTextoAtivo: { color: cores.texto },
  progressoLinha: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressoTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: "800" },
  barraFundo: { height: 10, borderRadius: 999, backgroundColor: cores.fundoSuave, overflow: "hidden", marginBottom: 12 },
  barraPreenchida: { height: "100%", borderRadius: 999, backgroundColor: cores.laranja },
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    marginBottom: 14,
  },
  cartaoTopo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  etiqueta: { flex: 1, color: cores.textoSuave, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 },
  estrela: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  estrelaTexto: { fontSize: 28, color: cores.laranja },
  face: { minHeight: 150, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  frente: { fontSize: 56, color: cores.azulMedio, fontWeight: "800", textAlign: "center", writingDirection: "rtl" },
  dica: { color: cores.textoSuave, fontSize: 13, fontWeight: "700", marginTop: 10, textAlign: "center" },
  verso: { fontSize: 18, color: cores.texto, textAlign: "center", lineHeight: 26, fontWeight: "700" },
  dicaVerso: { color: cores.verdeMusgo, fontSize: 13, fontWeight: "800", textAlign: "center", marginTop: 10 },
  audio: { alignItems: "center", marginVertical: 8 },
  pergunta: { color: cores.texto, fontWeight: "800", fontSize: 14, textAlign: "center", marginTop: 6, marginBottom: 8 },
  dificuldades: { flexDirection: "row", gap: 8 },
  dif: {
    flex: 1,
    flexDirection: "row",
    gap: 6,
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.fundoSuave,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  difDificil: { backgroundColor: cores.destaqueSuave, borderColor: cores.laranja },
  difFacil: { backgroundColor: cores.verdeMusgo, borderColor: cores.verdeMusgo },
  difTexto: { color: cores.texto, fontWeight: "800", fontSize: 13 },
  difTextoClaro: { color: cores.branco },
  ajuda: { color: cores.textoSuave, fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 8 },
  botaoPrimario: {
    minHeight: 50,
    backgroundColor: cores.azulEscuro,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "800", fontSize: 15 },
  botaoLink: { alignItems: "center", paddingVertical: 12 },
  link: { color: cores.azulMedio, fontWeight: "800", textDecorationLine: "underline" },
  titulo: { color: cores.texto, fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6 },
  texto: { color: cores.textoSuave, fontSize: 14, lineHeight: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
});
