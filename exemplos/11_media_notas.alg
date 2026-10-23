ALGORITMO MEDIA_NOTAS:
    DECLARE ALUNO : CARACTERES;
    DECLARE QTD, I : INTEIRO;
    DECLARE NOTA, SOMA, MEDIA, MAIOR, MENOR : NUMERICO;
    DECLARE APROVADO : LOGICOS;
INICIO
    ESCREVA("Nome do aluno:");
    LEIA(ALUNO);
    ESCREVA("Quantas notas?");
    LEIA(QTD);

    SOMA <- 0;
    MAIOR <- 0;
    MENOR <- 10;
    PARA I DE 1 ATE QTD FACA
        ESCREVA("Nota", I, ":");
        LEIA(NOTA);
        SE(NOTA < 0 OU NOTA > 10) ENTAO
            ESCREVA("Nota inválida, será ignorada");
            I--;
        SENAO
            SOMA += NOTA;
            MAIOR <- MAX(MAIOR, NOTA);
            MENOR <- MIN(MENOR, NOTA);
        FIMSE
    FIMPARA

    MEDIA <- SOMA / QTD;
    APROVADO <- MEDIA >= 7;
    ESCREVA("Aluno:", MAIUSCULO(ALUNO));
    ESCREVA("Média:", ROUND(MEDIA, 2));
    ESCREVA("Maior:", MAIOR, "| Menor:", MENOR);
    SE(APROVADO) ENTAO
        ESCREVA("Situação: APROVADO");
    SENAO SE(MEDIA >= 5) ENTAO
        ESCREVA("Situação: RECUPERAÇÃO");
    SENAO
        ESCREVA("Situação: REPROVADO");
    FIMSE
FIMALGORITMO
