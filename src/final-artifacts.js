import {intrinsicModificationLocked,unitModificationPlan} from './final-ability-layers.js';
// Explicit final-101 artifact rules. The engine owns action validation, costs,
// damage and zone changes; this module owns serializable continuations.
import {regionalDistance} from './geography.js';
import {canAffectCemetery,canPayZoneAccess} from './cemetery-access.js';
import {placedGrid} from './final-grids.js';
import {globeActive,geometryLocationRecords} from './final-geometry.js';

export const finalArtifactDefinitions={
  the_pallid_bust:{genesis:[{op:'finalPallidBust'}]},
  cage_of_sidrak:{genesis:[{op:'finalCage'}]},
  koscheis_egg:{genesis:[{op:'finalEgg'}]},
  corpse_catapult:{activated:[{label:'橫置持有者與同處盟友，放逐亡故僕從：屍體投射',bearerSource:true,steps:[{op:'finalCatapult'}]}]},
  doomsday_device:{end:[{op:'finalDoomsday'}]},
};
export const finalArtifactPassives={
  key_to_the_city:{protectedFromSites:true},
  tabula_rasa:{cannotDrop:true,castToAnyMinion:true,tabulaRasa:true},
  cage_of_sidrak:{cageOfSidrak:true},
  koscheis_egg:{koscheisEgg:true},
  tombstone_wardens:{tombstoneWardens:true},
  doomsday_device:{doomsdayDevice:true,everyEnd:true},
};
export const finalArtifactOperations=['finalCage','finalEgg','finalCatapult','finalDoomsday','finalPallidBust'];
// Compatibility export for existing effect tests; production uses the same
// registered definition after the source consumer and layer audits.
export const pallidPreparedDefinitions={the_pallid_bust:finalArtifactDefinitions.the_pallid_bust};
// Directly read from the official printed card image via background browser,
// 2026-10-30: https://sorcerytcg.com/cards/doomsday_device . Blank corners are 0.
export const doomsdayGrid=[[0,2,4,2,0],[2,4,8,4,2],[4,8,20,8,4],[2,4,8,4,2],[0,2,4,2,0]];
export const finalArtifactPending={};
const layer=u=>u.layer||'surface';
const live=(a)=>a&&!a.silenced&&!a.disabled;
const same=(a,b,A)=>layer(a)===layer(b)&&A.occupied(a).some(at=>A.occupied(b).includes(at));
const artifact=(s,id)=>s.artifacts.find(a=>a.uid===id);

// Call from cards.install after the printed cards/maps have been installed.
// Pre-register this deterministic ID so a saved Automaton can be restored in a
// fresh page without depending on previously played games.
export function registerFinalArtifactCards(card,runtimeCard){
  return runtimeCard(card('tombstone_wardens').id,'tombstone_wardens_angel',{
    type:'Minion',subtypes:['Angel','Automaton'],keywords:['Airborne'],
    artifactUnit:true,attack:5,defense:5,rules:'Airborne',
  });
}

// Must run before the normal unit continuous-effect reset. Converting preserves
// UID/ownership/location and the original card for normal death/return handling.
export function prepareFinalArtifacts(s,A){
  const animatedId=registerFinalArtifactCards(A.card,A.runtimeCard);
  for(const a of s.artifacts)if(A.passives[A.card(a.card).slug]?.doomsdayDevice&&a.finalDoomCounters===undefined)a.finalDoomCounters=6;
  for(const a of [...s.artifacts])if(A.passives[A.card(a.card).slug]?.tombstoneWardens&&(A.artifactController?.(s,a)??a.controller??a.owner)!==s.active&&live(a)){
    s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);
    s.units.push({...a,card:animatedId,originalCard:a.card,finalWarden:true,
      born:a.born??0,tapped:!!a.tapped,damage:a.damage||0,mods:a.mods||[],
      ward:!!a.ward,stealth:false});
  }
  for(const u of [...s.units])if(u.finalWarden&&u.controller===s.active){
    s.units=s.units.filter(v=>v.uid!==u.uid);
    const a={...u,card:u.originalCard,bearer:null};
    delete a.originalCard;delete a.finalWarden;delete a.dying;
    s.artifacts.push(a);
  }
  for(const u of s.units){u.finalTabula=false;u.finalCaged=false;}
  for(const a of s.artifacts)if(live(a)&&A.passives[A.card(a.card).slug]?.tabulaRasa){
    const u=A.unit(s,a.bearer);if(!u||u.dying||intrinsicModificationLocked(u,A))continue;
    const guard=unitModificationPlan(s,u,A).guard;
    if(!guard||guard.timestamp>(a.stamp||0))u.finalTabula=true;
  }
}

