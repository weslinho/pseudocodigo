ALGORITMO FIBONACCI_MDC:
    DECLARE A, B, X, Y, T, I, N, PROX, ANT, ATUAL : INTEIRO;
INICIO
    ESCREVA("Dois números para o MDC:");
    LEIA(A, B);
    X <- A;
    Y <- B;
    ENQUANTO(Y <> 0) FACA
        T <- Y;
        Y <- X MOD Y;
        X <- T;
    FIMENQUANTO
    ESCREVA("MDC de", A, "e", B, "=", X);
    ESCREVA("MMC =", A * B DIV X);

    ESCREVA("Quantos termos de Fibonacci?");
    LEIA(N);
    ANT <- 0;
    ATUAL <- 1;
    PARA I DE 1 ATE N FACA
        ESCREVA("F(" + PARA_TEXTO(I) + ") =", ANT);
        PROX <- ANT + ATUAL;
        ANT <- ATUAL;
        ATUAL <- PROX;
    FIMPARA
FIMALGORITMO
