// uiManager.js

import { gameState, tubes, selectedTubeIndex, setTubes, setSelectedTubeIndex, achievements } from './gameState.js';
import { getTranslation, setLanguage } from './translations.js';
import { showMessage, showError, saveGame, getBuyTubeCost, updateGoldDisplay } from './utils.js';
import { playSound, toggleMusic, toggleSfx, updateMusicVolume, updateSfxVolume } from './soundManager.js';
import { getLevelDifficulty, generateSmartPuzzle, isValidMove, isTubeCompleted, highlightHint, isLevelCompleted } from './puzzleLogic.js';
import { updateQuestProgress, claimQuestReward, resetQuestsIfDue, renderQuestItem } from './questManager.js';
import { checkAchievements, showAchievementUnlocked } from './achievementManager.js';
import { initializeNotifications } from './notifications.js';
import { getTopPlayers } from './firebaseService.js';
import { currentPlayerUsername, setupUsernameFeature } from './main.js'; // تأكد من استيراد currentPlayerUsername و setupUsernameFeature


// DOM Elements - يتم تعريفها هنا ولكن سيتم تعيين قيمتها في initializeDOMElements
let tubesContainer, messageEl, goldDisplay, levelDisplay, undoButton, resetButton,
    hintButtonMain, buyTubeButton, loadingMessageEl, achievementBadge, questsButton,
    questsPopup, closeQuestsButton, musicToggleButton, sfxToggleButton, settingsButton,
    settingsPopup, closeSettingsButton, sfxVolumeSlider, musicVolumeSlider,
    dailyQuestsListEl, weeklyQuestsListEl, hintCostDisplay, buyTubeCostDisplay,
    languageToggleButton, skipButton,
    rankingsButton, rankingsModal, closeRankingsModalBtn, rankingsList;

export function initializeDOMElements() {
    tubesContainer = document.getElementById('tubes-container');
    messageEl = document.getElementById('message');
    goldDisplay = document.getElementById('gold-display');
    levelDisplay = document.getElementById('level-display');
    undoButton = document.getElementById('undo-button');
    resetButton = document.getElementById('reset-button');
    hintButtonMain = document.getElementById('hint-button');
    buyTubeButton = document.getElementById('buy-tube-button');
    loadingMessageEl = document.getElementById('loading-message');
    achievementBadge = document.getElementById('achievement-badge');
    questsButton = document.getElementById('quests-button');
    questsPopup = document.getElementById('quests-popup');
    closeQuestsButton = document.getElementById('close-quests-button');
    musicToggleButton = document.getElementById('music-toggle-button');
    sfxToggleButton = document.getElementById('sfx-toggle-button');
    settingsButton = document.getElementById('settings-button');
    settingsPopup = document.getElementById('settings-popup');
    closeSettingsButton = document.getElementById('close-settings-button');
    sfxVolumeSlider = document.getElementById('sfx-volume-slider');
    musicVolumeSlider = document.getElementById('music-volume-slider');
    dailyQuestsListEl = document.getElementById('daily-quests');
    weeklyQuestsListEl = document.getElementById('weekly-quests');
    hintCostDisplay = document.getElementById('hint-cost-display');
    buyTubeCostDisplay = document.getElementById('buy-tube-cost-display');
    languageToggleButton = document.getElementById('language-toggle-button');
    skipButton = document.getElementById('skip-button');

    rankingsButton = document.getElementById('rankings-button');
    rankingsModal = document.getElementById('rankings-modal');
    closeRankingsModalBtn = document.getElementById('close-rankings-modal');
    rankingsList = document.getElementById('rankings-list');

    window.tubesContainer = tubesContainer;
    window.messageEl = messageEl;
    window.goldDisplay = goldDisplay;
    window.levelDisplay = levelDisplay;
    window.undoButton = undoButton;
    window.resetButton = resetButton;
    window.hintButtonMain = hintButtonMain;
    window.buyTubeButton = buyTubeButton;
    window.loadingMessageEl = loadingMessageEl;
    window.achievementBadge = achievementBadge;
    window.questsButton = questsButton;
    window.questsPopup = questsPopup;
    window.closeQuestsButton = closeQuestsButton;
    window.musicToggleButton = musicToggleButton;
    window.sfxToggleButton = sfxToggleButton;
    window.settingsButton = settingsButton;
    window.settingsPopup = settingsPopup;
    window.closeSettingsButton = closeSettingsButton;
    window.sfxVolumeSlider = sfxVolumeSlider;
    window.musicVolumeSlider = musicVolumeSlider;
    window.dailyQuestsListEl = dailyQuestsListEl;
    window.weeklyQuestsListEl = weeklyQuestsListEl;
    window.hintCostDisplay = hintCostDisplay;
    window.buyTubeCostDisplay = buyTubeCostDisplay;
    window.languageToggleButton = languageToggleButton;
    window.skipButton = skipButton;

    window.rankingsButton = rankingsButton;
    window.rankingsModal = rankingsModal;
    window.closeRankingsModalBtn = closeRankingsModalBtn;
    window.rankingsList = rankingsList;

    // توفير messageEl لـ utils.js بعد تهيئته
    window.setUIMessageElement(messageEl);
}

