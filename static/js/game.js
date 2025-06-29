// --- Variáveis Globais ---
const gameCanvas = document.getElementById('gameCanvas');
const ctx = gameCanvas.getContext('2d');
const gameStatusDiv = document.getElementById('game-status');

// Referências para os painéis de rank
const matchRankPanel = document.getElementById('match-rank-panel');
const matchRankListDiv = document.getElementById('match-rank-list');
const globalRankPanel = document.getElementById('global-rank-panel');
const globalRankListDiv = document.getElementById('global-rank-list'); // Este será o alvo do Rank Geral

const resizeRankButton = document.getElementById('resize-rank-button');

// Elementos do painel de administração
const adminButton = document.getElementById('admin-button');
const adminPanel = document.getElementById('admin-panel');
const closeAdminPanelButton = document.getElementById('close-admin-panel');
const newPlayerNamesInput = document.getElementById('new-player-names');
const addNamesButton = document.getElementById('add-names-button');
const playerNamesList = document.getElementById('player-names-list');
const resetGameButton = document.getElementById('reset-game-button');
const resetGlobalRankButton = document.getElementById('reset-global-rank-button');
const startGlobalRankGameButton = document.getElementById('start-global-rank-game-button');

// Elementos do modal de login
const adminLoginModal = document.getElementById('admin-login-modal');
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const loginAdminButton = document.getElementById('login-admin-button');
const loginErrorMessage = document.getElementById('login-error-message');

// Elementos do join game
const joinGameContainer = document.getElementById('join-game-container');
const playerNickInput = document.getElementById('player-nick-input');
const joinButton = document.getElementById('join-button');
const joinMessageDiv = document.getElementById('join-message');


let players = [];
let orbs = [];
let gameActive = false;
let gameInterval;
let orbSpawnInterval = 1000; // Tempo em ms para novas orbs
let orbSpawnTimer;
let humanPlayerNick = ''; // Armazenar o nick do jogador humano

// Constantes do jogo
const PLAYER_RADIUS = 20;
const ORB_RADIUS = 10;
const INITIAL_PLAYER_SPEED = 2;
const MAX_ORBS = 50;
const GAME_AREA_PADDING = 50; // Para manter jogadores e orbs dentro de uma margem

// --- Funções de Utilidade ---
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomPosition(radius) {
    const x = Math.random() * (gameCanvas.width - 2 * radius - 2 * GAME_AREA_PADDING) + radius + GAME_AREA_PADDING;
    const y = Math.random() * (gameCanvas.height - 2 * radius - 2 * GAME_AREA_PADDING) + radius + GAME_AREA_PADDING;
    return { x, y };
}

function displayJoinMessage(message, color) {
    if (joinMessageDiv) {
        joinMessageDiv.textContent = message;
        joinMessageDiv.style.color = color;
    }
}

// --- Funções de Jogo ---
function resizeCanvas() {
    gameCanvas.width = window.innerWidth * 0.7; // 70% da largura da tela
    gameCanvas.height = window.innerHeight * 0.7; // 70% da altura da tela
    draw(); // Redesenha o jogo após redimensionar
}

function initializeGame(playerNames) {
    players = [];
    orbs = [];
    gameActive = true;
    gameStatusDiv.textContent = 'Jogo em Andamento...';
    gameStatusDiv.style.display = 'block';

    // Cria jogadores
    playerNames.forEach(name => {
        const isHuman = name === humanPlayerNick;
        players.push({
            name: name,
            x: getRandomPosition(PLAYER_RADIUS).x,
            y: getRandomPosition(PLAYER_RADIUS).y,
            radius: PLAYER_RADIUS,
            color: isHuman ? '#00ffff' : getRandomColor(), // Cor azul neon para o humano
            score: 0,
            speed: INITIAL_PLAYER_SPEED,
            collidedWithCentralSphere: false, // Flag para indicar colisão com esfera central
            isHuman: isHuman, // Indica se é o jogador humano
            targetOrb: null // Orb que o bot está perseguindo
        });
    });

    // Certifica-se de que o painel de join game esteja oculto
    joinGameContainer.style.display = 'none';

    // Inicia o loop do jogo
    gameInterval = setInterval(gameLoop, 1000 / 60); // 60 FPS
    orbSpawnTimer = setInterval(spawnOrb, orbSpawnInterval); // Gera orbs periodicamente
}

