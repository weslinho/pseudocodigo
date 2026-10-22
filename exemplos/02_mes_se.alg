ALGORITMO_MES:
    DECLARE MES : INTEIRO;
INICIO
    ESCREVA("Digite qual o número do mês");
    LEIA(MES);

    SE(MES > 12 OU MES < 1) ENTAO
        ESCREVA("Número do mês inválido");
    SENAO SE(MES = 1) ENTAO
        ESCREVA("Janeiro");
    SENAO SE(MES = 2) ENTAO
        ESCREVA("Fevereiro");
    SENAO SE(MES = 3) ENTAO
        ESCREVA("Março");
    SENAO SE(MES = 12) ENTAO
        ESCREVA("Dezembro");
    SENAO
        ESCREVA("Outro mês (exemplo incompleto)");
    FIMSE
FIMALGORITMO
