// --- Elementos do DOM ---
const gameCanvas = document.getElementById('gameCanvas'); // Se você estiver usando um canvas, caso contrário ignore
const ctx = gameCanvas ? gameCanvas.getContext('2d') : null; // Contexto 2D para o canvas

// Painéis
const controlPanel = document.querySelector('.control-panel');
const reportPanel = document.getElementById('report-panel');
const historyPanel = document.getElementById('history-panel');
const rankPanel = document.getElementById('rank-panel'); // Painel do ranking geral

// Elementos do painel de controle
const startGameBtn = document.getElementById('startGameBtn'); // Só existe se for admin
const showHistoryBtn = document.getElementById('showHistoryBtn');
const loginBtn = document.getElementById('loginBtn'); // Só existe se não for admin
const logoutBtn = document.getElementById('logoutBtn'); // Só existe se for admin

// Novos elementos para registro de participante
const participantNameInput = document.getElementById('participantNameInput');
const loyaltyInput = document.getElementById('loyaltyInput');
const registerParticipantBtn = document.getElementById('registerParticipantBtn');

// NOVOS ELEMENTOS PARA ADMIN - ADICIONAR MÚLTIPLOS PARTICIPANTES
const multipleParticipantsInput = document.getElementById('multipleParticipantsInput');
const addMultipleParticipantsBtn = document.getElementById('addMultipleParticipantsBtn');

// Elementos do painel de relatório
const survivorsList = document.getElementById('survivors-list');
const finalRankList = document.getElementById('final-rank-list');
const closeReportBtn = document.getElementById('closeReportBtn');

// Elementos do painel de histórico
const combatHistoryList = document.getElementById('combat-history-list');
const closeHistoryBtn = document.getElementById('closeHistoryBtn');
const clearHistoryBtn = document.getElementById('clearHistoryBtn'); // Só existe se for admin

// Elementos do painel de ranking
const rankListElement = document.getElementById('rank-list');

// Elemento para o placar ao vivo (novo)
let liveScoreboardDiv = document.createElement('div');
liveScoreboardDiv.id = 'live-scoreboard';
liveScoreboardDiv.style.position = 'absolute';
liveScoreboardDiv.style.top = '10px';
liveScoreboardDiv.style.right = '10px';
liveScoreboardDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
liveScoreboardDiv.style.color = 'white';
liveScoreboardDiv.style.padding = '10px';
liveScoreboardDiv.style.borderRadius = '5px';
liveScoreboardDiv.style.zIndex = '1000';
liveScoreboardDiv.style.display = 'none'; // Escondido por padrão
document.body.appendChild(liveScoreboardDiv); // Adiciona ao body

// --- Variáveis de Controle e Dados do Jogo ---
let combatStarted = false;
let gameLoopId;
let currentCombatMode = null; // 'admin' ou 'vs_ia'

const PLANES_PER_PARTICIPANT = 5; // Cada participante humano tem 5 aviões
const PLANES_PER_AI_TEAM = 10;   // A IA tem 10 aviões
const POINTS_PER_HIT = 100; // Pontos por tiro acertado (ajustado para ser um número redondo e fácil de ver)

// Alterado para um Map para facilitar o acesso e manipulação de jogadores
let registeredPlayers = new Map(); // Armazena { name: { score: X, loyalty: Y, airplanesAlive: Z, currentRoundScore: 0, isAI: false } }
let currentCombatPlayers = []; // Jogadores ativos na rodada atual (inclui IA temporariamente para cálculo)
const allAirplanes = []; // Armazena TODOS os aviões na tela (incluindo IA)
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

const AIRPLANE_HEALTH = 10; // HP inicial dos aviões

// Nomes de IA para os aviões (para exibir sobre o avião, não no ranking geral persistente)
const aiPersonNames = [
    "Alice", "Bob", "Carlos", "Diana", "Eduardo", "Fernanda", "Gustavo", "Helena",
    "Ivan", "Julia", "Kleber", "Laura", "Marcelo", "Nadia", "Otavio", "Patrícia",
    "Quinn", "Renato", "Sofia", "Tiago", "Úrsula", "Victor", "Wendell", "Xena",
    "Yago", "Zara", "Arthur", "Beatriz", "Caio", "Débora", "Enzo", "Fabiana"
];

