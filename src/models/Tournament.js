// src/models/Tournament.js

const EMOJIS_SEMESTRESSE = ['😎', '🥳', '🤩', '🤣', '🌴', '🌈', '🎉', '✨', '🧘', '🍾'];
const EMOJIS_ESTRESSADO = ['😩', '🤯', '😭', '😬', '💢', '😵', '👻', '💩', '💣', '🤬'];
const EMOJIS_NEUTROS = ['🤡', '👽', '🐒', '🤪', '👾', '🎲', '💯', '👑', '🚀', '🍌'];
const ALL_EMOJIS = [...EMOJIS_SEMESTRESSE, ...EMOJIS_ESTRESSADO, ...EMOJIS_NEUTROS];


class Tournament {
    constructor() {
        this.players = [];
        this.bracket = [];
        this.currentRound = 0;
        this.matches = [];
        this.status = 'idle'; // 'idle', 'collecting_sequences', 'in_progress', 'finished'
        this.secretTargetSequence = this.generateRandomTargetSequence(); // Sequência alvo secreta é sempre aleatória no início
        console.log("SEQUÊNCIA ALVO SECRETA INICIALIZADA:", this.secretTargetSequence.join(''));
    }

    generateRandomTargetSequence() {
        const sequence = [];
        for (let i = 0; i < 5; i++) {
            sequence.push(ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)]);
        }
        return sequence;
    }

    // Método para permitir que o ADM defina a sequência alvo manualmente (para debug ou controle)
    // Este método existirá, mas a lógica padrão será usar o aleatório.
    setTargetSequence(sequence) {
        if (Array.isArray(sequence) && sequence.length === 5 && sequence.every(e => ALL_EMOJIS.includes(e))) {
            this.secretTargetSequence = sequence;
            console.log("SEQUÊNCIA ALVO ATUALIZADA PELO ADM (DEBUG):", this.secretTargetSequence.join(''));
            return true;
        }
        return false;
    }

    addPlayer(participant) {
        if (participant.emojiSequence && participant.emojiSequence.length === 5) {
            // Verifica se o jogador já está na lista para evitar duplicatas em reinícios parciais
            if (!this.players.some(p => p.id === participant.id)) {
                 this.players.push(participant);
            }
            this.status = 'collecting_sequences';
            return true;
        }
        return false;
    }

    compareSequences(seqA, seqB, targetSeq) {
        const calculateProximity = (sequence, target) => {
            let directHits = 0;
            let tempTargetForEmojiHits = [...target];
            let currentEmojiHits = 0;

            for (let i = 0; i < 5; i++) {
                if (sequence[i] === target[i]) {
                    directHits++;
                    tempTargetForEmojiHits[i] = null;
                }
            }

            for (let i = 0; i < 5; i++) {
                if (sequence[i] !== target[i]) {
                    const targetIndex = tempTargetForEmojiHits.indexOf(sequence[i]);
                    if (targetIndex !== -1) {
                        currentEmojiHits++;
                        tempTargetForEmojiHits[targetIndex] = null;
                    }
                }
            }
            
            return { directHits, emojiHits: currentEmojiHits };
        };

        const proxA = calculateProximity(seqA, targetSeq);
        const proxB = calculateProximity(seqB, targetSeq);

        if (proxA.directHits > proxB.directHits) return 1;
        if (proxB.directHits > proxA.directHits) return -1;

        if (proxA.emojiHits > proxB.emojiHits) return 1;
        if (proxB.emojiHits > proxA.emojiHits) return -1;

        return 0;
    }

    startFirstRound() {
        if (this.players.length < 2) {
            console.warn("Não há jogadores suficientes para iniciar o torneio.");
            this.status = 'idle';
            return { success: false, message: "Mínimo de 2 jogadores necessário." };
        }
        
        const playersWithSequences = this.players.filter(p => p.emojiSequence && p.emojiSequence.length === 5);
        if (playersWithSequences.length < this.players.length) {
            console.warn("Nem todos os jogadores submeteram a sequência de emojis.");
            return { success: false, message: "Nem todos os jogadores submeteram a sequência." };
        }

        // Embaralha os jogadores para um sorteio justo das chaves
        const shuffledPlayers = [...playersWithSequences].sort(() => Math.random() - 0.5);
        
        this.bracket = [];
        this.matches = [];
        for (let i = 0; i < shuffledPlayers.length; i += 2) {
            if (shuffledPlayers[i + 1]) {
                this.matches.push({
                    player1: shuffledPlayers[i],
                    player2: shuffledPlayers[i + 1],
                    winnerId: null
                });
            } else {
                this.matches.push({
                    player1: shuffledPlayers[i],
                    player2: null, // Bye
                    winnerId: shuffledPlayers[i].id
                });
            }
        }
        this.bracket.push(this.matches);
        this.currentRound = 0;
        this.status = 'in_progress';
        console.log("Torneio iniciado. Primeira rodada:", this.matches.map(m => `${m.player1.nick} vs ${m.player2 ? m.player2.nick : 'BYE'}`));
        return { success: true, message: "Primeira rodada gerada." };
    }

    nextRound() {
        if (this.status !== 'in_progress') return { success: false, message: "Torneio não está em progresso." };

        const winners = [];
        this.matches.forEach(match => {
            if (match.winnerId) {
                const winnerParticipant = this.players.find(p => p.id === match.winnerId);
                if (winnerParticipant) {
                    winners.push(winnerParticipant);
                }
            }
        });
        
        if (winners.length === 0) {
             return { success: false, message: "Nenhum vencedor na rodada atual para avançar." };
        }

        if (winners.length <= 1) {
            this.status = 'finished';
            console.log("Torneio finalizado. Vencedor:", winners[0] ? winners[0].nick : "Nenhum vencedor.");
            return { success: true, winner: winners[0] || null, message: "Torneio finalizado." };
        }

        const shuffledWinners = [...winners].sort(() => Math.random() - 0.5); // Embaralha vencedores para a próxima rodada

        this.matches = [];
        for (let i = 0; i < shuffledWinners.length; i += 2) {
            if (shuffledWinners[i + 1]) {
                this.matches.push({
                    player1: shuffledWinners[i],
                    player2: shuffledWinners[i + 1],
                    winnerId: null
                });
            } else {
                this.matches.push({
                    player1: shuffledWinners[i],
                    player2: null,
                    winnerId: shuffledWinners[i].id
                });
            }
        }
        this.bracket.push(this.matches);
        this.currentRound++;
        console.log(`Iniciando Rodada ${this.currentRound + 1}. Partidas:`, this.matches.map(m => `${m.player1.nick} vs ${m.player2 ? m.player2.nick : 'BYE'}`));
        return { success: true, message: `Rodada ${this.currentRound + 1} gerada.` };
    }

    resolveMatch(matchIndex) {
        if (this.status !== 'in_progress' || !this.matches[matchIndex] || this.matches[matchIndex].winnerId) {
            return { success: false, message: "Não é possível resolver esta partida." };
        }

        const match = this.matches[matchIndex];
        const player1 = match.player1;
        const player2 = match.player2;

        if (!player1 || !player1.emojiSequence || player1.emojiSequence.length !== 5) {
             return { success: false, message: "Jogador 1 inválido ou sem sequência." };
        }

        if (!player2) { // É um BYE
            match.winnerId = player1.id;
            console.log(`BYE: ${player1.nick} avança automaticamente.`);
            return { success: true, winner: player1, loser: null, match };
        }

        if (!player2.emojiSequence || player2.emojiSequence.length !== 5) {
             return { success: false, message: "Jogador 2 inválido ou sem sequência." };
        }

        const comparisonResult = this.compareSequences(
            player1.emojiSequence,
            player2.emojiSequence,
            this.secretTargetSequence
        );

        let winner = null;
        let loser = null;

        if (comparisonResult === 1) {
            winner = player1;
            loser = player2;
        } else if (comparisonResult === -1) {
            winner = player2;
            loser = player1;
        } else {
            if (player1.loyalty > player2.loyalty) {
                winner = player1;
                loser = player2;
            } else if (player2.loyalty > player1.loyalty) {
                winner = player2;
                loser = player1;
            } else {
                console.log(`Empate absoluto entre ${player1.nick} e ${player2.nick}. Desempate aleatório.`);
                if (Math.random() > 0.5) {
                    winner = player1;
                    loser = player2;
                } else {
                    winner = player2;
                    loser = player1;
                }
            }
        }
        match.winnerId = winner.id;
        console.log(`Vencedor da partida ${player1.nick} vs ${player2.nick}: ${winner.nick}`);
        return { success: true, winner, loser, match };
    }

    getTournamentState() {
        return {
            status: this.status,
            currentRound: this.currentRound,
            // Envia todas as rodadas para renderização completa da árvore
            bracket: this.bracket.map(roundMatches => roundMatches.map(match => ({
                player1: { nick: match.player1.nick, id: match.player1.id, loyalty: match.player1.loyalty, emojiSequence: match.player1.emojiSequence },
                player2: match.player2 ? { nick: match.player2.nick, id: match.player2.id, loyalty: match.player2.loyalty, emojiSequence: match.player2.emojiSequence } : null,
                winnerId: match.winnerId,
                resolved: !!match.winnerId
            }))),
            players: this.players.map(p => ({ nick: p.nick, loyalty: p.loyalty, id: p.id, emojiSequence: p.emojiSequence, tournamentStatus: p.tournamentStatus })),
            secretTargetSequence: this.secretTargetSequence
        };
    }

    resetTournament() {
        this.players = [];
        this.bracket = [];
        this.currentRound = 0;
        this.matches = [];
        this.status = 'idle';
        this.secretTargetSequence = this.generateRandomTargetSequence(); // Nova sequência alvo aleatória
        console.log("Torneio resetado. Nova sequência alvo:", this.secretTargetSequence.join(''));
    }
}

module.exports = Tournament;