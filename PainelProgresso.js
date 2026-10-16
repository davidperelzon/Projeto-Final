/*
 * PainelProgresso.js
 *
 * Dois blocos da Home que usam a MESMA fonte de progresso (progressao.js):
 *   - CartaoContinuar: "O que eu faço agora?" (próxima etapa + progresso)
 *   - ModalConclusao:  tela de parabéns ao concluir uma lição
 */
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Logo from "./Logo";
import { cores } from "./theme";

// Cartão azul de destaque: próxima etapa, progresso e botão principal.
export function CartaoContinuar({ trilha, onContinuar, onVerTrilha }) {
  const { atual, totais, nivel, xp } = trilha;
  return (
    <View style={estilos.cartao} accessibilityRole="summary">
      <Text style={estilos.eyebrow}>Continuar estudando</Text>
      {atual ? (
        <>
          <Text style={estilos.titulo} numberOfLines={2}>{atual.titulo}</Text>
          <Text style={estilos.texto}>
            {atual.subtitulo} · Nível {nivel.id} · {nivel.nome}
          </Text>
        </>
      ) : (
        <>
          <Text style={estilos.titulo}>Tudo concluído por aqui!</Text>
          <Text style={estilos.texto}>
            {xp.proximoMinimo ? `Ganhe mais ${xp.falta} XP para abrir o próximo nível.` : "Você completou toda a trilha."}
          </Text>
        </>
      )}

      <View style={estilos.linhaProgresso}>
        <Text style={estilos.textoProgresso}>
          {totais.concluidos}/{totais.total} etapas · {totais.percentual}%
        </Text>
      </View>
      <View
        style={estilos.barraFundo}
        accessibilityRole="progressbar"
        accessibilityLabel={`Trilha: ${totais.concluidos} de ${totais.total} etapas concluídas`}
      >
        <View style={[estilos.barraPreenchida, { width: `${totais.percentual}%` }]} />
      </View>

      <View style={estilos.botoes}>
        {atual ? (
          <TouchableOpacity
            style={estilos.botaoPrincipal}
            onPress={onContinuar}
            accessibilityRole="button"
            accessibilityLabel={`Continuar: ${atual.titulo}`}
          >
            <Text style={estilos.botaoPrincipalTexto}>Continuar</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={estilos.botaoSecundario}
          onPress={onVerTrilha}
          accessibilityRole="button"
          accessibilityLabel="Ver minha trilha de aprendizagem"
        >
          <Text style={estilos.botaoSecundarioTexto}>Ver trilha</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Tela de conclusão de lição (logo + XP ganho + próximo passo).
export function ModalConclusao({ dados, trilha, onContinuar, onVerTrilha, onFechar }) {
  if (!dados) return null;
  const proxima = trilha.atual;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onFechar}>
      <View style={estilos.fundo}>
        <View style={estilos.folha} accessibilityViewIsModal>
          <Logo largura={120} />
          <Text style={estilos.parabens} accessibilityRole="header">Parabéns!</Text>
          <Text style={estilos.licao} numberOfLines={3}>Você concluiu: {dados.titulo}</Text>
          <Text style={estilos.xp}>+{dados.xp} XP</Text>
          <Text style={estilos.progresso}>
            Lições concluídas: {trilha.totais.licoesFeitas} de {trilha.totais.licoesTotal}
          </Text>
          {proxima ? <Text style={estilos.proxima}>Próximo passo: {proxima.titulo}</Text> : null}

          {proxima ? (
            <TouchableOpacity style={estilos.botaoPrincipal} onPress={onContinuar} accessibilityRole="button">
              <Text style={estilos.botaoPrincipalTexto}>Continuar</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={estilos.botaoLink} onPress={onVerTrilha} accessibilityRole="button">
            <Text style={estilos.botaoLinkTexto}>Ver minha trilha</Text>
          </TouchableOpacity>
          <TouchableOpacity style={estilos.botaoLink} onPress={onFechar} accessibilityRole="button">
            <Text style={estilos.botaoLinkTexto}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const estilos = StyleSheet.create({
  cartao: { backgroundColor: cores.azulMedio, borderRadius: 22, padding: 18, marginTop: 14, width: "100%" },
  eyebrow: { color: cores.branco, fontSize: 12, fontWeight: "800", textTransform: "uppercase", opacity: 0.9 },
  titulo: { color: cores.branco, fontSize: 22, fontWeight: "900", marginTop: 4 },
  texto: { color: cores.branco, fontSize: 13, marginTop: 4 },
  linhaProgresso: { marginTop: 14, marginBottom: 6 },
  textoProgresso: { color: cores.branco, fontSize: 13, fontWeight: "800" },
  barraFundo: { height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.28)", overflow: "hidden" },
  barraPreenchida: { height: "100%", borderRadius: 6, backgroundColor: cores.laranja },
  botoes: { flexDirection: "row", gap: 10, marginTop: 16 },
  botaoPrincipal: { flex: 1, minHeight: 48, borderRadius: 14, backgroundColor: cores.laranja, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  botaoPrincipalTexto: { color: cores.azulEscuro, fontSize: 16, fontWeight: "900" },
  botaoSecundario: { flex: 1, minHeight: 48, borderRadius: 14, borderWidth: 2, borderColor: cores.branco, alignItems: "center", justifyContent: "center", paddingHorizontal: 12 },
  botaoSecundarioTexto: { color: cores.branco, fontSize: 16, fontWeight: "900" },

  fundo: { flex: 1, backgroundColor: "rgba(31,78,140,0.55)", alignItems: "center", justifyContent: "center", padding: 20 },
  folha: { width: "100%", maxWidth: 420, backgroundColor: cores.branco, borderRadius: 24, padding: 22, alignItems: "center" },
  parabens: { color: cores.azulEscuro, fontSize: 28, fontWeight: "900", marginTop: 4 },
  licao: { color: cores.textoSuave, fontSize: 14, textAlign: "center", marginTop: 6 },
  xp: { color: cores.verdeMusgo, fontSize: 34, fontWeight: "900", marginTop: 8 },
  progresso: { color: cores.azulEscuro, fontSize: 14, fontWeight: "800", marginTop: 6 },
  proxima: { color: cores.textoSuave, fontSize: 13, textAlign: "center", marginTop: 6, marginBottom: 14 },
  botaoLink: { minHeight: 44, justifyContent: "center", marginTop: 4 },
  botaoLinkTexto: { color: cores.azulMedio, fontSize: 15, fontWeight: "800" },
});
