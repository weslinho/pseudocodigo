ALGORITMO ESCOLHA_MES:
    DECLARE MES : INTEIRO;
INICIO
    ESCREVA("Digite o número do mês");
    LEIA(MES);

    ESCOLHA(MES)
        CASO 1:
            ESCREVA("Janeiro");
        CASO 2:
            ESCREVA("Fevereiro");
        CASO 3..5:
            ESCREVA("Entre março e maio");
        CASO 6, 7:
            ESCREVA("Junho ou julho");
        CASO 12:
            ESCREVA("Dezembro");
        OUTROCASO:
            ESCREVA("Mês não tratado neste exemplo");
    FIMESCOLHA
FIMALGORITMO