export function updateLanguageUI() {
    const currentLang = gameState.currentLanguage;
    const langData = window.translations[currentLang];

    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.dataset.langKey;
        if (langData && langData[key] && typeof langData[key] === 'string') {
             const iconSpan = element.querySelector('.material-symbols-outlined');
             if (iconSpan) {
                 const textSpan = element.querySelector('span[data-lang-key]');
                 if (textSpan) {
                    textSpan.textContent = langData[key];
                 } else {
                    const originalIconHTML = iconSpan ? iconSpan.outerHTML : '';
                    element.innerHTML = originalIconHTML + ' ' + langData[key];
                 }
             } else {
                 element.textContent = langData[key];
             }
        }
    });

    if (document.documentElement) {
        document.documentElement.setAttribute('lang', currentLang);
        document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
    }

    if (musicToggleButton) {
        const musicIconSpan = musicToggleButton.querySelector('.material-symbols-outlined');
        const musicTextSpan = musicToggleButton.querySelector('span[data-lang-key="toggle_music_on"]');
        if (musicIconSpan && musicTextSpan) {
            musicTextSpan.textContent = gameState.musicOn ? langData.toggle_music_on : langData.toggle_music_off;
            if (gameState.musicOn) {
                musicToggleButton.classList.add('active');
                musicIconSpan.textContent = 'volume_up';
            } else {
                musicToggleButton.classList.remove('active');
                musicIconSpan.textContent = 'volume_off';
            }
        }
    }
    if (sfxToggleButton) {
        const sfxIconSpan = sfxToggleButton.querySelector('.material-symbols-outlined');
        const sfxTextSpan = sfxToggleButton.querySelector('span[data-lang-key="toggle_sfx_on"]');
        if (sfxIconSpan && sfxTextSpan) {
            sfxTextSpan.textContent = gameState.sfxOn ? langData.toggle_sfx_on : langData.toggle_sfx_off;
            if (gameState.sfxOn) {
                sfxToggleButton.classList.add('active');
                sfxIconSpan.textContent = 'volume_up';
            } else {
                sfxToggleButton.classList.remove('active');
                sfxIconSpan.textContent = 'volume_off';
            }
        }
    }

    if (languageToggleButton) {
        const langIconSpan = languageToggleButton.querySelector('.material-symbols-outlined');
        const langTextSpan = languageToggleButton.querySelector('span[data-lang-key="current_language"]');
        if (langIconSpan && langTextSpan) {
            langTextSpan.textContent = langData.current_language;
            langIconSpan.textContent = 'language';
        }
    }

    const playerIdEl = document.getElementById('player-id');
    if (playerIdEl) {
        const displayPlayerName = currentPlayerUsername || (gameState.playerID ? gameState.playerID.substring(0, 8) : 'N/A');
        playerIdEl.textContent = `${getTranslation('player_id_label')}: ${displayPlayerName}`;
    }

    if (window.updateQuestsUI) window.updateQuestsUI();
    if (achievementBadge && achievementBadge.classList.contains('show') && gameState.unlockedAchievements.length > 0) {
        const unlockedAchievement = window.achievements.find(a => a.id === gameState.unlockedAchievements[gameState.unlockedAchievements.length - 1]);
        if (unlockedAchievement) {
            window.showAchievementUnlocked(unlockedAchievement);
        }
    }
}

