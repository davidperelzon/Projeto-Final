/*
 * ProvaNivel.js
 *
 * PROVA DO NÍVEL: para liberar o nível seguinte, o aluno precisa ter o XP
 * mínimo (niveis.js) E passar nesta prova (10 questões, 70% de acertos).
 *
 * FLUXO:
 *   1. Tela de regras (quantas questões, nota mínima, o que cai).
 *   2. 10 questões variadas (SessaoQuestoes.js). Erros viram "revisão".
 *   3. Resultado: aprovado -> libera o nível (e a próxima cidade da viagem
 *      por Israel) e dá um bônus de XP; reprovado -> pode revisar e tentar
 *      de novo, quantas vezes quiser.
 *
 * Props:
 *   usuario, nivelId (nível que está sendo concluído)
 *   aoResponder -> (questao, acertou) registra erros (App.js)
 *   aoAprovar   -> (nivelId) libera o próximo nível (App.js)
 *   aoVoltar    -> volta para a trilha
 *   aoRevisar   -> abre a prática de revisão
 */

import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Logo from "./Logo";
import Icone from "./Icone";
import SessaoQuestoes from "./SessaoQuestoes";
import { cores } from "./theme";
import { nivelPorId } from "./niveis";
import { CIDADE_POR_NIVEL, LUGARES } from "./dadosIsrael";
import { PROVA_PERCENTUAL_MINIMO, QUESTOES_NA_PROVA, montarProva } from "./questoes";
import { XP_BONUS_PROVA } from "./progressao";

