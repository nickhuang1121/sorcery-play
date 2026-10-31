// Captured from a full 390x844 production-UI match, not an authored late-game state.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {install} from '../src/cards.js';import {dispatch} from '../src/engine.js';import {createPlayableMatch} from '../src/match-setup.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const recorded=JSON.parse(fs.readFileSync(new URL('../data/mobile-played-match.json',import.meta.url)));
test('All 70 real mobile-UI actions replay from a fresh match to the identical victory state',()=>{
 let s=createPlayableMatch(JSON.parse(fs.readFileSync(new URL('./fixtures/played-mobile-decks.json',import.meta.url))),recorded.seed,'ai');s.aiDifficulty=recorded.state.aiDifficulty;s.aiOmniscient=recorded.state.aiOmniscient;
 assert.equal(s.phase,'mulligan');assert.equal(s.turn,1);assert.equal(s.winner,null);assert.deepEqual(s.players.map(p=>p.life),[20,20]);assert.equal(recorded.history.length,70);
 for(const [index,a] of recorded.history.entries()){try{s=dispatch(s,a);}catch(e){assert.fail(`Recorded action ${index}: ${e.message}`);}}
 assert.equal(s.winner,0);assert.equal(s.turn,15);assert.deepEqual(s.players.map(p=>p.life),[9,0]);
 assert.deepEqual(JSON.parse(JSON.stringify(s)),recorded.state);
});
test('The recorded game includes real opening, development, combat and a later Death Door killing blow',()=>{
 const actions=recorded.history,types=new Set(actions.map(a=>a.type));for(const type of ['mulligan','site','cast','move','draw','attack','defend','pass','end'])assert.ok(types.has(type),type);
 assert.equal(actions.some(a=>a.type==='concede'),false);assert.equal(actions[0].type,'mulligan');assert.equal(actions.at(-1).type,'attack');assert.equal(recorded.state.players[1].doorTurn,13);assert.ok(recorded.state.turn>recorded.state.players[1].doorTurn);
});
