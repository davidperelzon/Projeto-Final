/*
 * questoesCultura.js
 *
 * Questões sobre cidades e personalidades de Israel. O aluno aprende
 * RESPONDENDO (foto, pista curta, áudio do nome em hebraico), sem ler
 * textos longos. Os dados vêm de dadosIsrael.js e fotos.js.
 *
 * TIPOS:
 *   foto-lugar    ... vê a foto -> escolhe a cidade
 *   foto-pessoa   ... vê o retrato -> escolhe quem é
 *   pista-lugar   ... lê UMA frase curta -> escolhe o lugar
 *   pista-pessoa  ... lê UMA frase curta -> escolhe a pessoa
 *   ouvir-lugar   ... ouve o nome em hebraico -> escolhe o lugar
 *   ouvir-pessoa  ... ouve o nome em hebraico -> escolhe a pessoa
 * O formato das questões é o mesmo de questoes.js (campo `foto` mostra a foto).
 */
import {
  CIDADE_POR_NIVEL,
  LUGARES,
  PERSONALIDADES,
  PESSOA_POR_NIVEL,
  PISTA_LUGAR,
  PISTA_PESSOA,
} from "./dadosIsrael";
import { FOTOS } from "./fotos";

export const XP_QUESTAO_CULTURA = 5;

function embaralhar(lista) {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Monta 4 opções (a certa + 3 erradas) com o texto de cada item.
function opcoes(certo, outros, textoDe, quantas = 4) {
  const erradas = embaralhar(outros.filter((o) => o.id !== certo.id)).slice(0, quantas - 1);
  const todas = embaralhar([certo, ...erradas]);
  const lista = todas.map((item, i) => ({ id: String(i), texto: textoDe(item), heb: false, nota: "" }));
  return { opcoes: lista, correta: String(todas.findIndex((item) => item.id === certo.id)) };
}

const CIDADES = LUGARES.filter((l) => l.tipo === "cidade");
const CIDADES_COM_FOTO = CIDADES.filter((l) => FOTOS[l.id]);
const PESSOAS = PERSONALIDADES;

function base(tipo, id) {
  return { id: `quiz:cult-${tipo}-${id}`, item: `cult:${id}`, tipo, enunciado: "", enunciadoHeb: false, xp: XP_QUESTAO_CULTURA };
}

// ----- lugares -----
function fotoLugar(lugar) {
  const { opcoes: o, correta } = opcoes(lugar, CIDADES_COM_FOTO, (l) => l.nome);
  return { ...base("foto-lugar", lugar.id), instrucao: "Que cidade é esta?", foto: lugar.id, opcoes: o, correta, explicacao: `${lugar.nome} (${lugar.heb}).` };
}
function pistaLugar(lugar) {
  const { opcoes: o, correta } = opcoes(lugar, LUGARES, (l) => l.nome);
  return { ...base("pista-lugar", lugar.id), instrucao: PISTA_LUGAR[lugar.id], icone: "help-circle", opcoes: o, correta, explicacao: `${lugar.nome} (${lugar.heb}).` };
}
function ouvirLugar(lugar) {
  const { opcoes: o, correta } = opcoes(lugar, LUGARES, (l) => l.nome);
  return { ...base("ouvir-lugar", lugar.id), instrucao: "Ouça o nome em hebraico e escolha o lugar.", icone: "ear", audio: lugar.heb, opcoes: o, correta, explicacao: `${lugar.heb} = ${lugar.nome}.` };
}

// ----- pessoas -----
function fotoPessoa(pessoa) {
  const { opcoes: o, correta } = opcoes(pessoa, PESSOAS, (p) => p.nome);
  return { ...base("foto-pessoa", pessoa.id), instrucao: "Quem é esta pessoa?", foto: pessoa.id, opcoes: o, correta, explicacao: `${pessoa.nome} (${pessoa.heb}): ${PISTA_PESSOA[pessoa.id]}` };
}
function pistaPessoa(pessoa) {
  const { opcoes: o, correta } = opcoes(pessoa, PESSOAS, (p) => p.nome);
  return { ...base("pista-pessoa", pessoa.id), instrucao: PISTA_PESSOA[pessoa.id], icone: "help-circle", opcoes: o, correta, explicacao: `${pessoa.nome} (${pessoa.heb}).` };
}
function ouvirPessoa(pessoa) {
  const { opcoes: o, correta } = opcoes(pessoa, PESSOAS, (p) => p.nome);
  return { ...base("ouvir-pessoa", pessoa.id), instrucao: "Ouça o nome em hebraico e escolha a pessoa.", icone: "ear", audio: pessoa.heb, opcoes: o, correta, explicacao: `${pessoa.heb} = ${pessoa.nome}. ${PISTA_PESSOA[pessoa.id]}` };
}

const achaLugar = (id) => LUGARES.find((l) => l.id === id);
const achaPessoa = (id) => PESSOAS.find((p) => p.id === id);

// Quiz da trilha: 6 questões da cidade e da personalidade do nível.
export function questoesCulturaDoNivel(nivelId) {
  const lugar = achaLugar(CIDADE_POR_NIVEL[nivelId]);
  const pessoa = achaPessoa(PESSOA_POR_NIVEL[nivelId]);
  const lista = [];
  if (lugar) lista.push(fotoLugar(lugar), pistaLugar(lugar), ouvirLugar(lugar));
  if (pessoa) lista.push(fotoPessoa(pessoa), pistaPessoa(pessoa), ouvirPessoa(pessoa));
  return embaralhar(lista);
}

// Todas as questões possíveis até o nível informado (cidades e pessoas já liberadas).
function todasAteNivel(nivelId) {
  const lista = [];
  for (let n = 1; n <= nivelId; n++) lista.push(...questoesCulturaDoNivel(n));
  // Lugares extras (sem foto) entram só com pista e áudio.
  LUGARES.filter((l) => !Object.values(CIDADE_POR_NIVEL).includes(l.id)).forEach((l) => lista.push(pistaLugar(l), ouvirLugar(l)));
  return lista;
}

// Modo "Israel" da aba Praticar.
export function montarSessaoCultura({ nivelId = 1, quantidade = 8 }) {
  return embaralhar(todasAteNivel(nivelId)).slice(0, quantidade);
}

// Uma questão de cultura para a prova do nível.
export function questaoCulturaProva(nivelId) {
  const lista = questoesCulturaDoNivel(nivelId);
  return lista.length ? lista[0] : null;
}

// Nome para a lista de revisão (chave "cult:herzl" -> "Theodor Herzl").
export function nomeCultura(chave) {
  const id = String(chave).replace("cult:", "");
  const lugar = achaLugar(id);
  if (lugar) return `${lugar.nome} · ${lugar.heb}\u200E`;
  const pessoa = achaPessoa(id);
  return pessoa ? `${pessoa.nome} · ${pessoa.heb}\u200E` : null;
}
