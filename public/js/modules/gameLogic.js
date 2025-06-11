// public/js/modules/gameLogic.js

// Listas de Emojis
const EMOJIS_SEMESTRESSE = ['😎', '🥳', '🤩', '🤣', '🌴', '🌈', '🎉', '✨', '🧘', '🍾'];
const EMOJIS_ESTRESSADO = ['😩', '🤯', '😭', '😬', '💢', '😵', '👻', '💩', '💣', '🤬'];
const EMOJIS_NEUTROS = ['🤡', '👽', '🐒', '🤪', '👾', '🎲', '💯', '👑', '🚀', '🍌'];
const ALL_EMOJIS = [...EMOJIS_SEMESTRESSE, ...EMOJIS_ESTRESSADO, ...EMOJIS_NEUTROS]; // <-- Corrected typo

let spinningIntervals = [];
let stoppedEmojis = [];
let currentSlot = 0;
let participantId = null;
let apiService = null;

import * as ui from './ui.js'; // Importe a UI para atualizar os slots

export function startEmojiSorter(pId, api) {
    participantId = pId;
    apiService = api;
    resetSorter();
}

export function startSpinningEmojis() {
    ui.resetEmojiSlots(); // Garante que os slots estão vazios e sem a classe 'stopped'
    stoppedEmojis = [];
    currentSlot = 0;
    ui.updateEmojiSorterMessage('Clique "Parar Emoji" para cada um.');

    for (let i = 0; i < 5; i++) {
        const interval = setInterval(() => {
            const randomEmoji = ALL_EMOJIS[Math.floor(Math.random() * ALL_EMOJIS.length)];
            ui.updateEmojiSlot(i, randomEmoji);
        }, 100); // Rotação rápida
        spinningIntervals.push(interval);
    }
}

export function stopNextEmoji() {
    if (currentSlot < 5) {
        clearInterval(spinningIntervals[currentSlot]);
        ui.markEmojiSlotAsStopped(currentSlot);
        const stoppedEmoji = document.querySelector(`.emoji-slot[data-slot="${currentSlot}"]`).textContent;
        stoppedEmojis.push(stoppedEmoji);
        currentSlot++;

        if (currentSlot === 5) {
            // Todos os emojis foram parados
            ui.updateEmojiSorterMessage('Sua sequência está pronta! Envie-a para o torneio.');
            document.getElementById('stop-emoji-btn').disabled = true;
            document.getElementById('submit-sequence-btn').classList.remove('hidden'); // Mostra o botão de enviar
            ui.displayFinalSequence(stoppedEmojis); // Exibe a sequência final formatada
        }
    }
}

export function getFinalSequence() {
    return stoppedEmojis;
}

function resetSorter() {
    spinningIntervals.forEach(clearInterval);
    spinningIntervals = [];
    stoppedEmojis = [];
    currentSlot = 0;
    ui.resetEmojiSlots();
    ui.updateEmojiSorterMessage('Clique "Parar Emoji" para cada um.');
    document.getElementById('stop-emoji-btn').disabled = true; // Desabilita até o registro
    document.getElementById('submit-sequence-btn').classList.add('hidden'); // Esconde o botão de enviar
}