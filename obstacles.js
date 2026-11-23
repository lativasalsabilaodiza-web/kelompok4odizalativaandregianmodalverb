/* ======================================================
   MODAL VERBS ADVENTURE — obstacles.js  (PART 2 + 3)
   Data + procedural art for everything that lives on the track.

   OBSTACLE_DEFS fields:
     len      depth of the hitbox along the track (world units)
     hw       half-width of the hitbox in LANE units
     yMin/yMax vertical span of the hitbox above the ground (px)
     avoid    how to avoid it: "lane" | "jump" | "slide"
     sway     moves side-to-side between lanes (movement behavior)
     extra    extra approach speed (rolling barrels)
   Player vertical span: [h, h+92] standing, [h, h+38] sliding.
   ====================================================== */

window.OBSTACLE_DEFS = {
  barrier: { name: "Wooden Barrier", avoid: "lane",  len: 50,  hw: 0.45, yMin: 0,   yMax: 160 },
  box:     { name: "Moving Box",     avoid: "jump",  len: 60,  hw: 0.4,  yMin: 0,   yMax: 70, sway: true, freq: 1.8 },
  cone:    { name: "Traffic Cones",  avoid: "jump",  len: 30,  hw: 0.35, yMin: 0,   yMax: 45 },
  barrel:  { name: "Rolling Barrel", avoid: "jump",  len: 40,  hw: 0.3,  yMin: 0,   yMax: 56, extra: 240 },
  gap:     { name: "Gap",            avoid: "jump",  len: 150, hw: 0.46, yMin: -60, yMax: 4 },
  hurdle:  { name: "Hurdle",         avoid: "jump",  len: 30,  hw: 0.46, yMin: 0,   yMax: 38 },
  mover:   { name: "Moving Obstacle", avoid: "slide", len: 40, hw: 0.42, yMin: 62,  yMax: 112, sway: true, freq: 1.4 }
};

