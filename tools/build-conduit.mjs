import fs from 'node:fs';
import path from 'node:path';
const root=process.argv[2]||'/Users/yuyuannike/Documents/遊戲素材/CONDUIT_像素精緻動畫_付費購買';
const out=new URL('../assets/conduit/',import.meta.url);fs.mkdirSync(out,{recursive:true});
const picks={cast:['ARCLIGHT','sigils_arcane_summoning_circle'],hit:['PYRE','impact_blunt'],slash:['PYRE','impact_slash'],lightning:['ARCLIGHT','lightning_zap_hit_spark'],fire:['PYRE','magic_firebolt_burst'],water:['PYRE','water_splash'],summon:['PYRE','magic_arcane_bloom'],shield:['ARCLIGHT','aura_shield_bubble_hex'],heal:['ARCLIGHT','aura_heal_circle_motes'],depart:['UNMAKE','scatter_motes']};
const index={};for(const [id,[pack,name]] of Object.entries(picks)){
 const scene=fs.readFileSync(path.join(root,'fx',pack,name+'.tscn'),'utf8');
 const sheet=scene.match(/path="res:\/\/([^"\n]+\.png)"/)[1];
 const rects=[...scene.matchAll(/region = Rect2\((\d+), (\d+), (\d+), (\d+)\)/g)].map(m=>m.slice(1).map(Number));
 const file=id+'.png';fs.copyFileSync(path.join(root,sheet),new URL(file,out));
 index[id]={file,frames:rects,fps:Number(scene.match(/"speed": ([\d.]+)/)?.[1]||12),additive:scene.includes('blend_mode = 1')};
}
fs.copyFileSync(path.join(root,'LICENSE.txt'),new URL('LICENSE.txt',out));
fs.writeFileSync(new URL('index.json',out),JSON.stringify(index,null,2)+'\n');console.log('Exported '+Object.keys(index).length+' CONDUIT effects.');
