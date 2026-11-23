/* ======================================================
   MODAL VERBS ADVENTURE — level.js  (PART 3)
   Defines the 5 levels (environment, distance, difficulty)
   and manages everything that is saved in LocalStorage:
     - unlocked / completed levels, level progress (best %)
     - best score per level + the latest finished result
     - highest score and total coins
   ====================================================== */

window.LEVELS = [
  {
    key: "level1", number: 1, name: "CAN & COULD",
    environment: "Sunny Adventure Park",
    distance: 1000, checkpoints: 10, targetScore: 800,
    themeColor: 0x4ecb52,   // grass green
    topics: "Ability, permission, past ability, polite requests, possibility"
  },
  {
    key: "level2", number: 2, name: "MAY & MIGHT",
    environment: "Mystery Forest",
    distance: 1200, checkpoints: 10, targetScore: 850,
    themeColor: 0x1fa88f,   // forest teal
    topics: "Permission, possibility, weaker possibility"
  },
  {
    key: "level3", number: 3, name: "MUST & SHOULD",
    environment: "Learning City",
    distance: 1400, checkpoints: 10, targetScore: 900,
    themeColor: 0xffd93d,   // yellow
    topics: "Strong obligation, prohibition, advice, recommendations"
  },
  {
    key: "level4", number: 4, name: "WILL & WOULD",
    environment: "Sky Adventure World",
    distance: 1600, checkpoints: 10, targetScore: 950,
    themeColor: 0x6fb6ff,   // sky blue
    topics: "Future actions, polite requests, preferences, imaginary situations"
  },
  {
    key: "level5", number: 5, name: "MODAL VERBS MASTER",
    environment: "Ultimate Modal Kingdom",
    distance: 2000, checkpoints: 10, targetScore: 1000,
    themeColor: 0xa66bff,   // royal purple
    topics: "All modal verbs, basic / negative / question structure, important rules"
  }
];

window.LevelManager = (function () {
  const STORAGE_KEY = "mva_progress";   // per-level data (same key as Part 1/2)
  const STATS_KEY = "mva_stats";        // global data: highest score + total coins

  function defaultProgress() {
    const progress = {};
    window.LEVELS.forEach((lvl, i) => {
      progress[lvl.key] = {
        unlocked: i === 0,    // only level1 unlocked by default
        completed: false,
        bestScore: 0,
        bestProgress: 0,      // furthest point reached, 0-100 (%)
        lastResult: null      // { score, coins, correct, wrong, lives, time } of the latest finished run
      };
    });
    return progress;
  }

  function defaultStats() { return { highestScore: 0, totalCoins: 0, bestVictoryScore: 0 }; }

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback();
    } catch (e) {
      console.warn("LevelManager: could not read " + key + ", using defaults.", e);
      return fallback();
    }
  }

  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { console.warn("LevelManager: could not save " + key + ".", e); }
  }

  function loadProgress() {
    const parsed = read(STORAGE_KEY, defaultProgress);
    const merged = defaultProgress();   // merge so a changed LEVELS list never breaks old saves
    Object.keys(merged).forEach((key) => {
      if (parsed && parsed[key]) merged[key] = { ...merged[key], ...parsed[key] };
    });
    // safety: a completed level always unlocks the next one
    window.LEVELS.forEach((lvl, i) => {
      const next = window.LEVELS[i + 1];
      if (merged[lvl.key].completed && next) merged[next.key].unlocked = true;
    });
    return merged;
  }

  let progress = loadProgress();
  let stats = { ...defaultStats(), ...read(STATS_KEY, defaultStats) };

  const save = () => { write(STORAGE_KEY, progress); write(STATS_KEY, stats); };

  return {
    getAll() {
      return window.LEVELS.map((lvl) => ({ ...lvl, ...progress[lvl.key] }));
    },

    getStatus(levelKey) { return progress[levelKey]; },
    getStats() { return { ...stats }; },

    isUnlocked(levelKey) { return !!(progress[levelKey] && progress[levelKey].unlocked); },
    isCompleted(levelKey) { return !!(progress[levelKey] && progress[levelKey].completed); },
    allCompleted() { return window.LEVELS.every((l) => progress[l.key].completed); },

    /** Called when the finish line is reached. result = { score, coins, correct, wrong, lives, time }.
     *  Marks the level complete, keeps the best score and unlocks the NEXT level only. */
    completeLevel(levelKey, result) {
      if (!progress[levelKey]) return;
      const r = typeof result === "number" ? { score: result } : (result || {});
      const p = progress[levelKey];
      p.completed = true;
      p.bestScore = Math.max(p.bestScore, r.score || 0);
      p.bestProgress = 100;
      p.lastResult = {
        score: r.score || 0, coins: r.coins || 0, correct: r.correct || 0,
        wrong: r.wrong || 0, lives: r.lives || 0, time: r.time || 0
      };
      stats.highestScore = Math.max(stats.highestScore, r.score || 0);

      const idx = window.LEVELS.findIndex((l) => l.key === levelKey);
      const next = window.LEVELS[idx + 1];
      if (next) progress[next.key].unlocked = true;
      save();
    },

    /** Saves the furthest point reached (0-100) when a run ends, fails or is left. */
    recordProgress(levelKey, percent) {
      const p = progress[levelKey];
      if (!p) return;
      const v = Math.max(0, Math.min(100, Math.round(percent)));
      if (v > p.bestProgress) { p.bestProgress = v; save(); }
    },

    /** Also keeps a failed run's score as "highest score" if it is a new record. */
    recordScore(score) {
      if (score > stats.highestScore) { stats.highestScore = score; save(); }
    },

    addCoins(n) {
      if (!n || n < 0) return;
      stats.totalCoins += n;
      save();
    },

    /** Totals of the latest finished run of every level (used by the Victory screen). */
    getVictoryTotals() {
      const t = { score: 0, coins: 0, correct: 0, wrong: 0 };
      window.LEVELS.forEach((l) => {
        const r = progress[l.key].lastResult;
        if (r) { t.score += r.score; t.coins += r.coins; t.correct += r.correct; t.wrong += r.wrong; }
      });
      return t;
    },

    recordVictory(totalScore) {
      stats.bestVictoryScore = Math.max(stats.bestVictoryScore, totalScore);
      stats.highestScore = Math.max(stats.highestScore, totalScore);
      save();
    },

    /** Dev/debug helper — resets all progress back to level1-only. */
    resetProgress() {
      progress = defaultProgress();
      stats = defaultStats();
      save();
    }
  };
})();
