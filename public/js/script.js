const socket = io(); // Conecta ao servidor Socket.IO
const emojisJogadorDiv = document.getElementById('emojis-jogador');
const emojisAlvoDiv = document.getElementById('emojis-alvo');
const listaParticipantesDiv = document.getElementById('lista-participantes');
const listaGanhadoresDiv = document.getElementById('lista-ganhadores');
const adminAreaDiv = document.getElementById('admin-area');
const loginAdminDiv = document.getElementById('login-admin');
const mensagemAdminDiv = document.getElementById('mensagem-admin');
const nickInput = document.getElementById('nick');
const lealdadeInput = document.getElementById('lealdade');

let jogadorId; // Armazena o ID do socket do jogador atual

// Evento disparado quando o cliente se conecta ao Socket.IO
socket.on('connect', () => {
    jogadorId = socket.id;
    console.log('Conectado ao servidor com ID:', jogadorId);
});

// Atualiza a exibição dos emojis alvo
socket.on('emojiAlvo', (emojis) => {
    emojisAlvoDiv.textContent = emojis.join(' ');
});

// Atualiza a exibição dos emojis do jogador após uma jogada
socket.on('resultadoJogada', (emojis) => {
    emojisJogadorDiv.textContent = emojis.join(' ');
});

// Atualiza a lista de participantes na tela
socket.on('atualizarParticipantes', (participantes) => {
    listaParticipantesDiv.innerHTML = ''; // Limpa a lista existente
    for (const id in participantes) {
        const participante = participantes[id];
        const div = document.createElement('div');
        div.classList.add('participante-item');

        const textSpan = document.createElement('span');
        textSpan.textContent = `${participante.nick} (${participante.lealdade || 'Sem Lealdade'})`;
        
        const idSpan = document.createElement('span');
        idSpan.textContent = `ID: ${id}`;
        idSpan.style.fontSize = '0.8em'; 
        idSpan.style.color = '#666';
        idSpan.style.marginLeft = '10px'; // Espaço entre nome e ID

        div.appendChild(textSpan);
        div.appendChild(idSpan);

        // Adiciona o botão de excluir APENAS se a área do admin estiver visível (logado)
        if (adminAreaDiv.style.display === 'block') {
            const excluirBotao = document.createElement('button');
            excluirBotao.textContent = 'Excluir';
            excluirBotao.onclick = () => excluirParticipante(id);
            div.appendChild(excluirBotao);
        }
        listaParticipantesDiv.appendChild(div);
    }
});

// Notificação sobre o número de ganhadores definido pelo admin
socket.on('numeroDeGanhadoresDefinido', (numero) => {
    // Isso pode ser um alert ou uma mensagem discreta na tela
    mensagemAdminDiv.textContent = `Admin definiu o número de ganhadores para: ${numero}`;
    setTimeout(() => mensagemAdminDiv.textContent = '', 5000); // Limpa a mensagem após 5s
});

// Atualiza a lista de ganhadores na tela
socket.on('ganhadoresAtualizados', (ganhadores) => {
    listaGanhadoresDiv.innerHTML = ''; // Limpa a lista existente
    if (ganhadores.length === 0) {
        listaGanhadoresDiv.textContent = 'Nenhum ganhador ainda.';
        return;
    }
    const ul = document.createElement('ul');
    ganhadores.forEach((ganhador, index) => {
        const li = document.createElement('li');
        li.textContent = `${ganhador} (Índice para excluir: ${index})`;
        ul.appendChild(li);
    });
    listaGanhadoresDiv.appendChild(ul);
});

// Evento de sucesso no login do admin
socket.on('loginSucessoAdmin', () => {
    loginAdminDiv.style.display = 'none'; // Esconde a tela de login
    adminAreaDiv.style.display = 'block'; // Mostra o painel de administração
    mensagemAdminDiv.textContent = 'Login de administrador realizado com sucesso!';
    mensagemAdminDiv.style.color = '#28a745'; // Verde para sucesso
    // Atualiza a lista de participantes e ganhadores para mostrar os botões de admin
    // Isso é feito pelo server quando o admin loga com `atualizarDadosAdmin`
});

// Evento de falha no login do admin
socket.on('loginFalhaAdmin', () => {
    mensagemAdminDiv.textContent = 'Falha no login de administrador. Verifique as credenciais.';
    mensagemAdminDiv.style.color = '#dc3545'; // Vermelho para falha
});

// --- Funções para interação do Jogador ---
function registrarNick() {
    const nick = nickInput.value.trim(); // Remove espaços em branco
    const lealdade = lealdadeInput.value.trim();
    if (nick) {
        socket.emit('registrarNick', { nick, lealdade });
        document.getElementById('cadastro').style.display = 'none'; // Esconde o cadastro após registrar
    } else {
        alert('Por favor, digite um nick para se cadastrar.');
    }
}

function jogar() {
    // Verifica se o nick foi registrado antes de jogar
    if (!nickInput.value.trim()) {
        alert('Por favor, cadastre seu nick antes de jogar!');
        return;
    }
    socket.emit('jogar');
}

// Escuta a tecla espaço para jogar
document.addEventListener('keydown', (event) => {
    if (event.key === ' ') {
        jogar();
    }
});

// --- Funções para interação do Admin ---
function loginAdmin() {
    const login = document.getElementById('admin-login').value;
    const senha = document.getElementById('admin-senha').value;
    socket.emit('adminLogin', { login, senha });
}

function definirGanhadores(quantidade) {
    socket.emit('definirGanhadores', quantidade);
}

function adicionarParticipante() {
    const nick = document.getElementById('novo-nick').value.trim();
    const lealdade = document.getElementById('nova-lealdade').value.trim();
    if (nick) {
        socket.emit('adicionarParticipanteAdmin', { nick, lealdade });
        // Limpa os campos após adicionar
        document.getElementById('novo-nick').value = '';
        document.getElementById('nova-lealdade').value = '';
    } else {
        alert('Por favor, digite um nick para o novo participante.');
    }
}

function excluirParticipante(id) {
    if (confirm(`Tem certeza que deseja excluir o participante com ID: ${id}?`)) {
        socket.emit('excluirParticipanteAdmin', id);
    }
}

function adicionarGanhador() {
    const jogadorId = document.getElementById('jogador-ganhador').value.trim();
    if (jogadorId) {
        socket.emit('adicionarGanhadorAdmin', jogadorId);
        document.getElementById('jogador-ganhador').value = '';
    } else {
        alert('Por favor, digite o ID do jogador para adicionar como ganhador.');
    }
}

function excluirGanhador() {
    const index = document.getElementById('indice-ganhador').value.trim();
    if (index !== '') {
        socket.emit('excluirGanhadorAdmin', parseInt(index));
        document.getElementById('indice-ganhador').value = '';
    } else {
        alert('Por favor, digite o índice do ganhador para excluir.');
    }
}

function listarGanhadores() {
    socket.emit('listarGanhadoresAdmin');
}

function definirNovoEmojiAlvo() {
    socket.emit('definirEmojiAlvoAdmin');
}