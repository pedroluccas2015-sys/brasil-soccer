# Cobranças de falta — direção, força e efeito

## Quando aparece

Somente reposições do tipo FALTA no último quarto do campo em direção ao gol adversário. Em coordenadas do campo de 1050 × 680:

- Ataque para a direita: x ≥ 787,5.
- Ataque para a esquerda: x ≤ 262,5.
- O limite é incluído. A regra acompanha o time e a troca de lado no intervalo.
- Pênaltis continuam usando o mecanismo anterior. Laterais, escanteios, impedimentos, tiros de meta e faltas fora dessa faixa não entram na nova cena.

## Como cobrar

1. Use o direcional para ajustar a mira: esquerda/direita escolhem o canto; cima/baixo ajustam a altura. Pressione o botão de chute para confirmar.
2. Observe o medidor e pressione chute para travar a força.
3. Observe o medidor de efeito e pressione chute para travar a curva e executar a cobrança.

Na etapa de mira, o botão de passe executa uma cobrança curta e retorna à partida normal. ESC pausa normalmente. Nenhuma tecla nem associação de gamepad foi alterada: CHUTE corresponde à ação já configurada pelo jogador, inclusive nos controles de toque e nos remapeamentos existentes.

A barreira bloqueia fisicamente a bola e salta. É possível tentar passar por cima dela ou contorná-la com efeito. A câmera fica atrás do cobrador durante a preparação e o começo do voo. O relógio fica parado durante a preparação e volta a correr no chute. A partida continua com goleiro, rebotes, disputa da bola, traves, gols e saídas de campo pelas regras existentes. Não há gol ou defesa predeterminados.

O adversário usa o mesmo mecanismo, com decisões automáticas e variação de precisão conforme a dificuldade existente. O painel se compacta em telas pequenas para não ficar atrás dos botões de toque.

## Referência e implementação

Inspirado na sequência de direção, força e efeito descrita na [página de Roby Baggio — Magical Kicks](https://www.joguix.com/jogo/roby-baggio-magical-kicks/). A página informa que o jogo Flash não está mais disponível. A implementação é original; não foram copiados código nem assets do Flash.

Os módulos js/free-kick.js e js/free-kick-renderer.js concentram a nova simulação e sua apresentação. A curvatura usa o giro da bola e um ajuste de queda exclusivo da cobrança especial até o primeiro toque ou quique. A física compartilhada, a movimentação dos jogadores, os controles e os módulos de pênaltis não foram editados nesta revisão.

## Verificação

- 49 testes automatizados passaram, incluindo 12 novos cenários de falta.
- Limites da região, dois times e dois tempos; outras reposições preservadas.
- Faltas reais resultando na cena especial e faltas dentro da área mantendo pênaltis.
- Mira, três confirmações, botão segurado, toque rápido, pausa e passe curto.
- Barreira com colisão varrida, arco natural passando sobre a barreira e bola caindo no gol.
- Efeito em ambos os sentidos, força, rebotes, gols, defesa e tiro de meta.
- CPU nos quatro níveis, nos dois sentidos e em 30/60/120 Hz.
- Suíte Edge: teclado, toque, interface mobile, pausa, partida normal e pênaltis; sem erros de console.
- Capturas de desktop e celular inspecionadas.

Execute npm test para os testes de lógica. Com npm start ativo, npm run test:browser executa a suíte visual (requer Playwright e navegador instalado).

Esta entrega atualiza o pacote local. Não publica alterações no GitHub.
