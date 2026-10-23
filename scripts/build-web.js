#!/usr/bin/env node
'use strict';

/**
 * Gera docs/pseudo.js: o interpretador (src/) empacotado num único arquivo para o navegador,
 * junto com os programas de exemplo (exemplos/*.alg). Não precisa instalar nada:
 *
 *   npm run build:web
 *
 * O arquivo src/io.js fica de fora (ele usa o terminal do Node); a página docs/index.html
 * fornece a própria entrada/saída. Se algum módulo de src/ passar a usar um módulo do Node
 * (fs, readline, path...), este script avisa em vez de gerar um arquivo quebrado.
 */

const fs = require('fs');
const path = require('path');

const RAIZ = path.resolve(__dirname, '..');
const SRC = path.join(RAIZ, 'src');
const EXEMPLOS = path.join(RAIZ, 'exemplos');
const SAIDA = path.join(RAIZ, 'docs', 'pseudo.js');

const SOMENTE_NODE = new Set(['io.js']);

const nomes = fs.readdirSync(SRC)
  .filter((f) => f.endsWith('.js') && !SOMENTE_NODE.has(f))
  .sort();
const conhecidos = new Set(nomes.map((f) => './' + f.replace(/\.js$/, '')));

const modulos = nomes.map((arquivo) => {
  const codigo = fs.readFileSync(path.join(SRC, arquivo), 'utf8').replace(/^\uFEFF/, '');
  for (const m of codigo.matchAll(/require\(\s*['"]([^'"]+)['"]\s*\)/g)) {
    if (!conhecidos.has(m[1])) {
      console.error(
        `Erro: src/${arquivo} usa require('${m[1]}'), que não existe no navegador.\n` +
        'Mantenha o que é específico do Node (fs, readline, process...) fora dos módulos do interpretador,\n' +
        'por exemplo em src/io.js ou bin/pseudo.js.',
      );
      process.exit(1);
    }
  }
  return { nome: './' + arquivo.replace(/\.js$/, ''), codigo };
});

const exemplos = fs.existsSync(EXEMPLOS)
  ? fs.readdirSync(EXEMPLOS)
    .filter((f) => /\.(alg|txt)$/i.test(f))
    .sort()
    .map((arquivo) => ({
      arquivo,
      codigo: fs.readFileSync(path.join(EXEMPLOS, arquivo), 'utf8')
        .replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n'),
    }))
  : [];

const definicoes = modulos
  .map((m) => `${JSON.stringify(m.nome)}: function (module, exports, require) {\n${m.codigo}\n}`)
  .join(',\n');

const saida = `/* Arquivo GERADO por scripts/build-web.js (npm run build:web). Não edite: mude src/ e gere de novo. */
(function () {
'use strict';
var definicoes = {
${definicoes}
};
var cache = {};
function requerer(nome) {
  if (cache[nome]) return cache[nome].exports;
  var definicao = definicoes[nome];
  if (!definicao) throw new Error('Módulo não encontrado: ' + nome);
  var modulo = cache[nome] = { exports: {} };
  definicao(modulo, modulo.exports, requerer);
  return modulo.exports;
}
var indice = requerer('./index');
var palavras = requerer('./palavras');
globalThis.Pseudo = {
  compilar: indice.compilar,
  executar: indice.executar,
  PseudoError: indice.PseudoError,
  formatarErro: indice.formatarErro,
  palavras: {
    normalizar: palavras.normalizar,
    RESERVADAS: palavras.RESERVADAS,
    NOMES_FUNCOES: palavras.NOMES_FUNCOES,
    NOMES_TIPOS: palavras.NOMES_TIPOS
  },
  EXEMPLOS: ${JSON.stringify(exemplos, null, 2)}
};
})();
`;

fs.mkdirSync(path.dirname(SAIDA), { recursive: true });
fs.writeFileSync(SAIDA, saida, 'utf8');
console.log(
  `docs/pseudo.js gerado (${(Buffer.byteLength(saida) / 1024).toFixed(1)} KB, ` +
  `${modulos.length} módulos, ${exemplos.length} exemplos).`,
);
