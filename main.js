// main.js

// Import all necessary modules
import { gameState, setTubes, setSelectedTubeIndex, tubes, achievements } from './gameState.js';
import { getTranslation, setLanguage, translations } from './translations.js';
import { loadSounds, backgroundMusic, soundEffects } from './soundManager.js';
import { saveGame, loadGame, generateUserId, saveInitialPlayerData, getPlayerData, updatePlayerData, setUIMessageElement, showMessage } from './utils.js';
import { getLevelDifficulty, generateSmartPuzzle, isValidMove, isTubeCompleted, PuzzleSolver, highlightHint, isLevelCompleted } from './puzzleLogic.js';
import { initializeDOMElements, addEventListeners, updateLanguageUI, renderTubes, updateUI, checkAndAwardDailyGold, startNewLevel, initRankings } from './uiManager.js';
import { resetQuestsIfDue, updateQuestsUI } from './questManager.js';
import { checkAchievements, showAchievementUnlocked } from './achievementManager.js';
import { initializeNotifications } from './notifications.js';
import { checkAndAwardWeeklyRewards } from './firebaseService.js';

// ✅ متغير لتخزين اسم المستخدم الحالي، سيتم تصديره ليكون متاحاً في ملفات أخرى
export let currentPlayerUsername = '';

// ✅ دالة لتهيئة وإدارة ميزة اسم المستخدم
export function setupUsernameFeature() {
    const usernameInput = document.getElementById('username-input');
    const saveUsernameButton = document.getElementById('save-username-button');
    const playerIdDisplay = document.getElementById('player-id');

    // تحميل اسم المستخدم من Local Storage عند بدء اللعبة
    currentPlayerUsername = localStorage.getItem('playerUsername') || '';
    if (usernameInput) {
        usernameInput.value = currentPlayerUsername;
    }

    // تحديث عرض اسم المستخدم/الـ ID في شاشة الإعدادات
    updatePlayerIdDisplay();

    if (saveUsernameButton) {
        saveUsernameButton.addEventListener('click', () => {
            let newUsername = usernameInput.value.trim();

            // --- تحقق بسيط من صحة الاسم (يمكنك توسيعه) ---
            if (newUsername.length < 3 || newUsername.length > 20) {
                showMessage(getTranslation('username_length_error') || "اسم المستخدم يجب أن يكون بين 3 و 20 حرفًا.", 'error');
                return;
            }
            // يمكنك إضافة المزيد من التحقق هنا (مثل منع الكلمات البذيئة أو الأحرف الخاصة)

            currentPlayerUsername = newUsername;
            localStorage.setItem('playerUsername', newUsername); // حفظ الاسم
            updatePlayerIdDisplay(); // تحديث العرض فورًا
            showMessage(getTranslation('username_saved_success') || "تم حفظ اسم المستخدم بنجاح!", 'success');
            saveGame(); // تأكد من حفظ اللعبة بعد تغيير الاسم
        });
    }

    // دالة لتحديث عرض الـ ID/الاسم في شاشة الإعدادات
    function updatePlayerIdDisplay() {
        if (playerIdDisplay) {
            const currentGeneratedId = gameState.playerID || 'N/A';
            // استخدم اسم المستخدم إذا كان موجودًا، وإلا استخدم جزءًا من الـ ID المُولد
            const displayId = currentPlayerUsername || `${getTranslation('your_id_label')}: ${currentGeneratedId.substring(0, 8)}`;
            playerIdDisplay.textContent = `${getTranslation('player_id_label')}: ${displayId}`;
        }
    }

    // تحديث العرض عند التهيئة
    updatePlayerIdDisplay();
}


// Expose necessary functions/variables to the global window object for inter-module communication
window.gameState = gameState;
window.setTubes = setTubes;
window.setSelectedTubeIndex = setSelectedTubeIndex;
window.getTranslation = getTranslation;
window.setLanguage = setLanguage;
window.translations = translations;
window.loadSounds = loadSounds;
window.saveGame = saveGame;
window.loadGame = loadGame;
window.generateUserId = generateUserId;
window.saveInitialPlayerData = saveInitialPlayerData;
window.getPlayerData = getPlayerData;
window.updatePlayerData = updatePlayerData;
window.setUIMessageElement = setUIMessageElement;
window.getLevelDifficulty = getLevelDifficulty;
window.generateSmartPuzzle = generateSmartPuzzle;
window.isValidMove = isValidMove;
window.isTubeCompleted = isTubeCompleted;
window.updateLanguageUI = updateLanguageUI;
window.renderTubes = renderTubes;
window.updateUI = updateUI;
window.checkAndAwardDailyGold = checkAndAwardDailyGold;
window.startNewLevel = startNewLevel;
window.resetQuestsIfDue = resetQuestsIfDue;
window.updateQuestsUI = updateQuestsUI;
window.checkAchievements = checkAchievements;
window.initializeNotifications = initializeNotifications;
window.isLevelCompleted = isLevelCompleted;
window.showAchievementUnlocked = showAchievementUnlocked;
window.achievements = achievements;
window.showMessage = showMessage;

// Import constants directly into main scope if you need them for global window access
import { GOLD_PER_LEVEL, UNDO_COST_PER_MOVE, HINT_COST, BUY_TUBE_BASE_COST, BUY_TUBE_INCREMENT } from './constants.js';
window.GOLD_PER_LEVEL = GOLD_PER_LEVEL;
window.UNDO_COST_PER_MOVE = UNDO_COST_PER_MOVE;
window.HINT_COST = HINT_COST;
window.BUY_TUBE_BASE_COST = BUY_TUBE_BASE_COST;
window.BUY_TUBE_INCREMENT = BUY_TUBE_INCREMENT;

// Sound Manager specific exports for global access
window.backgroundMusic = backgroundMusic;
window.soundEffects = soundEffects;

// Puzzle Logic specific exports for global access
window.PuzzleSolver = PuzzleSolver;
window.highlightHint = highlightHint;

async function initGame() {
  initializeDOMElements(); // تهيئة عناصر DOM
  await loadGame(); // تحميل اللعبة
  loadSounds(); // تحميل الأصوات

  // ✅ استدعاء setupUsernameFeature بعد تحميل اللعبة لضمان أن gameState.playerID متاح وأن localStorage تم تحميله
  setupUsernameFeature();

  if (window.messageEl) {
    window.showMessage("game_loaded_message");
  } else {
    console.warn("Message element still not available for game_loaded_message.");
  }

  checkAndAwardDailyGold();
  checkAndAwardWeeklyRewards();
  resetQuestsIfDue();

  startNewLevel();
  checkAchievements();
  updateLanguageUI();
  updateQuestsUI();
  initializeNotifications();
  initRankings();
  addEventListeners();
}

document.addEventListener('DOMContentLoaded', initGame);
