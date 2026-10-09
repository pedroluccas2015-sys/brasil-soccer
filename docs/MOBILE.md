# Mobile — controles inspirados no FIFA 14 (2026)

Abra **index.html** no celular e ative **⛶ TELA CHEIA** no menu. Se possível, vire a tela para o modo paisagem. O jogo tenta a API de tela cheia e bloqueio de orientação quando o navegador permite; no iOS há fallback imersivo sem cortar os menus. A resolução lógica da partida permanece **480 × 270 (16:9)**, preservando a proporção da imagem. A opção **🎮 CONTROLES: ON/OFF** mantém sua preferência local e os controles ficam visíveis por padrão.

## Novo layout

- **Analógico inferior esquerdo:** arraste o polegar para qualquer uma das oito direções, mantendo o dedo apoiado; o centro acompanha visualmente o movimento.
- **CORRER:** botão verde grande no extremo inferior direito. Mantenha pressionado junto com o analógico. Dois toques rápidos numa direção também iniciam arrancada.
- **TROCAR:** botão grande imediatamente à esquerda de CORRER. Seleciona manualmente outro jogador de linha próximo da bola.
- **CHUTE e PASSE:** botões arredondados acima dos botões grandes. Segure para carregar a potência; solte para finalizar a ação.
- **LANÇAR:** logo à esquerda e acima dos demais, para passes longos. **Sem posse:** segure para chamar o segundo defensor à pressão (`2º DEF`).
- **DRIBLE:** mais acima, perto da lateral direita; sem a bola executa desarme.
- **PAUSA:** canto superior direito.

Quando o adversário está com a bola, os rótulos mudam automaticamente para **BOTE**, **CARRINHO**, **2º DEF** e **DESARME**, aproveitando os mesmos botões. Os toques funcionam juntos: é possível conduzir o analógico, correr e apertar chute sem tirar os outros dedos.

## Seleção automatizada

O jogador de linha mais próximo da bola é selecionado automaticamente sempre que houver vantagem clara na distância. Há um pequeno tempo de estabilidade para impedir o cursor de ficar pulando entre jogadores. Com posse do time humano, o dono da bola recebe o cursor imediatamente. A troca manual permanece ativa e tem prioridade por 0,9 s.

O goleiro **sempre se movimenta, reage e defende sob controle da IA**, mesmo quando segura a bola. O cursor não seleciona o goleiro numa jogada normal. As exceções são **tiro de meta** e **bola agarrada pelo goleiro**, permitindo uma reposição manual, com reposição automática após pouco tempo se o usuário não agir. Em cobranças de pênaltis a atuação do goleiro continua obedecendo às regras específicas desse modo.

## Cobranças de falta e pênaltis

Nas faltas especiais, CHUTE confirma as etapas da cobrança e PASSE permite a alternativa curta. Nos pênaltis, direcional + PASSE/CHUTE/LANÇAR regulam as forças; DRIBLE + direcional finta e CHUTE/LANÇAR + direcional comandam a defesa conforme o modo. A pausa e os controles são ocultados/mostrados em conformidade com os menus e cenas.

## Testes

Execute `npm test` para verificar controles, seleção, IA do goleiro, segundo defensor, faltas, rebotes e demais regras.