// --- Funções de Comunicação com o Backend (API Calls) ---

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
            // Garante que a IA não é enviada para o backend
            body: JSON.stringify({ ranking: ranking.filter(p => !p.isAI) })
        });
        const data = await response.json();
        if (data.status !== 'success') {
            alert('Erro ao salvar resultados: ' + data.message);
            console.error('Erro ao salvar resultados:', data.message);
        } else {
            await initializeGameData(); // Recarrega o ranking global completo do DB
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
    if (!confirm('Tem certeza que deseja apagar todo o histórico de combates e o ranking geral? Esta ação é irreversível.')) {
        return; // Usuário cancelou
    }
    try {
        const response = await fetch('/clear_data', { method: 'POST' });
        const data = await response.json();
        if (data.status === 'success') {
            alert(data.message);
            await initializeGameData(); // Recarrega o ranking e histórico após limpar
            clearAllEntities(); // Limpa a tela também
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
            // Atualiza o mapa registeredPlayers com o jogador, garantindo isAI: false
            registeredPlayers.set(data.participant.name, {
                name: data.participant.name,
                score: data.participant.score || 0, // Pega o score existente do DB, ou 0 se novo
                loyalty: data.participant.loyalty,
                airplanesAlive: 0,
                currentRoundScore: 0,
                isAI: false // Certifica que é um jogador humano
            });
            alert(data.message);
            await initializeGameData(); // Recarrega para garantir que o ranking global esteja atualizado
            return true; // Retorna sucesso
        } else {
            alert('Erro ao registrar: ' + data.message);
            return false; // Retorna falha
        }
    } catch (error) {
        console.error('Erro de rede ao registrar participante:', error);
        alert('Erro de rede ao tentar registrar participante.');
        return false; // Retorna falha
    }
}

// NOVA FUNÇÃO: Adicionar Múltiplos Participantes para Admin
async function addMultipleParticipants() {
    const nicksRaw = multipleParticipantsInput.value.trim();
    if (!nicksRaw) {
        alert('Por favor, insira os nicks dos participantes.');
        return;
    }

    // A API do backend já faz o split por vírgula ou nova linha
    try {
        const response = await fetch('/admin/add_multiple_participants', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nicks: nicksRaw })
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert(data.message);
            multipleParticipantsInput.value = ''; // Limpa o textarea
            await initializeGameData(); // Recarrega o ranking global
        } else {
            alert('Erro ao adicionar participantes: ' + data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao adicionar múltiplos participantes:', error);
        alert('Erro de rede ao tentar adicionar múltiplos participantes.');
    }
}

// --- Funções de Inicialização e Atualização de Dados ---

async function initializeGameData() {
    const globalRanking = await fetchGlobalRanking();
    registeredPlayers.clear(); // Limpa o mapa existente

    globalRanking.forEach(p => {
        registeredPlayers.set(p.nick, { // Usa 'nick' conforme o backend retorna
            name: p.nick, // 'nick' é o nome do jogador
            score: p.pontos_totais, // 'pontos_totais' é o score
            loyalty: p.lealdade || 500, // 'lealdade' é a lealdade, com fallback
            airplanesAlive: 0,
            currentRoundScore: 0,
            isAI: false // Jogadores do ranking global são sempre humanos
        });
    });
    updateRankDisplay(); // Atualiza o painel de ranking geral
}

// Atualiza a exibição do ranking geral
function updateRankDisplay() {
    rankListElement.innerHTML = '';
    const sortedPlayers = Array.from(registeredPlayers.values())
        .filter(p => !p.isAI) // **Filtra apenas jogadores humanos para o ranking geral persistente**
        .sort((a, b) => {
            if (b.score !== a.score) {
                return b.score - a.score; // Ordena por pontos totais (score)
            }
            return b.loyalty - a.loyalty; // Em caso de empate, ordena por lealdade
        });

    if (sortedPlayers.length === 0) {
        const listItem = document.createElement('li');
        listItem.textContent = "Nenhum jogador no ranking ainda.";
        rankListElement.appendChild(listItem);
        return;
    }

    sortedPlayers.forEach((player, index) => {
        const listItem = document.createElement('li');
        // Exibe nick, lealdade e pontos totais
        listItem.innerHTML = `
            <span class="rank-position">${index + 1}.</span>
            <span class="rank-nick">${player.name}</span>
            <span class="rank-loyalty">(Lealdade: ${player.loyalty})</span>
            <span class="rank-points">Pontos: ${player.score}</span>
        `;
        rankListElement.appendChild(listItem);
    });
}

