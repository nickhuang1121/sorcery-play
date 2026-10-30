import { card, elements } from './cards.js';
import { distance, nearby, region, avatar, power, unit, resources, spellcaster, castingCard, effectOptions, dispatch, legalActions, keywords } from './engine.js';
import { definitions } from './definitions.js';

export const AI_DIFFICULTIES = ['easy', 'medium', 'strong'];

function normalizeDifficulty(d) {
  return AI_DIFFICULTIES.includes(d) ? d : 'medium';
}

function keywordValue(u) {
  let n = 0;
  let kw = [];
  try { kw = keywords(u); } catch { return 0; }
  if (kw.includes('Airborne')) n += 2.5;
  if (kw.includes('Lethal')) n += 3.5;
  if (kw.includes('Spellcaster')) n += 2;
  if (kw.includes('Charge')) n += 1.5;
  if (kw.includes('Ward') || u.ward) n += 2;
  if (kw.some(k => k === 'Ranged' || /^Ranged\b/.test(k))) n += 2;
  if (kw.includes('Voidwalk') || kw.includes('Submerge') || kw.includes('Burrowing')) n += 1.2;
  return n;
}

function thresholdScore(r) {
  // Soft cap: first few pips matter most for casting.
  let n = (r.available || 0) * 1.6;
  for (const e of elements) n += Math.min(r[e] || 0, 4) * 2.4;
  return n;
}

/** Ops that usually want enemy / hostile board objects. */
const HOSTILE_OPS = new Set([
  'chainResolve', 'damage', 'strike', 'rangedHit', 'destroy', 'sleep', 'damageDisable',
  'returnHand', 'control', 'transformToken', 'shiftLayer', 'damageUntap', 'silenceTap',
  'smite', 'satanicPanic', 'infiltrate', 'boundControl', 'harpoonPull', 'shatterEnemy',
  'shatterDeclare', 'assaultPoint', 'thiefTarget', 'liesFirst', 'commitPairAbility', 'liesFight',
  'banishWithItems', 'banish', 'ambushSkeletons', 'searingTruth', 'snatchArtifact',
  'locationDamage', 'siteDamage', 'destroyLocation', 'dispelLocation', 'unravelLocation',
  'extinguish', 'sinkSite', 'destroySiteMinions', 'razeSite', 'detonate', 'gridBlast',
  'projectile', 'hellfire', 'destroyRanks',
]);

/** Ops that usually want ally / friendly board objects. */
const ALLY_OPS = new Set([
  'ward', 'untap', 'heal', 'modify', 'stealth', 'festival', 'summon', 'blinkAlly', 'fade',
  'wardAllies', 'trialWaterChoose', 'duelChoose', 'gift_of_the_raven', 'sourceStrikes',
  'resurrectRandom', 'summonGrave', 'liftSite', 'geyser', 'critical_strike', 'nextStrike',
]);

const DRAW_OPS = new Set(['draw', 'drawCards', 'browseTop', 'leylineDraw', 'springDraw', 'ritualMana', 'gainMana', 'returnGraves']);
const SUMMON_OPS = new Set(['summon', 'paySummon', 'resurrectRandom', 'summonGrave', 'ambushSkeletons']);
const BUFF_OPS = new Set(['ward', 'untap', 'modify', 'stealth', 'shieldWall', 'witchingHour', 'blaze']);
const CONTROL_OPS = new Set(['sleep', 'damageDisable', 'silenceTap', 'control', 'returnHand', 'transformToken', 'shiftLayer', 'smite', 'satanicPanic', 'fade', 'blinkAlly']);

function stepOp(step) {
  return step?.effectOp || step?.op || '';
}

function hostileSelect(select = {}) {
  return !!(select.enemy || select.other || select.notAlly);
}

function allySelect(select = {}) {
  return !!(select.ally || select.ownOrControl);
}

function countBoardHits(view, p, select = {}, caster) {
  if (!select || select.kind === 'hand' || select.kind === 'deck' || select.kind === 'player') return { enemies: 0, allies: 0 };
  try {
    const opts = effectOptions(view, { source: caster, controller: p }, { ...select, untargeted: true });
    let enemies = 0, allies = 0;
    for (const o of opts) {
      const v = o.value;
      if (v?.entity === 'unit') {
        const t = unit(view, v.uid);
        if (!t) continue;
        if (t.controller !== p) enemies++;
        else allies++;
      } else if (v?.entity === 'site' || typeof v?.at === 'number') {
        const site = view.board[v.at];
        if (!site) continue;
        if (site.controller !== p) enemies++;
        else allies++;
      }
    }
    return { enemies, allies };
  } catch {
    return { enemies: 0, allies: 0 };
  }
}

