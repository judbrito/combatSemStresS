// src/utils/dataHandler.js
const fs = require('fs');
const path = require('path');

const EVENT_DATES_FILE = path.join(__dirname, '../data/eventDates.json');

const readEventDates = () => {
    try {
        const data = fs.readFileSync(EVENT_DATES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erro ao ler eventDates.json:', error.message);
        // Retorna um modelo padrão se o arquivo não existir ou for inválido
        return {
            lastEventDate: null,
            recentParticipants: []
        };
    }
};

const writeEventDates = (data) => {
    try {
        fs.writeFileSync(EVENT_DATES_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error('Erro ao escrever eventDates.json:', error.message);
    }
};

module.exports = {
    readEventDates,
    writeEventDates
};