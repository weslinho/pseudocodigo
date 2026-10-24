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
  const opcoes = {
    arquivo: null, verificar: false, maxIteracoes: undefined, semAvisos: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--verificar') opcoes.verificar = true;
    else if (a === '--sem-avisos') opcoes.semAvisos = true;
    else if (a === '--max-iteracoes') {
      const v = Number(argv[++i]);
      if (!Number.isInteger(v) || v < 0) throw new Error('--max-iteracoes precisa de um inteiro >= 0.');
      opcoes.maxIteracoes = v;
    } else if (a.startsWith('-')) throw new Error(`Opção desconhecida: ${a}`);
    else opcoes.arquivo = a;
  }
  return opcoes;
}

/** Onde procurar o arquivo: pasta atual; no caso padrão, também a raiz do projeto. */
function localizarArquivo(args) {
  const nome = args.arquivo || ARQUIVO_PADRAO;
  const candidatos = [path.resolve(process.cwd(), nome)];
  if (!args.arquivo) {
    candidatos.push(path.resolve(__dirname, '..', nome));
  }
  return { nome, caminho: candidatos.find((c) => fs.existsSync(c)) };
}

async function main() {
  let args;
  try { args = lerArgumentos(process.argv.slice(2)); } catch (e) {
    console.error(e.message);
    return 2;
  }

  const io = criarIOTerminal();
  let codigo = 0;

  const { nome, caminho } = localizarArquivo(args);
  if (!caminho) {
    console.error(`Arquivo não encontrado: ${nome}`);
    codigo = 2;
  } else {
    const fonte = fs.readFileSync(caminho, 'utf8').replace(/^\uFEFF/, '');
    try {
      if (args.verificar) {
        const programa = compilar(fonte);
        if (!args.semAvisos) for (const a of programa.avisos) console.error(formatarErro(a, fonte) + '\n');
        console.log(programa.avisos.length && !args.semAvisos
          ? `Nenhum erro, mas ${programa.avisos.length} aviso(s).` : 'Nenhum erro encontrado.');
      } else {
        await executar(fonte, io, {
          maxIteracoes: args.maxIteracoes, semAvisos: args.semAvisos,
        });
      }
    } catch (e) {
      if (e instanceof PseudoError) {
        console.error('\n' + formatarErro(e, fonte));
        codigo = 1;
      } else {
        console.error('Erro interno do interpretador:', e);
        codigo = 3;
      }
    }
  }

  io.fechar();
  return codigo;
}

main().then((codigo) => { process.exitCode = codigo; });
