// ----------------------------------
// Enhanced Game Constants
// ----------------------------------
export const TUBE_CAPACITY = 4;
export const GOLD_PER_LEVEL = 200; // MODIFIED: Reduced gold per level (was 100)

// MODIFIED: Increased base cost and increment for buying a tube
export const BUY_TUBE_BASE_COST = 70; // Base cost for buying a tube (was 50)
export const BUY_TUBE_INCREMENT = 50; // Cost increases by this amount per extra tube (was 20)

// MODIFIED: Increased hint and undo costs for higher difficulty
export const HINT_COST = 40; // (was 50)
export const UNDO_COST_PER_MOVE = 55; // (was 15)

export const AES_KEY = 'bsm-secure-key-2024-secret'; // Changed key for Crypto-JS
export const SKIN_PRICES = { tube: 250, ball: 200 };
export const LOOT_BOX_REWARDS = [75, 150, 'SKIN', 'POWER_UP'];
export const colors = [
  '#FF6B6B',   // Rose Red - وردي دافئ وحيوي
  '#FFD93D',   // Sun Yellow - أصفر شمسي مشرق ومبهج
  '#6BCB77',   // Mint Green - أخضر نعناعي مريح ومنعش
  '#4D96FF',   // Soft Blue - أزرق ناعم يفتح النفس
  '#A100A1',   // Royal Violet - بنفسجي ملكي فخم
  '#FFB6C1',   // Baby Pink - وردي فاتح حالم
  '#FF885E',   // Tangerine Orange - برتقالي ناعم بلمسة طاقة
  '#8A9A5B',   // Olive Green - أخضر زيتوني عميق وأنيق
  '#FF4500',   // Orange Red - أحمر برتقالي مشتعل
  '#20B2AA',   // Light Sea Green - أخضر بحري فاتح
  '#9370DB',   // Medium Purple - بنفسجي متوسط ناعم
  '#00CED1',   // Dark Turquoise - تركواز داكن أنيق
  '#F08080',   // Light Coral - مرجاني فاتح دافئ
  '#32CD32',   // Lime Green - أخضر ليموني مشرق
  '#FFC0CB'    // Classic Pink - وردي كلاسيكي ناعم
];
