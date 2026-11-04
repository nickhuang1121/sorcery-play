const label=()=>document.documentElement.lang.startsWith('zh')?'玩家中心':'Player center';
let scheduled=false;
function update(){
  const profile=document.querySelector('.lobby-profile');if(profile)profile.setAttribute('href','./player.html');
  const inBattle=document.body.classList.contains('in-battle');
  for(const host of [document.querySelector('#settings-menu .modal-actions'),document.querySelector('#modal-body .popup-menu')].filter(Boolean)){
    let link=host.querySelector('[data-player-center]');
    if(inBattle){link?.remove();continue;}
    if(!link){link=document.createElement('a');link.href='./player.html';link.className='player-center-entry';link.dataset.playerCenter='';link.dataset.i18nPreserve='';host.prepend(link);}
    if(link.textContent!==label())link.textContent=label();
  }
}
new MutationObserver(()=>{if(scheduled)return;scheduled=true;queueMicrotask(()=>{scheduled=false;update();});}).observe(document.body,{childList:true,subtree:true});
window.addEventListener('sorcery:languagechange',update);update();
