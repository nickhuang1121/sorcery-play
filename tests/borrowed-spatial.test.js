import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,legalActions,dispatch,topSpellAccess,handIsRevealed,unit} from '../src/engine.js';
import {waterSite} from '../src/geography.js';
import {geometryLocationRecords,geometryOccupied} from '../src/final-geometry.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
function game(){const s=newGame([starter(),starter()],42,'local');s.turn=5;s.active=0;s.phase='main';s.artifacts=[];s.auras=[];s.storyline=[];s.choice=null;s.units.forEach(u=>{u.born=0;u.tapped=false;});s.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));for(const p of s.players){p.hand=[];p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}return s;}
function add(s,slug='brown_bears',at=12,p=0,extra={}){const u={uid:'u'+s.next++,card:card(slug).id,at,owner:p,controller:p,born:0,damage:0,mods:[],tapped:false,...extra};s.units.push(u);return u;}
function bust(s,u,slug){const a={uid:'bust'+s.next++,card:card('the_pallid_bust').id,bearer:u.uid,at:u.at,owner:u.controller,controller:u.controller,pallidPrintedCard:card(slug).id};s.artifacts.push(a);return a;}
function choose(s,predicate){const option=s.choice.options.findIndex(o=>predicate(o.value));assert.ok(option>=0,JSON.stringify(s.choice.options));return dispatch(s,{type:'choose',player:s.choice.player,option});}

