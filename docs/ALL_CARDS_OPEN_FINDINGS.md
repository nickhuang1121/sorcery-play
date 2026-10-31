# 全卡庫已知待辦與失敗清單

更新：2026-10-30T22:33:19.886Z。正式全套通過不代表以下項目已解決，也不代表未查卡牌沒有缺陷。

## 已記錄但尚未關閉的逐卡發現

- **Book of Blessings**：known-rule-blocker-original101。Single allied Minion choice over staged Magic（data/all-cards-audit/artifacts.json）
- **Flame of the First Ones**：rule-clarification-required。Uncontrolled Flame: who receives life benefit of you after last bearer drops it? Owner orders trigger but beneficiary unspecified in inspected sources.（data/all-cards-audit/artifacts.json）
- **Bane of Aventis**：rule-clarification-required。（data/all-cards-audit/minions.json）

## 其他重現與操作限制

- **Empty deck draw**：fixed-formal-regression-passed。已接入正式流程並通過1806項完整回歸；具體案例見tests/catalog-draw.test.js或tests/catalog-auras.test.js，未宣稱全卡UI完成。 證據：tools/pending-audit/build-catalog-empty-draw-patch.py、src/engine.js draw、data/all-cards-audit/avatars.json、data/final-101-validation.json。
- **Wall of Ice below**：fixed-formal-regression-passed。已接入正式流程並通過1806項完整回歸；具體案例見tests/catalog-draw.test.js或tests/catalog-auras.test.js，未宣稱全卡UI完成。 證據：tools/pending-audit/catalog-auras-walls.log、data/final-101-validation.json。
- **Mariners Curse below entry**：fixed-formal-regression-passed。正式1820/1820已涵蓋此修復與來源／存檔／獨立disabled邊界，實際UI仍未驗。 證據：tools/pending-audit/catalog-aura-mariner-boundaries.log、docs/CATALOG_MARINER_BOUND_SPIRIT.md、data/all-cards-audit/logs/mariner-bound-214.log。
- **Mariners Curse mixed oversized body**：fixed-formal-regression-passed。正式1820/1820已涵蓋此修復與來源／存檔／獨立disabled邊界，實際UI仍未驗。 證據：tools/pending-audit/catalog-aura-mariner-boundaries.log、docs/CATALOG_MARINER_BOUND_SPIRIT.md、data/all-cards-audit/logs/mariner-bound-214.log。
- **Bound Spirit / Eerie Coral**：fixed-formal-regression-passed。正式1820/1820已涵蓋此修復與來源／存檔／獨立disabled邊界，實際UI仍未驗。 證據：src/engine.js refreshContinuous needsSpellcaster、docs/FINAL_101_HANDOFF.md、docs/CATALOG_MARINER_BOUND_SPIRIT.md、data/all-cards-audit/logs/mariner-bound-214.log。
- **Sparkmage served UI**：fixed-native-ui-regression-verified。Existing5500 service used. Actual hit-test reproduced landscape selector overriding the old fix; specific landscape :has rule+popover2 reload now opens native activation, cancellation untaps and confirmation taps Avatar at C1 without moving. 證據：data/ui-5500-validation.json、docs/UI_5500_AUDIT.md。
- **Preconstructed matches session 52118**：historical-incomplete-superseded。舊12/16不沿用；主對話確認停止後授權的新run已16/16、2313actions、exit0、來源不變。Wave2後修改須另驗。 證據：data/final-101-current-games-validation.json、data/smoke-game-progress.json、data/smoke-game-results.json。

## 獨立規則裁定

五項玩家裁定見 [PLAYER_RULE_DECISIONS.md](PLAYER_RULE_DECISIONS.md)；Bane／Monks等全庫新增疑義見 [ALL_CARDS_RULE_CLARIFICATIONS.md](ALL_CARDS_RULE_CLARIFICATIONS.md)。不採未經確認的家規。