/** Score a definitions cast[] / step list without needing per-slug handler tables. */
function definitionStepsScore(view, p, steps, caster) {
  if (!steps?.length) return null;
  let score = 28;
  let needsTarget = false;
  let hasHostileIntent = false;
  for (const step of steps) {
    const op = stepOp(step);
    const amount = step.amount || 0;
    const count = typeof step.count === 'number' ? step.count : (step.slug ? 1 : 0);
    if (DRAW_OPS.has(op)) score += 18 + Math.min(3, count || 1) * 6;
    if (SUMMON_OPS.has(op) || step.slug) score += 22 + Math.min(6, count || step.count || 1) * 5 + (step.charge ? 8 : 0);
    if (BUFF_OPS.has(op)) score += 14;
    if (CONTROL_OPS.has(op)) { score += 16 + amount; hasHostileIntent = hasHostileIntent || !allySelect(step.select); }
    if (op === 'damage' || op === 'locationDamage' || op === 'siteDamage' || op === 'damageDisable' || op === 'damageUntap') {
      score += 12 + amount * 6;
      hasHostileIntent = true;
    }
    if (op === 'projectile') { score += 20 + (amount || 1) * 5 * Math.min(3, step.count || 1) + (step.piercing ? 6 : 0) + (step.diagramCone ? 8 : 0); hasHostileIntent = true; }
    if (op === 'gridBlast') { score += 34; hasHostileIntent = true; }
    if (op === 'destroy' || op === 'banish' || op === 'banishWithItems' || op === 'destroyLocation' || op === 'destroyRanks' || op === 'hellfire') {
      score += 40; hasHostileIntent = true;
    }
    if (op === 'heal') {
      const life = view.players[p].life;
      score += life < 15 && view.players[p].doorTurn === null ? 20 + amount * 3 : 4;
    }
    if (op === 'lifeLoss') score += step.opponent ? 18 + amount * 4 : -12;
    if (step.select && !step.optional && !step.all && !step.untargeted) needsTarget = true;
    if (step.all || step.untargeted) {
      const hits = countBoardHits(view, p, step.all || step.select, caster);
      if (hasHostileIntent || HOSTILE_OPS.has(op) || hostileSelect(step.all || step.select)) {
        score += hits.enemies * 10 - hits.allies * 8;
        if (!hits.enemies && (HOSTILE_OPS.has(op) || hostileSelect(step.all || step.select))) score -= 25;
      } else if (ALLY_OPS.has(op) || allySelect(step.all || step.select)) {
        score += hits.allies * 8 - hits.enemies * 4;
      }
    }
  }
  const first = steps[0];
  if (needsTarget && first?.select) {
    const kind = first.select.kind;
    if (['unit', 'unitOrArtifact', 'minion'].includes(kind) || !kind) {
      const opts = effectOptions(view, { source: caster, controller: p }, first.select);
      const enemies = opts.filter(o => o.value?.entity === 'unit' && unit(view, o.value.uid)?.controller !== p);
      const allies = opts.filter(o => o.value?.entity === 'unit' && unit(view, o.value.uid)?.controller === p);
      if ((HOSTILE_OPS.has(stepOp(first)) || hostileSelect(first.select) || hasHostileIntent) && !enemies.length) return -5;
      if ((ALLY_OPS.has(stepOp(first)) || allySelect(first.select)) && !allies.length && !enemies.length) return -5;
      if (enemies.length && (HOSTILE_OPS.has(stepOp(first)) || hasHostileIntent)) score += 12 + Math.min(3, enemies.length) * 4;
      if (allies.length && ALLY_OPS.has(stepOp(first))) score += 8;
    }
  }
  return score;
}

/**
 * Shallow resolve after an attack/defend/pass so evaluate() sees post-fight board.
 * Opponent pending → pass (fight with current defenders); choices → choose heuristic only.
 */