// --- Funções de Renderização e Lógica do Jogo ---

function getAirplaneSVG(color) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${encodeURIComponent(color)}" d="M22,16.21V14l-8-5V3.5A1.5,1.5,0,0,0,12.5,2h-1A1.5,1.5,0,0,0,10,3.5V9l-8,5V16.21L10,14v4l-2,1.5V22l3.5-1,3.5,1V20.5L14,18V14Z"/></svg>`;
}

// Cria um único avião e o adiciona à tela
function createSingleAirplane(playerOwner, index, isAI = false) {
    const airplaneContainer = document.createElement('div');
    airplaneContainer.className = 'airplane';

    const airplaneImage = document.createElement('div');
    airplaneImage.className = 'airplane-image';

    const color = isAI ? AI_COLOR : playerColors[Array.from(registeredPlayers.keys()).indexOf(playerOwner.name) % playerColors.length];
    airplaneImage.style.backgroundImage = `url('${getAirplaneSVG(color)}')`;

    const airplaneNameElement = document.createElement('div');
    airplaneNameElement.className = 'airplane-name';
    // Se for IA, usa o nome da pessoa aleatório. Se for jogador, usa nome do jogador e número.
    airplaneNameElement.textContent = isAI ? `${playerOwner.name}` : `${playerOwner.name}-${index + 1}`;


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
    const speed = 2 + Math.random() * 2; // Aviões se movem entre 2 e 4 de velocidade

    document.body.appendChild(airplaneContainer);

    const airplane = {
        id: airplaneNameElement.textContent, // ID único para o avião
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
        shootTimer: Math.random() * 2000 + 500, // Próximo tiro entre 0.5 e 2.5 segundos
        playerOwner: playerOwner, // Referência ao objeto do jogador/IA
        isAI: isAI // Atributo para identificar aviões da IA
    };

    allAirplanes.push(airplane);
    // Incrementa a contagem de aviões vivos para o playerOwner no `currentCombatPlayers`
    if (playerOwner.isAI) { // Para IA, precisamos encontrar ou criar o registro temporário
        let aiPlayerInCombat = currentCombatPlayers.find(p => p.name === playerOwner.name && p.isAI);
        if (!aiPlayerInCombat) {
            aiPlayerInCombat = { ...playerOwner, airplanesAlive: 0 }; // Cria uma cópia se não existir
            currentCombatPlayers.push(aiPlayerInCombat);
        }
        aiPlayerInCombat.airplanesAlive++;
    } else { // Para humanos, o playerOwner já está no registeredPlayers e currentCombatPlayers
        playerOwner.airplanesAlive++;
    }
    return airplane;
}

