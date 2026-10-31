// A deterministic precondition for UI submissions and replayed choice actions.
// This is an accidental stale-click guard, not authentication or a secret.
export function choiceToken(s){
 if(!s?.choice)return null;
 const raw=JSON.stringify([s.turn,s.rng,s.next,s.choice]);let hash=2166136261;
 for(let i=0;i<raw.length;i++){hash^=raw.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return 'choice-v1:'+(hash>>>0).toString(16)+':'+raw.length;
}
export function choiceAction(s,option){
 if(!s?.choice)throw Error('目前沒有待回報的選擇');
 return {type:'choose',player:s.choice.player,option,choiceToken:choiceToken(s)};
}
export function assertChoiceContext(s,a){
 // Old saved action logs remain replayable. Current UI always supplies a token.
 if(a.type==='choose'&&a.choiceToken!==undefined&&a.choiceToken!==choiceToken(s))throw Error('選擇已更新，請使用目前的選項');
}
