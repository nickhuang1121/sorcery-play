import {zoneAccessAllowed} from './cemetery-access.js';
import {finalCardUmbrellas} from './final-passives.js';
import {collectionEntries,takeCollection} from './collection.js';
export const metamorphosisOperations=['morphShapeshift','morphShapeshiftChoose','morphMonster','morphMonsterWake','morphPond'];
const fits=(u,c)=>c.playable&&(c.slug!=='mountain_giant'||u.at%5<4&&u.at<15);
export function morphAbilityAvailable(s,p,source,step,A){if(step.op!=='morphPond')return true;return s.units.some(u=>!u.dying&&u.at===source.at&&A.unitTypes(u).includes('Mortal')&&s.players[p].hand.some(h=>{const c=A.cardForPlayer?A.cardForPlayer(h.card,p):A.card(h.card);return c.type==='Minion'&&finalCardUmbrellas(s,c,A).includes('Evil')&&fits(u,c)&&Math.max(0,(c.cost||0)-(A.card(u.card).cost||0))<=A.resources(s,p).available;}));}
export function transformMinion(s,u,id,owner,A){
 const c=A.cardForPlayer?A.cardForPlayer(id,owner):A.card(id);if(!u||u.dying||A.unmodifiable(u)||c.type!=='Minion'||!fits(u,c))return false;
 const old=u.originalCard||u.card;
 if(!u.tokenCopy&&A.card(old).category!=='Token')s.players[u.owner].banished.push(old);
 u.card=id;u.owner=owner;delete u.originalCard;delete u.copyDescriptor;delete u.copyUntil;delete u.tokenCopy;delete u.copyReturn;delete u.copyEvil;delete u.copyDuel;delete u.copyDuels;delete u.copyEntryDone;
 if(c.slug==='mountain_giant')u.size=2;else delete u.size;
 return true;
}
export function handTransformActions(s,p,A){
 const result=[],r=A.resources(s,p);
 for(const h of s.players[p].hand){const c=A.cardForPlayer?A.cardForPlayer(h.card,p):A.card(h.card),rules=c.printedAbilityRecord?.passives?.handTransform?.map(v=>v.value)||[A.passives[c.slug]?.handTransform];for(const rule of rules){if(!rule||r.available<(rule.mana||0)||rule.threshold&&Object.entries(rule.threshold).some(([e,n])=>r[e]<n))continue;
  for(const u of s.units)if(u.controller===p&&!u.dying&&!A.unmodifiable(u)&&A.card(u.card).type==='Minion'&&fits(u,c)&&(rule.type?A.unitTypes(u).includes(rule.type):A.keywords(u).includes(rule.keyword))&&(!rule.sacrificeSummon||r.available>=A.summoningTax(s,c)&&A.canSummonEntry(s,p,c,u.at,u.layer||'surface')))result.push({type:'transformHand',player:p,hand:h.uid,target:u.uid,amount:rule.mana||0,...(rule.sacrificeSummon?{sacrificeSummon:true}:{})});
 }
 }
 return result;
}
export function commitHandTransform(s,a,A){const p=a.player,h=s.players[p].hand.find(h=>h.uid===a.hand),u=A.unit(s,a.target);if(!h||!u)return;
 if(a.sacrificeSummon){const at=u.at,layer=u.layer||'surface';A.kill(s,u,false,true,true);if(!u.dying&&A.unit(s,u.uid))return;s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);if(A.paySummoningTax(s,h.card,p,p)){const wolf=A.makeUnit(s,h.card,p,at);wolf.layer=layer;A.summonedGenesis(s,wolf);}return;}
 if(transformMinion(s,u,h.card,p,A)){s.players[p].spent+=a.amount;s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);}
}
export function resolveMetamorphosis(s,frame,A){
 const {step,source,selected,controller:p}=frame;if(!metamorphosisOperations.includes(step.op))return false;
 const queue=steps=>A.queueEffects(s,steps,source,p,frame.effectCard),choose=(options,title,extra={})=>{s.choice={player:p,title,options:[...options,{label:'不變身',value:null}],frame:{...frame,step:{...step,...extra}}};};
 if(step.op==='morphShapeshift'){
  const u=A.unit(s,selected?.uid);if(!u||u.dying)return true;
  const cards=s.players[p].spells.splice(0,5);queue([{op:'morphShapeshiftChoose',uid:u.uid,cards}]);return true;
 }
 if(step.op==='morphShapeshiftChoose'){
  const u=A.unit(s,step.uid),cards=step.cards||[],options=u&&!u.dying?cards.flatMap((id,index)=>A.card(id).type==='Minion'&&fits(u,A.card(id))?[{label:A.card(id).name,value:index}]:[]):[];
  if(selected===undefined&&options.length){choose(options,'Shapeshift · 選擇新形態');return true;}
  const remaining=[...cards];if(options.some(o=>o.value===selected)&&transformMinion(s,u,cards[selected],p,A))remaining.splice(selected,1);
  A.shuffle(s,remaining);s.players[p].spells.push(...remaining);return true;
 }
 if(step.op==='morphMonster'){
  const u=A.unit(s,selected?.uid);if(!u||u.dying)return true;
  const id='morph'+s.next++;u.mods.push({disabled:true,until:p,morph:id});u.ward=false;u.stealth=false;
  (s.pendingMorphs||(s.pendingMorphs=[])).push({uid:id,target:u.uid,player:p,after:s.turn});return true;
 }
 if(step.op==='morphMonsterWake'){
  const effect=(s.pendingMorphs||[]).find(e=>e.uid===step.morph),u=effect&&A.unit(s,effect.target);
  if(!u||u.dying){s.pendingMorphs=(s.pendingMorphs||[]).filter(e=>e.uid!==step.morph);return true;}
  const options=[...s.players[p].hand.filter(h=>A.card(h.card).type==='Minion'&&(A.cardForPlayer?A.cardForPlayer(h.card,p):A.card(h.card)).subtypes.includes('Monster')&&fits(u,A.card(h.card))).map(h=>({label:A.card(h.card).name+' · 手牌',value:{hand:h.uid,card:h.card}})),...(zoneAccessAllowed(s,p,A)?collectionEntries(s,p,{slug:'horrible_hybrids'},A):[]).map(entry=>({label:'Horrible Hybrids · 收藏區',value:{entry}}))];
  if(selected===undefined&&options.length){choose(options,'Monstermorphosis · 選擇新形態');return true;}
  s.pendingMorphs=s.pendingMorphs.filter(e=>e.uid!==step.morph);if(!selected)return true;
  if(selected.hand){const h=s.players[p].hand.find(h=>h.uid===selected.hand);if(h&&options.some(o=>o.value.hand===h.uid)&&transformMinion(s,u,h.card,p,A))s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);}
  else if(selected.entry){const entry=collectionEntries(s,p,{slug:'horrible_hybrids'},A).find(e=>e.index===selected.entry.index&&e.card===selected.entry.card);if(entry&&takeCollection(s,p,entry,A))transformMinion(s,u,entry.card,p,A);}
  return true;
 }
 if(step.op==='morphPond'){
  const u=A.unit(s,step.target||selected?.uid);if(!u||u.dying||u.at!==source.at||!A.unitTypes(u).includes('Mortal'))return true;
  const options=s.players[p].hand.filter(h=>A.card(h.card).type==='Minion'&&finalCardUmbrellas(s,A.cardForPlayer?A.cardForPlayer(h.card,p):A.card(h.card),A).includes('Evil')&&fits(u,A.card(h.card))).map(h=>({hand:h,cost:Math.max(0,(A.card(h.card).cost||0)-(A.card(u.card).cost||0))})).filter(o=>o.cost<=A.resources(s,p).available);
  if(!step.target){queue([{op:'morphPond',target:u.uid}]);return true;}
  if(selected===undefined){if(options.length)choose(options.map(o=>({label:A.card(o.hand.card).name+' · '+o.cost+' 魔力',value:o.hand.uid})),'Sinister Pond · 選擇 Evil');return true;}
  const entry=options.find(o=>o.hand.uid===selected);if(entry&&transformMinion(s,u,entry.hand.card,p,A)){s.players[p].spent+=entry.cost;s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==entry.hand.uid);}return true;
 }
 return true;
}