function settleCombat(s) {
  let guard = 12;
  let cur = s;
  while (guard-- > 0) {
    if (cur.winner !== null) return cur;
    if (cur.choice) {
      const actor = cur.choice.player;
      const list = legalActions(cur, actor).filter(a => a.type === 'choose' || a.type === 'pass');
      if (!list.length) return cur;
      let best = list[0], bestScore = -Infinity;
      for (const a of list) {
        if (a.type !== 'choose') continue;
        const sc = heuristicScore(cur, a, actor);
        if (sc > bestScore) { bestScore = sc; best = a; }
      }
      try { cur = dispatch(cur, best); } catch { return cur; }
      continue;
    }
    if (cur.pending) {
      try { cur = dispatch(cur, { type: 'pass', player: cur.pending.player }); } catch { return cur; }
      continue;
    }
    return cur;
  }
  return cur;
}

/** evaluate(after) - evaluate(before) for attack/defend/pass-through-combat. */
function combatDelta(view, a, p) {
  try {
    const next = settleCombat(dispatch(view, a));
    return evaluate(next, p) - evaluate(view, p);
  } catch {
    return null;
  }
}

/** Untapped enemy minions sharing Avatar's square that can realistically hit. */
function avatarThreats(view, p, at = null) {
  const av = avatar(view, p);
  if (!av) return { lethal: false, maxPow: 0, count: 0 };
  const cell = at ?? av.at;
  const life = view.players[p].life;
  let maxPow = 0, count = 0;
  for (const u of view.units || []) {
    if (u.controller === p || u.dying || u.tapped) continue;
    if (card(u.card).type === 'Avatar') continue;
    if (u.at !== cell) continue;
    const pow = power(u);
    maxPow = Math.max(maxPow, pow);
    count++;
  }
  return { lethal: count > 0 && maxPow >= life, maxPow, count };
}

function unitChoiceScore(view, p, op, t) {
  if (!t) return -20;
  const hostile = HOSTILE_OPS.has(op);
  const ally = ALLY_OPS.has(op);
  if (hostile && !ally) return t.controller !== p ? 80 + power(t) : -40;
  if (ally && !hostile) return t.controller === p ? 60 + power(t) : -40;
  // Ambiguous ops: prefer enemies when select was enemy-flavored elsewhere; default hostile bias for damage-ish names.
  if (/damage|destroy|sleep|banish|smite|panic|silence|control|return|transform|shift|strike|lash|detonate|raze|ambush|snatch|searing|extinguish|sink|boil/i.test(op)) {
    return t.controller !== p ? 80 + power(t) : -40;
  }
  return t.controller === p ? 55 + power(t) : 25 + power(t);
}

/** Board value from public-ish info only (no opponent hand / deck order). */
export function evaluate(s, p) {
  if (s.winner === p) return 1e9;
  if (s.winner !== null && s.winner !== p) return -1e9;
  const me = s.players[p], opp = s.players[1 - p];
  let score = (me.life - opp.life) * 18;
  // Death's Door / low-life endgame pressure.
  if (me.doorTurn !== null) score -= 90 + Math.max(0, (s.turn - me.doorTurn)) * 16;
  else if (me.life <= 8) score -= (8 - me.life) * 5;
  if (opp.doorTurn !== null) score += 100 + Math.max(0, (s.turn - opp.doorTurn)) * 18;
  else if (opp.life <= 8) score += (8 - opp.life) * 6;
  score += (me.hand?.length || 0) * 3 - (opp.hand?.length || 0) * 3;
  score += (me.cemetery?.length || 0) * 0.15 - (opp.cemetery?.length || 0) * 0.1;
  const av = avatar(s, p), enemy = avatar(s, 1 - p);
  if (av && enemy) {
    const d = distance(av.at, enemy.at);
    // Mid/late: closing distance is better; early: slight caution already in move heuristic.
    score += (me.life <= 12 || opp.life <= 12 || opp.doorTurn !== null ? -d * 0.9 : -d * 0.35);
  }
  for (const u of s.units || []) {
    const c = card(u.card);
    const pow = power(u);
    const def = Math.max(0, (c.defense || 0) - (u.damage || 0));
    const near = enemy ? Math.max(0, 4 - distance(u.at, enemy.at)) : 0;
    const siteNear = av ? Math.max(0, 3 - distance(u.at, av.at)) : 0;
    const kw = keywordValue(u);
    const layerPen = u.layer === 'below' ? -1.5 : 0;
    if (u.controller === p) {
      if (c.type === 'Avatar') score += me.life * 2;
      else score += pow * 4 + def * 1.5 + near * 2 + kw + layerPen + (u.ward ? 6 : 0) + (u.stealth ? 4 : 0) - (u.tapped ? 2 : 0) - (u.damage || 0) * 0.8;
    } else {
      if (c.type === 'Avatar') score -= opp.life * 2;
      else score -= pow * 4.2 + def * 1.6 + siteNear * 2.5 + kw * 1.05 + (u.ward ? 6 : 0) + (u.stealth ? 5 : 0) - (u.damage || 0) * 0.7;
    }
  }
  for (let at = 0; at < (s.board?.length || 0); at++) {
    const site = s.board[at];
    if (!site) continue;
    score += site.controller === p ? 5.5 : site.controller === 1 - p ? -5.5 : 0;
    if (site.ward && site.controller === p) score += 2;
    if (site.ward && site.controller === 1 - p) score -= 2;
  }
  for (const o of s.artifacts || []) {
    const mine = o.controller === p || (!o.controller && o.owner === p) || unit(s, o.bearer)?.controller === p;
    score += mine ? (o.bearer ? 5 : 3) : -3.5;
  }
  for (const o of s.auras || []) score += o.controller === p ? 3 : -3;
  try {
    score += thresholdScore(resources(s, p)) - thresholdScore(resources(s, 1 - p)) * 0.95;
  } catch { /* observation may omit some resource fields */ }
  return score;
}

