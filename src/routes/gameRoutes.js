// src/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Rotas de Usuário
router.post('/register', gameController.registerParticipant);
router.post('/submit-sequence', gameController.submitEmojiSequence);
router.get('/tournament-state', gameController.getTournamentState); // Rota para qualquer um ver o estado

// Rota de Login do ADM (ABERTA para a requisição de login)
router.post('/admin/login', gameController.adminLogin);

// Todas as rotas abaixo são rotas de ADM e presumem que o ADM já está "logado" no frontend
// (a segurança real seria feita com tokens ou sessões, aqui é mais simples)
router.post('/admin/start-first-round', gameController.startTournamentFirstRound);
router.post('/admin/sort-and-advance-round', gameController.sortAndAdvanceRound);
router.post('/admin/reset-tournament', gameController.resetTournament);
router.post('/admin/set-target-sequence', gameController.setAdminTargetSequence);
router.post('/admin/add-participants-json', gameController.addParticipantsFromJson);
router.get('/admin/recent-participants', gameController.getRecentParticipants);
router.get('/admin/participants-backup', gameController.getParticipantsBackup);

module.exports = router;