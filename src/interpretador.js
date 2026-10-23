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