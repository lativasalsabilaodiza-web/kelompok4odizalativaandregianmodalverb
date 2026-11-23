/* ======================================================
   MODAL VERBS ADVENTURE — audio.js
   Central audio manager. Wraps Phaser's built-in sound
   system (which itself uses the Web Audio API) so every
   scene calls the same simple methods instead of talking
   to Phaser.sound directly.

   Settings (music / SFX volume, muted) persist in
   LocalStorage so they survive a page reload.
   ====================================================== */

window.AudioManager = (function () {
  const STORAGE_KEY = "mva_audio_settings";

  const defaults = {
    musicVolume: 0.6,
    sfxVolume: 0.8,
    masterVolume: 1,
    muted: false, muteMusic: false, muteSfx: false
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) {
      console.warn("AudioManager: could not read settings, using defaults.", e);
      return { ...defaults };
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
      console.warn("AudioManager: could not save settings.", e);
    }
  }

  let settings = loadSettings();

  /** Tiny synthesized SFX (Web Audio) used when no sound file is loaded,
   *  so collisions, coins etc. are audible without any assets. */
  const SYNTH = {
    sfx_hit: ["sawtooth", 200, 50, 0.28], sfx_coin: ["square", 880, 1320, 0.12],
    sfx_jump: ["sine", 300, 620, 0.18], sfx_slide: ["triangle", 420, 160, 0.2],
    sfx_board: ["sine", 500, 1000, 0.35], sfx_correct: ["sine", 660, 990, 0.3],
    sfx_wrong: ["sawtooth", 220, 110, 0.35], sfx_click: ["square", 600, 500, 0.05]
  };
  function synth(key) {
    const d = SYNTH[key];
    const ctx = scene && scene.sound && scene.sound.context;
    if (!d || !ctx || settings.muted || settings.sfxVolume <= 0) return;
    try {
      if (ctx.state === "suspended") ctx.resume();
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = d[0];
      o.frequency.setValueAtTime(d[1], t);
      o.frequency.exponentialRampToValueAtTime(d[2], t + d[3]);
      g.gain.setValueAtTime(0.25 * settings.sfxVolume, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d[3]);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + d[3] + 0.02);
    } catch (e) { /* audio is optional */ }
  }
  let scene = null;          // the Phaser scene currently driving sound
  let currentMusicKey = null;
  let musicInstance = null;
  const customAudio = new Map();
  const previewAudio = new Map();
  const keyToAsset = { bgm_menu:"music", sfx_run:"run", sfx_jump:"jump", sfx_slide:"slide", sfx_coin:"coin", sfx_correct:"correct", sfx_wrong:"wrong", sfx_hit:"collision", sfx_complete:"complete", sfx_gameover:"gameover", sfx_click:"click", sfx_board:"correct" };
  function effective(kind) {
    if (settings.muted || (kind === "music" ? settings.muteMusic : settings.muteSfx)) return 0;
    return (kind === "music" ? settings.musicVolume : settings.sfxVolume) * (settings.masterVolume ?? 1);
  }
  function playCustom(key, loop) {
    const a=customAudio.get(key); if(!a)return false;
    try { a.pause(); a.currentTime=0; a.loop=!!loop; a.volume=effective(loop?"music":"sfx"); a.play().catch(()=>{}); return true; } catch(e){return false;}
  }

  return {
    /** Call once per scene that needs audio (usually in create()). */
    attach(phaserScene) {
      scene = phaserScene;
    },

    setVolume(key,v) {
      settings[key]=Phaser.Math.Clamp(v,0,1);
      if(key==="masterVolume"||key==="musicVolume"||key==="sfxVolume") {
        if(musicInstance) { if(typeof musicInstance.setVolume==="function")musicInstance.setVolume(effective("music")); else musicInstance.volume=effective("music"); }
        customAudio.forEach((a,k)=>{a.volume=effective(k==="bgm_menu"?"music":"sfx");});
      }
      saveSettings(settings);
    },
    setMute(kind,value) { settings[kind==="music"?"muteMusic":"muteSfx"]=!!value; if(kind==="music"&&musicInstance){if(typeof musicInstance.setVolume==="function")musicInstance.setVolume(effective("music"));else musicInstance.volume=effective("music");} customAudio.forEach((a,k)=>{a.volume=effective(k==="bgm_menu"?"music":"sfx");}); saveSettings(settings); },
    async loadCustom(key,file) {
      const old=customAudio.get(key); if(old){old.pause();URL.revokeObjectURL(old.src);}
      const blob=file instanceof Blob?file:file.blob; const url=URL.createObjectURL(blob);
      const a=new Audio(url);a.preload="auto";customAudio.set(key,a);
      if(key==="bgm_menu"&&currentMusicKey==="bgm_menu")this.playMusic(key);
    },
    async restoreCustom(key) {
      if(!window.MVAStore)return; const id=keyToAsset[key]; if(!id)return;
      const saved=await window.MVAStore.get("audio_"+id); if(saved) await this.loadCustom(key,saved.blob);
    },
    resetCustom(key) {const a=customAudio.get(key);if(a){a.pause();URL.revokeObjectURL(a.src);customAudio.delete(key);}},
    preview(key) { const a=customAudio.get(key); if(a){const copy=new Audio(a.src);copy.volume=effective(key==="bgm_menu"?"music":"sfx");copy.play().catch(()=>{});previewAudio.set(key,copy);copy.onended=()=>previewAudio.delete(key);} else this.playSfx(key); },
    stopSfx(key) { const a=customAudio.get(key); if(a){a.pause();a.currentTime=0;} },
    stopAll() { customAudio.forEach(a=>{a.pause();a.currentTime=0;}); previewAudio.forEach(a=>{a.pause();a.currentTime=0;}); if(musicInstance){if(typeof musicInstance.stop==="function")musicInstance.stop();else musicInstance.pause();} },
    getSettings() {
      return { ...settings };
    },

    setMusicVolume(v) {
      settings.musicVolume = Phaser.Math.Clamp(v, 0, 1);
      if (musicInstance) { const v=(settings.muted || settings.muteMusic) ? 0 : settings.musicVolume * (settings.masterVolume ?? 1); if(typeof musicInstance.setVolume==="function")musicInstance.setVolume(v);else musicInstance.volume=v; }
      saveSettings(settings);
    },

    setSfxVolume(v) {
      settings.sfxVolume = Phaser.Math.Clamp(v, 0, 1);
      saveSettings(settings);
    },

    setMuted(muted) {
      settings.muted = !!muted;
      if (musicInstance) { const v=(settings.muted || settings.muteMusic) ? 0 : settings.musicVolume * (settings.masterVolume ?? 1); if(typeof musicInstance.setVolume==="function")musicInstance.setVolume(v);else musicInstance.volume=v; }
      saveSettings(settings);
    },

    /** Plays/loops a background track. Safe to call even if the key
     *  hasn't been loaded yet (placeholder assets stage). */
    playMusic(key) {
      if (customAudio.has(key)) { this.stopMusic(); playCustom(key,true); currentMusicKey=key; musicInstance=customAudio.get(key); return; }
      if (!scene || !scene.sound) return;
      if (currentMusicKey === key && musicInstance && musicInstance.isPlaying) return;
      if (musicInstance) musicInstance.stop();

      if (!scene.cache.audio.exists(key)) {
        // Asset not present yet (Part 1 foundation stage) — fail silently.
        currentMusicKey = key;
        return;
      }

      musicInstance = scene.sound.add(key, {
        loop: true,
        volume: (settings.muted || settings.muteMusic) ? 0 : settings.musicVolume * (settings.masterVolume ?? 1)
      });
      musicInstance.play();
      currentMusicKey = key;
    },

    stopMusic() {
      if (musicInstance) { if(typeof musicInstance.stop==="function")musicInstance.stop(); else {musicInstance.pause();musicInstance.currentTime=0;} }
      currentMusicKey = null;
    },

    /** Plays a one-shot sound effect if it has been loaded. */
    playSfx(key) {
      if (key==="sfx_run") { if(customAudio.has(key)){const a=customAudio.get(key);if(a.paused){a.loop=true;a.volume=effective("sfx");a.play().catch(()=>{});}return;} }
      if (customAudio.has(key)) { playCustom(key,false); return; }
      if (!scene || !scene.sound) return;
      if (!scene.cache.audio.exists(key)) { synth(key); return; }
      scene.sound.play(key, { volume: (settings.muted || settings.muteSfx) ? 0 : settings.sfxVolume * (settings.masterVolume ?? 1) });
    }
  };
})();
