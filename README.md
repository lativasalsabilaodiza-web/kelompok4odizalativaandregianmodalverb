# Modal Verbs Adventure

A 2D/2.5D endless-runner style educational web game built with **HTML5, CSS3,
JavaScript (ES6+) and Phaser 3**, teaching English modal verbs (can/could,
may/might, must/should, will/would) through five playable levels.

This is **Part 1**: the full foundation, main menu, navigation system,
tutorial, and level selection — all genuinely working, nothing mocked.
The endless-runner gameplay itself (lane running, obstacles, jump boards,
question gates, scoring) is built in Part 2 on top of this structure.

## How to run

Because the game loads Phaser from a CDN and reads/writes `localStorage`,
serve the folder over HTTP rather than opening `index.html` directly with
`file://` (some browsers block localStorage/audio under `file://`).

Any static server works, for example:

```bash
cd modal-verbs-adventure
python3 -m http.server 8080
# then open http://localhost:8080
```

## Project structure

```
modal-verbs-adventure/
│
├── index.html        → page shell, loads Phaser + all scripts, mobile control buttons
├── style.css          → responsive layout, mobile control button styling
├── game.js            → Phaser config, GAME_STATE enum, all scenes (menu, level select,
│                         character select, how-to-play, settings, gameplay placeholder)
├── questions.js       → QUESTION_BANK: modal-verb questions for all 5 levels
├── character.js       → CHARACTERS roster + CharacterManager (selection, placeholder art)
├── level.js           → LEVELS data + LevelManager (unlock/completion progress)
├── audio.js           → AudioManager (music/SFX, uploaded audio and volume controls)
├── customization.js   → five character slots, IndexedDB uploads, audio upload UI
├── backgrounds.js     → per-level background manifest and parallax layer loader
│
├── assets/
│   ├── backgrounds/   → drop background art/sprites here when ready
│   ├── characters/    → character spritesheets go here
│   ├── audio/         → music + sfx files go here
│   ├── obstacles/     → obstacle sprites (Part 2)
│   ├── objects/       → coins, jump boards, signboards, etc.
│   └── ui/            → UI icon art, logo, etc.
│
└── README.md
```

## What's implemented in Part 1

- **Main Menu** — title, subtitle, animated character preview, animated clouds,
  4 fully working buttons (Play Game, Character, How to Play, Settings).
- **Navigation system** — every screen can be reached and returned from via a
  working BACK button; state transitions use Phaser's scene manager.
- **How to Play** — tutorial screen (in English) listing keyboard controls,
  mobile controls, and the core goals.
- **Level Select** — 5 level cards (Can & Could, May & Might, Must & Should,
  Will & Would, Modal Verbs Master) with name, target score, environment
  theme color, and LOCKED/UNLOCKED state driven by real `localStorage`
  progress (`level.js`).
- **Character Select** — pick between unlockable characters, selection is
  saved and reflected on the main menu.
- **Settings** — working music/SFX volume sliders and mute toggle, persisted
  to `localStorage` via `AudioManager`.
- **Gameplay placeholder** — pressing PLAY on an unlocked level actually
  loads that level's scene, shows its data, and wires up real keyboard
  (arrow keys + Space) and mobile touch controls so Part 2 can plug the
  endless-runner mechanics straight in. A "Complete Level (Demo)" button
  lets you test the unlock chain end-to-end right now.
- **Responsive design** — Phaser's Scale Manager (`FIT` + `CENTER_BOTH`)
  keeps the game centered and scaled on desktop, tablet, and phones; CSS
  handles the on-screen mobile control buttons (shown automatically on
  touch devices).
- No copyrighted Subway Surfers assets — every visual (sky, road, trees,
  buildings, fence, lamps, coins, characters, UI panels) is original,
  procedurally drawn vector art in the project's own turquoise / green /
  yellow / white palette, so the game is fully playable even before final
  art assets are dropped into `assets/`.

## Coming in Part 2

- Real endless-runner mechanics: 3-lane running, jumping, sliding,
  obstacles, coin collection, jump boards.
- Question gates that pull from `questions.js` and pause the run.
- Scoring, `LEVEL_COMPLETED` / `GAME_OVER` / `VICTORY` screens.
- Final character and background art replacing the procedural placeholders
  (drop files into `assets/` — the loader hooks are already in
  `BootScene.preload()` in `game.js`).

## Easy things to customize

- **Colors/theme** — `CONFIG.COLORS` at the top of `game.js`.
- **Levels** — edit the `window.LEVELS` array in `level.js`.
- **Questions** — edit `window.QUESTION_BANK` in `questions.js`.
- **Characters** — edit the `window.CHARACTERS` array in `character.js`.
- **Base resolution** — `CONFIG.WIDTH` / `CONFIG.HEIGHT` in `game.js`.

## PART 2 — Core gameplay (implemented)

