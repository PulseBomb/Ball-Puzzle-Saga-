import { TUBE_CAPACITY, colors } from './constants.js';
import { gameState, tubes, setTubes } from './gameState.js'; // تأكد من أن 'tubes' و 'setTubes' مُصدرة من gameState.js

// ----------------------------------
// Optimized Puzzle Solver
// ----------------------------------
export class PuzzleSolver { // ✅ تم إضافة 'export' هنا
  constructor(initialState, numColors) {
    this.initialState = JSON.parse(JSON.stringify(initialState));
    this.numColors = numColors;
    this.visited = new Set();
    this.queue = [];
  }

  hashState(state) {
    // هذه الدالة تقوم بإنشاء تمثيل فريد لحالة اللغز للمساعدة في تتبع الحالات التي تمت زيارتها.
    // يتم فرز الكرات داخل كل أنبوب، ثم فرز الأنابيب نفسها لضمان تجانس التجزئة بغض النظر عن الترتيب.
    // يتم التعامل مع الكرات المقفلة (isLocked) بشكل خاص لضمان تجزئة دقيقة.
    return JSON.stringify(state.map(tube => [...tube].map(ball => {
        // ✅ تأكد من أن ball دائمًا كائن قبل الوصول إلى color أو isLocked
        const ballColor = typeof ball === 'object' && ball !== null ? ball.color : ball;
        const isLocked = typeof ball === 'object' && ball !== null ? ball.isLocked : false;
        return { color: ballColor, isLocked: isLocked };
    }).sort((a, b) => {
        // تأكد من أنك تقارن خاصية اللون من الكائن
        if (a.color !== b.color) return a.color.localeCompare(b.color);
        return (a.isLocked === b.isLocked) ? 0 : (a.isLocked ? 1 : -1);
    })).sort((a, b) => {
        if (a.length !== b.length) return a.length - b.length;
        return JSON.stringify(a).localeCompare(JSON.stringify(b));
    }));
  }

  isSolved(state) {
    // تتحقق مما إذا كانت جميع الأنابيب ممتلئة بكرات من نفس اللون (ومحلولة).
    const totalBalls = state.flat().filter(ball => ball !== undefined).length;
    const expectedBalls = this.numColors * TUBE_CAPACITY;

    if (totalBalls !== expectedBalls) return false;

    const allTubesSorted = state.every(tube => tube.length === 0 || isTubeCompleted(tube));
    return allTubesSorted;
  }

  bfs() {
    // تنفيذ خوارزمية البحث بالعرض أولاً (BFS) لإيجاد حل للغز.
    // تبدأ من الحالة الأولية وتستكشف الحالات الممكنة حتى تجد حلاً.
    this.queue.push({ state: this.initialState, moves: [] });
    const solutions = [];
    let shortestSolutionLength = Infinity;
    const maxSolutionsToFind = 1; // البحث عن حل واحد فقط
    const maxStatesToExplore = 50000; // حد أقصى للحالات التي يمكن استكشافها لتجنب التكرار اللانهائي
    let statesExplored = 0;

    while (this.queue.length > 0 && solutions.length < maxSolutionsToFind && statesExplored < maxStatesToExplore) {
      const current = this.queue.shift(); // الحصول على الحالة الحالية
      const stateHash = this.hashState(current.state); // حساب الهاش للحالة الحالية

      if (current.moves.length >= shortestSolutionLength) {
        continue; // تخطي المسارات الأطول من الحلول الموجودة
      }

      if (this.visited.has(stateHash)) {
        continue; // تخطي الحالات التي تمت زيارتها بالفعل
      }
      this.visited.add(stateHash); // إضافة الحالة إلى قائمة الحالات التي تمت زيارتها
      statesExplored++;

      if (this.isSolved(current.state)) {
        solutions.push(current); // إذا تم حل اللغز، أضف الحل
        shortestSolutionLength = Math.min(shortestSolutionLength, current.moves.length);
        // تصفية طابور الانتظار لإزالة المسارات الأطول
        this.queue = this.queue.filter(item => item.moves.length < shortestSolutionLength);
        continue;
      }

      // الحصول على جميع الحركات الاستراتيجية الممكنة من الحالة الحالية وتطبيقها
      getStrategicMoves(current.state).forEach(move => {
        const newState = applyMove(current.state, move); // تطبيق الحركة
        const newHash = this.hashState(newState); // حساب الهاش للحالة الجديدة
        if (!this.visited.has(newHash)) { // إذا لم تتم زيارة الحالة الجديدة من قبل
            this.queue.push({
              state: newState,
              moves: [...current.moves, move] // إضافة الحركة إلى قائمة الحركات
            });
        }
      });
      // فرز طابور الانتظار حسب طول الحركات لتحسين كفاءة BFS (إيجاد أقصر حل أولاً)
      this.queue.sort((a, b) => a.moves.length - b.moves.length);
    }
    // إرجاع الحلول مرتبة حسب طول الحركات (الأقصر أولاً)
    return solutions.sort((a, b) => a.moves.length - b.moves.length);
  }
}