(function () {
  const rr = (g, c, x, y, w, h, r = 4) => { g.fillStyle(c, 1); g.fillRoundedRect(x, y, w, h, r); };

  // Each builder returns a Graphics whose origin is bottom-center (0,0), art grows upward (-y).
  const ART = {
    barrier(s) {
      const g = s.add.graphics();
      [-62, 48].forEach((x) => rr(g, 0x6b4423, x, -160, 14, 160));
      for (let i = 0; i < 4; i++) rr(g, i % 2 ? 0xb5803f : 0xc99555, -66, -156 + i * 38, 132, 32);
      rr(g, 0xff4d4d, -66, -160, 132, 8, 3);
      g.fillStyle(0x333333, 1);
      [-52, 52].forEach((x) => { for (let i = 0; i < 4; i++) g.fillCircle(x, -140 + i * 38, 3); });
      return g;
    },
    box(s) {
      const g = s.add.graphics();
      rr(g, 0xd9a45a, -45, -70, 90, 70, 6);
      g.lineStyle(5, 0x8a5a1f, 1); g.strokeRoundedRect(-45, -70, 90, 70, 6);
      g.lineBetween(-45, -70, 45, 0); g.lineBetween(45, -70, -45, 0);
      return g;
    },
    cone(s) {
      const g = s.add.graphics();
      [-24, 24].forEach((x) => {
        rr(g, 0x333333, x - 17, -6, 34, 6, 2);
        g.fillStyle(0xff7a1a, 1); g.fillTriangle(x - 14, -6, x + 14, -6, x, -45);
        g.fillStyle(0xffffff, 1); g.fillTriangle(x - 9, -20, x + 9, -20, x + 5, -30); g.fillRect(x - 9, -20, 18, 5);
      });
      return g;
    },
    barrel(s) {
      const g = s.add.graphics();
      g.fillStyle(0x8a5a2b, 1); g.fillCircle(0, 0, 28);
      g.lineStyle(5, 0x4a2e12, 1); g.strokeCircle(0, 0, 28); g.strokeCircle(0, 0, 17);
      g.fillStyle(0xffd93d, 1); g.fillRect(-4, -28, 8, 56); g.fillRect(-28, -4, 56, 8);
      return g;
    },
    gap(s) {
      const g = s.add.graphics();
      rr(g, 0xffd93d, -74, -22, 148, 22, 6);
      rr(g, 0x1b1b2b, -68, -17, 136, 14, 5);
      g.fillStyle(0x000000, 0.6); g.fillRect(-60, -13, 120, 6);
      return g;
    },
    hurdle(s) {
      const g = s.add.graphics();
      [-58, 46].forEach((x) => rr(g, 0xeeeeee, x, -38, 12, 38, 3));
      for (let i = 0; i < 5; i++) rr(g, i % 2 ? 0xffffff : 0xff4d4d, -58 + i * 23, -38, 23, 12, 2);
      return g;
    },
    mover(s) {
      const g = s.add.graphics();
      g.lineStyle(3, 0x444444, 1); g.lineBetween(-40, -112, -40, -230); g.lineBetween(40, -112, 40, -230);
      for (let i = 0; i < 6; i++) rr(g, i % 2 ? 0x222222 : 0xffd93d, -60 + i * 20, -112, 20, 50, 2);
      g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 0, 110, 16); // ground shadow so it reads as "overhead"
      return g;
    }
  };

  const SCENERY = {
    /* ---- shared ---- */
    tree(s, th) {
      const g = s.add.graphics();
      rr(g, 0x7a5230, -9, -70, 18, 70, 3);
      g.fillStyle(th.tree, 1); g.fillCircle(0, -105, 46); g.fillCircle(-26, -82, 30); g.fillCircle(26, -82, 30);
      return g;
    },
    lamp(s, th) {
      const g = s.add.graphics();
      const glow = (th && th.lamp) || 0xffd93d;
      rr(g, 0x444444, -4, -150, 8, 150, 2);
      g.fillStyle(glow, 0.3); g.fillCircle(0, -156, 24);
      g.fillStyle(glow, 1); g.fillCircle(0, -156, 13);
      return g;
    },
    building(s, th) {
      const g = s.add.graphics();
      const h = Phaser.Math.Between(170, 300), w = Phaser.Math.Between(120, 170);
      const cols = (th && th.buildings) || [0xffe6a7, 0xffd1dc, 0xc9f2ff, 0xd8ffd0];
      rr(g, Phaser.Utils.Array.GetRandom(cols), -w / 2, -h, w, h, 10);
      g.fillStyle(0xffffff, 0.75);
      for (let y = -h + 22; y < -30; y += 40) for (let x = -w / 2 + 16; x < w / 2 - 28; x += 36) g.fillRect(x, y, 20, 24);
      return g;
    },

    /* ---- Level 1: Sunny Adventure Park ---- */
    bush(s) {
      const g = s.add.graphics();
      g.fillStyle(0x2f9e44, 1); g.fillCircle(-26, -24, 26); g.fillCircle(8, -32, 32); g.fillCircle(38, -22, 22);
      const fl = [0xff6f91, 0xffd93d, 0xffffff, 0xff9f43];
      [[-30, -30], [0, -44], [22, -26], [42, -28], [-8, -22]].forEach(([x, y], i) => {
        g.fillStyle(fl[i % 4], 1); g.fillCircle(x, y, 6);
      });
      return g;
    },
    balloon(s) {
      const g = s.add.graphics();
      g.lineStyle(2, 0x555555, 1); g.lineBetween(0, 0, 0, -120);
      g.fillStyle(0xff6f6f, 1); g.fillEllipse(0, -158, 58, 72);
      g.fillStyle(0xffffff, 0.45); g.fillEllipse(-12, -172, 12, 22);
      g.fillStyle(0xff6f6f, 1); g.fillTriangle(0, -120, -7, -110, 7, -110);
      return g;
    },

    /* ---- Level 2: Mystery Forest ---- */
    pine(s, th) {
      const g = s.add.graphics();
      rr(g, 0x4a3426, -8, -40, 16, 40, 2);
      [[-70, 62], [-110, 50], [-148, 38]].forEach(([y, w], i) => {
        g.fillStyle(i % 2 ? th.tree : 0x16695a, 1);
        g.fillTriangle(-w, y + 36, w, y + 36, 0, y - 44);
      });
      g.fillStyle(0xffffff, 0.12); g.fillTriangle(-20, -150, 20, -150, 0, -186);
      return g;
    },
    mushroom(s) {
      const g = s.add.graphics();
      g.fillStyle(0x7ef2d0, 0.22); g.fillCircle(0, -36, 58);
      rr(g, 0xf4ead5, -12, -44, 24, 44, 8);
      g.fillStyle(0xc13dff, 1); g.fillEllipse(0, -52, 96, 62);
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(-24, -58, 8); g.fillCircle(14, -70, 7); g.fillCircle(28, -50, 6);
      return g;
    },

    /* ---- Level 3: Learning City ---- */
    booksign(s) {
      const c = s.add.container(0, 0);
      const g = s.add.graphics();
      rr(g, 0x555a66, -5, -130, 10, 130, 2);
      rr(g, 0xffffff, -52, -190, 104, 66, 8);
      g.lineStyle(4, 0x273043, 1); g.strokeRoundedRect(-52, -190, 104, 66, 8);
      rr(g, 0xff6f6f, -52, -190, 104, 14, 6);
      const t = s.add.text(0, -148, "can\nmust", {
        fontFamily: "Verdana, sans-serif", fontSize: "20px", fontStyle: "bold", color: "#273043", align: "center"
      }).setOrigin(0.5);
      c.add([g, t]);
      c.gfx = null;
      return c;
    },

    /* ---- Level 4: Sky Adventure World ---- */
    cloudpile(s) {
      const g = s.add.graphics();
      g.fillStyle(0xffffff, 1);
      [[-60, -30, 36], [-18, -48, 46], [34, -40, 42], [70, -24, 30], [0, -22, 40]].forEach(([x, y, r]) => g.fillCircle(x, y, r));
      g.fillStyle(0xdcecff, 1); g.fillEllipse(0, -6, 170, 22);
      return g;
    },
    island(s) {
      const g = s.add.graphics();
      g.fillStyle(0x8a6b4f, 1); g.fillTriangle(-80, -190, 80, -190, 0, -110);
      g.fillStyle(0x5fd17a, 1); g.fillEllipse(0, -194, 170, 36);
      rr(g, 0x7a5230, -5, -236, 10, 40, 2);
      g.fillStyle(0x2fb36a, 1); g.fillCircle(0, -252, 26);
      return g;
    },

    /* ---- Level 5: Ultimate Modal Kingdom ---- */
    tower(s) {
      const g = s.add.graphics();
      rr(g, 0xd9c8ff, -48, -270, 96, 270, 4);
      g.fillStyle(0xbba6ee, 1); for (let i = 0; i < 4; i++) g.fillRect(-48 + i * 26, -290, 18, 22);
      g.fillStyle(0x6b3fc9, 1); g.fillTriangle(-58, -270, 58, -270, 0, -350);
      g.fillStyle(0x3b2a78, 1); g.fillRoundedRect(-12, -200, 24, 40, 12); g.fillRoundedRect(-12, -120, 24, 40, 12);
      g.lineStyle(3, 0xffd93d, 1); g.lineBetween(0, -350, 0, -390);
      g.fillStyle(0xffd93d, 1); g.fillTriangle(0, -390, 30, -380, 0, -370);
      return g;
    },
    torch(s) {
      const g = s.add.graphics();
      rr(g, 0xb08a3c, -5, -120, 10, 120, 2);
      rr(g, 0xffd93d, -14, -130, 28, 14, 3);
      g.fillStyle(0xff9f43, 0.35); g.fillCircle(0, -152, 34);
      g.fillStyle(0xff7a1a, 1); g.fillTriangle(-12, -132, 12, -132, 0, -176);
      g.fillStyle(0xffe27a, 1); g.fillTriangle(-6, -132, 6, -132, 0, -160);
      return g;
    },
    crystal(s) {
      const g = s.add.graphics();
      g.fillStyle(0xb98cff, 0.25); g.fillCircle(0, -50, 64);
      [[-30, 70, 0x8a5cf0], [0, 104, 0xb98cff], [30, 62, 0x6b3fc9]].forEach(([x, h, col]) => {
        g.fillStyle(col, 1); g.fillTriangle(x - 20, 0, x + 20, 0, x, -h);
        g.fillStyle(0xffffff, 0.4); g.fillTriangle(x - 6, -8, x + 2, -8, x - 1, -h + 14);
      });
      return g;
    },
    banner(s) {
      const g = s.add.graphics();
      rr(g, 0x8a6b2f, -4, -240, 8, 240, 2);
      rr(g, 0xffd93d, -34, -244, 68, 8, 3);
      g.fillStyle(0x6b3fc9, 1); g.fillRect(-28, -236, 56, 110); g.fillTriangle(-28, -126, 28, -126, 0, -96);
      g.fillStyle(0xffd93d, 1); g.fillCircle(0, -196, 12);
      g.fillStyle(0x6b3fc9, 1); g.fillCircle(0, -196, 6);
      return g;
    }
  };

  function coin(s) {
    const g = s.add.graphics();
    g.fillStyle(0xffd93d, 1); g.fillCircle(0, 0, 16);
    g.lineStyle(3, 0xd9a300, 1); g.strokeCircle(0, 0, 16);
    g.fillStyle(0xfff3a0, 1); g.fillEllipse(-4, -4, 8, 12);
    return g;
  }

  /** JUMP BOARD: yellow + turquoise ramp across all 3 lanes, "QUESTION" text, glow animation. */
  function board(s) {
    const c = s.add.container(0, 0);
    const glow = s.add.graphics();
    glow.lineStyle(8, 0xffffff, 1); glow.strokeRoundedRect(-250, -62, 500, 62, 12);
    glow.fillStyle(0xffffff, 0.25); glow.fillRoundedRect(-250, -62, 500, 62, 12);
    const g = s.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillRoundedRect(-240, -4, 480, 12, 6);
    for (let i = 0; i < 12; i++) rr(g, i % 2 ? 0x1fd1c9 : 0xffd93d, -240 + i * 40, -56, 40, 54, i === 0 ? 10 : 2);
    g.lineStyle(5, 0x273043, 1); g.strokeRoundedRect(-240, -56, 480, 54, 10);
    rr(g, 0xffffff, -110, -46, 220, 34, 10);
    const t = s.add.text(0, -29, "QUESTION", {
      fontFamily: "Verdana, sans-serif", fontSize: "22px", fontStyle: "bold", color: "#273043"
    }).setOrigin(0.5);
    c.add([glow, g, t]);
    c.label = t;
    c.glow = glow;
    s.tweens.add({ targets: glow, alpha: { from: 0.15, to: 1 }, duration: 450, yoyo: true, repeat: -1 });
    return c;
  }

  /** FINISH ARCH: checkered ground line, two pillars, curved arch, hanging banner, waving flags. */
  function finish(s) {
    const c = s.add.container(0, 0);
    const g = s.add.graphics();
    const checker = (x, y, w, h, cols, rows, a = 0x111111, b = 0xffffff) => {
      const cw = w / cols, ch = h / rows;
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        g.fillStyle((i + j) % 2 ? a : b, 1); g.fillRect(x + i * cw, y + j * ch, cw, ch);
      }
    };
    // checkered line across the whole road
    checker(-270, -16, 540, 16, 24, 2);
    // pillars with checkered pattern
    [-286, 258].forEach((x) => {
      checker(x, -230, 28, 230, 2, 14);
      g.fillStyle(0x1fd1c9, 1); g.fillRect(x - 4, -240, 36, 12);
    });
    // curved arch
    g.lineStyle(26, 0xffd93d, 1); g.beginPath(); g.arc(0, -226, 260, Math.PI, 0, false); g.strokePath();
    g.lineStyle(8, 0x273043, 1); g.beginPath(); g.arc(0, -226, 274, Math.PI, 0, false); g.strokePath();
    g.beginPath(); g.arc(0, -226, 247, Math.PI, 0, false); g.strokePath();
    // hanging banner
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(-166, -306, 340, 74, 12);
    g.fillStyle(0x1fd1c9, 1); g.fillRoundedRect(-170, -312, 340, 74, 12);
    g.lineStyle(5, 0xffffff, 1); g.strokeRoundedRect(-170, -312, 340, 74, 12);
    checker(-170, -312, 340, 12, 34, 1); checker(-170, -250, 340, 12, 34, 1);
    // lights on the arch
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      g.fillStyle(i % 2 ? 0xff6f6f : 0xffffff, 1); g.fillCircle(Math.cos(a) * 260, -226 + Math.sin(a) * 260, 6);
    }
    const t = s.add.text(0, -275, "FINISH", {
      fontFamily: "Verdana, sans-serif", fontSize: "46px", fontStyle: "bold", color: "#ffd93d", stroke: "#273043", strokeThickness: 8
    }).setOrigin(0.5);

    // two checkered flags on the pillars (they wave)
    const flags = [-272, 272].map((x, k) => {
      const f = s.add.graphics({ x, y: -240 });
      f.lineStyle(5, 0xeeeeee, 1); f.lineBetween(0, 0, 0, -80);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        f.fillStyle((i + j) % 2 ? 0x111111 : 0xffffff, 1); f.fillRect(i * 14, -80 + j * 14, 14, 14);
      }
      s.tweens.add({ targets: f, angle: { from: -6, to: 6 }, duration: 380 + k * 70, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      return f;
    });
    c.add([g, t, ...flags]);
    c.flags = flags;
    return c;
  }

  /** Builds a world object container for `type` (obstacle id, coin, board, finish, tree, lamp, building). */
  window.WorldFactory = {
    make(type, scene, theme) {
      let c;
      if (type === "board") c = board(scene);
      else if (type === "finish") c = finish(scene);
      else {
        const draw = ART[type] || SCENERY[type] || (type === "coin" ? coin : null);
        const g = draw(scene, theme);
        c = scene.add.container(0, 0, [g]);
        if (type === "barrel") { g.y = -28; c.gfx = g; } // child rotates = rolling
      }
      return c;
    }
  };
})();
