ALGORITMO CAIXA_ELETRONICO:
    DECLARE VALOR, RESTO, NOTAS : INTEIRO;
    DECLARE NOTA : INTEIRO;
INICIO
    ESCREVA("Valor do saque (múltiplo de 10):");
    LEIA(VALOR);

    SE(VALOR <= 0 OU VALOR MOD 10 <> 0) ENTAO
        ESCREVA("Valor inválido");
    SENAO
        RESTO <- VALOR;
        NOTA <- 100;
        REPITA
            NOTAS <- RESTO DIV NOTA;
            SE(NOTAS > 0) ENTAO
                ESCREVA(NOTAS, "nota(s) de R$", NOTA);
                RESTO <- RESTO MOD NOTA;
            FIMSE
            ESCOLHA(NOTA)
                CASO 100: NOTA <- 50;
                CASO 50: NOTA <- 20;
                CASO 20: NOTA <- 10;
                OUTROCASO: NOTA <- 0;
            FIMESCOLHA
        ATE(RESTO = 0 OU NOTA = 0);
    FIMSE
FIMALGORITMO
