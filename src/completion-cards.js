import {registerPermanentRealmFlood} from './final-flood.js';
import {catalogAuraActive} from './aura-source-state.js';
import {resolveCatalogAuraSubmerge} from './catalog-aura-submerge.js';
import {catalogAuraHere,catalogAuraPhysicalShape} from './catalog-auras.js';
import {unitPassiveLayerViews,siteEffectAllowed,pallidPrintedTypes,abilityMinionTypes} from './final-ability-layers.js';
import {sendBuiltSite} from './final-built-sites.js';
// Remaining-card work is explicitly bound and enabled only with an effect case.
import {geometryPlaceSiteAllowed} from './final-geometry.js';
export const completionBatches=[
 ['acid_rain','blightstone','fields_of_phyxis','leadworks','smokestacks_of_gnaak'],
 ['sinterfee','overflowing_court','atlantean_fate','bluecap_knockers','bower_of_bliss'],
 ['forlorn_keep','forsaken_crypt','molten_maar','peculiar_port','troubled_town'],
 ['trade_encampment','eriks_curiosa','legion_of_gall','young_master_damion','ersatz_platz'],
 ['great_old_one','the_great_drowning_of_men','year_of_the_blaze','salt_the_earth','sow_the_earth'],
 ['druid','bruin','interrogator','witch','harbinger'],
 ['consecrate','desecrate','elder_ruins','gilman_house','horns_of_behemoth'],
 ['old_mortimers_den','troll_bridge','sold_out_cemetery','watery_grave','vaults_of_zul'],
 ['toolbox','silver_bullet','merlin','cradle_of_etherrum','doomsday_cult'],
 ['skeleton_mage','book_of_the_dead','merlins_tower','a_midsummer_nights_dream','dream_quest'],
 ['shapeshift','monstermorphosis','sinister_pond','sir_gareth','slimy_mutants'],
 ['selfsame_simulacrum','evil_twin','assimilator_snail','vengeful_heir','moon_clan_werewolf'],
 ['mask_of_mayhem','the_green_knight','tvinnax_berserker','sir_agravaine','wind_sylph'],
 ['wills_o_the_wisp','witherwing_hero','bladedancer','sturmgeist','peace_offering'],
 ['wall_of_air','wall_of_brambles','wall_of_fire','wall_of_ice','sphere_of_animosity'],

];
export const completionDefinitions={
 the_green_knight:{death:[{op:'strike',select:{kind:'unit',enemy:true,nearby:true}}]},
 assimilator_snail:{activated:[{label:'放逐墓地僕從，複製至下回合',declare:true,once:true,steps:[{op:'copySnail',select:{kind:'grave',minion:true,playable:true,copyFits:true}}]}]},
 shapeshift:{cast:[{op:'morphShapeshift',select:{kind:'unit',minion:true,ally:true}}]},
 monstermorphosis:{cast:[{op:'morphMonster',select:{kind:'unit',minion:true,nearby:true}}]},
 sinister_pond:{activated:[{label:'將此處 Mortal 變身為手牌 Evil，支付費用差額',anyPlayer:true,steps:[{op:'morphPond',select:{kind:'unit',minion:true,types:['Mortal'],here:true,siteBothLayers:true}}]}]},
 skeleton_mage:{genesis:[{op:'collectionPermit',zone:'cemetery',anyGrave:true,filter:{type:'Magic',rarity:'Ordinary'},graveBanish:true,title:'Skeleton Mage'}]},
 book_of_the_dead:{activated:[{bearerGranted:true,label:'Spellcaster 持有者施放墓地僕從',bearerSource:true,once:true,requiresSpellcaster:true,steps:[{op:'collectionPermit',zone:'cemetery',filter:{type:'Minion'},bookDead:true,title:'Book of the Dead'}]}]},
 merlins_tower:{genesis:[{op:'completionTowerMagic'}]},
 dream_quest:{cast:[{op:'dreamSleep',select:{kind:'dreamCaster'}}]},
 toolbox:{activated:[{label:'犧牲：持有者施放收藏區 Ordinary 法術',bearerSource:true,sacrificeAtActivation:true,steps:[{op:'collectionPermit',filter:{rarity:'Ordinary'},independentCasterPermission:true,title:'Toolbox'}]}]},
 silver_bullet:{activated:[{bearerGranted:true,label:'橫置並犧牲：施放收藏區 Exceptional 法術',bearerSource:true,bearerTap:true,sacrificeAtActivation:true,steps:[{op:'collectionPermit',filter:{rarity:'Exceptional'},independentCasterPermission:true,title:'Silver Bullet'}]}]},
 consecrate:{cast:[{op:'collectionBless',select:{kind:'unit',ally:true}}]},
 desecrate:{cast:[{op:'collectionDesecrate',select:{kind:'unit',ally:true,evil:true}}]},
 elder_ruins:{activated:[{label:'犧牲此處友軍，施放收藏區 Shoggoth',declare:true,sacrificeSelected:true,steps:[{op:'collectionElder',select:{kind:'unit',minion:true,ally:true,here:true,siteBothLayers:true,untargeted:true,protectionReadOnly:true}}]}]},
 gilman_house:{activated:[{label:'將此處僕從變為收藏區 Horrible Hybrids',threshold:{water:4},steps:[{op:'collectionHybrid',select:{kind:'unit',minion:true,here:true}}]}]},
 horns_of_behemoth:{activated:[{label:'變為 Demon',threshold:{fire:6},steps:[{op:'completionHorns'}]}]},
 druid:{activated:[{label:'橫置：召喚 Bruin 並翻面',tap:true,onceEver:'druidFlipped',steps:[{op:'completionDruidFlip'}]}]},
 witch:{activated:[{label:'橫置：詛咒 Avatar',tap:true,steps:[{op:'completionCurse',select:{kind:'unit',avatar:true,anyRegion:true}}]}]},
 great_old_one:{genesis:[{op:'completionFloodRealm'}]},
 the_great_drowning_of_men:{start:[{op:'completionDrowning'}]},
 year_of_the_blaze:{start:[{op:'completionYearBlaze'}]},
 salt_the_earth:{genesis:[{op:'completionSalt'}]},sow_the_earth:{genesis:[{op:'completionSow'}]},
 ersatz_platz:{activated:[{label:'打出收藏區 Exceptional 地點',steps:[{op:'collectionSite'}]}]},
 trade_encampment:{genesis:[{op:'collectionTrade'}]},
 eriks_curiosa:{activated:[{label:'撕毀此牌，抽取收藏區卡牌',steps:[{op:'collectionDraw'}]}]},
 legion_of_gall:{genesis:[{op:'collectionLegion'}]},young_master_damion:{genesis:[{op:'collectionDamion'}]},
 leadworks:{genesis:[{op:'completionLeadworks'}]},
 sinterfee:{genesis:[{op:'completionSinterfee',select:{kind:'site',adjacent:true}}]},
 overflowing_court:{genesis:[{op:'completionCourts'}]},
 atlantean_fate:{genesis:[{op:'completionFateSubmerge'}]},
};
export const completionPassives={druid:{completionDruid:true},__druid_back:{completionDruidBack:true},bruin:{fiftyRedirectAvatar:true},interrogator:{completionInterrogate:true},witch:{completionWitch:true},harbinger:{completionHarbinger:true},ersatz_platz:{collectionExceptionalSite:true},blightstone:{completionBlight:true},bluecap_knockers:{completionProtectSite:true}};
Object.assign(completionPassives,{old_mortimers_den:{completionMortimer:true},troll_bridge:{completionTroll:true},sold_out_cemetery:{completionSoldOut:true},watery_grave:{completionWatery:true},vaults_of_zul:{completionVaults:true}});
Object.assign(completionPassives,{merlin:{topMagic:true},cradle_of_etherrum:{topDragon:true},doomsday_cult:{topEvil:true}});
Object.assign(completionPassives,{merlins_tower:{completionTowerMagic:true}});
Object.assign(completionPassives,{sir_gareth:{handTransform:{type:'Mortal',threshold:{air:1,water:1}}},slimy_mutants:{handTransform:{keyword:'Submerge',mana:3}}});
Object.assign(completionPassives,{selfsame_simulacrum:{enterCopy:'nearby'},evil_twin:{enterCopy:'enemy'},vengeful_heir:{heirCopy:true},moon_clan_werewolf:{handTransform:{type:'Mortal',sacrificeSummon:true}}});
Object.assign(completionPassives,{mask_of_mayhem:{mandatoryNearbyAttack:true},the_green_knight:{mandatoryAttackMe:true},tvinnax_berserker:{mandatoryUnitAttack:true,untapAttackKill:true},sir_agravaine:{strikeAfterAllyAttack:true},wind_sylph:{spellElements:['air'],pushAfterMagic:true}});
Object.assign(completionPassives,{wills_o_the_wisp:{evadeTeleport:true},witherwing_hero:{rescueWeakerAttacked:true},bladedancer:{bladeAfterAttack:true},sturmgeist:{chaseMagicCaster:true},peace_offering:{giveOnSiteEntry:true}});
export const completionSitePassives={
 fields_of_phyxis:{completionSilenceFront:true},smokestacks_of_gnaak:{completionSilenceNearby:true},bower_of_bliss:{completionBower:true},
 __disabled_site:{noMana:true},__silenced_site:{},__fate_site:{},__sinterfee_site:{},
};
export const completionAuras={acid_rain:{completionAcid:true},atlantean_fate:{completionFate:true},the_great_drowning_of_men:{},year_of_the_blaze:{},salt_the_earth:{singleSite:true,forbidSitePlay:true},sow_the_earth:{singleSite:true,completionSow:true,castToVoid:true}};
completionAuras.a_midsummer_nights_dream={completionMidsummer:true};
Object.assign(completionAuras,{wall_of_air:{border:true},wall_of_brambles:{border:true},wall_of_fire:{border:true},wall_of_ice:{border:true},sphere_of_animosity:{}});
export const completionOperations=['completionLeadworks','completionSinterfee','completionCourts','completionFateSubmerge','completionFloodRealm','completionDrowning','completionYearBlaze','completionSalt','completionSow','completionDruidFlip','completionDruidTawny','completionCurse','completionCursePick','completionInterrogate','completionHorns'];
completionOperations.push('completionMortimer','completionMortimerReturn','completionTroll','completionSoldOut','completionVaults');
completionOperations.push('completionTowerMagic');
export function siteMultiplier(s,at){return s.board[at]?.completionProtected?1:2**(s.auras||[]).filter(a=>a.at===at&&catalogAuraActive(a)&&a.completionSow).length;}

