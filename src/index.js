'use strict';

const { tokenizar } = require('./lexer');
const { Parser } = require('./parser');
const { analisar } = require('./semantica');
const { Interpretador } = require('./interpretador');
const { PseudoError, formatarErro } = require('./erros');

/** Texto -> AST verificada. Lança PseudoError se houver problema. */
function compilar(fonte) {
  const limpo = fonte.replace(/^\uFEFF/, '');
  const programa = new Parser(tokenizar(limpo)).programa();
  analisar(programa);
  return programa;
}

/** Compila e executa. `io` = { escrever, lerLinha }. */
async function executar(fonte, io, opcoes = {}) {
  const programa = compilar(fonte);
  await new Interpretador(programa, io, opcoes).executar();
}

module.exports = { compilar, executar, Interpretador, PseudoError, formatarErro };
