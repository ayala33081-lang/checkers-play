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
