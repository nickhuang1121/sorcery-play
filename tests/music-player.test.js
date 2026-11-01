import test from 'node:test';
import assert from 'node:assert/strict';
import {createMusicPlayer,MUSIC_TRACKS,MUSIC_ENABLED_KEY,MUSIC_POSITION_KEY,MUSIC_VOLUME_KEY} from '../src/music-player.js';

const storage=(initial={})=>{const map=new Map(Object.entries(initial));return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value)};};
function fixture({preferences=storage({[MUSIC_ENABLED_KEY]:'true'}),session=storage(),reject}={}){
  const listeners=new Map();
  const audio={src:'',currentTime:0,duration:180,paused:true,plays:0,
    addEventListener:(name,fn)=>listeners.set(name,fn),
    pause(){this.paused=true;},
    async play(){this.plays++;if(reject)throw reject;this.paused=false;},
  };
  return {audio,preferences,session,emit:name=>listeners.get(name)?.(),player:createMusicPlayer({audio,preferences,session})};
}
test('disabled music stays silent across page navigation and next track does not enable it',async()=>{
  const f=fixture({preferences:storage({[MUSIC_ENABLED_KEY]:'false'})});
  await f.player.play();assert.equal(f.audio.plays,0);
  f.player.next();assert.equal(f.player.snapshot().index,1);assert.equal(f.audio.plays,0);
  const restored=fixture({preferences:f.preferences,session:f.session});
  assert.equal(restored.player.snapshot().index,1);assert.equal(restored.player.snapshot().enabled,false);
});
test('track completion loops all three tracks and manual next switches immediately',async()=>{
  const f=fixture();await f.player.play();assert.equal(f.audio.paused,false);
  f.emit('ended');assert.equal(f.player.snapshot().index,1);
  f.player.next();assert.equal(f.player.snapshot().index,2);
  f.emit('ended');assert.equal(f.player.snapshot().index,0);
  assert.match(f.audio.src,/bells-of-the-forgotten\.mp3$/);
});
test('autoplay rejection is recoverable by a later user gesture and off cancels pending playback state',async()=>{
  const f=fixture({reject:Object.assign(new Error('gesture required'),{name:'NotAllowedError'})});
  await f.player.play();assert.equal(f.player.snapshot().status,'waiting');
  f.audio.play=async function(){this.paused=false;};await f.player.play();assert.equal(f.player.snapshot().status,'playing');
  let resolve;f.audio.play=()=>new Promise(r=>resolve=r);const pending=f.player.play();
  f.player.setEnabled(false);resolve();await pending;
  assert.equal(f.player.snapshot().status,'off');assert.equal(f.audio.paused,true);
});
test('position survives document changes and invalid stored values are ignored',async()=>{
  const f=fixture();await f.player.play();f.audio.currentTime=42.5;f.player.pause();
  const restored=fixture({session:f.session});await restored.player.play();restored.emit('loadedmetadata');
  assert.equal(restored.audio.currentTime,42.5);
  const invalid=fixture({session:storage({[MUSIC_POSITION_KEY]:'{"index":900,"time":-4}'})});
  assert.equal(invalid.player.snapshot().index,0);await invalid.player.play();assert.equal(invalid.audio.currentTime,0);
});
test('unavailable audio tries each track once rather than looping forever',()=>{
  const f=fixture();for(let i=0;i<MUSIC_TRACKS.length;i++)f.emit('error');
  assert.equal(f.player.snapshot().status,'error');assert.equal(f.audio.paused,true);
});

test('first visit is silent at twenty percent, while explicit preferences persist',()=>{
  const f=fixture({preferences:storage()});assert.equal(f.player.snapshot().enabled,false);assert.equal(f.audio.volume,.2);
  f.player.setVolume(.47);f.player.setEnabled(true);
  const restored=fixture({preferences:f.preferences});assert.equal(restored.player.snapshot().enabled,true);assert.equal(restored.audio.volume,.47);
  f.player.setVolume(3);assert.equal(f.audio.volume,1);f.player.setVolume(-1);assert.equal(f.audio.volume,0);
  f.player.setVolume(NaN);assert.equal(f.audio.volume,0);
});
test('previous wraps backwards without enabling music and invalid volume falls back',()=>{
  const f=fixture({preferences:storage({[MUSIC_VOLUME_KEY]:'"invalid"'})});
  f.player.previous();assert.equal(f.player.snapshot().index,2);assert.equal(f.audio.plays,0);assert.equal(f.audio.volume,.2);
  f.player.previous();assert.equal(f.player.snapshot().index,1);
});
