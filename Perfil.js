/*
 * Perfil.js
 *
 * Aba "Perfil": mostra o progresso REAL do aluno (nada é inventado):
 * nível e XP, sequência de dias, meta diária, últimos 7 dias, o que já foi
 * aprendido, conquistas, itens para revisar e um teste de áudio.
 *
 * Todos os números vêm de `usuario` (userDB.js) e das funções de
 * progresso.js. Para mudar a meta diária, veja META_DIARIA_XP em progresso.js.
 */

import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotaoAudio from "./BotaoAudio";
import Creditos from "./Creditos";
import CabecalhoFoto from "./CabecalhoFoto";
import Icone from "./Icone";
import { cores } from "./theme";
import { diagnosticarAudio } from "./audioService";
import { FLASHCARDS, LICOES, nivelDoUsuario, proximoNivel } from "./niveis";
import { MISSOES } from "./dadosMissoes";
import { LETRAS } from "./letrasHebraicas";
import { itensParaRevisar } from "./questoes";
import { META_DIARIA_XP, calcularSequencia, listarConquistas, ultimosDias, xpDoDia } from "./progresso";

// Barra de progresso simples (com texto de apoio para leitores de tela).
function Barra({ valor, maximo, rotulo }) {
  const percentual = maximo > 0 ? Math.min(100, (valor / maximo) * 100) : 0;
  return (
    <View
      style={styles.barraFundo}
      accessibilityRole="progressbar"
      accessibilityLabel={rotulo}
      accessibilityValue={{ min: 0, max: maximo, now: Math.min(valor, maximo) }}
    >
      <View style={[styles.barraPreenchida, { width: `${Math.max(percentual, 3)}%` }]} />
    </View>
  );
}

