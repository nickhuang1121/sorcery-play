import {finalAvatarCopyIsFree} from './final-avatars.js';
// Explicit effects for the final-101 audit. Choices contain only serializable data.
import {geometryBoardAllowed,moveGeometrySiteParts} from './final-geometry.js';
export const finalEffectDefinitions = {
 dhol_chants:{cast:[{op:'finalDholTap',picks:[]}]},
 corpse_explosion:{cast:[{op:'finalCorpseStart',select:{kind:'gridArea'}}]},
 chaos_twister:{cast:[{op:'finalTwisterStart',select:{kind:'unit',minion:true}}]},
 led_astray:{cast:[{op:'finalLedStart',select:{kind:'location'}}]},
 joust:{cast:[{op:'finalJoustStart'}]},
 earthquake:{cast:[{op:'finalEarthquakeStart',select:{kind:'gridArea'}}]},

};
export const experimentalFinalEffectDefinitions={};
export const finalEffectOperations=['finalDholTap','finalDholCast','finalDholBottom','finalLedStart','finalLedPick','finalLedMove','finalJoustStart','finalJoustEnemy','finalJoustMove','finalEarthquakeStart','finalEarthquakePlace','finalEarthquakeApply','finalCorpseStart','finalCorpseDeal','finalCorpseBlast','finalTwisterStart','finalTwisterLand','finalTwisterPosition','finalTwisterDamage'];
const layer=u=>u.layer||'surface';
const label=at=>String.fromCharCode(65+at%5)+(4-Math.floor(at/5));
const live=(s,uid,A)=>{const u=A.unit(s,uid);return u&&!u.dying?u:null;};
const same=(s,a,b,A)=>layer(a)===layer(b)&&A.occupied(a).some(at=>A.occupied(b).includes(at));
const steps=(s,u,A,p)=>A.locations(s,u,A.card,A.keywords,true).filter(v=>v.path.length===1);
function move(u,to){u.at=to.at;u.layer=to.layer;u.notRest=true;u.burrowedSafely=false;}
export function earthquakePermutations(s,cells,A){
 const movable=cells.filter(at=>s.board[at]&&!A.passives[A.card(s.board[at].card).slug]?.immutableSite&&!s.board[at].completionProtected);
 const result=[];function visit(rest,picks){if(!rest.length){const mapping=Object.fromEntries(cells.map(at=>[at,at]));movable.forEach((at,i)=>mapping[at]=picks[i]);result.push(mapping);return;}for(let i=0;i<rest.length;i++)visit(rest.filter((_,j)=>j!==i),[...picks,rest[i]]);}
 visit(movable,[]);return result;
}
export function resolveFinalEffects(s,frame,A){
 const {step,source,controller:p,selected}=frame,op=step.op;
 if(!finalEffectOperations.includes(op))return false;
 const q=(effects,src=source,controller=p)=>A.queueEffects(s,effects,src,controller,frame.effectCard);
 const choose=(options,next=step,title=A.card(frame.effectCard).name,player=p)=>{if(options.length)s.choice={player,title,options,frame:{...frame,step:next}};};
 if(op==='finalDholTap'){
  const picks=step.picks||[];
  if(selected===null){
   const tapping=picks.map(id=>A.unit(s,id)).filter(u=>u&&!u.dying&&u.controller===p&&!u.tapped&&A.regionsOverlap(s,u,source)&&A.occupied(u).some(at=>A.nearby(at,source.at)));
   for(const ally of tapping)ally.tapped=true;
   const pool=s.players[p].spells.splice(0,tapping.length);A.log(s,'Dhol Chants · 揭示 '+pool.map(id=>A.card(id).name).join('、'));q([{op:'finalDholCast',pool}]);return true;
  }
  const allies=s.units.filter(u=>!u.dying&&u.controller===p&&!u.tapped&&!picks.includes(u.uid)&&A.regionsOverlap(s,u,source)&&A.occupied(u).some(at=>A.nearby(at,source.at)));
  if(selected===undefined){choose([...allies.map(u=>({label:A.card(u.card).name,value:u.uid})),{label:'完成橫置（'+picks.length+'）',value:null}]);return true;}
  const ally=allies.find(u=>u.uid===selected);if(ally)q([{...step,picks:[...picks,ally.uid]}]);return true;
 }
 if(op==='finalDholCast'){
  const pool=step.pool||[],pl=s.players[p];
  const options=[];
  for(let index=0;index<pool.length;index++){
   const hand='h'+s.next,entry={uid:hand,card:pool[index]};pl.hand.push(entry);
   try{for(const action of A.freeCastActions(s,p,hand).filter(action=>!action.payment))options.push({label:A.card(entry.card).name+' · '+(A.unit(s,action.caster)?A.card(A.unit(s,action.caster).card).name:action.caster)+(action.at!==undefined?' → '+label(action.at):''),value:{index,action}});}
   finally{pl.hand=pl.hand.filter(h=>h!==entry);delete s.finalFreeCast;}
  }
  if(selected===undefined){if(options.length)choose(options);else q([{op:'finalDholBottom',pool}]);return true;}
  const pick=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected))?.value;if(!pick)return true;
  const id=pool[pick.index],hand='h'+s.next++;pl.hand.push({uid:hand,card:id});
  q([{op:'finalDholBottom',pool:pool.filter((_,i)=>i!==pick.index),castHand:hand}]);
  s.finalFreeCast={player:p,hand,caster:pick.action.caster};A.beginCast(s,{...pick.action,hand});return true;
 }
 if(op==='finalDholBottom'){
  const pool=[...(step.pool||[])],pl=s.players[p];
  // A cancelled declaration returns the uncast revealed card to the bottom, not the hand.
  if(step.castHand){const h=pl.hand.find(h=>h.uid===step.castHand);if(h){pool.push(h.card);pl.hand=pl.hand.filter(h=>h.uid!==step.castHand);}delete s.finalFreeCast;}
  if(!pool.length)return true;
  if(selected===undefined){choose(pool.map((id,index)=>({label:'下一張牌庫底牌：'+A.card(id).name,value:index})),{op:'finalDholBottom',pool});return true;}
  if(Number.isInteger(selected)&&pool[selected]){pl.spells.push(pool[selected]);q([{op:'finalDholBottom',pool:pool.filter((_,i)=>i!==selected)}]);}return true;
 }
 if(op==='finalLedStart'){q([{op:'finalLedPick',origin:selected,picks:[]}]);return true;}
 if(op==='finalLedPick'){
  const picks=step.picks||[],origin=step.origin;
  if(selected===null){if(picks.length)q([{op:'finalLedMove',picks,origin}]);return true;}
  if(selected!==undefined){if(!picks.includes(selected))q([{...step,picks:[...picks,selected]}]);return true;}
  const enemies=s.units.filter(u=>!u.dying&&u.controller!==p&&A.occupied(u).includes(origin.at)&&layer(u)===origin.layer&&!picks.includes(u.uid));
  choose([...enemies.map(u=>({label:A.card(u.card).name,value:u.uid})),{label:picks.length?'移動已選敵人':'不選敵人',value:null}]);return true;
 }
 if(op==='finalLedMove'){
  const units=step.picks.map(uid=>live(s,uid,A)).filter(Boolean);if(!units.length)return true;
  // Choose one common destination; individual units that cannot step stay put.
  const all=new Map();for(const u of units)for(const to of steps(s,u,A,p))all.set(to.at+':'+to.layer,{at:to.at,layer:to.layer});
  const options=[...all.values()].filter(to=>A.distance(to.at,step.origin.at)+(to.layer!==step.origin.layer?1:0)===1).map(to=>({label:label(to.at)+' · '+to.layer,value:to}));
  if(selected===undefined){choose(options);return true;}
  if(!options.some(o=>o.value.at===selected.at&&o.value.layer===selected.layer))return true;
  for(const u of units){const to=steps(s,u,A,p).find(v=>v.at===selected.at&&v.layer===selected.layer);if(to)move(u,to);}return true;
 }
 if(op==='finalJoustStart'){
  const options=s.units.filter(u=>u.controller===p&&!u.dying).filter(u=>s.units.some(v=>v.controller!==p&&!v.dying&&A.regionsOverlap(s,u,v)&&A.occupied(u).some(at=>A.occupied(v).some(next=>A.distance(at,next)===1))&&A.canTarget(s,p,v,u,frame.effectCard)&&!v.magicProtected&&!v.iceMagicProtection)).map(u=>({label:A.card(u.card).name,value:u.uid}));
  if(selected===undefined){choose(options);return true;}const ally=live(s,selected,A);if(ally)q([{op:'finalJoustEnemy',ally:ally.uid}]);return true;
 }
 if(op==='finalJoustEnemy'){
  const ally=live(s,step.ally,A);if(!ally)return true;
  const options=A.selectEffects(s,{...frame,source:ally},{kind:'unit',enemy:true,adjacent:true});
  if(selected===undefined){choose(options);return true;}const enemy=live(s,selected.uid,A);if(!enemy||!options.some(o=>o.value.uid===enemy.uid)||A.blocked(s,p,enemy))return true;
  q([{op:'finalJoustMove',ally:ally.uid,enemy:enemy.uid}]);return true;
 }
 if(op==='finalJoustMove'){
  const ally=live(s,step.ally,A),enemy=live(s,step.enemy,A);if(!ally||!enemy)return true;
  const toA=steps(s,ally,A,p).filter(to=>layer(enemy)===to.layer&&A.occupied({...ally,at:to.at}).some(at=>A.occupied(enemy).includes(at))),toB=steps(s,enemy,A,p).filter(to=>layer(ally)===to.layer&&A.occupied({...enemy,at:to.at}).some(at=>A.occupied(ally).includes(at)));
  const choices=(toA.length?toA:[null]).flatMap(a=>(toB.length?toB:[null]).map(b=>({label:(a?label(a.at):'友軍無法移動')+' ↔ '+(b?label(b.at):'敵軍無法移動'),value:{a:a&&{at:a.at,layer:a.layer},b:b&&{at:b.at,layer:b.layer}}})));
  if(selected===undefined&&choices.length>1){choose(choices);return true;}const pick=selected??choices[0]?.value;if(!pick)return true;
  const a=pick.a&&toA.find(v=>v.at===pick.a.at&&v.layer===pick.a.layer),b=pick.b&&toB.find(v=>v.at===pick.b.at&&v.layer===pick.b.layer);
  if(a)move(ally,a);if(b)move(enemy,b);
  // Official AL FAQ: they fight after moving, from their new locations, only if both passed.
  if(a&&b)q([{op:'fightStage',phase:'first',fight:{kind:'spell',attacker:ally.uid,defenders:[enemy.uid],remote:true}}],ally,p);return true;
 }
 if(op==='finalEarthquakeStart'){
  const cells=A.area(selected.at);if(cells.length!==4)return true;q([{op:'finalEarthquakePlace',cells}]);return true;
 }
 if(op==='finalEarthquakePlace'){
  const options=earthquakePermutations(s,step.cells,A).map(mapping=>({label:step.cells.map(at=>label(at)+'→'+label(mapping[at])).join(' · '),value:mapping}));
  if(selected===undefined){choose(options);return true;}const valid=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(valid)q([{op:'finalEarthquakeApply',cells:step.cells,mapping:valid.value}]);return true;
 }
 if(op==='finalEarthquakeApply'){
  const cells=step.cells,mapping=step.mapping,old=[...s.board];
  const projected=[...old];for(const at of cells)projected[mapping[at]]=old[at];
  const rearrange=geometryBoardAllowed(s,projected,A.card);
  if(rearrange)for(const at of cells)s.board[mapping[at]]=old[at];
  if(rearrange)moveGeometrySiteParts(s,mapping,old);
  const moveObjects=[...s.units.filter(u=>u.size!==2&&!u.geometryFixedCells&&!u.geometryLocations&&A.occupied(u).length===1),...s.artifacts,...s.auras.filter(a=>a.singleSite)];
  if(rearrange)for(const u of moveObjects)if(old[u.at]&&cells.includes(u.at)){u.at=mapping[u.at];if(s.units.includes(u))u.observedPosition={at:u.at,layer:layer(u),cells:A.occupied(u)};}
  // Burrow is a forced move into land subsurface, never Submerge into water.
  for(const u of s.units)if(!u.dying&&A.card(u.card).type==='Minion'&&layer(u)==='surface'&&A.occupied(u).some(at=>cells.includes(at)&&s.board[at])&&A.occupied(u).every(at=>s.board[at]&&!A.waterSite(s,at,A.card))&&A.fiftyForceAllowed(s,u,p,A)){u.layer='below';u.burrowedSafely=false;}
  for(const a of s.artifacts)if(layer(a)==='surface'&&cells.includes(a.at)&&s.board[a.at]&&!A.waterSite(s,a.at,A.card)){a.layer='below';const bearer=A.unit(s,a.bearer);if(bearer&&layer(bearer)!=='below')a.bearer=null;}
  return true;
 }
 if(op==='finalCorpseStart'){const cells=A.area(selected.at).filter(at=>s.board[at]);q([{op:'finalCorpseDeal',cells,picks:[]}]);return true;}
 if(op==='finalCorpseDeal'){
  const left=step.cells.filter(at=>!step.picks.some(v=>v.at===at));
  const graves=[0,1].flatMap(player=>A.effectGraveEntries(s,player,p)).filter(g=>A.card(g.card).type==='Minion'&&!step.picks.some(v=>v.grave.uid===g.uid&&v.grave.player===g.player));
  if(!left.length||!graves.length){q([{op:'finalCorpseBlast',picks:step.picks}]);return true;}
  if(selected===undefined){choose(graves.flatMap(grave=>left.map(at=>({label:A.card(grave.card).name+' → '+label(at),value:{at,grave}}))));return true;}
  const g=graves.find(g=>g.uid===selected.grave.uid&&g.player===selected.grave.player);if(g&&left.includes(selected.at))q([{...step,picks:[...step.picks,{at:selected.at,grave:g}]}]);return true;
 }
 if(op==='finalCorpseBlast'){
  // Freeze all damage before any corpse is banished; each assignment is a distinct blast.
  const picks=step.picks.filter(v=>A.graveEntries(s,v.grave.player).some(g=>g.uid===v.grave.uid&&g.card===v.grave.card));
  const previous=s.damageWindow;s.damageWindow={wards:s.units.filter(u=>u.ward).map(u=>u.uid)};
  try{for(const {at,grave} of picks){const corpse=A.card(grave.card),amount=Math.floor(((corpse.attack||0)+(corpse.defense??corpse.attack??0))/2);for(const u of s.units)if(!u.dying&&A.occupied(u).includes(at))A.hurt(s,u,amount,false,'magic',source);}
   for(const uid of s.damageWindow.hydras||[]){const u=A.unit(s,uid);if(u&&!u.lethal&&u.damage<A.power(u,true))u.damage=0;}
  }finally{if(previous)s.damageWindow=previous;else delete s.damageWindow;}
  for(const {grave} of picks){const g=A.graveEntries(s,grave.player).find(g=>g.uid===grave.uid);if(g){A.takeGrave(s,g.player,g.index,g.card,g.uid);s.players[g.player].banished.push(g.card);}}return true;
 }
 if(op==='finalTwisterStart'){
  const u=live(s,selected.uid,A);if(!u||A.blocked(s,p,u))return true;q([{op:'finalTwisterLand',uid:u.uid}]);return true;
 }
 if(op==='finalTwisterLand'){
  const u=live(s,step.uid,A);if(!u)return true;
  // User-authorized digital replacement: every one of the twenty board
  // squares is eligible, including void and empty squares. The shared RNG
  // mechanism supports deterministic replay and ordinary random controllers.
  const landing=A.rollIndex(s,Array.from({length:20},(_,at)=>'Chaos Twister · '+label(at)+(s.board[at]?' 地點表面':' 虛空')));
  (s.finalTwisterDigitalResults||(s.finalTwisterDigitalResults=[])).push({uid:u.uid,player:p,turn:s.turn,landing,rule:'digital-uniform-board-v1'});
  A.log(s,'Chaos Twister · 數位替代規則：隨機格 '+label(landing));
  q([{op:'finalTwisterPosition',uid:u.uid,landing}]);return true;
 }
 if(op==='finalTwisterPosition'){
  const u=live(s,step.uid,A);if(!u||!A.fiftyForceAllowed(s,u,p,A))return true;
  const landing=step.landing,options=Array.from({length:20},(_,at)=>at).filter(at=>(u.size!==2||at%5<4&&at<15)&&A.occupied({...u,at}).includes(landing)).map(at=>({label:'傳送範圍起點 '+label(at),value:at}));
  if(selected===undefined&&options.length>1){choose(options);return true;}
  const at=selected??options[0]?.value;if(!options.some(o=>o.value===at))return true;
  const from=A.occupied(u),to=A.occupied({...u,at});if(!to.every((cell,i)=>cell>=0&&cell<20&&A.canEnterOnGround(s,u,{at:from[i],layer:layer(u)},{at:cell,layer:'surface'},A.card,A.keywords,true)))return true;
  move(u,{at,layer:'surface'});u.carryTeleport=true;
  // A separate continuation allows entry/replacement/force restrictions to settle
  // before checking whether the teleport succeeded and determining its power.
  q([{op:'finalTwisterDamage',uid:u.uid,landing,at}]);return true;
 }
 if(op==='finalTwisterDamage'){
  const u=live(s,step.uid,A);if(!u||u.at!==step.at||layer(u)!=='surface'||!s.board[step.landing])return true;
  const amount=Math.floor((A.power(u)+A.power(u,true))/2);for(const v of s.units)if(!v.dying&&layer(v)==='surface'&&A.occupied(v).includes(step.landing))A.hurt(s,v,amount,false,'magic',source);return true;
 }
 return true;
}

