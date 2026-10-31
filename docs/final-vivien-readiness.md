# Vivien readiness audit — 2026-10-30

Vivien production registration is enabled after the parent accepted all explicit core gates. All 41 Vivien tests use the real playable registry; the normal hand-cast test does not patch flags. The final publication checkpoint belongs to the parent.

## Verified graph and identity

- Realm, hand, Spellbook, cemetery and mid-resolution views derive from current physical Avatar/Spellcaster sources. Distinct physical sources remain independent; multi-location copies of one source count once. The receiver base record is not counted again as a borrowed source. Another printed Vivien is excluded.
- Source definitions describe printed abilities, not acquired characteristics. Printed power, type and elemental threshold remain Vivien's; Avatar inherent Spellcaster is not borrowed. Druid flip is a genuinely inert physical card.
- Controller/owner, physical hand ID, physical grave UID and once-use permissions survive casting through Grigori, Plunder and Inquisition exposure. Runtime views are not moved into physical zones.
- Grigori combines a permanent donor with a current graph, not a snapshot of realm-granted abilities. The donor's departure removes its continuous source while retaining the separately acquired permanent printed donor. JSON hydration reconstructs the dependency graph before consumers run.

## Verified source consumers

- Activated instances, once-use identity, normal Avatar Site abilities on a non-Avatar, source-added/removed effects and printed-versus-gained Silence behavior.
- Per-source conditions for life/water/adjacency discounts, free-after-Mortal-death, hand transformation alternatives, Skeleton return costs, cemetery cast permission and grave triggers explicitly allowed to function there. Ordinary end triggers in hand do not fire.
- Qualified Spellcaster permissions combine by OR; independent summon restrictions combine by AND. Real tests cover Earl, Wicker, Lava, River, Algor, Hexham, Lugbog/Forsaken. This multiple-permission interpretation follows the general rules and card text; it is not presented as an individual FAQ.
- Entry replacements: multiple copy abilities offer ordering; declining optional Selfsame still processes mandatory Evil Twin. Successful basic copy replaces the original ability package. Heir costs retain the physical Vivien identity through subsequent death.
- Grigori cemetery cast; Jack special cast; Wendigo sacrifice and Colossus banish, including a mixed plan that cannot spend one physical donor twice; Mimic alternate entry and physical death; Captain Plunder; Inquisition hand exposure and ensuing Genesis.
- Entry Lances count each printed source, without retroactive reacquisition on refresh.
- Merlin Tower grants the receiver temporary Spellcaster and per-instance next-Magic discounts; it does not modify the Site under the receiver. A resolved grant persists independently of the granting source.

## Source classes inventoried

| Class | Evidence / status |
|---|---|
| Avatar inherent Spellcaster | Included as a source, inherent keyword not copied; normal Site ability and Sorcerer legacy draw explicit |
| Printed Minion Spellcaster | Wizard Genesis, Sea Witch keywords, cost and placement sources |
| Minion given Spellcaster externally | Real Pallid-granted Gargoyle, Jack, Inquisition, cost and transformation sources; loss/detach tested |
| Qualified caster | River of Flame and Wicker normalized as qualified permissions, not unrestricted |
| Site gaining Spellcaster | Active Merlin Tower is included; receiver Genesis and next-Magic gift tested |
| Artifact receiver retaining Vivien | Gargoyle Monument preserves type/subtypes/controller, refreshes current graph and derived keywords; generic/qualified cast, source removal, Silence, JSON tested |
| Inert receiver | Druid flip has no type, abilities or casting; survives Void and remains one physical realm card |

## Release-gate evidence

- Two Awakened Mummies sources: both a real cast and a non-cast summon enter below with safe burial and Immobile. Pre-refresh raw physical Vivien receives a contextual view; an already typed permanent-source record is retained.
- Two Cerberus sources: legal casting is limited to the actual Avatar location; Vivien cannot move away and follows the Avatar's real dispatched move.
- Reentrant card views preserve permanent borrowed descriptors and other non-continuous extras. The actual Grigori/Wendigo merge retains exactly one permanent donor after departure and cold restoration; repeated contextual queries are idempotent and do not mutate saved state.
- Passive action permissions use stable physical-source instances. Killing the earlier of two same-name sources invalidates its old action instead of silently reusing the remaining source's former numeric slot.
- `tests/final-vivien.test.js`: 41 actual-effect tests pass in the shared workspace. Final shared regression remains the parent agent's checkpoint responsibility.

No concrete unhandled Vivien source flow remains from the explicit audit. This does not claim exhaustive enumeration of all possible card combinations. Production registration is enabled. The 100-test cross suite (Vivien 41, Malleus 20, ability sources 31, caster permissions 4, runtime hydration 4) passes with the production marker and without a temporary playable flag. Browser UI paths and every possible full-catalog combination have not been exhaustively verified; no concrete unresolved core consumer is identified by this audit.

The zone-only index was reviewed explicitly: discounts/placement/cemetery abilities/hand transformations/copy entry/Heir/Jack/Mimic/extra costs/entry Lances are covered above. `unlimited` concerns initial deck construction and does not retroactively rebuild a deck after the game starts. Oversized printed size is a characteristic, not copied text.