export function isValidMove(fromTube, toTube) {
  // تتحقق مما إذا كانت الحركة من أنبوب إلى آخر صالحة.
  if (fromTube.length === 0) return false; // لا يمكن نقل كرات من أنبوب فارغ
  if (toTube.length === TUBE_CAPACITY) return false; // لا يمكن النقل إلى أنبوب ممتلئ

  const topBallInFromTube = fromTube[fromTube.length - 1];
  // ✅ تأكد من الوصول إلى خاصية color
  const topColor = topBallInFromTube.color;

  // التحقق من الكرات المقفلة في الأنبوب المصدر
  for (let i = 0; i < fromTube.length - 1; i++) {
      // ✅ تأكد من الوصول إلى خاصية isLocked
      if (fromTube[i].isLocked) {
          return { valid: false, reason: 'tube_locked_error' }; // لا يمكن النقل إذا كانت هناك كرة مقفلة أسفل الكرة العلوية
      }
  }

  // التحقق من الكرة العلوية المقفلة
  // ✅ تأكد من الوصول إلى خاصية isLocked
  if (topBallInFromTube.isLocked && fromTube.length > 1) {
      return { valid: false, reason: 'ball_locked_error' }; // لا يمكن النقل إذا كانت الكرة العلوية مقفلة وكان الأنبوب يحتوي على أكثر من كرة واحدة
  }

  // ✅ تأكد من الوصول إلى خاصية color
  const toTubeTopColor = toTube.length > 0 ? toTube[toTube.length - 1].color : null;
  // الكرة العلوية في الأنبوب المصدر يجب أن تتطابق مع لون الكرة العلوية في الأنبوب الوجهة (أو يكون الأنبوب الوجهة فارغًا)
  const isColorMatch = toTube.length === 0 || toTubeTopColor === topColor;

  return { valid: isColorMatch, reason: null };
}

export function getStrategicMoves(state) {
    // توليد قائمة بالحركات الممكنة، مع إعطاء أولوية للحركات الاستراتيجية.
    const moves = [];
    for (let from = 0; from < state.length; from++) {
        const fromTube = state[from];
        if (fromTube.length === 0) continue;

        const topBallInFromTube = fromTube[fromTube.length - 1];
        // ✅ تأكد من الوصول إلى خاصية color
        const topColor = topBallInFromTube.color;

        for (let to = 0; to < state.length; to++) {
            if (from === to) continue; // لا يمكن النقل إلى نفس الأنبوب
            const toTube = state[to];

            const moveResult = isValidMove(fromTube, toTube);
            if (!moveResult.valid) {
                continue; // تخطي الحركات غير الصالحة
            }

            // تحديد أولوية الحركة:
            // 3: النقل إلى أنبوب فارغ (أولوية قصوى)
            // 2: النقل إلى أنبوب بنفس اللون (أولوية متوسطة)
            // 1: النقل إلى أنبوب مختلف اللون (أولوية دنيا)
            if (toTube.length === 0) {
                moves.push({ from: from, to: to, priority: 3 });
            } else if (toTube[toTube.length - 1].color === topColor && toTube.length < TUBE_CAPACITY) { // ✅ الوصول إلى خاصية color
                moves.push({ from: from, to: to, priority: 2 });
            } else {
                moves.push({ from: from, to: to, priority: 1 });
            }
        }
    }
    // فرز الحركات حسب الأولوية، ثم حسب الأنابيب (لضمان ترتيب ثابت)
    return moves.sort((a, b) => b.priority - a.priority || (a.from - b.from) || (a.to - b.to));
}

