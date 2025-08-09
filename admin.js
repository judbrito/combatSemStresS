document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginError = document.getElementById('login-error');
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const newParticipantInput = document.getElementById('new-participant');
    const participantsList = document.getElementById('participants-list');
    const resetRankingBtn = document.getElementById('reset-ranking-btn');
    const bulkParticipantsInput = document.getElementById('bulk-participants');
    const bulkPlayBtn = document.getElementById('bulk-play-btn');

    const ADMIN_USER = 'admoceano';
    const ADMIN_PASS = '4107';

    // Função para renderizar a lista de participantes
    function renderParticipantsList() {
        participantsList.innerHTML = '';
        const ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
        
        // Usar um Set para garantir nomes únicos, removendo duplicatas
        const uniqueNicks = new Set(ranking.map(p => p.nick));
        
        uniqueNicks.forEach(nick => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="participant-name">${nick}</span>
                <div class="participant-actions">
                    <button class="join-link play-auto-btn" data-nick="${nick}">Jogar Auto</button>
                    <button class="join-link remove-btn" data-nick="${nick}">Remover</button>
                </div>
            `;
            participantsList.appendChild(li);
        });
        
        // Adicionar event listeners aos novos botões
        document.querySelectorAll('.play-auto-btn').forEach(button => {
            button.addEventListener('click', handleAutoPlay);
        });
        document.querySelectorAll('.remove-btn').forEach(button => {
            button.addEventListener('click', handleRemoveParticipant);
        });
    }

    // Função para simular a jogada de um participante
    function handleAutoPlay(event) {
        const nick = event.target.dataset.nick;
        const totalScore = Math.floor(Math.random() * 10001) - 5000;
        
        const ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
        
        // Remove entradas antigas do mesmo nick antes de adicionar a nova
        const updatedRanking = ranking.filter(entry => entry.nick !== nick);
        updatedRanking.push({ nick, score: totalScore });
        
        localStorage.setItem('stressRanking', JSON.stringify(updatedRanking));

        alert(`O participante "${nick}" jogou e obteve o score: ${totalScore}`);
        renderParticipantsList();
    }
    
    // Função para remover um participante do ranking
    function handleRemoveParticipant(event) {
        const nickToRemove = event.target.dataset.nick;
        let ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
        
        ranking = ranking.filter(entry => entry.nick !== nickToRemove);
        localStorage.setItem('stressRanking', JSON.stringify(ranking));
        
        renderParticipantsList();
    }

    // Adiciona um novo participante (apenas um)
    addParticipantBtn.addEventListener('click', () => {
        const newNick = newParticipantInput.value.trim();
        if (newNick && newNick.length > 0 && newNick.length <= 6) {
            let ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
            if (!ranking.some(p => p.nick === newNick)) {
                ranking.push({ nick: newNick, score: "Não jogou" });
                localStorage.setItem('stressRanking', JSON.stringify(ranking));
                newParticipantInput.value = '';
                renderParticipantsList();
                alert(`Participante "${newNick}" adicionado com sucesso!`);
            } else {
                alert('Este nick já existe no ranking!');
            }
        } else {
            alert('Por favor, insira um nick válido com no máximo 6 caracteres.');
        }
    });

    // Adiciona múltiplos participantes e já inicia o jogo para eles
    bulkPlayBtn.addEventListener('click', () => {
        const inputNames = bulkParticipantsInput.value.trim();
        if (inputNames) {
            const namesArray = inputNames.split(',').map(name => name.trim()).filter(name => name.length > 0);
            let ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
            let addedCount = 0;
            
            namesArray.forEach(newNick => {
                if (newNick.length > 0 && newNick.length <= 6) {
                    // Remove entradas antigas do mesmo nick antes de adicionar a nova
                    ranking = ranking.filter(entry => entry.nick !== newNick);
                    
                    const totalScore = Math.floor(Math.random() * 10001) - 5000;
                    ranking.push({ nick: newNick, score: totalScore });
                    addedCount++;
                }
            });
            
            if (addedCount > 0) {
                localStorage.setItem('stressRanking', JSON.stringify(ranking));
                bulkParticipantsInput.value = '';
                renderParticipantsList();
                alert(`${addedCount} participante(s) adicionado(s) e já jogado(s) com sucesso!`);
            } else {
                alert('Nenhum novo participante válido foi adicionado e jogado. Verifique se o nome tem no máximo 6 caracteres.');
            }
        } else {
            alert('Por favor, insira um ou mais nicks separados por vírgula.');
        }
    });

    // Função para resetar o ranking
    resetRankingBtn.addEventListener('click', () => {
        if (confirm('Tem certeza que deseja resetar todo o ranking? Esta ação não pode ser desfeita.')) {
            localStorage.removeItem('stressRanking');
            alert('Ranking resetado com sucesso!');
            renderParticipantsList();
        }
    });

    // Lógica de Login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        if (username === ADMIN_USER && password === ADMIN_PASS) {
            loginSection.style.display = 'none';
            adminDashboard.style.display = 'block';
            renderParticipantsList();
        } else {
            loginError.textContent = 'Usuário ou senha incorretos.';
            loginError.style.display = 'block';
        }
    });

    // Inicialização da lista de participantes ao carregar a página
    // Isso é útil se o usuário já estiver logado (em um cenário real, com tokens)
    // Para este projeto, a lista será renderizada apenas após o login.
});