/** Build mulligan variants (engine only lists empty cards[]; AI may ship up to 3). */
export function expandMulliganActions(view, p, base) {
  const hand = (view.players[p]?.hand || []).filter(h => h?.uid && !h.hidden);
  const out = [{ ...base, cards: [] }];
  const spells = hand.filter(h => card(h.card).type !== 'Site')
    .sort((a, b) => (card(b.card).cost || 0) - (card(a.card).cost || 0) || String(a.uid).localeCompare(String(b.uid)));
  // Replace expensive spells (same pile redraw). Keep sites unless we somehow have 0 spells to ship.
  const pricey = spells.filter(h => (card(h.card).cost || 0) >= 3);
  for (let n = 1; n <= Math.min(3, pricey.length); n++) {
    out.push({ ...base, cards: pricey.slice(0, n).map(h => h.uid) });
  }
  // Also consider shipping a 2-cost if hand is all medium and we ship nothing pricey.
  if (!pricey.length) {
    const mid = spells.filter(h => (card(h.card).cost || 0) >= 2).slice(0, 2);
    if (mid.length) out.push({ ...base, cards: mid.map(h => h.uid) });
  }
  return out;
}

function mulliganScore(view, a, p) {
  const hand = (view.players[p]?.hand || []).filter(h => h?.uid && !h.hidden);
  const ship = new Set(a.cards || []);
  const kept = hand.filter(h => !ship.has(h.uid));
  const keptSpells = kept.filter(h => card(h.card).type !== 'Site');
  const keptSites = kept.filter(h => card(h.card).type === 'Site');
  const shipped = hand.filter(h => ship.has(h.uid));
  let score = 70;
  score += keptSites.length * 6;
  score -= keptSpells.reduce((n, h) => n + Math.max(0, (card(h.card).cost || 0) - 2) * 7, 0);
  score += shipped.filter(h => card(h.card).type !== 'Site').reduce((n, h) => n + (card(h.card).cost || 0) * 4, 0);
  score -= shipped.filter(h => card(h.card).type === 'Site').length * 12; // redraw site is OK but don't prefer dumping sites
  if (ship.size > 3) score -= 50;
  return score;
}

