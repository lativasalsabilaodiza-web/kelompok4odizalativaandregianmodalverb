/* ======================================================
   MODAL VERBS ADVENTURE — character.js
   Defines the playable character roster and handles
   which one is currently selected (saved to LocalStorage).

   Real sprite sheets go in assets/characters/. Until that
   art exists, CharacterManager.drawPlaceholder() procedurally
   draws a simple, colorful cartoon runner with Phaser
   Graphics so the game is always playable, never a blank
   box.
   ====================================================== */

window.CHARACTERS = [
  {
    id: "lexi",
    name: "Lexi the Explorer",
    color: 0xff6f6f,
    accent: 0xffd93d,
    unlocked: true,
    description: "A curious adventurer who loves grammar puzzles."
  },
  {
    id: "milo",
    name: "Milo the Runner",
    color: 0x4ecdc4,
    accent: 0xffffff,
    unlocked: true,
    description: "Fast on his feet, faster with his modal verbs."
  },
  {
    id: "nova",
    name: "Nova the Scholar",
    color: 0xa66bff,
    accent: 0xffd93d,
    unlocked: false,
    description: "Unlocks after completing Level 3."
  }
];

window.CharacterManager = (function () {
  const STORAGE_KEY = "mva_selected_character";

  function getSelectedId() {
    try {
      return localStorage.getItem(STORAGE_KEY) || "lexi";
    } catch (e) {
      return "lexi";
    }
  }

  function setSelectedId(id) {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch (e) {
      console.warn("CharacterManager: could not save selection.", e);
    }
  }

  function getById(id) {
    return window.CHARACTERS.find((c) => c.id === id) || window.CHARACTERS[0];
  }

  /**
   * Procedurally draws a simple rounded-cartoon runner placeholder
   * at (x, y) using the character's colors. Returns the Phaser
   * Graphics object so the caller can tween/animate or destroy it.
   */
  function drawPlaceholder(scene, x, y, character, scale = 1) {
    const g = scene.add.graphics({ x, y });
    const c = character || getById(getSelectedId());

    // body
    g.fillStyle(c.color, 1);
    g.fillRoundedRect(-18 * scale, -40 * scale, 36 * scale, 56 * scale, 12 * scale);

    // head
    g.fillStyle(0xffe0bd, 1);
    g.fillCircle(0, -52 * scale, 16 * scale);

    // accent stripe
    g.fillStyle(c.accent, 1);
    g.fillRoundedRect(-18 * scale, -10 * scale, 36 * scale, 10 * scale, 4 * scale);

    // legs
    g.fillStyle(0x333333, 1);
    g.fillRoundedRect(-16 * scale, 16 * scale, 12 * scale, 22 * scale, 4 * scale);
    g.fillRoundedRect(4 * scale, 16 * scale, 12 * scale, 22 * scale, 4 * scale);

    return g;
  }

  return { getSelectedId, setSelectedId, getById, drawPlaceholder };
})();

/* ======================================================
   PART 2 — Character system for real gameplay
   Supports 3 art modes, chosen automatically per character:
     1. SPRITE SHEET  -> character.spritesheet = {
          key, url, frameWidth, frameHeight, columns, rows,
          frameRate, displayHeight,
          animations: { idle:{start,end,frameRate,repeat}, run:{...},
                        jump:{...}, slide:{...}, hit:{...} }   // optional
        }
        If `animations` is omitted, each ROW is one animation in the
        order idle, run, jump, slide, hit (all `columns` frames used).
     2. CUSTOM / TRANSPARENT PNG -> character.png = { key, url, displayHeight }
     3. DEFAULT  -> procedural cartoon runner (no files needed)
   Put files in assets/characters/ and add the fields to the
   CHARACTERS entry above. If a file is missing, it falls back
   to the default runner automatically.
   ====================================================== */
CharacterManager.preload = function (scene) {
  window.CHARACTERS.forEach((c) => {
    if (c.spritesheet && c.spritesheet.url) {
      scene.load.spritesheet(c.spritesheet.key, c.spritesheet.url, {
        frameWidth: c.spritesheet.frameWidth,
        frameHeight: c.spritesheet.frameHeight
      });
    } else if (c.png && c.png.url) {
      scene.load.image(c.png.key, c.png.url);
    }
  });
};

/** CharacterView: the in-game runner. Origin is the FEET (0,0), art grows upward.
 *  States: IDLE, RUN, JUMP, SLIDE, HIT.  Call setState() + update(dt). */
