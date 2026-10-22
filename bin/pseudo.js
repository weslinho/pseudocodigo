#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { compilar, executar, PseudoError, formatarErro } = require('../src');
const { criarIOTerminal } = require('../src/io');

const ARQUIVO_PADRAO = 'programa.alg';

// Saída fechada (ex.: `| head`): encerra em silêncio.
process.stdout.on('error', (e) => { if (e.code === 'EPIPE') process.exit(0); else throw e; });

function lerArgumentos(argv) {
  const opcoes = { arquivo: null, verificar: false, maxIteracoes: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--verificar') opcoes.verificar = true;
    else if (a === '--max-iteracoes') {
      const v = Number(argv[++i]);
      if (!Number.isInteger(v) || v < 0) throw new Error('--max-iteracoes precisa de um inteiro >= 0.');
      opcoes.maxIteracoes = v;
    } else if (a.startsWith('-')) throw new Error(`Opção desconhecida: ${a}`);
    else opcoes.arquivo = a;
  }
  return opcoes;
}

async function main() {
  let args;
  try { args = lerArgumentos(process.argv.slice(2)); } catch (e) {
    console.error(e.message);
    return 2;
  }

  const arquivo = args.arquivo || ARQUIVO_PADRAO;
  let caminho = path.resolve(process.cwd(), arquivo);
  if (!fs.existsSync(caminho) && !args.arquivo) caminho = path.resolve(__dirname, '..', arquivo);
  if (!fs.existsSync(caminho)) {
    console.error(`Arquivo não encontrado: ${arquivo}`);
    return 2;
  }

  const fonte = fs.readFileSync(caminho, 'utf8');
  const io = criarIOTerminal();
  try {
    if (args.verificar) {
      compilar(fonte);
      console.log('Nenhum erro encontrado.');
    } else {
      await executar(fonte, io, { maxIteracoes: args.maxIteracoes });
    }
    return 0;
  } catch (e) {
    if (e instanceof PseudoError) {
      console.error('\n' + formatarErro(e, fonte.replace(/^\uFEFF/, '')));
      return 1;
    }
    console.error('Erro interno do interpretador:', e);
    return 3;
  } finally {
    io.fechar();
  }
}

main().then((codigo) => { process.exitCode = codigo; });
