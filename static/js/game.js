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
let currentPlayersNames = [];
let humanPlayerNick = ""; // Guardará o nick do jogador humano, se houver um.

// Posição da esfera central
let centralSphere = { x: 0, y: 0, radius: CENTRAL_SPHERE_RADIUS, color: CENTRAL_SPHERE_COLOR };

// Nomes dos Bots (Animais)
const botNames = [
    "Leão", "Tigre", "Urso", "Lobo", "Águia", "Pantera", "Gorila", "Crocodilo", "Cobra", "Falcão",
    "Elefante", "Girafa", "Zebra", "Hipopótamo", "Rinoceronte", "Chita", "Hiena", "Búfalo", "Javali", "Macaco"
];
const MIN_PLAYERS_FOR_GAME = 5;

// globalRankScores NÃO É MAIS USADO COMO A FONTE PRIMÁRIA DE DADOS. 
// Ele será preenchido pelos dados do MongoDB através da API.
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

function startGame(initialPlayerNames) {
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

    // Cria os objetos Player a partir de currentPlayersNames
    currentPlayersNames.forEach((name, index) => {
        const color = playerColors[index % playerColors.length];
        players.push({
            name: name,
            score: 0,
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
    updateGlobalRank(); // Atualiza o rank global no início do jogo
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
            if (index === 0 && player.score < 0) {
                stressLevelSpan.textContent = '(SemStresS)';
                stressLevelSpan.classList.add('no-stress');
            } else if (index >= 1 && index <= 9) {
                stressLevelSpan.textContent = '(Estresse moderado(a))';
                stressLevelSpan.classList.add('estresse-moderado');
            } else if (index >= 10 && index <= 19) {
                stressLevelSpan.textContent = '(Estresse alto)';
                stressLevelSpan.classList.add('estresse-alto');
            } else if (index >= 20 && index <= 29) {
                stressLevelSpan.textContent = '(Estressadíssimo(a))';
                stressLevelSpan.classList.add('estressadissimo');
            } else {
                if (player.score < 0) {
                    stressLevelSpan.textContent = '(Pouco Estresse)';
                    stressLevelSpan.classList.add('low');
                } else {
                    stressLevelSpan.textContent = '(Estresse Variável)';
                    stressLevelSpan.classList.add('moderate');
                }
            }

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

    [...pointOrbs, ...speedOrbs].forEach(orb => {
        if (orb.active) {
            orb.x += orb.dx;
            orb.y += orb.dy;

            if (orb.x + ORB_RADIUS > gameCanvas.width || orb.x - ORB_RADIUS < 0) {
                orb.dx *= -1;
            }
            if (orb.y + ORB_RADIUS > gameCanvas.height || orb.y - ORB_RADIUS < 0) {
                orb.dy *= -1;
            }

            const distanceToCentralSphere = getDistance(orb.x, orb.y, centralSphere.x, centralSphere.y);
            if (distanceToCentralSphere < (centralSphere.radius + ORB_RADIUS)) {
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
            ctx.font = 'bold 25px Arial';
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
                // ENVIAR PONTUAÇÃO DE CADA JOGADOR PARA O MONGODB
                sendScoreToServer(player.name, Math.round(player.score));
            });
        } else {
            statusMessage += "Nenhum jogador colidiu com a esfera central.";
        }

        gameStatusDiv.textContent = statusMessage;
        gameStatusDiv.style.display = 'block';

        // O updateGlobalRank() já é chamado dentro de sendScoreToServer
        // para garantir que o placar seja atualizado após o último envio.

        setTimeout(() => {
            gameStatusDiv.style.display = 'none';
            joinGameContainer.style.display = 'flex';
            playerNickInput.value = '';
            humanPlayerNick = "";
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

// --- Funções de Persistência (localStorage) - REMOVIDAS/ADAPTADAS ---
// loadGlobalRank() e saveGlobalRank() não são mais necessários para o Rank Geral Global.
// O rank agora é carregado e salvo via API.

// --- Funções do Painel de Administração ---
function showAdminLogin() {
    adminLoginModal.style.display = 'block';
    adminUsernameInput.value = '';
    adminPasswordInput.value = '';
    loginErrorMessage.style.display = 'none';
    adminUsernameInput.focus();

    if (gameActive) {
        clearInterval(gameInterval);
        clearInterval(orbSpawnTimer);
        wasGameActiveBeforeAdmin = true;
        gameActive = false;
    } else {
        wasGameActiveBeforeAdmin = false;
    }
}

function checkAdminLogin() {
    const username = adminUsernameInput.value.trim();
    const password = adminPasswordInput.value.trim();

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        adminLoginModal.style.display = 'none';
        openAdminPanel();
    } else {
        loginErrorMessage.style.display = 'block';
    }
}

function openAdminPanel() {
    adminPanel.style.display = 'block';
    updateAdminNamesList(); // Atualiza a lista de nomes no admin panel
}

function closeAdminPanel() {
    adminPanel.style.display = 'none';
    if (gameInitialized && wasGameActiveBeforeAdmin) {
        gameInterval = setInterval(gameLoop, GAME_UPDATE_INTERVAL);
        orbSpawnTimer = setInterval(spawnNewOrb, ORB_SPAWN_INTERVAL);
        gameActive = true;
    }
    wasGameActiveBeforeAdmin = false;
}

// NOVO: Adicionar nomes ao Rank GERAL via API (com score inicial de 0)
async function addPlayerNamesAdmin() {
    const namesText = newPlayerNamesInput.value.trim();
    if (namesText === "") {
        alert("Por favor, digite nomes para adicionar.");
        return;
    }

    const newNames = namesText.split(',').map(name => name.trim()).filter(name => name !== '');
    let namesAddedCount = 0;
    
    // Iterar sobre os nomes e adicioná-los via API
    for (const name of newNames) {
        // Verifica se o nome já existe no cache do rank global para evitar duplicação desnecessária de chamadas
        const existsInCache = globalRankCache.some(player => player.name === name);
        
        if (!existsInCache) {
            try {
                const response = await fetch('/api/save_score', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: name, score: 0 }) // Adiciona com pontuação 0
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Erro ao adicionar ${name}. Status: ${response.status}`);
                }
                namesAddedCount++;
            } catch (error) {
                console.error(`Falha ao adicionar nome ${name}:`, error);
                alert(`Erro ao adicionar "${name}": ${error.message}`);
            }
        } else {
            console.log(`Nome "${name}" já existe no Rank GERAL. Ignorando adição.`);
        }
    }
    
    newPlayerNamesInput.value = '';
    if (namesAddedCount > 0) {
        alert(`${namesAddedCount} nome(s) adicionado(s) ao Rank GERAL.`);
    } else {
        alert("Nenhum nome novo foi adicionado (já existiam ou houve erro).");
    }
    await updateGlobalRank(); // Atualiza a lista no admin panel e o rank global
    updateAdminNamesList(); // Refresca a lista no modal admin
}


// NOVO: Remover nome do Rank GERAL via API
async function removePlayerName(nameToRemove) {
    const confirmRemove = confirm(`Tem certeza que deseja remover "${nameToRemove}" do Rank GERAL e apagar seus pontos?`);
    if (confirmRemove) {
        try {
            const response = await fetch(`/api/delete_player_score/${encodeURIComponent(nameToRemove)}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ao remover ${nameToRemove}. Status: ${response.status}`);
            }
            alert(`"${nameToRemove}" removido do Rank GERAL.`);
            await updateGlobalRank(); // Atualiza o rank global após remoção
            updateAdminNamesList(); // Refresca a lista no modal admin
        } catch (error) {
            console.error(`Falha ao remover nome ${nameToRemove}:`, error);
            alert(`Erro ao remover "${nameToRemove}": ${error.message}`);
        }
    }
}

// Atualiza a lista de nomes no Painel Admin (usando o cache do Rank Global)
function updateAdminNamesList() {
    playerNamesList.innerHTML = '';

    // Use o globalRankCache que foi populado por updateGlobalRank()
    const allGlobalNames = globalRankCache.map(player => player.name).sort((a, b) => a.localeCompare(b));

    if (allGlobalNames.length === 0) {
        const li = document.createElement('li');
        li.textContent = "Nenhum jogador no Rank GERAL ainda.";
        playerNamesList.appendChild(li);
        return;
    }

    allGlobalNames.forEach(name => {
        const li = document.createElement('li');
        const span = document.createElement('span');
        span.textContent = name;
        li.appendChild(span);

        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-name-button');
        removeButton.textContent = 'Remover';
        removeButton.onclick = () => removePlayerName(name);
        li.appendChild(removeButton);

        playerNamesList.appendChild(li);
    });
}

// NOVO: Resetar Rank GERAL via API
async function resetGlobalRank() {
    const confirmReset = confirm("Tem certeza que deseja RESETAR o Rank GERAL? Isso apagará todas as pontuações de TODOS os jogadores persistentes.");
    if (confirmReset) {
        try {
            const response = await fetch('/api/reset_global_rank', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}) // Envia um corpo vazio
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro ao resetar Rank GERAL. Status: ${response.status}`);
            }
            alert("Rank GERAL resetado com sucesso!");
            await updateGlobalRank(); // Recarrega e exibe o rank vazio
            updateAdminNamesList(); // Atualiza a lista no modal admin
        } catch (error) {
            console.error('Falha ao resetar Rank GERAL:', error);
            alert(`Erro ao resetar Rank GERAL: ${error.message}`);
        }
    }
}

function resetGame() {
    const confirmReset = confirm("Tem certeza que deseja REINICIAR o jogo? Todos os jogadores e pontuações da PARTIDA ATUAL serão apagados e você voltará para a tela de inserção de Nick. O Rank GERAL permanecerá intacto.");
    if (confirmReset) {
        gameActive = false;
        gameInitialized = false;
        clearInterval(gameInterval);
        clearInterval(orbSpawnTimer);
        players = [];
        pointOrbs = [];
        speedOrbs = [];
        currentPlayersNames = [];
        humanPlayerNick = "";
        gameStatusDiv.style.display = 'none';
        matchRankListDiv.innerHTML = '';
        closeAdminPanel();
        draw();

        joinGameContainer.style.display = 'flex';
        playerNickInput.value = '';
        displayJoinMessage("Insira seu Nick para começar uma nova partida!");
        updateAdminNamesList();
    }
}

async function startGlobalRankGame() {
    await updateGlobalRank(); // Garante que o cache do rank global está atualizado
    const globalPlayers = globalRankCache.map(p => p.name); // Pega os nomes do cache

    if (globalPlayers.length === 0) {
        alert("Não há jogadores no Rank GERAL para iniciar um combate. Adicione nomes primeiro.");
        return;
    }

    const confirmStart = confirm(`Iniciar combate com ${globalPlayers.length} jogadores do Rank GERAL? (Bots serão adicionados se necessário)`);
    if (confirmStart) {
        humanPlayerNick = "";
        closeAdminPanel();
        initializeGame(globalPlayers);
    }
}

// --- Função Central para o Jogador Participar (via Nick) ---
async function handlePlayerJoin() {
    const playerNick = playerNickInput.value.trim();

    if (playerNick === "") {
        displayJoinMessage("Por favor, digite seu Nick.");
        return;
    }

    if (botNames.includes(playerNick)) {
        displayJoinMessage("Esse Nick é de um bot! Escolha outro.", '#ff0000');
        playerNickInput.value = '';
        return;
    }

    // Ao invés de usar globalRankScores (local), vamos garantir que o nome exista no MongoDB
    // Adiciona o jogador com pontuação 0 se ele não existir no MongoDB
    try {
        const response = await fetch('/api/save_score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: playerNick, score: 0 })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Erro ao registrar nick. Status: ${response.status}`);
        }
        console.log(`Nick "${playerNick}" registrado/atualizado no Rank GERAL.`);
        await updateGlobalRank(); // Atualiza o placar global para refletir o novo jogador (se for o caso)
    } catch (error) {
        console.error(`Falha ao registrar nick "${playerNick}":`, error);
        alert(`Erro ao registrar seu Nick: ${error.message}`);
        return; // Impede que o jogo inicie se o nick não puder ser registrado
    }

    humanPlayerNick = playerNick;

    let playersForThisGame = [playerNick];
    const availableBotNames = [...botNames];

    while (playersForThisGame.length < MIN_PLAYERS_FOR_GAME && availableBotNames.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableBotNames.length);
        const botName = availableBotNames.splice(randomIndex, 1)[0];
        if (botName !== humanPlayerNick && !playersForThisGame.includes(botName)) {
            playersForThisGame.push(botName);
        }
    }

    initializeGame(playersForThisGame);
}

// --- Inicialização ao Carregar a Página ---
window.onload = function() {
    resizeCanvas();
    updateGlobalRank(); // Carrega o rank global do MongoDB ao iniciar
    joinGameContainer.style.display = 'flex';
    playerNickInput.focus();
};