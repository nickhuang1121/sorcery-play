export const MUSIC_TRACKS = [
  {title:'Bells of the Forgotten', file:'bells-of-the-forgotten.mp3'},
  {title:"The Dragon's First Breath", file:'the-dragons-first-breath.mp3'},
  {title:'Ruler of the Deep Sea', file:'ruler-of-the-deep-sea.mp3'},
];
export const MUSIC_ENABLED_KEY = 'sorcery.music.enabled';
export const MUSIC_POSITION_KEY = 'sorcery.music.position';

// One player per document; track position survives independent-page navigation.
export function createMusicPlayer({audio, preferences, session, onChange=()=>{}}) {
  const read=(store,key)=>{try{return JSON.parse(store.getItem(key));}catch{return null;}};
  const write=(store,key,value)=>{try{store.setItem(key,JSON.stringify(value));}catch{}};
  const saved=read(session,MUSIC_POSITION_KEY);
  let enabled=read(preferences,MUSIC_ENABLED_KEY)!==false;
  let index=Number.isInteger(saved?.index)&&saved.index>=0&&saved.index<MUSIC_TRACKS.length?saved.index:0;
  let position=Number.isFinite(saved?.time)&&saved.time>=0?saved.time:0;
  let status=enabled?'waiting':'off', revision=0, lastSaved=-1, failures=0;
  audio.volume=.35;
  audio.preload='none';
  const snapshot=()=>({enabled,index,status,track:MUSIC_TRACKS[index]});
  const notify=()=>onChange(snapshot());
  function save(){write(session,MUSIC_POSITION_KEY,{index,time:audio.src&&Number.isFinite(audio.currentTime)?audio.currentTime:position});}
  function load(){
    audio.src=new URL('../assets/music/'+MUSIC_TRACKS[index].file,import.meta.url).href;
    if(position){try{audio.currentTime=position;}catch{}}
  }
  async function play(){
    if(!enabled)return;
    if(!audio.src)load();
    const attempt=++revision;
    status='loading';notify();
    try{
      await audio.play();
      if(attempt!==revision)return;
      status='playing';failures=0;notify();
    }catch(error){
      if(attempt!==revision)return;
      status=error?.name==='NotAllowedError'?'waiting':'error';notify();
    }
  }
  function pause(){revision++;audio.pause();save();status=enabled?'paused':'off';notify();}
  function setEnabled(value){enabled=!!value;write(preferences,MUSIC_ENABLED_KEY,enabled);if(enabled)void play();else pause();}
  function next(){
    revision++;audio.pause();index=(index+1)%MUSIC_TRACKS.length;position=0;lastSaved=-1;
    load();save();status=enabled?'waiting':'off';notify();if(enabled)void play();
  }
  audio.addEventListener('loadedmetadata',()=>{
    if(position){try{audio.currentTime=Number.isFinite(audio.duration)?Math.min(position,Math.max(0,audio.duration-.1)):position;}catch{}}
    position=0;
  });
  audio.addEventListener('ended',next);
  audio.addEventListener('error',()=>{
    if(!enabled)return;
    failures++;
    if(failures<MUSIC_TRACKS.length)next();else{revision++;audio.pause();status='error';notify();}
  });
  audio.addEventListener('timeupdate',()=>{const tick=Math.floor(audio.currentTime/5);if(tick!==lastSaved){lastSaved=tick;save();}});
  return {snapshot,play,pause,next,setEnabled,save};
}
