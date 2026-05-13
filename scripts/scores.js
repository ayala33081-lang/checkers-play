import { setupModal } from './main.js';

// =========================================
// --- ניהול מודאל ההגדרות ---
// =========================================
setupModal('btn-open-settings', 'btn-close-settings', 'modal-settings');

// =========================================
// --- אובייקט לוח השיאים ---
// =========================================

/**
 * @typedef {Object} Player
 * @property {string} username - שם המשתמש
 * @property {string} password - סיסמת המשתמש
 * @property {number} [wins] - מספר ניצחונות
 * @property {string} [bestTime] - זמן ניצחון שיא בפורמט mm:ss
 */

const leaderboard = {

    /** @type {Player[]} */
    allPlayers: JSON.parse(localStorage.getItem('allPlayers')) || [],

    /**
     * מחזיר שחקנים עם לפחות ניצחון אחד, ממויינים מהגבוה לנמוך.
     * @returns {Player[]}
     */
    getSortedPlayers() {
        return this.allPlayers
            .filter(player => player.wins && player.wins > 0)
            .toSorted((a, b) => b.wins - a.wins);
    }