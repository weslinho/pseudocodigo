'use strict';

const { formatar, TIPOS_INFO } = require('./tipos');

/**
 * Funções pré-definidas. Para criar uma nova, basta acrescentar uma entrada aqui:
 *  nomes:     nomes aceitos (todos viram palavras reservadas)
 *  params:    tipos dos parâmetros ('numero' | 'texto' | 'logico' | 'qualquer')
 *  min:       mínimo de argumentos (padrão: params.length)
 *  variadico: o último parâmetro pode se repetir
 *  retorno:   tipo do resultado
 * Trigonometria trabalha em RADIANOS (use GRAUS() / RADIANOS() para converter).
 */
const arredondar = (x, casas = 0) => {
  if (!Number.isInteger(casas) || casas < 0) throw new Error('o número de casas deve ser inteiro e >= 0.');
  if (String(x).includes('e')) { const f = 10 ** casas; return Math.round(x * f) / f; }
  return Number(Math.round(Number(`${x}e${casas}`)) + `e-${casas}`);
};

const logPositivo = (f) => (x) => {
  if (x <= 0) throw new Error('o logaritmo só existe para números maiores que zero.');
  return f(x);
};

const DEFS = [
  { nomes: ['SQRT'], params: ['numero'], retorno: 'numero',
    fn: (x) => { if (x < 0) throw new Error('não existe raiz quadrada de número negativo.'); return Math.sqrt(x); } },
  { nomes: ['ABS'], params: ['numero'], retorno: 'numero', fn: Math.abs },
  { nomes: ['SEN'], params: ['numero'], retorno: 'numero', fn: Math.sin },
  { nomes: ['COS'], params: ['numero'], retorno: 'numero', fn: Math.cos },
  { nomes: ['TAN'], params: ['numero'], retorno: 'numero', fn: Math.tan },
  { nomes: ['ASEN'], params: ['numero'], retorno: 'numero', fn: Math.asin },
  { nomes: ['ACOS'], params: ['numero'], retorno: 'numero', fn: Math.acos },
  { nomes: ['ATAN'], params: ['numero'], retorno: 'numero', fn: Math.atan },
  { nomes: ['GRAUS'], params: ['numero'], retorno: 'numero', fn: (x) => (x * 180) / Math.PI },
  { nomes: ['RADIANOS'], params: ['numero'], retorno: 'numero', fn: (x) => (x * Math.PI) / 180 },
  { nomes: ['EXP'], params: ['numero'], retorno: 'numero', fn: Math.exp },
  { nomes: ['LN'], params: ['numero'], retorno: 'numero', fn: logPositivo(Math.log) },
  { nomes: ['LOG'], params: ['numero'], retorno: 'numero', fn: logPositivo(Math.log10) },
  { nomes: ['POW'], params: ['numero', 'numero'], retorno: 'numero', fn: Math.pow },
  { nomes: ['ROUND', 'ARREDONDAR'], params: ['numero', 'numero'], min: 1, retorno: 'numero', fn: arredondar },
  { nomes: ['TRUNC'], params: ['numero'], retorno: 'numero', fn: Math.trunc },
  { nomes: ['FLOOR'], params: ['numero'], retorno: 'numero', fn: Math.floor },
  { nomes: ['CEIL'], params: ['numero'], retorno: 'numero', fn: Math.ceil },
  { nomes: ['MAX'], params: ['numero'], variadico: true, retorno: 'numero', fn: (...a) => Math.max(...a) },
  { nomes: ['MIN'], params: ['numero'], variadico: true, retorno: 'numero', fn: (...a) => Math.min(...a) },
  { nomes: ['ALEATORIO'], params: ['numero', 'numero'], retorno: 'numero',
    fn: (a, b) => {
      if (!Number.isInteger(a) || !Number.isInteger(b)) throw new Error('use números inteiros: ALEATORIO(minimo, maximo).');
      if (a > b) throw new Error('o mínimo não pode ser maior que o máximo.');
      return a + Math.floor(Math.random() * (b - a + 1));
    } },
  { nomes: ['MAIUSCULO'], params: ['texto'], retorno: 'texto', fn: (t) => t.toUpperCase() },
  { nomes: ['MINUSCULO'], params: ['texto'], retorno: 'texto', fn: (t) => t.toLowerCase() },
  { nomes: ['TAM_TEXTO'], params: ['texto'], retorno: 'numero', fn: (t) => t.length },
  { nomes: ['SUBTEXTO'], params: ['texto', 'numero', 'numero'], retorno: 'texto',
    fn: (t, ini, qtd) => {
      if (!Number.isInteger(ini) || !Number.isInteger(qtd) || ini < 1 || qtd < 0)
        throw new Error('use SUBTEXTO(texto, inicio, quantidade) com inicio >= 1 (a 1ª letra é a posição 1).');
      return t.substr(ini - 1, qtd);
    } },
  // posição começando em 1; 0 = não encontrado
  { nomes: ['LOCALIZAR'], params: ['texto', 'texto'], retorno: 'numero', fn: (sub, t) => t.indexOf(sub) + 1 },
  { nomes: ['PARA_TEXTO'], params: ['qualquer'], retorno: 'texto', fn: (v) => formatar(v) },
  { nomes: ['PARA_NUMERO'], params: ['texto'], retorno: 'numero',
    fn: (t) => {
      const r = TIPOS_INFO.NUMERICO.ler(t);
      if (!r.ok) throw new Error(`"${t}" não pode ser convertido em número.`);
      return r.valor;
    } },
];

const REGISTRO = new Map();
for (const def of DEFS) for (const nome of def.nomes) REGISTRO.set(nome, { ...def, nome });

module.exports = {
  buscarFuncao: (nome) => REGISTRO.get(nome),
  NOMES_FUNCOES: new Set(REGISTRO.keys()),
};
