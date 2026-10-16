/*
 * SessaoQuestoes.js
 *
 * Executa uma SEQUÊNCIA de questões (geradas por questoes.js): mostra a
 * questão, recebe a resposta, dá feedback claro e avança. É usado em dois
 * lugares: na tela "Praticar" e dentro das lições (modo `compacto`).
 *
 * O QUE O USUÁRIO VÊ:
 *   - "Questão 3 de 8" e uma barra de progresso;
 *   - ao acertar:   ✓ Correto!  (+ XP, quando a questão rende XP);
 *   - ao errar:     ✗ Ainda não. + o que ele escolheu + a resposta certa
 *                   + uma explicação curta;
 *   - botão "Continuar" depois de cada resposta;
 *   - no final, um resumo com acertos e XP.
 *   O feedback usa ÍCONE + TEXTO (não depende só de cor).
 *
 * PROPS:
 *   questoes     -> lista criada em questoes.js
 *   aoResponder  -> async (questao, acertou) => xpGanho. Quem usa a sessão
 *                   decide o que fazer com a resposta (somar XP, registrar
 *                   erro...). Devolve quantos XP foram ganhos.
 *   aoTerminar   -> (resumo) chamado ao fim (no modo compacto, ao tocar em
 *                   "Continuar" no resumo)
 *   aoFinalizar  -> (resumo) chamado UMA vez quando a última questão é
 *                   respondida e o aluno toca em "Ver resultado". Usado pela
 *                   prova de nível para decidir se foi aprovado.
 *   semResumo    -> true = não mostra o resumo final (quem usa mostra o seu)
 *   aoRepetir    -> (opcional) botão "Praticar de novo" no resumo
 *   aoSair       -> (opcional) botão "Voltar" no resumo
 *   compacto     -> true dentro de lições (menos espaço, sem "Praticar de novo")
 */

import React, { useEffect, useRef, useState } from "react";
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotaoAudio from "./BotaoAudio";
import TecladoHebraico, { useTecladoFisico } from "./TecladoHebraico";
import { conferirResposta } from "./dadosMissoes";
import { embaralhar } from "./questoes";
import { cores } from "./theme";
import Icone from "./Icone";
import Foto from "./Foto";
import { creditoFoto } from "./fotos";

// Embaralha a coluna de significados de forma estável (não muda a cada toque).
const ORDEM_PT = {};
function embaralharPt(pares, chave) {
  if (!ORDEM_PT[chave]) ORDEM_PT[chave] = embaralhar(pares.map((par) => par.id));
  return ORDEM_PT[chave].map((id) => pares.find((par) => par.id === id));
}

