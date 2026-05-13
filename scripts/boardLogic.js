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