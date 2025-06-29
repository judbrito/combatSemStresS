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
const playerNamesList = document.getElementById('player-names-list'); // This is where admin adds names
const resetGameButton = document.getElementById('reset-game-button');
const resetGlobalRankButton = document.getElementById('reset-global-rank-button');
const startGlobalRankGameButton = document.getElementById('start-global-rank-game-button');

// Elementos do modal de login
const adminLoginModal = document.getElementById('admin-login-modal');
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const loginAdminButton = document.getElementById('login-admin-button');
const loginErrorMessage = document.getElementById('login-error-message');

// Elementos do campo de "Participar" (agora centralizado)
const joinGameContainer = document.getElementById('join-game-container');
const playerNickInput = document.getElementById('player-nick-input');
const joinGameButton = document.getElementById('join-game-button');
const joinMessage = document.getElementById('join-message');

// --- Configurações do Jogo ---
const PLAYER_RADIUS = 10;
const PLAYER_BASE_SPEED = 7;
const PLAYER_BOOST_SPEED = 15;
const SPEED_BOOST_DURATION = 3000;

const MAX_POINT_ORBS = 300;
const MAX_SPEED_ORBS = 5;
const ORB_RADIUS = 7;
const GAME_UPDATE_INTERVAL = 16;
const STEAL_PERCENTAGE = 0.1;

const ORB_SPAWN_INTERVAL = 1000;
const SPEED_ORB_SPAWN_CHANCE = 0.1;

// Configurações da Esfera Central
const CENTRAL_SPHERE_RADIUS = 50;
const CENTRAL_SPHERE_COLOR = '#800080'; // Cor roxa

// --- Cores ---
const playerColors = [
    '#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff8800',
    '#0088ff', '#ff0088', '#88ff00', '#8800ff', '#00ff88',
    '#aa00ff', '#ffaa00', '#00aaff', '#aaff00', '#ff00aa',
    '#c0c0c0', '#f5f5dc', '#ffd700', '#8a2be2', '#7fffd4',
    '#ee82ee', '#f4a460', '#adff2f', '#4682b4', '#d2691e',
    '#8b0000', '#483d8b', '#20b2aa', '#7b68ee', '#b0e0e6',
    '#f0e68c', '#9acd32', '#9370db', '#8fbc8f', '#dda0dd',
    '#cd853f', '#6a5acd', '#bdb76b', '#a9a9a9', '#f0f8ff',
    '#faebd7', '#ffdead', '#7cfc00', '#afeeee', '#deb887',
    '#98fb98', '#ffb6c1', '#f08080', '#e0ffff', '#d8bfd8'
];
const positiveOrbColor = '#00ff00';
const negativeOrbColor = '#ff0000';
const speedOrbColor = '#8a2be2';

// --- Variáveis de Estado do Jogo ---
let players = [];
let pointOrbs = [];
let speedOrbs = [];
let gameActive = false;
let gameInterval;
let orbSpawnTimer;
let gameInitialized = false;
let wasGameActiveBeforeAdmin = false;
let currentPlayersNames = []; // This holds names for the current match
let humanPlayerNick = ""; // Guardará o nick do jogador humano, se houver um.

// Posição da esfera central
let centralSphere = { x: 0, y: 0, radius: CENTRAL_SPHERE_RADIUS, color: CENTRAL_SPHERE_COLOR };

// Nomes dos Bots (Animais)
const botNames = [
    "Leão", "Tigre", "Urso", "Lobo", "Águia", "Pantera", "Gorila", "Crocodilo", "Cobra", "Falcão",
    "Elefante", "Girafa", "Zebra", "Hipopótamo", "Rinoceronte", "Chita", "Hiena", "Búfalo", "Javali", "Macaco"
];
const MIN_PLAYERS_FOR_GAME = 5;

// globalRankCache É A FONTE DE DADOS PARA O RANK GLOBAL
let globalRankCache = []; // Cache para os dados do rank global

// --- Credenciais Admin ---
const ADMIN_USERNAME = 'admoceano';
const ADMIN_PASSWORD = '4107';

// --- Event Listeners ---
window.addEventListener('resize', resizeCanvas);

resizeRankButton.addEventListener('click', toggleRankPanelSize);

// Event Listeners para o Painel Admin
adminButton.addEventListener('click', showAdminLogin);
closeAdminPanelButton.addEventListener('click', closeAdminPanel);
addNamesButton.addEventListener('click', addPlayerNamesAdmin);
resetGameButton.addEventListener('click', resetGame);
resetGlobalRankButton.addEventListener('click', resetGlobalRank);
startGlobalRankGameButton.addEventListener('click', startGlobalRankGame);

// Event Listeners para o Modal de Login
loginAdminButton.addEventListener('click', checkAdminLogin);
adminUsernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') adminPasswordInput.focus();
});
adminPasswordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') checkAdminLogin();
});

// Event Listeners para o campo de "Participar" (principal para o jogador)
joinGameButton.addEventListener('click', handlePlayerJoin);
playerNickInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handlePlayerJoin();
});

// --- Funções de Inicialização e Reset ---
function initializeGame(playerNamesToUse) {
    gameInitialized = true;
    resizeCanvas();
    startGame(playerNamesToUse);
}

