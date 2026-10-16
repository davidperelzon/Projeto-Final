/*
 * Israel.js
 *
 * Aba "Israel": contexto cultural para quem estuda hebraico.
 *   1. Foto de abertura e a bandeira.
 *   2. "Sua viagem": quatro cidades, uma por nível. A cidade do nível seguinte
 *      só abre depois de passar na prova do nível anterior (ProvaNivel.js).
 *   3. Detalhe da cidade escolhida: foto, nome em hebraico com áudio, texto,
 *      link para o mapa online e para vídeos.
 *   4. Mapa esquemático: pontos nas COORDENADAS REAIS das cidades (sem
 *      fronteiras), com a linha da viagem.
 *   5. Personalidades históricas, com foto e fontes.
 *
 * Fotos: fotos.js (Wikimedia Commons, com crédito). Textos: dadosIsrael.js.
 */

import React, { useState } from "react";
import { Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import BotaoAudio from "./BotaoAudio";
import Foto from "./Foto";
import Icone from "./Icone";
import Logo from "./Logo";
import { cores } from "./theme";
import { AREA_MAPA, CIDADE_POR_NIVEL, LUGARES, PERSONALIDADES } from "./dadosIsrael";
import { FOTOS, creditoFoto } from "./fotos";
import { nivelDoUsuario } from "./niveis";
import { BUSCAS, abrirVideos } from "./videos";

// Paradas da viagem, na ordem dos níveis.
const PARADAS = [1, 2, 3, 4].map((nivelId) => ({ nivelId, lugarId: CIDADE_POR_NIVEL[nivelId] }));

// Bandeira de Israel desenhada com formas simples (sem imagem externa).
function Bandeira({ largura = 64 }) {
  const altura = Math.round(largura * 0.72);
  const faixa = Math.round(altura * 0.13);
  return (
    <View
      style={[styles.bandeira, { width: largura, height: altura }]}
      accessibilityRole="image"
      accessibilityLabel="Bandeira de Israel"
    >
      <View style={[styles.faixa, { top: faixa, height: faixa }]} />
      <View style={[styles.faixa, { bottom: faixa, height: faixa }]} />
      <Text style={[styles.estrela, { fontSize: altura * 0.42 }]}>✡</Text>
    </View>
  );
}

// Posição de um lugar no mapa, em % (0 a 100).
function posicao(lugar) {
  const { latMin, latMax, lonMin, lonMax } = AREA_MAPA;
  return {
    x: ((lugar.lon - lonMin) / (lonMax - lonMin)) * 100,
    y: ((latMax - lugar.lat) / (latMax - latMin)) * 100,
  };
}

// 1° de longitude vale ~cos(31°) de 1° de latitude: define a proporção da caixa.
const PROPORCAO_MAPA =
  ((AREA_MAPA.lonMax - AREA_MAPA.lonMin) * Math.cos((31 * Math.PI) / 180)) / (AREA_MAPA.latMax - AREA_MAPA.latMin);

function abrirNoMapa(lugar) {
  const url = `https://www.openstreetmap.org/?mlat=${lugar.lat}&mlon=${lugar.lon}#map=11/${lugar.lat}/${lugar.lon}`;
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  Linking.openURL(url).catch(() => {});
}

export default function Israel({ usuario, lugarInicial, aoPraticar }) {
  const [lugarId, setLugarId] = useState(lugarInicial || "jerusalem");
  const [caixaMapa, setCaixaMapa] = useState({ largura: 0, altura: 0 });

  const lugar = LUGARES.find((item) => item.id === lugarId) || LUGARES[0];
  const nivelAluno = usuario ? nivelDoUsuario(usuario).id : 1;
  const parada = PARADAS.find((p) => p.lugarId === lugar.id);
  const trancado = (id) => {
    const p = PARADAS.find((item) => item.lugarId === id);
    return !!p && p.nivelId > nivelAluno;
  };
  const visitadas = PARADAS.filter((p) => p.nivelId <= nivelAluno).length;
  const lugarTrancado = trancado(lugar.id);

  // Linha da viagem no mapa (em pixels, depois que a caixa for medida).
  const linhas = [];
  if (caixaMapa.largura > 0) {
    const pontos = PARADAS.map((p) => {
      const l = LUGARES.find((item) => item.id === p.lugarId);
      const pos = posicao(l);
      return { x: (pos.x / 100) * caixaMapa.largura, y: (pos.y / 100) * caixaMapa.altura, nivelId: p.nivelId };
    });
    for (let i = 0; i < pontos.length - 1; i++) {
      const a = pontos[i];
      const b = pontos[i + 1];
      linhas.push({
        meioX: (a.x + b.x) / 2,
        meioY: (a.y + b.y) / 2,
        tamanho: Math.hypot(b.x - a.x, b.y - a.y),
        angulo: Math.atan2(b.y - a.y, b.x - a.x),
        feito: b.nivelId <= nivelAluno,
      });
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      <View style={styles.header}>
        <View style={styles.headerTextos}>
          <Text style={styles.titulo} accessibilityRole="header">Israel</Text>
          <Text style={styles.apoio}>Sua viagem: {visitadas} de {PARADAS.length} paradas</Text>
        </View>
        <Logo largura={52} />
      </View>

      {/* Abertura com foto */}
      <View style={styles.cartaoSemPadding}>
        <Foto id="jerusalem" largura={960} style={styles.hero} descricao={FOTOS.jerusalem.legenda}>
          <View style={styles.heroFaixa}>
            <View style={styles.heroTextos}>
              <Text style={styles.heroTitulo}>ישראל · Israel</Text>
              <Text style={styles.heroTexto}>O país onde o hebraico voltou a ser falado no dia a dia.</Text>
            </View>
            <Bandeira />
          </View>
        </Foto>
        <Text style={styles.credito}>{creditoFoto("jerusalem")}</Text>
        <Text style={[styles.texto, styles.paddingTexto]}>
          Fica no Oriente Médio, no mar Mediterrâneo. Estado proclamado em 14 de maio de 1948.
        </Text>
        <View style={styles.linhaAcoes}>
          <BotaoAudio texto="ישראל" rotulo="Ouvir a palavra Israel em hebraico" />
          <TouchableOpacity style={styles.botaoSecundario} onPress={() => abrirVideos(BUSCAS.israel)} accessibilityRole="link" accessibilityLabel="Ver vídeos sobre Israel no YouTube">
            <Icone nome="play-circle-outline" tamanho={20} cor={cores.azulEscuro} />
            <Text style={styles.botaoSecundarioTexto}>Vídeos sobre Israel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Viagem */}
      <Text style={styles.secao}>Sua viagem</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carrossel}>
        {PARADAS.map((p) => {
          const item = LUGARES.find((l) => l.id === p.lugarId);
          const bloqueada = p.nivelId > nivelAluno;
          const selecionada = item.id === lugar.id;
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.cidadeCard, selecionada && styles.cidadeCardAtiva]}
              onPress={() => setLugarId(item.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionada }}
              accessibilityLabel={`Parada ${p.nivelId}: ${item.nome}${bloqueada ? ", trancada" : ""}`}
            >
              <Foto id={item.id} largura={500} style={styles.cidadeFoto}>
                {bloqueada ? (
                  <View style={styles.cidadeTrava}>
                    <Icone nome="lock-closed" tamanho={22} cor={cores.branco} />
                  </View>
                ) : null}
              </Foto>
              <Text style={styles.cidadeNome} numberOfLines={1}>{p.nivelId}. {item.nome}</Text>
              <Text style={styles.cidadeHeb}>{item.heb}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Detalhe do lugar escolhido */}
      <View style={styles.cartao}>
        {FOTOS[lugar.id] ? (
          <>
            <Foto id={lugar.id} largura={960} style={styles.fotoLugar}>
              {lugarTrancado ? (
                <View style={styles.fotoTrava}>
                  <Icone nome="lock-closed" tamanho={30} cor={cores.branco} />
                </View>
              ) : null}
            </Foto>
            <Text style={styles.credito}>{creditoFoto(lugar.id)}</Text>
          </>
        ) : null}
        <Text style={styles.detalheNome}>{lugar.nome}</Text>
        <Text style={styles.detalheHeb}>{lugar.heb}</Text>
        <Text style={styles.detalheTranslit}>{lugar.translit}</Text>
        {parada ? (
          <Text style={styles.paradaTag}>
            Parada {parada.nivelId} da viagem ·{" "}
            {lugarTrancado ? `passe na prova do nível ${parada.nivelId - 1} para chegar aqui` : "você já chegou"}
          </Text>
        ) : null}
        <Text style={styles.texto}>
          {lugarTrancado ? "Conclua o nível anterior e passe na prova para conhecer esta cidade." : lugar.texto}
        </Text>
        <View style={styles.linhaAcoes}>
          <BotaoAudio key={lugar.id} texto={lugar.heb} rotulo={`Ouvir ${lugar.nome} em hebraico`} />
          <TouchableOpacity style={styles.botaoSecundario} onPress={() => abrirNoMapa(lugar)} accessibilityRole="link" accessibilityLabel={`Abrir ${lugar.nome} no mapa online`}>
            <Icone nome="map-outline" tamanho={20} cor={cores.azulEscuro} />
            <Text style={styles.botaoSecundarioTexto}>Abrir no mapa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoSecundario} onPress={() => abrirVideos(`${lugar.nome} Israel`)} accessibilityRole="link" accessibilityLabel={`Ver vídeos sobre ${lugar.nome} no YouTube`}>
            <Icone nome="play-circle-outline" tamanho={20} cor={cores.azulEscuro} />
            <Text style={styles.botaoSecundarioTexto}>Vídeos</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Mapa esquemático */}
      <View style={styles.cartao}>
        <Text style={styles.secaoInterna}>Mapa</Text>
        <Text style={styles.apoio}>Posições reais das cidades. Mapa esquemático, sem fronteiras.</Text>
        <View style={styles.mapaLinha}>
          <View
            style={[styles.mapa, { aspectRatio: PROPORCAO_MAPA }]}
            accessibilityLabel="Mapa esquemático de Israel"
            onLayout={(e) => setCaixaMapa({ largura: e.nativeEvent.layout.width, altura: e.nativeEvent.layout.height })}
          >
            {linhas.map((l, i) => (
              <View
                key={`rota${i}`}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  left: l.meioX - l.tamanho / 2,
                  top: l.meioY - 2,
                  width: l.tamanho,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: l.feito ? cores.laranja : cores.bordaSuave,
                  transform: [{ rotate: `${l.angulo}rad` }],
                }}
              />
            ))}
            {LUGARES.map((item) => {
              const pos = posicao(item);
              const selecionado = item.id === lugar.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.pontoArea, { left: `${pos.x}%`, top: `${pos.y}%` }]}
                  onPress={() => setLugarId(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selecionado }}
                  accessibilityLabel={`${item.nome}${selecionado ? ", selecionado" : ""}`}
                >
                  <View
                    style={[
                      styles.ponto,
                      item.tipo === "agua" ? styles.pontoAgua : styles.pontoCidade,
                      trancado(item.id) && styles.pontoTrancado,
                      selecionado && styles.pontoSelecionado,
                    ]}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={styles.listaLugares}>
            {LUGARES.map((item) => {
              const selecionado = item.id === lugar.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.itemLugar, selecionado && styles.itemLugarAtivo]}
                  onPress={() => setLugarId(item.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selecionado }}
                >
                  <Icone
                    nome={trancado(item.id) ? "lock-closed" : item.tipo === "agua" ? "water" : "location"}
                    tamanho={15}
                    cor={selecionado ? cores.branco : cores.azulMedio}
                  />
                  <Text style={[styles.itemLugarTexto, selecionado && styles.itemLugarTextoAtivo]} numberOfLines={1}>
                    {item.nome}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      {/* Personalidades: só foto e nome. O que cada uma fez se aprende nos quizzes. */}
      <Text style={styles.secao}>Personalidades</Text>
      <View style={styles.gradePessoas}>
        {PERSONALIDADES.map((pessoa) => (
          <View key={pessoa.id} style={styles.pessoaCard}>
            <Foto id={pessoa.id} largura={500} style={styles.pessoaFoto} descricao={`Retrato de ${pessoa.nome}`} />
            <Text style={styles.pessoaNome} numberOfLines={2}>{pessoa.nome}</Text>
            <Text style={styles.pessoaPeriodo}>{pessoa.periodo}</Text>
            <View style={styles.pessoaHebLinha}>
              <Text style={styles.pessoaHeb} numberOfLines={1}>{pessoa.heb}</Text>
              <BotaoAudio texto={pessoa.heb} rotulo={`Ouvir o nome ${pessoa.nome} em hebraico`} variante="pequena" />
            </View>
            <Text style={styles.credito}>{creditoFoto(pessoa.id)}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.botaoQuiz} onPress={() => aoPraticar && aoPraticar()} accessibilityRole="button" accessibilityLabel="Fazer o quiz sobre Israel">
        <Icone nome="earth" tamanho={22} cor={cores.branco} />
        <Text style={styles.botaoQuizTexto}>Quiz: quem é quem?</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: cores.fundoTela },
  conteudo: { width: "100%", maxWidth: 760, alignSelf: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 },
  headerTextos: { flex: 1 },
  titulo: { color: cores.texto, fontSize: 26, fontWeight: "900" },
  apoio: { color: cores.textoSuave, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  secao: { color: cores.texto, fontSize: 19, fontWeight: "800", marginTop: 6, marginBottom: 10 },
  secaoInterna: { color: cores.texto, fontSize: 18, fontWeight: "800", marginBottom: 2 },
  cartao: { backgroundColor: cores.branco, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: cores.bordaSuave, marginBottom: 16, gap: 6 },
  cartaoSemPadding: { backgroundColor: cores.branco, borderRadius: 20, borderWidth: 1, borderColor: cores.bordaSuave, marginBottom: 16, overflow: "hidden", paddingBottom: 14 },
  paddingTexto: { paddingHorizontal: 16 },
  hero: { height: 200, alignSelf: "stretch", justifyContent: "flex-end" },
  heroFaixa: { alignSelf: "stretch", flexDirection: "row", alignItems: "center", gap: 12, padding: 14, backgroundColor: "rgba(31, 78, 140, 0.82)" },
  heroTextos: { flex: 1 },
  heroTitulo: { color: cores.branco, fontSize: 22, fontWeight: "900" },
  heroTexto: { color: cores.branco, fontSize: 13, fontWeight: "700", marginTop: 2, lineHeight: 18 },
  credito: { color: cores.textoSuave, fontSize: 9, fontWeight: "700", paddingHorizontal: 4, marginTop: 4, marginBottom: 2 },
  texto: { color: cores.texto, fontSize: 14, lineHeight: 21, fontWeight: "600" },
  linhaAcoes: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10, paddingHorizontal: 16, marginTop: 8 },
  botaoSecundario: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1, borderColor: cores.azulClaro, backgroundColor: cores.branco },
  botaoSecundarioTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
  bandeira: { backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.azulClaro, borderRadius: 4, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  faixa: { position: "absolute", left: 0, right: 0, backgroundColor: cores.azulMedio },
  estrela: { color: cores.azulMedio, fontWeight: "700" },
  carrossel: { gap: 12, paddingBottom: 12, paddingRight: 4 },
  cidadeCard: { width: 156, backgroundColor: cores.branco, borderRadius: 16, borderWidth: 2, borderColor: cores.bordaSuave, padding: 6, gap: 4 },
  cidadeCardAtiva: { borderColor: cores.laranja },
  cidadeFoto: { height: 92, borderRadius: 11 },
  cidadeTrava: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31, 78, 140, 0.72)", alignItems: "center", justifyContent: "center" },
  cidadeNome: { color: cores.texto, fontSize: 13, fontWeight: "800", paddingHorizontal: 4 },
  cidadeHeb: { color: cores.azulEscuro, fontSize: 16, fontWeight: "800", writingDirection: "rtl", textAlign: "left", paddingHorizontal: 4 },
  fotoLugar: { height: 190, borderRadius: 14, alignSelf: "stretch" },
  fotoTrava: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(31, 78, 140, 0.72)", alignItems: "center", justifyContent: "center" },
  detalheNome: { color: cores.texto, fontSize: 20, fontWeight: "900", marginTop: 4 },
  detalheHeb: { color: cores.azulEscuro, fontSize: 30, fontWeight: "800", writingDirection: "rtl", textAlign: "left" },
  detalheTranslit: { color: cores.textoSuave, fontSize: 13, fontWeight: "800" },
  paradaTag: { color: cores.azulMedio, fontSize: 12, fontWeight: "800" },
  mapaLinha: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 8 },
  mapa: { width: "36%", maxWidth: 180, backgroundColor: cores.fundoSuave, borderWidth: 1, borderColor: cores.bordaSuave, borderRadius: 14, position: "relative" },
  pontoArea: { position: "absolute", width: 36, height: 36, marginLeft: -18, marginTop: -18, alignItems: "center", justifyContent: "center" },
  ponto: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: cores.branco },
  pontoCidade: { backgroundColor: cores.azulEscuro },
  pontoAgua: { backgroundColor: cores.azulClaro },
  pontoTrancado: { backgroundColor: cores.cinza },
  pontoSelecionado: { width: 18, height: 18, borderRadius: 9, backgroundColor: cores.laranja, borderColor: cores.azulEscuro },
  listaLugares: { flex: 1, gap: 6 },
  itemLugar: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: cores.bordaSuave, backgroundColor: cores.branco },
  itemLugarAtivo: { backgroundColor: cores.azulEscuro, borderColor: cores.azulEscuro },
  itemLugarTexto: { flex: 1, color: cores.texto, fontSize: 13, fontWeight: "800" },
  itemLugarTextoAtivo: { color: cores.branco },
  gradePessoas: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 12 },
  pessoaCard: { flexGrow: 1, flexBasis: 150, backgroundColor: cores.branco, borderRadius: 16, borderWidth: 1, borderColor: cores.bordaSuave, padding: 8, gap: 2 },
  pessoaFoto: { height: 150, borderRadius: 11, alignSelf: "stretch" },
  pessoaHebLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 2 },
  pessoaHeb: { flex: 1, color: cores.azulEscuro, fontSize: 18, fontWeight: "800", writingDirection: "rtl", textAlign: "left" },
  botaoQuiz: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: cores.azulEscuro, borderRadius: 14, marginBottom: 12 },
  botaoQuizTexto: { color: cores.branco, fontWeight: "800", fontSize: 15 },
  pessoa: { borderTopWidth: 1, borderTopColor: cores.bordaSuave, paddingVertical: 4, marginTop: 8 },
  pessoaTopo: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 72, paddingVertical: 8 },
  retrato: { width: 60, height: 72, borderRadius: 10 },
  pessoaTextos: { flex: 1 },
  pessoaNome: { color: cores.texto, fontSize: 15, fontWeight: "800", marginTop: 4 },
  pessoaPeriodo: { color: cores.azulMedio, fontSize: 12, fontWeight: "800" },
  pessoaResumo: { color: cores.textoSuave, fontSize: 12, fontWeight: "700", marginTop: 2, lineHeight: 17 },
  pessoaDetalhe: { paddingBottom: 12, gap: 4 },
  fotoPessoa: { height: 220, borderRadius: 14, alignSelf: "stretch" },
  nomeHebLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  nomeHeb: { color: cores.azulEscuro, fontSize: 28, fontWeight: "800", writingDirection: "rtl" },
  rotuloSecao: { color: cores.azulMedio, fontSize: 11, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", marginTop: 8 },
  lerMais: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center" },
  lerMaisTexto: { color: cores.azulMedio, fontWeight: "800", fontSize: 14, textDecorationLine: "underline" },
  fontes: { color: cores.textoSuave, fontSize: 11, fontWeight: "700", marginTop: 10, lineHeight: 16 },
});
