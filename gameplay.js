/* ======================================================
   MODAL VERBS ADVENTURE — gameplay.js  (PART 2 + PART 3)
   GameScene: the real 2.5D endless runner.

   2.5D projection: every object has a world distance `dist`
   ahead of the player. Scale s = FOCAL / (FOCAL + dist) shrinks
   things toward the horizon; screen y and x follow from s, so
   the road, obstacles, coins and scenery rush toward the player.

   PART 3 adds: 5 themed environments, per-level difficulty,
   10 question checkpoints per level (random, no repeats),
   scoring (+100 / +1 coin per correct answer, -1 life per wrong
   answer), distance + progress HUD, finish arch + celebration,
   LEVEL COMPLETED statistics and saving.
   ====================================================== */
(function () {
  "use strict";

  const FOCAL = 420, VIEW = 2600, GY = 455, HY = 235, LW = 165, CX = 480, W = 960, H = 540;
  const JUMP_V = 820, GRAV = 2300, SLIDE_DUR = 0.65, SLIDE_CD = 0.9;
  const INVUL = 1.6, HIT_DUR = 0.55, STAND_H = 92, SLIDE_H = 38;
  const UNITS_PER_M = 50;            // 50 world units = 1 meter
  const POINTS_CORRECT = 100, POINTS_COIN = 10;
  const clamp = Phaser.Math.Clamp;

  /* ---------------------------------------------------------------
     Visual theme per level (colors + which scenery props appear)
     --------------------------------------------------------------- */
  const THEMES = [
    { // 1 — Sunny Adventure Park
      grass: 0x4ecb52, grass2: 0x45bf49, road: 0xcfc8bd, skyTop: 0x4fc3ff, skyBot: 0xcdf4ff, tree: 0x2fae4e,
      lamp: 0xffd93d, curbA: 0xffffff, curbB: 0xff6f6f, dash: 0xffffff, haze: 0xcdf4ff, hazeA: 0.45,
      scenery: ["tree", "bush", "lamp", "balloon"]
    },
    { // 2 — Mystery Forest
      grass: 0x2e8f77, grass2: 0x277f6a, road: 0x9fb0a6, skyTop: 0x24305e, skyBot: 0x6fb3a8, tree: 0x1f7a63,
      lamp: 0x7ef2d0, curbA: 0x7ef2d0, curbB: 0x5b3f8a, dash: 0xdff8ef, haze: 0x9ee6d6, hazeA: 0.6,
      scenery: ["pine", "mushroom", "pine", "lamp"]
    },
    { // 3 — Learning City
      grass: 0xb7b9c6, grass2: 0xaaadbb, road: 0x6b6f7d, skyTop: 0xffd36b, skyBot: 0xfff1c4, tree: 0x5a9a2f,
      lamp: 0xffe9a0, curbA: 0xffd93d, curbB: 0x2b2f3a, dash: 0xffffff, haze: 0xfff1c4, hazeA: 0.4,
      buildings: [0xffe6a7, 0xffb3c1, 0x9fe0ff, 0xc8f2b0, 0xf4c2ff],
      scenery: ["building", "booksign", "lamp", "building"]
    },
    { // 4 — Sky Adventure World
      grass: 0xf5faff, grass2: 0xe2eefc, road: 0xffd9a8, skyTop: 0x5aa9ff, skyBot: 0xffe3f3, tree: 0x6dbb58,
      lamp: 0xffffff, curbA: 0xffffff, curbB: 0xff9ccf, dash: 0xffffff, haze: 0xffffff, hazeA: 0.55,
      scenery: ["cloudpile", "island", "balloon", "cloudpile"]
    },
    { // 5 — Ultimate Modal Kingdom
      grass: 0x3b2a78, grass2: 0x34246b, road: 0x7c5cc4, skyTop: 0x2a1458, skyBot: 0x9b6cf5, tree: 0x7a4fd0,
      lamp: 0xffd93d, curbA: 0xffd93d, curbB: 0x4a2d99, dash: 0xffd93d, haze: 0x9b6cf5, hazeA: 0.4,
      scenery: ["tower", "torch", "crystal", "banner"]
    }
  ];

  /* Side-of-road distance (min,max) for each scenery prop */
  const SCENERY_OFFSET = {
    building: [520, 640], tower: [520, 620], island: [430, 620], lamp: [300, 300], torch: [300, 300],
    booksign: [310, 340], pine: [330, 440], mushroom: [320, 400], cloudpile: [340, 440]
  };

  /* ---------------------------------------------------------------
     Difficulty per level
       speed   starting speed (units/s)      ramp   speed gain per second
       maxExtra maximum extra speed          types  obstacle types allowed
       gap     distance between obstacle rows (min,max)
       twoChance chance of 2 obstacles in a row
       allLanes jump/slide rows may span all lanes
       combo   chance of a second row right after the first (complex patterns)
     --------------------------------------------------------------- */
  const LEVEL_CFG = [
    { speed: 450, ramp: 3, maxExtra: 110, types: ["cone", "hurdle", "barrier"],                                   gap: [800, 1000], twoChance: 0,    allLanes: false, combo: 0 },
    { speed: 520, ramp: 4, maxExtra: 150, types: ["cone", "hurdle", "barrier", "barrel", "gap"],                   gap: [660, 860],  twoChance: 0.25, allLanes: true,  combo: 0 },
    { speed: 585, ramp: 5, maxExtra: 190, types: ["cone", "hurdle", "barrier", "barrel", "gap", "box", "mover"],   gap: [600, 800],  twoChance: 0.3,  allLanes: true,  combo: 0 },
    { speed: 655, ramp: 6, maxExtra: 220, types: ["cone", "hurdle", "barrier", "barrel", "gap", "box", "mover"],   gap: [560, 760],  twoChance: 0.4,  allLanes: true,  combo: 0.35 },
    { speed: 725, ramp: 6, maxExtra: 250, types: ["cone", "hurdle", "barrier", "barrel", "gap", "box", "mover"],   gap: [500, 680],  twoChance: 0.5,  allLanes: true,  combo: 0.5 }
  ];

  const proj = (z) => FOCAL / (FOCAL + z);
  const sy = (s) => HY + (GY - HY) * s;
  const txt = (scene, x, y, s, size, color, extra) =>
    scene.add.text(x, y, s, Object.assign({
      fontFamily: "Verdana, sans-serif", fontSize: size + "px", fontStyle: "bold", color
    }, extra || {}));
  const lerpC = (a, b, t) => {
    const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255, br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
    return (Math.round(ar + (br - ar) * t) << 16) | (Math.round(ag + (bg - ag) * t) << 8) | Math.round(ab + (bb - ab) * t);
  };
  const fmtTime = (sec) => {
    const s = Math.max(0, Math.round(sec));
    return String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");
  };

  class GameScene extends Phaser.Scene {
    constructor() { super("GameScene"); }

    init(data) { this.levelKey = (data && data.levelKey) || "level1"; }

    /* ---------------------------------------------------- setup */
    create() {
      AudioManager.attach(this);
      AudioManager.stopMusic();

      this.lv = window.LEVELS.find((l) => l.key === this.levelKey) || window.LEVELS[0];
      this.levelKey = this.lv.key;
      this.theme = THEMES[this.lv.number - 1] || THEMES[0];
      this.cfg = LEVEL_CFG[this.lv.number - 1] || LEVEL_CFG[0];

      // Fresh shuffled question bank every time the level starts or is retried.
      QuestionManager.reset(this.lv.number);

      this.gameState = GAME_STATE.PLAYING;
      this.t = 0; this.elapsed = 0; this.dist = 0; this.speed = 0;
      this.baseSpeed = this.cfg.speed;
      this.coinPickups = 0; this.bonusCoins = 0; this.banked = 0;
      this.correct = 0; this.wrong = 0; this.lives = 3;
      this.lane = 1; this.laneF = 1; this.camX = 0;
      this.h = 0; this.vy = 0; this.slideT = 0; this.slideCd = 0; this.hitT = 0; this.invul = 0;
      this.countdown = 1.4;
      this.qUI = null; this.answered = false; this.qKeyHandler = null;

      this.levelLen = this.lv.distance * UNITS_PER_M;
      const n = this.lv.checkpoints;
      this.boards = [];
      for (let i = 1; i <= n; i++) this.boards.push({ z: (this.levelLen * i) / (n + 1), no: i });
      this.nextBoard = 0;
      this.objs = []; this.free = {};
      this.nextRowZ = 900; this.nextSceneZ = 0; this.finishSpawned = false; this.lastFullZ = undefined;

      this.buildBackground();
      this.roadG = this.add.graphics().setDepth(1);
      this.shadow = this.add.ellipse(0, 0, 64, 16, 0x000000, 0.28).setDepth(99);
      this.view = CharacterManager.createView(this);
      this.view.container.setDepth(100);
      this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xff0000, 0).setDepth(900);
      this.cdText = txt(this, W / 2, 200, "READY?", 54, "#ffffff", { stroke: "#273043", strokeThickness: 8 })
        .setOrigin(0.5).setDepth(1100);

      this.buildHUD();
      this.buildPause();
      this.bindInput();
      this.showIntro();

      while (this.nextSceneZ < VIEW) { this.spawnScenery(this.nextSceneZ); this.nextSceneZ += 190; }
      this.events.once("shutdown", () => this.cleanup());
    }

    cleanup() {
      AudioManager.stopSfx("sfx_run");
      // Save what the player earned, even if the level was left in the middle.
      try {
        this.bankCoins();
        LevelManager.recordProgress(this.levelKey, (Math.min(this.dist, this.levelLen) / this.levelLen) * 100);
        LevelManager.recordScore(this.score);
      } catch (e) { console.warn("Could not save progress", e); }
      (this._dom || []).forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
      this._dom = [];
      const panel = document.getElementById("mobile-controls");
      if (panel) panel.classList.add("hidden");
      try { this.tweens.resumeAll(); this.time.paused = false; } catch (e) { /* ignore */ }
      try { this.input.keyboard.removeAllListeners(); this.input.keyboard.removeCapture("UP,DOWN,LEFT,RIGHT,SPACE"); } catch (e) { /* ignore */ }
    }

    /** Adds the coins collected since the last call to the saved coin total. */
    bankCoins() {
      const d = this.coins - this.banked;
      if (d > 0) { LevelManager.addCoins(d); this.banked = this.coins; }
    }

    /* ---------------------------------------------------- backgrounds (one per level) */
    buildBackground() {
      this.customBackground = window.BackgroundManager ? window.BackgroundManager.create(this, this.levelKey) : null;
      if (this.customBackground) {
        this.far = this.add.container(0,0).setDepth(0.5);
        return;
      }
      const th = this.theme, n = this.lv.number, g = this.add.graphics().setDepth(0);
      const bands = 10, bh = (HY + 2) / bands;
      for (let i = 0; i < bands; i++) {
        g.fillStyle(lerpC(th.skyTop, th.skyBot, i / (bands - 1)), 1);
        g.fillRect(0, i * bh, W, bh + 1);
      }
      // far layer sits in a container that shifts slightly with the camera (parallax)
      const far = this.add.container(0, 0).setDepth(0.5);
      this.far = far;
      const fg = this.add.graphics();
      far.add(fg);
      const builders = [this.bgPark, this.bgForest, this.bgCity, this.bgSky, this.bgKingdom];
      (builders[n - 1] || builders[0]).call(this, g, fg, th);
    }

    drift(obj, dx, dur) {
      this.tweens.add({ targets: obj, x: obj.x + dx, duration: dur, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }

    cloud(x, y, w, alpha, depth) {
      const c = this.add.ellipse(x, y, w, w * 0.38, 0xffffff, alpha).setDepth(depth === undefined ? 0.4 : depth);
      this.drift(c, Phaser.Math.Between(-250, 250), Phaser.Math.Between(9000, 15000));
      return c;
    }

    /* Level 1 — Sunny Adventure Park: sun, green hills, Ferris wheel, pastel houses, clouds */
    bgPark(g, fg, th) {
      g.fillStyle(0xfff3a0, 0.35); g.fillCircle(790, 70, 62);
      g.fillStyle(0xffe14d, 1); g.fillCircle(790, 70, 36);
      fg.fillStyle(th.tree, 0.55);
      for (let i = -1; i < 7; i++) fg.fillEllipse(i * 190 + 60, HY + 8, 300, 90);
      const cols = [0xffe6a7, 0xffd1dc, 0xc9f2ff];
      for (let i = 0; i < 9; i++) {
        const bh = 50 + (i % 3) * 22;
        fg.fillStyle(cols[i % 3], 0.9);
        fg.fillRoundedRect(i * 120 - 20, HY - bh, 52, bh, 6);
      }
      // Ferris wheel
      const wx = 250, wy = HY - 78, R = 54;
      fg.lineStyle(4, 0xffffff, 0.95); fg.strokeCircle(wx, wy, R); fg.strokeCircle(wx, wy, R * 0.45);
      for (let a = 0; a < 6; a++) fg.lineBetween(wx, wy, wx + Math.cos(a * Math.PI / 3) * R, wy + Math.sin(a * Math.PI / 3) * R);
      const gc = [0xff6f6f, 0xffd93d, 0x1fd1c9, 0xff9f43, 0xa66bff, 0x4ecb52];
      for (let a = 0; a < 6; a++) { fg.fillStyle(gc[a], 1); fg.fillCircle(wx + Math.cos(a * Math.PI / 3) * R, wy + Math.sin(a * Math.PI / 3) * R, 7); }
      fg.lineStyle(5, 0xffffff, 0.95); fg.lineBetween(wx, wy, wx - 28, HY + 4); fg.lineBetween(wx, wy, wx + 28, HY + 4);
      for (let i = 0; i < 5; i++) this.cloud(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(20, 120), 90, 0.9);
    }

    /* Level 2 — Mystery Forest: night sky, moon, dark pines, drifting mist, fireflies */
    bgForest(g, fg, th) {
      for (let i = 0; i < 40; i++) {
        g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 0.9));
        g.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, HY * 0.7), Phaser.Math.Between(1, 2));
      }
      g.fillStyle(0xdff8ff, 0.2); g.fillCircle(150, 66, 50);
      g.fillStyle(0xf3f6ff, 1); g.fillCircle(150, 66, 30);
      g.fillStyle(th.skyTop, 1); g.fillCircle(162, 58, 26);
      fg.fillStyle(0x15493f, 0.9);
      for (let i = -1; i < 22; i++) {
        const x = i * 52 + 20, h = 70 + (i % 4) * 24;
        fg.fillTriangle(x - 34, HY + 6, x + 34, HY + 6, x, HY - h);
      }
      fg.fillStyle(0x0f3a33, 0.9);
      for (let i = 0; i < 12; i++) {
        const x = i * 96 + 50, h = 100 + (i % 3) * 30;
        fg.fillTriangle(x - 44, HY + 6, x + 44, HY + 6, x, HY - h);
      }
      for (let i = 0; i < 3; i++) {
        const m = this.add.ellipse(160 + i * 320, HY - 10 + i * 6, 460, 60, 0xffffff, 0.14).setDepth(0.6);
        this.drift(m, 140 * (i % 2 ? -1 : 1), 11000 + i * 2500);
      }
      for (let i = 0; i < 16; i++) {
        const f = this.add.circle(Phaser.Math.Between(30, W - 30), Phaser.Math.Between(HY - 40, H - 120), Phaser.Math.Between(2, 3), 0xe9ff7a, 1).setDepth(1.2);
        this.tweens.add({ targets: f, alpha: { from: 0.1, to: 1 }, duration: Phaser.Math.Between(700, 1600), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1200) });
        this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-60, 60), y: f.y + Phaser.Math.Between(-30, 30), duration: Phaser.Math.Between(2500, 4500), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    }

    /* Level 3 — Learning City: golden sky, layered skyline with lit windows, school clock tower */
    bgCity(g, fg, th) {
      g.fillStyle(0xfff3b0, 0.4); g.fillCircle(480, HY - 10, 120);
      const layer = (color, alpha, baseH, step, win) => {
        for (let i = -1; i < 16; i++) {
          const bw = step - 6 + (i % 3) * 8, bh = baseH + ((i * 37) % 5) * 18;
          fg.fillStyle(color, alpha); fg.fillRect(i * step, HY + 4 - bh, bw, bh);
          if (win) {
            fg.fillStyle(0xfff3a0, 0.9);
            for (let y = HY - bh + 10; y < HY - 8; y += 18) for (let x = i * step + 8; x < i * step + bw - 10; x += 16) fg.fillRect(x, y, 6, 8);
          }
        }
      };
      layer(0xb9a7d6, 0.8, 70, 70, false);
      layer(0x7f6fa8, 0.95, 55, 62, true);
      // clock tower
      fg.fillStyle(0x6b5a99, 1); fg.fillRect(640, HY - 150, 46, 154);
      fg.fillTriangle(634, HY - 150, 692, HY - 150, 663, HY - 190);
      fg.fillStyle(0xffffff, 1); fg.fillCircle(663, HY - 122, 15);
      fg.lineStyle(3, 0x273043, 1); fg.lineBetween(663, HY - 122, 663, HY - 132); fg.lineBetween(663, HY - 122, 671, HY - 118);
      this.cloud(200, 50, 110, 0.7); this.cloud(560, 90, 90, 0.6);
    }

    /* Level 4 — Sky Adventure World: rainbow, floating islands, big clouds, sparkling sky */
    bgSky(g, fg, th) {
      const rb = [0xff6f6f, 0xff9f43, 0xffd93d, 0x4ecb52, 0x1fd1c9, 0x6f8cff, 0xa66bff];
      rb.forEach((c, i) => {
        g.lineStyle(9, c, 0.8); g.beginPath(); g.arc(480, HY + 70, 330 - i * 9, Math.PI, 0, false); g.strokePath();
      });
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(160, HY - 4, 30); g.fillCircle(190, HY - 14, 38); g.fillCircle(224, HY - 2, 28);
      g.fillCircle(740, HY - 4, 30); g.fillCircle(772, HY - 16, 40); g.fillCircle(806, HY - 2, 28);
      [[130, 80], [380, 40], [620, 96], [830, 60]].forEach(([x, y], i) => {
        const isl = this.add.container(x, y).setDepth(0.45);
        const ig = this.add.graphics();
        ig.fillStyle(0x8a6b4f, 1); ig.fillTriangle(-46, 0, 46, 0, 0, 40);
        ig.fillStyle(0x5fd17a, 1); ig.fillEllipse(0, 0, 100, 22);
        ig.fillStyle(0x2fb36a, 1); ig.fillCircle(-14, -14, 12); ig.fillCircle(12, -10, 9);
        isl.add(ig);
        this.tweens.add({ targets: isl, y: y + 10, duration: 2200 + i * 380, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      });
      for (let i = 0; i < 6; i++) this.cloud(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(20, 150), Phaser.Math.Between(90, 150), 0.9);
      for (let i = 0; i < 10; i++) {
        const sp = this.add.circle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, HY), 2, 0xffffff, 1).setDepth(0.3);
        this.tweens.add({ targets: sp, alpha: { from: 0.1, to: 1 }, duration: Phaser.Math.Between(600, 1400), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 900) });
      }
    }

    /* Level 5 — Ultimate Modal Kingdom: starry twilight, golden moon, royal castle, sparkles */
    bgKingdom(g, fg, th) {
      for (let i = 0; i < 60; i++) {
        g.fillStyle(0xffffff, Phaser.Math.FloatBetween(0.3, 1));
        g.fillCircle(Phaser.Math.Between(0, W), Phaser.Math.Between(0, HY * 0.8), Phaser.Math.Between(1, 2));
      }
      g.fillStyle(0xffd93d, 0.25); g.fillCircle(790, 70, 64);
      g.fillStyle(0xffe27a, 1); g.fillCircle(790, 70, 38);
      g.fillStyle(th.skyTop, 0.85); g.fillCircle(804, 62, 32);
      fg.fillStyle(0x4a2d99, 0.75);
      for (let i = -1; i < 7; i++) fg.fillEllipse(i * 190 + 60, HY + 10, 320, 80);
      // castle silhouette
      const castle = 0x2c1a63;
      fg.fillStyle(castle, 1);
      fg.fillRect(380, HY - 90, 200, 96);
      [[360, 120], [450, 150], [540, 120]].forEach(([x, h]) => {
        fg.fillRect(x, HY - h, 60, h + 6);
        fg.fillTriangle(x - 8, HY - h, x + 68, HY - h, x + 30, HY - h - 52);
      });
      fg.fillStyle(0xffd93d, 1);
      [[385, 100], [475, 130], [565, 100], [430, 60], [520, 60]].forEach(([x, y]) => fg.fillRoundedRect(x - 5, HY - y, 10, 16, 5));
      fg.lineStyle(3, 0xffd93d, 1); fg.lineBetween(480, HY - 202, 480, HY - 232);
      fg.fillStyle(0xffd93d, 1); fg.fillTriangle(480, HY - 232, 504, HY - 224, 480, HY - 216);
      for (let i = 0; i < 14; i++) {
        const sp = this.add.circle(Phaser.Math.Between(20, W - 20), Phaser.Math.Between(20, H - 140), Phaser.Math.Between(2, 3), 0xffe27a, 1).setDepth(1.2);
        this.tweens.add({ targets: sp, alpha: { from: 0.1, to: 1 }, duration: Phaser.Math.Between(600, 1500), yoyo: true, repeat: -1, delay: Phaser.Math.Between(0, 1200) });
        this.tweens.add({ targets: sp, y: sp.y - Phaser.Math.Between(15, 40), duration: Phaser.Math.Between(2500, 4000), yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    }

    /** Level title card shown during the first countdown. */
    showIntro() {
      const a = txt(this, W / 2, 92, `LEVEL ${this.lv.number}  ·  ${this.lv.name}`, 34, "#ffffff", { stroke: "#273043", strokeThickness: 7 })
        .setOrigin(0.5).setDepth(1100);
      const b = txt(this, W / 2, 134, this.lv.environment, 20, "#ffd93d", { stroke: "#273043", strokeThickness: 5 })
        .setOrigin(0.5).setDepth(1100);
      this.tweens.add({ targets: [a, b], alpha: 0, delay: 1500, duration: 600, onComplete: () => { a.destroy(); b.destroy(); } });
    }

    /* ---------------------------------------------------- HUD */
    buildHUD() {
      const st = { stroke: "#ffffff", strokeThickness: 4 };
      this.hudScore = txt(this, 16, 8, "SCORE 0", 22, "#273043", st).setDepth(1000);
      this.add.circle(26, 50, 9, 0xffd93d).setStrokeStyle(2, 0xd9a300).setDepth(1000);
      this.hudCoins = txt(this, 42, 39, "0", 20, "#b8860b", st).setDepth(1000);
      this.hudAns = txt(this, 16, 66, "", 14, "#273043", st).setDepth(1000);
      txt(this, W / 2, 4, `LEVEL ${this.lv.number}: ${this.lv.name}`, 16, "#273043", st).setOrigin(0.5, 0).setDepth(1000);

      const bw = 320, bx = W / 2 - bw / 2;
      this.barW = bw; this.barX = bx;
      this.add.rectangle(W / 2, 36, bw + 6, 16, 0xffffff, 0.9).setStrokeStyle(2, 0x273043).setDepth(1000);
      this.barFill = this.add.rectangle(bx, 36, 1, 10, 0x1fd1c9).setOrigin(0, 0.5).setDepth(1001);
      this.boards.forEach((b) => this.add.rectangle(bx + (b.z / this.levelLen) * bw, 36, 3, 14, 0xffd93d).setDepth(1002));
      this.barDot = this.add.circle(bx, 36, 7, 0xff6f6f).setStrokeStyle(2, 0xffffff).setDepth(1004);
      // finish marker: small checkered flag at the end of the bar
      const fx = bx + bw + 12, fgph = this.add.graphics().setDepth(1003);
      fgph.lineStyle(3, 0x273043, 1); fgph.lineBetween(fx, 46, fx, 22);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        fgph.fillStyle((i + j) % 2 ? 0x111111 : 0xffffff, 1); fgph.fillRect(fx + 1 + i * 5, 22 + j * 5, 5, 5);
      }
      this.hudDist = txt(this, W / 2, 47, "", 13, "#273043", st).setOrigin(0.5, 0).setDepth(1000);
      this.hudCp = txt(this, W / 2, 64, "", 13, "#7a5a00", st).setOrigin(0.5, 0).setDepth(1000);

      this.hearts = [0, 1, 2].map((i) => txt(this, W - 236 + i * 36, 6, "♥", 34, "#ff4d6d", st).setDepth(1000));
      createButton(this, W - 50, 38, 64, 44, "II", () => this.pause(), 0xffd93d).setDepth(1000);
    }

    meters(d) { return Math.floor(clamp(d, 0, this.levelLen) / UNITS_PER_M); }

    updateHUD() {
      const m = this.meters(this.dist), total = this.lv.distance, pct = clamp(this.dist / this.levelLen, 0, 1);
      this.hudScore.setText("SCORE " + this.score);
      this.hudCoins.setText(String(this.coins));
      this.hudAns.setText(`Correct ${this.correct}   Wrong ${this.wrong}`);
      this.hudDist.setText(`Distance ${m} m / ${total} m   ·   Remaining ${total - m} m`);
      this.hudCp.setText(`Checkpoint ${Math.min(this.correct + this.wrong, this.boards.length)} / ${this.boards.length}`);
      this.barFill.width = Math.max(1, (this.barW - 4) * pct);
      this.barDot.x = this.barX + (this.barW - 4) * pct + 2;
      this.hearts.forEach((h, i) => h.setColor(i < this.lives ? "#ff4d6d" : "#777777"));
    }

    get coins() { return this.coinPickups + this.bonusCoins; }
    get score() { return this.correct * POINTS_CORRECT + this.coinPickups * POINTS_COIN; }

    /* ---------------------------------------------------- input */
    bindInput() {
      const kb = this.input.keyboard;
      kb.addCapture("UP,DOWN,LEFT,RIGHT,SPACE");
      const map = { LEFT: () => this.moveLane(-1), A: () => this.moveLane(-1), RIGHT: () => this.moveLane(1), D: () => this.moveLane(1),
        UP: () => this.jump(), W: () => this.jump(), DOWN: () => this.slide(), S: () => this.slide(),
        SPACE: () => this.togglePause(), ESC: () => this.togglePause(), P: () => this.togglePause() };
      Object.keys(map).forEach((k) => kb.on("keydown-" + k, map[k]));

      // Mobile on-screen buttons (HTML overlay from index.html)
      this._dom = [];
      const panel = document.getElementById("mobile-controls");
      if ((("ontouchstart" in window) || navigator.maxTouchPoints > 0) && panel) panel.classList.remove("hidden");
      const bind = (id, fn) => {
        const el = document.getElementById(id);
        if (!el) return;
        const h = (e) => { e.preventDefault(); fn(); };
        el.addEventListener("pointerdown", h);
        this._dom.push([el, "pointerdown", h]);
      };
      bind("btn-left", () => this.moveLane(-1));
      bind("btn-right", () => this.moveLane(1));
      bind("btn-jump", () => this.jump());
      bind("btn-slide", () => this.slide());

      // Swipe gestures on the canvas (ignored while a panel is open)
      this.input.on("pointerdown", (p) => { this._sw = { x: p.x, y: p.y }; });
      this.input.on("pointerup", (p) => {
        if (!this._sw) return;
        const dx = p.x - this._sw.x, dy = p.y - this._sw.y;
        this._sw = null;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 45) return;
        if (Math.abs(dx) > Math.abs(dy)) this.moveLane(dx > 0 ? 1 : -1);
        else if (dy < 0) this.jump(); else this.slide();
      });
    }

    canAct() { return this.gameState === GAME_STATE.PLAYING && this.countdown <= 0; }

    moveLane(d) { if (this.canAct()) this.lane = clamp(this.lane + d, 0, 2); }

    jump() {
      if (!this.canAct() || this.h > 0 || this.vy > 0) return; // grounded only -> no infinite jumping
      this.vy = JUMP_V; this.slideT = 0;
      AudioManager.playSfx("sfx_jump");
    }

    slide() {
      if (!this.canAct()) return;
      if (this.h > 0) { this.vy = Math.min(this.vy, -1100); return; } // fast-fall while airborne
      if (this.slideT > 0 || this.slideCd > 0) return;
      this.slideT = SLIDE_DUR; this.slideCd = SLIDE_CD;
      AudioManager.playSfx("sfx_slide");
    }

    /* ---------------------------------------------------- main loop */
    update(time, delta) {
      const dt = Math.min(delta / 1000, 0.05);
      // level clock: runs while running or answering a question, never while paused / on end screens
      if ((this.gameState === GAME_STATE.PLAYING && this.countdown <= 0) || this.gameState === GAME_STATE.QUESTION) {
        this.elapsed += Math.min(delta / 1000, 0.25);
      }
      if (this.gameState === GAME_STATE.GAME_OVER) { this.view.update(dt); return; }
      if (this.gameState !== GAME_STATE.PLAYING) return; // QUESTION / PAUSED / LEVEL_COMPLETED freeze everything
      this.step(dt);
      this.render(dt);
    }

    step(dt) {
      if (this.countdown > 0) {
        this.countdown -= dt;
        this.cdText.setVisible(this.countdown > 0).setText(this.countdown > 0.45 ? "READY?" : "GO!");
        this.speed = 0;
        return;
      }
      this.t += dt;
      AudioManager.playSfx("sfx_run");
      this.speed = Math.min(this.baseSpeed + this.t * this.cfg.ramp, this.baseSpeed + this.cfg.maxExtra);
      this.dist += this.speed * dt;

      // smooth lane transition (never leaves lanes 0..2)
      const dl = this.lane - this.laneF;
      this.laneF = Math.abs(dl) < 0.005 ? this.lane : clamp(this.laneF + dl * Math.min(1, dt * 13), 0, 2);

      // vertical physics: gravity + ground detection
      if (this.h > 0 || this.vy > 0) {
        this.vy -= GRAV * dt;
        this.h += this.vy * dt;
        if (this.h <= 0) { this.h = 0; this.vy = 0; }
      }
      this.slideT = Math.max(0, this.slideT - dt);
      this.slideCd = Math.max(0, this.slideCd - dt);
      this.hitT = Math.max(0, this.hitT - dt);
      this.invul = Math.max(0, this.invul - dt);

      this.spawnAhead();
      this.updateObjects(dt);
      this.updateHUD();
      // the player runs under the finish arch, then the level ends
      if (this.gameState === GAME_STATE.PLAYING && this.dist >= this.levelLen + 40) this.completeLevel();
    }

    /* ---------------------------------------------------- spawning */
    makeContainer(type) {
      let c = (this.free[type] || []).pop();
      if (!c) c = WorldFactory.make(type, this, this.theme);
      c.setVisible(true).setAlpha(1).setScale(1).setAngle(0);
      return c;
    }

    addObj(kind, type, z, props) {
      const o = Object.assign({ kind, type, z, laneF: 1, lane: 1, px: 0, y: 0, c: this.makeContainer(type) }, props);
      this.objs.push(o);
      return o;
    }

    releaseObj(o) {
      if (o.type === "board" || o.type === "finish") {
        if (o.c.glow) this.tweens.killTweensOf(o.c.glow);
        if (o.c.flags) o.c.flags.forEach((f) => this.tweens.killTweensOf(f));
        o.c.destroy();
      } else {
        o.c.setVisible(false);
        (this.free[o.type] = this.free[o.type] || []).push(o.c);
      }
    }

    nearBoard(z, margin) { return this.boards.some((b) => Math.abs(b.z - z) < margin); }

    spawnAhead() {
      const limit = this.dist + VIEW;
      while (this.nextSceneZ < limit) { this.spawnScenery(this.nextSceneZ); this.nextSceneZ += 190; }
      while (this.nextRowZ < limit) {
        const z = this.nextRowZ, cfg = this.cfg;
        if (z < this.levelLen - 700 && !this.nearBoard(z, 700)) {
          const type = Phaser.Utils.Array.GetRandom(cfg.types);
          const first = this.placeRow(z, type, null);
          // complex pattern (levels 4-5): a second, different row right after the first one
          if (cfg.combo && Math.random() < cfg.combo) {
            const z2 = z + 470;
            if (z2 < this.levelLen - 700 && !this.nearBoard(z2, 700)) {
              let t2 = type;
              while (t2 === type) t2 = Phaser.Utils.Array.GetRandom(cfg.types);
              this.placeRow(z2, t2, first.used);
              this.nextRowZ += 470;
            }
          }
        }
        this.nextRowZ += Phaser.Math.Between(cfg.gap[0], cfg.gap[1]);
      }
      this.boards.forEach((b) => {
        if (!b.spawned && b.z < limit) {
          b.spawned = true;
          const o = this.addObj("board", "board", b.z, { b });
          if (o.c.label) o.c.label.setText("QUESTION " + b.no);
        }
      });
      if (!this.finishSpawned && this.levelLen < limit) { this.finishSpawned = true; this.addObj("finish", "finish", this.levelLen); }
    }

    spawnScenery(z) {
      const list = this.theme.scenery, i = Math.round(z / 190);
      [-1, 1].forEach((side) => {
        const type = list[(i + (side > 0 ? 1 : 0)) % list.length];
        const r = SCENERY_OFFSET[type] || [340, 430];
        const off = r[0] === r[1] ? r[0] : Phaser.Math.Between(r[0], r[1]);
        this.addObj("scenery", type, z + (side > 0 ? 70 : 0), { px: side * off });
      });
    }

    /** Places one row of obstacles (+ sometimes a coin line). Returns the lanes that are used. */
    placeRow(z, type, avoid) {
      const def = OBSTACLE_DEFS[type], cfg = this.cfg;
      let lanes = Phaser.Utils.Array.Shuffle([0, 1, 2]);
      if (avoid && avoid.length) lanes.sort((a, b) => (avoid.includes(a) ? 1 : 0) - (avoid.includes(b) ? 1 : 0));
      let count = 1 + (Math.random() < cfg.twoChance ? 1 : 0);
      // A row that spans all 3 lanes can only be passed by jumping/sliding. Never put another full row
      // closer than 700 units behind it: the player could not land and jump again in time (unfair).
      const fullOk = this.lastFullZ === undefined || z - this.lastFullZ >= 700;
      if (cfg.allLanes && fullOk && ["hurdle", "gap", "mover"].includes(type) && Math.random() < 0.15) { count = 3; this.lastFullZ = z; }
      if (def.sway) count = 1;
      const used = lanes.slice(0, count);

      used.forEach((ln) => {
        let base = ln;
        if (def.sway) base = Phaser.Utils.Array.GetRandom([0.5, 1, 1.5]);
        this.addObj("obstacle", type, z, {
          def, lane: base, laneF: base, baseLane: base,
          amp: def.sway ? Math.min(base, 2 - base, 0.8) : 0, phase: Math.random() * 6.28
        });
      });

      // coin line in a free lane (some as jump arcs)
      if (!avoid && Math.random() < 0.55 && count < 3 && !this.nearBoard(z, 700)) {
        const free = lanes.filter((l) => !used.includes(l));
        const ln = free.length ? free[0] : 1;
        const arc = Math.random() < 0.3;
        for (let i = 0; i < 5; i++) {
          this.addObj("coin", "coin", z + 200 + i * 55, { lane: ln, laneF: ln, y: arc ? 40 + Math.sin((i / 4) * Math.PI) * 110 : 40, phase: i * 0.5 });
        }
      }
      return { used, count };
    }

    /* ---------------------------------------------------- objects + collisions */
    updateObjects(dt) {
      for (let i = this.objs.length - 1; i >= 0; i--) {
        const o = this.objs[i];
        if (o.kind === "obstacle") {
          if (o.def.extra) o.z -= o.def.extra * dt; // rolling barrels approach faster
          if (o.def.sway) o.laneF = clamp(o.baseLane + Math.sin(this.t * o.def.freq + o.phase) * o.amp, 0, 2);
        }
        const dist = o.z - this.dist;
        if (dist < -160 && o.kind !== "finish") { this.releaseObj(o); this.objs.splice(i, 1); continue; }

        if (o.kind === "obstacle" && !o.hit && this.invul <= 0) this.collideObstacle(o, dist);
        else if (o.kind === "coin" && !o.got) this.collideCoin(o, dist);
        else if (o.kind === "board" && !o.b.done && dist <= 30 && dist > -100) {
          o.b.done = true;          // a checkpoint can only fire once
          this.triggerBoard(o);
          return;
        }
      }
    }

    collideObstacle(o, dist) {
      const d = o.def;
      if (Math.abs(dist) > d.len / 2 + 18) return;
      if (Math.abs(o.laneF - this.laneF) > d.hw + 0.28) return;
      const top = this.h + (this.slideT > 0 ? SLIDE_H : STAND_H);
      if (this.h < d.yMax && top > d.yMin) { o.hit = true; this.takeHit(); }
    }

    collideCoin(o, dist) {
      if (Math.abs(dist) > 40 || Math.abs(o.laneF - this.laneF) > 0.55) return;
      const top = this.h + (this.slideT > 0 ? SLIDE_H : STAND_H);
      if (this.h > o.y + 16 || top < o.y - 16) return;
      o.got = true;
      this.coinPickups++;
      o.c.setVisible(false);
      AudioManager.playSfx("sfx_coin");
      const p = this.coinScreen(o);
      this.burst(p.x, p.y, 0xffd93d, 6);
      const t = txt(this, p.x, p.y - 20, "+" + POINTS_COIN, 20, "#ffd93d", { stroke: "#273043", strokeThickness: 4 }).setOrigin(0.5).setDepth(950);
      this.tweens.add({ targets: t, y: t.y - 40, alpha: 0, duration: 600, onComplete: () => t.destroy() });
    }

    coinScreen(o) {
      const s = proj(o.z - this.dist);
      return { x: CX + ((o.laneF - 1) * LW - this.camX) * s, y: sy(s) - o.y * s };
    }

    takeHit() {
      this.lives = Math.max(0, this.lives - 1);
      this.hitT = HIT_DUR; this.invul = INVUL; this.slideT = 0;
      AudioManager.playSfx("sfx_hit");
      this.cameras.main.shake(220, 0.012);
      this.flash.setAlpha(0.4);
      this.tweens.add({ targets: this.flash, alpha: 0, duration: 300 });
      this.burst(CX + (this.laneF - 1) * LW - this.camX, GY - this.h - 50, 0xff6f6f, 14);
      this.updateHUD();
      if (this.lives <= 0) {
        this.gameState = GAME_STATE.GAME_OVER;
        AudioManager.stopSfx("sfx_run");
        this.view.setState("HIT");
        this.time.delayedCall(700, () => this.showGameOver());
      }
    }

    burst(x, y, color, n, depth) {
      for (let i = 0; i < n; i++) {
        const p = this.add.circle(x, y, Phaser.Math.Between(3, 6), color).setDepth(depth || 950);
        const a = Math.random() * 6.28, d = Phaser.Math.Between(30, 80);
        this.tweens.add({ targets: p, x: x + Math.cos(a) * d, y: y + Math.sin(a) * d, alpha: 0, scale: 0.2, duration: 450, onComplete: () => p.destroy() });
      }
    }

    /* ---------------------------------------------------- rendering */
    render(dt) {
      this.camX += ((this.laneF - 1) * LW * 0.45 - this.camX) * Math.min(1, dt * 6);
      this.far.x = -this.camX * 0.05;
      if (this.customBackground) this.customBackground.update(this.dist);
      this.drawRoad();

      for (const o of this.objs) {
        const dist = o.z - this.dist, s = proj(dist);
        const px = o.kind === "scenery" ? o.px : (o.laneF - 1) * LW;
        const c = o.c;
        let y = sy(s);
        if (o.kind === "coin") y -= o.y * s;
        c.setPosition(CX + (px - this.camX) * s, y);
        c.setScale(o.kind === "coin" ? s * Math.max(0.2, Math.abs(Math.cos(this.t * 7 + o.phase))) : s, s);
        c.setDepth(o.type === "gap" ? s * 100 - 50 : s * 100);
        c.setAlpha(clamp((VIEW - dist) / 500, 0, 1));
        if (o.type === "barrel") c.gfx.rotation = -this.t * 8;
      }

      // player state machine: IDLE / RUN / JUMP / SLIDE / HIT
      const st = this.countdown > 0 ? "IDLE" : this.hitT > 0 ? "HIT" : this.h > 0 ? "JUMP" : this.slideT > 0 ? "SLIDE" : "RUN";
      this.view.setState(st);
      this.view.update(dt);
      const x = CX + ((this.laneF - 1) * LW - this.camX);
      this.view.container.setPosition(x, GY - this.h);
      this.view.container.setAlpha(this.invul > 0 && this.hitT <= 0 ? (Math.floor(this.t * 14) % 2 ? 0.35 : 1) : 1);
      this.shadow.setPosition(x, GY + 2).setScale(Math.max(0.4, 1 - this.h / 220));
    }

    quad(g, z0, z1, xl, xr, color, alpha) {
      z0 = Math.max(z0, -250);
      if (z1 <= z0) return;
      const s0 = proj(z0), s1 = proj(z1), y0 = sy(s0), y1 = sy(s1);
      const X = (px, s) => CX + (px - this.camX) * s;
      g.fillStyle(color, alpha === undefined ? 1 : alpha);
      g.beginPath();
      g.moveTo(X(xl, s0), y0); g.lineTo(X(xr, s0), y0); g.lineTo(X(xr, s1), y1); g.lineTo(X(xl, s1), y1);
      g.closePath(); g.fillPath();
    }

    drawRoad() {
      const g = this.roadG, th = this.theme, FAR = 15000, RW = LW * 1.5;
      g.clear();
      g.fillStyle(th.grass, 1); g.fillRect(0, HY, W, H - HY);
      const i0 = Math.floor(this.dist / 130);
      for (let k = -2; k < 22; k++) { // moving ground bands
        const z0 = (i0 + k) * 130 - this.dist;
        if ((i0 + k) % 2) this.quad(g, z0, z0 + 130, -4000, 4000, th.grass2);
      }
      this.quad(g, -250, FAR, -RW - 4, RW + 4, th.road);
      for (let k = -2; k < 22; k++) { // moving curbs + lane dashes
        const z0 = (i0 + k) * 130 - this.dist, odd = (i0 + k) % 2;
        this.quad(g, z0, z0 + 130, -RW - 16, -RW, odd ? th.curbB : th.curbA);
        this.quad(g, z0, z0 + 130, RW, RW + 16, odd ? th.curbB : th.curbA);
        [-LW / 2, LW / 2].forEach((x) => this.quad(g, z0, z0 + 65, x - 4, x + 4, th.dash, 0.85));
      }
      g.fillStyle(th.haze, th.hazeA); g.fillRect(0, HY, W, 14); // horizon haze
    }

    /* ---------------------------------------------------- jump board + question checkpoint */
    triggerBoard(boardObj) {
      this.gameState = GAME_STATE.QUESTION;       // gameplay pauses automatically
      AudioManager.stopSfx("sfx_run");
      this.speed = 0; this.h = 0; this.vy = 0; this.slideT = 0;
      this.curBoard = boardObj;
      this.view.setState("RUN"); this.view.update(0);
      AudioManager.playSfx("sfx_board");
      this.showQuestion();
    }

    /** One answer button: letter badge + text. mark() colors it after the answer. */
    makeOption(letter, text, x, y, onPick) {
      const w = 420, h = 66, c = this.add.container(x, y), bg = this.add.graphics();
      const draw = (fill, stroke) => {
        bg.clear();
        bg.fillStyle(0x000000, 0.12); bg.fillRoundedRect(-w / 2 + 3, -h / 2 + 5, w, h, 16);
        bg.fillStyle(fill, 1); bg.fillRoundedRect(-w / 2, -h / 2, w, h, 16);
        bg.lineStyle(4, stroke, 1); bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
      };
      draw(0xf1fbfb, 0x1fd1c9);
      const badge = this.add.circle(-w / 2 + 34, 0, 20, 0x1fd1c9);
      const badgeT = txt(this, -w / 2 + 34, 0, letter, 22, "#ffffff").setOrigin(0.5);
      const size = text.length <= 26 ? 20 : text.length <= 44 ? 17 : 14;
      const label = txt(this, -w / 2 + 66, 0, text, size, "#273043", { wordWrap: { width: w - 84 } }).setOrigin(0, 0.5);
      c.add([bg, badge, badgeT, label]);
      c.setSize(w, h);
      c.setInteractive({ useHandCursor: true });
      c.on("pointerover", () => { if (!this.answered) draw(0xdff7f6, 0x1fd1c9); });
      c.on("pointerout", () => { if (!this.answered) draw(0xf1fbfb, 0x1fd1c9); });
      c.on("pointerup", () => onPick(letter));
      c.mark = (state) => {
        c.disableInteractive();
        if (state === "correct") { draw(0xd7f7dc, 0x2ecc40); badge.setFillStyle(0x2ecc40); }
        else if (state === "wrong") { draw(0xffdede, 0xff4d4d); badge.setFillStyle(0xff4d4d); }
        else { draw(0xeeeeee, 0xcccccc); badge.setFillStyle(0xaaaaaa); label.setAlpha(0.55); }
      };
      return c;
    }

    showQuestion() {
      const q = QuestionManager.next(this.lv.number);   // random, no repeats until the level bank is used up
      this.curQ = q;
      this.answered = false;
      const ui = this.add.container(0, 0).setDepth(1500);
      this.qUI = ui;
      // full-screen blocker: the question cannot be closed without answering
      ui.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.5).setInteractive());
      ui.add(drawPanel(this, W / 2, H / 2, 880, 500, 0xffffff, 0.98));

      const band = this.add.graphics();
      band.fillStyle(this.lv.themeColor, 1); band.fillRoundedRect(W / 2 - 420, 34, 840, 36, 18);
      ui.add(band);
      ui.add(txt(this, W / 2 - 400, 52, `CHECKPOINT ${this.curBoard.b.no} / ${this.boards.length}  ·  ${this.lv.name}`, 17, "#273043").setOrigin(0, 0.5));
      ui.add(txt(this, W / 2 + 400, 52, q.category, 15, "#273043").setOrigin(1, 0.5));
      ui.add(txt(this, W / 2, 118, q.question, q.question.length > 70 ? 23 : 27, "#273043", { align: "center", wordWrap: { width: 780 } }).setOrigin(0.5));

      this.optBtns = {};
      ["A", "B", "C", "D"].forEach((L, k) => {
        const x = W / 2 + (k % 2 ? 215 : -215), y = 200 + Math.floor(k / 2) * 78;
        const btn = this.makeOption(L, q.options[L], x, y, (letter) => this.answer(letter));
        this.optBtns[L] = btn;
        ui.add(btn);
      });

      // keyboard: A-D or 1-4 to answer, ENTER / SPACE to continue
      this.qKeyHandler = (ev) => {
        const k = String(ev.key || "").toUpperCase();
        const map = { A: "A", B: "B", C: "C", D: "D", "1": "A", "2": "B", "3": "C", "4": "D" };
        if (!this.answered && map[k]) this.answer(map[k]);
        else if (this.answered && (k === "ENTER" || k === " ")) this.closeQuestion();
      };
      this.input.keyboard.on("keydown", this.qKeyHandler);
    }

    answer(letter) {
      if (this.answered || !this.qUI) return;     // exactly one answer per question
      this.answered = true;
      const q = this.curQ, ok = letter === q.correctAnswer, ui = this.qUI;

      ["A", "B", "C", "D"].forEach((L) => {
        this.optBtns[L].mark(L === q.correctAnswer ? "correct" : L === letter ? "wrong" : "dim");
      });

      if (ok) { this.correct++; this.bonusCoins++; }
      else { this.wrong++; this.lives = Math.max(0, this.lives - 1); }
      QuestionManager.record(q, letter, ok);
      AudioManager.playSfx(ok ? "sfx_correct" : "sfx_wrong");
      this.updateHUD();
      this.bankCoins();

      // checkpoint board shows it is used up
      const b = this.curBoard;
      if (b && b.c) {
        if (b.c.glow) { this.tweens.killTweensOf(b.c.glow); b.c.glow.setAlpha(0.1); }
        if (b.c.label) b.c.label.setText(ok ? "CORRECT" : "ANSWERED");
      }

      // feedback
      ui.add(txt(this, W / 2, 346, ok ? "CORRECT ANSWER!" : "WRONG ANSWER!", 34, ok ? "#2a9d3a" : "#d63b3b").setOrigin(0.5));
      const sub = ok
        ? `+${POINTS_CORRECT} score   ·   +1 bonus coin`
        : `Correct answer: ${q.correctAnswer}.  ${q.options[q.correctAnswer]}   ·   -1 life`;
      ui.add(txt(this, W / 2, 376, sub, 17, ok ? "#b8860b" : "#273043", { align: "center", wordWrap: { width: 820 } }).setOrigin(0.5));
      ui.add(txt(this, W / 2, 402, q.explanation, 16, "#4a5568", { align: "center", wordWrap: { width: 820 }, fontStyle: "normal" }).setOrigin(0.5, 0));
      ui.add(createButton(this, W / 2, 490, 260, 44, "CONTINUE", () => this.closeQuestion(), 0x4ecb52));

      if (ok) this.burst(W / 2, 346, 0xffd93d, 16, 1600);
      else this.cameras.main.shake(180, 0.006);
    }

    closeQuestion() {
      if (!this.qUI || !this.answered) return;    // cannot close without an answer, cannot close twice
      this.qUI.destroy(); this.qUI = null;
      if (this.qKeyHandler) { this.input.keyboard.off("keydown", this.qKeyHandler); this.qKeyHandler = null; }

      if (this.lives <= 0) {                      // the last life was lost on the question
        this.gameState = GAME_STATE.GAME_OVER;
        AudioManager.stopSfx("sfx_run");
        this.view.setState("HIT");
        this.showGameOver();
        return;
      }
      // clear a safe zone ahead so resuming never causes an unfair instant hit
      for (let i = this.objs.length - 1; i >= 0; i--) {
        const o = this.objs[i], d = o.z - this.dist;
        if ((o.kind === "obstacle" || o.kind === "coin") && d > -100 && d < 500) { this.releaseObj(o); this.objs.splice(i, 1); }
      }
      this.invul = Math.max(this.invul, 1.2);
      this.countdown = 0.8;
      this.gameState = GAME_STATE.PLAYING;
    }

    /* ---------------------------------------------------- pause / end screens */
    buildPause() {
      const ui = this.add.container(0, 0).setDepth(2000).setVisible(false);
      this.pauseUI = ui;
      ui.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive());
      ui.add(drawPanel(this, W / 2, H / 2, 420, 400, 0xffffff, 0.98));
      ui.add(txt(this, W / 2, H / 2 - 160, "PAUSED", 36, "#273043").setOrigin(0.5));
      [["RESUME", () => this.resume(), 0x4ecb52], ["RESTART", () => this.scene.restart({ levelKey: this.levelKey }), 0x1fd1c9],
        ["SETTINGS", () => this.openSettings(true), 0xffd93d], ["MAIN MENU", () => this.scene.start("MainMenuScene"), 0xff6f6f]]
        .forEach(([l, fn, c], i) => ui.add(createButton(this, W / 2, H / 2 - 85 + i * 68, 280, 50, l, fn, c)));

      const sp = this.add.container(0, 0).setDepth(2001).setVisible(false);
      this.setUI = sp;
      sp.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive());
      sp.add(drawPanel(this, W / 2, H / 2, 520, 360, 0xffffff, 0.98));
      sp.add(txt(this, W / 2, H / 2 - 145, "SETTINGS", 30, "#273043").setOrigin(0.5));
      const row = (label, y, get, set) => {
        const v = txt(this, W / 2, y, "", 22, "#273043").setOrigin(0.5);
        const upd = () => v.setText(label + "  " + Math.round(get() * 100) + "%");
        const step = (d) => () => { set(clamp(Math.round((get() + d) * 10) / 10, 0, 1)); upd(); };
        upd();
        sp.add([v, createButton(this, W / 2 - 190, y, 50, 44, "−", step(-0.1), 0x1fd1c9), createButton(this, W / 2 + 190, y, 50, 44, "+", step(0.1), 0x1fd1c9)]);
      };
      row("MUSIC", H / 2 - 75, () => AudioManager.getSettings().musicVolume, (v) => AudioManager.setMusicVolume(v));
      row("SFX", H / 2 - 10, () => AudioManager.getSettings().sfxVolume, (v) => AudioManager.setSfxVolume(v));
      const mute = createButton(this, W / 2, H / 2 + 55, 200, 44, AudioManager.getSettings().muted ? "UNMUTE" : "MUTE", () => {
        const m = !AudioManager.getSettings().muted;
        AudioManager.setMuted(m);
        mute.list[1].setText(m ? "UNMUTE" : "MUTE");
      }, 0xffd93d);
      sp.add(mute);
      sp.add(createButton(this, W / 2, H / 2 + 120, 200, 46, "BACK", () => this.openSettings(false), 0xff6f6f));
    }

    openSettings(on) { this.setUI.setVisible(on); this.pauseUI.setVisible(!on); }

    togglePause() { this.gameState === GAME_STATE.PAUSED ? this.resume() : this.pause(); }

    pause() {
      if (this.gameState !== GAME_STATE.PLAYING) return;
      this.gameState = GAME_STATE.PAUSED;
      AudioManager.stopSfx("sfx_run");
      this.tweens.pauseAll(); this.time.paused = true;
      this.pauseUI.setVisible(true);
    }

    resume() {
      if (this.gameState !== GAME_STATE.PAUSED) return;
      this.pauseUI.setVisible(false); this.setUI.setVisible(false);
      this.tweens.resumeAll(); this.time.paused = false;
      this.countdown = 0.7;
      this.gameState = GAME_STATE.PLAYING;
    }

    /** Statistics panel used by LEVEL COMPLETED and GAME OVER.
     *  rows = [[label, value], ...]   buttons = [[label, fn, color], ...] */
    statsPanel(title, color, rows, buttons, note) {
      const ui = this.add.container(0, 0).setDepth(2100);
      const ph = 95 + (rows.length - 1) * 32 + 48 + (buttons.length - 1) * 56 + 34, top = H / 2 - ph / 2;
      ui.add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.55).setInteractive());
      ui.add(drawPanel(this, W / 2, H / 2, 540, ph, 0xffffff, 0.98));
      ui.add(txt(this, W / 2, top + 42, title, 34, color).setOrigin(0.5));
      if (note) ui.add(txt(this, W / 2, top + 72, note, 15, "#b8860b").setOrigin(0.5));
      rows.forEach(([label, value], i) => {
        const y = top + 100 + i * 32;
        ui.add(txt(this, W / 2 - 215, y, label, 20, "#273043", { fontStyle: "normal" }).setOrigin(0, 0.5));
        ui.add(txt(this, W / 2 + 215, y, String(value), 22, "#1f9d9a").setOrigin(1, 0.5));
        if (i < rows.length - 1) ui.add(this.add.rectangle(W / 2, y + 16, 430, 1, 0xe3e8ee));
      });
      const by = top + 100 + (rows.length - 1) * 32 + 48;
      buttons.forEach(([l, fn, c], i) => ui.add(createButton(this, W / 2, by + i * 56, 300, 46, l, fn, c)));
      return ui;
    }

    resultNow() {
      return { score: this.score, coins: this.coins, correct: this.correct, wrong: this.wrong, lives: this.lives, time: this.elapsed };
    }

    showGameOver() {
      AudioManager.stopSfx("sfx_run"); AudioManager.playSfx("sfx_gameover");
      this.updateHUD();
      this.bankCoins();
      LevelManager.recordScore(this.score);
      LevelManager.recordProgress(this.levelKey, (Math.min(this.dist, this.levelLen) / this.levelLen) * 100);
      this.statsPanel("GAME OVER", "#ff4d4d", [
        ["Total Score", this.score],
        ["Correct Answers", this.correct],
        ["Wrong Answers", this.wrong],
        ["Total Coins", this.coins],
        ["Distance", `${this.meters(this.dist)} m / ${this.lv.distance} m`]
      ], [
        ["TRY AGAIN", () => this.scene.restart({ levelKey: this.levelKey }), 0x4ecb52],
        ["MAIN MENU", () => this.scene.start("MainMenuScene"), 0xff6f6f]
      ], `Level ${this.lv.number} — ${this.lv.name}`);
    }

    /* ---------------------------------------------------- finish line */
    completeLevel() {
      if (this.gameState !== GAME_STATE.PLAYING) return;
      this.gameState = GAME_STATE.LEVEL_COMPLETED;   // gameplay stops here
      AudioManager.stopSfx("sfx_run");
      AudioManager.playSfx("sfx_complete");
      this.speed = 0;
      this.view.setState("IDLE"); this.view.update(0);
      this.updateHUD();

      const result = this.resultNow();
      const prevBest = (LevelManager.getStatus(this.levelKey) || {}).bestScore || 0;
      LevelManager.completeLevel(this.levelKey, result);   // saves + unlocks the NEXT level only
      this.bankCoins();
      AudioManager.playSfx("sfx_correct");

      this.celebrate();
      this.time.delayedCall(1900, () => this.showLevelComplete(result, result.score > prevBest));
    }

    /** Celebration effect: FINISH! pop-up + confetti waves + sparkle bursts. */
    celebrate() {
      const t = txt(this, W / 2, 150, "FINISH!", 78, "#ffd93d", { stroke: "#273043", strokeThickness: 10 })
        .setOrigin(0.5).setDepth(1300).setScale(0.2);
      this.tweens.add({ targets: t, scale: 1, duration: 520, ease: "Back.easeOut" });
      this.tweens.add({ targets: t, angle: { from: -4, to: 4 }, duration: 300, yoyo: true, repeat: -1, delay: 520 });
      this.confetti(70);
      this.time.addEvent({ delay: 450, repeat: 3, callback: () => this.confetti(45) });
      [[240, 250], [720, 230], [480, 300]].forEach(([x, y], i) =>
        this.time.delayedCall(250 + i * 300, () => this.burst(x, y, [0xffd93d, 0x1fd1c9, 0xff6f6f][i], 18, 1250)));
    }

    confetti(n) {
      const cols = [0xff6f6f, 0xffd93d, 0x1fd1c9, 0x4ecb52, 0xa66bff, 0xffffff, 0xff9f43];
      for (let i = 0; i < n; i++) {
        const r = this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(-70, -10),
          Phaser.Math.Between(6, 12), Phaser.Math.Between(10, 18), Phaser.Utils.Array.GetRandom(cols)).setDepth(1200);
        r.setAngle(Phaser.Math.Between(0, 360));
        this.tweens.add({
          targets: r, y: H + 30, x: r.x + Phaser.Math.Between(-120, 120), angle: r.angle + Phaser.Math.Between(180, 540),
          duration: Phaser.Math.Between(1400, 2600), delay: Phaser.Math.Between(0, 500), onComplete: () => r.destroy()
        });
      }
    }

    showLevelComplete(r, isBest) {
      const next = window.LEVELS[this.lv.number];   // LEVELS[number] is the level after this one
      const buttons = [];
      if (next) {
        buttons.push(["NEXT LEVEL", () => {
          if (LevelManager.isUnlocked(next.key)) this.scene.start("GameScene", { levelKey: next.key });
        }, 0x4ecb52]);
      } else {
        buttons.push(["VICTORY!", () => this.scene.start(LevelManager.allCompleted() ? "VictoryScene" : "LevelSelectScene"), 0xffb300]);
      }
      buttons.push(["RETRY", () => this.scene.restart({ levelKey: this.levelKey }), 0x1fd1c9]);
      buttons.push(["MAIN MENU", () => this.scene.start("MainMenuScene"), 0xff6f6f]);

      this.statsPanel("LEVEL COMPLETED!", "#2a9d3a", [
        ["Total Score", r.score],
        ["Correct Answers", r.correct],
        ["Wrong Answers", r.wrong],
        ["Total Coins", r.coins],
        ["Remaining Lives", r.lives],
        ["Level Completion Time", fmtTime(r.time)]
      ], buttons, isBest ? "NEW BEST SCORE!" : `Level ${this.lv.number} — ${this.lv.name}`);
    }
  }

  window.GameScene = GameScene;
})();
