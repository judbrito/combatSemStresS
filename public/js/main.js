// public/js/main.js

import * as api from './modules/api.js';
import * as ui from './modules/ui.js';
import * as gameLogic from './modules/gameLogic.js';

const socket = io();

let currentParticipant = null; // Armazena o objeto do participante logado
let isAdminLoggedIn = false; // Estado do login do ADM

document.addEventListener('DOMContentLoaded', () => {
    console.log('Frontend carregado!');

    // --- Lógica de Login do ADM ---
    const adminLoginForm = document.getElementById('admin-login-form');
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;

        try {
            const response = await api.adminLogin(username, password);
            if (response.success) {
                isAdminLoggedIn = true;
                ui.showMessage('Login ADM bem-sucedido!', 'success');
                ui.hideSection('admin-login-area');
                ui.showSection('admin-panel');
                // Adicionalmente, se o ADM loga, atualize o estado para ver a sequência alvo
                const tournamentState = await api.getTournamentState();
                document.getElementById('adm-target-sequence').textContent = tournamentState.secretTargetSequence.join('');
            } else {
                ui.showMessage(response.message || 'Erro de login ADM desconhecido.', 'error');
            }
        } catch (error) {
            console.error('Erro no login ADM:', error);
            ui.showMessage(`Erro no login ADM: ${error.message}`, 'error');
        }
    });


    // --- Lida com o formulário de participação ---
    const playerForm = document.getElementById('player-form');
    playerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const nick = document.getElementById('nick').value;
        const loyalty = parseInt(document.getElementById('loyalty').value);
        
        if (isNaN(loyalty) || loyalty < 1) {
            ui.showMessage('A Lealdade deve ser um número válido e maior que 0.', 'error');
            return;
        }

        try {
            const response = await api.registerParticipant(nick, loyalty);
            if (response.participantId) {
                // Participante registrado com sucesso
                currentParticipant = {
                    id: response.participantId,
                    nick: nick,
                    loyalty: loyalty
                };
                ui.showMessage(`Bem-vindo, ${nick}! Prepare-se para gerar sua sequência!`);

                ui.hideSection('participation-form');
                ui.showSection('emoji-sorter-area');
                ui.showSection('tournament-area'); // Já exibe a área do torneio para todos
                ui.showSection('confrontation-area'); // Exibe a área de confronto
                ui.updateConfrontationDisplay(currentParticipant); // Atualiza com o jogador atual

                gameLogic.startEmojiSorter(currentParticipant.id, api);
                gameLogic.startSpinningEmojis();
                
                document.getElementById('stop-emoji-btn').disabled = false;
            } else {
                // Registro ignorado (provavelmente por cooldown)
                ui.showMessage('Sua solicitação de participação foi processada. Aguarde o início do torneio.', 'info');
                ui.hideSection('participation-form');
                ui.hideSection('emoji-sorter-area');
                ui.hideSection('confrontation-area'); // Não mostra confronto se foi ignorado
                ui.showSection('tournament-area'); // Apenas a árvore do torneio
            }
            
        } catch (error) {
            console.error('Erro ao registrar participante:', error);
            ui.showMessage(`Erro: ${error.message}`, 'error');
        }
    });

    // --- Lógica do Sorteador de Emojis ---
    const stopEmojiBtn = document.getElementById('stop-emoji-btn');
    stopEmojiBtn.addEventListener('click', () => {
        gameLogic.stopNextEmoji();
    });

    // Removendo o evento de clique do espaço para evitar complexidade desnecessária
    // document.addEventListener('keydown', (e) => {
    //     if (e.code === 'Space' && !stopEmojiBtn.disabled) {
    //         gameLogic.stopNextEmoji();
    //     }
    // });

    const submitSequenceBtn = document.getElementById('submit-sequence-btn');
    submitSequenceBtn.addEventListener('click', async () => {
        const finalSequence = gameLogic.getFinalSequence();
        if (finalSequence.length === 5 && currentParticipant && currentParticipant.id) {
            submitSequenceBtn.disabled = true;
            ui.showMessage('Enviando sua sequência...');
            try {
                await api.submitEmojiSequence(currentParticipant.id, finalSequence);
                currentParticipant.emojiSequence = finalSequence; // Atualiza a sequência no objeto local
                ui.showMessage('Sua sequência foi enviada! Aguarde o sorteio do torneio.', 'success');
                ui.hideSection('emoji-sorter-area'); // Esconde o sorteador após enviar
                ui.showSection('tournament-area'); // Garante que o torneio esteja visível
                
                // Atualiza a visualização do confronto com a sequência enviada
                ui.updateConfrontationDisplay(currentParticipant);

            } catch (error) {
                console.error('Erro ao enviar sequência:', error);
                ui.showMessage(`Erro ao enviar sequência: ${error.message}`, 'error');
                submitSequenceBtn.disabled = false;
            }
        } else {
            ui.showMessage('Por favor, pare todos os 5 emojis antes de enviar.', 'warning');
        }
    });

    // --- Socket.IO Listeners ---
    socket.on('message', (msg) => {
        ui.showMessage(`Mensagem do servidor: ${msg}`);
    });

    socket.on('participantRegistered', (data) => {
        console.log('Novo participante registrado via Socket.IO:', data);
        // Pode-se adicionar uma notificação visual de novo participante aqui
    });

    socket.on('emojiSequenceSubmitted', (data) => {
        console.log('Sequência de emoji submetida via Socket.IO:', data);
        ui.showMessage(`${data.nick} submeteu sua sequência: ${data.sequence.join('')}!`, 'info');
    });

    socket.on('tournamentStateUpdate', (state) => {
        console.log('Estado do Torneio atualizado:', state);
        ui.renderTournamentBracket(state);
        // Atualiza a sequência alvo para o ADM, se logado
        if (isAdminLoggedIn) {
             document.getElementById('adm-target-sequence').textContent = state.secretTargetSequence.join('');
        }

        // Tenta atualizar o confronto do jogador atual
        if (currentParticipant && state.status === 'in_progress' && state.bracket && state.bracket[state.currentRound]) {
            const currentRoundMatches = state.bracket[state.currentRound];
            const playerMatch = currentRoundMatches.find(match => 
                (match.player1 && match.player1.id === currentParticipant.id) || 
                (match.player2 && match.player2.id === currentParticipant.id)
            );
            if (playerMatch) {
                ui.updateConfrontationDisplay(currentParticipant, playerMatch);
            } else {
                // Se o jogador não está na rodada atual (já ganhou ou foi eliminado)
                ui.updateConfrontationDisplay(currentParticipant, null, state); 
            }
        } else if (currentParticipant) {
             // Se o torneio ainda não começou ou já terminou, e o jogador está logado
            ui.updateConfrontationDisplay(currentParticipant, null, state);
        }
    });

    socket.on('tournamentStarted', (state) => {
        ui.showMessage('O torneio de eliminação começou!', 'success');
        ui.renderTournamentBracket(state);
    });

    socket.on('matchesResolved', (data) => {
        console.log('Partidas resolvidas na rodada:', data);
        ui.showMessage('Partidas da rodada resolvidas! Verifique o painel do torneio.', 'info');
        // A renderTournamentBracket no 'tournamentStateUpdate' já vai pegar as atualizações
    });

    socket.on('tournamentWinner', (data) => {
        ui.showMessage(`🎉 O VENCEDOR DO TORNEIO É: ${data.winner.nick} 🎉`, 'success');
        console.log('Torneio finalizado. Vencedor:', data.winner.nick);
    });

    socket.on('tournamentReset', (state) => {
        ui.showMessage('O torneio foi resetado pelo ADM!', 'info');
        ui.renderTournamentBracket(state);
        currentParticipant = null; // Limpa o participante logado
        ui.hideSection('emoji-sorter-area');
        ui.hideSection('tournament-area');
        ui.hideSection('confrontation-area'); // Esconde a área de confronto
        ui.showSection('participation-form');
        document.getElementById('player-form').reset();
    });


    // --- Controles do ADM (visíveis apenas após login) ---
    const startFirstRoundBtn = document.getElementById('start-first-round-btn');
    if (startFirstRoundBtn) {
        startFirstRoundBtn.addEventListener('click', async () => {
            try {
                const response = await api.startTournamentFirstRound();
                ui.showMessage(response.message, 'info');
            } catch (error) {
                console.error('Erro ao iniciar 1ª rodada:', error);
                ui.showMessage(`Erro: ${error.message}`, 'error');
            }
        });
    }

    const sortAndAdvanceBtn = document.getElementById('sort-and-advance-btn');
    if (sortAndAdvanceBtn) {
        sortAndAdvanceBtn.addEventListener('click', async () => {
            try {
                const response = await api.sortAndAdvanceRound();
                ui.showMessage(response.message, 'info');
            } catch (error) {
                console.error('Erro ao sortear e avançar:', error);
                ui.showMessage(`Erro: ${error.message}`, 'error');
            }
        });
    }

    const resetTournamentBtn = document.getElementById('reset-tournament-btn');
    if (resetTournamentBtn) {
        resetTournamentBtn.addEventListener('click', async () => {
            if (confirm('Tem certeza que deseja resetar o torneio e todos os participantes?')) {
                try {
                    const response = await api.resetTournament();
                    ui.showMessage(response.message, 'info');
                } catch (error) {
                    console.error('Erro ao resetar torneio:', error);
                    ui.showMessage(`Erro: ${error.message}`, 'error');
                }
            }
        });
    }

    const setTargetSequenceBtn = document.getElementById('set-target-sequence-btn');
    if (setTargetSequenceBtn) {
        setTargetSequenceBtn.addEventListener('click', async () => {
            const inputSeq = document.getElementById('admin-target-sequence-input').value;
            const sequenceArray = [...inputSeq].filter(char => char !== ' ');
            if (sequenceArray.length !== 5) {
                ui.showMessage('A sequência alvo deve ter exatamente 5 emojis!', 'error');
                return;
            }
            try {
                const response = await api.setAdminTargetSequence(sequenceArray);
                ui.showMessage(response.message, 'success');
                document.getElementById('admin-target-sequence-input').value = '';
            } catch (error) {
                console.error('Erro ao definir sequência alvo:', error);
                ui.showMessage(`Erro: ${error.message}`, 'error');
            }
        });
    }

    const addParticipantsJsonBtn = document.getElementById('add-participants-json-btn');
    if (addParticipantsJsonBtn) {
        addParticipantsJsonBtn.addEventListener('click', async () => {
            const jsonInput = document.getElementById('participants-json-input').value;
            try {
                const participantsJson = JSON.parse(jsonInput);
                const response = await api.addParticipantsFromJson(participantsJson);
                ui.showMessage(response.message, 'success');
                document.getElementById('participants-json-input').value = '';
            } catch (error) {
                console.error('Erro ao adicionar participantes via JSON:', error);
                ui.showMessage(`Erro ao processar JSON: ${error.message}`, 'error');
            }
        });
    }

    const loadParticipantsFromBackupBtn = document.getElementById('load-participants-from-backup-btn');
    if (loadParticipantsFromBackupBtn) {
        loadParticipantsFromBackupBtn.addEventListener('click', async () => {
            try {
                const backupData = await api.getParticipantsBackup();
                document.getElementById('participants-json-input').value = JSON.stringify(backupData, null, 2);
                ui.showMessage('JSON de exemplo carregado. Edite e clique em "Adicionar Participantes do JSON".', 'info');
            } catch (error) {
                console.error('Erro ao carregar backup de participantes:', error);
                ui.showMessage(`Erro ao carregar backup: ${error.message}`, 'error');
            }
        });
    }

    const showRecentParticipantsBtn = document.getElementById('show-recent-participants-btn');
    const recentParticipantsDisplay = document.getElementById('recent-participants-display');
    if (showRecentParticipantsBtn) {
        showRecentParticipantsBtn.addEventListener('click', async () => {
            try {
                const recentData = await api.getRecentParticipants();
                recentParticipantsDisplay.textContent = JSON.stringify(recentData, null, 2);
                recentParticipantsDisplay.classList.toggle('hidden');
                ui.showMessage('Participantes recentes carregados.', 'info');
            } catch (error) {
                console.error('Erro ao obter participantes recentes:', error);
                ui.showMessage(`Erro ao obter participantes recentes: ${error.message}`, 'error');
            }
        });
    }
});