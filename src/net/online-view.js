import {byId} from '../cards.js';
import {legalActions,observation,topSpellAccess} from '../engine.js';
import {finalLogicalActor,finalDecisionController,finalControlledPlayer} from '../final-control.js';
const clone=value=>structuredClone(value);
export class RoomError extends Error{constructor(message,status=400){super(message);this.status=status;}}
export const requireThat=(condition,message,status=400)=>{if(!condition)throw new RoomError(message,status);};
// No engine continuations, RNG state, action history, or deferred snapshots are
// sent to a player. Only these public render fields cross the trust boundary.
const PUBLIC_STATE=['version','projectRuleProfile','turn','active','phase','mulligan','winner','firstPlayer','next','board','units','artifacts','auras','inertCards','ongoingEffects','boundSpells','finalPlayerControls','deathHistory','summonHistory','avatarSetupComplete','collectionPermissions','boundControls'];
const PUBLIC_PLAYER=['name','life','maxLife','doorTurn','turnsTaken','cemetery','banished','spent','bonusMana','bonusAffinity','collectionMode','finalNoAtlas','setAsideDragon','bloodManaTurn'];
export function playerView(state,seat){
 const observed=observation(state,seat),v={mode:'online',seed:null,rng:null,history:[],storyline:[],log:clone(state.log)};
 for(const k of PUBLIC_STATE)if(observed[k]!==undefined)v[k]=clone(observed[k]);
 v.players=observed.players.map(p=>Object.fromEntries([...PUBLIC_PLAYER,'hand','atlas','spells','collection','handRevealed'].filter(k=>p[k]!==undefined).map(k=>[k,clone(p[k])])));
 // Pending combat itself is public, its deferred resolver is not.
 v.pending=state.pending?Object.fromEntries(['kind','player','attacker','target','targets','combatAt','combatLayer','defenders','noDefend','stealth','resolvingDefense','resolvingReaction'].filter(k=>state.pending[k]!==undefined).map(k=>[k,clone(state.pending[k])])):null;
 const actor=finalLogicalActor(state),controller=finalDecisionController(state,actor),canAct=controller===seat;
 v.choice=null;
 if(state.choice){const c=state.choice,f=c.frame;v.choice={player:c.player,title:canAct?c.title:'等待對手選擇',manual:!!c.manual,options:canAct?clone(c.options):[],frame:canAct&&f?{effectCard:f.effectCard,source:f.source?{uid:f.source.uid,card:f.source.card,at:f.source.at}:null,step:f.step?{op:f.step.op,select:f.step.select?{kind:f.step.select.kind}:undefined}:null}:null};}
 const legal=canAct?legalActions(state,actor).filter(a=>a.type!=='concede'):[];
 return {state:v,actor,controller,actions:legal,topAccess:topSpellAccess(state,finalControlledPlayer(state,seat)??seat)};
}
// A public revision precondition must never hash the engine's secret RNG or
// resolver state. The engine token stays entirely inside the authority.
export const publicChoiceToken=(r,seat)=>r.state?.choice&&finalDecisionController(r.state,finalLogicalActor(r.state))===seat?'choice-v2:'+r.id+':'+r.revision+':'+seat:null;
export function canonicalAction(state,action){
 if(action.type==='concede')return {type:'concede',player:action.player};
 const extras=new Set(['actor','choiceToken',...(action.type==='mulligan'?['cards']:[]),...(['pickup','drop'].includes(action.type)?['items','units']:[])]);
 const offered=legalActions(state,action.player).find(a=>Object.entries(a).every(([k,v])=>action.type==='mulligan'&&k==='cards'||JSON.stringify(action[k])===JSON.stringify(v))&&Object.keys(action).every(k=>k in a||extras.has(k)));
 requireThat(offered,'此動作不在目前的合法選項中',409);
 return {...offered,...(action.type==='mulligan'?{cards:clone(action.cards||[])}:{}),...(['pickup','drop'].includes(action.type)&&action.items!==undefined?{items:clone(action.items)}:{}),...(['pickup','drop'].includes(action.type)&&action.units!==undefined?{units:clone(action.units)}:{})};
}

