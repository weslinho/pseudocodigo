ALGORITMO MENU_CALCULADORA:
    DECLARE OP : INTEIRO;
    DECLARE X, Y, R : NUMERICO;
    DECLARE CONTINUAR : LOGICOS;
    DECLARE USOS : INTEIRO;
INICIO
    USOS <- 0;
    REPITA
        ESCREVA("1-Somar 2-Subtrair 3-Multiplicar 4-Dividir 5-Potência 0-Sair");
        LEIA(OP);
        CONTINUAR <- OP <> 0;
        SE(OP >= 1 E OP <= 5) ENTAO
            ESCREVA("Dois valores:");
            LEIA(X, Y);
            USOS++;
            ESCOLHA(OP)
                CASO 1: R <- X + Y;
                CASO 2: R <- X - Y;
                CASO 3: R <- X * Y;
                CASO 4:
                    SE(Y = 0) ENTAO
                        ESCREVA("Divisão por zero!");
                        R <- 0;
                    SENAO
                        R <- X / Y;
                    FIMSE
                CASO 5: R <- X ^ Y;
            FIMESCOLHA
            ESCREVA("Resultado:", R);
        SENAO SE(OP <> 0) ENTAO
            ESCREVA("Opção inválida");
        FIMSE
    ATE(NAO CONTINUAR);
    ESCREVA("Operações realizadas:", USOS);
FIMALGORITMO
