import {geometryLocationRecords} from './final-geometry.js';
function targetId(value){return typeof value==='string'?value:value&&typeof value==='object'?(value.uid??value.unit):undefined;}
function cellAt(value){if(Number.isInteger(value))return value;if(value&&typeof value==='object'&&Number.isInteger(value.at))return value.at;if(typeof value==='string'&&/^site:\d+$/.test(value))return Number(value.slice(5));}
export function actionTargetsUnit(action,uid){return !!uid&&[action.target,...action.targets||[],action.jackVictim,action.bearer,action.skeleton].some(v=>targetId(v)===uid);}
export function matchingBoardActions(actions,at,uid,entities=[]){
 const targeted=uid&&actions.some(a=>actionTargetsUnit(a,uid));
 const here=entities.filter(e=>geometryLocationRecords(e).some(loc=>loc.at===at));
 return actions.filter(a=>targeted?actionTargetsUnit(a,uid):a.at===at||cellAt(a.target)===at||here.some(e=>actionTargetsUnit(a,e.uid)));
}
export function boardTargetLocations(actions,units,picks=[]){
 const spots=new Set(),byUid=new Map(units.map(u=>[u.uid,u]));
 const add=value=>{const at=cellAt(value);if(Number.isInteger(at)&&at>=0&&at<20)spots.add(at);const u=byUid.get(targetId(value));if(u)for(const loc of geometryLocationRecords(u))if(Number.isInteger(loc.at)&&loc.at>=0&&loc.at<20)spots.add(loc.at);};
 for(const a of actions){if(Number.isInteger(a.at))add(a.at);for(const v of [a.target,...a.targets||[],a.jackVictim,a.bearer,a.skeleton])add(v);}
 for(const pick of picks||[])if(pick?.kind==='unit')add(pick.uid);else if(pick?.kind==='cell'||pick?.kind==='direction')add(pick.at);
 return spots;
}

export function matchingBoardChoices(picks,at,uid){
 const unitPick=uid&&picks.some(s=>s?.kind==='unit'&&s.uid===uid);
 return picks.flatMap((s,i)=>s?.kind==='unit'&&uid&&s.uid===uid||!unitPick&&(s?.kind==='cell'||s?.kind==='direction')&&s.at===at?[i]:[]);
}