export function renderTubes() {
    if (!tubesContainer) {
      console.warn("Tubes container element not found. Cannot render tubes.");
      return;
    }
    tubesContainer.innerHTML = '';

    tubes.forEach((tube, tubeIndex) => {
        const tubeEl = document.createElement('div');
        tubeEl.classList.add('tube');
        if (tubeIndex === selectedTubeIndex) {
            tubeEl.classList.add('selected-tube');
        }
        if (isTubeCompleted(tube)) {
            tubeEl.classList.add('completed');
        }
        if (tube.length === 0) {
            tubeEl.classList.add('empty');
        }

        tubeEl.addEventListener('click', handleTubeClick(tubeIndex));

        tube.forEach(ballData => {
            const ballEl = document.createElement('div');
            ballEl.classList.add('ball');
            const ballColor = typeof ballData === 'object' ? ballData.color : ballData;
            ballEl.style.backgroundColor = ballColor;

            if (typeof ballData === 'object' && ballData.isLocked) {
                ballEl.classList.add('locked');
            }
            tubeEl.appendChild(ballEl);
        });
        tubesContainer.appendChild(tubeEl);
    });
}

export function updateUI() {
    if (goldDisplay) goldDisplay.textContent = gameState.gold;
    if (levelDisplay) levelDisplay.textContent = gameState.level;

    if (hintCostDisplay) hintCostDisplay.textContent = window.HINT_COST;
    if (buyTubeCostDisplay) buyTubeCostDisplay.textContent = getBuyTubeCost();

    if (undoButton) undoButton.disabled = gameState.tubeHistory.length === 0 || gameState.gold < window.UNDO_COST_PER_MOVE;
    if (hintButtonMain) hintButtonMain.disabled = gameState.gold < window.HINT_COST;
    if (buyTubeButton) buyTubeButton.disabled = gameState.gold < getBuyTubeCost();
    if (skipButton) skipButton.disabled = gameState.gold < getSkipCost(); // التحكم في حالة زر Skip

    if (musicVolumeSlider) musicVolumeSlider.value = gameState.musicVolume;
    if (sfxVolumeSlider) sfxVolumeSlider.value = gameState.sfxVolume;

    if (window.backgroundMusic) window.backgroundMusic.volume = gameState.musicVolume / 100;
    for (const key in window.soundEffects) {
        if (window.soundEffects.hasOwnProperty(key)) {
            window.soundEffects[key].volume = gameState.sfxVolume / 100;
        }
    }
    updateLanguageUI();
}

// ----------------------------------
// Game Logic Handlers
// ----------------------------------

export function handleTubeClick(index) {
  return function() {
    playSound('click');
    if (selectedTubeIndex === -1) {
      if (tubes[index].length > 0) {
        setSelectedTubeIndex(index);
        renderTubes();
      } else {
        showError('tube_empty_error');
      }
    } else {
      handleSecondSelection(index);
    }
  };
}

export function handleSecondSelection(tubeIndex) {
  const fromTube = tubes[selectedTubeIndex];
  const toTube = tubes[tubeIndex];

  const moveValidation = isValidMove(fromTube, toTube);

  if (!moveValidation.valid) {
    const goldLossAmount = 5;
    showError(moveValidation.reason || 'invalid_move_error', { goldLoss: goldLossAmount });
    gameState.gold = Math.max(0, gameState.gold - goldLossAmount);
    updateUI();
    setSelectedTubeIndex(-1);
    renderTubes();
    saveGame();
    return;
  }

  executeMove(selectedTubeIndex, tubeIndex);

  setSelectedTubeIndex(-1);
  renderTubes();
  checkGameProgress();
  saveGame();
}

export function executeMove(fromIndex, toIndex) {
  gameState.tubeHistory.push(JSON.parse(JSON.stringify(tubes)));
  if (gameState.tubeHistory.length > gameState.maxHistoryDepth) {
    gameState.tubeHistory.shift();
  }

  const ball = tubes[fromIndex].pop();
  if (typeof ball !== 'undefined') {
    tubes[toIndex].push(ball);
  }
  setTubes(tubes);

  gameState.moveCount++;
  gameState.totalMoves++;

  updateUI();
  playSound('move');
}

