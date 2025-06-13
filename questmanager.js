import { gameState } from './gameState.js';
import { getTranslation } from './translations.js';
import { showMessage, saveGame } from './utils.js';
import { playSound } from './soundManager.js';
import { updateGoldDisplay } from './utils.js'; // ✅ صح: استوردها من utils.js


export function updateQuestProgress(questId, amount) {
  const quest = gameState.quests.find(q => q.id === questId);
  if (quest && !quest.completed) {
    quest.progress += amount;
    if (quest.progress >= quest.target) {
      quest.progress = quest.target;
      quest.completed = true;
      const questDesc = getTranslation(quest.descKey, { target: quest.target });
      showMessage('quest_completed_msg', 'success', { desc: questDesc });
      playSound('quest_complete');
    }
  }
  window.updateQuestsUI();
  saveGame();
}

export function claimQuestReward(questId) {
  const quest = gameState.quests.find(q => q.id === questId);
  if (quest && quest.completed && !quest.rewardClaimed) {
    gameState.gold += quest.reward;
    quest.rewardClaimed = true;
    updateGoldDisplay(gameState.gold); // Update gold display
    window.updateQuestsUI();
    const questDesc = getTranslation(quest.descKey, { target: quest.target });
    showMessage('quest_claimed_msg', 'success', { desc: questDesc });
    playSound('buy');
    saveGame();
  }
}

export function resetQuestsIfDue() {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const oneWeek = 7 * oneDay;

  let questsReset = false;
  gameState.quests.forEach(quest => {
    if (quest.type === 'DAILY' && (now - quest.lastReset) >= oneDay) {
      quest.progress = 0;
      quest.completed = false;
      quest.rewardClaimed = false;
      quest.lastReset = now;
      questsReset = true;
    }
    if (quest.type === 'WEEKLY' && (now - quest.lastReset) >= oneWeek) {
      quest.progress = 0;
      quest.completed = false;
      quest.rewardClaimed = false;
      quest.lastReset = now;
      questsReset = true;
    }
  });
  if (questsReset) {
      saveGame();
  }
}

export function renderQuestItem(quest) {
    const questItem = document.createElement('div');
    questItem.classList.add('quest-item');
    if (quest.completed) {
        questItem.classList.add('completed');
    }

    const questDesc = getTranslation(quest.descKey, { target: quest.target });

    const title = document.createElement('h4');
    title.textContent = questDesc;
    questItem.appendChild(title);

    const progressText = document.createElement('p');
    progressText.textContent = `${getTranslation('progress_label')} ${quest.progress} / ${quest.target}`;
    questItem.appendChild(progressText);

    const progressBarContainer = document.createElement('div');
    progressBarContainer.classList.add('quest-progress-bar-container');
    const progressBar = document.createElement('div');
    progressBar.classList.add('quest-progress-bar');
    const progressPercentage = (quest.progress / quest.target) * 100;
    progressBar.style.width = `${progressPercentage}%`;
    progressBarContainer.appendChild(progressBar);
    questItem.appendChild(progressBarContainer);

    const rewardText = document.createElement('p');
    rewardText.classList.add('quest-reward-text');
    rewardText.textContent = `${getTranslation('reward_label')} ${quest.reward} ${getTranslation('gold_label').replace(':', '').trim()}`;
    questItem.appendChild(rewardText);

    const claimButton = document.createElement('button');
    claimButton.classList.add('quest-claim-button');
    claimButton.textContent = getTranslation('claim_reward_button');
    claimButton.disabled = !quest.completed || quest.rewardClaimed;
    claimButton.addEventListener('click', () => claimQuestReward(quest.id));
    questItem.appendChild(claimButton);

    return questItem;
}

export function updateQuestsUI() {
    if (!window.dailyQuestsListEl || !window.weeklyQuestsListEl) {
      console.warn("Quest list elements not found. Cannot update quests UI.");
      return;
    }

    window.dailyQuestsListEl.innerHTML = '';
    window.weeklyQuestsListEl.innerHTML = '';

    gameState.quests.forEach(quest => {
        const questItem = renderQuestItem(quest);
        if (quest.type === 'DAILY') {
            window.dailyQuestsListEl.appendChild(questItem);
        } else if (quest.type === 'WEEKLY') {
            window.weeklyQuestsListEl.appendChild(questItem);
        }
    });
}
