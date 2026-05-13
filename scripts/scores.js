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
    },

    /**
     * מעצב שם שחקן להצגה - מסיר רווחים כפולים.
     * שימוש ב-replace עם ביטוי רגולרי.
     * @param {string} username
     * @returns {string}
     */
    formatName(username) {
        return username.trim().replace(/\s+/g, ' ');
    },

    /**
     * מחזיר את הדירוג של שחקן לפי שם.
     * שימוש ב-findIndex על מערך האובייקטים.
     * @param {string} username
     * @returns {number} דירוג (1-based), או -1 אם לא נמצא
     */
    getRank(username) {
        const sorted = this.getSortedPlayers();
        return sorted.findIndex(p => p.username === username) + 1;
    },

    /**
     * מסנן שחקנים לפי מחרוזת חיפוש.
     * שימוש ב-includes על מחרוזת.
     * @param {string} searchTerm
     * @returns {Player[]}
     */
    filterByName(searchTerm) {
        const term = searchTerm.trim().toLowerCase();
        return this.getSortedPlayers().filter(player =>
            this.formatName(player.username).toLowerCase().includes(term)
        );
    },

    /**
     * בונה שורת טבלה עבור שחקן נתון.
     * @param {Player} player - אובייקט השחקן
     * @param {number} rank - דירוג השחקן
     * @returns {HTMLTableRowElement}
     */
    buildRow(player, rank) {
        const row = document.createElement('tr');

        const cells = [
            rank,
            this.formatName(player.username),
            player.wins,
            player.bestTime || '--:--'
        ];

        cells.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });

        return row;
    }