function spawnOrb() {
    if (orbs.length < MAX_ORBS) {
        orbs.push({
            x: getRandomPosition(ORB_RADIUS).x,
            y: getRandomPosition(ORB_RADIUS).y,
            radius: ORB_RADIUS,
            color: getRandomColor(),
            value: 1 // Cada orb vale 1 ponto
        });
    }
}

function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Desenha orbs
    orbs.forEach(orb => {
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
        ctx.fillStyle = orb.color;
        ctx.fill();
        ctx.closePath();
    });

    // Desenha jogadores
    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#333';
        ctx.stroke();
        ctx.closePath();

        // Desenha nome do jogador e pontuação
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${player.name} (${player.score})`, player.x, player.y - player.radius - 5);
    });

    updateMatchRank(); // Atualiza o rank da partida em cada frame
    requestAnimationFrame(draw); // Continua o loop de desenho
}


function gameLoop() {
    if (!gameActive) return;

    players.forEach(p1 => {
        if (p1.collidedWithCentralSphere) return; // Jogadores que colidiram param de se mover

        // Lógica de movimento para bots
        if (!p1.isHuman) {
            // Se o bot não tem um orb alvo ou o alvo foi coletado, encontra um novo
            if (!p1.targetOrb || !orbs.includes(p1.targetOrb)) {
                if (orbs.length > 0) {
                    // Bot persegue o orb mais próximo
                    p1.targetOrb = orbs.reduce((closest, orb) => {
                        const dist = Math.hypot(p1.x - orb.x, p1.y - orb.y);
                        const closestDist = Math.hypot(p1.x - closest.x, p1.y - closest.y);
                        return dist < closestDist ? orb : closest;
                    }, orbs[0]);
                } else {
                    p1.targetOrb = null; // Nenhum orb para perseguir
                }
            }

            // Move em direção ao orb alvo
            if (p1.targetOrb) {
                const angle = Math.atan2(p1.targetOrb.y - p1.y, p1.targetOrb.x - p1.x);
                p1.x += Math.cos(angle) * p1.speed;
                p1.y += Math.sin(angle) * p1.speed;
            }
        }

        // --- Colisão com Orbs ---
        for (let i = orbs.length - 1; i >= 0; i--) {
            const orb = orbs[i];
            const distance = Math.hypot(p1.x - orb.x, p1.y - orb.y);

            if (distance < p1.radius + orb.radius) {
                p1.score += orb.value;
                p1.radius += orb.value * 0.5; // Cresce ao coletar
                orbs.splice(i, 1); // Remove orb coletada
            }
        }

        // --- Colisão com Outros Jogadores ---
        players.forEach(p2 => {
            if (p1 === p2 || p2.collidedWithCentralSphere) return; // Não compara consigo mesmo ou com jogadores que colidiram

            const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

            if (distance < p1.radius + p2.radius) {
                // Colisão
                if (p1.radius > p2.radius) {
                    p1.score += p2.score;
                    p1.radius += p2.radius * 0.5;
                    p2.collidedWithCentralSphere = true; // Marca p2 como "fora do jogo"
                    p2.x = -1000; // Move para fora da tela
                    p2.y = -1000;
                    // p2.color = '#555'; // Opcional: mudar cor de jogadores eliminados
                } else if (p2.radius > p1.radius) {
                    p2.score += p1.score;
                    p2.radius += p1.radius * 0.5;
                    p1.collidedWithCentralSphere = true; // Marca p1 como "fora do jogo"
                    p1.x = -1000; // Move para fora da tela
                    p1.y = -1000;
                    // p1.color = '#555'; // Opcional: mudar cor de jogadores eliminados
                }
                // Se tamanhos iguais, eles simplesmente "ricocheteiam" ou nada acontece (evita loop infinito de eliminação)
            }
        });

        // --- Colisão com Esfera Central (Win Condition) ---
        // Posição da esfera central (metade da tela)
        const centralSphereX = gameCanvas.width / 2;
        const centralSphereY = gameCanvas.height / 2;
        const centralSphereRadius = 50; // Tamanho da esfera central

        const distanceToCenter = Math.hypot(p1.x - centralSphereX, p1.y - centralSphereY);
        if (distanceToCenter < p1.radius + centralSphereRadius) {
            if (!p1.collidedWithCentralSphere) {
                p1.collidedWithCentralSphere = true;
                // p1.color = '#ccc'; // Mudar cor para indicar que colidiu e parou
                // p1.speed = 0; // Para de se mover
            }
        }

        // Mantém jogador dentro dos limites do canvas
        p1.x = Math.max(PLAYER_RADIUS + GAME_AREA_PADDING, Math.min(p1.x, gameCanvas.width - PLAYER_RADIUS - GAME_AREA_PADDING));
        p1.y = Math.max(PLAYER_RADIUS + GAME_AREA_PADDING, Math.min(p1.y, gameCanvas.height - PLAYER_RADIUS - GAME_AREA_PADDING));
    });

    checkWinCondition();
}

function checkWinCondition() {
    const activePlayers = players.filter(p => !p.collidedWithCentralSphere);
    if (activePlayers.length <= 1) { // Se sobrou apenas um jogador ou nenhum
        endGame();
    }
}

function endGame() {
    if (!gameActive) return;

    gameActive = false;
    clearInterval(gameInterval);
    clearInterval(orbSpawnTimer);
    gameStatusDiv.textContent = "Partida Finalizada!";
    gameStatusDiv.style.display = 'block';

    updateMatchRank();

    // --- NOVO: SALVA A PONTUAÇÃO DO JOGADOR HUMANO AQUI ---
    const humanPlayer = players.find(p => p.name === humanPlayerNick);
    if (humanPlayer && humanPlayer.score !== undefined) {
        savePlayerScore(humanPlayer.name, humanPlayer.score);
    }
    // --- FIM DA SEÇÃO NOVA ---

    // Opcionalmente, mostrar 'join game' novamente ou um botão 'jogar novamente'
    // joinGameContainer.style.display = 'flex'; // Isso mostraria o painel de join novamente
}


// --- Funções de Rank ---
function updateMatchRank() {
    if (!matchRankListDiv) return;

    // Filtra jogadores que ainda estão ativos (não colidiram com a esfera central)
    const activePlayersInMatch = players.filter(p => !p.collidedWithCentralSphere);

    // Ordena os jogadores ativos pela pontuação (do maior para o menor)
    activePlayersInMatch.sort((a, b) => b.score - a.score);

    matchRankListDiv.innerHTML = ''; // Limpa a lista anterior

    if (activePlayersInMatch.length === 0 && players.length > 0) {
        matchRankListDiv.innerHTML = '<li>Todos os jogadores colidiram ou foram eliminados.</li>';
        return;
    } else if (players.length === 0) {
        matchRankListDiv.innerHTML = '<li>Nenhum jogador na partida.</li>';
        return;
    }


    activePlayersInMatch.forEach((player, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${player.name}: ${player.score}`;
        matchRankListDiv.appendChild(li);
    });
}

