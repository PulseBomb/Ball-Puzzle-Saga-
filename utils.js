// utils.js

import { AES_KEY } from './constants.js';
import { getTranslation } from './translations.js';
import { playSound } from './soundManager.js';
import { gameState } from './gameState.js';
// ✅ استيراد currentPlayerUsername هنا من main.js
import { currentPlayerUsername } from './main.js';

// تأكد من استيراد هذه الدوال من firebaseService.js
// يجب أن تكون database, ref, get, set, و UPDATE
// Realtime Database (كما في لقطة الشاشة الخاصة بك)
import { database, ref, get, set, update } from './firebaseService.js'; // ✅ تأكد من تصدير update من firebaseService.js أيضاً


let messageEl = null;

export function setUIMessageElement(element) {
    messageEl = element;
    if (!messageEl) {
        console.warn("Message element is null after setUIMessageElement. Make sure the ID 'message' is correct in HTML.");
    }
}

export function showMessage(msgKey, type = 'info', params = {}) {
    if (!messageEl) {
        console.warn("Message element not found. Cannot display message. Key:", msgKey);
        return;
    }
    const msg = getTranslation(msgKey, params);

    messageEl.textContent = msg;
    messageEl.className = 'game-message';
    if (type === 'error') {
        messageEl.classList.add('error-message');
        messageEl.classList.add('shake-error');
    } else if (type === 'success') {
        messageEl.classList.add('success-message');
    } else {
        messageEl.classList.add('info-message');
    }
    messageEl.classList.remove('hidden');

    setTimeout(() => {
        // التأكد من عدم إخفاء رسالة التحميل إذا كانت لا تزال معروضة لعملية أطول
        // هذا الشرط يمنع إخفاء مبكر لرسالة التحميل
        if (!messageEl.classList.contains('game-loading-overlay')) {
            messageEl.classList.add('hidden');
            messageEl.classList.remove('error-message', 'shake-error', 'success-message', 'info-message');
        }
    }, 3000);
}

export function showError(msgKey, params = {}) {
    showMessage(msgKey, 'error', params);
    playSound('error');
}

export function encryptData(data) {
    try {
        const encrypted = CryptoJS.AES.encrypt(JSON.stringify(data), AES_KEY).toString();
        return encrypted;
    } catch (e) {
        console.error("Encryption error:", e);
        return null;
    }
}

export function decryptData(encryptedString) {
    try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedString, AES_KEY);
        const decryptedData = JSON.parse(decryptedBytes.toString(CryptoJS.enc.Utf8));
        return decryptedData;
    } catch (e) {
        console.error("Decryption error:", e);
        return null;
    }
}

export async function saveGame() {
    try {
        const dataToSave = {
            level: gameState.level,
            gold: gameState.gold,
            extraTubes: gameState.extraTubes,
            currentLanguage: gameState.currentLanguage,
            quests: gameState.quests,
            moveCount: gameState.moveCount,
            totalMoves: gameState.totalMoves,
            levelsWithoutUndo: gameState.levelsWithoutUndo,
            unlockedAchievements: gameState.unlockedAchievements,
            sfxVolume: gameState.sfxVolume,
            musicVolume: gameState.musicVolume,
            musicOn: gameState.musicOn,
            sfxOn: gameState.sfxOn,
            lastDailyReset: gameState.lastDailyReset,
            lastWeeklyReset: gameState.lastWeeklyReset,
            lastDailyGoldReward: gameState.lastDailyGoldReward,
            undoUsedThisLevel: gameState.undoUsedThisLevel,
            hasBoughtFirstTube: gameState.hasBoughtFirstTube,
            playerID: gameState.playerID,
            userNotifications: gameState.userNotifications,
            username: currentPlayerUsername
        };

        const encryptedData = encryptData(dataToSave);
        localStorage.setItem('colorSortGameState', encryptedData);

        if (gameState.playerID) {
            await updatePlayerData(gameState.playerID, dataToSave);
            console.log("Game state updated in Firebase.");
        }

    } catch (e) {
        console.error('Failed to save game:', e);
    }
}

