import {finalLogicalActor,finalDecisionController,finalControlledPlayer} from './final-control.js';

// The hand belongs to a logical player, while a hot-seat handoff belongs to
// the person making decisions. Thaïs can change one without changing the other.
export function turnControlView(state,seat=0){
  const actor=finalLogicalActor(state);
  const viewer=state.mode==='local'?finalDecisionController(state,actor):seat;
  const controlled=finalControlledPlayer(state,viewer);
  return {viewer,controlled,handPlayer:state.mode==='local'?actor:(controlled??viewer),controlledBy:state.active===viewer?finalDecisionController(state,viewer):viewer};
}
export const needsHandHandoff=(previousViewer,nextViewer)=>previousViewer!==null&&previousViewer!==nextViewer;
export function mayInspectControlledCards(state,viewer,target){return finalControlledPlayer(state,viewer)===target;}
export function handVisibleThroughControl(perspective,target){return target===perspective.viewer||(perspective.controlled!==null&&target===perspective.controlled);}

export function controlledTurn(state){
  const owner=state.active,controller=finalDecisionController(state,owner);
  const scheduled=[...new Set((state.finalPlayerControls||[]).filter(effect=>effect.nextTurn>(state.players[effect.player].turnsTaken||0)).map(effect=>effect.player))];
  return {owner,controller,active:owner!==controller,scheduled};
}

// Presentation follows the rules' logical actor, including a defender's
// response. It must not mistake that temporary response for a control handoff.
export function turnControlStatus(state){
  if(state.winner!==null||state.phase==='mulligan')return null;
  const turn=controlledTurn(state),actor=finalLogicalActor(state);
  const effects=state.finalPlayerControls||[];
  const upcoming=effects.filter(effect=>effect.nextTurn>(state.players[effect.player].turnsTaken||0));
  const nextOwner=turn.scheduled.find(player=>player!==state.active)??turn.scheduled[0];
  const nextEffect=upcoming.filter(effect=>effect.player===nextOwner).at(-1);
  const latestSource=effects.at(-1)?.source;
  const latest=effects.filter(effect=>effect.source===latestSource);
  const justFinished=!turn.active&&!upcoming.length&&latest.length>0&&latest.every(effect=>(state.players[effect.player].turnsTaken||0)-effect.nextTurn===(effect.player===state.active?1:0));
  const stage=turn.active?'active':upcoming.length?'scheduled':justFinished?'complete':null;
  return stage?{...turn,stage,actor,operator:finalDecisionController(state,actor),responding:actor!==turn.owner,next:nextEffect?{owner:nextEffect.player,controller:nextEffect.controller}:null}:null;
}

export function createHandHandoff(){
  let previousViewer=null,pending=null;
  return {
    update(state,perspective){
      const {viewer,handPlayer,controlled=null}=perspective;
      // Controlled turns already grant the controller access to these cards.
      // Reveal them consistently in both directions instead of adding a
      // hot-seat privacy prompt only when the physical controller changes.
      if(state.mode!=='local'||state.winner!==null||state.phase==='mulligan'||controlled!==null){
        previousViewer=viewer;pending=null;return null;
      }
      const key=[state.turn,state.active,viewer].join(':');
      // An unacknowledged handoff must never follow the cards into a later
      // turn. In particular, Thaïs can end while the same person stays seated.
      if(pending?.key!==key)pending=null;
      if(needsHandHandoff(previousViewer,viewer))pending={key,viewer,handPlayer};
      else if(pending)pending={...pending,handPlayer};
      previousViewer=viewer;
      return pending;
    },
    acknowledge(key){if(!pending||pending.key!==key)return false;pending=null;return true;},
    reset(){previousViewer=null;pending=null;},
  };
}
