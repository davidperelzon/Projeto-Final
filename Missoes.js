/*
 * Missoes.js
 *
 * Tela das MISSÕES DE ESCRITA: o app mostra uma palavra/frase em
 * português e o usuário escreve em hebraico com o teclado virtual.
 *
 * FLUXO DE UMA MISSÃO:
 *   1. O usuário vê o texto em português e digita a resposta.
 *   2. Toca em "Verificar" (ou aperta Enter, no computador).
 *   3. Se acertar, ganha o XP da missão (só na primeira vez que
 *      acertar essa missão) e pode ouvir a pronúncia.
 *   4. Se errar, tenta de novo. Há "Ver dica" (transliteração) e,
 *      depois de 2 erros, "Ver resposta". Quem vê a resposta não ganha
 *      XP naquela tentativa.
 *
 * ONDE MEXER:
 *   - Quais missões existem / quanto XP rendem ... dadosMissoes.js
 *   - Palavras e frases ......................... niveis.js
 *   - Teclado ................................... TecladoHebraico.js
 *   - Cores ..................................... theme.js
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import TecladoHebraico, { useTecladoFisico } from "./TecladoHebraico";
import BotaoAudio from "./BotaoAudio";
import Logo from "./Logo";
import { cores } from "./theme";
import { nivelDoUsuario } from "./niveis";
import { MISSOES, conferirResposta, MAX_CARACTERES_RESPOSTA } from "./dadosMissoes";

export default function Missoes({ usuario, nivelFoco, onVoltarParaHome, onGanharXp, onConcluirSemXp }) {
  const nivel = nivelDoUsuario(usuario);

  // Vindo da trilha, mostra só as missões DAQUELA unidade (assim "Missão 3 de 10"
  // bate com o progresso da trilha). Sem `nivelFoco`, mostra todas as liberadas.
  const missoes = nivelFoco
    ? MISSOES.filter((missao) => missao.nivel === nivelFoco)
    : MISSOES.filter((missao) => missao.nivel <= nivel.id);
  const concluidas = missoes.filter((missao) => usuario.feitos.includes(missao.id)).length;

  // ----- Estado da tela -----
  const [indice, setIndice] = useState(() => {
    // Começa pela primeira missão ainda não concluída.
    const pendente = missoes.findIndex((missao) => !usuario.feitos.includes(missao.id));
    return pendente >= 0 ? pendente : 0;
  });
  const [texto, setTexto] = useState(""); // o que o usuário digitou
  const [resultado, setResultado] = useState(null); // null | "certo" | "errado" | "finais" | "vazio"
  const [erros, setErros] = useState(0); // erros nesta missão
  const [mostrarDica, setMostrarDica] = useState(false);
  const [viuResposta, setViuResposta] = useState(false);
  const [mensagemXp, setMensagemXp] = useState("");
  const [problema, setProblema] = useState(""); // texto do erro inesperado, se houver

  const missao = missoes[indice % missoes.length];
  const jaConcluida = usuario.feitos.includes(missao.id);
  const acertou = resultado === "certo";

  // ----- Ações -----

  // Acrescenta uma letra (ou espaço) à resposta.
  const digitar = (letra) => {
    if (acertou) return;
    setResultado(null);
    setTexto((atual) =>
      atual.length >= MAX_CARACTERES_RESPOSTA ? atual : atual + letra
    );
  };

  const apagar = () => {
    if (acertou) return;
    setResultado(null);
    setTexto((atual) => atual.slice(0, -1));
  };

  const limpar = () => {
    if (acertou) return;
    setResultado(null);
    setTexto("");
  };

  // Confere a resposta e, se estiver certa, soma o XP.
  // Qualquer erro inesperado (ex.: falha ao salvar) NÃO derruba a tela: a
  // resposta continua valendo e o motivo aparece em "problema".
  const verificar = async () => {
    if (acertou) return;

    let veredito = "errado";
    try {
      veredito = conferirResposta(texto, missao.resposta, missao.aceitas);
    } catch (erro) {
      setProblema(`Não foi possível conferir a resposta (${erro && erro.message ? erro.message : "erro"}).`);
      return;
    }
    setProblema("");
    setResultado(veredito);

    if (veredito === "certo") {
      try {
        if (viuResposta) {
          // Quem viu a resposta não ganha XP, mas a missão conta como feita
          // (senão a trilha, que é em ordem, ficaria presa).
          if (!jaConcluida && onConcluirSemXp) await onConcluirSemXp(missao.id);
          setMensagemXp("Certo! Como você viu a resposta, esta missão ficou sem XP.");
        } else if (jaConcluida) {
          setMensagemXp("Esta missão já tinha rendido XP antes.");
        } else {
          // O aviso "+XP" aparece no topo da tela, em App.js.
          await onGanharXp(missao.id, missao.xp);
          setMensagemXp("");
        }
      } catch (erro) {
        setProblema("Você acertou, mas não foi possível salvar o XP agora. Tente de novo mais tarde.");
      }
    } else if (veredito === "errado") {
      setErros((valor) => valor + 1);
    }
  };

  // Animação de troca de missão: o cartão sai para a esquerda, a próxima
  // missão entra pela direita. `saida` vai de 1 (visível) a 0 (fora).
  const saida = useRef(new Animated.Value(1)).current;
  const nativo = Platform.OS !== "web";
  const ultimaMissao = indice % missoes.length === missoes.length - 1 && concluidas >= missoes.length;

  // Avança sozinho para a próxima missão, com animação.
  // `emTransicao` evita avançar duas missões se o aluno tocar duas vezes.
  const emTransicao = useRef(false);
  const avancarComAnimacao = () => {
    if (emTransicao.current) return;
    emTransicao.current = true;
    Animated.timing(saida, { toValue: 0, duration: 200, useNativeDriver: nativo }).start(() => {
      proxima();
      Animated.timing(saida, { toValue: 1, duration: 260, useNativeDriver: nativo }).start(() => {
        emTransicao.current = false;
      });
    });
  };

  // Depois de acertar, espera um instante (para ver o "Correto!") e passa para a próxima.
  // Não avança sozinho quando a unidade acabou.
  const concluidasRef = useRef(concluidas);
  concluidasRef.current = concluidas;
  useEffect(() => {
    if (resultado !== "certo") return undefined;
    // O XP é salvo um instante depois da resposta: confere de novo na hora de avançar.
    const espera = setTimeout(() => {
      if (concluidasRef.current < missoes.length) avancarComAnimacao();
    }, 1500);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resultado, indice]);

  // Vai para a próxima missão e limpa a tela.
  const proxima = () => {
    setIndice((valor) => (valor + 1) % missoes.length);
    setTexto("");
    setResultado(null);
    setErros(0);
    setMostrarDica(false);
    setViuResposta(false);
    setMensagemXp("");
    setProblema("");
  };

  // ----- Teclado do computador (só no navegador) -----
  useTecladoFisico({ digitar, apagar, confirmar: verificar });

  // ----- Mensagem de resultado -----
  let mensagem = null;
  if (resultado === "certo") {
    mensagem = { texto: "✓ Correto!", tipo: "ok" };
  } else if (resultado === "finais") {
    mensagem = {
      texto: "Quase! As letras estão certas, mas confira as formas finais (ך ם ן ף ץ) no fim das palavras.",
      tipo: "aviso",
    };
  } else if (resultado === "errado") {
    mensagem = { texto: "Ainda não. Confira as letras e tente de novo.", tipo: "aviso" };
  } else if (resultado === "vazio") {
    mensagem = { texto: "Digite a resposta com o teclado hebraico abaixo.", tipo: "aviso" };
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.conteudo}
      keyboardShouldPersistTaps="handled"
    >
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.voltarButton}
          onPress={onVoltarParaHome}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a trilha"
        >
          <Text style={styles.voltarButtonText}>← Trilha</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Missões</Text>
        <Logo largura={56} />
      </View>

      {/* Progresso */}
      <View style={styles.progressoLinha}>
        <Text style={styles.progressoTexto}>
          Missão {(indice % missoes.length) + 1} de {missoes.length}
        </Text>
        <Text style={styles.progressoTexto}>
          Concluídas: {concluidas}/{missoes.length}
        </Text>
      </View>

      {concluidas >= missoes.length ? (
        <View style={styles.faixaFim} accessibilityLiveRegion="polite">
          <Text style={styles.faixaFimTexto}>Você concluiu todas as missões desta unidade!</Text>
          <TouchableOpacity style={styles.faixaFimBotao} onPress={onVoltarParaHome} accessibilityRole="button">
            <Text style={styles.faixaFimBotaoTexto}>Voltar à trilha</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Cartão da missão (animado na troca) */}
      <Animated.View
        style={[
          styles.cartao,
          {
            opacity: saida,
            transform: [{ translateX: saida.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) }],
          },
        ]}
      >
        <View style={styles.cartaoTopo}>
          <Text style={styles.etiqueta}>
            {missao.tipo === "frase" ? "Escreva a frase em hebraico" : "Escreva a palavra em hebraico"}
          </Text>
          <Text style={jaConcluida ? styles.xpFeito : styles.xpBadge}>
            {jaConcluida ? "✓ já concluída" : `+${missao.xp} XP`}
          </Text>
        </View>

        <Text style={styles.pergunta}>{missao.pt}</Text>

        {/* Caixa onde aparece o que foi digitado (hebraico: da direita para a esquerda) */}
        <View
          style={[
            styles.caixaResposta,
            acertou && styles.caixaCerta,
            (resultado === "errado" || resultado === "finais") && styles.caixaErrada,
          ]}
          accessibilityLabel={texto ? `Sua resposta: ${texto}` : "Sua resposta está vazia"}
          accessibilityLiveRegion="polite"
        >
          {texto ? (
            <Text style={styles.respostaTexto}>{texto}</Text>
          ) : (
            <Text style={styles.respostaVazia}>Toque nas letras abaixo</Text>
          )}
        </View>

        {mensagem ? (
          <Text
            style={[styles.mensagem, mensagem.tipo === "ok" ? styles.mensagemOk : styles.mensagemAviso]}
            accessibilityLiveRegion="polite"
          >
            {mensagem.texto}
          </Text>
        ) : null}

        {mensagemXp ? <Text style={styles.mensagemXp}>{mensagemXp}</Text> : null}
        {problema ? <Text style={styles.problema} accessibilityLiveRegion="polite">{problema}</Text> : null}

        {/* Depois de acertar: mostra a resposta e deixa ouvir */}
        {acertou ? (
          <View style={styles.revelacao}>
            <Text style={styles.revelacaoHeb}>{missao.exibicao}</Text>
            <Text style={styles.revelacaoTranslit}>{missao.translit}</Text>
            <BotaoAudio texto={missao.exibicao} rotulo="Ouvir a pronúncia da resposta" />
          </View>
        ) : null}

        {/* Dica e resposta (só antes de acertar) */}
        {!acertou ? (
          <View style={styles.ajuda}>
            {mostrarDica ? (
              <Text style={styles.dicaTexto}>Dica: {missao.translit}</Text>
            ) : (
              <TouchableOpacity
                onPress={() => setMostrarDica(true)}
                accessibilityRole="button"
                accessibilityLabel="Ver dica com a transliteração"
              >
                <Text style={styles.link}>Ver dica</Text>
              </TouchableOpacity>
            )}

            {erros >= 2 && !viuResposta ? (
              <TouchableOpacity
                onPress={() => setViuResposta(true)}
                accessibilityRole="button"
                accessibilityLabel="Ver a resposta (sem ganhar XP nesta tentativa)"
              >
                <Text style={styles.link}>Ver resposta</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {viuResposta && !acertou ? (
          <Text style={styles.respostaRevelada}>
            Resposta: {missao.exibicao} ({missao.translit}) — sem XP nesta tentativa.
          </Text>
        ) : null}

        {/* Botões principais */}
        <View style={styles.botoes}>
          {acertou ? (
            <TouchableOpacity
              style={styles.botaoPrimario}
              onPress={ultimaMissao || concluidas >= missoes.length ? proxima : avancarComAnimacao}
              accessibilityRole="button"
              accessibilityLabel="Ir para a próxima missão"
            >
              <Text style={styles.botaoPrimarioTexto}>
                {concluidas >= missoes.length ? "Ver de novo" : "Próxima já →"}
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.botaoPrimario}
                onPress={verificar}
                accessibilityRole="button"
                accessibilityLabel="Verificar a resposta"
              >
                <Text style={styles.botaoPrimarioTexto}>Verificar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </Animated.View>

      {/* Teclado virtual */}
      <TecladoHebraico
        onLetra={digitar}
        onApagar={apagar}
        onLimpar={limpar}
        desativado={acertou}
      />

      <Text style={styles.observacao}>
        Não precisa digitar vogais (nikkud) nem pontuação. No computador, você também pode usar o teclado
        físico: cada tecla corresponde a uma letra (por exemplo, T = א).
      </Text>
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
    maxWidth: 720,
    alignSelf: "center",
    paddingBottom: Platform.OS === "android" ? 72 : 36, // folga para a barra do Android
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
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
  progressoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  progressoTexto: {
    color: cores.textoSuave,
    fontSize: 12,
    fontWeight: "800",
  },
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    marginBottom: 14,
  },
  cartaoTopo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  etiqueta: {
    flex: 1,
    color: cores.textoSuave,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  xpBadge: {
    backgroundColor: cores.destaqueSuave,
    color: cores.texto,
    fontSize: 12,
    fontWeight: "800",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  xpFeito: {
    backgroundColor: cores.sucessoSuave,
    color: cores.verdeMusgo,
    fontSize: 12,
    fontWeight: "800",
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    overflow: "hidden",
  },
  pergunta: {
    color: cores.texto,
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginVertical: 12,
  },
  caixaResposta: {
    minHeight: 72,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.fundoSuave,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  caixaCerta: {
    borderColor: cores.verdeMusgo,
    backgroundColor: cores.sucessoSuave,
  },
  caixaErrada: {
    borderColor: cores.laranja,
    backgroundColor: cores.destaqueSuave,
  },
  respostaTexto: {
    fontSize: 36,
    color: cores.azulEscuro,
    fontWeight: "700",
    textAlign: "center",
    writingDirection: "rtl", // hebraico é escrito da direita para a esquerda
  },
  respostaVazia: {
    color: cores.textoSuave,
    fontSize: 14,
    fontWeight: "700",
  },
  mensagem: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 20,
  },
  mensagemOk: {
    color: cores.verdeMusgo,
  },
  mensagemAviso: {
    color: cores.texto,
  },
  problema: {
    marginTop: 8,
    color: cores.texto,
    backgroundColor: cores.destaqueSuave,
    borderRadius: 10,
    padding: 8,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  faixaFim: {
    backgroundColor: cores.sucessoSuave,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.verdeMusgo,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
    gap: 8,
  },
  faixaFimTexto: { color: cores.texto, fontWeight: "800", fontSize: 14, textAlign: "center" },
  faixaFimBotao: { minHeight: 44, paddingHorizontal: 18, borderRadius: 999, backgroundColor: cores.verdeMusgo, alignItems: "center", justifyContent: "center" },
  faixaFimBotaoTexto: { color: cores.branco, fontWeight: "800", fontSize: 14 },
  mensagemXp: {
    marginTop: 6,
    color: cores.verdeMusgo,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  revelacao: {
    alignItems: "center",
    marginTop: 12,
    gap: 6,
  },
  revelacaoHeb: {
    fontSize: 30,
    color: cores.azulEscuro,
    fontWeight: "800",
    writingDirection: "rtl",
  },
  revelacaoTranslit: {
    color: cores.textoSuave,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  ajuda: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    minHeight: 32,
  },
  link: {
    color: cores.azulMedio,
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
    paddingVertical: 6,
  },
  dicaTexto: {
    color: cores.texto,
    fontSize: 13,
    fontWeight: "800",
  },
  respostaRevelada: {
    marginTop: 6,
    color: cores.texto,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  botoes: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  botaoPrimario: {
    flex: 1,
    backgroundColor: cores.azulEscuro,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  botaoPrimarioTexto: {
    color: cores.branco,
    fontWeight: "800",
    fontSize: 15,
  },
  botaoSecundario: {
    flex: 1,
    backgroundColor: cores.fundoSuave,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  botaoSecundarioTexto: {
    color: cores.texto,
    fontWeight: "800",
    fontSize: 15,
  },
  observacao: {
    color: cores.textoSuave,
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 14,
  },
});
