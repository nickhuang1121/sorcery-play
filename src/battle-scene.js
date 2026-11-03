// Presentation only. Never dispatches actions or reads/writes game storage.
import {getUILanguage} from './ui-language.js';
const t=(zh,en)=>getUILanguage()==='en'?en:zh;
let mounted=null;
function labels(){document.querySelectorAll('[data-forest-pile]').forEach(b=>{const kind=b.dataset.forestPile;if(b.classList.contains('draw-ready'))return;b.setAttribute('aria-label',kind==='grave'?t('查看墓地','View graveyards'):kind==='atlas'?t('Atlas 地點牌庫資訊','Atlas library information'):kind==='enemy'?t('對手牌庫資訊','Opponent library information'):t('Spellbook 法術牌庫資訊','Spellbook library information'));});}
function mount(){labels();const table=document.body.classList.contains('in-battle')?document.querySelector('.table'):null;if(!table){mounted=null;return;}if(mounted===table)return;mounted=table;
 const own=table.querySelector('.you-row [data-player]'),opponent=table.querySelector('.opponent-cluster [data-player]');if(!own||!opponent)return;
 const piles=document.createElement('div');piles.className='forest-piles';
 for(const [kind,count,symbol,label]of [['atlas',own.dataset.atlasCount,'◇','ATLAS'],['spells',own.dataset.spellCount,'✧','SPELLBOOK'],['enemy',opponent.dataset.spellCount,'✧','SPELLBOOK'],['grave',own.dataset.graveCount,'☠','']]){
  const b=document.createElement('button');b.type='button';b.className='forest-pile forest-pile-'+kind;b.dataset.forestPile=kind;b.innerHTML='<span aria-hidden="true">'+symbol+'</span><b>'+count+'</b><small>'+label+'</small>';
  const draw=['atlas','spells'].includes(kind)&&table.querySelector(`[data-library-draw="${kind==='atlas'?'atlas':'spells'}"]`);
  if(draw){b.classList.add('draw-ready');b.setAttribute('aria-label',kind==='atlas'?t('抽一張地點牌','Draw a site'):t('抽一張法術牌','Draw a spell'));}
  b.onclick=()=>{if(kind==='grave')table.querySelector('#graveyard')?.click();else if(kind==='enemy')opponent.click();else{if(draw&&!draw.disabled)draw.click();else own.click();}};
  piles.append(b);
 }
 table.append(piles);labels();
}
let pending=false;const appRoot=document.querySelector('#app');if(appRoot)new MutationObserver(()=>{if(pending)return;pending=true;queueMicrotask(()=>{pending=false;mount();});}).observe(appRoot,{childList:true,subtree:true});
window.addEventListener('sorcery:languagechange',labels);mount();
