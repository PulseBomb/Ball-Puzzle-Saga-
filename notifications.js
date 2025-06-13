import { gameState } from './gameState.js';
import { getTranslation } from './translations.js';
import { showMessage, saveGame, updateGoldDisplay } from './utils.js';
import { playSound } from './soundManager.js';

// استورد الدوال الأساسية من Firebase SDK مباشرةً لأنك تستخدمها هنا
import { ref, get, set, onValue as firebaseOnValue } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// استورد database و onValue (التي تُصدرها الآن من firebaseService)
import { database, onValue } from './firebaseService.js';


let allNotifications = [];

// ✅ هذا هو تعريف الدالة initializeNotifications الذي يجب أن يكون موجوداً
export function initializeNotifications() {
    const notificationsButton = document.getElementById('notifications-button');
    const notificationsModal = document.getElementById('notifications-modal');
    const closeNotificationsModalBtn = document.getElementById('close-notifications-modal');
    const notificationsList = document.getElementById('notifications-list');
    const unreadNotificationsCountSpan = document.getElementById('unread-notifications-count');

    // Make these globally accessible to UIManager for setup, but keep logic here
    window.notificationsButton = notificationsButton;
    window.notificationsModal = notificationsModal;
    window.closeNotificationsModalBtn = closeNotificationsModalBtn;
    window.notificationsList = notificationsList;
    window.unreadNotificationsCountSpan = unreadNotificationsCountSpan;

    if (notificationsButton) {
        notificationsButton.addEventListener('click', () => {
            notificationsModal.style.display = 'flex';
            renderNotifications();
        });
    }

    if (closeNotificationsModalBtn) {
        closeNotificationsModalBtn.addEventListener('click', () => {
            notificationsModal.style.display = 'none';
        });
    }

    window.addEventListener('click', (event) => {
        if (event.target === notificationsModal) {
            notificationsModal.style.display = 'none';
        }
    });

    const currentUserId = gameState.playerID;

    // استخدم firebaseOnValue من الاستيراد المباشر
    firebaseOnValue(ref(database, 'notifications'), (snapshot) => {
        const notificationsData = snapshot.val();
        allNotifications = [];
        if (notificationsData) {
            for (const id in notificationsData) {
                allNotifications.push({ id, ...notificationsData[id] });
            }
        }
        updateUnreadCount();
        if (notificationsModal && notificationsModal.style.display === 'flex') {
            renderNotifications();
        }
    });

    if (currentUserId) {
        // استخدم firebaseOnValue من الاستيراد المباشر
        firebaseOnValue(ref(database, `players/${currentUserId}/userNotifications/readNotificationsIds`), (snapshot) => {
            const readIds = snapshot.val();
            gameState.userNotifications.readNotificationsIds = readIds || {};
            updateUnreadCount();
            if (notificationsModal && notificationsModal.style.display === 'flex') {
                renderNotifications();
            }
        });
    }
}

export function updateUnreadCount() {
    if (!window.unreadNotificationsCountSpan) return;

    const unreadCount = allNotifications.filter(notif => !gameState.userNotifications.readNotificationsIds[notif.id]).length;
    if (unreadCount > 0) {
        window.unreadNotificationsCountSpan.textContent = unreadCount;
        window.unreadNotificationsCountSpan.style.display = 'inline-block';
    } else {
        window.unreadNotificationsCountSpan.style.display = 'none';
    }
}

export function renderNotifications() {
    if (!window.notificationsList) return;

    window.notificationsList.innerHTML = '';

    if (allNotifications.length === 0) {
        window.notificationsList.innerHTML = `<p>${getTranslation('no_current_notifications')}</p>`;
        return;
    }

    const sortedNotifications = [...allNotifications].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    sortedNotifications.forEach(notif => {
        const notifItem = document.createElement('div');
        notifItem.classList.add('notification-item');

        const isRead = gameState.userNotifications.readNotificationsIds[notif.id];
        if (!isRead) {
            notifItem.classList.add('unread');
        }

        const date = new Date(notif.timestamp);
        const formattedDate = date.toLocaleDateString(gameState.currentLanguage === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        const formattedTime = date.toLocaleTimeString(gameState.currentLanguage === 'ar' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });

        notifItem.innerHTML = `
            <h3>${notif.title}</h3>
            <p>${notif.message}</p>
            <div class="timestamp">${formattedDate} ${formattedTime}</div>
        `;

        if (notif.type === 'gift' && notif.rewardAmount && !gameState.userNotifications.readNotificationsIds[notif.id + "_claimed"]) {
             const rewardButton = document.createElement('button');
             rewardButton.classList.add('reward-button');
             rewardButton.textContent = getTranslation('claim_reward_button');
             rewardButton.onclick = (e) => {
                 e.stopPropagation();
                 claimReward(notif.id, notif.rewardAmount);
             };
             notifItem.appendChild(rewardButton);
        }

        notifItem.addEventListener('click', () => {
            if (!isRead) {
                markNotificationAsRead(notif.id);
                notifItem.classList.remove('unread');
                updateUnreadCount();
            }
        });

        window.notificationsList.appendChild(notifItem);
    });
}

export async function markNotificationAsRead(notificationId) {
    const currentUserId = gameState.playerID;
    if (currentUserId) {
        gameState.userNotifications.readNotificationsIds[notificationId] = true;
        set(ref(database, `players/${currentUserId}/userNotifications/readNotificationsIds`), gameState.userNotifications.readNotificationsIds); // تحديث Firebase
        saveGame();
    }
}

export async function claimReward(notificationId, amount) {
    const currentUserId = gameState.playerID;
    if (!currentUserId) {
        showMessage('login_required_for_reward', 'error');
        return;
    }

    if (gameState.userNotifications.readNotificationsIds[notificationId + "_claimed"]) {
        showMessage('reward_already_claimed', 'info');
        return;
    }

    try {
        const userGoldRef = ref(database, `players/${currentUserId}/gold`);
        const snapshot = await get(userGoldRef);
        const currentGold = snapshot.val() || 0;
        await set(userGoldRef, currentGold + amount);

        gameState.userNotifications.readNotificationsIds[notificationId + "_claimed"] = true;
        saveGame();

        showMessage('reward_claimed_success', 'success', { amount: amount });
        updateGoldDisplay(currentGold + amount);
        renderNotifications();
        playSound('buy');

    } catch (error) {
        console.error("Error claiming reward:", error);
        showMessage('error_claiming_reward', 'error');
    }
}
