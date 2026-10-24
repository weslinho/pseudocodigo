'use strict';

const { tokenizar } = require('./lexer');
const { Parser } = require('./parser');
const { analisar } = require('./semantica');
const { Interpretador } = require('./interpretador');
const { PseudoError, formatarErro } = require('./erros');

const limpar = (fonte) => fonte.replace(/^\uFEFF/, '');

/** Texto -> AST verificada (com `programa.avisos`). Lança PseudoError se houver erro. */
function compilar(fonte) {
  const programa = new Parser(tokenizar(limpar(fonte))).programa();
  analisar(programa);
  return programa;
}

/**
 * Compila e executa. `io` = { escrever, lerLinha, avisar? }.
 * opcoes: { semAvisos, maxIteracoes, sinal }
 */
async function executar(fonte, io, opcoes = {}) {
  const texto = limpar(fonte);
  const programa = compilar(texto);
  if (!opcoes.semAvisos && io.avisar) {
    for (const a of programa.avisos) io.avisar(formatarErro(a, texto) + '\n\n');
  }
  await new Interpretador(programa, io, opcoes).executar();
}

module.exports = { compilar, executar, Interpretador, PseudoError, formatarErro };
