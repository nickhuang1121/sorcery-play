import {finalArchivePrintedCard} from './card-lineage.js';
import {physicalCemeteryEntries,takeAccessGrave,canAffectCemetery,commitZoneAccess,canPayZoneAccess} from './cemetery-access.js';
import {finalAvatarBasicCopyCard} from './final-avatars.js';
import {finalCardUmbrellas,saintOfRedemptionActive} from './final-passives.js';
export const copyingOperations=['copyEntry','copySnail','copyHeirCost'];
const fits=(u,c)=>(c.playable||c.handler==='token'||c.runtimeBase)&&(c.slug!=='mountain_giant'||u.at%5<4&&u.at<15);
export function deferCopyEntry(s,u,A){
 const c=A.card(u.card),rules=c.printedAbilityRecord?.passives?.enterCopy||[A.passives[c.slug]?.enterCopy?{value:A.passives[c.slug].enterCopy,origin:c.id,instance:null}:null].filter(Boolean);if(!rules.length||u.copyEntryDone)return false;
 s.units=s.units.filter(v=>v.uid!==u.uid);A.queueEffects(s,[{op:'copyEntry',object:structuredClone(u),...(rules.length===1?{mode:rules[0].value}:{modes:rules})}],u,u.controller);return true;
}
export function returnCopies(s,p){for(const u of s.units)if(u.copyReturn?.player===p){const prior=u.copyReturn;u.card=prior.card;u.originalCard=prior.originalCard;u.copyEvil=prior.copyEvil;u.copyDuel=prior.copyDuel;u.copyDuels=prior.copyDuels;u.usedAbilities=prior.usedAbilities;u.stamp=prior.stamp;if(prior.size===undefined)delete u.size;else u.size=prior.size;delete u.copyReturn;}}
function assume(s,u,id,A,enter=false,evil=false,duel=null,duels=[]){
 id=finalArchivePrintedCard(finalAvatarBasicCopyCard(id,A),A);
 if(!u.originalCard)u.originalCard=u.card;u.card=id;u.copyEvil=evil;u.copyDuel=duel;u.copyDuels=[...new Set([...duels,...(duel?[duel]:[])])];
 if(A.card(id).slug==='mountain_giant')u.size=2;else delete u.size;
 if(enter){u.ward=A.printedKeywords(A.card(id)).includes('Ward')&&!(evil&&!saintOfRedemptionActive(s,A))&&!finalCardUmbrellas(s,A.cardForPlayer?A.cardForPlayer(id,u.controller):A.card(id),A).includes('Evil');u.stealth=A.printedKeywords(A.card(id)).includes('Stealth');}
}
export function resolveCopying(s,frame,A){
 const {step,source,controller:p,selected}=frame;if(!copyingOperations.includes(step.op))return false;
 if(step.op==='copyEntry'){
  if(step.modes){const modes=step.modes;if(selected===undefined){s.choice={player:p,title:A.card(step.object.card).name+' · Choose an entry copy ability',options:modes.map((v,index)=>({label:A.card(v.origin).name+' · '+v.value,value:index})),frame};return true;}if(!Number.isInteger(selected)||!modes[selected])return true;const picked=modes[selected];A.queueEffects(s,[{...step,modes:undefined,mode:picked.value,remainingModes:modes.filter((_,i)=>i!==selected),abilityOrigin:picked.origin,abilityInstance:picked.instance}],source,p,frame.effectCard);return true;}
  const u=step.object,options=s.units.filter(v=>!v.dying&&A.card(v.card).type==='Minion'&&fits(u,A.card(v.card))&&(step.mode==='enemy'?v.controller!==p:A.nearby(v.at,u.at)&&A.regionsOverlap(s,v,u))).map(v=>({label:A.card(v.card).name,value:{card:v.card,uid:v.uid,evil:!!v.copyEvil,duels:v.copyDuels||[v.copyDuel].filter(Boolean)}}));
  if(selected===undefined&&options.length){s.choice={player:p,title:A.card(u.card).name+' · 選擇基本複製形態',options:[...options,...(step.mode==='nearby'?[{label:'不複製',value:null}]:[])],frame};return true;}
  const picked=options.find(o=>o.value.uid===selected?.uid&&o.value.card===selected.card)?.value;
  if(picked)assume(s,u,picked.card,A,true,step.mode==='enemy'||picked.evil,step.mode==='enemy'?picked.uid:null,picked.duels);
  if(!picked&&step.remainingModes?.length){A.queueEffects(s,[{...step,mode:undefined,modes:step.remainingModes,remainingModes:undefined}],source,p,frame.effectCard);return true;}
  u.copyEntryDone=true;s.units.push(u);A.summonedGenesis(s,u);return true;
 }
 if(step.op==='copySnail'){
  const u=A.unit(s,source.uid);if(!u||u.dying)return true;
  const graves=[0,1].flatMap(q=>physicalCemeteryEntries(s,q,A,{actor:p,affect:true})).filter(g=>A.card(g.card).type==='Minion'&&fits(u,A.card(g.card)));
  if(selected===undefined){if(graves.length)s.choice={player:p,title:'Assimilator Snail · 放逐並複製墓地僕從',options:[...graves.map(g=>({label:A.card(g.card).name,value:g})),{label:'不複製',value:null}],frame};return true;}
  const grave=graves.find(g=>g.uid===selected?.uid&&g.card===selected.card&&g.player===selected.player);if(!grave)return true;
  if(!takeAccessGrave(s,grave,p,A))return true;s.players[grave.player].banished.push(grave.card);
  u.copyReturn={card:u.card,originalCard:u.originalCard,copyEvil:u.copyEvil,copyDuel:u.copyDuel,copyDuels:u.copyDuels,size:u.size,usedAbilities:structuredClone(u.usedAbilities||{}),stamp:u.stamp,player:p};
  if(grave.card!==u.card)u.usedAbilities={};assume(s,u,grave.card,A);u.stamp=s.next++;return true;
 }
 if(step.op==='copyHeirCost'){
  let a=step.action;const accessAffordable=()=>{const scope=a.zoneAccessScope||s.zoneAccessScope;if(!canPayZoneAccess(s,p,A,0,scope))return false;const preview=structuredClone(s),probe=commitZoneAccess(preview,p,A,{scope});preview.zoneAccessScope=probe;const casting=A.castingCard?.(preview,a)||A.card(a.card||source.card),caster=A.unit(preview,a.caster)||preview.artifacts.find(o=>o.uid===a.caster)||source;return !A.canPaySpell||A.canPaySpell(preview,p,casting,a.at,caster,a.payment,0,a.layer||'surface',a);};const graves=(accessAffordable()?[0,1]:[]).flatMap(q=>physicalCemeteryEntries(s,q,A,{actor:p,affect:false})).filter(g=>canAffectCemetery(s,p,g.player,A)).filter(g=>{const c=A.card(g.card);return c.playable&&c.type==='Minion'&&[...c.subtypes,...c.umbrellas,...(/^Sir /.test(c.name)?['Sir']:[]),...(/^Dame /.test(c.name)?['Dame']:[])].some(t=>['Knight','Sir','Dame'].includes(t))&&fits({at:a.at},c);});
  if(selected===undefined){s.choice={player:p,title:'Vengeful Heir · 可放逐一位亡故 Knight／Sir／Dame',options:[...graves.map(g=>({label:A.card(g.card).name,value:g})),{label:'不支付額外費用，正常施放',value:false},{label:'取消施放',value:null}],frame};return true;}
  if(selected===null)return true;
  const grave=graves.find(g=>g.uid===selected?.uid&&g.card===selected.card&&g.player===selected.player);
  if(grave){const preview=structuredClone(s),probe=commitZoneAccess(preview,p,A,{scope:a.zoneAccessScope||s.zoneAccessScope});preview.zoneAccessScope=probe;const casting=A.castingCard?.(preview,a)||A.card(a.card||source.card),caster=A.unit(preview,a.caster)||preview.artifacts.find(o=>o.uid===a.caster)||source;if(A.canPaySpell&&!A.canPaySpell(preview,p,casting,a.at,caster,a.payment,0,a.layer||'surface',a))return true;const previous=s.zoneAccessScope,scope=commitZoneAccess(s,p,A,{scope:a.zoneAccessScope||s.zoneAccessScope});s.zoneAccessScope=scope;const taken=takeAccessGrave(s,grave,p,A,scope);if(previous)s.zoneAccessScope=previous;else delete s.zoneAccessScope;if(!taken)return true;s.players[grave.player].banished.push(grave.card);a={...a,zoneAccessScope:scope};}
  const current=a.grave!==undefined&&a.graveUid?A.graveEntries(s,a.graveOwner??p).find(g=>g.uid===a.graveUid):null;
  A.commitSpell(s,{...a,...(current?{grave:current.index}:{}),heirDecided:true,...(grave?{heirCard:grave.card}:{})});return true;
 }
 return true;
}
