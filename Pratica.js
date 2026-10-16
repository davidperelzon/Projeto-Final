/*
 * Pratica.js
 *
 * Aba "Praticar": escolhe um modo (misto, revisão, letras, vocabulário,
 * ouvir, vogais) e executa a sessão de questões (SessaoQuestoes.js).
 *
 * "Revisão" usa os ERROS REAIS do aluno (guardados na conta dele):
 * itens em que ele errou aparecem primeiro e com mais frequência. Quando
 * ele acerta, o contador de erros daquele item diminui.
 *
 * Props:
 *   usuario       -> dados do usuário logado (xp, erros...)
 *   aoResponder   -> async (questao, acertou) => xpGanho   (vem do App.js)
 *   modoInicial   -> (opcional) abre direto num modo, ex.: "revisao"
 *   aoVoltar      -> volta para o início
 */

import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import CabecalhoFoto from "./CabecalhoFoto";
import Icone from "./Icone";
import SessaoQuestoes from "./SessaoQuestoes";
import { cores } from "./theme";
import { nivelDoUsuario, proximoNivel } from "./niveis";
import { MODOS_PRATICA, itensParaRevisar, montarSessao } from "./questoes";

const QUESTOES_POR_SESSAO = 8;

export default function Pratica({ usuario, aoResponder, modoInicial, aoVoltar, aoAbrirProva }) {
  const nivel = nivelDoUsuario(usuario);
  const proximo = proximoNivel(nivel);
  const provaLiberada = !!proximo && usuario.xp >= proximo.xpMinimo;
  const [modo, setModo] = useState(null); // modo da sessão atual
  const [questoes, setQuestoes] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [chaveSessao, setChaveSessao] = useState(0);

  const revisar = itensParaRevisar(usuario.erros, nivel.id, 5);
  const totalParaRevisar = Object.keys(usuario.erros).filter((chave) => usuario.erros[chave] > 0).length;

  const iniciar = (idModo) => {
    const lista = montarSessao({
      modo: idModo,
      nivelId: nivel.id,
      quantidade: QUESTOES_POR_SESSAO,
      erros: usuario.erros,
    });
    if (lista.length === 0) {
      setMensagem(
        idModo === "revisao"
          ? "Você ainda não tem itens para revisar. Pratique no modo Misto: o que você errar aparece aqui."
          : "Não há questões deste tipo ainda."
      );
      return;
    }
    setMensagem("");
    setModo(idModo);
    setQuestoes(lista);
    setChaveSessao((valor) => valor + 1);
  };

  // Abre direto num modo quando a tela é chamada pela Home ("Revisar agora").
  useEffect(() => {
    if (modoInicial) iniciar(modoInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modoInicial]);

  const sair = () => {
    setQuestoes(null);
    setModo(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      {questoes ? (
        <View style={styles.header}>
          <TouchableOpacity style={styles.voltar} onPress={sair} accessibilityRole="button" accessibilityLabel="Sair da sessão e voltar aos modos">
            <Text style={styles.voltarTexto}>← Modos</Text>
          </TouchableOpacity>
          <View style={styles.trilha}>
            <Text style={styles.trilhaTexto}>Praticar › {MODOS_PRATICA.find((m) => m.id === modo).titulo}</Text>
          </View>
        </View>
      ) : (
        <CabecalhoFoto foto="tel-aviv" titulo="Praticar" subtitulo={`${QUESTOES_POR_SESSAO} questões por sessão`} />
      )}

      {questoes ? (
        <SessaoQuestoes
          key={chaveSessao}
          questoes={questoes}
          aoResponder={aoResponder}
          aoRepetir={() => iniciar(modo)}
          aoSair={sair}
        />
      ) : (
        <>

          {provaLiberada ? (
            <View style={styles.provaBanner}>
              <Text style={styles.revisaoTitulo}>Prova do nível {nivel.nome} liberada</Text>
              <Text style={styles.revisaoTexto}>Você já tem o XP necessário. Passe na prova para liberar o nível {proximo.nome}.</Text>
              <TouchableOpacity style={styles.botaoPrimario} onPress={() => aoAbrirProva && aoAbrirProva(nivel.id)} accessibilityRole="button">
                <Text style={styles.botaoPrimarioTexto}>Fazer a prova</Text>
              </TouchableOpacity>
            </View>
          ) : proximo ? (
            <Text style={styles.subtitulo}>
              Faltam {Math.max(proximo.xpMinimo - usuario.xp, 0)} XP para liberar a prova do nível {nivel.nome}.
            </Text>
          ) : null}

          {totalParaRevisar > 0 ? (
            <View style={styles.revisao}>
              <Text style={styles.revisaoTitulo}>Revisão recomendada</Text>
              <Text style={styles.revisaoTexto}>
                Você errou {totalParaRevisar} {totalParaRevisar === 1 ? "item" : "itens"} e ainda não os acertou de volta:
              </Text>
              {revisar.map((item) => (
                <Text key={item.chave} style={styles.revisaoItem}>
                  • {item.nome} (errou {item.erros}x)
                </Text>
              ))}
              <TouchableOpacity style={styles.botaoPrimario} onPress={() => iniciar("revisao")} accessibilityRole="button">
                <Text style={styles.botaoPrimarioTexto}>Revisar agora</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {mensagem ? <Text style={styles.mensagem}>{mensagem}</Text> : null}

          <View style={styles.grade}>
            {MODOS_PRATICA.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.modo}
                onPress={() => iniciar(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Praticar no modo ${item.titulo}: ${item.descricao}`}
              >
                <Icone nome={item.icone} tamanho={30} cor={cores.azulEscuro} style={styles.modoIcone} />
                <Text style={styles.modoTitulo}>{item.titulo}</Text>
                <Text style={styles.modoDescricao}>{item.descricao}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundoTela },
  conteudo: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 14 },
  voltar: { minHeight: 44, justifyContent: "center", backgroundColor: cores.branco, borderRadius: 999, paddingHorizontal: 14, borderWidth: 1, borderColor: cores.bordaSuave },
  voltarTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
  trilha: { flex: 1, alignItems: "center" },
  trilhaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: "800", textAlign: "center" },
  titulo: { color: cores.texto, fontSize: 24, fontWeight: "800", marginBottom: 4 },
  subtitulo: { color: cores.textoSuave, fontSize: 13, fontWeight: "700", lineHeight: 19, marginBottom: 14 },
  revisao: { backgroundColor: cores.destaqueSuave, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: cores.laranja, marginBottom: 14, gap: 4 },
  revisaoTitulo: { color: cores.texto, fontSize: 16, fontWeight: "800" },
  revisaoTexto: { color: cores.texto, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  revisaoItem: { color: cores.texto, fontSize: 14, fontWeight: "700", writingDirection: "ltr", textAlign: "left" },
  provaBanner: { backgroundColor: cores.sucessoSuave, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: cores.verdeMusgo, marginBottom: 14, gap: 4 },
  mensagem: { color: cores.texto, backgroundColor: cores.fundoSuave, borderRadius: 12, padding: 12, fontSize: 13, fontWeight: "700", lineHeight: 19, marginBottom: 12 },
  grade: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  modo: { flexGrow: 1, flexBasis: 150, minHeight: 120, backgroundColor: cores.branco, borderRadius: 18, borderWidth: 1, borderColor: cores.bordaSuave, padding: 14, alignItems: "center", justifyContent: "center" },
  modoIcone: { marginBottom: 6 },
  modoEmojiAntigo: { fontSize: 30, marginBottom: 6, color: cores.azulEscuro },
  modoTitulo: { color: cores.texto, fontSize: 16, fontWeight: "800" },
  modoDescricao: { color: cores.textoSuave, fontSize: 12, fontWeight: "700", marginTop: 2, textAlign: "center" },
  botaoPrimario: { minHeight: 48, backgroundColor: cores.azulEscuro, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "800", fontSize: 15 },
});
