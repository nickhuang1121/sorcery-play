// Leaf-only native Aura source state. No registry, geometry, or engine imports:
// geography may inspect terrain dependencies without introducing a cycle.
export function catalogAuraDisabled(a){return !!a&&!a.fiftyOnslaught&&!a.gainedCannotDisable&&(!!a.completionDisabled||!!a.restraintDisabled||!!a.carryDisabled||!!a.bellyDisabled||!!a.effectDisabled||!!a.boundDisabled||!!a.conditionDisabled||(a.mods||[]).some(m=>m.disabled||m.asleep));}
export function catalogAuraActive(a,disabled=catalogAuraDisabled){return !!a&&!a.dying&&!a.silenced&&!a.disabled&&!disabled(a);}