- `gameplay.js` — `GameScene`: 2.5D 3-lane endless runner (projection-based), smooth lane
  switching, jump/slide with durations + gravity + cooldowns, lives/invulnerability, HUD,
  pause menu (Resume/Restart/Settings/Main Menu), Game Over, Level Complete, question panel.
- `obstacles.js` — `OBSTACLE_DEFS` (barrier, moving box, cones, rolling barrel, gap, hurdle,
  moving overhead obstacle) with hitboxes + art, coins, JUMP BOARD, finish line, scenery.
- `character.js` — `CharacterView` (IDLE/RUN/JUMP/SLIDE/HIT) with default art, custom/transparent
  PNG (`png: {key,url,displayHeight}`) or sprite sheet (`spritesheet: {key,url,frameWidth,
  frameHeight,columns,rows,frameRate,displayHeight,animations}`), set on a CHARACTERS entry.
- `audio.js` — missing SFX files fall back to small synthesized sounds (hit, coin, jump, slide, board...).
- Controls: arrows / WASD, SPACE or P = pause, on-screen buttons and swipe on mobile.

## PART 3 — Questions, levels, scoring, finish line (implemented)

Everything is integrated into the Part 2 gameplay; nothing was recreated.

| File | What changed |
|------|--------------|
| `questions.js` | 60 questions (12 per level) in the `{id, level, category, question, options:{A,B,C,D}, correctAnswer, explanation}` format + `QuestionManager` (random, no repeats, per-level bank, session history, `validate()`). |
| `level.js` | 5 levels with environment, distance (1000/1200/1400/1600/2000 m), 10 checkpoints; LocalStorage: unlocked/completed levels, level progress (best %), best score per level, last finished result, highest score, total coins. |
| `gameplay.js` | 5 themed worlds, per-level difficulty (`LEVEL_CFG`), question checkpoints, question panel, scoring, distance HUD, finish line, LEVEL COMPLETED, GAME OVER. |
| `obstacles.js` | New scenery per level, finish arch (banner + checkered flags + lights). |
| `victory.js` | `VictoryScene` (VICTORY! screen). |
| `game.js` | Level select shows environment / distance / best score / progress; main menu shows high score + coins; scene list. |

### Levels
1. **Can & Could** — Sunny Adventure Park (1000 m, slow, 3 easy obstacle types)
2. **May & Might** — Mystery Forest (1200 m, faster, + barrels and gaps)
3. **Must & Should** — Learning City (1400 m, + moving obstacles)
4. **Will & Would** — Sky Adventure World (1600 m, higher speed, double-row patterns)
5. **Modal Verbs Master** — Ultimate Modal Kingdom (2000 m, max speed, all obstacles, most patterns)

Distance: 50 world units = 1 meter. 10 checkpoints are spaced evenly (`distance * i / 11`), so
all of them are always met before the finish line.

### Question flow
Touch a QUESTION board -> game pauses -> centered panel with A/B/C/D (click, or press A-D / 1-4)
-> cannot be closed without answering -> feedback + explanation -> CONTINUE.
* Correct: +100 score, +1 bonus coin, "CORRECT ANSWER!", correct sound.
* Wrong: -1 life, "WRONG ANSWER!", shows the correct answer, wrong sound. Losing the last life = GAME OVER.
* A checkpoint can fire only once. Retrying a level resets its question bank.
* Answer order is shuffled at play time; `correctAnswer` is recalculated, explanations never mention letters.

### Scoring
`score = correct answers x 100 + collected coins x 10`. Total coins = collected coins + bonus coins.
Level completion time counts running + answering time, not pause time.

### Saving (LocalStorage)
`mva_progress` (per level: unlocked, completed, bestScore, bestProgress, lastResult) and
`mva_stats` (highestScore, totalCoins, bestVictoryScore). The VICTORY screen sums the latest
finished result of every level.

### Developer tips
* Check the bank in the browser console: `QuestionManager.validate()` -> `[]` means valid.
* Reset all saved data: `LevelManager.resetProgress()`.
* Ready for Part 4: difficulty is data-driven (`LEVEL_CFG`, `THEMES` in `gameplay.js`).


## PART 4 — Customization, audio uploads and mobile polish

### Run locally

From the project folder:

```bash
python -m http.server 8000
```

Open **http://localhost:8000**. (On some systems use `python3 -m http.server 8000`.)

Use HTTPS or localhost for browser storage and audio APIs. Phaser is loaded from the pinned CDN, so the first run requires an internet connection.

### Mobile play

The game uses Phaser `Scale.FIT` and a responsive full-screen container. On touch devices the four on-screen controls appear during gameplay; swipe left/right changes lanes, swipe up jumps, and swipe down slides. Use landscape orientation for the clearest view of the 16:9 runner. Buttons have large touch targets and respect phone safe-area spacing.

