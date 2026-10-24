'use strict';

const { normalizar } = require('./palavras');

/** Distância de edição (inclui troca de letras vizinhas: ETNAO -> ENTAO = 1). */
function distancia(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
  }
  return d[a.length][b.length];
}

/** Devolve o candidato mais parecido com `palavra` (ou null). Nomes com menos de 3 letras não geram sugestão. */
function sugerir(palavra, candidatos) {
  const p = normalizar(palavra);
  if (p.length < 3) return null;
  const limite = p.length <= 4 ? 1 : 2;
  let melhor = null, dMelhor = Infinity;
  for (const c of candidatos) {
    const n = normalizar(c);
    if (n === p) continue;
    const d = distancia(p, n);
    if (d < dMelhor) { dMelhor = d; melhor = c; }
  }
  return dMelhor <= limite ? melhor : null;
}

module.exports = { sugerir, distancia };
