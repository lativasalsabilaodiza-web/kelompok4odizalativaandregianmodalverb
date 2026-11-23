/* MODAL VERBS ADVENTURE — Part 4 customization and persistent asset storage */
(function(){
"use strict";
const DB_NAME="mva_assets_v1", STORE="assets";
function db(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function put(key,value){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).put(value,key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
async function get(key){const d=await db();return new Promise((res,rej)=>{const r=d.transaction(STORE).objectStore(STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function del(key){const d=await db();return new Promise((res,rej)=>{const t=d.transaction(STORE,"readwrite");t.objectStore(STORE).delete(key);t.oncomplete=()=>res();t.onerror=()=>rej(t.error);});}
const slots=Array.from({length:5},(_,i)=>({id:"custom_"+(i+1),name:"Character Slot "+(i+1),slot:i+1,kind:"empty"}));
const audioDefs=[
["music","Background Music","bgm_menu"],["run","Running Sound","sfx_run"],["jump","Jump Sound","sfx_jump"],
["slide","Slide Sound","sfx_slide"],["coin","Coin Collection Sound","sfx_coin"],["correct","Correct Answer Sound","sfx_correct"],
["wrong","Wrong Answer Sound","sfx_wrong"],["collision","Collision Sound","sfx_hit"],["complete","Level Complete Sound","sfx_complete"],
["gameover","Game Over Sound","sfx_gameover"],["click","Button Click Sound","sfx_click"]
];
window.MVAStore={put,get,del,slots,audioDefs};
async function readSlots(){
 for(const s of slots){const a=await get("character_"+s.slot);if(a){s.name=a.name;s.kind=a.kind;s.data=a.data;s.frameWidth=a.frameWidth;s.frameHeight=a.frameHeight;s.columns=a.columns;s.rows=a.rows;s.frameRate=a.frameRate;s.mapping=a.mapping;s.unlocked=true;
   if(a.kind==="sheet")s.spritesheet={key:s.id+"_sheet",url:a.data,frameWidth:a.frameWidth,frameHeight:a.frameHeight,columns:a.columns,rows:a.rows,frameRate:a.frameRate,displayHeight:120,animations:a.mapping};
   else s.png={key:s.id+"_png",url:a.data,displayHeight:120};
 }}
 const base=window.CHARACTERS||[];window.CHARACTERS=base.filter(c=>!c.id.startsWith("custom_")).concat(slots.filter(s=>s.kind!=="empty"));
}
window.MVAStore.ready=readSlots();
window.openMvaCustomizer=function(tab){
 const root=document.getElementById("mva-customizer");if(!root)return;
 root.classList.remove("hidden");root.dataset.tab=tab||"characters";render();
};
function close(){document.getElementById("mva-customizer").classList.add("hidden");}
function el(tag,attrs={},html=""){const n=document.createElement(tag);Object.entries(attrs).forEach(([k,v])=>k==="class"?n.className=v:k==="text"?n.textContent=v:n.setAttribute(k,v));n.innerHTML=html;return n;}
function render(){
 const root=document.getElementById("mva-customizer");root.innerHTML="";
 const shell=el("section",{class:"mva-modal"});
 const head=el("header",{class:"mva-modal-head"});head.append(el("h2",{text:"ADVENTURE CUSTOMIZATION"}));
 const closeBtn=el("button",{class:"mva-close",type:"button",text:"✕"});closeBtn.onclick=close;head.append(closeBtn);shell.append(head);
 const tabs=el("nav",{class:"mva-tabs"});[["characters","CHARACTERS"],["audio","AUDIO SETTINGS"],["guide","ASSET GUIDE"]].forEach(([id,label])=>{const b=el("button",{type:"button",text:label,class:root.dataset.tab===id?"active":""});b.onclick=()=>{root.dataset.tab=id;render();};tabs.append(b);});shell.append(tabs);
 const body=el("div",{class:"mva-modal-body"});
 if(root.dataset.tab==="characters")renderCharacters(body);
 else if(root.dataset.tab==="audio")renderAudio(body);
 else renderGuide(body);
 shell.append(body);root.append(shell);
}
function renderCharacters(body){
 const grid=el("div",{class:"mva-slot-grid"});
 slots.forEach(s=>{
 const card=el("article",{class:"mva-slot"});
 const preview=el("div",{class:"mva-preview"});
 if(s.data){const img=el("img",{alt:s.name,src:s.data});preview.append(img);}else preview.textContent="🧑‍🚀";
 card.append(preview);
 const name=el("input",{type:"text",maxlength:"28",value:s.name,placeholder:"Character name"});card.append(name);
 name.onchange=async()=>{s.name=name.value.trim()||("Character Slot "+s.slot);const saved=await get("character_"+s.slot);if(saved){saved.name=s.name;await put("character_"+s.slot,saved);}};
 const status=el("small",{text:s.kind==="empty"?"Empty slot":s.kind==="sheet"?"Sprite sheet":"Static PNG"});card.append(status);
 const file=el("input",{type:"file",accept:".png,image/png",class:"mva-file"});card.append(file);
 const upload=el("button",{type:"button",text:"Upload PNG / Sprite Sheet"});upload.onclick=()=>file.click();card.append(upload);
 const cfg=el("div",{class:"mva-config"});
 cfg.innerHTML='<label>Frame width <input type="number" min="1" value="'+(s.frameWidth||128)+'"></label><label>Frame height <input type="number" min="1" value="'+(s.frameHeight||128)+'"></label><label>Columns <input type="number" min="1" value="'+(s.columns||1)+'"></label><label>Rows <input type="number" min="1" value="'+(s.rows||1)+'"></label><label>Frame rate <input type="number" min="1" max="60" value="'+(s.frameRate||10)+'"></label><label>Animation mapping (JSON)<textarea rows="3">'+JSON.stringify(s.mapping||{idle:{start:0,end:0},run:{start:0,end:0},jump:{start:0,end:0},slide:{start:0,end:0},hit:{start:0,end:0}})+'</textarea></label>';
 card.append(cfg);
 file.onchange=async()=>{
  const f=file.files[0];if(!f)return;if(f.type!=="image/png"){alert("Please choose a PNG image.");return;}
  const data=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f);});
  const im=new Image();im.onload=async()=>{
   const inputs=cfg.querySelectorAll("input");let fw=+inputs[0].value,fh=+inputs[1].value,cols=+inputs[2].value,rows=+inputs[3].value,rate=+inputs[4].value;
   let mapping;try{mapping=JSON.parse(cfg.querySelector("textarea").value);}catch(e){alert("Animation mapping must be valid JSON.");return;}
   const isSheet=cols*rows>1;
   if(isSheet&&(im.width<fw*cols||im.height<fh*rows)){alert("Sprite sheet dimensions are smaller than the configured grid.");return;}
   Object.assign(s,{name:name.value||f.name.replace(/\.png$/i,""),kind:isSheet?"sheet":"png",data,frameWidth:fw,frameHeight:fh,columns:cols,rows,frameRate:rate,mapping,unlocked:true});
   await put("character_"+s.slot,{name:s.name,kind:s.kind,data,frameWidth:fw,frameHeight:fh,columns:cols,rows,frameRate:rate,mapping});
   alert("Character saved. It will be loaded into gameplay now.");location.reload();
  };im.onerror=()=>alert("Could not read this PNG.");im.src=data;
 };
 const row=el("div",{class:"mva-actions"});
 const select=el("button",{type:"button",text:"Select Slot"});select.onclick=()=>{window.MVASelectedSlot=s.slot;document.querySelectorAll(".mva-slot").forEach(n=>n.classList.remove("selected"));card.classList.add("selected");};row.append(select);
 const apply=el("button",{type:"button",text:"Apply Character"});apply.onclick=async()=>{if(!s.data){alert("Upload a character to this slot first.");return;}s.name=name.value.trim()||s.name;const saved=await get("character_"+s.slot);if(saved){saved.name=s.name;await put("character_"+s.slot,saved);}localStorage.setItem("mva_selected_character",s.id);alert(s.name+" applied to gameplay.");};row.append(apply);
 const reset=el("button",{type:"button",text:"Reset"});reset.onclick=async()=>{await del("character_"+s.slot);localStorage.setItem("mva_selected_character","lexi");location.reload();};row.append(reset);card.append(row);grid.append(card);
 });body.append(grid);
 body.append(el("p",{class:"mva-note",text:"After uploading, the page reloads once so Phaser can preload the stored character texture. Your upload remains in IndexedDB."}));
}
function renderAudio(body){
 const settings=AudioManager.getSettings();
 const controls=el("div",{class:"mva-audio-controls"});
 [["Master Volume","masterVolume"],["Music Volume","musicVolume"],["SFX Volume","sfxVolume"]].forEach(([label,key])=>{const wrap=el("label",{class:"mva-range"});wrap.append(el("span",{text:label}));const input=el("input",{type:"range",min:"0",max:"1",step:"0.01",value:settings[key]??1});input.oninput=()=>AudioManager.setVolume(key,+input.value);wrap.append(input);controls.append(wrap);});
 const m=el("button",{type:"button",text:settings.muteMusic?"Unmute Music":"Mute Music"});m.onclick=()=>{AudioManager.setMute("music",!AudioManager.getSettings().muteMusic);render();};controls.append(m);
 const s=el("button",{type:"button",text:settings.muteSfx?"Unmute SFX":"Mute SFX"});s.onclick=()=>{AudioManager.setMute("sfx",!AudioManager.getSettings().muteSfx);render();};controls.append(s);body.append(controls);
 const list=el("div",{class:"mva-audio-list"});
 audioDefs.forEach(([id,label,key])=>{const row=el("div",{class:"mva-audio-row"});row.append(el("strong",{text:label}));
 const filename=el("small",{text:"Default / built-in sound"});row.append(filename);
 const file=el("input",{type:"file",accept:"audio/mpeg,audio/wav,audio/ogg,.mp3,.wav,.ogg",class:"mva-file"});row.append(file);
 const upload=el("button",{type:"button",text:"Upload / Replace"});upload.onclick=()=>file.click();row.append(upload);
 const preview=el("button",{type:"button",text:"Preview"});preview.onclick=()=>AudioManager.preview(key);row.append(preview);
 if(id==="music"){const play=el("button",{type:"button",text:"Play Music"});play.onclick=()=>AudioManager.playMusic(key);row.append(play);const stop=el("button",{type:"button",text:"Stop Music"});stop.onclick=()=>AudioManager.stopMusic();row.append(stop);}
 const reset=el("button",{type:"button",text:"Reset Default"});reset.onclick=async()=>{await del("audio_"+id);AudioManager.resetCustom(key);filename.textContent="Default / built-in sound";};row.append(reset);
 file.onchange=async()=>{const f=file.files[0];if(!f)return;if(!/\.(mp3|wav|ogg)$/i.test(f.name)){alert("Use MP3, WAV or OGG.");return;}await put("audio_"+id,{name:f.name,blob:f,type:f.type});await AudioManager.loadCustom(key,f);filename.textContent=f.name;};
 get("audio_"+id).then(a=>{if(a)filename.textContent=a.name;}).catch(()=>{});
 list.append(row);});body.append(list);
}
function renderGuide(body){
 body.innerHTML='<h3>Character assets</h3><p>Folder: <code>/assets/characters/</code></p><p>Suggested names: character_1.png … character_5.png</p><ul><li>PNG with transparent background</li><li>Static character: 512×512</li><li>Sprite sheet: consistent frame dimensions and a known rows/columns grid</li><li>Character faces forward; do not include a background</li></ul><h3>Backgrounds</h3><p>Folder: <code>/assets/backgrounds/</code></p><p>Suggested: level_1_background.png … level_5_background.png. The current levels use procedural backgrounds; swap level theme builders in <code>gameplay.js</code> or add texture loading in <code>BootScene.preload()</code> to use artwork. Keep the level config separate from gameplay rules.</p><h3>Questions and difficulty</h3><p>Edit <code>questions.js</code> to add questions. Edit each level’s <code>distance</code>, <code>checkpoints</code>, and <code>targetScore</code> in <code>level.js</code> to tune length and difficulty.</p>';
}
document.addEventListener("DOMContentLoaded",()=>{const root=el("div",{id:"mva-customizer",class:"hidden"});root.addEventListener("click",e=>{if(e.target===root)close();});document.body.append(root);});
})();
