# Magics Wave9 candidate — 2026-10-30

Only two designated /tmp artifacts changed. No source/formal tests/audit JSON changes. UI separately pending, no server or simulation launched. Native legalActions→dispatch with cold JSON checkpoints; representative coverage, not comprehensive certification.

Command `node --test /tmp/catalog-magics-wave9-candidate.mjs`: **19 tests,16 pass,3 fail,0 skip,exit1**. Strict red retained.

| Card | Native actual effects and boundaries | Remaining |
|---|---|---|
| Grasping Ground | Real cast-time target plans before payment; burrowed Cave Trolls drag Surface Cave Trolls underground; cold JSON before target/commit; opponent Ward breaks instead of drag; printed4mana and threshold denial | Artifact, caster-region restriction, multiple actors/targets, optional skip and geometry interactions not directly covered this wave. |
| Grievous Insult | Any non-Spellcaster allied Brown Bears can cast; cast-time nearby target; real silence/tap, independent spell draw; JSON; end-turn silence expiry; enemy Ward prevents both dependent effects but draw remains;2mana/resources/threshold | Broader status interactions and actual browser pending. |
| Guards! | Exact six nearby Avatar Sites at12/13/16/17/18 plus11; remove11 leaves five tokens; paid6; JSON; resources/threshold | **RED:** legitimate submerged Sea Witch caster causes zero tokens via caster-layer inheritance, expected six Surface Foot Soldiers near Surface Avatar. Oversized Avatar and Mock Court taxation not directly covered. |
| Harpyon Urge | Ally declaration then fixed weaker target before payment; choose actual flying path17→12→7; actual strike kills weaker target; JSON; equal-power target excluded; cancel at declaration retains card/no payment;3mana/resources/threshold | Intermediate triggers, disabled/immobile actor restrictions, power changes during travel pending. Initial candidate path-control bug fixed to select full path array, never reported runtime defect. |
| Harvest Festival | Physical constructed collection has exact two named Townsfolk; alliedSite selected; both actually summoned12;3mana/resources/threshold;JSON | **Two RED:** physical collection not consumed; empty constructed collection still fabricates both cards. Should use physical collection summoning primitives rather than generic spawn. Limited named-card acquisition, taxes, Below caster/Site location choice pending. |
| Heat Ray | Real north piercing projectile deals2 to both units at first Site and next Site, excludes underground; Ward prevents first-unit damage but beam continues; cast direction cancellation retains hand/no cost;3mana/resources/threshold;JSON | Stealth/projectile immunity, oversized multi-hit and barriers pending. |

## Source evidence actually read

Printed six texts, costs and threshold: official snapshot `data/official-cards.json`. Embedded official cache parsed from `/tmp/sorcery-official-embedded-docs.json`, no remote refresh claimed.

- Grasping Ground FAQ `941d0454-cdda-4196-aa86-711bae1835ae`, updated2026-02-09: spell caster must be able to target everything dragged by allies. Native test uses Surface Avatar and Surface target; no cross-region assumption.
- Harpyon FAQ `fc932cd1-bd43-4bc7-b391-4cd69f5e01ec`, updated2026-02-09: takes flying steps as though Airborne; immobile/cannot step cannot move. Another FAQ `5461d189-d707-406e-bcfd-e7ad749abd61`, updated2026-02-09: weaker checked at initial targeting and initial resolution, not after travel starts. Source checked, latter edge not yet tested.
- Harpyon path FAQ `FWsVZ4rxgHCtjTP73mUBwm`, updated2025-12-05 points to Moving to Specific Location Codex; test selects actual native provided shortest flying route, not invented route.
- Collection Codex `78ce4090-a2e1-4893-97c0-6eaafd5c5937`, updated2026-03-25: collection is game zone; Constructed up to10 actual cards. Limited named-card special rule permits acquisition outside pool; constructed tests explicitly avoid applying that Limited exception.
- Nearby Codex `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`, updated2025-07-14: square and eight surrounding; nearby Sites may cross regional boundaries, unlike nearby minions. Supports Guards legitimate Below-caster→near-Surface-Avatar Sites, no illegal Below Avatar fixture.
- Burrowing Codex `16ed5006-40f3-4df2-8b60-6d0b13bb35a8`, updated2026-02-09: Cave Trolls legal underground; forced burrow from Surface to underground, including noBurrow targets; target test uses survivors with Burrowing.
- Target Codex `98943611-2a6f-4756-ad9b-a7d6598e9729`, updated2026-03-25: word target and caster same region; all targets declared before storyline/cost resolution. Both Grasping and Harpyon actual native planning retained.
- Ward Codex from prior reads `ae9b6774-aa8f-45c5-a424-d6d7e58014c3` updated2026-10-12 explicitly cites Grievous Insult: protects target silence/tap while independent spell draw resolves.

## Suggested root-only repairs

Guards token step must specify legal Surface instead of inheriting caster below. Harvest Festival must consume named physical constructed collection entries exactly once, with existing format semantics and summoning-tax handling; do not weaken absent collection assertion. Shared runtime owned by root. Await repair/test rerun and formal promotion authorization; candidate imports are absolute workspace paths.

## Root repair verification and requested physical-zone boundaries

After root Guards explicit Surface, mandatory named physical collection Festival, Bureau scope manifest and consume-before-tax correction: `node --test /tmp/catalog-magics-wave9-candidate.mjs` → **27/27 pass,0skip,exit0**. Original three strict assertions retained; pre-fix19/16/3 record above is historical.

Added eight actual-effect regressions:
- Festival with0/1/2 physically registered named cards: summons exactly available quantity, consumes entries, no Skip/null/false choice for mandatory named summon.
- Real Bureau of Occult Control: one explicit access payment2 for whole Festival, both cards consumed/summoned, total paid5 including spell3; JSON while permission choice pending.
- Real Mock Court with0/1/2 tax mana after spell payment: both physical entries consumed, exactly affordable quantity summons, rest banished exactly once, none incorrectly goes cemetery; paid spell3+available tax.
- Real Those Who Linger killed by native Bury with physical collection Ghoul and no remaining Mock Court tax mana: no fabricated summon; registered Ghoul leaves collection and is banished exactly once. Initial test reserved hardcoded2 for Bury (actual cost differs); corrected budget to `card('bury').cost` before concluding runtime result. No assertion weakened.

Mandatory from-collection is not Search and not May; no new house-rule search permission introduced. Bureau decline remains distinct card-imposed access decision; no contradiction with mandatory summon once access granted. Summon Codex679db7d7 explicit additional-cost failure means never enter and banish, primary read preserved from prior waves. Bureau printed text actually read: players pay2 to access collection/cemetery. Mock Court printed text actually read: Ordinary minions cost additional1 to summon.

Simultaneous Genesis ordering not directly stress-tested (only root implementation reviewed via report), nor full Listed Limited exception scenario. Remaining UI/intermediate-travel/geometry interactions above stay pending. Candidate stable for root promotion; no formal files changed by child.

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data file access to portable relative URLs: tests/catalog-magics-wave9.test.js. Latest full formal regression pending. Actual UI is recorded separately, not inferred from these native cases.

## Complete formal regression

2026-10-30T22:28:35.810Z:2627/2627 passed, zero failures/skips, session3940 exit0. Stable data/all-cards-audit/logs/wave12-full-2627*. Initial2627/2626/1 retained an incorrect old Loner collection-retention expectation; original/TAP preserved, corrected from explicit SummonCodex with stronger physical-card conservation and JSON assertions. See data/loner-summon-tax-test-correction-backup.json. Native scope is not full per-card/UI approval.
