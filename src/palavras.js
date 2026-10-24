'use strict';

const { NOMES_TIPOS } = require('./tipos');
const { NOMES_FUNCOES } = require('./funcoes');

/** Maiúsculas e sem acento: "então" -> "ENTAO". Usado para palavras reservadas e nomes de variáveis. */
const normalizar = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();

const ESTRUTURA = [
  'ALGORITMO', 'FIMALGORITMO', 'DECLARE', 'INICIO', 'FIM',
  'SE', 'ENTAO', 'SENAO', 'FIMSE',
  'ESCOLHA', 'CASO', 'OUTROCASO', 'PADRAO', 'FIMESCOLHA',
  'ENQUANTO', 'FACA', 'FIMENQUANTO',
  'REPITA', 'ATE',
  'PARA', 'DE', 'PASSO', 'FIMPARA',
  'ESCREVA', 'ESCREVA_SEM_QUEBRA', 'LEIA',
  'CONSTANTE', 'VETOR', 'MATRIZ',
  'FUNCAO', 'FIMFUNCAO', 'PROCEDIMENTO', 'FIMPROCEDIMENTO', 'RETORNE',
  'INTERROMPA', 'CONTINUE',
];
const OPERADORES = ['E', 'OU', 'NAO', 'DIV', 'MOD'];
const CONSTANTES = ['VERDADEIRO', 'FALSO', 'PI'];

/** Tudo o que não pode ser usado como nome de variável (as funções são tratadas à parte pelo lexer). */
const RESERVADAS = new Set([...ESTRUTURA, ...OPERADORES, ...CONSTANTES, ...NOMES_TIPOS]);

module.exports = { normalizar, RESERVADAS, NOMES_FUNCOES, NOMES_TIPOS, PALAVRAS_ESTRUTURA: ESTRUTURA };
