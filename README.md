# Brasil Super Soccer 2026

Build arcade jogável de futebol 2D para navegador, com arte e áudio originais. JavaScript ES6, Canvas 2D, Web Audio, Gamepad API e localStorage. Sem framework, backend, instalação ou conexão obrigatória.

## Jogar

Abra **index.html** no Edge, Chrome ou Firefox. O pacote já inclui os dados offline.

Ou, no diretório do projeto:

```sh
python -m http.server 8000
```

Abra **http://localhost:8000**. Alternativa com Node.js:

```sh
npm start
```

1. Partida rápida → escolha os clubes e a duração.
2. Escalação: selecione um titular e depois um reserva para trocar; escolha formação e táticas.
3. Entre em campo. Após o apito, pressione e solte Z para dar a saída.
4. Use ESC para estatísticas, substituições ou continuar no intervalo.

Você controla o clube da casa nas partidas rápidas e seu clube escolhido, em casa ou fora, nas competições. A direção de ataque inverte no intervalo. O triângulo amarelo identifica o jogador controlado e o radar mostra os demais. O som começa desligado; use **SOM OFF** no topo para ativar depois de uma interação.

## Controles

| Ação | Clássico (padrão) | WASD | Gamepad padrão |
|---|---|---|---|
| Movimento / mira | Setas | WASD | Analógico esquerdo / D-pad |
| Passe / carrinho | Z | J | A / × |
| Chute / bote | X | K | X / □ |
| Lançamento / cruzamento | C | L | B / ○ |
| Corrida | A | Shift esquerdo | RB / R1 |
| Troca de jogador | S | Q | LB / L1 |
| Corte / cabeçada / voleio contextual | D | E | Y / △ |
| Pause | ESC | ESC | Start / Options |
| Depuração | F2 | F2 | Teclado |

Segure e solte Z/X/C para carregar a potência. A direção orienta a seleção do receptor ou o canto da finalização. Chutes curtos são rasteiros, bolas altas podem ser cabeceadas ou voleadas, e o botão contextual faz um corte lateral. É possível preparar uma finalização de primeira logo antes de receber. Dois toques rápidos na mesma direção dão uma arrancada curta, com desgaste de energia.

Em pênaltis: esquerda/direita ajustam o canto, cima/baixo ajustam a altura e segurar/soltar chute define a força. Quando for o goleiro, esquerda/direita escolhem o mergulho. A câmera continua sendo lateral.

Em **Opções & controles**, escolha o esquema ou clique em uma tecla para redefini-la. Se já estiver usada, as duas atribuições são trocadas. A/S/D não podem ser simultaneamente movimento e ações; por isso existem os dois esquemas. Controles USB que implementam o mapeamento padrão são compatíveis; dispositivos com mapeamento não padrão podem variar. Não houve teste com hardware físico de gamepad, apenas com entradas simuladas da API.

## Funcionalidades

- 11 contra 11, goleiros, árbitro, bandeirinhas e torcida animada.
- Física da bola independente: velocidade, altura, gravidade, atrito, quique, spin, rebotes, postes e travessão.
- Domínio limitado por distância, velocidade da bola, controle e pressão; passes com seleção por direção, distância, marcação e obstrução da linha.
- Chutes com força, altura, dispersão e curva; cabeçada, voleio e finalização de primeira.
- IA por função e estado: formação, apoio, marcação, pressão, interceptação, recepção, condução, passe e chute; goleiro posiciona, sai, mergulha, encaixa, espalma e repõe.
- Sete formações: 4-4-2, 4-3-3, 4-2-3-1, 4-1-4-1, 3-5-2, 3-4-3 e 5-3-2. Mentalidade, pressão, linha e estilo de ataque ajustáveis.
- Laterais, escanteios, tiros de meta, faltas, vantagem simplificada, pênaltis, amarelos, expulsões e impedimento no instante do passe, com marcação no envolvimento do receptor.
- Intervalo, troca de lados, acréscimos e cinco substituições. Copa empatada tem prorrogação de dois tempos e disputa de pênaltis, incluindo alternadas.
- Brasileirão com 20 clubes, 38 rodadas, 380 jogos, classificação e desempates por pontos, vitórias, saldo e gols.
- Copa de oito clubes, partida rápida, pênaltis e treino livre sem cronômetro final.
- Estatísticas de posse, passes, acertos, chutes, chutes no gol, faltas, escanteios e impedimentos.
- Save de competição, resultados recentes, preferências, controles e elencos importados.
- Áudio sintetizado: passe, chute, defesa, apito, trave, gol, torcida e música original no menu.
- Canvas interno 480×270 (16:9), ampliado proporcionalmente para ocupar a janela durante a partida; imagem pixelada, perspectiva lateral, câmera suave com antecipação e radar. Loop fixo a 60 atualizações por segundo com renderização via requestAnimationFrame.

