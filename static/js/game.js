// Elementos do painel de controle
const playerNamesInput = document.getElementById('playerNamesInput');
const startGameBtn = document.getElementById('startGameBtn');
const showHistoryBtn = document.getElementById('showHistoryBtn');

// Elementos do painel de relatório
const reportPanel = document.getElementById('report-panel');
const survivorsList = document.getElementById('survivors-list');
const finalRankList = document.getElementById('final-rank-list');
const closeReportBtn = document.getElementById('closeReportBtn');

// Elementos do painel de histórico
const historyPanel = document.getElementById('history-panel');
const combatHistoryList = document.getElementById('combat-history-list');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Elementos do painel de ranking
const rankListElement = document.getElementById('rank-list');

// Variáveis de controle
let combatStarted = false;
let gameLoopId;

const PLANES_PER_PARTICIPANT = 5; // Cada participante tem 5 aviões
const POINTS_PER_HIT = 1154; // Pontos por tiro acertado

// Dados do jogo
let playerPilots = []; // Armazena { name: 'PlayerName', score: 0, airplanesAlive: 0 }
const allAirplanes = []; // Armazena TODOS os aviões (todos são de jogadores)
const missiles = [];

// Dimensões da tela
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

// Cores para os aviões (para diferenciar os jogadores)
const airplaneColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3',
    '#33FFF3', '#FF8C33', '#8C33FF', '#33FF8C', '#FF338C',
    '#FF3333', '#33FF33', '#3333FF', '#FFFF33', '#FF33FF',
    '#8B0000', '#008B8B', '#B8860B', '#483D8B', '#228B22',
    '#FF6347', '#ADFF2F', '#4682B4', '#DAA520', '#FF1493',
    '#4B0082', '#8B4513', '#708090', '#DC143C', '#00BFFF'
];

const AIRPLANE_HEALTH = 10;

// --- Funções de comunicação com o Backend ---

async function fetchGlobalRanking() {
    try {
        const response = await fetch('/get_global_ranking');
        const data = await response.json();
        if (data.status === 'success') {
            return data.ranking;
        } else {
            console.error('Erro ao buscar ranking global:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Erro de rede ao buscar ranking global:', error);
        return [];
    }
}

async function saveCombatResults(ranking) {
    try {
        const response = await fetch('/save_combat_results', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ranking: ranking })
        });
        const data = await response.json();
        if (data.status !== 'success') {
            console.error('Erro ao salvar resultados:', data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao salvar resultados:', error);
    }
}

async function fetchCombatHistory() {
    try {
        const response = await fetch('/get_combat_history');
        const data = await response.json();
        if (data.status === 'success') {
            return data.history;
        } else {
            console.error('Erro ao buscar histórico:', data.message);
            return [];
        }
    } catch (error) {
        console.error('Erro de rede ao buscar histórico:', error);
        return [];
    }
}

