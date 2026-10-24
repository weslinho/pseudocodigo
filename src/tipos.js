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

/** Primeira posição de um VETOR/MATRIZ (1 = estilo portugol; troque para 0 se preferir estilo C). */
const BASE_INDICE = 1;

/** Como um valor é exibido por ESCREVA. */
function formatar(valor) {
  if (typeof valor === 'boolean') return valor ? 'VERDADEIRO' : 'FALSO';
  if (typeof valor === 'number') {
    if (Number.isInteger(valor)) return String(valor);
    return String(Number(valor.toPrecision(12))); // esconde ruído de ponto flutuante
  }
  return String(valor);
}

/** Número com quantidade fixa de casas decimais (usado por FORMATAR). */
function formatarDecimais(valor, casas) {
  const arredondado = Number(Math.round(Number(`${valor}e${casas}`)) + `e-${casas}`);
  return (Number.isFinite(arredondado) ? arredondado : valor).toFixed(casas);
}

function nomeTipoValor(valor) {
  if (typeof valor === 'boolean') return 'LOGICOS';
  if (typeof valor === 'string') return 'texto';
  return Number.isInteger(valor) ? 'INTEIRO' : 'NUMERICO';
}

const ROTULO_ESTATICO = { numero: 'número', texto: 'texto', logico: 'lógico' };

module.exports = {
  TIPOS_INFO, NOMES_TIPOS, BASE_INDICE, formatar, formatarDecimais, nomeTipoValor, ROTULO_ESTATICO,
};