// Função para buscar e exibir o Rank Global do Backend
async function updateGlobalRank() {
    if (!globalRankListDiv) return;

    try {
        const response = await fetch('/api/get_scores');
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const scores = await response.json();

        globalRankListDiv.innerHTML = ''; // Limpa a lista anterior

        if (scores.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'Nenhuma pontuação registrada no Rank GERAL ainda.';
            globalRankListDiv.appendChild(li);
            return;
        }

        // O backend já deve retornar as pontuações ordenadas
        scores.forEach((player, index) => {
            const li = document.createElement('li');
            li.textContent = `${index + 1}. ${player.playerName}: ${player.score}`;
            globalRankListDiv.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao buscar o Rank GERAL:', error);
        globalRankListDiv.innerHTML = '<li>Erro ao carregar o Rank GERAL.</li>';
    }
}

// --- NOVO: Função para SALVAR a Pontuação do Jogador no Backend ---
// Adicione esta função em algum lugar no seu game.js, preferencialmente perto de outras funções assíncronas.
async function savePlayerScore(playerName, score) {
    try {
        const response = await fetch('/api/save_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ playerName: playerName, score: score }),
        });

        const data = await response.json();
        if (response.ok) {
            console.log('Pontuação salva com sucesso:', data.message);
            updateGlobalRank(); // Garante que o ranking seja atualizado na tela
        } else {
            console.error('Erro ao salvar pontuação:', data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao salvar pontuação:', error);
    }
}


// --- Lógica do Painel de Administração ---
function openAdminPanel() {
    adminPanel.style.display = 'flex';
    // Opcional: carregar nomes de jogadores existentes para edição
}

function closeAdminPanel() {
    adminPanel.style.display = 'none';
}

function displayPlayerNames() {
    playerNamesList.innerHTML = '';
    // Mostra apenas os nomes dos jogadores que serão usados na próxima partida (incluindo bots e o humano)
    players.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.name;
        playerNamesList.appendChild(li);
    });
}

// Função para iniciar um jogo com todos os nomes no Rank Global
async function startGlobalRankGame() {
    try {
        const response = await fetch('/api/get_scores');
        if (!response.ok) {
            throw new Error(`Erro HTTP! status: ${response.status}`);
        }
        const scores = await response.json();
        let globalPlayerNames = scores.map(player => player.playerName);

        // Garante que o nick do jogador humano esteja incluído se ele digitou um nick e não foi para o rank global ainda.
        if (humanPlayerNick && !globalPlayerNames.includes(humanPlayerNick)) {
            globalPlayerNames.push(humanPlayerNick);
        }

        // Fecha o painel de administração antes de iniciar o jogo
        closeAdminPanel();
        initializeGame(globalPlayerNames);
    } catch (error) {
        console.error('Erro ao iniciar jogo com rank global:', error);
        alert('Erro ao carregar jogadores para o jogo. Verifique o console.');
    }
}


// Função para resetar o rank global (chamada pelo admin)
async function resetGlobalRank() {
    if (!confirm('Tem certeza que deseja resetar o Rank GERAL? Esta ação é irreversível!')) {
        return;
    }
    try {
        const response = await fetch('/api/reset_global_rank', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        const data = await response.json();
        if (response.ok) {
            alert(data.message);
            updateGlobalRank(); // Atualiza o rank na tela após o reset
        } else {
            alert('Erro ao resetar ranking: ' + data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao resetar ranking:', error);
        alert('Erro de conexão ao resetar ranking.');
    }
}

// --- Função Central para o Jogador Participar (via Nick) ---
function handlePlayerJoin() {
    const nick = playerNickInput.value.trim();
    if (nick.length < 2) {
        displayJoinMessage("Por favor, digite um Nick válido (mínimo 2 caracteres).", 'red');
        return;
    }

    if (gameActive) {
        displayJoinMessage("O jogo já está ativo. Aguarde o término da partida atual.", 'orange');
        return;
    }

    humanPlayerNick = nick; // Salva o nick do jogador humano
    displayJoinMessage(`Bem-vindo, ${nick}! Preparando sua partida...`, 'lightgreen');

    // Prepara a lista de jogadores incluindo o nick do humano e adicionando bots se necessário
    let initialPlayerNamesForGame = [humanPlayerNick];
    // Adiciona bots se o jogo for configurado para isso
    // Por exemplo, você pode adicionar 3 bots:
    // for (let i = 1; i <= 3; i++) {
    //     initialPlayerNamesForGame.push(`Bot${i}`);
    // }
    initializeGame(initialPlayerNamesForGame);
}

// --- Inicialização ao Carregar a Página ---
window.onload = () => {
    resizeCanvas();
    updateGlobalRank(); // Carrega o rank global assim que a página é carregada
    joinGameContainer.style.display = 'flex'; // Garante que a tela de join game esteja visível no início
    gameStatusDiv.style.display = 'none'; // Oculta o status do jogo no início

    // Event Listeners
    window.addEventListener('resize', resizeCanvas);

    // Event listeners para o painel de administração
    adminButton.addEventListener('click', openAdminPanel);
    closeAdminPanelButton.addEventListener('click', closeAdminPanel);
    // addNamesButton.addEventListener('click', addPlayerNames); // Se você tiver uma funcionalidade para adicionar nomes avulsos
    resetGameButton.addEventListener('click', () => {
        // Reinicia o jogo para a tela de nick
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(orbSpawnTimer);
        players = [];
        orbs = [];
        gameStatusDiv.style.display = 'none';
        joinGameContainer.style.display = 'flex';
        displayJoinMessage('Digite seu Nick para começar!', 'white');
        updateMatchRank(); // Limpa o rank da partida
    });
    resetGlobalRankButton.addEventListener('click', resetGlobalRank);
    startGlobalRankGameButton.addEventListener('click', startGlobalRankGame);

    // Event listener para o modal de login do admin
    loginAdminButton.addEventListener('click', async () => {
        const username = adminUsernameInput.value;
        const password = adminPasswordInput.value;

        // Autenticação básica (apenas para exemplo, em produção use algo mais seguro)
        if (username === 'admin' && password === 'admin') {
            adminLoginModal.style.display = 'none'; // Oculta o modal de login
            openAdminPanel(); // Abre o painel de administração
            loginErrorMessage.style.display = 'none'; // Oculta mensagem de erro
        } else {
            loginErrorMessage.style.display = 'block'; // Mostra mensagem de erro
        }
    });


    // Event listener para o botão de join
    joinButton.addEventListener('click', handlePlayerJoin);
    playerNickInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handlePlayerJoin();
        }
    });

    // Event listener para o botão "Ampliar Ranks" (se você quiser uma função toggle para painéis)
    if (resizeRankButton) {
        resizeRankButton.addEventListener('click', () => {
            if (globalRankPanel.style.display === 'flex') {
                globalRankPanel.style.display = 'none';
                matchRankPanel.style.display = 'none';
                resizeRankButton.textContent = 'Mostrar Ranks';
            } else {
                globalRankPanel.style.display = 'flex';
                matchRankPanel.style.display = 'flex';
                resizeRankButton.textContent = 'Ocultar Ranks';
            }
        });
    }

    // Adiciona um listener para atualizar o rank quando a janela/aba é focada
    window.addEventListener('focus', updateGlobalRank);
};

// Funções de movimento para o jogador humano (teclado)
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function moveHumanPlayer() {
    const humanPlayer = players.find(p => p.isHuman);
    if (!humanPlayer || humanPlayer.collidedWithCentralSphere) return;

    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        humanPlayer.y -= humanPlayer.speed;
    }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        humanPlayer.y += humanPlayer.speed;
    }
    if (keys['a'] || keys['A'] || keys['ArrowLeft']) {
        humanPlayer.x -= humanPlayer.speed;
    }
    if (keys['d'] || keys['D'] || keys['ArrowRight']) {
        humanPlayer.x += humanPlayer.speed;
    }
}

