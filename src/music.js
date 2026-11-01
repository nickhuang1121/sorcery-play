import {createMusicPlayer,MUSIC_ENABLED_KEY} from './music-player.js';

const audio=new Audio();
audio.hidden=true;
audio.dataset.backgroundMusic='';
document.body.append(audio);
let ready=false,scheduled=false;
const player=createMusicPlayer({audio,preferences:localStorage,session:sessionStorage,onChange:()=>{if(ready)render();}});
const text=(zh,en)=>document.documentElement.lang.startsWith('zh')?zh:en;
function controls(){
  const section=document.createElement('section');
  section.className='music-controls';section.dataset.i18nPreserve='';
  section.innerHTML='<h3 data-music-heading></h3><p data-music-track></p><p class="popup-hint" data-music-status role="status"></p><div class="modal-actions"><button type="button" data-music-toggle></button><button type="button" data-music-next></button></div>';
  return section;
}
function render(){
  // Game choices and card information stay focused on the current action.
  const hosts=[document.querySelector('#settings-menu .popup-body'),document.querySelector('#modal-body:has(.popup-menu)')].filter(Boolean);
  for(const host of hosts)if(!host.querySelector('.music-controls'))host.insertBefore(controls(),host.querySelector('.popup-menu'));
  const state=player.snapshot();
  const messages={off:text('音樂已關閉','Music is off'),waiting:text('點一下畫面即可播放音樂。','Tap the screen to start music.'),playing:text('播放中','Playing'),paused:text('暫停中，回到畫面後繼續。','Paused. Playback resumes when you return.'),error:text('暫時無法播放，請按下一首重試。','Playback unavailable. Try the next track.')};
  for(const section of document.querySelectorAll('.music-controls')){
    const set=(selector,value)=>{const node=section.querySelector(selector);if(node.textContent!==value)node.textContent=value;};
    set('[data-music-heading]',text('背景音樂','Background music'));
    set('[data-music-track]',`${state.index+1} / 3 · ${state.track.title}`);
    set('[data-music-status]',messages[state.status]);
    set('[data-music-toggle]',state.enabled?text('關閉音樂','Turn music off'):text('開啟音樂','Turn music on'));
    set('[data-music-next]',text('下一首 ›','Next track ›'));
    section.querySelector('[data-music-toggle]').setAttribute('aria-pressed',String(state.enabled));
  }
}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-music-toggle]'))player.setEnabled(!player.snapshot().enabled);
  else if(event.target.closest('[data-music-next]'))player.next();
});
function unlock(event){
  if(!event.isTrusted||event.target.closest?.('[data-music-toggle],[data-music-next]'))return;
  if(player.snapshot().enabled&&player.snapshot().status!=='playing'&&!document.hidden)void player.play();
}
document.addEventListener('pointerdown',unlock,{passive:true});
document.addEventListener('keydown',unlock);
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();else if(player.snapshot().enabled)void player.play();});
window.addEventListener('pagehide',()=>player.pause());
window.addEventListener('pageshow',()=>{if(!document.hidden&&player.snapshot().enabled)void player.play();});
window.addEventListener('storage',event=>{if(event.key===MUSIC_ENABLED_KEY)player.setEnabled(event.newValue!=='false');});
window.addEventListener('sorcery:languagechange',render);
new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render();});}).observe(document.body,{childList:true,subtree:true});
ready=true;render();
if(!document.hidden&&player.snapshot().enabled)void player.play();