export function applyMove(state, move) {
  // تطبيق حركة على حالة اللغز وإنشاء حالة جديدة.
  const newState = JSON.parse(JSON.stringify(state)); // إنشاء نسخة عميقة من الحالة
  const ball = newState[move.from].pop(); // إزالة الكرة من الأنبوب المصدر
  if (ball !== undefined) {
    newState[move.to].push(ball); // إضافة الكرة إلى الأنبوب الوجهة
  }
  return newState;
}

export function isTubeCompleted(tube) {
  // تتحقق مما إذا كان الأنبوب قد اكتمل (ممتلئ بكرات من نفس اللون وليست مقفلة).
  if (tube.length !== TUBE_CAPACITY) return false; // يجب أن يكون الأنبوب ممتلئًا
  // ✅ تأكد من الوصول إلى خاصية color
  const firstBallColor = tube[0].color;
  // يجب أن تكون جميع الكرات بنفس اللون وليست مقفلة
  // ✅ تأكد من الوصول إلى خاصيتي color و isLocked
  return tube.every(ball => ball.color === firstBallColor && !ball.isLocked);
}

// ----------------------------------
// Enhanced Difficulty Scaling
// ----------------------------------
export function getLevelDifficulty(level) {
  let baseColors;
  // تحديد عدد الألوان بناءً على النطاقات المحددة
  if (level >= 1 && level <= 5) {
    baseColors = 4; // 4 ألوان من المستوى 1 إلى 5
  } else if (level >= 6 && level <= 10) {
    baseColors = 5; // 5 ألوان من المستوى 6 إلى 10
  } else if (level >= 11 && level <= 20) {
    baseColors = 7; // 7 ألوان من المستوى 11 إلى 20
  } else if (level >= 21 && level <= 30) {
    baseColors = 10; // 10 ألوان من المستوى 21 إلى 30
  } else if (level >= 31 && level <= 40) {
    baseColors = 12; // 12 لونًا من المستوى 31 إلى 40
  } else {
    baseColors = 15; // 15 لونًا من المستوى 41 فصاعدًا
  }

  let extraTubesCount;
  // تحديد عدد الأنابيب الإضافية (الفارغة)
  if (level <= 5) {
    extraTubesCount = 2; // أنابيب إضافية للمستويات المنخفضة (مساحة أكبر للمناورة)
  } else if (level >= 6 && level <= 15) {
    extraTubesCount = 1.5; // تقليل تدريجي
  } else if (level >= 16 && level <= 30) {
    extraTubesCount = 1; // أقل عدد في المستويات المتوسطة (مساحة محدودة)
  } else {
    extraTubesCount = 1; // تحدي أكبر: لا أنابيب إضافية فارغة
  }
  extraTubesCount = Math.max(0, Math.floor(extraTubesCount)); // التأكد من عدم انخفاض أقل من 0

  const shuffleMoves = Math.floor(80 + level * 10); 
  const lockedBallsCount = Math.min(Math.floor((level - 1) / 2) + 1, 10); 

  let difficultyModifier = 0;
  if (level > 40) {
    difficultyModifier = 0.3;
  } else if (level > 30) {
    difficultyModifier = 0.2;
  } else if (level > 20) {
    difficultyModifier = 0.1;
  }

  // خاصية جديدة: عدد الأنابيب المطلوب إكمالها للفوز
  let tubesToComplete;
  const totalColoredTubes = baseColors; // عدد الأنابيب التي تحتوي على ألوان (كل لون أنبوب)

  // هنا نحدد متى نطبق شرط "إكمال 5 أنابيب فقط"
  if (level >= 10 && level <= 30) { // كمثال: يمكن تفعيلها في نطاق معين من المستويات
    tubesToComplete = 5;
  } else if (level > 30 && totalColoredTubes > 5) { // في المستويات الأعلى جدًا، يمكن أن يكون العدد 5 أو أكثر بقليل
      tubesToComplete = Math.min(Math.floor(totalColoredTubes * 0.5), 5); // 50% من الأنابيب الملونة بحد أقصى 5
      // أو ببساطة: tubesToComplete = 5;
  }
  else {
    // في المستويات الأخرى، يكون الشرط هو إكمال كل الأنابيب الملونة
    tubesToComplete = totalColoredTubes;
  }
  // التأكد من أن الشرط لا يتجاوز العدد الفعلي للأنابيب الملونة
  tubesToComplete = Math.min(tubesToComplete, totalColoredTubes);

  return {
    colors: baseColors,
    extraTubes: extraTubesCount,
    shuffleMoves: shuffleMoves,
    lockedBallsCount: lockedBallsCount,
    difficultyModifier: difficultyModifier,
    tubesToComplete: tubesToComplete // إضافة الخاصية الجديدة هنا
  };
}


