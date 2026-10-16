/*
 * seguranca.js
 *
 * Funções de segurança usadas pelo userDB.js:
 *   1. Guardar senhas de forma SEGURA (hash PBKDF2-HMAC-SHA256 + salt).
 *   2. Gerar números aleatórios seguros (para salt e ids).
 *   3. Comparar textos sem vazar informação pelo tempo de resposta.
 *   4. Validar nome, email e senha.
 *
 * POR QUE NÃO GUARDAR A SENHA DIRETO?
 *   Quem abrir o armazenamento do aparelho/navegador leria todas as
 *   senhas. Com hash, só existe um "resumo" irreversível da senha.
 *   O salt (texto aleatório próprio de cada usuário) impede que duas
 *   pessoas com a mesma senha tenham o mesmo hash.
 *
 * SOBRE O CUSTO (iterações):
 *   Quanto mais iterações, mais difícil é adivinhar senhas por força
 *   bruta, porém mais lento é o login. O valor fica gravado junto de
 *   cada senha, então é possível aumentá-lo no futuro (veja
 *   ITERACOES_PADRAO) sem quebrar contas antigas.
 *
 * Todo o SHA-256 está implementado aqui em JavaScript puro, sem
 * bibliotecas, para funcionar igual no celular e no navegador.
 */

import { getRandomBytes } from "expo-crypto";

// Quantas vezes o hash é repetido. Aumente para mais segurança (o login
// fica mais lento). 5.000 mantém o login rápido mesmo em celulares simples.
export const ITERACOES_PADRAO = 5000;

// ---------------------------------------------------------------------
// SHA-256 (algoritmo padrão FIPS 180-4)
// ---------------------------------------------------------------------

// Constantes do algoritmo (raízes cúbicas dos 64 primeiros primos).
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function girar(valor, n) {
  return (valor >>> n) | (valor << (32 - n));
}

