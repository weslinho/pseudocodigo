ALGORITMO MATRIZ_E_BUSCA:
    CONSTANTE LIN : INTEIRO <- 3;
    CONSTANTE COL : INTEIRO <- 3;
    DECLARE M : MATRIZ[LIN][COL] DE INTEIRO;
    DECLARE I, J, ALVO, ACHADO : INTEIRO;
INICIO
    PARA I DE 1 ATE LIN FACA
        PARA J DE 1 ATE COL FACA
            M[I][J] <- (I - 1) * COL + J;
        FIMPARA
    FIMPARA

    ESCREVA_SEM_QUEBRA("Qual número procurar (1 a 9)? ");
    LEIA(ALVO);

    ACHADO <- 0;
    PARA I DE 1 ATE LIN FACA
        PARA J DE 1 ATE COL FACA
            SE (M[I][J] = ALVO) ENTAO
                ESCREVA("Encontrado na linha", I, "coluna", J);
                ACHADO <- 1;
                INTERROMPA;         # sai só do PARA interno
            FIMSE
        FIMPARA
        SE (ACHADO = 1) ENTAO
            INTERROMPA;
        FIMSE
    FIMPARA

    SE (ACHADO = 0) ENTAO
        ESCREVA("Não encontrado");
    FIMSE
FIMALGORITMO
