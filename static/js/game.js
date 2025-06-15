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

// NOVO: NOVOS ELEMENTOS PARA ADMIN - ADICIONAR MÚLTIPLOS PARTICIPANTES E JSON
const multipleParticipantsInput = document.getElementById('multipleParticipantsInput');
const multipleParticipantsPointsInput = document.getElementById('multipleParticipantsPointsInput'); // NOVO: Input para pontos
const addMultipleParticipantsBtn = document.getElementById('addMultipleParticipantsBtn');

const importJsonInput = document.getElementById('importJsonInput'); // NOVO: Input para JSON de importação
const importJsonBtn = document.getElementById('importJsonBtn'); // NOVO: Botão para importar JSON
const exportJsonOutput = document.getElementById('exportJsonOutput'); // NOVO: Output para JSON de exportação
const exportJsonBtn = document.getElementById('exportJsonBtn'); // NOVO: Botão para exportar JSON


// NOVO: NOVOS ELEMENTOS PARA ADMIN - ADICIONAR MÚLTIPLOS PARTICIPANTES E JSON
const multipleParticipantsInput = document.getElementById('multipleParticipantsInput');
const multipleParticipantsPointsInput = document.getElementById('multipleParticipantsPointsInput'); // NOVO: Input para pontos
const addMultipleParticipantsBtn = document.getElementById('addMultipleParticipantsBtn');

const importJsonInput = document.getElementById('importJsonInput'); // NOVO: Input para JSON de importação
const importJsonBtn = document.getElementById('importJsonBtn'); // NOVO: Botão para importar JSON
const exportJsonOutput = document.getElementById('exportJsonOutput'); // NOVO: Output para JSON de exportação
const exportJsonBtn = document.getElementById('exportJsonBtn'); // NOVO: Botão para exportar JSON


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
const PLANES_PER_AI_TEAM = 10;   // A IA tem 10 aviões
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
            // Atualiza o mapa registeredPlayers com o jogador, garantindo isAI: false e score inicial 0
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

