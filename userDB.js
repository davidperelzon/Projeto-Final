/*
 * userDB.js
 *
 * "Banco de dados" local do app: contas, sessão e XP de cada usuário.
 * Tudo fica guardado no próprio aparelho (AsyncStorage no celular,
 * localStorage no navegador). NÃO existe servidor.
 *
 * SEGURANÇA (resumo do que este arquivo faz):
 *   - Senhas NUNCA são guardadas: só um hash PBKDF2 com salt (seguranca.js).
 *   - Contas antigas, que guardavam a senha em texto puro, são
 *     convertidas automaticamente no primeiro login.
 *   - Limite de tentativas: após 5 senhas erradas, o email fica
 *     bloqueado por 5 minutos.
 *   - O login erra de forma idêntica para "email não existe" e "senha
 *     errada", e gasta o mesmo tempo nos dois casos.
 *   - Tudo que é lido do armazenamento é validado antes de ser usado.
 *   - Gravações são feitas uma de cada vez (fila), sem se atropelarem.
 *
 * LIMITE IMPORTANTE: como não há servidor, quem tiver acesso ao aparelho
 * (ou ao navegador) consegue ver e alterar estes dados, inclusive o XP.
 * Para um app com contas "de verdade", o ideal é um servidor com
 * autenticação (ex.: Firebase Auth ou Supabase).
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { nivelPorXp } from "./niveis";
import {
  criarRegistroSenha,
  verificarSenha,
  verificacaoFalsa,
  compararSeguro,
  idAleatorio,
  normalizarEmail,
  limparNome,
  validarNome,
  validarEmail,
  validarSenha,
} from "./seguranca";

const USERS_KEY = "nativ_ivrit_users";
const SESSION_KEY = "nativ_ivrit_session";
const TENTATIVAS_KEY = "nativ_ivrit_tentativas";

// Regras do bloqueio por tentativas erradas (altere aqui).
const MAX_FALHAS = 5; // erros seguidos até bloquear
const BLOQUEIO_MS = 5 * 60 * 1000; // 5 minutos

// Limites do que aceitamos gravar como progresso.
const XP_MAXIMO = 1000000;
const FEITOS_MAXIMO = 2000;
const ID_FEITO_MAXIMO = 80;
const DIAS_MAXIMOS = 90;
const ERROS_MAXIMOS = 500;
const FAVORITOS_MAXIMOS = 300;
const DIFICULDADES = ["facil", "bom", "dificil"];

// ---------------------------------------------------------------------
// ARMAZENAMENTO (leitura/gravação seguras)
// ---------------------------------------------------------------------

// Lê um JSON do armazenamento. Se estiver vazio ou corrompido, devolve
// o valor padrão em vez de quebrar o app.
async function lerJson(chave, padrao) {
  try {
    const texto = await AsyncStorage.getItem(chave);
    return texto ? JSON.parse(texto) : padrao;
  } catch (erro) {
    return padrao;
  }
}

async function gravarJson(chave, valor) {
  await AsyncStorage.setItem(chave, JSON.stringify(valor));
}

// Fila de operações: cada uma só começa quando a anterior termina.
// Evita que duas gravações simultâneas sobrescrevam uma à outra.
let filaAtual = Promise.resolve();
function naFila(operacao) {
  const resultado = filaAtual.then(operacao, operacao);
  filaAtual = resultado.catch(() => {});
  return resultado;
}

// ---------------------------------------------------------------------
// VALIDAÇÃO DO QUE VEM DO ARMAZENAMENTO
// ---------------------------------------------------------------------

// Garante que `xp` seja um número inteiro válido.
function xpValido(valor) {
  const numero = Number(valor);
  if (!Number.isFinite(numero) || numero < 0) return 0;
  return Math.min(Math.floor(numero), XP_MAXIMO);
}

// Garante que `feitos` seja uma lista de textos curtos, sem repetição.
function feitosValidos(lista) {
  if (!Array.isArray(lista)) return [];
  const unicos = new Set();
  for (const item of lista) {
    if (typeof item === "string" && item.length > 0 && item.length <= ID_FEITO_MAXIMO) {
      unicos.add(item);
    }
    if (unicos.size >= FEITOS_MAXIMO) break;
  }
  return [...unicos];
}

// `dias` = { "2026-10-02": xpGanhoNoDia }. Mantém só datas válidas e recentes.
function diasValidos(objeto) {
  if (!objeto || typeof objeto !== "object" || Array.isArray(objeto)) return {};
  const chaves = Object.keys(objeto)
    .filter((chave) => /^\d{4}-\d{2}-\d{2}$/.test(chave))
    .sort()
    .slice(-DIAS_MAXIMOS);
  const resultado = {};
  chaves.forEach((chave) => {
    resultado[chave] = xpValido(objeto[chave]);
  });
  return resultado;
}

// `erros` = { "pal-shalom": 2 }: quantas vezes o estudante errou cada item.
function errosValidos(objeto) {
  if (!objeto || typeof objeto !== "object" || Array.isArray(objeto)) return {};
  const resultado = {};
  for (const chave of Object.keys(objeto)) {
    const valor = Math.floor(Number(objeto[chave]));
    if (chave.length > 0 && chave.length <= ID_FEITO_MAXIMO && Number.isFinite(valor) && valor > 0) {
      resultado[chave] = Math.min(valor, 99);
    }
    if (Object.keys(resultado).length >= ERROS_MAXIMOS) break;
  }
  return resultado;
}

// `cartas` = { "c2-toda": "dificil" | "bom" | "facil" }.
function cartasValidas(objeto) {
  if (!objeto || typeof objeto !== "object" || Array.isArray(objeto)) return {};
  const resultado = {};
  for (const chave of Object.keys(objeto)) {
    if (chave.length <= ID_FEITO_MAXIMO && DIFICULDADES.includes(objeto[chave])) {
      resultado[chave] = objeto[chave];
    }
  }
  return resultado;
}

// `favoritos` = lista de ids de cartas favoritas.
function favoritosValidos(lista) {
  if (!Array.isArray(lista)) return [];
  const unicos = new Set();
  for (const item of lista) {
    if (typeof item === "string" && item.length > 0 && item.length <= ID_FEITO_MAXIMO) unicos.add(item);
    if (unicos.size >= FAVORITOS_MAXIMOS) break;
  }
  return [...unicos];
}

// Nível que o aluno JÁ PASSOU na prova (1 a 4). Contas antigas, que não
// tinham esse campo, ficam no nível que o XP delas já dava (nada é perdido).
// Nunca passa do nível permitido pelo XP.
function nivelLiberadoValido(usuario) {
  const porXp = nivelPorXp(xpValido(usuario.xp)).id;
  const guardado = Number.isInteger(usuario.nivelLiberado) ? usuario.nivelLiberado : porXp;
  return Math.min(Math.max(guardado, 1), porXp);
}

// Lista de usuários, descartando registros que não tenham o formato esperado.
async function lerUsuarios() {
  const lista = await lerJson(USERS_KEY, []);
  if (!Array.isArray(lista)) return [];
  return lista.filter(
    (usuario) =>
      usuario &&
      typeof usuario.id === "string" &&
      typeof usuario.email === "string" &&
      typeof usuario.nome === "string"
  );
}

// Dados que a tela pode ver (NUNCA inclui senha, hash ou salt).
function dadosPublicos(usuario) {
  return {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    xp: xpValido(usuario.xp),
    feitos: feitosValidos(usuario.feitos),
    dias: diasValidos(usuario.dias),
    erros: errosValidos(usuario.erros),
    cartas: cartasValidas(usuario.cartas),
    favoritos: favoritosValidos(usuario.favoritos),
    nivelLiberado: nivelLiberadoValido(usuario),
  };
}

// ---------------------------------------------------------------------
// BLOQUEIO POR TENTATIVAS ERRADAS
// ---------------------------------------------------------------------

// Devolve quantos segundos faltam para o email ser desbloqueado (0 = livre).
async function segundosBloqueado(email) {
  const tentativas = await lerJson(TENTATIVAS_KEY, {});
  const registro = tentativas[email];
  if (!registro || !registro.ate) return 0;
  const restante = registro.ate - Date.now();
  return restante > 0 ? Math.ceil(restante / 1000) : 0;
}

// Conta uma senha errada. Ao chegar no limite, bloqueia o email.
async function registrarFalha(email) {
  const tentativas = await lerJson(TENTATIVAS_KEY, {});
  const agora = Date.now();

  // Limpa registros antigos para a lista não crescer sem limite.
  for (const chave of Object.keys(tentativas)) {
    if (tentativas[chave].ate && tentativas[chave].ate < agora) delete tentativas[chave];
  }

  const atual = tentativas[email] || { falhas: 0, ate: 0 };
  atual.falhas = (atual.falhas || 0) + 1;
  if (atual.falhas >= MAX_FALHAS) {
    atual.ate = agora + BLOQUEIO_MS;
    atual.falhas = 0;
  }
  tentativas[email] = atual;
  await gravarJson(TENTATIVAS_KEY, tentativas);
}

// Zera o contador depois de um login correto.
async function limparFalhas(email) {
  const tentativas = await lerJson(TENTATIVAS_KEY, {});
  if (tentativas[email]) {
    delete tentativas[email];
    await gravarJson(TENTATIVAS_KEY, tentativas);
  }
}

// ---------------------------------------------------------------------
// CADASTRO E LOGIN
// ---------------------------------------------------------------------

/**
 * Cria uma conta nova e já deixa o usuário logado.
 * Lança Error com um destes códigos: NOME_INVALIDO, EMAIL_INVALIDO,
 * SENHA_INVALIDA, EMAIL_JA_EXISTE.
 */