// Demonic Contract uses explicit human-confirmed classification for accord
// categories missing from the snapshot. AI never invents a classification.
const contractRarity={Ordinary:0,Exceptional:1,Elite:2,Unique:3};
const auditedAccordNames=new Set(['ferrymans_coin','angels_egg','devils_egg','koscheis_egg','frog','brobdingnag_bullfrog','felbog_frog_men','goat_for_azazel','13_treasures_of_britain','buried_treasure','sunken_treasure']);
export function contractCostOptions(s,p,A){
 const result=[];
 if(s.players[p].doorTurn===null&&s.players[p].life>=4)result.push({label:'支付 4 生命',value:{kind:'life'}});
 const hasDemon=s.units.some(u=>!u.dying&&u.controller===p&&A.card(u.card).type==='Minion'&&A.unitTypes(u).includes('Demon'));
 if(!hasDemon)return result;
 for(const u of s.units)if(!u.dying&&u.controller===p&&A.card(u.card).type==='Minion'&&(A.unitTypes(u).includes('Mortal')||auditedAccordNames.has(A.card(u.card).slug)))result.push({label:'犧牲 '+A.card(u.card).name,value:{kind:'unit',uid:u.uid,card:u.card}});
 for(const a of s.artifacts)if(A.artifactController(s,a)===p&&auditedAccordNames.has(A.card(a.card).slug))result.push({label:'犧牲 '+A.card(a.card).name,value:{kind:'artifact',uid:a.uid,card:a.card}});
 return result;
}
export function migrateLegacyTwisterChoice(s){
 if(s.choice?.manual&&s.choice.frame?.step?.op==='finalTwisterLand'){
  s.choice={...s.choice,manual:false,title:'Chaos Twister · 改用已批准的數位隨機規則',options:[{label:'從全部20格隨機選格並繼續',value:'digital-roll'}]};
 }
}
export function beforeFinalSpellCommit(s,a,declared,A){
 if(A.castingCard(s,a)?.slug!=='demonic_contract')return false;
 if(finalAvatarCopyIsFree(s,a,a.player)||s.finalFreeCast?.player===a.player&&s.finalFreeCast.hand===a.hand&&(!s.finalFreeCast.caster||s.finalFreeCast.caster===a.caster))return false;
 const caster=A.unit(s,a.caster)||(s.artifacts||[]).find(o=>o.uid===a.caster)||{card:A.castingCard(s,a).id,at:a.at,uid:a.caster,controller:a.player},p=a.player;
 const options=contractCostOptions(s,p,A);
 if(!a.contractCost){
  s.choice={player:p,title:'Demonic Contract · 額外代價（尚未支付）',options:[...options,...(s.units.some(u=>!u.dying&&u.controller===p&&A.unitTypes(u).includes('Demon'))?[{label:'人工核實另一個 accord（依實體卡類別）',value:{kind:'manual'}}]:[]),{label:'取消施放（不支付費用）',value:null}],frame:{source:structuredClone(caster),controller:p,effectCard:A.castingCard(s,a).id,step:{op:'finalContractCommit',action:a,declared}}};return true;
 }
 const permission=s.finalContractAccordPermission;
 const manual=permission&&s.units.some(u=>!u.dying&&u.controller===p&&A.unitTypes(u).includes('Demon'))&&permission.player===p&&permission.hand===a.hand&&permission.caster===a.caster&&JSON.stringify(permission.cost)===JSON.stringify(a.contractCost)&&contractManualObjects(s,p,A).some(o=>o.value.uid===a.contractCost.uid&&o.value.card===a.contractCost.card&&o.value.kind===a.contractCost.kind&&(o.value.kind!=='site'||o.value.at===a.contractCost.at));
 const cost=manual?a.contractCost:options.find(o=>JSON.stringify(o.value)===JSON.stringify(a.contractCost))?.value;
 if(!cost)throw Error('Demonic Contract 額外代價已失效');
 // The engine commits against a cloned state; a later invalid mana payment
 // rejects the complete dispatch, including this additional payment.
 delete s.finalContractAccordPermission;
 if(manual){(s.finalContractAccordAudit||(s.finalContractAccordAudit=[])).push({...permission,turn:s.turn});A.log(s,'Demonic Contract · 人工核實 accord：'+cost.category+' / '+A.card(cost.card).name);}
 if(cost.kind==='life')A.loseLife(s,p,4);
 else if(cost.kind==='unit')A.kill(s,A.unit(s,cost.uid),false,true,true);
 else if(cost.kind==='site')A.destroySite(s,cost.at,true);
 else A.removeObject(s,[...s.artifacts,...s.auras||[]].find(o=>o.uid===cost.uid),'cemetery');
 return false;
}
finalEffectDefinitions.demonic_contract={cast:[{op:'finalContractSearch'}]};
finalEffectOperations.push('finalContractCommit','finalContractSearch','finalContractManualPick','finalContractManualCategory','finalContractManualConfirm');
const accordCategories=['coin','egg','frog','gem','goat','rune','treasure'];
function contractManualObjects(s,p,A){
 const items=[...s.units.filter(u=>!u.dying&&u.controller===p&&A.card(u.card).type==='Minion').map(u=>({...u,kind:'unit'})),...s.artifacts.filter(a=>A.artifactController(s,a)===p).map(a=>({...a,kind:'artifact'})),...(s.auras||[]).filter(a=>a.controller===p).map(a=>({...a,kind:'aura'})),...s.board.flatMap((a,at)=>a?.controller===p?[{...a,at,kind:'site'}]:[])];
 return items.map(a=>({label:A.card(a.card).name+' · '+label(a.at)+' · '+layer(a)+' · '+(a.uid||'site:'+a.at),value:{kind:a.kind,uid:a.uid,card:a.card,...(a.kind==='site'?{at:a.at}:{})}}));
}
export function resolveFinalContract(s,frame,A){
 const {step,source,controller:p,selected}=frame;
 if(step.op==='finalContractCommit'){
  if(selected?.kind==='manual'){s.choice={player:p,manual:true,title:'人工 accord：選實體卡；不是僅畫有此物即符合',options:[...contractManualObjects(s,p,A),{label:'取消（不付費）',value:null}],frame:{...frame,step:{...step,op:'finalContractManualPick'}}};return true;}
  if(selected!==null)A.commitSpell(s,{...step.action,contractCost:selected},step.declared);return true;
 }
 if(step.op==='finalContractManualPick'){
  if(selected===null)return true;const object=contractManualObjects(s,p,A).find(o=>JSON.stringify(o.value)===JSON.stringify(selected));if(!object)return true;
  s.choice={player:p,manual:true,title:'人工核實：此實體卡屬於哪種 accord？不能猜類別',options:[...accordCategories.map(category=>({label:category,value:category})),{label:'無法確認／取消',value:null}],frame:{...frame,step:{...step,op:'finalContractManualCategory',object:object.value}}};return true;
 }
 if(step.op==='finalContractManualCategory'){
  if(selected===null||!accordCategories.includes(selected))return true;
  s.choice={player:p,manual:true,title:'確認實體卡為 '+selected+'：犧牲 '+A.card(step.object.card).name+'（本程式未自動分類）',options:[{label:'已依實體卡類別核實，確認支付',value:true},{label:'取消（不付費）',value:null}],frame:{...frame,step:{...step,op:'finalContractManualConfirm',category:selected}}};return true;
 }
 if(step.op==='finalContractManualConfirm'){
  if(selected!==true)return true;const cost={...step.object,category:step.category,manual:true};s.finalContractAccordPermission={player:p,hand:step.action.hand,caster:step.action.caster,cost,verification:'human-physical-card-category'};A.commitSpell(s,{...step.action,contractCost:cost},step.declared);return true;
 }
 if(step.op!=='finalContractSearch')return false;
 const rank=Math.max(-1,...s.units.filter(u=>!u.dying&&u.controller===p&&A.card(u.card).type==='Minion'&&A.unitTypes(u).includes('Demon')).map(u=>contractRarity[A.card(u.card).slot]??-1));
 const options=A.selectEffects(s,frame,{kind:'deck',own:true}).filter(o=>A.card(o.value.card).category==='Spell'&&(contractRarity[A.card(o.value.card).slot]??Infinity)<=rank);
 if(selected===undefined){s.choice={player:p,title:'Demonic Contract · 搜尋並揭示',options:[...options,{label:'未找到',value:null}],frame};return true;}
 if(selected!==null){const found=options.find(o=>o.value.index===selected.index&&o.value.card===selected.card);if(found){const id=s.players[p].spells.splice(selected.index,1)[0];s.players[p].hand.push({uid:'h'+s.next++,card:id});A.log(s,'Demonic Contract · 揭示 '+A.card(id).name);}}
 A.shuffle(s,s.players[p].spells);return true;
}
