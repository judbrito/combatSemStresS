const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const ADMIN = {
    user: process.env.ADMIN_USER || 'admoceano',
    pass: process.env.ADMIN_PASS || '4107'
};

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const client = new MongoClient(uri);
let db;

async function connectDB() {
    try {
        await client.connect();
        db = client.db("combat_sem_stress");
        console.log("Conectado ao MongoDB!");
    } catch (e) {
        console.error("Erro ao conectar ao MongoDB:", e);
    }
}

// Rotas públicas
app.get('/api/ranking', async (req, res) => {
    try {
        const ranking = await db.collection("ranking").find().toArray();
        res.json(ranking);
    } catch (e) {
        res.status(500).json({ error: "Erro ao buscar ranking" });
    }
});

app.post('/api/ranking', async (req, res) => {
    try {
        const { nick, score } = req.body;
        if (!nick || typeof score !== 'number') {
            return res.status(400).json({ error: "Dados inválidos" });
        }

        await db.collection("ranking").updateOne(
            { nick },
            { $set: { nick, score } },
            { upsert: true }
        );
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao salvar score" });
    }
});

// Rotas de admin
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN.user && password === ADMIN.pass) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

app.post('/api/participants', async (req, res) => {
    try {
        const { nick } = req.body;
        if (!nick || nick.length > 6) {
            return res.status(400).json({ error: "Nick inválido" });
        }

        const exists = await db.collection("ranking").findOne({ nick });
        if (exists) {
            return res.status(409).json({ error: "Nick já existe" });
        }

        await db.collection("ranking").insertOne({ nick, score: "Não jogou" });
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao adicionar participante" });
    }
});

app.delete('/api/participants/:nick', async (req, res) => {
    try {
        const { nick } = req.params;
        const result = await db.collection("ranking").deleteOne({ nick: decodeURIComponent(nick) });
        
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: "Participante não encontrado" });
        }
        
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao excluir participante" });
    }
});

app.post('/api/bulk-play', async (req, res) => {
    try {
        const { nicks } = req.body;
        if (!Array.isArray(nicks)) {
            return res.status(400).json({ error: "Lista de nicks inválida" });
        }

        const operations = nicks.map(nick => ({
            updateOne: {
                filter: { nick },
                update: { $set: { nick, score: Math.floor(Math.random() * 20001) - 10000 } },
                upsert: true
            }
        }));

        await db.collection("ranking").bulkWrite(operations);
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao processar em massa" });
    }
});

app.delete('/api/reset-ranking', async (req, res) => {
    try {
        await db.collection("ranking").deleteMany({});
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erro ao resetar ranking" });
    }
});

// Iniciar servidor
connectDB().then(() => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
});