export function registerUser({ nome, email, password }) {
  return naFila(async () => {
    if (validarNome(nome)) throw new Error("NOME_INVALIDO");
    if (validarEmail(email)) throw new Error("EMAIL_INVALIDO");
    if (validarSenha(password)) throw new Error("SENHA_INVALIDA");

    const emailNormalizado = normalizarEmail(email);
    const usuarios = await lerUsuarios();

    if (usuarios.some((usuario) => normalizarEmail(usuario.email) === emailNormalizado)) {
      throw new Error("EMAIL_JA_EXISTE");
    }

    const novoUsuario = {
      id: idAleatorio(16), // id aleatório (não dá para adivinhar)
      nome: limparNome(nome),
      email: emailNormalizado,
      senha: criarRegistroSenha(password), // hash + salt, nunca a senha
      xp: 0,
      feitos: [],
      dias: {},
      erros: {},
      cartas: {},
      favoritos: [],
      nivelLiberado: 1, // sobe passando na prova de cada nível
    };

    await gravarJson(USERS_KEY, [...usuarios, novoUsuario]);
    await gravarJson(SESSION_KEY, { id: novoUsuario.id });
    return dadosPublicos(novoUsuario);
  });
}

/**
 * Tenta entrar. Devolve sempre um objeto:
 *   { ok: true,  usuario }                  -> deu certo
 *   { ok: false, motivo: "credenciais" }    -> email ou senha errados
 *   { ok: false, motivo: "bloqueado", segundos } -> muitas tentativas
 */
