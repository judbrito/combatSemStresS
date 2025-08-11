require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 10000;

// Configurações de Segurança
app.use(express.json({ limit: '10kb' }));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? 'https://semstressorteio.onrender.com' 
    : '*'
}));

// Configurações do Admin (usar variáveis de ambiente)
const ADMIN = {
    user: process.env.ADMIN_USER || 'admoceano',
    pass: process.env.ADMIN_PASS || '4107'
};

// Conexão com MongoDB (usar variável de ambiente)
const uri = process.env.MONGODB_URI || "mongodb+srv://admoceano:4107@sorteiosdb.qznc45w.mongodb.net/combat_sem_stress?retryWrites=true&w=majority&appName=sorteiosdb";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

let db;

// Conexão com o banco de dados
async function connectDB() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        db = client.db("combat_sem_stress");
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
        return db;
    } catch (e) {
        console.error("❌ Erro ao conectar ao MongoDB:", e);
        process.exit(1);
    }
}

// Middleware de autenticação
const authenticate = (req, res, next) => {
    const token = req.headers.authorization;
    if (token === `Bearer ${ADMIN.user}:${ADMIN.pass}`) {
        return next();
    }
    res.status(401).json({ error: "Não autorizado" });
};

// Rotas Públicas
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/', (req, res) => {
    res.json({ 
        status: 'online',
        message: 'API do SemStresS funcionando!',
        database: db ? 'conectado' : 'desconectado',
        routes: {
            ranking: '/api/ranking',
            admin: '/api/login'
        }
    });
});

app.get('/api/ranking', async (req, res) => {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" });

    try {
        const ranking = await db.collection("ranking")
            .find()
            .sort({ score: -1 }) // Ordena do maior para o menor score
            .toArray();
        
        res.json(ranking);
    } catch (e) {
        console.error("Erro no ranking:", e);
        res.status(500).json({ 
            error: "Erro ao buscar ranking",
            details: e.message
        });
    }
});

app.post('/api/ranking', async (req, res) => {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" });

    try {
        const { nick, score } = req.body;
        
        if (!nick || nick.length > 6 || typeof score !== 'number') {
            return res.status(400).json({ 
                error: "Dados inválidos",
                requirements: {
                    nick: "Máximo 6 caracteres",
                    score: "Deve ser um número"
                }
            });
        }

        const result = await db.collection("ranking")
            .updateOne(
                { nick },
                { $set: { nick, score, lastUpdated: new Date() } },
                { upsert: true }
            );

        res.status(201).json({ 
            success: true,
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount
        });
    } catch (e) {
        console.error("Erro ao salvar score:", e);
        res.status(500).json({ 
            error: "Erro ao salvar pontuação",
            details: e.message
        });
    }
});

// Rotas de Administração
app.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (username === ADMIN.user && password === ADMIN.pass) {
            res.json({ 
                success: true,
                token: `${ADMIN.user}:${ADMIN.pass}`,
                user: {
                    username,
                    role: "admin"
                }
            });
        } else {
            res.status(401).json({ 
                success: false,
                error: "Credenciais inválidas"
            });
        }
    } catch (e) {
        console.error("Erro no login:", e);
        res.status(500).json({ 
            error: "Erro no servidor",
            details: e.message
        });
    }
});

app.delete('/api/participants/:nick', authenticate, async (req, res) => {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" });

    try {
        const result = await db.collection("ranking")
            .deleteOne({ nick: req.params.nick });
        
        res.json({ 
            success: true,
            deletedCount: result.deletedCount
        });
    } catch (e) {
        res.status(500).json({ error: "Erro ao excluir participante" });
    }
});

app.delete('/api/reset-ranking', authenticate, async (req, res) => {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" });

    try {
        const result = await db.collection("ranking").deleteMany({});
        res.json({ 
            success: true,
            deletedCount: result.deletedCount
        });
    } catch (e) {
        res.status(500).json({ error: "Erro ao resetar ranking" });
    }
});

app.post('/api/bulk-play', authenticate, async (req, res) => {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" });

    try {
        const operations = req.body.nicks.map(nick => ({
            updateOne: {
                filter: { nick },
                update: { 
                    $set: { 
                        nick, 
                        score: Math.floor(Math.random() * 20001) - 10000,
                        lastUpdated: new Date() 
                    } 
                },
                upsert: true
            }
        }));

        const result = await db.collection("ranking").bulkWrite(operations);
        res.json({ 
            success: true,
            ...result
        });
    } catch (e) {
        res.status(500).json({ error: "Erro em operação em massa" });
    }
});

// Inicialização do Servidor
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

// Tratamento de erros
process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Exceção não capturada:', error);
    process.exit(1);
});

startServer();