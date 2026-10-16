/*
 * MapaProgressao.js
 *
 * Tela "Sua trilha": o caminho visual de aprendizagem. Cada etapa é uma
 * parte REAL do conteúdo (alfabeto, lições e missões de cada nível) e os
 * estados vêm de progressao.js, a mesma fonte usada na Home.
 *
 * Estados (nunca só por cor: cada um tem ícone + texto):
 *   ✓ Concluída  |  ● Você está aqui  |  Disponível  |  🔒 Bloqueada
 *
 * É a TELA INICIAL do app (estilo trilha de aprendizagem): barra de topo
 * enxuta (sequência, XP, meta do dia), o caminho com as etapas e um botão
 * flutuante "Continuar". Nada mais compete pela atenção.
 *
 * Props:
 *   usuario       -> { nome, xp, feitos, nivelLiberado }
 *   sequencia     -> dias seguidos estudando (progresso.js)
 *   xpHoje        -> XP ganho hoje
 *   onAbrirAcao   -> recebe a `acao` da etapa (estudo, missões, lição, prova, pratica)
 *   onAbrirIsrael -> (lugarId) abre a aba Israel na cidade da unidade
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import Logo from "./Logo";
import { cores } from "./theme";
import { ESTADOS, ROTULO_ESTADO, montarTrilha } from "./progressao";
import { RAIO_NO, calcularLayout } from "./geometriaTrilha";
import { LUGARES } from "./dadosIsrael";
import Icone from "./Icone";
import Foto from "./Foto";
import { META_DIARIA_XP } from "./progresso";

const FUNDO_MAPA = "#EBF2FA"; // = fundoTela (azul claro 14%) sobre branco, mas sólido
const LARGURA_MAXIMA = 560; // no computador o mapa não estica demais
const ESPESSURA_CAMINHO = 10;
// (O espaço da barra de status do celular já é dado por App.js.)

// Ícone de cada tipo de etapa (nomes do conjunto Ionicons). O alfabeto usa a letra Alef.
const ICONE_TIPO = { alfabeto: null, licao: "book", missoes: "create", prova: "trophy", treino: "barbell", cultura: "earth" };
const NOME_TIPO = { alfabeto: "Alfabeto", licao: "Lição", missoes: "Missões", prova: "Prova", treino: "Treino", cultura: "Cultura" };

function usarMovimentoReduzido() {
  const [reduzido, setReduzido] = useState(false);
  useEffect(() => {
    let ativo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((valor) => ativo && setReduzido(!!valor))
      .catch(() => {});
    const assinatura = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduzido);
    return () => {
      ativo = false;
      if (assinatura && assinatura.remove) assinatura.remove();
    };
  }, []);
  return reduzido;
}

// Anel que "respira" ao redor da etapa atual (desligado com movimento reduzido).
function AnelAtual({ reduzido }) {
  const escala = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduzido) {
      escala.setValue(1);
      return undefined;
    }
    const animacao = Animated.loop(
      Animated.sequence([
        Animated.timing(escala, { toValue: 1.16, duration: 900, useNativeDriver: true }),
        Animated.timing(escala, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    animacao.start();
    return () => animacao.stop();
  }, [reduzido, escala]);
  return <Animated.View pointerEvents="none" style={[estilos.anelAtual, { transform: [{ scale: escala }] }]} />;
}

// Desenha o símbolo dentro do círculo da etapa: check, cadeado, letra ou ícone.
function SimboloDoNo({ no }) {
  const claro = no.estado === ESTADOS.CONCLUIDO || no.estado === ESTADOS.ATUAL;
  const cor = claro ? cores.branco : cores.azulEscuro;
  if (no.estado === ESTADOS.CONCLUIDO) return <Icone nome="checkmark" tamanho={30} cor={cor} />;
  if (no.estado === ESTADOS.BLOQUEADO) return <Icone nome="lock-closed" tamanho={24} cor={cores.cinza} />;
  const nome = ICONE_TIPO[no.tipo];
  if (!nome) return <Text style={[estilos.noSimbolo, claro ? estilos.noSimboloClaro : null]}>א</Text>;
  return <Icone nome={nome} tamanho={28} cor={cor} />;
}

function Etapa({ item, reduzido, aoTocar }) {
  const { no } = item;
  const estilosNo = {
    concluido: estilos.noConcluido,
    atual: estilos.noAtual,
    disponivel: estilos.noDisponivel,
    bloqueado: estilos.noBloqueado,
  }[no.estado];
  const rotuloTag = `${no.estado === ESTADOS.CONCLUIDO ? "✓ " : no.estado === ESTADOS.ATUAL ? "● " : no.estado === ESTADOS.BLOQUEADO ? "" : ""}${ROTULO_ESTADO[no.estado]}`;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={{ position: "absolute", left: item.x - RAIO_NO, top: item.y - RAIO_NO, width: RAIO_NO * 2, height: RAIO_NO * 2 }}
      >
        {no.estado === ESTADOS.ATUAL ? <AnelAtual reduzido={reduzido} /> : null}
        <TouchableOpacity
          onPress={() => aoTocar(no)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={`${NOME_TIPO[no.tipo]}: ${no.titulo}. ${ROTULO_ESTADO[no.estado]}. ${no.subtitulo}`}
          accessibilityHint="Abre os detalhes da etapa"
          style={[estilos.no, estilosNo]}
        >
          <SimboloDoNo no={no} />
        </TouchableOpacity>
      </View>

      <View
        pointerEvents="none"
        style={{ position: "absolute", left: item.x - item.larguraRotulo / 2, top: item.y + RAIO_NO + 4, width: item.larguraRotulo, alignItems: "center" }}
      >
        {/* Fundo sólido: o caminho passa POR TRÁS do nome, sem cortar o texto */}
        <View style={estilos.rotuloCaixa}>
          <Text style={[estilos.rotuloTitulo, no.estado === ESTADOS.BLOQUEADO && estilos.rotuloBloqueado]} numberOfLines={2}>
            {no.titulo}
          </Text>
          <Text
            style={[
              estilos.rotuloEstado,
              no.estado === ESTADOS.CONCLUIDO && estilos.rotuloEstadoOk,
              no.estado === ESTADOS.ATUAL && estilos.rotuloEstadoAtual,
              no.estado === ESTADOS.BLOQUEADO && estilos.rotuloBloqueado,
            ]}
          >
            {rotuloTag}
          </Text>
        </View>
      </View>
    </>
  );
}

