import {abilityProjectileBarrier} from './final-ability-layers.js';
import {geometryStepOrigins} from './final-geometry.js';
import {spatialCannotForce} from './borrowed-spatial.js';
import {finalArchivePrintedCard} from './card-lineage.js';
import {geometryLocationRecords} from './final-geometry.js';
import {viewCemeteryEntries,physicalCemeteryEntries,takeAccessGrave} from './cemetery-access.js';
// Explicit rules for batches 59–68. No text-to-effect fallback.
export const fiftyBatches=[
 ['guardian_angel','harpyon_urge','vesper_swarm','tactical_move','whirling_blades'],
 ['windblast','scatter','whirlwind','call_of_the_sea','grasping_ground'],
 ['castles_ablaze','hamlets_ablaze','invasion','falling_star','rest_in_peace'],
 ['apostles_of_thamariel','ghost_ship','ultimate_horror','locusts_of_illyria','the_lady_of_the_lake'],
 ['bone_spear','ball_lightning','grapple_shot','nelly_longarms','rhongomyniad'],
 ['order_of_the_sacred_oak','goat_for_azazel','enduring_faith','makeshift_barricade','flaming_sword'],
 ['azuridge_caravan','kingdom_of_agartha','maze_minotaur','old_salt_anchorman','talamh_dreig'],
 ['just_a_rock','battering_ram','magnetic_muzzle','regurgitator','sentinel_trap'],
 ['mirage','mirror_realm','heirloom_lost','armageddon','roots_of_yggdrasil'],
 ['lord_of_destruction','onslaught','unland_eel','siege_giant','the_manor_at_daperyll_hill'],
];
export const fiftyDefinitions={
 guardian_angel:{genesis:[{op:'fiftyFly',ward:true,untargeted:true,select:{kind:'unit',minion:true,ally:true,weakerThanSource:true,other:true,notHere:true,anyRegion:true,untargeted:true}}]},
 harpyon_urge:{cast:[{op:'fiftyFlyAlly',untargeted:true,select:{kind:'unit',ally:true,anyRegion:true,untargeted:true}}]},
 vesper_swarm:{activated:[{label:'每回合一次：飛向受傷隨從',once:true,declare:true,steps:[{op:'fiftyFly',untargeted:true,select:{kind:'unit',minion:true,wounded:true,notHere:true,anyRegion:true,untargeted:true}}]}]},
 tactical_move:{cast:[{op:'fiftyTactical'}]},whirling_blades:{cast:[{op:'fiftyWhirling',untargeted:true,select:{kind:'unit',ally:true,anyRegion:true,untargeted:true}}]},
 windblast:{cast:[{op:'fiftyWind'}]},scatter:{cast:[{op:'fiftyScatter',select:{kind:'location',sameRegion:true}}]},
 whirlwind:{cast:[{op:'fiftyWhirlArea',select:{kind:'gridArea'}}]},
 call_of_the_sea:{cast:[{op:'fiftySea',select:{kind:'site',water:true}}]},grasping_ground:{cast:[{op:'fiftyGrasp'}]},
 castles_ablaze:{start:[{op:'fiftyAblaze'}]},hamlets_ablaze:{start:[{op:'fiftyAblaze'}]},
 invasion:{end:[{op:'fiftyInvasion'}]},falling_star:{end:[{op:'fiftyStar'}]},
 apostles_of_thamariel:{genesis:[{op:'fiftyApostles'}]},ghost_ship:{},ultimate_horror:{genesis:[{op:'fiftyHorror'}]},locusts_of_illyria:{end:[{op:'fiftyLocust'}]},the_lady_of_the_lake:{genesis:[{op:'fiftyLady'}]},
 bone_spear:{cast:[{op:'fiftyBone',untargeted:true,select:{kind:'unit',minion:true,ally:true,types:['Undead'],anyRegion:true,untargeted:true}}]},
 ball_lightning:{cast:[{op:'fiftyBall',amount:4}]},grapple_shot:{cast:[{op:'fiftyGrapple',untargeted:true,select:{kind:'unit',ally:true,anyRegion:true,untargeted:true}}]},
 nelly_longarms:{activated:[{label:'橫置：投射物拖回單位，可將其下潛',tap:true,declare:true,steps:[{op:'fiftyNelly'}]}]},
 rhongomyniad:{activated:[{bearerGranted:true,label:'橫置持有者：投擲貫穿長槍，造成 3 傷害',bearerTap:true,fiftyThrow:true,steps:[{op:'projectile',amount:3,piercing:true,fiftySpear:true}]}]},
 enduring_faith:{cast:[{op:'fiftyFaith',untargeted:true,select:{kind:'unit',minion:true,ally:true,anyRegion:true,untargeted:true}}]},
 just_a_rock:{genesis:[{op:'fiftyRock'}]},magnetic_muzzle:{end:[{op:'fiftyMuzzle'}]},regurgitator:{end:[{op:'fiftyRegurgitate'}]},
 sentinel_trap:{genesis:[{op:'fiftyFacing'}]},
 armageddon:{cast:[{op:'fiftyArmageddon'}]},onslaught:{cast:[{op:'fiftyOnslaught'}]},
 siege_giant:{activated:[{label:'每回合一次：投擲此處較弱友軍到附近位置',once:true,declare:true,steps:[{op:'fiftySiege',untargeted:true,select:{kind:'unit',ally:true,here:true,weaker:true,other:true,untargeted:true}}]}]},
 the_manor_at_daperyll_hill:{activated:[{label:'每回合一次：對此處敵軍造成 3 傷害，足額命中則治療 3',once:true,declare:true,threshold:{air:4},steps:[{op:'fiftyManor',select:{kind:'unit',enemy:true,here:true,siteBothLayers:true}}]}]},
};
export const fiftyPassives={
 rhongomyniad:{fiftyFirst:true},
 order_of_the_sacred_oak:{fiftySiteProtection:true},goat_for_azazel:{fiftyRedirectAll:true},makeshift_barricade:{fiftyBarricade:true},flaming_sword:{bearerPower:1,fiftySplash:true},
 azuridge_caravan:{allTypes:true},maze_minotaur:{fiftyMaze:true},old_salt_anchorman:{fiftyAnchor:true},talamh_dreig:{fiftyForceImmune:true,adjacentSitesPower:true},
 ghost_ship:{fiftyGhost:true},battering_ram:{fiftyRam:true},magnetic_muzzle:{bearerSilenced:true,cannotDrop:true,everyEnd:true},sentinel_trap:{fiftySentinel:true},
 mirage:{fiftyMirage:true},mirror_realm:{fiftyMirror:true},heirloom_lost:{fiftyHeirloom:true},roots_of_yggdrasil:{fiftyRoots:true},lord_of_destruction:{fiftyDestroyStruck:true},unland_eel:{fiftyEel:true},
};
export const fiftySitePassives={kingdom_of_agartha:{allBurrowingThreshold:3}};
export const fiftyAuras={castles_ablaze:{singleSite:true,fiftyRarities:['Elite','Unique']},hamlets_ablaze:{singleSite:true,fiftyRarities:['Ordinary','Exceptional']},invasion:{turns:3},falling_star:{},rest_in_peace:{fiftyBurrowDead:true}};
export const fiftyOperations=('fiftyFly fiftyFlyAlly fiftyFlyTarget fiftyPathDeclare fiftyPathStep fiftyPathFinish fiftyTactical fiftyWhirling fiftyWind fiftyScatter fiftyPushChoose fiftyWhirlArea fiftyWhirlDirection fiftySea fiftySeaFinish fiftyGrasp fiftyGraspTarget fiftyAblaze fiftyInvasion fiftyStar fiftyStarPlace fiftyStarStrike fiftyApostles fiftyApostlesSummon fiftyGhost fiftyHorror fiftyHorrorPlace fiftyLocust fiftyLady fiftyLadyPlace fiftyBone fiftyBall fiftyBallImpact fiftyBallBounce fiftyGrapple fiftyGrappleImpact fiftyGrappleStrike fiftyNelly fiftyNellyImpact fiftyNellySubmerge fiftyFaith fiftyRock fiftyMuzzle fiftyRegurgitate fiftyFacing fiftySentinel fiftyArmageddon fiftyArmageddonFinish fiftyOnslaught fiftySiege fiftyManor fiftyMirrorChoose fiftySiteCommit fiftyRam fiftySpearLand fiftyBoltAim fiftyBoltTravel fiftyBoltHit fiftyRockCommit fiftyRamCommit fiftyEelPull fiftyLordStrike').split(' ');

