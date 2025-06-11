const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;

// Servir arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Lista de emojis (você pode adicionar mais)
const emojis = ['😀', '😂', '❤️', '👍', '🎉', '😊', '🥳', '😍', '😎', '🤔', '👏', '🙏', '✨', '🔥', '💯', '🚀', '🎁', '🎈', '⚽', '🎮', '🍕', '🎵', '💡', '🌈', '⭐', '🌙', '🌍', '🌳', '🐶', '🐱'];

// Dados do administrador (em um cenário real, use um banco de dados ou variáveis de ambiente)
const adminCredenciais = {
    login: 'admoceano',
    senha: '4107'
};
let adminLogado = false; // Indica se algum admin está logado
let ganhadores = [];
let participantes = {}; // Armazena { socketId: { nick: '...', lealdade: '...' }}
let numeroDeGanhadores = 1; // Definido pelo admin
let emojiAlvo = gerarEmojisAleatorios(5); // Emojis que os jogadores devem tentar combinar

function gerarEmojisAleatorios(quantidade) {
    const resultado = [];
    for (let i = 0; i < quantidade; i++) {
        resultado.push(emojis[Math.floor(Math.random() * emojis.length)]);
    }
    return resultado;
}

io.on('connection', (socket) => {
    console.log('Novo jogador conectado:', socket.id);
    participantes[socket.id] = { nick: '', lealdade: '', id: socket.id }; // Armazena o ID também
    
    // Envia o emoji alvo e o estado atual dos participantes ao novo jogador
    socket.emit('emojiAlvo', emojiAlvo);
    io.emit('atualizarParticipantes', participantes);

    socket.on('registrarNick', (data) => {
        // Verifica se o nick já existe para este socket.id (evita re-registro)
        if (participantes[socket.id]) {
            participantes[socket.id].nick = data.nick;
            participantes[socket.id].lealdade = data.lealdade;
            console.log('Jogador registrado/atualizado:', participantes[socket.id]);
            io.emit('atualizarParticipantes', participantes); // Atualiza para todos
        }
    });

    socket.on('jogar', () => {
        const emojisJogador = gerarEmojisAleatorios(5);
        socket.emit('resultadoJogada', emojisJogador);
        // Lógica de comparação com o emoji alvo será implementada futuramente aqui
        // Exemplo simples de como você pode comparar (para futura implementação):
        // const acertos = emojisJogador.filter((emoji, index) => emoji === emojiAlvo[index]).length;
        // console.log(`Jogador ${participantes[socket.id].nick} acertou ${acertos} emojis.`);
    });

    socket.on('adminLogin', (data) => {
        if (data.login === adminCredenciais.login && data.senha === adminCredenciais.senha) {
            adminLogado = true; // Define o estado de login do admin
            socket.emit('loginSucessoAdmin');
            atualizarDadosAdmin(socket); // Envia os dados iniciais do admin
        } else {
            socket.emit('loginFalhaAdmin');
        }
    });

    socket.on('definirGanhadores', (quantidade) => {
        if (adminLogado) { // Verifica se o admin está logado para permitir a ação
            numeroDeGanhadores = parseInt(quantidade);
            io.emit('numeroDeGanhadoresDefinido', numeroDeGanhadores); // Notifica todos os clientes
            console.log('Número de ganhadores definido para:', numeroDeGanhadores);
        }
    });

    socket.on('adicionarParticipanteAdmin', (data) => {
        if (adminLogado) {
            const novoId = 'admin_' + Math.random().toString(36).substring(2, 8); // Gera um ID único simples
            participantes[novoId] = { nick: data.nick, lealdade: data.lealdade, id: novoId };
            io.emit('atualizarParticipantes', participantes);
            console.log('Participante adicionado pelo admin:', participantes[novoId]);
        }
    });

    socket.on('excluirParticipanteAdmin', (id) => {
        if (adminLogado && participantes[id]) {
            const nickExcluido = participantes[id].nick;
            delete participantes[id];
            io.emit('atualizarParticipantes', participantes);
            console.log(`Participante ${nickExcluido} (ID: ${id}) excluído pelo admin.`);
        }
    });

    socket.on('definirEmojiAlvoAdmin', () => {
        if (adminLogado) {
            emojiAlvo = gerarEmojisAleatorios(5);
            io.emit('emojiAlvo', emojiAlvo); // Notifica todos sobre o novo alvo
            console.log('Novo emoji alvo definido pelo admin:', emojiAlvo);
        }
    });

    socket.on('listarGanhadoresAdmin', () => {
        if (adminLogado) {
            socket.emit('ganhadoresAtualizados', ganhadores); // Envia a lista atual de ganhadores para o admin
        }
    });

    socket.on('adicionarGanhadorAdmin', (jogadorId) => {
        if (adminLogado && participantes[jogadorId] && ganhadores.length < numeroDeGanhadores) {
            const nickGanhador = participantes[jogadorId].nick;
            if (!ganhadores.includes(nickGanhador)) { // Evita duplicidade de nick na lista de ganhadores
                ganhadores.push(nickGanhador);
                io.emit('ganhadoresAtualizados', ganhadores); // Atualiza a lista para todos
                console.log(`Ganhador ${nickGanhador} adicionado pelo admin.`);
            } else {
                console.log(`Tentativa de adicionar ganhador duplicado: ${nickGanhador}`);
            }
        } else if (adminLogado && ganhadores.length >= numeroDeGanhadores) {
            console.log('Limite de ganhadores atingido.');
        } else if (adminLogado) {
            console.log(`Participante com ID ${jogadorId} não encontrado.`);
        }
    });

    socket.on('excluirGanhadorAdmin', (index) => {
        if (adminLogado && ganhadores[index]) {
            const ganhadorExcluido = ganhadores[index];
            ganhadores.splice(index, 1);
            io.emit('ganhadoresAtualizados', ganhadores);
            console.log(`Ganhador ${ganhadorExcluido} (índice ${index}) excluído pelo admin.`);
        }
    });

    socket.on('disconnect', () => {
        console.log('Jogador desconectado:', socket.id);
        delete participantes[socket.id];
        io.emit('atualizarParticipantes', participantes); // Atualiza a lista para todos
    });
});

// Função auxiliar para enviar todos os dados de estado para o cliente admin recém-logado
function atualizarDadosAdmin(socket) {
    socket.emit('numeroDeGanhadoresDefinido', numeroDeGanhadores);
    socket.emit('ganhadoresAtualizados', ganhadores);
    socket.emit('atualizarParticipantes', participantes);
    socket.emit('emojiAlvo', emojiAlvo);
}

server.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});