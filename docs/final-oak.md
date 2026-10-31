# Blasted Oak

已以 `finalPassivePassives.blasted_oak` 正式註冊。`tests/final-passives.test.js` 的 **17 項 Oak 真實 dispatcher 測試通過**，包含真正手牌施放；沒有只靠可選旗標或空效果驗收。

## 效果與操作

對真正會 target 的法術與非基本能力，在原本全部合法候選中依序要求：Oak 本身、它的 site／location、在該 site／location 的其他合法對象。選項先完成本來的距離、類型、力量、區域、已選排除與組合可行性檢查，再套優先序；因此不會把本來非法的 Oak 或過強的 Harpy 目標變成合法。

介面直接保留符合最高優先序的合法選項；若有多個同階候選由玩家選，付款前仍能取消。Chain Lightning 需先指定其能負擔的 Oak-site 合格新單位，不能先按 commit 跳過；不虛增 mana，也不在尚未確認前扣款。普通 choose、基本攻擊與隨機結果不被當成 target。Iron Shackles 的 target conjure 受限，普通神器施放模式保留。

## 實作入口

- `src/selector-semantics.js` 明確標註 Magic／能力 selector 的來源、target／choose 與時機；涵蓋全部目前 202 張可玩 Magic 的靜態清單，另列 76 張提及 target 的非 Magic 卡片，只有實際指定目標的操作才啟用。
- `restrictFinalOakChoice`：在最終 choice 上限制，適用一般 Storyline、額外／連續目標、神器能力及 saved-game restore。
- `restrictFinalLegacyTargets`：舊式 Magic action 的真正 unit／site／location，使用實際 caster layer。
- `restrictFinalOakArtifactActions`：Iron Shackles 的 target mode，按同 caster／同出牌來源分組。
- `src/magic-declarations.js`：Duel、Harpyon Urge、Trial by Water、Grasping Ground、Meteor 的完整付款前宣告，以及 Orb keep/new targets 的整組可行性。
- `finalPrintedSourceActive`／`finalPrintedSources`：按真正 printed/gained source record 判斷，UID 去重，支援不是 Artifact body 的 gained Oak；沉默不抹除外來能力，失能則禁用。Aura 以其實際覆蓋區而非僅 anchor；同 site 條款可跨 surface／subsurface。

## 官方證據

[Oak 卡頁](https://sorcerytcg.com/cards/blasted_oak) 的全部 5 FAQ 已在瀏覽器展開；並核對官方公開 SSR FAQ 快取。五筆 `_updatedAt` 均為 `2025-02-20T23:04:25Z`：

- `FWsVZ4rxgHCtjTP73mTsBS`：真正 target 以卡文 target 用字辨識。
- `ygoDG8fb7HS97qCW69hqZt`：隨機單位結果不因此變成 target，真正指定的位置仍受限制。
- `ygoDG8fb7HS97qCW69hqzv`：Kythera 的隨機結果選擇不受 Oak 變更。
- `ygoDG8fb7HS97qCW69hrPx`：召喚位置不是 target。
- `ygoDG8fb7HS97qCW69hrcy`：Chain Lightning 必須使用可支付的額外 mana，先涵蓋 Oak site 的合法單位。

[Casting Magics](https://sorcerytcg.com/codex/43a73161-4f77-46b1-a23a-f916223a748c?sub=15e240391b4d) 區分直接 Magic targets、普通 ally choice 及 Joust 的 ally targets；[Its Site](https://sorcerytcg.com/codex/a4bfc6cd-7f83-437e-8ae7-b2409fa9ec89) 支持以 site 而非只同層 location 判斷。Duel 等 target 名詞與 Joust／Shatter 的 ally targets 動詞差別，是依通則與卡文明示的推論，沒有偽稱逐張額外 FAQ。

## 驗證與限制

17 項真測包含：付款前取消、普通 choose、Chain 全目標與預算／禁止 early commit、Meteor 完整不相鄰落點、Dragon 非基本能力、legacy Zap／Teleport、Iron Shackles、Joust、Harpy 非法候選、Catapult crew／grave／location、地下 Oak 與地上同 site、Aura 非 anchor、silenced gained source、production hand-cast／強制自身 Displace、基本攻擊不受限、Raise Dead 召喚位置與 Kythera 隨機結果不受限。

沒有列出的未知新 selector 不會被自動猜成 target；新增帶 target 的卡片仍須同步維護靜態契約與相應測試。這是擴充契約，不是目前已知核心效果的未完成項。全專案完整測試及模擬由主進度審計記錄。Book 的 single 語義與部分晚期 Ward 判定另列 partial，沒有阻擋 Oak 正式註冊。
