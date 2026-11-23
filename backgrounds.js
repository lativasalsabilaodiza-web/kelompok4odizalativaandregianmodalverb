/* Background asset configuration. Enable a level after placing files in assets/backgrounds/.
   Optional layers scroll at different speeds to create parallax. */
window.LEVEL_BACKGROUND_CONFIG = {
  level1:{enabled:false,background:"assets/backgrounds/level_1_background.png",layers:[
    {key:"l1_sky",url:"assets/backgrounds/level_1_sky.png",speed:0.05},
    {key:"l1_mountains",url:"assets/backgrounds/level_1_mountains.png",speed:0.12},
    {key:"l1_buildings",url:"assets/backgrounds/level_1_buildings.png",speed:0.22},
    {key:"l1_trees",url:"assets/backgrounds/level_1_trees.png",speed:0.38},
    {key:"l1_road",url:"assets/backgrounds/level_1_road.png",speed:1}
  ]},
  level2:{enabled:false,background:"assets/backgrounds/level_2_background.png",layers:[]},
  level3:{enabled:false,background:"assets/backgrounds/level_3_background.png",layers:[]},
  level4:{enabled:false,background:"assets/backgrounds/level_4_background.png",layers:[]},
  level5:{enabled:false,background:"assets/backgrounds/level_5_background.png",layers:[]}
};
window.BackgroundManager={
 preload(scene){Object.entries(window.LEVEL_BACKGROUND_CONFIG).forEach(([level,cfg])=>{if(!cfg.enabled)return;
   if(cfg.background)scene.load.image("bg_"+level,cfg.background);
   (cfg.layers||[]).forEach((l)=>scene.load.image(l.key,l.url));
 });},
 create(scene,levelKey){
   const cfg=window.LEVEL_BACKGROUND_CONFIG[levelKey];if(!cfg||!cfg.enabled)return null;
   const group=scene.add.container(0,0).setDepth(0);
   if(cfg.background&&scene.textures.exists("bg_"+levelKey)){
     const bg=scene.add.image(480,270,"bg_"+levelKey).setDisplaySize(960,540);group.add(bg);
   }
   const layers=[];
   (cfg.layers||[]).forEach(l=>{if(!scene.textures.exists(l.key))return;
     const img=scene.add.tileSprite(480,270,960,540,l.key).setOrigin(.5).setDepth(l.speed||0);
     group.add(img);layers.push({image:img,speed:l.speed||0});
   });
   return {group,layers,update(distance){layers.forEach(l=>{l.image.tilePositionX=distance*l.speed*.18;});}};
 }
};