export function checkGameProgress() {
  if (isLevelCompleted()) {
    showMessage('level_complete_success', 'success', { level: gameState.level, gold: window.GOLD_PER_LEVEL });
    playSound('level_complete');

    gameState.gold += window.GOLD_PER_LEVEL;
    gameState.level++;
    updateQuestProgress('daily_collect_gold', window.GOLD_PER_LEVEL);

    if (!gameState.undoUsedThisLevel) {
      gameState.levelsWithoutUndo++;
    } else {
      gameState.levelsWithoutUndo = 0;
    }
    gameState.undoUsedThisLevel = false;

    updateUI();
    checkAchievements();
    updateQuestProgress('daily_level_complete', 1);

    setTimeout(() => {
        startNewLevel();
    }, 1500);
  }
}

export function undoLastMove() {
  if (gameState.tubeHistory.length > 0) {
    if (gameState.gold < window.UNDO_COST_PER_MOVE) {
      showError('undo_cost_error', { cost: window.UNDO_COST_PER_MOVE });
      return;
    }
    playSound('undo');
    setTubes(JSON.parse(JSON.stringify(gameState.tubeHistory.pop())));
    gameState.gold -= window.UNDO_COST_PER_MOVE;
    gameState.undoUsedThisLevel = true;
    updateUI();
    renderTubes();
    showMessage('undo_success');
    saveGame();
    updateQuestProgress('weekly_undo_use', 1);
  } else {
    showError('no_moves_to_undo');
  }
}

export function resetLevel() {
  if (confirm(getTranslation('reset_confirm'))) {
    playSound('reset');
    gameState.tubeHistory = [];
    gameState.moveCount = 0;
    gameState.undoUsedThisLevel = false;
    // تم إزالة gameState.extraTubes = 0; هنا لأنه سيتم ضبطه بواسطة getLevelDifficulty

    if (window.loadingMessageEl) {
        window.loadingMessageEl.classList.add('show');
        window.showMessage("loading_message");
    }

    try {
        // احصل على إعدادات الصعوبة للمستوى الحالي
        const difficultySettings = getLevelDifficulty(gameState.level);
        // مرر إعدادات الصعوبة إلى setTubes عند إعادة تعيين المستوى
        setTubes(generateSmartPuzzle(gameState.level), difficultySettings); // ✅ تم التعديل هنا
        setSelectedTubeIndex(-1);
        renderTubes();
        updateUI();
        showMessage('level_reset_success');
        saveGame();
    } catch (e) {
        console.error("Error generating puzzle for reset level:", e);
        window.showError("puzzle_generation_error");
    } finally {
        if (window.loadingMessageEl) {
            window.loadingMessageEl.classList.remove('show');
        }
    }
  }
}

export function giveHint() {
    if (gameState.gold < window.HINT_COST) {
        showError('hint_cost_error', { cost: window.HINT_COST });
        return;
    }
    playSound('hint');
    gameState.gold -= window.HINT_COST;
    updateUI();

    if (!tubes || !Array.isArray(tubes) || tubes.length === 0 || tubes.every(t => t.length === 0)) {
        console.error('Invalid tubes state:', tubes);
        showMessage('invalid_game_state', 'error');
        saveGame();
        return;
    }

    function findSimpleHint(tubes) {
        for (let from = 0; from < tubes.length; from++) {
            if (tubes[from].length === 0) continue;
            const topBall = tubes[from][tubes[from].length - 1];
            const topColor = topBall.color;
            for (let to = 0; to < tubes.length; to++) {
                if (from === to) continue;
                const moveValidation = isValidMove(tubes[from], tubes[to]);
                if (moveValidation.valid) {
                    return { from, to };
                }
            }
        }
        return null;
    }

    const simpleHint = findSimpleHint(tubes);
    if (simpleHint) {
        showMessage('hint_message', 'info', { from: simpleHint.from, to: simpleHint.to });
        highlightHint(simpleHint.from, simpleHint.to);
    } else {
        // تأكد من تمرير difficulty.colors الصحيحة هنا
        const solver = new window.PuzzleSolver(tubes, gameState.currentLevelDifficulty.colors); // ✅ تم التعديل هنا
        const solutions = solver.bfs();
        console.log('BFS Solutions:', solutions);
        if (solutions.length > 0 && solutions[0].moves && solutions[0].moves.length > 0) {
            const nextMove = solutions[0].moves[0];
            showMessage('hint_message', 'info', { from: nextMove.from, to: nextMove.to });
            highlightHint(nextMove.from, nextMove.to);
        } else {
            console.warn('No valid moves found in BFS solutions:', solutions);
            showMessage('hint_not_found');
        }
    }
    saveGame();
}

