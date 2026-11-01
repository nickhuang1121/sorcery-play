import {createMusicPlayer,MUSIC_ENABLED_KEY,MUSIC_VOLUME_KEY} from './music-player.js?v=20261101-music-shortcut';

const audio=new Audio();
audio.hidden=true;
audio.dataset.backgroundMusic='';
document.body.append(audio);
let ready=false,scheduled=false;
const read=key=>{try{return localStorage.getItem(key);}catch{return null;}};
const remember=key=>{try{localStorage.setItem(key,'true');}catch{}};
const firstVisit=read(MUSIC_ENABLED_KEY)===null&&!read('sorcery.music.inviteSeen');
let hintTimer;
const quick=document.createElement('button');
quick.type='button';quick.className='music-quick-toggle';quick.dataset.musicQuick='';quick.dataset.i18nPreserve='';
quick.innerHTML='<span data-music-icon aria-hidden="true"></span><span class="music-quick-label"></span>';
const player=createMusicPlayer({audio,preferences:localStorage,session:sessionStorage,onChange:()=>{if(ready)render();}});
const text=(zh,en)=>document.documentElement.lang.startsWith('zh')?zh:en;
function mountShortcut(){
  const anchor=document.querySelector('.lobby-settings')||document.querySelector('#tools-toggle')||document.querySelector('[data-ui-settings-open]');
  if(!anchor)return;
  if(anchor.classList.contains('lobby-settings')){
    let wrapper=anchor.closest('.music-header-actions');
    if(!wrapper){wrapper=document.createElement('div');wrapper.className='music-header-actions';anchor.before(wrapper);wrapper.append(anchor);}
    if(quick.parentElement!==wrapper)wrapper.prepend(quick);
  }else if(quick.nextElementSibling!==anchor)anchor.before(quick);
}
function invite(){
  if(!firstVisit||document.body.dataset.page!=='home'||read('sorcery.music.inviteSeen'))return;
  const panel=document.createElement('aside');panel.className='music-invite';panel.dataset.i18nPreserve='';
  panel.innerHTML='<button type="button" data-music-enable></button><button type="button" data-music-dismiss>×</button>';
  document.body.append(panel);remember('sorcery.music.inviteSeen');
}
function announcePlaying(){
  if(read('sorcery.music.playHintSeen'))return;
  remember('sorcery.music.playHintSeen');
  const hint=document.createElement('p');hint.className='music-playing-hint';hint.dataset.i18nPreserve='';hint.setAttribute('role','status');
  hint.textContent=text('背景音樂已開啟，可點喇叭靜音。','Music is on. Tap the speaker to mute.');document.body.append(hint);
  clearTimeout(hintTimer);hintTimer=setTimeout(()=>hint.remove(),4500);
}
function controls(){
  const section=document.createElement('section');
  section.className='music-controls';section.dataset.i18nPreserve='';
  section.innerHTML='<h3 data-music-heading></h3><p data-music-track></p><p class="popup-hint" data-music-status role="status"></p><div class="modal-actions"><button type="button" data-music-toggle></button><button type="button" data-music-previous></button><button type="button" data-music-next></button></div><label class="music-volume"><span data-music-volume-label></span><input type="range" min="0" max="100" step="1" data-music-volume><output data-music-volume-value></output></label>';
  return section;
}
function render(){
  mountShortcut();invite();
  // Game choices and card information stay focused on the current action.
  const hosts=[document.querySelector('#settings-menu .popup-body'),document.querySelector('#modal-body:has(.popup-menu)')].filter(Boolean);
  for(const host of hosts)if(!host.querySelector('.music-controls'))host.insertBefore(controls(),host.querySelector('.popup-menu'));
  const state=player.snapshot();
  const playingHint=document.querySelector('.music-playing-hint');
  if(playingHint){
    if(!state.enabled){clearTimeout(hintTimer);playingHint.remove();}
    else{const copy=text('背景音樂已開啟，可點喇叭靜音。','Music is on. Tap the speaker to mute.');if(playingHint.textContent!==copy)playingHint.textContent=copy;}
  }
  const audible=state.enabled&&state.volume>0;
  const label=audible?text('關閉音樂','Mute music'):text('開啟音樂','Enable music');
  const icon=quick.querySelector('[data-music-icon]'),caption=quick.querySelector('.music-quick-label');
  if(icon.textContent!==(audible?'🔊':'🔇'))icon.textContent=audible?'🔊':'🔇';
  const shortLabel=audible?text('音樂','Music'):text('靜音','Muted');
  if(caption.textContent!==shortLabel)caption.textContent=shortLabel;
  quick.setAttribute('aria-label',label);quick.title=label;quick.setAttribute('aria-pressed',String(audible));
  const invitation=document.querySelector('.music-invite');
  if(invitation){if(state.enabled)invitation.remove();else{const b=invitation.querySelector('[data-music-enable]');const copy=text('♫ 開啟背景音樂','♫ Enable background music');if(b.textContent!==copy)b.textContent=copy;invitation.querySelector('[data-music-dismiss]').setAttribute('aria-label',text('關閉音樂提示','Dismiss music hint'));}}
  if(state.status==='playing'&&audible)announcePlaying();
  const messages={off:text('音樂已關閉','Music is off'),loading:text('正在載入音樂…','Loading music…'),waiting:text('點一下畫面即可播放音樂。','Tap the screen to start music.'),playing:text('播放中','Playing'),paused:text('暫停中，回到畫面後繼續。','Paused. Playback resumes when you return.'),error:text('暫時無法播放，請按下一首重試。','Playback unavailable. Try the next track.')};
  for(const section of document.querySelectorAll('.music-controls')){
    const set=(selector,value)=>{const node=section.querySelector(selector);if(node.textContent!==value)node.textContent=value;};
    set('[data-music-heading]',text('背景音樂','Background music'));
    set('[data-music-track]',`${state.index+1} / 3 · ${state.track.title}`);
    set('[data-music-status]',messages[state.status]);
    set('[data-music-toggle]',state.enabled?text('關閉音樂','Turn music off'):text('開啟音樂','Turn music on'));
    set('[data-music-next]',text('下一首 ›','Next track ›'));
    set('[data-music-previous]',text('‹ 上一首','‹ Previous track'));
    set('[data-music-volume-label]',text('音量','Volume'));
    set('[data-music-volume-value]',`${Math.round(state.volume*100)}%`);
    const slider=section.querySelector('[data-music-volume]');
    slider.setAttribute('aria-label',text('音樂音量','Music volume'));slider.value=String(Math.round(state.volume*100));
    section.querySelector('[data-music-toggle]').setAttribute('aria-pressed',String(state.enabled));
  }
}
document.addEventListener('click',event=>{
  if(event.target.closest('[data-music-quick],[data-music-enable]')){
    const state=player.snapshot();
    if(event.target.closest('[data-music-quick]')&&state.enabled&&state.volume>0)player.setEnabled(false);
    else{if(state.volume===0)player.setVolume(.2);player.setEnabled(true);}
  }
  else if(event.target.closest('[data-music-dismiss]'))document.querySelector('.music-invite')?.remove();
  else if(event.target.closest('[data-music-toggle]'))player.setEnabled(!player.snapshot().enabled);
  else if(event.target.closest('[data-music-next]'))player.next();
  else if(event.target.closest('[data-music-previous]'))player.previous();
});
document.addEventListener('input',event=>{if(event.target.matches('[data-music-volume]'))player.setVolume(Number(event.target.value)/100);});
function unlock(event){
  if(!event.isTrusted||event.target.closest?.('[data-music-quick],[data-music-enable],[data-music-toggle],[data-music-next],[data-music-previous],[data-music-volume]'))return;
  if(player.snapshot().enabled&&player.snapshot().status!=='playing'&&!document.hidden)void player.play();
}
document.addEventListener('pointerdown',unlock,{passive:true});
document.addEventListener('keydown',unlock);
document.addEventListener('visibilitychange',()=>{if(document.hidden)player.pause();else if(player.snapshot().enabled)void player.play();});
window.addEventListener('pagehide',()=>player.pause());
window.addEventListener('pageshow',()=>{if(!document.hidden&&player.snapshot().enabled)void player.play();});
window.addEventListener('storage',event=>{if(event.key===MUSIC_ENABLED_KEY)player.setEnabled(event.newValue==='true');else if(event.key===MUSIC_VOLUME_KEY){const value=Number(event.newValue);if(Number.isFinite(value))player.setVolume(value);}});
window.addEventListener('resize',()=>{if(ready)render();});
window.addEventListener('sorcery:languagechange',render);
new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;render();});}).observe(document.body,{childList:true,subtree:true});
ready=true;render();
if(!document.hidden&&player.snapshot().enabled)void player.play();
