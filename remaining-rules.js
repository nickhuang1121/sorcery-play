import {unitPassiveLayerViews} from './final-ability-layers.js';
import {spatialForcedSubmergeAllowed} from './borrowed-spatial.js';
import {geometryLocationRecords,occupiesGeometryLocation,geometryPlaceSiteAllowed} from './final-geometry.js';
// Explicit card rules, audited against the October 2026 Codex and card FAQs.
export const remainingBatches = [
 ['iron_man_talus','driftwood_marrows','hemogolem','purge_juggernaut','clay_golem'],
 ['arcade_of_bones','land_deed','king_arthur','endless_fence','duplicator'],
 ['swap','backstab','blasphemy','awakened_mummies','haystack'],
];
export const remainingPassives = {
 iron_man_talus:{cannotDisable:true,cannotForce:true},
 driftwood_marrows:{noForcedSubmergeNearby:true}, hemogolem:{strikeHeal:true,damageToController:true},
 clay_golem:{}, purge_juggernaut:{},
 arcade_of_bones:{undeadRowProtection:true}, land_deed:{controlBearerSite:true},
 king_arthur:{ownershipRule:true}, endless_fence:{voidEntryFence:true},
 duplicator:{uniquePairs:true}, awakened_mummies:{mustBelow:true,ambushAbove:true},
 haystack:{searchTopThree:true},
};
export const remainingDefinitions = {
 swap:{cast:[{op:'remainingSwap',select:{kind:'unitOrArtifact',minion:true}}]},
 backstab:{cast:[{op:'remainingBackstab',select:{kind:'unit',minion:true}}]},
 blasphemy:{cast:[{op:'remainingBlasphemy'}]},
 purge_juggernaut:{start:[{op:'remainingPurge'}]},
 clay_golem:{death:[{op:'remainingClay',select:{kind:'location',adjacent:true,voidOrRubble:true,surface:true}}]},
};
export const remainingOperations=['remainingDeclare','remainingSwap','remainingSwapTarget','remainingSwapPlace','remainingBackstab','remainingBackstabTarget','remainingBackstabMove','remainingBlasphemy','remainingBlasphemyPick','remainingBlasphemyDestroy','remainingPurge','remainingPurgeKill','remainingClay','remainingMummy','remainingHemogolem'];
export function arthurActive(s,A){return s.units.some(u=>!u.dying&&!A.disabled(u)&&unitPassiveLayerViews(s,u,A,'ownershipRule').some(l=>l.value));}
export function searchLimit(s,p,A){return s.board.some(site=>site&&site.controller!==p&&!site.silenced&&!site.disabled&&A.passives[A.card(site.card).slug]?.searchTopThree)?3:Infinity;}
export function restoreRemainingControl(s){for(const site of s.board)if(site?.remainingControl){if(site.controller!==site.remainingControl.applied)site.remainingControl.native=site.controller;site.controller=site.remainingControl.native;delete site.remainingControl;}}
export function refreshRemaining(s,A){
 const {card,passives,unitTypes,disabled,nearby,region,regionsOverlap,regionNames,unit}=A;
 const active=u=>!u.dying&&!u.silenced&&!disabled(u);
 for(const u of s.units){u.rowFree=false;u.freeRows=[];}
 for(const a of s.artifacts)if(!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.undeadRowProtection)for(const u of s.units)if(unitTypes(u).includes('Undead')&&regionsOverlap(s,u,a)){u.freeRows.push(Math.floor(a.at/5));if(Math.floor(u.at/5)===Math.floor(a.at/5)){u.rowFree=true;u.magicProtected=true;u.magicDamageProtected=true;}}
 const deeds=s.artifacts.filter(a=>!a.silenced&&!a.disabled&&passives[card(a.card).slug]?.controlBearerSite&&active(unit(s,a.bearer)||{dying:true})).sort((a,b)=>(a.stamp||0)-(b.stamp||0));
 for(const a of deeds){const site=s.board[a.at],bearer=unit(s,a.bearer);if(!site||site.completionProtected||passives[card(site.card).slug]?.immutableSite)continue;if(!site.remainingControl)site.remainingControl={native:site.controller};site.controller=bearer.controller;site.remainingControl.applied=site.controller;}
 if(arthurActive(s,A)){
  for(const u of s.units)if(u.controller!==u.owner){if(!u.kingApplied)u.nativeController=u.controller;u.controller=u.owner;u.kingApplied=true;u.kingController=u.controller;}
  for(const site of s.board)if(site&&(site.owner===0||site.owner===1)&&site.controller!==site.owner){if(!site.remainingControl)site.remainingControl={native:site.controller};site.controller=site.owner;site.remainingControl.applied=site.controller;}
 }
}
export function forcedSubmergeAllowed(s,u,to,A){
 if((u.layer||'surface')==='below'||to.layer!=='below'||!A.waterSite(s,to.at,A.card))return true;
 return spatialForcedSubmergeAllowed(s,u,to,A);
}
export function resolveRemaining(s,frame,A){
 const {step,source,controller:p,selected}=frame,op=step.op;
 if(!remainingOperations.includes(op))return false;
 const {card,unit,queueEffects,occupied,region,regionsOverlap,regionNames,locations,keywords,disabled,power,canEnterOnGround}=A;
 const queue=(steps,src=source,player=p)=>queueEffects(s,steps,src,player,frame.effectCard);
 const choose=(options,extra={},player=p)=>{if(options.length)s.choice={player,title:card(frame.effectCard).name,options,frame:{...frame,step:{...step,...extra}}};};
 const object=t=>t?.entity==='unit'?unit(s,t.uid):s.artifacts.find(a=>a.uid===t?.uid);
 const targetable=t=>A.canTarget(s,p,t,source,frame.effectCard)&&!(t.magicProtected&&!disabled(t));
 const same=(a,b)=>geometryLocationRecords(a).some(loc=>occupiesGeometryLocation(b,loc.at,loc.layer));
 const canTeleport=(u,to)=>u&&(!s.units.includes(u)||A.fiftyForceAllowed(s,u,p,A)&&forcedSubmergeAllowed(s,u,to,A))&&occupied({...u,at:to.at}).every((at,i)=>at>=0&&at<20&&(u.size!==2||to.at%5<4&&to.at<15)&&canEnterOnGround(s,u,{at:occupied(u)[i],layer:u.layer||'surface'},{at,layer:to.layer},card,keywords,true));
 if(op==='remainingHemogolem'){const u=unit(s,step.uid);if(u)A.hurt(s,A.avatar(s,u.controller),step.amount,false,'ability',u);return true;}
 if(op==='remainingClay'){const id=s.players[p].atlas[0];if(id&&(!s.board[selected.at]||card(s.board[selected.at].card).slug==='rubble')&&geometryPlaceSiteAllowed(s,card(id),selected.at,card))A.enterSite(s,p,s.players[p].atlas.shift(),selected.at);return true;}
 if(op==='remainingDeclare'){if(selected!==null)A.commitSpell(s,{...step.action,remainingSecond:selected},step.first);return true;}
 if(op==='remainingSwap'){
  const first=object(selected);if(!first)return true;
  if(step.second)return resolveRemaining(s,{...frame,step:{...step,op:'remainingSwapTarget',first:selected},selected:step.second},A);
  choose(secondTargetOptions(s,frame,selected,A),{op:'remainingSwapTarget',first:selected});return true;
 }
 if(op==='remainingSwapTarget'){
  const a=object(step.first),b=object(selected);if(!a||!b||!targetable(a)||!targetable(b))return true;
  const options=occupied(a).flatMap(atA=>occupied(b).map(atB=>({label:`${atA+1} ↔ ${atB+1}`,value:{atA,atB}})));
  if(options.length>1){choose(options,{op:'remainingSwapPlace',second:selected});return true;}
  return resolveRemaining(s,{...frame,step:{...step,op:'remainingSwapPlace',second:selected},selected:options[0].value},A);
 }
 if(op==='remainingSwapPlace'){
  const a=object(step.first),b=object(step.second);if(!a||!b||!targetable(a)||!targetable(b))return true;
  const toA={at:selected.atB,layer:b.layer||'surface'},toB={at:selected.atA,layer:a.layer||'surface'};
  if(!canTeleport(a,toA)||!canTeleport(b,toB))return true;
  if(A.blocked(s,p,a)||A.blocked(s,p,b))return true;
  const bearerA=a.bearer, bearerB=b.bearer,carrierA=a.carriedBy,carrierB=b.carriedBy;
  for(const [u,to] of [[a,toA],[b,toB]]){u.at=to.at;u.layer=to.layer;u.carryTeleport=true;u.notRest=true;u.burrowedSafely=false;}
  if(s.artifacts.includes(a))a.bearer=bearerB||carrierB||null;
  if(s.artifacts.includes(b))b.bearer=bearerA||carrierA||null;
  if(s.units.includes(a))delete a.carriedBy;if(s.units.includes(b))delete b.carriedBy;
  return true;
 }
 if(op==='remainingBackstab'){
  const a=unit(s,selected.uid);if(!a)return true;
  if(step.second)return resolveRemaining(s,{...frame,step:{...step,op:'remainingBackstabTarget',first:a.uid},selected:step.second},A);
  choose(secondTargetOptions(s,frame,selected,A),{op:'remainingBackstabTarget',first:a.uid});return true;
 }
 if(op==='remainingBackstabTarget'){
  const a=unit(s,step.first),b=unit(s,selected.uid);if(!a||!b||!b.tapped||!targetable(a)||!targetable(b)||A.blocked(s,p,a)||A.blocked(s,p,b))return true;
  if(same(a,b)){A.strike(s,a,b);return true;}
  const options=locations(s,a,card,keywords,true).filter(to=>occupied({...a,at:to.at}).some(at=>occupied(b).includes(at))&&to.layer===(b.layer||'surface')&&A.fiftyForceAllowed(s,a,p,A)).map(to=>({label:`${to.at+1}`,value:{at:to.at,layer:to.layer}}));
  choose(options,{op:'remainingBackstabMove',target:b.uid});return true;
 }
 if(op==='remainingBackstabMove'){
  const a=unit(s,step.first),b=unit(s,step.target);if(!a||!b||!A.fiftyForceAllowed(s,a,p,A))return true;
  const to=locations(s,a,card,keywords,true).find(v=>v.at===selected.at&&v.layer===selected.layer);if(!to)return true;
  a.at=to.at;a.layer=to.layer;a.notRest=true;a.burrowedSafely=false;queue([{op:'remainingMummy',fighter:a.uid,target:b.uid,strikeOnly:true}]);return true;
 }
 if(op==='remainingBlasphemy'){
  const minions=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion');
  for(const u of minions)for(const at of occupied(u))A.damageSite(s,at,1,u);
  queue([{op:'remainingBlasphemyPick',uids:[...minions.filter(u=>u.controller===s.active),...minions.filter(u=>u.controller!==s.active)].map(u=>u.uid),picked:[],minions:minions.map(u=>u.uid)}]);return true;
 }
 if(op==='remainingBlasphemyPick'){
  const uids=[...step.uids];const uid=uids.shift(),u=unit(s,uid);let picked=[...step.picked];
  if(u){const all=[...s.artifacts,...s.units.filter(a=>!a.dying&&card(a.card).artifactUnit)].filter(a=>same(u,a)),available=all.filter(a=>!picked.includes(a.uid)),options=(available.length?available:all).map(a=>({label:card(a.card).name,value:a.uid}));
   if(selected===undefined&&options.length){choose(options,{},u.controller);return true;}
   if(options.some(o=>o.value===selected))picked.push(selected);
  }
  queue([uids.length?{...step,uids,picked}:{op:'remainingBlasphemyDestroy',picked,minions:step.minions}]);return true;
 }
 if(op==='remainingBlasphemyDestroy'){
  for(const uid of new Set(step.picked)){const a=s.artifacts.find(a=>a.uid===uid)||s.units.find(a=>a.uid===uid&&card(a.card).artifactUnit);if(a){if(a.ward)a.ward=false;else A.removeObject(s,a,'cemetery');}}
  for(const uid of step.minions){const u=unit(s,uid);if(u){u.tapped=true;u.skipUntap=true;}}return true;
 }
 if(op==='remainingPurge'){
  const u=unit(s,source.uid);if(!u||u.dying||u.silenced||disabled(u))return true;u.tapped=true;
  const options=locations(s,u,card,keywords,true).filter(to=>to.path.length===1).map(to=>({label:`${to.at+1} · ${to.layer}`,value:{at:to.at,layer:to.layer}}));
  if(selected===undefined){choose(options);return true;}if(!options.some(o=>o.value.at===selected.at&&o.value.layer===selected.layer))return true;
  u.at=selected.at;u.layer=selected.layer;u.notRest=true;queue([{op:'remainingPurgeKill',uid:u.uid}]);return true;
 }
 if(op==='remainingPurgeKill'){const u=unit(s,step.uid);if(u)for(const v of [...s.units])if(v.uid!==u.uid&&!v.dying&&card(v.card).type==='Minion'&&same(u,v))A.kill(s,v,false,true);return true;}
 if(op==='remainingMummy'){
  const u=unit(s,step.fighter),v=unit(s,step.target);if(!u||!v||u.dying||v.dying)return true;
  if(!step.strikeOnly){if(u.silenced||disabled(u)||u.layer!=='below'||(v.layer||'surface')!=='surface'||!occupied(v).includes(u.at)||!A.fiftyForceAllowed(s,u,u.controller,A))return true;u.layer='surface';u.burrowedSafely=false;}
  if(same(u,v)){if(step.strikeOnly)A.strike(s,u,v);else queue([{op:'fightStage',phase:'first',fight:{kind:'spell',attacker:u.uid,defenders:[v.uid]}}],u,u.controller);}return true;
 }
 return true;
}

