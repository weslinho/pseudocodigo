#!/usr/bin/env node
'use strict';

/**
 * Gera docs/pseudo-cli.js: o interpretador INTEIRO (src/ + bin/pseudo.js) em um único arquivo,
 * para o aluno rodar sem baixar o projeto:   node pseudo-cli.js meu.alg
 *
 *   npm run build:cli
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const SAIDA = path.join(RAIZ, 'docs', 'pseudo-cli.js');
const ler = (f) => fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, '').replace(/^#!.*\n/, '');

const modulos = fs.readdirSync(SRC).filter((f) => f.endsWith('.js')).sort()
  .map((f) => ({ nome: './' + f.replace(/\.js$/, ''), codigo: ler(path.join(SRC, f)) }));
modulos.push({ nome: '#cli', codigo: ler(path.join(RAIZ, 'bin', 'pseudo.js')) });

const definicoes = modulos
  .map((m) => `${JSON.stringify(m.nome)}: function (module, exports, require) {\n${m.codigo}\n}`)
  .join(',\n');

const saida = `#!/usr/bin/env node
/* Arquivo GERADO por scripts/build-cli.js (npm run build:cli). Não edite: mude src/ e gere de novo. */
'use strict';
var nativo = require;
var definicoes = {
${definicoes}
};
var cache = {};
function requerer(nome) {
  // o bin/pseudo.js pede '../src' e '../src/io'; dentro do arquivo único viram './index' e './io'
  if (nome === '../src') nome = './index';
  else if (nome.indexOf('../src/') === 0) nome = './' + nome.slice(7);
  if (!definicoes[nome]) return nativo(nome); // fs, path, readline...
  if (cache[nome]) return cache[nome].exports;
  var modulo = cache[nome] = { exports: {} };
  definicoes[nome](modulo, modulo.exports, requerer);
  return modulo.exports;
}
requerer('#cli');
`;

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, saida, 'utf8');
console.log(`docs/pseudo-cli.js gerado (${(Buffer.byteLength(saida) / 1024).toFixed(1)} KB).`);