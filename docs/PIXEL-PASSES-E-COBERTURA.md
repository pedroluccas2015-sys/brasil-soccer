# Atletas, passes e organização das equipes

Os modelos foram redesenhados em Canvas seguindo as proporções das referências enviadas: cabeça grande, cabelo destacado, contornos escuros, corpo compacto e chuteiras largas. Uniformes e tons de pele continuam ligados aos clubes e atletas. O mesmo renderizador atende campo, goleiros, faltas, escanteios, pênaltis e cutscenes; juiz e bandeirinhas usam o mesmo desenho, incluindo gestos de relógio, apito, indicação e bandeira.

Cabeceio, voleio e bicicleta têm poses articuladas próprias, preparação e recuperação. Chute/ação contextual perto de uma bola aérea prepara o gesto e aguarda o contato; de costas, a ação contextual permite bicicleta. O replay e a apresentação do gol preservam o tipo de finalização. Carrinhos, grama, corrida, domínio, defesa, lateral e cobranças existentes continuam disponíveis.

Toda saída de bola, inclusive após gols e nos dois tempos, é um passe curto para trás: direcional, chute e cruzamento não permitem iniciar para frente. A CPU segue a mesma regra.

Passes curtos com companheiro selecionado acompanham o alvo até o domínio. O recebedor espera quando não há comando manual e pode ser movimentado normalmente. A assistência termina no desvio, interceptação ou invalidação do alvo. A colisão considera o trecho percorrido entre quadros; carrinhos na linha de passe cortam a bola sem atravessar o defensor. Cruzamentos continuam a usar trajetória aérea.

Desarmes em pé têm alcance maior e recuperam a posse sem sorteio de falta. Carrinhos fora de tempo continuam sujeitos a faltas e pênaltis. Amarelos ficam reservados a desafios mais graves e reincidência; a IA espaça as tentativas arriscadas.

Em bolas paradas, a equipe cobradora mantém cinco jogadores de linha em cobertura no próprio campo, além do goleiro. A equipe adversária conserva quatro jogadores de linha no seu campo de ataque para o contra-ataque. Isso reduz o grupo na área para três finalizadores e uma saída curta. A organização permanece durante a cobrança e o início do voo, liberando-se na primeira disputa ou ao terminar o lance. Com expulsões, a presença na área é reduzida antes da cobertura.

Validação: 202 testes automatizados aprovados, incluindo partidas completas e 19 cenários novos. Galeria e cenários interativos: `tests/pixel-gameplay.html`.
