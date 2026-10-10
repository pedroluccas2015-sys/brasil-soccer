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
- Intervalo, troca de lados, acréscimos e cinco substituições. Mata-mata respeita agregado, vantagem da Série B e decisões por pênaltis. Prorrogação apenas nas finais continentais.
- Brasileirão com seletor de Séries A, B, C e D, classificação, acessos, rebaixamentos, quadrangulares e playoffs de 2026.
- Copa: Libertadores e Sul-Americana desde os grupos; Copa do Brasil desde a terceira fase (48 equipes, mais as 20 da Série A na quinta).
- COPA DE PÊNALTIS com as mesmas três competições. Partida rápida, disputa isolada de pênaltis e treino continuam disponíveis.
- Estatísticas de posse, passes, acertos, chutes, chutes no gol, faltas, escanteios e impedimentos.
- Save de competição, resultados recentes, preferências, controles e elencos importados.
- Áudio sintetizado: passe, chute, defesa, apito, trave, gol, torcida e música original no menu.
- Canvas interno 480×270 (16:9), ampliado proporcionalmente para ocupar a janela durante a partida; imagem pixelada, perspectiva lateral, câmera suave com antecipação e radar. Loop fixo a 60 atualizações por segundo com renderização via requestAnimationFrame.

## Clubes e elencos

**208 clubes / 5.931 atletas cadastrados**. Todos os clubes das Séries A–D, dos grupos da Libertadores e Sul-Americana, e da terceira fase da Copa do Brasil 2026 estão disponíveis.

Coleta de elencos e cores: **09/10/2026**; revisão do programa: **10/10/2026**. Cada clube possui links de fonte no seletor. As listas publicadas pelo Transfermarkt foram complementadas por ESPN e oGol quando insuficientes. ABECAT Ouvidorense, Castanhal EC, Clube Recreativo e Atlético Catalano (GO), EC São Luiz, Guarany de Bagé FC, Portuguesa usam listas da temporada sinalizadas na interface; seus vínculos atuais não foram integralmente confirmados. Não há garantia de todos os inscritos ou das transferências até hoje.

Os uniformes são representações arcade das cores pesquisadas, e não reproduções verificadas dos modelos oficiais de 2026. Ratings são estimativas do jogo; a escalação inicial é automática. Campos pessoais desconhecidos permanecem nulos. Consulte [fontes e limites](data/sources.md).

## Competições

- Série A: 38 rodadas e quatro descensos. Ao concluir, informe os resultados das copas e os quatro promovidos da Série B no painel para recalcular vagas continentais.
- Série B: 38 rodadas, dois acessos diretos e dois via playoffs (3º × 6º e 4º × 5º); quatro descensos.
- Série C: turno único, dois quadrangulares, quatro acessos, final em ida e volta e dois descensos.
- Série D: 16 grupos de seis, quatro classificados por grupo, mata-mata e seis acessos (quatro semifinalistas e dois vencedores dos playoffs).
- Libertadores: oito grupos de quatro, dois classificados; terceiros vão aos playoffs da Sul-Americana.
- Sul-Americana: líderes nas oitavas; segundos enfrentam terceiros da Libertadores. O torneio paralelo é simulado ao encerrar os grupos.
- Copa do Brasil: 48 clubes na terceira fase, terceira/quarta em jogo único; 20 entram na quinta. Ida e volta até as semifinais e final única.

As temporadas começam do zero, com participantes e grupos de 2026. Rodadas e sorteios posteriores são gerados pelo jogo. Os acessos e descensos são apresentados ao concluir; não há carreira automática em 2027.

Na Copa de Pênaltis, cada partida vira uma disputa: vitória vale três pontos nos grupos; o placar das cobranças conta para saldo e agregado. Agregado igual gera disputa extra. Essa pontuação é uma adaptação do jogo, pois as competições oficiais têm partidas de futebol.

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

Essa ferramenta valida, atualiza os JSON e gera o bundle offline automaticamente. Ela não coleta dados da internet. O seed legado de 20 clubes está desativado para preservar a base ampliada.

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

Testes de navegador exigem Playwright disponível e Chromium/Edge. Com o servidor iniciado na porta 8016 (ou configurado via BSS_URL):

```sh
node tests/browser-competitions.cjs
```

`BSS_BROWSER` pode indicar o executável; `BSS_URL` pode indicar outro servidor. O script usa Playwright instalado no projeto ou o runtime local do Codex quando disponível. Essas ferramentas são necessárias apenas para testes, não para jogar. As capturas são gravadas em `tests/`.

F2 mostra FPS, coordenadas da bola, estados da IA, hitboxes, pontos de formação, linhas de passe e linha de impedimento. Para depurar pelo console: `BSS.app.debug = true`.

## Simplificações desta build

Esta é uma implementação arcade original, não uma reprodução fiel de um motor comercial. As animações usam pequenas imagens procedurais em cache, não arte elaborada desenhada à mão. Há dois ambientes do mesmo estádio genérico, sem geometria individual para cada clube. A câmera usa projeção oblíqua simples.

As reposições são organizadas automaticamente e têm limite de espera. Todos os tiros livres são diretos. Pênaltis marcados durante a partida encerram o lance sem disputa de rebote: após erro/defesa há tiro de meta. A vantagem usa uma janela curta baseada em posse; não há VAR, lesões, mão na bola, punição por recuo ao goleiro ou revisão completa das leis oficiais. Impedimento considera recepção, não todas as formas de interferência sem toque.

A IA usa heurísticas por zona. As outras partidas de campeonato e copa são simuladas, não executadas pelo motor completo. Não há suspensões acumuladas entre rodadas nem fadiga persistente entre partidas. Não há multiplayer nem modo online. Os controles touch estão disponíveis.

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

## Faltas no campo de ataque

As faltas em todo o campo de ataque usam uma câmera atrás do cobrador, barreira e três etapas de direção, força e efeito. O botão de chute confirma cada etapa; o passe continua disponível para cobrança curta. Veja [como cobrar e o escopo da alteração](docs/faltas-magical-kicks.md).

O campo da partida normal foi ampliado de 1050 × 680 para 1260 × 816 unidades (20% em cada dimensão), com câmera mais aberta e posições de jogadores ajustadas. A regra da cobrança especial vale igualmente para usuário e CPU; no campo de defesa a reposição continua no formato anterior.