export function refreshCompletionTerrain(s,A){
 const {card,runtimeCard,passives,sitePassives,inside,nearby,disabled,occupied}=A;
 const all=[...s.board.filter(Boolean),...s.artifacts];
 if(!all.some(o=>o.completionFlags||o.dreamAsleep||['blightstone','fields_of_phyxis','smokestacks_of_gnaak','bower_of_bliss','leadworks','overflowing_court'].includes(card(o.card).slug))&&!s.auras.some(a=>completionAuras[card(a.card).slug])&&!s.units.some(u=>['bluecap_knockers','sinterfee'].includes(card(u.card).slug)||unitPassiveLayerViews(s,u,A,'completionProtectSite').some(l=>l.value))&&!(s.ongoingEffects||[]).some(e=>e.completionTerrain))return;
 const courtEffects=(s.ongoingEffects||[]).filter(e=>e.op==='completionCourts');
 const courts=o=>courtEffects.some(e=>o.uid!==e.exclude&&/\bCourt\b/.test(card(o.baseCard||o.card).name));
 const restore=o=>{const c=card(o.card);if(c.runtimeMask)o.card=o.baseCard||c.runtimeBase;else o.baseCard=o.card;
  if(!o.completionFlags){o.completionNativeSilenced=!!o.silenced;o.completionNativeDisabled=!!o.disabled;}
  else {if(!!o.silenced!==o.completionFlags.silenced)o.completionNativeSilenced=!!o.silenced;if(!!o.disabled!==o.completionFlags.disabled)o.completionNativeDisabled=!!o.disabled;}
  o.silenced=!!o.completionNativeSilenced;o.disabled=!!o.completionNativeDisabled||!!o.dreamAsleep;o.completionNoThreshold=false;o.completionFate=false;
 };
 for(const site of s.board)if(site){if(!site.uid)site.uid='s'+s.next++;restore(site);}
 for(const o of s.artifacts){const bearer=s.units.find(u=>u.uid===o.bearer);if(bearer){o.at=bearer.at;o.layer=bearer.layer||'surface';}restore(o);if(courts(o))o.disabled=true;}
 for(const u of s.units){u.completionDisabled=courts(u);u.completionBower=false;}
 const protectedSite=at=>passives[card(s.board[at].card).slug]?.immutableSite||s.units.some(u=>!u.dying&&!disabled(u)&&unitPassiveLayerViews(s,u,A,'completionProtectSite').some(l=>l.value)&&occupied(u).includes(at));
 const silence=at=>{const site=s.board[at];if(site&&!protectedSite(at))site.silenced=true;};
 for(const [at,site] of s.board.entries())if(site&&courts(site)&&!protectedSite(at))site.disabled=true;
 const effects=[];
 for(const [at,site] of s.board.entries())if(site){const rule=sitePassives[card(site.card).slug];if(rule?.completionSilenceFront||rule?.completionSilenceNearby)effects.push({stamp:site.stamp||site.born||0,site,at,rule});}
 for(const aura of s.auras)if(catalogAuraActive(aura,A.disabled)&&completionAuras[card(aura.card).slug])effects.push({stamp:aura.stamp||0,aura});
 for(const e of s.ongoingEffects||[])if(e.completionTerrain)effects.push({stamp:e.stamp||0,e});
 effects.sort((a,b)=>a.stamp-b.stamp);
 for(const effect of effects){
  if(effect.site){if(effect.site.silenced||effect.site.disabled)continue;if(effect.rule.completionSilenceFront){const to=effect.at+(effect.site.controller===0?-5:5);if(to>=0&&to<20)silence(to);}else for(let at=0;at<20;at++)if(at!==effect.at&&nearby(at,effect.at))silence(at);}
  if(effect.aura){const a=effect.aura,rule=completionAuras[card(a.card).slug];for(let at=0;at<20;at++)if(s.board[at]&&inside(a,at)&&!protectedSite(at)){
    if(rule.completionAcid)s.board[at].silenced=true;
    if(rule.completionFate&&card(s.board[at].baseCard||s.board[at].card).rarity!=='Ordinary'){s.board[at].silenced=true;s.board[at].completionFate=true;}
   }if(rule.completionAcid)for(const o of s.artifacts)if(inside(a,o.at))o.silenced=true;
  }
  if(effect.e){const e=effect.e;if(e.op==='completionLeadworks'){const at=s.board.findIndex(site=>site?.uid===e.siteUid);if(at>=0)e.at=at;for(let i=0;i<20;i++)if(nearby(i,e.at))silence(i);}
   if(e.op==='completionSinterfee'&&s.units.some(u=>u.uid===e.source&&!u.dying)){const at=s.board.findIndex(site=>site?.uid===e.siteUid);if(at>=0&&!protectedSite(at)){silence(at);s.board[at].completionNoThreshold=true;}}
  }
 }
 for(const o of s.artifacts)if(!o.silenced&&!o.disabled&&passives[card(o.card).slug]?.completionBlight&&s.board[o.at]&&!protectedSite(o.at))s.board[o.at].disabled=true;
 const bower=s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.completionBower);
 if(bower)for(const u of s.units)if(s.board.some(site=>site&&!site.silenced&&!site.disabled&&sitePassives[card(site.card).slug]?.completionBower&&siteEffectAllowed(s,u,'modify',{card},site.card))&&!A.unmodifiable(u)&&[...((u.mods||[]).slice().reverse().find(m=>m.replaceTypes)?.replaceTypes||card(u.card).subtypes),...pallidPrintedTypes(s,u,A),...abilityMinionTypes(s,u,A)].includes('Mortal'))u.completionBower=true;
 for(const o of s.artifacts){o.completionFlags={silenced:!!o.silenced,disabled:!!o.disabled};if(o.silenced||o.disabled)o.card=runtimeCard(o.baseCard,'silenced_artifact',{runtimeMask:true,rules:''});}
 for(const [at,site] of s.board.entries())if(site){site.completionProtected=!!protectedSite(at);site.completionFlags={silenced:!!site.silenced,disabled:!!site.disabled};let kind=null,fields={};
  if(site.disabled){kind='disabled_site';fields={air:0,earth:0,fire:0,water:0};}
  else if(site.completionFate){kind='fate_site';fields={air:0,earth:0,fire:0,water:1};}
  else if(site.completionNoThreshold){kind='sinterfee_site';fields={air:0,earth:0,fire:0,water:0};}
  else if(site.silenced)kind='silenced_site';
  if(kind)site.card=runtimeCard(site.baseCard,kind,{runtimeMask:true,rules:'',...fields});
 }
}

