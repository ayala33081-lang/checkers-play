/**
 * @fileoverview לוגיקת דף המשחק - ניהול לוח, תורות, טיימר, אודיו וסיום משחק
 * @module game
 */

import { gameState } from './gameState.js';
import { initBoardMatrix, checkMoveValidity, updateMatrixAfterMove, countPieces } from './boardLogic.js';
import { setupModal } from './main.js';
