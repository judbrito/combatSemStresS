document.addEventListener('DOMContentLoaded', () => {
    // Código para o botão de áudio
    const playAudioBtn = document.getElementById('play-audio-btn');
    const audio = new Audio('audio/mensagem.mp3');

    if (playAudioBtn) {
        playAudioBtn.addEventListener('click', () => {
            audio.play();
        });
    }

    // Seções animadas
    const animateElements = document.querySelectorAll('.animate-fade-in, .animate-slide-up');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    animateElements.forEach(el => {
        observer.observe(el);
    });

    // Animação de estrelas
    const colors = ['#ffffff', '#f8f8a0', '#a0d0f8', '#f8a0a0', '#a0f8a0'];
    const numStars = 100;
    const container = document.getElementById('star-background');

    function createStar() {
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
        
        container.appendChild(star);
        
        animateStar(star, speedX, speedY);
    }

    function animateStar(star, speedX, speedY) {
        let x = parseFloat(star.style.left);
        let y = parseFloat(star.style.top);
        
        function move() {
            x += speedX;
            y += speedY;
            
            if (x < -50 || x > window.innerWidth + 50 || 
                y < -50 || y > window.innerHeight + 50) {
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
    
    for (let i = 0; i < numStars; i++) {
        createStar();
    }
    
    window.addEventListener('resize', function() {
        document.querySelectorAll('.star').forEach(star => star.remove());
        for (let i = 0; i < numStars; i++) {
            createStar();
        }
    });
});

        document.addEventListener('DOMContentLoaded', function() {
            const colors = ['#ffffff', '#f8f8a0', '#a0d0f8', '#f8a0a0', '#a0f8a0'];
            const numStars = 100;
            
            for (let i = 0; i < numStars; i++) {
                createStar();
            }
            
            function createStar() {
                const star = document.createElement('div');
                star.className = 'star';
                
                // Tamanho aleatório
                const size = Math.random() * 4 + 2;
                
                // Cor aleatória
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                // Ponto de partida aleatório (pode estar fora da tela)
                const startSide = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
                let x, y;
                
                switch(startSide) {
                    case 0: // top
                        x = Math.random() * window.innerWidth;
                        y = -20;
                        break;
                    case 1: // right
                        x = window.innerWidth + 20;
                        y = Math.random() * window.innerHeight;
                        break;
                    case 2: // bottom
                        x = Math.random() * window.innerWidth;
                        y = window.innerHeight + 20;
                        break;
                    case 3: // left
                        x = -20;
                        y = Math.random() * window.innerHeight;
                        break;
                }
                
                // Direção de movimento aleatória (em direção à tela)
                const targetX = Math.random() * window.innerWidth;
                const targetY = Math.random() * window.innerHeight;
                
                // Calcular vetor de direção
                const dx = targetX - x;
                const dy = targetY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const speed = Math.random() * 2 + 1;
                const speedX = (dx / distance) * speed;
                const speedY = (dy / distance) * speed;
                
                // Estilo da estrela
                star.style.width = `${size}px`;
                star.style.height = `${size}px`;
                star.style.left = `${x}px`;
                star.style.top = `${y}px`;
                star.style.background = color;
                star.style.boxShadow = `0 0 ${size*2}px ${size/2}px ${color}`;
                
                // Velocidade de rotação aleatória
                const rotationSpeed = Math.random() * 5 + 2;
                star.style.animation = `rotate ${rotationSpeed}s linear infinite`;
                
                document.body.appendChild(star);
                
                // Animar a estrela
                animateStar(star, speedX, speedY);
            }
            
            function animateStar(star, speedX, speedY) {
                let x = parseFloat(star.style.left);
                let y = parseFloat(star.style.top);
                
                function move() {
                    x += speedX;
                    y += speedY;
                    
                    // Se a estrela sair completamente da tela, reposiciona
                    if (x < -50 || x > window.innerWidth + 50 || 
                        y < -50 || y > window.innerHeight + 50) {
                        reposicionarEstrela(star);
                        return;
                    }
                    
                    star.style.left = `${x}px`;
                    star.style.top = `${y}px`;
                    
                    requestAnimationFrame(move);
                }
                
                move();
            }
            
            function reposicionarEstrela(star) {
                // Remove a estrela atual
                star.remove();
                
                // Cria uma nova estrela em posição aleatória
                createStar();
            }
            
            // Ajustar quando a janela for redimensionada
            window.addEventListener('resize', function() {
                document.querySelectorAll('.star').forEach(star => star.remove());
                for (let i = 0; i < numStars; i++) {
                    createStar();
                }
            });
        });
  