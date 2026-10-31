import {card,officialBetaDecks} from './cards.js';
import {newGame,restoreGame,legalActions,unit,dispatch} from './engine.js';
export const TUTORIAL_VERSION=1;
export const TUTORIAL_KEY='sorcery.tutorial.v1';
const copy=(zh,en)=>({zh,en});
export const tutorialChapters=[
 {title:copy('認識卡牌','Meet your cards'),intro:copy('點一下卡牌查看詳情，再關閉視窗。手牌與戰場卡牌都使用相同操作。','Tap a card to inspect it, then close its details. Cards in your hand and on the battlefield work the same way.'),steps:[copy('點擊亮起的手牌，查看詳情後關閉。','Inspect the highlighted hand card, then close its details.'),copy('點擊你的 Avatar，查看詳情後關閉。','Inspect your Avatar, then close its details.')]},
 {title:copy('開拓領域','Build your realm'),intro:copy('回合開始可從 Atlas 或 Spellbook 抽牌。這次先抽地點，再放置地點；放置會橫置你的 Avatar。地點提供法力與元素門檻，元素門檻不會因施法而消耗。','At the start of a turn, draw from your Atlas or Spellbook. Draw a site, then play it by tapping your Avatar. Sites provide mana and elemental threshold; casting does not consume threshold.'),steps:[copy('選擇 Atlas，抽取地點。','Choose Atlas to draw a site.'),copy('將亮起的地點向上拖到任一高亮格；也可點牌後選擇此牌，再點目標。','Drag the highlighted site upward onto a glowing square. You can also tap the card, choose it, then tap a target.')]},
 {title:copy('召喚生物','Summon a minion'),intro:copy('這個場景已有兩個地點，提供 2 法力。召喚費用為 2 的生物，並觀察法力變化。新召喚的生物有召喚失調，通常不能立即行動。','This scene has two sites providing 2 mana. Summon the minion that costs 2 and watch your mana change. A newly summoned minion is normally unable to act this turn.'),steps:[copy('將亮起的生物拖到高亮的己方地點，完成召喚。','Drag the highlighted minion onto a highlighted friendly site to summon it.')]},
 {title:copy('移動與攻擊','Move and attack'),intro:copy('場上的生物已準備好行動。先移動一隻生物，再用另一隻攻擊。移動與攻擊通常會橫置生物，戰鬥中的單位會互相造成傷害。','Your minions are ready. Move one minion, then attack with another. Moving and attacking normally tap the minion. Units in combat strike each other.'),steps:[copy('選擇亮起的生物，移動到高亮格。','Choose the highlighted minion and move it to a glowing square.'),copy('用亮起的棕熊攻擊敵方步兵。','Attack the enemy Foot Soldier with the highlighted Brown Bears.')]},
 {title:copy('施法與選目標','Cast and target'),intro:copy('這次使用「滋！」對指定單位造成 1 點傷害。先選擇法術並取消選取，再重新選擇、指定敵方步兵。取消選取不會花費法力。','Zap deals 1 damage to a target unit. First select the spell and cancel targeting. Then select it again and target the enemy Foot Soldier. Cancelling targeting spends no mana.'),steps:[copy('點擊「滋！」，按「施放此牌」進入目標選擇。','Tap Zap, then choose “Cast this card” to start targeting.'),copy('按「取消」，練習安全返回。','Choose “Cancel” to return safely.'),copy('重新選擇「滋！」，對亮起的敵方步兵施放。','Select Zap again and cast it on the highlighted enemy Foot Soldier.')]},
 {title:copy('防禦與回合','Defend and take turns'),intro:copy('教學對手將攻擊你的 Avatar。用棕熊代替原目標防禦，再完成戰鬥。之後練習抽牌與結束回合；對手會自動完成自己的回合。','The tutor will attack your Avatar. Have Brown Bears defend instead of the original target, then resolve combat. Next, practise drawing and ending a turn. The tutor takes its turns automatically.'),steps:[copy('選擇棕熊，按「防禦／攔截」，再按「代替原目標防禦」。','Choose Brown Bears, choose “Defend / intercept”, then “Replace the original defender”.'),copy('按完成防禦，結算戰鬥。','Finish defending to resolve combat.'),copy('輪到你了，選擇一個牌庫抽牌。','It is your turn. Choose a deck to draw from.'),copy('按結束回合，讓對手行動。','End your turn and let the tutor act.'),copy('再抽一張牌，完成回合練習。','Draw another card to finish this lesson.')]},
 {title:copy('整合練習','Put it together'),intro:copy('不再使用強制遮罩。自行召喚一隻生物、移動平民農戶，再用棕熊擊倒敵方步兵。順序自由；完成這三件事即過關，不需要打完整場。','The spotlight is off. Summon a minion, move Common Cottagers, and defeat the enemy Foot Soldier with Brown Bears, in any order. Complete all three tasks to finish; no full match is required.'),steps:[copy('召喚生物、移動平民農戶、用棕熊擊倒敵方步兵。','Summon a minion, move Common Cottagers, and defeat the Foot Soldier with Brown Bears.')]}
];
export const tutorialText=(value,locale)=>value?.[locale==='en'?'en':'zh']||'';
export function cleanTutorialProgress(value){
 const base={version:TUTORIAL_VERSION,completed:[],chapter:0,checkpoint:null};
 if(value?.version!==TUTORIAL_VERSION)return base;
 base.completed=[...new Set((Array.isArray(value.completed)?value.completed:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<tutorialChapters.length))];
 base.chapter=Number.isInteger(value.chapter)&&value.chapter>=0&&value.chapter<tutorialChapters.length?value.chapter:0;
 // Restore by replay, never trust arbitrary persisted game state or a claimed step.
 if(value.checkpoint?.chapter===base.chapter&&Array.isArray(value.checkpoint.events)&&value.checkpoint.events.length<=100)base.checkpoint={chapter:base.chapter,events:value.checkpoint.events};
 return base;
}
function add(s,slug,at,owner=0,uid){const u={uid,card:card(slug).id,owner,controller:owner,at,born:0,tapped:false,damage:0,mods:[]};s.units.push(u);return u;}
export function createTutorialScene(chapter){
 if(!tutorialChapters[chapter])throw Error('Unknown tutorial chapter');
 // The bootstrap uses validated official decks; the isolated teaching snapshot is
 // intentionally smaller and never enters the player's deck collection.
 const s=newGame(officialBetaDecks().slice(0,2),731,'ai');
 Object.assign(s,{turn:5,active:0,phase:'main',firstPlayer:0,choice:null,pending:null,storyline:[],artifacts:[],auras:[],history:[],log:[],winner:null});
 s.units=[];s.board=Array(20).fill(null);
 s.players.forEach((p,i)=>Object.assign(p,{name:i?'教學對手':'你',life:20,doorTurn:null,hand:[],atlas:Array(8).fill(card('valley').id),spells:Array(8).fill(card('common_cottagers').id),spent:0,turnsTaken:2,collection:[]}));
 add(s,'sorcerer',17,0,'lesson-avatar');add(s,'sorcerer',2,1,'lesson-enemy-avatar');
 const site=(at,p=0,slug='valley')=>{s.board[at]={uid:'lesson-site-'+at,card:card(slug).id,owner:p,controller:p};};
 const hand=slug=>s.players[0].hand.push({uid:'lesson-hand',card:card(slug).id});
 site(17);site(2,1);
 if(chapter===0)hand('common_cottagers');
 if(chapter===1)s.phase='draw';
 if(chapter===2){site(12);hand('common_cottagers');}
 if(chapter===3||chapter===6){site(12);site(13);site(16);site(11);site(8,1);add(s,'common_cottagers',16,0,'lesson-mover');add(s,'brown_bears',13,0,'lesson-bear');add(s,'foot_soldier',8,1,'lesson-enemy');if(chapter===6)hand('common_cottagers');}
 if(chapter===4){site(17,0,'spire');site(12,1);hand('zap');add(s,'foot_soldier',12,1,'lesson-enemy');}
 if(chapter===5){site(12);site(13);site(7,1);s.units.find(u=>u.uid==='lesson-avatar').at=12;add(s,'brown_bears',13,0,'lesson-bear');add(s,'common_cottagers',7,1,'lesson-enemy');s.active=1;}
 return restoreGame(s);
}
export function createTutorialSession(chapter){return {version:TUTORIAL_VERSION,chapter,step:0,done:false,flags:{},events:[]};}
export function tutorialAllows(t,s,a,{script=false}={}){
 if(!t||t.done)return false;
 if(script)return tutorialScriptAction(t,s)&&JSON.stringify(a)===JSON.stringify(tutorialScriptAction(t,s));
 if(a.player!==0)return false;
 const c=t.chapter,k=t.step;
 if(c===0)return false;
 if(c===1)return k===0?a.type==='draw'&&a.deck==='atlas':a.type==='site';
 if(c===2)return a.type==='cast'&&a.hand==='lesson-hand';
 if(c===3)return k===0?a.type==='move'&&a.unit==='lesson-mover':a.type==='attack'&&a.unit==='lesson-bear'&&a.target==='lesson-enemy';
 if(c===4)return k===2&&a.type==='cast'&&a.hand==='lesson-hand'&&a.target==='lesson-enemy';
 if(c===5)return k===0?a.type==='defend'&&a.unit==='lesson-bear'&&a.keep===false:k===1?a.type==='pass':k===3?a.type==='end':a.type==='draw';
 if(c===6)return a.type==='cast'&&a.hand==='lesson-hand'&&!t.flags.summon||a.type==='move'&&a.unit==='lesson-mover'&&!t.flags.move||a.type==='attack'&&a.unit==='lesson-bear'&&a.target==='lesson-enemy'&&!t.flags.attack;
 return false;
}
// Target previews remain available while practising cancellation, but submission
// stays blocked until that lesson's targeting step is complete.
export function tutorialActions(t,s,list){
 if(t.chapter===5&&t.step===0)return list.filter(a=>a.type==='defend'&&a.unit==='lesson-bear');
 if(t.chapter===4&&t.step<2)return list.filter(a=>a.type==='cast'&&a.hand==='lesson-hand'&&a.target==='lesson-enemy');
 return list.filter(a=>tutorialAllows(t,s,a));
}
export function tutorialScriptAction(t,s){
 if(t.done||s.winner!==null)return null;
 const p=s.choice?.player??s.pending?.player??s.active;
 if(p!==1)return null;
 const list=legalActions(s,1);
 if(s.pending)return list.find(a=>a.type==='pass')||null;
 if(t.chapter!==5)return null;
 if(s.phase==='draw')return list.find(a=>a.type==='draw'&&a.deck==='atlas')||null;
 if(t.step===0)return list.find(a=>a.type==='attack'&&a.unit==='lesson-enemy'&&a.target==='lesson-avatar')||null;
 return list.find(a=>a.type==='end')||null;
}
export function advanceTutorial(t,event,before,after){
 if(t.done)return t;
 const n=structuredClone(t),c=n.chapter,k=n.step;
 if(event.kind==='inspect-close'&&c===0&&event.id===(k===0?card('common_cottagers').id:card('sorcerer').id))n.step++;
 if(event.kind==='select'&&c===4&&k===0&&event.id==='lesson-hand')n.step++;
 if(event.kind==='cancel'&&c===4&&k===1)n.step++;
 if(event.kind==='action'&&!event.script){
  const a=event.action;
  if(!tutorialAllows(t,before,a))throw Error('Action outside tutorial step');
  if(c===1&&((k===0&&after.players[0].hand.length>before.players[0].hand.length)||(k===1&&after.board.some((site,i)=>site&&!before.board[i]))))n.step++;
  if(c===2&&after.units.some(u=>u.controller===0&&u.card===card('common_cottagers').id&&u.born===after.turn))n.step++;
  if(c===3&&(k===0&&unit(after,'lesson-mover')?.at!==unit(before,'lesson-mover')?.at||k===1&&(after.pending||!unit(after,'lesson-enemy'))))n.step++;
  if(c===4&&k===2&&!unit(after,'lesson-enemy'))n.step++;
  if(c===5)n.step++;
  if(c===6){if(a.type==='cast')n.flags.summon=true;if(a.type==='move')n.flags.move=true;if(a.type==='attack')n.flags.attack=true;}
 }
 // An attack is not complete until the scripted defender has passed and combat
 // has actually removed its target. No lesson finishes on a pending attack.
 n.done=c===6?!!(n.flags.summon&&n.flags.move&&n.flags.attack&&!after.pending&&!unit(after,'lesson-enemy')):n.step>=tutorialChapters[c].steps.length&&!after.pending;
 n.events.push(event);
 return n;
}

// Reconstruct checkpoints through the same rule engine, including tutor actions.
export function restoreTutorialCheckpoint(checkpoint){
 let session=createTutorialSession(checkpoint.chapter),state=createTutorialScene(checkpoint.chapter);
 for(const event of checkpoint.events){
  if(!['action','inspect-close','select','cancel'].includes(event?.kind)||session.done)throw Error('Invalid tutorial checkpoint');
  const before=state;
  if(event.kind==='action'){
   if(!tutorialAllows(session,state,event.action,{script:!!event.script}))throw Error('Invalid tutorial action');
   state=dispatch(state,event.action);
  }else if(!(event.kind==='inspect-close'&&session.chapter===0||event.kind==='select'&&session.chapter===4&&session.step===0||event.kind==='cancel'&&session.chapter===4&&session.step===1))throw Error('Invalid tutorial event');
  session=advanceTutorial(session,event,before,state);
 }
 return {session,state};
}
