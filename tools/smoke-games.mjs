import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {install,officialBetaDecks} from '../src/cards.js';
import {newGame,dispatch,legalActions,observation} from '../src/engine.js';
import {chooseAction} from '../src/ai.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
const decks=officialBetaDecks(),results=[];
const args=process.argv.slice(2);assert(args.length<=1&&(!args[0]||args[0].startsWith('--pairs=')),'Use --pairs=1:0,1:1 or no arguments');
const pairs=args[0]?args[0].slice(8).split(',').map(pair=>pair.split(':').map(Number)):Array.from({length:4},(_,a)=>Array.from({length:4},(_,b)=>[a,b])).flat();
assert(pairs.length&&pairs.every(pair=>pair.length===2&&pair.every(n=>Number.isInteger(n)&&n>=0&&n<4)),'Invalid deck pair');
assert(new Set(pairs.map(pair=>pair.join(':'))).size===pairs.length,'Duplicate deck pair');
const stem=args[0]?'smoke-game-targeted':'smoke-game';
const sourceFingerprint=()=>createHash('sha256').update(fs.readdirSync(new URL('../src/',import.meta.url)).filter(f=>f.endsWith('.js')).sort().map(f=>f+'\n'+fs.readFileSync(new URL('../src/'+f,import.meta.url),'utf8')).join('\n')).digest('hex');
const run={startedAt:new Date().toISOString(),status:'running',expectedMatches:pairs.length,completedMatches:0,sourceFingerprint:sourceFingerprint(),results};
const persist=()=>fs.writeFileSync(new URL('../data/'+stem+'-progress.json',import.meta.url),JSON.stringify(run,null,2)+'\n');
persist();
try{
for(const [a,b]of pairs){
 let s=newGame([decks[a],decks[b]],42+a*4+b,'local'),steps=0;
 while(s.winner===null&&steps<2000){const p=s.choice?.player??s.pending?.player??(s.phase==='mulligan'?s.mulligan:s.active),actions=legalActions(s,p);assert.ok(actions.length,'No legal actions');const action=chooseAction(observation(s,p),actions,p,{difficulty:'medium'});s=dispatch(s,action);steps++;}
 assert.notEqual(s.winner,null,`Unfinished match ${a}/${b}, turn ${s.turn}`);
 results.push({a:decks[a].officialId,b:decks[b].officialId,seed:42+a*4+b,steps,turn:s.turn,winner:s.winner});
 run.completedMatches=results.length;persist();
 console.log(`${a}/${b}: winner ${s.winner}, ${s.turn} turns, ${steps} actions`);
}
run.status='passed';run.exitCode=0;run.finishedAt=new Date().toISOString();run.sourceUnchanged=run.sourceFingerprint===sourceFingerprint();persist();
fs.writeFileSync(new URL('../data/'+stem+'-results.json',import.meta.url),JSON.stringify({checkedAt:run.finishedAt,matches:results.length,results,sourceFingerprint:run.sourceFingerprint,sourceUnchanged:run.sourceUnchanged},null,2)+'\n');
}catch(error){run.status='failed';run.exitCode=1;run.finishedAt=new Date().toISOString();run.error=String(error);run.sourceUnchanged=run.sourceFingerprint===sourceFingerprint();persist();throw error;}
