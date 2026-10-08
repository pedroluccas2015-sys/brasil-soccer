# Pênaltis — referência Soccer Shootout

O mesmo motor (`js/penalty.js`) e a mesma câmera atrás do gol (`js/penalty-renderer.js`) são usados no modo Pênaltis, nas decisões da Copa e nas faltas dentro da área. Durante a cobrança, o relógio da partida fica parado. Nas cobranças durante a partida, uma **espalmada** ou bola na **trave** produz rebote com a bola viva e jogadores disputando o lance; uma **defesa segura** dá posse ao goleiro. Gol gera saída de bola e chute para fora resulta em tiro de meta. Apenas no modo disputa por pênaltis cada cobrança se encerra automaticamente, sem rebotes.

## Comandos

Segure a direção desejada e aperte o botão; não existe barra de força. Cima mira alto, baixo mira rasteiro, esquerda/direita escolhem o canto. As diagonais combinam altura e canto. Sem direção, o chute sai pelo centro.

| Ação | Teclado clássico | Gamepad padrão (posição física) | SNES de referência |
|---|---|---|---|
| Chute fraco | Z | Esquerdo (X / □) | Y |
| Chute médio | X | Inferior (A / ×) | B |
| Chute forte | C | Direito (B / ○) | A |
| Finta de ombro | D + direção | Superior (Y / △) + direção | X + direção |
| Defesa | X ou C + direção | Inferior ou direito + direção | A ou B + direção |

Na defesa, cima salta e baixo abaixa. Apertar cedo demais, escolher a altura errada ou cair no canto oposto pode deixar o gol aberto. Depois de iniciado, o salto não muda de direção. O teclado respeita as teclas redefinidas nas opções. O mapeamento normal de jogo do gamepad permanece igual fora dos pênaltis.

Na preparação da disputa, escolha o goleiro e nove cobradores. Selecionar alguém já escolhido troca sua posição na ordem. São cinco cobranças iniciais por time; empate continua em morte súbita, decidida somente após igual número de cobranças. A disputa pode acabar antes das cinco quando a vantagem é inalcançável. Os gols da disputa ficam separados do placar da partida.

## Referência e limites de fidelidade

Foram consultadas as páginas 11, 21 e 28 do [manual original de Capcom’s Soccer Shootout](https://www.videogamemanual.com/snes/Capcom%27s%20Soccer%20Shootout%20%28USA%29.pdf). Elas documentam a câmera do PK, três forças por botão, a finta, os comandos do goleiro e a seleção de cobradores. Diferentemente do original, que usa outro sistema nas faltas durante a partida, aqui todos os pênaltis usam o sistema PK, conforme solicitado.

A ROM local foi identificada pelo cabeçalho `CAPCOM'S SOCCER SHOOT`, tamanho 1.572.864 bytes e SHA-256 `fd5761f9dd1f2b87ad11df6085046d0dfcdc3a79139263e47b0cff707966ba51`. Ela não é carregada pelo jogo nem distribuída com ele. Nenhum código, sprite ou áudio foi extraído. Esta é uma reimplementação em JavaScript com arte original, não uma emulação: velocidades, janelas de defesa, colisões, precisão e decisões da CPU foram calibradas neste projeto e não comparadas quadro a quadro com a ROM. Não foi recriado o torneio separado de PK contra todas as seleções; os clubes e as competições continuam sendo os do jogo brasileiro.

## Validação

- `npm test`: cobranças por botão, finta, salto, canto/altura/momento de defesa, falta na área em ambos os tempos e lados, placares separados, término antecipado, morte súbita e simulações em 30/60/120 Hz.
- `npm run test:browser`: seleção dos cobradores, controles reais de teclado, pausa durante cobrança, defesa, retorno ao segundo tempo e Gamepad API simulada. Controle físico não foi testado.


## Bola e animações
A bola usa um modelo procedural original em pixel art, com 32 quadros de rotação calculados pela distância percorrida, sombra por altura, rastro curto e deformação nos impactos. A trajetória das cobranças usa velocidade e gravidade do motor físico. O resultado continua animando espalmadas, bolas seguras, rebotes na trave e amortecimento com ondulação da rede; o gol da partida normal também mantém a bola física durante a comemoração. Não foram extraídos gráficos da ROM.

## Rebotes em pênaltis durante partidas

- Defesa espalmada: o goleiro desvia a bola de acordo com a física existente e a jogada continua no campo, com atacantes e defensores próximos para disputar o rebote. Se o desvio sair pela linha de fundo, o último toque do goleiro permite escanteio.
- Defesa segura: o goleiro recebe a posse e pode repor a bola normalmente.
- Bola na trave: o ricochete continua em jogo.
- Bola realmente para fora: tiro de meta. Gol: saída de bola.
- O relógio volta a correr quando a bola permanece em jogo. O lado do campo, o placar e as estatísticas não são reiniciados. Cobranças decisivas (disputa por pênaltis) não têm rebote.
