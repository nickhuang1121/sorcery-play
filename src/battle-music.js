export const BATTLE_TRACKS=[
 {title:'Forgen Academy',file:'Forgen Academy.mp3'},
 {title:'Harmony of the Old Library',file:'Harmony of the Old Library.mp3'},
 {title:'古式祭典歌',file:'古式祭典歌.mp3'},
];
const KEY='sorcery.battleMusic';
export function battleTrackURL(file,base=import.meta.url){return new URL(`../assets/music/${file}`,base).href;}
export function createBattleMusic({audio=new Audio(),storage,tracks=BATTLE_TRACKS,urlFor}={}){
 audio.preload||(audio.preload='auto');
 const store=storage||{getItem:key=>{try{return localStorage.getItem(key);}catch{return null;}},setItem:(key,value)=>{try{localStorage.setItem(key,value);}catch{}}};
 const href=file=>urlFor?urlFor(file):battleTrackURL(file);
 let saved={};try{saved=JSON.parse(store.getItem(KEY)||'{}')||{};}catch{saved={};}
 let index=Number.isInteger(saved.index)&&saved.index>=0&&saved.index<tracks.length?saved.index:0;
 let mode=saved.paused?'paused':'playing';
 let volume=Number.isFinite(Number(saved.volume))?Math.min(1,Math.max(0,Number(saved.volume))):.6;
 let active=false,blocked=false,token=0;
 const wrap=value=>(value%tracks.length+tracks.length)%tracks.length;
 function persist(){try{store.setItem(KEY,JSON.stringify({index,paused:mode==='paused',volume}));}catch{}}
 function loaded(){try{return audio.src?new URL(audio.src).href:'';}catch{return audio.src||'';}}
 function cue(next,restart){
  index=wrap(next);const url=href(tracks[index].file);
  if(loaded()!==url)audio.src=url;
  if(restart){try{audio.currentTime=0;}catch{}}
  audio.volume=volume;persist();
 }
 function status(){return {index,title:tracks[index].title,volume,paused:mode==='paused',playing:mode==='playing'&&!blocked};}
 function attempt(){
  mode='playing';blocked=false;active=true;persist();
  const mine=++token;
  return Promise.resolve(audio.play()).then(()=>{},()=>{if(mine===token)blocked=true;}).then(status);
 }
 audio.addEventListener?.('ended',()=>{if(!active||mode!=='playing')return;cue(index+1,true);attempt();});
 return {
  tracks,status,
  enter(){active=true;cue(index,false);if(mode!=='playing'||blocked||!audio.paused)return Promise.resolve(status());return attempt();},
  leave(){active=false;token++;audio.pause();},
  toggle(){if(mode==='playing'&&!blocked){token++;mode='paused';blocked=false;audio.pause();persist();return Promise.resolve(status());}cue(index,false);return attempt();},
  next(){cue(index+1,true);return attempt();},
  previous(){cue(index-1,true);return attempt();},
  setVolume(value){volume=Math.min(1,Math.max(0,Number(value)||0));audio.volume=volume;persist();},
 };
}