// ✅ دالة loadGame المحدثة مع منطق شاشة التحميل
export async function loadGame() {
    // ✅ إظهار رسالة التحميل في بداية تحميل اللعبة
    if (messageEl) {
        messageEl.classList.add('show');
        messageEl.classList.add('game-loading-overlay'); // فئة جديدة سنضيفها في CSS
        showMessage('loading_game'); // عرض رسالة "جار تحميل اللعبة..."
    }

    try {
        let loadedData = null;
        let playerIDFromLocal = localStorage.getItem('playerID');

        if (playerIDFromLocal) {
            gameState.playerID = playerIDFromLocal;
            try {
                const firebasePlayerData = await getPlayerData(playerIDFromLocal);
                if (firebasePlayerData) {
                    console.log("Loaded game state from Firebase.");
                    loadedData = { gameState: firebasePlayerData };
                }
            } catch (firebaseError) {
                console.warn("Could not load from Firebase, trying localStorage:", firebaseError);
                const encryptedData = localStorage.getItem('colorSortGameState');
                if (encryptedData) {
                    loadedData = decryptData(encryptedData);
                    console.log("Loaded game state from localStorage.");
                }
            }
        } else {
            const encryptedData = localStorage.getItem('colorSortGameState');
            if (encryptedData) {
                loadedData = decryptData(encryptedData);
                console.log("Loaded game state from localStorage (no player ID yet).");
            }
        }

        if (loadedData && loadedData.gameState) {
            Object.keys(gameState).forEach(key => {
                if (loadedData.gameState.hasOwnProperty(key)) {
                    if (key === 'quests') {
                        const loadedQuestsMap = new Map(loadedData.gameState.quests.map(q => [q.id, q]));
                        gameState.quests = gameState.quests.map(currentQuest => {
                            return loadedQuestsMap.has(currentQuest.id) ? { ...currentQuest, ...loadedQuestsMap.get(currentQuest.id) } : currentQuest;
                        });
                        loadedQuestsMap.forEach((loadedQuest, id) => {
                            if (!gameState.quests.some(q => q.id === id)) {
                                gameState.quests.push(loadedQuest);
                            }
                        });
                    } else if (Array.isArray(gameState[key]) && Array.isArray(loadedData.gameState[key])) {
                        gameState[key] = loadedData.gameState[key];
                    } else if (typeof gameState[key] === 'object' && gameState[key] !== null && loadedData.gameState[key] !== null && !Array.isArray(gameState[key])) {
                        Object.assign(gameState[key], loadedData.gameState[key]);
                    }
                    else {
                        gameState[key] = loadedData.gameState[key];
                    }
                }
            });
        }
    } catch (e) {
        console.error('Failed to load game or corrupted save:', e);
        // إعادة تعيين حالة اللعبة إلى الإعدادات الافتراضية في حالة الفشل
        localStorage.removeItem('colorSortGameState');
        localStorage.removeItem('playerID');
        Object.assign(gameState, {
            level: 1,
            gold: 100,
            extraTubes: 0,
            currentLanguage: 'en',
            quests: [
              { id: 'daily_level_complete', type: 'DAILY', descKey: 'daily_level_complete_desc', progress: 0, target: 3, reward: 150, lastReset: Date.now(), completed: false, rewardClaimed: false },
              { id: 'weekly_undo_use', type: 'WEEKLY', descKey: 'weekly_undo_use_desc', progress: 0, target: 5, reward: 300, lastReset: Date.now(), completed: false, rewardClaimed: false },
              { id: 'daily_collect_gold', type: 'DAILY', descKey: 'daily_collect_gold_desc', progress: 0, target: 200, reward: 100, lastReset: Date.now(), completed: false, rewardClaimed: false }
            ],
            moveCount: 0,
            totalMoves: 0,
            levelsWithoutUndo: 0,
            unlockedAchievements: [],
            tubeHistory: [],
            maxHistoryDepth: 25,
            difficultyStats: { colorIncrement: 0.7, tubeDecrement: 5 },
            sfxVolume: 70,
            musicVolume: 30,
            musicOn: true,
            sfxOn: true,
            lastDailyReset: Date.now(),
            lastWeeklyReset: Date.now(),
            lastDailyGoldReward: 0,
            undoUsedThisLevel: false,
            hasBoughtFirstTube: false,
            playerID: null,
            userNotifications: { readNotificationsIds: {} }
        });
        window.setTubes([]); // تأكد من إعادة تعيين الأنابيب أيضًا
        showMessage('load_game_error', 'error'); // عرض رسالة خطأ محددة عند الفشل
    } finally {
        // ✅ إخفاء رسالة التحميل بمجرد الانتهاء (سواء بنجاح أو فشل)
        if (messageEl) {
            messageEl.classList.remove('show');
            messageEl.classList.remove('game-loading-overlay'); // إزالة الفئة الخاصة بالتحميل
            // التأكد من إزالة فئات الرسائل العادية لعدم تأثيرها على الرسائل المستقبلية
            messageEl.classList.remove('error-message', 'success-message', 'info-message', 'shake-error');
        }
        // هذا الجزء يجب أن يتم دائماً بعد محاولة التحميل، لضمان وجود playerID
        if (!gameState.playerID) {
            gameState.playerID = generateUserId();
            localStorage.setItem('playerID', gameState.playerID);
            // ✅ استخدام 'await' لضمان إتمام حفظ البيانات الأولية قبل المتابعة
            await saveInitialPlayerData(gameState.playerID, {
                level: gameState.level,
                gold: gameState.gold,
                totalMoves: gameState.totalMoves,
                hasBoughtFirstTube: gameState.hasBoughtFirstTube,
                unlockedAchievements: gameState.unlockedAchievements,
                currentLanguage: gameState.currentLanguage,
                sfxVolume: gameState.sfxVolume,
                musicVolume: gameState.musicVolume,
                musicOn: gameState.musicOn,
                sfxOn: gameState.sfxOn,
                lastDailyReset: gameState.lastDailyReset,
                lastWeeklyReset: gameState.lastWeeklyReset,
                lastDailyGoldReward: gameState.lastDailyGoldReward,
                quests: gameState.quests,
                userNotifications: gameState.userNotifications,
                username: currentPlayerUsername
            });
        }
    }
}

