/* ======================================================
   MODAL VERBS ADVENTURE — game.js
   Boots Phaser, declares the global game-state enum, and
   implements every screen needed for this stage:
     BOOT -> MAIN_MENU -> LEVEL_SELECT / CHARACTER_SELECT /
             HOW_TO_PLAY / SETTINGS -> (PLAYING placeholder)

   The actual endless-runner gameplay (PLAYING / QUESTION /
   LEVEL_COMPLETED / GAME_OVER / VICTORY mechanics) is built
   out in Part 2. For now "Play" on an unlocked level opens
   a real, working placeholder scene so no button is fake.
   ====================================================== */

/* ---------- Global state enum (kept for the whole project) ---------- */
window.GAME_STATE = Object.freeze({
  MAIN_MENU: "MAIN_MENU",
  LEVEL_SELECT: "LEVEL_SELECT",
  CHARACTER_SELECT: "CHARACTER_SELECT",
  HOW_TO_PLAY: "HOW_TO_PLAY",
  SETTINGS: "SETTINGS",
  PLAYING: "PLAYING",
  QUESTION: "QUESTION",
  PAUSED: "PAUSED",
  LEVEL_COMPLETED: "LEVEL_COMPLETED",
  GAME_OVER: "GAME_OVER",
  VICTORY: "VICTORY"
});

const CONFIG = {
  WIDTH: 960,
  HEIGHT: 540,
  COLORS: {
    skyTop: 0x5ec8ff,
    skyBottom: 0xbdf0ff,
    turquoise: 0x1fd1c9,
    grass: 0x4ecb52,
    yellow: 0xffd93d,
    white: 0xffffff,
    dark: 0x273043
  }
};

/* ======================================================
   Shared helpers — reused by several scenes so the whole
   game keeps one consistent colorful 2.5D cartoon look.
   ====================================================== */

/** Draws the layered adventure-park world: sky, turquoise
 *  horizon band, three-lane road, grass, trees, cartoon
 *  buildings, fence, street lamps, floating coins and a
 *  signboard. Pure vector art — no external assets needed. */
function drawWorldBackground(scene) {
  const { WIDTH, HEIGHT, COLORS } = CONFIG;
  const g = scene.add.graphics();

  // Sky gradient (two bands approximate a gradient cheaply)
  g.fillStyle(COLORS.skyTop, 1);
  g.fillRect(0, 0, WIDTH, HEIGHT * 0.45);
  g.fillStyle(COLORS.skyBottom, 1);
  g.fillRect(0, HEIGHT * 0.45, WIDTH, HEIGHT * 0.15);

  // Distant cartoon buildings
  const buildingColors = [0xffe6a7, 0xffd1dc, 0xc9f2ff];
  for (let i = 0; i < 6; i++) {
    const bw = 70;
    const bh = 90 + (i % 3) * 25;
    g.fillStyle(buildingColors[i % buildingColors.length], 1);
    g.fillRoundedRect(i * 160 + 20, HEIGHT * 0.45 - bh + 30, bw, bh, 8);
  }

  // Turquoise horizon strip (park pathway edge)
  g.fillStyle(COLORS.turquoise, 1);
  g.fillRect(0, HEIGHT * 0.55, WIDTH, 18);

  // Grass
  g.fillStyle(COLORS.grass, 1);
  g.fillRect(0, HEIGHT * 0.58, WIDTH, HEIGHT * 0.42);

  // Three-lane road
  g.fillStyle(0xd9d2c7, 1);
  g.fillRect(WIDTH * 0.2, HEIGHT * 0.6, WIDTH * 0.6, HEIGHT * 0.4);
  g.lineStyle(4, 0xffffff, 0.8);
  g.beginPath();
  g.moveTo(WIDTH * 0.4, HEIGHT * 0.6);
  g.lineTo(WIDTH * 0.4, HEIGHT);
  g.moveTo(WIDTH * 0.6, HEIGHT * 0.6);
  g.lineTo(WIDTH * 0.6, HEIGHT);
  g.strokePath();

  // Fence along the road
  g.fillStyle(COLORS.white, 1);
  for (let x = 10; x < WIDTH * 0.2; x += 22) {
    g.fillRect(x, HEIGHT * 0.62, 6, 26);
  }
  for (let x = WIDTH * 0.82; x < WIDTH - 10; x += 22) {
    g.fillRect(x, HEIGHT * 0.62, 6, 26);
  }

  // Trees (rounded canopy + trunk)
  const treeXs = [40, 110, WIDTH - 60, WIDTH - 130];
  treeXs.forEach((x) => {
    g.fillStyle(0x7a5230, 1);
    g.fillRect(x - 5, HEIGHT * 0.5, 10, 30);
    g.fillStyle(0x2fae4e, 1);
    g.fillCircle(x, HEIGHT * 0.48, 26);
  });

  // Street lamps
  [WIDTH * 0.1, WIDTH * 0.9].forEach((x) => {
    g.fillStyle(0x444444, 1);
    g.fillRect(x - 3, HEIGHT * 0.5, 6, 60);
    g.fillStyle(COLORS.yellow, 1);
    g.fillCircle(x, HEIGHT * 0.49, 8);
  });

  // Floating coins (purely decorative here)
  const coinPositions = [
    [WIDTH * 0.35, HEIGHT * 0.3],
    [WIDTH * 0.5, HEIGHT * 0.25],
    [WIDTH * 0.65, HEIGHT * 0.3]
  ];
  coinPositions.forEach(([cx, cy]) => {
    g.fillStyle(COLORS.yellow, 1);
    g.fillCircle(cx, cy, 9);
    g.lineStyle(2, 0xd9a300, 1);
    g.strokeCircle(cx, cy, 9);
  });

  return g;
}

