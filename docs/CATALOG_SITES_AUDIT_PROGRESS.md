# Site catalog audit handoff

Scope: the 208 printed Site rows in `data/all-cards-audit/sites.json`. Runtime copies are not new printed entries. The full catalog baseline remains 1100 entries including seven tokens. This ledger does not claim complete card behavior or browser verification.

Current coverage:

- All 208 rows now have printed text, specific code consumers, source metadata and remaining per-card concerns reviewed. This is the first code-review pass, not a declaration that all effects work.
- 69 cards are `partially-tested`; 139 are `code-reviewed-awaiting-tests`; none remain entirely unreviewed. No card is marked fully verified.
- The first 25 each have an actual named effect or interaction test. These are still partial tests: only individually covered dimensions are marked `tested`, and actual browser UI is `unreviewed` throughout.
- The 139 code-reviewed cards still need their individual genuine effect tests. Continue from the category JSON rather than turning a matching definition or a shared handler test into a per-card claim. All rows retain exact untested dimensions.

Primary sources: current official **October 2026** rulebook (38 pages; Drive modified **2026-10-12T20:32:30Z**), official card snapshot, and official Codex/FAQ corpus. Exact applicable FAQ IDs, revisions and updated timestamps are attached per card. The rulebook URL is https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view . Local research corpus: `/tmp/sorcery-official-embedded-docs.json`; local rulebook text: `/tmp/sorcery-official-rulebook-oct2026.txt`.

## Actual verification

`tests/catalog-sites.test.js` contains 71 genuine dispatch cases. The 40-case terrain checkpoint combined them with geometry and all final-units cases:

```sh
node --test tests/catalog-sites.test.js tests/final-geometry.test.js tests/final-units.test.js
```

**321/321 passed** (catalog40 + geometry101 + units180), log `/tmp/catalog-sites-terrain-cross.log`.

Earlier explicitly selected existing Altar, Baba Yaga, Bedrock and Bower tests also passed **11/11**:

```sh
node --test --test-name-pattern 'Altar|Baba Yaga|Bower|Bedrock' tests/final-altar.test.js tests/final-key.test.js tests/final-flood.test.js tests/final-ability-integration.test.js
```

Log `/tmp/catalog-sites-existing-interactions.log`. These named cases and their exact scope are attached to the corresponding card rows. The Boneyard change was also checked alongside all cemetery-access cases: **52/52** at that earlier checkpoint, `/tmp/catalog-sites-cemetery.log`.

## Confirmed issues fixed through root-owned fresh patches

1. Boneyard chose the active player first. FAQ `eXfZjLHocReFQIApZdI7ng` requires non-active first, simultaneous entry, then non-active Genesis first. `/tmp/build-catalog-boneyard-order.py` produced the root-applied patch. Real choices, two simultaneous entrants, Genesis order, independent decline and mid-choice JSON restore passed. Cemetery owner updated the two Bureau/Boneyard tests without removing cost assertions.
2. Arid Desert used only `u.at` to find affected Minions. `/tmp/build-catalog-arid-patch.py` changed its one-target Site damage predicate to physical surface occupancy. A Giant whose anchor is elsewhere now receives exactly one damage; a below Minion remains undamaged.
3. Beacon counted only enemy anchors. `/tmp/build-catalog-beacon-patch.py` now checks surface occupancy per nearby Site. Four occupied Sites from one Giant grant four mana; multiple enemies on one Site still count once, and below enemies do not count.
4. Bog/Babbling Brook terrain and the Kairos archive used anchor-only effect membership. `/tmp/build-catalog-terrain-occupancy.py` introduced one shared physical-location predicate for both consumers. Surface/below, allLayers Quagmire, Key Site protection, once-per-effect keyword application, persistence and geometry/Kairos regression passed.

All four patches were generated from fresh shared source and applied by root. This agent did not directly edit shared engine source.

Globe's two existing official-rule ambiguities remain unresolved; this catalog work does not alter its partial status. Browser UI remains unverified. No deployment, push, credential or Firebase changes were performed.


## Follow-up since the terrain checkpoint

- Mudflow is now fixed and formally tested in four additional real dispatch cases (catalog total **44/44**, `/tmp/catalog-sites-44.log`). The source contact is the chosen Site's below part. Active Moebas extend only that part, ordinary bodies translate atomically, mixed fixed shapes cannot create a third layer, and Key/force immunity remain effective. An already occupied surface destination adds neither a part nor a new Army movement event. Generator: `/tmp/build-catalog-mudflow-patch.py`; owned helper: `geometryForcedSurfaceMove`.
- Postern Gate has a reproduced entry-timing bug with Cursed Land; three pending `/tmp/catalog-sites-postern.test.mjs` cases cover hand play, Frontier Settlers non-hand play, and Mirror Realm effective copy with physical owner and restore. Fresh proposed centralized entry patch: `/tmp/build-catalog-postern-entry.py`. Printed Bone Rabble and Geomancer both say **you play**, so their event actor is playingPlayer; Tower Genesis uses controller. This proposal is awaiting root application and tests.
- Sea of Ash has a reproduced nonanchor below-occupancy gap (`/tmp/catalog-sites-ash.test.mjs`, `/tmp/catalog-sites-ash.log`). Root fresh proposal: `/tmp/build-catalog-sea-ash-patch.py`. Surface and Key-protected bodies are negative controls. Awaiting application and post-fix tests.
- Thin Ice and Stinging Kelp contain further anchor-shaped consumers needing their own real tests and careful layer/forced-movement interpretation. They are recorded as questions for verification, not confirmed failures.

Latest isolated catalog execution: **47/47** passed, `/tmp/catalog-sites-47.log`. Added actual Camelot Unique cost/threshold control, stacked Court of Equity Elite tax, and City of Glass conditional resource cases. No browser verification is implied.

Latest catalog execution: **71/71** passed (`/tmp/catalog-sites-71.log`). Individual bindings now additionally verified for three damage Deserts, three remaining seasonal peek Rivers, three remaining Foot Soldier Villages, both Skeleton token Sites, and ten blank resource Sites. Blank Site expectations are independent literal affinities: Mountain Peaks supplies Air2; Steppe supplies Earth1/Fire1. City of Souls separately passed eight selected real damage/redirect cases; Dungeon and Cloud City passed eight selected real movement/interaction cases. Their exact names and commands are attached per row.