// Must run AFTER normal unmodifiable cleanup, since Tabula's own silence must
// survive that cleanup. It does not grant Monks' exception for Ward.
export function finishFinalArtifacts(s,A){
  for(const u of s.units)if(u.finalTabula){
    u.mods=[];u.silenced=true;u.ongoingPower=0;u.grantedKeywords=[];
    u.grantedTypes=[];u.grantedMovement=0;u.grantedRange=0;u.deniedKeywords=[];
    u.ward=false;u.stealth=false;u.zeroPower=false;u.powerSuppressed=false;
    u.iceTurns=0;u.iceMagicProtection=false;u.boundSpellcaster=false;
    u.cocoon=false;u.effectDisabled=false;u.carryDisabled=false;
    u.bellyDisabled=false;u.conditionDisabled=false;u.boundDisabled=false;
    u.restraintDisabled=false;
  }
  for(const u of s.units)if(u.finalCage){
    const cage=artifact(s,u.finalCage.uid),old=u.finalCage;
    // A teleport away escapes. Nonteleport forced movement must be rejected by
    // finalCageForceAllowed before committing movement (engine integration).
    if(!cage||u.at!==old.at||layer(u)!==old.layer){delete u.finalCage;continue;}
    u.at=cage.at;u.layer=layer(cage);old.at=u.at;old.layer=layer(u);
    u.tapped=true;u.finalCaged=true;u.effectDisabled=true;
  }
  for(const bond of s.finalEggBonds||[]){
    if(!artifact(s,bond.egg)){s.winner=1-bond.player;s.phase='over';}
  }
}

export function finalCageForceAllowed(u,teleport=false){return !u.finalCage||teleport;}
export function finalEggPreventsDeathblow(s,p){
  return (s.finalEggBonds||[]).some(b=>b.player===p&&artifact(s,b.egg));
}
// Call exactly once at the end of p's turn, before finishTurn changes active.
export function endFinalArtifacts(s,p,A){
  for(const bond of s.finalEggBonds||[])if(bond.player===p){
    bond.turns++;
    if(bond.turns>=3){s.winner=1-p;s.phase='over';}
  }
}

export function finalCatapultAvailable(s,object,p,A){
  const u=A.unit(s,object?.bearer);
  return !!u&&u.controller===p&&!u.dying&&!u.tapped&&!A.disabled(u)&&
    (A.card(u.card).type==='Avatar'||u.born<s.turn||A.keywords(u).includes('Charge'))&&
    s.units.some(v=>v.uid!==u.uid&&v.controller===p&&!v.dying&&!v.tapped&&!A.disabled(v)&&
      (A.card(v.card).type==='Avatar'||v.born<s.turn||A.keywords(v).includes('Charge'))&&same(v,u,A))&&
    canPayZoneAccess(s,p,A)&&[0,1].some(q=>canAffectCemetery(s,p,q,A)&&A.graveEntries(s,q).some(g=>A.card(g.card).type==='Minion'));
}