/** Draws a rounded, drop-shadowed UI panel and returns the Graphics object. */
function drawPanel(scene, x, y, w, h, color = 0xffffff, alpha = 0.95) {
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.15);
  g.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 6, w, h, 18);
  g.fillStyle(color, alpha);
  g.fillRoundedRect(x - w / 2, y - h / 2, w, h, 18);
  return g;
}

/** Creates a clickable rounded button with label + hover/press feedback. */
function createButton(scene, x, y, w, h, label, onClick, baseColor = CONFIG.COLORS.turquoise) {
  const container = scene.add.container(x, y);

  const bg = scene.add.graphics();
  const drawBg = (color) => {
    bg.clear();
    bg.fillStyle(0x000000, 0.18);
    bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, h / 2);
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  };
  drawBg(baseColor);

  const text = scene.add.text(0, 0, label, {
    fontFamily: "Verdana, sans-serif",
    fontSize: "22px",
    fontStyle: "bold",
    color: "#ffffff"
  }).setOrigin(0.5);

  container.add([bg, text]);
  container.setSize(w, h);
  container.setInteractive({ useHandCursor: true });

  container.on("pointerover", () => drawBg(Phaser.Display.Color.GetColor32(
    Math.min(255, ((baseColor >> 16) & 0xff) + 25),
    Math.min(255, ((baseColor >> 8) & 0xff) + 25),
    Math.min(255, (baseColor & 0xff) + 25),
    255
  ) >>> 0 & 0xffffff));
  container.on("pointerout", () => drawBg(baseColor));
  container.on("pointerdown", () => {
    container.setScale(0.95);
    AudioManager.playSfx("sfx_click");
  });
  container.on("pointerup", () => {
    container.setScale(1);
    if (onClick) onClick();
  });

  return container;
}

