# Cobranças de falta — direção, força e efeito

## Quando aparece

Somente reposições do tipo FALTA em todo o campo de ataque do time. Em coordenadas do campo ampliado de 1260 × 816:

- Ataque para a direita: x ≥ 630.
- Ataque para a esquerda: x ≤ 630.
- A linha central é incluída. A regra acompanha o time e a troca de lado no intervalo.
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

Os módulos js/free-kick.js e js/free-kick-renderer.js concentram a nova simulação e sua apresentação. A curvatura usa o giro da bola e um ajuste de queda exclusivo da cobrança especial até o primeiro toque ou quique. O campo normal usa uma definição central de dimensões para posições, limites, impedimentos, gols, IA e radar. A velocidade dos jogadores e os controles foram preservados. Os pênaltis mantêm a geometria própria e a física anterior.

## Verificação

- 55 testes automatizados passaram, incluindo 16 cenários de falta.
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

## Campo ampliado e simetria

Comprimento e largura aumentaram 20% (área 44% maior). A câmera normal ficou mais aberta, e os sprites acompanham o zoom. Formações, alteração tática, laterais, gols e goleiros usam as novas dimensões. As cobranças longas ajustam velocidade, arco e duração do voo conforme a distância, igualmente para usuário e máquina. O teste de paridade compara as velocidades e o giro de chutes com os mesmos parâmetros, e faltas reais são verificadas para os dois times nos dois tempos, nos campos de ataque e defesa.

Uma comparação adicional de 16 disputas de pênaltis com a base original confirmou amostras de quadros e resultados idênticos.
