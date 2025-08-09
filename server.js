const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Variáveis do Admin
const ADMIN_USER = process.env.ADMIN_USER || 'admoceano';
const ADMIN_PASS = process.env.ADMIN_PASS || '4107'; // Use variáveis de ambiente!

// Configuração do MongoDB
const uri = process.env.MONGODB_URI; // Variável de ambiente do Render
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
let db;

async function connectToMongo() {
    try {
        await client.connect();
        db = client.db("combat_sem_stress");
        console.log("Conectado ao MongoDB!");
    } catch (e) {
        console.error("Erro ao conectar ao MongoDB:", e);
    }
}

// === Rotas de Ranking (Acesso Público) ===

// Rota para obter o ranking
app.get('/api/ranking', async (req, res) => {
    try {
        const ranking = await db.collection("ranking").find().sort({ score: 1 }).toArray();
        res.json(ranking);
    } catch (e) {
        res.status(500).send("Erro ao buscar o ranking.");
    }
});

// Rota para salvar ou atualizar um novo score
app.post('/api/ranking', async (req, res) => {
    const { nick, score } = req.body;
    if (!nick || score === undefined) {
        return res.status(400).send("Dados inválidos.");
    }
    try {
        await db.collection("ranking").updateOne(
            { nick: nick },
            { $set: { nick: nick, score: score } },
            { upsert: true }
        );
        res.status(201).json({ message: "Score salvo com sucesso!" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao salvar o score.");
    }
});

// === Rotas de Admin (Requer Autenticação) ===

// Rota de Login para Admin
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USER && password === ADMIN_PASS) {
        res.status(200).json({ success: true, message: 'Login bem-sucedido.' });
    } else {
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
});

// Rota para adicionar um novo participante
app.post('/api/participants', async (req, res) => {
    const { nick } = req.body;
    if (!nick) {
        return res.status(400).send("Nick inválido.");
    }
    try {
        const existing = await db.collection("ranking").findOne({ nick: nick });
        if (existing) {
            return res.status(409).send("Este nick já existe.");
        }
        await db.collection("ranking").insertOne({ nick: nick, score: "Não jogou" });
        res.status(201).json({ message: "Participante adicionado com sucesso!" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao adicionar participante.");
    }
});

// Rota para excluir um participante
app.delete('/api/participants/:nick', async (req, res) => {
    const { nick } = req.params;
    try {
        const result = await db.collection("ranking").deleteOne({ nick: nick });
        if (result.deletedCount === 0) {
            return res.status(404).send("Participante não encontrado.");
        }
        res.status(200).json({ message: "Participante excluído com sucesso!" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao excluir participante.");
    }
});

// Rota para adicionar participantes em massa e gerar pontuações
app.post('/api/bulk-play', async (req, res) => {
    const { nicks } = req.body;
    if (!nicks || !Array.isArray(nicks)) {
        return res.status(400).send("Lista de nicks inválida.");
    }
    try {
        const operations = nicks.map(nick => ({
            updateOne: {
                filter: { nick: nick },
                update: { $set: { nick: nick, score: Math.floor(Math.random() * 10001) - 5000 } },
                upsert: true
            }
        }));
        await db.collection("ranking").bulkWrite(operations);
        res.status(201).json({ message: "Participantes adicionados e jogados com sucesso!" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao adicionar participantes em massa.");
    }
});

// Rota para resetar todo o ranking
app.delete('/api/reset-ranking', async (req, res) => {
    try {
        await db.collection("ranking").deleteMany({});
        res.status(200).json({ message: "Ranking resetado com sucesso!" });
    } catch (e) {
        console.error(e);
        res.status(500).send("Erro ao resetar o ranking.");
    }
});

// Servir arquivos estáticos (opcional, se você quiser hospedar frontend e backend juntos)
app.use(express.static('public'));

// Iniciar o servidor
connectToMongo().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
    });
});