test('The Pallid Bust gained Felbog leap survives bearer silence and skips the intermediate Site',()=>{
 let s=game();const u=add(s,'brown_bears',12,0,{mods:[{silenced:true}]});bust(s,u,'felbog_frog_men');s.board[7].card=card('bottomless_pit').id;s=restoreGame(s);
 const move=legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===2);assert.ok(move);s=dispatch(s,move);assert.equal(unit(s,u.uid).at,2);assert.equal(unit(s,u.uid).card,card('brown_bears').id);
});
test('The Pallid Bust gained Megamoeba grows while bearer is silenced and retains only the resulting size after detachment',()=>{
 let s=game();const u=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),a=bust(s,u,'megamoeba');s=restoreGame(s);
 assert.equal(unit(s,u.uid).ongoingPower,1);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===7));assert.deepEqual(geometryOccupied(unit(s,u.uid)),[12,7]);assert.equal(unit(s,u.uid).ongoingPower,2);
 s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);unit(s,u.uid).tapped=false;s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===8));assert.deepEqual(geometryOccupied(unit(s,u.uid)),[13,8]);assert.equal(unit(s,u.uid).ongoingPower,0);
});
test('The Pallid Bust preserves independent native Megamoeba and gained Aethermoeba power contributions',()=>{
 let s=game();s.board[7]=null;const u=add(s,'megamoeba');bust(s,u,'aethermoeba');s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===u.uid&&a.at===7));assert.deepEqual(geometryOccupied(unit(s,u.uid)),[12,7]);assert.equal(unit(s,u.uid).ongoingPower,3);
});
test('The Pallid Bust gains Yog safety and five-void banishment while preserving the original size',()=>{
 let s=game();for(const at of [0,1,3,4,5])s.board[at]=null;const u=add(s,'brown_bears',0,0,{mods:[{silenced:true}]}),a=bust(s,u,'yog_sothoth');s=restoreGame(s);assert.equal(geometryLocationRecords(unit(s,u.uid)).length,1);assert.equal(unit(s,u.uid).geometryIgnoreSites,true);
 s=dispatch(s,{type:'end',player:0});assert.ok(unit(s,u.uid));s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);s=dispatch(s,{type:'draw',player:1,deck:'spells'});assert.ok(!unit(s,u.uid));assert.ok(s.players[0].banished.includes(u.card));
});
test('The Pallid Bust gained Cerberus follows the Avatar under bearer silence and stops following when detached',()=>{
 let s=game();const u=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),a=bust(s,u,'cerberus_in_chains');s=restoreGame(s);assert.equal(unit(s,u.uid).at,17);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid));
 s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);const avatar=s.units.find(v=>v.controller===0&&card(v.card).type==='Avatar');s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===avatar.uid&&a.at===12));assert.equal(unit(s,u.uid).at,17);
});
test('The Pallid Bust gained Maze Minotaur constrains an enemy using the real carrier location',()=>{
 let s=game();const holder=add(s,'brown_bears',12,1),u=add(s,'wild_boars',13);bust(s,holder,'maze_minotaur');s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===14));assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===8));
});
test('The Pallid Bust gained Undesirables blocks allied entry without becoming a different physical card',()=>{
 let s=game();const holder=add(s,'brown_bears',12),u=add(s,'wild_boars',13);bust(s,holder,'undesirables');s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===u.uid&&a.at===12));assert.equal(unit(s,holder.uid).card,card('brown_bears').id);
});
test('The Pallid Bust gained Ominous Owl permits a real summon onto its enemy-owned Site',()=>{
 let s=game();const holder=add(s,'brown_bears',6);bust(s,holder,'ominous_owl');const h={uid:'hand'+s.next++,card:card('wild_boars').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===6);assert.ok(cast);s=dispatch(s,cast);assert.ok(s.units.some(v=>v.card===h.card&&v.at===6&&v.controller===0));assert.equal(s.board[6].controller,1);
});
test('The Pallid Bust gained Lucid Dreamers enables real void summoning and supplies the while-void permission',()=>{
 let s=game();s.board[7]=null;const holder=add(s,'brown_bears',7);bust(s,holder,'lucid_dreamers');const h={uid:'hand'+s.next++,card:card('wild_boars').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===7);assert.ok(cast);s=dispatch(s,cast);const summoned=s.units.find(v=>v.card===h.card&&v.at===7);assert.ok(summoned);assert.ok(summoned.mods.some(m=>m.whileVoid&&m.keyword==='Voidwalk'));
});
test('The Pallid Bust gained East-West Dragon grants horizontal free movement to its real bearer',()=>{
 let s=game();const holder=add(s,'brown_bears',12);bust(s,holder,'east_west_dragon');s=restoreGame(s);const move=legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===14);assert.ok(move);s=dispatch(s,move);assert.equal(unit(s,holder.uid).at,14);
});
test('The Pallid Bust gained Earl grants a live caster while retaining its non-Ordinary casting prohibition',()=>{
 let s=game();const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]});bust(s,holder,'earl_of_the_ivory_towers');const h={uid:'hand'+s.next++,card:card('zap').id};const elite={uid:'hand'+s.next++,card:card('major_explosion').id};s.players[0].hand.push(h,elite);s=restoreGame(s);assert.ok(legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid));assert.ok(!legalActions(s).some(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===holder.uid));assert.ok(legalActions(s).some(a=>a.type==='cast'&&a.hand===elite.uid&&a.caster===holder.uid));
});
test('The Pallid Bust real Genesis banishment activates the borrowed spatial record without changing the bearer card',()=>{
 let s=game();const holder=add(s,'brown_bears',12),a={uid:'unpreparedBust',card:card('the_pallid_bust').id,bearer:holder.uid,at:12,owner:0,controller:0};s.artifacts.push(a);s.players[1].cemetery.push(card('felbog_frog_men').id);s=restoreGame(s);assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===holder.uid&&a.at===2));
 s.choice={player:0,title:'Genesis',options:[{label:'Resolve',value:undefined}],frame:{source:structuredClone(a),controller:0,effectCard:a.card,step:{op:'finalPallidBust'}}};s=dispatch(s,{type:'choose',player:0,option:0});s=choose(s,value=>value?.card===card('felbog_frog_men').id);assert.ok(s.players[1].banished.includes(card('felbog_frog_men').id));assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===holder.uid&&a.at===2));assert.equal(unit(s,holder.uid).card,card('brown_bears').id);
});
test('The Pallid Bust carry sources keep independent capacity, allegiance, disabled passengers and source removal',()=>{
 let s=game();const carrier=add(s,'war_horse',12),ally=add(s,'wild_boars',12),enemy=add(s,'brown_bears',12,1),a=bust(s,carrier,'tringh_constrictor');s=restoreGame(s);
 const pickup=legalActions(s).find(action=>action.type==='pickup'&&action.unit===carrier.uid&&action.carryOrigin===card('tringh_constrictor').id);assert.ok(pickup);s=dispatch(s,{...pickup,units:[enemy.uid],items:[]});assert.equal(unit(s,enemy.uid).carriedBy,carrier.uid);assert.equal(unit(s,enemy.uid).carryDisabled,true);
 s=dispatch(s,{type:'end',player:0});s=dispatch(s,{type:'draw',player:1,deck:'spells'});s=dispatch(s,{type:'end',player:1});s=dispatch(s,{type:'draw',player:0,deck:'spells'});
 const native=legalActions(s).find(action=>action.type==='pickup'&&action.unit===carrier.uid&&action.carryOrigin===card('war_horse').id);assert.ok(native);s=dispatch(s,{...native,units:[ally.uid],items:[]});assert.equal(unit(s,ally.uid).carriedBy,carrier.uid);assert.equal(unit(s,ally.uid).carryDisabled,false);assert.equal(unit(s,enemy.uid).carryDisabled,true);assert.notEqual(unit(s,ally.uid).carriedAbility,unit(s,enemy.uid).carriedAbility);
 s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);assert.equal(unit(s,enemy.uid).carriedBy,undefined);assert.equal(unit(s,ally.uid).carriedBy,carrier.uid);
});
test('The Pallid Bust gained Sir Tom Thumb carried-by type is honored by a normal Beast carrier',()=>{
 let s=game();const carrier=add(s,'brown_bears',12),rider=add(s,'wild_boars',12),a=bust(s,rider,'sir_tom_thumb');s=restoreGame(s);const pickup=legalActions(s).find(action=>action.type==='pickup'&&action.unit===carrier.uid);assert.ok(pickup);s=dispatch(s,{...pickup,units:[rider.uid],items:[]});assert.equal(unit(s,rider.uid).carriedBy,carrier.uid);s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);assert.equal(unit(s,rider.uid).carriedBy,undefined);
});
test('The Pallid Bust duplicate Army movement abilities trigger separately and detaching one removes only its contribution',()=>{
 let s=game();const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),a=bust(s,holder,'army_of_the_dead');bust(s,holder,'army_of_the_dead');s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===7));assert.equal(s.units.filter(v=>card(v.card).slug==='skeleton'&&v.at===12).length,2);
 s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);unit(s,holder.uid).tapped=false;s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===2));assert.equal(s.units.filter(v=>card(v.card).slug==='skeleton'&&v.at===7).length,1);
});
test('The Pallid Bust gained Varistus kills enemies at the newly entered void location, rather than the old carrier location',()=>{
 let s=game();s.board[7]=null;const holder=add(s,'brown_bears',12),enemy=add(s,'brown_bears',7,1,{mods:[{keyword:'Voidwalk'}]}),far=add(s,'brown_bears',8,1);bust(s,holder,'varistus_the_evictor');s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===7));assert.ok(!unit(s,enemy.uid));assert.ok(unit(s,far.uid));assert.ok(s.players[1].cemetery.includes(enemy.card));
});
test('The Pallid Bust gained Phase Assassin acquires Stealth on actual void entry under bearer silence',()=>{
 let s=game();s.board[7]=null;const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]});bust(s,holder,'phase_assassin');s=restoreGame(s);assert.equal(unit(s,holder.uid).stealth,undefined);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===7));assert.equal(unit(s,holder.uid).stealth,true);
});
test('The Pallid Bust gained Merlin reveals its own spellbook top and can actually cast that top Magic while silenced',()=>{
 let s=game();const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),enemy=add(s,'brown_bears',13,1),a=bust(s,holder,'merlin');s.players[0].spells.unshift(card('zap').id);s=restoreGame(s);assert.equal(topSpellAccess(s,0).canLook,true);assert.equal(topSpellAccess(s,1).publicTop,false);
 const cast=legalActions(s).find(action=>action.type==='cast'&&action.top?.kind==='merlin'&&action.caster===holder.uid&&action.target===enemy.uid);assert.ok(cast);assert.equal(cast.top.abilityOrigin,card('merlin').id);s=dispatch(s,cast);assert.equal(unit(s,enemy.uid).damage,1);s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);assert.equal(topSpellAccess(s,0).canLook,false);
});
test('The Pallid Bust duplicate Skirmishers movement shots retain independent instances while the bearer is silenced',()=>{
 let s=game();const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),enemy=add(s,'brown_bears',7,1,{mods:[{power:10}]});bust(s,holder,'skirmishers_of_mu');bust(s,holder,'skirmishers_of_mu');s=restoreGame(s);const move=legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===13);assert.ok(move);s=dispatch(s,move);
 assert.match(s.choice.title,/Skirmishers/);const first=s.choice.frame.step.shotInstance;s=choose(s,value=>value===1);assert.match(s.choice.title,/Skirmishers/);assert.notEqual(s.choice.frame.step.shotInstance,first);s=choose(s,value=>value===1);assert.equal(unit(s,enemy.uid).damage,8);assert.equal(unit(s,holder.uid).at,13);assert.equal(Object.values(unit(s,holder.uid).spatialShotsUsed).filter(Boolean).length,2);
});
test('The Pallid Bust declining a movement shot at one location allows the same instance to shoot after the next step',()=>{
 let s=game();const holder=add(s,'brown_bears',12),enemy=add(s,'brown_bears',12,1,{mods:[{power:10}]});bust(s,holder,'skirmishers_of_mu');s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='move'&&a.unit===holder.uid&&a.at===13));assert.equal(unit(s,holder.uid).at,12);const instance=s.choice.frame.step.shotInstance;s=choose(s,value=>value===0);assert.equal(unit(s,holder.uid).at,13);assert.equal(s.choice.frame.step.shotInstance,instance);s=choose(s,value=>value===4);assert.equal(unit(s,enemy.uid).damage,4);assert.equal(unit(s,holder.uid).spatialShotsUsed[instance],true);
});
test('The Pallid Bust gained Fenvale Muse queues a real nearby River Genesis after its carrier casts a spell',()=>{
 let s=game();s.board[7].card=card('spring_river').id;const holder=add(s,'brown_bears',12),enemy=add(s,'brown_bears',13,1);bust(s,holder,'fenvale_muse');const h={uid:'hand'+s.next++,card:card('zap').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===holder.uid&&a.target===enemy.uid);assert.ok(cast);s=dispatch(s,cast);assert.equal(s.choice.frame.step.op,'triggerSiteGenesis');assert.equal(s.choice.frame.step.abilityOrigin,card('fenvale_muse').id);assert.ok(s.choice.options.some(o=>o.value?.at===7));s=choose(s,v=>v?.at===7);assert.ok(s.choice,'Spring River Genesis presents its actual top-spell choice');s=choose(s,v=>v==='keep');assert.equal(unit(s,enemy.uid).damage,1);
});
test('The Pallid Bust gained Thieving Magpie allows a real pickup of an enemy carried artifact within its cost permission',()=>{
 let s=game();const holder=add(s,'brown_bears',12),enemy=add(s,'wild_boars',12,1);bust(s,holder,'thieving_magpie');s.artifacts.push({uid:'enemyCharm',card:card('lucky_charm').id,owner:1,controller:1,bearer:enemy.uid,at:12});s=restoreGame(s);const pickup=legalActions(s).find(a=>a.type==='pickup'&&a.unit===holder.uid);assert.ok(pickup);s=dispatch(s,{...pickup,items:['enemyCharm'],units:[]});assert.equal(s.artifacts.find(a=>a.uid==='enemyCharm').bearer,holder.uid);assert.equal(s.artifacts.find(a=>a.uid==='enemyCharm').owner,1);
});
test('The Pallid Bust gained Driftwood Marrows stops actual Nelly forced Submerge and detachment restores the move',()=>{
 let s=game();s.active=1;s.board[8].card=card('spring_river').id;s.board[13].card=card('spring_river').id;const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),target=add(s,'brown_bears',8,0,{mods:[{keyword:'Submerge'}]}),nelly=add(s,'nelly_longarms',13,1),a=bust(s,holder,'driftwood_marrows');s=restoreGame(s);const activate=legalActions(s,1).find(action=>action.type==='activate'&&action.unit===nelly.uid);assert.ok(activate);s=dispatch(s,activate);s=choose(s,v=>v===1);if(s.choice?.frame.step.op==='fiftyBoltHit')s=choose(s,v=>v?.uid===target.uid);assert.equal(s.choice.frame.step.op,'fiftyNellySubmerge');s=choose(s,v=>v===true);assert.equal(unit(s,target.uid).at,13);assert.equal(unit(s,target.uid).layer||'surface','surface');
 s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);s.choice={player:1,title:'Nelly',options:[{label:'Submerge',value:true}],frame:{source:structuredClone(unit(s,nelly.uid)),controller:1,effectCard:nelly.card,step:{op:'fiftyNellySubmerge',uid:target.uid}}};s=dispatch(s,{type:'choose',player:1,option:0});assert.equal(unit(s,target.uid).layer,'below');
});
test('The Pallid Bust gained Swiven Scout reveals a hand within carrier movement range and detachment removes the permission',()=>{
 let s=game();s.units.find(u=>u.controller===1&&card(u.card).type==='Avatar').at=7;const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),a=bust(s,holder,'swiven_scout');s=restoreGame(s);assert.equal(handIsRevealed(s,1),true);s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);assert.equal(handIsRevealed(s,1),false);
});
test('The Pallid Bust Undesirables entry prohibition keeps the source physical layer instead of blocking both layers of a Site',()=>{
 let s=game();const holder=add(s,'brown_bears',12),below=add(s,'wild_boars',13,0,{layer:'below',mods:[{keyword:'Burrowing'}]}),surface=add(s,'wild_boars',13);bust(s,holder,'undesirables');s=restoreGame(s);
 assert.ok(legalActions(s).some(a=>a.type==='move'&&a.unit===below.uid&&a.at===12&&a.layer==='below'));assert.ok(!legalActions(s).some(a=>a.type==='move'&&a.unit===surface.uid&&a.at===12));
});
test('The Pallid Bust borrowed Yog still banishes its one-location bearer when fewer than five voids remain',()=>{
 let s=game();for(const at of [0,1,3,4])s.board[at]=null;const holder=add(s,'brown_bears',12);bust(s,holder,'yog_sothoth');s=restoreGame(s);assert.equal(geometryLocationRecords(unit(s,holder.uid)).length,1);s=dispatch(s,{type:'end',player:0});assert.ok(!unit(s,holder.uid));assert.ok(s.players[0].banished.includes(holder.card));
});
test('The Pallid Bust size boundary does not change a genuine Selfsame basic copy of Yog-Sothoth',()=>{
 let s=game();for(const at of [0,1,3,4,5])s.board[at]=null;const original=add(s,'yog_sothoth',12),h={uid:'hand'+s.next++,card:card('selfsame_simulacrum').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===13);assert.ok(cast);s=dispatch(s,cast);assert.equal(s.choice.frame.step.op,'copyEntry');s=choose(s,v=>v?.card===original.card);const copy=s.units.find(v=>v.uid!==original.uid&&v.originalCard===h.card);assert.ok(copy);assert.equal(copy.card,original.card);assert.equal(geometryLocationRecords(copy).length,40);assert.equal(geometryLocationRecords(unit(s,original.uid)).length,40);
});
function whirlingRemotePseudopods(gained){
 let s=game();const holder=add(s,gained?'brown_bears':'megamoeba',12,0,{geometryLocations:[{at:12,layer:'surface'},{at:0,layer:'surface'},{at:19,layer:'surface'}],geometryAnchor:{at:12,layer:'surface'}});if(gained)bust(s,holder,'megamoeba');const untouched=add(s,'brown_bears',12,1),victims=[0,1,19,18].map(at=>add(s,'brown_bears',at,1)),h={uid:'hand'+s.next++,card:card('whirling_blades').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(cast);s=dispatch(s,cast);s=choose(s,v=>v?.uid===holder.uid);
 assert.equal(s.choice.frame.step.op,'geometryWhirlDeclare');s=choose(s,v=>v?.from?.at===0&&v.to.at===1);assert.equal(unit(s,holder.uid).at,12,'Both steps must be declared before physical movement');s=choose(s,v=>v?.from?.at===19&&v.to.at===18);
 assert.deepEqual(geometryOccupied(unit(s,holder.uid)),[12,0,19,1,18]);assert.equal(unit(s,holder.uid).ongoingPower,5);assert.equal(unit(s,untouched.uid).damage,0);for(const victim of victims)assert.ok(!unit(s,victim.uid));
}
test('Megamoeba Whirling Blades strikes only the two chosen pseudopods start and destination locations',()=>whirlingRemotePseudopods(false));
test('The Pallid Bust borrowed Megamoeba preserves actual pseudopod paths for Whirling Blades',()=>whirlingRemotePseudopods(true));
test('The Pallid Bust Perceval source instances keep separate quests when their annotated Genesis is actually triggered',()=>{
 let s=game();const holder=add(s,'brown_bears',12),a=bust(s,holder,'sir_perceval'),b=bust(s,holder,'sir_perceval');s=restoreGame(s);
 for(const [artifact,at] of [[a,7],[b,13]]){
  s.choice={player:0,title:'Triggered gained Genesis',options:[{label:'Resolve',value:undefined}],frame:{source:structuredClone(unit(s,holder.uid)),controller:0,effectCard:card('sir_perceval').id,step:{op:'percevalSite',abilityOrigin:card('sir_perceval').id,abilityInstance:'artifact:'+artifact.uid+':genesis:0',abilityNature:'gained'}}};s=dispatch(s,{type:'choose',player:0,option:0});s=choose(s,v=>v===at);
 }
 assert.equal(unit(s,holder.uid).questSite,undefined);assert.equal(unit(s,holder.uid).questSites['artifact:'+a.uid],s.board[7].uid);assert.equal(unit(s,holder.uid).questSites['artifact:'+b.uid],s.board[13].uid);
 const before=s.players[0].hand.length;s=dispatch(s,legalActions(s).find(action=>action.type==='move'&&action.unit===holder.uid&&action.at===7));assert.equal(s.choice.frame.step.op,'drawCards');s=choose(s,v=>v?.spells===1);assert.equal(s.players[0].hand.length,before+1);assert.equal(s.choice.frame.step.abilityInstance,'artifact:'+a.uid);s=choose(s,v=>v===8);assert.equal(unit(s,holder.uid).questSites['artifact:'+a.uid],s.board[8].uid);assert.equal(unit(s,holder.uid).questSites['artifact:'+b.uid],s.board[13].uid);
});
test('The Pallid Bust source adapter preserves native Winter Nymph tapping herself on her own summon',()=>{
 let s=game();const h={uid:'hand'+s.next++,card:card('winter_nymph').id};s.players[0].hand.push(h);s=restoreGame(s);const cast=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.at===12);assert.ok(cast);s=dispatch(s,cast);const nymph=s.units.find(u=>u.card===h.card);assert.ok(nymph);assert.equal(nymph.tapped,true);
});
test('The Pallid Bust gained Tide Naiads floods the actual bearer Site under silence and follows movement without permanently mutating the Site',()=>{
 let s=game();const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]}),a=bust(s,holder,'tide_naiads');a.stamp=20;s=restoreGame(s);assert.equal(waterSite(s,12,card),true);assert.equal(s.board[12].flooded,undefined);s=dispatch(s,legalActions(s).find(action=>action.type==='move'&&action.unit===holder.uid&&action.at===13));assert.equal(waterSite(s,12,card),false);assert.equal(waterSite(s,13,card),true);s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);assert.equal(waterSite(s,13,card),false);
});
test('The Pallid Bust duplicate Tide Naiads grants preserve their separate timestamps against Drought',()=>{
 let s=game();const holder=add(s,'brown_bears',12),older=bust(s,holder,'tide_naiads'),newer=bust(s,holder,'tide_naiads');older.stamp=5;newer.stamp=20;s.auras.push({uid:'dry',card:card('drought').id,at:11,owner:1,controller:1,stamp:10});s=restoreGame(s);assert.equal(waterSite(s,12,card),true);s.artifacts=s.artifacts.filter(v=>v.uid!==newer.uid);s=restoreGame(s);assert.equal(waterSite(s,12,card),false);s.auras=[];s=restoreGame(s);assert.equal(waterSite(s,12,card),true);
});
function borrowedCultGame(slug='ghoul'){
 let s=game();const holder=add(s,'brown_bears',6,1),a=bust(s,holder,'doomsday_cult');s.players[0].spells.unshift(card(slug).id);return {s:restoreGame(s),holder,bust:a};
}
test('The Pallid Bust borrowed Cult permits a real Evil top-card cast onto the enemy-owned Site here',()=>{
 let {s}=borrowedCultGame();const cast=legalActions(s,0).find(a=>a.type==='cast'&&a.top?.kind==='cult'&&a.at===6);assert.ok(cast);s=dispatch(s,cast);assert.ok(s.units.some(u=>u.card===card('ghoul').id&&u.at===6&&u.controller===0));assert.equal(s.board[6].controller,1);
});
test('The Pallid Bust borrowed Cult casting permission preserves Dormant Monstrosity corner-void prohibition',()=>{
 const {s}=borrowedCultGame('dormant_monstrosity');assert.ok(!legalActions(s,0).some(a=>a.type==='cast'&&a.top?.kind==='cult'&&a.at===6));
 let corner=game();corner.board[4]=null;const holder=add(corner,'brown_bears',4,1,{mods:[{keyword:'Voidwalk'}]});bust(corner,holder,'doomsday_cult');corner.players[0].spells.unshift(card('dormant_monstrosity').id);corner=restoreGame(corner);assert.ok(legalActions(corner,0).some(a=>a.type==='cast'&&a.top?.kind==='cult'&&a.at===4));
});
test('The Pallid Bust Cult source removal invalidates its pending top-card cast without consuming the card or mana',()=>{
 let {s,bust:a}=borrowedCultGame();const cast=legalActions(s,0).find(a=>a.type==='cast'&&a.top?.kind==='cult'&&a.at===6);assert.ok(cast);s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);const top=s.players[0].spells[0],spent=s.players[0].spent;assert.throws(()=>dispatch(s,cast));assert.equal(s.players[0].spells[0],top);assert.equal(s.players[0].spent,spent);
});