export function resolveFinalArtifacts(s,frame,A){
  const {step,source,selected,controller:p}=frame;
  if(!finalArtifactOperations.includes(step.op))return false;
  if(step.op==='finalDoomsday'){
    const device=artifact(s,source.uid);if(!device||!live(device)||device.finalDoomDetonated)return true;
    if(device.finalDoomCounters===undefined)device.finalDoomCounters=6;
    if(device.finalDoomCounters<=0)return true;
    device.finalDoomCounters--;
    if(device.finalDoomCounters>0)return true;
    device.finalDoomDetonated=true;
    const pattern=doomsdayGrid.flatMap((row,y)=>row.flatMap((amount,x)=>amount?[[x-2,2-y,amount]]:[]));
    const projected=placedGrid(device.at,pattern,0,globeActive(s,A.card)),hits=new Map();
    for(const hit of projected){const previous=hits.get(hit.at);if(previous&&previous.amount!==hit.amount)throw Error('Unresolved unequal damage-grid projection');hits.set(hit.at,hit);}
    // Project ruling: repeated equal values on one physical square count once.
    // Doomsday's actual first/last rows are equal; no max/sum policy is inferred
    // for a hypothetical collision between different printed values.
    const grid=[...hits.values()];
    // Codex Damage Grid restricts the region; Oversized Units explicitly adds
    // damage at every occupied square. Aggregate simultaneous damage once/unit.
    for(const u of [...s.units])if(!u.dying){
      const amount=geometryLocationRecords(u).reduce((n,loc)=>{
        const overlap=A.regionsOverlap?A.regionsOverlap(s,device,loc):A.region(s,loc)===A.region(s,device);
        return n+(overlap?grid.filter(hit=>hit.at===loc.at).reduce((sum,hit)=>sum+hit.amount,0):0);
      },0);
      if(amount>0)A.hurt(s,u,amount,false,'ability',device);
    }
    // The printed effect specifies damage, not a sacrifice/destroy instruction.
    // The spent device stays in the realm and cannot detonate again at zero.
    return true;
  }
  if(step.op==='finalCage'){
    const cage=artifact(s,source.uid);if(!cage)return true;
    for(const u of s.units)if(!u.dying&&A.card(u.card).type==='Minion'&&A.power(u)<=2&&
      !A.unmodifiable(u)&&A.fiftyForceAllowed(s,u,p,A)&&
      A.canEnterOnGround(s,u,u,{at:cage.at,layer:layer(cage)},A.card,A.keywords,true)){
      u.at=cage.at;u.layer=layer(cage);u.tapped=true;u.notRest=true;
      u.finalCage={uid:cage.uid,at:cage.at,layer:layer(cage)};
      u.finalCaged=true;u.effectDisabled=true;
    }
    return true;
  }
  if(step.op==='finalEgg'){
    const egg=artifact(s,source.uid),bearer=egg&&A.unit(s,egg.bearer);
    if(bearer&&A.card(bearer.card).type==='Avatar'){
      const bonds=s.finalEggBonds||(s.finalEggBonds=[]);
      if(!bonds.some(b=>b.egg===egg.uid))bonds.push({egg:egg.uid,avatar:bearer.uid,player:bearer.controller,turns:0,createdTurn:s.turn});
    }
    return true;
  }
  if(step.op==='finalPallidBust'){
    const graves=[0,1].flatMap(q=>A.effectGraveEntries?A.effectGraveEntries(s,q,p):canAffectCemetery(s,p,q,A)?A.graveEntries(s,q):[]).filter(g=>A.card(g.card).type==='Minion');
    if(selected===undefined){if(graves.length)s.choice={player:p,title:'The Pallid Bust · 放逐亡故僕從',options:graves.map(g=>({label:A.card(g.card).name,value:g})),frame};return true;}
    const g=graves.find(g=>g.uid===selected?.uid&&g.card===selected?.card&&g.player===selected?.player);
    if(!g)return true;
    A.takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);
    const object=artifact(s,source.uid);if(object)object.pallidPrintedCard=g.card;
    return true;
  }
  if(step.op==='finalCatapult'){
    const object=artifact(s,step.object)||s.artifacts.find(a=>a.bearer===source.uid&&A.card(a.card).slug==='corpse_catapult');
    if(!object||!finalCatapultAvailable(s,object,p,A))return true;
    const bearer=A.unit(s,object.bearer);
    const queue=extra=>A.queueEffects(s,[{op:'finalCatapult',object:object.uid,...extra}],source,p,object.card,{scope:frame.zoneAccessScope||s.zoneAccessScope});
    const choose=(options,title)=>{s.choice={player:p,title,options:[...options,{label:'取消（不支付費用）',value:null}],frame:{...frame,step:{...step,object:object.uid}}};};
    if(selected===null)return true;
    if(!step.crew){
      const options=s.units.filter(u=>u.uid!==bearer.uid&&u.controller===p&&!u.dying&&!u.tapped&&!A.disabled(u)&&
        (A.card(u.card).type==='Avatar'||u.born<s.turn||A.keywords(u).includes('Charge'))&&same(u,bearer,A));
      if(selected===undefined){choose(options.map(u=>({label:A.card(u.card).name,value:u.uid})),'Corpse Catapult · 選擇裝填盟友');return true;}
      if(options.some(u=>u.uid===selected))queue({crew:selected});return true;
    }
    if(!step.grave){
      const graves=[0,1].flatMap(q=>A.effectGraveEntries?A.effectGraveEntries(s,q,p):canAffectCemetery(s,p,q,A)?A.graveEntries(s,q):[]).filter(g=>A.card(g.card).type==='Minion');
      if(selected===undefined){choose(graves.map(g=>({label:A.card(g.card).name,value:g})),'Corpse Catapult · 放逐亡故僕從');return true;}
      const g=graves.find(g=>g.uid===selected?.uid&&g.card===selected.card&&g.player===selected.player);
      if(g)queue({crew:step.crew,grave:g});return true;
    }
    const crew=A.unit(s,step.crew),g=A.graveEntries(s,step.grave.player).find(g=>g.uid===step.grave.uid&&g.card===step.grave.card);
    if(!crew||crew.tapped||A.disabled(crew)||!same(crew,bearer,A)||!g)return true;
    const options=A.selectEffects(s,{source:bearer,controller:p,effectCard:object.card},{kind:'location',steps:3,sameRegion:true})
      .filter(o=>regionalDistance(s,bearer,o.value.at,A.card)<=3);
    if(selected===undefined){choose(options,'Corpse Catapult · 三步內落點');return true;}
    const spot=options.find(o=>o.value.at===selected?.at&&o.value.layer===selected.layer)?.value;
    if(!spot)return true;
    // Revalidate and pay all three costs together, after the player confirms.
    bearer.tapped=true;crew.tapped=true;
    for(const u of [bearer,crew]){u.notRest=true;u.stealth=false;u.interactedTurn=s.turn;}
    A.takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);
    const amount=Math.max(0,A.card(g.card).attack||0);
    for(const u of s.units)if(!u.dying&&A.occupied(u).includes(spot.at)&&layer(u)===(spot.layer||layer(bearer)))A.hurt(s,u,amount,false,'ability',bearer);
    return true;
  }
  return true;
}
