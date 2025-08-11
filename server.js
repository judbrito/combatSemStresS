require('dotenv').config();
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Configurações do Admin
const ADMIN = {
    user: process.env.ADMIN_USER || 'admoceano',
    pass: process.env.ADMIN_PASS || '4107'
};

// Configuração do MongoDB Atlas - STRING ATUALIZADA COM SUA CONEXÃO
const uri = "mongodb+srv://admoceano:4107@sorteiosdb.qznc45w.mongodb.net/combat_sem_stress?retryWrites=true&w=majority&appName=sorteiosdb";

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
});

let db;

// Conexão com o banco de dados
async function connectDB() {
    try {
        await client.connect();
        // Verifica se a conexão foi bem-sucedida
        await client.db("admin").command({ ping: 1 });
        db = client.db("combat_sem_stress");
        console.log("✅ Conectado ao MongoDB Atlas com sucesso!");
        return db;
    } catch (e) {
        console.error("❌ Erro ao conectar ao MongoDB:", e);
        process.exit(1);
    }
}

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de teste
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

// Rotas Públicas
app.get('/api/ranking', async (req, res) => {
    if (!db) return res.status(500).json({ error: "Banco de dados não conectado" });

    try {
        const ranking = await db.collection("ranking")
            .find()
            .sort({ score: 1 })
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
                token: "fake-jwt-token-for-demo",
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

startServer();

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
    console.error('Rejeição não tratada em:', promise, 'motivo:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Exceção não capturada:', error);
    process.exit(1);
});