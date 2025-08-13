require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const http = require('http');

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 10000;
const uri = process.env.MONGODB_URI;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db(process.env.DB_NAME || "combat_sem_stress");
        console.log("Conectado ao MongoDB!");
    } catch (e) {
        console.error("Falha ao conectar ao banco de dados:", e);
        process.exit(1);
    }
}

// Configuração do CORS
const corsOptions = {
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://semstressorteio.onrender.com'] 
        : '*',
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Middlewares
app.use(express.json());

// Configuração para servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rota principal - sempre serve o index.html da pasta public
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// Constants for score calculation
const MIN_SCORE = -10000;
const MAX_SCORE = 10000;

// Rotas da API
app.get('/api/ranking', async (req, res) => {
    try {
        const rankingData = await db.collection("ranking").find().sort({ score: -1 }).toArray();
        
        const totalPlayers = rankingData.length;
        const half = Math.floor(totalPlayers / 2); // Usamos floor para pegar a metade inferior

        const ranking = rankingData.map((player, index) => {
            let status = '';
            
            // Primeiro verifica se é o TemStresS (maior score positivo)
            if (index === 0 && player.score > 0) {
                status = 'TemStresS';
            } 
            // Depois verifica os SemStresS (todos com score negativo)
            else if (player.score < 0) {
                status = 'SemStresS';
            }
            // Por último, os MeiaBoca (metade inferior do ranking, exceto negativos)
            else if (index >= half && player.score >= 0) {
                status = 'MeiaBoca';
            }

            return {
                nick: player.nick,
                score: player.score,
                stressStatus: status
            };
        });

        res.json(ranking);
    } catch (e) {
        console.error("Erro ao buscar ranking:", e);
        res.status(500).json({ error: "Erro ao buscar ranking" });
    }
});

app.post('/api/play', async (req, res) => {
    try {
        const { nick, selectedNumber } = req.body;
        if (!nick) return res.status(400).json({ error: "Nick é obrigatório" });
        if (selectedNumber === undefined || selectedNumber < 1 || selectedNumber > 10) {
            return res.status(400).json({ error: "Número inválido. Deve ser entre 1 e 10" });
        }

        // Calcula o score baseado no número selecionado (1-10)
        // Quanto maior o número, maior a chance de score positivo
        const scoreRange = MAX_SCORE - MIN_SCORE;
        const baseScore = Math.floor((selectedNumber / 10) * scoreRange) + MIN_SCORE;
        
        // Adiciona alguma aleatoriedade dentro do range do número selecionado
        const minScoreForNumber = MIN_SCORE + (selectedNumber - 1) * 2000;
        const maxScoreForNumber = MIN_SCORE + selectedNumber * 2000;
        const finalScore = Math.floor(Math.random() * (maxScoreForNumber - minScoreForNumber + 1)) + minScoreForNumber;

        const result = await db.collection("ranking").updateOne(
            { nick: nick },
            { $set: { nick, score: finalScore, lastUpdated: new Date() } },
            { upsert: true }
        );
        
        res.json({
            success: true,
            nick,
            score: finalScore,
            result
        });
    } catch (e) {
        console.error("Erro ao jogar:", e);
        res.status(500).json({ error: "Erro ao jogar" });
    }
});

// ... (mantenha o restante das rotas como estão no código anterior)

// Inicialização do servidor
async function startServer() {
    try {
        await connectDB();
        server.listen(port, () => {
            console.log(`\n🚀 Servidor rodando na porta ${port}`);
            console.log(`🔗 Acesse: http://localhost:${port}`);
            console.log(`⚙️  Modo: ${process.env.NODE_ENV || 'development'}`);
            if (uri) {
                console.log(`🗄️  Banco de dados: ${uri.split('@')[1].split('/')[0]}`);
            } else {
                console.error('⚠️  MONGODB_URI não definida!');
            }
            if (!ADMIN_USER || !ADMIN_PASS) {
                console.error('⚠️  Credenciais de admin não definidas!');
            }
            console.log(`📁 Servindo arquivos estáticos de: ${path.join(__dirname, 'public')}\n`);
        });
    } catch (e) {
        console.error("Falha ao iniciar servidor:", e);
        process.exit(1);
    }
}

startServer();