// Calcula o SHA-256 de uma sequência de bytes. Devolve 32 bytes.
function sha256(bytes) {
  const tamanho = bytes.length;
  // Preenchimento: byte 0x80, zeros e o tamanho em bits (64 bits).
  const totalBlocos = ((tamanho + 9 + 63) >> 6);
  const dados = new Uint8Array(totalBlocos * 64);
  dados.set(bytes);
  dados[tamanho] = 0x80;
  const visao = new DataView(dados.buffer);
  visao.setUint32(dados.length - 8, Math.floor((tamanho * 8) / 0x100000000), false);
  visao.setUint32(dados.length - 4, (tamanho * 8) >>> 0, false);

  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const w = new Uint32Array(64);

  for (let bloco = 0; bloco < totalBlocos; bloco++) {
    for (let i = 0; i < 16; i++) w[i] = visao.getUint32(bloco * 64 + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = girar(w[i - 15], 7) ^ girar(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = girar(w[i - 2], 17) ^ girar(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }

    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = girar(e, 6) ^ girar(e, 11) ^ girar(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 = girar(a, 2) ^ girar(a, 13) ^ girar(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }

  const saida = new Uint8Array(32);
  const visaoSaida = new DataView(saida.buffer);
  for (let i = 0; i < 8; i++) visaoSaida.setUint32(i * 4, h[i], false);
  return saida;
}

// HMAC-SHA256: hash com chave (padrão RFC 2104).
function hmacSha256(chave, mensagem) {
  let k = chave.length > 64 ? sha256(chave) : chave;
  const kInterna = new Uint8Array(64 + mensagem.length);
  const kExterna = new Uint8Array(64 + 32);
  for (let i = 0; i < 64; i++) {
    const byte = i < k.length ? k[i] : 0;
    kInterna[i] = byte ^ 0x36;
    kExterna[i] = byte ^ 0x5c;
  }
  kInterna.set(mensagem, 64);
  kExterna.set(sha256(kInterna), 64);
  return sha256(kExterna);
}

// PBKDF2-HMAC-SHA256 (padrão RFC 8018) com saída de 32 bytes.
function pbkdf2(senhaBytes, saltBytes, iteracoes) {
  const bloco1 = new Uint8Array(saltBytes.length + 4);
  bloco1.set(saltBytes);
  bloco1[saltBytes.length + 3] = 1; // contador do bloco = 1 (big-endian)

  let u = hmacSha256(senhaBytes, bloco1);
  const resultado = Uint8Array.from(u);
  for (let i = 1; i < iteracoes; i++) {
    u = hmacSha256(senhaBytes, u);
    for (let j = 0; j < 32; j++) resultado[j] ^= u[j];
  }
  return resultado;
}

// ---------------------------------------------------------------------
// Conversões de texto e bytes
// ---------------------------------------------------------------------

// Texto -> bytes UTF-8 (aceita acentos, hebraico, emojis).
function textoParaBytes(texto) {
  const bytes = [];
  for (const caractere of String(texto)) {
    let codigo = caractere.codePointAt(0);
    if (codigo < 0x80) {
      bytes.push(codigo);
    } else if (codigo < 0x800) {
      bytes.push(0xc0 | (codigo >> 6), 0x80 | (codigo & 0x3f));
    } else if (codigo < 0x10000) {
      bytes.push(0xe0 | (codigo >> 12), 0x80 | ((codigo >> 6) & 0x3f), 0x80 | (codigo & 0x3f));
    } else {
      bytes.push(
        0xf0 | (codigo >> 18),
        0x80 | ((codigo >> 12) & 0x3f),
        0x80 | ((codigo >> 6) & 0x3f),
        0x80 | (codigo & 0x3f)
      );
    }
  }
  return Uint8Array.from(bytes);
}

function bytesParaHex(bytes) {
  let texto = "";
  for (const byte of bytes) texto += byte.toString(16).padStart(2, "0");
  return texto;
}

function hexParaBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}

// ---------------------------------------------------------------------
// ALEATÓRIO SEGURO
// ---------------------------------------------------------------------

// Devolve `quantidade` bytes aleatórios criptograficamente seguros.
// Se o aparelho não tiver gerador seguro, LANÇA ERRO (é melhor não
// cadastrar do que criar uma senha protegida por um salt previsível).
export function bytesAleatorios(quantidade) {
  try {
    return getRandomBytes(quantidade);
  } catch (erro) {
    if (typeof globalThis !== "undefined" && globalThis.crypto && globalThis.crypto.getRandomValues) {
      return globalThis.crypto.getRandomValues(new Uint8Array(quantidade));
    }
    throw new Error("SEM_ALEATORIO_SEGURO");
  }
}

// Gera um texto hexadecimal aleatório (ex.: para ids de usuário).
export function idAleatorio(bytes = 16) {
  return bytesParaHex(bytesAleatorios(bytes));
}

// ---------------------------------------------------------------------
// SENHAS
// ---------------------------------------------------------------------

/**
 * Cria o registro seguro de uma senha, para guardar no lugar dela.
 * Formato: { alg, iteracoes, salt, hash } -- todos textos simples.
 */
export function criarRegistroSenha(senha) {
  const salt = bytesAleatorios(16);
  const hash = pbkdf2(textoParaBytes(senha), salt, ITERACOES_PADRAO);
  return {
    alg: "pbkdf2-sha256",
    iteracoes: ITERACOES_PADRAO,
    salt: bytesParaHex(salt),
    hash: bytesParaHex(hash),
  };
}

/**
 * Confere se uma senha digitada corresponde ao registro guardado.
 * A comparação final é feita em tempo constante.
 */
export function verificarSenha(senha, registro) {
  if (
    !registro ||
    registro.alg !== "pbkdf2-sha256" ||
    typeof registro.salt !== "string" ||
    typeof registro.hash !== "string" ||
    !Number.isInteger(registro.iteracoes) ||
    registro.iteracoes < 1 ||
    registro.iteracoes > 1000000
  ) {
    return false;
  }

  const calculado = bytesParaHex(
    pbkdf2(textoParaBytes(senha), hexParaBytes(registro.salt), registro.iteracoes)
  );
  return compararSeguro(calculado, registro.hash);
}

/**
 * Compara dois textos sem parar no primeiro caractere diferente.
 * Assim o tempo de resposta não revela "quantas letras acertou".
 */
export function compararSeguro(a, b) {
  const textoA = String(a);
  const textoB = String(b);
  let diferenca = textoA.length ^ textoB.length;
  const maior = Math.max(textoA.length, textoB.length);
  for (let i = 0; i < maior; i++) {
    diferenca |= (textoA.charCodeAt(i) || 0) ^ (textoB.charCodeAt(i) || 0);
  }
  return diferenca === 0;
}

// Gasta o mesmo tempo de uma verificação real. Usado quando o email não
// existe, para que o tempo de resposta não revele se a conta existe.
export function verificacaoFalsa(senha) {
  pbkdf2(textoParaBytes(senha), new Uint8Array(16), ITERACOES_PADRAO);
}

// ---------------------------------------------------------------------
// VALIDAÇÕES (altere aqui as regras de nome, email e senha)
// ---------------------------------------------------------------------

export const LIMITES = {
  nomeMin: 2,
  nomeMax: 60,
  emailMax: 254,
  senhaMin: 8,
  senhaMax: 72,
};

// Deixa o email em minúsculas e sem espaços nas pontas.
export function normalizarEmail(email) {
  return String(email || "").trim().toLowerCase();
}

// Remove espaços repetidos e caracteres de controle do nome.
export function limparNome(nome) {
  return String(nome || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Cada validador devolve null (ok) ou um texto explicando o problema.
export function validarNome(nome) {
  const limpo = limparNome(nome);
  if (limpo.length < LIMITES.nomeMin || limpo.length > LIMITES.nomeMax) {
    return `O nome deve ter de ${LIMITES.nomeMin} a ${LIMITES.nomeMax} caracteres.`;
  }
  return null;
}

export function validarEmail(email) {
  const normalizado = normalizarEmail(email);
  const formatoValido = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizado);
  if (!formatoValido || normalizado.length > LIMITES.emailMax) {
    return "Digite um email válido, como nome@exemplo.com.";
  }
  return null;
}

export function validarSenha(senha) {
  const texto = String(senha || "");
  if (texto.length < LIMITES.senhaMin || texto.length > LIMITES.senhaMax) {
    return `A senha deve ter de ${LIMITES.senhaMin} a ${LIMITES.senhaMax} caracteres.`;
  }
  if (!/[A-Za-zÀ-ÿ]/.test(texto) || !/[0-9]/.test(texto)) {
    return "A senha precisa ter pelo menos uma letra e um número.";
  }
  return null;
}
