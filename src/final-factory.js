import {siteEffectAllowed} from './final-ability-layers.js';
export const factoryPassives={infusion_factory:{finalInfusionFactory:true}};
export function factoryAnimationClaims(s,A){
 const artifacts=[...new Map([...(s.artifacts||[]),...s.units.filter(u=>A.card(u.card).artifactUnit)].map(a=>[a.uid,a])).values()],claims=[];
 for(const [at,site] of s.board.entries())if(site&&!site.silenced&&!site.disabled&&A.card(site.card).slug==='infusion_factory'){
  const source={...site,at,uid:site.uid||'site:'+at,layer:'surface'};
  for(const artifact of artifacts){if(artifact.dying||!A.occupied(artifact).some(i=>A.distance(at,i)===1))continue;
   const key='factory:'+source.uid+':'+artifact.uid,existing=artifact.artifactAnimation?.effects.some(e=>e.key===key);
   // An effect does not erase itself when its own animation gives the Key its
   // self-bearer protection. A previously protected unit rejects a new effect.
   if(!existing&&!siteEffectAllowed(s,artifact,'modify',A,site.card))continue;
   claims.push({artifact,source,controller:null,kind:'factory',power:2,selfBearer:true,key});
  }
 }
 return claims;
}
