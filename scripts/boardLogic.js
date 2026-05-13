/**
 * @fileoverview לוגיקת הלוח - אתחול, בדיקת מהלכים ועדכון המטריצה
 * @module boardLogic
 */

import { gameState } from './gameState.js';

/**
 * מאתחל את מטריצת הלוח למצב התחלתי תקני של דמקה
 * @returns {void}
 */
export const initBoardMatrix = () => {
    gameState.boardMatrix = [];
    for (let row = 0; row < 8; row++) {
        const newRow = [];
        for (let col = 0; col < 8; col++) {
            if ((row + col) % 2 !== 0) {
                if (row < 3) newRow.push(2);       
                else if (row > 4) newRow.push(1);  
                else newRow.push(0);               
            } 
            else {
                newRow.push(0);                   
            }
        }
        gameState.boardMatrix.push(newRow);
    }
};
/**
 * מעדכן את המטריצה לאחר מהלך - מנקה את המקור וממלא את היעד
 * @param {number} oR - שורת המקור
 * @param {number} oC - עמודת המקור
 * @param {number} nR - שורת היעד
 * @param {number} nC - עמודת היעד
 * @param {number} val - ערך הכלי (1-4)
 * @returns {void}
 */
export const updateMatrixAfterMove = (oR, oC, nR, nC, val) => {
    gameState.boardMatrix[oR][oC] = 0;
    gameState.boardMatrix[nR][nC] = val;
};
/**
 * בודק אם מהלך מסוים חוקי לפי חוקי הדמקה
 * @param {number} oR - שורת המקור
 * @param {number} oC - עמודת המקור
 * @param {number} nR - שורת היעד
 * @param {number} nC - עמודת היעד
 * @param {number} pieceValue - ערך הכלי (1=חייל1, 2=חייל2, 3=מלכה1, 4=מלכה2)
 * @returns {{ valid: boolean, isCapture?: boolean, midR?: number, midC?: number }}
 */
export const checkMoveValidity = (oR, oC, nR, nC, pieceValue) => {
    if (nR < 0 || nR > 7 || nC < 0 || nC > 7) return { valid: false };
    if (gameState.boardMatrix[nR][nC] !== 0) return { valid: false };

    const rd = nR - oR;
    const cd = nC - oC;
    const absRd = Math.abs(rd);
    const absCd = Math.abs(cd);
    const isQueen = pieceValue > 2;

    const isCorrectDirection = isQueen
        || (pieceValue === 1 && rd < 0)
        || (pieceValue === 2 && rd > 0);

    if (absRd === 1 && absCd === 1 && isCorrectDirection) {
        return { valid: true, isCapture: false };
    }

    if (absRd === 2 && absCd === 2) {
        if (!isCorrectDirection) return { valid: false };

        const midR = oR + rd / 2;
        const midC = oC + cd / 2;
        const midP = gameState.boardMatrix[midR][midC];

        if (midP !== 0) {
            const isEnemy = (pieceValue % 2) !== (midP % 2);
            if (isEnemy) {
                return { valid: true, isCapture: true, midR, midC };
            }
        }
    }

    return { valid: false };
};