export function loginUser(email, password) {
  return naFila(async () => {
    const emailNormalizado = normalizarEmail(email);
    const senha = String(password || "");

    const segundos = await segundosBloqueado(emailNormalizado);
    if (segundos > 0) return { ok: false, motivo: "bloqueado", segundos };

    const usuarios = await lerUsuarios();
    const indice = usuarios.findIndex(
      (usuario) => normalizarEmail(usuario.email) === emailNormalizado
    );

    let senhaCorreta = false;

    if (indice === -1) {
      // Email inexistente: gasta o mesmo tempo para não revelar isso.
      verificacaoFalsa(senha);
    } else if (usuarios[indice].senha) {
      senhaCorreta = verificarSenha(senha, usuarios[indice].senha);
    } else if (typeof usuarios[indice].password === "string") {
      // CONTA ANTIGA (senha em texto puro): confere e converte para hash.
      senhaCorreta = compararSeguro(usuarios[indice].password, senha.trim());
      if (senhaCorreta) {
        const { password: senhaAntiga, ...resto } = usuarios[indice];
        usuarios[indice] = { ...resto, senha: criarRegistroSenha(senha.trim()) };
        await gravarJson(USERS_KEY, usuarios);
      }
    }

    if (!senhaCorreta) {
      await registrarFalha(emailNormalizado);
      return { ok: false, motivo: "credenciais" };
    }

    await limparFalhas(emailNormalizado);
    await gravarJson(SESSION_KEY, { id: usuarios[indice].id });
    return { ok: true, usuario: dadosPublicos(usuarios[indice]) };
  });
}

