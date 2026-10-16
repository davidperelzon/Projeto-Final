import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar,
  BackHandler,
} from "react-native";
import LoginCadastro from "./LoginCadastro";
import AlfabetoHebraico from "./AlfabetoHebraico";
import Missoes from "./Missoes";
import BotaoAudio from "./BotaoAudio";
import Logo from "./Logo";
import Icone from "./Icone";
import CabecalhoFoto from "./CabecalhoFoto";
import MapaProgressao from "./MapaProgressao";
import Flashcards from "./Flashcards";
import Pratica from "./Pratica";
import Perfil from "./Perfil";
import Israel from "./Israel";
import ProvaNivel from "./ProvaNivel";
import CulturaTela from "./CulturaTela";
import BarraNavegacao from "./BarraNavegacao";
import CaixaDeErro from "./CaixaDeErro";
import SessaoQuestoes from "./SessaoQuestoes";
import { ModalConclusao } from "./PainelProgresso";
import { montarTrilha, XP_BONUS_PROVA, XP_CULTURA } from "./progressao";
import { questoesDaLicao } from "./questoes";
import { abrirVideos, buscaDaLicao } from "./videos";
import { CIDADE_POR_NIVEL, LUGARES } from "./dadosIsrael";
import { calcularSequencia, somarXpNoDia, xpDoDia } from "./progresso";
import { cores } from "./theme";
import { LETRAS, FORMAS_FINAIS } from "./letrasHebraicas";
import {
  getUsuarioAtual,
  atualizarProgresso,
  logoutUser,
} from "./userDB";
import {
  NIVEIS,
  LICOES,
  PALAVRAS,
  FRASES,
  VOGAIS,
  nivelDoUsuario,
  proximoNivel,
  nivelPorId,
} from "./niveis";

// ---------------------------------------------------------------------
// DADOS DA TELA INICIAL
// ---------------------------------------------------------------------

// Abas (módulos) da tela "Estudar". Para criar uma aba nova: acrescente
// aqui e trate o novo `id` na função `renderConteudoModulo`.
const modulos = [
  { id: "vogais", titulo: "Vogais", icone: "ear" },
  { id: "alfabeto", titulo: "Alfabeto", icone: "text" },
  { id: "palavras", titulo: "Palavras", icone: "mic" },
  { id: "frases", titulo: "Frases", icone: "chatbubbles" },
  { id: "licoes", titulo: "Lições", icone: "book" },
  { id: "cartas", titulo: "Cartas", icone: "albums" },
];

// Caractere "◌" usado como apoio visual para mostrar um sinal de vogal
// sozinho (sem ele o sinal ficaria solto e quase invisível).
const APOIO_VOGAL = "\u25CC";

// ---------------------------------------------------------------------
// COMPONENTES PEQUENOS
// ---------------------------------------------------------------------

// Linha "bloqueada": aparece no lugar do conteúdo de níveis ainda não
// liberados, mostrando quanto XP falta.
function LinhaBloqueada({ nivelId, xpAtual }) {
  const nivel = nivelPorId(nivelId);
  const falta = Math.max(nivel.xpMinimo - xpAtual, 0);
  return (
    <View style={styles.linhaBloqueada} accessibilityLabel={`Nível ${nivel.nome} bloqueado`}>
      <Text style={styles.bloqueadaTitulo}>Nível {nivel.id} · {nivel.nome} (trancado)</Text>
      <Text style={styles.bloqueadaTexto}>
        Libera com {nivel.xpMinimo} XP e a prova do nível anterior (faltam {falta} XP).
      </Text>
    </View>
  );
}

