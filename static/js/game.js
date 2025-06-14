// Elementos do painel de controle
const startGameBtn = document.getElementById('startGameBtn'); // Só existe se for admin
const showHistoryBtn = document.getElementById('showHistoryBtn');
const loginBtn = document.getElementById('loginBtn'); // Só existe se não for admin
const logoutBtn = document.getElementById('logoutBtn'); // Só existe se for admin

// Novos elementos para registro de participante
const participantNameInput = document.getElementById('participantNameInput');
const loyaltyInput = document.getElementById('loyaltyInput');
const registerParticipantBtn = document.getElementById('registerParticipantBtn');

// Novo botão para combate contra IA
const startVsAIBtn = document.getElementById('startVsAIBtn');

// Elementos do painel de relatório
const reportPanel = document.getElementById('report-panel');
const survivorsList = document.getElementById('survivors-list');
const finalRankList = document.getElementById('final-rank-list');
const closeReportBtn = document.getElementById('closeReportBtn');

// Elementos do painel de histórico
const historyPanel = document.getElementById('history-panel');
const combatHistoryList = document.getElementById('combat-history-list');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn'); // Só existe se for admin

// Elementos do painel de ranking
const rankListElement = document.getElementById('rank-list');

// Variáveis de controle
let combatStarted = false;
let gameLoopId;
let currentCombatMode = null; // 'admin' ou 'vs_ia'

const PLANES_PER_PARTICIPANT = 5; // Cada participante tem 5 aviões
const PLANES_PER_AI_TEAM = 10;   // A IA tem 10 aviões
const POINTS_PER_HIT = 1154; // Pontos por tiro acertado

// Dados do jogo
let registeredPlayers = new Map(); // Armazena { name: { score: X, loyalty: Y, airplanesAlive: Z, currentRoundScore: 0 } }
let currentCombatPlayers = []; // Jogadores ativos na rodada atual (inclui IA temporariamente se for vs_ia)
const allAirplanes = []; // Armazena TODOS os aviões (incluindo IA)
const missiles = [];

// Dimensões da tela (ajustadas dinamicamente)
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

// Cores para os aviões (para diferenciar os jogadores)
const playerColors = [
    '#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3',
    '#33FFF3', '#FF8C33', '#8C33FF', '#33FF8C', '#FF338C',
    '#FF3333', '#33FF33', '#3333FF', '#FFFF33', '#FF33FF',
    '#8B0000', '#008B8B', '#B8860B', '#483D8B', '#228B22',
    '#FF6347', '#ADFF2F', '#4682B4', '#DAA520', '#FF1493',
    '#4B0082', '#8B4513', '#708090', '#DC143C', '#00BFFF'
];
const AI_COLOR = '#808080'; // Cor cinza para a IA

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
            alert('Erro ao salvar resultados: ' + data.message);
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
            await initializeGameData(); // Recarrega o ranking e histórico após limpar
            clearAllEntities(); // Limpa a tela também
            updateRankDisplay(); // Atualiza a exibição para refletir o ranking limpo
        } else {
            alert('Erro ao limpar dados: ' + data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao limpar dados:', error);
        alert('Erro de rede ao tentar limpar dados.');
    }
}

async function registerParticipant(name, loyalty) {
    try {
        const response = await fetch('/register_participant', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: name, loyalty: loyalty })
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert(data.message);
            // Atualiza o mapa de jogadores registrados com o novo/atualizado participante
            // E inicializa currentRoundScore para a rodada atual
            registeredPlayers.set(data.participant.name, {
                score: (registeredPlayers.get(data.participant.name) || { score: 0 }).score, // Mantém o score global
                loyalty: data.participant.loyalty,
                airplanesAlive: 0,
                currentRoundScore: 0 // Pontuação desta rodada
            });
            await initializeGameData(); // Recarrega para garantir que o ranking global esteja atualizado

            // Se não houver combate em andamento, crie os aviões do participante na tela
            if (!combatStarted) {
                clearAllEntities(); // Limpa quaisquer aviões anteriores
                currentCombatPlayers = []; // Zera jogadores de combate ativos para a exibição estática

                const participant = registeredPlayers.get(name);
                currentCombatPlayers.push(participant);

                participant.airplanesAlive = 0; // Zera para a nova exibição
                participant.currentRoundScore = 0; // Zera o score da rodada para exibição
                for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                    createSingleAirplane(participant, i, false);
                }
                updateRankDisplay(); // Atualiza a contagem de aviões no ranking
            } else {
                alert("O combate já está em andamento. Seus aviões aparecerão quando o próximo combate for iniciado.");
            }

        } else {
            alert('Erro ao registrar: ' + data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao registrar participante:', error);
        alert('Erro de rede ao tentar registrar participante.');
    }
}