### Character customization

1. Open **CHARACTER** from the main menu, then choose **CUSTOMIZE / UPLOAD**.
2. Choose one of five slots, type its name, and upload a transparent PNG.
3. For a static character, leave Columns and Rows at `1`. A single PNG is used with lightweight bob/run/slide effects.
4. For a sprite sheet, set Frame width, Frame height, Columns, Rows and Frame rate. The sheet must contain at least `frameWidth × columns` by `frameHeight × rows` pixels.
5. Edit Animation mapping as JSON. The five names are `idle`, `run`, `jump`, `slide`, and `hit`; each entry uses `start` and `end` frame indexes and may include `frameRate` and `repeat`.
6. Apply Character. The browser reloads once so Phaser preloads the saved texture. The selected uploaded character is then used by the gameplay `CharacterView`, not just shown in the editor.
7. Reset clears that slot and returns selection to the built-in default.

Character files and metadata are stored as Blobs in IndexedDB (`mva_assets_v1`), not LocalStorage. The built-in roster remains available.

### Character asset guide

Put developer-managed art in `/assets/characters/`. Suggested names: `character_1.png` through `character_5.png`. Use PNG with transparency, no background, a forward-facing character, and consistent sprite-sheet frame dimensions. Recommended static art size: 512×512. Uploaded files are stored in IndexedDB; the folder is the recommended location for version-controlled default assets.

### Audio uploads and controls

Open **SETTINGS → AUDIO UPLOADS / ADVANCED**, or the AUDIO SETTINGS tab in the customization window. Upload MP3, WAV or OGG for Background Music, Running, Jump, Slide, Coin, Correct, Wrong, Collision, Level Complete, Game Over and Button Click. Preview, replace and reset each sound independently. Uploaded audio Blobs are saved in IndexedDB and restored after reload. Music and SFX have separate sliders and mute controls, plus Master Volume. The original in-game sound synthesis remains as fallback when no upload exists.

Audio starts only after browser user interaction where required by autoplay policies. The running loop is started during active running and stopped on pause, question, end screen or scene shutdown.

### Backgrounds and parallax

Background asset configuration is in `backgrounds.js`; it is separate from gameplay logic. Drop assets into `/assets/backgrounds/`, then set the matching level's `enabled` value to `true` in `LEVEL_BACKGROUND_CONFIG`. Supported paths include `level_1_background.png` … `level_5_background.png`. Level 1 also demonstrates optional Sky, Mountains, Buildings, Trees and Road layers with independent parallax speeds. Missing layers are skipped. When disabled, the original procedural level backgrounds are used.

### Editing learning content and difficulty

- Add or edit questions in `questions.js` inside the relevant level question bank. Preserve the question object fields and four answer choices.
- Edit `distance`, `checkpoints`, and `targetScore` for each level in `level.js`.
- Per-level movement difficulty (base speed, ramp and maximum extra speed) is configured in `gameplay.js` in `LEVEL_CFG`.
- Environment palettes and procedural background builders are in `gameplay.js`.
- Uploaded characters use the CharacterManager and CharacterView in `character.js`; animation state names must remain `IDLE`, `RUN`, `JUMP`, `SLIDE`, and `HIT`.

### Storage

- LocalStorage: level unlocks, scores, selected character ID, and audio settings.
- IndexedDB database `mva_assets_v1`, object store `assets`: uploaded character images and audio blobs.
- Clearing browser site data will remove local saves and uploaded assets. Export your original art/audio files separately for backup.

### Part 4 implementation notes

- Added a five-slot upload/customization workspace and real IndexedDB persistence.
- Character uploads are preloaded into Phaser and used by the gameplay character renderer.
- Added an audio asset library with upload, preview, replace, reset, event mapping, master/music/SFX volume and independent mute.
- Added a configurable background asset manifest with optional parallax layers and procedural fallback.
- Added responsive modal layouts and mobile touch/swipe support styling.

### Final test checklist

- [x] Existing project modules retained; all JavaScript files pass `node --check`.
- [x] Main menu's Character and Settings navigation retained; customization entry points added.
- [x] Five upload slots, PNG validation, preview, name, animation grid/mapping, apply and reset implemented.
- [x] IndexedDB stores image/audio Blobs; startup restores saved character textures and audio.
- [x] Audio upload/preview/replace/reset and volume/mute controls implemented.
- [x] Gameplay audio hooks connected for running, jump, slide, coin, answer, collision and completion/game-over.
- [x] Background manifest, asset paths and parallax layer configuration added.
- [x] Mobile controls remain connected to gameplay and swipe gestures; responsive CSS added.
- [x] All project JavaScript passes syntax checks.

A full device/browser play-through (especially real audio codecs, large sprite sheets, and touch hardware) still needs to be performed in the target browser; syntax validation is not a substitute for manual runtime QA.
