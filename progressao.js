/*
 * progressao.js
 *
 * FONTE ÚNICA do progresso do aluno. Calcula a TRILHA (mapa de níveis)
 * a partir dos dados REAIS do app:
 *   - níveis e lições ............ niveis.js
 *   - missões de escrita ......... dadosMissoes.js
 *   - letras do alfabeto ......... letrasHebraicas.js
 *   - XP e itens feitos .......... usuario.xp / usuario.feitos (userDB.js)
 *
 * Nada aqui é inventado: se o conteúdo ou o XP mudarem, a trilha muda
 * junto. O mapa, a Home e a tela de conclusão usam estas mesmas funções,
 * então nunca existem dois sistemas de progresso diferentes.
 *
 * REGRAS:
 *   - Para liberar um nível o aluno precisa (1) ter o XP mínimo dele
 *     (`xpMinimo` em niveis.js) E (2) passar na PROVA DO NÍVEL anterior.
 *     A prova aparece como a última etapa de cada unidade.
 *   - Dentro de um nível liberado, as etapas são EM ORDEM: só a primeira
 *     ainda não concluída está liberada (ATUAL). As seguintes ficam
 *     trancadas até o aluno terminar a anterior.
 */
import { LICOES, NIVEIS, nivelPorId, nivelPorXp, proximoNivel } from "./niveis";
import { CIDADE_POR_NIVEL, CURIOSIDADE_POR_NIVEL, LUGARES } from "./dadosIsrael";
import { MISSOES } from "./dadosMissoes";
import { LETRAS } from "./letrasHebraicas";

export const ESTADOS = {
  CONCLUIDO: "concluido",
  ATUAL: "atual",
  DISPONIVEL: "disponivel",
  BLOQUEADO: "bloqueado",
};

export const ROTULO_ESTADO = {
  concluido: "Concluída",
  atual: "Você está aqui",
  disponivel: "Disponível",
  bloqueado: "Bloqueada",
};

// Bônus de XP ao passar numa prova (altere aqui).
export const XP_BONUS_PROVA = 30;

// XP do quiz de cultura de cada unidade (altere aqui).
export const XP_CULTURA = 20;

