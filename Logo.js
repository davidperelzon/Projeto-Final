/*
 * Logo.js
 *
 * Mostra a logo oficial do Nativ Ivrit (arquivo assets/logo-hd.png, o
 * mesmo desenho do logo.png original, em resolução maior: 596 x 471).
 * A altura é calculada a partir da largura (596 / 471) para a logo NUNCA
 * ficar distorcida. Não use só `aspectRatio`: no navegador a imagem ficava
 * com a altura original e esticava o cabeçalho.
 *
 * Props:
 *   largura -> largura em pixels (padrão 150). A altura é calculada sozinha.
 */
import React from "react";
import { Image } from "react-native";

const PROPORCAO_LOGO = 596 / 471;

export default function Logo({ largura = 150 }) {
  return (
    <Image
      source={require("./assets/logo-hd.png")}
      style={{ width: largura, height: Math.round(largura / PROPORCAO_LOGO) }}
      resizeMode="contain"
      accessibilityLabel="Logo do Nativ Ivrit: livro aberto com a bandeira de Israel"
    />
  );
}
