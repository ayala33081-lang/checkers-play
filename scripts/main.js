/**
 * @fileoverview לוגיקה משותפת לכל הדפים - ניהול מודאלים והגדרות
 * @module main
 */

// ==========================================
// --- ניהול מודאלים - פונקציה גנרית ---
// ==========================================

/**
 * מחבר אירועי פתיחה וסגירה למודאל נתון.
 * פונקציה גנרית שמשמשת את כל המודאלים באתר.
 * @param {string} openBtnId - מזהה כפתור הפתיחה
 * @param {string} closeBtnId - מזהה כפתור הסגירה
 * @param {string} dialogId - מזהה אלמנט ה-dialog
 * @returns {void}
 */
const setupModal = (openBtnId, closeBtnId, dialogId) => {
    const openBtn = document.querySelector(`#${openBtnId}`);
    const closeBtn = document.querySelector(`#${closeBtnId}`);
    const dialog = document.querySelector(`#${dialogId}`);

    if (!openBtn || !closeBtn || !dialog) return;

    openBtn.addEventListener('click', () => dialog.showModal());
    closeBtn.addEventListener('click', () => dialog.close());
};