function heuristicScore(view, a, p) {
  const opponent = avatar(view, 1 - p);
  if (a.type === 'activateArtifact') {
    const o = view.artifacts.find(o => o.uid === a.object), slug = card(o.card).slug;
    const ability = definitions[slug]?.activated?.[a.index];
    if (slug === 'siege_ballista' && ability?.steps?.[0]?.select && !effectOptions(view, { source: o, controller: p }, ability.steps[0].select).some(o => o.value.entity === 'unit' && unit(view, o.value.uid)?.controller !== p)) return -5;
    if (slug === 'ferrymans_coin') return a.index === 0 ? 14 : 7;
    // Downrank free repeatable taps so they don't drown out real plays.
    if (ability?.once || ability?.onceEver) return 26;
    if ((ability?.mana || 0) > 0) return 10;
    if (ability?.tap || ability?.bearerTap) return 4;
    return 6;
  }
  if (a.type === 'homecomingMana') return 15;
  if (a.type === 'freeUnit') return unit(view,a.target)?.controller===p?35:-30;
  if (a.type === 'hireSellsword') return unit(view,a.target)?.controller!==p?44:-25;
  if (a.type === 'salmonRoll') return 22;
  if (a.type === 'pushBoulder') return 12;
  if (a.type === 'resurrect') return 50 + (card(a.card).attack || 0) * 2 - distance(a.at, opponent.at) * 2 + (a.layer === 'below' ? -15 : 0);
  if (a.type === 'activateSite') return definitions[card(view.board[a.at].card).slug].activated[a.index].once ? 20 : -10;
  if (a.type === 'activate') {
    const u = unit(view, a.unit), ability = definitions[card(u.card).slug].activated[a.index];
    return ability.mana && !ability.once ? 5 : 40;
  }
  if (a.type === 'pickup') return 45;
  if (a.type === 'drop') return -40;
  if (a.type === 'choose') {
    const option = view.choice.options[a.option], rawStep = view.choice.frame.step, step = { ...rawStep, op: rawStep.effectOp || rawStep.op }, v = option.value;
    if (step.op === 'chainDeclare') {
      if (v === 'commit') return 65;
      if (v === null) return -100;
      if (v?.uid) { const target = unit(view, v.uid); return target?.controller !== p ? 80 + power(target) : -40; }
    }
    if (v === null) return ['commitSpell','commitAbility','commitArtifact','commitPairAbility','shatterDeclare'].includes(rawStep.op) && view.choice.options.some(o=>o.value!==null) ? -100 : 0;
    if (step.op === 'combatAllocate') {
      const plan = step.plans[step.planIndex], target = unit(view, plan.targets[step.targetIndex]), source = unit(view, plan.uid);
      const wanted = source && target ? Math.max(0, power(target, true) - target.damage) : 0;
      return 50 - Math.abs(v - wanted);
    }
    if (v?.sites !== undefined) {
      const wanted = view.players[p].hand.some(h => card(h.card).type === 'Site') ? 0 : 1;
      return 40 - Math.abs(v.sites - wanted);
    }
    if (v?.entity === 'grave') return 20 + (card(v.card).attack || 0);
    if (v?.entity === 'unit') return unitChoiceScore(view, p, step.op, unit(view, v.uid));
    if (v?.entity === 'site') {
      const site = view.board[v.at];
      const base = 30 - distance(v.at, opponent.at);
      if (HOSTILE_OPS.has(step.op)) return base + (site?.controller !== p ? 18 : -12);
      if (ALLY_OPS.has(step.op)) return base + (site?.controller === p ? 14 : -10);
      return base;
    }
    if (v?.entity === 'artifact') {
      const o = (view.artifacts || []).find(x => x.uid === v.uid);
      const mine = o && (o.controller === p || o.owner === p || unit(view, o.bearer)?.controller === p);
      return HOSTILE_OPS.has(step.op) ? (mine ? -25 : 55) : (mine ? 40 : -15);
    }
    return 20 - a.option;
  }
  if (a.type === 'ranged') {
    const u = unit(view, a.unit), from = { x: u.at % 5, y: Math.floor(u.at / 5) }, to = { x: opponent.at % 5, y: Math.floor(opponent.at / 5) };
    const direction = Math.abs(to.y - from.y) >= Math.abs(to.x - from.x) ? (to.y < from.y ? 0 : 2) : (to.x > from.x ? 1 : 3);
    return a.direction === direction ? 32 : -10;
  }
  if (a.type === 'mulligan') return mulliganScore(view, a, p);
  if (a.type === 'draw') return a.deck === (view.players[p].hand.filter(h => card(h.card).type === 'Site').length < 2 && view.board.filter(x => x?.controller === p).length < 8 ? 'atlas' : 'spells') ? 100 : 0;
  if (a.type === 'pass') {
    if (view.pending) {
      const delta = combatDelta(view, a, p);
      if (delta != null) return 18 + delta;
    }
    return 0;
  }
  if (a.type === 'defend') {
    const delta = combatDelta(view, a, p);
    if (delta != null) return 28 + delta;
    const d = unit(view, a.unit), at = unit(view, view.pending.attacker);
    return 10 + power(d) - Math.max(0, power(at) - power(d, true));
  }
  if (a.type === 'site') {
    const c = card(view.players[p].hand.find(h => h.uid === a.hand).card), r = resources(view, p);
    return 80 + ['earth', 'fire', 'air', 'water'].reduce((n, e) => n + (c[e] || 0) / (r[e] + 1), 0) * 4 - distance(a.at, opponent.at) * 1.5;
  }
  if (a.type === 'cast') {
    const c = castingCard(view, a);
    const caster = spellcaster(view, a.caster, a.casterLayer);
    const steps = definitions[c.slug]?.cast;
    if (c.type === 'Magic' && steps?.length) {
      if (c.slug === 'chain_lightning') {
        if (!view.units.some(u => u.controller !== p && !u.stealth && nearby(u.at, caster.at) && region(view, u) === region(view, caster))) return -5;
      }
      const scored = definitionStepsScore(view, p, steps, caster);
      if (scored != null) return scored;
    }
    if (c.type === 'Minion') return 50 + c.attack * 2 - distance(a.at, opponent.at) * 2;
    if (c.type === 'Artifact') return a.bearer ? 45 + power(unit(view, a.bearer)) - distance(a.at, opponent.at) : 5;
    if (c.type === 'Aura') return 30 + view.units.filter(u => [a.at, a.at + 1, a.at + 5, a.at + 6].includes(u.at)).reduce((n, u) => n + (c.slug === 'silence' ? (u.controller === p ? -10 : 10) : (u.controller === p ? 8 : 0)), 0);
    const t = typeof a.target === 'string' ? unit(view, a.target) : null;
    if (['zap', 'arc', 'immolation', 'fatality', 'freeze', 'shrink'].includes(c.handler)) return t?.controller !== p ? 60 + power(t) : -50;
    if (c.handler === 'heal') return view.players[p].life < 15 && view.players[p].doorTurn === null ? 55 : -50;
    if (c.handler === 'intervention') return view.players[p].doorTurn !== null ? 500 : -50;
    if (['begone', 'mesmerism', 'betrayal', 'exile'].includes(c.handler)) return t?.controller !== p ? 65 + power(t) : -40;
    if (['flight', 'invigorate', 'necropotence'].includes(c.handler)) return t && !t.tapped ? 45 : -20;
    if (c.handler === 'vanishment') return view.units.some(u => u.controller === p && card(u.card).type === 'Minion' && !u.stealth) ? 55 : -10;
    if (c.handler === 'lifewish') return view.players[p].life < view.players[1 - p].life - 5 && view.players[p].doorTurn === null ? 55 : -30;
    if (c.handler === 'mortality' || c.handler === 'exorcism') return 20 + view.units.filter(u => u.at === a.target && card(u.card).subtypes.some(t => (c.handler === 'mortality' ? ['Mortal'] : ['Demon', 'Undead']).includes(t))).reduce((n, u) => n + (u.controller === p ? -25 : 25), 0);
    if (c.handler === 'lightning' || c.handler === 'explosion') return 20 + view.units.filter(u => u.at === a.target).reduce((n, u) => n + (u.controller === p ? -25 : 25), 0);
    if (['power2', 'power6', 'wolf', 'serpent', 'charge'].includes(c.handler)) return t && !t.tapped && distance(t.at, opponent.at) <= 2 ? 48 : -40;
    if (c.handler === 'teleport') return 25 + distance(unit(view, a.target.unit).at, opponent.at) * 2 - distance(a.target.at, opponent.at) * 4;
    if (c.handler === 'mortals') return view.units.reduce((n, u) => n + (card(u.card).subtypes.includes('Mortal') ? (u.controller === p ? -12 : 12) : 0), 10);
    if (c.handler === 'rain') return view.units.reduce((n, u) => n + (card(u.card).type === 'Minion' ? (u.controller === p ? -4 : 4) : 0), 10);
    return 35;
  }
  if (a.type === 'attack') {
    const u = unit(view, a.unit), t = unit(view, a.target);
    const door = view.players[1 - p].doorTurn !== null;
    const delta = combatDelta(view, a, p);
    if (t && card(t.card).type === 'Avatar') {
      const spike = 90 + power(u) * 3 + (door ? 500 : 0);
      return delta != null ? Math.max(spike, 75 + delta * 1.4) : spike;
    }
    if (typeof a.target === 'string' && a.target.startsWith('site:')) {
      return delta != null ? 55 + delta * 1.35 + power(u) : 85 + power(u) * 2;
    }
    if (delta != null) return 38 + delta * 1.45;
    return 40 + (power(u) >= power(t, true) ? 20 : 0) - (power(t) >= power(u, true) ? 10 : 0);
  }
  if (a.type === 'move') {
    const u = unit(view, a.unit);
    if (card(u.card).type === 'Avatar') {
      const here = avatarThreats(view, p, u.at);
      const there = avatarThreats(view, p, a.at);
      // Heuristic flee only when current square is lethal and destination is not.
      if (here.lethal && !there.lethal) return 240 + here.maxPow;
      if (!here.lethal && there.lethal) return -120;
      if (there.maxPow > here.maxPow) return -40;
      return -20 - distance(a.at, opponent.at) * 0.5;
    }
    const before = distance(u.at, opponent.at), after = distance(a.at, opponent.at);
    // Allies stepping onto a lethal Avatar square can buy a block next turn.
    const av = avatar(view, p);
    if (av && a.at === av.at) {
      const threat = avatarThreats(view, p, av.at);
      if (threat.lethal) return 70 + threat.maxPow * 0.4;
    }
    return after < before ? 30 + (before - after) * 3 : -10;
  }
  if (a.type === 'ability') return a.mode === 'spells' ? 8 : 2;
  if (a.type === 'end') {
    const threat = avatarThreats(view, p);
    if (threat.lethal) return -450;
    // Soft-press ending the turn when tangible plays remain (cast/attack/site).
    return -8;
  }
  return -1000;
}

