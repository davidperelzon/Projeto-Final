/*
 * CabecalhoFoto.js
 *
 * Faixa de topo com foto e título curto por cima. Usada em Estudar, Praticar e
 * Perfil para a tela ter imagem em vez de só texto.
 * Props: foto (chave de fotos.js), titulo, subtitulo (opcional)
 */
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Foto from "./Foto";
import { cores } from "./theme";

export default function CabecalhoFoto({ foto, titulo, subtitulo }) {
  return (
    <Foto id={foto} largura={800} style={styles.foto}>
      <View style={styles.faixa}>
        <Text style={styles.titulo} accessibilityRole="header">{titulo}</Text>
        {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
      </View>
    </Foto>
  );
}

const styles = StyleSheet.create({
  foto: { height: 112, borderRadius: 18, alignSelf: "stretch", justifyContent: "flex-end", marginBottom: 14 },
  faixa: { alignSelf: "stretch", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "rgba(31, 78, 140, 0.8)" },
  titulo: { color: cores.branco, fontSize: 22, fontWeight: "900" },
  subtitulo: { color: cores.branco, fontSize: 12, fontWeight: "700", marginTop: 1 },
});