<<<<<<< HEAD
// ATUALIZADO: Adicionar Múltiplos Participantes para Admin (agora com pontos)
async function addMultipleParticipants() {
    const nicksRaw = multipleParticipantsInput.value.trim();
    const pointsRaw = multipleParticipantsPointsInput.value.trim();

    if (!nicksRaw) {
        alert('Por favor, insira os nicks dos participantes.');
        return;
    }

    const nicks = nicksRaw.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== '');
    const points = pointsRaw.split(/[\n,]+/).map(p => parseInt(p.trim())).filter(p => !isNaN(p));

    if (nicks.length !== points.length && points.length !== 0) { // Se points.length for 0, usa 0 para todos.
        alert('O número de nicks e pontos não corresponde. Certifique-se de que cada nick tem um ponto correspondente ou deixe o campo de pontos vazio para usar 0.');
        return;
    }

    // Criar um array de objetos para enviar ao backend
    const participantsData = nicks.map((nick, index) => ({
        name: nick,
        loyalty: 500, // Lealdade padrão para novos participantes adicionados pelo admin, ou ajuste se quiser outro campo
        score: points[index] !== undefined ? points[index] : 0 // Usa o ponto fornecido ou 0
    }));
    
    try {
        const response = await fetch('/admin/add_multiple_participants', {
=======
<<<<<<< HEAD
async function registerBulkParticipants(participantsData) {
    try {
        const response = await fetch('/register_bulk_participants', {
=======
// ATUALIZADO: Adicionar Múltiplos Participantes para Admin (agora com pontos)
async function addMultipleParticipants() {
    const nicksRaw = multipleParticipantsInput.value.trim();
    const pointsRaw = multipleParticipantsPointsInput.value.trim();

    if (!nicksRaw) {
        alert('Por favor, insira os nicks dos participantes.');
        return;
    }

    const nicks = nicksRaw.split(/[\n,]+/).map(n => n.trim()).filter(n => n !== '');
    const points = pointsRaw.split(/[\n,]+/).map(p => parseInt(p.trim())).filter(p => !isNaN(p));

    if (nicks.length !== points.length && points.length !== 0) { // Se points.length for 0, usa 0 para todos.
        alert('O número de nicks e pontos não corresponde. Certifique-se de que cada nick tem um ponto correspondente ou deixe o campo de pontos vazio para usar 0.');
        return;
    }

    // Criar um array de objetos para enviar ao backend
    const participantsData = nicks.map((nick, index) => ({
        name: nick,
        loyalty: 500, // Lealdade padrão para novos participantes adicionados pelo admin, ou ajuste se quiser outro campo
        score: points[index] !== undefined ? points[index] : 0 // Usa o ponto fornecido ou 0
    }));
    
    try {
        const response = await fetch('/admin/add_multiple_participants', {
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
<<<<<<< HEAD
            body: JSON.stringify({ participants: participantsData }) // Envia um array de objetos
=======
<<<<<<< HEAD
            body: JSON.stringify({ participants: participantsData })
=======
            body: JSON.stringify({ participants: participantsData }) // Envia um array de objetos
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert(data.message);
<<<<<<< HEAD
            multipleParticipantsInput.value = ''; // Limpa os textareas
            multipleParticipantsPointsInput.value = '';
            await initializeGameData(); // Recarrega o ranking global
=======
<<<<<<< HEAD
            await initializeGameData(); // Recarrega para garantir que o ranking global esteja atualizado
            return true;
>>>>>>> 47e96ba (foi)
        } else {
            alert('Erro ao adicionar participantes: ' + data.message);
        }
    } catch (error) {
<<<<<<< HEAD
=======
        console.error('Erro de rede ao registrar participantes em massa:', error);
        alert('Erro de rede ao tentar registrar participantes em massa.');
        return false;
=======
            multipleParticipantsInput.value = ''; // Limpa os textareas
            multipleParticipantsPointsInput.value = '';
            await initializeGameData(); // Recarrega o ranking global
        } else {
            alert('Erro ao adicionar participantes: ' + data.message);
        }
    } catch (error) {
>>>>>>> 47e96ba (foi)
        console.error('Erro de rede ao adicionar múltiplos participantes:', error);
        alert('Erro de rede ao tentar adicionar múltiplos participantes.');
    }
}

// NOVO: Função para importar ranking via JSON
async function importRankingJson() {
    const jsonString = importJsonInput.value.trim();
    if (!jsonString) {
        alert('Por favor, insira os dados JSON para importar.');
        return;
    }

    try {
        const parsedJson = JSON.parse(jsonString);
        // Validar o formato do JSON (opcional, mas recomendado)
        if (!Array.isArray(parsedJson) || !parsedJson.every(item => item.nome && typeof item.lealdade === 'number' && typeof item.pontos === 'number')) {
            alert('Formato JSON inválido. Esperado um array de objetos como: [{"nome": "NICK", "lealdade": 100, "pontos": 50}]');
            return;
        }

        const response = await fetch('/admin/import_ranking', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ranking_data: parsedJson })
        });
        const data = await response.json();
        if (data.status === 'success') {
            alert(data.message);
            importJsonInput.value = ''; // Limpa o textarea
            await initializeGameData(); // Recarrega o ranking global
        } else {
            alert('Erro ao importar ranking: ' + data.message);
        }
    } catch (error) {
        console.error('Erro ao parsear JSON ou de rede ao importar ranking:', error);
        alert('Erro ao parsear JSON ou de rede: ' + error.message);
    }
}

// NOVO: Função para exportar ranking para JSON
async function exportRankingJson() {
    try {
        const response = await fetch('/get_global_ranking'); // Usa a mesma API que busca o ranking
        const data = await response.json();
        if (data.status === 'success') {
            // O backend já retorna no formato desejado: [{"nick": "ROBOCOP", "lealdade": 103, "pontos_totais": 50}]
            // Para corresponder ao formato do exemplo no HTML, podemos renomear as chaves se necessário.
            const formattedRanking = data.ranking.map(item => ({
                nome: item.nick,
                lealdade: item.lealdade,
                pontos: item.pontos_totais // Ajusta para 'pontos' conforme o exemplo do HTML
            }));
            exportJsonOutput.value = JSON.stringify(formattedRanking, null, 2); // Formata com indentação de 2 espaços
            alert('Ranking exportado com sucesso para o campo de texto abaixo.');
        } else {
            alert('Erro ao exportar ranking: ' + data.message);
        }
    } catch (error) {
        console.error('Erro de rede ao exportar ranking:', error);
        alert('Erro de rede ao tentar exportar ranking.');
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
    }
}


// --- Funções de Inicialização e Atualização de Dados ---

async function initializeGameData() {
    const globalRanking = await fetchGlobalRanking();
    registeredPlayers.clear(); // Limpa o mapa existente

    globalRanking.forEach(p => {
<<<<<<< HEAD
=======
<<<<<<< HEAD
        // Garante que o objeto do jogador tem todas as propriedades esperadas, mesmo que não venham do DB
        registeredPlayers.set(p.name, {
            name: p.name,
            score: p.score || 0,
            loyalty: p.loyalty || 500, // Usa a lealdade do DB, ou 500 como padrão
            airplanesAlive: 0, // Resetado para 0 para o estado inicial
            currentRoundScore: 0, // Resetado para 0 para o estado inicial
=======
>>>>>>> 47e96ba (foi)
        registeredPlayers.set(p.nick, { // Usa 'nick' conforme o backend retorna
            name: p.nick, // 'nick' é o nome do jogador
            score: p.pontos_totais || 0, // 'pontos_totais' é o score, com fallback para 0
            loyalty: p.lealdade || 500, // 'lealdade' é a lealdade, com fallback
            airplanesAlive: 0,
            currentRoundScore: 0,
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
            isAI: false // Jogadores do ranking global são sempre humanos
        });
    });
    updateRankDisplay(); // Atualiza o painel de ranking geral
}

// ATUALIZADO: Atualiza a exibição do ranking geral para incluir lealdade e pontos de combate
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
<<<<<<< HEAD
=======
<<<<<<< HEAD
        // Exibe o score acumulado (score)
        listItem.innerHTML = `${index + 1}. <span style="color: white;">${player.name}</span>: <span class="player-score" style="color: yellow;">${player.score}</span> (Lealdade: <span class="loyalty-number" style="color: limegreen;">${player.loyalty}</span>)`;
=======
>>>>>>> 47e96ba (foi)
        // Usando as novas classes CSS para cores específicas
        listItem.innerHTML = `
            <span class="rank-position">${index + 1}.</span>
            <span class="rank-nick">${player.name}</span>
            <span class="rank-loyalty">Lealdade: ${player.loyalty}</span>
            <span class="rank-points">Pontos: ${player.score}</span>
        `;
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
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

<<<<<<< HEAD
=======
<<<<<<< HEAD
        // Certifique-se de que playerOwner e playerOwner.name estão definidos
        if (!playerOwner || !playerOwner.name) {
            console.error("Erro: playerOwner ou playerOwner.name indefinido ao criar avião.", playerOwner);
            return null; // Retorna nulo se o playerOwner não for válido
=======
>>>>>>> 47e96ba (foi)
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
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
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

<<<<<<< HEAD
=======
<<<<<<< HEAD
    // currentCombatPlayers será re-populado no início de cada novo combate.
    // Isso evita que o "currentCombatPlayers (FINAL, com IA): Array(1)" ocorra.
    // CORREÇÃO: Removi a linha 'currentCombatPlayers = []' daqui, pois ela já está no início dos event listeners
    // Isso garante que `currentCombatPlayers` só seja zerado no INÍCIO de um novo combate, não no meio/final da limpeza.
    // A redefinição de currentCombatPlayers DEVE ocorrer APENAS no clique do startGameBtn ou registerParticipantBtn.
=======
>>>>>>> 47e96ba (foi)
    // Reseta a contagem de aviões vivos e scores da rodada para todos os jogadores no `currentCombatPlayers`
    currentCombatPlayers.forEach(player => {
        player.airplanesAlive = 0;
        player.currentRoundScore = 0;
    });
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)

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

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
>>>>>>> 47e96ba (foi)
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

<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)

// Função para verificar o fim do combate e exibir relatório
async function checkCombatEndAndShowReport() {
    // Conta os aviões de jogadores (não IA) e aviões de IA que estão ativos na tela
    const humanPlanesRemaining = allAirplanes.filter(a => !a.isAI && a.health > 0).length;
    const aiPlanesRemaining = allAirplanes.filter(a => a.isAI && a.health > 0).length;

    let combatEnded = false;
    let message = "Combate encerrado!";

    if (currentCombatMode === 'admin') {
        const uniqueHumanPlayersWithPlanes = new Set(allAirplanes.filter(a => !a.isAI && a.health > 0).map(a => a.playerOwner.name));
<<<<<<< HEAD
        if (uniqueHumanPlayersWithPlanes.size <= 1 && humanPlanesRemaining > 0) {
            // Se resta apenas um jogador humano ou zero (se for 0, o próximo 'else if' pega)
            message = `Vitória do esquadrão "${Array.from(uniqueHumanPlayersWithPlanes)[0]}"!`;
            combatEnded = true;
        } else if (humanPlanesRemaining === 0 && aiPlanesRemaining === 0) { // Todos os aviões de todos foram destruídos
            message = "Todos os aviões foram abatidos!";
            combatEnded = true;
        } else if (allAirplanes.length === 0) { // redundante, mas para garantir
            message = "Todos os aviões foram abatidos!";
            combatEnded = true;
        }
    } else if (currentCombatMode === 'vs_ia') {
=======
<<<<<<< HEAD
        const totalHumanPlayersInCombat = currentCombatPlayers.filter(p => !p.isAI).length;
        const aiTeamPresent = currentCombatPlayers.some(p => p.isAI);

        // Cenário 1: Todos os aviões humanos foram abatidos
        if (humanPlanesRemaining === 0) {
            message = "Todos os esquadrões humanos foram abatidos!";
            combatEnded = true;
        }
        // Cenário 2: Todos os aviões da IA foram abatidos (se a IA estava presente)
        else if (aiTeamPresent && aiPlanesRemaining === 0) {
            // Se resta mais de um jogador humano, é vitória dos humanos.
            // Se resta apenas um jogador humano, é vitória desse esquadrão contra a IA.
            if (uniqueHumanPlayersWithPlanes.size > 0) { // Garante que ainda há humanos ativos
                const winningHumanSquads = Array.from(uniqueHumanPlayersWithPlanes).join(', ');
                message = `A IA foi aniquilada! Vitória dos esquadrões humanos: ${winningHumanSquads}!`;
            } else {
                 message = "A IA foi aniquilada! Mas nenhum esquadrão humano sobreviveu para reivindicar a vitória.";
            }
=======
        if (uniqueHumanPlayersWithPlanes.size <= 1 && humanPlanesRemaining > 0) {
            // Se resta apenas um jogador humano ou zero (se for 0, o próximo 'else if' pega)
            message = `Vitória do esquadrão "${Array.from(uniqueHumanPlayersWithPlanes)[0]}"!`;
            combatEnded = true;
        } else if (humanPlanesRemaining === 0 && aiPlanesRemaining === 0) { // Todos os aviões de todos foram destruídos
            message = "Todos os aviões foram abatidos!";
            combatEnded = true;
        } else if (allAirplanes.length === 0) { // redundante, mas para garantir
            message = "Todos os aviões foram abatidos!";
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
            combatEnded = true;
        }
        // Cenário 3: Resta apenas um esquadrão humano e havia múltiplos jogadores humanos no início
        else if (uniqueHumanPlayersWithPlanes.size === 1 && totalHumanPlayersInCombat > 1) {
            // Verifica se a IA já foi derrotada ou se não havia IA
            if (!aiTeamPresent || aiPlanesRemaining === 0) {
                message = `Vitória do esquadrão "${Array.from(uniqueHumanPlayersWithPlanes)[0]}"!`;
                combatEnded = true;
            }
            // Se ainda tem IA e apenas 1 humano, o combate continua.
        }
        // Cenário 4: Não há mais aviões de ninguém (empate geral)
        else if (allAirplanes.length === 0) { // humanPlanesRemaining === 0 && aiPlanesRemaining === 0
            message = "Empate! Todos os aviões foram abatidos.";
            combatEnded = true;
        }

    } else if (currentCombatMode === 'vs_ia') { // Modo de combate 1 jogador humano vs IA
>>>>>>> 47e96ba (foi)
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
<<<<<<< HEAD
                loyalty: p.loyalty, // Inclui a lealdade do jogador
                airplanesAlive: p.airplanesAlive, // Para exibição no relatório
                isAI: p.isAI || false // Garante que a IA seja marcada corretamente, mesmo que filtrada no save
=======
<<<<<<< HEAD
                airplanesAlive: p.airplanesAlive // Para exibição no relatório
=======
                loyalty: p.loyalty, // Inclui a lealdade do jogador
                airplanesAlive: p.airplanesAlive, // Para exibição no relatório
                isAI: p.isAI || false // Garante que a IA seja marcada corretamente, mesmo que filtrada no save
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
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

<<<<<<< HEAD
        // Adiciona um separador e exibe o status da IA se ela estava no combate
        if (currentCombatPlayers.some(p => p.isAI)) { // Verifica se havia alguma IA no combate
=======
<<<<<<< HEAD
        // Add a separator and display AI status if AI was in combat
        if (currentCombatPlayers.some(p => p.isAI)) { // Check if AI was part of this combat
=======
        // Adiciona um separador e exibe o status da IA se ela estava no combate
        if (currentCombatPlayers.some(p => p.isAI)) { // Verifica se havia alguma IA no combate
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
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
                alert('O combate já está em andamento!');
                return;
            }

<<<<<<< HEAD
            // Popula currentCombatPlayers apenas com jogadores humanos do registeredPlayers
            currentCombatPlayers = Array.from(registeredPlayers.values()).filter(p => !p.isAI);
            
=======
<<<<<<< HEAD
            // CORREÇÃO: Garante que currentCombatPlayers é uma *nova* array com cópias dos jogadores.
            // Isso evita que as referências sejam compartilhadas ou que o array seja manipulado de forma inesperada.
            // Também inicializa airplanesAlive e currentRoundScore para a nova rodada.
            currentCombatPlayers = Array.from(registeredPlayers.values()).filter(p => !p.isAI)
                                    .map(p => ({
                                        ...p,
                                        airplanesAlive: 0,
                                        currentRoundScore: 0
                                    }));

            console.log("DEBUG: currentCombatPlayers ANTES de criar aviões (Humanos):", currentCombatPlayers);

            if (currentCombatPlayers.length < 1) {
                alert("Admin: Nenhum participante humano registrado para o combate oficial. Por favor, registre um ou mais jogadores.");
                return;
            }

            // CORREÇÃO: Chamando clearAllEntities *antes* de tentar criar novos aviões
            // para garantir que a tela esteja limpa e allAirplanes esteja vazio.
            clearAllEntities(); 
            
            combatStarted = true;
            currentCombatMode = 'admin'; // Define o modo de combate para 'admin'
=======
            // Popula currentCombatPlayers apenas com jogadores humanos do registeredPlayers
            currentCombatPlayers = Array.from(registeredPlayers.values()).filter(p => !p.isAI);
            
>>>>>>> 47e96ba (foi)
            if (currentCombatPlayers.length === 0) {
                alert('Nenhum participante registrado para iniciar o combate. Por favor, registre participantes ou adicione via Admin.');
                return;
            }

            clearAllEntities(); // Limpa a tela antes de começar um novo combate
<<<<<<< HEAD

            // Cria aviões para cada jogador humano
            currentCombatPlayers.forEach(player => {
                player.airplanesAlive = 0; // Reseta antes de criar
                player.currentRoundScore = 0; // Reseta o score da rodada
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6

            // Cria aviões para cada jogador humano
            currentCombatPlayers.forEach(player => {
<<<<<<< HEAD
=======
                player.airplanesAlive = 0; // Reseta antes de criar
                player.currentRoundScore = 0; // Reseta o score da rodada
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
                for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                    createSingleAirplane(player, i);
                }
            });

<<<<<<< HEAD
            currentCombatMode = 'admin'; // Define o modo de combate
            combatStarted = true;
            alert('Combate OFICIAL iniciado! Boa sorte!');
=======
<<<<<<< HEAD
            console.log("DEBUG: allAirplanes (após criação de aviões humanos):", allAirplanes.filter(a => !a.isAI));
            console.log("DEBUG: total human airplanes in allAirplanes:", allAirplanes.filter(a => !a.isAI).length);


            // Adiciona a IA como oponente padrão no modo admin
            const aiPlayer = {
                name: "AI Team", // Nome genérico para o time da IA
                score: 0,
                loyalty: 0,
                airplanesAlive: 0,
                currentRoundScore: 0,
                isAI: true
            };
            // CORREÇÃO: Garante que estamos ADICIONANDO ao array, não redefinindo.
            currentCombatPlayers.push(aiPlayer); 
            
            for (let j = 0; j < PLANES_PER_AI_TEAM; j++) {
                createSingleAirplane(aiPlayer, j, true);
            }

            console.log("DEBUG: allAirplanes (após criação de aviões de IA):", allAirplanes.filter(a => a.isAI));
            console.log("DEBUG: total AI airplanes in allAirplanes:", allAirplanes.filter(a => a.isAI).length);
            console.log("DEBUG: currentCombatPlayers (FINAL, com IA):", currentCombatPlayers);

            updateLiveScoreboard(); // Exibe o placar ao vivo

            // Inicia o loop do jogo se não estiver rodando
            if (!gameLoopId) {
                gameLoop();
            }
        });
    }

    // Event listener para o registro de participante (mostrar aviões na tela e iniciar combate vs IA)
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

            // Tenta registrar o participante. Se falhar, não inicia o combate.
            const registrationSuccess = await registerParticipant(name, loyalty);
            if (!registrationSuccess) {
                return; // Sai da função se o registro falhou
            }

            if (combatStarted) {
                alert("Um combate já está em andamento! Espere terminar ou atualize a página para iniciar um novo.");
                return;
            }

            let player = registeredPlayers.get(name);
            if (!player) {
                console.error("Erro: Jogador não encontrado no mapa 'registeredPlayers' após o registro.");
                alert("Erro interno: Seu jogador não foi encontrado para iniciar o combate. Tente novamente.");
                return;
            }

            // CORREÇÃO: Chamando clearAllEntities *antes* de tentar criar novos aviões.
            clearAllEntities(); 

            combatStarted = true;
            currentCombatMode = 'vs_ia'; // Define o modo de combate

            currentCombatPlayers = []; // Garante que está limpo antes de adicionar o novo jogador
            // Faz uma cópia do objeto do jogador para o combate, zerando as estatísticas da rodada
            currentCombatPlayers.push({ ...player, airplanesAlive: 0, currentRoundScore: 0 });

            console.log("DEBUG: currentCombatPlayers ANTES de criar aviões (1v1 Humano):", currentCombatPlayers);

            // Cria os aviões do jogador humano
            for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                createSingleAirplane(currentCombatPlayers[0], i, false); // Passa o objeto player do currentCombatPlayers
            }
            console.log("DEBUG: allAirplanes (após criação de aviões 1v1 humano):", allAirplanes.filter(a => !a.isAI));
            console.log("DEBUG: total human airplanes in allAirplanes (1v1):", allAirplanes.filter(a => !a.isAI).length);


            // Cria a equipe de IA para o combate 1v1
            const aiPlayer = {
                name: aiPersonNames[Math.floor(Math.random() * aiPersonNames.length)] + " (IA)",
                score: 0,
                loyalty: 0,
                airplanesAlive: 0,
                currentRoundScore: 0,
                isAI: true
            };
            // CORREÇÃO: Garante que estamos ADICIONANDO ao array, não redefinindo.
            currentCombatPlayers.push(aiPlayer); 

            for (let i = 0; i < PLANES_PER_AI_TEAM; i++) {
                createSingleAirplane(aiPlayer, i, true);
            }
            console.log("DEBUG: allAirplanes (após criação de aviões de IA para 1v1):", allAirplanes.filter(a => a.isAI));
            console.log("DEBUG: total AI airplanes in allAirplanes (1v1):", allAirplanes.filter(a => a.isAI).length);
            console.log("DEBUG: currentCombatPlayers (FINAL, 1v1 com IA):", currentCombatPlayers);


            updateLiveScoreboard(); // Exibe o placar ao vivo

=======
            currentCombatMode = 'admin'; // Define o modo de combate
            combatStarted = true;
            alert('Combate OFICIAL iniciado! Boa sorte!');
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
            if (!gameLoopId) {
                gameLoop(); // Inicia o loop do jogo se não estiver rodando
            }
            updateLiveScoreboard(); // Exibe e atualiza o placar ao vivo
        });
    }

<<<<<<< HEAD
    // Botão para adicionar participante individual (usuário)
    registerParticipantBtn.addEventListener('click', async () => {
        const name = participantNameInput.value.trim();
        const loyalty = parseInt(loyaltyInput.value);
=======
<<<<<<< HEAD
    // Event listener for bulk registration
    if (registerBulkParticipantsBtn) {
        registerBulkParticipantsBtn.addEventListener('click', async () => {
            const bulkData = bulkParticipantsInput.value.trim();
            if (!bulkData) {
                alert('Por favor, cole os dados dos participantes em massa.');
                return;
            }
>>>>>>> 47e96ba (foi)

        if (!name) {
            alert('Por favor, insira seu Nick.');
            return;
        }
        if (isNaN(loyalty) || loyalty < 0 || loyalty > 1000) {
            alert('Lealdade deve ser um número entre 0 e 1000.');
            return;
        }

        // Antes de registrar, verificar se o jogador já está em combate
        if (currentCombatPlayers.some(p => p.name === name && !p.isAI)) {
            alert(`O jogador "${name}" já está no combate atual!`);
            return;
        }

        const success = await registerParticipant(name, loyalty);
        if (success) {
            // Se o registro foi bem-sucedido, adiciona o jogador ao currentCombatPlayers
            const player = registeredPlayers.get(name);
            if (player && !player.isAI) {
                // Adiciona o jogador ao currentCombatPlayers se não estiver lá
                if (!currentCombatPlayers.some(p => p.name === player.name && !p.isAI)) {
                    currentCombatPlayers.push(player);
                }
                
                // Cria os aviões e inicia o combate VS IA
                clearAllEntities(); // Limpa a tela antes de adicionar novos aviões
                
                // Cria aviões do jogador
                player.airplanesAlive = 0; // Reseta antes de criar
                player.currentRoundScore = 0; // Reseta o score da rodada
                for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                    createSingleAirplane(player, i);
                }

                // Cria aviões da IA (um "jogador" IA temporário para gerenciar seus aviões)
                const aiPlayer = { name: "IA Oponente", score: 0, loyalty: 0, airplanesAlive: 0, currentRoundScore: 0, isAI: true };
                // Adiciona a IA ao currentCombatPlayers se ainda não estiver lá
                if (!currentCombatPlayers.some(p => p.name === aiPlayer.name && p.isAI)) {
                    currentCombatPlayers.push(aiPlayer);
                }
                for (let i = 0; i < PLANES_PER_AI_TEAM; i++) {
                    createSingleAirplane(aiPlayer, i, true);
                }

                currentCombatMode = 'vs_ia'; // Define o modo de combate
                combatStarted = true;
                alert('Combate INDIVIDUAL contra a IA iniciado! Boa sorte!');
                if (!gameLoopId) {
                    gameLoop(); // Inicia o loop do jogo se não estiver rodando
                }
                updateLiveScoreboard(); // Exibe e atualiza o placar ao vivo
            }
            participantNameInput.value = ''; // Limpa o campo
            loyaltyInput.value = 500; // Reseta a lealdade
        }
    });

    // NOVO: Event listener para o botão de adicionar múltiplos participantes
    if (addMultipleParticipantsBtn) {
        addMultipleParticipantsBtn.addEventListener('click', addMultipleParticipants);
    }

<<<<<<< HEAD
    // NOVO: Event listener para o botão de importar JSON
    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', importRankingJson);
    }

    // NOVO: Event listener para o botão de exportar JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportRankingJson);
    }

    // Botões de painel (Report, History)
    closeReportBtn.addEventListener('click', () => {
        reportPanel.style.display = 'none';
        // Quando o relatório é fechado, podemos querer que o placar ao vivo também se esconda
        // ou seja preparado para o próximo combate. Ele já é escondido em clearAllEntities().
    });

    showHistoryBtn.addEventListener('click', async () => {
        const history = await fetchCombatHistory();
        combatHistoryList.innerHTML = '';
        if (history.length === 0) {
            const listItem = document.createElement('p');
            listItem.textContent = "Nenhum histórico de combate encontrado.";
            combatHistoryList.appendChild(listItem);
        } else {
            history.forEach(combat => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'history-entry';
                const date = new Date(combat.timestamp).toLocaleString('pt-BR');
                entryDiv.innerHTML = `<h4>Combate em: ${date}</h4>`;
                
                const ul = document.createElement('ul');
                combat.ranking.forEach(player => {
                    const li = document.createElement('li');
                    li.innerHTML = `${player.name}: <span class="player-score">${player.score}</span>`;
                    ul.appendChild(li);
                });
                entryDiv.appendChild(ul);
                combatHistoryList.appendChild(entryDiv);
            });
        }
        historyPanel.style.display = 'flex';
    });

    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.style.display = 'none';
    });
=======
    // Event listeners para painéis e botões gerais
    if (showHistoryBtn) {
        showHistoryBtn.addEventListener('click', async () => {
            const history = await fetchCombatHistory();
            combatHistoryList.innerHTML = '';
            if (history.length > 0) {
                history.forEach(item => {
                    const combatDiv = document.createElement('div');
                    combatDiv.className = 'combat-entry';
                    combatDiv.innerHTML = `<h4>Combate em: ${item.timestamp}</h4>`;
                    const ul = document.createElement('ul');
                    // Exibe o ranking daquele combate específico
                    item.ranking.forEach(p => {
                        const li = document.createElement('li');
                        li.innerHTML = `<span style="color: white;">${p.name}</span> - Score: <span style="color: yellow;">${p.score}</span> - Aviões Sobreviventes: ${p.airplanesAlive || 0}`;
                        ul.appendChild(li);
                    });
                    combatDiv.appendChild(ul);
                    combatHistoryList.appendChild(combatDiv);
=======
    // Botão para adicionar participante individual (usuário)
    registerParticipantBtn.addEventListener('click', async () => {
        const name = participantNameInput.value.trim();
        const loyalty = parseInt(loyaltyInput.value);

        if (!name) {
            alert('Por favor, insira seu Nick.');
            return;
        }
        if (isNaN(loyalty) || loyalty < 0 || loyalty > 1000) {
            alert('Lealdade deve ser um número entre 0 e 1000.');
            return;
        }

        // Antes de registrar, verificar se o jogador já está em combate
        if (currentCombatPlayers.some(p => p.name === name && !p.isAI)) {
            alert(`O jogador "${name}" já está no combate atual!`);
            return;
        }

        const success = await registerParticipant(name, loyalty);
        if (success) {
            // Se o registro foi bem-sucedido, adiciona o jogador ao currentCombatPlayers
            const player = registeredPlayers.get(name);
            if (player && !player.isAI) {
                // Adiciona o jogador ao currentCombatPlayers se não estiver lá
                if (!currentCombatPlayers.some(p => p.name === player.name && !p.isAI)) {
                    currentCombatPlayers.push(player);
                }
                
                // Cria os aviões e inicia o combate VS IA
                clearAllEntities(); // Limpa a tela antes de adicionar novos aviões
                
                // Cria aviões do jogador
                player.airplanesAlive = 0; // Reseta antes de criar
                player.currentRoundScore = 0; // Reseta o score da rodada
                for (let i = 0; i < PLANES_PER_PARTICIPANT; i++) {
                    createSingleAirplane(player, i);
                }

                // Cria aviões da IA (um "jogador" IA temporário para gerenciar seus aviões)
                const aiPlayer = { name: "IA Oponente", score: 0, loyalty: 0, airplanesAlive: 0, currentRoundScore: 0, isAI: true };
                // Adiciona a IA ao currentCombatPlayers se ainda não estiver lá
                if (!currentCombatPlayers.some(p => p.name === aiPlayer.name && p.isAI)) {
                    currentCombatPlayers.push(aiPlayer);
                }
                for (let i = 0; i < PLANES_PER_AI_TEAM; i++) {
                    createSingleAirplane(aiPlayer, i, true);
                }

                currentCombatMode = 'vs_ia'; // Define o modo de combate
                combatStarted = true;
                alert('Combate INDIVIDUAL contra a IA iniciado! Boa sorte!');
                if (!gameLoopId) {
                    gameLoop(); // Inicia o loop do jogo se não estiver rodando
                }
                updateLiveScoreboard(); // Exibe e atualiza o placar ao vivo
            }
            participantNameInput.value = ''; // Limpa o campo
            loyaltyInput.value = 500; // Reseta a lealdade
        }
    });

    // NOVO: Event listener para o botão de adicionar múltiplos participantes
    if (addMultipleParticipantsBtn) {
        addMultipleParticipantsBtn.addEventListener('click', addMultipleParticipants);
    }

    // NOVO: Event listener para o botão de importar JSON
    if (importJsonBtn) {
        importJsonBtn.addEventListener('click', importRankingJson);
    }

    // NOVO: Event listener para o botão de exportar JSON
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportRankingJson);
    }

    // Botões de painel (Report, History)
    closeReportBtn.addEventListener('click', () => {
        reportPanel.style.display = 'none';
        // Quando o relatório é fechado, podemos querer que o placar ao vivo também se esconda
        // ou seja preparado para o próximo combate. Ele já é escondido em clearAllEntities().
    });

    showHistoryBtn.addEventListener('click', async () => {
        const history = await fetchCombatHistory();
        combatHistoryList.innerHTML = '';
        if (history.length === 0) {
            const listItem = document.createElement('p');
            listItem.textContent = "Nenhum histórico de combate encontrado.";
            combatHistoryList.appendChild(listItem);
        } else {
            history.forEach(combat => {
                const entryDiv = document.createElement('div');
                entryDiv.className = 'history-entry';
                const date = new Date(combat.timestamp).toLocaleString('pt-BR');
                entryDiv.innerHTML = `<h4>Combate em: ${date}</h4>`;
                
                const ul = document.createElement('ul');
                combat.ranking.forEach(player => {
                    const li = document.createElement('li');
                    li.innerHTML = `${player.name}: <span class="player-score">${player.score}</span>`;
                    ul.appendChild(li);
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
                });
                entryDiv.appendChild(ul);
                combatHistoryList.appendChild(entryDiv);
            });
        }
        historyPanel.style.display = 'flex';
    });

<<<<<<< HEAD
    if (closeReportBtn) {
        closeReportBtn.addEventListener('click', () => {
            reportPanel.style.display = 'none';
            controlPanel.style.display = 'block';
            rankPanel.style.display = 'block'; // Mostra o painel de ranking geral novamente
            liveScoreboardDiv.style.display = 'none'; // Garante que o placar ao vivo esteja escondido
            updateRankDisplay(); // Atualiza o ranking geral para refletir os novos scores
            const messageElement = reportPanel.querySelector('p'); // Remove the dynamic message
            if (messageElement && messageElement.style.fontWeight === 'bold') {
                messageElement.remove();
            }
        });
    }
=======
    closeHistoryBtn.addEventListener('click', () => {
        historyPanel.style.display = 'none';
    });
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)

    // Limpar Histórico e Ranking (Admin)
    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', clearAllData);
    }

<<<<<<< HEAD
    // Login e Logout de Admin
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const password = prompt('Digite a senha de administrador:');
            if (password) {
                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password: password })
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        alert('Login de administrador bem-sucedido!');
                        window.location.reload(); // Recarrega a página para atualizar o estado do admin
                    } else {
                        alert('Senha incorreta.');
                    }
                } catch (error) {
                    console.error('Erro de rede no login:', error);
                    alert('Erro de rede ao tentar fazer login.');
                }
            }
        });
    }

