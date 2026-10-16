/*
 * Icone.js
 *
 * Ícone de linha (biblioteca @expo/vector-icons, conjunto "Ionicons").
 * Substitui os emojis do app para a interface ficar mais limpa e igual em
 * qualquer aparelho (emojis mudam de desenho entre Android, iPhone e navegador).
 *
 * Uso: <Icone nome="trophy" tamanho={22} cor={cores.azulEscuro} />
 * Lista de nomes: https://icons.expo.fyi (conjunto Ionicons).
 * Se um nome não existir, nada é desenhado (não dá erro na tela).
 */
import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cores } from "./theme";

export default function Icone({ nome, tamanho = 20, cor = cores.texto, style }) {
  const existe = Ionicons && Ionicons.glyphMap && Ionicons.glyphMap[nome];
  if (!existe) return <View style={[{ width: tamanho, height: tamanho }, style]} />;
  return (
    <Ionicons
      name={nome}
      size={tamanho}
      color={cor}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