// ----------------------------------
// Advanced Puzzle Generation
// ----------------------------------
export function createSolvedState(numColors, totalTubes) {
  // إنشاء حالة لغز محلولة (أنابيب ممتلئة بألوانها).
  let solvedTubes = Array(totalTubes).fill().map(() => []);
  for (let i = 0; i < numColors; i++) {
    for (let j = 0; j < TUBE_CAPACITY; j++) {
      solvedTubes[i].push({ color: colors[i], isLocked: false });
    }
  }
  return solvedTubes;
}

export function generateSmartPuzzle(level) {
  // توليد لغز ذكي وقابل للحل للمستوى المحدد.
  const difficulty = getLevelDifficulty(level);
  const totalTubes = difficulty.colors + difficulty.extraTubes + gameState.extraTubes;

  // عرض رسالة التحميل
  if (window.loadingMessageEl) window.loadingMessageEl.classList.add('show');
  window.showMessage("loading_message");

  let validPuzzle = [];
  let attempts = 0;
  const maxAttempts = 200; // الحد الأقصى لمحاولات توليد لغز صالح

  while (attempts < maxAttempts) {
    const solved = createSolvedState(difficulty.colors, totalTubes); // إنشاء حالة محلولة
    let scrambled = enhancedShuffle(solved, difficulty.shuffleMoves); // خلط الحالة

    // إضافة الكرات المقفلة للمستويات الأعلى
    if (level >= 20) {
        const lockedBallsToAdd = Math.floor((level - 5) / 5) + 1; // عدد الكرات المقفلة
        scrambled = addLockedBalls(scrambled, Math.min(lockedBallsToAdd, 5)); // إضافة الكرات المقفلة بحد أقصى 5
    }

    // التحقق من صلاحية اللغز (قابل للحل وصعب بما فيه الكفاية)
    if (validatePuzzle(scrambled, difficulty.colors)) {
      validPuzzle = scrambled;
      break; // تم العثور على لغز صالح
    }
    attempts++;
  }

  // إخفاء رسالة التحميل
  if (window.loadingMessageEl) window.loadingMessageEl.classList.remove('show');

  if (validPuzzle.length > 0) {
    return validPuzzle;
  } else {
    // إذا لم يتم العثور على لغز صالح بعد أقصى عدد من المحاولات، يتم العودة إلى لغز أبسط.
    console.warn(`Could not generate a complex puzzle after ${maxAttempts} attempts for level ${level}. Falling back to a simpler puzzle.`);
    return createFallbackPuzzle(difficulty.colors, totalTubes);
  }
}

export function addLockedBalls(puzzleState, count) {
    // إضافة كرات مقفلة إلى اللغز.
    let newPuzzleState = JSON.parse(JSON.stringify(puzzleState));
    // البحث عن الأنابيب التي تحتوي على كرات يمكن قفلها (أكثر من كرة واحدة).
    let tubesWithBalls = newPuzzleState.map((tube, index) => ({ tube, index }))
                                        .filter(item => item.tube.length > 1);

    let lockedCount = 0;
    let attempts = 0;
    const maxLockAttempts = 50; // الحد الأقصى لمحاولات قفل الكرات

    while (lockedCount < count && attempts < maxLockAttempts) {
        if (tubesWithBalls.length === 0) break; // لا توجد أنابيب يمكن قفل كرات بها

        const randomTubeItem = tubesWithBalls[Math.floor(Math.random() * tubesWithBalls.length)];
        const tubeIndex = randomTubeItem.index;
        const tube = newPuzzleState[tubeIndex];

        // قفل الكرة السفلية في الأنبوب (إذا لم تكن مقفلة بالفعل)
        // ✅ هنا تأكدنا أن الكرة دائمًا كائن قبل تعديلها
        if (tube.length > 0 && !tube[0].isLocked) {
            // لا داعي للتحقق من typeof tube[0] === 'string' لأننا الآن نضمن أنها كائنات.
            tube[0].isLocked = true;
            lockedCount++;
            // إزالة الأنبوب من قائمة الأنابيب التي يمكن قفل كرات بها لتجنب قفل نفس الأنبوب
            tubesWithBalls = tubesWithBalls.filter(item => item.index !== tubeIndex);
        }
        attempts++;
    }
    return newPuzzleState;
}