=======
<<<<<<< HEAD
   // Login/Logout (gerenciado pelo Flask, JS apenas redireciona)
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
    // Adiciona listener para redimensionamento da janela
    window.addEventListener('resize', () => {
        screenWidth = window.innerWidth;
        screenHeight = window.innerHeight;
    });

    // Inicia o loop do jogo (sempre rodando para renderizar)
    // O gameLoop vai rodar, mas só vai atualizar os aviões e mísseis se combatStarted for true.
    if (!gameLoopId) {
=======
    // Login e Logout de Admin
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const password = prompt('Digite a senha de administrador:');
            if (password) {
                try {
                    const response = await fetch('/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ password: password })
                    });
                    const data = await response.json();
                    if (data.status === 'success') {
                        alert('Login de administrador bem-sucedido!');
                        window.location.reload(); // Recarrega a página para atualizar o estado do admin
                    } else {
                        alert('Senha incorreta.');
                    }
                } catch (error) {
                    console.error('Erro de rede no login:', error);
                    alert('Erro de rede ao tentar fazer login.');
                }
            }
        });
    }

>>>>>>> 47e96ba (foi)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', { method: 'POST' });
                const data = await response.json();
                if (data.status === 'success') {
                    alert('Logout de administrador bem-sucedido!');
                    window.location.reload(); // Recarrega a página
                } else {
                    alert('Erro ao fazer logout: ' + data.message);
                }
            } catch (error) {
                console.error('Erro de rede no logout:', error);
                alert('Erro de rede ao tentar fazer logout.');
            }
        });
    }

    // Inicia o game loop se o canvas existe (se o jogo 2D for usado)
    if (gameCanvas) {
<<<<<<< HEAD
=======
>>>>>>> 925581817d14bc4b9bde60d902ae498514840ea6
>>>>>>> 47e96ba (foi)
        gameLoop();
    }
});

// Ajustar as dimensões da tela em redimensionamento
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
});