export function buyExtraTube(e) {
  e.preventDefault();
  const dynamicCost = getBuyTubeCost();

  if (gameState.gold < dynamicCost) {
    showError('buy_tube_cost_error', { cost: dynamicCost });
    playSound('error');
    return;
  }
  playSound('buy');
  gameState.gold -= dynamicCost;
  // ✅ تم إزالة gameState.extraTubes++; هنا، لأنه سيتم ضبطه بواسطة getLevelDifficulty
  // عند بدء مستوى جديد، أو يمكنك تعديل لوجيك إضافة أنبوب فارغ دائم هنا.
  // حاليًا، هذا يضيف أنبوبًا فارغًا جديدًا بالإضافة إلى الأنابيب التي يولدها المستوى.
  tubes.push([]); // يضيف أنبوبًا فارغًا جديدًا فعليًا
  setTubes(tubes); // تحديث tubes في gameState

  if (!gameState.hasBoughtFirstTube) {
      gameState.hasBoughtFirstTube = true;
  }

  updateUI();
  renderTubes();
  showMessage('buy_tube_success');
  checkAchievements();
  saveGame();
}

export function checkAndAwardDailyGold() {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (gameState.lastDailyGoldReward === 0 || (now - gameState.lastDailyGoldReward) >= oneDay) {
        gameState.gold += 100;
        gameState.lastDailyGoldReward = now;
        showMessage('daily_gold_reward', 'success', { goldAmount: 100 });
        updateUI();
        saveGame();
    }
}

export function startNewLevel() {
  setSelectedTubeIndex(-1);
  gameState.moveCount = 0;
  gameState.tubeHistory = [];
  gameState.undoUsedThisLevel = false;
  // ✅ لا تقم بـ gameState.extraTubes = 0; هنا. دالة getLevelDifficulty ستحددها.
  // تم إزالة السطر: gameState.extraTubes = 0;

  if (window.loadingMessageEl) {
      window.loadingMessageEl.classList.add('show');
      window.showMessage("loading_message");
  }

  try {
      // 1. الحصول على إعدادات الصعوبة للمستوى الحالي
      const difficultySettings = getLevelDifficulty(gameState.level); // ✅ تم التعديل هنا

      // 2. توليد حالة اللغز الأولية بناءً على إعدادات الصعوبة
      const initialPuzzleState = generateSmartPuzzle(gameState.level); // ✅ تم التعديل هنا

      // 3. قم بتعيين حالة الأنابيب الجديدة وتخزين إعدادات الصعوبة في gameState
      setTubes(initialPuzzleState, difficultySettings); // ✅ تم التعديل هنا

      // 4. تحديث UI لعرض الأنابيب الجديدة
      renderTubes();

      // 5. تصفير حالة التحديد (الأنبوب المختار)
      setSelectedTubeIndex(-1);

      // 6. تحديث واجهة المستخدم لعرض المعلومات الجديدة (المستوى، الذهب، الحركات، إلخ)
      updateUI();

      // 7. رسالة للمستخدم حول بدء المستوى الجديد وهدف الفوز
      let levelStartMessageKey = 'level_start_message'; // رسالة عامة
      if (difficultySettings.tubesToComplete < difficultySettings.colors) {
          // إذا كان شرط الفوز هو إكمال عدد محدد من الأنابيب (أقل من الكل)
          levelStartMessageKey = 'level_start_partial_win_message'; // رسالة خاصة
          // ستحتاج إلى إضافة ترجمة لهذا المفتاح في translations.js
          // على سبيل المثال: "أكمل {0} أنبوب فقط للفوز!"
          showMessage(getTranslation(levelStartMessageKey, difficultySettings.tubesToComplete) || `Level ${gameState.level} started! Complete ${difficultySettings.tubesToComplete} tubes to win!`, 'info');
      } else {
           showMessage(getTranslation(levelStartMessageKey, gameState.level) || `Level ${gameState.level} started!`, 'info');
      }

      // 8. حفظ حالة اللعبة بعد بدء المستوى الجديد
      saveGame();

      console.log(`Level ${gameState.level} loaded. Tubes to complete: ${difficultySettings.tubesToComplete}`);

  } catch (e) {
      console.error("Error generating puzzle for new level:", e);
      window.showError("puzzle_generation_error");
  } finally {
      if (window.loadingMessageEl) {
          window.loadingMessageEl.classList.remove('show');
      }
  }
}


