/** Fingerprint engine state for lockstep desync checks. No Firebase imports. */
function fnv(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function checksumState(s) {
  // Canonical complete JSON, including card identities, effect continuations,
  // equipment, choice values and all future engine fields. Object insertion
  // order is not meaningful; array order (notably libraries) is meaningful.
  const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().filter(k=>value[k]!==undefined).map(k=>[k,canonical(value[k])])):value;
  return s?fnv(JSON.stringify(canonical(s))):'null';
}
