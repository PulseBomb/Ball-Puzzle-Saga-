// firebaseService.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
// ✅ هنا، نستورد الدوال الأساسية من Firebase SDK، بما في ذلك دوال الاستعلام
import {
    getDatabase,
    ref as firebaseRef, // إعادة تسمية ref لتجنب التضارب إذا كان هناك ref آخر
    set as firebaseSet, // إعادة تسمية set
    get as firebaseGet, // إعادة تسمية get
    update as firebaseUpdate, // إعادة تسمية update
    onValue as firebaseOnValue, // إعادة تسمية onValue
    // ✅ الدوال الجديدة التي تحتاجها للاستعلامات
    query,
    orderByChild,
    limitToLast
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// استيراد إعدادات Firebase الخاصة بك
import { firebaseConfig } from './firebaseConfig.js';

// تهيئة Firebase
const app = initializeApp(firebaseConfig);

// ✅ تصدير كائن قاعدة البيانات
export const database = getDatabase(app);

// ✅ إعادة تصدير الدوال الأساسية من Firebase SDK بالأسماء التي تريدها في باقي المشروع
// هذا يسمح لك باستخدامها مباشرة كـ `ref`, `set`, `get` بدلاً من `firebaseRef`, `firebaseSet` إلخ.
export const ref = firebaseRef;
export const set = firebaseSet;
export const get = firebaseGet;
export const update = firebaseUpdate;
export const onValue = firebaseOnValue;
export { query, orderByChild, limitToLast }; // تصدير دوال الاستعلام أيضًا

// ملاحظة: لقد قمت بتعليق الدوال التي ذكرت أنك نقلتها إلى utils.js.
// إذا كنت تستخدمها في utils.js، فلا داعي لوجودها هنا.
// إذا كنت تريدها هنا، قم بإلغاء التعليق.

/**
 * يجلب أفضل اللاعبين بناءً على المستوى.
 * @param {number} limit - عدد اللاعبين المراد جلبهم.
 * @returns {Promise<Array<Object>>} مصفوفة من كائنات اللاعبين.
 */
export async function getTopPlayers(limit = 10) {
  const db = getDatabase();
  const playersRef = ref(db, 'players');
  // استخدام دوال الاستعلام التي تم استيرادها الآن
  const topPlayersQuery = query(playersRef, orderByChild('level'), limitToLast(limit));
  try {
    const snapshot = await get(topPlayersQuery);
    if (snapshot.exists()) {
      const players = [];
      snapshot.forEach(childSnapshot => {
        const player = childSnapshot.val();
        player.id = childSnapshot.key; // إضافة ID اللاعب إلى الكائن
        players.push(player);
      });
      // يتم جلب البيانات بترتيب تصاعدي افتراضيًا عند استخدام limitToLast مع orderByChild.
      // لعكسها إلى ترتيب تنازلي (الأعلى مستوى أولاً)، نقوم بالفرز أو العكس يدوياً.
      // تأكد أن 'level' مخزن كرقم في Firebase.
      return players.sort((a, b) => b.level - a.level); // لترتيب تنازلي حسب المستوى
    } else {
      console.log("No players found in the database.");
      return [];
    }
  } catch (error) {
    console.error("Error fetching top players:", error);
    return [];
  }
}

/**
 * تتحقق وتوزع المكافآت الأسبوعية على أفضل اللاعبين.
 */
export async function checkAndAwardWeeklyRewards() {
  const now = Date.now();
  // السطر الذي سيتم تعديله:
  const threeDays = 3 * 24 * 60 * 60 * 1000; // 3 أيام بدل أسبوع

  const lastRewardRef = ref(getDatabase(), 'lastRewardTimestamp');
  const snapshot = await get(lastRewardRef);
  const lastRewardTimestamp = snapshot.val() || 0;

  // تغيير الشرط لاستخدام threeDays
  if (now - lastRewardTimestamp >= threeDays) {
    console.log('Distributing periodic rewards...'); // يمكنك تغيير الرسالة لتناسب التردد الجديد
    const topPlayers = await getTopPlayers(3);
    const rewards = [500, 300, 200];

    for (let i = 0; i < topPlayers.length; i++) {
      const player = topPlayers[i];
      if (rewards[i]) {
        const playerGoldRef = ref(getDatabase(), `players/${player.id}/gold`);
        const playerSnapshot = await get(playerGoldRef);
        const currentGold = playerSnapshot.val() || 0;
        await set(playerGoldRef, currentGold + rewards[i]);
        console.log(`Awarded ${rewards[i]} gold to player ${player.id} for rank ${i + 1}. New gold: ${currentGold + rewards[i]}`);
      }
    }
    await set(lastRewardRef, now);
    console.log('Periodic rewards distributed successfully.'); // يمكنك تغيير الرسالة
  } else {
    // console.log('Periodic rewards not due yet.'); // يمكنك إلغاء التعليق للتتبع
  }
}
