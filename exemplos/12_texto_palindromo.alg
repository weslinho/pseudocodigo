ALGORITMO TEXTO_PALINDROMO:
    DECLARE FRASE, LIMPA, INVERSA, LETRA : CARACTERES;
    DECLARE I, VOGAIS : INTEIRO;
INICIO
    ESCREVA("Digite uma palavra:");
    LEIA(FRASE);

    LIMPA <- MINUSCULO(FRASE);
    INVERSA <- "";
    VOGAIS <- 0;
    PARA I DE 1 ATE TAM_TEXTO(LIMPA) FACA
        LETRA <- SUBTEXTO(LIMPA, I, 1);
        INVERSA <- LETRA + INVERSA;
        SE(LOCALIZAR(LETRA, "aeiou") > 0) ENTAO
            VOGAIS++;
        FIMSE
    FIMPARA

    ESCREVA("Tamanho:", TAM_TEXTO(FRASE));
    ESCREVA("Invertida:", INVERSA);
    ESCREVA("Vogais:", VOGAIS);
    SE(LIMPA = INVERSA) ENTAO
        ESCREVA("É um palíndromo!");
    SENAO
        ESCREVA("Não é um palíndromo.");
    FIMSE
FIMALGORITMO
