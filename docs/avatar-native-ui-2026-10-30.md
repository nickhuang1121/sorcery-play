# Native Avatar UI audit — 2026-10-30

Target: `http://127.0.0.1:8767/`, CUA in-app browser tab 7, ordinary application UI. No state injection, script-triggered actions, localStorage edits, or test fixture were used. This is Sparkmage evidence only.

## Observed native flow

1. Selected the official Air/Sparkmage preconstructed deck, local two-player mode and seed 42 using the visible setup controls.
2. Kept both physical opening hands through the application mulligan dialogs. Sparkmage displayed the ordinary three Atlas and three Spellbook cards.
3. Selected Lone Tower in hand and clicked highlighted C1 under Sparkmage. The physical Site appeared, hand count fell 6 to 5, Sparkmage became tapped, and available mana became 2 with Air threshold 1.
4. Selected Teleport (Air threshold 2). UI displayed no legal action and the threshold-insufficient notice; it did not consume the spell.
5. Cast Spectral Stalker onto C1 through its highlighted board target. It appeared as a unit, mana became 0 and the physical hand fell to four cards.
6. Advanced ordinary local turns using actual draw and end-turn controls. Played Updraft Ridge at C2. On turn 5, Sparkmage was ready, with mana 2 and Air threshold 2.
7. Cast Teleport, choosing the visible `Spectral Stalker → C2` target. Mana became 0, Teleport left hand, and Stalker moved from C1 to C2.
8. Reloaded using the documented browser API. The saved turn, resources, four-card hand and Stalker's C2 location were preserved.

## UI defect and exact verification limit

Clicking Sparkmage's discharge in the native unit menu produced the no-legal-action toast and did not begin the expected declaration. Read-only DOM geometry showed:

- ability button rectangle: x 736.45–1263, y 494.5–536.5;
- the button center hit the battlefield `DIV.cell` with text `D1 VOID`, not the button;
- the popup's upper half was clipped by the bottom HUD's `overflow:hidden`.

The shared conditional-overflow CSS correction is present in `styles/game.css`. However, after a native reload, the actual served page's stylesheet collection still lacked `.hud-bottom:has(.choice-pop)` and computed HUD overflow remained `hidden`. A native hard-reload hotkey did not navigate or change the AX tree. The served asset must be refreshed or a confirmed-current server supplied before claiming that the native discharge click is fixed.

CUA screenshots were captured at the threshold-denial and clipped-popup stages. They are tool-visible observations, not a saved repository screenshot artifact. The source/damage engine has separate actual dispatch tests; those do not substitute for this blocked UI click.

The browser initially recovered successfully after earlier connection failures. Other Avatar rows remain UI-unreviewed unless independently exercised; no category-wide UI success is inferred.
