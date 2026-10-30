// Source descriptors are part of the action, so saved declarations can be
// revalidated without moving a library card into the hand.
function sources(s,A){
 const live=u=>!u.dying&&!u.silenced&&!A.disabled(u);
 return {merlins:s.units.filter(u=>live(u)&&A.passives[A.card(u.card).slug]?.topMagic),cults:s.units.filter(u=>live(u)&&A.passives[A.card(u.card).slug]?.topEvil),cradles:(s.artifacts||[]).filter(o=>!o.silenced&&!o.disabled&&A.passives[A.card(o.card).slug]?.topDragon)};
}
export function topSpellAccess(s,p,A){
 const {merlins,cults,cradles}=sources(s,A),publicTop=cults.length>0;
 const ownTurn=s.active===p&&s.phase!=='mulligan'&&s.winner===null;
 const canLook=publicTop||ownTurn&&(merlins.some(u=>u.controller===p)||cradles.some(o=>A.artifactController(s,o)===p));
 return {canLook,publicTop,cards:s.players.map((pl,q)=>publicTop||q===p&&canLook?pl.spells[0]||null:null)};
}
export function topCastEntries(s,p,A){
 const id=s.players[p].spells[0];if(!id)return [];
 const c=A.card(id),{merlins,cults,cradles}=sources(s,A),result=[];
 const entry=(source,kind,extra={})=>({card:id,from:{top:{player:p,card:id,source:source.uid,kind}},...extra});
 if(c.type==='Magic')for(const u of merlins)if(u.controller===p)result.push(entry(u,'merlin',{onlyCaster:u.uid}));
 if(c.type==='Minion'&&c.subtypes.includes('Dragon'))for(const o of cradles)if(A.artifactController(s,o)===p)result.push(entry(o,'cradle',{forceAt:o.at,forceLayer:o.layer||'surface'}));
 if(c.type==='Minion'&&c.umbrellas.includes('Evil'))for(const u of cults)result.push(entry(u,'cult',{forceAt:u.at,forceLayer:u.layer||'surface'}));
 return result;
}