export function resolveCompletion(s,frame,A){
 const {step,source,controller:p,selected}=frame,{unit,card,queueEffects,occupied,canEnterOnGround,keywords,fiftyForceAllowed,inside}=A;
 if(!completionOperations.includes(step.op))return false;
 if(step.op==='completionTowerMagic'){const site=s.board[source.at];if(site&&A.resources(s,p).air>=3){site.towerMagicTurn=s.turn;site.towerMagicUsed=false;}return true;}
 if(step.op==='completionMortimer'){const u=unit(s,step.uid);if(u&&!u.dying)A.kill(s,u);queueEffects(s,[{op:'completionMortimerReturn'}],source,p);return true;}
 if(step.op==='completionMortimerReturn'){const site=s.board[source.at];if(site?.uid===source.uid&&geometryPlaceSiteAllowed(s,card('rubble'),source.at,card)){sendBuiltSite(s,site,'hand',A);s.board[source.at]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null};}return true;}
 if(step.op==='completionTroll'){
  const u=unit(s,step.uid);if(!u||u.dying)return true;
  if(selected===undefined){s.choice={player:u.controller,title:'Troll Bridge',options:[{label:'Take the strike',value:null},...s.players[u.controller].hand.map(h=>({label:'Discard '+card(h.card).name,value:h.uid}))],frame};return true;}
  const h=s.players[u.controller].hand.find(h=>h.uid===selected);
  if(h){s.players[u.controller].hand=s.players[u.controller].hand.filter(v=>v.uid!==h.uid);A.sendCard(s,u.controller,h.card,'cemetery');}else A.strike(s,{...source,mods:[]},u,card(source.card).attack||0);return true;
 }
 if(step.op==='completionSoldOut'){const u=unit(s,selected?.uid);if(u)queueEffects(s,[{op:'fiftyPushChoose',target:{entity:'unit',uid:u.uid},remaining:[]}],source,p);return true;}
 if(step.op==='completionVaults'){const u=unit(s,step.uid);if(u){for(let i=0;i<3;i++)A.draw(s,u.controller,'spells');s.players[u.controller].skipTurns=(s.players[u.controller].skipTurns||0)+1;}return true;}
 if(step.op==='completionHorns'){const site=s.board[source.at];if(!site||site.completionProtected||!geometryPlaceSiteAllowed(s,card('rubble'),source.at,card))return true;const u=A.makeUnit(s,A.runtimeCard(site.baseCard||site.card,'behemoth_demon',{type:'Minion',subtypes:['Demon'],umbrellas:['Evil'],rules:''}),site.owner,source.at);u.uid=site.uid||u.uid;u.controller=site.controller;u.originalCard=site.originalCard||site.baseCard||site.card;if(site.babelParts)u.babelParts=structuredClone(site.babelParts);u.born=site.born||0;u.ward=!!site.ward;u.justEntered=false;s.board[source.at]={uid:'s'+s.next++,card:card('rubble').id,owner:null,controller:null};return true;}
 if(step.op==='completionDruidTawny'||step.op==='completionDruidFlip'){
  const u=unit(s,source.uid);if(!u||u.silenced||A.disabled(u))return true;
  const slug=step.op==='completionDruidFlip'?'bruin':'tawny';
  if(!s.units.some(v=>!v.dying&&v.controller===p&&card(v.card).slug===slug)&&A.canSummonEntry(s,p,card(slug),u.at,u.layer||'surface')&&A.paySummoningTax(s,card(slug).id,p,p)){const token=A.makeUnit(s,card(slug).id,p,u.at);token.layer=u.layer||'surface';A.summonedGenesis(s,token);}
  if(step.op==='completionDruidFlip'){u.originalCard=u.card;u.card=A.runtimeCard(u.card,'druid_back',{rules:card(u.card).rulesBack});}return true;
 }
 if(step.op==='completionInterrogate'){
  const player=step.player;
  if(selected===undefined){const options=[{label:'Allow a spell draw',value:false}];if(s.players[player].life>=3)options.push({label:'Pay 3 life',value:true});s.choice={player,title:'Interrogator',options,frame};return true;}
  if(selected&&s.players[player].life>=3)A.loseLife(s,player,3);else A.draw(s,p,'spells');return true;
 }
 if(step.op==='completionCurse'){const target=unit(s,selected?.uid);if(target)queueEffects(s,[{op:'completionCursePick',uid:target.uid}],source,p);return true;}
 if(step.op==='completionCursePick'){
  const target=unit(s,step.uid);if(!target)return true;
  if(selected===undefined){s.choice={player:p,title:'Witch',options:[{label:'Spells cost +1 next turn',value:'tax'},{label:'Lose 2 life',value:'life'},{label:'Power -3 until your next turn',value:'power'}],frame};return true;}
  if(selected==='life')A.loseLife(s,target.controller,2);
  if(selected==='power')target.mods.push({power:-3,until:p});
  if(selected==='tax')(s.ongoingEffects||(s.ongoingEffects=[])).push({op:'witchTax',player:target.controller,startAfter:s.turn});return true;
 }
 if(step.op==='completionFloodRealm'){registerPermanentRealmFlood(s,source,p);return true;}
 if(step.op==='completionSalt'){A.destroySite(s,source.at);return true;}
 if(step.op==='completionSow'){const aura=s.auras.find(a=>a.uid===source.uid);if(aura)aura.completionSow=true;if(!s.board[source.at]&&s.players[p].atlas.length&&geometryPlaceSiteAllowed(s,card(s.players[p].atlas[0]),source.at,card))A.enterSite(s,p,s.players[p].atlas.shift(),source.at);return true;}
 if(step.op==='completionDrowning'||step.op==='completionYearBlaze'){
  const aura=s.auras.find(a=>a.uid===source.uid);if(!aura||aura.disabled||aura.silenced)return true;
  for(let at=0;at<20;at++)if(inside(aura,at)){A.destroySite(s,at);if(step.op==='completionDrowning'&&s.board[at]&&card(s.board[at].card).slug==='rubble'&&!s.board[at].completionProtected)(s.board[at].effects||(s.board[at].effects=[])).push({flood:true,stamp:s.next++});}
  if(step.op==='completionDrowning'){queueEffects(s,[{op:'completionFateSubmerge',includeAuras:true}],aura,p);A.removeObject(s,aura,'cemetery');}
  else {for(const u of [...s.units])if(catalogAuraHere(aura,u,inside))A.kill(s,u);for(const o of [...s.artifacts])if(catalogAuraHere(aura,o,inside))A.removeObject(s,o,'cemetery');for(const o of [...s.auras])if(o.uid===aura.uid||catalogAuraHere(aura,catalogAuraPhysicalShape(o,inside),inside))A.removeObject(s,o,'cemetery');}
  return true;
 }
 if(step.op==='completionLeadworks'){const site=s.board[source.at];(s.ongoingEffects||(s.ongoingEffects=[])).push({op:step.op,completionTerrain:true,at:source.at,siteUid:site?.uid,until:p,stamp:s.next++});return true;}
 if(step.op==='completionCourts'){(s.ongoingEffects||(s.ongoingEffects=[])).push({op:step.op,completionTerrain:true,exclude:s.board[source.at]?.uid,until:p,stamp:s.next++});return true;}
 if(step.op==='completionSinterfee'){const site=s.board[selected.at];if(site)(s.ongoingEffects||(s.ongoingEffects=[])).push({op:step.op,completionTerrain:true,siteUid:site.uid,source:source.uid,stamp:s.next++});return true;}
 if(step.op==='completionFateSubmerge')return resolveCatalogAuraSubmerge(s,frame,A);
 return false;
}

for(const [slug,target,element,amount] of [['forlorn_keep','penitent_knight','earth',2],['forsaken_crypt','ghoul','air',2],['molten_maar','hellhounds','fire',2],['peculiar_port','horrible_hybrids','water',2],['troubled_town',null,null,0]])completionDefinitions[slug]={genesis:[{op:'collectionCast',filter:target?{slug:target}:{name:'Townsfolk'},...(element?{threshold:{element,amount}}:{})}]};
