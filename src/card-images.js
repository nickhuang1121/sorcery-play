import {card} from './cards.js';
let index={};
export async function loadCardImages(){const r=await fetch(new URL('../data/card-image-index.json',import.meta.url));if(!r.ok)throw Error('卡圖索引讀取失敗');index=await r.json();}
export function cardImage(c){const flipped=c.slug==='__druid_back';const base=c.runtimeBase?card(c.runtimeBase):c;const entry=index[base.slug];const file=flipped?entry?.back:entry?.front;return file?new URL('../card-images/'+file,import.meta.url).href:null;}
export function cardImageHTML(c,{eager=false}={}){const src=cardImage(c);return `<span class="card-image${src?'':' missing-image'}" aria-hidden="true">${src?`<img data-card-art draggable="false" src="${src}" alt="" loading="${eager?'eager':'lazy'}" decoding="async" width="744" height="1039">`:''}</span>`;}
// A failed image always leaves the fixed black frame; no broken-image icon.
export function installCardImageFallback(root=document){root.addEventListener('error',e=>{if(e.target?.matches?.('img[data-card-art]')){e.target.parentElement.classList.add('missing-image');e.target.remove();}},true);}
