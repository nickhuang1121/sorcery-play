import {install,card,starter} from '../src/cards.js';
import {newGame,restoreGame,legalActions,dispatch} from '../src/engine.js';
import {effectChoiceHTML} from '../src/effect-choice-ui.js';
const $=s=>document.querySelector(s);let state;
install(await (await fetch('../data/official-cards.json')).json());
$('#status').textContent='資料已載入；等待開始。';
function render(){
 const audit=state.finalContractAccordAudit||[],spent=state.players[0].spent;
 $('#evidence').textContent=JSON.stringify({manaSpent:spent,life:state.players[0].life,artifactIds:state.artifacts.map(a=>a.uid),accordAudit:audit},null,2);
 if(state.choice){
  $('#status').textContent=(state.choice.manual?'人工核實選擇：':'引擎選擇：')+state.choice.title;
  $('#choice-ui').innerHTML=effectChoiceHTML(state.choice);
  for(const button of document.querySelectorAll('[data-effect-choice]'))button.onclick=()=>{try{state=dispatch(state,{type:'choose',player:state.choice.player,option:Number(button.dataset.effectChoice)});render();}catch(e){$('#status').textContent='失敗：'+e.message;}};
 }else{
  $('#choice-ui').replaceChildren();
  const valid=audit.length===1&&audit[0].cost.uid==='manual-gem'&&audit[0].cost.category==='gem'&&audit[0].verification==='human-physical-card-category'&&!state.artifacts.some(a=>a.uid==='manual-gem')&&state.players[0].life===20&&spent===card('demonic_contract').cost;
  $('#status').textContent=valid?'UI 驗證通過：實體身分、人工類別、付款與祭品結算皆一致。':'流程結束；尚未完成指定人工分類驗證。';
  if(valid)document.title='Demonic Contract UI 驗證通過';
 }
}
$('#start').onclick=()=>{
 state=newGame([starter(),starter()],42,'local');Object.assign(state,{phase:'main',active:0,turn:4,choice:null,storyline:[],pending:null,artifacts:[],auras:[]});
 state.board=Array.from({length:20},(_,at)=>({uid:'site'+at,card:card('valley').id,owner:at<10?1:0,controller:at<10?1:0}));
 for(const u of state.units){u.born=0;u.justEntered=false;u.tapped=false;u.mods=[];}
 for(const p of state.players){p.spent=0;p.life=20;p.doorTurn=null;p.bonusMana=30;p.bonusAffinity={air:10,earth:10,fire:10,water:10};}
 const av=state.units.find(u=>u.controller===0);av.at=17;
 state.units.push({uid:'manual-demon',card:card('corruptor_freak').id,owner:0,controller:0,at:12,layer:'surface',born:0,mods:[],tapped:false,damage:0,ward:false,justEntered:false});
 state.artifacts.push({uid:'manual-gem',card:card('ruby_core').id,owner:0,controller:0,bearer:av.uid,at:17,layer:'surface'});
 state.players[0].hand.push({uid:'contract-hand',card:card('demonic_contract').id});state.players[0].spells=[card('wild_boars').id];state=restoreGame(state);
 const action=legalActions(state,0).find(a=>a.type==='cast'&&a.hand==='contract-hand');if(!action)throw Error('No legal real Contract cast');state=dispatch(state,action);render();
};
