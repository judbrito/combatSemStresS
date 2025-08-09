document.addEventListener('DOMContentLoaded', () => {
    // === Variáveis Globais e Constantes ===
    const pages = document.querySelectorAll('.page-section');
    const navLinks = document.querySelectorAll('a[data-target]');
    const nicknameInput = document.getElementById('nickname');
    const startBtn = document.getElementById('start-btn');
    const rankingTableBody = document.querySelector('#ranking-table tbody');
    const playAudioBtn = document.getElementById('play-audio-btn');
    const messageText = document.getElementById('message-text');
    const audio = new Audio('https://clanssemstress.com/message.mp3');

    // === Variáveis do Jogo ===
    const playerNickSpan = document.getElementById('player-nick');
    const counterDisplay = document.getElementById('counter');
    const emotionsContainer = document.getElementById('emotions-container');
    const resultsContainer = document.getElementById('results');
    const stressLevelDisplay = document.getElementById('stress-level');
    const restartBtn = document.getElementById('restart-btn');
    const cosmicEmotions = [
        { name: "Cosmic Awe", icon: "🌌" }, { name: "Stellar Wonder", icon: "✨" },
        { name: "Galactic Loneliness", icon: "🌠" }, { name: "Nebulous Curiosity", icon: "🪐" },
        { name: "Black Hole Dread", icon: "⚫" }, { name: "Supernova Euphoria", icon: "💥" },
        { name: "Orbital Serenity", icon: "🌀" }, { name: "Cometary Nostalgia", icon: "☄️" },
        { name: "Interstellar Longing", icon: "🌉" }, { name: "Celestial Bliss", icon: "🌠" },
        { name: "Quantum Confusion", icon: "⚛️" }, { name: "Dark Matter Melancholy", icon: "🌑" },
        { name: "Astral Connection", icon: "🔮" }, { name: "Gravitational Pull", icon: "⬇️" },
        { name: "Cosmic Belonging", icon: "🌍" }, { name: "Event Horizon Anxiety", icon: "⏳" },
        { name: "Pulsar Passion", icon: "💓" }, { name: "Meteoric Inspiration", icon: "💫" },
        { name: "Solar Flare Anger", icon: "🔥" }, { name: "Lunar Tranquility", icon: "🌙" },
        { name: "Intergalactic Wanderlust", icon: "🚀" }, { name: "Singularity Focus", icon: "⚪" },
        { name: "Asteroid Anxiety", icon: "🌑" }, { name: "Cosmic Confusion", icon: "⁉️" },
        { name: "Stardust Joy", icon: "🌟" }, { name: "Red Giant Resignation", icon: "🔴" },
        { name: "White Dwarf Resilience", icon: "⚪" }, { name: "Dark Energy Restlessness", icon: "⚡" },
        { name: "Astral Projection Freedom", icon: "👁️" }, { name: "Nova Hope", icon: "💫" },
        { name: "Quasar Clarity", icon: "💡" }, { name: "Meteor Shower Excitement", icon: "🌠" },
        { name: "Cosmic Microwave Background", icon: "🌡️" }, { name: "Event Horizon Resolve", icon: "⏭️" },
        { name: "Interplanetary Jealousy", icon: "👁️‍🗨️" }, { name: "Gravitational Wave Empathy", icon: "〰️" },
        { name: "Kuiper Belt Detachment", icon: "🪐" }, { name: "Oort Cloud Isolation", icon: "🌫️" },
        { name: "Solar Wind Elation", icon: "🌬️" }, { name: "Cosmic Ray Vitality", icon: "☢️" },
        { name: "Dark Nebula Obscurity", icon: "🌑" }, { name: "Planetary Alignment Harmony", icon: "♎" },
        { name: "Accretion Disk Obsession", icon: "⭕" }, { name: "Magnetar Attraction", icon: "🧲" },
        { name: "Wormhole Anticipation", icon: "🕳️" }, { name: "Protoplanetary Disk Potential", icon: "🛸" },
        { name: "Gamma Ray Burst Shock", icon: "💢" }, { name: "Cosmic String Connection", icon: "🧵" },
        { name: "Multiverse Wonder", icon: "🔄" }, { name: "Big Bang Inspiration", icon: "💭" }
    ];
    let selectedCount = 0;
    const maxSelections = 10;
    let selectedEmotions = [];

    // === Variáveis do Admin (Removidas senhas) ===
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

    // URL base da sua API do Render (substitua pelo URL final do seu backend)
    const API_URL = 'http://localhost:3000/api';

    // === Funções de Navegação e Carregamento ===
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
            window.scrollTo(0, 0);

            if (pageId === 'medir-section') {
                renderRanking();
            } else if (pageId === 'game-section') {
                startGame();
            } else if (pageId === 'admin-section') {
                // A lógica de login agora está em um evento de 'submit' do formulário
                if (localStorage.getItem('adminLoggedIn') === 'true') {
                    if (loginSection) loginSection.style.display = 'none';
                    if (adminDashboard) adminDashboard.style.display = 'block';
                    renderParticipantsList();
                } else {
                    if (loginSection) loginSection.style.display = 'block';
                    if (adminDashboard) adminDashboard.style.display = 'none';
                }
            }
        }
    }

    // === Lógica da Tela Principal (Home) ===
    if (playAudioBtn && messageText) {
        let isAudioPlaying = false;
        playAudioBtn.addEventListener('click', () => {
            if (!isAudioPlaying) {
                audio.play();
                isAudioPlaying = true;
                playAudioBtn.textContent = 'Parar Mensagem';
                messageText.textContent = "Olá, meu amigo. Oceano aqui, pra te falar que não há nada mais importante que a vida, não deixe nada te estressar. Tenha um excelente jogo! Sem Stress!";
                messageText.style.display = 'block';
            } else {
                audio.pause();
                audio.currentTime = 0;
                isAudioPlaying = false;
                playAudioBtn.textContent = 'Tocar Mensagem';
                messageText.style.display = 'none';
            }
        });
    }

    // === Lógica do Medir Stress ===
    function renderRanking() {
        if (!rankingTableBody) return;
        rankingTableBody.innerHTML = '';
        fetch(`${API_URL}/ranking`)
            .then(response => response.json())
            .then(ranking => {
                const sortedRanking = ranking.sort((a, b) => {
                    if (a.score === "Não jogou") return 1;
                    if (b.score === "Não jogou") return -1;
                    return a.score - b.score;
                });
                sortedRanking.forEach((entry, index) => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${entry.nick}</td>
                        <td>${entry.score}</td>
                    `;
                    rankingTableBody.appendChild(row);
                });
            })
            .catch(error => {
                console.error('Erro ao carregar o ranking:', error);
                alert('Erro ao carregar o ranking.');
            });
    }

    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const nickname = nicknameInput.value.trim();
            if (nickname.length > 0 && nickname.length <= 6) {
                localStorage.setItem('currentPlayerNick', nickname);
                showPage('game-section');
            } else {
                alert('Por favor, insira um nick de 1 a 6 caracteres.');
            }
        });
    }

    // === Lógica do Jogo ===
    function getRandomValue() {
        return Math.floor(Math.random() * 10001) - 5000;
    }

    function startGame() {
        const currentPlayerNick = localStorage.getItem('currentPlayerNick');
        if (!currentPlayerNick) {
            showPage('medir-section');
            return;
        }
        if (playerNickSpan) playerNickSpan.textContent = currentPlayerNick;
        selectedCount = 0;
        selectedEmotions = [];
        if (emotionsContainer) emotionsContainer.style.display = 'grid';
        if (counterDisplay) counterDisplay.style.display = 'block';
        if (resultsContainer) resultsContainer.style.display = 'none';
        updateCounter();
        renderEmotionIcons();
    }

    function renderEmotionIcons() {
        if (!emotionsContainer) return;
        emotionsContainer.innerHTML = '';
        cosmicEmotions.forEach((emotion, index) => {
            const iconElement = document.createElement('div');
            iconElement.className = 'emotion-icon';
            iconElement.innerHTML = `
                <div class="icon">${emotion.icon}</div>
                <div class="name">${emotion.name}</div>
                <div class="value">...</div>
            `;
            iconElement.addEventListener('click', () => {
                if (selectedCount < maxSelections && !iconElement.classList.contains('selected')) {
                    const newValue = getRandomValue();
                    const emotionWithId = { ...emotion, value: newValue, element: iconElement, id: index };
                    iconElement.querySelector('.value').textContent = `[${newValue}]`;
                    iconElement.classList.add('selected');
                    selectedCount++;
                    selectedEmotions.push(emotionWithId);
                    updateCounter();
                    if (selectedCount === maxSelections) {
                        showResults();
                    }
                }
            });
            emotionsContainer.appendChild(iconElement);
        });
    }

    function updateCounter() {
        if (!counterDisplay) return;
        const remaining = maxSelections - selectedCount;
        counterDisplay.textContent = remaining > 0 ? `Faltam selecionar: ${remaining}` : 'Você selecionou 10 emoções!';
    }

    function showResults() {
        if (!resultsContainer) return;
        selectedEmotions.sort((a, b) => a.value - b.value);
        const totalScore = selectedEmotions.reduce((sum, emotion) => sum + emotion.value, 0);

        const data = {
            nick: localStorage.getItem('currentPlayerNick'),
            score: totalScore
        };

        fetch(`${API_URL}/ranking`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao salvar o score.');
            }
            return response.json();
        })
        .then(result => {
            console.log('Score salvo com sucesso:', result);
        })
        .catch((error) => {
            console.error('Erro:', error);
            alert('Erro ao salvar o score.');
        });
        
        if (emotionsContainer) emotionsContainer.style.display = 'none';
        if (counterDisplay) counterDisplay.style.display = 'none';
        resultsContainer.style.display = 'block';
        if (stressLevelDisplay) stressLevelDisplay.textContent = `Pontuação Total: ${totalScore}`;
        
        selectedEmotions.slice(0, 3).forEach(emotion => emotion.element.classList.add('best'));
        selectedEmotions.slice(-3).forEach(emotion => emotion.element.classList.add('worst'));
    }

    if (restartBtn) {
        restartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            showPage('medir-section');
        });
    }

    // === Lógica do Admin (agora com API) ===
    function renderParticipantsList() {
        if (!participantsList) return;
        participantsList.innerHTML = '';
        fetch(`${API_URL}/ranking`)
            .then(response => response.json())
            .then(ranking => {
                ranking.sort((a, b) => a.nick.localeCompare(b.nick));
                ranking.forEach(participant => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <span>${participant.nick} - ${participant.score === 'Não jogou' ? 'Não jogou' : participant.score}</span>
                        <button class="delete-btn" data-nick="${participant.nick}">Excluir</button>
                    `;
                    participantsList.appendChild(li);
                });
                document.querySelectorAll('.delete-btn').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const nickToDelete = e.target.dataset.nick;
                        fetch(`${API_URL}/participants/${nickToDelete}`, {
                            method: 'DELETE'
                        })
                        .then(response => {
                            if (!response.ok) throw new Error('Erro ao excluir participante.');
                            renderParticipantsList();
                        })
                        .catch(error => {
                            console.error('Erro:', error);
                            alert('Erro ao excluir participante.');
                        });
                    });
                });
            })
            .catch(error => {
                console.error('Erro ao carregar lista de participantes:', error);
                alert('Erro ao carregar lista de participantes.');
            });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = usernameInput.value;
            const password = passwordInput.value;
            // Assumimos que o backend valida o login e retorna um token ou status de sucesso
            fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(response => {
                if (response.ok) {
                    localStorage.setItem('adminLoggedIn', 'true');
                    if (loginSection) loginSection.style.display = 'none';
                    if (adminDashboard) adminDashboard.style.display = 'block';
                    renderParticipantsList();
                } else {
                    if (loginError) {
                        loginError.textContent = 'Usuário ou senha incorretos.';
                        loginError.style.display = 'block';
                    }
                }
            })
            .catch(error => {
                console.error('Erro de login:', error);
                if (loginError) {
                    loginError.textContent = 'Erro ao conectar com o servidor.';
                    loginError.style.display = 'block';
                }
            });
        });
    }

    if (addParticipantBtn) {
        addParticipantBtn.addEventListener('click', () => {
            const newNick = newParticipantInput.value.trim();
            if (newNick.length > 0 && newNick.length <= 6) {
                fetch(`${API_URL}/participants`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nick: newNick })
                })
                .then(response => {
                    if (!response.ok) throw new Error('Erro ao adicionar participante.');
                    newParticipantInput.value = '';
                    renderParticipantsList();
                    alert(`Participante ${newNick} adicionado com sucesso!`);
                })
                .catch(error => {
                    console.error('Erro:', error);
                    alert('Erro ao adicionar participante.');
                });
            } else {
                alert('Por favor, insira um nick de 1 a 6 caracteres.');
            }
        });
    }

    if (bulkPlayBtn) {
        bulkPlayBtn.addEventListener('click', () => {
            const nicksString = bulkParticipantsInput.value.trim();
            if (nicksString) {
                const nicks = nicksString.split(',').map(nick => nick.trim()).filter(nick => nick.length > 0 && nick.length <= 6);
                if (nicks.length > 0) {
                    fetch(`${API_URL}/bulk-play`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ nicks })
                    })
                    .then(response => {
                        if (!response.ok) throw new Error('Erro ao jogar em massa.');
                        bulkParticipantsInput.value = '';
                        renderParticipantsList();
                        alert(`Participante(s) adicionado(s) e já jogado(s) com sucesso!`);
                    })
                    .catch(error => {
                        console.error('Erro:', error);
                        alert('Erro ao jogar em massa.');
                    });
                } else {
                    alert('Nenhum novo participante válido foi adicionado e jogado. Verifique se o nome tem no máximo 6 caracteres.');
                }
            } else {
                alert('Por favor, insira um ou mais nicks separados por vírgula.');
            }
        });
    }

    if (resetRankingBtn) {
        resetRankingBtn.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja resetar todo o ranking? Esta ação não pode ser desfeita.')) {
                fetch(`${API_URL}/reset-ranking`, { method: 'DELETE' })
                    .then(response => {
                        if (!response.ok) throw new Error('Erro ao resetar ranking.');
                        alert('Ranking resetado com sucesso!');
                        renderParticipantsList();
                    })
                    .catch(error => {
                        console.error('Erro:', error);
                        alert('Erro ao resetar ranking.');
                    });
            }
        });
    }

    // --- Lógica das estrelas voadoras ---
    const starBackground = document.getElementById('star-background');
    const colors = ['#ffffff', '#f8f8a0', '#a0d0f8', '#f8a0a0', '#a0f8a0'];
    const numStars = 100;
    
    function createStar() {
        if (!starBackground) return;
        const star = document.createElement('div');
        star.className = 'star';
        const size = Math.random() * 4 + 2;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const startSide = Math.floor(Math.random() * 4);
        let x, y;
        switch(startSide) {
            case 0: x = Math.random() * window.innerWidth; y = -20; break;
            case 1: x = window.innerWidth + 20; y = Math.random() * window.innerHeight; break;
            case 2: x = Math.random() * window.innerWidth; y = window.innerHeight + 20; break;
            case 3: x = -20; y = Math.random() * window.innerHeight; break;
        }
        const targetX = Math.random() * window.innerWidth;
        const targetY = Math.random() * window.innerHeight;
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.random() * 2 + 1;
        const speedX = (dx / distance) * speed;
        const speedY = (dy / distance) * speed;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.left = `${x}px`;
        star.style.top = `${y}px`;
        star.style.background = color;
        star.style.boxShadow = `0 0 ${size*2}px ${size/2}px ${color}`;
        const rotationSpeed = Math.random() * 5 + 2;
        star.style.animation = `rotate ${rotationSpeed}s linear infinite`;
        starBackground.appendChild(star);
        animateStar(star, speedX, speedY);
    }
    
    function animateStar(star, speedX, speedY) {
        let x = parseFloat(star.style.left);
        let y = parseFloat(star.style.top);
        function move() {
            x += speedX;
            y += speedY;
            if (x < -50 || x > window.innerWidth + 50 || y < -50 || y > window.innerHeight + 50) {
                star.remove();
                createStar();
                return;
            }
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            requestAnimationFrame(move);
        }
        move();
    }
    
    function initializeStars() {
        if (!starBackground) return;
        starBackground.innerHTML = '';
        for (let i = 0; i < numStars; i++) {
            createStar();
        }
    }
    
    window.addEventListener('resize', () => {
        initializeStars();
    });

    // --- Inicialização do SPA ---
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = e.target.dataset.target;
            showPage(targetId);
        });
    });

    // Inicializa as estrelas voadoras e a navegação SPA
    initializeStars();
    showPage('home-section');
});