// Animação curta de entrada do feedback (usa o driver nativo no celular).
function useEntrada(chave) {
  const valor = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    valor.setValue(0);
    Animated.timing(valor, { toValue: 1, duration: 200, useNativeDriver: Platform.OS !== "web" }).start();
  }, [chave, valor]);
  return {
    opacity: valor,
    transform: [{ translateY: valor.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
}

export default function SessaoQuestoes({ questoes, aoResponder, aoTerminar, aoFinalizar, aoRepetir, aoSair, compacto, semResumo }) {
  const [indice, setIndice] = useState(0);
  const [escolha, setEscolha] = useState(null); // id da opção escolhida
  const [resultado, setResultado] = useState(null); // null | "certo" | "errado"
  const [xpGanho, setXpGanho] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [xpTotal, setXpTotal] = useState(0);
  const [montada, setMontada] = useState([]); // índices das letras já tocadas (ordenar)
  const [fim, setFim] = useState(false);
  // "associar": palavra hebraica e significado selecionados, pares já ligados e erros
  const [selHeb, setSelHeb] = useState(null);
  const [selPt, setSelPt] = useState(null);
  const [ligados, setLigados] = useState([]);
  const [errosPares, setErrosPares] = useState(0);
  const [errouAgora, setErrouAgora] = useState(false);
  // "ditado": texto digitado e dica de conferência
  const [textoDitado, setTextoDitado] = useState("");
  const [avisoDitado, setAvisoDitado] = useState("");

  const total = questoes.length;
  const questao = questoes[indice];
  const respondida = resultado !== null;
  const estiloFeedback = useEntrada(`${indice}-${resultado}`);

  // Registra a resposta, mostra o feedback e avisa quem usa a sessão.
  const jaRespondeu = useRef(false); // trava síncrona contra toque duplo
  const registrar = async (acertou, idEscolha) => {
    if (respondida || jaRespondeu.current) return;
    jaRespondeu.current = true;
    setEscolha(idEscolha);
    setResultado(acertou ? "certo" : "errado");
    if (acertou) setAcertos((valor) => valor + 1);
    const xp = aoResponder ? await aoResponder(questao, acertou) : 0;
    setXpGanho(xp || 0);
    setXpTotal((valor) => valor + (xp || 0));
  };

  const escolherOpcao = (opcao) => registrar(opcao.id === questao.correta, opcao.id);

  // Questão "ordenar": toca numa letra para colocá-la, ou na letra colocada para tirá-la.
  const tocarLetra = (posicaoNaLista) => {
    if (respondida) return;
    setMontada((atual) => (atual.includes(posicaoNaLista) ? atual : [...atual, posicaoNaLista]));
  };
  const tirarLetra = (posicaoNaMontagem) => {
    if (respondida) return;
    setMontada((atual) => atual.filter((_, i) => i !== posicaoNaMontagem));
  };
  const verificarOrdem = () => {
    const palavra = montada.map((i) => questao.ordenar.letras[i]).join("");
    registrar(palavra === questao.ordenar.resposta, null);
  };

  const continuar = () => {
    if (fim || !jaRespondeu.current) return; // só avança depois de responder, e uma vez
    jaRespondeu.current = false;
    if (indice + 1 >= total) {
      setFim(true);
      if (aoFinalizar) aoFinalizar({ acertos, total, xp: xpTotal });
      return;
    }
    setIndice(indice + 1);
    setEscolha(null);
    setResultado(null);
    setXpGanho(0);
    setMontada([]);
    setSelHeb(null);
    setSelPt(null);
    setLigados([]);
    setErrosPares(0);
    setTextoDitado("");
    setAvisoDitado("");
  };

  const resumo = { acertos, total, xp: xpTotal };

  // ----- "associar": liga uma palavra hebraica a um significado -----
  const tentarLigar = (idHeb, idPt) => {
    if (idHeb === idPt) {
      const novos = [...ligados, idHeb];
      setLigados(novos);
      setSelHeb(null);
      setSelPt(null);
      if (novos.length === questao.pares.length) registrar(errosPares <= 1, null);
    } else {
      setErrosPares((valor) => valor + 1);
      setErrouAgora(true);
      setTimeout(() => {
        setSelHeb(null);
        setSelPt(null);
        setErrouAgora(false);
      }, 500);
    }
  };
  const escolherHeb = (id) => {
    if (respondida || ligados.includes(id) || errouAgora) return;
    setSelHeb(id);
    if (selPt !== null) tentarLigar(id, selPt);
  };
  const escolherPt = (id) => {
    if (respondida || ligados.includes(id) || errouAgora) return;
    setSelPt(id);
    if (selHeb !== null) tentarLigar(selHeb, id);
  };

  // ----- "ditado": escreve com o teclado hebraico -----
  const digitarDitado = (letra) => {
    if (respondida) return;
    setAvisoDitado("");
    setTextoDitado((atual) => (atual.length >= 40 ? atual : atual + letra));
  };
  const apagarDitado = () => !respondida && setTextoDitado((atual) => atual.slice(0, -1));
  const limparDitado = () => !respondida && setTextoDitado("");
  const verificarDitado = () => {
    if (respondida || !questao || questao.tipo !== "ditado") return;
    const veredito = conferirResposta(textoDitado, questao.resposta, questao.aceitas);
    if (veredito === "vazio") {
      setAvisoDitado("Escreva a palavra com o teclado hebraico.");
      return;
    }
    if (veredito === "finais") {
      setAvisoDitado("Quase! Confira as formas finais (ך ם ן ף ץ) no fim da palavra.");
      return;
    }
    registrar(veredito === "certo", null);
  };
  // Teclado do computador (só navegador) para o ditado.
  useTecladoFisico({
    digitar: questao && questao.tipo === "ditado" ? digitarDitado : undefined,
    apagar: questao && questao.tipo === "ditado" ? apagarDitado : undefined,
    confirmar: questao && questao.tipo === "ditado" ? verificarDitado : undefined,
  });

  // ----- Resumo final -----
  if (fim && semResumo) return null;
  if (fim) {
    const percentual = total ? Math.round((acertos / total) * 100) : 0;
    return (
      <View style={[styles.cartao, compacto && styles.cartaoCompacto]}>
        <Text style={styles.resumoTitulo}>Sessão concluída!</Text>
        <Text style={styles.resumoPlacar}>
          {acertos} de {total} acertos ({percentual}%)
        </Text>
        <View style={styles.barraFundo}>
          <View style={[styles.barraPreenchida, { width: `${Math.max(4, percentual)}%` }]} />
        </View>
        {xpTotal > 0 ? <Text style={styles.resumoXp}>+{xpTotal} XP nesta sessão</Text> : null}
        <Text style={styles.resumoTexto}>
          {percentual === 100
            ? "Perfeito! Você acertou tudo."
            : percentual >= 60
            ? "Muito bem! O que errou volta na Revisão para você treinar."
            : "Continue praticando: o que errou volta na Revisão."}
        </Text>

        <View style={styles.botoesLinha}>
          {compacto ? (
            <TouchableOpacity style={styles.botaoPrimario} onPress={() => aoTerminar && aoTerminar(resumo)} accessibilityRole="button">
              <Text style={styles.botaoPrimarioTexto}>Continuar</Text>
            </TouchableOpacity>
          ) : (
            <>
              {aoSair ? (
                <TouchableOpacity style={styles.botaoSecundario} onPress={aoSair} accessibilityRole="button">
                  <Text style={styles.botaoSecundarioTexto}>Voltar</Text>
                </TouchableOpacity>
              ) : null}
              {aoRepetir ? (
                <TouchableOpacity style={styles.botaoPrimario} onPress={aoRepetir} accessibilityRole="button">
                  <Text style={styles.botaoPrimarioTexto}>Praticar de novo</Text>
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    );
  }

  if (!questao) return null;

  const progresso = ((indice + (respondida ? 1 : 0)) / total) * 100;
  const opcaoEscolhida = questao.opcoes ? questao.opcoes.find((o) => o.id === escolha) : null;
  const opcaoCorreta = questao.opcoes ? questao.opcoes.find((o) => o.id === questao.correta) : null;
  const montadaTexto = questao.ordenar ? montada.map((i) => questao.ordenar.letras[i]).join("") : "";

  return (
    <View style={[styles.cartao, compacto && styles.cartaoCompacto]}>
      {/* Progresso: "Questão 3 de 8" + barra */}
      <View style={styles.progressoLinha}>
        <Text style={styles.progressoTexto} accessibilityLiveRegion="polite">
          Questão {indice + 1} de {total}
        </Text>
        <Text style={styles.progressoTexto}>
          {acertos} {acertos === 1 ? "acerto" : "acertos"}
        </Text>
      </View>
      <View
        style={styles.barraFundo}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: indice + (respondida ? 1 : 0) }}
      >
        <View style={[styles.barraPreenchida, { width: `${Math.max(4, progresso)}%` }]} />
      </View>

      {/* Enunciado */}
      <Text style={styles.instrucao}>{questao.instrucao}</Text>
      {questao.foto ? (
        <View style={styles.fotoQuestao}>
          <Foto id={questao.foto} largura={800} style={styles.fotoQuestaoImg} />
          <Text style={styles.fotoCredito}>{creditoFoto(questao.foto)}</Text>
        </View>
      ) : null}
      {questao.icone ? (
        <View style={styles.enunciadoIcone}>
          <Icone nome={questao.icone} tamanho={40} cor={cores.azulEscuro} />
        </View>
      ) : (
        <Text style={[styles.enunciado, questao.enunciadoHeb && styles.enunciadoHeb]}>{questao.enunciado}</Text>
      )}

      {questao.audio ? (
        <View style={styles.audioLinha}>
          <BotaoAudio key={questao.id} texto={questao.audio} rotulo="Ouvir a pronúncia" />
        </View>
      ) : null}

      {/* Opções (múltipla escolha) */}
      {questao.opcoes ? (
        <View style={styles.opcoes}>
          {questao.opcoes.map((opcao, i) => {
            const escolhida = escolha === opcao.id;
            const certa = opcao.id === questao.correta;
            const marcaCerta = respondida && certa;
            const marcaErrada = respondida && escolhida && !certa;
            return (
              <TouchableOpacity
                key={opcao.id}
                style={[styles.opcao, marcaCerta && styles.opcaoCerta, marcaErrada && styles.opcaoErrada]}
                onPress={() => escolherOpcao(opcao)}
                disabled={respondida}
                accessibilityRole="button"
                accessibilityLabel={`Opção ${i + 1}: ${opcao.texto}${marcaCerta ? ". Resposta certa" : ""}${marcaErrada ? ". Sua resposta, incorreta" : ""}`}
              >
                <Text style={[styles.opcaoTexto, opcao.heb && styles.opcaoTextoHeb]}>{opcao.texto}</Text>
                {marcaCerta ? <Text style={styles.opcaoMarca}>✓</Text> : null}
                {marcaErrada ? <Text style={styles.opcaoMarca}>✗</Text> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      {/* Associar: duas colunas (hebraico e português) */}
      {questao.pares ? (
        <View style={styles.associar}>
          <View style={styles.colunaPares}>
            {questao.pares.map((par) => {
              const ligado = ligados.includes(par.id);
              const sel = selHeb === par.id;
              return (
                <TouchableOpacity
                  key={`h${par.id}`}
                  style={[styles.par, ligado && styles.parLigado, sel && styles.parSelecionado, sel && errouAgora && styles.parErrado]}
                  onPress={() => escolherHeb(par.id)}
                  disabled={ligado || respondida}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel, disabled: ligado }}
                  accessibilityLabel={`Hebraico: ${par.translit}${ligado ? ", já ligado" : ""}`}
                >
                  <Text style={[styles.parTexto, styles.parTextoHeb]}>{par.heb}</Text>
                  {ligado ? <Text style={styles.opcaoMarca}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.colunaPares}>
            {embaralharPt(questao.pares, questao.id).map((par) => {
              const ligado = ligados.includes(par.id);
              const sel = selPt === par.id;
              return (
                <TouchableOpacity
                  key={`p${par.id}`}
                  style={[styles.par, ligado && styles.parLigado, sel && styles.parSelecionado, sel && errouAgora && styles.parErrado]}
                  onPress={() => escolherPt(par.id)}
                  disabled={ligado || respondida}
                  accessibilityRole="button"
                  accessibilityState={{ selected: sel, disabled: ligado }}
                  accessibilityLabel={`Significado: ${par.pt}${ligado ? ", já ligado" : ""}`}
                >
                  <Text style={styles.parTexto}>{par.pt}</Text>
                  {ligado ? <Text style={styles.opcaoMarca}>✓</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.contadorPares} accessibilityLiveRegion="polite">
            {ligados.length} de {questao.pares.length} pares · erros: {errosPares}
          </Text>
        </View>
      ) : null}

      {/* Ditado: o aluno escreve o que ouviu */}
      {questao.tipo === "ditado" ? (
        <View style={styles.ordenarArea}>
          <View style={styles.caixaDitado} accessibilityLabel={textoDitado ? `Sua resposta: ${textoDitado}` : "Sua resposta está vazia"}>
            {textoDitado ? (
              <Text style={styles.textoDitado}>{textoDitado}</Text>
            ) : (
              <Text style={styles.montagemVazia}>Escreva com o teclado abaixo</Text>
            )}
          </View>
          {avisoDitado ? <Text style={styles.avisoDitado}>{avisoDitado}</Text> : null}
          <TecladoHebraico onLetra={digitarDitado} onApagar={apagarDitado} onLimpar={limparDitado} desativado={respondida} />
          {!respondida ? (
            <TouchableOpacity style={styles.botaoPrimario} onPress={verificarDitado} accessibilityRole="button">
              <Text style={styles.botaoPrimarioTexto}>Verificar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* Ordenar letras */}
      {questao.ordenar ? (
        <View style={styles.ordenarArea}>
          <View style={styles.montagem} accessibilityLabel={montadaTexto ? `Palavra montada: ${montadaTexto}` : "Nenhuma letra escolhida ainda"}>
            {montada.length === 0 ? (
              <Text style={styles.montagemVazia}>Toque nas letras abaixo</Text>
            ) : (
              montada.map((posicao, i) => (
                <TouchableOpacity
                  key={`${posicao}-${i}`}
                  style={styles.letra}
                  onPress={() => tirarLetra(i)}
                  disabled={respondida}
                  accessibilityRole="button"
                  accessibilityLabel={`Tirar a letra ${questao.ordenar.letras[posicao]}`}
                >
                  <Text style={styles.letraTexto}>{questao.ordenar.letras[posicao]}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
          <View style={styles.letrasDisponiveis}>
            {questao.ordenar.letras.map((letra, posicao) => {
              const usada = montada.includes(posicao);
              return (
                <TouchableOpacity
                  key={posicao}
                  style={[styles.letra, usada && styles.letraUsada]}
                  onPress={() => tocarLetra(posicao)}
                  disabled={respondida || usada}
                  accessibilityRole="button"
                  accessibilityLabel={`Letra ${letra}${usada ? ", já usada" : ""}`}
                >
                  <Text style={styles.letraTexto}>{letra}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {!respondida ? (
            <View style={styles.botoesLinha}>
              <TouchableOpacity style={styles.botaoSecundario} onPress={() => setMontada([])} accessibilityRole="button">
                <Text style={styles.botaoSecundarioTexto}>Limpar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.botaoPrimario, montada.length === 0 && styles.botaoDesativado]}
                onPress={verificarOrdem}
                disabled={montada.length === 0}
                accessibilityRole="button"
              >
                <Text style={styles.botaoPrimarioTexto}>Verificar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Feedback */}
      {respondida ? (
        <Animated.View
          style={[styles.feedback, resultado === "certo" ? styles.feedbackCerto : styles.feedbackErrado, estiloFeedback]}
          accessibilityLiveRegion="polite"
        >
          <Text style={styles.feedbackTitulo}>
            {resultado === "certo" ? "✓ Correto!" : "✗ Ainda não."}
            {resultado === "certo" && xpGanho > 0 ? `  +${xpGanho} XP` : ""}
          </Text>

          {resultado === "errado" && opcaoEscolhida && opcaoEscolhida.nota ? (
            <Text style={styles.feedbackTexto}>Você escolheu «{opcaoEscolhida.texto}». {opcaoEscolhida.nota}</Text>
          ) : null}
          {resultado === "errado" && opcaoCorreta ? (
            <Text style={styles.feedbackTexto}>Resposta certa: «{opcaoCorreta.texto}».</Text>
          ) : null}
          {resultado === "errado" && questao.ordenar ? (
            <Text style={styles.feedbackTexto}>Você montou «{montadaTexto}». A ordem certa é «{questao.ordenar.resposta}».</Text>
          ) : null}
          <Text style={styles.feedbackTexto}>{questao.explicacao}</Text>
          {resultado === "certo" && xpGanho === 0 && questao.xp > 0 ? (
            <Text style={styles.feedbackNota}>Esta questão já tinha rendido XP antes.</Text>
          ) : null}

          <TouchableOpacity style={styles.botaoPrimario} onPress={continuar} accessibilityRole="button">
            <Text style={styles.botaoPrimarioTexto}>{indice + 1 >= total ? "Ver resultado" : "Continuar"}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cartao: {
    backgroundColor: cores.branco,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    marginBottom: 14,
  },
  cartaoCompacto: {
    padding: 14,
    marginBottom: 0,
    backgroundColor: cores.fundoSuave,
  },
  progressoLinha: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressoTexto: {
    color: cores.textoSuave,
    fontSize: 12,
    fontWeight: "800",
  },
  barraFundo: {
    height: 10,
    borderRadius: 999,
    backgroundColor: cores.fundoSuave,
    overflow: "hidden",
    marginBottom: 14,
  },
  barraPreenchida: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: cores.laranja,
  },
  instrucao: {
    color: cores.textoSuave,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  enunciado: {
    color: cores.texto,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  fotoQuestao: { marginBottom: 10 },
  fotoQuestaoImg: { height: 190, borderRadius: 14, alignSelf: "stretch" },
  fotoCredito: { color: cores.textoSuave, fontSize: 9, fontWeight: "700", marginTop: 3, textAlign: "center" },
  enunciadoIcone: { alignItems: "center", marginBottom: 10 },
  enunciadoHeb: {
    fontSize: 46,
    writingDirection: "rtl",
  },
  audioLinha: {
    alignItems: "center",
    marginBottom: 12,
  },
  opcoes: {
    gap: 10,
  },
  opcao: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.branco,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  opcaoCerta: {
    borderColor: cores.verdeMusgo,
    backgroundColor: cores.sucessoSuave,
  },
  opcaoErrada: {
    borderColor: cores.laranja,
    backgroundColor: cores.destaqueSuave,
  },
  opcaoTexto: {
    color: cores.texto,
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    flexShrink: 1,
  },
  opcaoTextoHeb: {
    fontSize: 28,
    writingDirection: "rtl",
  },
  opcaoMarca: {
    color: cores.texto,
    fontSize: 20,
    fontWeight: "800",
  },
  associar: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  colunaPares: { flex: 1, minWidth: 130, gap: 8 },
  par: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.branco,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  parSelecionado: { borderColor: cores.azulEscuro, backgroundColor: cores.fundoSuave },
  parLigado: { borderColor: cores.verdeMusgo, backgroundColor: cores.sucessoSuave, opacity: 0.8 },
  parErrado: { borderColor: cores.laranja, backgroundColor: cores.destaqueSuave },
  parTexto: { color: cores.texto, fontSize: 15, fontWeight: "700", textAlign: "center", flexShrink: 1 },
  parTextoHeb: { fontSize: 24, writingDirection: "rtl" },
  contadorPares: { width: "100%", textAlign: "center", color: cores.textoSuave, fontSize: 12, fontWeight: "800" },
  caixaDitado: {
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.fundoSuave,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  textoDitado: { fontSize: 32, color: cores.azulEscuro, fontWeight: "700", writingDirection: "rtl", textAlign: "center" },
  avisoDitado: { color: cores.texto, backgroundColor: cores.destaqueSuave, borderRadius: 10, padding: 8, fontSize: 12, fontWeight: "800", textAlign: "center" },
  ordenarArea: {
    gap: 12,
  },
  montagem: {
    minHeight: 64,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.fundoSuave,
    padding: 8,
  },
  montagemVazia: {
    color: cores.textoSuave,
    fontSize: 13,
    fontWeight: "700",
  },
  letrasDisponiveis: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  letra: {
    minWidth: 48,
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.branco,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  letraUsada: {
    opacity: 0.3,
  },
  letraTexto: {
    color: cores.texto,
    fontSize: 28,
    fontWeight: "700",
  },
  feedback: {
    marginTop: 14,
    borderRadius: 16,
    padding: 14,
    borderLeftWidth: 6,
    gap: 6,
  },
  feedbackCerto: {
    backgroundColor: cores.sucessoSuave,
    borderLeftColor: cores.verdeMusgo,
  },
  feedbackErrado: {
    backgroundColor: cores.destaqueSuave,
    borderLeftColor: cores.laranja,
  },
  feedbackTitulo: {
    color: cores.texto,
    fontSize: 18,
    fontWeight: "800",
  },
  feedbackTexto: {
    color: cores.texto,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  feedbackNota: {
    color: cores.textoSuave,
    fontSize: 12,
    fontWeight: "700",
  },
  botoesLinha: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  botaoPrimario: {
    flex: 2,
    minHeight: 48,
    backgroundColor: cores.azulEscuro,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  botaoPrimarioTexto: {
    color: cores.branco,
    fontSize: 15,
    fontWeight: "800",
  },
  botaoSecundario: {
    flex: 1,
    minHeight: 48,
    backgroundColor: cores.fundoSuave,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  botaoSecundarioTexto: {
    color: cores.texto,
    fontSize: 15,
    fontWeight: "800",
  },
  botaoDesativado: {
    opacity: 0.45,
  },
  resumoTitulo: {
    color: cores.texto,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  resumoPlacar: {
    color: cores.azulEscuro,
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  resumoXp: {
    color: cores.verdeMusgo,
    fontSize: 15,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 6,
  },
  resumoTexto: {
    color: cores.textoSuave,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
    textAlign: "center",
  },
});
