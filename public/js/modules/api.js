// public/js/modules/api.js

const API_BASE_URL = '/api';

// --- Login ADM ---
export async function adminLogin(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro no login ADM');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: adminLogin', error);
        throw error;
    }
}


export async function registerParticipant(nick, loyalty) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ nick, loyalty }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao registrar participante');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error: registerParticipant', error);
        throw error;
    }
}

export async function submitEmojiSequence(participantId, sequence) {
    try {
        const response = await fetch(`${API_BASE_URL}/submit-sequence`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ participantId, sequence }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao submeter sequência');
        }

        return await response.json();
    } catch (error) {
        console.error('API Error: submitEmojiSequence', error);
        throw error;
    }
}

export async function startTournamentFirstRound() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/start-first-round`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao iniciar 1ª rodada do torneio');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: startTournamentFirstRound', error);
        throw error;
    }
}

export async function sortAndAdvanceRound() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/sort-and-advance-round`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao sortear e avançar rodada');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: sortAndAdvanceRound', error);
        throw error;
    }
}

export async function resetTournament() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/reset-tournament`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao resetar torneio');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: resetTournament', error);
        throw error;
    }
}

export async function setAdminTargetSequence(sequence) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/set-target-sequence`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sequence }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao definir sequência alvo');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: setAdminTargetSequence', error);
        throw error;
    }
}

export async function addParticipantsFromJson(participantsJson) {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/add-participants-json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantsJson }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao adicionar participantes via JSON');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: addParticipantsFromJson', error);
        throw error;
    }
}

export async function getRecentParticipants() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/recent-participants`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao obter participantes recentes');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: getRecentParticipants', error);
        throw error;
    }
}

export async function getParticipantsBackup() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/participants-backup`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao obter backup de participantes');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: getParticipantsBackup', error);
        throw error;
    }
}


export async function getTournamentState() {
    try {
        const response = await fetch(`${API_BASE_URL}/tournament-state`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao obter estado do torneio');
        }
        return await response.json();
    } catch (error) {
        console.error('API Error: getTournamentState', error);
        throw error;
    }
}