/**
 * אובייקט המצב של המשחק 
 * @typedef {Object} GameState
 * @property {boolean} isPlayer1Turn - מציין האם זהו התור של שחקן 1.
 * @property {boolean} hasMovedThisTurn - האם השחקן הנוכחי כבר ביצע מהלך בתור זה.
 * @property {Array<Array<any>>} boardMatrix - מטריצה המייצגת את לוח המשחק והכלים שעליו.
 * @property {HTMLElement|null} draggedPiece - התייחסות לאלמנט ה-DOM של הכלי שנגרר כעת.
 * @property {HTMLElement|null} originSquare - המשבצת ממנה התחילה תנועת הכלי.
 * @property {number} p1EatenCount - מספר הכלים שנאכלו לשחקן 1.
 * @property {number} p2EatenCount - מספר הכלים שנאכלו לשחקן 2.
 * @property {number} p1KingsCount - מספר ה"מלכים" שיש לשחקן 1 על הלוח.
 * @property {number} p2KingsCount - מספר ה"מלכים" שיש לשחקן 2 על הלוח.
 * @property {boolean} isGameOver - מציין האם המשחק הסתיים.
 * @property {number} p1Time - הזמן שנותר לשחקן 1 בשניות.
 * @property {number} p2Time - הזמן שנותר לשחקן 2 בשניות.
 * @property {number|null} timerInterval - מזהה הטיימר הפעיל.
 */

/** @type {GameState} */
export const gameState = {
    isPlayer1Turn: true,
    hasMovedThisTurn: false,
    boardMatrix: [],
    draggedPiece: null,
    originSquare: null,
    p1EatenCount: 0,
    p2EatenCount: 0,
    p1KingsCount: 0,
    p2KingsCount: 0,
    isGameOver: false,
    p1Time: 600,
    p2Time: 600,
    timerInterval: null
};
