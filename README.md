# Pseudocódigo JS

Interpretador de **pseudocódigo em português (portugol)** feito em Node.js para ensinar lógica de programação.
O usuário escreve o algoritmo e o programa executa direto no terminal,
com `LEIA` interativo (como o `input()` do Python). Não há dependências: só [Node.js 18+](https://nodejs.org/pt-br/download).

## Como usar 

Para utilizar a última versão do interpretador de forma fácil e rápida, acesse [wsleyweber.github.io/pseudocodigo](https://wsleyweber.github.io/pseudocodigo/).

Agora, caso queira baixar o código-fonte e testar no seu próprio sistema:
```bash
npm start                                 # executa o arquivo programa.alg
npm start -- exemplos/03_escolha_mes.alg  # executa outro arquivo
node bin/pseudo.js meu_codigo.txt         # qualquer extensão serve (.alg, .txt, .md ...)
node bin/pseudo.js --verificar prog.alg   # só confere erros e avisos, sem executar
npm test                                  # testes automatizados
```

Opções da linha de comando:

| Opção | O que faz |
|---|---|
| `--verificar` | Só confere erros e avisos, sem executar |
| `--sem-avisos` | Não mostra os avisos pedagógicos |
| `--max-iteracoes <n>` | Limite de repetições contra laços infinitos (padrão 10000000; 0 = sem limite) |

O fluxo é: editar `programa.alg` → salvar → rodar.

> Caso esteja utilizando Visual Studio Code, o aluno pode pressionar as teclas **Ctrl + Shift + B**, com o arquivo do algoritmo aberto, para executar.

## Sobre a estrutura da versão WEB

A pasta `docs/` é onde se encontra a página que executa o interpretador no navegador, contando com: editor com realce de sintaxe e numeração de linhas, `LEIA` interativo na própria página, botões **Executar**, **Parar** e **Verificar erros**, exemplos prontos, abrir/baixar arquivos `.alg` e salvamento automático no navegador.

Para publicar no **GitHub Pages**, foi utilizado o **GitHub Actions**. Com ele, sempre que o código principal é alterado, um fluxo converte o código para um formato que o navegador entende. O limite de repetições na página é menor que o do terminal para detectar laços infinitos mais rápido.

## Estrutura do interpretador

```
programa.alg          arquivo executado por padrão
bin/pseudo.js         linha de comando
src/
  lexer.js            texto -> tokens (comentários, números, palavras, operadores)
  parser.js           tokens -> árvore do programa (sintaxe e precedência)
  semantica.js        verificação ANTES de executar (declarações e tipos)
  interpretador.js    execução da árvore
  tipos.js            os 5 tipos: validação, conversão do LEIA, formatação do ESCREVA
  funcoes.js          funções pré-definidas (SQRT, COS, ...). Fácil de estender
  sugestoes.js        "Você quis dizer ...?" (distância entre palavras)
  palavras.js         palavras reservadas
  io.js               entrada/saída pelo terminal
  erros.js            mensagens de erro amigáveis
exemplos/             programas prontos
test/                 testes (node:test)
```

## Resumo da linguagem

```
ALGORITMO NOME:                 # o cabeçalho é opcional; "ALGORITMO_X:" também vale
    DECLARE A, B : INTEIRO;     # todas as variáveis precisam ser declaradas e tipadas
    DECLARE NOME : CARACTERES;  # DECLARE pode se repetir
INICIO
    ...comandos...
FIMALGORITMO
```

* Todo comando simples termina com `;`. Comentários: `# ...`, `// ...` e `/* ... */`.
* Palavras reservadas e nomes de variáveis **não diferenciam maiúsculas/minúsculas nem acentos**
  (`SE`, `se` e `Se` são iguais; `ENTÃO` = `ENTAO`).

### Tipos

| Tipo | Guarda | Exemplo |
|---|---|---|
| `INTEIRO` | números sem casas decimais | `10` |
| `NUMERICO` | números com ou sem casas decimais | `3.14` |
| `CARACTERES` | texto | `"Ana"` |
| `ALFANUMERICOS` | texto (letras e números) | `"ABC123"` |
| `LOGICOS` | `VERDADEIRO` ou `FALSO` | `VERDADEIRO` |

Atribuir um valor de tipo errado é erro (`A <- "oi"` em um `INTEIRO`). Um `INTEIRO` também não aceita um
resultado com casas decimais (`A <- 7 / 2`): use `TRUNC`, `ROUND` ou `DIV`.

### Nomes de variáveis

Começam com letra ou `_`, seguidos de letras, números ou `_`. Não podem começar com número nem ser palavra
reservada: `ALGORITMO FIMALGORITMO DECLARE INICIO FIM SE ENTAO SENAO FIMSE ESCOLHA CASO OUTROCASO PADRAO
FIMESCOLHA ENQUANTO FACA FIMENQUANTO REPITA ATE PARA DE PASSO FIMPARA ESCREVA ESCREVA_SEM_QUEBRA LEIA
CONSTANTE VETOR MATRIZ FUNCAO FIMFUNCAO PROCEDIMENTO FIMPROCEDIMENTO RETORNE INTERROMPA CONTINUE
E OU NAO DIV MOD VERDADEIRO FALSO PI`, os nomes dos tipos e os nomes das funções (`COS`, `SEN`, `SQRT`...).

### Entrada e saída

```
ESCREVA("Texto", variavel, 2 + 3);   # itens separados por espaço; pula linha no final
ESCREVA_SEM_QUEBRA("Digite: ");      # igual, mas NÃO pula linha (bom antes de um LEIA)
LEIA(X);                             # lê um valor; LEIA(A, B, C) lê um por linha; LEIA(V[2]) lê numa posição
```

`LEIA` valida o tipo e pede de novo se o aluno digitar algo inválido. Em `NUMERICO` vale `3,5` ou `3.5`.
Em `LOGICOS` vale `verdadeiro/falso`, `v/f`, `sim/nao`.

### Operadores

* Atribuição: `<-` (ou `:=`); também `i++`, `i--`, `+=`, `-=`, `*=`, `/=`.
* Aritméticos: `+ - * / ^` (potência), `DIV` (divisão inteira), `MOD` ou `%` (resto).
  `+` também junta textos.
* Relacionais: `=  <>  <  >  <=  >=` (também `==` e `!=`).
* Lógicos: `E`, `OU`, `NAO` (com curto-circuito).
* Precedência (do menor para o maior): `OU` < `E` < `NAO` < relacionais < `+ -` < `* / DIV MOD` < `-` unário < `^`.
  Use parênteses na dúvida.

> Atenção: `i<-1` é lido como atribuição. Para comparar com um negativo escreva `i < -1`.

### Estruturas

```
SE(cond) ENTAO                    ESCOLHA(X)
    ...                               CASO 1:
SENAO SE(cond) ENTAO                      ...
    ...                               CASO 2..5:        # faixa
SENAO                                     ...
    ...                               CASO 7, 9:        # lista
FIMSE                                     ...
                                      OUTROCASO:        # padrão (opcional)
ENQUANTO(cond) FACA                       ...
    ...                           FIMESCOLHA
FIMENQUANTO
                                  PARA I DE 1 ATE 10 PASSO 2 FACA
REPITA                                ...
    ...                           FIMPARA
ATE(cond);
```

* `INICIO ... FIM` forma um bloco (como `{ }`) e pode ser usado em qualquer lugar.
* `SENAO SE` continua o **mesmo** `SE` (um único `FIMSE` fecha tudo). Para aninhar um `SE` dentro de um
  `SENAO`, coloque-o em um bloco: `SENAO INICIO SE ... FIMSE FIM`.
* No `ESCOLHA` não há "queda" entre casos: só o caso que combinou é executado.

### Vetores e matrizes

```
DECLARE NOTAS : VETOR[5] DE NUMERICO;      # posições 1 a 5
DECLARE M : MATRIZ[3][4] DE INTEIRO;       # também vale MATRIZ[3, 4]
...
NOTAS[1] <- 8.5;
M[2][3] <- NOTAS[1] * 2;                   # também vale M[2, 3]
```

* As posições começam em **1** (para começar em 0, deve-se mudar `BASE_INDICE` em `src/tipos.js`).
* O tamanho deve ser fixo: um número ou uma `CONSTANTE` (nunca uma variável).
* Ler uma posição que nunca recebeu valor, ou usar um índice fora dos limites, é erro de execução.

### Constantes

```
CONSTANTE QTD : INTEIRO <- 5;              # valor fixo; não pode ser alterada nem lida com LEIA
CONSTANTE DOBRO : INTEIRO <- QTD * 2;      # só pode usar literais e outras constantes
```

### Funções e procedimentos

Ficam **antes do `INICIO`** do algoritmo, depois das declarações.

```
FUNCAO FATORIAL(N : INTEIRO) : INTEIRO     # devolve um valor
    DECLARE R : INTEIRO;                   # variáveis locais
INICIO
    SE (N <= 1) ENTAO RETORNE 1; FIMSE
    RETORNE N * FATORIAL(N - 1);           # recursão permitida
FIMFUNCAO

PROCEDIMENTO PREENCHER(V : VETOR DE INTEIRO, TAM : INTEIRO)   # não devolve valor
INICIO
    ...                                    # RETORNE; (sem valor) encerra o procedimento
FIMPROCEDIMENTO
```

Uso: `X <- FATORIAL(5);` (função, dentro de uma expressão) e `PREENCHER(V, 3);` (procedimento, como comando).

* Parâmetros simples são passados **por valor**. `VETOR DE tipo` e `MATRIZ DE tipo` são passados **por referência**
  (a função/procedimento altera o vetor original).
* Variáveis globais podem ser lidas e alteradas; uma variável local com o mesmo nome "esconde" a global.
* Uma `FUNCAO` precisa de pelo menos um `RETORNE valor;`.

### Controle de laços

`INTERROMPA;` sai do laço mais interno (`ENQUANTO`, `REPITA` ou `PARA`). `CONTINUE;` pula para a próxima repetição
(no `REPITA`, vai direto para o teste do `ATE`; no `PARA`, vai para o próximo valor).

### Funções pré-definidas

| Categoria | Funções |
|---|---|
| Matemática | `SQRT ABS POW EXP LN LOG` (LOG = base 10) e a constante `PI` |
| Trigonometria (radianos) | `SEN COS TAN ASEN ACOS ATAN GRAUS RADIANOS` |
| Arredondamento | `ROUND(x)`, `ROUND(x, casas)` (ou `ARREDONDAR`), `TRUNC FLOOR CEIL` |
| Outras | `MAX(a, b, ...)`, `MIN(a, b, ...)`, `ALEATORIO(min, max)` |
| Formatação | `FORMATAR(valor, casas)` devolve texto com casas fixas: `FORMATAR(3.14159, 2)` → `3.14` |
| Texto | `MAIUSCULO MINUSCULO TAM_TEXTO SUBTEXTO(t, inicio, qtd) LOCALIZAR(trecho, t)` (posições começam em 1) |
| Conversão | `PARA_TEXTO(valor)`, `PARA_NUMERO(texto)` |

## Avisos pedagógicos

Antes de executar, o sistema mostra **avisos** (não impedem a execução; use `--sem-avisos` para esconder):
variável declarada e nunca usada, variável usada mas que nunca recebe valor, comparação de números decimais com
`=` (o clássico `0.1 + 0.2 = 0.3`), `/` atribuído a `INTEIRO`, divisão por zero literal e laço cuja condição
nunca muda (possível laço infinito).

## Erros que o aluno vê

```
Erro de tipo/declaração (linha 4, coluna 3): A variável 'A' é do tipo INTEIRO e não aceita um valor texto.
  4 |   A <- "oi";
    |   ^
```

Quando há uma palavra ou variável parecida, o sistema sugere a correção (`'ETNAO'... Você quis dizer ENTAO?`).

Erros léxicos, de sintaxe e de tipo/declaração são encontrados **antes** de qualquer execução, inclusive em
trechos que não seriam executados. Erros de execução (divisão por zero, variável sem valor, `SQRT(-1)`...)
aparecem quando acontecem. Um limite de repetições (padrão 10 milhões, `--max-iteracoes`) evita travar
com laço infinito, e `Ctrl+C` interrompe a qualquer momento.