export function skipLevel() {
    const skipCost = getSkipCost();
    if (gameState.gold < skipCost) {
        showError('skip_cost_error', { cost: skipCost });
        playSound('error');
        return;
    }
    playSound('buy');
    gameState.gold -= skipCost;
    gameState.level++;
    startNewLevel();
    showMessage('level_skipped_success', 'success', { level: gameState.level });
    saveGame();
    updateUI();
}

export function getSkipCost() {
    return 500 // تكلفة أساسية 100 + 20 لكل مستوى
}

export function initRankings() {
  if (!window.rankingsButton || !window.rankingsModal || !window.closeRankingsModalBtn || !window.rankingsList) {
    console.warn("One or more rankings DOM elements are missing or not initialized in window object.");
    return;
  }

  window.rankingsButton.addEventListener('click', async () => {
    if (window.rankingsButton) {
      window.rankingsButton.disabled = true;
      window.rankingsButton.innerHTML = `<span class="material-symbols-outlined">sync</span> ${getTranslation('loading_rankings')}`;
    }

    try {
      const topPlayers = await getTopPlayers();
      window.rankingsList.innerHTML = '';

      if (topPlayers.length === 0) {
        const li = document.createElement('li');
        li.textContent = getTranslation('no_players_found');
        window.rankingsList.appendChild(li);
      } else {
        topPlayers.forEach((player, index) => {
          const li = document.createElement('li');
          li.classList.add('leaderboard-item');

          let displayPlayerName = (player.username && player.username.trim() !== '') ? player.username : (player.id || 'N/A');
          let specialIconHTML = '';

          if (player.id === "user-xpu2dyq56") {
              specialIconHTML = '<span class="material-symbols-outlined" style="color: #0056b3; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">developer_mode</span> ';
              if (player.id === gameState.playerID && currentPlayerUsername) {
                  displayPlayerName = currentPlayerUsername;
              }
          } else if (player.id === gameState.playerID && currentPlayerUsername) {
              displayPlayerName = currentPlayerUsername;
          }

          if (index < 3) {
            let avatarColor = '';
            let medalIconHTML = '';

            if (index === 0) {
              avatarColor = 'gold';
              medalIconHTML = '<span class="material-symbols-outlined" style="color: #FFD700; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">emoji_events</span> ';
              li.classList.add('top-1');
            } else if (index === 1) {
              avatarColor = 'silver';
              medalIconHTML = '<span class="material-symbols-outlined" style="color: #C0C0C0; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">military_tech</span> ';
              li.classList.add('top-2');
            } else if (index === 2) {
              avatarColor = 'bronze';
              medalIconHTML = '<span class="material-symbols-outlined" style="color: #B87333; text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">military_tech</span> ';
              li.classList.add('top-3');
            }

            const avatarEl = document.createElement('span');
            avatarEl.classList.add('player-avatar');
            avatarEl.style.backgroundColor = avatarColor;
            avatarEl.textContent = (index + 1).toString();
            li.appendChild(avatarEl);

            const medalEl = document.createElement('span');
            medalEl.classList.add('leaderboard-medal-icon');
            medalEl.innerHTML = medalIconHTML;
            li.appendChild(medalEl);

          } else {
            const rankNumberEl = document.createElement('div');
            rankNumberEl.classList.add('rank-number');
            rankNumberEl.textContent = `#${index + 1}`;
            li.appendChild(rankNumberEl);
          }

          const playerInfoEl = document.createElement('div');
          playerInfoEl.classList.add('player-info');

          const playerIdSnippetEl = document.createElement('div');
          playerIdSnippetEl.classList.add('player-id-snippet');
          playerIdSnippetEl.innerHTML = specialIconHTML + displayPlayerName;
          playerInfoEl.appendChild(playerIdSnippetEl);

          const playerStatsEl = document.createElement('div');
          playerStatsEl.classList.add('player-stats');

          const levelStatEl = document.createElement('span');
          levelStatEl.classList.add('stat-level');
          levelStatEl.innerHTML = `<i class="material-symbols-outlined">bar_chart</i> ${getTranslation('level_label')} ${player.level}`;
          playerStatsEl.appendChild(levelStatEl);

          const goldStatEl = document.createElement('span');
          goldStatEl.classList.add('stat-gold');
          goldStatEl.innerHTML = `<i class="material-symbols-outlined">payments</i> ${getTranslation('gold_label')} ${player.gold || 0}`;
          playerStatsEl.appendChild(goldStatEl);

          playerInfoEl.appendChild(playerStatsEl);

          li.appendChild(playerInfoEl);

          window.rankingsList.appendChild(li);
        });
      }
      window.rankingsModal.style.display = 'block';
    } catch (error) {
      console.error("Failed to load rankings:", error);
      window.showMessage("error_loading_rankings", 'error');
      window.rankingsList.innerHTML = `<li>${getTranslation('error_loading_rankings')}</li>`;
      window.rankingsModal.style.display = 'block';
    } finally {
      if (window.rankingsButton) {
        window.rankingsButton.disabled = false;
        window.rankingsButton.innerHTML = `<span class="material-symbols-outlined">leaderboard</span> <span data-lang-key="rankings_text">${getTranslation('rankings_text')}</span>`;
        updateLanguageUI();
      }
    }
  });

  window.closeRankingsModalBtn.addEventListener('click', () => {
    window.rankingsModal.style.display = 'none';
  });

  window.addEventListener('click', (event) => {
    if (event.target === window.rankingsModal) {
      window.rankingsModal.style.display = 'none';
    }
  });
}

