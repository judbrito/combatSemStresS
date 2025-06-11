// src/models/Participant.js
class Participant {
    constructor(id, nick, loyalty, lastParticipationDate = null) {
        this.id = id;
        this.nick = nick;
        this.loyalty = loyalty;
        this.emojiSequence = [];
        this.tournamentStatus = 'waiting'; // 'waiting', 'playing', 'eliminated', 'winner'
        this.lastParticipationDate = lastParticipationDate; // Nova propriedade
    }

    setEmojiSequence(sequence) {
        if (Array.isArray(sequence) && sequence.length === 5) {
            this.emojiSequence = sequence;
            return true;
        }
        return false;
    }

    // Método para verificar se o participante está em cooldown
    isOnCooldown() {
        if (!this.lastParticipationDate) {
            return false;
        }
        const fifteenDaysAgo = new Date();
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        return new Date(this.lastParticipationDate) > fifteenDaysAgo;
    }
}

module.exports = Participant;