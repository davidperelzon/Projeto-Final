/*
 * Foto.js
 *
 * Mostra uma foto de fotos.js, com bloco de cor enquanto carrega e se falhar
 * (sem internet ou arquivo indisponível). O crédito fica em `creditoFoto(id)`
 * e deve ser exibido perto da foto quando houver espaço.
 *
 * Props: id (chave de FOTOS), largura (pixels pedidos ao servidor; padrão 800),
 *        style (tamanho e bordas), descricao (texto para leitor de tela)
 */
import React, { useState } from "react";
import { Image, View } from "react-native";
import { cores } from "./theme";
import { FOTOS, urlFoto } from "./fotos";
import Icone from "./Icone";

export default function Foto({ id, largura = 800, style, descricao, children }) {
  const [falhou, setFalhou] = useState(false);
  const uri = urlFoto(id, largura);
  const info = FOTOS[id];

  return (
    <View
      style={[{ backgroundColor: cores.fundoSuave, overflow: "hidden", alignItems: "center", justifyContent: "center" }, style]}
      accessibilityRole="image"
      accessibilityLabel={descricao || (info && info.legenda) || "Foto"}
    >
      {uri && !falhou ? (
        <Image
          source={{ uri }}
          resizeMode="cover"
          onError={() => setFalhou(true)}
          style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0, width: "100%", height: "100%" }}
        />
      ) : (
        <Icone nome="image-outline" tamanho={28} cor={cores.cinza} />
      )}
      {children}
    </View>
  );
}
