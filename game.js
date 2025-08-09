document.addEventListener('DOMContentLoaded', () => {
    const playerNickSpan = document.getElementById('player-nick');
    const counterDisplay = document.getElementById('counter');
    const emotionsContainer = document.getElementById('emotions-container');
    const resultsContainer = document.getElementById('results');
    const stressLevelDisplay = document.getElementById('stress-level');

    const currentPlayerNick = localStorage.getItem('currentPlayerNick');

    if (playerNickSpan && currentPlayerNick) {
        playerNickSpan.textContent = currentPlayerNick;
    } else {
        window.location.href = 'medir.html';
        return;
    }

    const cosmicEmotions = [
        { name: "Cosmic Awe", icon: "🌌" },
        { name: "Stellar Wonder", icon: "✨" },
        { name: "Galactic Loneliness", icon: "🌠" },
        { name: "Nebulous Curiosity", icon: "🪐" },
        { name: "Black Hole Dread", icon: "⚫" },
        { name: "Supernova Euphoria", icon: "💥" },
        { name: "Orbital Serenity", icon: "🌀" },
        { name: "Cometary Nostalgia", icon: "☄️" },
        { name: "Interstellar Longing", icon: "🌉" },
        { name: "Celestial Bliss", icon: "🌠" },
        { name: "Quantum Confusion", icon: "⚛️" },
        { name: "Dark Matter Melancholy", icon: "🌑" },
        { name: "Astral Connection", icon: "🔮" },
        { name: "Gravitational Pull", icon: "⬇️" },
        { name: "Cosmic Belonging", icon: "🌍" },
        { name: "Event Horizon Anxiety", icon: "⏳" },
        { name: "Pulsar Passion", icon: "💓" },
        { name: "Meteoric Inspiration", icon: "💫" },
        { name: "Solar Flare Anger", icon: "🔥" },
        { name: "Lunar Tranquility", icon: "🌙" },
        { name: "Intergalactic Wanderlust", icon: "🚀" },
        { name: "Singularity Focus", icon: "⚪" },
        { name: "Asteroid Anxiety", icon: "🌑" },
        { name: "Cosmic Confusion", icon: "⁉️" },
        { name: "Stardust Joy", icon: "🌟" },
        { name: "Red Giant Resignation", icon: "🔴" },
        { name: "White Dwarf Resilience", icon: "⚪" },
        { name: "Dark Energy Restlessness", icon: "⚡" },
        { name: "Astral Projection Freedom", icon: "👁️" },
        { name: "Nova Hope", icon: "💫" },
        { name: "Quasar Clarity", icon: "💡" },
        { name: "Meteor Shower Excitement", icon: "🌠" },
        { name: "Cosmic Microwave Background", icon: "🌡️" },
        { name: "Event Horizon Resolve", icon: "⏭️" },
        { name: "Interplanetary Jealousy", icon: "👁️‍🗨️" },
        { name: "Gravitational Wave Empathy", icon: "〰️" },
        { name: "Kuiper Belt Detachment", icon: "🪐" },
        { name: "Oort Cloud Isolation", icon: "🌫️" },
        { name: "Solar Wind Elation", icon: "🌬️" },
        { name: "Cosmic Ray Vitality", icon: "☢️" },
        { name: "Dark Nebula Obscurity", icon: "🌑" },
        { name: "Planetary Alignment Harmony", icon: "♎" },
        { name: "Accretion Disk Obsession", icon: "⭕" },
        { name: "Magnetar Attraction", icon: "🧲" },
        { name: "Wormhole Anticipation", icon: "🕳️" },
        { name: "Protoplanetary Disk Potential", icon: "🛸" },
        { name: "Gamma Ray Burst Shock", icon: "💢" },
        { name: "Cosmic String Connection", icon: "🧵" },
        { name: "Multiverse Wonder", icon: "🔄" },
        { name: "Big Bang Inspiration", icon: "💭" }
    ];

    let selectedCount = 0;
    const maxSelections = 10;
    const selectedEmotions = [];

    function getRandomValue() {
        return Math.floor(Math.random() * 10001) - 5000;
    }

    function renderEmotionIcons() {
        emotionsContainer.innerHTML = '';
        cosmicEmotions.forEach((emotion) => {
            const iconElement = document.createElement('div');
            iconElement.className = 'emotion-icon';
            iconElement.innerHTML = `
                <div class="icon">${emotion.icon}</div>
                <div class="name">${emotion.name}</div>
                <div class="value">${emotion.value || ''}</div>
            `;
            emotion.element = iconElement;

            iconElement.addEventListener('click', () => {
                if (selectedCount < maxSelections) {
                    if (!iconElement.classList.contains('selected')) {
                        const icon = iconElement.querySelector('.icon');
                        icon.style.animation = 'rotate 0.5s linear infinite';
                        
                        const newValue = getRandomValue();
                        emotion.value = newValue;
                        iconElement.querySelector('.value').textContent = newValue;
                        iconElement.classList.add('selected');
                        selectedCount++;
                        selectedEmotions.push(emotion);
                        updateCounter();
                        
                        if (selectedCount === maxSelections) {
                            showResults();
                        }
                    }
                }
            });
            emotionsContainer.appendChild(iconElement);
        });
    }

    function updateCounter() {
        const remaining = maxSelections - selectedCount;
        counterDisplay.textContent = remaining > 0 ? `Faltam selecionar: ${remaining}` : 'Você selecionou 10 emoções!';
    }

    function showResults() {
        selectedEmotions.sort((a, b) => a.value - b.value);
        const totalScore = selectedEmotions.reduce((sum, emotion) => sum + emotion.value, 0);
        
        const ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
        
        const updatedRanking = ranking.filter(entry => entry.nick !== currentPlayerNick);
        updatedRanking.push({ nick: currentPlayerNick, score: totalScore });
        
        localStorage.setItem('stressRanking', JSON.stringify(updatedRanking));

        emotionsContainer.style.display = 'none';
        counterDisplay.style.display = 'none';
        resultsContainer.style.display = 'block';
        stressLevelDisplay.textContent = `Pontuação Total: ${totalScore}`;
        
        selectedEmotions.slice(0, 3).forEach(emotion => emotion.element.classList.add('best'));
        selectedEmotions.slice(-3).forEach(emotion => emotion.element.classList.add('worst'));

        const restartBtn = document.getElementById('restart-btn');
        restartBtn.style.display = 'inline-block';
    }

    renderEmotionIcons();
    updateCounter();
});