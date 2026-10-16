/*
 * CaixaDeErro.js
 *
 * "Rede de segurança" do app: se uma tela der algum erro inesperado, em vez
 * de aparecer a tela vermelha (ou ficar tudo em branco), o aluno vê uma
 * mensagem simples, o motivo técnico (para você me enviar) e um botão para
 * tentar de novo ou voltar ao início.
 *
 * Uso: <CaixaDeErro aoVoltar={...}> ...telas... </CaixaDeErro>
 */
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { cores } from "./theme";
import Icone from "./Icone";

export default class CaixaDeErro extends React.Component {
  constructor(props) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro) {
    return { erro };
  }

  render() {
    const { erro } = this.state;
    if (!erro) return this.props.children;

    const detalhe = `${erro && erro.message ? erro.message : String(erro)}`.slice(0, 400);
    return (
      <ScrollView contentContainerStyle={styles.caixa}>
        <View style={styles.cartao} accessibilityRole="alert">
          <Icone nome="construct" tamanho={44} cor={cores.laranja} />
          <Text style={styles.titulo}>Algo deu errado nesta tela</Text>
          <Text style={styles.texto}>
            Seu progresso está salvo. Toque em “Tentar de novo”. Se o erro continuar, tire um print desta tela e envie o texto abaixo.
          </Text>
          <Text style={styles.detalhe} selectable>
            {detalhe}
          </Text>
          <TouchableOpacity style={styles.botao} onPress={() => this.setState({ erro: null })} accessibilityRole="button">
            <Text style={styles.botaoTexto}>Tentar de novo</Text>
          </TouchableOpacity>
          {this.props.aoVoltar ? (
            <TouchableOpacity
              style={styles.botaoSecundario}
              onPress={() => {
                this.setState({ erro: null });
                this.props.aoVoltar();
              }}
              accessibilityRole="button"
            >
              <Text style={styles.botaoSecundarioTexto}>Voltar ao início</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  caixa: { flexGrow: 1, justifyContent: "center", padding: 20, backgroundColor: cores.fundoTela },
  cartao: { backgroundColor: cores.branco, borderRadius: 22, padding: 20, borderWidth: 1, borderColor: cores.laranja, gap: 10, alignItems: "center", maxWidth: 520, width: "100%", alignSelf: "center" },
  emoji: { fontSize: 44 },
  titulo: { color: cores.texto, fontSize: 20, fontWeight: "800", textAlign: "center" },
  texto: { color: cores.texto, fontSize: 14, lineHeight: 20, fontWeight: "600", textAlign: "center" },
  detalhe: { color: cores.texto, backgroundColor: cores.destaqueSuave, borderRadius: 10, padding: 10, fontSize: 12, fontWeight: "700", alignSelf: "stretch" },
  botao: { minHeight: 48, alignSelf: "stretch", backgroundColor: cores.azulEscuro, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  botaoTexto: { color: cores.branco, fontWeight: "800", fontSize: 15 },
  botaoSecundario: { minHeight: 48, alignSelf: "stretch", borderWidth: 1, borderColor: cores.azulClaro, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  botaoSecundarioTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
});
