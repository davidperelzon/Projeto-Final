/*
 * TecladoHebraico.js
 *
 * Teclado virtual em hebraico, usado nas missões de escrita e no ditado.
 *
 * LAYOUT PARA QUEM ESTÁ APRENDENDO:
 *   - As teclas seguem a ORDEM DO ALFABETO (alef-bet), com cada forma final
 *     logo depois da letra normal (ך depois de כ, ם depois de מ...).
 *   - A grade é lida da DIREITA para a ESQUERDA, como o hebraico: o Alef (א)
 *     fica no canto superior direito.
 *   - Cada tecla mostra a letra e, embaixo, uma dica do som (b/v, sh, ts...).
 *   - As formas finais têm uma marca laranja embaixo.
 *   - Colunas se adaptam à largura da tela (6 a 9), então as teclas ficam
 *     sempre grandes o bastante para o dedo.
 *   - Embaixo: Apagar, Espaço e Limpar.
 *
 * COMO USAR:
 *   <TecladoHebraico
 *     onLetra={(letra) => ...}   // recebeu uma letra ou um espaço
 *     onApagar={() => ...}
 *     onLimpar={() => ...}
 *     desativado={false}
 *   />
 *
 * TECLADO FÍSICO (navegador): o hook `useTecladoFisico` (no fim do arquivo)
 * aceita digitar no teclado do computador. MAPA_TECLADO_FISICO diz qual
 * tecla QWERTY gera qual letra (padrão do teclado hebraico de Israel;
 * por exemplo, "t" = א). Quem usa o teclado virtual chama o hook.
 */

import React, { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LETRAS, FORMAS_FINAIS } from "./letrasHebraicas";
import { cores } from "./theme";

// Ordem das teclas: alfabeto, com cada forma final depois da sua letra.
export const ORDEM_TECLADO = [
  "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י",
  "כ", "ך", "ל", "מ", "ם", "נ", "ן", "ס", "ע", "פ", "ף",
  "צ", "ץ", "ק", "ר", "ש", "ת",
];

// Dica do som de cada letra (aparece em letras pequenas na tecla).
const DICA_SOM = {
  א: "a", ב: "b/v", ג: "g", ד: "d", ה: "h", ו: "v", ז: "z", ח: "ch", ט: "t", י: "i/y",
  כ: "k/ch", ך: "ch", ל: "l", מ: "m", ם: "m", נ: "n", ן: "n", ס: "s", ע: "a", פ: "p/f", ף: "f",
  צ: "ts", ץ: "ts", ק: "k", ר: "r", ש: "sh", ת: "t",
};

const FINAIS = new Set(FORMAS_FINAIS.map((item) => item.letra));

// Qual tecla do teclado QWERTY corresponde a qual letra hebraica.
export const MAPA_TECLADO_FISICO = {
  e: "ק", r: "ר", t: "א", y: "ט", u: "ו", i: "ן", o: "ם", p: "פ",
  a: "ש", s: "ד", d: "ג", f: "כ", g: "ע", h: "י", j: "ח", k: "ל", l: "ך", ";": "ף",
  z: "ז", x: "ס", c: "ב", v: "ה", b: "נ", n: "מ", m: "צ", ",": "ת", ".": "ץ",
};

// Nome de cada letra (para leitores de tela): "Alef", "Bet", "Kaf final"...
const NOMES = {};
[...LETRAS, ...FORMAS_FINAIS].forEach((item) => {
  NOMES[item.letra] = item.nome;
});
export function nomeDaTecla(letra) {
  return NOMES[letra] || letra;
}

const ESPACO = 6; // espaço entre teclas
const TECLA_MINIMA = 40; // largura mínima de uma tecla
const TECLA_MAXIMA = 58;

// Quantas colunas cabem: entre 6 e 9, conforme a largura disponível.
export function calcularColunas(larguraInterna) {
  const cabem = Math.floor((larguraInterna + ESPACO) / (TECLA_MINIMA + ESPACO));
  return Math.max(6, Math.min(9, cabem));
}

// Uma tecla do teclado.
function Tecla({ rotulo, dica, acessivel, onPress, desativado, estilo, estiloTexto, final }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={desativado}
      accessibilityRole="button"
      accessibilityLabel={acessivel}
      accessibilityState={{ disabled: !!desativado }}
      style={({ pressed }) => [
        styles.tecla,
        estilo,
        final && styles.teclaFinal,
        pressed && styles.teclaPressionada,
        desativado && styles.teclaDesativada,
      ]}
    >
      <Text style={[styles.teclaTexto, estiloTexto]}>{rotulo}</Text>
      {dica ? <Text style={styles.teclaDica}>{dica}</Text> : null}
    </Pressable>
  );
}

