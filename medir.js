document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    const nicknameInput = document.getElementById('nickname');
    const rankingTableBody = document.querySelector('#ranking-table tbody');

    // Função para carregar o ranking do localStorage
    function loadRanking() {
        const ranking = JSON.parse(localStorage.getItem('stressRanking')) || [];
        ranking.sort((a, b) => a.score - b.score);
        rankingTableBody.innerHTML = '';
        ranking.forEach((player, index) => {
            const row = rankingTableBody.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${player.nick}</td>
                <td>${player.score}</td>
            `;
        });
    }

    // Botão para iniciar o jogo
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const nickname = nicknameInput.value.trim();
            if (nickname.length > 0) {
                localStorage.setItem('currentPlayerNick', nickname);
                window.location.href = 'game.html';
            } else {
                alert('Por favor, digite seu nick para começar!');
            }
        });
    }

    // Carregar o ranking ao carregar a página
    loadRanking();
});