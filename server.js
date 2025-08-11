require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
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

app.use(express.json());
app.use(cors());

// Configuração para servir arquivos estáticos e a página principal
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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

app.get('/api/ranking', async (req, res) => {
    try {
        const ranking = await db.collection("ranking").find().sort({ score: -1 }).toArray();
        res.json(ranking);
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar ranking" });
    }
});

app.post('/api/play', async (req, res) => {
    try {
        const { nick } = req.body;
        if (!nick) return res.status(400).json({ error: "Nick é obrigatório" });
        const score = Math.floor(Math.random() * 20001) - 10000;
        const result = await db.collection("ranking").updateOne(
            { nick: nick },
            { $set: { nick, score, lastUpdated: new Date() } },
            { upsert: true }
        );
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: "Erro ao jogar" });
    }
});

app.post('/api/admin-login', (req, res) => {
    const { user, pass } = req.body;
    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        const token = jwt.sign({ user: ADMIN_USER }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ success: true, token });
    } else {
        res.status(401).json({ success: false, message: 'Credenciais inválidas' });
    }
});

app.get('/api/participants', authenticateToken, async (req, res) => {
    try {
        const participants = await db.collection("ranking").find({}, { projection: { nick: 1, _id: 0 } }).toArray();
        res.json(participants.map(p => p.nick));
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar participantes" });
    }
});

app.delete('/api/participants/:nick', authenticateToken, async (req, res) => {
    try {
        const { nick } = req.params;
        await db.collection("ranking").deleteOne({ nick });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao remover participante" });
    }
});

app.post('/api/bulk-play', authenticateToken, async (req, res) => {
    try {
        const { nicks } = req.body;
        if (!Array.isArray(nicks)) return res.status(400).json({ error: "Entrada inválida" });

        const operations = nicks.map(nick => ({
            updateOne: {
                filter: { nick },
                update: { $set: { nick, score: Math.floor(Math.random() * 20001) - 10000, lastUpdated: new Date() } },
                upsert: true
            }
        }));

        const result = await db.collection("ranking").bulkWrite(operations);
        res.json({ success: true, ...result });
    } catch (e) {
        res.status(500).json({ error: "Erro em operação em massa" });
    }
});

app.delete('/api/reset-ranking', authenticateToken, async (req, res) => {
    try {
        await db.collection("ranking").deleteMany({});
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao resetar ranking" });
    }
});

app.post('/api/add-participant', authenticateToken, async (req, res) => {
    try {
        const { nick } = req.body;
        if (!nick) return res.status(400).json({ error: "Nick é obrigatório" });
        const result = await db.collection("ranking").updateOne(
            { nick },
            { $set: { nick, score: 0, lastUpdated: new Date() } },
            { upsert: true }
        );
        res.json({ success: true, result });
    } catch (e) {
        res.status(500).json({ error: "Erro ao adicionar participante" });
    }
});


async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`\n🚀 Servidor rodando na porta ${port}`);
            console.log(`🔗 Acesse: http://localhost:${port}`);
            console.log(`⚙️  Modo: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🗄️  Banco de dados: ${uri.split('@')[1].split('/')[0]}\n`);
        });
    } catch (e) {
        console.error("Falha ao iniciar servidor:", e);
        process.exit(1);
    }
}

startServer();