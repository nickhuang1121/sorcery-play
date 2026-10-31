# Cemetery view / physical identity / Bureau effect scopes

Implemented in `src/cemetery-access.js`, engine/storyline and the modules listed below. Bureau, Mortuary and Wormelow are registered after integration and cross-module validation. `tests/cemetery-access.test.js`: 32 passed, including 21 true dispatcher cases; combined with final-passives: 94 passed. The caller list records the implemented integration contract.

## Verified official rules (2026-10-30)

- [Mismanaged Mortuary](https://sorcerytcg.com/cards/mismanaged_mortuary), all 3 FAQs expanded in browser: an even number of active copies cancel; cards always enter their owner's original physical cemetery; Wormelow protects the swapped cemetery treated as yours.
- [Bureau of Occult Control](https://sorcerytcg.com/cards/bureau_of_occult_control), all 3 FAQs expanded: access is a card LEAVING collection/cemetery, not looking/counting/adding. Separate 2 mana is paid when an ability is put on the Storyline, covers the entire effect, and is not discounted by casting reductions. Declining still resolves other parts, e.g. Adept Illusionist can search hand/spellbook. Grave-cast Ghostfire must pay before casting and cannot refuse its later self-banish. Wormelow does not prevent the tax being imposed.
- [Wormelow Tump](https://sorcerytcg.com/cards/wormelow_tump): three earth threshold; opponents cannot affect cards in the cemetery currently treated as the controller's cemetery. Public information remains readable; adding a dying card to its owner's cemetery is not altering a card already there.

## API contract

`cemetery.js` stays PHYSICAL. Never swap `graveEntries(s,entry.player)` used to validate an already selected descriptor, `takeGrave`, `appendGrave`, `sendCard`, or grave-cast `graveOwner`. `entry.player` and all permission fields named `physicalPlayer` are actual array owners.

- `cemeteryPhysicalPlayer(s,viewPlayer,A)` maps a your/opponent cemetery to its physical owner, by active Mortuary count modulo two.
- `cemeteryCards(s,viewPlayer,A)` is a read-only contextual array for counts/statics.
- `viewCemeteryEntries(s,viewPlayer,A,{actor=viewPlayer,affect=false,scope=s.zoneAccessScope})` reads contextual descriptors; `affect:true` filters Wormelow and unpaid/refused Bureau access.
- `physicalCemeteryEntries(s,physical,A,{actor,affect,scope})` reads physical descriptors; use when scanning both zones or validating an existing selection.
- `canAffectCemetery(s,actor,physical,A)` checks only Wormelow, not Bureau and not public visibility.
- `zoneAccessPreviewCost` / `canPayZoneAccess` determine separate tax affordability before an action. Do not add tax inside `castingCost`, which is discountable.
- `commitZoneAccess(s,actor,A,{pay:true|false,scope})` returns a serializable scope `{id,permissions}`. A shared saved map `s.zoneAccessScopes[id]` is authoritative. Each player can pay or refuse once per effect, including both players participating in Boneyard. Paid/free permissions cover all downstream card movements, including casting a grave spell and its later self-banish.
- `takeAccessGrave` / `removeAccessGraves` perform physical movement after validation; they return null/[] on denial. Callers MUST NOT create a replacement unit/card or push into banished unless removal succeeded.

## Engine caller checklist

Use function/op names as stable locations (line numbers change while other cards are integrated).

### Read-only contextual reads

1. `resources`: `enemyUniqueGraveMana` reads `cemeteryCards(s,1-p,A)`.
2. `refreshContinuous`: `cemeteryPower` and `cemeterySame` read `cemeteryCards(s,u.controller,A)`.
3. `evilLifeLoss`: per-player cemetery counts read `cemeteryCards(s,q,A)`.
4. `returnGraves`: default count uses contextual `cemeteryCards(s,p,A).length` (or all physical cards when effect means any cemetery).
5. `searchSummonEntries(zone==='cemetery')`: `viewCemeteryEntries(s,p,A,{actor:p,affect:true})`.
6. `legacyTargets(h==='rescue')`: contextual descriptors instead of unqualified IDs; preserve physical player and grave UID through declaration.
7. Legal action `skeletonReturnCost` loop: iterate contextual descriptors, set `graveOwner:g.player`, `graveUid:g.uid`, physical index and original `card`. Check Wormelow and separate Bureau tax affordability.
8. Legal action `castFromGrave` entries: contextual descriptors with explicit physical `graveOwner`, `graveUid`, `grave` index. Grave card lookup and final `takeGrave` remain physical.
9. `chargeIfDead` over BOTH cemeteries: unchanged (swap is a permutation). Mere counts/looks do not pay tax.

### Selections / mutations

10. `selectEffects(kind==='grave')`: iterate contextual owner when `own:true`; `filter.player` currently derives from `selected.player` in one-cemetery continuations, so it must remain PHYSICAL. Scan all physical owners otherwise. For moving/banishing selections apply `canAffectCemetery` and current scope access. Add explicit `readOnly:true` when an effect only reads/copies without moving.
11. `queueGraveReturns`: your-cemetery source scan is contextual; create source `owner:entry.player,controller:p`, record `gravePlayer:entry.player` in `graveRecur`, and preserve the stable visit UID.
12. `graveRecur`: revalidate the recorded physical `gravePlayer`, not contextual p; summon owner = physical grave owner, controller = choosing player.
13. `searchSummonPlace`: use `picked.player` physical cemetery, not `pl=s.players[p]`; check removal succeeded; summon with `owner:picked.player,controller:p`.
14. `konrulReturn`: initial pool uses contextual cemetery, every removal uses resolved `g.player`. Hand and banish destinations are the immutable original card owner g.player.
15. `feastForCrows`: hand/spellbook continue even with refused cemetery access; `removeAccessGraves(s,cemeteryPhysicalPlayer(s,1-p,A),predicate,p,A)` handles only the contextual opponent cemetery.
16. `sarcophagusPair`, `hyenaFeast`, `conjureBroken`, `returnDeadHand`, `burnBook`, `banishGraveOne`, `skullSummon`, `summonGraveAt`, `returnGraveOne`, ability `banishSelectedGrave`, `banishDeadFire`: validate explicit physical descriptors with permission before removal; never reinterpret selected player as a view owner.
17. `banishDeadHeal` and `purgeCemeteries`: count public physical cards normally; mass removal uses `removeAccessGraves` for each physical cemetery and leaves protected zones untouched. Only actually removed cards contribute to healing.
18. `resurrectRandom`: choose from legal physical mutation candidates, not protected graves; random control must not make protected candidates selectable.
19. `boneyard`: choices use each chooser's contextual cemetery; each player uses their own permission in the shared ability scope. `boneyardResolve` must revalidate/remove using `grave.controller` as actor and `grave.player` as physical owner, then preserve original card ownership on summoned units.
20. `castingCard`, final grave-cast source removal, `restoreGame/syncGraves`, `appendGrave`, `sendCard`: stay physical; never map them through Mortuary again.
21. `commitSpell` collection branch: removal needs accepted scope before splice. `castingCost` must exclude Bureau; `canPaySpell` separately checks tax plus printed/modified cast budget.
22. `castLegacy(h==='rescue')` / resurrect action validation: carry graveOwner+UID through the action and revalidate physical card visit before costs/movement. Current raw card-ID/index access is insufficient after swapping.

### Non-shared modules

- `collection.js`: raw collection previews remain readable; actual removals need scope. `collectionPermit` can already have paid scope from the parent ability, so its cast window must inherit instead of taxing again.
- `copying.js`: all chosen grave descriptors are physical on revalidation. Copying alone is free, but its explicit banish additional cost is access.
- `metamorphosis.js`: Monster Wake can choose hand or collection. Refused collection access must keep hand choices and not consume a collection card.
- `fifty-cards.js`: own-cemetery Lady is contextual; Ghost/Horror/Regurgitator scanning both is physical and mutation-filtered. Existing selected descriptor checks remain physical.
- `final-artifacts.js`, `final-effects.js`, `final-sites.js`, `final-units.js`, `final-avatars.js`: selected/permission `physicalPlayer` stays physical. All new grave extra costs must reuse the effect scope, never pay per card.

## Implemented Storyline integration for Bureau

Frames need `zoneAccessScope`; active resolution temporarily exposes it as `s.zoneAccessScope`. Nested continuations inherit the current effect scope, including frames which change source/controller. Truly independent triggered abilities start a new scope. Do not let an unrelated trigger inherit a paid permission.

Before a root ability's access-capable effects are placed/resolved, offer payment versus refusal (and cancel before committing an optional activation). Use explicit `effectsAccessZones` manifest as the initial operation classifier; keep it synchronized when new access operations are added. Rejected access filters only collection/cemetery mutation candidates; it must not skip an entire mixed-zone effect. Look/count/add operations remain free.

Additional-cost choices (grave cast, Colossus banishments, Archimago three-card banish) reserve the separate tax budget during preview and commit one scope before moving any card. If an ability later fails for an unrelated reason, do not silently refund an already committed additional cost. Cancellation before commitment must leave mana/cards/marks untouched.

Acceptance includes true dispatcher cases and independent cross-module effects, not helper tests alone. The three cards are registered only after those checks passed.

## Saved random-result continuations

`luckyResume` preserves the interrupted frame’s zoneAccessScope and access metadata. Kythera outcome selection and a JSON restore therefore continue the original paid effect without charging again. Tested by `dispatch Bureau/random: paid access ticket survives a Kythera random-result choice and saved-game resume`.
