// src/controllers/gameController.js
const { v4: uuidv4 } = require('uuid');
const Participant = require('../models/Participant');
const Tournament = require('../models/Tournament');
const dataHandler = require('../utils/dataHandler');
const fs = require('fs');
const path = require('path');

let io;
let participants = [];
let tournament = new Tournament();

let eventData = dataHandler.readEventDates();

const PARTICIPANTS_BACKUP_FILE = path.join(__dirname, '../data/participantsBackup.json');

const ADM_USERNAME = 'admoceano'; // Nome de usuário do ADM
const ADM_PASSWORD = '4107';   // Senha do ADM

// --- Login do ADM ---
const adminLogin = (req, res) => {
    const { username, password } = req.body;
    if (username === ADM_USERNAME && password === ADM_PASSWORD) {
        // Em um ambiente real, você geraria um token de sessão aqui.
        // Por simplicidade, vamos apenas enviar um status de sucesso.
        res.status(200).json({ message: 'Login ADM bem-sucedido!', success: true });
    } else {
        res.status(401).json({ message: 'Credenciais ADM inválidas.', success: false });
    }
};


const setIoInstance = (socketIoInstance) => {
    io = socketIoInstance;
    console.log('Socket.IO instance set in gameController.');
};

const registerParticipant = (req, res) => {
    const { nick, loyalty } = req.body;

    if (!nick || !loyalty) {
        return res.status(400).json({ message: 'Nick e Lealdade são obrigatórios.' });
    }

    if (participants.some(p => p.nick.toLowerCase() === nick.toLowerCase())) {
        return res.status(400).json({ message: 'Este Nick já está em uso. Por favor, escolha outro.' });
    }

    const recentParticipant = eventData.recentParticipants.find(p => p.nick.toLowerCase() === nick.toLowerCase());
    if (recentParticipant) {
        const tempParticipant = new Participant(null, nick, loyalty, recentParticipant.lastParticipation);
        if (tempParticipant.isOnCooldown()) {
            console.log(`Participante ${nick} está em cooldown e será ignorado.`);
            return res.status(200).json({ message: 'Registro ignorado: participante em cooldown.' });
        }
    }

    const newParticipant = new Participant(uuidv4(), nick, loyalty);
    participants.push(newParticipant);
    console.log('Novo participante registrado:', newParticipant.nick);

    io.emit('participantRegistered', {
        id: newParticipant.id,
        nick: newParticipant.nick,
        loyalty: newParticipant.loyalty,
        message: `Novo participante: ${newParticipant.nick}!`
    });

    // Atualiza o estado do torneio para todos os clientes, mostrando o novo participante
    io.emit('tournamentStateUpdate', tournament.getTournamentState());

    res.status(200).json({ participantId: newParticipant.id, message: 'Participante registrado com sucesso!' });
};

const submitEmojiSequence = (req, res) => {
    const { participantId, sequence } = req.body;

    const participant = participants.find(p => p.id === participantId);

    if (!participant) {
        return res.status(404).json({ message: 'Participante não encontrado.' });
    }
    if (!Array.isArray(sequence) || sequence.length !== 5) {
        return res.status(400).json({ message: 'Sequência de emojis inválida.' });
    }

    if (participant.setEmojiSequence(sequence)) {
        console.log(`Sequência de emojis recebida para ${participant.nick}: ${sequence.join('')}`);
        
        tournament.addPlayer(participant); // Adiciona ao torneio
        
        io.emit('emojiSequenceSubmitted', {
            participantId: participant.id,
            nick: participant.nick,
            sequence: participant.emojiSequence
        });

        // Atualiza o estado do torneio para todos os clientes
        io.emit('tournamentStateUpdate', tournament.getTournamentState());

        res.status(200).json({ message: 'Sequência registrada com sucesso.', participant: participant });
    } else {
        res.status(400).json({ message: 'Não foi possível definir a sequência de emojis.' });
    }
};

const startTournamentFirstRound = (req, res) => {
    const result = tournament.startFirstRound();
    if (result.success) {
        // Redefine a sequência alvo do torneio para garantir que é aleatória no início de cada torneio
        tournament.secretTargetSequence = tournament.generateRandomTargetSequence();
        io.emit('tournamentStarted', tournament.getTournamentState());
        res.status(200).json(result);
    } else {
        res.status(400).json(result);
    }
};

