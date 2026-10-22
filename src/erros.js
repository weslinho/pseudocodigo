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