export function montarTrilha({ xp = 0, feitos = [], nivelLiberado } = {}) {
  const feitosSet = new Set(feitos);
  // Nível liberado = o que o aluno já passou na prova (nunca mais que o XP permite).
  const nivelPorXpAtual = nivelPorXp(xp);
  const nivelUsuario = Number.isInteger(nivelLiberado)
    ? nivelPorId(Math.min(Math.max(nivelLiberado, 1), nivelPorXpAtual.id))
    : nivelPorXpAtual;
  const proximo = proximoNivel(nivelUsuario);

  const unidades = NIVEIS.map((nivel) => {
    const bloqueada = nivel.id > nivelUsuario.id;
    const falta = Math.max(nivel.xpMinimo - xp, 0);
    const requisito = `Alcance ${nivel.xpMinimo} XP para liberar o nível ${nivel.nome} (faltam ${falta} XP).`;
    const nos = [];

    // Etapa 1 do nível 1: estudo do alfabeto.
    if (nivel.id === 1) {
      const vistas = LETRAS.filter((l) => feitosSet.has(`letra:${l.letra}`)).length;
      nos.push({
        id: "alfabeto",
        tipo: "alfabeto",
        titulo: "Alfabeto hebraico",
        subtitulo: `${vistas} de ${LETRAS.length} letras estudadas`,
        progresso: { feito: vistas, total: LETRAS.length },
        xp: null,
        concluido: vistas >= LETRAS.length,
        acao: { tela: "estudo" },
      });
    }

    LICOES.filter((l) => l.nivel === nivel.id).forEach((licao) => {
      nos.push({
        id: `licao:${licao.id}`,
        tipo: "licao",
        titulo: licao.titulo,
        subtitulo: `Lição · +${licao.xp} XP`,
        progresso: null,
        xp: licao.xp,
        concluido: feitosSet.has(`licao:${licao.id}`),
        acao: { tela: "licao", licaoId: licao.id },
      });
    });

    // Última etapa do nível: missões de escrita daquele nível.
    const missoes = MISSOES.filter((m) => m.nivel === nivel.id);
    if (missoes.length > 0) {
      const feitas = missoes.filter((m) => feitosSet.has(m.id)).length;
      nos.push({
        id: `missoes:${nivel.id}`,
        tipo: "missoes",
        titulo: "Missões de escrita",
        subtitulo: `${feitas} de ${missoes.length} missões`,
        progresso: { feito: feitas, total: missoes.length },
        xp: missoes.reduce((soma, m) => soma + m.xp, 0),
        concluido: feitas >= missoes.length,
        acao: { tela: "missoes", nivelId: nivel.id },
      });
    }

    // Quiz de cultura: a cidade e a personalidade do nível (sem textos para ler).
    const cidade = LUGARES.find((l) => l.id === CIDADE_POR_NIVEL[nivel.id]);
    nos.push({
      id: `cultura:${nivel.id}`,
      tipo: "cultura",
      titulo: cidade ? `Israel: ${cidade.nome}` : "Israel",
      subtitulo: `Quiz rápido · +${XP_CULTURA} XP`,
      progresso: null,
      xp: XP_CULTURA,
      concluido: feitosSet.has(`cultura:${nivel.id}`),
      acao: { tela: "cultura", nivelId: nivel.id },
    });

    // Última etapa do nível: a PROVA para liberar o nível seguinte.
    const seguinte = NIVEIS.find((n) => n.id === nivel.id + 1);
    if (seguinte) {
      const passou = nivelUsuario.id > nivel.id;
      const faltaXpProva = Math.max(seguinte.xpMinimo - xp, 0);
      nos.push({
        id: `prova:${nivel.id}`,
        tipo: "prova",
        titulo: `Prova do nível ${nivel.nome}`,
        subtitulo: passou
          ? "Aprovado!"
          : faltaXpProva > 0
          ? `Faltam ${faltaXpProva} XP para liberar a prova`
          : "Prova liberada: 10 questões, 70% para passar",
        progresso: null,
        xp: XP_BONUS_PROVA,
        concluido: passou,
        travado: !passou && faltaXpProva > 0, // falta XP: ainda não dá para fazer
        faltaXp: faltaXpProva,
        acao: { tela: "prova", nivelId: nivel.id },
      });
    }

    nos.forEach((no) => {
      no.nivelId = nivel.id;
      no.requisito = bloqueada ? requisito : null;
    });

    return {
      nivel,
      bloqueada,
      falta,
      requisito,
      nos,
      cidadeId: CIDADE_POR_NIVEL[nivel.id] || null,
      curiosidade: CURIOSIDADE_POR_NIVEL[nivel.id] || "",
    };
  });

  // Define o estado de cada etapa. A ATUAL é a primeira não concluída
  // entre as etapas liberadas.
  let atual = null;
  unidades.forEach((unidade) => {
    // Etapas em ORDEM: depois da primeira não concluída, o resto fica trancado.
    let primeiraPendente = null;
    unidade.nos.forEach((no) => {
      if (unidade.bloqueada) no.estado = ESTADOS.BLOQUEADO;
      else if (no.concluido) no.estado = ESTADOS.CONCLUIDO;
      else if (primeiraPendente) {
        no.estado = ESTADOS.BLOQUEADO;
        no.requisito = `Termine antes: ${primeiraPendente.titulo}.`;
      } else if (no.travado) {
        // Prova ainda sem XP suficiente: aparece trancada, com o motivo.
        no.estado = ESTADOS.BLOQUEADO;
        no.requisito = `Faltam ${no.faltaXp} XP para fazer a prova. Ganhe XP praticando.`;
        primeiraPendente = no;
      } else {
        no.estado = atual ? ESTADOS.DISPONIVEL : ESTADOS.ATUAL;
        if (!atual) atual = no;
        primeiraPendente = no;
      }
    });
    const liberadas = unidade.nos.filter((n) => n.estado !== ESTADOS.BLOQUEADO).length;
    unidade.concluidas = unidade.nos.filter((n) => n.concluido && !unidade.bloqueada).length;
    unidade.total = unidade.nos.length;
    unidade.completa = !unidade.bloqueada && liberadas > 0 && unidade.concluidas === unidade.total;
  });

  const nos = unidades.flatMap((u) => u.nos);
  const concluidos = nos.filter((n) => n.estado === ESTADOS.CONCLUIDO).length;
  const licoes = nos.filter((n) => n.tipo === "licao");
  const licoesFeitas = licoes.filter((n) => n.concluido && n.estado === ESTADOS.CONCLUIDO).length;

  const xpProximo = proximo ? proximo.xpMinimo : null;
  const percentualNivel = proximo
    ? Math.min(100, Math.max(0, ((xp - nivelUsuario.xpMinimo) / (proximo.xpMinimo - nivelUsuario.xpMinimo)) * 100))
    : 100;

  // Se não há etapa disponível (só a prova trancada por falta de XP), a
  // trilha sugere TREINAR: é o caminho para ganhar o XP que falta.
  const sugestao = atual
    ? null
    : proximo
    ? {
        id: "treino",
        tipo: "treino",
        titulo: "Praticar para ganhar XP",
        subtitulo: `Faltam ${Math.max(proximo.xpMinimo - xp, 0)} XP para a prova do nível`,
        acao: { tela: "pratica" },
      }
    : null;

  return {
    unidades,
    nos,
    atual, // null = nada disponível agora (veja `sugestao`)
    sugestao,
    nivel: nivelUsuario,
    proximo,
    xp: { atual: xp, proximoMinimo: xpProximo, falta: proximo ? Math.max(xpProximo - xp, 0) : 0, percentualNivel },
    totais: {
      concluidos,
      total: nos.length,
      percentual: nos.length ? Math.round((concluidos / nos.length) * 100) : 0,
      licoesFeitas,
      licoesTotal: licoes.length,
    },
  };
}