export function secondTargetOptions(s,frame,first,A){
 const c=A.card(frame.effectCard),a=A.unit(s,first?.uid)||s.artifacts.find(v=>v.uid===first?.uid);if(!a)return [];
 if(c.slug==='swap')return A.selectEffects(s,frame,{kind:'unitOrArtifact',minion:true}).filter(o=>o.value.uid!==a.uid);
 const same=(a,b)=>geometryLocationRecords(a).some(loc=>occupiesGeometryLocation(b,loc.at,loc.layer));
 return A.selectEffects(s,frame,{kind:'unit',minion:true,tapped:true,excludeUid:a.uid}).filter(o=>{const b=A.unit(s,o.value.uid);return same(a,b)||A.locations(s,a,A.card,A.keywords,true).some(to=>A.occupied({...a,at:to.at}).some(at=>A.occupied(b).includes(at))&&to.layer===(b.layer||'surface'));});
}

remainingBatches.push(['black_cat','kythera_mechanism','rat_king','undertaker_engine','grim_reaper']);
Object.assign(remainingPassives,{black_cat:{nineLives:true,opponentRandomControl:true},kythera_mechanism:{bearerRandomControl:true},grim_reaper:{reapKills:true},rat_king:{},undertaker_engine:{}});
Object.assign(remainingDefinitions,{rat_king:{genesis:[{op:'remainingRats'}],death:[{op:'remainingRats'}]},undertaker_engine:{end:[{op:'remainingUndertaker'}]}});
remainingOperations.push('remainingCatCheck','remainingRats','remainingRatPick','remainingUndertaker','remainingReap');
export function resolveRemainingExtra(s,frame,A){
 const {step,source,controller:p,selected}=frame,op=step.op;
 if(!['remainingRats','remainingRatPick','remainingUndertaker','remainingReap'].includes(op))return false;
 const {card,unit,occupied,queueEffects}=A;
 const queue=steps=>queueEffects(s,steps,source,p,frame.effectCard);
 if(op==='remainingReap'){
  const id=step.card,owner=step.owner,same=id=>card(id).name===card(step.card).name;
  for(const u of [...s.units])if(same(u.card))A.kill(s,u,true);
  for(const g of [...(A.effectGraveEntries?A.effectGraveEntries(s,owner,p):A.graveEntries(s,owner))].reverse())if(same(g.card)){A.takeGrave(s,owner,g.index,g.card,g.uid);s.players[owner].banished.push(g.card);}
  s.players[owner].hand=s.players[owner].hand.filter(h=>{if(!same(h.card))return true;s.players[owner].banished.push(h.card);return false;});
  const limit=searchLimit(s,p,A);s.players[owner].spells=s.players[owner].spells.filter((c,index)=>{if(!same(c)||index>=limit)return true;s.players[owner].banished.push(c);return false;});A.shuffle(s,s.players[owner].spells);return true;
 }
 if(op==='remainingRats'){const pool=s.players[p].spells.splice(0,Math.min(6,searchLimit(s,p,A)));queue([{op:'remainingRatPick',pool,sites:[]}]);return true;}
 if(op==='remainingRatPick'){
  const pool=[...step.pool],sites=[...step.sites];
  const options=pool.flatMap((id,index)=>{const c=card(id);return c.playable&&c.type==='Minion'&&c.slot==='Ordinary'&&/\brats?\b/i.test(c.name)?s.board.flatMap((site,at)=>site&&!sites.includes(at)&&A.distance(source.at,at)===1&&A.canSummonEntry(s,p,c,at,source.layer||'surface')&&A.resources(s,p).available>=A.summoningTax(s,c)?[{label:c.name+' · '+(at+1),value:{index,at}}]:[]):[];});
  if(selected===undefined&&options.length){s.choice={player:p,title:'Rat King · 可召喚 Ordinary rat',options:[...options,{label:'完成，將其餘放到牌庫底部',value:null}],frame};return true;}
  if(selected!==null&&options.some(o=>o.value.index===selected?.index&&o.value.at===selected.at)){
   const id=pool.splice(selected.index,1)[0];sites.push(selected.at);queue([{op:'remainingRatPick',pool,sites}]);
   if(A.paySummoningTax(s,id,p,p)){const u=A.makeUnit(s,id,p,selected.at);u.layer=source.layer||'surface';A.summonedGenesis(s,u);}return true;
  }
  if(pool.length)queue([{op:'orderDeck',deck:'spells',count:pool.length,pool,destination:'bottom'}]);return true;
 }
 if(op==='remainingUndertaker'){
  const engine=unit(s,source.uid);if(!engine||engine.dying||engine.silenced||A.disabled(engine))return true;
  const picked=[...(step.picked||[])],objects=[...s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'),...s.artifacts].filter(o=>occupied(o).includes(engine.at));
  const options=objects.filter(o=>!picked.includes(o.uid)).flatMap(o=>{const layer=o.layer==='below'?'surface':'below';if(layer==='below'&&A.waterSite(s,o.at,card))return [];if(s.units.includes(o)&&!A.fiftyForceAllowed(s,o,p,A))return [];return [{label:(layer==='below'?'Burrow ':'Unburrow ')+card(o.card).name,value:o.uid}];});
  if(selected===undefined){s.choice={player:p,title:'Undertaker Engine · 選擇要翻轉層級的牌',options:[...options,{label:'確認',value:null}],frame:{...frame,step:{...step,picked}}};return true;}
  if(selected!==null&&options.some(o=>o.value===selected)){queue([{...step,picked:[...picked,selected]}]);return true;}
  for(const uid of picked){const o=objects.find(o=>o.uid===uid);if(!o)continue;const next=o.layer==='below'?'surface':'below';if(next==='below'&&s.units.includes(o)){if(A.waterSite(s,o.at,card)){if(!A.keywords(o).includes('Submerge'))o.mods.push({keyword:'Submerge'});}else o.burrowedSafely=true;}else if(s.units.includes(o))o.burrowedSafely=false;o.layer=next;o.notRest=true;}return true;
 }
 return true;
}

remainingBatches.push(['arcane_barrage','assorted_animals','blaze_of_glory','monks_of_kobalsa','the_doom_of_dilmun']);
Object.assign(remainingPassives,{arcane_barrage:{xCost:true},assorted_animals:{xCost:true},monks_of_kobalsa:{unmodifiable:true,wardException:true},the_doom_of_dilmun:{unmodifiable:true,unkillable:true}});
Object.assign(remainingDefinitions,{arcane_barrage:{cast:[{op:'projectile',amount:1,count:0}]},assorted_animals:{cast:[{op:'remainingAnimals'}]},blaze_of_glory:{cast:[{op:'remainingGlory',select:{kind:'unit',ally:true}}]}});
remainingOperations.push('remainingX','remainingAnimals','remainingGlory','remainingGloryNext','remainingGloryFight','remainingGloryEnd');
export function resolveRemainingFinal(s,frame,A){
 const {step,source,controller:p,selected}=frame,op=step.op;
 if(!['remainingX','remainingAnimals','remainingGlory','remainingGloryNext','remainingGloryFight','remainingGloryEnd'].includes(op))return false;
 const queue=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
 if(op==='remainingX'){if(selected!==null)A.beginCast(s,{...step.action,x:selected});return true;}
 if(op==='remainingAnimals'){
  const used=step.used||[],budget=step.budget||0,eligible=step.eligible||s.players[p].spells.slice(0,searchLimit(s,p,A)),options=s.players[p].spells.flatMap((id,index)=>{const c=A.cardForPlayer?A.cardForPlayer(id,p):A.card(id);return eligible.includes(id)&&c.subtypes.includes('Beast')&&c.type==='Minion'&&!used.includes(c.name)&&(c.cost||0)<=budget?[{label:c.name+' ('+(c.cost||0)+')',value:index}]:[];});
  if(selected===undefined){s.choice={player:p,title:'Assorted Animals · 剩餘 '+budget,options:[...options,{label:'完成並洗牌',value:null}],frame};return true;}
  if(selected!==null&&options.some(o=>o.value===selected)){const id=s.players[p].spells.splice(selected,1)[0],c=A.card(id);s.players[p].hand.push({uid:'h'+s.next++,card:id});A.log(s,'揭示 '+c.name+' 並加入手牌。');queue([{...step,eligible,budget:budget-(c.cost||0),used:[...used,c.name]}]);return true;}
  A.shuffle(s,s.players[p].spells);return true;
 }
 if(op==='remainingGlory'){const u=A.unit(s,selected?.uid);if(u){u.glory=true;queue([{op:'remainingGloryNext',uid:u.uid,fought:[]}]);}return true;}
 if(op==='remainingGloryNext'){
  const u=A.unit(s,step.uid);if(!u)return true;
  const targets=s.units.filter(v=>v.uid!==u.uid&&!v.dying&&v.controller!==u.controller&&!step.fought.includes(v.uid)&&A.regionsOverlap(s,u,v)&&A.occupied(v).some(at=>A.occupied(u).some(root=>A.nearby(root,at))));
  if(!targets.length){queue([{op:'remainingGloryEnd',uid:u.uid}]);return true;}
  s.choice={player:p,title:'Blaze of Glory · 選擇下一場戰鬥',options:targets.map(v=>({label:A.card(v.card).name,value:v.uid})),frame:{...frame,step:{...step,op:'remainingGloryFight'}}};return true;
 }
 if(op==='remainingGloryFight'){
  const u=A.unit(s,step.uid),v=A.unit(s,selected);if(!u||!v)return true;
  queue([{op:'fightStage',phase:'first',fight:{kind:'spell',attacker:u.uid,defenders:[v.uid],remote:true}},{op:'remainingGloryNext',uid:u.uid,fought:[...step.fought,v.uid]}]);return true;
 }
 if(op==='remainingGloryEnd'){
  const u=A.unit(s,step.uid);if(u){delete u.glory;if(u.gloryDeathPending){delete u.gloryDeathPending;A.playerDies(s,u.controller);}}return true;
 }
 return true;
}

// Casting permission is distinct from a printed Voidwalk ability.
remainingPassives.lucid_dreamers={voidSummoning:true};