// --- Funções de inicialização e atualização de dados ---

async function initializeGameData() {
    const globalRanking = await fetchGlobalRanking();
    registeredPlayers.clear(); // Limpa o mapa existente

    globalRanking.forEach(p => {
        // Ao carregar, a lealdade e aviões vivos são temporários ou padrão
        registeredPlayers.set(p.name, {
            name: p.name, // Adiciona o nome para consistência
            score: p.score,
            loyalty: 500, // Lealdade padrão ao carregar, a menos que seja atualizada via registro
            airplanesAlive: 0,
            currentRoundScore: 0
        });
    });
    updateRankDisplay();
}

function updateRankDisplay() {
    rankListElement.innerHTML = '';
    // Obtém todos os jogadores registrados, os converte para array e ordena
    const sortedPlayers = Array.from(registeredPlayers.values()).sort((a, b) => b.score - a.score);
    sortedPlayers.forEach(player => {
        const listItem = document.createElement('li');
        // Exibe o score acumulado (score) e a contagem de aviões vivos
        listItem.innerHTML = `${player.name}: <span class="player-score">${player.score}</span> (Aviões: ${player.airplanesAlive})`;
        rankListElement.appendChild(listItem);
    });
}

// --- Funções de renderização e jogo ---

function getAirplaneSVG(color) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${encodeURIComponent(color)}" d="M22,16.21V14l-8-5V3.5A1.5,1.5,0,0,0,12.5,2h-1A1.5,1.5,0,0,0,10,3.5V9l-8,5V16.21L10,14v4l-2,1.5V22l3.5-1,3.5,1V20.5L14,18V14Z"/></svg>`;
}

// Cria um único avião e o adiciona à tela
function createSingleAirplane(playerOwner, index, isAI = false) {
    const airplaneContainer = document.createElement('div');
    airplaneContainer.className = 'airplane';

    const airplaneImage = document.createElement('div');
    airplaneImage.className = 'airplane-image';

    // Determina a cor com base se é IA ou jogador
    const color = isAI ? AI_COLOR : playerColors[currentCombatPlayers.indexOf(playerOwner) % playerColors.length];
    airplaneImage.style.backgroundImage = `url('${getAirplaneSVG(color)}')`;

    const airplaneNameElement = document.createElement('div');
    airplaneNameElement.className = 'airplane-name';
    airplaneNameElement.textContent = `${playerOwner.name}-${index + 1}`;
    if (isAI) {
        airplaneNameElement.textContent = `IA-${index + 1}`; // Identifica aviões da IA
    }


    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';

    const healthFill = document.createElement('div');
    healthFill.className = 'health-fill';
    healthBar.appendChild(healthFill);

    airplaneContainer.appendChild(airplaneNameElement);
    airplaneContainer.appendChild(airplaneImage);
    airplaneContainer.appendChild(healthBar);

    // Posição inicial aleatória
    const x = Math.random() * (screenWidth - 80);
    const y = Math.random() * (screenHeight - 100);

    airplaneContainer.style.left = `${x}px`;
    airplaneContainer.style.top = `${y}px`;

    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 1.5;

    document.body.appendChild(airplaneContainer);

    const airplane = {
        id: airplaneNameElement.textContent,
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
        playerOwner: playerOwner, // Referência ao objeto do jogador/IA
        isAI: isAI // Novo atributo para identificar aviões da IA
    };

    allAirplanes.push(airplane);
    playerOwner.airplanesAlive++; // Incrementa a contagem de aviões vivos para o dono
    updateRankDisplay(); // Atualiza a exibição de aviões no ranking
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

    // Reseta a contagem de aviões vivos para todos os jogadores registrados
    registeredPlayers.forEach(player => player.airplanesAlive = 0);
    updateRankDisplay();
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
        airplane.image.style.transform = `rotate(${airplane.angle + Math.PI/2}rad)`;

        if (combatStarted) {
            airplane.shootTimer -= 16; // Tempo em ms, 16ms por frame
            if (airplane.shootTimer <= 0) {
                shootMissile(airplane);
                airplane.shootTimer = Math.random() * 3000 + 1000; // Próximo tiro em 1 a 4 segundos
            }
        }

        // Pequenas mudanças de ângulo para movimento mais natural
        if (Math.random() < 0.008) {
            airplane.angle += (Math.random() - 0.5) * 0.5;
        }
    }
}

