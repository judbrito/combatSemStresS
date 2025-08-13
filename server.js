require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASS = process.env.ADMIN_PASS;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

app.use(express.json());
app.use(cors());

// Conexão com o MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB!'))
  .catch(err => console.error('Erro de conexão ao MongoDB:', err));

// Schema do Jogador
const playerSchema = new mongoose.Schema({
  nick: { type: String, required: true, unique: true, maxlength: 50 },
  score: { type: Number, required: true }
});
const Player = mongoose.model('Player', playerSchema);

// Middleware de autenticação de token para rotas de administrador
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- Funções de Lógica do Jogo ---
const generateRandomScore = () => {
    let score = 0;
    // Simula a seleção de 10 emoções com valores aleatórios entre -10000 e 10000
    for (let i = 0; i < 10; i++) {
        score += Math.round(Math.random() * 20000 - 10000);
    }
    return score;
};

// --- Rotas da API ---

// Rota de login do administrador
app.post('/api/admin-login', (req, res) => {
  const { user, pass } = req.body;
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    const token = jwt.sign({ user: user }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).send('Credenciais inválidas');
  }
});

// Rota para jogar (atualizar/adicionar score)
app.post('/api/play', async (req, res) => {
  const { nick, score } = req.body;
  if (!nick || score === undefined) {
    return res.status(400).send('Dados inválidos');
  }
  try {
    const player = await Player.findOneAndUpdate({ nick }, { score }, { upsert: true, new: true });
    res.status(200).json(player);
  } catch (error) {
    res.status(500).send('Erro ao salvar o score');
  }
});

// Rota para buscar o ranking (pública)
app.get('/api/ranking', async (req, res) => {
  try {
    const ranking = await Player.find({}).sort({ score: -1 });
    res.status(200).json(ranking);
  } catch (error) {
    res.status(500).send('Erro ao buscar o ranking');
  }
});

// Rota para buscar participantes (pública para o front-end)
app.get('/api/participants-public', async (req, res) => {
  try {
    const participants = await Player.find({}, 'nick');
    res.status(200).json(participants.map(p => p.nick));
  } catch (error) {
    res.status(500).send('Erro ao buscar participantes');
  }
});

// Rota para buscar participantes (protegida para administradores)
app.get('/api/participants', authenticateToken, async (req, res) => {
  try {
    const participants = await Player.find({});
    res.status(200).json(participants);
  } catch (error) {
    res.status(500).send('Erro ao buscar participantes');
  }
});

// Rota para adicionar um participante (protegida)
app.post('/api/add-participant', authenticateToken, async (req, res) => {
  const { nick } = req.body;
  if (!nick) return res.status(400).send('Nick é obrigatório');
  try {
    const score = generateRandomScore();
    const player = new Player({ nick, score });
    await player.save();
    res.status(201).json(player);
  } catch (error) {
    res.status(500).send('Erro ao adicionar participante. Nick já pode existir.');
  }
});

// Rota para remover um participante (protegida)
app.delete('/api/participants/:nick', authenticateToken, async (req, res) => {
  const { nick } = req.params;
  try {
    await Player.deleteOne({ nick });
    res.status(200).send('Participante removido');
  } catch (error) {
    res.status(500).send('Erro ao remover participante');
  }
});

// Rota para resetar o ranking (protegida)
app.delete('/api/reset-ranking', authenticateToken, async (req, res) => {
  try {
    await Player.deleteMany({});
    res.status(200).send('Ranking resetado');
  } catch (error) {
    res.status(500).send('Erro ao resetar ranking');
  }
});

// Rota para adicionar/atualizar jogadores em massa (protegida)
app.post('/api/bulk-play', authenticateToken, async (req, res) => {
  const nicks = req.body.nicks;
  if (!nicks || !Array.isArray(nicks)) return res.status(400).send('Nicks inválidos');

  const bulkOps = nicks.map(nick => ({
    updateOne: {
      filter: { nick },
      update: { $setOnInsert: { nick, score: generateRandomScore() } },
      upsert: true
    }
  }));

  try {
    await Player.bulkWrite(bulkOps);
    res.status(200).json({ message: 'Jogadores adicionados/atualizados com sucesso!' });
  } catch (error) {
    console.error('Erro no bulk-play:', error);
    res.status(500).send('Erro ao processar a lista de jogadores');
  }
});

// Servir arquivos estáticos (frontend)
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});