/* ======================================================
   MODAL VERBS ADVENTURE — victory.js  (PART 3)
   VictoryScene: shown after the player finishes all five levels.
   Totals are taken from the latest finished run of every level
   (saved in LocalStorage), so they survive a page refresh.
   ====================================================== */
(function () {
  "use strict";
  const W = 960, H = 540;

  const txt = (scene, x, y, s, size, color, extra) =>
    scene.add.text(x, y, s, Object.assign({
      fontFamily: "Verdana, sans-serif", fontSize: size + "px", fontStyle: "bold", color
    }, extra || {}));

  class VictoryScene extends Phaser.Scene {
    constructor() { super("VictoryScene"); }

    create() {
      AudioManager.attach(this);
      AudioManager.stopMusic();
      this.gameState = GAME_STATE.VICTORY;

      const totals = LevelManager.getVictoryTotals();
      LevelManager.recordVictory(totals.score);

      // background: royal gradient + slowly turning light rays
      const bg = this.add.graphics();
      const cols = [0x2a1458, 0x4a2d99, 0x7a4fd0, 0xa66bff, 0xd7a8ff];
      cols.forEach((c, i) => { bg.fillStyle(c, 1); bg.fillRect(0, (H / cols.length) * i, W, H / cols.length + 1); });
      const rays = this.add.graphics({ x: W / 2, y: 120 });
      rays.fillStyle(0xffe27a, 0.16);
      for (let i = 0; i < 12; i++) {
        const a0 = (i / 12) * Math.PI * 2, a1 = a0 + Math.PI / 12;
        rays.fillTriangle(0, 0, Math.cos(a0) * 900, Math.sin(a0) * 900, Math.cos(a1) * 900, Math.sin(a1) * 900);
      }
      this.tweens.add({ targets: rays, angle: 360, duration: 24000, repeat: -1 });

      // trophy
      const tr = this.add.graphics({ x: W / 2, y: 112 });
      tr.fillStyle(0xffe27a, 0.35); tr.fillCircle(0, -4, 62);
      tr.fillStyle(0xffd93d, 1);
      tr.fillRoundedRect(-30, -50, 60, 56, { tl: 6, tr: 6, bl: 30, br: 30 });
      tr.fillRect(-8, 6, 16, 18); tr.fillRoundedRect(-28, 24, 56, 12, 4);
      tr.lineStyle(8, 0xffd93d, 1);
      tr.strokeCircle(-36, -28, 14); tr.strokeCircle(36, -28, 14);
      tr.fillStyle(0xfff3a0, 1); tr.fillEllipse(-12, -26, 10, 28);
      this.tweens.add({ targets: tr, scale: { from: 0.95, to: 1.1 }, duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

      const title = txt(this, W / 2, 196, "VICTORY!", 80, "#ffd93d", { stroke: "#273043", strokeThickness: 12 }).setOrigin(0.5).setScale(0.2);
      this.tweens.add({ targets: title, scale: 1, duration: 700, ease: "Back.easeOut" });
      this.tweens.add({ targets: title, y: 204, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut", delay: 700 });
      txt(this, W / 2, 262, "YOU ARE A MODAL VERBS MASTER!", 26, "#ffffff", { stroke: "#273043", strokeThickness: 6 }).setOrigin(0.5);

      // the runner celebrates on both sides
      this.runners = [150, W - 150].map((x, i) => {
        const v = CharacterManager.createView(this);
        v.container.setPosition(x, 330);
        v.setState("JUMP");
        this.tweens.add({ targets: v.container, y: 290, duration: 520, yoyo: true, repeat: -1, ease: "Sine.easeOut", delay: i * 260 });
        return v;
      });

      // totals panel
      const rows = [
        ["Total Score", totals.score], ["Total Coins", totals.coins],
        ["Total Correct Answers", totals.correct], ["Total Wrong Answers", totals.wrong]
      ];
      drawPanel(this, W / 2, 362, 520, 160, 0xffffff, 0.97);
      rows.forEach(([l, v], i) => {
        const y = 314 + i * 32;
        txt(this, W / 2 - 220, y, l, 20, "#273043", { fontStyle: "normal" }).setOrigin(0, 0.5);
        txt(this, W / 2 + 220, y, String(v), 22, "#1f9d9a").setOrigin(1, 0.5);
      });

      createButton(this, W / 2 - 135, 490, 250, 46, "PLAY AGAIN", () => this.scene.start("GameScene", { levelKey: "level1" }), 0x4ecb52);
      createButton(this, W / 2 + 135, 490, 250, 46, "MAIN MENU", () => this.scene.start("MainMenuScene"), 0xff6f6f);

      // celebration particles (a new wave every moment)
      this.confetti(90);
      this.time.addEvent({ delay: 380, loop: true, callback: () => this.confetti(14) });
      AudioManager.playSfx("sfx_correct");
      this.time.delayedCall(350, () => AudioManager.playSfx("sfx_coin"));
      this.time.delayedCall(700, () => AudioManager.playSfx("sfx_correct"));
    }

    update(time, delta) {
      (this.runners || []).forEach((v) => v.update(delta / 1000));
    }

    confetti(n) {
      const cols = [0xff6f6f, 0xffd93d, 0x1fd1c9, 0x4ecb52, 0xffffff, 0xff9f43];
      for (let i = 0; i < n; i++) {
        const star = Math.random() < 0.25;
        const r = star
          ? this.add.star(Phaser.Math.Between(0, W), Phaser.Math.Between(-60, -10), 5, 4, 9, 0xffe27a)
          : this.add.rectangle(Phaser.Math.Between(0, W), Phaser.Math.Between(-60, -10), Phaser.Math.Between(6, 12),
              Phaser.Math.Between(10, 18), Phaser.Utils.Array.GetRandom(cols));
        r.setDepth(5).setAngle(Phaser.Math.Between(0, 360));
        this.tweens.add({
          targets: r, y: H + 30, x: r.x + Phaser.Math.Between(-120, 120), angle: r.angle + Phaser.Math.Between(180, 540),
          duration: Phaser.Math.Between(1800, 3200), delay: Phaser.Math.Between(0, 400), onComplete: () => r.destroy()
        });
      }
    }
  }

  window.VictoryScene = VictoryScene;
})();
