// Physical decision makers are distinct from logical players/card ownership.
export const finalControlDefinitions={courtesan_thais:{genesis:[{op:'finalThaisControl'}]}};
export const finalControlOperations=['finalThaisControl'];
export function finalDecisionController(s,player){
 if(player!==s.active)return player;
 const turn=s.players[player].turnsTaken||0;
 const effects=(s.finalPlayerControls||[]).filter(e=>e.player===player&&e.nextTurn===turn);
 return effects.length?effects[effects.length-1].controller:player;
}
export function finalLogicalActor(s){return s.choice?.player??(s.phase==='mulligan'?s.mulligan:s.pending?.player??s.active);}
export function finalControlledPlayer(s,observer){return [0,1].find(p=>p!==observer&&finalDecisionController(s,p)===observer)??null;}
export function finalControlActionAllowed(s,a,actor=a.actor??finalDecisionController(s,a.player)){
 // Conceding belongs to the player personally, never their temporary controller.
 return a.type==='concede'?actor===a.player:actor===finalDecisionController(s,a.player);
}
export function finalControlActions(s,actor,legalActions){
 const logical=finalLogicalActor(s);
 return finalDecisionController(s,logical)===actor?legalActions(s,logical).filter(a=>a.type!=='concede').map(a=>({...a,actor})):[];
}
export function observeFinalControl(s,v,observer){
 const player=finalControlledPlayer(s,observer);if(player===null)return v;
 // Official FAQ grants all controlled player's cards. Do not expose any other
 // player's hidden zones or retain permission after the affected actual turn.
 for(const zone of ['hand','atlas','spells','collection'])v.players[player][zone]=structuredClone(s.players[player][zone]||[]);
 v.players[player].handRevealed=true;
 v.boundSpells=(s.boundSpells||[]).map((h,i)=>s.units.find(u=>u.uid===h.unit)?.controller===player?structuredClone(h):v.boundSpells?.[i]||{hidden:true});
 if(s.choice?.player===player)v.choice=structuredClone(s.choice);
 return v;
}
export function resolveFinalControl(s,frame,A){
 if(frame.step.op!=='finalThaisControl')return false;
 const effects=s.finalPlayerControls||(s.finalPlayerControls=[]);
 for(let player=0;player<s.players.length;player++)effects.push({uid:'ctrl'+s.next++,source:frame.source.uid,player,controller:(player+s.players.length-1)%s.players.length,nextTurn:(s.players[player].turnsTaken||0)+1});
 A.log(s,'Courtesan Thaïs · 每位玩家的下一個實際回合由前一位玩家操控（不得代為認輸）');
 return true;
}
// An AI controlling an adversary pursues its own position, while every command
// remains a legal command of the controlled player. Preview only its permitted
// observation, never an omniscient root. Manual physical reports stay human.
export function chooseFinalControlAction(view,actions,actor,{dispatch,evaluate}){
 if(view.choice?.manual)return null;
 let best=null,score=-Infinity;
 for(const action of actions){
  if(action.type==='concede'||finalDecisionController(view,action.player)!==actor)continue;
  let value=-Infinity;
  try{value=evaluate(dispatch(view,{...action,actor}),actor);}catch{value=-1e9;}
  if(best===null||value>score){best={...action,actor};score=value;}
 }
 return best;
}
export function dispatchFinalControlledEntry(s,entry,dispatch){
 if(!entry||(entry.seat!==0&&entry.seat!==1)||!entry.action||!finalControlActionAllowed(s,entry.action,entry.seat))throw Error('此席不是命令玩家的合法操控者');
 // The replay envelope seat prevails over a self-reported action.actor.
 return dispatch(s,{...entry.action,actor:entry.seat});
}
