/**
 * @fileoverview לוגיקת דף המשחק - ניהול לוח, תורות, טיימר, אודיו וסיום משחק
 * @module play
 */

import { playState } from './playState.js';
import { initBoardMatrix, checkMoveValidity, updateMatrixAfterMove, countPieces } from './boardLogic.js';
import { setupModal } from './main.js';
// =========================================
// --- קריאת נתוני השחקנים ---
// =========================================

const currentplayData = JSON.parse(sessionStorage.getItem('currentplayData'));
const p1Name = currentplayData.player1Name;
const p2Name = currentplayData.player2Name;

/**
 * זמן התחלה לפי רמת קושי בשניות.
 * @type {Object.<string, number>}
 */
const DIFFICULTY_TIMES = { easy: 600, medium: 300, hard: 180 };

const urlParams = new URLSearchParams(window.location.search);
const selectedLevel = urlParams.get('level') ?? currentplayData.selectedLevel ?? 'easy';
const startTime = DIFFICULTY_TIMES[selectedLevel] ?? 600;

playState.p1Time = startTime;
playState.p2Time = startTime;

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
    modalplayOver: document.querySelector('#modal-play-over'),
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
    playOver() {
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
const setupplay = () => {
    initBoardMatrix();

    if (els.nameP1) els.nameP1.textContent = `${p1Name} - שחקן טורכיז`;
    if (els.nameP2) els.nameP2.textContent = `${p2Name} - שחקן סגול`;

    if (els.timerP1) els.timerP1.textContent = formatTime(playState.p1Time);
    if (els.timerP2) els.timerP2.textContent = formatTime(playState.p2Time);

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

    playState.boardMatrix.forEach((row, rIdx) => {
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

                const canDrag = (isP1 === playState.isPlayer1Turn)
                    && !playState.hasMovedThisTurn
                    && !playState.isplayOver;
                piece.setAttribute('draggable', canDrag ? 'true' : 'false');

                sq.appendChild(piece);
            }
            els.board.appendChild(sq);
        });
    });

    els.statCardP1?.classList.toggle('active-turn', playState.isPlayer1Turn);
    els.statCardP2?.classList.toggle('active-turn', !playState.isPlayer1Turn);
};
// =========================================
// --- ניהול תורות ---
// =========================================

/**
 * מטפל בסיום תור: מעביר תור לשחקן הבא ומאפס דגל מהלך.
 * @returns {void}
 */
const handleEndTurn = () => {
    if (!playState.hasMovedThisTurn || playState.isplayOver) return;

    playState.isPlayer1Turn = !playState.isPlayer1Turn;
    playState.hasMovedThisTurn = false;

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
    if (playState.timerInterval) clearInterval(playState.timerInterval);

    playState.timerInterval = setInterval(() => {
        if (playState.isplayOver) return;

        if (playState.isPlayer1Turn) {
            playState.p1Time--;
            if (els.timerP1) els.timerP1.textContent = formatTime(playState.p1Time);
            els.statCardP1?.classList.toggle('time-warning', playState.p1Time <= 30 && playState.p1Time > 0);
            if (playState.p1Time <= 0) handleplayOver(p2Name, `נגמר הזמן ל-${p1Name}`);
        } else {
            playState.p2Time--;
            if (els.timerP2) els.timerP2.textContent = formatTime(playState.p2Time);
            els.statCardP2?.classList.toggle('time-warning', playState.p2Time <= 30 && playState.p2Time > 0);
            if (playState.p2Time <= 0) handleplayOver(p1Name, `נגמר הזמן ל-${p2Name}`);
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
const handleplayOver = (winnerName, reason) => {
    if (playState.isplayOver) return;
    playState.isplayOver = true;
    clearInterval(playState.timerInterval);

    const winnerTimeLeft = winnerName === p1Name ? playState.p1Time : playState.p2Time;
    const timeUsed = startTime - winnerTimeLeft;

    saveWinToStorage(winnerName, timeUsed);
    audio.playOver();

    if (els.winnerMsg) {
        els.winnerMsg.replaceChildren();

        const titleText = document.createTextNode(`🏆 ${winnerName} מנצח/ת! 🏆`);

        const reasonEl = document.createElement('small');
        reasonEl.style.cssText = 'font-size:0.7em; font-weight:400; opacity:0.8; display:block';
        reasonEl.textContent = reason;

        els.winnerMsg.appendChild(titleText);
        els.winnerMsg.appendChild(reasonEl);
    }
    els.modalplayOver?.showModal();
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
        if (!e.target.classList.contains('piece') || playState.hasMovedThisTurn || playState.isplayOver) {
    e.preventDefault();
    return;
}

const oR = parseInt(e.target.parentElement.dataset.row);
const oC = parseInt(e.target.parentElement.dataset.col);
const val = playState.boardMatrix[oR][oC];
const isP1Piece = (val === 1 || val === 3);

if (isP1Piece !== playState.isPlayer1Turn) {
    e.preventDefault();
    return;
}
        playState.draggedPiece = e.target;
        playState.originSquare = e.target.parentElement;
    });

    els.board.addEventListener('dragover', (e) => e.preventDefault());

    els.board.addEventListener('drop', (e) => {
        e.preventDefault();
        if (playState.isplayOver || !playState.originSquare) return;

        const sq = e.target.closest('.cell');
        if (!sq) return;

        const oR = parseInt(playState.originSquare.dataset.row);
        const oC = parseInt(playState.originSquare.dataset.col);
        const nR = parseInt(sq.dataset.row);
        const nC = parseInt(sq.dataset.col);
        const val = playState.boardMatrix[oR][oC];

        const moveResult = checkMoveValidity(oR, oC, nR, nC, val);
        if (!moveResult.valid) return;

        if (moveResult.isCapture) {
            playState.boardMatrix[moveResult.midR][moveResult.midC] = 0;
            audio.capture();

            if (playState.isPlayer1Turn) {
                playState.p1EatenCount++;
                if (els.eatenP1) els.eatenP1.textContent = playState.p1EatenCount;
            } 
            else {
                playState.p2EatenCount++;
                if (els.eatenP2) els.eatenP2.textContent = playState.p2EatenCount;
            }
        } else {
            audio.move();
        }

        let finalVal = val;
        if (val === 1 && nR === 0) {
            finalVal = 3;
            playState.p1KingsCount++;
            if (els.kingsP1) els.kingsP1.textContent = playState.p1KingsCount;
            audio.queen();
        } else if (val === 2 && nR === 7) {
            finalVal = 4;
            playState.p2KingsCount++;
            if (els.kingsP2) els.kingsP2.textContent = playState.p2KingsCount;
            audio.queen();
        }

        updateMatrixAfterMove(oR, oC, nR, nC, finalVal);
        playState.hasMovedThisTurn = true;
        els.btnEnd?.classList.add('ready');
        renderBoard();

        if (moveResult.isCapture) {
            const { p1, p2 } = countPieces();
            if (p1 === 0) handleplayOver(p2Name, `נגמרו הכלים של ${p1Name}`);
            else if (p2 === 0) handleplayOver(p1Name, `נגמרו הכלים של ${p2Name}`);
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
    if (playState.isplayOver) return;

    const directions = [[-1,-1],[-1,1],[1,-1],[1,1],[-2,-2],[-2,2],[2,-2],[2,2]];

    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const cell = playState.boardMatrix[r][c];

            const isCurrentPlayer = playState.isPlayer1Turn
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
setupplay();