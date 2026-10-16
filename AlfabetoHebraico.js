import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { LETRAS, FORMAS_FINAIS } from "./letrasHebraicas";
import BotaoAudio from "./BotaoAudio";
import { audioDaLetra } from "./letrasHebraicas";
import Logo from "./Logo";
import { pararFala } from "./audioService";
import { cores } from "./theme";
import Icone from "./Icone";

/*
 * AlfabetoHebraico.js
 *
 * Tela de estudo do alfabeto: 22 letras + 5 formas finais.
 *
 * ONDE MEXER:
 *   - Letras, exemplos e textos de pronúncia: arquivo letrasHebraicas.js
 *   - Cores: arquivo theme.js
 *   - Áudio: BotaoAudio.js (botão) e audioService.js (voz)
 *
 * XP: a primeira vez que o usuário abre cada letra, a função
 * `onGanharXp` (enviada pelo App.js) soma 5 XP à conta dele.
 */

const TOTAL_LETRAS = LETRAS.length;
const XP_POR_LETRA = 5;

export default function AlfabetoHebraico({ onVoltarParaHome, onGanharXp }) {
  const [indiceAtual, setIndiceAtual] = useState(0);
  const letraAtual = LETRAS[indiceAtual];

  // Sempre que a letra exibida muda, tenta somar XP. O App.js ignora o
  // pedido se esta letra já tiver rendido XP antes para este usuário.
  useEffect(() => {
    if (onGanharXp) onGanharXp(`letra:${letraAtual.letra}`, XP_POR_LETRA);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indiceAtual]);
  const progresso = useMemo(() => ((indiceAtual + 1) / TOTAL_LETRAS) * 100, [indiceAtual]);

  const irParaAnterior = () => {
    if (indiceAtual > 0) setIndiceAtual((valor) => valor - 1);
  };

  const irParaProxima = () => {
    if (indiceAtual < TOTAL_LETRAS - 1) setIndiceAtual((valor) => valor + 1);
  };

  const selecionarLetra = (indice) => setIndiceAtual(indice);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.voltarButton}
          onPress={onVoltarParaHome}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a trilha"
        >
          <Text style={styles.voltarButtonText}>← Trilha</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alfabeto</Text>
        <Logo largura={56} />
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTag}>Módulo 1</Text>
          <Text style={styles.heroProgress}>{Math.round(progresso)}%</Text>
        </View>

        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progresso}%` }]} />
        </View>

        <View style={styles.cardMain}>
          <Text style={styles.letterBadge}>Letra {indiceAtual + 1}</Text>
          <Text style={styles.letraGrande}>{letraAtual.letra}</Text>
          <Text style={styles.nomeLetra}>{letraAtual.nome}</Text>
          <Text style={styles.translit}>{letraAtual.transliteracao}</Text>

          <Text style={styles.explicacao}>{letraAtual.pronuncia}</Text>

          <View style={styles.wordBubble}>
            <Text style={styles.wordTitle}>Exemplo</Text>
            <Text style={styles.wordHeb}>{letraAtual.exemplo}</Text>
            <Text style={styles.wordMeta}>{letraAtual.exemploTransliteracao} · {letraAtual.traducao}</Text>
          </View>

          {/* Áudio: o botão lê o texto em hebraico (he-IL). Pode ser tocado
              quantas vezes quiser. "key" reinicia o botão ao trocar de letra. */}
          <View style={styles.audioRow}>
            <BotaoAudio
              key={`letra-${letraAtual.letra}`}
              texto={audioDaLetra(letraAtual.letra)}
              titulo="Som da letra"
              rotulo={`Ouvir o som da letra ${letraAtual.nome}`}
            />
            <BotaoAudio
              key={`palavra-${letraAtual.letra}`}
              texto={letraAtual.audioTexto || letraAtual.exemplo}
              titulo="Som da palavra"
              rotulo={`Ouvir a palavra ${letraAtual.exemplo}`}
            />
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={pararFala}
              accessibilityRole="button"
              accessibilityLabel="Parar o áudio"
            >
              <Text style={styles.buttonTextSecondary}>■ Parar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.navRow}>
          <TouchableOpacity style={[styles.navButton, indiceAtual === 0 && styles.navButtonDisabled]} onPress={irParaAnterior} disabled={indiceAtual === 0} accessibilityRole="button" accessibilityLabel="Letra anterior">
            <Text style={[styles.navText, indiceAtual === 0 && styles.navTextDisabled]}>Anterior</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.navButtonPrimary, indiceAtual === TOTAL_LETRAS - 1 && styles.navButtonPrimaryDisabled]} onPress={irParaProxima} disabled={indiceAtual === TOTAL_LETRAS - 1} accessibilityRole="button" accessibilityLabel="Próxima letra">
            <Text style={styles.navTextPrimary}>Próxima</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Todas as letras</Text>
        <Text style={styles.sectionText}>Toque em qualquer letra para praticar direto.</Text>

        <View style={styles.grid}>
          {LETRAS.map((item, indice) => {
            const ativa = indice === indiceAtual;
            return (
              <TouchableOpacity
                key={`${item.letra}-${indice}`}
                style={[styles.letterCard, ativa && styles.letterCardActive]}
                onPress={() => selecionarLetra(indice)}
                accessibilityRole="button"
                accessibilityLabel={`Letra ${item.nome}`}
              >
                <Text style={[styles.letterMini, ativa && styles.letterMiniActive]}>{item.letra}</Text>
                <Text style={[styles.letterName, ativa && styles.letterNameActive]}>{item.nome}</Text>
                <Text style={[styles.letterSound, ativa && styles.letterSoundActive]}>{item.transliteracao}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.sectionBox}>
        <Text style={styles.sectionTitle}>Formas finais</Text>
        <Text style={styles.sectionText}>Algumas letras mudam de desenho no fim da palavra, mas continuam com o mesmo som.</Text>

        <View style={styles.finalList}>
          {FORMAS_FINAIS.map((item) => (
            <View key={item.letra} style={styles.finalRow}>
              <Text style={styles.finalLetter}>{item.letra}</Text>
              <View style={styles.finalContent}>
                <Text style={styles.finalName}>{item.nome}</Text>
                <Text style={styles.finalExample}>{item.exemplo} · {item.traducao}</Text>
              </View>
              <BotaoAudio
                texto={item.audioTexto}
                rotulo={`Ouvir a palavra ${item.exemplo}`}
                variante="pequena"
              />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.tipBox}>
        <Icone nome="bulb-outline" tamanho={18} cor={cores.azulMedio} />
        <Text style={styles.tipText}>O hebraico é lido da direita para a esquerda. Estude uma letra por vez e repita os sons em voz alta.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: cores.fundoTela,
    paddingHorizontal: 18,
    paddingTop: 18,
  },
  conteudo: {
    width: "100%",
    maxWidth: 720, // largura confortável no computador
    alignSelf: "center",
    paddingBottom: Platform.OS === "android" ? 72 : 36, // folga para a barra do Android
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },
  voltarButton: {
    backgroundColor: cores.branco,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  voltarButtonText: {
    color: cores.azulEscuro,
    fontWeight: "800",
    fontSize: 14,
  },
  headerTitle: {
    color: cores.texto,
    fontWeight: "800",
    fontSize: 20,
  }, 
  heroCard: {
    backgroundColor: cores.branco,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    shadowColor: cores.azulEscuro,
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  heroTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  heroTag: {
    color: cores.azulEscuro,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.3,
    textTransform: "uppercase",
  },
  heroProgress: {
    color: cores.texto,
    fontWeight: "800",
    fontSize: 12,
  },
  progressBarBg: {
    width: "100%",
    height: 10,
    backgroundColor: cores.fundoSuave,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 18,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: cores.laranja,
    borderRadius: 999,
  },
  cardMain: {
    alignItems: "center",
    backgroundColor: cores.fundoSuave,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  letterBadge: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: cores.textoSuave,
    marginBottom: 8,
  },
  letraGrande: {
    fontSize: 110,
    color: cores.azulEscuro,
    marginBottom: 4,
    fontWeight: "800",
  },
  nomeLetra: {
    fontSize: 28,
    fontWeight: "800",
    color: cores.texto,
    marginBottom: 4,
  },
  translit: {
    color: cores.textoSuave,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 12,
  },
  explicacao: {
    fontSize: 13,
    color: cores.texto,
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 18,
  },
  wordBubble: {
    width: "100%",
    backgroundColor: cores.branco,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    alignItems: "center",
  },
  wordTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: cores.textoSuave,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  wordHeb: {
    fontSize: 40,
    color: cores.texto,
    fontWeight: "800",
    marginBottom: 4,
  },
  wordMeta: {
    color: cores.textoSuave,
    fontSize: 12,
    fontWeight: "700",
  },
  audioRow: {
    flexWrap: "wrap",
    gap: 10,
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  }, 
  audioEsquerda: {
    flex: 1,
    justifyContent: "center",
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: cores.fundoSuave,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  }, 
  buttonTextSecondary: {
    color: cores.texto,
    fontWeight: "800",
    fontSize: 15,
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18,
    gap: 10,
  },
  navButton: {
    flex: 1,
    backgroundColor: cores.branco,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    paddingVertical: 12,
    alignItems: "center",
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navText: {
    color: cores.texto,
    fontWeight: "800",
    fontSize: 14,
  },
  navTextDisabled: {
    color: cores.cinza,
  },
  navButtonPrimary: {
    flex: 1,
    backgroundColor: cores.azulEscuro,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: "center",
  },
  navButtonPrimaryDisabled: {
    opacity: 0.45,
  },
  navTextPrimary: {
    color: cores.branco,
    fontWeight: "800",
    fontSize: 14,
  },
  sectionBox: {
    backgroundColor: cores.branco,
    borderRadius: 24,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: cores.texto,
    marginBottom: 4,
  },
  sectionText: {
    color: cores.textoSuave,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
  },
  letterCard: {
    width: "31%",
    backgroundColor: cores.fundoSuave,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    minHeight: 90,
  },
  letterCardActive: {
    backgroundColor: cores.fundoSuave,
    borderColor: cores.laranja,
  },
  letterMini: {
    fontSize: 32,
    color: cores.azulEscuro,
    fontWeight: "800",
  },
  letterMiniActive: {
    color: cores.texto,
  },
  letterName: {
    fontSize: 10,
    textAlign: "center",
    color: cores.textoSuave,
    fontWeight: "700",
    marginTop: 4,
  },
  letterNameActive: {
    color: cores.texto,
  },
  letterSound: {
    fontSize: 9,
    color: cores.textoSuave,
    marginTop: 2,
  },
  letterSoundActive: {
    color: cores.azulEscuro,
    fontWeight: "700",
  },
  finalList: {
    gap: 10,
  },
  finalRow: {
    backgroundColor: cores.fundoSuave,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  finalLetter: {
    fontSize: 34,
    color: cores.azulEscuro,
    fontWeight: "800",
    width: 40,
    textAlign: "center",
  },
  finalContent: {
    flex: 1,
  },
  finalName: {
    fontSize: 12,
    fontWeight: "800",
    color: cores.texto,
  },
  finalExample: {
    fontSize: 11,
    color: cores.textoSuave,
    marginTop: 3,
  },  
  tipBox: {
    backgroundColor: cores.destaqueSuave,
    borderRadius: 18,
    padding: 14,
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: cores.laranja,
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipText: {
    flex: 1,
    color: cores.texto,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
});
