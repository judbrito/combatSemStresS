// src/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const gameRoutes = require('./routes/gameRoutes');
const gameController = require('./controllers/gameController');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

gameController.setIoInstance(io);

app.use(express.json());
const PORT = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname, '../public')));

app.use('/api', gameRoutes);

io.on('connection', (socket) => {
    console.log('Novo cliente conectado via Socket.IO:', socket.id);
    socket.emit('message', 'Bem-vindo ao Sorteador de Emojis SemStresS!');
    socket.emit('tournamentStateUpdate', gameController.getTournamentState()); // Envia o estado atual
});

server.listen(PORT, () => {
    console.log(`Servidor Sorteador de Emojis rodando na porta http://localhost:${PORT}`);
});