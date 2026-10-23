ALGORITMO BHASKARA:
    DECLARE A, B, C, DELTA, X1, X2 : NUMERICO;
INICIO
    ESCREVA("Informe A, B e C (um por linha)");
    LEIA(A, B, C);
    DELTA <- B ^ 2 - 4 * A * C;

    SE(A = 0) ENTAO
        ESCREVA("Não é uma equação do 2º grau");
    SENAO SE(DELTA < 0) ENTAO
        ESCREVA("Não existem raízes reais");
    SENAO
        X1 <- (-B + SQRT(DELTA)) / (2 * A);
        X2 <- (-B - SQRT(DELTA)) / (2 * A);
        ESCREVA("X1 =", X1);
        ESCREVA("X2 =", X2);
    FIMSE
FIMALGORITMO