'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { executar, PseudoError } = require('../src');

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

async function falha(fonte, entradas = [], opcoes = {}) {
  try { await rodar(fonte, entradas, opcoes); } catch (e) {
    assert.ok(e instanceof PseudoError, `erro inesperado: ${e.stack}`);
    return e;
  }
  assert.fail('deveria ter falhado');
}

const prog = (decl, corpo) => `ALGORITMO T:\n${decl}\nINICIO\n${corpo}\nFIMALGORITMO`;

test('Fahrenheit -> Celsius com LEIA', async () => {
  const src = `ALGORITMO X:
    DECLARE F, C : NUMERICO;
INICIO
    ESCREVA("Digite a temperatura em Fahrenheit");
    LEIA(F);
    C <- (F - 32) * (5 / 9);
    ESCREVA("A temperatura convertida em Celsius é", C);
FIMALGORITMO`;
  assert.strictEqual(await rodar(src, [212]),
    'Digite a temperatura em Fahrenheit\nA temperatura convertida em Celsius é 100\n');
});

test('cabeçalho no estilo ALGORITMO_MES: e SE / SENAO SE / SENAO', async () => {
  const src = `ALGORITMO_MES:
    DECLARE MES : INTEIRO;
INICIO
    LEIA(MES);
    SE(MES > 12 OU MES < 1) ENTAO
        ESCREVA("inválido");
    SENAO SE(MES = 1) ENTAO
        ESCREVA("Janeiro");
    SENAO SE(MES = 12) ENTAO
        ESCREVA("Dezembro");
    SENAO
        ESCREVA("outro");
    FIMSE
FIMALGORITMO`;
  assert.strictEqual(await rodar(src, [13]), 'inválido\n');
  assert.strictEqual(await rodar(src, [1]), 'Janeiro\n');
  assert.strictEqual(await rodar(src, [12]), 'Dezembro\n');
  assert.strictEqual(await rodar(src, [6]), 'outro\n');
});

test('ESCOLHA com valores, listas e faixas (1..5)', async () => {
  const src = prog('DECLARE M : INTEIRO;', `LEIA(M);
    ESCOLHA(M)
      CASO 1: ESCREVA("um");
      CASO 2..5: ESCREVA("faixa");
      CASO 7, 9: ESCREVA("lista");
      OUTROCASO: ESCREVA("padrao");
    FIMESCOLHA`);
  assert.strictEqual(await rodar(src, [1]), 'um\n');
  assert.strictEqual(await rodar(src, [4]), 'faixa\n');
  assert.strictEqual(await rodar(src, [9]), 'lista\n');
  assert.strictEqual(await rodar(src, [6]), 'padrao\n');
});

test('ENQUANTO com INICIO/FIM e i++', async () => {
  const src = prog('DECLARE i : INTEIRO;', `i <- 1;
    ENQUANTO(i <= 3) FACA
      INICIO
        ESCREVA(i);
        i++;
      FIM
    FIMENQUANTO`);
  assert.strictEqual(await rodar(src), '1\n2\n3\n');
});

test('REPITA ... ATE', async () => {
  const src = prog('DECLARE i : INTEIRO;', `i <- 1;
    REPITA
      ESCREVA(i);
      i <- i + 1;
    ATE(i > 3);`);
  assert.strictEqual(await rodar(src), '1\n2\n3\n');
});

test('PARA com PASSO positivo e negativo', async () => {
  const a = prog('DECLARE i : INTEIRO;', 'PARA i DE 1 ATE 5 PASSO 2 FACA ESCREVA(i); FIMPARA');
  assert.strictEqual(await rodar(a), '1\n3\n5\n');
  const b = prog('DECLARE i : INTEIRO;', 'PARA i DE 3 ATE 1 PASSO -1 FACA ESCREVA(i); FIMPARA');
  assert.strictEqual(await rodar(b), '3\n2\n1\n');
});

test('operadores, precedência, DIV/MOD, potência e funções', async () => {
  const src = prog('DECLARE R : NUMERICO;', `
    ESCREVA(2 + 3 * 4, 2 ^ 3 ^ 2, -2 ^ 2, 17 DIV 5, 17 MOD 5, 17 % 5);
    ESCREVA(SQRT(16), ABS(-3), MAX(1, 9, 4), MIN(7, 2), ROUND(2.567, 2), TRUNC(-2.9));
    ESCREVA(NAO FALSO E VERDADEIRO OU FALSO, 1 < 2 E 2 <> 3);
    R <- COS(0) + SEN(0);
    ESCREVA(R, PI > 3);`);
  assert.strictEqual(await rodar(src),
    '14 512 -4 3 2 2\n4 3 9 2 2.57 -2\nVERDADEIRO VERDADEIRO\n1 VERDADEIRO\n');
});

