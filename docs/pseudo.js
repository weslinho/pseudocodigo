/* Arquivo GERADO por scripts/build-web.js (npm run build:web). Não edite: mude src/ e gere de novo. */
(function () {
'use strict';
var definicoes = {
"./erros": function (module, exports, require) {
'use strict';

/** Erro "amigável" do pseudocódigo (léxico, sintaxe, semântico ou de execução). */
class PseudoError extends Error {
  constructor(tipo, mensagem, linha = null, coluna = null) {
    super(mensagem);
    this.name = 'PseudoError';
    this.tipo = tipo;
    this.linha = linha;
    this.coluna = coluna;
  }
}

/** Monta a mensagem exibida ao aluno, com a linha do código e uma seta (^) no ponto do erro. */
function formatarErro(erro, fonte) {
  const local = erro.linha
    ? ` (linha ${erro.linha}${erro.coluna ? `, coluna ${erro.coluna}` : ''})`
    : '';
  const partes = [`${erro.tipo}${local}: ${erro.message}`];

  if (erro.linha && fonte) {
    const texto = (fonte.split('\n')[erro.linha - 1] || '').replace(/\r$/, '').replace(/\t/g, ' ');
    const num = String(erro.linha);
    partes.push(`  ${num} | ${texto}`);
    if (erro.coluna) partes.push(`  ${' '.repeat(num.length)} | ${' '.repeat(erro.coluna - 1)}^`);
  }
  return partes.join('\n');
}

module.exports = { PseudoError, formatarErro };

},
"./funcoes": function (module, exports, require) {
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

},
"./index": function (module, exports, require) {
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

},
"./interpretador": function (module, exports, require) {
'use strict';

const { PseudoError } = require('./erros');
const { TIPOS_INFO, formatar, nomeTipoValor } = require('./tipos');
const { buscarFuncao } = require('./funcoes');

// Devolve o controle ao ambiente de vez em quando em laços longos: no Node isso deixa o Ctrl+C
// funcionar; no navegador deixa a página responder (botão "Parar"). Como o navegador não tem
// setImmediate, usa-se MessageChannel (rápido); setTimeout é o último recurso.
const cederVez = (() => {
  if (typeof setImmediate === 'function') return () => new Promise((r) => setImmediate(r));
  if (typeof MessageChannel === 'function') {
    const canal = new MessageChannel();
    const fila = [];
    canal.port1.onmessage = () => fila.shift()();
    return () => new Promise((r) => { fila.push(r); canal.port2.postMessage(null); });
  }
  return () => new Promise((r) => setTimeout(r, 0));
})();

class Interpretador {
  /**
   * @param programa  AST já verificada
   * @param io        { escrever(texto), lerLinha(): Promise<string|null> }
   * @param opcoes    { maxIteracoes, sinal }
   *                  maxIteracoes: limite de repetições (0 = sem limite)
   *                  sinal: AbortSignal opcional; ao ser acionado, o programa para na próxima repetição
   *                         (usado pelo botão "Parar" da versão web)
   */
  constructor(programa, io, opcoes = {}) {
    this.programa = programa;
    this.io = io;
    this.maxIteracoes = opcoes.maxIteracoes ?? 10_000_000;
    this.sinal = opcoes.sinal;
    this.iteracoes = 0;
    this.vars = new Map();
    for (const d of programa.decls) {
      for (const n of d.nomes) this.vars.set(n.nome, { tipo: d.tipo, raw: n.raw, valor: undefined, inicializada: false });
    }
  }

  erro(msg, no) { return new PseudoError('Erro de execução', msg, no?.linha, no?.col); }

  async executar() { await this.bloco(this.programa.corpo); }

  async bloco(lista) { for (const c of lista) await this.comando(c); }

  async repeticao(no) {
    if (this.sinal?.aborted) {
      throw new PseudoError('Execução interrompida', 'O programa foi interrompido antes de terminar.', no?.linha, no?.col);
    }
    this.iteracoes++;
    if (this.maxIteracoes > 0 && this.iteracoes > this.maxIteracoes) {
      throw this.erro(`O programa passou de ${this.maxIteracoes} repetições. Parece haver um laço infinito: a condição nunca muda?`, no);
    }
    if (this.iteracoes % 2000 === 0) await cederVez();
  }

  // ---------- comandos ----------
  async comando(no) {
    switch (no.tipo) {
      case 'Escreva':
        this.io.escrever(no.args.map((a) => formatar(this.avaliar(a))).join(' ') + '\n');
        break;
      case 'Leia': await this.leia(no); break;
      case 'Atribuicao': this.atribuir(no.alvo, this.avaliar(no.valor)); break;
      case 'Se': {
        for (const r of no.ramos) {
          if (this.logico(r.cond)) { await this.bloco(r.corpo); return; }
        }
        if (no.senao) await this.bloco(no.senao);
        break;
      }
      case 'Escolha': await this.escolha(no); break;
      case 'Enquanto':
        while (this.logico(no.cond)) { await this.repeticao(no); await this.bloco(no.corpo); }
        break;
      case 'Repita':
        do { await this.repeticao(no); await this.bloco(no.corpo); } while (!this.logico(no.cond));
        break;
      case 'Para': await this.para(no); break;
      case 'Bloco': await this.bloco(no.corpo); break;
      default: throw this.erro(`Comando desconhecido: ${no.tipo}`, no);
    }
  }

  async leia(no) {
    for (const alvo of no.vars) {
      const info = this.vars.get(alvo.nome);
      for (;;) {
        const linha = await this.io.lerLinha();
        if (linha === null) throw this.erro(`A entrada terminou, mas o programa ainda esperava um valor para '${info.raw}'.`, alvo);
        const r = TIPOS_INFO[info.tipo].ler(linha);
        if (r.ok) { info.valor = r.valor; info.inicializada = true; break; }
        this.io.escrever(`Valor inválido para ${info.tipo}: ${r.motivo} Tente novamente.\n`);
      }
    }
  }

  async escolha(no) {
    const v = this.avaliar(no.expr);
    const igual = (x) => typeof x === typeof v && x === v;
    const dentro = (a, b) => typeof a === typeof v && typeof b === typeof v && v >= a && v <= b;
    for (const caso of no.casos) {
      const bate = caso.valores.some((c) =>
        c.faixa ? dentro(this.avaliar(c.de), this.avaliar(c.ate)) : igual(this.avaliar(c.valor)));
      if (bate) { await this.bloco(caso.corpo); return; }
    }
    if (no.padrao) await this.bloco(no.padrao);
  }

  async para(no) {
    const info = this.vars.get(no.var.nome);
    const inicio = this.avaliar(no.inicio);
    const fim = this.avaliar(no.fim);
    const passo = no.passo ? this.avaliar(no.passo) : 1;
    if (passo === 0) throw this.erro('O PASSO do PARA não pode ser zero (o laço nunca terminaria).', no.passo);
    this.atribuir(no.var, inicio);
    while (passo > 0 ? info.valor <= fim : info.valor >= fim) {
      await this.repeticao(no);
      await this.bloco(no.corpo);
      this.atribuir(no.var, Number((info.valor + passo).toPrecision(15)));
    }
  }

  atribuir(alvo, valor) {
    const info = this.vars.get(alvo.nome);
    if (!TIPOS_INFO[info.tipo].aceita(valor)) {
      const dica = info.tipo === 'INTEIRO' && typeof valor === 'number'
        ? ' Dica: use TRUNC() ou ROUND() para obter um número inteiro.' : '';
      throw this.erro(
        `Não é possível guardar ${typeof valor === 'string' ? `"${valor}"` : formatar(valor)} (${nomeTipoValor(valor)}) na variável '${info.raw}', que é do tipo ${info.tipo}.${dica}`,
        alvo,
      );
    }
    info.valor = valor;
    info.inicializada = true;
  }

  // ---------- expressões ----------
  logico(no) {
    const v = this.avaliar(no);
    if (typeof v !== 'boolean') throw this.erro('Era esperada uma condição (VERDADEIRO ou FALSO).', no);
    return v;
  }

  numero(no, v) {
    if (typeof v !== 'number') throw this.erro('Era esperado um número.', no);
    return v;
  }

  avaliar(no) {
    switch (no.tipo) {
      case 'Num': case 'Str': case 'Bool': return no.valor;
      case 'Var': {
        const info = this.vars.get(no.nome);
        if (!info) throw this.erro(`A variável '${no.raw}' não foi declarada.`, no);
        if (!info.inicializada) {
          throw this.erro(`A variável '${no.raw}' foi usada antes de receber um valor (use LEIA ou uma atribuição '<-' antes).`, no);
        }
        return info.valor;
      }
      case 'Unario': {
        if (no.op === 'NAO') return !this.logico(no.expr);
        const v = this.numero(no.expr, this.avaliar(no.expr));
        return no.op === '-' ? -v : v;
      }
      case 'Binario': return this.binario(no);
      case 'Chamada': return this.chamada(no);
      default: throw this.erro('Expressão desconhecida.', no);
    }
  }

  binario(no) {
    if (no.op === 'E') return this.logico(no.esq) ? this.logico(no.dir) : false; // curto-circuito
    if (no.op === 'OU') return this.logico(no.esq) ? true : this.logico(no.dir);

    const a = this.avaliar(no.esq);
    const b = this.avaliar(no.dir);
    switch (no.op) {
      case '=': return a === b;
      case '<>': return a !== b;
      case '<': return a < b;
      case '>': return a > b;
      case '<=': return a <= b;
      case '>=': return a >= b;
      case '+': if (typeof a === 'string') return a + b; // texto + texto
    }
    this.numero(no.esq, a); this.numero(no.dir, b);
    let r;
    switch (no.op) {
      case '+': r = a + b; break;
      case '-': r = a - b; break;
      case '*': r = a * b; break;
      case '^': r = Math.pow(a, b); break;
      case '/': case 'DIV': case 'MOD': {
        if (b === 0) throw this.erro('Divisão por zero.', no);
        r = no.op === '/' ? a / b : no.op === 'DIV' ? Math.trunc(a / b) : a % b;
        break;
      }
      default: throw this.erro(`Operador desconhecido '${no.op}'.`, no);
    }
    if (!Number.isFinite(r)) throw this.erro(`O resultado de '${no.op}' não é um número válido.`, no);
    return r;
  }

  chamada(no) {
    const f = buscarFuncao(no.nome);
    const args = no.args.map((a) => this.avaliar(a));
    let r;
    try { r = f.fn(...args); } catch (e) { throw this.erro(`Erro em ${no.raw}: ${e.message}`, no); }
    if (typeof r === 'number' && !Number.isFinite(r)) {
      throw this.erro(`${no.raw}(${args.map(formatar).join(', ')}) não resulta em um número válido.`, no);
    }
    return r;
  }
}

module.exports = { Interpretador };

},
"./lexer": function (module, exports, require) {
'use strict';

const { PseudoError } = require('./erros');
const { normalizar, RESERVADAS, NOMES_FUNCOES } = require('./palavras');

const OPS_DOIS = ['<-', ':=', '<>', '<=', '>=', '!=', '==', '++', '--', '+=', '-=', '*=', '/=', '..'];
const OPS_UM = '+-*/^%(),;:=<>';

/**
 * Transforma o texto do programa em tokens.
 * Tipos: KW (palavra reservada), FN (função), ID (variável), NUM, STR, OP, EOF.
 * Comentários: "# ...", "// ..." e blocos entre barra-asterisco e asterisco-barra.
 */
function tokenizar(fonte) {
  const tokens = [];
  const n = fonte.length;
  let i = 0, linha = 1, col = 1;

  const avancar = (k = 1) => {
    for (let j = 0; j < k && i < n; j++) {
      if (fonte[i] === '\n') { linha++; col = 1; } else col++;
      i++;
    }
  };
  const erro = (msg, L, C) => new PseudoError('Erro léxico', msg, L, C);
  const ehLetra = (ch) => ch !== undefined && /[\p{L}_]/u.test(ch);
  const ehAlnum = (ch) => ch !== undefined && /[\p{L}\p{N}_]/u.test(ch);
  const ehDigito = (ch) => ch !== undefined && ch >= '0' && ch <= '9';

  while (i < n) {
    const c = fonte[i];

    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { avancar(); continue; }

    // Comentários
    if (c === '#' || (c === '/' && fonte[i + 1] === '/')) {
      while (i < n && fonte[i] !== '\n') avancar();
      continue;
    }
    if (c === '/' && fonte[i + 1] === '*') {
      const L = linha, C = col;
      avancar(2);
      while (i < n && !(fonte[i] === '*' && fonte[i + 1] === '/')) avancar();
      if (i >= n) throw erro('Comentário de bloco não foi fechado.', L, C);
      avancar(2);
      continue;
    }

    const L = linha, C = col, inicio = i;

    // Texto entre aspas
    if (c === '"' || c === "'") {
      avancar();
      let s = '';
      for (;;) {
        if (i >= n || fonte[i] === '\n') throw erro('Texto sem aspas de fechamento.', L, C);
        const ch = fonte[i];
        if (ch === c) { avancar(); break; }
        if (ch === '\\' && i + 1 < n) {
          const mapa = { n: '\n', t: '\t', '\\': '\\', '"': '"', "'": "'" };
          const prox = fonte[i + 1];
          s += prox in mapa ? mapa[prox] : '\\' + prox;
          avancar(2);
          continue;
        }
        s += ch;
        avancar();
      }
      tokens.push({ tipo: 'STR', valor: s, raw: fonte.slice(inicio, i), linha: L, col: C, len: i - inicio });
      continue;
    }

    // Número (e erro para nomes que começam com número, ex.: 2abc)
    if (ehDigito(c)) {
      let j = i;
      while (ehDigito(fonte[j])) j++;
      if (fonte[j] === '.' && ehDigito(fonte[j + 1])) { j++; while (ehDigito(fonte[j])) j++; }
      if (ehLetra(fonte[j])) {
        let k = j;
        while (ehAlnum(fonte[k])) k++;
        throw erro(`"${fonte.slice(i, k)}" não é um nome válido: nomes de variáveis não podem começar com número.`, L, C);
      }
      const txt = fonte.slice(i, j);
      avancar(j - i);
      tokens.push({ tipo: 'NUM', valor: Number(txt), raw: txt, linha: L, col: C, len: j - inicio });
      continue;
    }

    // Palavras: reservadas, funções ou variáveis (sem diferenciar maiúsculas/minúsculas/acentos)
    if (ehLetra(c)) {
      let j = i;
      while (ehAlnum(fonte[j])) j++;
      const raw = fonte.slice(i, j);
      const norm = normalizar(raw);
      avancar(j - i);
      const tipo = NOMES_FUNCOES.has(norm) ? 'FN' : RESERVADAS.has(norm) ? 'KW' : 'ID';
      tokens.push({ tipo, valor: norm, raw, linha: L, col: C, len: j - inicio });
      continue;
    }

    // Operadores e pontuação
    const dois = fonte.slice(i, i + 2);
    if (OPS_DOIS.includes(dois)) {
      avancar(2);
      tokens.push({ tipo: 'OP', valor: dois, raw: dois, linha: L, col: C, len: 2 });
      continue;
    }
    if (OPS_UM.includes(c)) {
      avancar();
      tokens.push({ tipo: 'OP', valor: c, raw: c, linha: L, col: C, len: 1 });
      continue;
    }

    throw erro(`Caractere inválido '${c}'.${c === '!' ? ' Para negar uma condição use NAO.' : ''}`, L, C);
  }

  tokens.push({ tipo: 'EOF', valor: '', raw: '', linha, col, len: 0 });
  return tokens;
}

module.exports = { tokenizar };

},
"./palavras": function (module, exports, require) {
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
  'ESCREVA', 'LEIA',
];
const OPERADORES = ['E', 'OU', 'NAO', 'DIV', 'MOD'];
const CONSTANTES = ['VERDADEIRO', 'FALSO', 'PI'];

/** Tudo o que não pode ser usado como nome de variável (as funções são tratadas à parte pelo lexer). */
const RESERVADAS = new Set([...ESTRUTURA, ...OPERADORES, ...CONSTANTES, ...NOMES_TIPOS]);

module.exports = { normalizar, RESERVADAS, NOMES_FUNCOES, NOMES_TIPOS };

},
"./parser": function (module, exports, require) {
'use strict';

const { PseudoError } = require('./erros');
const { NOMES_TIPOS } = require('./tipos');

const OPS_RELACIONAIS = { '=': '=', '==': '=', '<>': '<>', '!=': '<>', '<': '<', '>': '>', '<=': '<=', '>=': '>=' };
const FECHAMENTO_CASO = ['CASO', 'OUTROCASO', 'PADRAO', 'SENAO', 'FIMESCOLHA'];

/**
 * Analisador sintático (descida recursiva). Produz a árvore (AST) do programa.
 *
 * Precedência dos operadores (da menor para a maior):
 *   OU  <  E  <  NAO  <  relacionais  <  + -  <  * / DIV MOD  <  - (unário)  <  ^
 */
class Parser {
  constructor(tokens) {
    this.t = tokens;
    this.p = 0;
  }

  // ---------- utilidades ----------
  get atual() { return this.t[this.p]; }
  espiar(k = 1) { return this.t[Math.min(this.p + k, this.t.length - 1)]; }
  avancar() { const tk = this.t[this.p]; if (this.p < this.t.length - 1) this.p++; return tk; }
  ehKW(...v) { const a = this.atual; return a.tipo === 'KW' && v.includes(a.valor); }
  ehOp(...v) { const a = this.atual; return a.tipo === 'OP' && v.includes(a.valor); }
  erro(msg, tk = this.atual) { return new PseudoError('Erro de sintaxe', msg, tk.linha, tk.col); }

  descrever(tk) {
    if (tk.tipo === 'EOF') return 'o fim do arquivo';
    if (tk.tipo === 'STR') return `o texto ${tk.raw}`;
    return `'${tk.raw}'`;
  }

  esperarKW(valor, contexto = '') {
    if (!this.ehKW(valor)) {
      throw this.erro(`Esperava ${valor}${contexto ? ' ' + contexto : ''}, mas encontrei ${this.descrever(this.atual)}.`);
    }
    return this.avancar();
  }

  esperarOp(valor, contexto = '') {
    if (!this.ehOp(valor)) {
      throw this.erro(`Esperava '${valor}'${contexto ? ' ' + contexto : ''}, mas encontrei ${this.descrever(this.atual)}.`);
    }
    return this.avancar();
  }

  /** Aponta o erro logo depois do último token lido, onde o ';' deveria estar. */
  esperarPontoVirgula() {
    if (this.ehOp(';')) return this.avancar();
    const ant = this.t[Math.max(this.p - 1, 0)];
    throw new PseudoError('Erro de sintaxe', "Faltou ';' no final do comando.", ant.linha, ant.col + ant.len);
  }

  // ---------- programa ----------
  programa() {
    let nome = null;
    if (this.ehKW('ALGORITMO')) {
      this.avancar();
      if (this.atual.tipo === 'ID') nome = this.avancar().raw;
      if (this.ehOp(':')) this.avancar();
    } else if (this.atual.tipo === 'ID' && this.espiar().tipo === 'OP' && this.espiar().valor === ':') {
      nome = this.avancar().raw; // ex.: "ALGORITMO_MES:"
      this.avancar();
    }

    const decls = [];
    while (this.ehKW('DECLARE')) this.declaracao(decls);

    this.esperarKW('INICIO', 'para começar o algoritmo');
    const corpo = this.comandos(['FIMALGORITMO']);
    this.esperarKW('FIMALGORITMO');
    if (this.atual.tipo !== 'EOF') throw this.erro('Existe texto depois de FIMALGORITMO.');
    return { tipo: 'Programa', nome, decls, corpo };
  }

  nomeVariavel() {
    const tk = this.atual;
    if (tk.tipo === 'ID') {
      this.avancar();
      return { tipo: 'Var', nome: tk.valor, raw: tk.raw, linha: tk.linha, col: tk.col };
    }
    if (tk.tipo === 'KW' || tk.tipo === 'FN') {
      throw this.erro(`'${tk.raw}' é uma palavra reservada e não pode ser usada como nome de variável.`);
    }
    throw this.erro(`Esperava o nome de uma variável, mas encontrei ${this.descrever(tk)}.`);
  }

  declaracao(decls) {
    this.avancar(); // DECLARE
    do {
      const nomes = [];
      do { nomes.push(this.nomeVariavel()); } while (this.ehOp(',') && this.avancar());
      this.esperarOp(':', 'depois dos nomes das variáveis');
      const tk = this.atual;
      if (!(tk.tipo === 'KW' && NOMES_TIPOS.includes(tk.valor))) {
        throw this.erro(`Tipo desconhecido: ${this.descrever(tk)}. Tipos válidos: ${NOMES_TIPOS.join(', ')}.`);
      }
      this.avancar();
      this.esperarPontoVirgula();
      decls.push({ nomes, tipo: tk.valor });
    } while (this.continuaDeclaracao());
  }

  /** Permite várias declarações seguidas sob um único DECLARE. */
  continuaDeclaracao() {
    const a = this.atual;
    if (a.tipo === 'ID') return true;
    if ((a.tipo === 'KW' || a.tipo === 'FN') && !['DECLARE', 'INICIO'].includes(a.valor)) {
      const prox = this.espiar();
      return prox.tipo === 'OP' && (prox.valor === ':' || prox.valor === ',');
    }
    return false;
  }

  // ---------- comandos ----------
  comandos(terminadores) {
    const lista = [];
    for (;;) {
      const a = this.atual;
      if (a.tipo === 'EOF') {
        throw this.erro(`Fim do arquivo inesperado: faltou ${terminadores.join(' ou ')}.`);
      }
      if (a.tipo === 'KW' && terminadores.includes(a.valor)) break;
      if (a.tipo === 'OP' && a.valor === ';') { this.avancar(); continue; }
      lista.push(this.comando());
    }
    return lista;
  }

  comando() {
    const a = this.atual;
    if (a.tipo === 'KW') {
      switch (a.valor) {
        case 'ESCREVA': return this.escreva();
        case 'LEIA': return this.leia();
        case 'SE': return this.se();
        case 'ESCOLHA': return this.escolha();
        case 'ENQUANTO': return this.enquanto();
        case 'REPITA': return this.repita();
        case 'PARA': return this.para();
        case 'INICIO': {
          this.avancar();
          const corpo = this.comandos(['FIM']);
          this.esperarKW('FIM');
          return { tipo: 'Bloco', corpo, linha: a.linha, col: a.col };
        }
        case 'DECLARE':
          throw this.erro('As declarações (DECLARE) devem ficar antes do INICIO do algoritmo.');
        default:
          throw this.erro(`'${a.raw}' não pode aparecer aqui: não há comando aberto que ele possa fechar ou continuar.`);
      }
    }
    if (a.tipo === 'ID') return this.atribuicao();
    if (a.tipo === 'FN') throw this.erro(`'${a.raw}' é uma função: use-a dentro de uma expressão (ex.: X <- ${a.raw}(...);).`);
    throw this.erro(`Comando inválido: ${this.descrever(a)}.`);
  }

  escreva() {
    const ini = this.avancar();
    this.esperarOp('(', 'depois de ESCREVA');
    const args = [];
    if (!this.ehOp(')')) {
      do { args.push(this.expressao()); } while (this.ehOp(',') && this.avancar());
    }
    this.esperarOp(')', 'para fechar o ESCREVA');
    this.esperarPontoVirgula();
    return { tipo: 'Escreva', args, linha: ini.linha, col: ini.col };
  }

  leia() {
    const ini = this.avancar();
    this.esperarOp('(', 'depois de LEIA');
    const vars = [];
    do { vars.push(this.nomeVariavel()); } while (this.ehOp(',') && this.avancar());
    this.esperarOp(')', 'para fechar o LEIA');
    this.esperarPontoVirgula();
    return { tipo: 'Leia', vars, linha: ini.linha, col: ini.col };
  }

  atribuicao() {
    const alvo = this.nomeVariavel();
    const op = this.atual;
    const mk = (valor) => ({ tipo: 'Atribuicao', alvo, valor, linha: alvo.linha, col: alvo.col });
    const binario = (o, dir) => ({ tipo: 'Binario', op: o, esq: alvo, dir, linha: op.linha, col: op.col });

    if (op.tipo === 'OP') {
      if (op.valor === '<-' || op.valor === ':=') {
        this.avancar();
        const valor = this.expressao();
        this.esperarPontoVirgula();
        return mk(valor);
      }
      if (op.valor === '++' || op.valor === '--') {
        this.avancar();
        this.esperarPontoVirgula();
        return mk(binario(op.valor === '++' ? '+' : '-', { tipo: 'Num', valor: 1, linha: op.linha, col: op.col }));
      }
      if (['+=', '-=', '*=', '/='].includes(op.valor)) {
        this.avancar();
        const dir = this.expressao();
        this.esperarPontoVirgula();
        return mk(binario(op.valor[0], dir));
      }
      if (op.valor === '=') {
        throw this.erro("Para guardar um valor numa variável use '<-'. O sinal '=' serve para comparar valores.");
      }
    }
    throw this.erro(`Depois de '${alvo.raw}' esperava '<-' (atribuição), '++' ou '--', mas encontrei ${this.descrever(op)}.`);
  }

  se() {
    this.avancar(); // SE
    const ramos = [];
    let senao = null;
    const ramo = () => {
      const cond = this.expressao();
      this.esperarKW('ENTAO', 'depois da condição do SE');
      ramos.push({ cond, corpo: this.comandos(['SENAO', 'FIMSE']) });
    };
    ramo();
    while (this.ehKW('SENAO')) {
      const tkSenao = this.avancar();
      if (this.ehKW('SE') && this.atual.linha === tkSenao.linha) { this.avancar(); ramo(); continue; }
      senao = this.comandos(['FIMSE']);
      break;
    }
    const fim = this.esperarKW('FIMSE', 'para fechar o SE');
    return { tipo: 'Se', ramos, senao, linha: ramos[0].cond.linha, col: ramos[0].cond.col, fim };
  }

  escolha() {
    const ini = this.avancar();
    const expr = this.expressao();
    const casos = [];
    let padrao = null;
    for (;;) {
      if (this.ehKW('CASO')) {
        this.avancar();
        const valores = [];
        do {
          const de = this.expressao();
          if (this.ehOp('..')) {
            this.avancar();
            valores.push({ faixa: true, de, ate: this.expressao() });
          } else {
            valores.push({ faixa: false, valor: de });
          }
        } while (this.ehOp(',') && this.avancar());
        this.esperarOp(':', 'depois do(s) valor(es) do CASO');
        casos.push({ valores, corpo: this.comandos(FECHAMENTO_CASO) });
      } else if (this.ehKW('OUTROCASO', 'PADRAO', 'SENAO')) {
        if (padrao !== null) throw this.erro('O ESCOLHA só pode ter um caso padrão (OUTROCASO).');
        this.avancar();
        if (this.ehOp(':')) this.avancar();
        padrao = this.comandos(FECHAMENTO_CASO);
      } else break;
    }
    this.esperarKW('FIMESCOLHA', '(ou outro CASO) para continuar/fechar o ESCOLHA');
    return { tipo: 'Escolha', expr, casos, padrao, linha: ini.linha, col: ini.col };
  }

  enquanto() {
    const ini = this.avancar();
    const cond = this.expressao();
    this.esperarKW('FACA', 'depois da condição do ENQUANTO');
    const corpo = this.comandos(['FIMENQUANTO']);
    this.esperarKW('FIMENQUANTO');
    return { tipo: 'Enquanto', cond, corpo, linha: ini.linha, col: ini.col };
  }

  repita() {
    const ini = this.avancar();
    const corpo = this.comandos(['ATE']);
    this.esperarKW('ATE', 'para terminar o REPITA');
    const cond = this.expressao();
    this.esperarPontoVirgula();
    return { tipo: 'Repita', corpo, cond, linha: ini.linha, col: ini.col };
  }

  para() {
    const ini = this.avancar();
    const variavel = this.nomeVariavel();
    if (this.ehKW('DE') || this.ehOp('<-', ':=')) this.avancar();
    else throw this.erro(`Esperava DE (ou '<-') depois da variável do PARA, mas encontrei ${this.descrever(this.atual)}.`);
    const inicio = this.expressao();
    this.esperarKW('ATE', 'depois do valor inicial do PARA');
    const fim = this.expressao();
    let passo = null;
    if (this.ehKW('PASSO')) { this.avancar(); passo = this.expressao(); }
    this.esperarKW('FACA', 'no cabeçalho do PARA');
    const corpo = this.comandos(['FIMPARA']);
    this.esperarKW('FIMPARA');
    return { tipo: 'Para', var: variavel, inicio, fim, passo, corpo, linha: ini.linha, col: ini.col };
  }

  // ---------- expressões ----------
  expressao() { return this.ou(); }

  ou() {
    let esq = this.e();
    while (this.ehKW('OU')) {
      const op = this.avancar();
      esq = { tipo: 'Binario', op: 'OU', esq, dir: this.e(), linha: op.linha, col: op.col };
    }
    return esq;
  }

  e() {
    let esq = this.nao();
    while (this.ehKW('E')) {
      const op = this.avancar();
      esq = { tipo: 'Binario', op: 'E', esq, dir: this.nao(), linha: op.linha, col: op.col };
    }
    return esq;
  }

  nao() {
    if (this.ehKW('NAO')) {
      const op = this.avancar();
      return { tipo: 'Unario', op: 'NAO', expr: this.nao(), linha: op.linha, col: op.col };
    }
    return this.relacional();
  }

  relacional() {
    let esq = this.soma();
    while (this.atual.tipo === 'OP' && this.atual.valor in OPS_RELACIONAIS) {
      const op = this.avancar();
      esq = { tipo: 'Binario', op: OPS_RELACIONAIS[op.valor], esq, dir: this.soma(), linha: op.linha, col: op.col };
    }
    return esq;
  }

  soma() {
    let esq = this.produto();
    while (this.ehOp('+', '-')) {
      const op = this.avancar();
      esq = { tipo: 'Binario', op: op.valor, esq, dir: this.produto(), linha: op.linha, col: op.col };
    }
    return esq;
  }

  produto() {
    let esq = this.unario();
    while (this.ehOp('*', '/', '%') || this.ehKW('DIV', 'MOD')) {
      const op = this.avancar();
      const nome = op.valor === '%' ? 'MOD' : op.valor;
      esq = { tipo: 'Binario', op: nome, esq, dir: this.unario(), linha: op.linha, col: op.col };
    }
    return esq;
  }

  unario() {
    if (this.ehOp('-', '+')) {
      const op = this.avancar();
      return { tipo: 'Unario', op: op.valor, expr: this.unario(), linha: op.linha, col: op.col };
    }
    return this.potencia();
  }

  potencia() {
    const base = this.primario();
    if (this.ehOp('^')) {
      const op = this.avancar();
      return { tipo: 'Binario', op: '^', esq: base, dir: this.unario(), linha: op.linha, col: op.col }; // associa à direita
    }
    return base;
  }

  primario() {
    const tk = this.atual;
    const pos = { linha: tk.linha, col: tk.col };
    switch (tk.tipo) {
      case 'NUM': this.avancar(); return { tipo: 'Num', valor: tk.valor, ...pos };
      case 'STR': this.avancar(); return { tipo: 'Str', valor: tk.valor, ...pos };
      case 'ID':
        if (this.espiar().tipo === 'OP' && this.espiar().valor === '(') {
          throw this.erro(`'${tk.raw}' não é uma função conhecida.`);
        }
        this.avancar();
        return { tipo: 'Var', nome: tk.valor, raw: tk.raw, ...pos };
      case 'FN': {
        this.avancar();
        if (!this.ehOp('(')) throw this.erro(`A função ${tk.raw} precisa de parênteses: ${tk.raw}(...).`);
        this.avancar();
        const args = [];
        if (!this.ehOp(')')) { do { args.push(this.expressao()); } while (this.ehOp(',') && this.avancar()); }
        this.esperarOp(')', `para fechar a chamada de ${tk.raw}`);
        return { tipo: 'Chamada', nome: tk.valor, raw: tk.raw, args, ...pos };
      }
      case 'KW':
        if (tk.valor === 'VERDADEIRO' || tk.valor === 'FALSO') {
          this.avancar();
          return { tipo: 'Bool', valor: tk.valor === 'VERDADEIRO', ...pos };
        }
        if (tk.valor === 'PI') { this.avancar(); return { tipo: 'Num', valor: Math.PI, ...pos }; }
        throw this.erro(`Esperava um valor ou expressão, mas encontrei a palavra reservada '${tk.raw}'.`);
      case 'OP':
        if (tk.valor === '(') {
          this.avancar();
          const e = this.expressao();
          this.esperarOp(')', 'para fechar o parêntese');
          return e;
        }
        break;
      default:
    }
    throw this.erro(`Esperava um valor ou expressão, mas encontrei ${this.descrever(tk)}.`);
  }
}

module.exports = { Parser };

},
"./semantica": function (module, exports, require) {
'use strict';

const { PseudoError } = require('./erros');
const { TIPOS_INFO, ROTULO_ESTATICO } = require('./tipos');
const { buscarFuncao } = require('./funcoes');

const rot = (t) => ROTULO_ESTATICO[t];

/**
 * Verificação feita ANTES de executar: variáveis declaradas, tipos compatíveis,
 * condições lógicas, argumentos de funções. Assim o aluno vê o erro mesmo em
 * trechos do programa que não seriam executados.
 */
function analisar(programa) {
  const vars = new Map(); // nome -> tipo declarado (INTEIRO, ...)
  const erro = (msg, no) => new PseudoError('Erro de tipo/declaração', msg, no.linha, no.col);

  for (const d of programa.decls) {
    for (const n of d.nomes) {
      if (vars.has(n.nome)) throw erro(`A variável '${n.raw}' já foi declarada.`, n);
      vars.set(n.nome, d.tipo);
    }
  }

  const tipoVar = (no) => {
    const t = vars.get(no.nome);
    if (!t) throw erro(`A variável '${no.raw}' não foi declarada. Declare-a com DECLARE antes do INICIO.`, no);
    return t;
  };

  function inferir(no) {
    switch (no.tipo) {
      case 'Num': return 'numero';
      case 'Str': return 'texto';
      case 'Bool': return 'logico';
      case 'Var': return TIPOS_INFO[tipoVar(no)].estatico;
      case 'Unario': {
        const t = inferir(no.expr);
        const esperado = no.op === 'NAO' ? 'logico' : 'numero';
        if (t !== esperado) throw erro(`O operador ${no.op} espera um valor ${rot(esperado)}, mas recebeu ${rot(t)}.`, no);
        return esperado;
      }
      case 'Binario': return inferirBinario(no);
      case 'Chamada': return inferirChamada(no);
      default: throw erro('Expressão desconhecida.', no);
    }
  }

  function inferirBinario(no) {
    const a = inferir(no.esq);
    const b = inferir(no.dir);
    const ambos = `(encontrado: ${rot(a)} e ${rot(b)})`;
    switch (no.op) {
      case '+':
        if (a === 'numero' && b === 'numero') return 'numero';
        if (a === 'texto' && b === 'texto') return 'texto';
        throw erro(`O operador '+' só funciona entre dois números ou entre dois textos ${ambos}. Use PARA_TEXTO() para converter.`, no);
      case '-': case '*': case '/': case '^': case 'DIV': case 'MOD':
        if (a === 'numero' && b === 'numero') return 'numero';
        throw erro(`O operador '${no.op}' só funciona entre números ${ambos}.`, no);
      case '=': case '<>':
        if (a === b) return 'logico';
        throw erro(`Não é possível comparar valores de tipos diferentes com '${no.op}' ${ambos}.`, no);
      case '<': case '>': case '<=': case '>=':
        if (a === b && a !== 'logico') return 'logico';
        throw erro(`O operador '${no.op}' compara dois números ou dois textos ${ambos}.`, no);
      case 'E': case 'OU':
        if (a === 'logico' && b === 'logico') return 'logico';
        throw erro(`O operador ${no.op} só funciona entre valores lógicos (condições) ${ambos}. Dica: use parênteses, ex.: (A > 1) ${no.op} (B < 5).`, no);
      default: throw erro(`Operador desconhecido '${no.op}'.`, no);
    }
  }

  function inferirChamada(no) {
    const f = buscarFuncao(no.nome);
    const min = f.min ?? f.params.length;
    const max = f.variadico ? Infinity : f.params.length;
    if (no.args.length < min || no.args.length > max) {
      const qtd = min === max ? `${min}` : max === Infinity ? `pelo menos ${min}` : `de ${min} a ${max}`;
      throw erro(`A função ${no.raw} espera ${qtd} argumento(s), mas recebeu ${no.args.length}.`, no);
    }
    no.args.forEach((arg, i) => {
      const esperado = f.params[Math.min(i, f.params.length - 1)];
      const t = inferir(arg);
      if (esperado !== 'qualquer' && t !== esperado) {
        throw erro(`O argumento ${i + 1} de ${no.raw} deve ser ${rot(esperado)}, mas recebeu ${rot(t)}.`, arg);
      }
    });
    return f.retorno;
  }

  function exigir(no, esperado, contexto) {
    const t = inferir(no);
    if (t !== esperado) throw erro(`${contexto} deve ser ${rot(esperado)}, mas aqui é ${rot(t)}.`, no);
  }

  function verificar(lista) { for (const c of lista) comando(c); }

  function comando(c) {
    switch (c.tipo) {
      case 'Escreva': c.args.forEach(inferir); break;
      case 'Leia': c.vars.forEach(tipoVar); break;
      case 'Atribuicao': {
        const decl = tipoVar(c.alvo);
        const t = inferir(c.valor);
        const esperado = TIPOS_INFO[decl].estatico;
        if (t !== esperado) {
          throw erro(`A variável '${c.alvo.raw}' é do tipo ${decl} e não aceita um valor ${rot(t)}.`, c.alvo);
        }
        break;
      }
      case 'Se':
        for (const r of c.ramos) { exigir(r.cond, 'logico', 'A condição do SE'); verificar(r.corpo); }
        if (c.senao) verificar(c.senao);
        break;
      case 'Escolha': {
        const t = inferir(c.expr);
        if (t === 'logico') throw erro('O ESCOLHA trabalha com números ou textos, não com valores lógicos.', c.expr);
        const confere = (no) => exigir(no, t, `Os valores do CASO precisam ser do mesmo tipo do ESCOLHA, ou seja,`);
        for (const caso of c.casos) {
          for (const v of caso.valores) { if (v.faixa) { confere(v.de); confere(v.ate); } else confere(v.valor); }
          verificar(caso.corpo);
        }
        if (c.padrao) verificar(c.padrao);
        break;
      }
      case 'Enquanto': exigir(c.cond, 'logico', 'A condição do ENQUANTO'); verificar(c.corpo); break;
      case 'Repita': verificar(c.corpo); exigir(c.cond, 'logico', 'A condição do ATE'); break;
      case 'Para': {
        const decl = tipoVar(c.var);
        if (TIPOS_INFO[decl].estatico !== 'numero') throw erro(`A variável '${c.var.raw}' do PARA precisa ser INTEIRO ou NUMERICO.`, c.var);
        exigir(c.inicio, 'numero', 'O valor inicial do PARA');
        exigir(c.fim, 'numero', 'O valor final do PARA');
        if (c.passo) exigir(c.passo, 'numero', 'O PASSO do PARA');
        verificar(c.corpo);
        break;
      }
      case 'Bloco': verificar(c.corpo); break;
      default: throw erro('Comando desconhecido.', c);
    }
  }

  verificar(programa.corpo);
}

module.exports = { analisar };

},
"./tipos": function (module, exports, require) {
'use strict';

/**
 * Tipos da linguagem.
 *  - estatico: categoria usada na verificação antes de executar ('numero' | 'texto' | 'logico')
 *  - aceita:   o valor JS cabe numa variável desse tipo?
 *  - ler:      converte o que o aluno digitou (LEIA) para o tipo
 *
 * CARACTERES e ALFANUMERICOS guardam texto. Se quiser diferenciá-los (ex.: CARACTERES = 1 só
 * caractere, ALFANUMERICOS = só letras e números), basta alterar `aceita` e `ler` abaixo.
 */
const lerTexto = (s) => ({ ok: true, valor: s.replace(/\r$/, '') });

const TIPOS_INFO = {
  INTEIRO: {
    estatico: 'numero',
    aceita: (v) => typeof v === 'number' && Number.isInteger(v),
    ler: (s) => {
      const t = s.trim();
      return /^[+-]?\d+$/.test(t)
        ? { ok: true, valor: parseInt(t, 10) }
        : { ok: false, motivo: 'digite um número inteiro (sem casas decimais).' };
    },
  },
  NUMERICO: {
    estatico: 'numero',
    aceita: (v) => typeof v === 'number',
    ler: (s) => {
      const t = s.trim().replace(',', '.');
      return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(t)
        ? { ok: true, valor: Number(t) }
        : { ok: false, motivo: 'digite um número (ex.: 12 ou 3.5).' };
    },
  },
  CARACTERES: { estatico: 'texto', aceita: (v) => typeof v === 'string', ler: lerTexto },
  ALFANUMERICOS: { estatico: 'texto', aceita: (v) => typeof v === 'string', ler: lerTexto },
  LOGICOS: {
    estatico: 'logico',
    aceita: (v) => typeof v === 'boolean',
    ler: (s) => {
      const t = s.trim().toLowerCase();
      if (['verdadeiro', 'v', 'sim', 's', 'true', '1'].includes(t)) return { ok: true, valor: true };
      if (['falso', 'f', 'nao', 'não', 'n', 'false', '0'].includes(t)) return { ok: true, valor: false };
      return { ok: false, motivo: 'digite VERDADEIRO ou FALSO.' };
    },
  },
};

const NOMES_TIPOS = Object.keys(TIPOS_INFO);

/** Como um valor é exibido por ESCREVA. */
function formatar(valor) {
  if (typeof valor === 'boolean') return valor ? 'VERDADEIRO' : 'FALSO';
  if (typeof valor === 'number') {
    if (Number.isInteger(valor)) return String(valor);
    return String(Number(valor.toPrecision(12))); // esconde ruído de ponto flutuante
  }
  return String(valor);
}

function nomeTipoValor(valor) {
  if (typeof valor === 'boolean') return 'LOGICOS';
  if (typeof valor === 'string') return 'texto';
  return Number.isInteger(valor) ? 'INTEIRO' : 'NUMERICO';
}

const ROTULO_ESTATICO = { numero: 'número', texto: 'texto', logico: 'lógico' };

module.exports = { TIPOS_INFO, NOMES_TIPOS, formatar, nomeTipoValor, ROTULO_ESTATICO };

}
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
  EXEMPLOS: [
  {
    "arquivo": "01_fahrenheit.alg",
    "codigo": "ALGORITMO TEMPERATURA:\n    DECLARE F, C : NUMERICO;\nINICIO\n    ESCREVA(\"Digite a temperatura em Fahrenheit\");\n    LEIA(F);\n    C <- (F - 32) * (5 / 9);\n    ESCREVA(\"A temperatura convertida em Celsius é\", C);\nFIMALGORITMO\n"
  },
  {
    "arquivo": "02_mes_se.alg",
    "codigo": "ALGORITMO _MES:\n    DECLARE MES : INTEIRO;\nINICIO\n    ESCREVA(\"Digite qual o número do mês\");\n    LEIA(MES);\n\n    SE(MES > 12 OU MES < 1) ENTAO\n        ESCREVA(\"Número do mês inválido\");\n    SENAO SE(MES = 1) ENTAO\n        ESCREVA(\"Janeiro\");\n    SENAO SE(MES = 2) ENTAO\n        ESCREVA(\"Fevereiro\");\n    SENAO SE(MES = 3) ENTAO\n        ESCREVA(\"Março\");\n    SENAO SE(MES = 12) ENTAO\n        ESCREVA(\"Dezembro\");\n    SENAO\n        ESCREVA(\"Outro mês (exemplo incompleto)\");\n    FIMSE\nFIMALGORITMO\n"
  },
  {
    "arquivo": "03_escolha_mes.alg",
    "codigo": "ALGORITMO ESCOLHA_MES:\n    DECLARE MES : INTEIRO;\nINICIO\n    ESCREVA(\"Digite o número do mês\");\n    LEIA(MES);\n\n    ESCOLHA(MES)\n        CASO 1:\n            ESCREVA(\"Janeiro\");\n        CASO 2:\n            ESCREVA(\"Fevereiro\");\n        CASO 3..5:\n            ESCREVA(\"Entre março e maio\");\n        CASO 6, 7:\n            ESCREVA(\"Junho ou julho\");\n        CASO 12:\n            ESCREVA(\"Dezembro\");\n        OUTROCASO:\n            ESCREVA(\"Mês não tratado neste exemplo\");\n    FIMESCOLHA\nFIMALGORITMO\n"
  },
  {
    "arquivo": "04_enquanto.alg",
    "codigo": "ALGORITMO CONTAGEM_ENQUANTO:\n    DECLARE i : INTEIRO;\nINICIO\n    i <- 1;\n    ENQUANTO(i <= 10) FACA\n        INICIO\n            ESCREVA(i);\n            i++;\n        FIM\n    FIMENQUANTO\nFIMALGORITMO\n"
  },
  {
    "arquivo": "05_repita.alg",
    "codigo": "ALGORITMO CONTAGEM_REPITA:\n    DECLARE i : INTEIRO;\nINICIO\n    i <- 1;\n    REPITA\n        ESCREVA(i);\n        i <- i + 1;\n    ATE(i > 10);\nFIMALGORITMO\n"
  },
  {
    "arquivo": "06_para_tabuada.alg",
    "codigo": "ALGORITMO TABUADA:\n    DECLARE N, I : INTEIRO;\nINICIO\n    ESCREVA(\"Tabuada de qual número?\");\n    LEIA(N);\n    PARA I DE 1 ATE 10 FACA\n        ESCREVA(N, \"x\", I, \"=\", N * I);\n    FIMPARA\nFIMALGORITMO\n"
  },
  {
    "arquivo": "07_bhaskara.alg",
    "codigo": "ALGORITMO BHASKARA:\n    DECLARE A, B, C, DELTA, X1, X2 : NUMERICO;\nINICIO\n    ESCREVA(\"Informe A, B e C (um por linha)\");\n    LEIA(A, B, C);\n    DELTA <- B ^ 2 - 4 * A * C;\n\n    SE(A = 0) ENTAO\n        ESCREVA(\"Não é uma equação do 2º grau\");\n    SENAO SE(DELTA < 0) ENTAO\n        ESCREVA(\"Não existem raízes reais\");\n    SENAO\n        X1 <- (-B + SQRT(DELTA)) / (2 * A);\n        X2 <- (-B - SQRT(DELTA)) / (2 * A);\n        ESCREVA(\"X1 =\", X1);\n        ESCREVA(\"X2 =\", X2);\n    FIMSE\nFIMALGORITMO"
  },
  {
    "arquivo": "08_tipos_e_funcoes.alg",
    "codigo": "ALGORITMO TIPOS_E_FUNCOES:\n    DECLARE NOME : CARACTERES;\n    DECLARE IDADE : INTEIRO;\n    DECLARE ALTURA : NUMERICO;\n    DECLARE CODIGO : ALFANUMERICOS;\n    DECLARE MAIOR_IDADE : LOGICOS;\nINICIO\n    ESCREVA(\"Nome:\");\n    LEIA(NOME);\n    ESCREVA(\"Idade:\");\n    LEIA(IDADE);\n    ESCREVA(\"Altura (m):\");\n    LEIA(ALTURA);\n\n    MAIOR_IDADE <- IDADE >= 18;\n    CODIGO <- MAIUSCULO(SUBTEXTO(NOME, 1, 3)) + PARA_TEXTO(IDADE);\n\n    ESCREVA(\"Olá,\", NOME);\n    ESCREVA(\"Maior de idade?\", MAIOR_IDADE);\n    ESCREVA(\"Seu código:\", CODIGO);\n    ESCREVA(\"Altura arredondada:\", ROUND(ALTURA, 1));\n    ESCREVA(\"Resto de IDADE por 7:\", IDADE MOD 7, \"| divisão inteira:\", IDADE DIV 7);\n\n    SE(NAO MAIOR_IDADE E ALTURA > 1.5) ENTAO\n        ESCREVA(\"Menor de idade, mas já é alto(a)!\");\n    FIMSE\nFIMALGORITMO\n"
  }
]
};
})();