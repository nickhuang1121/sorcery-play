import {sendBuiltSite} from './final-built-sites.js';
import {zoneAccessAllowed,canAffectCemetery,viewCemeteryEntries,physicalCemeteryEntries} from './cemetery-access.js';
import {card as lookupCard} from './cards.js';
// A collection is a private zone, distinct from the hand and the spellbook.
// Constructed games use the registered list; limited games additionally allow
// specifically named cards, as specified by the official Collection entry.
export function collectionEntries(s,p,filter,A){
 const {card,cardCatalog}=A,pl=s.players[p],ids=[...(pl.collection||[])];
 if(pl.collectionMode==='limited'&&(filter.slug||filter.name))for(const c of cardCatalog)if((filter.slug?c.slug===filter.slug:c.name.includes(filter.name))&&!ids.includes(c.id))ids.push(c.id);
 return ids.map((id,index)=>({card:id,index,external:index>=(pl.collection||[]).length})).filter(e=>{const c=card(e.card);return !c.runtimeMask&&c.category!=='Token'&&(!filter.slug||c.slug===filter.slug)&&(!filter.name||c.name.includes(filter.name))&&(!filter.type||c.type===filter.type)&&(!filter.rarity||c.rarity===filter.rarity);});
}
export function takeCollection(s,p,entry,A={card:lookupCard}){if(!zoneAccessAllowed(s,p,A))return false;if(!entry.external){const list=s.players[p].collection||[],index=entry.index;if(list[index]!==entry.card)return false;list.splice(index,1);}return true;}
export function collectionAbilityAvailable(s,p,source,step,A){
 if(step.op==='collectionPermit')return !!source&&!source.silenced&&!A.disabled(source)&&permissionEntries(s,p,step,A).some(e=>A.card(e.card).category==='Spell'&&A.card(e.card).playable);
 if(step.op==='collectionSite'){const av=A.avatar(s,p);return av&&!av.tapped&&!A.disabled(av)&&collectionEntries(s,p,{type:'Site',rarity:'Exceptional'},A).length>0;}
 if(step.op==='collectionDraw')return (s.players[p].collection||[]).length>0;
 if(step.op==='collectionHybrid')return collectionEntries(s,p,{slug:'horrible_hybrids'},A).length>0;
 return true;
}
function permissionEntries(s,p,e,A){return e.zone==='cemetery'?(e.anyGrave?[0,1].flatMap(q=>physicalCemeteryEntries(s,q,A,{actor:p,affect:false})):viewCemeteryEntries(s,p,A)).filter(g=>canAffectCemetery(s,p,g.player,A)).filter(g=>{const c=A.card(g.card);return c.playable&&(!e.filter.type||e.filter.type===c.type)&&(!e.filter.rarity||e.filter.rarity===c.rarity);}):collectionEntries(s,p,e.filter||{},A);}
export function collectionCastEntries(s,p,A){return (s.collectionPermissions||[]).filter(e=>e.player===p).flatMap(e=>permissionEntries(s,p,e,A).filter(v=>!v.external).map(v=>({card:v.card,onlyCaster:e.caster,allowSilencedCaster:!!(e.malleus||e.allowSilencedCaster),from:{...(e.zone==='cemetery'?{grave:v.index,graveOwner:v.player,graveUid:v.uid,graveBanish:!!e.graveBanish,bookDead:!!e.bookDead}:{collection:v.index}),card:v.card,permit:e.uid,...(e.zoneAccessScope?{zoneAccessScope:e.zoneAccessScope}:{})}})));}
export const collectionOperations=['collectionSummon','collectionCast','collectionTrade','collectionDraw','collectionLegion','collectionDamion','collectionSite','collectionBless','collectionDesecrate','collectionTransformSite','collectionElder','collectionHybrid','collectionTransformUnit','collectionPermit','collectionPermitEnd'];
export function resolveCollection(s,frame,A){
 const {step,source,controller:p,selected}=frame,{card,queueEffects,legalActions,commitSpell,resources,removeObject,unit,makeUnit,summonedGenesis,canSummonEntry,paySummoningTax,kill}=A;
 if(!collectionOperations.includes(step.op))return false;
 const queue=steps=>queueEffects(s,steps,source,p,frame.effectCard),choice=(options,extra={},player=p)=>{if(options.length)s.choice={player,title:card(frame.effectCard).name,options:[...options,{label:'Skip',value:null}],frame:{...frame,step:{...step,...extra}}};};
 const entries=()=>zoneAccessAllowed(s,p,A)?collectionEntries(s,p,step.filter||{},A):[];
 if(step.op==='collectionPermitEnd'){s.collectionPermissions=(s.collectionPermissions||[]).filter(e=>e.uid!==step.permit);return true;}
 if(step.op==='collectionPermit'){
  let permission=(s.collectionPermissions||[]).find(e=>e.uid===step.permit);
  if(!permission){permission={uid:'permit'+s.next++,zoneAccessScope:s.zoneAccessScope,player:p,caster:source.uid,filter:step.filter||{},zone:step.zone||'collection',anyGrave:step.anyGrave,graveBanish:step.graveBanish,bookDead:step.bookDead,independentCasterPermission:!!step.independentCasterPermission,malleus:!!step.malleus,malleusObject:step.malleusObject};(s.collectionPermissions||(s.collectionPermissions=[])).push(permission);}
  const preview=structuredClone(s);preview.choice=null;preview.pending=null;preview.active=p;preview.phase='main';
  const actions=A.legalActions(preview,p).filter(a=>a.type==='cast'&&a.permit===permission.uid);
  if(selected===undefined){
   if(!actions.length){s.collectionPermissions=s.collectionPermissions.filter(e=>e.uid!==permission.uid);return true;}
   const label=a=>{const c=card(a.card),target=typeof a.target==='string'?unit(s,a.target):null;return c.name+' · '+(a.at===undefined?target?card(target.card).name:'Choose targets':String.fromCharCode(65+a.at%5)+(4-Math.floor(a.at/5))+(a.layer==='below'?' Below':''));};
   s.choice={player:p,title:(step.title||'Collection')+' · 選擇施放（另付法術費用）',options:[...actions.map(a=>({label:label(a),value:a})),{label:'不施放',value:null}],frame:{...frame,step:{...step,permit:permission.uid}}};return true;
  }
  const action=actions.find(a=>JSON.stringify(a)===JSON.stringify(selected));
  if(!action){s.collectionPermissions=s.collectionPermissions.filter(e=>e.uid!==permission.uid);return true;}
  queue([{op:'collectionPermitEnd',permit:permission.uid}]);A.beginCast(s,action);return true;
 }
 const replace=(target,id)=>{if(target.owner===0||target.owner===1)s.players[target.owner].banished.push(target.originalCard||target.baseCard||target.card);target.card=id;target.owner=p;delete target.originalCard;delete target.baseCard;delete target.tokenCopy;};
 if(step.op==='collectionBless'||step.op==='collectionDesecrate'){
  const u=unit(s,selected?.uid),site=u&&s.board[u.at];if(!u||!site)return true;
  if(step.op==='collectionBless'){if(!site.completionProtected&&!A.passives[card(site.card).slug]?.immutableSite)site.ward=true;}else if(!A.disabled(u)){u.stealth=false;A.damageSite(s,u.at,A.power(u),u);}
  queue([{op:'collectionTransformSite',at:u.at,siteUid:site.uid,slug:step.op==='collectionBless'?'consecrated_ground':'desecrated_ground'}]);return true;
 }
 if(step.op==='collectionTransformSite'){
  const site=s.board[step.at];if(!site||site.uid!==step.siteUid||site.completionProtected||A.passives[card(site.card).slug]?.immutableSite)return true;
  const options=collectionEntries(s,p,{slug:step.slug},A);
  if(selected===undefined){choice(options.map(e=>({label:card(e.card).name,value:e})));return true;}
  const entry=options.find(e=>e.card===selected?.card&&e.index===selected.index);if(entry&&takeCollection(s,p,entry,A))replace(site,entry.card);return true;
 }
 if(step.op==='collectionElder'){
  // The activated ability commits its selected-unit sacrifice through the
  // common paid-ability boundary before releasing this casting continuation.
  queue([{op:'collectionCast',filter:{slug:'shoggoth'},layer:'below',mandatory:true}]);return true;
 }
 if(step.op==='collectionHybrid'){const u=unit(s,selected?.uid);if(u)queue([{op:'collectionTransformUnit',uid:u.uid,filter:{slug:'horrible_hybrids'}}]);return true;}
 if(step.op==='collectionTransformUnit'){
  const u=unit(s,step.uid);if(!u||u.dying)return true;const options=entries();
  if(selected===undefined){choice(options.map(e=>({label:card(e.card).name,value:e})));return true;}
  const entry=options.find(e=>e.card===selected?.card&&e.index===selected.index);if(entry&&takeCollection(s,p,entry,A))replace(u,entry.card);return true;
 }
 if(step.op==='collectionSite'){
  const avatar=A.avatar(s,p),site=s.board[source.at];if(!avatar||avatar.tapped||!site||site.completionProtected||card(site.card).slug!=='ersatz_platz')return true;
  const options=collectionEntries(s,p,{type:'Site',rarity:'Exceptional'},A);
  if(selected===undefined){choice(options.map(e=>({label:card(e.card).name,value:e})));return true;}
  const entry=options.find(e=>e.card===selected?.card&&e.index===selected.index);if(entry&&takeCollection(s,p,entry,A)){sendBuiltSite(s,site,'banished',A);avatar.tapped=true;A.enterSite(s,p,entry.card,source.at);}return true;
 }
 if(step.op==='collectionCast'){
  if(step.threshold&&resources(s,p)[step.threshold.element]<step.threshold.amount)return true;
  const options=[];
  for(const entry of entries()){
   if(!card(entry.card).playable)continue;
   const preview=structuredClone(s),h={uid:'collection-preview',card:entry.card};preview.players[p].hand.push(h);preview.choice=null;preview.pending=null;preview.active=p;preview.phase='main';
   for(const action of legalActions(preview,p).filter(a=>a.type==='cast'&&a.hand===h.uid&&a.at===source.at&&(!step.layer||a.layer===step.layer)))options.push({label:card(entry.card).name+' · '+(action.layer==='below'?'Below':'Surface')+' · '+card((preview.units.find(u=>u.uid===action.caster)||preview.artifacts.find(u=>u.uid===action.caster)||source).card).name,value:{entry,action}});
  }
  if(selected===undefined){if(step.mandatory){if(options.length)s.choice={player:p,title:card(frame.effectCard).name,options,frame};}else choice(options);return true;}
  const pick=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected))?.value;if(!pick||!takeCollection(s,p,pick.entry,A))return true;
  const h={uid:'h'+s.next++,card:pick.entry.card};s.players[p].hand.push(h);const action={...pick.action,hand:h.uid,fromCollection:true,zoneAccessScope:s.zoneAccessScope};commitSpell(s,action);return true;
 }
 if(step.op==='collectionTrade'){
  const options=s.players[p].hand.filter(h=>card(h.card).type==='Artifact').flatMap(h=>collectionEntries(s,p,{type:'Artifact',rarity:card(h.card).rarity},A).map(entry=>({label:card(h.card).name+' → '+card(entry.card).name,value:{hand:h.uid,entry}})));
  if(selected===undefined){choice(options);return true;}const pick=options.find(o=>JSON.stringify(o.value)===JSON.stringify(selected))?.value;if(!pick)return true;const h=s.players[p].hand.find(h=>h.uid===pick.hand);if(takeCollection(s,p,pick.entry,A)){s.players[p].collection.push(h.card);h.card=pick.entry.card;}return true;
 }
 if(step.op==='collectionDraw'){
  const live=s.artifacts.find(o=>o.uid===source.uid);if(!live)return true;
  if(selected===undefined){choice(entries().map(e=>({label:card(e.card).name,value:e})));return true;}
  const entry=entries().find(e=>e.card===selected?.card&&e.index===selected.index);if(entry&&takeCollection(s,p,entry,A)){removeObject(s,live,'banished');s.players[p].hand.push({uid:'h'+s.next++,card:entry.card});}return true;
 }
 if(step.op==='collectionLegion'){
  if(selected===undefined&&step.owner===undefined){choice([0,1].map(player=>({label:'Collection '+player,value:player})));return true;}
  const owner=step.owner===undefined?selected:step.owner;
  if(step.owner===undefined){queue([{op:step.op,owner,remaining:3}]);return true;}
  const list=zoneAccessAllowed(s,p,A)?s.players[owner].collection||[]:[];if(selected===undefined){choice(list.map((id,index)=>({label:card(id).name,value:index})),{},p);return true;}
  if(Number.isInteger(selected)&&list[selected]){s.players[owner].banished.push(list.splice(selected,1)[0]);if(step.remaining>1)queue([{...step,remaining:step.remaining-1}]);}return true;
 }
 if(step.op==='collectionSummon'){
  const layer=step.layer||source.layer||'surface',options=entries().filter(e=>card(e.card).type==='Minion'&&card(e.card).playable&&canSummonEntry(s,p,card(e.card),source.at,layer));
  if(selected===undefined){if(step.mandatory){if(options.length)s.choice={player:p,title:card(frame.effectCard).name,options:options.map(e=>({label:card(e.card).name,value:e})),frame};}else choice(options.map(e=>({label:card(e.card).name,value:e})));return true;}
  const entry=options.find(e=>e.card===selected?.card&&e.index===selected.index&&e.external===selected.external);
  if(entry&&takeCollection(s,p,entry,A)&&paySummoningTax(s,entry.card,p,p)){const u=makeUnit(s,entry.card,p,source.at);u.layer=layer;if(step.addedDeath)u.addedDeath=structuredClone(step.addedDeath);summonedGenesis(s,u);}return true;
 }
 if(step.op==='collectionDamion'){
  for(let i=0;i<2;i++){const entry=collectionEntries(s,p,{slug:'ghoul'},A)[0];if(!entry||!canSummonEntry(s,p,card(entry.card),source.at,source.layer||'surface')||!paySummoningTax(s,entry.card,p,p))break;if(!takeCollection(s,p,entry,A))break;const u=makeUnit(s,entry.card,p,source.at);u.layer=source.layer||'surface';u.damionSource=source.uid;summonedGenesis(s,u);}return true;
 }
 return true;
}