function dreamHand(s){const h={uid:'dreamHand'+s.next++,card:card('dream_quest').id};s.players[0].hand.push(h);return h;}
test('The Pallid Bust gained Spellcaster under bearer Silence remains a real Dream-Quest choice and falls asleep',()=>{
 let s=game();const holder=add(s,'brown_bears',12,0,{mods:[{silenced:true}]});bust(s,holder,'skeleton_mage');const h=dreamHand(s);s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid);assert.ok(action);s=dispatch(s,action);assert.ok(s.choice?.options.some(o=>o.value?.uid===holder.uid));s=choose(s,v=>v?.uid===holder.uid);assert.ok(unit(s,holder.uid).mods.some(m=>m.asleep&&m.dream));assert.ok(s.dreams.some(d=>d.target===holder.uid));
});
test('Dream-Quest excludes a silenced native Spellcaster and a detached Pallid grant from actual choices',()=>{
 let s=game();const native=add(s,'skeleton_mage',12,0,{mods:[{silenced:true}]}),holder=add(s,'brown_bears',13,0,{mods:[{silenced:true}]}),a=bust(s,holder,'skeleton_mage'),h=dreamHand(s);s=restoreGame(s);s.artifacts=s.artifacts.filter(v=>v.uid!==a.uid);s=restoreGame(s);s=dispatch(s,legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid));assert.ok(!s.choice?.options.some(o=>[native.uid,holder.uid].includes(o.value?.uid)));assert.ok(!s.dreams?.some(d=>[native.uid,holder.uid].includes(d.target)));
});
test('Dream-Quest can be cast by a silenced Avatar whose Spellcaster characteristic survives Silence',()=>{
 let s=game();const av=s.units.find(u=>u.controller===0&&card(u.card).type==='Avatar');av.mods.push({silenced:true});const holder=add(s,'skeleton_mage',12),h=dreamHand(s);s=restoreGame(s);const action=legalActions(s).find(a=>a.type==='cast'&&a.hand===h.uid&&a.caster===av.uid);assert.ok(action);s=dispatch(s,action);assert.ok(s.choice?.options.some(o=>o.value?.uid===holder.uid));s=choose(s,v=>v?.uid===holder.uid);assert.ok(unit(s,holder.uid).mods.some(m=>m.asleep));assert.ok(!unit(s,av.uid).mods.some(m=>m.asleep));
});