const sortAndAdvanceRound = (req, res) => {
    const matchesToResolve = tournament.matches.filter(m => !m.winnerId);
    let resolvedCount = 0;
    const resolvedMatchesData = [];

    matchesToResolve.forEach((match) => {
        const originalMatchIndex = tournament.matches.findIndex(m => m === match);
        if (originalMatchIndex !== -1) {
            const result = tournament.resolveMatch(originalMatchIndex);
            if (result.success) {
                resolvedCount++;
                resolvedMatchesData.push(result);
            }
        }
    });

    if (resolvedCount === 0 && matchesToResolve.length > 0) {
        return res.status(400).json({ message: "Nenhuma partida pôde ser resolvida. Verifique os dados dos jogadores." });
    }
    
    const allMatchesResolved = tournament.matches.every(m => m.winnerId !== null);
    let nextRoundResult = null;
    if (allMatchesResolved) {
        nextRoundResult = tournament.nextRound();

        // Lógica de avanço automático se houver 15 ou mais participantes
        if (tournament.players.length >= 15 && tournament.status === 'in_progress' && nextRoundResult.success) {
            // Chama a si mesma novamente para avançar a próxima rodada
            // Isso pode levar a múltiplos eventos de tournamentStateUpdate
            // Idealmente, seria um loop controlando para não causar estouro de pilha
            // Por enquanto, uma chamada recursiva simples (para fins de exemplo)
            // Em produção, considere um agendador ou um loop com limite.
            if (nextRoundResult.message !== "Torneio finalizado.") {
                // Atraso para visualização no frontend antes de chamar novamente
                setTimeout(() => {
                    sortAndAdvanceRound(req, res); // Chama novamente para avançar
                }, 1000); // 1 segundo de atraso entre rodadas
            }
        }
    } else if (matchesToResolve.length === 0 && tournament.status === 'in_progress') {
        return res.status(200).json({ message: "Todas as partidas da rodada já foram resolvidas. Clique novamente para avançar rodada.", tournamentState: tournament.getTournamentState() });
    }

    io.emit('tournamentStateUpdate', tournament.getTournamentState());
    io.emit('matchesResolved', resolvedMatchesData);

    if (nextRoundResult && nextRoundResult.winner) {
        io.emit('tournamentWinner', { winner: { nick: nextRoundResult.winner.nick, id: nextRoundResult.winner.id } });
        
        const now = new Date().toISOString();
        eventData.lastEventDate = now;
        tournament.players.forEach(p => {
            eventData.recentParticipants = eventData.recentParticipants.filter(rp => rp.nick.toLowerCase() !== p.nick.toLowerCase());
            eventData.recentParticipants.push({ nick: p.nick, lastParticipation: now });
        });
        dataHandler.writeEventDates(eventData);
    }
    
    res.status(200).json({ 
        message: "Rodada processada e, se aplicável, avançada.", 
        resolvedMatches: resolvedMatchesData,
        nextRoundResult: nextRoundResult,
        tournamentState: tournament.getTournamentState()
    });
};

const resetTournament = (req, res) => {
    tournament.resetTournament();
    participants = [];
    io.emit('tournamentReset', tournament.getTournamentState());
    res.status(200).json({ message: "Torneio e participantes resetados com sucesso!" });
};

const setAdminTargetSequence = (req, res) => {
    const { sequence } = req.body;
    if (tournament.setTargetSequence(sequence)) {
        io.emit('tournamentStateUpdate', tournament.getTournamentState());
        res.status(200).json({ message: "Sequência alvo definida com sucesso!", targetSequence: tournament.secretTargetSequence });
    } else {
        res.status(400).json({ message: "Sequência alvo inválida." });
    }
};

const addParticipantsFromJson = (req, res) => {
    const { participantsJson } = req.body;
    
    if (!participantsJson || !Array.isArray(participantsJson)) {
        return res.status(400).json({ message: 'JSON de participantes inválido. Deve ser um array.' });
    }

    let addedCount = 0;
    let ignoredCount = 0;

    participantsJson.forEach(pData => {
        const { nick, loyalty, emojiSequence, lastParticipationDate } = pData;

        if (!nick || typeof loyalty !== 'number' || !Array.isArray(emojiSequence) || emojiSequence.length !== 5) {
            console.warn(`Dados de participante inválidos no JSON para ${nick || 'sem nick'}. Ignorado.`);
            ignoredCount++;
            return;
        }

        if (participants.some(p => p.nick.toLowerCase() === nick.toLowerCase())) {
            console.warn(`Participante ${nick} já está no torneio atual. Ignorado.`);
            ignoredCount++;
            return;
        }

        const recentParticipant = eventData.recentParticipants.find(rp => rp.nick.toLowerCase() === nick.toLowerCase());
        let finalLastParticipationDate = lastParticipationDate;
        if (recentParticipant) {
             finalLastParticipationDate = recentParticipant.lastParticipation;
        }

        const tempParticipant = new Participant(uuidv4(), nick, loyalty, finalLastParticipationDate);
        if (tempParticipant.isOnCooldown()) {
            console.log(`Participante ${nick} do JSON está em cooldown e será ignorado.`);
            ignoredCount++;
            return;
        }

        const newParticipant = new Participant(tempParticipant.id, nick, loyalty, finalLastParticipationDate);
        newParticipant.setEmojiSequence(emojiSequence);

        participants.push(newParticipant);
        tournament.addPlayer(newParticipant);
        addedCount++;
    });

    io.emit('tournamentStateUpdate', tournament.getTournamentState());
    res.status(200).json({ 
        message: `Participantes adicionados: ${addedCount}. Participantes ignorados: ${ignoredCount}.`,
        addedCount,
        ignoredCount,
        tournamentState: tournament.getTournamentState()
    });
};

const getRecentParticipants = (req, res) => {
    res.status(200).json(eventData.recentParticipants);
};

const getParticipantsBackup = (req, res) => {
    try {
        const data = fs.readFileSync(PARTICIPANTS_BACKUP_FILE, 'utf8');
        res.status(200).json(JSON.parse(data));
    } catch (error) {
        res.status(500).json({ message: 'Erro ao carregar participantsBackup.json', error: error.message });
    }
};


module.exports = {
    setIoInstance,
    adminLogin, // Adicionado login do ADM
    registerParticipant,
    submitEmojiSequence,
    startTournamentFirstRound,
    sortAndAdvanceRound,
    resetTournament,
    setAdminTargetSequence,
    addParticipantsFromJson,
    getRecentParticipants,
    getParticipantsBackup,
    getTournamentState: () => tournament.getTournamentState(),
    getParticipants: () => participants,
    getTournament: () => tournament
};