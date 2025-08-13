document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://semstressorteio.onrender.com';
    const emotions = [
        {icon: "🌌", name: "Cosmic Awe", value: 500},
        {icon: "✨", name: "Stellar Wonder", value: 800},
        {icon: "🌠", name: "Galactic Loneliness", value: -600},
        {icon: "🪐", name: "Nebulous Curiosity", value: 300},
        {icon: "⚫", name: "Black Hole Dread", value: -900},
        {icon: "💥", name: "Supernova Euphoria", value: 1000},
        {icon: "🌀", name: "Orbital Serenity", value: 700},
        {icon: "☄️", name: "Cometary Nostalgia", value: -400},
        {icon: "🌉", name: "Interstellar Longing", value: -500},
        {icon: "🌠", name: "Celestial Bliss", value: 900},
        {icon: "⚛️", name: "Quantum Confusion", value: -300},
        {icon: "🌑", name: "Dark Matter Melancholy", value: -800},
        {icon: "🔮", name: "Astral Connection", value: 600},
        {icon: "⬇️", name: "Gravitational Pull", value: -200},
        {icon: "🌍", name: "Cosmic Belonging", value: 400},
        {icon: "⏳", name: "Event Horizon Anxiety", value: -700},
        {icon: "💓", name: "Pulsar Passion", value: 1000},
        {icon: "💫", name: "Meteoric Inspiration", value: 800},
        {icon: "🔥", name: "Solar Flare Excitement", value: 700},
        {icon: "🌀", name: "Galactic Whirlpool Despair", value: -1000}
    ];

    let adminToken = localStorage.getItem('adminToken');
    let selectedEmotions = [];
    let currentNick = '';

    const fetchAPI = async (endpoint, options = {}) => {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) throw new Error(response.statusText);
        return response.json();
    };

    const showPage = targetId => {
        document.querySelectorAll('.page-section').forEach(section => section.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');
    };

    const renderRanking = async () => {
        const rankingBody = document.getElementById('ranking-body');
        rankingBody.innerHTML = '';
        try {
            const ranking = await fetchAPI('/api/ranking');
            ranking.forEach((player, index) => {
                const tr = document.createElement('tr');
                let stressClass = 'meia-boca';
                let stressStatus = 'Normal';
                if (player.score > 5000) { stressClass = 'semstress'; stressStatus = 'Sem StresS'; }
                else if (player.score < -5000) { stressClass = 'temstress'; stressStatus = 'Com StresS'; }
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${player.nick}</td>
                    <td>${player.score}</td>
                    <td class="${stressClass}">${stressStatus}</td>
                `;
                rankingBody.appendChild(tr);
            });
        } catch (e) {
            console.error('Erro ao buscar ranking:', e);
        }
    };

    const renderParticipants = async () => {
        const list = document.getElementById('participants-list');
        list.innerHTML = '';
        try {
            const participants = await fetchAPI('/api/participants', { 
                headers: { 'Authorization': `Bearer ${adminToken}` } 
            });
            participants.forEach(nick => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${nick}</span><button class="remove-btn" data-nick="${nick}"><i class="fas fa-trash"></i></button>`;
                list.appendChild(li);
            });
        } catch (e) {
            console.error('Erro ao buscar participantes:', e);
            if (e.message.includes('403')) {
                alert('Sessão expirada. Faça login novamente.');
                localStorage.removeItem('adminToken');
                document.getElementById('admin-dashboard').style.display = 'none';
                document.getElementById('login-section').style.display = 'block';
            }
        }
    };

    const setupGame = (nick) => {
        currentNick = nick;
        selectedEmotions = [];
        document.getElementById('player-nick').textContent = nick;
        document.getElementById('counter').textContent = 'Faltam selecionar: 10';
        document.getElementById('results').style.display = 'none';
        
        const container = document.getElementById('emotions-container');
        container.innerHTML = '';
        
        const shuffled = [...emotions].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, 30);
        
        selected.forEach(emotion => {
            const btn = document.createElement('button');
            btn.className = 'emotion-btn';
            btn.innerHTML = `${emotion.icon}<br><small>${emotion.name}</small>`;
            btn.dataset.value = emotion.value;
            btn.addEventListener('click', () => {
                if (selectedEmotions.includes(emotion)) {
                    selectedEmotions = selectedEmotions.filter(e => e !== emotion);
                    btn.classList.remove('selected');
                } else if (selectedEmotions.length < 10) {
                    selectedEmotions.push(emotion);
                    btn.classList.add('selected');
                }
                
                const remaining = 10 - selectedEmotions.length;
                document.getElementById('counter').textContent = `Faltam selecionar: ${remaining}`;
                
                if (selectedEmotions.length === 10) {
                    calculateResult();
                }
            });
            container.appendChild(btn);
        });
    };

    const calculateResult = () => {
        const totalScore = selectedEmotions.reduce((sum, emotion) => sum + emotion.value, 0);
        
        fetch(`${API_URL}/api/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nick: currentNick, score: totalScore })
        }).then(() => {
            const resultsDiv = document.getElementById('results');
            const stressLevel = document.getElementById('stress-level');
            const funnyPhrase = document.getElementById('funny-result-phrase');
            
            if (totalScore > 5000) {
                stressLevel.textContent = `Score: ${totalScore} - Sem StresS!`;
                stressLevel.className = 'semstress';
                funnyPhrase.textContent = getRandomPositivePhrase();
            } else if (totalScore < -5000) {
                stressLevel.textContent = `Score: ${totalScore} - Com StresS!`;
                stressLevel.className = 'temstress';
                funnyPhrase.textContent = getRandomNegativePhrase();
            } else {
                stressLevel.textContent = `Score: ${totalScore} - Meia Boca`;
                stressLevel.className = 'meia-boca';
                funnyPhrase.textContent = 'Você está na média, nem muito nem pouco estressado!';
            }
            
            resultsDiv.style.display = 'block';
        }).catch(e => console.error(e));
    };

    const getRandomPositivePhrase = () => {
        const phrases = [
            "Você é uma máquina de felicidade!",
            "Nada pode te abalar!",
            "Zen total!",
            "Você é a paz em pessoa!",
            "Até os monges invejam sua calma!"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    };

    const getRandomNegativePhrase = () => {
        const phrases = [
            "Melhor respirar fundo!",
            "Quem te irritou tanto?",
            "Calma, respira... conta até 10!",
            "Você precisa de um abraço!",
            "Tá precisando de umas férias!"
        ];
        return phrases[Math.floor(Math.random() * phrases.length)];
    };

    document.getElementById('start-btn').addEventListener('click', () => {
        const nick = document.getElementById('nickname').value.trim().toUpperCase();
        if (nick && nick.length <= 6) {
            setupGame(nick);
            showPage('game-section');
        } else {
            alert('Por favor, insira um nick válido (máximo 6 caracteres)');
        }
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        try {
            const data = await fetchAPI('/api/admin-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            if (data.success) {
                adminToken = data.token;
                localStorage.setItem('adminToken', adminToken);
                document.getElementById('login-section').style.display = 'none';
                document.getElementById('admin-dashboard').style.display = 'block';
                renderParticipants();
            } else {
                document.getElementById('login-error').textContent = 'Credenciais inválidas';
                document.getElementById('login-error').style.display = 'block';
            }
        } catch (e) {
            console.error(e);
        }
    });

    document.getElementById('add-participant-btn').addEventListener('click', async () => {
        const nick = document.getElementById('new-participant').value.trim().toUpperCase();
        if (nick) {
            try {
                await fetchAPI('/api/add-participant', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${adminToken}` 
                    },
                    body: JSON.stringify({ nick })
                });
                document.getElementById('new-participant').value = '';
                renderParticipants();
                alert('Participante adicionado!');
            } catch (e) {
                console.error(e);
            }
        }
    });

    document.getElementById('reset-ranking-btn').addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja resetar o ranking?')) {
            try {
                await fetchAPI('/api/reset-ranking', { 
                    method: 'DELETE', 
                    headers: { 'Authorization': `Bearer ${adminToken}` } 
                });
                renderRanking();
                renderParticipants();
                alert('Ranking resetado!');
            } catch (e) {
                console.error(e);
            }
        }
    });

    document.getElementById('bulk-play-btn').addEventListener('click', async () => {
        const nicks = document.getElementById('bulk-participants').value.split(',').map(n => n.trim().toUpperCase()).filter(n => n);
        if (nicks.length) {
            try {
                await fetchAPI('/api/bulk-play', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json', 
                        'Authorization': `Bearer ${adminToken}` 
                    },
                    body: JSON.stringify({ nicks })
                });
                document.getElementById('bulk-participants').value = '';
                renderParticipants();
                alert(`${nicks.length} participantes adicionados/jogados com sucesso!`);
            } catch (e) {
                console.error(e);
            }
        }
    });

    document.getElementById('participants-list').addEventListener('click', async (e) => {
        if (e.target.classList.contains('remove-btn') || e.target.closest('.remove-btn')) {
            const nick = e.target.closest('.remove-btn').dataset.nick;
            if (confirm(`Tem certeza que deseja remover ${nick}?`)) {
                try {
                    await fetchAPI(`/api/participants/${nick}`, { 
                        method: 'DELETE', 
                        headers: { 'Authorization': `Bearer ${adminToken}` } 
                    });
                    renderParticipants();
                    alert(`${nick} removido!`);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });

    document.getElementById('play-audio-btn').addEventListener('click', () => {
        const audio = new Audio('/audio/mensagem.mp3');
        audio.play().catch(e => console.error('Erro ao reproduzir áudio:', e));
    });

    document.querySelectorAll('[data-target]').forEach(button => {
        button.addEventListener('click', (e) => {
            showPage(e.target.dataset.target);
            if (e.target.dataset.target === 'medir-section') renderRanking();
        });
    });

    function createStars() {
        const container = document.getElementById('star-background');
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.width = star.style.height = `${Math.random() * 4 + 2}px`;
            star.style.left = `${Math.random() * 100}%`;
            star.style.top = `${Math.random() * 100}%`;
            star.style.animationDuration = `${Math.random() * 15 + 10}s`;
            star.style.animationDelay = `${Math.random() * 5}s`;
            container.appendChild(star);
        }
    }

    if (adminToken) {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        renderParticipants();
    }

    createStars();
    renderRanking();
});