ALGORITMO TRIANGULO_E_GEOMETRIA:
    DECLARE A, B, C, S, AREA, ANGULO : NUMERICO;
    DECLARE TIPO : CARACTERES;
    DECLARE VALIDO, EQUI, ISO : LOGICOS;
INICIO
    ESCREVA("Lados do triângulo:");
    LEIA(A, B, C);

    VALIDO <- A + B > C E A + C > B E B + C > A E A > 0 E B > 0 E C > 0;
    SE(NAO VALIDO) ENTAO
        ESCREVA("Esses lados não formam um triângulo.");
    SENAO
        EQUI <- A = B E B = C;
        ISO <- A = B OU B = C OU A = C;
        SE(EQUI) ENTAO
            TIPO <- "equilátero";
        SENAO SE(ISO) ENTAO
            TIPO <- "isósceles";
        SENAO
            TIPO <- "escaleno";
        FIMSE
        S <- (A + B + C) / 2;
        AREA <- SQRT(S * (S - A) * (S - B) * (S - C));
        ANGULO <- GRAUS(ACOS((B ^ 2 + C ^ 2 - A ^ 2) / (2 * B * C)));
        ESCREVA("Tipo:", TIPO);
        ESCREVA("Perímetro:", A + B + C);
        ESCREVA("Área:", ROUND(AREA, 3));
        ESCREVA("Ângulo oposto ao lado A:", ROUND(ANGULO, 2), "graus");
        ESCREVA("Círculo de raio", A, "tem área", ROUND(PI * A ^ 2, 2));
    FIMSE
FIMALGORITMO
