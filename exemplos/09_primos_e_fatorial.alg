ALGORITMO PRIMOS_E_FATORIAL:
    DECLARE N, I, D, QTD, FAT, CONT : INTEIRO;
    DECLARE PRIMO : LOGICOS;
INICIO
    ESCREVA("Quantos números testar (a partir de 2)?");
    LEIA(N);

    QTD <- 0;
    PARA I DE 2 ATE N FACA
        PRIMO <- VERDADEIRO;
        D <- 2;
        ENQUANTO(D * D <= I E PRIMO) FACA
            SE(I MOD D = 0) ENTAO
                PRIMO <- FALSO;
            FIMSE
            D++;
        FIMENQUANTO
        SE(PRIMO) ENTAO
            ESCREVA(I, "é primo");
            QTD += 1;
        FIMSE
    FIMPARA
    ESCREVA("Total de primos até", N, ":", QTD);

    FAT <- 1;
    PARA CONT DE N ATE 2 PASSO -1 FACA
        FAT *= CONT;
    FIMPARA
    ESCREVA("Fatorial de", N, "=", FAT);
FIMALGORITMO