// Remove todos os aviões e mísseis da tela
function clearAllEntities() {
    // Remove os elementos do DOM
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

    // Limpa os arrays
    allAirplanes.length = 0;
    missiles.length = 0;

    // Reseta a contagem de aviões vivos e scores da rodada para todos os jogadores no `registeredPlayers`
    // e também para os placeholders da IA no `currentCombatPlayers`
    currentCombatPlayers.forEach(player => {
        player.airplanesAlive = 0;
        player.currentRoundScore = 0;
    });

    // Reseta currentCombatPlayers para evitar que jogadores de combates anteriores fiquem ativos
    currentCombatPlayers = [];
    
    // Esconde o placar ao vivo
    liveScoreboardDiv.style.display = 'none';

    updateRankDisplay(); // Atualiza a exibição do ranking geral (que não exibe contagem de aviões)
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
                airplane.shootTimer = Math.random() * 1000 + 500; // Próximo tiro entre 0.5 e 1.5 segundos
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

    const missileX = airplane.x + 40 - (missile.offsetWidth / 2); // Centraliza no avião
    const missileY = airplane.y + 50 - (missile.offsetHeight / 2); // Centraliza no avião

    missile.style.left = `${missileX}px`;
    missile.style.top = `${missileY}px`;

    let potentialTargets = [];
    if (currentCombatMode === 'vs_ia') {
        // Se é vs IA: jogadores atiram em IA, IA atira em jogadores. Sem fogo amigo entre jogadores/IA.
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
        // Se não há alvos (todos inimigos foram destruídos), míssil não é disparado
        return;
    }

    const speed = 10 + Math.random() * 5; // Mísseis se movem entre 10 e 15 de velocidade

    document.body.appendChild(missile);

    missiles.push({
        element: missile,
        x: missileX,
        y: missileY,
        speed,
        angle,
        owner: airplane // Quem disparou o míssil (o objeto avião completo)
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
                if ((missile.owner.isAI && !airplane.isAI) || (!missile.owner.isAI && airplane.isAI)) {
                    isTargetValid = true;
                }
            } else if (currentCombatMode === 'admin') {
                // Modo Admin: todos contra todos (aviões de um mesmo jogador podem se atingir)
                // O único filtro é não atingir a si mesmo.
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
                // Apenas jogadores humanos ganham pontos no seu currentRoundScore
                if (!missile.owner.isAI) {
                    const ownerPlayer = registeredPlayers.get(missile.owner.playerOwner.name);
                    if (ownerPlayer) {
                        ownerPlayer.currentRoundScore += POINTS_PER_HIT; // Adiciona ao score da rodada
                    }
                }
                
                // Atualiza o placar ao vivo imediatamente
                updateLiveScoreboard();

                if (airplane.health <= 0) {
                    createExplosion(airplane.x + 20, airplane.y + 30, airplane.color);
                    airplane.container.remove();
                    // Remove do allAirplanes
                    const airplaneIndex = allAirplanes.indexOf(airplane);
                    if (airplaneIndex > -1) {
                        allAirplanes.splice(airplaneIndex, 1);
                    }
                    // Decrementa aviões vivos do dono, seja humano ou IA
                    if (airplane.playerOwner.isAI) {
                        let aiPlayerInCombat = currentCombatPlayers.find(p => p.name === airplane.playerOwner.name && p.isAI);
                        if (aiPlayerInCombat) {
                            aiPlayerInCombat.airplanesAlive--;
                        }
                    } else {
                        airplane.playerOwner.airplanesAlive--; // Decrementa diretamente para humanos
                    }
                    updateLiveScoreboard(); // Atualiza o placar ao vivo
                }

                i--; // Decrementa i porque um elemento foi removido
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

// Atualiza o placar ao vivo no canto superior direito
function updateLiveScoreboard() {
    liveScoreboardDiv.innerHTML = '<h3>Placar Atual</h3>';
    let scoreboardHtml = '<ul>';

    // Para o placar ao vivo, vamos mostrar todos os participantes que estão no combate, incluindo as IAs.
    // Primeiro, computa os scores atuais e aviões vivos para todos os `currentCombatPlayers`
    const playersForLiveScoreboard = currentCombatPlayers.map(p => ({
        name: p.name,
        score: p.currentRoundScore, // Score desta rodada
        airplanesAlive: p.airplanesAlive,
        isAI: p.isAI
    }));

    // Ordena por score da rodada decrescente
    playersForLiveScoreboard.sort((a, b) => b.score - a.score);

    playersForLiveScoreboard.forEach(p => {
        // Identifica claramente se é IA no placar ao vivo
        const nameDisplay = p.isAI ? `${p.name} (IA)` : p.name;
        scoreboardHtml += `<li>${nameDisplay}: Abates ${p.score} | Aviões Vivos ${p.airplanesAlive}</li>`;
    });

    scoreboardHtml += '</ul>';
    liveScoreboardDiv.innerHTML += scoreboardHtml;
    liveScoreboardDiv.style.display = 'block'; // Garante que o placar esteja visível
}


// Função para verificar o fim do combate e exibir relatório
async function checkCombatEndAndShowReport() {
    // Conta os aviões de jogadores (não IA) e aviões de IA que estão ativos na tela
    const humanPlanesRemaining = allAirplanes.filter(a => !a.isAI && a.health > 0).length;
    const aiPlanesRemaining = allAirplanes.filter(a => a.isAI && a.health > 0).length;

    let combatEnded = false;
    let message = "Combate encerrado!";

    if (currentCombatMode === 'admin') {
        const uniqueHumanPlayersWithPlanes = new Set(allAirplanes.filter(a => !a.isAI && a.health > 0).map(a => a.playerOwner.name));
        if (uniqueHumanPlayersWithPlanes.size <= 1 && humanPlanesRemaining > 0) {
            // Se resta apenas um jogador humano ou zero (se for 0, o próximo 'else if' pega)
            message = `Vitória do esquadrão "${Array.from(uniqueHumanPlayersWithPlanes)[0]}"!`;
            combatEnded = true;
        } else if (humanPlanesRemaining === 0) {
            message = "Todos os esquadrões humanos foram abatidos!";
            combatEnded = true;
        } else if (allAirplanes.length === 0) { // Todos os aviões de todos (incluindo IAs se existirem no modo admin) foram destruídos
            message = "Todos os aviões foram abatidos!";
            combatEnded = true;
        }
    } else if (currentCombatMode === 'vs_ia') {
        if (humanPlanesRemaining === 0 && aiPlanesRemaining === 0) {
            message = "Empate! Todos os aviões foram abatidos.";
            combatEnded = true;
        } else if (humanPlanesRemaining === 0) {
            message = "Derrota! Seus aviões foram abatidos pela IA.";
            combatEnded = true;
        } else if (aiPlanesRemaining === 0) {
            message = "Vitória! Você aniquilou a IA!";
            combatEnded = true;
        }
    }

    if (combatEnded) {
        cancelAnimationFrame(gameLoopId);
        combatStarted = false;
        gameLoopId = null; // Reseta para permitir um novo gameLoop()

        // Prepara os resultados para salvar (apenas jogadores humanos)
        const roundRankingToSave = Array.from(registeredPlayers.values())
            .filter(p => !p.isAI && (p.currentRoundScore > 0 || p.airplanesAlive > 0)) // Inclui quem fez pontos ou sobreviveu e não é IA
            .map(p => ({
                name: p.name,
                score: p.currentRoundScore, // Salva o score DESTA RODADA
                loyalty: p.loyalty, // Inclui a lealdade do jogador
                airplanesAlive: p.airplanesAlive, // Para exibição no relatório
                isAI: p.isAI || false // Garante que a IA seja marcada corretamente, mesmo que filtrada no save
            }));

        // Salva os resultados no backend (ele já filtra a IA)
        await saveCombatResults(roundRankingToSave);

        // Prepara e exibe o relatório
        survivorsList.innerHTML = '';
        const survivingHumanPlayerPlanes = allAirplanes.filter(a => a.health > 0 && !a.isAI);
        const survivingAIPlanes = allAirplanes.filter(a => a.health > 0 && a.isAI);

        if (survivingHumanPlayerPlanes.length > 0) {
            const survivorsMap = new Map();
            survivingHumanPlayerPlanes.forEach(airplane => {
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
            listItem.textContent = "Nenhum avião de participante humano sobreviveu!";
            survivorsList.appendChild(listItem);
        }

        // Adiciona um separador e exibe o status da IA se ela estava no combate
        if (currentCombatPlayers.some(p => p.isAI)) { // Verifica se havia alguma IA no combate
            const hr = document.createElement('hr');
            hr.style.borderColor = '#555';
            survivorsList.appendChild(hr);
            const aiStatusItem = document.createElement('li');
            aiStatusItem.textContent = `Status da IA: ${survivingAIPlanes.length > 0 ? `${survivingAIPlanes.length} aviões restantes` : 'Todos os aviões da IA foram abatidos!'}`;
            survivorsList.appendChild(aiStatusItem);
        }

        finalRankList.innerHTML = '';
        // Usa o roundRankingToSave (pontos desta rodada, já filtrados para humanos) para o ranking da rodada no relatório
        const sortedRoundRankingForDisplay = [...roundRankingToSave].sort((a, b) => b.score - a.score);
        if (sortedRoundRankingForDisplay.length > 0) {
            sortedRoundRankingForDisplay.forEach(player => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `${player.name}: <span class="player-score">${player.score}</span>`;
                finalRankList.appendChild(listItem);
            });
        } else {
            const listItem = document.createElement('li');
            listItem.textContent = "Nenhum participante humano pontuou nesta rodada.";
            finalRankList.appendChild(listItem);
        }

        reportPanel.style.display = 'flex'; // Exibe o painel de relatório
        clearAllEntities(); // Limpa a tela após o relatório para preparar para o próximo combate
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
document.addEventListener('DOMContentLoaded', async () => {
    // Ajusta as dimensões da tela
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;

    // Esconde painéis de relatório e histórico no início
    reportPanel.style.display = 'none';
    historyPanel.style.display = 'none';
    liveScoreboardDiv.style.display = 'none'; // Garante que o placar ao vivo esteja escondido

    // Garante que o painel de controle e ranking estejam visíveis
    controlPanel.style.display = 'block';
    rankPanel.style.display = 'block';

    await initializeGameData(); // Carrega o ranking geral e inicializa jogadores

    // Admin: Iniciar Combate com Jogadores Registrados na tela
    if (startGameBtn) { // Só existe se for admin
        startGameBtn.addEventListener('click', async () => {
            if (combatStarted) {
                alert("Um combate já está em andamento! Espere terminar ou atualize a página.");
                return;
            }

            // Pega todos os jogadores humanos que já foram registrados no `registeredPlayers`
            // E garante que suas propriedades de combate sejam resetadas
            currentCombatPlayers = Array.from(registeredPlayers.values()).filter(p => !p.isAI);

            if (currentCombatPlayers.length < 1) {
                alert("Admin: Nenhum participante humano registrado para o combate oficial. Por favor, registre um ou mais jogadores.");
                return;
            }

            clearAllEntities(); // Limpa todos os aviões antigos e reseta scores da rodada
            combatStarted = true;
            currentCombatMode = 'admin'; // Define o modo de combate para 'admin'

            // Cria os aviões para CADA jogador humano registrado
            currentCombatPlayers.forEach(player => {
                player.airplanesAlive = 0; // Zera para a nova rodada
                player.currentRoundScore = 0; // Zera o score da rodada para o início do combate
                for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                    createSingleAirplane(player, i, false); // false para não ser IA
                }
            });

            // Opcional: Admin pode adicionar IAs para um combate misto (humanos + IAs)
            // Aqui adicionamos uma única equipe de IA para o modo admin também, se desejado.
            // Se você quiser que o Admin inicie um combate SÓ entre humanos, remova este bloco.
            const aiTeamName = aiPersonNames[Math.floor(Math.random() * aiPersonNames.length)] + " (IA)";
            const aiPlayer = { name: aiTeamName, score: 0, loyalty: 0, airplanesAlive: 0, currentRoundScore: 0, isAI: true };
            currentCombatPlayers.push(aiPlayer); // Adiciona ao currentCombatPlayers para placar ao vivo
            for (let j = 0; j < PLANES_PER_AI_TEAM; j++) {
                createSingleAirplane(aiPlayer, j, true);
            }

            updateLiveScoreboard(); // Atualiza o placar ao vivo
            gameLoop(); // Inicia o loop do jogo
        });
    }

    // Registro de Participante (individual vs IA)
    registerParticipantBtn.addEventListener('click', async () => {
        if (combatStarted) {
            alert("Um combate já está em andamento! Por favor, aguarde o término ou recarregue a página.");
            return;
        }

        const name = participantNameInput.value.trim();
        const loyalty = parseInt(loyaltyInput.value);

        if (!name) {
            alert("Por favor, insira seu Nick.");
            return;
        }
        if (isNaN(loyalty) || loyalty < 0 || loyalty > 1000) {
            alert("Por favor, insira um valor de lealdade entre 0 e 1000.");
            return;
        }

        const registrationSuccess = await registerParticipant(name, loyalty);
        if (registrationSuccess) {
            clearAllEntities(); // Limpa todos os aviões e reinicia scores da rodada

            // Garante que o jogador recém-registrado está no currentCombatPlayers para esta rodada
            const playerToCombat = registeredPlayers.get(name);
            if (playerToCombat) {
                playerToCombat.airplanesAlive = 0;
                playerToCombat.currentRoundScore = 0;
                currentCombatPlayers = [playerToCombat]; // Apenas este jogador humano
            } else {
                alert("Erro interno: Jogador não encontrado após registro.");
                return;
            }

            combatStarted = true;
            currentCombatMode = 'vs_ia'; // Define o modo de combate para 'vs_ia'

            // Cria aviões para o jogador humano
            for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                createSingleAirplane(playerToCombat, i, false);
            }

            // Cria aviões para a IA
            const aiTeamName = aiPersonNames[Math.floor(Math.random() * aiPersonNames.length)] + " (IA)";
            const aiPlayer = { name: aiTeamName, score: 0, loyalty: 0, airplanesAlive: 0, currentRoundScore: 0, isAI: true };
            currentCombatPlayers.push(aiPlayer); // Adiciona a IA aos jogadores do combate atual
            for (let i = 0; i < PLANES_PER_AI_TEAM; i++) {
                createSingleAirplane(aiPlayer, i, true);
            }

            updateLiveScoreboard(); // Exibe o placar ao vivo
            gameLoop(); // Inicia o loop do jogo
        }
    });

    // Evento para "Adicionar Múltiplos Participantes" (somente para admin)
    if (addMultipleParticipantsBtn) {
        addMultipleParticipantsBtn.addEventListener('click', addMultipleParticipants);
    }

    // Evento para mostrar histórico de combates
    showHistoryBtn.addEventListener('click', async () => {
        const history = await fetchCombatHistory();
        combatHistoryList.innerHTML = ''; // Limpa a lista existente

        if (history.length === 0) {
            combatHistoryList.innerHTML = '<p>Nenhum histórico de combate encontrado.</p>';
        } else {
            history.forEach(combat => {
                const combatDiv = document.createElement('div');
                combatDiv.className = 'combat-entry';
                combatDiv.innerHTML = `<h4>Combate em ${combat.timestamp}</h4>`;
                
                const ul = document.createElement('ul');
                combat.ranking.forEach(player => {
                    const li = document.createElement('li');
                    li.textContent = `${player.name}: ${player.score} pontos (${player.airplanesAlive || 0} aviões restantes)`;
                    ul.appendChild(li);
                });
                combatDiv.appendChild(ul);
                combatHistoryList.appendChild(combatDiv);
            });
        }
        historyPanel.style.display = 'flex';
        controlPanel.style.display = 'none';
        rankPanel.style.display = 'none'; // Esconde o ranking geral ao ver o histórico
    });

    // Evento para fechar painel de relatório
    closeReportBtn.addEventListener('click', () => {
        reportPanel.style.display = 'none';
        controlPanel.style.display = 'block';
        rankPanel.style.display = 'block'; // Mostra o ranking geral novamente
    });

    // Evento para fechar painel de histórico
    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.style.display = 'none';
        controlPanel.style.display = 'block';
        rankPanel.style.display = 'block'; // Mostra o ranking geral novamente
    });

    // Evento para limpar todos os dados (somente para admin)
    if (clearHistoryBtn) { // Só existe se for admin
        clearHistoryBtn.addEventListener('click', clearAllData);
    }

    // Lidar com botões de login/logout
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

    // Inicia o loop do jogo uma vez, ele só fará algo se combatStarted for true
    gameLoop();
});

// Ajustar as dimensões da tela se a janela for redimensionada
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    // Opcional: Reposicionar aviões para ficarem dentro da nova área visível
    allAirplanes.forEach(airplane => {
        airplane.x = Math.max(0, Math.min(airplane.x, screenWidth - 80));
        airplane.y = Math.max(0, Math.min(airplane.y, screenHeight - 100));
        airplane.container.style.left = `${airplane.x}px`;
        airplane.container.style.top = `${airplane.y}px`;
    });
});