test('textos: concatenação e funções de texto', async () => {
  const src = prog('DECLARE N : CARACTERES;', `N <- "ana" + " maria";
    ESCREVA(MAIUSCULO(N), TAM_TEXTO(N), SUBTEXTO(N, 1, 3), LOCALIZAR("maria", N));`);
  assert.strictEqual(await rodar(src), 'ANA MARIA 9 ana 5\n');
});

test('palavras reservadas e variáveis não diferenciam maiúsculas/acentos', async () => {
  const src = prog('declare Idade : inteiro;', `idade <- 5; se (IDADE = 5) então escreva("ok"); fimse`);
  assert.strictEqual(await rodar(src), 'ok\n');
});

test('comentários # e //', async () => {
  const src = prog('DECLARE X : INTEIRO;', `# comentário\n X <- 1; // outro\n ESCREVA(X);`);
  assert.strictEqual(await rodar(src), '1\n');
});

test('LEIA repete a pergunta quando o valor não combina com o tipo', async () => {
  const src = prog('DECLARE N : INTEIRO;', 'LEIA(N); ESCREVA(N * 2);');
  const saida = await rodar(src, ['abc', '3.5', '21']);
  assert.match(saida, /Valor inválido para INTEIRO/);
  assert.ok(saida.endsWith('42\n'));
});

test('LEIA de NUMERICO aceita vírgula decimal e LOGICOS aceita V/F', async () => {
  const src = prog('DECLARE N : NUMERICO; L : LOGICOS;', 'LEIA(N, L); ESCREVA(N, L);');
  assert.strictEqual(await rodar(src, ['3,5', 'v']), '3.5 VERDADEIRO\n');
});

// ---------- erros ----------
test('variável que começa com número é erro léxico', async () => {
  const e = await falha(prog('DECLARE 2X : INTEIRO;', 'ESCREVA(1);'));
  assert.match(e.message, /começar com número/);
  assert.strictEqual(e.linha, 2);
});

test('palavra reservada como nome de variável', async () => {
  for (const nome of ['SE', 'DECLARE', 'ESCREVA', 'LEIA', 'REPITA', 'ENQUANTO', 'FACA', 'ATE', 'COS', 'SEN', 'CASO', 'FIM', 'SQRT', 'INTEIRO']) {
    const e = await falha(prog(`DECLARE ${nome} : INTEIRO;`, 'ESCREVA(1);'));
    assert.match(e.message, /palavra reservada/, nome);
  }
});

test('variável não declarada e redeclarada', async () => {
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'B <- 1;'))).message, /não foi declarada/);
  assert.match((await falha(prog('DECLARE A, A : INTEIRO;', 'A <- 1;'))).message, /já foi declarada/);
});

test('tipos incompatíveis são barrados antes de executar', async () => {
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'A <- "oi";'))).message, /não aceita um valor texto/);
  assert.match((await falha(prog('DECLARE A : LOGICOS;', 'A <- 3;'))).message, /não aceita/);
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'SE(A) ENTAO ESCREVA(1); FIMSE'))).message, /deve ser lógico/);
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'A <- 1; ESCREVA(A + "x");'))).message, /só funciona/);
});

test('INTEIRO não recebe valor com casas decimais (em tempo de execução)', async () => {
  const e = await falha(prog('DECLARE A : INTEIRO;', 'A <- 7 / 2;'));
  assert.match(e.message, /INTEIRO/);
  assert.match(e.message, /TRUNC/);
});

test('variável usada antes de receber valor', async () => {
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'ESCREVA(A);'))).message, /antes de receber um valor/);
});

test('divisão por zero e raiz negativa', async () => {
  assert.match((await falha(prog('DECLARE A : NUMERICO;', 'A <- 1 / 0;'))).message, /Divisão por zero/);
  assert.match((await falha(prog('DECLARE A : NUMERICO;', 'A <- SQRT(-1);'))).message, /raiz quadrada/);
});

test('faltou ; e uso de = como atribuição', async () => {
  const e = await falha(prog('DECLARE A : INTEIRO;', 'A <- 1\nESCREVA(A);'));
  assert.match(e.message, /Faltou ';'/);
  assert.strictEqual(e.linha, 4);
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'A = 1;'))).message, /<-/);
});

test('bloco não fechado', async () => {
  const e = await falha(prog('DECLARE A : INTEIRO;', 'SE(1 = 1) ENTAO ESCREVA(1);'));
  assert.match(e.message, /FIMSE|FIMALGORITMO/);
});

test('limite de iterações detecta laço infinito', async () => {
  const src = prog('DECLARE I : INTEIRO;', 'I <- 1; ENQUANTO(I > 0) FACA I <- 1; FIMENQUANTO');
  const e = await falha(src, [], { maxIteracoes: 1000 });
  assert.match(e.message, /laço infinito/);
});

test('LEIA sem entrada disponível gera erro claro', async () => {
  assert.match((await falha(prog('DECLARE A : INTEIRO;', 'LEIA(A);'))).message, /entrada terminou/);
});
