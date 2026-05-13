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
// =========================================
// --- רינדור הלוח ---
// =========================================

/**
 * מרנדר את לוח הדמקה מחדש לפי מצב המטריצה הנוכחי.
 * @returns {void}
 */
const renderBoard = () => {
    if (!els.board) return;

    els.board.replaceChildren();

    gameState.boardMatrix.forEach((row, rIdx) => {
        row.forEach((cell, cIdx) => {
            const sq = document.createElement('div');
            sq.className = `cell ${(rIdx + cIdx) % 2 !== 0 ? 'dark' : 'light'}`;
            sq.dataset.row = rIdx;
            sq.dataset.col = cIdx;

            if (cell !== 0) {
                const piece = document.createElement('div');
                const isP1 = (cell === 1 || cell === 3);
                piece.className = `piece ${isP1 ? 'player1' : 'player2'}`;
                if (cell > 2) piece.classList.add('queen');

                const canDrag = (isP1 === gameState.isPlayer1Turn)
                    && !gameState.hasMovedThisTurn
                    && !gameState.isGameOver;
                piece.setAttribute('draggable', canDrag ? 'true' : 'false');

                sq.appendChild(piece);
            }
            els.board.appendChild(sq);
        });
    });

    els.statCardP1?.classList.toggle('active-turn', gameState.isPlayer1Turn);
    els.statCardP2?.classList.toggle('active-turn', !gameState.isPlayer1Turn);
};
// =========================================
// --- ניהול תורות ---
// =========================================

/**
 * מטפל בסיום תור: מעביר תור לשחקן הבא ומאפס דגל מהלך.
 * @returns {void}
 */
const handleEndTurn = () => {
    if (!gameState.hasMovedThisTurn || gameState.isGameOver) return;

    gameState.isPlayer1Turn = !gameState.isPlayer1Turn;
    gameState.hasMovedThisTurn = false;

    els.btnEnd?.classList.remove('ready');
    renderBoard();
};
// =========================================
// --- טיימר ---
// =========================================

/**
 * ממיר שניות לפורמט mm:ss.
 * @param {number} seconds - מספר שניות
 * @returns {string} מחרוזת בפורמט mm:ss
 */
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};
/**
 * מפעיל את שעון המשחק - מחסיר שנייה בכל פעימה מהשחקן הפעיל.
 * @returns {void}
 */
const startTimer = () => {
    if (gameState.timerInterval) clearInterval(gameState.timerInterval);

    gameState.timerInterval = setInterval(() => {
        if (gameState.isGameOver) return;

        if (gameState.isPlayer1Turn) {
            gameState.p1Time--;
            if (els.timerP1) els.timerP1.textContent = formatTime(gameState.p1Time);
            els.statCardP1?.classList.toggle('time-warning', gameState.p1Time <= 30 && gameState.p1Time > 0);
            if (gameState.p1Time <= 0) handleGameOver(p2Name, `נגמר הזמן ל-${p1Name}`);
        } else {
            gameState.p2Time--;
            if (els.timerP2) els.timerP2.textContent = formatTime(gameState.p2Time);
            els.statCardP2?.classList.toggle('time-warning', gameState.p2Time <= 30 && gameState.p2Time > 0);
            if (gameState.p2Time <= 0) handleGameOver(p1Name, `נגמר הזמן ל-${p2Name}`);
        }
    }, 1000);
};
// =========================================
// --- סיום משחק ---
// =========================================

/**
 * מסיים את המשחק, שומר ניצחון עם זמן שיא ומציג מודאל.
 * @param {string} winnerName - שם השחקן המנצח
 * @param {string} reason - סיבת סיום המשחק לתצוגה
 * @returns {void}
 */
const handleGameOver = (winnerName, reason) => {
    if (gameState.isGameOver) return;
    gameState.isGameOver = true;
    clearInterval(gameState.timerInterval);

    const winnerTimeLeft = winnerName === p1Name ? gameState.p1Time : gameState.p2Time;
    const timeUsed = startTime - winnerTimeLeft;

    saveWinToStorage(winnerName, timeUsed);
    audio.gameOver();

    if (els.winnerMsg) {
        els.winnerMsg.replaceChildren();

        const titleText = document.createTextNode(`🏆 ${winnerName} מנצח/ת! 🏆`);

        const reasonEl = document.createElement('small');
        reasonEl.style.cssText = 'font-size:0.7em; font-weight:400; opacity:0.8; display:block';
        reasonEl.textContent = reason;

        els.winnerMsg.appendChild(titleText);
        els.winnerMsg.appendChild(reasonEl);
    }
    els.modalGameOver?.showModal();
};
/**
 * שומר ניצחון ב-localStorage עם עדכון זמן שיא.
 * מעדכן bestTime רק אם הזמן החדש מהיר יותר מהשיא הקיים.
 * @param {string} winnerName - שם השחקן המנצח
 * @param {number} timeUsedSeconds - כמה שניות נמשך המשחק
 * @returns {void}
 */