// Integração do movimento do jogador humano no gameLoop
// Certifique-se de chamar moveHumanPlayer() dentro do gameLoop, antes das checagens de colisão
// O gameLoop já itera sobre os jogadores, então você pode adicionar a lógica de movimento do humano
// diretamente na iteração se preferir, ou chamar a função separadamente.
// No código atual, gameLoop não está chamando moveHumanPlayer(), então farei uma suposição de onde você gostaria que fosse.
// Se você tem um controle de toque ou outra forma, essa parte precisaria ser adaptada.
// Por simplicidade, vou adicionar a chamada a `moveHumanPlayer` dentro do gameLoop,
// ou garantir que a lógica de movimento do bot não se aplique ao jogador humano.

// Ajuste no gameLoop para o movimento do jogador humano (já estava implícito na iteração do player)
// Onde você tem: players.forEach(p1 => { ... if (!p1.isHuman) { ...bot logic... } })
// Você precisa garantir que o movimento WASD/setas é aplicado ao player humano,
// o que já deve estar acontecendo se a lógica do gameLoop for completa ou se moveHumanPlayer for chamada externamente.
// Dado o contexto, a função moveHumanPlayer() precisa ser chamada continuamente.
// A forma mais comum é adicionar `requestAnimationFrame(moveHumanPlayer);` ou
// chamar `moveHumanPlayer()` no `gameLoop`.