function endPressure(view, actions, p) {
  const meaningful = actions.some(a => a.type === 'cast' || a.type === 'attack' || a.type === 'site' || a.type === 'resurrect');
  if (!meaningful) return 0;
  // Extra penalty only when something real is still legal.
  return -22;
}

function rankActions(view, actions, p) {
  const endPen = endPressure(view, actions, p);
  return actions.map((a, i) => ({
    a,
    score: heuristicScore(view, a, p) + (a.type === 'end' || a.type === 'pass' ? endPen : 0),
    i,
  })).sort((x, y) => y.score - x.score || x.i - y.i);
}

function pickEasy(ranked) {
  // Softer play: downrank aggression, nudge toward pass/end, then sample the top band.
  const adjusted = ranked.map((row, idx) => {
    let s = row.score;
    const a = row.a;
    if (a.type === 'attack') s -= a.target?.startsWith?.('site:') ? 28 : 16;
    if (a.type === 'end' || a.type === 'pass') s += 8;
    if (a.type === 'cast' && row.score > 70) s -= 20;
    return { ...row, score: s + Math.random() * 35 - idx };
  }).sort((x, y) => y.score - x.score || x.i - y.i);
  const band = Math.max(1, Math.ceil(adjusted.length * 0.45));
  return adjusted[Math.floor(Math.random() * band)].a;
}

