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
