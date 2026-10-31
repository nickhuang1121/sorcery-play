import {unitPassiveLayerViews} from './final-ability-layers.js';
export const dreamOperations=['dreamSleep','dreamWake','dreamSearch'];
export function dreamTarget(s,d){return s.units.find(o=>o.uid===d.target)||(s.artifacts||[]).find(o=>o.uid===d.target)||s.board.find(o=>o?.uid===d.target);}
export function dreamCasterChoices(s,p,A,source){
 const entries=[],inRegion=o=>!source||A.regionsOverlap(s,o,source);
 for(const u of s.units)if(u.controller===p&&!u.dying&&!A.disabled(u)&&inRegion(u)&&(A.card(u.card).type==='Avatar'||A.keywords(u).includes('Spellcaster')))entries.push({label:A.card(u.card).name,value:{entity:'unit',uid:u.uid}});
 for(const o of s.artifacts||[])if(A.artifactController(s,o)===p&&!o.disabled&&inRegion(o)&&A.casterPermissionAllows(s,o,null))entries.push({label:A.card(o.card).name,value:{entity:'artifact',uid:o.uid}});
 for(const [at,o] of s.board.entries())if(o?.controller===p&&!o.silenced&&!o.disabled&&(inRegion({at,layer:'surface'})||inRegion({at,layer:'below'}))&&(A.sitePassives[A.card(o.card).slug]?.siteSpellElements||o.towerMagicTurn===s.turn))entries.push({label:A.card(o.card).name,value:{entity:'site',at,uid:o.uid||null,card:o.baseCard||o.card}});
 return entries;
}
export function resolveDream(s,frame,A){
 const {step,selected,source,controller:p}=frame;if(!dreamOperations.includes(step.op))return false;
 const queue=steps=>A.queueEffects(s,steps,source,p,frame.effectCard);
 if(step.op==='dreamSleep'){
  const target=selected?.entity==='site'?s.board[selected.at]:[...s.units,...s.artifacts].find(o=>o.uid===selected?.uid);
  if(selected?.entity==='site'&&(!target||(selected.uid?target.uid!==selected.uid:(target.baseCard||target.card)!==selected.card)))return true;
  if(!target||A.card(target.card).type==='Avatar'||target.completionProtected||A.passives[A.card(target.card).slug]?.immutableSite||(s.units.some(u=>u.uid===target.uid)?unitPassiveLayerViews(s,target,A,'cannotDisable').some(l=>l.value):A.passives[A.card(target.card).slug]?.cannotDisable))return true;
  if(!target.uid)target.uid='s'+s.next++;
  const dream={uid:'dream'+s.next++,target:target.uid,player:p,after:s.turn};(s.dreams||(s.dreams=[])).push(dream);
  if(s.units.some(u=>u.uid===target.uid))target.mods.push({asleep:true,dream:dream.uid});else target.dreamAsleep=dream.uid;
  return true;
 }
 if(step.op==='dreamWake'){
  const dream=(s.dreams||[]).find(d=>d.uid===step.dream),target=dream&&dreamTarget(s,dream),asleep=target&&(target.dreamAsleep===dream.uid||(target.mods||[]).some(m=>m.asleep&&m.dream===dream.uid));
  if(!asleep){s.dreams=(s.dreams||[]).filter(d=>d.uid!==step.dream);return true;}
  if(selected===undefined){s.choice={player:p,title:'Dream-Quest · 喚醒並搜尋 Spellbook？',options:[{label:'喚醒並搜尋',value:true},{label:'繼續睡眠',value:false}],frame};return true;}
  s.dreams=s.dreams.filter(d=>d.uid!==step.dream);if(!selected)return true;
  delete target.dreamAsleep;if(target.mods)target.mods=target.mods.filter(m=>m.dream!==dream.uid);
  queue([{op:'dreamSearch'}]);return true;
 }
 if(step.op==='dreamSearch'){
  const deck=s.players[p].spells;if(!deck.length)return true;
  if(selected===undefined){s.choice={player:p,title:'Dream-Quest · 選擇放入手牌的卡牌',options:[...deck.slice(0,A.searchLimit(s,p,A)).map((id,index)=>({label:A.card(id).name,value:{index,card:id}})),{label:'Fail to find (shuffle)',value:null}],frame};return true;}
  if(selected===null){A.shuffle(s,deck);return true;}
  if(selected.index>=A.searchLimit(s,p,A)||deck[selected.index]!==selected.card)return true;
  const id=deck.splice(selected.index,1)[0];s.players[p].hand.push({uid:'h'+s.next++,card:id});A.shuffle(s,deck);return true;
 }
 return true;
}
