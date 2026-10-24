'use strict';

const readline = require('readline');

/**
 * Entrada/saída pelo terminal. A leitura é "preguiçosa": só abre o stdin quando o
 * programa executa o primeiro LEIA. Funciona tanto digitando quanto com redirecionamento
 * (ex.: `echo 212 | node bin/pseudo.js`). Avisos vão para o stderr.
 */
function criarIOTerminal() {
  let rl = null;
  const fila = [];
  let aguardando = null;
  let encerrado = false;

  const abrir = () => {
    if (rl) return;
    rl = readline.createInterface({ input: process.stdin, terminal: false, crlfDelay: Infinity });
    rl.on('line', (l) => {
      if (aguardando) { const r = aguardando; aguardando = null; r(l); } else fila.push(l);
    });
    rl.on('close', () => {
      encerrado = true;
      if (aguardando) { const r = aguardando; aguardando = null; r(null); }
    });
  };

  return {
    escrever: (texto) => process.stdout.write(texto),
    avisar: (texto) => process.stderr.write(texto),
    lerLinha: () => {
      abrir();
      if (fila.length) return Promise.resolve(fila.shift());
      if (encerrado) return Promise.resolve(null);
      return new Promise((resolve) => { aguardando = resolve; });
    },
    fechar: () => { if (rl) rl.close(); },
  };
}

module.exports = { criarIOTerminal };
