/*
 * geometriaTrilha.js
 *
 * Cálculo (puro, sem React) das posições do MAPA DE PROGRESSÃO: as etapas
 * ficam em zigue-zague e são ligadas por curvas suaves em "S", inspiradas
 * na referência visual da trilha. O desenho do mapa (MapaProgressao.js)
 * só lê o resultado desta função.
 *
 * O caminho é desenhado com pequenos segmentos retos (cada um é uma View
 * girada), o que funciona igual no iPhone, no Android e na web e dispensa
 * bibliotecas extras de desenho.
 */

export const RAIO_NO = 34; // etapa de 68 px (área de toque confortável)
export const ALTURA_UNIDADE = 96; // faixa com o nome da unidade (nível)
export const ALTURA_NO = 138; // espaço vertical de cada etapa (nó + nome)
export const PASSOS_CURVA = 10; // quantos segmentos formam cada curva
const PADRAO_X = [0, 1, 0, -1]; // zigue-zague: centro, direita, centro, esquerda

const suavizar = (t) => t * t * (3 - 2 * t); // curva em S (começa/termina na vertical)

export function calcularLayout(unidades, larguraTotal) {
  const largura = Math.max(Number(larguraTotal) || 0, 260);
  const larguraRotulo = Math.min(150, Math.floor(largura * 0.46));
  // Quanto o zigue-zague pode se afastar do centro sem cortar o nome da etapa.
  const amplitude = Math.max(0, Math.min(largura * 0.27, (largura - larguraRotulo) / 2 - 4));

  const itens = [];
  const nos = [];
  let y = 0;
  let contador = 0;

  unidades.forEach((unidade) => {
    itens.push({ tipo: "unidade", y: y + ALTURA_UNIDADE / 2, unidade });
    y += ALTURA_UNIDADE;
    unidade.nos.forEach((no) => {
      const item = {
        tipo: "no",
        no,
        indice: contador,
        x: largura / 2 + PADRAO_X[contador % PADRAO_X.length] * amplitude,
        y: y + RAIO_NO + 8,
        larguraRotulo,
      };
      itens.push(item);
      nos.push(item);
      contador += 1;
      y += ALTURA_NO;
    });
  });

  // Segmentos que ligam cada etapa à seguinte.
  const segmentos = [];
  for (let i = 0; i < nos.length - 1; i++) {
    const a = nos[i];
    const b = nos[i + 1];
    const percorrido = a.no.estado === "concluido" && b.no.estado !== "bloqueado";
    for (let p = 0; p < PASSOS_CURVA; p++) {
      const t0 = p / PASSOS_CURVA;
      const t1 = (p + 1) / PASSOS_CURVA;
      const x0 = a.x + (b.x - a.x) * suavizar(t0);
      const y0 = a.y + (b.y - a.y) * t0;
      const x1 = a.x + (b.x - a.x) * suavizar(t1);
      const y1 = a.y + (b.y - a.y) * t1;
      segmentos.push({
        x: (x0 + x1) / 2,
        y: (y0 + y1) / 2,
        comprimento: Math.hypot(x1 - x0, y1 - y0) + 2, // +2px: sem frestas entre segmentos
        angulo: Math.atan2(y1 - y0, x1 - x0),
        percorrido,
      });
    }
  }

  return { largura, altura: y + 24, itens, nos, segmentos, amplitude, larguraRotulo };
}
