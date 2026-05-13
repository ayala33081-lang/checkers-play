/**
 * @fileoverview לוגיקת דף הבית - ניהול טופס שחקנים ומעבר לדף המשחק
 * @module index
 */

import { setupModal } from './main.js';

// --- חיבור מודאלים ---
setupModal('btn-open-auth', 'btn-close-auth', 'modal-auth');
setupModal('btn-open-settings', 'btn-close-settings', 'modal-settings');
// =========================================
// --- אימות ורישום שחקן ---
// =========================================

/**
 * בודק אם שחקן קיים ומאמת סיסמה, או יוצר רשומה חדשה.
 * @param {string} username - שם המשתמש
 * @param {string} password - סיסמת המשתמש
 *  @param {Array<{username: string, password: string, wins?: number}>} allPlayers - רשימת כל השחקנים
 * @param {HTMLElement|null} errorElement - אלמנט להצגת שגיאה
 * @returns {boolean} האם השחקן תקין
 */
const validateOrRegisterPlayer = (username, password, allPlayers, errorElement) => {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show-error');
    }

    const existingPlayer = allPlayers.find(player => player.username === username);

    if (!existingPlayer) {
        allPlayers.push({ username, password });
        return true;
    }

    if (existingPlayer.password === password) return true;

    if (errorElement) {
        errorElement.textContent = 'שם המשתמש תפוס או שהסיסמה שגויה. נסה שנית.';
        errorElement.classList.add('show-error');
    }
    return false;
};
// =========================================
// --- טיפול בטופס השחקנים ---
// =========================================

const authForm = document.querySelector('#form-auth-players');

if (authForm) {
    authForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const player1ErrorDisplay = document.querySelector('#p1-error');
        const player2ErrorDisplay = document.querySelector('#p2-error');

        const playersData = {
            player1Name:     document.querySelector('#p1-username').value,
            player2Name:     document.querySelector('#p2-username').value,
            player1Password: document.querySelector('#p1-password').value,
            player2Password: document.querySelector('#p2-password').value,
            selectedLevel:   document.querySelector('input[name="game-level"]:checked').value,
        };

        if (playersData.player1Name === playersData.player2Name) {
            if (player2ErrorDisplay) {
                player2ErrorDisplay.textContent = 'שני שחקנים לא יכולים לשחק עם אותו שם. בחר שם אחר.';
                player2ErrorDisplay.classList.add('show-error');
            }
            return;
        }

        const allPlayers = JSON.parse(localStorage.getItem('allPlayers')) || [];

        const isPlayer1Valid = validateOrRegisterPlayer(
            playersData.player1Name, playersData.player1Password, allPlayers, player1ErrorDisplay
        );
        const isPlayer2Valid = validateOrRegisterPlayer(
            playersData.player2Name, playersData.player2Password, allPlayers, player2ErrorDisplay
        );

        if (!isPlayer1Valid || !isPlayer2Valid) return;

        localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
        sessionStorage.setItem('currentGameData', JSON.stringify(playersData));
        window.location.href = `pages/game.html?level=${playersData.selectedLevel}`;
    });
}
