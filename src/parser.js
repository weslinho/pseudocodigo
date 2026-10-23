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
