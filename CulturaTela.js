/*
 * CulturaTela.js
 *
 * Quiz de cultura da unidade (etapa "Israel: <cidade>" da trilha): 6 questões
 * com foto, pista curta e áudio do nome em hebraico, sobre a cidade e a
 * personalidade do nível. Sem texto para ler: o aluno aprende respondendo.
 * Acertando pelo menos 4, a etapa conta como feita e rende XP.
 *
 * Props: usuario, nivelId, aoResponder, aoConcluir (concede o XP da etapa), aoVoltar
 */
import React, { useMemo, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icone from "./Icone";
import SessaoQuestoes from "./SessaoQuestoes";
import { cores } from "./theme";
import { CIDADE_POR_NIVEL, LUGARES } from "./dadosIsrael";
import { questoesCulturaDoNivel } from "./questoesCultura";
import { XP_CULTURA } from "./progressao";

const MINIMO_ACERTOS = 4;

export default function CulturaTela({ usuario, nivelId, aoResponder, aoConcluir, aoVoltar }) {
  const [tentativa, setTentativa] = useState(0);
  const [resumo, setResumo] = useState(null);
  const finalizada = useRef(false);
  const questoes = useMemo(() => questoesCulturaDoNivel(nivelId), [nivelId, tentativa]);
  const cidade = LUGARES.find((l) => l.id === CIDADE_POR_NIVEL[nivelId]);
  const jaFeito = usuario.feitos.includes(`cultura:${nivelId}`);
  const passou = resumo ? resumo.acertos >= MINIMO_ACERTOS : false;

  const terminar = async (dados) => {
    if (finalizada.current) return;
    finalizada.current = true;
    setResumo(dados);
    if (dados.acertos >= MINIMO_ACERTOS && !jaFeito) await aoConcluir(nivelId);
  };

  const repetir = () => {
    finalizada.current = false;
    setResumo(null);
    setTentativa((valor) => valor + 1);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TouchableOpacity style={styles.voltar} onPress={aoVoltar} accessibilityRole="button" accessibilityLabel="Voltar para a trilha">
          <Text style={styles.voltarTexto}>← Trilha</Text>
        </TouchableOpacity>
        <Text style={styles.titulo} numberOfLines={1}>Israel{cidade ? `: ${cidade.nome}` : ""}</Text>
      </View>

      {!resumo ? (
        <SessaoQuestoes key={tentativa} questoes={questoes} aoResponder={aoResponder} aoFinalizar={terminar} semResumo />
      ) : (
        <View style={styles.cartao} accessibilityLiveRegion="polite">
          <Icone nome={passou ? "earth" : "refresh"} tamanho={56} cor={passou ? cores.verdeMusgo : cores.azulMedio} />
          <Text style={styles.resultado}>{passou ? "Muito bem!" : "Quase!"}</Text>
          <Text style={styles.placar}>{resumo.acertos} de {resumo.total} acertos</Text>
          {passou && !jaFeito ? <Text style={styles.xp}>+{XP_CULTURA} XP</Text> : null}
          <View style={styles.botoes}>
            {!passou ? (
              <TouchableOpacity style={styles.botaoSecundario} onPress={repetir} accessibilityRole="button">
                <Text style={styles.botaoSecundarioTexto}>Tentar de novo</Text>
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity style={styles.botaoPrimario} onPress={aoVoltar} accessibilityRole="button">
              <Text style={styles.botaoPrimarioTexto}>{passou ? "Continuar na trilha" : "Voltar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundoTela },
  conteudo: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  voltar: { minHeight: 44, justifyContent: "center", backgroundColor: cores.branco, borderRadius: 999, paddingHorizontal: 14, borderWidth: 1, borderColor: cores.bordaSuave },
  voltarTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
  titulo: { flex: 1, color: cores.texto, fontSize: 20, fontWeight: "900" },
  cartao: { backgroundColor: cores.branco, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: cores.bordaSuave, alignItems: "center", gap: 10 },
  resultado: { color: cores.texto, fontSize: 24, fontWeight: "900" },
  placar: { color: cores.azulEscuro, fontSize: 18, fontWeight: "800" },
  xp: { color: cores.verdeMusgo, fontSize: 16, fontWeight: "800" },
  botoes: { flexDirection: "row", gap: 10, alignSelf: "stretch", marginTop: 6 },
  botaoPrimario: { flex: 2, minHeight: 50, backgroundColor: cores.azulEscuro, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  botaoPrimarioTexto: { color: cores.branco, fontSize: 15, fontWeight: "800" },
  botaoSecundario: { flex: 1, minHeight: 50, backgroundColor: cores.fundoSuave, borderWidth: 1, borderColor: cores.bordaSuave, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  botaoSecundarioTexto: { color: cores.texto, fontSize: 15, fontWeight: "800" },
});
