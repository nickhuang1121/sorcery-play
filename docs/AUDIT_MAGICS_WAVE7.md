# Magics Wave7 — candidate, 2026-10-30

Scope: Four Fat Frogs, Freeze, Frost Nova, Geyser, Ghostfire, Gift of the Frog. Only /tmp candidate artifacts changed. No formal test, source, audit JSON, or UI changes. Native legalActions/dispatch with cold JSON checkpoints. UI remains unverified separately.

Command: `node --test /tmp/catalog-magics-wave7-candidate.mjs`
Latest result: **22 tests, 18 pass, 4 fail, 0 skip, exit 1**. Four strict runtime failures retained. Initial Ghostfire test incorrectly treated grave index 0 as false; corrected to `grave!==undefined` without changing effects/assertions.

## Per-card coverage

| Card | Native verified evidence | Red / remaining |
|---|---|---|
| Four Fat Frogs | Allied Site resolution selection survives JSON; four distinct controlled Frog tokens; printed 4 mana; insufficient mana/threshold rejected | Legal submerged Sea Witch selecting allied land Site produces 0 instead of four Surface Frogs. Generic summon inherits caster below layer. Site includes Surface; land Frog has no Burrowing. Summon should permit legal location selection or explicitly correct printed Site summoning to Surface, rather than inheriting underwater caster region. Mock Court extra-tax case not added in this batch. |
| Freeze | Nearby/same-region targeting, excludes far/below; real disable strips marks; printed 1 mana; lasts opponent turn, expires next own start after JSON; insufficient mana/threshold | Friendly Talus cannot be disabled, but its Ward is nevertheless cleared. Friendly spell targeting itself does not break Ward. Gate disabled consequences on actual disable eligibility. |
| Frost Nova | Untargeted nearby enemy/own/far distinction; removes real disabled victim marks; printed 4 mana; duration through opponent turn/next-own-start JSON; insufficient mana/threshold | Untargeted Talus cannot be disabled, receives no positive damage, yet Ward cleared. Do not clear marks when disable is prevented. |
| Geyser | Cast-time Site target, JSON draw selection, Airborne to ordinary present minion, real Atlas draw, printed 2 mana; enemy Site Ward prevents dependent effects but draw resolves; insufficient mana/threshold | Giant anchored 11 occupies 12 but target Site12 does not grant Airborne. Use actual occupied Site/body shapes rather than u.at. FAQ late-arrival and end-turn expiry not yet directly tested. |
| Ghostfire | Hand projectile damage1 then cemetery; actual grave index0 recast damages1 and banishes physical spell; total mana2; hand and grave cancel before payment, grave UID preserved through JSON; insufficient mana/threshold | Enemy cemetery and grave-specific resource denial not directly covered; no claim all interactions verified. |
| Gift of the Frog | Allied-only selection; Frog creation at chosen minion; printed2 mana; real spell draw; legitimate submerged Sea Witch/Kelpie produces below Frog after JSON; insufficient mana/threshold | Oversized selected minion actual-location choice not yet covered; no claim anchor-only behavior correct. |

## Primary source evidence

Printed card texts/costs read from project `data/official-cards.json` (official snapshot). Geyser public card page read successfully: https://sorcerytcg.com/cards/geyser . Other five fresh public pages were unavailable to web reader; do not represent them as refreshed. Cached official embedded documents `/tmp/sorcery-official-embedded-docs.json` read by JSON parsing, including:

- Disabled `08fff20b-76c1-45c3-b13f-989202cdacf0`, updated 2026-10-12: while disabled loses Stealth and Ward; disabled is not an ability.
- Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`, updated 2026-10-12: own targeting permitted; disabled removes Ward; explicit Geyser example protects dependent Airborne but independent effects resolve.
- Summon `679db7d7-3cb3-4655-b84b-53c4bd6ed637`, updated 2026-10-12: printed summon location governs; illegal location/cannot pay mandatory taxes means banished, never enters. This does not justify forcing all tokens into caster region when printed Site includes a legal Surface.
- Oversized Units `7f57fe26-eac3-45a4-b449-994fef47d872`, updated 2026-10-12: occupies every physical location, size retained even disabled.
- Geyser FAQ `5228aabc-ab47-4792-8b29-e1a392869fb0`, updated 2026-02-09: later entrants do not gain Airborne (source checked in preceding read/design phase; follow-up effect case still pending).
- Sea Witch printed Spellcaster/Submerge used for legitimate below caster. No illegal below-Avatar fixture.
- Iron Man Talus printed cannot be disabled or moved by force. Thus its zero-damage untargeted and friendly-targeted Ward must remain.

Runtime repair remains root responsibility. Formal promotion deliberately pending root authorization; candidate imports absolute workspace paths and will need rewritten relative imports when promoted. No server launched and no simulation restarted.

## Promoted stable candidate

Root promoted this candidate to tests/catalog-magics-wave7.test.js with relative imports and portable data URL; assertions unchanged. Source fixes have native subset evidence, full formal regression is pending. Representative cases do not establish full card UI or all interactions.

## Complete formal regression

2026-10-30T21:48:22.719Z: full2450/2450 passed, zero failures/skips, session36138 exit0. Stable TAP/validation under data/all-cards-audit/logs/wave10-full-2450*. This confirms formal regressions only, not full per-card browser/rule coverage or every interaction.
