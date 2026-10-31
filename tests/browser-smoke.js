import {loadCards,card,officialBetaDecks,validateDeck} from '../src/cards.js';
import {newGame,dispatch,legalActions,restoreGame} from '../src/engine.js';
import {remainingBatches} from '../src/remaining-rules.js';
let passed=0,failed=0;
function check(label,fn){const li=document.createElement('li');try{fn();li.textContent='✓ '+label;li.className='pass';passed++;}catch(e){li.textContent='✗ '+label+'：'+e.message;li.className='fail';failed++;}document.querySelector('#results').append(li);}
function assert(ok){if(!ok)throw Error('Assertion failed');}
try{
 const cards=await loadCards();check('官方卡牌快照載入',()=>assert(cards.length===1100));
 for(const batch of remainingBatches)check(batch.map(slug=>card(slug).name).join('、'),()=>assert(batch.every(slug=>card(slug).playable)));
 for(const d of officialBetaDecks())check(d.name,()=>{assert(validateDeck(d).length===0);let s=newGame([d,d],42);s=dispatch(s,legalActions(s,s.mulligan)[0]);s=dispatch(s,legalActions(s,s.mulligan)[0]);assert(s.phase==='main');assert(legalActions(s,s.active).length>0);assert(restoreGame(JSON.parse(JSON.stringify(s))).phase==='main');});
 check('Automaton 同時具有 Minion 與 Artifact 身分',()=>assert(card('iron_man_talus').type==='Minion'&&card('iron_man_talus').artifactUnit));
}catch(e){check('模組整合',()=>{throw e;});}
document.querySelector('#summary').textContent=`${passed} 通過 / ${failed} 失敗`;
document.title=`Sorcery 測試 ${passed}/${failed}`;