## Clubes e elencos

**20 clubes / 540 atletas reais cadastrados**: Athletico-PR, Atlético-MG, Bahia, Botafogo, Chapecoense, Corinthians, Coritiba, Cruzeiro, Flamengo, Fluminense, Grêmio, Internacional, Mirassol, Palmeiras, Red Bull Bragantino, Remo, Santos, São Paulo, Vasco da Gama e Vitória.

Consulta: **30/09/2026**. Participantes conferidos na CBF. Elencos consultados em páginas públicas do SofaScore e nos sites oficiais de Palmeiras, São Paulo e Flamengo. A relação detalhada de fontes e limitações está em [data/sources.md](data/sources.md); cada registro também carrega fonte e data.

Os elencos são recortes jogáveis dos grupos consultados, não listas completas de todos os inscritos. Campos não verificados ficam `null`, inclusive a maioria dos números, todas as datas de nascimento e quase todas as alturas e preferências de pé. A numeração auxiliar em campo identifica a posição de gameplay e não pretende ser o número oficial. Nenhum nome foi inventado para completar times.

Os ratings são estimativas internas por posição com variação determinística, não notas licenciadas nem avaliações oficiais. Os perfis não usam estatísticas individuais de desempenho. A escalação inicial é automática, não a escalação real do clube.

## Editar e importar

**Clubes e uniformes:** edite `data/teams.json`. Os três kits têm `shirtBaseColor`, `shirtSecondaryColor`, `shortsColor`, `socksColor` e `pattern` (`SOLID`, `STRIPES_VERTICAL`, `STRIPES_HORIZONTAL`, `HALVES`, `SASH`, `DETAILS`). Use cores hexadecimais `#RRGGBB`. Os kits são interpretações simples das cores dos clubes, sem texturas, marcas ou escudos oficiais.

**Jogadores:** edite `data/players.json`, preservando o vínculo `teamId`. O jogo usa os registros vinculados por esse campo; `teams[].players` mantém a lista de IDs para ferramentas externas. Cada elenco precisa de pelo menos 11 atletas e um goleiro. Posições aceitas: `GK`, `DF`, `MF`, `FW`. `attributes` é opcional para definir manualmente os 14 atributos de 1 a 99.

Por HTTP, os JSON são carregados diretamente. Para também atualizar a versão aberta por duplo clique:

```sh
node tools/build-data.js
```

**Importação no navegador:** preencha `data/import/roster-template.json` com 11–60 atletas, selecione **Opções → Importar elenco JSON**. Fica salvo nesse navegador e prevalece sobre o pacote. A importação valida nomes, duplicatas, posições, quantidade, número e presença de goleiro.

**Importação no pacote:**

```sh
node tools/import-roster.js caminho/novo-elenco.json
```

Essa ferramenta valida, atualiza os JSON e gera o bundle offline automaticamente. Ela não coleta dados da internet. `tools/seed-data.js` documenta a carga inicial e sobrescreve os dados: não o execute depois de personalizar o pacote.

## Save

Chaves locais usam o prefixo `bss26:`. A rodada é salva ao terminar uma partida; não existe retomada no meio do jogo. Há **um slot de competição** compartilhado por Copa e Brasileirão; iniciar outra temporada substitui o anterior. Configurações e elencos têm chaves separadas. Os últimos 30 resultados e suas estatísticas são mantidos localmente.

O armazenamento depende das permissões do navegador; navegação privada pode apagá-lo ao fechar. `file://`, `localhost` e `127.0.0.1` são origens diferentes e não compartilham saves. Use sempre o mesmo endereço para continuar a temporada.

## Arquitetura

```text
index.html                 entrada estática, sem módulos ou CDN
css/style.css              menus, escalação e layout responsivo
js/
  engine.js                utilitários, armazenamento e timestep fixo
  game.js / main.js        aplicação e inicialização
  match.js                 estados, relógio, ações, regras e pênaltis
  player.js / team.js       atletas, energia, táticas e substituições
  ball.js / physics.js      bola, colisões e linha de impedimento
  ai.js                    decisões de jogadores e goleiros
  input.js / audio.js       teclado, gamepad e síntese sonora
  renderer.js / camera.js   pixel art procedural, HUD, câmera e radar
  formations.js            sete disposições táticas
  competition.js           calendário, classificação, copa e save
  data-loader.js           dados, atributos e importação validada
  ui.js                    telas, banco, resultados e configurações
data/
  teams.json / players.json / competitions.json
  bundle.js                cópia offline gerada a partir dos JSON
  sources.md               fontes e limites de verificação
  import/                  modelo e registros da carga inicial
assets/                    arte original e pontos de extensão
tools/                     servidor estático, importação e bundle
tests/                     testes de lógica, navegador e capturas
```