function resizeCanvas() {
    gameCanvas.width = window.innerWidth;
    gameCanvas.height = window.innerHeight;

    centralSphere.x = gameCanvas.width / 2;
    centralSphere.y = gameCanvas.height / 2;

    const titleElement = document.querySelector('h1');
    if (titleElement) {
        titleElement.style.top = '10px';
        titleElement.style.left = '50%';
        titleElement.style.transform = 'translateX(-50%)';
    }

    // Atualiza a posição do botão de redimensionar ranks com base na classe
    if (resizeRankButton.classList.contains('left-aligned')) {
        resizeRankButton.style.left = '220px';
        resizeRankButton.style.right = 'auto';
    } else {
        resizeRankButton.style.right = '220px';
        resizeRankButton.style.left = 'auto';
    }

    if (gameInitialized) {
        draw();
    }
}

// MODIFICAÇÃO: Modificado para carregar pontuações existentes do rank global
async function startGame(initialPlayerNames) {
    // Garante que o jogo está limpo antes de iniciar uma nova partida
    clearInterval(gameInterval);
    clearInterval(orbSpawnTimer);
    gameActive = false;
    players = [];
    pointOrbs = [];
    speedOrbs = [];
    gameStatusDiv.style.display = 'none';

    // Garante que o container de "Participar" esteja escondido
    joinGameContainer.style.display = 'none';

    currentPlayersNames = [...initialPlayerNames];

    if (currentPlayersNames.length === 0) {
        gameStatusDiv.textContent = "Erro: Nenhuma lista de jogadores para iniciar a partida.";
        gameStatusDiv.style.display = 'block';
        gameInitialized = false;
        return;
    }

    // Adiciona bots se o número de jogadores for menor que MIN_PLAYERS_FOR_GAME
    let botsNeeded = MIN_PLAYERS_FOR_GAME - currentPlayersNames.length;
    if (botsNeeded > 0) {
        const availableBotNames = [...botNames];
        for (let i = 0; i < botsNeeded; i++) {
            const potentialBots = availableBotNames.filter(name => !currentPlayersNames.includes(name));
            if (potentialBots.length === 0) break;
            const randomIndex = Math.floor(Math.random() * potentialBots.length);
            const botName = potentialBots[randomIndex];
            currentPlayersNames.push(botName);
            availableBotNames.splice(availableBotNames.indexOf(botName), 1);
        }
    }

    centralSphere.x = gameCanvas.width / 2;
    centralSphere.y = gameCanvas.height / 2;

    // NOVO: Busca as pontuações atuais do rank global para iniciar os jogadores com elas
    await updateGlobalRank(); // Garante que globalRankCache está atualizado

    // Cria os objetos Player a partir de currentPlayersNames
    currentPlayersNames.forEach((name, index) => {
        const color = playerColors[index % playerColors.length];
        // Tenta encontrar a pontuação do jogador no cache do rank global
        const playerInGlobalRank = globalRankCache.find(p => p.name === name);
        const initialScore = playerInGlobalRank ? playerInGlobalRank.score : 0; // Se não encontrar, começa com 0

        players.push({
            name: name,
            score: initialScore, // Use a pontuação do rank global ou 0
            x: Math.random() * (gameCanvas.width - PLAYER_RADIUS * 2) + PLAYER_RADIUS,
            y: Math.random() * (gameCanvas.height - PLAYER_RADIUS * 2) + PLAYER_RADIUS,
            dx: (Math.random() - 0.5) * PLAYER_BASE_SPEED * 2 || (Math.random() < 0.5 ? PLAYER_BASE_SPEED : -PLAYER_BASE_SPEED),
            dy: (Math.random() - 0.5) * PLAYER_BASE_SPEED * 2 || (Math.random() < 0.5 ? PLAYER_BASE_SPEED : -PLAYER_BASE_SPEED),
            color: color,
            domElement: null,
            currentSpeed: PLAYER_BASE_SPEED,
            speedBoostTimer: null,
            collidedWithCentralSphere: false
        });
    });

    // Cria os orbs iniciais
    for (let i = 0; i < MAX_POINT_ORBS; i++) {
        createRandomPointOrb(Math.random() < 0.5);
    }
    for (let i = 0; i < MAX_SPEED_ORBS; i++) {
        createRandomSpeedOrb();
    }

    updateMatchRank();
    updateGlobalRank(); // Atualiza o rank global no início do jogo (redundante com o await, mas não faz mal)
    gameActive = true;
    gameInterval = setInterval(gameLoop, GAME_UPDATE_INTERVAL);
    orbSpawnTimer = setInterval(spawnNewOrb, ORB_SPAWN_INTERVAL);
}

function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
}

function createRandomPointOrb(isPositive) {
    const MAX_ORB_VALUE = 5000;
    const MIN_ORB_VALUE = 1;

    let value;
    if (isPositive) {
        value = Math.floor(Math.random() * MAX_ORB_VALUE) + MIN_ORB_VALUE;
    } else {
        value = -(Math.floor(Math.random() * MAX_ORB_VALUE) + MIN_ORB_VALUE);
    }

    let orbX, orbY;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        orbX = Math.random() * (gameCanvas.width - ORB_RADIUS * 2) + ORB_RADIUS;
        orbY = Math.random() * (gameCanvas.height - ORB_RADIUS * 2) + ORB_RADIUS;
        attempts++;
    } while (getDistance(orbX, orbY, centralSphere.x, centralSphere.y) < (centralSphere.radius + ORB_RADIUS + 50) && attempts < maxAttempts);

    pointOrbs.push({
        x: orbX,
        y: orbY,
        value: value,
        color: isPositive ? positiveOrbColor : negativeOrbColor,
        active: true,
        dx: (Math.random() - 0.5) * 5,
        dy: (Math.random() - 0.5) * 5,
    });
}

