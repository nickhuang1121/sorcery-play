// Refresh engine-derived fixture fields; never change a recorded gameplay choice.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {install,officialBetaDecks} from '../src/cards.js';
import {dispatch,restoreGame} from '../src/engine.js';
import {createPlayableMatch} from '../src/match-setup.js';
import {choiceToken} from '../src/choice-context.js';

const root=new URL('../',import.meta.url);
const read=path=>JSON.parse(fs.readFileSync(new URL(path,root)));
const write=(path,value)=>fs.writeFileSync(new URL(path,root),JSON.stringify(value,null,2)+'\n');
install(read('data/official-cards.json'));
const decks=officialBetaDecks();
const gameplay=history=>history.map(({choiceToken,...action})=>action);
function replay(record,state,{restoreEach=false,limit=record.history.length}={}){
 const original=gameplay(record.history);
 for(const action of record.history.slice(0,limit)){
  if(restoreEach)state=restoreGame(state);
  if(action.type==='choose'&&action.choiceToken!==undefined)action.choiceToken=choiceToken(state);
  state=dispatch(state,action);
 }
 assert.deepEqual(gameplay(record.history),original,'Recorded gameplay must remain unchanged');
 return state;
}
for(const path of ['data/english-mobile-played-match.json','data/mobile-played-match.json','data/online-dual-browser-played-match.json','data/online-google-mobile-natural-match.json']){
 const record=read(path),expected=record.state;
 let state=record.initialState?restoreGame(record.initialState):createPlayableMatch(path==='data/mobile-played-match.json'?read('tests/fixtures/played-mobile-decks.json'):[decks[1],decks[2]],record.seed,'ai');
 state.aiDifficulty=expected.aiDifficulty;state.aiOmniscient=expected.aiOmniscient;
 state=replay(record,state,{restoreEach:path==='data/online-google-mobile-natural-match.json'});
 assert.equal(state.turn,expected.turn);assert.equal(state.winner,expected.winner);
 assert.deepEqual(state.players.map(p=>p.life),expected.players.map(p=>p.life));
 record.state=state;write(path,record);
 console.log('Refreshed',fileURLToPath(new URL(path,root)));
}
{
 const path='tests/fixtures/realm-mobile-replay.json',record=read(path);
 const state=replay(record,createPlayableMatch(record.decks.map(i=>decks[i]),record.seed,record.mode));
 assert.equal(state.turn,record.turn);assert.equal(state.winner,record.winner);
 assert.deepEqual(state.players.map(p=>p.life),[14,0]);write(path,record);
}
{
 // The original illegal action and all later historical evidence stay intact.
 const path='data/mobile-popup-played-match.json',record=read(path);
 const state=createPlayableMatch([decks[1],decks[2]],record.seed,'ai');
 state.aiDifficulty=record.state.aiDifficulty;state.aiOmniscient=record.state.aiOmniscient;
 replay(record,state,{limit:7});write(path,record);
}
{
 const path='data/mobile-popup-response-fixtures.json',record=read(path);
 for(const key of ['defense','intercept']){
  const state=restoreGame(record[key]);
  assert.deepEqual(state.pending,record[key].pending,'Preserve the recorded combat');
  assert.deepEqual(JSON.parse(JSON.stringify(restoreGame(state))),JSON.parse(JSON.stringify(state)),'Restoration must be stable');
  record[key]=state;
 }
 write(path,record);
}
