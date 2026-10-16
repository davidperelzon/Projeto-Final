/*
 * BarraNavegacao.js
 *
 * Barra de navegação inferior (celular e computador) com as áreas
 * principais do app. A aba atual fica destacada com cor, sublinhado E
 * texto em negrito (não depende só de cor).
 *
 * Para acrescentar uma aba: inclua um item em ABAS e trate o novo `id`
 * em App.js (variável `tela`).
 */
import React from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { cores } from "./theme";
import Icone from "./Icone";

export const ABAS = [
  { id: "trilha", titulo: "Trilha", icone: "map-outline", iconeAtivo: "map" },
  { id: "estudar", titulo: "Estudar", icone: "book-outline", iconeAtivo: "book" },
  { id: "pratica", titulo: "Praticar", icone: "flash-outline", iconeAtivo: "flash" },
  { id: "israel", titulo: "Israel", icone: "flag-outline", iconeAtivo: "flag" },
  { id: "perfil", titulo: "Perfil", icone: "person-outline", iconeAtivo: "person" },
];

export default function BarraNavegacao({ atual, aoMudar }) {
  return (
    <View style={styles.barra} accessibilityRole="tablist">
      <View style={styles.interno}>
        {ABAS.map((aba) => {
          const ativa = aba.id === atual;
          return (
            <TouchableOpacity
              key={aba.id}
              style={styles.aba}
              onPress={() => aoMudar(aba.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected: ativa }}
              accessibilityLabel={`${aba.titulo}${ativa ? ", aba atual" : ""}`}
            >
              <Icone nome={ativa ? aba.iconeAtivo : aba.icone} tamanho={24} cor={ativa ? cores.azulEscuro : cores.textoSuave} />
              <Text style={[styles.titulo, ativa && styles.tituloAtivo]}>{aba.titulo}</Text>
              <View style={[styles.sublinhado, ativa && styles.sublinhadoAtivo]} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    backgroundColor: cores.branco,
    borderTopWidth: 1,
    borderTopColor: cores.bordaSuave,
    paddingBottom: Platform.OS === "android" ? 16 : Platform.OS === "ios" ? 18 : 0,
  },
  interno: { flexDirection: "row", width: "100%", maxWidth: 760, alignSelf: "center" },
  aba: { flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", paddingTop: 6 },
  icone: { fontSize: 20 },
  titulo: { color: cores.textoSuave, fontSize: 12, fontWeight: "700", marginTop: 2 },
  tituloAtivo: { color: cores.azulEscuro, fontWeight: "800" },
  sublinhado: { height: 3, width: 28, borderRadius: 2, marginTop: 4, backgroundColor: "transparent" },
  sublinhadoAtivo: { backgroundColor: cores.laranja },
});
