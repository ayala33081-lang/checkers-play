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