export default function Perfil({ usuario, aoVoltar, aoSair, aoPraticarRevisao }) {
  const [diagnostico, setDiagnostico] = useState(null);
  const [testando, setTestando] = useState(false);

  const nivel = nivelDoUsuario(usuario);
  const proximo = proximoNivel(nivel);
  const sequencia = calcularSequencia(usuario.dias);
  const hoje = xpDoDia(usuario.dias);
  const semana = ultimosDias(usuario.dias, 7);
  const maiorDia = Math.max(META_DIARIA_XP, ...semana.map((dia) => dia.xp));
  const revisar = itensParaRevisar(usuario.erros, nivel.id, 5);
  const conquistas = listarConquistas({ feitos: usuario.feitos, xp: usuario.xp, sequencia });

  const conta = (prefixo) => usuario.feitos.filter((id) => id.startsWith(prefixo)).length;
  const licoesLiberadas = LICOES.filter((l) => l.nivel <= nivel.id);
  const missoesLiberadas = MISSOES.filter((m) => m.nivel <= nivel.id);
  const cartasLiberadas = FLASHCARDS.filter((c) => c.nivel <= nivel.id);
  const metaBatida = hoje >= META_DIARIA_XP;

  const testarAudio = async () => {
    setTestando(true);
    try {
      setDiagnostico(await diagnosticarAudio());
    } catch (erro) {
      setDiagnostico({ plataforma: "?", suporteSintese: false, totalVozes: 0, vozesHebraicas: [], reservaOnlineAtiva: false, resultado: "desconhecido" });
    } finally {
      setTestando(false);
    }
  };

  const descreverDiagnostico = () => {
    if (!diagnostico) return null;
    const linhas = [];
    linhas.push(`Sistema: ${diagnostico.plataforma}`);
    linhas.push(diagnostico.suporteSintese ? `Vozes encontradas: ${diagnostico.totalVozes}` : "Este aparelho não oferece síntese de voz.");
    if (diagnostico.vozesHebraicas.length > 0) {
      linhas.push(`Vozes em hebraico: ${diagnostico.vozesHebraicas.join(", ")}`);
    } else if (diagnostico.resultado === "desconhecido") {
      linhas.push("Não foi possível listar as vozes. Toque no botão abaixo: se ouvir hebraico, está tudo certo.");
    } else {
      linhas.push(
        diagnostico.reservaOnlineAtiva
          ? "Nenhuma voz em hebraico neste navegador. O app usará o áudio online de reserva (precisa de internet)."
          : "Nenhuma voz em hebraico instalada neste aparelho."
      );
    }
    return linhas;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <CabecalhoFoto foto="haifa" titulo="Perfil" subtitulo={usuario.nome} />

      {/* Identificação e nível */}
      <View style={styles.cartao}>
        <View style={styles.identidade}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>{usuario.nome.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.identidadeTextos}>
            <Text style={styles.nome}>{usuario.nome}</Text>
            <Text style={styles.nivel}>Nível {nivel.id} · {nivel.nome}</Text>
          </View>
        </View>
        <View style={styles.linhaEntre}>
          <Text style={styles.valorGrande}>{usuario.xp} XP</Text>
          <Text style={styles.apoio}>{proximo ? (usuario.xp >= proximo.xpMinimo ? `XP ok! Passe na prova para liberar ${proximo.nome}` : `faltam ${proximo.xpMinimo - usuario.xp} XP para ${proximo.nome}`) : "categoria máxima"}</Text>
        </View>
        <Barra
          valor={proximo ? usuario.xp - nivel.xpMinimo : 1}
          maximo={proximo ? proximo.xpMinimo - nivel.xpMinimo : 1}
          rotulo="Progresso até o próximo nível"
        />
      </View>

      {/* Sequência e meta */}
      <View style={styles.cartao}>
        <View style={styles.linhaEntre}>
          <View style={styles.tituloIcone}><Icone nome="flame" tamanho={20} cor={cores.laranja} /><Text style={styles.subtitulo}>Sequência</Text></View>
          <Text style={styles.valorGrande}>{sequencia} {sequencia === 1 ? "dia" : "dias"}</Text>
        </View>
        <Text style={styles.apoio}>
          {sequencia === 0 ? "Ganhe XP hoje para começar uma sequência." : "Estude um pouco todos os dias para manter a sequência."}
        </Text>
        <View style={[styles.linhaEntre, { marginTop: 12 }]}>
          <View style={styles.tituloIcone}><Icone nome="flag" tamanho={20} cor={cores.azulMedio} /><Text style={styles.subtitulo}>Meta de hoje</Text></View>
          <Text style={styles.apoio}>{Math.min(hoje, META_DIARIA_XP)}/{META_DIARIA_XP} XP {metaBatida ? "✓ batida!" : ""}</Text>
        </View>
        <Barra valor={hoje} maximo={META_DIARIA_XP} rotulo="Meta diária de XP" />

        <Text style={[styles.subtitulo, { marginTop: 14 }]}>Últimos 7 dias (XP)</Text>
        <View style={styles.grafico}>
          {semana.map((dia) => (
            <View key={dia.chave} style={styles.colunaGrafico} accessibilityLabel={`${dia.rotulo}: ${dia.xp} XP`}>
              <Text style={styles.xpDia}>{dia.xp}</Text>
              <View style={styles.colunaFundo}>
                <View style={[styles.colunaValor, { height: `${Math.max(dia.xp > 0 ? 8 : 0, (dia.xp / maiorDia) * 100)}%` }, dia.hoje && styles.colunaHoje]} />
              </View>
              <Text style={[styles.rotuloDia, dia.hoje && styles.rotuloDiaHoje]}>{dia.hoje ? "hoje" : dia.rotulo}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* O que já foi aprendido */}
      <View style={styles.cartao}>
        <Text style={styles.subtitulo}>O que você já fez</Text>
        {[
          ["Lições concluídas", conta("licao:"), licoesLiberadas.length],
          ["Letras vistas", conta("letra:"), LETRAS.length],
          ["Missões de escrita", conta("missao:"), missoesLiberadas.length],
          ["Cartas estudadas", conta("carta:"), cartasLiberadas.length],
        ].map(([rotulo, valor, total]) => (
          <View key={rotulo} style={styles.resumoItem}>
            <View style={styles.linhaEntre}>
              <Text style={styles.resumoRotulo}>{rotulo}</Text>
              <Text style={styles.resumoValor}>{valor}/{total}</Text>
            </View>
            <Barra valor={valor} maximo={total} rotulo={rotulo} />
          </View>
        ))}
        <Text style={styles.apoio}>Questões acertadas pela 1ª vez: {conta("quiz:")}</Text>
      </View>

      {/* Revisão */}
      <View style={styles.cartao}>
        <View style={styles.tituloIcone}><Icone nome="refresh" tamanho={20} cor={cores.azulMedio} /><Text style={styles.subtitulo}>Revisão recomendada</Text></View>
        {revisar.length === 0 ? (
          <Text style={styles.apoio}>Nada para revisar por enquanto. Quando você errar algo na aba Praticar, ele aparece aqui.</Text>
        ) : (
          <>
            {revisar.map((item) => (
              <Text key={item.chave} style={styles.revisaoItem}>• {item.nome} (errou {item.erros}x)</Text>
            ))}
            <TouchableOpacity style={styles.botaoPrimario} onPress={aoPraticarRevisao} accessibilityRole="button">
              <Text style={styles.botaoPrimarioTexto}>Praticar revisão</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Conquistas */}
      <View style={styles.cartao}>
        <View style={styles.tituloIcone}><Icone nome="medal" tamanho={20} cor={cores.laranja} /><Text style={styles.subtitulo}>Conquistas ({conquistas.filter((c) => c.ok).length}/{conquistas.length})</Text></View>
        {conquistas.map((item) => (
          <View key={item.id} style={styles.conquista} accessibilityLabel={`${item.titulo}: ${item.ok ? "conquistada" : `${item.atual} de ${item.meta}`}`}>
            <Icone nome={item.ok ? "medal" : "lock-closed"} tamanho={24} cor={item.ok ? cores.laranja : cores.cinza} />
            <View style={styles.conquistaTextos}>
              <Text style={styles.conquistaTitulo}>{item.titulo}{item.ok ? " ✓" : ""}</Text>
              <Text style={styles.apoio}>{item.descricao} · {item.atual}/{item.meta}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Teste de áudio */}
      <View style={styles.cartao}>
        <View style={styles.tituloIcone}><Icone nome="volume-high" tamanho={20} cor={cores.azulMedio} /><Text style={styles.subtitulo}>Testar áudio</Text></View>
        <Text style={styles.apoio}>Se algum áudio não tocar, confira aqui o que o seu aparelho oferece.</Text>
        <TouchableOpacity style={styles.botaoSecundario} onPress={testarAudio} disabled={testando} accessibilityRole="button">
          <Text style={styles.botaoSecundarioTexto}>{testando ? "Verificando…" : "Verificar vozes"}</Text>
        </TouchableOpacity>
        {descreverDiagnostico() ? (
          <View style={styles.diagnostico}>
            {descreverDiagnostico().map((linha) => (
              <Text key={linha} style={styles.diagnosticoLinha}>{linha}</Text>
            ))}
          </View>
        ) : null}
        <View style={styles.audioCentro}>
          <BotaoAudio texto="שלום" rotulo="Testar áudio com a palavra shalom" />
        </View>
      </View>

      <TouchableOpacity style={styles.sair} onPress={aoSair} accessibilityRole="button" accessibilityLabel="Sair da conta">
        <Text style={styles.sairTexto}>Sair da conta</Text>
      </TouchableOpacity>

      <Creditos />
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
  trilhaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: "800" },
  trilhaTitulo: { color: cores.texto, fontSize: 26, fontWeight: "900", alignSelf: "flex-start" },
  cartao: { backgroundColor: cores.branco, borderRadius: 22, padding: 16, borderWidth: 1, borderColor: cores.bordaSuave, marginBottom: 14, gap: 6 },
  identidade: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  avatar: { width: 54, height: 54, borderRadius: 27, backgroundColor: cores.azulEscuro, alignItems: "center", justifyContent: "center" },
  avatarTexto: { color: cores.branco, fontSize: 24, fontWeight: "800" },
  identidadeTextos: { flex: 1 },
  nome: { color: cores.texto, fontSize: 20, fontWeight: "800" },
  nivel: { color: cores.azulMedio, fontSize: 13, fontWeight: "800" },
  linhaEntre: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" },
  valorGrande: { color: cores.texto, fontSize: 22, fontWeight: "800" },
  tituloIcone: { flexDirection: "row", alignItems: "center", gap: 8 },
  subtitulo: { color: cores.texto, fontSize: 16, fontWeight: "800" },
  apoio: { color: cores.textoSuave, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  barraFundo: { height: 10, borderRadius: 999, backgroundColor: cores.fundoSuave, overflow: "hidden" },
  barraPreenchida: { height: "100%", borderRadius: 999, backgroundColor: cores.laranja },
  grafico: { flexDirection: "row", gap: 6, height: 120, alignItems: "flex-end", marginTop: 6 },
  colunaGrafico: { flex: 1, alignItems: "center", height: "100%", justifyContent: "flex-end" },
  xpDia: { color: cores.textoSuave, fontSize: 10, fontWeight: "800", marginBottom: 2 },
  colunaFundo: { width: "100%", flex: 1, backgroundColor: cores.fundoSuave, borderRadius: 8, justifyContent: "flex-end", overflow: "hidden" },
  colunaValor: { width: "100%", backgroundColor: cores.azulClaro, borderRadius: 8 },
  colunaHoje: { backgroundColor: cores.laranja },
  rotuloDia: { color: cores.textoSuave, fontSize: 10, fontWeight: "800", marginTop: 4 },
  rotuloDiaHoje: { color: cores.texto },
  resumoItem: { gap: 4, marginTop: 6 },
  resumoRotulo: { color: cores.texto, fontSize: 14, fontWeight: "700" },
  resumoValor: { color: cores.texto, fontSize: 14, fontWeight: "800" },
  revisaoItem: { color: cores.texto, fontSize: 14, fontWeight: "700", writingDirection: "ltr", textAlign: "left" },
  conquista: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  conquistaIcone: { fontSize: 24 },
  conquistaTextos: { flex: 1 },
  conquistaTitulo: { color: cores.texto, fontSize: 14, fontWeight: "800" },
  botaoPrimario: { minHeight: 48, backgroundColor: cores.azulEscuro, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  botaoPrimarioTexto: { color: cores.branco, fontWeight: "800", fontSize: 15 },
  botaoSecundario: { minHeight: 48, borderRadius: 14, borderWidth: 1, borderColor: cores.azulClaro, backgroundColor: cores.fundoSuave, alignItems: "center", justifyContent: "center", marginTop: 8 },
  botaoSecundarioTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
  diagnostico: { backgroundColor: cores.fundoSuave, borderRadius: 12, padding: 12, gap: 4, marginTop: 8 },
  diagnosticoLinha: { color: cores.texto, fontSize: 13, fontWeight: "700", lineHeight: 19 },
  audioCentro: { alignItems: "center", marginTop: 10 },
  sair: { minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 14, borderWidth: 1, borderColor: cores.azulClaro, backgroundColor: cores.branco },
  sairTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
});