// Detalhe aberto de uma lição, em 3 passos: Aprender -> Praticar -> Concluir.
//   1. Aprender: texto e exemplos com áudio (e atalho para vídeos).
//   2. Praticar: 3 perguntas rápidas feitas com os exemplos da lição.
//   3. Concluir: botão que dá o XP da lição (uma vez só).
function LicaoDetalhe({ licao, concluida, onConcluir, onResponder }) {
  const [fase, setFase] = useState("aprender"); // aprender | praticar | concluir
  const [tentativa, setTentativa] = useState(0);
  const [lerMais, setLerMais] = useState(false);
  const questoes = useMemo(() => questoesDaLicao(licao, 3), [licao.id, tentativa]);
  const passos = [
    { id: "aprender", rotulo: "Aprender" },
    { id: "praticar", rotulo: "Praticar" },
    { id: "concluir", rotulo: "Concluir" },
  ];
  const ordem = passos.findIndex((passo) => passo.id === fase);

  return (
    <View style={styles.licaoDetalhe}>
      <View style={styles.passos} accessibilityRole="progressbar" accessibilityLabel={`Passo ${ordem + 1} de 3: ${passos[ordem].rotulo}`}>
        {passos.map((passo, i) => (
          <View key={passo.id} style={[styles.passo, i === ordem && styles.passoAtivo, i < ordem && styles.passoFeito]}>
            <Text style={[styles.passoTexto, i === ordem && styles.passoTextoAtivo]}>
              {i < ordem ? "✓" : i + 1} {passo.rotulo}
            </Text>
          </View>
        ))}
      </View>

      {fase === "aprender" ? (
        <>
          {(lerMais ? licao.paragrafos : licao.paragrafos.slice(0, 1)).map((texto, indice) => (
            <Text key={indice} style={styles.licaoTexto}>
              {texto}
            </Text>
          ))}
          {licao.paragrafos.length > 1 ? (
            <TouchableOpacity onPress={() => setLerMais((valor) => !valor)} accessibilityRole="button" style={styles.lerMais}>
              <Text style={styles.lerMaisTexto}>{lerMais ? "Mostrar menos" : "Ler mais"}</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.exemplosBox}>
            {licao.exemplos.map((exemplo, indice) => (
              <View key={indice} style={styles.exemploLinha}>
                <View style={styles.exemploTextos}>
                  <Text style={styles.exemploHeb}>{exemplo.heb}</Text>
                  <Text style={styles.exemploPt}>
                    {exemplo.translit} · {exemplo.pt}
                  </Text>
                </View>
                <BotaoAudio texto={exemplo.heb} rotulo={`Ouvir ${exemplo.translit}`} variante="pequena" />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.botaoSucesso} onPress={() => setFase("praticar")} accessibilityRole="button">
            <Text style={styles.botaoSucessoTexto}>Praticar →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.botaoVideo} onPress={() => abrirVideos(buscaDaLicao(licao.id))} accessibilityRole="link" accessibilityLabel="Ver vídeos sobre este tema no YouTube">
            <Text style={styles.botaoVideoTexto}>▶ Ver vídeos sobre este tema</Text>
          </TouchableOpacity>
        </>
      ) : null}

      {fase === "praticar" ? (
        <SessaoQuestoes
          key={tentativa}
          questoes={questoes}
          aoResponder={onResponder}
          aoTerminar={() => setFase("concluir")}
          compacto
        />
      ) : null}

      {fase === "concluir" ? (
        concluida ? (
          <View>
            <View style={styles.concluidaBadge}>
              <Text style={styles.concluidaTexto}>✓ Lição concluída</Text>
            </View>
            <TouchableOpacity
              style={styles.botaoVideo}
              onPress={() => {
                setTentativa((valor) => valor + 1);
                setFase("praticar");
              }}
              accessibilityRole="button"
            >
              <Text style={styles.botaoVideoTexto}>Praticar de novo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.botaoSucesso}
            onPress={onConcluir}
            accessibilityRole="button"
            accessibilityLabel={`Concluir a lição e ganhar ${licao.xp} XP`}
          >
            <Text style={styles.botaoSucessoTexto}>Concluir lição (+{licao.xp} XP)</Text>
          </TouchableOpacity>
        )
      ) : null}

      {fase !== "aprender" ? (
        <TouchableOpacity style={styles.botaoVideo} onPress={() => setFase("aprender")} accessibilityRole="button">
          <Text style={styles.botaoVideoTexto}>← Rever o conteúdo</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------
// TELA "ESTUDAR": biblioteca de conteúdo (vogais, alfabeto, palavras,
// frases, lições e cartas). A tela inicial (trilha) fica em MapaProgressao.js.
// ---------------------------------------------------------------------

function EstudarScreen({
  usuario,
  onAbrirLicao,
  onIrParaEstudo,
  onGanharXp,
  onClassificarCarta,
  onFavoritarCarta,
}) {
  const xp = usuario.xp;
  const feitos = usuario.feitos;

  // ----- Nível liberado do usuário (XP + prova) -----
  const nivel = nivelDoUsuario(usuario);

  // ----- Estados da tela -----
  const [moduloSelecionado, setModuloSelecionado] = useState("vogais");
  const [vogalSelecionada, setVogalSelecionada] = useState(null);

  // ----- Contadores -----
  const letrasVistas = feitos.filter((id) => id.startsWith("letra:")).length;

  // Mostra, para cada nível, a lista de itens liberados e uma linha
  // "bloqueada" para os níveis ainda trancados.
  const renderPorNivel = (renderizarNivel) =>
    NIVEIS.map((n) =>
      n.id <= nivel.id ? (
        <View key={n.id} style={styles.grupoNivel}>
          <Text style={styles.grupoTitulo}>
            Nível {n.id} · {n.nome}
          </Text>
          {renderizarNivel(n.id)}
        </View>
      ) : (
        <LinhaBloqueada key={n.id} nivelId={n.id} xpAtual={xp} />
      )
    );

  // ----- Conteúdo de cada aba -----
  const renderConteudoModulo = () => {
    if (moduloSelecionado === "vogais") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Vogais do hebraico</Text>
          <Text style={styles.panelText}>
            Em hebraico, as vogais aparecem como sinais pequenos que ficam acima ou abaixo das letras. Toque em um sinal para ver o som.
          </Text>
          <View style={styles.vowelGrid}>
            {VOGAIS.map((item) => (
              <TouchableOpacity
                key={item.nome}
                style={[
                  styles.vowelCard,
                  vogalSelecionada === item.nome && styles.vowelCardAtivo,
                ]}
                onPress={() => setVogalSelecionada(item.nome)}
                accessibilityRole="button"
                accessibilityLabel={`Vogal ${item.nome}, som ${item.som}`}
              >
                <Text style={styles.vowelSinal}>{APOIO_VOGAL + item.sinal}</Text>
                <Text style={styles.vowelName}>{item.nome}</Text>
                <Text style={styles.vowelSound}>{item.som}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {vogalSelecionada ? (
            <Text style={styles.vogalDetalhe} accessibilityLiveRegion="polite">
              {vogalSelecionada} = som de{" "}
              {VOGAIS.find((v) => v.nome === vogalSelecionada).som}
            </Text>
          ) : null}
          {nivel.id < 2 ? (
            <Text style={styles.dicaNivel}>
              No nível Básico você aprende todas as vogais (nikkud) em detalhe.
            </Text>
          ) : null}
        </View>
      );
    }

    if (moduloSelecionado === "alfabeto") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Alfabeto</Text>
          <Text style={styles.panelText}>
            São 22 letras e 5 formas finais. Você já viu {letrasVistas} de {LETRAS.length} letras.
          </Text>
          <View style={styles.listaMini}>
            {LETRAS.map((item) => (
              <View key={item.letra} style={styles.itemMini}>
                <Text style={styles.itemMiniLetra}>{item.letra}</Text>
                <Text style={styles.itemMiniNome}>{item.nome}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.subtituloPainel}>Formas finais</Text>
          <View style={styles.listaMini}>
            {FORMAS_FINAIS.map((item) => (
              <View key={item.letra} style={styles.itemMini}>
                <Text style={styles.itemMiniLetra}>{item.letra}</Text>
                <Text style={styles.itemMiniNome}>{item.nome}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.primaryButtonLarge}
            onPress={onIrParaEstudo}
            accessibilityRole="button"
            accessibilityLabel="Abrir o estudo do alfabeto"
          >
            <Text style={styles.primaryButtonText}>Estudar o alfabeto</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (moduloSelecionado === "palavras") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Palavras úteis</Text>
          <Text style={styles.panelText}>
            Toque no alto-falante para ouvir a pronúncia. Novas palavras são liberadas ao subir de nível.
          </Text>
          {renderPorNivel((nivelId) => (
            <View style={styles.wordList}>
              {PALAVRAS.filter((palavra) => palavra.nivel === nivelId).map((palavra) => (
                <View key={palavra.translit} style={styles.wordItem}>
                  {palavra.icone ? (
                    <View style={styles.wordIcone}>
                      <Icone nome={palavra.icone} tamanho={26} cor={cores.azulEscuro} />
                    </View>
                  ) : null}
                  <View style={styles.wordTextos}>
                    <Text style={styles.wordHeb}>{palavra.heb}</Text>
                    <Text style={styles.wordPt}>
                      {palavra.translit} · {palavra.pt}
                    </Text>
                  </View>
                  <BotaoAudio
                    texto={palavra.heb}
                    rotulo={`Ouvir ${palavra.translit}`}
                    variante="pequena"
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    if (moduloSelecionado === "frases") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Frases</Text>
          <Text style={styles.panelText}>
            As frases estão escritas sem vogais, como no hebraico do dia a dia. Ouça e repita em voz alta.
          </Text>
          {renderPorNivel((nivelId) => (
            <View style={styles.wordList}>
              {FRASES.filter((frase) => frase.nivel === nivelId).map((frase) => (
                <View key={frase.translit} style={styles.wordItem}>
                  <View style={styles.wordTextos}>
                    <Text style={styles.wordHeb}>{frase.heb}</Text>
                    <Text style={styles.wordPt}>
                      {frase.translit} · {frase.pt}
                    </Text>
                  </View>
                  <BotaoAudio
                    texto={frase.heb}
                    rotulo={`Ouvir ${frase.translit}`}
                    variante="pequena"
                  />
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    }

    if (moduloSelecionado === "licoes") {
      return (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Lições</Text>
          <Text style={styles.panelText}>
            Toque numa lição para abrir.
          </Text>
          {renderPorNivel((nivelId) => (
            <View style={styles.wordList}>
              {LICOES.filter((licao) => licao.nivel === nivelId).map((licao) => {
                const concluida = feitos.includes(`licao:${licao.id}`);
                return (
                  <TouchableOpacity
                    key={licao.id}
                    style={[styles.licaoCard, styles.licaoCabecalho]}
                    onPress={() => onAbrirLicao(licao.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Lição: ${licao.titulo}`}
                  >
                    <Text style={styles.licaoTitulo}>{licao.titulo}</Text>
                    <Text style={concluida ? styles.licaoStatusOk : styles.licaoStatus}>
                      {concluida ? "✓ feita" : `+${licao.xp} XP`}
                    </Text>
                    <Icone nome="chevron-forward" tamanho={18} cor={cores.textoSuave} />
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      );
    }

    // Aba "Cartas": flashcards com dificuldade, favoritos, áudio e repetição.
    return (
      <View style={styles.panel}>
        <Flashcards
          usuario={usuario}
          nivelId={nivel.id}
          aoGanharXp={onGanharXp}
          aoClassificar={onClassificarCarta}
          aoFavoritar={onFavoritarCarta}
        />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo}>
      {/* Cabeçalho simples */}
      <CabecalhoFoto foto="jerusalem" titulo="Estudar" subtitulo={`Nível ${nivel.id} · ${nivel.nome}`} />

      {/* Abas dos módulos */}
      <View style={styles.moduleGrid}>
        {modulos.map((modulo) => {
          const selecionado = moduloSelecionado === modulo.id;
          return (
            <TouchableOpacity
              key={modulo.id}
              style={[styles.moduleCard, selecionado && styles.moduleCardSelected]}
              onPress={() => setModuloSelecionado(modulo.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: selecionado }}
              accessibilityLabel={`Abrir ${modulo.titulo}`}
            >
              <Icone nome={modulo.icone} tamanho={26} cor={selecionado ? cores.branco : cores.azulEscuro} style={styles.moduleIcone} />
              <Text style={[styles.moduleTitle, selecionado && styles.moduleTitleSelected]}>
                {modulo.titulo}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {renderConteudoModulo()}
    </ScrollView>
  );
}

// ---------------------------------------------------------------------
// TELA DE LIÇÃO: uma lição por vez, em tela própria (vinda da trilha ou da
// aba Estudar). Aprender -> Praticar -> Concluir.
// ---------------------------------------------------------------------

function LicaoScreen({ usuario, licaoId, onGanharXp, onResponderQuestao, onVoltar, onAbrirAcao, origem }) {
  const licao = LICOES.find((item) => item.id === licaoId) || LICOES[0];
  const concluida = usuario.feitos.includes(`licao:${licao.id}`);
  const [conclusao, setConclusao] = useState(null); // dados da tela de parabéns
  const trilha = useMemo(
    () => montarTrilha({ xp: usuario.xp, feitos: usuario.feitos, nivelLiberado: usuario.nivelLiberado }),
    [usuario.xp, usuario.feitos, usuario.nivelLiberado]
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
      <View style={styles.licaoTopo}>
        <TouchableOpacity style={styles.licaoVoltar} onPress={onVoltar} accessibilityRole="button" accessibilityLabel={origem === "estudar" ? "Voltar para Estudar" : "Voltar para a trilha"}>
          <Text style={styles.licaoVoltarTexto}>{origem === "estudar" ? "← Estudar" : "← Trilha"}</Text>
        </TouchableOpacity>
        <Text style={styles.licaoTopoTitulo} numberOfLines={2}>{licao.titulo}</Text>
      </View>
      <View style={styles.licaoCaixa}>
        <LicaoDetalhe
          key={licao.id}
          licao={licao}
          concluida={concluida}
          onResponder={onResponderQuestao}
          onConcluir={async () => {
            const ganhou = await onGanharXp(`licao:${licao.id}`, licao.xp);
            if (ganhou > 0) setConclusao({ titulo: licao.titulo, xp: ganhou });
          }}
        />
      </View>
      <ModalConclusao
        dados={conclusao}
        trilha={trilha}
        onFechar={() => setConclusao(null)}
        onVerTrilha={() => {
          setConclusao(null);
          onVoltar();
        }}
        onContinuar={() => {
          setConclusao(null);
          const proxima = trilha.atual || trilha.sugestao;
          if (proxima) onAbrirAcao(proxima.acao);
        }}
      />
    </ScrollView>
  );
}

// ---------------------------------------------------------------------
// APP (controla login, tela atual, XP e avisos)
// ---------------------------------------------------------------------

export default function App() {
  const [usuario, setUsuario] = useState(null); // null = ninguém logado
  const [carregando, setCarregando] = useState(true); // lendo a sessão salva
  // Telas principais (barra de baixo): trilha, estudar, pratica, israel, perfil.
  // Telas de tarefa (com botão voltar): estudo (alfabeto), missoes, prova.
  const [tela, setTela] = useState("trilha");
  const [foco, setFoco] = useState({}); // parâmetros da tela aberta: nivelId, lugarId, modoPratica
  const [aviso, setAviso] = useState(null); // mensagem rápida no topo

  // Guarda sempre o usuário mais recente. Serve para que duas somas de
  // XP seguidas não usem dados desatualizados.
  const usuarioRef = useRef(null);
  const timerAviso = useRef(null);

  // Mostra uma mensagem rápida no topo da tela e a esconde sozinha.
  const mostrarAviso = useCallback((texto, destaque = false) => {
    if (timerAviso.current) clearTimeout(timerAviso.current);
    setAviso({ texto, destaque });
    timerAviso.current = setTimeout(() => setAviso(null), destaque ? 5500 : 2500);
  }, []);

  // Carrega o usuário da sessão salva (login feito antes ou agora).
  const carregarUsuario = useCallback(async () => {
    const atual = await getUsuarioAtual();
    usuarioRef.current = atual;
    setUsuario(atual);
    if (atual) setTela("trilha");
  }, []);

  // Ao abrir o app: verifica se já existe alguém logado.
  useEffect(() => {
    carregarUsuario().finally(() => setCarregando(false));
    return () => {
      if (timerAviso.current) clearTimeout(timerAviso.current);
    };
  }, [carregarUsuario]);

  // Atualiza o usuário na tela na hora e salva em seguida. Se salvar falhar,
  // a tela continua funcionando (o app avisa uma vez).
  const salvar = useCallback(
    async (alteracoes) => {
      const atual = usuarioRef.current;
      if (!atual) return;
      const novo = { ...atual, ...alteracoes };
      usuarioRef.current = novo;
      setUsuario(novo);
      try {
        await atualizarProgresso(novo.id, alteracoes);
      } catch (erro) {
        mostrarAviso("Não foi possível salvar o progresso agora.");
      }
    },
    [mostrarAviso]
  );

  // Soma XP ao usuário logado -- UMA vez por `idFeito`.
  // Devolve a quantidade ganha (0 se esse item já tinha rendido XP).
  // Também registra o XP do dia (meta diária e sequência de dias).
  // Ao atingir o XP do próximo nível, avisa que a PROVA está liberada.
  const ganharXp = useCallback(
    async (idFeito, quantidade) => {
      const atual = usuarioRef.current;
      // Ignora pedidos inválidos (sem usuário, quantidade estranha ou item repetido).
      if (!atual || !Number.isFinite(quantidade) || quantidade <= 0) return 0;
      if (atual.feitos.includes(idFeito)) return 0;

      const liberado = nivelDoUsuario(atual);
      const proximo = proximoNivel(liberado);
      const novoXp = atual.xp + quantidade;

      await salvar({
        xp: novoXp,
        feitos: [...atual.feitos, idFeito],
        dias: somarXpNoDia(atual.dias, quantidade),
      });

      if (proximo && atual.xp < proximo.xpMinimo && novoXp >= proximo.xpMinimo) {
        mostrarAviso(
          `XP suficiente! Faça a prova do nível ${liberado.nome} na trilha para liberar o ${proximo.nome}.`,
          true
        );
      } else {
        mostrarAviso(`+${quantidade} XP`);
      }
      return quantidade;
    },
    [salvar, mostrarAviso]
  );

  // Registra acerto/erro de um conteúdo (letra, palavra, vogal). Erros viram
  // "revisão recomendada"; acertar reduz o contador de erros daquele item.
  const registrarResultado = useCallback(
    async (chave, acertou) => {
      const atual = usuarioRef.current;
      if (!atual || !chave) return;
      const erros = { ...atual.erros };
      if (acertou) {
        if (!erros[chave]) return;
        erros[chave] -= 1;
        if (erros[chave] <= 0) delete erros[chave];
      } else {
        erros[chave] = (erros[chave] || 0) + 1;
      }
      await salvar({ erros });
    },
    [salvar]
  );

  // Chamado a cada resposta de questão (Praticar, lições e prova).
  const responderQuestao = useCallback(
    async (questao, acertou) => {
      await registrarResultado(questao.item, acertou);
      if (acertou && questao.xp > 0) return ganharXp(questao.id, questao.xp);
      return 0;
    },
    [registrarResultado, ganharXp]
  );

  // Flashcards: dificuldade e favoritos ficam salvos na conta.
  const classificarCarta = useCallback(
    (id, dificuldade) => {
      const atual = usuarioRef.current;
      if (atual) salvar({ cartas: { ...atual.cartas, [id]: dificuldade } });
    },
    [salvar]
  );
  const favoritarCarta = useCallback(
    (id) => {
      const atual = usuarioRef.current;
      if (!atual) return;
      const ja = atual.favoritos.includes(id);
      salvar({ favoritos: ja ? atual.favoritos.filter((f) => f !== id) : [...atual.favoritos, id] });
    },
    [salvar]
  );

  // Missão feita vendo a resposta: conta como concluída, mas sem XP.
  const concluirSemXp = useCallback(
    async (id) => {
      const atual = usuarioRef.current;
      if (!atual || atual.feitos.includes(id)) return;
      await salvar({ feitos: [...atual.feitos, id] });
    },
    [salvar]
  );

  // Quiz de cultura da unidade concluído: XP da etapa (uma vez só).
  const concluirCultura = useCallback(
    async (nivelId) => {
      await ganharXp(`cultura:${nivelId}`, XP_CULTURA);
    },
    [ganharXp]
  );

  // Prova aprovada: libera o próximo nível e dá o bônus de XP.
  const aprovarNivel = useCallback(
    async (nivelId) => {
      const atual = usuarioRef.current;
      if (!atual) return;
      const novoNivel = Math.max(atual.nivelLiberado, nivelId + 1);
      await salvar({ nivelLiberado: novoNivel });
      await ganharXp(`prova:${nivelId}`, XP_BONUS_PROVA);
      const lugar = LUGARES.find((l) => l.id === CIDADE_POR_NIVEL[novoNivel]);
      mostrarAviso(
        `Nível ${nivelPorId(novoNivel).nome} liberado!${lugar ? ` Próxima parada: ${lugar.nome}.` : ""}`,
        true
      );
    },
    [salvar, ganharXp, mostrarAviso]
  );

  // Sai da conta: apaga a sessão (o XP continua salvo na conta).
  const sair = async () => {
    await logoutUser();
    usuarioRef.current = null;
    setUsuario(null);
    setFoco({});
    setTela("trilha");
  };

  const irPara = (novaTela, parametros = {}) => {
    setFoco(parametros);
    setTela(novaTela);
  };

  // Abre a parte do app correspondente a uma etapa da trilha.
  const abrirAcaoDaTrilha = (acao) => {
    if (!acao) return;
    if (acao.tela === "estudo") irPara("estudo");
    else if (acao.tela === "missoes") irPara("missoes", { nivelId: acao.nivelId });
    else if (acao.tela === "prova") irPara("prova", { nivelId: acao.nivelId });
    else if (acao.tela === "pratica") irPara("pratica");
    else if (acao.tela === "cultura") irPara("cultura", { nivelId: acao.nivelId });
    else if (acao.tela === "licao") irPara("licao", { licaoId: acao.licaoId, origem: "trilha" });
  };

  // Botão "voltar" do Android: volta para a trilha em vez de fechar o app.
  // Só fecha o app quando já está na trilha (ou sem login).
  useEffect(() => {
    if (Platform.OS !== "android") return undefined;
    const ouvinte = BackHandler.addEventListener("hardwareBackPress", () => {
      if (usuarioRef.current && tela !== "trilha") {
        setFoco({});
        setTela("trilha");
        return true;
      }
      return false;
    });
    return () => ouvinte.remove();
  }, [tela]);

  // ----- Qual tela mostrar -----
  let conteudo;
  const abasPrincipais = ["trilha", "estudar", "pratica", "israel", "perfil"];
  const voltarParaTrilha = () => irPara("trilha");

  if (carregando) {
    conteudo = (
      <View style={styles.centro}>
        <Logo largura={140} />
        <Text style={styles.carregandoTexto}>Carregando…</Text>
      </View>
    );
  } else if (!usuario) {
    conteudo = <LoginCadastro onLogin={carregarUsuario} onRegisterSuccess={carregarUsuario} />;
  } else if (tela === "estudo") {
    conteudo = <AlfabetoHebraico onVoltarParaHome={voltarParaTrilha} onGanharXp={ganharXp} />;
  } else if (tela === "missoes") {
    conteudo = (
      <Missoes usuario={usuario} nivelFoco={foco.nivelId} onVoltarParaHome={voltarParaTrilha} onGanharXp={ganharXp} onConcluirSemXp={concluirSemXp} />
    );
  } else if (tela === "licao") {
    conteudo = (
      <LicaoScreen
        usuario={usuario}
        licaoId={foco.licaoId}
        origem={foco.origem}
        onGanharXp={ganharXp}
        onResponderQuestao={responderQuestao}
        onVoltar={() => irPara(foco.origem === "estudar" ? "estudar" : "trilha")}
        onAbrirAcao={abrirAcaoDaTrilha}
      />
    );
  } else if (tela === "cultura") {
    conteudo = (
      <CulturaTela
        usuario={usuario}
        nivelId={foco.nivelId || 1}
        aoResponder={responderQuestao}
        aoConcluir={concluirCultura}
        aoVoltar={voltarParaTrilha}
      />
    );
  } else if (tela === "prova") {
    conteudo = (
      <ProvaNivel
        usuario={usuario}
        nivelId={foco.nivelId || 1}
        aoResponder={responderQuestao}
        aoAprovar={aprovarNivel}
        aoVoltar={voltarParaTrilha}
        aoRevisar={() => irPara("pratica", { modoPratica: "revisao" })}
      />
    );
  } else if (tela === "estudar") {
    conteudo = (
      <EstudarScreen
        usuario={usuario}
        onAbrirLicao={(licaoId) => irPara("licao", { licaoId, origem: "estudar" })}
        onIrParaEstudo={() => irPara("estudo")}
        onGanharXp={ganharXp}
        onClassificarCarta={classificarCarta}
        onFavoritarCarta={favoritarCarta}
      />
    );
  } else if (tela === "pratica") {
    conteudo = (
      <Pratica
        usuario={usuario}
        aoResponder={responderQuestao}
        modoInicial={foco.modoPratica}
        aoVoltar={voltarParaTrilha}
        aoAbrirProva={(nivelId) => irPara("prova", { nivelId })}
      />
    );
  } else if (tela === "israel") {
    conteudo = <Israel usuario={usuario} lugarInicial={foco.lugarId} aoPraticar={() => irPara("pratica", { modoPratica: "israel" })} />;
  } else if (tela === "perfil") {
    conteudo = (
      <Perfil
        usuario={usuario}
        aoVoltar={voltarParaTrilha}
        aoSair={sair}
        aoPraticarRevisao={() => irPara("pratica", { modoPratica: "revisao" })}
      />
    );
  } else {
    // Tela inicial: a TRILHA (mapa de etapas).
    conteudo = (
      <MapaProgressao
        usuario={usuario}
        sequencia={calcularSequencia(usuario.dias)}
        xpHoje={xpDoDia(usuario.dias)}
        onAbrirAcao={abrirAcaoDaTrilha}
        onAbrirIsrael={(lugarId) => irPara("israel", { lugarId })}
      />
    );
  }

  const mostrarBarra = !!usuario && abasPrincipais.includes(tela);

  return (
    <View style={styles.raiz}>
      {/* CaixaDeErro: se uma tela falhar, mostra uma mensagem em vez da tela vermelha */}
      <View style={styles.area}>
        <CaixaDeErro key={`${tela}-${foco.nivelId || ""}-${foco.lugarId || ""}-${foco.modoPratica || ""}`} aoVoltar={voltarParaTrilha}>
          {conteudo}
        </CaixaDeErro>
      </View>

      {mostrarBarra ? <BarraNavegacao atual={tela} aoMudar={(nova) => irPara(nova)} /> : null}

      {/* Mensagem rápida (XP ganho / prova liberada), por cima de qualquer tela */}
      {aviso ? (
        <View style={styles.avisoContainer} pointerEvents="none">
          <View
            style={[styles.aviso, aviso.destaque && styles.avisoDestaque]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
          >
            <Text style={[styles.avisoTexto, aviso.destaque && styles.avisoTextoDestaque]}>
              {aviso.texto}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------
// ESTILOS (as cores vêm de theme.js)
// ---------------------------------------------------------------------

// Espaço no topo para o conteúdo não ficar embaixo da barra de status
// do celular (no navegador não é necessário).
const MARGEM_TOPO =
  Platform.OS === "android" ? StatusBar.currentHeight || 0 : Platform.OS === "ios" ? 48 : 0;

// Espaço no fim da rolagem: no Android a barra de navegação do sistema
// fica por cima do app (tela de ponta a ponta), então damos uma folga.
const MARGEM_BASE = Platform.OS === "android" ? 64 : 30;

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  estudarTopo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
    marginTop: 4,
  },
  estudarTextos: { flex: 1 },
  estudarTitulo: { color: cores.texto, fontSize: 26, fontWeight: "900" },
  estudarSub: { color: cores.textoSuave, fontSize: 13, fontWeight: "700", marginTop: 2 },
  lerMais: { alignSelf: "flex-start", minHeight: 40, justifyContent: "center", marginBottom: 6 },
  lerMaisTexto: { color: cores.azulMedio, fontWeight: "800", fontSize: 14, textDecorationLine: "underline" },
  licaoTopo: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12, marginTop: 4 },
  licaoVoltar: { minHeight: 44, justifyContent: "center", backgroundColor: cores.branco, borderRadius: 999, paddingHorizontal: 14, borderWidth: 1, borderColor: cores.bordaSuave },
  licaoVoltarTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 14 },
  licaoTopoTitulo: { flex: 1, color: cores.texto, fontSize: 19, fontWeight: "900" },
  licaoCaixa: { backgroundColor: cores.branco, borderRadius: 20, borderWidth: 1, borderColor: cores.bordaSuave, paddingTop: 14, paddingHorizontal: 4 },
  passos: { flexDirection: "row", gap: 6, marginBottom: 12 },
  passo: { flex: 1, minHeight: 36, borderRadius: 999, backgroundColor: cores.branco, borderWidth: 1, borderColor: cores.bordaSuave, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
  passoAtivo: { backgroundColor: cores.azulEscuro, borderColor: cores.azulEscuro },
  passoFeito: { backgroundColor: cores.sucessoSuave, borderColor: cores.verdeMusgo },
  passoTexto: { color: cores.textoSuave, fontSize: 12, fontWeight: "800" },
  passoTextoAtivo: { color: cores.branco },
  botaoVideo: { minHeight: 44, borderRadius: 12, borderWidth: 1, borderColor: cores.azulClaro, backgroundColor: cores.branco, alignItems: "center", justifyContent: "center", marginTop: 8 },
  botaoVideoTexto: { color: cores.azulEscuro, fontWeight: "800", fontSize: 13 },
  raiz: {
    flex: 1,
    backgroundColor: cores.branco,
    paddingTop: MARGEM_TOPO,
  },
  centro: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: cores.fundoTela,
  },
  carregandoTexto: {
    marginTop: 12,
    color: cores.textoSuave,
    fontSize: 14,
    fontWeight: "700",
  },

  // Mensagem rápida
  avisoContainer: {
    position: "absolute",
    top: 14,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 16,
  },
  aviso: {
    backgroundColor: cores.azulEscuro,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 18,
    maxWidth: 520,
  },
  avisoDestaque: {
    backgroundColor: cores.laranja,
    borderRadius: 18,
  },
  avisoTexto: {
    color: cores.branco,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
  },
  avisoTextoDestaque: {
    color: cores.azulEscuro, // contraste melhor sobre o laranja
  },

  // Tela inicial
  container: {
    flex: 1,
    backgroundColor: cores.fundoTela,
  },
  conteudo: {
    width: "100%",
    maxWidth: 720, // largura confortável no computador
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: MARGEM_BASE,
  },
  headerCard: {
    backgroundColor: cores.branco,
    borderRadius: 24,
    padding: 16,
    marginTop: 8,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  headerTextos: {
    flex: 1,
  },
  eyebrow: {
    color: cores.azulMedio,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: {
    color: cores.texto,
    fontSize: 20,
    fontWeight: "800",
  },
  boasVindas: {
    color: cores.textoSuave,
    fontSize: 13,
    marginTop: 4,
    fontWeight: "700",
  },
  sairButton: {
    borderWidth: 1,
    borderColor: cores.azulClaro,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  sairTexto: {
    color: cores.azulEscuro,
    fontWeight: "800",
    fontSize: 13,
  },

  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  statBox: {
    flex: 1,
    backgroundColor: cores.branco,
    borderRadius: 18,
    padding: 14,
    marginHorizontal: 3,
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  statLabel: {
    fontSize: 11,
    color: cores.textoSuave,
    marginBottom: 6,
    fontWeight: "700",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: cores.texto,
  },
  statValueTexto: {
    fontSize: 15,
    fontWeight: "800",
    color: cores.texto,
    paddingVertical: 3,
  },

  progressCard: {
    backgroundColor: cores.branco,
    borderRadius: 18,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  progressTitle: {
    flex: 1,
    color: cores.texto,
    fontWeight: "700",
    fontSize: 14,
  },
  progressText: {
    color: cores.azulEscuro,
    fontWeight: "800",
    fontSize: 15,
  },
  progressBarBg: {
    width: "100%",
    height: 10,
    backgroundColor: cores.fundoSuave,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: cores.laranja,
    borderRadius: 999,
  },
  progressResumo: {
    color: cores.textoSuave,
    fontSize: 12,
    marginTop: 10,
    lineHeight: 18,
  },

  moduleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  moduleCard: {
    width: "31%",
    minHeight: 84,
    borderRadius: 18,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    backgroundColor: cores.branco,
    marginBottom: 10,
  },
  moduleCardSelected: {
    backgroundColor: cores.azulEscuro,
    borderColor: cores.azulEscuro,
  },
  moduleIcone: { marginBottom: 6 },
  moduleEmojiAntigo: {
    fontSize: 24,
    marginBottom: 6,
  },
  moduleTitle: {
    color: cores.texto,
    fontSize: 12,
    fontWeight: "800",
    textAlign: "center",
  },
  moduleTitleSelected: {
    color: cores.branco,
  },

  panel: {
    backgroundColor: cores.branco,
    borderRadius: 22,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  panelTitle: {
    color: cores.texto,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 6,
  },
  panelText: {
    color: cores.textoSuave,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  subtituloPainel: {
    color: cores.texto,
    fontSize: 14,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 10,
  },
  dicaNivel: {
    color: cores.textoSuave,
    fontSize: 12,
    marginTop: 4,
    fontWeight: "700",
  },

  // Vogais
  vowelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  vowelCard: {
    width: "30%",
    backgroundColor: cores.fundoSuave,
    borderRadius: 14,
    padding: 10,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  vowelCardAtivo: {
    borderColor: cores.laranja,
    borderWidth: 2,
  },
  vowelSinal: {
    fontSize: 26,
    color: cores.azulEscuro,
    fontWeight: "800",
  },
  vowelName: {
    color: cores.texto,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  vowelSound: {
    color: cores.textoSuave,
    fontSize: 11,
    marginTop: 2,
  },
  vogalDetalhe: {
    backgroundColor: cores.destaqueSuave,
    color: cores.texto,
    borderRadius: 12,
    padding: 10,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 6,
  },

  // Alfabeto (mini lista)
  listaMini: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: 8,
  },
  itemMini: {
    width: "22%",
    backgroundColor: cores.fundoSuave,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
  },
  itemMiniLetra: {
    fontSize: 30,
    color: cores.texto,
  },
  itemMiniNome: {
    fontSize: 10,
    color: cores.textoSuave,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "700",
  },

  // Palavras e frases
  grupoNivel: {
    marginBottom: 14,
  },
  grupoTitulo: {
    color: cores.azulMedio,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  wordList: {
    gap: 8,
  },
  wordItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: cores.fundoSuave,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    gap: 10,
  },
  wordIcone: { width: 46, height: 46, borderRadius: 23, backgroundColor: cores.branco, alignItems: "center", justifyContent: "center" },
  wordTextos: {
    flex: 1,
  },
  wordHeb: {
    fontSize: 20,
    color: cores.azulEscuro,
    fontWeight: "800",
  },
  wordPt: {
    color: cores.texto,
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  linhaBloqueada: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: cores.cinza,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  bloqueadaTitulo: {
    color: cores.texto,
    fontSize: 13,
    fontWeight: "800",
  },
  bloqueadaTexto: {
    color: cores.textoSuave,
    fontSize: 12,
    marginTop: 3,
  },

  // Lições
  licaoCard: {
    backgroundColor: cores.fundoSuave,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
    overflow: "hidden",
  },
  licaoCabecalho: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    gap: 10,
    minHeight: 48,
  },
  licaoTitulo: {
    flex: 1,
    color: cores.texto,
    fontSize: 14,
    fontWeight: "800",
  },
  licaoStatus: {
    color: cores.azulEscuro,
    fontSize: 12,
    fontWeight: "800",
  },
  licaoStatusOk: {
    color: cores.verdeMusgo,
    fontSize: 12,
    fontWeight: "800",
  },
  licaoDetalhe: {
    padding: 14,
    paddingTop: 0,
  },
  licaoTexto: {
    color: cores.texto,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 10,
  },
  exemplosBox: {
    backgroundColor: cores.branco,
    borderRadius: 12,
    padding: 10,
    gap: 8,
    marginBottom: 12,
  },
  exemploLinha: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  exemploTextos: {
    flex: 1,
  },
  exemploHeb: {
    fontSize: 22,
    color: cores.azulEscuro,
    fontWeight: "800",
  },
  exemploPt: {
    fontSize: 12,
    color: cores.textoSuave,
    fontWeight: "700",
    marginTop: 2,
  },
  concluidaBadge: {
    backgroundColor: cores.sucessoSuave,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  concluidaTexto: {
    color: cores.verdeMusgo,
    fontWeight: "800",
    fontSize: 14,
  },

  espacoPequeno: {
    height: 10,
  },

  // Revisão
  resumoLista: {
    gap: 10,
    marginBottom: 16,
  },
  resumoItem: {
    color: cores.texto,
    fontSize: 15,
    fontWeight: "700",
  },

  // Flashcards
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: cores.texto,
  },
  sectionInfo: {
    fontSize: 12,
    fontWeight: "700",
    color: cores.textoSuave,
  },
  flashCard: {
    backgroundColor: cores.branco,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  flashLabel: {
    color: cores.textoSuave,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  flashFrente: {
    fontSize: 54,
    color: cores.azulMedio,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },
  flashAudio: {
    alignItems: "center",
    marginBottom: 12,
  },
  flashResposta: {
    fontSize: 16,
    color: cores.texto,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8,
  },
  flashHint: {
    textAlign: "center",
    color: cores.textoSuave,
    marginBottom: 16,
    fontSize: 13,
  },
  flashDica: {
    color: cores.verdeMusgo,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10,
  },
  flashActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    gap: 10,
  },

  // Botões
  secondaryButton: {
    flex: 1,
    backgroundColor: cores.fundoSuave,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: cores.bordaSuave,
  },
  secondaryButtonText: {
    color: cores.texto,
    fontWeight: "700",
  },
  primaryButtonLarge: {
    backgroundColor: cores.azulEscuro,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  primaryButtonText: {
    color: cores.branco,
    fontWeight: "800",
    fontSize: 15,
  },
  botaoSucesso: {
    backgroundColor: cores.verdeMusgo,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoSucessoFlex: {
    flex: 1,
    backgroundColor: cores.verdeMusgo,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  botaoSucessoTexto: {
    color: cores.branco,
    fontWeight: "800",
    fontSize: 14,
  },
});