export function addEventListeners() {
    if (undoButton) undoButton.addEventListener('click', undoLastMove);
    if (resetButton) resetButton.addEventListener('click', resetLevel);
    if (hintButtonMain) hintButtonMain.addEventListener('click', giveHint);
    if (buyTubeButton) buyTubeButton.addEventListener('click', buyExtraTube);
    if (skipButton) skipButton.addEventListener('click', skipLevel);

    if (questsButton) questsButton.addEventListener('click', () => {
        if (questsPopup) {
            questsPopup.classList.remove('hidden');
            questsPopup.classList.add('show');
            window.updateQuestsUI();
        }
    });
    if (closeQuestsButton) closeQuestsButton.addEventListener('click', () => {
        if (questsPopup) {
            questsPopup.classList.remove('show');
            questsPopup.classList.add('hidden');
        }
    });

    if (settingsButton) settingsButton.addEventListener('click', () => {
        if (settingsPopup) {
            settingsPopup.classList.remove('hidden');
            settingsPopup.classList.add('show');
            updateUI();
            setupUsernameFeature();
        }
    });
    if (closeSettingsButton) closeSettingsButton.addEventListener('click', () => {
        if (settingsPopup) {
            settingsPopup.classList.remove('show');
            settingsPopup.classList.add('hidden');
        }
    });

    if (musicToggleButton) musicToggleButton.addEventListener('click', toggleMusic);
    if (sfxToggleButton) sfxToggleButton.addEventListener('click', toggleSfx);
    if (musicVolumeSlider) musicVolumeSlider.addEventListener('input', updateMusicVolume);
    if (sfxVolumeSlider) sfxVolumeSlider.addEventListener('input', updateSfxVolume);

    if (languageToggleButton) {
        languageToggleButton.addEventListener('click', () => {
            const currentLang = gameState.currentLanguage;
            const availableLangs = Object.keys(window.translations);
            const currentIndex = availableLangs.indexOf(currentLang);
            const nextIndex = (currentIndex + 1) % availableLangs.length;
            const newLang = availableLangs[nextIndex];
            setLanguage(newLang);
        });
    }
}
