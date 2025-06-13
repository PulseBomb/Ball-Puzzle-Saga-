// ----------------------------------
// Game State with Difficulty Tracking
// ----------------------------------
export const gameState = {
  level: 1,
  gold: 100,
  extraTubes: 0, // This will now reset per level
  currentLanguage: 'en', // CHANGED: Default language is now English
  quests: [
    // Note: Quest descriptions will now use language keys for rendering
    { id: 'daily_level_complete', type: 'DAILY', descKey: 'daily_level_complete_desc', progress: 0, target: 3, reward: 150, lastReset: Date.now(), completed: false, rewardClaimed: false },
    { id: 'weekly_undo_use', type: 'WEEKLY', descKey: 'weekly_undo_use_desc', progress: 0, target: 5, reward: 300, lastReset: Date.now(), completed: false, rewardClaimed: false },
    { id: 'daily_collect_gold', type: 'DAILY', descKey: 'daily_collect_gold_desc', progress: 0, target: 200, reward: 100, lastReset: Date.now(), completed: false, rewardClaimed: false }
  ],
  moveCount: 0, // Moves in current level
  totalMoves: 0, // Total moves across all levels
  levelsWithoutUndo: 0, // Consecutive levels completed without undo
  unlockedAchievements: [],
  tubeHistory: [], // Stores states for undo
  maxHistoryDepth: 25,
  difficultyStats: {
    colorIncrement: 1.0,
    tubeDecrement: 10
  },
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
  userNotifications: {
    readNotificationsIds: {}
  },
  // NEW: Property to store the difficulty settings for the current level
  // This is where 'tubesToComplete' will live for easy access.
  currentLevelDifficulty: null
};

export let tubes = []; // Current state of the tubes
export let selectedTubeIndex = -1; // Index of the currently selected tube for a move

// Modified setTubes to also store level difficulty when a new level is loaded
export function setTubes(newTubes, difficultySettings = null) {
    tubes = newTubes;
    if (difficultySettings) {
        // Store the entire difficulty settings object for the current level
        gameState.currentLevelDifficulty = difficultySettings;
        // Reset move count and undo status for the new level
        gameState.moveCount = 0;
        gameState.undoUsedThisLevel = false;
        gameState.tubeHistory = []; // Clear history for new level
    }
}

export function setSelectedTubeIndex(index) {
    selectedTubeIndex = index;
}

// ----------------------------------
// Enhanced Achievements (Update descriptions to use language keys)
// ----------------------------------
export const achievements = [
  {
    id: 'speed_runner',
    name_key: 'achievement_speed_runner_name',
    desc_key: 'achievement_speed_runner_desc',
    check: () => gameState.level >= 5 && gameState.totalMoves <= 50,
    reward: 200,
    unlocked: false
  },
  {
    id: 'perfectionist',
    name_key: 'achievement_perfectionist_name',
    desc_key: 'achievement_perfectionist_desc',
    check: () => gameState.levelsWithoutUndo >= 10,
    reward: 300,
    unlocked: false
  },
  {
    id: 'gold_hoarder',
    name_key: 'achievement_gold_hoarder_name',
    desc_key: 'achievement_gold_hoarder_desc',
    check: () => gameState.gold >= 300,
    reward: 500,
    unlocked: false
  },
  {
    id: 'first_tube_buyer',
    name_key: 'achievement_first_tube_buyer_name',
    desc_key: 'achievement_first_tube_buyer_desc',
    check: () => gameState.hasBoughtFirstTube,
    reward: 100,
    unlocked: false
  }
];
