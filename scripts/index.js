/**
 * @fileoverview לוגיקת דף הבית - ניהול טופס שחקנים ומעבר לדף המשחק
 * @module index
 */

import { setupModal } from './main.js';

// --- חיבור מודאלים ---
setupModal('btn-open-auth', 'btn-close-auth', 'modal-auth');
setupModal('btn-open-settings', 'btn-close-settings', 'modal-settings');