/** Simple animated cloud + coin sparkle layer used on the menu. */
function addFloatingDecorations(scene) {
  for (let i = 0; i < 4; i++) {
    const cloud = scene.add.ellipse(
      Phaser.Math.Between(50, CONFIG.WIDTH - 50),
      Phaser.Math.Between(30, 140),
      70, 30, 0xffffff, 0.9
    );
    scene.tweens.add({
      targets: cloud,
      x: cloud.x + Phaser.Math.Between(150, 300),
      duration: Phaser.Math.Between(9000, 15000),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }
}

/* ======================================================
   BOOT SCENE
   ====================================================== */
class BootScene extends Phaser.Scene {
  constructor() { super("BootScene"); }

  preload() {
    // Custom PNG / sprite-sheet characters declared in character.js (Part 2).
    CharacterManager.preload(this);
    if (window.BackgroundManager) window.BackgroundManager.preload(this);
    // Real asset loading goes here once art/audio files exist in /assets.
    // Kept intentionally empty for the foundation stage — the game draws
    // everything procedurally so it is fully playable without art yet.
  }

  create() {
    AudioManager.attach(this);
    this.scene.start("MainMenuScene");
  }
}

/* ======================================================
   MAIN MENU SCENE
   ====================================================== */
class MainMenuScene extends Phaser.Scene {
  constructor() { super("MainMenuScene"); }

  create() {
    AudioManager.attach(this);
    AudioManager.playMusic("bgm_menu");

    drawWorldBackground(this);
    addFloatingDecorations(this);

    // Title
    this.add.text(CONFIG.WIDTH / 2, 90, "MODAL VERBS ADVENTURE", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "40px",
      fontStyle: "bold",
      color: "#273043",
      stroke: "#ffffff",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(CONFIG.WIDTH / 2, 132, "RUN, LEARN & MASTER ENGLISH!", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "18px",
      fontStyle: "bold",
      color: "#ff6f6f"
    }).setOrigin(0.5);

    // Default animated character preview
    const charG = CharacterManager.drawPlaceholder(
      this, CONFIG.WIDTH / 2, 330,
      CharacterManager.getById(CharacterManager.getSelectedId()),
      1.3
    );
    this.tweens.add({
      targets: charG,
      y: charG.y - 10,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });

    // Saved stats (LocalStorage): highest score + total coins
    const sv = LevelManager.getStats();
    drawPanel(this, 130, 40, 230, 56, 0xffffff, 0.85);
    this.add.text(130, 28, `HIGH SCORE  ${sv.highestScore}`, {
      fontFamily: "Verdana, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#273043"
    }).setOrigin(0.5);
    this.add.circle(58, 52, 8, 0xffd93d).setStrokeStyle(2, 0xd9a300);
    this.add.text(72, 52, `COINS  ${sv.totalCoins}`, {
      fontFamily: "Verdana, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#b8860b"
    }).setOrigin(0, 0.5);

    // Menu buttons
    const buttonData = [
      ["PLAY GAME", () => this.scene.start("LevelSelectScene")],
      ["CHARACTER", () => this.scene.start("CharacterSelectScene")],
      ["HOW TO PLAY", () => this.scene.start("HowToPlayScene")],
      ["SETTINGS", () => this.scene.start("SettingsScene")]
    ];

    buttonData.forEach(([label, cb], i) => {
      createButton(this, CONFIG.WIDTH / 2, 400 + i * 56, 240, 44, label, cb);
    });
  }
}

/* ======================================================
   LEVEL SELECT SCENE
   ====================================================== */
class LevelSelectScene extends Phaser.Scene {
  constructor() { super("LevelSelectScene"); }

  create() {
    AudioManager.attach(this);
    drawWorldBackground(this);

    this.add.text(CONFIG.WIDTH / 2, 36, "SELECT LEVEL", {
      fontFamily: "Verdana, sans-serif",
      fontSize: "30px",
      fontStyle: "bold",
      color: "#273043",
      stroke: "#ffffff",
      strokeThickness: 5
    }).setOrigin(0.5);

    const levels = LevelManager.getAll();
    const cardW = 170, cardH = 250, gap = 18;
    const totalW = levels.length * cardW + (levels.length - 1) * gap;
    const startX = (CONFIG.WIDTH - totalW) / 2 + cardW / 2;
    const y = 290;

    const sv = LevelManager.getStats();
    this.add.text(CONFIG.WIDTH / 2, 74, `High Score: ${sv.highestScore}     Coins: ${sv.totalCoins}`, {
      fontFamily: "Verdana, sans-serif", fontSize: "16px", fontStyle: "bold", color: "#273043", stroke: "#ffffff", strokeThickness: 4
    }).setOrigin(0.5);

    levels.forEach((lvl, i) => {
      const x = startX + i * (cardW + gap);
      this.createLevelCard(x, y, cardW, cardH, lvl);
    });

    createButton(this, 80, CONFIG.HEIGHT - 36, 120, 44, "BACK",
      () => this.scene.start("MainMenuScene"), 0xff6f6f);
  }

  createLevelCard(x, y, w, h, lvl) {
    drawPanel(this, x, y, w, h, 0xffffff);
    const f = (size, color, bold) => ({
      fontFamily: "Verdana, sans-serif", fontSize: size + "px", fontStyle: bold ? "bold" : "normal", color
    });

    // Environment swatch with the environment name
    const swatch = this.add.graphics();
    swatch.fillStyle(lvl.themeColor, 1);
    swatch.fillRoundedRect(x - w / 2 + 12, y - h / 2 + 12, w - 24, 70, 10);
    this.add.text(x, y - h / 2 + 47, lvl.environment, {
      ...f(13, "#ffffff", true), stroke: "#273043", strokeThickness: 4, align: "center", wordWrap: { width: w - 40 }
    }).setOrigin(0.5);

    this.add.text(x, y - 24, `LEVEL ${lvl.number}`, f(13, "#888888")).setOrigin(0.5);
    this.add.text(x, y + 2, lvl.name, { ...f(16, "#273043", true), align: "center", wordWrap: { width: w - 20 } }).setOrigin(0.5);
    this.add.text(x, y + 38, `${lvl.distance} m  ·  ${lvl.checkpoints} questions`, f(12, "#555555")).setOrigin(0.5);

    let status;
    if (lvl.completed) status = [`Best score: ${lvl.bestScore}`, "#2a9d3a"];
    else if (lvl.unlocked && lvl.bestProgress > 0) status = [`Progress: ${lvl.bestProgress}%`, "#1f9d9a"];
    else status = [lvl.unlocked ? "Not played yet" : "Finish the previous level", "#888888"];
    this.add.text(x, y + 56, status[0], f(12, status[1], lvl.completed)).setOrigin(0.5);

    if (lvl.unlocked) {
      createButton(this, x, y + h / 2 - 26, w - 30, 36, lvl.completed ? "PLAY AGAIN" : "PLAY",
        () => this.scene.start("GameScene", { levelKey: lvl.key }),
        0x4ecb52);
    } else {
      const lockBg = this.add.graphics();
      lockBg.fillStyle(0x888888, 0.85);
      lockBg.fillRoundedRect(x - (w - 30) / 2, y + h / 2 - 26 - 18, w - 30, 36, 18);
      this.add.text(x, y + h / 2 - 26, "🔒 LOCKED", f(15, "#ffffff", true)).setOrigin(0.5);
    }
  }
}

/* ======================================================
   CHARACTER SELECT SCENE
   ====================================================== */
class CharacterSelectScene extends Phaser.Scene {
  constructor() { super("CharacterSelectScene"); }

  create() {
    AudioManager.attach(this);
    drawWorldBackground(this);

    this.add.text(CONFIG.WIDTH / 2, 36, "CHOOSE YOUR CHARACTER", {
      fontFamily: "Verdana, sans-serif", fontSize: "26px", fontStyle: "bold",
      color: "#273043", stroke: "#ffffff", strokeThickness: 5
    }).setOrigin(0.5);

    createButton(this, CONFIG.WIDTH - 145, 78, 230, 40, "CUSTOMIZE / UPLOAD",
      () => { if(window.openMvaCustomizer) window.openMvaCustomizer("characters"); }, 0x1fd1c9);
    const chars = window.CHARACTERS.filter(c => !c.id.startsWith("custom_"));
    const cardW = 230, gap = 24;
    const totalW = chars.length * cardW + (chars.length - 1) * gap;
    const startX = (CONFIG.WIDTH - totalW) / 2 + cardW / 2;
    const y = 300;

    chars.forEach((c, i) => {
      const x = startX + i * (cardW + gap);
      drawPanel(this, x, y, cardW, 280, 0xffffff);

      const isSelected = c.id === CharacterManager.getSelectedId();
      if (isSelected) {
        const ring = this.add.graphics();
        ring.lineStyle(5, CONFIG.COLORS.yellow, 1);
        ring.strokeRoundedRect(x - cardW / 2 - 4, y - 280 / 2 - 4, cardW + 8, 280 + 8, 20);
      }

      CharacterManager.drawPlaceholder(this, x, y - 40, c, 1.3);

      this.add.text(x, y + 60, c.name, {
        fontFamily: "Verdana, sans-serif", fontSize: "16px", fontStyle: "bold", color: "#273043",
        align: "center", wordWrap: { width: cardW - 20 }
      }).setOrigin(0.5);

      this.add.text(x, y + 92, c.description, {
        fontFamily: "Verdana, sans-serif", fontSize: "12px", color: "#555555",
        align: "center", wordWrap: { width: cardW - 24 }
      }).setOrigin(0.5);

      if (c.unlocked) {
        createButton(this, x, y + 128, cardW - 40, 36,
          isSelected ? "SELECTED" : "CHOOSE",
          () => { CharacterManager.setSelectedId(c.id); this.scene.restart(); },
          isSelected ? 0xffd93d : 0x1fd1c9);
      } else {
        const lockBg = this.add.graphics();
        lockBg.fillStyle(0x888888, 0.85);
        lockBg.fillRoundedRect(x - (cardW - 40) / 2, y + 128 - 18, cardW - 40, 36, 18);
        this.add.text(x, y + 128, "🔒 LOCKED", {
          fontFamily: "Verdana, sans-serif", fontSize: "14px", fontStyle: "bold", color: "#ffffff"
        }).setOrigin(0.5);
      }
    });

    createButton(this, 80, CONFIG.HEIGHT - 36, 120, 44, "BACK",
      () => this.scene.start("MainMenuScene"), 0xff6f6f);
  }
}

/* ======================================================
   HOW TO PLAY SCENE
   ====================================================== */
class HowToPlayScene extends Phaser.Scene {
  constructor() { super("HowToPlayScene"); }

  create() {
    AudioManager.attach(this);
    drawWorldBackground(this);
    drawPanel(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 10, 820, 440, 0xffffff, 0.96);

    this.add.text(CONFIG.WIDTH / 2, 70, "HOW TO PLAY", {
      fontFamily: "Verdana, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#273043"
    }).setOrigin(0.5);

    const controlsText =
      "KEYBOARD CONTROLS\n" +
      "←  Move Left        →  Move Right\n" +
      "↑  Jump              ↓  Slide\n" +
      "SPACE  Pause / Resume\n" +
      "A B C D or 1 2 3 4  Answer a question\n\n" +
      "MOBILE CONTROLS\n" +
      "◀ Left   ▶ Right   ▲ Jump   ▼ Slide";

    this.add.text(CONFIG.WIDTH / 2 - 190, 150, controlsText, {
      fontFamily: "Verdana, sans-serif", fontSize: "15px", color: "#273043", align: "left",
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    const goalsText =
      "GOALS\n" +
      "• Avoid obstacles on the track\n" +
      "• Collect coins as you run\n" +
      "• Touch a QUESTION board to get a question\n" +
      "• Right answer: +100 score and +1 coin\n" +
      "• Wrong answer: you lose 1 life\n" +
      "• Reach the finish line to win the level\n" +
      "• Complete all five levels";

    this.add.text(CONFIG.WIDTH / 2 + 190, 150, goalsText, {
      fontFamily: "Verdana, sans-serif", fontSize: "15px", color: "#273043", align: "left",
      lineSpacing: 6
    }).setOrigin(0.5, 0);

    createButton(this, 80, CONFIG.HEIGHT - 36, 120, 44, "BACK",
      () => this.scene.start("MainMenuScene"), 0xff6f6f);
  }
}

/* ======================================================
   SETTINGS SCENE (audio settings)
   ====================================================== */
class SettingsScene extends Phaser.Scene {
  constructor() { super("SettingsScene"); }

  create() {
    AudioManager.attach(this);
    drawWorldBackground(this);
    drawPanel(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2, 620, 340, 0xffffff, 0.96);

    this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 - 140, "SETTINGS", {
      fontFamily: "Verdana, sans-serif", fontSize: "28px", fontStyle: "bold", color: "#273043"
    }).setOrigin(0.5);

    const settings = AudioManager.getSettings();

    this.createSlider("MUSIC VOLUME", CONFIG.HEIGHT / 2 - 60, settings.musicVolume,
      (v) => AudioManager.setMusicVolume(v));

    this.createSlider("SFX VOLUME", CONFIG.HEIGHT / 2 + 0, settings.sfxVolume,
      (v) => AudioManager.setSfxVolume(v));

    let muted = settings.muted;
    const muteBtn = createButton(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 70, 200, 42,
      muted ? "UNMUTE 🔇" : "MUTE 🔊",
      () => {
        muted = !muted;
        AudioManager.setMuted(muted);
        muteBtn.list[1].setText(muted ? "UNMUTE 🔇" : "MUTE 🔊");
      }, 0xffd93d);

    createButton(this, CONFIG.WIDTH / 2, CONFIG.HEIGHT / 2 + 132, 260, 38, "AUDIO UPLOADS / ADVANCED",
      () => { if(window.openMvaCustomizer) window.openMvaCustomizer("audio"); }, 0x1fd1c9);
    createButton(this, 80, CONFIG.HEIGHT - 36, 120, 44, "BACK",
      () => this.scene.start("MainMenuScene"), 0xff6f6f);
  }

  createSlider(label, y, initial, onChange) {
    const trackW = 380;
    const x = CONFIG.WIDTH / 2;

    this.add.text(x, y - 26, label, {
      fontFamily: "Verdana, sans-serif", fontSize: "15px", fontStyle: "bold", color: "#273043"
    }).setOrigin(0.5);

    const track = this.add.rectangle(x, y, trackW, 10, 0xdddddd).setOrigin(0.5);
    const fill = this.add.rectangle(x - trackW / 2, y, trackW * initial, 10, CONFIG.COLORS.turquoise)
      .setOrigin(0, 0.5);
    const handle = this.add.circle(x - trackW / 2 + trackW * initial, y, 13, 0xffffff)
      .setStrokeStyle(3, CONFIG.COLORS.turquoise)
      .setInteractive({ draggable: true, useHandCursor: true });

    this.input.setDraggable(handle);
    handle.on("drag", (pointer, dragX) => {
      const clamped = Phaser.Math.Clamp(dragX, x - trackW / 2, x + trackW / 2);
      handle.x = clamped;
      const value = (clamped - (x - trackW / 2)) / trackW;
      fill.width = trackW * value;
      onChange(value);
    });
  }
}

/* ======================================================
   GAMEPLAY PLACEHOLDER SCENE
   This is where the actual Subway-Surfers-style endless
   runner (lanes, obstacles, coins, jump boards, question
   gates) will be built in Part 2. For now it confirms the
   level loaded correctly, shows the lane track, and wires
   up the keyboard + mobile controls so Part 2 can plug
   straight into them.
   ====================================================== */
class GameplayPlaceholderScene extends Phaser.Scene {
  constructor() { super("GameplayPlaceholderScene"); }

  init(data) {
    this.levelKey = (data && data.levelKey) || "level1";
  }

  create() {
    AudioManager.attach(this);
    AudioManager.stopMusic();

    const levelData = window.LEVELS.find((l) => l.key === this.levelKey);
    drawWorldBackground(this);

    drawPanel(this, CONFIG.WIDTH / 2, 90, 600, 110, 0xffffff, 0.95);
    this.add.text(CONFIG.WIDTH / 2, 70,
      `LEVEL ${levelData.number}: ${levelData.name}`, {
        fontFamily: "Verdana, sans-serif", fontSize: "22px", fontStyle: "bold", color: "#273043"
      }).setOrigin(0.5);
    this.add.text(CONFIG.WIDTH / 2, 102,
      `Environment: ${levelData.environment}  |  Target Score: ${levelData.targetScore}`, {
        fontFamily: "Verdana, sans-serif", fontSize: "14px", color: "#555555"
      }).setOrigin(0.5);

    this.statusText = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 150,
      "Gameplay (running, obstacles, coins, questions) arrives in Part 2.\n" +
      "Controls below are already wired and ready.", {
        fontFamily: "Verdana, sans-serif", fontSize: "14px", color: "#273043",
        align: "center", lineSpacing: 6
      }).setOrigin(0.5);

    this.controlFeedback = this.add.text(CONFIG.WIDTH / 2, CONFIG.HEIGHT - 95, "", {
      fontFamily: "Verdana, sans-serif", fontSize: "16px", fontStyle: "bold", color: "#1fd1c9"
    }).setOrigin(0.5);

    // Keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on("keydown-LEFT", () => this.flashControl("◀ LEFT"));
    this.input.keyboard.on("keydown-RIGHT", () => this.flashControl("RIGHT ▶"));
    this.input.keyboard.on("keydown-UP", () => this.flashControl("▲ JUMP"));
    this.input.keyboard.on("keydown-DOWN", () => this.flashControl("▼ SLIDE"));
    this.input.keyboard.on("keydown-SPACE", () => this.togglePause());

    // Demo-complete button so the unlock chain is genuinely testable
    createButton(this, CONFIG.WIDTH / 2 - 130, CONFIG.HEIGHT - 36, 230, 44,
      "COMPLETE LEVEL (DEMO)",
      () => {
        LevelManager.completeLevel(this.levelKey, levelData.targetScore);
        this.scene.start("LevelSelectScene");
      }, 0x4ecb52);

    createButton(this, CONFIG.WIDTH / 2 + 130, CONFIG.HEIGHT - 36, 160, 44, "BACK",
      () => this.scene.start("LevelSelectScene"), 0xff6f6f);

    // Mobile on-screen controls
    this.setupMobileControls();

    this.paused = false;
  }

  flashControl(label) {
    if (this.paused) return;
    this.controlFeedback.setText(label);
    this.tweens.killTweensOf(this.controlFeedback);
    this.controlFeedback.setAlpha(1);
    this.tweens.add({ targets: this.controlFeedback, alpha: 0, delay: 400, duration: 400 });
  }

  togglePause() {
    this.paused = !this.paused;
    this.statusText.setText(this.paused
      ? "PAUSED — press SPACE to resume."
      : "Gameplay (running, obstacles, coins, questions) arrives in Part 2.\nControls below are already wired and ready.");
  }

  setupMobileControls() {
    const panel = document.getElementById("mobile-controls");
    const isTouch = ("ontouchstart" in window) || navigator.maxTouchPoints > 0;
    if (isTouch) panel.classList.remove("hidden");

    const bind = (id, label) => {
      const el = document.getElementById(id);
      const handler = (e) => { e.preventDefault(); this.flashControl(label); };
      el.addEventListener("touchstart", handler);
      el.addEventListener("mousedown", handler);
    };
    bind("btn-left", "◀ LEFT");
    bind("btn-right", "RIGHT ▶");
    bind("btn-jump", "▲ JUMP");
    bind("btn-slide", "▼ SLIDE");

    // Hide the overlay again when this scene shuts down.
    this.events.once("shutdown", () => panel.classList.add("hidden"));
  }
}

/* ======================================================
   PHASER GAME CONFIG + BOOTSTRAP
   ====================================================== */
const phaserConfig = {
  type: Phaser.AUTO,
  width: CONFIG.WIDTH,
  height: CONFIG.HEIGHT,
  parent: "game-container",
  backgroundColor: "#5ec8ff",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [
    BootScene,
    MainMenuScene,
    LevelSelectScene,
    CharacterSelectScene,
    HowToPlayScene,
    SettingsScene,
    GameplayPlaceholderScene,
    GameScene,    // Part 2 + 3: endless-runner gameplay, questions, finish line (gameplay.js)
    VictoryScene  // Part 3: shown after all five levels are completed (victory.js)
  ]
};

window.addEventListener("load", async () => {
  try { if (window.MVAStore && window.MVAStore.ready) await window.MVAStore.ready; }
  catch (e) { console.warn("Custom character storage unavailable; using defaults.", e); }
  window.mvaGame = new Phaser.Game(phaserConfig);
  // Restore custom audio assets from IndexedDB.
  if (window.MVAStore) window.MVAStore.audioDefs.forEach(([, , key]) => AudioManager.restoreCustom(key));
});