function decisionActor(s) {
  if (s.choice) return s.choice.player;
  if (s.phase === 'mulligan') return s.mulligan;
  if (s.pending) return s.pending.player;
  return s.active;
}

function isForcedDecision(s) {
  return !!(s.choice || s.pending || s.phase === 'mulligan');
}

function actionPool(s, actor) {
  const list = legalActions(s, actor);
  const mull = list.find(a => a.type === 'mulligan');
  if (mull && s.phase === 'mulligan') return expandMulliganActions(s, actor, mull);
  return list;
}

/**
 * Resolve forced stacks, then let the opponent take up to oppPlies free decisions
 * (draw / cast / attack / …) before scoring. Stops on our free main-phase decision.
 */
function settle(s, p, deadline, oppPlies) {
  if (Date.now() > deadline) return evaluate(s, p);
  if (s.winner !== null) return evaluate(s, p);
  let cur = s;
  let guard = 0;
  let oppLeft = Math.max(0, oppPlies | 0);
  while (guard++ < 18) {
    if (cur.winner !== null) return evaluate(cur, p);
    if (Date.now() > deadline) return evaluate(cur, p);
    const actor = decisionActor(cur);
    const forced = isForcedDecision(cur);
    if (!forced && actor === p) return evaluate(cur, p);
    if (!forced && actor !== p && oppLeft <= 0) return evaluate(cur, p);
    const list = actionPool(cur, actor);
    if (!list.length) return evaluate(cur, p);
    const best = rankActions(cur, list, actor)[0]?.a;
    if (!best) return evaluate(cur, p);
    try { cur = dispatch(cur, best); }
    catch { return evaluate(cur, p); }
    if (!forced && actor !== p) oppLeft--;
  }
  return evaluate(cur, p);
}

