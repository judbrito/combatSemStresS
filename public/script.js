document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://semstressorteio.onrender.com/api';
    const emotions = [
        {icon: "🌌", name: "Cosmic Awe"},
        {icon: "✨", name: "Stellar Wonder"},
        {icon: "🌠", name: "Galactic Loneliness"},
        {icon: "🪐", name: "Nebulous Curiosity"},
        {icon: "⚫", name: "Black Hole Dread"},
        {icon: "💥", name: "Supernova Euphoria"},
        {icon: "🌀", name: "Orbital Serenity"},
        {icon: "☄️", name: "Cometary Nostalgia"},
        {icon: "🌉", name: "Interstellar Longing"},
        {icon: "🌠", name: "Celestial Bliss"},
        {icon: "⚛️", name: "Quantum Confusion"},
        {icon: "🌑", name: "Dark Matter Melancholy"},
        {icon: "🔮", name: "Astral Connection"},
        {icon: "⬇️", name: "Gravitational Pull"},
        {icon: "🌍", name: "Cosmic Belonging"},
        {icon: "⏳", name: "Event Horizon Anxiety"},
        {icon: "💓", name: "Pulsar Passion"},
        {icon: "💫", name: "Meteoric Inspiration"},
        {icon: "🔥", name: "Solar Flare Anger"},
        {icon: "🌙", name: "Lunar Tranquility"}
    ];
    
    let selectedEmotions = [];
    
    // Função para mostrar páginas
    function showPage(pageId) {
        document.querySelectorAll('.page-section').forEach(p => p.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        
        if (pageId === 'medir-section') renderRanking();
        if (pageId === 'game-section') startGame();
    }

    // Navegação entre páginas
    document.querySelectorAll('[data-target]').forEach(el => {
        el.addEventListener('click', (e) => {
            if (el.tagName === 'BUTTON') {
                e.preventDefault();
                showPage(el.dataset.target);
            }
        });
    });

    // Botão de áudio
    document.getElementById('play-audio-btn')?.addEventListener('click', () => {
        const audio = new Audio('./audio/mensagem.mp3');
        const messageText = document.getElementById('message-text');
        
        if (messageText.style.display === 'block') {
            messageText.style.display = 'none';
        } else {
            messageText.textContent = "Olá, meu amigo. Oceano aqui, pra te falar que não há nada mais importante que a vida, não deixe nada te estressar. Tenha um excelente jogo! Sem Stress!";
            messageText.style.display = 'block';
            audio.play().catch(e => console.error("Erro ao reproduzir áudio:", e));
        }
    });

    // Renderizar ranking
    async function renderRanking() {
        try {
            const res = await fetch(`${API_URL}/ranking`);
            const ranking = await res.json();
            const tbody = document.querySelector('#ranking-table tbody');
            
            // Ordena do mais estressado (maior positivo) para o menos estressado (maior negativo)
            const sortedRanking = ranking.sort((a, b) => {
                if (a.score === "Não jogou") return 1;
                if (b.score === "Não jogou") return -1;
                return b.score - a.score;
            });
            
            tbody.innerHTML = await Promise.all(sortedRanking.map(async (e, i) => {
                const phrase = await generateFunnyPhrase(e.score, i, sortedRanking.length);
                return `
                    <tr>
                        <td>${i+1}</td>
                        <td>${e.nick}</td>
                        <td>${e.score}</td>
                        <td>${phrase}</td>
                    </tr>`;
            }));
        } catch (e) {
            console.error("Erro ao carregar ranking:", e);
        }
    }

    // Gerar frases engraçadas
    async function generateFunnyPhrase(score, position, totalPlayers) {
        // Frases pré-definidas
        const phrases = {
            topStressed: [
                "🏆 Campeão do TemStresS! Até o café fica nervoso com você!",
                "😤 Nível de stress: Vulcão em erupção! TemStresS total!",
                "👑 Rei do Caos! Você define o que é ser TemStresS!"
            ],
            middle: [
                "🔄 Nem 8 nem 80, você é o equilíbrio do SemStresS!",
                "🎭 Meia-boca oficial! Nem stress, nem paz total!",
                "⚖️ Você é a encarnação do 'mais ou menos'!"
            ],
            bottom: [
                "🧘‍♂️ Mestre Zen do SemStresS! Até uma tempestade não te abala!",
                "🕊️ Paz interior nível monges tibetanos! SemStresS absoluto!",
                "🌊 Calmaria total! Você é o oposto do stress!"
            ]
        };

        // Lógica para escolher frases
        let phrase, className = '';
        
        if (position === 0 && score !== "Não jogou" && score > 0) {
            phrase = phrases.topStressed[Math.floor(Math.random() * phrases.topStressed.length)];
            className = 'temstress';
        } 
        else if (position === totalPlayers - 1 && score !== "Não jogou" && score < 0) {
            phrase = phrases.bottom[Math.floor(Math.random() * phrases.bottom.length)];
            className = 'semstress';
        } 
        else if (score !== "Não jogou" && (Math.abs(score) < 1000 || position === Math.floor(totalPlayers / 2))) {
            phrase = phrases.middle[Math.floor(Math.random() * phrases.middle.length)];
            className = 'meia-boca';
        }
        else {
            phrase = "Aguardando jogada...";
        }

        return `<span class="${className}">${phrase}</span>`;
    }

    // Iniciar jogo
    function startGame() {
        const nick = localStorage.getItem('currentPlayerNick');
        if (!nick) return showPage('medir-section');
        
        document.getElementById('player-nick').textContent = nick;
        selectedEmotions = [];
        document.getElementById('counter').textContent = 'Faltam selecionar: 10';
        document.getElementById('results').style.display = 'none';
        document.getElementById('emotions-container').style.display = 'grid';
        document.getElementById('counter').style.display = 'block';
        
        const container = document.getElementById('emotions-container');
        container.innerHTML = emotions
            .sort(() => Math.random() - 0.5)
            .map(e => `
                <div class="emotion-icon">
                    <div class="icon">${e.icon}</div>
                    <div class="name">${e.name}</div>
                    <div class="value">...</div>
                </div>`)
            .join('');
        
        container.querySelectorAll('.emotion-icon').forEach((el) => {
            el.addEventListener('click', () => {
                if (selectedEmotions.length < 10 && !el.classList.contains('selected')) {
                    const value = Math.floor(Math.random() * 20001) - 10000;
                    el.querySelector('.value').textContent = `[${value}]`;
                    el.classList.add('selected');
                    selectedEmotions.push({value, element: el});
                    updateCounter();
                    if (selectedEmotions.length === 10) showResults();
                }
            });
        });
    }

    // Atualizar contador
    function updateCounter() {
        document.getElementById('counter').textContent = `Faltam selecionar: ${10 - selectedEmotions.length}`;
    }

    // Mostrar resultados
    async function showResults() {
        const total = selectedEmotions.reduce((sum, e) => sum + e.value, 0);
        const nick = localStorage.getItem('currentPlayerNick');
        
        try {
            await fetch(`${API_URL}/ranking`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({nick, score: total})
            });
        } catch (e) {
            console.error("Erro ao salvar score:", e);
        }
        
        document.getElementById('emotions-container').style.display = 'none';
        document.getElementById('counter').style.display = 'none';
        
        const resultsDiv = document.getElementById('results');
        resultsDiv.style.display = 'block';
        document.getElementById('stress-level').textContent = `Pontuação Total: ${total}`;
        
        // Gerar frase engraçada para o resultado
        const funnyPhrase = await generateFunnyResultPhrase(total);
        document.getElementById('funny-result-phrase').innerHTML = funnyPhrase;
    }

    // Gerar frase para resultado do jogador
    async function generateFunnyResultPhrase(score) {
        const phrases = {
            positive: [
                "😤 Você é a definição de TemStresS! Até as pedras são mais calmas que você!",
                "🤯 Nível de stress: Terremoto nível 10! Procure um yoga urgente!",
                "👹 Monstro do stress! Você precisa de férias nas Maldivas!"
            ],
            neutral: [
                "😐 Mais ou menos... igual mingau de aveia! Nem stress, nem paz!",
                "🫤 Meio-termo é seu sobrenome! Nem lá, nem cá!",
                "🎭 Ator principal do 'não sei o que sentir'!"
            ],
            negative: [
                "🧘‍♂️ Mestre do SemStresS! Você é a paz em pessoa!",
                "🕊️ Até um fusca na contramão não tira sua calma! Nível Zen!",
                "🌊 Calmaria absoluta! Você é o oposto do stress!"
            ]
        };

        let selectedPhrases;
        if (score > 5000) selectedPhrases = phrases.positive;
        else if (score < -5000) selectedPhrases = phrases.negative;
        else selectedPhrases = phrases.neutral;

        return selectedPhrases[Math.floor(Math.random() * selectedPhrases.length)];
    }

    // Sistema de login admin
    document.getElementById('login-btn')?.addEventListener('click', async () => {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('login-error');
        
        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({username, password})
            });
            
            const data = await response.json();
            if (data.success) {
                localStorage.setItem('adminLoggedIn', 'true');
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('admin-dashboard').style.display = 'block';
                renderParticipants();
                errorDiv.style.display = 'none';
            } else {
                errorDiv.textContent = 'Usuário ou senha incorretos';
                errorDiv.style.display = 'block';
            }
        } catch (e) {
            errorDiv.textContent = 'Erro ao conectar com o servidor';
            errorDiv.style.display = 'block';
            console.error("Erro no login:", e);
        }
    });

    // Renderizar participantes (admin)
    async function renderParticipants() {
        try {
            const res = await fetch(`${API_URL}/ranking`);
            const participants = await res.json();
            const list = document.getElementById('participants-list');
            
            list.innerHTML = participants
                .sort((a, b) => a.nick.localeCompare(b.nick))
                .map(p => `
                    <li>
                        <span>${p.nick} - ${p.score}</span>
                        <button data-nick="${encodeURIComponent(p.nick)}" class="delete-btn">Excluir</button>
                    </li>`)
                .join('');
                
            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm(`Excluir participante ${decodeURIComponent(btn.dataset.nick)}?`)) {
                        try {
                            await fetch(`${API_URL}/participants/${btn.dataset.nick}`, {
                                method: 'DELETE'
                            });
                            renderParticipants();
                        } catch (e) {
                            console.error("Erro ao excluir:", e);
                        }
                    }
                });
            });
        } catch (e) {
            console.error("Erro ao carregar participantes:", e);
        }
    }

    // Adicionar participante (admin)
    document.getElementById('add-participant-btn')?.addEventListener('click', async () => {
        const nick = document.getElementById('new-participant').value.trim();
        if (nick.length > 0 && nick.length <= 6) {
            try {
                const response = await fetch(`${API_URL}/participants`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({nick})
                });
                
                if (response.status === 409) {
                    alert(`O nick "${nick}" já existe!`);
                } else {
                    document.getElementById('new-participant').value = '';
                    renderParticipants();
                    alert(`Participante "${nick}" adicionado!`);
                }
            } catch (e) {
                console.error("Erro ao adicionar:", e);
                alert('Erro ao adicionar participante');
            }
        } else {
            alert('Nick deve ter 1-6 caracteres');
        }
    });

    // Resetar ranking (admin)
    document.getElementById('reset-ranking-btn')?.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja resetar todo o ranking? Isso é irreversível!')) {
            try {
                await fetch(`${API_URL}/reset-ranking`, {
                    method: 'DELETE'
                });
                renderParticipants();
                alert('Ranking resetado com sucesso!');
            } catch (e) {
                console.error("Erro ao resetar:", e);
                alert('Erro ao resetar ranking');
            }
        }
    });

    // Adicionar em massa (admin)
    document.getElementById('bulk-play-btn')?.addEventListener('click', async () => {
        const nicks = document.getElementById('bulk-participants').value
            .split(',')
            .map(n => n.trim())
            .filter(n => n.length > 0 && n.length <= 6);
            
        if (nicks.length === 0) {
            alert('Insira nicks válidos separados por vírgula');
            return;
        }
        
        try {
            const operations = nicks.map(nick => ({
                updateOne: {
                    filter: { nick },
                    update: { $set: { nick, score: Math.floor(Math.random() * 20001) - 10000 } },
                    upsert: true
                }
            }));
            
            await fetch(`${API_URL}/bulk-play`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({nicks})
            });
            
            document.getElementById('bulk-participants').value = '';
            renderParticipants();
            alert(`${nicks.length} participantes adicionados/jogados com sucesso!`);
        } catch (e) {
            console.error("Erro em massa:", e);
            alert('Erro ao adicionar participantes');
        }
    });

    // Verificar login ao carregar admin
    if (window.location.hash === '#admin-section' || document.getElementById('admin-section').classList.contains('active')) {
        if (localStorage.getItem('adminLoggedIn') === 'true') {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            renderParticipants();
        } else {
            showPage('admin-section');
        }
    }

    // Criar estrelas animadas
    function createStars() {
        const container = document.getElementById('star-background');
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = `${Math.random() * 4 + 2}px`;
            star.style.height = star.style.width;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 15 + 10}s`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(star);
        }
    }

    // Inicialização
    createStars();
    showPage('home-section');
});