function FaixaUnidade({ item, largura, aoAbrirCidade }) {
  const { unidade } = item;
  const cidade = LUGARES.find((l) => l.id === unidade.cidadeId);
  const larguraFaixa = Math.min(largura - 24, 340);
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => aoAbrirCidade && cidade && aoAbrirCidade(cidade.id)}
      accessibilityRole="button"
      accessibilityHint="Abre esta cidade no mapa de Israel"
      accessibilityLabel={`Unidade ${unidade.nivel.id}, ${unidade.nivel.nome}. ${
        unidade.bloqueada ? "Bloqueada." : `${unidade.concluidas} de ${unidade.total} etapas concluídas.`
      }${cidade ? ` Cidade da unidade: ${cidade.nome}.` : ""}`}
      style={[
        estilos.faixa,
        unidade.bloqueada ? estilos.faixaBloqueada : estilos.faixaAtiva,
        { left: (largura - larguraFaixa) / 2, top: item.y - 36, width: larguraFaixa },
      ]}
    >
      {cidade ? (
        <Foto id={cidade.id} largura={250} style={estilos.faixaFoto} descricao={`Foto de ${cidade.nome}`}>
          {unidade.bloqueada ? (
            <View style={estilos.faixaFotoTrava}>
              <Icone nome="lock-closed" tamanho={18} cor={cores.branco} />
            </View>
          ) : null}
        </Foto>
      ) : null}
      <Text style={[estilos.faixaTitulo, unidade.bloqueada && estilos.faixaTituloBloqueada, { paddingRight: 58 }]} numberOfLines={1}>
        {unidade.completa ? "✓ " : ""}Unidade {unidade.nivel.id} · {unidade.nivel.nome}
      </Text>
      <Text style={[estilos.faixaTexto, unidade.bloqueada && estilos.faixaTextoBloqueada, { paddingRight: 58 }]} numberOfLines={2}>
        {unidade.bloqueada
          ? `Libera com ${unidade.nivel.xpMinimo} XP + prova · faltam ${unidade.falta} XP`
          : `${unidade.concluidas} de ${unidade.total} etapas${cidade ? ` · ${cidade.nome} ${cidade.heb}` : ""}`}
      </Text>
    </TouchableOpacity>
  );
}

