/**
 * @fileoverview לוגיקת דף המשחק - ניהול לוח, תורות, טיימר, אודיו וסיום משחק
 * @module game
 */

import { gameState } from './gameState.js';
import { initBoardMatrix, checkMoveValidity, updateMatrixAfterMove, countPieces } from './boardLogic.js';
import { setupModal } from './main.js';
// =========================================
// --- קריאת נתוני השחקנים ---
// =========================================

const currentGameData = JSON.parse(sessionStorage.getItem('currentGameData'));
const p1Name = currentGameData.player1Name;
const p2Name = currentGameData.player2Name;

/**
 * זמן התחלה לפי רמת קושי בשניות.
 * @type {Object.<string, number>}
 */
const DIFFICULTY_TIMES = { easy: 600, medium: 300, hard: 180 };

const urlParams = new URLSearchParams(window.location.search);
const selectedLevel = urlParams.get('level') ?? currentGameData.selectedLevel ?? 'easy';
const startTime = DIFFICULTY_TIMES[selectedLevel] ?? 600;

gameState.p1Time = startTime;
gameState.p2Time = startTime;

/**
 * אובייקט המרכז את כל אלמנטי ה-DOM הדרושים למשחק.
 * @type {Object}
 */
const els = {
    board:         document.querySelector('#checkers-board'),
    timerP1:       document.querySelector('#timer-p1'),
    timerP2:       document.querySelector('#timer-p2'),
    nameP1:        document.querySelector('#display-name-p1'),
    nameP2:        document.querySelector('#display-name-p2'),
    eatenP1:       document.querySelector('#eaten-p1'),
    eatenP2:       document.querySelector('#eaten-p2'),
    kingsP1:       document.querySelector('#kings-p1'),
    kingsP2:       document.querySelector('#kings-p2'),
    statCardP1:    document.querySelector('#stat-card-p1'),
    statCardP2:    document.querySelector('#stat-card-p2'),
    btnEnd:        document.querySelector('#btn-end-turn'),
    btnHint:       document.querySelector('#btn-hint'),
    modalGameOver: document.querySelector('#modal-game-over'),
    winnerMsg:     document.querySelector('#winner-message')
};
// =========================================
// --- אודיו - Web Audio API ---
// =========================================
/**
 * אובייקט לניהול צלילי המשחק באמצעות Web Audio API.
 */
const audio = {
    /** @type {AudioContext|null} */
    ctx: null,

    /**
     * מחזיר AudioContext קיים או יוצר חדש.
     * @returns {AudioContext|null}
     */
    getCtx() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return this.ctx;
    },

    /**
     * בודק אם הצליל מופעל כרגע לפי ה-localStorage.
     * נבדק בכל קריאה כדי לשקף שינוי הגדרה מיידי.
     * @returns {boolean}
     */
    isEnabled() {
        const saved = localStorage.getItem('isSound');
        return saved === null || saved === 'true';
    },

    /**
     * מנגן צליל לפי תדר, משך וסוג גל.
     * @param {number} freq - תדר הצליל בהרץ
     * @param {number} [duration=0.15] - משך הצליל בשניות
     * @param {'sine'|'square'|'triangle'} [type='sine'] - סוג גל
     * @returns {void}
     */
    play(freq, duration = 0.15, type = 'sine') {
        if (!this.isEnabled()) return;

        const ctx = this.getCtx();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    },

    /** צליל מהלך רגיל 
     * @returns {void}
    */
    move()    { this.play(440, 0.08); },

    /** צליל אכילת כלי יריב - מכה קצרה ועמוקה 
     * @returns {void}
    */
    capture() {
        this.play(180, 0.12, 'triangle');
        setTimeout(() => this.play(120, 0.18, 'sine'), 80);
    },

    /** צליל הכתרה למלכה - שלושה תווים עולים 
     * @returns {void}
    */
    queen() {
        this.play(523, 0.12);
        setTimeout(() => this.play(659, 0.12), 130);
        setTimeout(() => this.play(784, 0.25), 260);
    },

    /** צליל ניצחון דרמטי - פנפארה עולה עם אקורד מלא 
     * @returns {void}
    */
    gameOver() {
        this.play(523, 0.12);
        setTimeout(() => this.play(659, 0.12), 130);
        setTimeout(() => this.play(784, 0.12), 260);
        setTimeout(() => this.play(1047, 0.08, 'triangle'), 420);
        setTimeout(() => { this.play(784, 0.5, 'sine'); this.play(1047, 0.5, 'triangle'); }, 500);
        setTimeout(() => this.play(392, 0.6, 'sine'), 750);
    },
};
// =========================================
// --- ניהול כפתור הרמז לפי הגדרות ---
// =========================================

/**
 * מעדכן את מצב כפתור הרמז לפי הגדרת הרמזים ב-localStorage.
 * @returns {void}
 */
const updateHintButton = () => {
    if (!els.btnHint) return;
    const hintsOn = localStorage.getItem('isHints');
    const isEnabled = hintsOn === null || hintsOn === 'true';
    els.btnHint.disabled = !isEnabled;
    els.btnHint.classList.toggle('btn-disabled', !isEnabled);
};
// =========================================
// --- אתחול המשחק ---
// =========================================

/**
 * מאתחל ומפעיל את המשחק: לוח, שמות, טיימר ואירועים.
 * @returns {void}
 */
const setupGame = () => {
    initBoardMatrix();

    if (els.nameP1) els.nameP1.textContent = `${p1Name} - שחקן טורכיז`;
    if (els.nameP2) els.nameP2.textContent = `${p2Name} - שחקן סגול`;

    if (els.timerP1) els.timerP1.textContent = formatTime(gameState.p1Time);
    if (els.timerP2) els.timerP2.textContent = formatTime(gameState.p2Time);

    renderBoard();
    startTimer();
    updateHintButton();


    els.btnEnd?.addEventListener('click', handleEndTurn);
    els.btnHint?.addEventListener('click', handleHint);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleEndTurn();
    });
    window.addEventListener('hintsSettingChanged', updateHintButton);

    setupModal('btn-open-settings', 'btn-close-settings', 'modal-settings');
    attachDragEvents();
};