const saveWinToStorage = (winnerName, timeUsedSeconds) => {
    const allPlayers = JSON.parse(localStorage.getItem('allPlayers')) || [];
    const winner = allPlayers.find(p => p.username === winnerName);
    if (!winner) return;

    winner.wins = (winner.wins ?? 0) + 1;

    const prevBest = winner.bestTimeSeconds ?? Infinity;
    if (timeUsedSeconds < prevBest) {
        winner.bestTimeSeconds = timeUsedSeconds;
        winner.bestTime = formatTime(timeUsedSeconds);
    }

    localStorage.setItem('allPlayers', JSON.stringify(allPlayers));
};
// =========================================
// --- גרירה ושחרור (Drag & Drop) ---
// =========================================

/**
 * מחבר אירועי גרירה ושחרור ללוח באמצעות event delegation.
 * @returns {void}
 */
const attachDragEvents = () => {
    if (!els.board) return;

    els.board.addEventListener('dragstart', (e) => {
        if (!e.target.classList.contains('piece') || gameState.hasMovedThisTurn || gameState.isGameOver) {
    e.preventDefault();
    return;
}

const oR = parseInt(e.target.parentElement.dataset.row);
const oC = parseInt(e.target.parentElement.dataset.col);
const val = gameState.boardMatrix[oR][oC];
const isP1Piece = (val === 1 || val === 3);

if (isP1Piece !== gameState.isPlayer1Turn) {
    e.preventDefault();
    return;
}
        gameState.draggedPiece = e.target;
        gameState.originSquare = e.target.parentElement;
    });

    els.board.addEventListener('dragover', (e) => e.preventDefault());

    els.board.addEventListener('drop', (e) => {
        e.preventDefault();
        if (gameState.isGameOver || !gameState.originSquare) return;

        const sq = e.target.closest('.cell');
        if (!sq) return;

        const oR = parseInt(gameState.originSquare.dataset.row);
        const oC = parseInt(gameState.originSquare.dataset.col);
        const nR = parseInt(sq.dataset.row);
        const nC = parseInt(sq.dataset.col);
        const val = gameState.boardMatrix[oR][oC];

        const moveResult = checkMoveValidity(oR, oC, nR, nC, val);
        if (!moveResult.valid) return;

        if (moveResult.isCapture) {
            gameState.boardMatrix[moveResult.midR][moveResult.midC] = 0;
            audio.capture();

            if (gameState.isPlayer1Turn) {
                gameState.p1EatenCount++;
                if (els.eatenP1) els.eatenP1.textContent = gameState.p1EatenCount;
            } 
            else {
                gameState.p2EatenCount++;
                if (els.eatenP2) els.eatenP2.textContent = gameState.p2EatenCount;
            }
        } else {
            audio.move();
        }

        let finalVal = val;
        if (val === 1 && nR === 0) {
            finalVal = 3;
            gameState.p1KingsCount++;
            if (els.kingsP1) els.kingsP1.textContent = gameState.p1KingsCount;
            audio.queen();
        } else if (val === 2 && nR === 7) {
            finalVal = 4;
            gameState.p2KingsCount++;
            if (els.kingsP2) els.kingsP2.textContent = gameState.p2KingsCount;
            audio.queen();
        }

        updateMatrixAfterMove(oR, oC, nR, nC, finalVal);
        gameState.hasMovedThisTurn = true;
        els.btnEnd?.classList.add('ready');
        renderBoard();

        if (moveResult.isCapture) {
            const { p1, p2 } = countPieces();
            if (p1 === 0) handleGameOver(p2Name, `נגמרו הכלים של ${p1Name}`);
            else if (p2 === 0) handleGameOver(p1Name, `נגמרו הכלים של ${p2Name}`);
        }
    });
};
// =========================================
// --- רמז ---
// =========================================

/**
 * מדגיש את הכלי הראשון שיכול לנוע כרמז ויזואלי.
 * לא מופעל אם הרמזים מושבתים בהגדרות.
 * @returns {void}
 */
const handleHint = () => {
    if (gameState.isGameOver) return;

    const directions = [[-1,-1],[-1,1],[1,-1],[1,1],[-2,-2],[-2,2],[2,-2],[2,2]];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = gameState.boardMatrix[r][c];

            const isCurrentPlayer = gameState.isPlayer1Turn
                ? (cell === 1 || cell === 3)
                : (cell === 2 || cell === 4);

            if (!isCurrentPlayer) continue;

            const canMove = directions.some(([dr, dc]) =>
                checkMoveValidity(r, c, r + dr, c + dc, cell).valid
            );

            if (canMove) {
                const sq = els.board?.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                if (sq) {
                    sq.classList.add('hint-active');
                    setTimeout(() => sq.classList.remove('hint-active'), 1500);
                }
                return;
            }
        }
    }
};
// --- הפעלת המשחק ---
setupGame();