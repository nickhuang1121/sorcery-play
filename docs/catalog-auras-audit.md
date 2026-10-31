# 全卡庫 Aura 審查

範圍為 `data/all-cards-audit/auras.json` 的 38 張印刷 Aura，逐張保留卡文、費用、門檻、實作路徑、規則來源及測試狀態。沒有改其他分類或全庫完成統計。印刷資料仍取自 `data/official-cards.json`，沒有把測試結果寫回官方卡文。

## 來源與分類方法

- [目前官方 Rulebook](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view)：October 2026、38 頁，取得版本修改時間 `2026-10-12T20:32:30Z`；相關印刷頁 19（Aura 施放）、27（能力）、29（多位置）、31（Storyline）、35（詞彙）。
- [Aura Codex](https://sorcerytcg.com/codex/1c5c02a4-586e-4bfd-99ce-11e9230ed140)：更新 `2026-03-25T19:18:50Z`；一般 Aura 佔 Surface／Void 的 2×2 區域，非 Minion Aura 移動可跨 Surface／Void，但這不授權任意下潛。
- [Here Codex](https://sorcerytcg.com/codex/8e4684e4-479b-45d1-a75b-a41568ea6e6f)：更新 `2026-09-02T01:46:24Z`；here 是來源實際佔據的 locations，不是忽略 layer 的同一格。Aura 一般影響四個 Surface locations。
- [Silenced Codex](https://sorcerytcg.com/codex/ad3816bb-9097-42bb-9231-4d9311f4a7e9)：更新 `2026-10-12T17:46:19Z`；移除印刷能力，保留外來能力及既有 Ward／Stealth。
- [Disabled Codex](https://sorcerytcg.com/codex/08fff20b-76c1-45c3-b13f-989202cdacf0)：更新 `2026-10-12T20:18:52Z`；disabled Aura 沒有能力。

已實際閱讀上述本機官方全文快取及每一張匹配的 FAQ 問答，不只是搜到標題／ID。每張卡的 FAQ ID／版本保留於分類 JSON。沒有匹配 FAQ 的卡，僅表示此份公開快取沒有對應條目，不代表未來或其他官方資料絕無裁定。

`reviewStatus` 不把一般 cast 測試當成所有印刷效果均已完成驗證。各個 dimension 分開保留 code review、真測與尚未驗證；實際瀏覽器 UI 因 CUA 不可用，一律 unreviewed。

## 已完成的真實測試批次

正式檔案 `tests/catalog-auras.test.js` 第二批共 **69／69**：

- 38 張分別從手牌真施放、檢查精確支付費用、實體離開手牌及 JSON 恢復。Wall 的付款前方位選擇亦經保存續接。
- 11 項第一批邊界：無效來源的 Abundance／Cursed Iron／五種召喚許可、Cursed Iron Surface／Below、Entangle Void、Homecoming Below、Midsummer Below。
- 第二批再加入正常召喚與力量、Homecoming tap 成本、Midsummer／Entangle 效果，以及無效來源的攻擊保護、入場觸發、逐回合傷害、天氣與 Falling Star 計數。

來源修正集中在 `src/catalog-auras.js` 的 active／here／affected-Site helpers 及主引擎入口：失去來源能力後停止套用；here 比較真實 layer；「佔據受影響 Site」仍涵蓋兩個 layer，但排除 Void。觸發的 active 判斷在排入事件時處理，沒有於已開始的結算中任意吞掉之前合法產生的事件。

第一批受影響九套 **340／340** 通過：`/tmp/catalog-auras-affected-cross.log`。
第二批相同九套 **360／360** 通過：`/tmp/catalog-auras-second-cross.log`。確切指令包含 catalog-auras、final-animation、cannot-disable-boundaries、final-malleus、final-passives、cemetery-access、final-geometry、final-waves、final-flood；這是共用入口回歸，不等同其他卡的逐張審查完成。

## 已確認、待共用修補驗證的下一批

影子測試保留於 `/tmp/catalog-auras-shadow.test.mjs`，沒有將已知預期失敗放進正式測試。

1. Atlantean Fate 的 Genesis 把受影響的 Ordinary **land** 上 Brown Bears 也移到 Below 導致死亡；Submerge 不能因此變成 Burrow。FAQ `ygoDG8fb7HS97qCW69rpTR`（2026-07-12）允許 Ordinary **water** Site 的 Genesis 下潛，沒有授權 land 下潛。
2. Year of the Blaze 的 here 錯殺 Below 的 Burrowing Minion；應以 Aura 的真實 locations 判斷。
3. Great Drowning 的 everything-atop 忽略了四個實際佔格全在新 flooded Rubble 上的非 Unit Aura。

重現紀錄：`/tmp/catalog-auras-third-confirmed.log`。待 root 套用 `/tmp/catalog-auras-completion.patch` 後，才重跑並把通過的案例移入正式檔。

候選 resolver `src/catalog-aura-submerge.js` 復用既有 full-body 水域與強制移動合法性。Active Moeba 使用可保存的單一 pseudopod 選擇；它不是普通全身改 layer，亦不預演隨機結果或未來玩家選擇。非 Unit Aura 使用實際 inside cells；Wall 是兩格，不能硬當成 2×2 四格。

仍需繼續擴充各張卡的完整效果／邊界：例如三回合倒數與落星 Genesis 時機、來源消失／再進場、完整牆體跨越與下潛後區域、成功攻擊才 dispel 等。一般施放成功本身不能排除這些問題。