export function enhancedShuffle(initialTubes, moves) {
  // خلط الأنابيب عن طريق تطبيق سلسلة من الحركات الصالحة.
  let state = JSON.parse(JSON.stringify(initialTubes));
  let history = []; // لتتبع الحركات الأخيرة وتجنب الحركات العكسية الفورية

  for (let i = 0; i < moves; i++) {
    const validMoves = getStrategicMoves(state); // الحصول على الحركات الصالحة

    // تصفية الحركات لتجنب التراجع الفوري عن الحركة السابقة
    const filteredMoves = validMoves.filter(m => {
      if (history.length > 0) {
        const lastMove = history[history.length - 1];
        return !(lastMove.from === m.to && lastMove.to === m.from);
      }
      return true;
    });

    let move;
    if (filteredMoves.length === 0) {
      if (validMoves.length === 0) break;
      move = validMoves[Math.floor(Math.random() * validMoves.length)]; // إذا لم توجد حركات مفلترة، اختر حركة عشوائية
    } else {
      move = filteredMoves[Math.floor(Math.random() * filteredMoves.length)]; // اختر حركة من الحركات المفلترة
    }

    state = applyMove(state, move); // تطبيق الحركة
    history.push(move);

    if (history.length > 1) {
      history.shift(); // الحفاظ على حركة واحدة فقط في التاريخ
    }
  }
  return state;
}

export function createFallbackPuzzle(numColors, totalTubes) {
  // إنشاء لغز بديل أبسط في حالة فشل توليد لغز ذكي.
  let fallbackTubes = Array(totalTubes).fill().map(() => []);
  let allBalls = [];

  // تعبئة جميع الكرات الممكنة
  for (let i = 0; i < numColors; i++) {
    for (let j = 0; j < TUBE_CAPACITY; j++) {
      // ✅ التغيير هنا: تأكد من إضافة الكرة ككائن { color, isLocked }
      allBalls.push({ color: colors[i], isLocked: false });
    }
  }
  shuffleArray(allBalls); // خلط الكرات عشوائياً

  // توزيع الكرات على الأنابيب
  let ballIndex = 0;
  for (let i = 0; i < totalTubes; i++) {
    while (fallbackTubes[i].length < TUBE_CAPACITY && ballIndex < allBalls.length) {
      fallbackTubes[i].push(allBalls[ballIndex++]);
    }
  }
  return fallbackTubes.map(tube => tube.filter(ball => ball !== undefined));
}