export function fiftyForceAllowed(s,u,p,api){
 const {card,disabled,nearby,region,regionNames,regionsOverlap}=api;if(!u||u.dying)return false;
 if(spatialCannotForce(s,u,p,api))return false;
 return true;
}

export function resolveFifty(s,frame,A){
 const {card,printedKeywords,unit,avatar,power,keywords,disabled,region,regionNames,regionsOverlap,nearby,distance,occupied,locations,canEnterOnGround,queueEffects,kill,hurt,strike,strikeMany,heal,removeObject,enterSite,destroySite,draw,shuffle,log,makeUnit,summonedGenesis,graveEntries,takeGrave,canSummonEntry,paySummoningTax,selectEffects,blocked,resources,siteAffinity,area,inside,artifactController,commitSiteCard}=A;
 const {step,source,controller:p,selected}=frame,op=step.op,layer=u=>u.layer||'surface',here=(a,b)=>occupied(a).some(at=>occupied(b).includes(at))&&layer(a)===layer(b),alive=uid=>{const u=unit(s,uid);return u&&!u.dying?u:null;},pos=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
 if(!fiftyOperations.includes(op))return false;
 const queue=(steps,src=source,player=p,effect=frame.effectCard)=>queueEffects(s,steps,src,player,effect);
 const choice=(options,title=card(frame.effectCard).name,extra={},player=p)=>{s.choice={player,title,options,frame:{...frame,step:{...step,...extra}}};};
 const skip={label:'略過／完成',value:null};
 const oneSteps=(u,flying=false)=>disabled(u)?[]:locations(s,u,card,v=>[...keywords(v),...(flying?['Airborne']:[])],true).filter(v=>v.path.length===1);
 const fits=(u,to,force=true,flying=false)=>to.at>=0&&to.at<20&&(u.size!==2||to.at%5<4&&to.at<15)&&(!unit(s,u.uid)||occupied({...u,at:to.at}).every((cell,i)=>canEnterOnGround(s,u,{at:occupied(u)[i],layer:layer(u)},{at:cell,layer:to.layer},card,keywords,!force,flying)));
 const moved=(u,to)=>{u.at=to.at;u.layer=to.layer;u.notRest=true;u.burrowedSafely=false;};
 const summon=(id,owner,at,toLayer='surface')=>{if(!canSummonEntry(s,p,card(id),at,toLayer)||!paySummoningTax(s,id,owner,p))return null;const u=makeUnit(s,id,owner,at);u.controller=p;u.layer=toLayer;return u;};
 const obj=v=>v?.entity==='unit'?alive(v.uid):[...s.artifacts,...s.auras].find(o=>o.uid===v?.uid);
 const forceAllowed=u=>fiftyForceAllowed(s,u,p,A);
 // Handlers below own their nested, serializable choices.
 return resolveFiftyStep();
 function resolveFiftyStep(){
  if(op==='fiftyFlyAlly'){const u=alive(selected?.uid);if(u)queue([{op:'fiftyFlyTarget',caster:source}],u);return true;}
  if(op==='fiftyFlyTarget'){
   const u=alive(source.uid);if(!u)return true;
   if(selected===undefined){const options=selectEffects(s,{...frame,source:step.caster},{kind:'unit',minion:true}).filter(o=>power(alive(o.value.uid))<power(u)&&!here(alive(o.value.uid),u));choice([...options,skip]);return true;}
   const target=alive(selected?.uid);if(target&&!blocked(s,p,target)&&power(target)<power(u))queue([{op:'fiftyPathDeclare',uid:u.uid,target:target.uid,flying:true,finish:'strike'}],u);return true;
  }
  if(op==='fiftyFly'){const u=alive(source.uid),target=alive(selected?.uid);if(u&&target&&!here(u,target)&&(!step.ward||Math.floor((power(target)+power(target,true))/2)<Math.floor((power(u)+power(u,true))/2)))queue([{op:'fiftyPathDeclare',uid:u.uid,target:target.uid,flying:true,finish:step.ward?'ward':null}],u);return true;}
  if(op==='fiftyWhirling'){const u=alive(selected?.uid);if(u)queue([{op:'fiftyPathDeclare',uid:u.uid,max:2,finish:'whirl'}],u);return true;}
  if(op==='fiftyTactical'){
   const done=step.done||[],options=s.units.filter(u=>u.controller===p&&!u.dying&&!done.includes(u.uid));if(!options.length)return true;
   if(selected===undefined){choice(options.map(u=>({label:card(u.card).name,value:u.uid})),undefined,{done});return true;}
   const u=options.find(u=>u.uid===selected);if(u)queue([{op:'fiftyPathDeclare',uid:u.uid,max:2},{op:'fiftyTactical',done:[...done,u.uid]}],u);return true;
  }
  if(op==='fiftyPathDeclare'){
   const u=alive(step.uid),target=alive(step.target);if(!u)return true;if(step.finish==='whirl'&&u.geometryLocations&&(u.geometryGrowing??!u.silenced)){queue([{op:'geometryWhirlDeclare',uid:u.uid,plan:[]}],u);return true;}let paths=[];
   if(step.target){if(!target||here(u,target))return true;let front=[{at:u.at,layer:layer(u),path:[]}],seen=new Map(),limit=0;while(front.length&&!paths.length&&limit++<25){const next=[];for(const n of front)for(const to of oneSteps({...u,at:n.at,layer:n.layer},step.flying)){const path=[...n.path,{at:to.at,layer:to.layer}];if(occupied({...u,at:to.at}).some(at=>occupied(target).includes(at))&&to.layer===layer(target)){if(paths.length<64)paths.push(path);}else{const key=to.at+':'+to.layer;if((seen.get(key)??99)>=path.length){seen.set(key,path.length);next.push({at:to.at,layer:to.layer,path});}}}front=next.slice(0,300);}}
   else {paths=[[]];for(const a of oneSteps(u)) {paths.push([{at:a.at,layer:a.layer}]);if(step.max===2)for(const b of oneSteps({...u,at:a.at,layer:a.layer}))paths.push([{at:a.at,layer:a.layer},{at:b.at,layer:b.layer}]);}}
   if(selected===undefined){if(paths.length)choice(paths.map(path=>({label:path.length?path.map(v=>pos(v.at)+(v.layer==='below'?'↓':'')).join(' → '):'留在原處',value:path})));return true;}
   if(!paths.some(path=>JSON.stringify(path)===JSON.stringify(selected)))return true;
   const origin={at:u.at,layer:layer(u)},route=[origin,...selected];u.fiftyRoute=[origin];if(step.flying)u.fiftyFlying=true;
   queue([...selected.map((to,i)=>({op:'fiftyPathStep',uid:u.uid,from:route[i],to,flying:step.flying})),{op:'fiftyPathFinish',uid:u.uid,target:step.target,finish:step.finish,path:route,moved:selected.length>0,flying:step.flying}],u);return true;
  }
  if(op==='fiftyPathStep'){
   const u=alive(step.uid);if(!u||u.at!==step.from.at||layer(u)!==step.from.layer)return true;
   if(oneSteps(u,step.flying).some(v=>v.at===step.to.at&&v.layer===step.to.layer)&&(!step.to.growthFrom||geometryStepOrigins(s,u,step.to,{...A,keywords:v=>[...keywords(v),...(step.flying?['Airborne']:[])]}).some(from=>JSON.stringify(from)===JSON.stringify(step.to.growthFrom)))){if(step.to.growthFrom){u.geometryMovementFrom={...step.to.growthFrom};(u.fiftyRoute||(u.fiftyRoute=[])).push(step.to.growthFrom);}moved(u,step.to);(u.fiftyRoute||(u.fiftyRoute=[])).push({at:u.at,layer:layer(u)});}return true;
  }
  if(op==='fiftyPathFinish'){
   const u=alive(step.uid),target=alive(step.target);if(!u)return true;delete u.fiftyFlying;
   if(step.finish==='ward'&&target&&here(u,target)&&!A.unitUmbrellas(target).includes('Evil')&&!disabled(target))target.ward=true;
   if(step.finish==='strike'&&target&&here(u,target))strike(s,u,target);
   const actual=u.fiftyRoute||[];delete u.fiftyRoute;if(step.finish==='whirl'&&actual.length>1){const victims=s.units.filter(v=>v.controller!==p&&!v.dying&&actual.some(loc=>occupied(v).includes(loc.at)&&layer(v)===loc.layer));strikeMany(s,u,victims.map(v=>({uid:v.uid,amount:A.strikeTotal(s,u)})));}return true;
  }
  if(op==='fiftyWind'){
   if(selected===undefined){choice(['北','東','南','西'].map((label,i)=>({label,value:i})));return true;}
   const growth=s.units.filter(u=>!u.dying&&u.geometryLocations&&!u.silenced&&geometryLocationRecords(u).some(loc=>loc.layer==='surface'&&s.board[loc.at])),objects=[...s.units.filter(u=>!u.dying&&!growth.includes(u)),...s.artifacts.filter(o=>!o.bearer)].filter(o=>layer(o)==='surface'&&occupied(o).some(at=>s.board[at])),moves=[];
   for(const o of objects){const to=adjacent(o.at,selected);if(to===null||!s.board[to]||!regionsOverlap(s,o,{at:to,layer:'surface'})||o.size===2&&!occupied({...o,at:to}).every(at=>s.board[at])||!fits(o,{at:to,layer:'surface'}))continue;moves.push({o,to});}
   if(growth.length){const delta=[[0,-1],[1,0],[0,1],[-1,0]][selected];queue([{op:'geometryForcePlan',pending:growth.filter(forceAllowed).map(u=>({uid:u.uid,spec:{delta,fromLayer:'surface',layer:'surface',onSites:true}})),moves:moves.map(({o,to})=>({uid:o.uid,from:{at:o.at,layer:layer(o)},to:{at:to,layer:'surface'}}))}]);return true;}for(const {o,to} of moves){if(unit(s,o.uid)&&!forceAllowed(o))continue;moved(o,{at:to,layer:'surface'});}return true;
  }
  if(op==='fiftyScatter'){const items=[...s.units.filter(u=>!u.dying&&occupied(u).includes(selected.at)&&layer(u)===selected.layer),...s.artifacts.filter(o=>o.at===selected.at&&layer(o)===selected.layer)].map(o=>({entity:unit(s,o.uid)?'unit':'artifact',uid:o.uid}));queue([{op:'fiftyPushChoose',remaining:items}]);return true;}
  if(op==='fiftyPushChoose'){
   const rest=step.remaining.filter(v=>obj(v));if(!rest.length&&!step.target)return true;
   if(!step.target){if(selected===undefined){choice(rest.map(v=>({label:card(obj(v).card).name,value:v})));return true;}queue([{...step,target:selected,remaining:rest.filter(v=>v.uid!==selected.uid)}]);return true;}
   const o=obj(step.target);if(!o)return true;const options=pushOptions(o);
   if(selected===undefined){choice(options.map(at=>({label:pos(at),value:at})));if(!options.length){s.choice=null;queue([{op:'fiftyPushChoose',remaining:rest}]);}return true;}
   if(options.includes(selected)&&(!unit(s,o.uid)||forceAllowed(o))){if(step.target.entity==='artifact')o.bearer=null;moved(o,{at:selected,layer:layer(o)});}queue([{op:'fiftyPushChoose',remaining:rest}]);return true;
  }
  if(op==='fiftyWhirlArea'){queue([{op:'fiftyWhirlDirection',at:selected.at}]);return true;}
  if(op==='fiftyWhirlDirection'){
   if(selected===undefined){choice([{label:'順時針',value:1},{label:'逆時針',value:-1}]);return true;}const cells=area(step.at),ring=[cells[0],cells[1],cells[3],cells[2]],items=[...s.units.filter(u=>!u.dying&&u.size!==2),...s.artifacts.filter(o=>!o.bearer)].filter(o=>layer(o)==='surface'&&s.board[o.at]&&ring.includes(o.at)),moves=items.map(o=>({o,to:ring[(ring.indexOf(o.at)+selected+4)%4]}));
   const growth=s.units.filter(u=>!u.dying&&u.geometryLocations&&!u.silenced&&geometryLocationRecords(u).some(loc=>loc.layer==='surface'&&s.board[loc.at]&&ring.includes(loc.at)));if(growth.length){const map=Object.fromEntries(ring.map((at,i)=>[at,ring[(i+selected+4)%4]]));queue([{op:'geometryForcePlan',pending:growth.filter(forceAllowed).map(u=>({uid:u.uid,spec:{map,fromLayer:'surface',layer:'surface',onSites:true}})),moves:moves.filter(({o,to})=>!growth.includes(o)&&s.board[to]&&fits(o,{at:to,layer:'surface'})).map(({o,to})=>({uid:o.uid,from:{at:o.at,layer:layer(o)},to:{at:to,layer:'surface'}}))}]);return true;}for(const {o,to} of moves)if(s.board[to]&&fits(o,{at:to,layer:'surface'})&&(!unit(s,o.uid)||forceAllowed(o)))moved(o,{at:to,layer:'surface'});return true;
  }
  if(op==='fiftySea'){
   const at=selected.at,targets=s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'&&s.board[u.at]&&(layer(u)==='surface'||regionNames(s,u).has('underwater'))&&distance(u.at,at)===1);queue([...targets.map(u=>({op:'unitStep',uid:u.uid,toward:{at,layer:layer(u)}})),{op:'fiftySeaFinish',at}]);return true;
  }
  if(op==='fiftySeaFinish'){queue([{op:'shiftLayer',forceAction:'submerge',forceUids:s.units.filter(u=>!u.dying&&card(u.card).type==='Minion'&&occupied(u).includes(step.at)).map(u=>u.uid)}]);return true;}
  if(op==='fiftyGrasp'){
   const done=step.done||[],allies=s.units.filter(u=>u.controller===p&&!u.dying&&layer(u)==='below'&&regionNames(s,u).has('underground')&&!done.includes(u.uid));if(!allies.length)return true;
   if(selected===undefined){choice([...allies.map(u=>({label:card(u.card).name,value:u.uid})),skip],undefined,{done});return true;}if(selected===null)return true;
   const u=alive(selected);if(u)queue([{op:'fiftyGraspTarget',actor:u.uid,caster:source},{op:'fiftyGrasp',done:[...done,u.uid]}]);return true;
  }
  if(op==='fiftyGraspTarget'){
   const actor=alive(step.actor);if(!actor)return true;
   if(selected===undefined){const options=selectEffects(s,{...frame,source:step.caster},{kind:'unitOrArtifact',minion:true}).filter(v=>{const o=obj(v.value);return o&&layer(o)==='surface'&&occupied(o).some(at=>occupied(actor).includes(at));});choice([...options,skip]);return true;}
   const o=obj(selected);if(o&&!blocked(s,p,o)&&(!unit(s,o.uid)||forceAllowed(o))&&fits(o,{at:o.at,layer:'below'})){if(selected.entity==='artifact')o.bearer=null;moved(o,{at:o.at,layer:'below'});}return true;
  }
  if(op==='fiftyAblaze'){
   const aura=s.auras.find(a=>a.uid===source.uid);if(!aura)return true;for(const u of [...s.units])if(!u.dying&&card(u.card).type==='Minion'&&layer(u)==='surface'&&occupied(u).includes(aura.at))kill(s,u);destroySite(s,aura.at);removeObject(s,aura,'cemetery');return true;
  }
  if(op==='fiftyInvasion'){
   for(let at=0;at<20;at++)if(s.board[at]?.controller===1-p&&inside(source,at)&&!s.units.some(u=>!u.dying&&occupied(u).includes(at))){const u=summon(card('foot_soldier').id,p,at);if(u)summonedGenesis(s,u);}return true;
  }
  if(op==='fiftyStar'){
   const a=s.auras.find(a=>a.uid===source.uid);if(!a)return true;if(!step.fallen){a.fiftyTurns=(a.fiftyTurns||0)+1;if(a.fiftyTurns<3)return true;}
   const hand=s.players[p].hand.filter(h=>card(h.card).playable&&card(h.card).type==='Minion');
   if(selected===undefined){choice([...hand.map(h=>({label:card(h.card).name,value:h.uid})),skip],undefined,{fallen:true});return true;}
   if(selected===null){removeObject(s,a,'cemetery');return true;}const h=hand.find(h=>h.uid===selected);if(h)queue([{op:'fiftyStarPlace',hand:h.uid,card:h.card}]);return true;
  }
  if(op==='fiftyStarPlace'){
   const a=s.auras.find(a=>a.uid===source.uid),h=s.players[p].hand.find(h=>h.uid===step.hand);if(!a||!h)return true;const options=[];
   for(let at=0;at<20;at++){const preview={at,size:card(h.card).slug==='mountain_giant'?2:1};if(preview.size===2&&(at%5>3||at>=15))continue;for(const affected of occupied(preview))if(s.board[affected]&&inside(a,affected)&&canSummonEntry(s,p,card(h.card),at,'surface'))options.push({label:pos(at)+' · 著陸 '+pos(affected),value:{at,affected}});}
   if(selected===undefined){choice([...options,skip]);return true;}if(selected===null){removeObject(s,a,'cemetery');return true;}
   if(options.some(o=>o.value.at===selected.at&&o.value.affected===selected.affected)){s.players[p].hand=s.players[p].hand.filter(v=>v.uid!==h.uid);const u=summon(h.card,p,selected.at);if(u){queue([{op:'fiftyStarStrike',uid:u.uid,at:selected.affected}]);summonedGenesis(s,u);}else removeObject(s,a,'cemetery');}return true;
  }
  if(op==='fiftyStarStrike'){
   const u=alive(step.uid);if(u)strikeMany(s,u,s.units.filter(v=>v.uid!==u.uid&&!v.dying&&occupied(v).includes(step.at)&&layer(v)==='surface').map(v=>({uid:v.uid,amount:A.strikeTotal(s,u)})));const a=s.auras.find(a=>a.uid===source.uid);if(a)removeObject(s,a,'cemetery');return true;
  }
  if(op==='fiftyApostles'){
   const pl=s.players[p],options=pl.spells.slice(0,7).flatMap((id,index)=>card(id).playable&&card(id).type==='Minion'&&card(id).subtypes.includes('Angel')?[{label:card(id).name,value:{index,card:id}}]:[]);
   if(selected===undefined){choice([...options,skip]);return true;}
   if(selected===null){shuffle(s,pl.spells);return true;}if(pl.spells[selected.index]!==selected.card)return true;pl.spells.splice(selected.index,1);shuffle(s,pl.spells);const u=summon(selected.card,p,source.at,layer(source));if(u){u.apostlesSource=source.uid;summonedGenesis(s,u);}return true;
  }
  if(op==='fiftyGhost'||op==='fiftyLady'){
   const actor=alive(source.uid);if(!actor)return true;const options=(op==='fiftyGhost'?[0,1].flatMap(player=>physicalCemeteryEntries(s,player,A,{actor:p,affect:true})):viewCemeteryEntries(s,p,A,{actor:p,affect:true})).filter(g=>{const c=card(g.card);return c.playable&&(op==='fiftyGhost'?c.type==='Minion'&&c.subtypes.includes('Spirit'):c.type==='Artifact'||c.type==='Minion'&&c.subtypes.includes('Mortal'));}).map(g=>({label:card(g.card).name+' · 玩家 '+(g.player+1),value:g}));
   if(selected===undefined){choice([...options,skip]);return true;}if(selected===null)return true;
   const g=options.find(o=>o.value.uid===selected.uid&&o.value.player===selected.player)?.value;if(!g)return true;
   if(card(g.card).type==='Artifact'){if(!takeAccessGrave(s,g,p,A))return true;s.artifacts.push({uid:'o'+s.next++,card:g.card,owner:g.player,controller:p,at:actor.at,layer:layer(actor),bearer:null});queue(A.definitions[card(g.card).slug]?.genesis||[],s.artifacts[s.artifacts.length-1],p,g.card);}
   else{if(!canSummonEntry(s,p,card(g.card),actor.at,layer(actor)))return true;if(!takeAccessGrave(s,g,p,A))return true;const u=summon(g.card,g.player,actor.at,layer(actor));if(u)summonedGenesis(s,u);}
   if(op==='fiftyLady'){const owner=actor.owner;A.leaveUnit(s,actor,'spells');shuffle(s,s.players[owner].spells);}return true;
  }
  if(op==='fiftyHorror'){
   const remaining=step.remaining||[0,1].flatMap(player=>physicalCemeteryEntries(s,player,A,{actor:p,affect:true}).filter(g=>card(g.card).type==='Minion'&&card(g.card).playable&&printedKeywords(card(g.card)).includes('Voidwalk')).map(g=>({player,uid:g.uid})));if(!remaining.length)return true;
   const first=remaining[0],g=graveEntries(s,first.player).find(g=>g.uid===first.uid);queue([{...step,remaining:remaining.slice(1)}]);if(g)queue([{op:'fiftyHorrorPlace',grave:g}]);return true;
  }
  if(op==='fiftyHorrorPlace'){
   const g=graveEntries(s,step.grave.player).find(g=>g.uid===step.grave.uid);if(!g)return true;const options=selectEffects(s,frame,{kind:'location',nearby:true,canSummon:g.card}).filter(o=>canSummonEntry(s,p,card(g.card),o.value.at,o.value.layer));
   if(selected===undefined){if(options.length)choice(options);return true;}if(!options.some(o=>o.value.at===selected.at&&o.value.layer===selected.layer))return true;
   if(!takeAccessGrave(s,g,p,A))return true;const u=summon(g.card,g.player,selected.at,selected.layer);if(u)summonedGenesis(s,u);return true;
  }
  if(op==='fiftyLocust'){
   const actor=alive(source.uid);if(!actor)return true;const name=card(actor.card).name,blocked=()=>s.summonHistory?s.summonHistory.some(e=>e.turn===s.turn&&e.name===name):(s.units.some(u=>u.born===s.turn&&card(u.card).name===name)||name===card('locusts_of_illyria').name&&s.fiftyLocustTurn===s.turn);if(blocked())return true;const options=selectEffects(s,frame,{kind:'location',nearby:true,surface:true}).filter(o=>s.board[o.value.at]&&canSummonEntry(s,p,card(actor.card),o.value.at,'surface'));
   if(selected===undefined){if(options.length)choice(options);return true;}if(!blocked()&&options.some(o=>o.value.at===selected.at)){const u=summon(finalArchivePrintedCard(actor.card,A),actor.owner,selected.at);if(u){s.fiftyLocustTurn=s.turn;u.tapped=true;u.tokenCopy=true;summonedGenesis(s,u);}}return true;
  }
  if(op==='fiftyFaith'){const u=alive(selected?.uid);if(u){if(!A.unitUmbrellas(u).includes('Evil')&&!disabled(u))u.ward=true;u.mods.push({fiftyFaith:true,until:p});}return true;}
  if(op==='fiftyOnslaught'){(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'fiftyOnslaught',controller:p,end:s.turn});return true;}
  if(op==='fiftyArmageddon'){
   A.beginRealmDestruction(s);
   queue([{op:'fiftyArmageddonFinish',inert:(s.inertCards||[]).map(c=>c.uid),objects:[...s.artifacts,...s.auras].map(o=>o.uid),sites:s.board.flatMap((site,at)=>site?[at]:[])}]);for(const u of [...s.units])if(card(u.card).type==='Minion')kill(s,u);return true;
  }
  if(op==='fiftyArmageddonFinish'){A.destroyInertCards?.(s,step.inert||[]);for(const o of [...s.artifacts,...s.auras])if(step.objects.includes(o.uid))removeObject(s,o,'cemetery');for(const at of step.sites)destroySite(s,at);A.finishRealmDestruction(s);return true;}
  if(op==='fiftyMuzzle'){
   const o=s.artifacts.find(o=>o.uid===source.uid);if(!o||o.bearer)return true;const options=selectEffects(s,frame,{kind:'unit',minion:true,nearby:true,untargeted:true});
   if(selected===undefined){if(options.length)choice(options);return true;}const u=alive(selected?.uid);if(u){o.bearer=u.uid;o.at=u.at;o.layer=layer(u);}return true;
  }
  if(op==='fiftyRock'){const o=s.artifacts.find(o=>o.uid===source.uid),u=o&&alive(o.bearer);if(!u||!o.rockVictim)return true;const victim=s.artifacts.find(a=>a.uid===o.rockVictim&&a.bearer===u.uid);if(victim)removeObject(s,victim,'banished');delete o.rockVictim;return true;}
  if(op==='fiftyFacing'){const o=s.artifacts.find(o=>o.uid===source.uid);if(!o)return true;if(selected===undefined){choice(['北','東','南','西'].map((label,i)=>({label,value:i})));return true;}o.facing=selected;return true;}
  if(op==='fiftySentinel'){const o=s.artifacts.find(o=>o.uid===source.uid);if(!o)return true;const at=adjacent(o.at,o.facing||0);o.facing=((o.facing||0)+1)%4;if(at!==null&&regionsOverlap(s,{at,layer:layer(o)},o))for(const u of s.units)if(!u.dying&&occupied(u).includes(at)&&layer(u)===layer(o))hurt(s,u,4,false,'ability',o);return true;}
  if(op==='fiftyRegurgitate'){
   const actor=alive(source.uid);if(!actor)return true;if(actor.regurgitatedPower!==undefined){const n=actor.regurgitatedPower;delete actor.regurgitatedPower;queue([{op:'projectile',amount:n}],actor);return true;}
   const options=[0,1].flatMap(player=>physicalCemeteryEntries(s,player,A,{actor:p,affect:true}).filter(g=>card(g.card).type==='Minion').map(g=>({label:card(g.card).name,value:g})));if(selected===undefined){if(options.length)choice(options);return true;}
   const g=graveEntries(s,selected?.player).find(g=>g.uid===selected?.uid);if(g&&takeAccessGrave(s,g,p,A)){actor.regurgitatedPower=card(g.card).attack||0;s.players[g.player].banished.push(g.card);}return true;
  }
  if(op==='fiftyManor'){const u=alive(selected?.uid);if(u&&hurt(s,u,3,false,'ability',source)===3&&s.eventContext?.fiftyReceipt?.uid===u.uid&&s.eventContext.fiftyReceipt.at===source.at)heal(s,p,3);return true;}
  if(op==='fiftyRam'){
   if(selected?.entity==='artifact'){const o=s.artifacts.find(o=>o.uid===selected.uid);if(o&&!blocked(s,p,o))removeObject(s,o,'cemetery');}else if(selected?.entity==='aura'){const o=s.auras.find(o=>o.uid===selected.uid);if(o)removeObject(s,o,'cemetery');}return true;
  }
  if(op==='fiftySiege'){
   const u=step.uid?alive(step.uid):alive(selected?.uid);if(!u)return true;if(!step.uid){queue([{...step,select:undefined,uid:u.uid}]);return true;}
   const options=selectEffects(s,frame,{kind:'location',nearby:true}).filter(o=>fits(u,o.value,true,true)&&regionsOverlap(s,o.value,u));if(selected===undefined){choice(options);return true;}if(forceAllowed(u)&&options.some(o=>o.value.at===selected.at&&o.value.layer===selected.layer)){u.carryFlying=true;moved(u,selected);}return true;
  }
  if(op==='fiftyBone'){const u=alive(selected?.uid);if(u){const shooter={...u};kill(s,u,false,true,true);queue([{op:'fiftyBoltAim',kind:'bone',amount:3}],shooter);}return true;}
  if(op==='fiftyGrapple'){const u=alive(selected?.uid);if(u&&!disabled(u))queue([{op:'fiftyBoltAim',kind:'grapple',shooter:u.uid}],u);return true;}
  if(op==='fiftyBall'||op==='fiftyNelly'||op==='fiftyBoltAim'){
   const kind=op==='fiftyBall'?'ball':op==='fiftyNelly'?'nelly':step.kind;
   if(selected===undefined){choice(['北','東','南','西'].map((label,i)=>({label,value:i})));return true;}
   const direction=op==='fiftyNelly'?selected-1:selected;queue([step.bounce?{...step.bounce,op:'fiftyBoltTravel',direction,amount:step.amount,ignore:step.ignore,origin:false,remaining:20}:{op:'fiftyBoltTravel',kind,at:source.at,layer:layer(source),origin:true,firstAt:source.at,leftFirst:false,direction,amount:step.amount||4,remaining:20,trail:[],shooter:step.shooter,object:step.object}],source);return true;
  }
  if(op==='fiftyBoltTravel'){
   const object=step.object&&s.artifacts.find(o=>o.uid===step.object);if(object){object.bearer=null;object.at=step.at;object.layer=step.layer;}
   const hit=s.units.filter(u=>!u.dying&&u.uid!==step.ignore&&(!u.stealth||alive(source.uid)?.canSeeStealth)&&(!u.projectileOver||disabled(u))&&geometryLocationRecords(u).some(loc=>loc.at===step.at&&loc.layer===step.layer)&&(!(step.kind==='ball'&&!step.leftFirst&&step.at===step.firstAt||step.origin)||u.controller!==p)&&!(step.hits||[]).includes(u.uid));
   const next=adjacent(step.at,step.direction),blockedNext=next!==null&&(s.board[next]&&A.passives[card(s.board[next].card).slug]?.projectileBarrierAll||abilityProjectileBarrier(s,next,step.layer,p,A));
   if(hit.length&&(step.kind!=='spear'||hit.length>1)){queue([{op:'fiftyBoltHit',bolt:step,untargeted:true,select:{kind:'unit',uids:hit.map(u=>u.uid),anyRegion:true,untargeted:true}}]);return true;}
   if(next!==null&&!blockedNext&&step.remaining>0&&regionsOverlap(s,{at:next,layer:step.layer},{at:step.at,layer:step.layer}))queue([{...step,at:next,origin:false,leftFirst:true,ignore:null,remaining:step.remaining-1,trail:[...step.trail,step.at],hits:[...step.hits||[],...hit.map(u=>u.uid)]}]);
   if(step.kind==='spear')for(const u of hit)hurt(s,u,3,false,'ability',source);return true;
  }
  if(op==='fiftyBoltHit'){
   const target=alive(selected?.uid),b=step.bolt;if(!target)return true;
   if(b.kind==='spear'){
    const next=adjacent(b.at,b.direction),blockedNext=next!==null&&(s.board[next]&&A.passives[card(s.board[next].card).slug]?.projectileBarrierAll||abilityProjectileBarrier(s,next,b.layer,p,A));
    if(next!==null&&!blockedNext&&b.remaining>0&&regionsOverlap(s,{at:next,layer:b.layer},{at:b.at,layer:b.layer}))queue([{...b,op:'fiftyBoltTravel',at:next,origin:false,leftFirst:true,ignore:null,remaining:b.remaining-1,trail:[...b.trail,b.at],hits:[...b.hits||[],target.uid]}]);
    hurt(s,target,3,false,'ability',source);return true;
   }
   if(b.kind==='ball'){if(b.amount>1)queue([{op:'fiftyBoltAim',kind:'ball',amount:Math.floor(b.amount/2),bounce:b,ignore:target.uid}]);hurt(s,target,b.amount,false,'magic',source);return true;}
   if(b.kind==='bone'){hurt(s,target,3,false,'magic',source);return true;}
   if(b.kind==='grapple'){
    const u=alive(b.shooter||source.uid);if(!u)return true;const route=[...b.trail,b.at],steps=[];let from={at:u.at,layer:layer(u)};
    for(const at of route){if(at===from.at)continue;const to={at,layer:b.layer};steps.push({op:'dragStep',uid:u.uid,from,to});from=to;}
    queue([...steps,{op:'fiftyGrappleStrike',uid:u.uid,target:target.uid}],source);return true;
   }
   if(b.kind==='nelly'){
    const route=[...b.trail].reverse(),steps=[];let from={at:target.at,layer:layer(target)};for(const at of route){const to={at,layer:b.layer};steps.push({op:'dragStep',uid:target.uid,from,to});from=to;}
    queue([...steps,{op:'fiftyNellySubmerge',uid:target.uid}],source);return true;
   }return true;
  }
  if(op==='fiftyGrappleStrike'){const u=alive(step.uid),target=alive(step.target);if(!u||!target||!here(u,target))return true;if(selected===undefined){choice([{label:'進行打擊',value:true},skip]);return true;}if(selected)strike(s,u,target);return true;}
  if(op==='fiftyNellySubmerge'){
   const u=alive(step.uid),nelly=alive(source.uid);if(!u||!nelly||!here(u,nelly)||card(u.card).type==='Avatar'||!A.waterSite(s,u.at,card))return true;
   if(selected===undefined){choice([{label:'將其下潛',value:true},skip]);return true;}if(selected&&forceAllowed(u)&&fits(u,{at:u.at,layer:'below'}))moved(u,{at:u.at,layer:'below'});return true;
  }
  if(op==='fiftyMirrorChoose'){
   if(selected===null)return true;commitSiteCard(s,step.action,selected);return true;
  }
  if(op==='fiftySiteCommit'){commitSiteCard(s,step.action);return true;}
  if(op==='fiftyRockCommit'){if(selected!==null)A.commitSpell(s,{...step.action,rockVictim:selected},step.declared);return true;}
  if(op==='fiftyRamCommit'){
   if(selected===null)return true;const u=alive(step.action.unit);if(u&&!disabled(u)&&!u.tapped){u.tapped=true;u.stealth=false;u.notRest=true;u.interactedTurn=s.turn;queue([{op:'fiftyRam'}],u);s.storyline[s.storyline.length-1].selected=selected;}return true;
  }
  if(op==='fiftyEelPull'){
   const eel=alive(source.uid);if(!eel)return true;const options=selectEffects(s,frame,{kind:'unit',minion:true,anyRegion:true,untargeted:true}).filter(o=>{const u=alive(o.value.uid);return u.uid!==eel.uid&&layer(u)==='surface'&&occupied(u).some(at=>occupied(eel).includes(at));});
   if(selected===undefined){choice([...options,skip]);return true;}const u=alive(selected?.uid);if(u&&forceAllowed(u)&&fits(u,{at:u.at,layer:'below'}))moved(u,{at:u.at,layer:'below'});return true;
  }
  if(op==='fiftyLordStrike'){for(const u of [...s.units])if(u.uid!==source.uid&&card(u.card).type==='Minion'&&occupied(u).includes(step.at))kill(s,u);destroySite(s,step.at);return true;}
  return false;
 }
 function adjacent(at,d){const x=at%5+[0,1,0,-1][d],y=Math.floor(at/5)+[-1,0,1,0][d];return x<0||x>4||y<0||y>3?null:y*5+x;}
 function pushOptions(o){return [0,1,2,3].map(d=>adjacent(o.at,d)).filter(at=>at!==null&&fits(o,{at,layer:layer(o)})&&occupied({...o,at}).every((cell,i)=>regionsOverlap(s,{at:cell,layer:layer(o)},{at:occupied(o)[i],layer:layer(o)})));}
}
