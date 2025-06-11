// public/js/modules/ui.js

const messageDiv = document.createElement('div');
messageDiv.id = 'app-message';
document.body.prepend(messageDiv);

export function showMessage(message, type = 'info') {
    messageDiv.textContent = message;
    messageDiv.className = `app-message ${type}`;
    messageDiv.style.display = 'block';
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

export function showSection(sectionId) {
    document.getElementById(sectionId)?.classList.remove('hidden');
}

export function hideSection(sectionId) {
    document.getElementById(sectionId)?.classList.add('hidden');
}

export function updateEmojiSlot(slotIndex, emoji) {
    const slot = document.querySelector(`.emoji-slot[data-slot="${slotIndex}"]`);
    if (slot) {
        slot.textContent = emoji;
    }
}

export function markEmojiSlotAsStopped(slotIndex) {
    const slot = document.querySelector(`.emoji-slot[data-slot="${slotIndex}"]`);
    if (slot) {
        slot.classList.add('stopped');
    }
}

export function resetEmojiSlots() {
    const slots = document.querySelectorAll('.emoji-slot');
    slots.forEach(slot => {
        slot.textContent = '';
        slot.classList.remove('stopped');
    });
    document.getElementById('final-sequence').textContent = '';
    document.getElementById('your-sequence-display').classList.add('hidden');
}

export function displayFinalSequence(sequence) {
    document.getElementById('final-sequence').textContent = sequence.join('');
    document.getElementById('your-sequence-display').classList.remove('hidden');
}

export function updateEmojiSorterMessage(message) {
    document.getElementById('emoji-sorter-message').textContent = message;
}

// NOVA FUNÇÃO: Atualiza a exibição do confronto do jogador
export function updateConfrontationDisplay(player, match = null, tournamentState = null) {
    const playerNickEl = document.getElementById('player-nick');
    const playerLoyaltyEl = document.getElementById('player-loyalty');
    const playerSequenceEl = document.getElementById('player-sequence');
    const opponentNickEl = document.getElementById('opponent-nick');
    const opponentLoyaltyEl = document.getElementById('opponent-loyalty');
    const opponentSequenceEl = document.getElementById('opponent-sequence');
    const matchStatusMessage = document.getElementById('match-status-message');

    // Sempre exibe os dados do jogador atual
    playerNickEl.textContent = player.nick;
    playerLoyaltyEl.textContent = `Lealdade: ${player.loyalty}`;
    playerSequenceEl.textContent = `Seq: ${player.emojiSequence ? player.emojiSequence.join('') : 'Aguardando'}`;

    if (tournamentState && tournamentState.status === 'finished') {
        matchStatusMessage.textContent = 'Torneio Finalizado!';
        const winner = tournamentState.bracket[tournamentState.bracket.length - 1][0]?.winnerId;
        if (winner === player.id) {
            opponentNickEl.textContent = 'Você é o CAMPEÃO!';
            opponentLoyaltyEl.textContent = '';
            opponentSequenceEl.textContent = '';
        } else {
            opponentNickEl.textContent = 'Você foi eliminado.';
            opponentLoyaltyEl.textContent = '';
            opponentSequenceEl.textContent = '';
        }
        return;
    }

    if (!match) {
        opponentNickEl.textContent = 'Aguardando adversário...';
        opponentLoyaltyEl.textContent = '';
        opponentSequenceEl.textContent = '';
        matchStatusMessage.textContent = 'Aguardando o ADM iniciar o sorteio do torneio ou a próxima rodada.';
        return;
    }

    let opponent = null;
    let isPlayer1 = false;
    if (match.player1 && match.player1.id === player.id) {
        opponent = match.player2;
        isPlayer1 = true;
    } else if (match.player2 && match.player2.id === player.id) {
        opponent = match.player1;
    }

    if (opponent) {
        opponentNickEl.textContent = opponent.nick;
        opponentLoyaltyEl.textContent = `Lealdade: ${opponent.loyalty}`;
        opponentSequenceEl.textContent = `Seq: ${opponent.emojiSequence.join('')}`;
        matchStatusMessage.textContent = `Você está enfrentando ${opponent.nick}.`;
    } else { // BYE
        opponentNickEl.textContent = 'BYE (Avanço Automático)';
        opponentLoyaltyEl.textContent = '';
        opponentSequenceEl.textContent = '';
        matchStatusMessage.textContent = 'Você avançou automaticamente para a próxima rodada!';
    }

    // Se a partida já foi resolvida
    if (match.resolved) {
        if (match.winnerId === player.id) {
            matchStatusMessage.textContent = 'Parabéns! Você venceu esta partida e avançou!';
        } else {
            matchStatusMessage.textContent = `Você foi eliminado por ${match.winnerId === match.player1?.id ? match.player1.nick : match.player2?.nick}.`;
        }
    }
}


// Funções para renderizar a árvore eliminatória (COMPLETA)
export function renderTournamentBracket(tournamentState) {
    const bracketDisplayDiv = document.getElementById('tournament-bracket-display');
    const statusMessage = document.getElementById('tournament-status-message');
    bracketDisplayDiv.innerHTML = ''; // Limpa o conteúdo anterior

    if (tournamentState.status === 'idle') {
        statusMessage.textContent = 'Nenhum jogador registrado ainda. O ADM deve adicionar participantes ou eles podem se registrar.';
        return;
    }

    if (tournamentState.status === 'collecting_sequences') {
        statusMessage.textContent = `Jogadores registrados: ${tournamentState.players.length}. Aguardando todos submeterem as sequências e o ADM iniciar.`;
        const playerList = document.createElement('ul');
        playerList.innerHTML = '<h4>Participantes Atuais:</h4>';
        tournamentState.players.forEach(p => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${p.nick}</span> - Lealdade: ${p.loyalty} - Seq: <span class="sequence">${p.emojiSequence.join('') || 'Aguardando'}</span>`;
            playerList.appendChild(li);
        });
        bracketDisplayDiv.appendChild(playerList);
        return;
    }

    if (tournamentState.status === 'in_progress' || tournamentState.status === 'finished') {
        statusMessage.textContent = `Rodada Atual: ${tournamentState.currentRound + 1}`;

        // Itera sobre todas as rodadas armazenadas no 'bracket'
        tournamentState.bracket.forEach((roundMatches, roundIndex) => {
            const roundContainer = document.createElement('div');
            roundContainer.classList.add('tournament-round-container');
            
            const roundTitle = document.createElement('h3');
            roundTitle.textContent = `Rodada ${roundIndex + 1}`;
            roundContainer.appendChild(roundTitle);

            const matchesContainer = document.createElement('div');
            matchesContainer.classList.add('tournament-round-matches');

            roundMatches.forEach(match => {
                const matchDiv = document.createElement('div');
                matchDiv.classList.add('tournament-match');
                if (match.resolved) {
                    matchDiv.classList.add('resolved');
                }

                const player1 = match.player1;
                const player2 = match.player2;

                const player1Class = (match.resolved && match.winnerId === player1.id) ? 'player-info winner' : (match.resolved && match.winnerId !== player1.id ? 'player-info loser' : 'player-info');
                const player2Class = (match.resolved && player2 && match.winnerId === player2.id) ? 'player-info winner' : (match.resolved && player2 && match.winnerId !== player2.id ? 'player-info loser' : 'player-info');


                matchDiv.innerHTML += `
                    <div class="${player1Class}">
                        <span>${player1.nick}</span>
                        <span>Lealdade: ${player1.loyalty}</span>
                        <span class="sequence">${player1.emojiSequence.join('')}</span>
                    </div>
                    <span class="vs">vs</span>
                `;

                if (player2) {
                    matchDiv.innerHTML += `
                        <div class="${player2Class}">
                            <span>${player2.nick}</span>
                            <span>Lealdade: ${player2.loyalty}</span>
                            <span class="sequence">${player2.emojiSequence.join('')}</span>
                        </div>
                    `;
                } else {
                    matchDiv.innerHTML += `<div class="player-info"><span>BYE</span></div>`;
                }
                
                const winnerNick = match.winnerId ? tournamentState.players.find(p => p.id === match.winnerId)?.nick : 'Aguardando';
                matchDiv.innerHTML += `<div class="match-winner">Vencedor: ${winnerNick}</div>`;

                matchesContainer.appendChild(matchDiv);
            });
            roundContainer.appendChild(matchesContainer);
            bracketDisplayDiv.appendChild(roundContainer);
        });
    }

    if (tournamentState.status === 'finished') {
        const winner = tournamentState.players.find(p => p.id === tournamentState.bracket[tournamentState.bracket.length -1][0]?.winnerId);
        statusMessage.textContent = `🏆 TORNEIO FINALIZADO! O GRANDE VENCEDOR É: ${winner ? winner.nick : 'N/A'} 🏆`;
        bracketDisplayDiv.innerHTML += `<h3 style="text-align: center; color: var(--secondary-color); margin-top: 20px;">🎉 CAMPEÃO: ${winner ? winner.nick : 'N/A'} 🎉</h3>`;
    }
}