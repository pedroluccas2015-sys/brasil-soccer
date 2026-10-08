# Escanteios com mira, força e efeito

Os escanteios nos quatro cantos utilizam o mesmo modo de cobrança das faltas, sem substituir o sistema existente de faltas diretas e pênaltis.

- **Mira:** direcional horizontal escolhe a zona de chegada; vertical ajusta a altura. A prévia indica o ponto estimado de recepção dentro da área.
- **Força:** velocidade do cruzamento e profundidade do ponto de chegada variam conforme o medidor.
- **Efeito:** a rotação atua sobre a física da bola. As três etapas funcionam no teclado, gamepad e botões touch.
- **Passe curto:** no momento da mira, PASSE entrega a bola a um jogador perto da bandeirinha. Esse jogador não é um dos cinco atacantes na área.
- **Área povoada:** até cinco atacantes e cinco defensores de linha (sem cartões vermelhos) disputam o cruzamento; goleiro separado. Outros jogadores protegem a segunda bola.
- **Disputa:** o cruzamento não conta como chute nem provoca gol automático. O primeiro toque pode gerar um cabeceio ou um corte; goleiro, colisões, rebotes, gol e bola para fora seguem as regras existentes.
- **Impedimento:** a cobrança direta de escanteio é isenta de impedimento; passes/chutes subsequentes seguem as regras normais.
- **CPU:** escolhe mira/força/efeito e segue a mesma sequência animada. Ao cobrar manualmente, o controle passa para um atacante no setor da bola.

Arquivos alterados: `js/free-kick.js`, `js/free-kick-renderer.js`, `js/match.js`, `js/ai.js`. Testes: `tests/corner-kick.test.js` e ajuste em `tests/free-kick.test.js`.