## Testar

Node.js moderno:

```sh
npm test
```

Testes de navegador exigem Playwright disponível e Chromium/Edge. Com o servidor iniciado:

```sh
node tests/browser.cjs
```

`BSS_BROWSER` pode indicar o executável; `BSS_URL` pode indicar outro servidor. O script usa Playwright instalado no projeto ou o runtime local do Codex quando disponível. Essas ferramentas são necessárias apenas para testes, não para jogar. As capturas são gravadas em `tests/`.

F2 mostra FPS, coordenadas da bola, estados da IA, hitboxes, pontos de formação, linhas de passe e linha de impedimento. Para depurar pelo console: `BSS.app.debug = true`.

## Simplificações desta build

Esta é uma implementação arcade original, não uma reprodução fiel de um motor comercial. As animações usam pequenas imagens procedurais em cache, não arte elaborada desenhada à mão. Há dois ambientes do mesmo estádio genérico, sem geometria individual para cada clube. A câmera usa projeção oblíqua simples.

As reposições são organizadas automaticamente e têm limite de espera. Todos os tiros livres são diretos. Pênaltis marcados durante a partida encerram o lance sem disputa de rebote: após erro/defesa há tiro de meta. A vantagem usa uma janela curta baseada em posse; não há VAR, lesões, mão na bola, punição por recuo ao goleiro ou revisão completa das leis oficiais. Impedimento considera recepção, não todas as formas de interferência sem toque.

A IA usa heurísticas por zona. As outras partidas de campeonato e copa são simuladas, não executadas pelo motor completo. Não há suspensões acumuladas entre rodadas nem fadiga persistente entre partidas. Copa tem chave de oito clubes e sorteio simplificado. Série B pode ser adicionada nos dados, mas não tem modo próprio. Não há multiplayer, modo online ou botões touch para celular.

Os controles, as regras essenciais e os modos são funcionais. O nível de acabamento visual e a variedade de comportamentos ainda são menores que os de um jogo comercial de referência.

## Pênaltis no estilo Soccer Shootout
Câmera atrás do gol e comandos PK também nas faltas da partida. No teclado clássico: Z fraco, X médio, C forte; D + direção faz a finta. Defenda com direção + X ou C. Veja [controles, referência e limites de fidelidade](docs/penaltis.md).


## Controles mobile (touchscreen)

O jogo identifica telas com toque e mostra controles durante as partidas,
sem alterar a experiência de teclado/gamepad no desktop. O direcional
aceita diagonais e gesto de arrastar. A interface aceita vários dedos
pressionados simultaneamente (ex.: mover + correr + chutar).

- **A / PASSE**: passe curto ou carrinho; segure para carregar, solte para executar.
- **B / CHUTE**: chute ou bote; segure e solte para regular a força.
- **C / LANÇAR**: lançamento longo; segure e solte para regular a força.
- **R / CORRER**: mantenha pressionado para correr. Dois toques rápidos na direção acionam a arrancada.
- **L / TROCAR**: muda o jogador controlado.
- **Y / DRIBLE**: drible/ação contextual, finta ou defesa conforme a posse.
- **Ⅱ / PAUSA**: pausa a partida. Use os botões da interface para escalação, reinício ou saída.
- **DIRECIONAL**: arraste sobre a cruz para as oito direções.

Nas penalidades: direcional mira e escolhe a altura; A é fraco, B é médio,
C é forte, Y + direcional é finta, e B ou C + direcional aciona o goleiro.

O canvas preserva os 480×270 pixels originais (16:9), sem distorção.
Em retrato o controle aparece abaixo do campo; em paisagem, sem cobrir
o placar principal, os comandos ficam sobrepostos nas bordas do campo.
O HTML continua estático e pode ser aberto offline pelo `index.html`.

Para conferir a lógica: `npm test` executa também `tests/touch.test.js`.

## Faltas próximas ao gol

As faltas no último quarto do campo de ataque usam uma câmera atrás do cobrador, barreira e três etapas de direção, força e efeito. O botão de chute confirma cada etapa; o passe continua disponível para cobrança curta. Veja [como cobrar e o escopo da alteração](docs/faltas-magical-kicks.md).