// Função para disparar um míssil
function shootMissile(airplane) {
    const missile = document.createElement('div');
    missile.className = 'missile';

    const missileX = airplane.x + 40 - (missile.offsetWidth / 2);
    const missileY = airplane.y + 50 - (missile.offsetHeight / 2);

    missile.style.left = `${missileX}px`;
    missile.style.top = `${missileY}px`;

    let potentialTargets;
    if (currentCombatMode === 'vs_ia') {
        // Se é vs IA: jogadores atiram em IA, IA atira em jogadores. Sem fogo amigo.
        if (airplane.isAI) {
            potentialTargets = allAirplanes.filter(a => !a.isAI && a.health > 0); // IA atira em jogadores vivos
        } else {
            potentialTargets = allAirplanes.filter(a => a.isAI && a.health > 0); // Jogador atira em IA viva
        }
    } else if (currentCombatMode === 'admin') {
        // Se é modo Admin: todos contra todos (fogo amigo permitido entre jogadores também)
        potentialTargets = allAirplanes.filter(a => a !== airplane && a.health > 0);
    } else {
        // Modo sem combate ativo, aviões não atiram
        return;
    }


    let angle;
    if (potentialTargets.length > 0) {
        const targetAirplane = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
        const dx = targetAirplane.x - missileX;
        const dy = targetAirplane.y - missileY;
        angle = Math.atan2(dy, dx);
    } else {
        // Se não há alvos (todos inimigos foram destruídos), míssil não é disparado ou dispara aleatoriamente
        // Para evitar erros e parar o combate mais rápido se o último inimigo foi destruído.
        return;
    }

    const speed = 7 + Math.random() * 3;

    document.body.appendChild(missile);

    missiles.push({
        element: missile,
        x: missileX,
        y: missileY,
        speed,
        angle,
        owner: airplane // Quem disparou o míssil
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

        // Remove mísseis fora da tela
        if (missile.x < -50 || missile.x > screenWidth + 50 ||
            missile.y < -50 || missile.y > screenHeight + 50) {
            missile.element.remove();
            missiles.splice(i, 1);
            i--;
            continue;
        }

        for (let j = 0; j < allAirplanes.length; j++) {
            const airplane = allAirplanes[j];

            // Não atira no próprio avião
            if (missile.owner === airplane) continue;

            // Lógica de fogo amigo/inimigo baseada no modo de combate
            let isTargetValid = false;
            if (currentCombatMode === 'vs_ia') {
                // Jogadores atiram em IA, IA atira em jogadores. Sem fogo amigo.
                if ((!missile.owner.isAI && airplane.isAI) || (missile.owner.isAI && !airplane.isAI)) {
                    isTargetValid = true;
                }
            } else if (currentCombatMode === 'admin') {
                // Modo Admin: todos contra todos (aviões de jogadores vs outros aviões de jogadores)
                // Se o owner é um jogador e o target é outro jogador (ou IA, se tivessem)
                isTargetValid = true;
            }

            if (!isTargetValid) continue; // Pula se o alvo não é válido para este míssil/modo

            // Verifica colisão
            const dx = missile.x - (airplane.x + 40); // 40 é o centro do avião (largura/2)
            const dy = missile.y - (airplane.y + 50); // 50 é o centro do avião (altura/2)
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) { // Raio de colisão
                missile.element.remove();
                missiles.splice(i, 1);

                airplane.health--;
                airplane.healthBar.style.width = `${(airplane.health / airplane.maxHealth) * 100}%`;
                airplane.healthBar.style.backgroundColor = airplane.health > (AIRPLANE_HEALTH / 2) ? '#0F0' : (airplane.health > 0 ? '#FFA500' : '#F00');

                // Pontuação para o piloto do avião que acertou
                if (missile.owner && !missile.owner.isAI) { // Apenas jogadores humanos ganham pontos
                    // O score acumulado para esta rodada
                    const ownerPilot = registeredPlayers.get(missile.owner.playerOwner.name);
                    if (ownerPilot) {
                        ownerPilot.currentRoundScore += POINTS_PER_HIT; // Adiciona ao score da rodada
                        // O score do `registeredPlayers` é o score GLOBAL acumulado, não o da rodada.
                        // updateRankDisplay() já usa o score global.
                        // A atualização visual do score global acontecerá após o combate na tela de relatório.
                    }
                }

                if (airplane.health <= 0) {
                    createExplosion(airplane.x + 20, airplane.y + 30, airplane.color);
                    airplane.container.remove();
                    allAirplanes.splice(allAirplanes.indexOf(airplane), 1);
                    airplane.playerOwner.airplanesAlive--; // Decrementa aviões vivos do dono
                    updateRankDisplay(); // Atualiza a contagem de aviões no ranking
                }

                i--;
                break; // Míssil colidiu, passa para o próximo míssil
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

    setTimeout(() => {
        explosion.remove();
    }, 800);
}

// Função para verificar o fim do combate e exibir relatório
async function checkCombatEndAndShowReport() {
    // Conta os aviões de jogadores (não IA) e aviões de IA que estão ativos na tela
    const playerPlanesRemaining = allAirplanes.filter(a => !a.isAI && a.health > 0).length;
    const aiPlanesRemaining = allAirplanes.filter(a => a.isAI && a.health > 0).length;

    let combatEnded = false;

    if (currentCombatMode === 'admin') {
        // No modo admin, o combate termina quando apenas uma equipe (ou ninguém) sobrevive
        // Ou seja, quando o número de "donos" de aviões vivos é 0 ou 1
        const remainingOwners = new Set(allAirplanes.filter(a => a.health > 0).map(a => a.playerOwner.name));
        if (remainingOwners.size <= 1) { // Sobrou 0 ou 1 equipe
             combatEnded = true;
        }
    } else if (currentCombatMode === 'vs_ia') {
        // No modo vs IA, o combate termina quando:
        // 1. Todos os aviões do jogador foram destruídos OU
        // 2. Todos os aviões da IA foram destruídos
        if (playerPlanesRemaining === 0 || aiPlanesRemaining === 0) {
            combatEnded = true;
        }
    }

    if (combatEnded) {
        cancelAnimationFrame(gameLoopId);
        combatStarted = false;

        // Prepara os resultados para salvar (apenas jogadores humanos)
        const roundRankingToSave = Array.from(registeredPlayers.values())
            .filter(p => p.currentRoundScore > 0 || p.airplanesAlive > 0) // Inclui quem fez pontos ou sobreviveu
            .map(p => ({
                name: p.name,
                score: p.currentRoundScore, // Salva o score DESTA RODADA
                airplanesAlive: p.airplanesAlive // Apenas para exibição no relatório, não salvo no DB diretamente
            }));

        // Salva os resultados no backend
        await saveCombatResults(roundRankingToSave);

        // Atualiza o ranking global localmente com os scores da rodada ANTES de exibir o relatório
        roundRankingToSave.forEach(playerResult => {
            const playerInMap = registeredPlayers.get(playerResult.name);
            if (playerInMap) {
                playerInMap.score += playerResult.score; // Adiciona o score da rodada ao score global
            }
        });
        updateRankDisplay(); // Atualiza a exibição do ranking geral

        // Prepara e exibe o relatório
        survivorsList.innerHTML = '';
        const survivingPlayerPlanes = allAirplanes.filter(a => a.health > 0 && !a.isAI);
        const survivingAIPlanes = allAirplanes.filter(a => a.health > 0 && a.isAI);

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

        if (currentCombatMode === 'vs_ia' && survivingAIPlanes.length > 0) {
            const hr = document.createElement('hr');
            hr.style.borderColor = '#555';
            survivorsList.appendChild(hr);
            const aiListItem = document.createElement('li');
            aiListItem.textContent = `IA (${survivingAIPlanes.length} aviões restantes)`;
            survivorsList.appendChild(aiListItem);
        }


        finalRankList.innerHTML = '';
        // Usa o roundRankingToSave (pontos desta rodada) para o ranking da rodada no relatório
        const sortedRoundRankingForDisplay = [...roundRankingToSave].sort((a, b) => b.score - a.score);
        sortedRoundRankingForDisplay.forEach(player => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `${player.name}: <span class="player-score">${player.score}</span>`;
            finalRankList.appendChild(listItem);
        });

        reportPanel.style.display = 'flex';
    }
}

// Loop principal do jogo que atualiza a simulação
function gameLoop() {
    if (combatStarted) {
        updateAirplanes();
        updateMissiles();
        checkCombatEndAndShowReport(); // Verifica e exibe relatório
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

// --- Event Listeners ---

// Admin: Iniciar Combate com Jogadores Registrados na tela
if (startGameBtn) {
    startGameBtn.addEventListener('click', async () => {
        if (combatStarted) {
            alert("Um combate já está em andamento! Espere terminar ou atualize a página.");
            return;
        }

        // Reseta o score da rodada para todos os jogadores registrados
        registeredPlayers.forEach(p => p.currentRoundScore = 0);

        // Pega todos os jogadores que estão atualmente com aviões na tela (ou seja, estão no `currentCombatPlayers`
        // do último registro, ou que simplesmente já foram registrados e estão no `registeredPlayers` Map)
        // Para o combate Admin, vamos considerar todos os jogadores que JÁ FORAM REGISTRADOS
        // e que, idealmente, apareçam na tela com seus aviões antes de iniciar.
        // Vamos usar os nomes do `registeredPlayers` para evitar um input extra para o admin.
        // O admin clica, e todos que já se registraram vão para o combate.
        currentCombatPlayers = Array.from(registeredPlayers.values()).filter(p => !p.isAI); // Filtra IAs se houver

        if (currentCombatPlayers.length < 2) {
            alert("Admin: São necessários pelo menos 2 participantes registrados (com aviões na tela) para iniciar um combate entre jogadores.");
            return;
        }

        clearAllEntities(); // Limpa todos os aviões antigos
        combatStarted = true;
        currentCombatMode = 'admin'; // Define o modo de combate

        // Cria os aviões para CADA jogador humano registrado
        currentCombatPlayers.forEach(player => {
            player.airplanesAlive = 0; // Zera para a nova rodada
            for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                createSingleAirplane(player, i, false); // false para não ser IA
            }
        });
        updateRankDisplay(); // Atualiza a contagem de aviões no ranking

        // Inicia o loop do jogo se não estiver rodando
        if (!gameLoopId) {
            gameLoop();
        }
    });
}

// Qualquer usuário: Iniciar Combate contra IA
if (startVsAIBtn) {
    startVsAIBtn.addEventListener('click', async () => {
        if (combatStarted) {
            alert("Um combate já está em andamento! Espere terminar ou atualize a página.");
            return;
        }

        const participantName = participantNameInput.value.trim();
        const participantLoyalty = parseInt(loyaltyInput.value);

        if (!participantName || isNaN(participantLoyalty) || participantLoyalty < 0) {
            alert("Por favor, registre seu Nick e Lealdade (0-1000) para iniciar um combate contra a IA.");
            return;
        }

        // Garante que o jogador está no mapa registeredPlayers
        let player = registeredPlayers.get(participantName);
        if (!player) {
            alert("Você precisa 'Entrar no Combate' primeiro para registrar seu Nick e Lealdade.");
            return;
        }
        
        // Reseta o score da rodada para este jogador
        player.currentRoundScore = 0;
        player.airplanesAlive = 0; // Zera para a nova rodada
        player.loyalty = participantLoyalty; // Garante que a lealdade está atualizada

        clearAllEntities(); // Limpa aviões da tela
        combatStarted = true;
        currentCombatMode = 'vs_ia'; // Define o modo de combate

        currentCombatPlayers = []; // Zera a lista de jogadores de combate
        currentCombatPlayers.push(player); // Adiciona o jogador humano

        // Cria os aviões do jogador humano
        for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
            createSingleAirplane(player, i, false);
        }

        // Cria a equipe de IA
        const aiTeam = { name: 'IA', score: 0, airplanesAlive: 0, isAI: true, currentRoundScore: 0 };
        currentCombatPlayers.push(aiTeam); // Adiciona a IA como um "jogador" temporário para gerenciamento de aviões
        for (let i = 0; i < PLANES_PER_AI_TEAM; i++) {
            createSingleAirplane(aiTeam, i, true); // true para ser IA
        }
        updateRankDisplay(); // Atualiza a contagem de aviões no ranking

        if (!gameLoopId) {
            gameLoop();
        }
    });
}


closeReportBtn.addEventListener('click', () => {
    reportPanel.style.display = 'none';
    clearAllEntities(); // Limpa a tela após fechar o relatório
    initializeGameData(); // Recarrega o ranking e exibe
});

showHistoryBtn.addEventListener('click', async () => {
    await displayCombatHistory();
    historyPanel.style.display = 'flex';
});

closeHistoryBtn.addEventListener('click', () => {
    historyPanel.style.display = 'none';
});

if (clearHistoryBtn) { // Só adiciona se o botão existir (admin)
    clearHistoryBtn.addEventListener('click', async () => {
        if (confirm("Tem certeza que deseja limpar TODO o histórico de combates e o ranking geral? Esta ação é irreversível.")) {
            await clearAllData();
            displayCombatHistory();
        }
    });
}

// Event listener para o registro de participante (mostrar aviões na tela)
if (registerParticipantBtn) {
    registerParticipantBtn.addEventListener('click', async () => {
        const name = participantNameInput.value.trim();
        const loyalty = parseInt(loyaltyInput.value);

        if (!name) {
            alert("Por favor, digite seu Nick para entrar no combate.");
            return;
        }
        if (isNaN(loyalty) || loyalty < 0 || loyalty > 1000) {
            alert("Por favor, insira um valor de Lealdade válido (número entre 0 e 1000).");
            return;
        }

        await registerParticipant(name, loyalty);
        // A lógica de exibir aviões após o registro agora está dentro de `registerParticipant`
        // ela garante que os aviões apareçam SOMENTE se não houver combate ativo.
    });
}


// Adiciona botões de login/logout
if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        window.location.href = '/login';
    });
}

if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        window.location.href = '/logout';
    });
}

// Função para exibir o histórico de combates
async function displayCombatHistory() {
    combatHistoryList.innerHTML = '';
    const history = await fetchCombatHistory();

    if (history.length === 0) {
        combatHistoryList.innerHTML = '<p>Nenhum combate registrado ainda.</p>';
        return;
    }

    history.forEach((entry, index) => {
        const historyEntryDiv = document.createElement('div');
        historyEntryDiv.className = 'history-entry';
        historyEntryDiv.innerHTML = `<h4>Combate ${history.length - index} - ${entry.timestamp}</h4>`;
        const ul = document.createElement('ul');

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
initializeGameData();
gameLoop(); // Inicia o loop para que os aviões se movam mesmo sem combate ativo