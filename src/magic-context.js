// Saved Magic-wide choices are separate from individual Storyline frames.
// A copied spell has no cast context and therefore cannot retrigger Book.
import {magicDeclarationTargets} from './magic-declarations.js';
import {magicSelectorProfiles,choiceSelectorMetadata} from './selector-semantics.js';
import {finalPrintedSources} from './final-passives.js';
const clone=x=>structuredClone(x);
const singleChoice=new Set(('blaze blaze_of_glory bless blink bone_spear consecrate critical_strike degradation desecrate detonate dream_quest enduring_faith fade feign_death gift_of_the_frog gift_of_the_raven gift_of_the_serpent gift_of_the_wolf gigantism invigorate knighthood leap_attack mad_dash necropotence overpower power_of_flight raze second_wind shapeshift spin_attack warp_spasm whirling_blades charge valor dodge_roll joust shatter_strike abyssal_assault lure grapple_shot').split(' '));
const knownMany=new Set(('abyssal_assault grapple_shot dhol_chants flanking_maneuver recall symmetric_suffering tactical_move lure joust shatter_strike led_astray arcane_barrage ball_lightning firebolts ice_lance ice_shards magic_missiles heat_ray').split(' '));
const completeAfter={finalJoustEnemy:'joust',shatterEnemy:'shatter_strike'};
function lookup(s,id){return (s.magicChoiceContexts||[]).find(c=>c.id===id);}
function selectedUnit(s,value,A){
 const id=typeof value==='string'?value:value?.entity==='unit'||value?.uid?value.uid:null;
 const u=id&&A.unit(s,id);return u&&A.card(u.card).type==='Minion'?u:null;
}
function record(s,context,values,A){
 for(const value of Array.isArray(values)?values:[values]){
  const u=selectedUnit(s,value,A);if(!u||context.minions.some(v=>v.uid===u.uid))continue;
  context.minions.push({uid:u.uid,card:u.card,controller:u.controller});
 }
}
export function bookBlessingCandidate(s,context,A,policy='allied-minions'){
 const minions=policy==='allied-minions'?context.minions.filter(v=>v.controller===context.player):context.minions;
 if(minions.length!==1||minions[0].controller!==context.player)return null;
 const u=A.unit(s,minions[0].uid);return u&&!u.dying&&!A.unitUmbrellas(u,context.player).includes('Evil')?u:null;
}
function ward(s,context,A){
 if(!context.actualCast||!context.books.length||context.warded||!context.selectionComplete)return false;
 const u=bookBlessingCandidate(s,context,A);if(!u)return false;
 u.ward=true;context.warded=u.uid;return true;
}
export function createMagicChoiceContext(s,p,c,caster,a,declared,A){
 const id='magic'+(s.nextMagicChoiceContext=(s.nextMagicChoiceContext||0)+1);
 const books=finalPrintedSources(s,'book_of_blessings',A).filter(o=>o.bearer===caster.uid).map(o=>({uid:o.uid,card:o.card}));
 const context={id,card:c.id,slug:c.slug,player:p,caster:clone(caster),actualCast:true,books,countingPolicy:'allied-minions',minions:[],selectionComplete:!!a.magicDeclaration||!!a.chainTargets||!!a.remainingSecond||magicSelectorProfiles[c.slug]?.primary?.role==='target'&&!knownMany.has(c.slug),warded:null,closed:false};
 (s.magicChoiceContexts||(s.magicChoiceContexts=[])).push(context);
 record(s,context,declared,A);
 if(a.target?.unit)record(s,context,a.target.unit,A);else record(s,context,a.target,A);
 record(s,context,a.remainingSecond,A);record(s,context,a.chainTargets,A);
 record(s,context,magicDeclarationTargets(a.magicDeclaration),A);
 // Planned ally is an actual singular Magic choice. Grasp's actors, by contrast,
 // are the rule-defined set of all burrowed allies, not chosen minion targets.
 if(a.magicDeclaration?.ally)record(s,context,a.magicDeclaration.ally,A);
 if(['valor','dodge_roll'].includes(c.slug)&&s.finalReactionContext?.subject)record(s,context,s.finalReactionContext.subject,A);
 if(singleChoice.has(c.slug)&&context.minions.length)context.selectionComplete=true;
 ward(s,context,A);return context;
}
export function recordMagicChoiceFrame(s,frame,A){
 const context=lookup(s,frame.magicChoiceContextId||s.magicChoiceContext);
 if(!context||context.closed||context.card!==frame.effectCard||frame.step.op==='finishMagic')return false;
 // Flood's editable exception picks are provisional. Only the confirmed
 // complete set belongs to this cast; discarded/reset picks never count.
 if(frame.step.op==='finalFloodConfirm'&&frame.selected===true){
  record(s,context,frame.step.picks||[],A);context.selectionComplete=true;
  return ward(s,context,A);
 }
 const provenance=choiceSelectorMetadata(frame,A);
 if(provenance?.source==='magic'&&!provenance.provisional)record(s,context,frame.selected,A);
 if((frame.step.op==='finalDholTap'||frame.step.op==='flankAllies')&&frame.selected===null)context.selectionComplete=true;
 if(frame.step.op==='recallOne'&&(frame.selected==='stop'||frame.selected===undefined&&!(frame.step.remaining||[]).some(uid=>{const u=A.unit(s,uid);return u&&!u.dying&&u.controller===context.player&&A.card(u.card).type==='Minion';})))context.selectionComplete=true;
 if(singleChoice.has(context.slug)&&context.minions.length||completeAfter[frame.step.op]===context.slug)context.selectionComplete=true;
 return ward(s,context,A);
}
export function finishMagicChoiceContext(s,frame,A){
 const context=lookup(s,frame.magicChoiceContextId||s.magicChoiceContext);
 if(!context||context.card!==frame.effectCard||context.closed)return false;
 context.selectionComplete=true;ward(s,context,A);context.closed=true;return true;
}
// A simultaneous choice group is complete before any of its selected objects
// leaves the realm. Later opponent choices cannot add another allied minion.
export function completeMagicAlliedChoiceSet(s,frame,chosen,A){
 const context=lookup(s,frame.magicChoiceContextId||s.magicChoiceContext);if(!context||context.closed)return false;
 record(s,context,chosen,A);context.selectionComplete=true;return ward(s,context,A);
}

// Compatibility API: grouped simultaneous sacrifices now cover this combination.
export function unsupportedBookCast(s,a,A){
 return null; // Suffering now plans each simultaneous group before sacrificing.
}
export function assertBookCastSupported(s,a,A){
 const unsupported=unsupportedBookCast(s,a,A);if(!unsupported)return;
 const error=new Error(unsupported.reason);error.code=unsupported.code;error.details=unsupported;throw error;
}