export default function ProvaNivel({ usuario, nivelId, aoResponder, aoAprovar, aoVoltar, aoRevisar }) {
  const nivel = nivelPorId(nivelId);
  const proximo = nivelPorId(nivelId + 1);
  const cidade = LUGARES.find((lugar) => lugar.id === CIDADE_POR_NIVEL[nivelId + 1]);
  const jaAprovado = usuario.nivelLiberado > nivelId;

  const [fase, setFase] = useState("regras"); // regras | prova | resultado
  const [tentativa, setTentativa] = useState(0);
  const [resumo, setResumo] = useState(null);
  const [salvando, setSalvando] = useState(false);

  // Cada tentativa gera 10 questões novas.
  const questoes = useMemo(() => montarProva(nivelId), [nivelId, tentativa]);

  const percentual = resumo ? Math.round((resumo.acertos / resumo.total) * 100) : 0;
  const passou = resumo ? percentual >= PROVA_PERCENTUAL_MINIMO : false;

  const finalizada = useRef(false);
  const terminar = async (dados) => {
    if (finalizada.current) return;
    finalizada.current = true;
    setResumo(dados);
    setFase("resultado");
    if (Math.round((dados.acertos / dados.total) * 100) >= PROVA_PERCENTUAL_MINIMO && !jaAprovado) {
      setSalvando(true);
      try {
        await aoAprovar(nivelId);
      } finally {
        setSalvando(false);
      }
    }
  };

  const tentarDeNovo = () => {
    finalizada.current = false;
    setResumo(null);
    setTentativa((valor) => valor + 1);
    setFase("prova");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.voltar} onPress={aoVoltar} accessibilityRole="button" accessibilityLabel="Voltar para a trilha">
          <Text style={styles.voltarTexto}>← Trilha</Text>
        </TouchableOpacity>
        <View style={styles.trilha}>
          <Text style={styles.trilhaTexto}>Trilha › Prova do nível {nivel.nome}</Text>
        </View>
        <Logo largura={48} />
      </View>

      {fase === "regras" ? (
        <View style={styles.cartao}>
          <Icone nome="trophy" tamanho={56} cor={cores.laranja} />
          <Text style={styles.titulo}>Prova do nível {nivel.nome}</Text>
          <Text style={styles.texto}>
            Passe na prova para liberar o nível {proximo.nome}
            {cidade ? ` e chegar a ${cidade.nome} (${cidade.heb})` : ""}.
          </Text>
          <View style={styles.regras}>
            <Text style={styles.regra}>• {QUESTOES_NA_PROVA} questões variadas (escolha, ouvir, associar, ditado...)</Text>
            <Text style={styles.regra}>• Para passar: {PROVA_PERCENTUAL_MINIMO}% de acertos</Text>
            <Text style={styles.regra}>• Pode tentar de novo quantas vezes quiser</Text>
            <Text style={styles.regra}>• Aprovação: +{XP_BONUS_PROVA} XP de bônus</Text>
            <Text style={styles.regra}>• O que você errar vai para a sua Revisão</Text>
          </View>
          {jaAprovado ? <Text style={styles.aviso}>Você já passou nesta prova. Pode refazer para treinar (sem novo bônus).</Text> : null}
          <TouchableOpacity style={styles.botaoPrimario} onPress={() => setFase("prova")} accessibilityRole="button">
            <Text style={styles.botaoPrimarioTexto}>Começar a prova</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {fase === "prova" ? (
        <SessaoQuestoes key={tentativa} questoes={questoes} aoResponder={aoResponder} aoFinalizar={terminar} semResumo />
      ) : null}

      {fase === "resultado" && resumo ? (
        <View style={styles.cartao} accessibilityLiveRegion="polite">
          <Icone nome={passou ? "ribbon" : "barbell"} tamanho={56} cor={passou ? cores.verdeMusgo : cores.azulMedio} />
          <Text style={styles.titulo}>{passou ? "Aprovado!" : "Ainda não foi desta vez"}</Text>
          <Text style={styles.placar}>
            {resumo.acertos} de {resumo.total} acertos ({percentual}%)
          </Text>
          <View style={styles.barraFundo}>
            <View style={[styles.barraPreenchida, { width: `${Math.max(4, percentual)}%` }]} />
            <View style={[styles.marcaMinima, { left: `${PROVA_PERCENTUAL_MINIMO}%` }]} />
          </View>
          <Text style={styles.apoio}>Nota mínima: {PROVA_PERCENTUAL_MINIMO}%</Text>

          {passou ? (
            <>
              <Text style={styles.texto}>
                Você liberou o nível {proximo.nome}! {cidade ? `Próxima parada da sua viagem: ${cidade.nome}.` : ""}
              </Text>
              <TouchableOpacity style={styles.botaoPrimario} onPress={aoVoltar} disabled={salvando} accessibilityRole="button">
                <Text style={styles.botaoPrimarioTexto}>{salvando ? "Salvando…" : "Continuar na trilha"}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.texto}>
                Sem problema: o que você errou foi para a Revisão. Treine e tente de novo quando quiser.
              </Text>
              <View style={styles.botoesLinha}>
                <TouchableOpacity style={styles.botaoSecundario} onPress={aoRevisar} accessibilityRole="button">
                  <Text style={styles.botaoSecundarioTexto}>Revisar erros</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.botaoPrimario} onPress={tentarDeNovo} accessibilityRole="button">
                  <Text style={styles.botaoPrimarioTexto}>Tentar de novo</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundoTela },
  conteudo: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 },
  voltar: { minHeight: 44, justifyContent: "center", backgroundColor: cores.branco, borderRadius: 999, paddingHorizontal: 14, borderWidth: 1, borderColor: cores.bordaSuave },
  voltarTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
  trilha: { flex: 1, alignItems: "center" },
  trilhaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: "800", textAlign: "center" },
  cartao: { backgroundColor: cores.branco, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: cores.bordaSuave, alignItems: "center", gap: 10 },
  emoji: { fontSize: 52 },
  titulo: { color: cores.texto, fontSize: 24, fontWeight: "800", textAlign: "center" },
  texto: { color: cores.texto, fontSize: 14, lineHeight: 21, fontWeight: "600", textAlign: "center" },
  regras: { alignSelf: "stretch", backgroundColor: cores.fundoSuave, borderRadius: 14, padding: 14, gap: 6 },
  regra: { color: cores.texto, fontSize: 14, fontWeight: "700", lineHeight: 20 },
  aviso: { color: cores.texto, backgroundColor: cores.sucessoSuave, borderRadius: 10, padding: 10, fontSize: 13, fontWeight: "800", textAlign: "center" },
  placar: { color: cores.azulEscuro, fontSize: 20, fontWeight: "800" },
  apoio: { color: cores.textoSuave, fontSize: 12, fontWeight: "700" },
  barraFundo: { alignSelf: "stretch", height: 14, borderRadius: 999, backgroundColor: cores.fundoSuave, overflow: "hidden" },
  barraPreenchida: { height: "100%", borderRadius: 999, backgroundColor: cores.laranja },
  marcaMinima: { position: "absolute", top: 0, bottom: 0, width: 3, backgroundColor: cores.azulEscuro },
  botoesLinha: { flexDirection: "row", gap: 10, alignSelf: "stretch" },
  botaoPrimario: { flex: 2, alignSelf: "stretch", minHeight: 50, backgroundColor: cores.azulEscuro, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  botaoPrimarioTexto: { color: cores.branco, fontSize: 15, fontWeight: "800" },
  botaoSecundario: { flex: 1, minHeight: 50, backgroundColor: cores.fundoSuave, borderWidth: 1, borderColor: cores.bordaSuave, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  botaoSecundarioTexto: { color: cores.texto, fontSize: 15, fontWeight: "800" },
});
