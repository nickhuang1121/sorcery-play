import {newGame,restoreGame,dispatch} from './engine.js';
// Fresh games need the same runtime collections and passive hydration as saves.
export function createPlayableMatch(decks,seed,mode){return restoreGame(newGame(decks,seed,mode));}

// Replay prefix length. AI replies after your action are part of the same step.
export function practiceCut(history,mode){
  const list=history||[];
  if(!list.length)return -1;
  if(mode!=='ai')return list.length-1;
  let i=list.length-1;
  while(i>=0&&list[i].player===1)i--;
  return i<0?-1:i;
}

export function rewindPracticeMatch(state){
  if(!state?.practice||!Array.isArray(state.openingDecks)||state.openingDecks.length!==2)throw Error('這局沒有開啟練習模式');
  const cut=practiceCut(state.history,state.mode);
  if(cut<0)throw Error('沒有上一步');
  let next=createPlayableMatch(state.openingDecks,state.seed,state.mode);
  for(const action of state.history.slice(0,cut))next=dispatch(next,action);
  next.practice=true;
  next.openingDecks=state.openingDecks;
  if(state.aiDifficulty)next.aiDifficulty=state.aiDifficulty;
  next.aiOmniscient=!!state.aiOmniscient;
  return next;
}