// Vou assumir que você tem um mecanismo para chamar `moveHumanPlayer` continuamente,
// como no `gameLoop` ou `draw` loop, ou que o usuário tem um mecanismo próprio de input.
// Para ser explícito, se você quiser que o jogador se mova via teclado,
// a chamada para `moveHumanPlayer()` deve ser feita no `gameLoop`.
// Exemplo:
// function gameLoop() {
//     if (!gameActive) return;
//     moveHumanPlayer(); // Chama a função de movimento do humano
//     players.forEach(p1 => {
//         // Restante da lógica de movimento e colisão para todos os jogadores
//     });
//     checkWinCondition();
// }
// Como o gameLoop já itera sobre os players, a lógica de movimento do bot é condicional para !p1.isHuman.
// O movimento do humano por WASD/setas é tratado por `moveHumanPlayer`, que deve ser chamada no loop principal.
// Onde você chama `gameInterval = setInterval(gameLoop, 1000 / 60);`
// A `moveHumanPlayer` deve ser chamada dentro de `gameLoop` ou por outro `setInterval`/`requestAnimationFrame`
// para que as teclas sejam processadas continuamente.
// Dado o seu código, a melhor forma é chamá-la no início do gameLoop:

function gameLoop() {
    if (!gameActive) return;

    moveHumanPlayer(); // Processa o input do teclado para o jogador humano

    players.forEach(p1 => {
        if (p1.collidedWithCentralSphere) return; // Jogadores que colidiram param de se mover

        // Lógica de movimento para bots (que não é aplicada ao humano)
        if (!p1.isHuman) {
            // Se o bot não tem um orb alvo ou o alvo foi coletado, encontra um novo
            if (!p1.targetOrb || !orbs.includes(p1.targetOrb)) {
                if (orbs.length > 0) {
                    // Bot persegue o orb mais próximo
                    p1.targetOrb = orbs.reduce((closest, orb) => {
                        const dist = Math.hypot(p1.x - orb.x, p1.y - orb.y);
                        const closestDist = Math.hypot(p1.x - closest.x, p1.y - closest.y);
                        return dist < closestDist ? orb : closest;
                    }, orbs[0]);
                } else {
                    p1.targetOrb = null; // Nenhum orb para perseguir
                }
            }

            // Move em direção ao orb alvo
            if (p1.targetOrb) {
                const angle = Math.atan2(p1.targetOrb.y - p1.y, p1.targetOrb.x - p1.x);
                p1.x += Math.cos(angle) * p1.speed;
                p1.y += Math.sin(angle) * p1.speed;
            }
        }

        // --- Colisão com Orbs ---
        for (let i = orbs.length - 1; i >= 0; i--) {
            const orb = orbs[i];
            const distance = Math.hypot(p1.x - orb.x, p1.y - orb.y);

            if (distance < p1.radius + orb.radius) {
                p1.score += orb.value;
                p1.radius += orb.value * 0.5; // Cresce ao coletar
                orbs.splice(i, 1); // Remove orb coletada
            }
        }

        // --- Colisão com Outros Jogadores ---
        players.forEach(p2 => {
            if (p1 === p2 || p2.collidedWithCentralSphere) return; // Não compara consigo mesmo ou com jogadores que colidiram

            const distance = Math.hypot(p1.x - p2.x, p1.y - p2.y);

            if (distance < p1.radius + p2.radius) {
                // Colisão
                if (p1.radius > p2.radius) {
                    p1.score += p2.score;
                    p1.radius += p2.radius * 0.5;
                    p2.collidedWithCentralSphere = true; // Marca p2 como "fora do jogo"
                    p2.x = -1000; // Move para fora da tela
                    p2.y = -1000;
                    // p2.color = '#555'; // Opcional: mudar cor de jogadores eliminados
                } else if (p2.radius > p1.radius) {
                    p2.score += p1.score;
                    p2.radius += p1.radius * 0.5;
                    p1.collidedWithCentralSphere = true; // Marca p1 como "fora do jogo"
                    p1.x = -1000; // Move para fora da tela
                    p1.y = -1000;
                    // p1.color = '#555'; // Opcional: mudar cor de jogadores eliminados
                }
                // Se tamanhos iguais, eles simplesmente "ricocheteiam" ou nada acontece (evita loop infinito de eliminação)
            }
        });

        // --- Colisão com Esfera Central (Win Condition) ---
        // Posição da esfera central (metade da tela)
        const centralSphereX = gameCanvas.width / 2;
        const centralSphereY = gameCanvas.height / 2;
        const centralSphereRadius = 50; // Tamanho da esfera central

        const distanceToCenter = Math.hypot(p1.x - centralSphereX, p1.y - centralSphereY);
        if (distanceToCenter < p1.radius + centralSphereRadius) {
            if (!p1.collidedWithCentralSphere) {
                p1.collidedWithCentralSphere = true;
                // p1.color = '#ccc'; // Mudar cor para indicar que colidiu e parou
                // p1.speed = 0; // Para de se mover
            }
        }

        // Mantém jogador dentro dos limites do canvas
        p1.x = Math.max(PLAYER_RADIUS + GAME_AREA_PADDING, Math.min(p1.x, gameCanvas.width - PLAYER_RADIUS - GAME_AREA_PADDING));
        p1.y = Math.max(PLAYER_RADIUS + GAME_AREA_PADDING, Math.min(p1.y, gameCanvas.height - PLAYER_RADIUS - GAME_AREA_PADDING));
    });

    checkWinCondition();
}