async function clearAllData() {
    try {
        const response = await fetch('/clear_data', { method: 'POST' });
        const data = await response.json();
        if (data.status === 'success') {
            alert(data.message);
            // Recarrega o ranking e histórico após limpar
            await initializeGameData();
        } else {
            alert('Erro ao limpar dados: ' + data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao limpar dados:', error);
        alert('Erro de rede ao tentar limpar dados.');
    }
}

// --- Funções de inicialização e atualização de dados ---

async function initializeGameData() {
    const globalRanking = await fetchGlobalRanking();
    playerPilots = globalRanking.map(p => ({
        name: p.name,
        score: p.score,
        airplanesAlive: 0 // Sempre zera ao carregar, pois é uma nova rodada
    }));
    updateRankDisplay();
}

// Atualiza a exibição do ranking em tempo real
function updateRankDisplay() {
    rankListElement.innerHTML = '';
    const sortedPlayers = [...playerPilots].sort((a, b) => b.score - a.score);
    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${player.name}: <span class="player-score">${player.score}</span> (Aviões: ${player.airplanesAlive})`;
        rankListElement.appendChild(listItem);
    });
}

// --- Funções de renderização e jogo ---

// Função para gerar o SVG do avião com a cor desejada
function getAirplaneSVG(color) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${encodeURIComponent(color)}" d="M22,16.21V14l-8-5V3.5A1.5,1.5,0,0,0,12.5,2h-1A1.5,1.5,0,0,0,10,3.5V9l-8,5V16.21L10,14v4l-2,1.5V22l3.5-1,3.5,1V20.5L14,18V14Z"/></svg>`;
}

// Processa os nomes inseridos pelo administrador
function parsePlayerNames() {
    const namesText = playerNamesInput.value.trim();
    if (!namesText) {
        alert("Por favor, insira pelo menos um nome de participante.");
        return false;
    }

    const rawNames = namesText.split(',').map(name => name.trim()).filter(name => name !== '');
    if (rawNames.length === 0) {
        alert("Nenhum nome válido encontrado. Insira nomes separados por vírgula.");
        return false;
    }

    // Cria uma nova lista de players para esta rodada, combinando com o ranking global
    const currentRoundPlayers = [];
    rawNames.forEach(name => {
        let existingPlayer = playerPilots.find(p => p.name === name);
        if (existingPlayer) {
            existingPlayer.airplanesAlive = 0; // Zera para a nova rodada
            currentRoundPlayers.push(existingPlayer);
        } else {
            // Novo jogador, adiciona à lista para a rodada e no ranking global temporariamente
            const newPlayer = {
                name: name,
                score: 0, // Score inicial 0 para a rodada, será somado ao global depois
                airplanesAlive: 0
            };
            playerPilots.push(newPlayer); // Adiciona ao array global de pilotos
            currentRoundPlayers.push(newPlayer);
        }
    });

    // Filtra playerPilots para conter apenas os jogadores que participarão nesta rodada
    // e mantém a ordem original ou de pontuação, dependendo do que preferir
    // Para simplificar, playerPilots agora conterá APENAS os jogadores da rodada atual
    // com seus scores acumulados do ranking global.
    playerPilots = currentRoundPlayers;

    playerPilots.forEach(player => player.airplanesAlive = 0); // Zera para o novo combate
    updateRankDisplay();
    return true;
}

// Cria um único avião e o adiciona à tela
function createSingleAirplane(playerOwner, index) {
    const airplaneContainer = document.createElement('div');
    airplaneContainer.className = 'airplane';

    const airplaneImage = document.createElement('div');
    airplaneImage.className = 'airplane-image';

    // Atribui uma cor ao avião baseada no índice do jogador
    const colorIndex = playerPilots.indexOf(playerOwner) % airplaneColors.length;
    const color = airplaneColors[colorIndex];
    airplaneImage.style.backgroundImage = `url('${getAirplaneSVG(color)}')`;

    const airplaneNameElement = document.createElement('div');
    airplaneNameElement.className = 'airplane-name';
    // Nome do avião: "NomeDoJogador-X"
    airplaneNameElement.textContent = `${playerOwner.name}-${index + 1}`;

    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';

    const healthFill = document.createElement('div');
    healthFill.className = 'health-fill';
    healthBar.appendChild(healthFill);

    airplaneContainer.appendChild(airplaneNameElement);
    airplaneContainer.appendChild(airplaneImage);
    airplaneContainer.appendChild(healthBar);

    // Posição inicial aleatória na tela
    const x = Math.random() * (screenWidth - 80);
    const y = Math.random() * (screenHeight - 100);

    airplaneContainer.style.left = `${x}px`;
    airplaneContainer.style.top = `${y}px`;

    // Direção e velocidade iniciais aleatórias
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;

    document.body.appendChild(airplaneContainer);

    // Objeto do avião com suas propriedades
    const airplane = {
        id: airplaneNameElement.textContent, // ID agora é o nome completo
        container: airplaneContainer,
        image: airplaneImage,
        nameElement: airplaneNameElement,
        healthBar: healthFill,
        x,
        y,
        speed,
        angle,
        color,
        health: AIRPLANE_HEALTH,
        maxHealth: AIRPLANE_HEALTH,
        shootTimer: Math.random() * 2000 + 1000,
        playerOwner: playerOwner // Referência ao objeto do jogador
    };

    allAirplanes.push(airplane);
    playerOwner.airplanesAlive++; // Incrementa aviões vivos do jogador
    updateRankDisplay();
    return airplane;
}

// Remove todos os aviões e mísseis da tela
function clearAllEntities() {
    allAirplanes.forEach(airplane => {
        if (airplane.container) {
            airplane.container.remove();
        }
    });
    missiles.forEach(missile => {
        if (missile.element) {
            missile.element.remove();
        }
    });
    allAirplanes.length = 0;
    missiles.length = 0;
}

// Atualiza a posição e comportamento de todos os aviões
function updateAirplanes() {
    for (let i = 0; i < allAirplanes.length; i++) {
        const airplane = allAirplanes[i];

        airplane.x += Math.cos(airplane.angle) * airplane.speed;
        airplane.y += Math.sin(airplane.angle) * airplane.speed;

        // Limites da tela
        if (airplane.x < 0) {
            airplane.x = 0;
            airplane.angle = Math.PI - airplane.angle;
        } else if (airplane.x > screenWidth - 80) {
            airplane.x = screenWidth - 80;
            airplane.angle = Math.PI - airplane.angle;
        }

        if (airplane.y < 0) {
            airplane.y = 0;
            airplane.angle = -airplane.angle;
        } else if (airplane.y > screenHeight - 100) {
            airplane.y = screenHeight - 100;
            airplane.angle = -airplane.angle;
        }

        airplane.container.style.left = `${airplane.x}px`;
        airplane.container.style.top = `${airplane.y}px`;
        // Ajusta a rotação da imagem para apontar na direção do movimento
        airplane.image.style.transform = `rotate(${airplane.angle + Math.PI/2}rad)`;

        if (combatStarted) {
            airplane.shootTimer -= 16; // Tempo baseado em 60fps (1000ms/60frames ≈ 16.6ms por frame)
            if (airplane.shootTimer <= 0) {
                shootMissile(airplane);
                airplane.shootTimer = Math.random() * 3000 + 1000; // Próximo tiro entre 1 e 4 segundos
            }
        }

        // Pequenas mudanças de direção aleatórias para movimento mais natural
        if (Math.random() < 0.008) {
            airplane.angle += (Math.random() - 0.5) * 0.5;
        }
    }
}

// Função para disparar um míssil
function shootMissile(airplane) {
    const missile = document.createElement('div');
    missile.className = 'missile';
    
    // Posição inicial do míssil (do centro do avião)
    const missileX = airplane.x + 40 - (missile.offsetWidth / 2); // Centraliza
    const missileY = airplane.y + 50 - (missile.offsetHeight / 2); // Centraliza

    missile.style.left = `${missileX}px`;
    missile.style.top = `${missileY}px`;

    // Encontra um alvo aleatório que não seja o próprio avião que disparou
    const potentialTargets = allAirplanes.filter(a => a !== airplane);
    let angle;
    if (potentialTargets.length > 0) {
        const targetAirplane = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        const dx = targetAirplane.x - missileX;
        const dy = targetAirplane.y - missileY;
        angle = Math.atan2(dy, dx);
    } else {
        // Se não houver alvo (avião único ou apenas o próprio), atira aleatoriamente
        angle = Math.random() * Math.PI * 2;
    }

    const speed = 7 + Math.random() * 3; // Velocidade do míssil

    document.body.appendChild(missile);

    missiles.push({
        element: missile,
        x: missileX,
        y: missileY,
        speed,
        angle,
        owner: airplane // Guarda quem disparou o míssil para pontuação
    });
}

// Atualiza a posição dos mísseis e verifica colisões
function updateMissiles() {
    for (let i = 0; i < missiles.length; i++) {
        const missile = missiles[i];

        missile.x += Math.cos(missile.angle) * missile.speed;
        missile.y += Math.sin(missile.angle) * missile.speed;

        missile.element.style.left = `${missile.x}px`;
        missile.element.style.top = `${missile.y}px`;

        // Remove o míssil se sair da tela
        if (missile.x < -50 || missile.x > screenWidth + 50 ||
            missile.y < -50 || missile.y > screenHeight + 50) {
            missile.element.remove();
            missiles.splice(i, 1);
            i--; // Ajusta o índice do loop devido à remoção
            continue;
        }

        // Verifica colisão com outros aviões
        for (let j = 0; j < allAirplanes.length; j++) {
            const airplane = allAirplanes[j];

            // Um míssil não pode atingir o avião que o disparou
            if (missile.owner === airplane) continue;

            const dx = missile.x - (airplane.x + 40); // Centro do avião
            const dy = missile.y - (airplane.y + 50); // Centro do avião
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) { // Raio de colisão (ajustável)
                missile.element.remove(); // Remove o míssil
                missiles.splice(i, 1);

                airplane.health--; // Reduz a vida do avião atingido
                // Atualiza a barra de vida visualmente
                airplane.healthBar.style.width = `${(airplane.health / airplane.maxHealth) * 100}%`;
                airplane.healthBar.style.backgroundColor = airplane.health > (AIRPLANE_HEALTH / 2) ? '#0F0' : (airplane.health > 0 ? '#FFA500' : '#F00');

                // Adiciona pontos ao atirador (apenas para a pontuação da rodada, que será salva depois)
                if (missile.owner && missile.owner.playerOwner) {
                    // A pontuação que será enviada ao backend é a da rodada
                    // O backend cuidará da soma com o acumulado.
                    // Portanto, o score do objeto playerOwner aqui é a pontuação acumulada.
                    // Para o cálculo de pontuação desta rodada, precisamos de uma forma de rastrear.
                    // A maneira mais simples é simplesmente adicionar a pontuação aqui e deixar o backend somar.
                    // A pontuação exibida no ranking da tela já é a acumulada.
                    missile.owner.playerOwner.score += POINTS_PER_HIT;
                    updateRankDisplay(); // Atualiza o ranking em tempo real
                }

                if (airplane.health <= 0) {
                    // Se a vida chegar a zero, cria uma explosão e remove o avião
                    createExplosion(airplane.x + 20, airplane.y + 30, airplane.color);
                    airplane.container.remove();

                    // Remove o avião do array principal e atualiza a contagem do jogador
                    allAirplanes.splice(allAirplanes.indexOf(airplane), 1);
                    airplane.playerOwner.airplanesAlive--;
                    updateRankDisplay(); // Atualiza o ranking após um avião ser abatido
                }

                i--; // Ajusta o índice do loop devido à remoção
                break; // Sai do loop de aviões após a colisão
            }
        }
    }
}

// Cria o efeito visual de explosão
function createExplosion(x, y, color) {
    const explosion = document.createElement('div');
    explosion.className = 'explosion';
    explosion.style.left = `${x}px`;
    explosion.style.top = `${y}px`;
    explosion.style.background = `radial-gradient(circle, ${color} 0%, #FF0000 70%, transparent 100%)`;

    document.body.appendChild(explosion);

    // Remove o elemento da explosão após a animação
    setTimeout(() => {
        explosion.remove();
    }, 800);
}

// Função para exibir o relatório final da rodada
async function showReport() {
    cancelAnimationFrame(gameLoopId); // Para o loop do jogo
    combatStarted = false; // Desativa o combate

    // Captura o ranking final da rodada (apenas nome e score final)
    const roundRanking = playerPilots.map(p => ({
        name: p.name,
        score: p.score, // Score atual, que é o acumulado após a rodada
        airplanesAlive: p.airplanesAlive // Quantos aviões terminaram vivos para o relatório
    }));

    // Envia os resultados para o backend
    await saveCombatResults(roundRanking);

    survivorsList.innerHTML = ''; // Limpa a lista anterior
    const survivingPlayerPlanes = allAirplanes.filter(a => a.health > 0 && a.playerOwner);
    if (survivingPlayerPlanes.length > 0) {
        const survivorsMap = new Map();
        survivingPlayerPlanes.forEach(airplane => {
            const playerName = airplane.playerOwner.name;
            survivorsMap.set(playerName, (survivorsMap.get(playerName) || 0) + 1);
        });

        survivorsMap.forEach((count, name) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${name} (${count} aviões restantes)`;
            survivorsList.appendChild(listItem);
        });
    } else {
        const listItem = document.createElement('li');
        listItem.textContent = "Nenhum avião de participante sobreviveu!";
        survivorsList.appendChild(listItem);
    }

    // Exibe o ranking desta rodada (ordenado)
    finalRankList.innerHTML = '';
    const sortedRoundRankingForDisplay = [...roundRanking].sort((a, b) => b.score - a.score);
    sortedRoundRankingForDisplay.forEach(player => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `${player.name}: <span class="player-score">${player.score}</span>`;
        finalRankList.appendChild(listItem);
    });

    reportPanel.style.display = 'flex';
}

// Loop principal do jogo que atualiza a simulação
function gameLoop() {
    if (combatStarted) {
        updateAirplanes();
        updateMissiles();

        // Verifica se todos os aviões de TODOS os participantes foram abatidos
        const allPlayerPlanesDestroyed = playerPilots.every(player => player.airplanesAlive === 0);

        if (allPlayerPlanesDestroyed && allAirplanes.length === 0) { // Garante que todos foram removidos da tela
            showReport();
            return; // Sai do loop para evitar mais frames
        }
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---

startGameBtn.addEventListener('click', async () => {
    if (combatStarted) {
        alert("Combate já está em andamento! Espere terminar ou atualize a página.");
        return;
    }

    // Tenta processar os nomes dos jogadores e inicializar playerPilots para a rodada
    if (!parsePlayerNames()) {
        return; // Se houver erro, não inicia o jogo
    }

    // Se não houver jogadores válidos após processar nomes, não inicia
    if (playerPilots.length === 0) {
        alert("Nenhum participante válido encontrado. Insira os nomes corretamente.");
        return;
    }

    clearAllEntities(); // Limpa a tela de qualquer simulação anterior
    combatStarted = true;

    // Cria os aviões para cada participante
    playerPilots.forEach(player => {
        for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
            createSingleAirplane(player, i);
        }
    });

    // Garante que o gameLoop está rodando
    if (!gameLoopId) {
        gameLoop();
    }
});

closeReportBtn.addEventListener('click', () => {
    reportPanel.style.display = 'none';
    // Após fechar o relatório, recarrega o ranking global para exibir os dados atualizados
    initializeGameData();
});

showHistoryBtn.addEventListener('click', async () => {
    await displayCombatHistory(); // Agora é assíncrono
    historyPanel.style.display = 'flex';
});

closeHistoryBtn.addEventListener('click', () => {
    historyPanel.style.display = 'none';
});

clearHistoryBtn.addEventListener('click', async () => {
    if (confirm("Tem certeza que deseja limpar TODO o histórico de combates e o ranking geral? Esta ação é irreversível.")) {
        await clearAllData();
        displayCombatHistory(); // Atualiza a exibição do histórico
    }
});

// Função para exibir o histórico de combates
async function displayCombatHistory() {
    combatHistoryList.innerHTML = '';
    const history = await fetchCombatHistory(); // Busca do backend

    if (history.length === 0) {
        combatHistoryList.innerHTML = '<p>Nenhum combate registrado ainda.</p>';
        return;
    }

    history.forEach((entry, index) => {
        const historyEntryDiv = document.createElement('div');
        historyEntryDiv.className = 'history-entry';
        historyEntryDiv.innerHTML = `<h4>Combate ${history.length - index} - ${entry.timestamp}</h4>`; // Inverte a ordem para mais recente primeiro
        const ul = document.createElement('ul');
        
        // Ordena o ranking de cada rodada para exibição
        const sortedRoundRanking = [...entry.ranking].sort((a, b) => b.score - a.score);

        sortedRoundRanking.forEach(player => {
            const li = document.createElement('li');
            li.innerHTML = `${player.name}: <span class="player-score">${player.score}</span>`;
            ul.appendChild(li);
        });
        historyEntryDiv.appendChild(ul);
        combatHistoryList.appendChild(historyEntryDiv);
    });
}

// Atualiza as dimensões da tela quando a janela é redimensionada
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
});

// --- Inicialização ao carregar a página ---
// Carrega o ranking global e inicia o loop do jogo
initializeGameData();
gameLoop();

// Preenche o input de nomes com um exemplo para facilitar o teste inicial
playerNamesInput.value = "Robocop, Hellen, Jean, SYNGEX, NEWFLAME, Tsukombo, Ziul, Cahnrs, Khalessi, [M]ensia, Lima, Jader, \"DarkMage\", Sybeer";