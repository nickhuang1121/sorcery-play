# 全卡庫規則稽核覆蓋

更新：2026-10-30T23:47:20.031Z。共 1100 個原始條目，含 7 個 token；runtime複本不重複計。

這份文件區分尚未檢查、程式碼審查、逐卡效果測試及實際UI驗證；不是「全部卡牌已驗證」。

完整驗收：0。來源：October 2026官方規則書、216項Codex及753項FAQ；每列另記實際核對依據。

| 類別 | 條目 | 目前狀態 | 逐卡證據 |
| --- | ---: | --- | --- |
| Minion | 489 | basic-tested-awaiting-effect-tests: 24；partially-tested: 94；tested-representative-awaiting-ui-and-source-refresh: 75；tested-representative-rule-clarification-required: 1；unreviewed: 295 | [minions.json](../data/all-cards-audit/minions.json) |
| Site | 208 | code-reviewed-awaiting-tests: 116；partially-tested: 92 | [sites.json](../data/all-cards-audit/sites.json) |
| Magic | 202 | code-reviewed-awaiting-tests: 12；partially-tested: 76；tested-awaiting-ui: 5；tested-representative-awaiting-ui-and-source-refresh: 9；unreviewed: 100 | [magics.json](../data/all-cards-audit/magics.json) |
| Artifact | 129 | code-reviewed-awaiting-tests: 30；partially-tested: 92；unreviewed: 7 | [artifacts.json](../data/all-cards-audit/artifacts.json) |
| Aura | 38 | partially-tested: 38 | [auras.json](../data/all-cards-audit/auras.json) |
| Avatar | 34 | partially-tested: 1；tested-awaiting-ui: 33 | [avatars.json](../data/all-cards-audit/avatars.json) |

所有維度及具體finding保存在 [彙總JSON](../data/all-cards-rules-audit-progress.json)。未完成維度須保留；特別是實際瀏覽器UI不可由載入成功、預組模擬或helper測試代替。

原101張的核心實作統計另見 [FINAL_101_PROGRESS](FINAL_101_PROGRESS.md)，兩者驗收範圍不同。尚需裁定的五個場景見 [玩家說明](PLAYER_RULE_DECISIONS.md)。