class CharacterView {
  constructor(scene, character) {
    this.scene = scene;
    this.char = character;
    this.state = "";
    this.t = 0;
    this.container = scene.add.container(0, 0);
    const sh = character.spritesheet, png = character.png;
    if (sh && scene.textures.exists(sh.key)) {
      this.mode = "sheet";
      this._makeAnims(sh);
      this.sprite = scene.add.sprite(0, 0, sh.key).setOrigin(0.5, 1);
      this.baseScale = (sh.displayHeight || 110) / sh.frameHeight;
      this.sprite.setScale(this.baseScale);
      this.container.add(this.sprite);
    } else if (png && scene.textures.exists(png.key)) {
      this.mode = "png";
      this.sprite = scene.add.image(0, 0, png.key).setOrigin(0.5, 1);
      this.baseScale = (png.displayHeight || 110) / this.sprite.height;
      this.sprite.setScale(this.baseScale);
      this.container.add(this.sprite);
    } else {
      this.mode = "default";
      this.g = scene.add.graphics();
      this.container.add(this.g);
    }
    this.setState("IDLE");
  }

  _makeAnims(sh) {
    const cols = sh.columns || 1;
    ["idle", "run", "jump", "slide", "hit"].forEach((n, i) => {
      const key = sh.key + "_" + n;
      if (this.scene.anims.exists(key)) return;
      const a = (sh.animations && sh.animations[n]) || { start: i * cols, end: i * cols + cols - 1 };
      this.scene.anims.create({
        key,
        frames: this.scene.anims.generateFrameNumbers(sh.key, { start: a.start, end: a.end }),
        frameRate: a.frameRate || sh.frameRate || 10,
        repeat: a.repeat !== undefined ? a.repeat : (n === "run" || n === "idle" ? -1 : 0)
      });
    });
  }

  setState(s) {
    if (s === this.state) return;
    this.state = s;
    this.t = 0;
    if (this.mode === "sheet") this.sprite.play(this.char.spritesheet.key + "_" + s.toLowerCase(), true);
  }

  update(dt) {
    this.t += dt;
    if (this.mode === "default") return this._drawDefault();
    if (this.mode === "png") {
      const b = this.baseScale, st = this.state, sp = this.sprite;
      sp.setAngle(st === "HIT" ? Math.sin(this.t * 40) * 10 : 0);
      sp.y = st === "RUN" ? -Math.abs(Math.sin(this.t * 15)) * 5 : 0;
      sp.setScale(b * (st === "SLIDE" ? 1.15 : 1), b * (st === "SLIDE" ? 0.55 : st === "JUMP" ? 1.05 : 1));
    }
  }

  _drawDefault() {
    const g = this.g, c = this.char, st = this.state, t = this.t;
    g.clear();
    g.setAngle(0);
    g.setPosition(0, -24); // hip is the local origin
    let la = 0, ra = 0, bob = 0;
    if (st === "RUN") { const p = t * 15; la = Math.sin(p) * 12; ra = -la; bob = -Math.abs(Math.sin(p)) * 4; }
    else if (st === "IDLE") bob = Math.sin(t * 4) * 2;
    else if (st === "JUMP") { la = 10; ra = -8; }
    else if (st === "SLIDE") { g.setAngle(-78); g.setPosition(16, -14); }
    else if (st === "HIT") g.setAngle(Math.sin(t * 40) * 10);

    const body = st === "HIT" ? 0xff5555 : c.color;
    g.fillStyle(0x333333, 1); // legs
    g.fillRoundedRect(-16, 0, 12, 24 - Math.max(0, la) * 0.7, 4);
    g.fillRoundedRect(4, 0, 12, 24 - Math.max(0, ra) * 0.7, 4);
    g.fillStyle(body, 1); // arms + body
    g.fillRoundedRect(-27, -50 + bob + la * 0.5, 9, 26, 4);
    g.fillRoundedRect(18, -50 + bob + ra * 0.5, 9, 26, 4);
    g.fillRoundedRect(-18, -54 + bob, 36, 54, 12);
    g.fillStyle(c.accent, 1);
    g.fillRoundedRect(-18, -22 + bob, 36, 9, 4);
    g.fillStyle(0xffe0bd, 1); // head
    g.fillCircle(0, -68 + bob, 16);
    g.fillStyle(c.accent, 1); // cap
    g.beginPath(); g.arc(0, -71 + bob, 16, Math.PI, 0, false); g.closePath(); g.fillPath();
    g.fillStyle(0x222222, 1); // eyes
    g.fillCircle(-5, -66 + bob, 2.2);
    g.fillCircle(5, -66 + bob, 2.2);
  }

  destroy() { this.container.destroy(); }
}
window.CharacterView = CharacterView;
CharacterManager.createView = (scene, character) =>
  new CharacterView(scene, character || CharacterManager.getById(CharacterManager.getSelectedId()));
