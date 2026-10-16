/*
 * Creditos.js
 *
 * Linha discreta com os criadores do projeto. Usada no rodapé da Home e
 * na tela de login. Os nomes ficam em UM só lugar (CRIADORES).
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { cores } from "./theme";

export const CRIADORES = ["David Perelzon", "Lucas Lemos", "Breno Wajsfeld"];

export default function Creditos() {
  return (
    <View
      style={estilos.caixa}
      accessible
      accessibilityLabel={`Criado por ${CRIADORES.join(", ")}`}
    >
      <Text style={estilos.rotulo}>Criado por</Text>
      <Text style={estilos.nomes}>{CRIADORES.join(" • ")}</Text>
    </View>
  );
}

const estilos = StyleSheet.create({
  caixa: { alignItems: "center", paddingVertical: 18, paddingHorizontal: 12 },
  rotulo: { color: cores.textoSuave, fontSize: 12, fontWeight: "700" },
  nomes: { color: cores.azulEscuro, fontSize: 13, fontWeight: "800", marginTop: 2, textAlign: "center" },
});
