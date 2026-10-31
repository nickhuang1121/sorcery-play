import fs from 'node:fs';import {install,card,starter} from '../src/cards.js';import {newGame,restoreGame} from '../src/engine.js';
install(JSON.parse(fs.readFileSync(new URL('../data/official-cards.json',import.meta.url))));
let s=newGame([starter(),starter()],42,'local');s.phase='main';s.turn=5;s.active=0;s.choice=null;s.pending=null;s.storyline=[];s.auras=[];s.artifacts=[];s.log=[];
s.board=Array.from({length:20},(_,i)=>({uid:'site'+i,card:card('valley').id,owner:i<10?1:0,controller:i<10?1:0}));
for(const u of s.units){u.at=u.controller?2:17;u.born=0;u.justEntered=false;u.mods=[];}
for(const p of s.players){p.hand=[];p.spent=0;p.bonusMana=50;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}
s.players[0].life=10;s.units.push({uid:'fx-target',card:card('brown_bears').id,owner:1,controller:1,at:12,layer:'surface',born:0,mods:[],tapped:false,damage:0,ward:false});
s.players[0].hand=['brown_bears','bless','zap','lifewish','fatality'].map(slug=>({uid:'fx-'+slug,card:card(slug).id}));s=restoreGame(s);
fs.writeFileSync(new URL('../data/mobile-ui-fixture.json',import.meta.url),JSON.stringify({description:'Authored fixture, production dispatch/UI. Cast Bears at C1; Bless own Bears; Zap Bears C2; Lifewish; Fatality Bears C2.',state:s},null,2)+'\n');
const objectState=structuredClone(s);objectState.players[0].hand=[{uid:'fx-telekinesis',card:card('telekinesis').id}];objectState.artifacts=[{uid:'fx-relic',card:card('ruby_core').id,owner:1,controller:1,at:12,layer:'surface',bearer:null}];
fs.writeFileSync(new URL('../data/mobile-object-fixture.json',import.meta.url),JSON.stringify({description:'Real Telekinesis handcast; select enemy Ruby on C2 through the board.',state:restoreGame(objectState)},null,2)+'\n');
