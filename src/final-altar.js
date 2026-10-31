import {finalReplacementChoice} from './final-damage.js';
// The used marker travels WITH the physical card, including Mirror Realm's
// underlying originalCard. Copying printed characteristics never copies it.
export function altarPhysicalBase(id,A){const c=A.card(id);return c.finalAltarSpent?c.runtimeBase:id;}
function markSpent(s,site,A){
 const physical=site.originalCard||site.card,c=A.card(physical);
 const used=A.runtimeCard(physical,'altar_spent',{slug:c.slug,playable:c.playable,finalAltarSpent:true});
 if(site.originalCard)site.originalCard=used;else site.card=used;
 site.finalAltarSpent=true;
}
export function restoreFinalAltars(s,A){
 const visit=v=>{if(typeof v==='string'&&v.startsWith('runtime:altar_spent:')){const base=v.slice('runtime:altar_spent:'.length);visit(base);const c=A.card(base);A.runtimeCard(base,'altar_spent',{slug:c.slug,playable:c.playable,finalAltarSpent:true});}else if(v&&typeof v==='object')for(const x of Object.values(v))visit(x);};visit(s);
}
export function prepareFinalAltarSite(s,at,physical,A){const site=s.board[at];if(site)site.finalAltarSpent=!!A.card(physical).finalAltarSpent;}
export function finalAltarPreventsDeath(s,p,A){
 const choices=[];
 for(const [at,site] of s.board.entries())if(site&&site.controller===p&&!site.silenced&&!site.disabled&&A.card(site.card).slug==='altar_of_malachai'&&!site.finalAltarSpent&&!A.card(site.originalCard||site.card).finalAltarSpent){
  for(const u of s.units)if(!u.dying&&u.controller===p&&A.card(u.card).type==='Minion'&&(u.layer||'surface')==='surface'&&A.occupied(u).includes(at))choices.push({label:'Altar of Malachai · 犧牲 '+A.card(u.card).name,value:{at,site:site.uid,minion:u.uid}});
 }
 if(!choices.length)return false;
 const selected=finalReplacementChoice(s,'altar-death:'+p+':'+s.turn,p,[...choices,{label:'不使用 Altar，承受死亡',value:null}],'Altar of Malachai · 每局一次替代死亡',A.avatar(s,p));
 if(selected===null)return false;
 const site=s.board[selected.at],u=A.unit(s,selected.minion);if(site?.uid!==selected.site||!u||u.dying||u.controller!==p)throw Error('Altar sacrifice changed');
 markSpent(s,site,A);A.kill(s,u,false,true,true);return true;
}