export function generateUserId() {
    return 'user-' + Math.random().toString(36).substr(2, 9);
}

export async function saveInitialPlayerData(playerId, data) {
    try {
        await updatePlayerData(playerId, data);
        console.log(`Initial player data saved for ID: ${playerId}`);
    } catch (error) {
        console.error(`Error saving initial player data for ID: ${playerId}`, error);
    }
}

export async function getPlayerData(playerID) {
    if (!playerID) {
        console.warn("Attempted to get player data without a player ID.");
        return null;
    }
    try {
        const playerRef = ref(database, `players/${playerID}`);
        const snapshot = await get(playerRef);
        if (snapshot.exists()) {
            return snapshot.val();
        } else {
            console.log("No data available for player:", playerID);
            return null;
        }
    } catch (error) {
        console.error("Error getting player data from Firebase:", error);
        return null;
    }
}

export async function updatePlayerData(playerID, data) {
    if (!playerID) {
        console.warn("Attempted to update player data without a player ID.");
        return;
    }
    try {
        const playerRef = ref(database, `players/${playerID}`);
        await update(playerRef, data); // ✅ تم التغيير من set إلى update هنا
        console.log(`Player data updated for ID: ${playerID}`);
    } catch (error) {
        console.error(`Error updating player data for ID: ${playerID}`, error);
    }
}

export function getBuyTubeCost() {
    return window.BUY_TUBE_BASE_COST + (gameState.extraTubes * window.BUY_TUBE_INCREMENT);
}

export function updateGoldDisplay(newGoldAmount) {
    gameState.gold = newGoldAmount;
    if (window.goldDisplay) {
        window.goldDisplay.textContent = gameState.gold;
    }
}
