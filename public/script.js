document.addEventListener('DOMContentLoaded', () => {
    const API_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://semstressorteio.onrender.com';
    let emotions = generateRandomEmotions();
    let adminToken = localStorage.getItem('adminToken');
    let selectedEmotions = [];
    let currentNick = '';

    // FRASES E MEMES ADICIONADOS AQUI
    const frasesSemStress = [
        "Pleno(a) como um buraco negro, nem a luz te tira a paz.",
        "Seu nível de stress é tão baixo que está em outra dimensão.",
        "Você flutua em órbita de tranquilidade.",
        "O universo pode colapsar, mas você continuará sereno(a).",
        "Você é a estrela cadente que ignora o atrito atmosférico.",
        "Meteoro de paciência, nada te abala.",
        "Sua paz é uma aurora boreal: bela e inabalável.",
        "Você é a definição de uma galáxia zen.",
        "Você medita na velocidade da luz.",
        "Para você, caos é apenas uma constelação diferente.",
        "Seu coração é um pulsar de calma e serenidade.",
        "O tempo para você não passa, ele orbita.",
        "A gravidade da vida não te afeta.",
        "Sua tranquilidade é tão imensa quanto o vazio do espaço.",
        "Você não tem stress, só tem a gravidade do seu próprio bem-estar.",
        "Você é o paradoxo da paz universal.",
        "Sua mente é um vácuo, no bom sentido.",
        "Seu nível de stress é um zero absoluto cósmico.",
        "Você flutua, enquanto os outros caem.",
        "Sua serenidade é uma super-nova, brilha sem esforço.",
        "Você é a tranquilidade em pessoa, só que em outro planeta.",
        "Calmo como a escuridão do espaço, nada te assusta.",
        "Seu stress está em outro universo, literalmente.",
        "Você não vive, você orbita, com uma calma impressionante.",
        "Sua calma é a força mais poderosa do universo.",
        "Seu coração é um pulsar de calma, e o seu sorriso um eclipse.",
        "Você é a prova de que a vida pode ser um passeio no parque.",
        "Nenhum problema é grande o suficiente para te tirar a paz.",
        "Sua mente é um universo de calma e serenidade.",
        "Você é a personificação da palavra 'zen'.",
        "Você é um raio de sol em um universo de escuridão.",
        "Sua tranquilidade é uma força da natureza.",
        "Sua paz é um tesouro cósmico.",
        "Você é um farol de calma em um mar de caos.",
        "Sua mente é como um lago sereno, sem uma única onda.",
        "Sua tranquilidade é uma arma secreta.",
        "Sua paz é um presente para o universo.",
        "Sua mente é um paraíso de calma.",
        "Você é um oásis de tranquilidade no deserto da vida.",
        "Sua calma é a sua maior virtude.",
        "Sua mente é um jardim de paz.",
        "Sua tranquilidade é contagiante.",
        "Sua paz é uma joia rara.",
        "Você é um mestre da calma.",
        "Sua mente é um refúgio de paz.",
        "Sua tranquilidade é inestimável.",
        "Sua paz é uma bênção para o universo.",
        "Sua mente é um santuário de calma.",
        "Sua tranquilidade é a sua força.",
        "Sua paz é um presente para si mesmo."
    ];
    
    const frasesMeiaBoca = [
        "Você está no meio, nem lá, nem cá. Um verdadeiro neutro cósmico.",
        "Sua energia é um vácuo: nem quente, nem frio. Apenas... existindo.",
        "Você está no meio do ranking. É o equilíbrio do universo, ou só a média.",
        "Você não é o vilão, mas também não é o herói. É o NPC galáctico.",
        "Seu stress está em ponto morto, pronto para acelerar ou parar de vez.",
        "Você é o meteoro que ainda não sabe se vai brilhar ou queimar.",
        "Você não está nem com o 'SemStress' nem com o 'TemStress'. Você está no limbo.",
        "Você é a gravidade que se recusa a puxar para baixo ou para cima.",
        "Você é o meio termo, a ponte entre o caos e a paz. Um verdadeiro herói indeciso.",
        "Você é um viajante intergaláctico sem um destino definido.",
        "Você é um planeta em órbita que ainda não encontrou seu sol.",
        "Você é uma constelação que ainda não se formou.",
        "Você é um paradoxo cósmico, a paz e o caos em um só lugar.",
        "Você é um cometa que ainda não sabe se vai brilhar ou sumir.",
        "Você é um buraco negro que ainda não sabe se vai sugar ou explodir.",
        "Você é um eclipse que ainda não sabe se vai escurecer ou iluminar.",
        "Você é uma super-nova que ainda não sabe se vai explodir ou implodir.",
        "Você é uma galáxia que ainda não sabe se vai se expandir ou contrair.",
        "Você é um pulsar de calma e caos.",
        "Você é a definição de um 'meio termo' cósmico.",
        "Você é um viajante do tempo que ainda não sabe se vai para o passado ou para o futuro.",
        "Você é um raio de sol em um dia nublado.",
        "Você é um oásis no deserto, mas ainda não é um paraíso.",
        "Você é uma joia rara, mas ainda não é um tesouro.",
        "Você é um mestre da indecisão.",
        "Você é um refúgio de paz, mas ainda não é um santuário.",
        "Você é uma bênção, mas ainda não é um milagre.",
        "Você é um jardim de paz, mas ainda não é um paraíso.",
        "Você é um farol de calma, mas ainda não é um farol de luz.",
        "Você é um oásis de tranquilidade, mas ainda não é um oásis de paz.",
        "Você é um mestre da calma, mas ainda não é um mestre da serenidade.",
        "Você é um refúgio de paz, mas ainda não é um refúgio de calma.",
        "Você é uma bênção, mas ainda não é um presente.",
        "Você é um jardim de paz, mas ainda não é um refúgio de paz.",
        "Você é um farol de calma, mas ainda não é um farol de tranquilidade.",
        "Você é um oásis de tranquilidade, mas ainda não é um oásis de serenidade.",
        "Você é um mestre da calma, mas ainda não é um mestre da paz.",
        "Você é um refúgio de paz, mas ainda não é um refúgio de serenidade.",
        "Você é uma bênção, mas ainda não é um presente do universo.",
        "Você é um jardim de paz, mas ainda não é um jardim de tranquilidade.",
        "Você é um farol de calma, mas ainda não é um farol de paz.",
        "Você é um oásis de tranquilidade, mas ainda não é um oásis de paz.",
        "Você é um mestre da calma, mas ainda não é um mestre da serenidade.",
        "Você é um refúgio de paz, mas ainda não é um refúgio de calma.",
        "Você é uma bênção, mas ainda não é um presente.",
        "Você é um jardim de paz, mas ainda não é um refúgio de paz.",
        "Você é um farol de calma, mas ainda não é um farol de luz.",
        "Você é um oásis de tranquilidade, mas ainda não é um oásis de paz.",
        "Você é um mestre da calma, mas ainda não é um mestre da serenidade."
    ];
    
    const frasesTemStress = [
        "Sua alma está em colapso como uma estrela moribunda.",
        "Você é a supernova do stress. Brilha e explode de tão nervoso(a).",
        "Seu nível de stress é tão alto que está atraindo buracos negros.",
        "Sua paciência foi devorada por um buraco negro.",
        "Você é o caos em pessoa, uma supernova em colapso.",
        "Seu coração pulsa como um pulsar de pura ansiedade.",
        "Seu stress é uma erupção solar prestes a acontecer.",
        "Você é a personificação do stress cósmico.",
        "Sua mente é um buraco negro de preocupações.",
        "Você é o desespero de um redemoinho galáctico.",
        "Sua paciência está em outro universo, e não volta mais.",
        "Seu coração está em órbita de ansiedade e pavor.",
        "Seu stress é a gravidade que te puxa para baixo.",
        "Você é o paradoxo do caos universal.",
        "Sua mente é um vácuo, mas de preocupações.",
        "Seu nível de stress é um zero absoluto cósmico.",
        "Você não flutua, você cai, e com stress.",
        "Seu coração é um pulsar de caos, e o seu sorriso um eclipse de paz.",
        "Você é a prova de que a vida não pode ser um passeio no parque.",
        "Qualquer problema é grande o suficiente para te tirar a paz.",
        "Sua mente é um universo de caos e preocupações.",
        "Você é a personificação da palavra 'stress'.",
        "Você é um buraco negro em um universo de luz.",
        "Seu stress é uma força da natureza.",
        "Seu stress é um tesouro cósmico, para os outros.",
        "Você é um farol de caos em um mar de calma.",
        "Sua mente é como um lago agitado, com uma única onda de paz.",
        "Seu stress é uma arma secreta, mas contra você mesmo.",
        "Seu stress é um presente para o universo, para os outros.",
        "Sua mente é um paraíso de caos.",
        "Você é um oásis de preocupações no deserto da vida.",
        "Seu stress é a sua maior virtude, para os outros.",
        "Sua mente é um jardim de preocupações.",
        "Seu stress é contagiante.",
        "Seu stress é uma joia rara, para os outros.",
        "Você é um mestre do stress.",
        "Sua mente é um refúgio de preocupações.",
        "Seu stress é inestimável, para os outros.",
        "Seu stress é uma bênção para o universo, para os outros.",
        "Sua mente é um santuário de preocupações.",
        "Seu stress é a sua força, mas contra você mesmo.",
        "Seu stress é um presente para si mesmo, para os outros.",
        "Sua mente é um universo de caos e preocupações.",
        "Seu stress é uma força da natureza, mas contra você mesmo.",
        "Seu stress é um tesouro cósmico, para os outros.",
        "Você é um farol de caos em um mar de paz.",
        "Sua mente é como um lago agitado, mas com uma única onda de caos.",
        "Seu stress é uma arma secreta, mas contra você mesmo.",
        "Seu stress é um presente para o universo, para os outros.",
        "Sua mente é um paraíso de caos."
    ];


    function generateRandomEmotions() {
        const icons = ["🌌", "✨", "🌠", "🪐", "⚫", "💥", "🌀", "☄️", "🌉", "🌠", "⚛️", "🌑", "🔮", "⬇️", "🌍", "⏳", "💓", "💫", "🔥", "🌀"];
        const names = ["Awe Cósmico", "Maravilha Estelar", "Solidão Galáctica", "Curiosidade Nebulosa", "Pavor do Buraco Negro", "Euforia de Supernova", "Serenidade Orbital", "Nostalgia Cometária", "Anseio Interstelar", "Felicidade Celestial", "Confusão Quântica", "Melancolia da Matéria Escura", "Conexão Astral", "Puxão Gravitacional", "Pertencimento Cósmico", "Ansiedade de Horizonte de Eventos", "Paixão Pulsar", "Inspiração Meteórica", "Emoção de Erupção Solar", "Desespero de Redemoinho Galáctico"];
        return Array.from({ length: 30 }, () => ({
            icon: icons[Math.floor(Math.random() * icons.length)],
            name: names[Math.floor(Math.random() * names.length)],
            value: Math.round(Math.random() * 20000 - 10000)
        }));
    }

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
        const rankingBody = document.getElementById('ranking-table').querySelector('tbody');
        rankingBody.innerHTML = '';
        try {
            const ranking = await fetchAPI('/api/ranking');
            const sortedRanking = [...ranking].sort((a, b) => a.score - b.score);
            const totalPlayers = sortedRanking.length;
            const meiaBocaIndex = totalPlayers > 2 ? Math.floor((totalPlayers - 1) / 2) : -1;

            sortedRanking.forEach((player, index) => {
                let stressStatus = 'Medindo Stress';
                let stressClass = '';
                let funnyPhrase = '';

                if (index === 0) {
                    stressStatus = 'SemStress';
                    stressClass = 'semstress';
                    funnyPhrase = frasesSemStress[Math.floor(Math.random() * frasesSemStress.length)];
                } else if (index === totalPlayers - 1) {
                    stressStatus = 'TemStress';
                    stressClass = 'temstress';
                    funnyPhrase = frasesTemStress[Math.floor(Math.random() * frasesTemStress.length)];
                } else if (index === meiaBocaIndex) {
                    stressStatus = 'MeiaBoca';
                    stressClass = 'meia-boca';
                    funnyPhrase = frasesMeiaBoca[Math.floor(Math.random() * frasesMeiaBoca.length)];
                }

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${player.nick}</td>
                    <td>${player.score}</td>
                    <td class="${stressClass}">${stressStatus}</td>
                    <td>${funnyPhrase}</td>
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
            participants.slice(0, 150).forEach(nick => {
                const li = document.createElement('li');
                li.innerHTML = `<span>${nick}</span><button class="remove-btn" data-nick="${nick}"><i class="fas fa-trash"></i></button>`;
                list.appendChild(li);
            });
        } catch (e) {
            console.error('Erro ao buscar participantes:', e);
            if (e.message.includes('403')) {
                alert('Sessão expirada. Faça login novamente.');
                localStorage.removeItem('adminToken');
                showPage('login-section');
            }
        }
    };

    const setupGame = (nick) => {
        currentNick = nick;
        selectedEmotions = [];
        emotions = generateRandomEmotions();
        document.getElementById('player-nick').textContent = nick;
        document.getElementById('counter').textContent = 'Faltam selecionar: 10';
        document.getElementById('results').style.display = 'none';
        const container = document.getElementById('emotions-container');
        container.innerHTML = '';

        const shuffled = [...emotions].sort(() => 0.5 - Math.random()).slice(0, 30);
        shuffled.forEach(emotion => {
            const btn = document.createElement('button');
            btn.className = 'emotion-btn';
            btn.innerHTML = `${emotion.icon}<br><small>${emotion.name}</small>`;
            btn.addEventListener('click', () => {
                if (btn.classList.contains('selected')) {
                    selectedEmotions = selectedEmotions.filter(e => e !== emotion);
                    btn.classList.remove('selected');
                } else if (selectedEmotions.length < 10) {
                    selectedEmotions.push(emotion);
                    btn.classList.add('selected');
                }
                const remaining = 10 - selectedEmotions.length;
                document.getElementById('counter').textContent = `Faltam selecionar: ${remaining}`;
                if (selectedEmotions.length === 10) calculateResult();
            });
            container.appendChild(btn);
        });
    };

    const calculateResult = async () => {
        const totalScore = selectedEmotions.reduce((sum, emotion) => sum + emotion.value, 0);
        try {
            await fetchAPI('/api/play', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nick: currentNick, score: totalScore })
            });
            await renderRanking();
            showPage('medir-section');
        } catch (e) {
            console.error('Erro ao registrar jogada:', e);
            alert('Não foi possível registrar seu resultado. Verifique o servidor.');
        }
    };

    document.getElementById('start-btn').addEventListener('click', () => {
        const nick = document.getElementById('nickname').value.trim().toUpperCase();
        if (nick && nick.length <= 6) {
            setupGame(nick);
            showPage('game-section');
        } else alert('Por favor, insira um nick válido (máximo 6 caracteres)');
    });

    document.getElementById('login-btn').addEventListener('click', async () => {
        const user = document.getElementById('username').value;
        const pass = document.getElementById('password').value;
        try {
            const data = await fetchAPI('/api/admin-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, pass }) });
            adminToken = data.token;
            localStorage.setItem('adminToken', adminToken);
            showPage('admin-dashboard');
            renderParticipants();
        } catch (e) {
            document.getElementById('login-error').textContent = 'Credenciais inválidas';
            document.getElementById('login-error').style.display = 'block';
        }
    });

    document.getElementById('add-participant-btn').addEventListener('click', async () => {
        const nick = document.getElementById('new-participant').value.trim().toUpperCase();
        if (nick) {
            try {
                await fetchAPI('/api/add-participant', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }, body: JSON.stringify({ nick }) });
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
                const response = await fetchAPI('/api/reset-ranking', { method: 'DELETE', headers: { 'Authorization': `Bearer ${adminToken}` } });
                alert(response.message);
                renderRanking();
                renderParticipants();
            } catch (e) {
                console.error(e);
            }
        }
    });

    document.getElementById('bulk-play-btn').addEventListener('click', async () => {
        const nicks = document.getElementById('bulk-participants').value.split(',').map(n => n.trim().toUpperCase()).filter(n => n);
        if (nicks.length) {
            try {
                await fetchAPI('/api/bulk-play', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` }, body: JSON.stringify({ nicks }) });
                document.getElementById('bulk-participants').value = '';
                renderParticipants();
                alert(`${nicks.length} participantes adicionados/jogados com sucesso!`);
            } catch (e) {
                console.error(e);
            }
        }
    });

    document.getElementById('participants-list').addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const nick = removeBtn.dataset.nick;
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

    document.getElementById('play-audio-btn').addEventListener('click', () => {
        const audio = new Audio('/audio/mensagem.mp3');
        audio.play().catch(e => console.error('Erro ao reproduzir áudio:', e));
    });

    document.querySelectorAll('[data-target]').forEach(button => {
        button.addEventListener('click', (e) => {
            const target = e.target.dataset.target;
            showPage(target);
            if (target === 'medir-section') renderRanking();
            if (target === 'admin-dashboard') renderParticipants();
        });
    });

    document.getElementById('view-ranking-btn').addEventListener('click', () => {
        showPage('medir-section');
        renderRanking();
    });

    function createStars() {
        const container = document.getElementById('star-background');
        for (let i = 0; i < 20; i++) {
            const star = document.createElement('div');
            Object.assign(star.style, {
                width: `${Math.random() * 4 + 2}px`,
                height: star.style.width,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDuration: `${Math.random() * 15 + 10}s`,
                animationDelay: `${Math.random() * 5}s`,
            });
            star.className = 'star';
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
});// =======================================================================
// script.js - CÓDIGO CORRIGIDO E DEFINITIVO
// =======================================================================

// Variáveis e seletores do DOM
const participantsList = document.getElementById('participants-list');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminPanel = document.getElementById('admin-panel');
const logoutBtn = document.getElementById('logout-btn');
const bulkPlayForm = document.getElementById('bulk-play-form');
const bulkPlayersInput = document.getElementById('bulk-players-input');
const bulkPlayBtn = document.getElementById('bulk-play-btn');
const resetButton = document.getElementById('reset-btn');

// Função fetchAPI ajustada para enviar o token se existir
const fetchAPI = async (url, options = {}) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers: headers,
    });

    if (!response.ok) {
        if (response.status === 403 || response.status === 401) {
            localStorage.removeItem('token');
            window.location.reload(); 
        }
        throw new Error(response.statusText);
    }

    return response.json();
};

// =======================================================================
// RENDERIZAÇÃO E INÍCIO DA APLICAÇÃO
// =======================================================================

// A função renderParticipants usa a rota pública para evitar o erro 403
const renderParticipants = async () => {
    try {
        // CORREÇÃO: Usa a nova rota pública para buscar participantes
        const participants = await fetchAPI('/api/participants-public'); 
        participantsList.innerHTML = '';
        participants.forEach(nick => {
            const li = document.createElement('li');
            li.textContent = nick;
            participantsList.appendChild(li);
        });
    } catch (error) {
        console.error('Erro ao buscar participantes:', error);
    }
};

const renderRanking = async () => {
    // ... Mantenha sua lógica de ranking aqui ...
    try {
        const ranking = await fetchAPI('/api/ranking');
        // ... Lógica para renderizar o ranking ...
        console.log('Ranking:', ranking);
    } catch (error) {
        console.error('Erro ao buscar ranking:', error);
    }
};

// Função para exibir o painel do administrador se o token for válido
const checkAdminStatus = async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            // Tenta buscar os dados do administrador com a rota protegida
            await fetchAPI('/api/participants');
            
            // Se a requisição for bem-sucedida, o token é válido
            adminPanel.style.display = 'block';
            adminLoginBtn.style.display = 'none';
            console.log('Token de admin válido.');

        } catch (error) {
            console.error('Token de admin inválido ou expirado.', error);
            localStorage.removeItem('token');
            adminPanel.style.display = 'none';
            adminLoginBtn.style.display = 'block';
        }
    } else {
        adminPanel.style.display = 'none';
        adminLoginBtn.style.display = 'block';
    }
};

// =======================================================================
// EVENTOS
// =======================================================================

// Adicionar evento de login de admin
adminLoginBtn.addEventListener('click', async () => {
    const user = prompt('Usuário:');
    const pass = prompt('Senha:');
    try {
        const response = await fetch('/api/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass })
        });
        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('token', data.token);
            checkAdminStatus();
            alert('Login de admin realizado com sucesso!');
        } else {
            alert('Credenciais de admin inválidas.');
        }
    } catch (error) {
        console.error('Erro no login de admin:', error);
    }
});

// Evento de bulk play
bulkPlayForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const playersString = bulkPlayersInput.value;
    const nicks = playersString.split(/[\n,]+/).map(nick => nick.trim()).filter(nick => nick !== '');

    try {
        await fetchAPI('/api/bulk-play', {
            method: 'POST',
            body: JSON.stringify({ nicks })
        });
        console.log('Jogadores adicionados em massa.');
        bulkPlayersInput.value = '';
        await renderParticipants(); 
    } catch (error) {
        console.error('Erro ao adicionar jogadores em massa:', error);
        alert('Erro ao adicionar jogadores. Verifique se você está logado.');
    }
});

// Evento de logout
logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    window.location.reload();
});

// Evento de reset
resetButton.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja resetar o ranking? Esta ação é irreversível.')) {
        try {
            await fetchAPI('/api/reset-ranking', {
                method: 'DELETE'
            });
            alert('Ranking resetado com sucesso!');
            await renderParticipants();
            await renderRanking();
        } catch (error) {
            console.error('Erro ao resetar o ranking:', error);
            alert('Erro ao resetar o ranking. Verifique se você está logado.');
        }
    }
});

// Chamadas iniciais
renderParticipants();
renderRanking();
checkAdminStatus();