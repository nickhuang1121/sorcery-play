import {arrangeRealmPiles} from '../../src/realm-layout.js';
export const STACK_QUERY='(max-width:700px) and (orientation:portrait), (max-width:980px) and (max-height:580px)';
export const stackViewEnabled=()=>typeof matchMedia!=='undefined'&&matchMedia(STACK_QUERY).matches;
const fronts=new Map(),layers=new Map();
export function setStackFront(at,layer,key){layers.set(Number(at),layer);if(key)fronts.set(at+':'+layer,key);}
export function stackGeometry(width,height,count){
 const w=Math.max(0,width),h=Math.max(0,height),n=Math.max(0,count|0);if(!n||!w||!h)return [];
 const cw=Math.max(0,Math.min(w-(n>1?7:0),h*744/1039)),ch=cw*1039/744,step=Math.min(3.5,Math.max(0,(w-cw)/Math.min(n,4)));
 return Array.from({length:n},(_,i)=>({x:Math.max(0,(w-cw)/2+(Math.min(i,3)-Math.min(n-1,3)/2)*step),y:(h-ch)/2,width:cw,height:ch}));
}
const write=(e,k,v)=>{if(e.style[k]!==v)e.style[k]=v;};
export function arrangeMobileRealmPiles(root){
 if(!root)return;
 if(!stackViewEnabled()){
  root.querySelectorAll('[data-fs-mobile]').forEach(c=>{delete c.dataset.fsMobile;delete c.dataset.fsLayer;});root.querySelectorAll('[data-fs-front]').forEach(p=>delete p.dataset.fsFront);root.querySelectorAll('.fs-cell-summary').forEach(n=>n.remove());
  arrangeRealmPiles(root);return;
 }
 for(const cell of root.querySelectorAll('.cell')){
  const at=+cell.dataset.at,piles=[...cell.querySelectorAll(':scope > .realm-pile')],nonempty=piles.filter(p=>p.querySelector('.pile-slot,.realm-object'));
  cell.dataset.fsMobile='true';
  const active=nonempty.find(p=>p.dataset.layer===layers.get(at))||nonempty.find(p=>p.dataset.layer==='surface')||nonempty[0];
  cell.dataset.fsLayer=active?.dataset.layer||'surface';
  let summary=cell.querySelector('.fs-cell-summary');if(!summary){summary=document.createElement('span');summary.className='fs-cell-summary';summary.setAttribute('aria-hidden','true');cell.append(summary);}
  const surface=nonempty.find(p=>p.dataset.layer==='surface'),below=nonempty.find(p=>p.dataset.layer==='below'),count=p=>p?.querySelectorAll('.pile-slot,.realm-object').length||0;
  const a=count(active),b=count(below),ready=active?.querySelectorAll('.unit:not(.tapped)')||[],canAct=[...ready].some(n=>n.querySelector('small')?.textContent.includes('●'));
  const label=active?.dataset.layer==='below'?'▾':'',caption=(a?label+'×'+a:'')+(active===below&&count(surface)?' · ↑'+count(surface):active!==below&&b?' · ▾'+b:'')+(canAct?' ●':'');
  if(summary.textContent!==caption)summary.textContent=caption;summary.dataset.below=String(active?.dataset.layer==='below');summary.dataset.ready=String(canAct);
  for(const pile of piles){
   const on=pile===active;pile.dataset.fsFront=String(on);if(!on)continue;
   const area=pile.querySelector('.pile-cards'),items=[...area.children].filter(n=>n.matches('.pile-slot,.realm-object'));
   const key=n=>n.querySelector('[data-unit]')?.dataset.unit||n.dataset.object,chosen=items.find(n=>n.querySelector('.selected'))||items.find(n=>key(n)===fronts.get(at+':'+pile.dataset.layer))||items[0];
   const ordered=items.filter(n=>n!==chosen);if(chosen)ordered.push(chosen);
   const geom=stackGeometry(area.clientWidth,area.clientHeight,ordered.length);
   ordered.forEach((n,i)=>{const r=geom[i];if(!r)return;for(const [k,v] of Object.entries({left:r.x+'px',top:r.y+'px',width:r.width+'px',height:r.height+'px',zIndex:String(i+1)}))write(n,k,v);});
   pile.dataset.layout=items.length>1?'mobile-stack':'mobile-card';
  }
 }
}
