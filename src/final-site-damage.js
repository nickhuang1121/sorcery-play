import {finalReplacementChoice} from './final-damage.js';
import {catalogAuraActive} from './aura-source-state.js';
import {viewCemeteryEntries,canAffectCemetery,zoneAccessCost,commitZoneAccess} from './cemetery-access.js';
import {takeGrave} from './cemetery.js';
const live=o=>o&&!o.silenced&&!o.disabled;
// Site prevention is immediate. Choosing between Ward and Soil happens before
// either resource is consumed; a failed Soil dispels itself and repeats.
export function preventFinalSiteDamage(s,at,amount,A){
 const site=s.board[at];if(!site||amount<=0)return true;
 const wards=s.damageWindow?(s.damageWindow.siteWards??=[]):[];
 if(wards.includes(site.uid))return true;
 for(const orderingPlayer of [s.active,1-s.active])for(let guard=0;guard<100;guard++){
  const soils=(s.auras||[]).filter(a=>catalogAuraActive(a,A.disabled)&&A.card(a.card).slug==='mortal_soil'&&a.controller===orderingPlayer&&A.inside(a,at));
  const sources=[...(site.ward&&site.controller===orderingPlayer?[{label:'Ward',value:'ward'}]:[]),...soils.map(a=>({label:'Mortal Soil',value:a.uid}))];
  if(!sources.length)break;
  const selected=sources.length===1?sources[0].value:finalReplacementChoice(s,'site-prevent:'+site.uid+':'+amount+':'+orderingPlayer,orderingPlayer,sources,'選擇地點傷害防止順序',{...site,at});
  if(selected==='ward'){site.ward=false;wards.push(site.uid);A.noteBuiltWardConsumed?.(s,site);return true;}
  const aura=soils.find(a=>a.uid===selected),p=aura.controller;
  const entries=viewCemeteryEntries(s,p,A).filter(g=>A.card(g.card).type==='Minion'&&canAffectCemetery(s,p,g.player,A));
  const cost=zoneAccessCost(s,A);let permitted=entries.length>0&&A.resources(s,p).available>=cost;
  if(permitted&&cost)permitted=finalReplacementChoice(s,'soil-access:'+aura.uid+':'+site.uid,p,[{label:'支付 '+cost+' 法力存取墓地',value:true},{label:'不支付；無法放逐並驅散 Mortal Soil',value:false}],'Bureau · Mortal Soil 的獨立存取費用',aura);
  if(!permitted){A.removeObject(s,aura,'cemetery');continue;}
  const entry=finalReplacementChoice(s,'soil-corpse:'+aura.uid+':'+site.uid,p,entries.map(g=>({label:A.card(g.card).name,value:g})),'Mortal Soil · 放逐一個墓地中的 minion 防止傷害',aura);
  const valid=entries.find(g=>g.uid===entry.uid&&g.player===entry.player);if(!valid)throw Error('Mortal Soil cemetery identity changed');
  commitZoneAccess(s,p,A,{scope:{id:'soil'+(s.nextZoneAccess=(s.nextZoneAccess||0)+1),permissions:{}}});
  const removed=takeGrave(s,valid.player,valid.index,valid.card,valid.uid);s.players[valid.player].banished.push(removed.card);return true;
 }
 return false;
}

// This is an untargeted redirect, so region, Stealth and Magic targeting
// restrictions do not restrict the recipient. Ward acts on the new recipient.
export function finalCityDamageRecipient(s,at,amount,A){
 const site=s.board[at];if(!live(site)||A.card(site.card).slug!=='city_of_souls'||A.resources(s,site.controller).earth<1)return null;
 const p=1-site.controller,options=[{label:'不轉移，傷害仍由地點承受',value:null},...s.units.filter(u=>!u.dying).map(u=>({label:A.card(u.card).name,value:u.uid}))];
 const uid=finalReplacementChoice(s,'city-redirect:'+site.uid+':'+amount,p,options,'City of Souls · 可轉移到任意單位',{...site,at});
 return uid===null?null:A.unit(s,uid);
}
