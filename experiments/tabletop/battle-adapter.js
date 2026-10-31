// Presentation only. Never dispatches actions or reads/writes game storage.
import {getUILanguage} from '../../src/ui-language.js';
const t=(zh,en)=>getUILanguage()==='en'?en:zh;
let mounted=null;
const banner=document.createElement('a');banner.className='forest-return';banner.dataset.i18nPreserve='';banner.href='./index.html';document.body.append(banner);
function labels(){document.title=t('Sorcery · 森境對戰'+(location.pathname.endsWith('/lobby.html')?'大廳':''),'Sorcery · Forest Realm'+(location.pathname.endsWith('/lobby.html')?' Lobby':''));banner.textContent=t('場景展示 ↗','Scene preview ↗');const subtitle=document.querySelector('.home-subtitle'),intro=t('在森境牌桌，開始一場真正的對局。','Play a real match at the forest table.');if(subtitle){subtitle.dataset.i18nPreserve='';if(subtitle.textContent!==intro)subtitle.textContent=intro;}const credit=document.querySelector('.home-footer>span');if(credit&&credit.textContent!=='THE VERDANT THRESHOLD')credit.textContent='THE VERDANT THRESHOLD';document.querySelectorAll('[data-forest-pile]').forEach(b=>{const kind=b.dataset.forestPile;b.setAttribute('aria-label',kind==='grave'?t('查看墓地','View graveyards'):kind==='atlas'?t('Atlas 地點牌庫資訊','Atlas library information'):kind==='enemy'?t('對手牌庫資訊','Opponent library information'):t('Spellbook 法術牌庫資訊','Spellbook library information'));});}
function mount(){labels();const table=document.querySelector('.table');if(!table){mounted=null;return;}if(mounted===table)return;mounted=table;
 const own=table.querySelector('.you-row [data-player]'),opponent=table.querySelector('.opponent-cluster [data-player]');if(!own||!opponent)return;
 const piles=document.createElement('div');piles.className='forest-piles';
 for(const [kind,count,symbol,label]of [['atlas',own.dataset.atlasCount,'◇','ATLAS'],['spells',own.dataset.spellCount,'✧','SPELLBOOK'],['enemy',opponent.dataset.spellCount,'✧','SPELLBOOK'],['grave',own.dataset.graveCount,'☠','']]){
  const b=document.createElement('button');b.type='button';b.className='forest-pile forest-pile-'+kind;b.dataset.forestPile=kind;b.innerHTML='<span aria-hidden="true">'+symbol+'</span><b>'+count+'</b><small>'+label+'</small>';
  b.onclick=()=>{if(kind==='grave')table.querySelector('#graveyard')?.click();else if(kind==='enemy')opponent.click();else{const draw=table.querySelector('#draw-options');if(draw&&!draw.disabled)draw.click();else own.click();}};
  piles.append(b);
 }
 table.append(piles);labels();
}
let pending=false;const appRoot=document.querySelector('#app');if(appRoot)new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;mount();});}).observe(appRoot,{childList:true,subtree:true});
window.addEventListener('sorcery:languagechange',labels);mount();
