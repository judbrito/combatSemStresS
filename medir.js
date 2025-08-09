document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const nicknameInput = document.getElementById('nickname');
    const rankingTableBody = document.querySelector('#ranking-table tbody');

    // Função para renderizar o ranking na página 'medir.html'
    function renderRanking() {
        const ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
        rankingTableBody.innerHTML = '';

        const sortedRanking = ranking.sort((a, b) => {
            // "Não jogou" sempre fica no final
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
    }

    // Evento de clique para o botão "Medir SemStresS!"
    startBtn.addEventListener('click', () => {
        const nickname = nicknameInput.value.trim();

        if (nickname.length > 0 && nickname.length <= 6) {
            localStorage.setItem('currentPlayerNick', nickname);
            window.location.href = 'game.html';
        } else {
            alert('Por favor, insira um nick válido com no máximo 6 caracteres.');
        }
    });

    renderRanking();
});