function createRandomSpeedOrb() {
    let orbX, orbY;
    let attempts = 0;
    const maxAttempts = 100;

    do {
        orbX = Math.random() * (gameCanvas.width - ORB_RADIUS * 2) + ORB_RADIUS;
        orbY = Math.random() * (gameCanvas.height - ORB_RADIUS * 2) + ORB_RADIUS;
        attempts++;
    } while (getDistance(orbX, orbY, centralSphere.x, centralSphere.y) < (centralSphere.radius + ORB_RADIUS + 50) && attempts < maxAttempts);

    speedOrbs.push({
        x: orbX,
        y: orbY,
        color: speedOrbColor,
        active: true,
        dx: (Math.random() - 0.5) * 5,
        dy: (Math.random() - 0.5) * 5,
    });
}

// --- Funções de Rank ---
function updateMatchRank() {
    const activePlayers = players.filter(p => !p.collidedWithCentralSphere);
    const finishedPlayers = players.filter(p => p.collidedWithCentralSphere);

    const sortedActivePlayers = [...activePlayers].sort((a, b) => b.score - a.score);
    const sortedFinishedPlayers = [...finishedPlayers].sort((a, b) => b.score - a.score);

    matchRankListDiv.innerHTML = '';

    sortedActivePlayers.forEach((player, index) => {
        player.rankPosition = index + 1;

        const rankItem = document.createElement('div');
        rankItem.classList.add('rank-item');

        const rankPosition = document.createElement('span');
        rankPosition.classList.add('rank-position');
        rankPosition.textContent = `${index + 1}º`;
        rankItem.appendChild(rankPosition);

        const playerInfo = document.createElement('span');
        playerInfo.classList.add('player-info');
        playerInfo.textContent = player.name;
        playerInfo.style.color = player.color;
        rankItem.appendChild(playerInfo);

        const playerScore = document.createElement('span');
        playerScore.classList.add('player-score');
        playerScore.textContent = Math.round(player.score);
        rankItem.appendChild(playerScore);

        matchRankListDiv.appendChild(rankItem);
    });

    if (sortedFinishedPlayers.length > 0 && sortedActivePlayers.length > 0) {
        const divider = document.createElement('hr');
        divider.style.borderTop = '1px dashed #555';
        divider.style.margin = '10px 0';
        matchRankListDiv.appendChild(divider);

        const finishedHeader = document.createElement('div');
        finishedHeader.style.textAlign = 'center';
        finishedHeader.style.color = '#ccc';
        finishedHeader.style.fontSize = '0.9em';
        finishedHeader.textContent = 'FINALIZADOS';
        matchRankListDiv.appendChild(finishedHeader);
    }

    sortedFinishedPlayers.forEach((player) => {
        const rankItem = document.createElement('div');
        rankItem.classList.add('rank-item');
        rankItem.style.opacity = '0.7';
        rankItem.style.fontStyle = 'italic';

        const rankPosition = document.createElement('span');
        rankPosition.classList.add('rank-position');
        rankPosition.textContent = ' ';
        rankItem.appendChild(rankPosition);

        const playerInfo = document.createElement('span');
        playerInfo.classList.add('player-info');
        playerInfo.textContent = player.name + ' (STOP)';
        playerInfo.style.color = player.color;
        rankItem.appendChild(playerInfo);

        const playerScore = document.createElement('span');
        playerScore.classList.add('player-score');
        playerScore.textContent = Math.round(player.score);
        rankItem.appendChild(playerScore);

        matchRankListDiv.appendChild(rankItem);
    });
}

