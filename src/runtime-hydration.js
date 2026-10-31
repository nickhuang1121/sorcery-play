// Pure catalog hydration. Providers register definitions/cards only; live unit
// indexes and derived-state refresh run once after the dependency graph is ready.
export function hydrateRuntimeCards(saved,A,providers){
 const ids=new Set(),seen=new Set(),done=new Set(),visiting=new Set();
 const collect=value=>{if(typeof value==='string'){if(value.startsWith('runtime:'))ids.add(value);return;}if(!value||typeof value!=='object'||seen.has(value))return;seen.add(value);for(const child of Object.values(value))collect(child);};collect(saved);
 const known=id=>{try{return A.card(id);}catch(error){if(String(error.message).startsWith('未知卡牌：'))return null;throw error;}};
 const visit=id=>{
  if(done.has(id))return;if(visiting.has(id))throw Error('Cyclic runtime-card dependency: '+id);
  const match=/^runtime:([^:]+):(.+)$/.exec(id);if(!match){A.card(id);done.add(id);return;}
  visiting.add(id);const context={id,kind:match[1],base:match[2]},provider=providers.find(p=>p.handles(context));
  visit(context.base);if(provider)for(const dependency of provider.dependencies?.(context)||[])visit(dependency);
  if(provider)provider.register(context,A);else if(!known(id))throw Error('No runtime registration provider for '+context.kind);
  if(!known(id))throw Error('Runtime provider did not register requested card: '+id);
  visiting.delete(id);done.add(id);
 };
 for(const id of ids)visit(id);return [...done].filter(id=>id.startsWith('runtime:'));
}
export const builtinRuntimeProvider={
 handles:({kind})=>['druid_back','behemoth_demon','disabled_site','silenced_site','fate_site','sinterfee_site','silenced_artifact','orb_magic','tombstone_wardens_angel'].includes(kind),
 register:({kind,base},A)=>{
  if(kind==='druid_back'){const rules=A.card(base).rulesBack;if(typeof rules!=='string')throw Error('Druid back has no printed reverse text');return A.runtimeCard(base,kind,{rules});}
  if(kind==='behemoth_demon')return A.runtimeCard(base,kind,{type:'Minion',subtypes:['Demon'],umbrellas:['Evil'],rules:''});
  if(kind==='orb_magic')return A.runtimeCard(base,kind,{category:'Token',playable:false});
  if(kind==='tombstone_wardens_angel')return A.runtimeCard(base,kind,{type:'Minion',subtypes:['Angel','Automaton'],keywords:['Airborne'],artifactUnit:true,attack:5,defense:5,rules:'Airborne'});
  return A.runtimeCard(base,kind,{runtimeMask:true,rules:'',...(kind==='disabled_site'||kind==='sinterfee_site'?{air:0,earth:0,fire:0,water:0}:kind==='fate_site'?{air:0,earth:0,fire:0,water:1}:{})});
 }
};