export default function TecladoHebraico({ onLetra, onApagar, onLimpar, desativado }) {
  // Medimos a largura disponível para escolher colunas e tamanho das teclas.
  const [largura, setLargura] = useState(300);
  const larguraInterna = Math.max(largura - 16, 200);
  const colunas = calcularColunas(larguraInterna);
  const tamanho = Math.min(TECLA_MAXIMA, Math.floor((larguraInterna - (colunas - 1) * ESPACO) / colunas));

  // Divide as 27 letras em linhas do tamanho de `colunas`.
  const linhas = [];
  for (let i = 0; i < ORDEM_TECLADO.length; i += colunas) linhas.push(ORDEM_TECLADO.slice(i, i + colunas));

  return (
    <View style={styles.teclado} onLayout={(evento) => setLargura(evento.nativeEvent.layout.width)}>
      <Text style={styles.sentido} accessibilityElementsHidden importantForAccessibility="no">
        ← o hebraico se lê da direita para a esquerda
      </Text>

      {linhas.map((linha, indice) => (
        // "row-reverse": a primeira letra (Alef) fica na DIREITA.
        <View key={indice} style={styles.linha}>
          {linha.map((letra) => (
            <Tecla
              key={letra}
              rotulo={letra}
              dica={DICA_SOM[letra]}
              final={FINAIS.has(letra)}
              acessivel={`Letra ${nomeDaTecla(letra)}`}
              desativado={desativado}
              onPress={() => onLetra(letra)}
              estilo={{ width: tamanho, height: Math.max(tamanho + 6, 52) }}
            />
          ))}
        </View>
      ))}

      {/* Linha de baixo: apagar, espaço e limpar */}
      <View style={styles.linhaAcoes}>
        <Tecla
          rotulo="⌫"
          acessivel="Apagar a última letra"
          desativado={desativado}
          onPress={onApagar}
          estilo={styles.teclaAcao}
          estiloTexto={styles.teclaAcaoTexto}
        />
        <Tecla
          rotulo="espaço"
          acessivel="Espaço"
          desativado={desativado}
          onPress={() => onLetra(" ")}
          estilo={styles.teclaEspaco}
          estiloTexto={styles.teclaAcaoTexto}
        />
        <Tecla
          rotulo="Limpar"
          acessivel="Limpar tudo"
          desativado={desativado}
          onPress={onLimpar}
          estilo={styles.teclaAcao}
          estiloTexto={styles.teclaAcaoTexto}
        />
      </View>
      <Text style={styles.legenda}>Marca laranja = forma final (usada no fim da palavra)</Text>
    </View>
  );
}

/**
 * TECLADO FÍSICO (só navegador). Recebe as ações da tela e as chama quando
 * o usuário digita no computador:
 *   - letra hebraica do teclado do sistema, ou tecla QWERTY convertida (T = א)
 *   - Backspace apaga, Espaço dá espaço, Enter confirma.
 * `acoes` = { digitar, apagar, confirmar }. Pode ser um objeto novo a cada
 * render: o hook sempre usa a versão mais recente.
 */
export function useTecladoFisico(acoes) {
  const ref = useRef(acoes);
  ref.current = acoes;

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return undefined;

    const aoApertar = (evento) => {
      if (evento.ctrlKey || evento.metaKey || evento.altKey) return;
      const atual = ref.current || {};
      const tecla = evento.key;
      if (!tecla) return;

      if (tecla === "Backspace") {
        if (atual.apagar) atual.apagar();
      } else if (tecla === "Enter") {
        if (atual.confirmar) atual.confirmar();
      } else if (tecla === " ") {
        evento.preventDefault(); // evita rolar a página
        if (atual.digitar) atual.digitar(" ");
      } else if (tecla.length === 1) {
        if (/[\u05D0-\u05EA]/.test(tecla)) {
          if (atual.digitar) atual.digitar(tecla);
        } else {
          const letra = MAPA_TECLADO_FISICO[tecla.toLowerCase()];
          if (letra && atual.digitar) atual.digitar(letra);
        }
      }
    };

    window.addEventListener("keydown", aoApertar);
    return () => window.removeEventListener("keydown", aoApertar);
  }, []);
}

const styles = StyleSheet.create({
  teclado: {
    width: "100%",
    maxWidth: 640,
    alignSelf: "center",
    backgroundColor: cores.fundoSuave,
    borderRadius: 20,
    padding: 8,
    gap: ESPACO,
  },
  sentido: {
    color: cores.textoSuave,
    fontSize: 11,
    fontWeight: "800",
    textAlign: "right",
    paddingHorizontal: 4,
  },
  linha: {
    flexDirection: "row-reverse",
    gap: ESPACO,
  },
  linhaAcoes: {
    flexDirection: "row",
    gap: ESPACO,
    marginTop: 2,
  },
  tecla: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    borderBottomWidth: 3,
    borderBottomColor: cores.azulClaro,
    alignItems: "center",
    justifyContent: "center",
  },
  teclaFinal: {
    borderBottomColor: cores.laranja,
  },
  teclaPressionada: {
    backgroundColor: cores.azulClaro,
    transform: [{ translateY: 1 }],
  },
  teclaDesativada: {
    opacity: 0.45,
  },
  teclaTexto: {
    fontSize: 28,
    lineHeight: 32,
    color: cores.texto,
    fontWeight: "700",
  },
  teclaDica: {
    fontSize: 10,
    lineHeight: 12,
    color: cores.textoSuave,
    fontWeight: "800",
  },
  teclaAcao: {
    flex: 1,
    height: 48,
    backgroundColor: cores.fundoSuave,
  },
  teclaEspaco: {
    flex: 2,
    height: 48,
  },
  teclaAcaoTexto: {
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 20,
  },
  legenda: {
    color: cores.textoSuave,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});