/**
 * Fair search root: strip opponent hand identities and scramble their decks so
 * shallow search cannot peek at hidden cards / draw order (omniscient opt-in).
 * Hand size is preserved with unplayable Token stubs.
 */
export function fairSearchRoot(s, p) {
  const c = structuredClone(s);
  const opp = 1 - p;
  let stubId = null;
  try { stubId = card('foot_soldier').id; } catch { stubId = null; }
  if (stubId && c.players[opp]?.hand) {
    c.players[opp].hand = c.players[opp].hand.map(h => (
      h?.hidden || h?.card == null ? { uid: h.uid || ('h' + c.next++), card: stubId } : { uid: h.uid, card: stubId }
    ));
  }
  let seed = ((c.rng >>> 0) ^ ((p + 1) * 0x9e3779b9)) >>> 0;
  const scramble = (arr) => {
    if (!Array.isArray(arr)) return;
    for (let i = arr.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = seed % (i + 1);
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
  };
  scramble(c.players[opp]?.atlas);
  scramble(c.players[opp]?.spells);
  return c;
}

function search(root, view, actions, p, { width, budgetMs, oppPlies }) {
  const deadline = Date.now() + budgetMs;
  const ranked = rankActions(view, actions, p);
  const candidates = ranked.slice(0, Math.min(width, ranked.length));
  let best = candidates[0]?.a || null;
  let bestScore = -Infinity;
  const before = evaluate(root, p);
  for (const { a, score: h } of candidates) {
    if (Date.now() > deadline) break;
    try {
      const next = dispatch(root, a);
      let value = settle(next, p, deadline, oppPlies);
      // Mild blend with heuristic so ties break toward proven priorities (e.g. intervention).
      value += h * 0.02;
      if (value > bestScore) { bestScore = value; best = a; }
    } catch {
      if (h + before > bestScore) { bestScore = h + before; best = a; }
    }
  }
  return best;
}

/**
 * Only a redacted observation and the engine's legal action list are accepted
 * (mulligan may fill cards[] beyond the empty stub legalActions returns).
 * Optional opts: { difficulty, root, omniscient }.
 * Search defaults to fair (hidden info redacted); pass omniscient:true to peek.
 * Without root, falls back to heuristic (preserves existing tests / Codex card FN work).
 */
export function chooseAction(view, actions, p, opts = {}) {
  if (!actions.length) return null;
  const difficulty = normalizeDifficulty(opts.difficulty ?? view.aiDifficulty);
  const mull = actions.find(a => a.type === 'mulligan');
  const pool = mull && view.phase === 'mulligan'
    ? expandMulliganActions(view, p, mull)
    : actions;
  const ranked = rankActions(view, pool, p);
  if (difficulty === 'easy') {
    // Easy: keep from the original legal stub when possible so membership tests stay stable.
    if (mull && view.phase === 'mulligan') return { ...mull, cards: [] };
    return pickEasy(ranked);
  }

  const root = opts.root;
  // Mulligan redraws are stochastic; keep the dedicated heuristic instead of shallow search.
  if (root && view.phase !== 'mulligan' && (difficulty === 'medium' || difficulty === 'strong')) {
    const profile = difficulty === 'strong'
      ? { width: 16, budgetMs: 120, oppPlies: 2 }
      : { width: 10, budgetMs: 45, oppPlies: 1 };
    const searchRoot = opts.omniscient ? root : fairSearchRoot(root, p);
    const picked = search(searchRoot, view, pool, p, profile);
    if (picked) return picked;
  }
  return ranked[0].a;
}
