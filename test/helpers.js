'use strict';

const assert = require('node:assert');
const { executar, PseudoError } = require('../src');

/** Roda um programa com entradas simuladas e devolve tudo o que foi escrito. */
async function rodar(fonte, entradas = [], opcoes = {}) {
  const saida = [];
  const fila = [...entradas.map(String)];
  const io = {
    escrever: (t) => saida.push(t),
    lerLinha: async () => (fila.length ? fila.shift() : null),
  };
  await executar(fonte, io, opcoes);
  return saida.join('');
}

/** Espera que o programa falhe com PseudoError e devolve o erro. */
async function falha(fonte, entradas = [], opcoes = {}) {
  try { await rodar(fonte, entradas, opcoes); } catch (e) {
    assert.ok(e instanceof PseudoError, `erro inesperado: ${e.stack}`);
    return e;
  }
  assert.fail('deveria ter falhado');
}

/** Monta um algoritmo simples: declarações antes do INICIO e corpo depois. */
const prog = (decl, corpo, extra = '') => `ALGORITMO T:\n${decl}\n${extra}\nINICIO\n${corpo}\nFIMALGORITMO`;

module.exports = { rodar, falha, prog };