// --- NOVO: Função para OBTER e ATUALIZAR o Rank GERAL do Backend ---
async function updateGlobalRank() {
    globalRankListDiv.innerHTML = '<li>Carregando Rank Geral...</li>'; // Feedback de carregamento

    try {
        const response = await fetch('/api/get_scores');
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro HTTP! Status: ${response.status}`);
        }
        const scores = await response.json();
        globalRankCache = scores; // Atualiza o cache local com os dados do servidor

        globalRankListDiv.innerHTML = ''; // Limpa o conteúdo para preencher

        if (scores.length === 0) {
            const item = document.createElement('div');
            item.classList.add('rank-item');
            const info = document.createElement('span');
            info.classList.add('player-info');
            info.textContent = "Nenhum ponto registrado.";
            info.style.textAlign = "center";
            item.appendChild(info);
            globalRankListDiv.appendChild(item);
            return;
        }

        scores.forEach((player, index) => {
            const rankItem = document.createElement('div');
            rankItem.classList.add('rank-item');

            const rankPosition = document.createElement('span');
            rankPosition.classList.add('rank-position');
            rankPosition.textContent = `${index + 1}º`;
            rankItem.appendChild(rankPosition);

            const playerInfo = document.createElement('span');
            playerInfo.classList.add('player-info');
            playerInfo.textContent = player.name;
            playerInfo.style.color = '#fff';
            rankItem.appendChild(playerInfo);

            const playerScore = document.createElement('span');
            playerScore.classList.add('player-score');
            playerScore.textContent = Math.round(player.score);
            rankItem.appendChild(playerScore);

            const stressLevelSpan = document.createElement('span');
            stressLevelSpan.classList.add('stress-level');

            // Lógica para determinar o nível de estresse
            // *** IMPORTANTE: A lógica de estresse aqui depende do 'score' e 'index'.
            // Se o score é negativo, "SemStresS". Se o rank é baixo (índice alto), "Estressadíssimo".
            // Isso precisa ser validado se o ranking no backend está retornando o score DECRESCENTE (maior pro menor).
            // Seu app.py está com .sort('score', 1) que é CRESCENTE (menor pro maior).
            // Se menor score = melhor (menos estresse), então a lógica abaixo precisa ser ajustada,
            // ou a ordenação no backend para -1. Vamos assumir que -1 é o desejado para rank superior.

            // Adaptação da lógica de stress com base no rank (posição no array ordenado pelo score)
            // Se a ordenação no backend é CRESCENTE (menor score = melhor), então o 1º tem o menor score.
            // Para rank tradicional (maior score = melhor), o backend deveria usar sort('score', -1).
            // VOU ASSUMIR QUE O RANK DESEJADO É: MAIOR PONTUAÇÃO = MELHOR (1º LUGAR).
            // ENTÃO, NO BACKEND (app.py) MUDAR `sort('score', 1)` para `sort('score', -1)`.
            // Ou, se a pontuação negativa significa "Sem estresse" e positiva "Estresse",
            // A ordenação atual (crescente) está correta para "menos estresse" primeiro.
            // A LÓGICA ABAIXO SUGERE QUE O MENOR SCORE É MELHOR:
            if (player.score < 0) { // Ex: -100
                stressLevelSpan.textContent = '(SemStresS)';
                stressLevelSpan.classList.add('no-stress');
            } else if (player.score >= 0 && player.score < 1000) { // Ajuste os limites conforme sua escala
                stressLevelSpan.textContent = '(Estresse moderado(a))';
                stressLevelSpan.classList.add('estresse-moderado');
            } else if (player.score >= 1000 && player.score < 5000) {
                stressLevelSpan.textContent = '(Estresse alto)';
                stressLevelSpan.classList.add('estresse-alto');
            } else if (player.score >= 5000) {
                stressLevelSpan.textContent = '(Estressadíssimo(a))';
                stressLevelSpan.classList.add('estressadissimo');
            } else { // Caso padrão
                stressLevelSpan.textContent = '(Estresse Variável)';
                stressLevelSpan.classList.add('moderate');
            }
            // A LÓGICA ORIGINAL DE ESTRESSE POR ÍNDICE NO RANK (não score diretamente)
            // É AMBÍGUA SEM SABER A ORDENAÇÃO.
            // Se você quer que o índice 0-9 seja moderado, etc., isso implica que a lista `scores`
            // JÁ ESTÁ ORDENADA do jeito que você quer o rank.
            // Se o app.py retorna CRESCENTE (1), então o primeiro item (index 0) tem o menor score.
            // Se o app.py retorna DECRESCENTE (-1), então o primeiro item (index 0) tem o maior score.
            // Por enquanto, vou manter a lógica de estresse baseada nos limites de SCORE, o que faz mais sentido
            // para um rank de "estresse", onde um score mais alto (maior estresse) deve ter um nível de estresse maior.
            // A ordem de exibição no frontend (1º, 2º, etc.) virá da ordenação do backend.
            // Se o objetivo é "menos estresse = melhor rank", a ordenação `sort('score', 1)` no backend é a correta.


            if (stressLevelSpan.textContent !== '') {
                rankItem.appendChild(stressLevelSpan);
            }

            globalRankListDiv.appendChild(rankItem);
        });
    } catch (error) {
        console.error('Erro ao carregar Rank GERAL:', error);
        globalRankListDiv.innerHTML = '<li>Erro ao carregar o Rank GERAL.</li>';
    }
}


// --- Lógica do Jogo ---
function gameLoop() {
    if (!gameActive) return;

    for (let i = 0; i < players.length; i++) {
        const p1 = players[i];
        if (p1.collidedWithCentralSphere) continue;

        for (let j = i + 1; j < players.length; j++) {
            const p2 = players[j];
            if (p2.collidedWithCentralSphere) continue;

            const distance = getDistance(
                p1.x, p1.y, p2.x, p2.y
            );

            if (distance < (PLAYER_RADIUS * 2)) {
                handlePlayerCollision(p1, p2);
            }
        }
    }

    players.forEach(player => {
        if (!player.collidedWithCentralSphere) {
            player.x += player.dx * (player.currentSpeed / PLAYER_BASE_SPEED);
            player.y += player.dy * (player.currentSpeed / PLAYER_BASE_SPEED);

            let hitBorder = false;
            if (player.x + PLAYER_RADIUS > gameCanvas.width) {
                player.x = gameCanvas.width - PLAYER_RADIUS;
                player.dx *= -1;
                hitBorder = true;
            } else if (player.x - PLAYER_RADIUS < 0) {
                player.x = PLAYER_RADIUS;
                player.dx *= -1;
                hitBorder = true;
            }
            if (player.y + PLAYER_RADIUS > gameCanvas.height) {
                player.y = gameCanvas.height - PLAYER_RADIUS;
                player.dy *= -1;
                hitBorder = true;
            } else if (player.y - PLAYER_RADIUS < 0) {
                player.y = PLAYER_RADIUS;
                player.dy *= -1;
                hitBorder = true;
            }

            if (hitBorder) {
                player.dx += (Math.random() - 0.5) * 2;
                player.dy += (Math.random() - 0.5) * 2;
                const currentMagnitude = Math.sqrt(player.dx * player.dx + player.dy * player.dy);
                if (currentMagnitude > 0) {
                    player.dx = (player.dx / currentMagnitude) * player.currentSpeed;
                    player.dy = (player.dy / currentMagnitude) * player.currentSpeed;
                }
            }
        }

        const distanceToCentralSphere = getDistance(player.x, player.y, centralSphere.x, centralSphere.y);

        if (!player.collidedWithCentralSphere && distanceToCentralSphere < (centralSphere.radius + PLAYER_RADIUS)) {
            player.collidedWithCentralSphere = true;
            player.dx = 0;
            player.dy = 0;
            const angle = Math.atan2(player.y - centralSphere.y, player.x - centralSphere.x);
            player.x = centralSphere.x + (centralSphere.radius + PLAYER_RADIUS) * Math.cos(angle);
            player.y = centralSphere.y + (centralSphere.radius + PLAYER_RADIUS) * Math.sin(angle);

            checkWinCondition(); // Verifica se o jogo deve terminar
        }

        if (!player.collidedWithCentralSphere) {
            pointOrbs.forEach(orb => {
                if (orb.active) {
                    const distance = getDistance(player.x, player.y, orb.x, orb.y);
                    if (distance < PLAYER_RADIUS + ORB_RADIUS) {
                        player.score += orb.value;
                        orb.active = false;
                        displayFloatingText(orb.x, orb.y, orb.value > 0 ? `+${orb.value}` : `${orb.value}`, orb.color);
                    }
                }
            });

            speedOrbs.forEach(orb => {
                if (orb.active) {
                    const distance = getDistance(player.x, player.y, orb.x, orb.y);
                    if (distance < PLAYER_RADIUS + ORB_RADIUS) {
                        orb.active = false;
                        applySpeedBoost(player);
                        displayFloatingText(orb.x, orb.y, "VELOCIDADE!", speedOrbColor);
                    }
                }
            });
        }
    });

    // Movimentação dos Orbs
    // (Restante do código de movimentação de orbs permanece inalterado)
    [...pointOrbs, ...speedOrbs].forEach(orb => {
        if (orb.active) {
            orb.x += orb.dx;
            orb.y += orb.dy;

            // Colisão com as bordas do canvas
            if (orb.x + ORB_RADIUS > gameCanvas.width || orb.x - ORB_RADIUS < 0) {
                orb.dx *= -1;
            }
            if (orb.y + ORB_RADIUS > gameCanvas.height || orb.y - ORB_RADIUS < 0) {
                orb.dy *= -1;
            }

            // Colisão com a esfera central
            const distanceToCentralSphere = getDistance(orb.x, orb.y, centralSphere.x, centralSphere.y);
            if (distanceToCentralSphere < (centralSphere.radius + ORB_RADIUS)) {
                // Cálculo de reflexão ao colidir com a esfera central
                const normalX = orb.x - centralSphere.x;
                const normalY = orb.y - centralSphere.y;
                const normalMagnitude = Math.sqrt(normalX * normalX + normalY * normalY);
                const normalizedNormalX = normalX / normalMagnitude;
                const normalizedNormalY = normalY / normalMagnitude;

                const overlap = (centralSphere.radius + ORB_RADIUS) - distanceToCentralSphere;
                orb.x += normalizedNormalX * overlap;
                orb.y += normalizedNormalY * overlap;

                const dotProduct = orb.dx * normalizedNormalX + orb.dy * normalizedNormalY;
                orb.dx = orb.dx - 2 * dotProduct * normalizedNormalX;
                orb.dy = orb.dy - 2 * dotProduct * normalizedNormalY;
            }
        }
    });

    draw();
    updateMatchRank();
}

function draw() {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    ctx.beginPath();
    ctx.arc(centralSphere.x, centralSphere.y, centralSphere.radius, 0, Math.PI * 2);
    ctx.fillStyle = centralSphere.color;
    ctx.fill();
    ctx.closePath();

    pointOrbs.forEach(orb => {
        if (orb.active) {
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(Math.abs(orb.value), orb.x, orb.y);
        }
    });

    speedOrbs.forEach(orb => {
        if (orb.active) {
            ctx.beginPath();
            ctx.arc(orb.x, orb.y, ORB_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = orb.color;
            ctx.fill();
            ctx.closePath();

            ctx.fillStyle = 'white';
            ctx.font = 'bold 15px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', orb.x, orb.y);
        }
    });

    players.forEach(player => {
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = player.color;
        if (player.collidedWithCentralSphere) {
            ctx.fillStyle = 'rgba(128, 0, 128, 0.7)';
        }
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        const textX = player.x + PLAYER_RADIUS + 5;
        const textY = player.y;

        let adjustedTextX = textX;
        let adjustedTextY = textY;

        if (player.collidedWithCentralSphere) {
            ctx.textAlign = 'center';
            adjustedTextX = player.x;
            adjustedTextY = player.y - PLAYER_RADIUS - 10;
        } else if (textX + ctx.measureText(`${player.name} (${Math.round(player.score)})`).width > gameCanvas.width) {
            adjustedTextX = player.x - PLAYER_RADIUS - 5 - ctx.measureText(`${player.name} (${Math.round(player.score)})`).width;
            ctx.textAlign = 'right';
        }
        if (adjustedTextY - 14 < 0) {
            adjustedTextY = player.y + PLAYER_RADIUS + 14;
            ctx.textBaseline = 'top';
        } else if (adjustedTextY + 14 > gameCanvas.height) {
            adjustedTextY = player.y - PLAYER_RADIUS - 14;
            ctx.textBaseline = 'bottom';
        }

        ctx.fillText(`${player.name} (${Math.round(player.score)})`, adjustedTextX, adjustedTextY);
    });
}

function handlePlayerCollision(p1, p2) {
    if (p1.collidedWithCentralSphere || p2.collidedWithCentralSphere) {
        return;
    }

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const distance = getDistance(p1.x, p1.y, p2.x, p2.y); // Corrigido p2.x - p2.x para p2.x
    const overlap = (PLAYER_RADIUS * 2) - distance;

    p1.x -= (overlap / 2) * Math.cos(angle);
    p1.y -= (overlap / 2) * Math.sin(angle);
    p2.x += (overlap / 2) * Math.cos(angle);
    p2.y += (overlap / 2) * Math.sin(angle);

    let loser, winner;
    if (p1.score > p2.score) {
        winner = p1;
        loser = p2;
    } else if (p2.score > p1.score) {
        winner = p2;
        loser = p1;
    } else {
        return;
    }

    const pointsStolen = Math.floor(Math.abs(winner.score - loser.score) * STEAL_PERCENTAGE);

    if (pointsStolen > 0 && winner.score > 0) {
        winner.score -= pointsStolen;
        loser.score += pointsStolen;
        displayFloatingText(winner.x, winner.y, `-${pointsStolen}`, '#ffcc00');
        displayFloatingText(loser.x, loser.y, `+${pointsStolen}`, '#ffcc00');
    }
}

function applySpeedBoost(player) {
    if (player.collidedWithCentralSphere) {
        return;
    }
    player.currentSpeed = PLAYER_BOOST_SPEED;
    if (player.speedBoostTimer) {
        clearTimeout(player.speedBoostTimer);
    }
    player.speedBoostTimer = setTimeout(() => {
        player.currentSpeed = PLAYER_BASE_SPEED;
        player.speedBoostTimer = null;
    }, SPEED_BOOST_DURATION);
}

function displayFloatingText(x, y, text, color) {
    const textElement = document.createElement('div');
    textElement.classList.add('score-feedback');
    textElement.textContent = text;
    textElement.style.left = `${x}px`;
    textElement.style.top = `${y - 15}px`;
    textElement.style.color = color;
    document.getElementById('game-container').appendChild(textElement);

    setTimeout(() => {
        textElement.remove();
    }, 1000);
}

function displayJoinMessage(message, color = '#ffcc00', duration = 3000) {
    joinMessage.textContent = message;
    joinMessage.style.color = color;
    joinMessage.style.display = 'block';
    setTimeout(() => {
        joinMessage.style.display = 'none';
        joinMessage.textContent = '';
    }, duration);
}

// --- NOVO: Função para ENVIAR a pontuação para o backend (MongoDB) ---
async function sendScoreToServer(playerName, score) {
    if (!playerName || typeof score !== 'number') {
        console.error('sendScoreToServer: Nome do jogador ou pontuação inválida.');
        return;
    }

    try {
        const response = await fetch('/api/save_score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: playerName, score: score }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro HTTP! Status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Pontuação salva/atualizada no MongoDB:', data);
        updateGlobalRank(); // Atualiza o placar global após salvar
    } catch (error) {
        console.error('Erro ao salvar pontuação no servidor:', error);
        alert('Erro ao salvar pontuação no Rank GERAL. Tente novamente mais tarde.');
    }
}

function checkWinCondition() {
    const allPlayersFinished = players.every(p => p.collidedWithCentralSphere);

    if (allPlayersFinished && gameActive) {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(orbSpawnTimer);

        let statusMessage = "CLASSIFICAÇÃO FINAL DA PARTIDA:\n\n";
        const finalSortedPlayers = [...players].sort((a, b) => b.score - a.score);

        if (finalSortedPlayers.length > 0) {
            finalSortedPlayers.forEach((player, index) => {
                statusMessage += `${index + 1}º - ${player.name} com ${Math.round(player.score)} pontos!\n`;
                // === INÍCIO DA CORREÇÃO PRINCIPAL: Enviar pontuações de TODOS os jogadores ===
                // Você pode querer diferenciar entre jogadores humanos e bots
                // ou simplesmente enviar todos para o rank geral.
                // Vou enviar todos aqui para simplificar e garantir a atualização.
                sendScoreToServer(player.name, Math.round(player.score)); // Envia a pontuação de TODOS
                // === FIM DA CORREÇÃO ===
            });
        } else {
            statusMessage += "Nenhum jogador colidiu com a esfera central.";
        }

        gameStatusDiv.textContent = statusMessage;
        gameStatusDiv.style.display = 'block';

        // O updateGlobalRank() já é chamado dentro de sendScoreToServer para cada jogador,
        // mas é bom ter uma chamada final para garantir que a interface seja atualizada
        // caso a última chamada de sendScoreToServer termine rapidamente.
        // Ou, se a lógica de estresse depender do rank final, uma atualização final garante.
        // updateGlobalRank(); // Pode ser opcional, já que sendScoreToServer já chama.

        setTimeout(() => {
            gameStatusDiv.style.display = 'none';
            joinGameContainer.style.display = 'flex';
            playerNickInput.value = '';
            humanPlayerNick = ""; // Limpa o nick do jogador humano para a próxima partida
            displayJoinMessage("Partida encerrada! Digite seu Nick para uma nova ou inicie via Admin.");
        }, 5000);
    }
}

function toggleRankPanelSize() {
    matchRankPanel.classList.toggle('large-rank-panel');
    globalRankPanel.classList.toggle('large-rank-panel');

    if (globalRankPanel.classList.contains('large-rank-panel')) {
        resizeRankButton.textContent = 'Minimizar Ranks';
        resizeRankButton.classList.add('left-aligned');
    } else {
        resizeRankButton.textContent = 'Ampliar Ranks';
        resizeRankButton.classList.remove('left-aligned');
    }
    resizeCanvas();
}

function spawnNewOrb() {
    const activePointOrbs = pointOrbs.filter(orb => orb.active).length;
    if (activePointOrbs < MAX_POINT_ORBS) {
        const isPositive = Math.random() < 0.5;
        createRandomPointOrb(isPositive);
    }
    pointOrbs = pointOrbs.filter(orb => orb.active);

    const activeSpeedOrbs = speedOrbs.filter(orb => orb.active).length;
    if (activeSpeedOrbs < MAX_SPEED_ORBS) {
        if (Math.random() < SPEED_ORB_SPAWN_CHANCE) {
            createRandomSpeedOrb();
        }
    }
    speedOrbs = speedOrbs.filter(orb => orb.active);
}

// --- Funções do Painel Admin ---
function showAdminLogin() {
    adminLoginModal.style.display = 'flex';
    adminUsernameInput.value = '';
    adminPasswordInput.value = '';
    loginErrorMessage.style.display = 'none';
    adminUsernameInput.focus();

    if (gameActive) {
        clearInterval(gameInterval);
        clearInterval(orbSpawnTimer);
        wasGameActiveBeforeAdmin = true;
        gameActive = false;
    }
}

function checkAdminLogin() {
    const username = adminUsernameInput.value;
    const password = adminPasswordInput.value;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        adminLoginModal.style.display = 'none';
        adminPanel.style.display = 'flex';
        updatePlayerNamesListInAdmin(); // Carrega os nomes atuais do Rank Geral
    } else {
        loginErrorMessage.style.display = 'block';
    }
}

function closeAdminPanel() {
    adminPanel.style.display = 'none';
    if (wasGameActiveBeforeAdmin) {
        gameInterval = setInterval(gameLoop, GAME_UPDATE_INTERVAL);
        orbSpawnTimer = setInterval(spawnNewOrb, ORB_SPAWN_INTERVAL);
        gameActive = true;
        wasGameActiveBeforeAdmin = false;
    }
    updateGlobalRank(); // Garante que o rank global é atualizado ao fechar o painel admin
}

// Função para adicionar nomes do textarea ao Rank Geral (PERSISTENTE)
async function addPlayerNamesAdmin() {
    const namesText = newPlayerNamesInput.value.trim();
    if (namesText === "") {
        alert("Por favor, insira nomes separados por vírgula.");
        return;
    }

    const newNames = namesText.split(',').map(name => name.trim()).filter(name => name !== '');

    if (newNames.length === 0) {
        alert("Nenhum nome válido encontrado após a separação.");
        return;
    }

    // Para cada novo nome, salve no MongoDB com pontuação inicial de 0
    // A rota save_score no backend já lida com inserção se não existe, ou atualização se existe.
    // Aqui estamos apenas inserindo, então a pontuação é 0. Se já existir, ela será somada.
    // Se a intenção é que um novo nome *sempre comece com 0*, mesmo se já tiver um registro,
    // então a lógica do backend (save_score) precisaria ser ajustada ou você deveria
    // chamar um endpoint diferente para "criar novo jogador" vs "atualizar score".
    // POR ENQUANTO, VAMOS ASSUMIR QUE O SAVE_SCORE DO BACKEND FAZ A SOMA COMO VOCÊ QUER.
    // Se a intenção é apenas "adicionar um novo nome ao rank com 0 pontos",
    // e *não* somar se ele já existir, o endpoint precisa ser alterado para um `$set` com `upsert: true`.
    // DADA A SUA `save_score` ATUAL (que SOMA), este `addPlayerNamesAdmin` FARÁ A SOMA de 0 + score_atual.
    // Ou seja, ele não vai "resetar" para 0. Ele vai manter a pontuação existente.

    // Ação: Se você quer que esses nomes APENAS EXISTAM no rank com 0 pontos INICIALMENTE,
    // *sem alterar a pontuação existente*, a rota `save_score` no `app.py` precisaria ser ajustada
    // para usar `$set` e `upsert: true` *apenas se o score recebido for 0* ou se for uma rota `create_player`.
    // Do jeito que está, se você adicionar um nome que já existe, a pontuação dele será `existente + 0`.
    // Vou assumir que você quer que adicionar o nome não zere a pontuação existente.
    // Se a pessoa já está no rank, ela não precisa ser "adicionada" novamente.
    // Esta função deveria ser mais para "garantir que X jogadores existem no rank com 0 pontos se ainda não estiverem lá".

    // Vamos buscar os nomes existentes no rank geral para evitar criar duplicatas (embora o backend já lide com isso)
    // e para não tentar "adicionar" nomes que já estão lá com 0 pontos (que não faria nada).
    await updateGlobalRank(); // Garante que globalRankCache está fresco

    for (const name of newNames) {
        const existingPlayer = globalRankCache.find(p => p.name === name);
        if (!existingPlayer) { // Se o nome não está no rank geral, adicione com 0 pontos
            await sendScoreToServer(name, 0); // Envia 0 como score inicial para novos jogadores
        } else {
            console.log(`Jogador ${name} já existe no Rank GERAL. Não será adicionado novamente com 0 pontos.`);
        }
    }

    newPlayerNamesInput.value = '';
    alert("Nomes processados. Verifique o Rank GERAL.");
    updatePlayerNamesListInAdmin(); // Atualiza a lista no painel admin
    updateGlobalRank(); // Atualiza o rank global na interface principal
}


// Função para listar os nomes atuais no painel de administração
async function updatePlayerNamesListInAdmin() {
    playerNamesList.innerHTML = '<li>Carregando nomes...</li>';
    await updateGlobalRank(); // Garante que globalRankCache está preenchido

    playerNamesList.innerHTML = '';
    if (globalRankCache.length === 0) {
        playerNamesList.innerHTML = '<li>Nenhum nome no Rank Geral.</li>';
        return;
    }

    globalRankCache.forEach(player => {
        const li = document.createElement('li');
        li.textContent = `${player.name} (Score: ${Math.round(player.score)})`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'X';
        deleteButton.style.marginLeft = '10px';
        deleteButton.style.backgroundColor = '#dc3545';
        deleteButton.style.color = 'white';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '3px';
        deleteButton.style.cursor = 'pointer';
        deleteButton.onclick = async () => {
            if (confirm(`Tem certeza que deseja remover ${player.name} do Rank GERAL?`)) {
                try {
                    const response = await fetch(`/api/delete_player_score/${encodeURIComponent(player.name)}`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || `Erro ao deletar! Status: ${response.status}`);
                    }
                    alert(`Jogador ${player.name} removido.`);
                    updatePlayerNamesListInAdmin(); // Atualiza a lista após deletar
                    updateGlobalRank(); // Atualiza o rank global
                } catch (error) {
                    console.error('Erro ao deletar jogador:', error);
                    alert(`Erro ao deletar jogador: ${error.message}`);
                }
            }
        };
        li.appendChild(deleteButton);
        playerNamesList.appendChild(li);
    });
}


// NOVO: Função para iniciar um combate usando os nomes do Rank Geral
async function startGlobalRankGame() {
    // Busca os nomes do rank geral para usar na partida
    await updateGlobalRank(); // Garante que globalRankCache está fresco

    if (globalRankCache.length === 0) {
        alert("Não há jogadores no Rank GERAL para iniciar um combate. Adicione alguns nomes primeiro.");
        return;
    }

    // Extrai apenas os nomes para passar para startGame
    const namesToUse = globalRankCache.map(player => player.name);

    // Inicia o jogo com esses nomes
    initializeGame(namesToUse);

    // Esconde o painel de administração
    closeAdminPanel();
}


function resetGame() {
    // Redireciona ou recarrega a página para voltar ao estado inicial
    location.reload();
}

async function resetGlobalRank() {
    if (confirm("ATENÇÃO: Esta ação irá APAGAR TODAS as pontuações do Rank GERAL permanentemente. Tem certeza?")) {
        try {
            const response = await fetch('/api/reset_global_rank', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Em uma aplicação real, você enviaria um token de autenticação aqui
                // para garantir que apenas administradores podem fazer isso.
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro HTTP! Status: ${response.status}`);
            }
            alert("Rank GERAL resetado com sucesso!");
            updateGlobalRank(); // Atualiza a exibição do rank após resetar
            updatePlayerNamesListInAdmin(); // Atualiza a lista de nomes no admin
        } catch (error) {
            console.error('Erro ao resetar Rank GERAL:', error);
            alert(`Erro ao resetar Rank GERAL: ${error.message}`);
        }
    }
}

