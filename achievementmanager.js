import { gameState, achievements } from './gameState.js';
import { getTranslation } from './translations.js';
import { showMessage, saveGame } from './utils.js';
import { playSound } from './soundManager.js';
import { updateUI } from './uiManager.js'; // To update UI after gaining gold

export function checkAchievements() {
  achievements.forEach(achievement => {
    if (!achievement.unlocked && !gameState.unlockedAchievements.includes(achievement.id) && achievement.check()) {
      achievement.unlocked = true;
      gameState.unlockedAchievements.push(achievement.id);
      gameState.gold += achievement.reward;
      showAchievementUnlocked(achievement);
      updateUI();
      saveGame();
      playSound('achievement');
    }
  });
}

export function showAchievementUnlocked(achievement) {
  if (!window.achievementBadge) {
    console.warn("Achievement badge element not found.");
    return;
  }
  const achievementName = getTranslation(achievement.name_key);

  showMessage('new_achievement_unlocked', 'success', { name: achievementName, reward: achievement.reward });
  window.achievementBadge.textContent = getTranslation('new_achievement_unlocked', {name: achievementName, reward: achievement.reward});
  window.achievementBadge.classList.add('show');
  setTimeout(() => {
    window.achievementBadge.classList.remove('show');
  }, 3000);
}
