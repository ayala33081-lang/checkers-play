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
