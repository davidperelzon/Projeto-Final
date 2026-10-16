/*
 * theme.js
 *
 * PALETA DE CORES DO PROJETO (definida no PDF "projeto final").
 * É o ÚNICO lugar onde existem códigos de cor. Todas as telas importam
 * `cores` daqui. Para mudar a identidade visual, altere só este arquivo.
 *
 * Cores oficiais do PDF:
 *   Laranja       #F28C28  -> energia, motivação (destaques, progresso)
 *   Azul escuro   #1F4E8C  -> confiança, seriedade (títulos, botões)
 *   Azul médio    #2F6DB5  -> textos secundários, links
 *   Azul claro    #6FA4D9  -> detalhes, bordas, fundos suaves
 *   Cinza         #8896B3  -> placeholders, itens desativados
 *   Branco        #FFFFFF  -> cartões e fundos
 *   Verde musgo   #2E7D32  -> acertos, XP ganho, sucesso
 *
 * Observação: no PDF, "azul médio" e "azul mais escuro" aparecem com o
 * mesmo código (2F6DB5). Aqui foi usado #1F4E8C como "azul escuro",
 * que é a cor principal listada no próprio PDF.
 *
 * As cores "suaves" abaixo NÃO são cores novas: são as mesmas cores da
 * paleta com transparência, usadas para fundos e bordas leves.
 */
export const cores = {
  // ---- Paleta oficial ----
  laranja: "#F28C28",
  azulEscuro: "#1F4E8C",
  azulMedio: "#2F6DB5",
  azulClaro: "#6FA4D9",
  cinza: "#8896B3",
  branco: "#FFFFFF",
  verdeMusgo: "#2E7D32",

  // ---- Papéis (apelidos usados nas telas) ----
  texto: "#1F4E8C", // texto principal (contraste alto sobre branco)
  textoSuave: "#2F6DB5", // texto secundário
  textoSobreEscuro: "#FFFFFF", // texto sobre botões azul escuro / verde

  // ---- Variações com transparência (mesmas cores, mais leves) ----
  fundoTela: "rgba(111, 164, 217, 0.14)", // azul claro 14%
  fundoSuave: "rgba(111, 164, 217, 0.18)", // azul claro 18%
  bordaSuave: "rgba(111, 164, 217, 0.45)", // azul claro 45%
  destaqueSuave: "rgba(242, 140, 40, 0.20)", // laranja 20%
  sucessoSuave: "rgba(46, 125, 50, 0.14)", // verde musgo 14%
};