// --- Lógica para o jogador humano se juntar ---
function handlePlayerJoin() {
    const nick = playerNickInput.value.trim();
    if (nick === "") {
        displayJoinMessage("Por favor, digite seu Nick.");
        return;
    }

    humanPlayerNick = nick;
    initializeGame([humanPlayerNick]); // Inicia o jogo com o jogador humano
    joinGameContainer.style.display = 'none';
}

// --- Inicialização ao carregar a página ---
window.onload = async () => {
    resizeCanvas();
    updateGlobalRank(); // Carrega o rank global na inicialização
    // Esconde os painéis de jogo e rank no início, mostrando apenas o join game container
    gameCanvas.style.display = 'none';
    matchRankPanel.style.display = 'none';
    globalRankPanel.style.display = 'flex'; // Mantém o global rank visível por padrão
    resizeRankButton.style.display = 'block';
    adminButton.style.display = 'block';
    joinGameContainer.style.display = 'flex';
    adminPanel.style.display = 'none'; // Garante que o painel admin está escondido
    adminLoginModal.style.display = 'none'; // Garante que o modal de login está escondido

    // Carrega a lista de nomes no painel de administração assim que a página carrega
    // mas sem mostrar o painel admin.
    // Isso é feito ao chamar updateGlobalRank e o showAdminLogin só o mostra.
    // updatePlayerNamesListInAdmin(); // Será chamado após login ou quando o painel admin for exibido.
};

// Adiciona um listener para mostrar a lista de nomes ao abrir o painel admin
// (já coberto pela chamada em checkAdminLogin)