// ---------------------------------------------------------------------
// SESSÃO
// ---------------------------------------------------------------------

// Devolve { id } se há alguém logado, ou null.
export async function getSession() {
  const sessao = await lerJson(SESSION_KEY, null);
  return sessao && typeof sessao.id === "string" ? { id: sessao.id } : null;
}

// Sai da conta (o XP continua salvo).
export async function logoutUser() {
  await AsyncStorage.removeItem(SESSION_KEY);
}

// Devolve o usuário logado (sem senha) ou null. Se a sessão apontar para
// uma conta que não existe mais, a sessão é apagada.
export async function getUsuarioAtual() {
  const sessao = await getSession();
  if (!sessao) return null;

  const usuarios = await lerUsuarios();
  const usuario = usuarios.find((item) => item.id === sessao.id);

  if (!usuario) {
    await logoutUser();
    return null;
  }
  if (!Number.isInteger(usuario.nivelLiberado)) {
    // Conta antiga: fixa agora o nível que ela já tinha pelo XP.
    await atualizarProgresso(usuario.id, { nivelLiberado: nivelPorXp(xpValido(usuario.xp)).id });
  }
  return dadosPublicos(usuario);
}

// ---------------------------------------------------------------------
// PROGRESSO (XP e conquistas de cada usuário)
// ---------------------------------------------------------------------

/**
 * Salva o progresso do usuário. `alteracoes` pode ter qualquer um destes
 * campos (os que não vierem ficam como estavam):
 *   xp, feitos, dias, erros, cartas, favoritos
 * Só estes campos são aceitos, e cada um passa por validação.
 */
export function atualizarProgresso(id, alteracoes) {
  return naFila(async () => {
    const dados = alteracoes || {};
    const usuarios = await lerUsuarios();
    const atualizados = usuarios.map((usuario) => {
      if (usuario.id !== id) return usuario;
      const novo = { ...usuario };
      if ("xp" in dados) novo.xp = xpValido(dados.xp);
      if ("feitos" in dados) novo.feitos = feitosValidos(dados.feitos);
      if ("dias" in dados) novo.dias = diasValidos(dados.dias);
      if ("erros" in dados) novo.erros = errosValidos(dados.erros);
      if ("cartas" in dados) novo.cartas = cartasValidas(dados.cartas);
      if ("favoritos" in dados) novo.favoritos = favoritosValidos(dados.favoritos);
      if ("nivelLiberado" in dados) novo.nivelLiberado = nivelLiberadoValido({ xp: novo.xp, nivelLiberado: dados.nivelLiberado });
      return novo;
    });
    await gravarJson(USERS_KEY, atualizados);
  });
}