export function shuffleArray(array) {
  // خلط عناصر المصفوفة عشوائياً (خوارزمية فيشر-يتس).
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function validatePuzzle(state, numColors) {
  // التحقق من صلاحية اللغز (قابل للحل وعدد الأنابيب الفارغة لا يقل عن 1).
  const emptyTubesCount = state.filter(t => t.length === 0).length;
  // اللغز غير صالح إذا كان محلولاً بالفعل أو لا يحتوي على أنابيب فارغة كافية.
  if (state.every(tube => isTubeCompleted(tube)) || emptyTubesCount < 1) return false;

  // استخدام PuzzleSolver لحساب ما إذا كان اللغز قابل للحل وعدد الحركات المطلوب.
  const solver = new PuzzleSolver(state, numColors);
  const solutions = solver.bfs();

  // يجب أن يكون اللغز قابلاً للحل ويجب أن يتطلب عددًا كافيًا من الحركات (لضمان الصعوبة).
  const minExpectedMoves = Math.max(numColors * 5, 20); // حد أدنى متوقع للحركات
  return solutions.length > 0 && solutions[0].moves.length >= minExpectedMoves;
}

// puzzlelogic.js

// تأكد من استيراد 'gameState' و 'tubes' و 'isTubeCompleted'
// (يبدو أن 'tubes' و 'isTubeCompleted' موجودان بالفعل في نفس الملف أو تم استيرادهما)
//أكد من المسار الصحيح

// ... (بقية الكود الخاص بك في puzzlelogic.js مثل PuzzleSolver, isValidMove, etc.) ...


export function isLevelCompleted() {
    // 1. الحصول على إعدادات الصعوبة للمستوى الحالي من gameState
    const currentDifficulty = gameState.currentLevelDifficulty;

    // 2. التحقق مما إذا كانت إعدادات الصعوبة متاحة.
    // هذا مهم جداً لتجنب الأخطاء إذا لم يتم تحميل إعدادات المستوى بعد.
    if (!currentDifficulty) {
        console.warn("Difficulty settings (currentLevelDifficulty) not loaded in gameState.");
        // يمكن أن ترجع false أو تعود للسلوك القديم إذا لم تكن الإعدادات متاحة.
        // في هذه الحالة، نفضل العودة بـ false لتجنب الفوز غير المقصود.
        return false;
    }

    // 3. الحصول على عدد الأنابيب المطلوبة للفوز لهذا المستوى المحدد.
    const requiredTubesToWin = currentDifficulty.tubesToComplete;

    // 4. حساب عدد الأنابيب المكتملة حاليًا.
    let completedTubesCount = 0;
    // نمر على جميع الأنابيب (التي قد تحتوي على كرات أو تكون فارغة).
    for (const tube of tubes) {
        // isTubeCompleted تتحقق مما إذا كان الأنبوب ممتلئًا بكرات من نفس اللون وليست مقفلة.
        if (isTubeCompleted(tube)) {
            completedTubesCount++;
        }
    }

    // 5. التحقق من شرط الفوز الرئيسي:
    // هل عدد الأنابيب المكتملة يساوي أو يتجاوز العدد المطلوب للفوز؟
    const objectiveAchieved = completedTubesCount >= requiredTubesToWin;

    // 6. (اختياري) شرط الأنابيب الفارغة:
    // الشرط الأصلي كان emptyTubes.length >= 2.
    // ولكن نظرًا لأن extraTubesCount يمكن أن يكون 0 في المستويات العليا،
    // فإن شرط ">= 2" قد يكون مشكلة.
    // يمكننا استخدام عدد الأنابيب الإضافية من إعدادات الصعوبة كحد أدنى.
    // إذا كان extraTubesCount هو 0، فهذا يعني أنك لا تحتاج لأنابيب فارغة متبقية.
    const emptyTubes = tubes.filter(tube => tube.length === 0);
    const hasEnoughEmptyTubes = emptyTubes.length >= currentDifficulty.extraTubes;
    // إذا كانت extraTubesCount = 0، فـ hasEnoughEmptyTubes ستكون true دائماً (إذا كان لديك أي أنبوب فارغ)
    // أو إذا كنت تريد على الأقل أنبوب فارغ واحد لضمان إمكانية الحركة حتى النهاية، يمكن أن يكون:
    // const hasEnoughEmptyTubes = emptyTubes.length >= Math.max(1, currentDifficulty.extraTubes);


    // العودة بشرط الفوز النهائي.
    // إذا كان هدفك هو فقط إكمال عدد معين من الأنابيب (دون النظر لوضع الأنابيب الفارغة في النهاية)،
    // فاستخدم "return objectiveAchieved;".
    // إذا كنت لا تزال تريد شرطًا لوجود أنابيب فارغة كافية في النهاية، فاستخدم "return objectiveAchieved && hasEnoughEmptyTubes;".
    // بناءً على رغبتك في "إكمال 5 أنابيب فقط"، أميل إلى أن يكون الشرط هو 'objectiveAchieved' فقط.
    return objectiveAchieved;
}

export function highlightHint(fromIndex, toIndex) {
  // إبراز الأنابيب التي تشكل تلميحًا بصريًا للمستخدم.
  const fromTubeEl = window.tubesContainer.children[fromIndex];
  const toTubeEl = window.tubesContainer.children[toIndex];

  if (fromTubeEl) fromTubeEl.classList.add('hint-highlight-from');
  if (toTubeEl) toTubeEl.classList.add('hint-highlight-to');

  // إزالة التظليل بعد 2 ثانية
  setTimeout(() => {
    if (fromTubeEl) fromTubeEl.classList.remove('hint-highlight-from');
    if (toTubeEl) toTubeEl.classList.remove('hint-highlight-to');
  }, 2000);
}

// ... (بقية الكود الخاص بك في puzzlelogic.js) ...