export default function MapaProgressao({ usuario, sequencia = 0, xpHoje = 0, onAbrirAcao, onAbrirIsrael }) {
  const trilha = useMemo(
    () => montarTrilha({ xp: usuario.xp, feitos: usuario.feitos, nivelLiberado: usuario.nivelLiberado }),
    [usuario.xp, usuario.feitos, usuario.nivelLiberado]
  );
  const reduzido = usarMovimentoReduzido();
  const [largura, setLargura] = useState(0);
  const [etapaAberta, setEtapaAberta] = useState(null);
  const rolagem = useRef(null);
  const jaRolou = useRef(false);

  const layout = useMemo(
    () => (largura > 0 ? calcularLayout(trilha.unidades, Math.min(largura, LARGURA_MAXIMA)) : null),
    [trilha, largura]
  );

  // Ao abrir, rola até a etapa atual (uma vez só).
  useEffect(() => {
    if (!layout || jaRolou.current || !trilha.atual) return;
    const alvo = layout.nos.find((n) => n.no.id === trilha.atual.id);
    if (alvo && rolagem.current) {
      jaRolou.current = true;
      setTimeout(() => rolagem.current && rolagem.current.scrollTo({ y: Math.max(alvo.y - 220, 0), animated: false }), 60);
    }
  }, [layout, trilha.atual]);

  const abrirEtapa = (no) => setEtapaAberta(no);
  const fechar = () => setEtapaAberta(null);
  const executar = (no) => {
    fechar();
    if (onAbrirAcao) onAbrirAcao(no.acao);
  };

  const { xp, nivel, atual } = trilha;

  return (
    <View style={estilos.raiz}>
      <ScrollView ref={rolagem} style={estilos.rolagem} contentContainerStyle={estilos.conteudo}>
        <View style={estilos.coluna}>
          {/* Barra de topo enxuta: logo, sequência, XP e meta do dia */}
          <View style={estilos.topo}>
            <Logo largura={56} />
            <View style={estilos.chips}>
              <View style={estilos.chip} accessibilityLabel={`Sequência de ${sequencia} dias`}>
                <Icone nome="flame" tamanho={18} cor={cores.laranja} />
                <Text style={estilos.chipTexto}>{sequencia}</Text>
              </View>
              <View style={estilos.chip} accessibilityLabel={`${xp.atual} XP`}>
                <Icone nome="star" tamanho={18} cor={cores.laranja} />
                <Text style={estilos.chipTexto}>{xp.atual}</Text>
              </View>
              <View style={estilos.chip} accessibilityLabel={`Nível ${nivel.nome}`}>
                <Icone nome="ribbon" tamanho={18} cor={cores.azulMedio} />
                <Text style={estilos.chipTexto}>Nv {nivel.id}</Text>
              </View>
            </View>
          </View>
          <View style={estilos.metaLinha}>
            <Text style={estilos.metaTexto}>
              Meta de hoje: {Math.min(xpHoje, META_DIARIA_XP)}/{META_DIARIA_XP} XP{xpHoje >= META_DIARIA_XP ? " ✓" : ""}
            </Text>
            <View
              style={estilos.metaBarra}
              accessibilityRole="progressbar"
              accessibilityLabel={`Meta diária: ${Math.min(xpHoje, META_DIARIA_XP)} de ${META_DIARIA_XP} XP`}
            >
              <View style={[estilos.metaPreenchida, { width: `${Math.min(100, (xpHoje / META_DIARIA_XP) * 100)}%` }]} />
            </View>
          </View>

          {/* Caminho */}
          <View
            style={[estilos.mapa, layout ? { height: layout.altura } : { height: 200 }]}
            onLayout={(e) => setLargura(Math.floor(e.nativeEvent.layout.width))}
          >
            {layout ? (
              <>
                {layout.segmentos.map((s, i) => (
                  <View
                    key={`s${i}`}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: s.x - s.comprimento / 2,
                      top: s.y - ESPESSURA_CAMINHO / 2,
                      width: s.comprimento,
                      height: ESPESSURA_CAMINHO,
                      borderRadius: ESPESSURA_CAMINHO / 2,
                      backgroundColor: s.percorrido ? cores.azulMedio : cores.bordaSuave,
                      transform: [{ rotate: `${s.angulo}rad` }],
                    }}
                  />
                ))}
                {layout.itens.map((item) =>
                  item.tipo === "unidade" ? (
                    <FaixaUnidade key={`u${item.unidade.nivel.id}`} item={item} largura={layout.largura} aoAbrirCidade={onAbrirIsrael} />
                  ) : (
                    <Etapa key={item.no.id} item={item} reduzido={reduzido} aoTocar={abrirEtapa} />
                  )
                )}
              </>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Botão flutuante: a ação principal da tela */}
      {(atual || trilha.sugestao) ? (
        <View style={estilos.flutuante} pointerEvents="box-none">
          <TouchableOpacity
            style={estilos.botaoFlutuante}
            onPress={() => executar(atual || trilha.sugestao)}
            accessibilityRole="button"
            accessibilityLabel={`Continuar: ${(atual || trilha.sugestao).titulo}`}
          >
            <Text style={estilos.botaoFlutuanteTexto} numberOfLines={1}>
              {atual ? `Continuar · ${atual.titulo}` : trilha.sugestao.titulo}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {/* Detalhe da etapa */}
      <Modal visible={!!etapaAberta} transparent animationType={reduzido ? "none" : "slide"} onRequestClose={fechar}>
        <View style={estilos.fundoModal}>
          <TouchableOpacity style={estilos.fundoModalToque} onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar detalhes" />
          {etapaAberta ? (
            <View style={estilos.folha} accessibilityViewIsModal>
              <Text style={estilos.folhaTipo}>{NOME_TIPO[etapaAberta.tipo]} · Nível {etapaAberta.nivelId}</Text>
              <Text style={estilos.folhaTitulo}>{etapaAberta.titulo}</Text>
              <Text style={estilos.folhaEstado}>
                {etapaAberta.estado === ESTADOS.CONCLUIDO ? "✓ " : etapaAberta.estado === ESTADOS.BLOQUEADO ? "" : etapaAberta.estado === ESTADOS.ATUAL ? "● " : ""}
                {ROTULO_ESTADO[etapaAberta.estado]}
              </Text>
              <Text style={estilos.folhaTexto}>{etapaAberta.subtitulo}</Text>
              {etapaAberta.progresso ? (
                <View style={estilos.barraFundo} accessibilityRole="progressbar" accessibilityLabel={`${etapaAberta.progresso.feito} de ${etapaAberta.progresso.total}`}>
                  <View style={[estilos.barraPreenchida, { width: `${(etapaAberta.progresso.feito / etapaAberta.progresso.total) * 100}%` }]} />
                </View>
              ) : null}
              {etapaAberta.xp ? <Text style={estilos.folhaTexto}>Recompensa: +{etapaAberta.xp} XP</Text> : null}

              {etapaAberta.estado === ESTADOS.BLOQUEADO ? (
                <>
                  <Text style={estilos.folhaBloqueio}>{etapaAberta.requisito}</Text>
                  {etapaAberta.tipo === "prova" && !etapaAberta.requisito.startsWith("Alcance") ? (
                    <TouchableOpacity style={estilos.folhaBotao} onPress={() => executar({ acao: { tela: "pratica" } })} accessibilityRole="button">
                      <Text style={estilos.folhaBotaoTexto}>Praticar para ganhar XP</Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              ) : (
                <TouchableOpacity
                  style={estilos.folhaBotao}
                  onPress={() => executar(etapaAberta)}
                  accessibilityRole="button"
                >
                  <Text style={estilos.folhaBotaoTexto}>
                    {etapaAberta.tipo === "prova" ? (etapaAberta.concluido ? "Refazer a prova" : "Fazer a prova") : etapaAberta.estado === ESTADOS.CONCLUIDO ? "Revisar" : etapaAberta.estado === ESTADOS.ATUAL ? "Continuar" : "Começar"}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={estilos.folhaFechar} onPress={fechar} accessibilityRole="button" accessibilityLabel="Fechar">
                <Text style={estilos.folhaFecharTexto}>Fechar</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: cores.branco },
  rolagem: { flex: 1, backgroundColor: FUNDO_MAPA },
  conteudo: { alignItems: "center", paddingTop: 8, paddingBottom: 110, paddingHorizontal: 12 },
  coluna: { width: "100%", maxWidth: LARGURA_MAXIMA },

  topo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  faixaFoto: { position: "absolute", right: 10, top: 10, width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: cores.branco },
  faixaFotoTrava: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, backgroundColor: "rgba(31, 78, 140, 0.7)", alignItems: "center", justifyContent: "center" },
  chips: { flexDirection: "row", gap: 6, flex: 1, flexWrap: "wrap", justifyContent: "flex-end" },
  chip: { minHeight: 40, paddingHorizontal: 10, flexDirection: "row", gap: 6, borderRadius: 20, backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.bordaSuave, alignItems: "center", justifyContent: "center" },
  chipTexto: { color: cores.azulEscuro, fontWeight: "900", fontSize: 14 },
  metaLinha: { marginTop: 8, marginBottom: 6, gap: 6 },
  metaTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: "800" },
  metaBarra: { height: 10, borderRadius: 5, backgroundColor: cores.branco, overflow: "hidden", borderWidth: 1, borderColor: cores.bordaSuave },
  metaPreenchida: { height: "100%", backgroundColor: cores.laranja, borderRadius: 5 },
  flutuante: { position: "absolute", left: 0, right: 0, bottom: 12, alignItems: "center", paddingHorizontal: 16 },
  botaoFlutuante: { minHeight: 54, maxWidth: 420, width: "100%", paddingHorizontal: 20, borderRadius: 27, backgroundColor: cores.azulEscuro, alignItems: "center", justifyContent: "center", borderBottomWidth: 4, borderBottomColor: cores.laranja },
  botaoFlutuanteTexto: { color: cores.branco, fontWeight: "900", fontSize: 16 },
  voltar: { minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 22, backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.bordaSuave },
  voltarTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 15 },
  titulo: { color: cores.azulEscuro, fontSize: 28, fontWeight: "900", marginTop: 8 },
  subtitulo: { color: cores.textoSuave, fontSize: 14, marginTop: 2, marginBottom: 14 },

  resumo: { backgroundColor: cores.azulEscuro, borderRadius: 20, padding: 16, marginBottom: 18 },
  resumoLinha: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  resumoNivel: { color: cores.branco, fontSize: 18, fontWeight: "900", flexShrink: 1 },
  resumoXp: { color: cores.branco, fontSize: 18, fontWeight: "900" },
  resumoTexto: { color: cores.branco, fontSize: 13, marginTop: 8 },
  resumoFim: { color: cores.branco, fontSize: 14, fontWeight: "700", marginTop: 12 },
  barraFundo: { height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.28)", overflow: "hidden" },
  barraPreenchida: { height: "100%", borderRadius: 6, backgroundColor: cores.laranja },
  botaoContinuar: { marginTop: 14, minHeight: 48, borderRadius: 14, backgroundColor: cores.laranja, justifyContent: "center", alignItems: "center", paddingHorizontal: 14 },
  botaoContinuarTexto: { color: cores.azulEscuro, fontSize: 16, fontWeight: "900" },

  mapa: { width: "100%", position: "relative" },
  faixa: { position: "absolute", borderRadius: 18, paddingVertical: 10, paddingHorizontal: 14, minHeight: 72, justifyContent: "center" },
  faixaAtiva: { backgroundColor: cores.azulEscuro },
  faixaBloqueada: { backgroundColor: cores.branco, borderWidth: 2, borderColor: cores.bordaSuave },
  faixaTitulo: { color: cores.branco, fontSize: 16, fontWeight: "900" },
  faixaTituloBloqueada: { color: cores.azulEscuro },
  faixaTexto: { color: cores.branco, fontSize: 12, marginTop: 2 },
  faixaTextoBloqueada: { color: cores.textoSuave },

  no: { width: RAIO_NO * 2, height: RAIO_NO * 2, borderRadius: RAIO_NO, alignItems: "center", justifyContent: "center", borderWidth: 4 },
  noConcluido: { backgroundColor: cores.azulMedio, borderColor: cores.azulEscuro },
  noAtual: { backgroundColor: cores.laranja, borderColor: cores.branco },
  noDisponivel: { backgroundColor: cores.branco, borderColor: cores.azulMedio },
  noBloqueado: { backgroundColor: "#E3E8F1", borderColor: cores.cinza },
  noSimbolo: { fontSize: 24, color: cores.azulEscuro, fontWeight: "900" },
  noSimboloClaro: { color: cores.branco },
  anelAtual: { position: "absolute", left: -8, top: -8, right: -8, bottom: -8, borderRadius: RAIO_NO + 8, borderWidth: 3, borderColor: cores.laranja, opacity: 0.55 },

  rotuloCaixa: { backgroundColor: FUNDO_MAPA, borderRadius: 10, paddingHorizontal: 6, paddingVertical: 3, alignItems: "center", maxWidth: "100%" },
  rotuloTitulo: { color: cores.azulEscuro, fontSize: 13, fontWeight: "800", textAlign: "center" },
  rotuloEstado: { color: cores.textoSuave, fontSize: 11, fontWeight: "800", marginTop: 2, textAlign: "center" },
  rotuloEstadoOk: { color: cores.verdeMusgo },
  rotuloEstadoAtual: { color: "#9A4F00" },
  rotuloBloqueado: { color: "#5C6B8A" },

  fundoModal: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(31,78,140,0.45)" },
  fundoModalToque: { flex: 1 },
  folha: { width: "100%", maxWidth: LARGURA_MAXIMA, alignSelf: "center", backgroundColor: cores.branco, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 28 },
  folhaTipo: { color: cores.textoSuave, fontSize: 12, fontWeight: "800", textTransform: "uppercase" },
  folhaTitulo: { color: cores.azulEscuro, fontSize: 22, fontWeight: "900", marginTop: 4 },
  folhaEstado: { color: cores.azulEscuro, fontSize: 14, fontWeight: "800", marginTop: 6 },
  folhaTexto: { color: cores.textoSuave, fontSize: 14, marginTop: 8 },
  folhaBloqueio: { color: cores.azulEscuro, backgroundColor: cores.fundoSuave, borderRadius: 12, padding: 12, fontSize: 14, fontWeight: "700", marginTop: 14 },
  folhaBotao: { marginTop: 16, minHeight: 50, borderRadius: 14, backgroundColor: cores.laranja, justifyContent: "center", alignItems: "center" },
  folhaBotaoTexto: { color: cores.azulEscuro, fontSize: 17, fontWeight: "900" },
  folhaFechar: { marginTop: 8, minHeight: 44, justifyContent: "center", alignItems: "center" },
  folhaFecharTexto: { color: cores.textoSuave, fontSize: 15, fontWeight: "800" },
});
