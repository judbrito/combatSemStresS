document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:10000' : 'https://semstressorteio.onrender.com';
    const emotions = [{icon: "🌌", name: "Cosmic Awe"}, {icon: "✨", name: "Stellar Wonder"}, {icon: "🌠", name: "Galactic Loneliness"}, {icon: "🪐", name: "Nebulous Curiosity"}, {icon: "⚫", name: "Black Hole Dread"}, {icon: "💥", name: "Supernova Euphoria"}, {icon: "🌀", name: "Orbital Serenity"}, {icon: "☄️", name: "Cometary Nostalgia"}, {icon: "🌉", name: "Interstellar Longing"}, {icon: "🌠", name: "Celestial Bliss"}, {icon: "⚛️", name: "Quantum Confusion"}, {icon: "🌑", name: "Dark Matter Melancholy"}, {icon: "🔮", name: "Astral Connection"}, {icon: "⬇️", name: "Gravitational Pull"}, {icon: "🌍", name: "Cosmic Belonging"}, {icon: "⏳", name: "Event Horizon Anxiety"}, {icon: "💓", name: "Pulsar Passion"}, {icon: "💫", name: "Meteoric Inspiration"}, {icon: "🔥", name: "Solar Flare Excitement"}, {icon: "🌀", name: "Galactic Whirlpool Despair"}];

    let adminToken = localStorage.getItem('adminToken');

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
            const participants = await fetchAPI('/api/participants', { headers: { 'Authorization': `Bearer ${adminToken}` } });
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

    document.getElementById('ranking-btn').addEventListener('click', () => {
        showPage('ranking-section');
        renderRanking();
    });

    document.getElementById('medir-section-btn').addEventListener('click', () => {
        const nick = document.getElementById('medir-nick').value.trim().toUpperCase();
        if (nick) {
            fetch(`${API_URL}/api/play`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nick })
            })
            .then(response => response.json())
            .then(() => {
                showPage('medir-section');
                const score = Math.floor(Math.random() * 20001) - 10000;
                const resultText = document.getElementById('medir-result');
                const playerNick = document.getElementById('player-nick');
                playerNick.textContent = nick;
                resultText.innerHTML = `Score: ${score}<br>${score > 5000 ? "Sem StresS" : score < -5000 ? "Com StresS" : "Meia boca"}`;
                const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)];
                document.getElementById('emotion-result').innerHTML = `${randomEmotion.icon} ${randomEmotion.name}`;
            })
            .catch(e => console.error(e));
        }
    });

    document.getElementById('admin-btn').addEventListener('click', () => {
        showPage('admin-section');
        if (adminToken) {
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('admin-dashboard').style.display = 'block';
            renderParticipants();
        } else {
            document.getElementById('login-section').style.display = 'block';
            document.getElementById('admin-dashboard').style.display = 'none';
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
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
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
                await fetchAPI('/api/reset-ranking', { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
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
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
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
                    await fetchAPI(`/api/participants/${nick}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
                    renderParticipants();
                    alert(`${nick} removido!`);
                } catch (e) {
                    console.error(e);
                }
            }
        }
    });

    document.querySelectorAll('[data-target]').forEach(button => {
        button.addEventListener('click', (e) => {
            showPage(e.target.dataset.target);
            if (e.target.dataset.target === 'ranking-section') renderRanking();
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
    createStars();
    renderRanking();
});