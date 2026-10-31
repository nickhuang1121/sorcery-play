# 最後 101 張：主動效果分批覆蓋

本批實作位置 `src/final-effects.js`，整合於 `definitions.js`、`storyline.js`、`engine.js`；測試 `tests/final-effects.test.js` 透過真實 `legalActions` / `dispatch` 施放並完成選擇，不以直接呼叫 mock resolver 代替引擎測試。

目前正式註冊 **7 張**。所有卡仍為 **效果已實作／本批測試通過，完整交互部分支援**，不代表通過全官方裁定驗收。

| 卡牌 | 實作與覆蓋 | 測試證據 | 狀態／限制 |
| --- | --- | --- | --- |
| Led Astray | 指定位置、逐一選任意數敵人、選共同相鄰落點、同步一步 | 選中的敵人移動；盟友／未選敵人不動；零選；Talus 可自行走一步（非強制移動） | 3 項效果測試；多格單位／特殊鄰接與多重移動觸發尚未全面驗收 |
| Joust! | 選盟友，以盟友為來源指定相鄰敵人，各走一步互換；兩者均移動才從新位置 remote fight | 正常互換後戰鬥、死亡與墓地；Immobile 一方不動則不戰鬥；Talus 自行走一步後正常戰鬥 | 3 項效果測試；大型單位落點／移動途中替代效果未全面驗收 |
| Earthquake | 選 2×2 區域，列出 site permutation，一次搬移正常大小單位／神器／單site aura；固定不可移動地點及所有原始void；然後埋地 | site identity 同步；Bedrock固定；無Burrowing者窒息；大型不隨單site；佔任一水site不能burrow；不可把site移入void；Edge of the World不合法rearrangement全拒但仍burrow | 7 項效果測試；已核官方3 FAQ：正常大小為恰一location、多格不搬、void保持原位；全site觸發裁定仍須補驗 |
| Dhol Chants | 逐一橫置附近未橫置盟友，揭示相同數頂牌，任選合法Spellcaster免費施放一張，再自訂牌底順序；取消宣告不留額外手牌或免費權限 | 免費且不加mana；零橫置；threshold不足；取消；換Spellcaster；免Mock Court稅；免費X只能0；與 Contract交互不付life | 8 項效果／交互測試；按官方For Free，不保留額外代價（包含召喚稅）；一般免費入口由engine提供 |
| Corpse Explosion | 選2×2，從任意cemetery逐張選屍體分配每個site；不enter realm；同時傷害site上下兩層，後放逐屍體 | 兩墓地；兩層；多格累計；Ward擋整次同時damage；相同grave identity不能重用；void不分配；無Genesis | 6 項效果測試；官方FAQ及There Codex已核；真dispatch驗證Wormelow保護、Bureau拒付不選屍體，以及單次付費涵蓋整次效果 |
| Chaos Twister | 明確人工實體擲落回報：正常大小代用牌、至少一英尺、單口氣吹落，選最重疊格或棋盤外／失敗；傳送surface/void、carry items、site表面傷害 | 正常site；棋盤外；void無Voidwalk放逐；Voidwalk留存無傷；Talus免強制；失敗；多格範圍；AI不捏造結果 | 7 項效果測試；官方7 FAQ已核。**必須人工回報實體操作結果**，未宣稱數位物理模擬。choice.manual=true；app與AI由主執行者整合人工暫停 |
| Demonic Contract | human-confirmed-classification：precommit選額外4life／已核名牌祭品／Mortal；可取消；commit驗證代價、支付；搜尋受控Demon最高rarity上限、揭示、shuffle、Haystack；免費免額外代價 | 11 項費用／人工流程／registry測試；另1項Dhol免費施放交互 | **已正式註冊，需人工分類**。Gem／Rune等未知分類依實體卡人工確認，AI停下，不能自猜；本機完整UI驗收由主執行者進行 |

## 重跑

`node --test tests/final-effects.test.js`：**45 項全通過**（本批執行）。包含費用、手動分類、存檔、失效祭品、非Spell排除與正式registry；Contract不再靠測試注入definition。

完整測試由主執行者整合後重跑。未修改Firebase設定、安裝套件、推送或部署。

## Demonic Contract 後續

`beforeFinalSpellCommit(s,a,declared,A)` 在commit開始宣告／驗證／支付額外代價；`resolveFinalContract` 處理continuation與搜尋。life4、已核名牌與Mortal自動驗證；未知accord以人工工作流程補齊。已經主執行者批准移至 `finalEffectDefinitions`，executionMode為 `human-confirmed-classification`，不宣稱自動分類完整。

官方資料的subtypes沒有Coin/Egg/Gem/Goat/Rune/Treasure標記；目前明確名牌白名單：Ferryman's Coin、Angel's Egg、Devil's Egg、Koschei's Egg、Frog、Brobdingnag Bullfrog、Felbog Frog Men、Goat for Azazel、13 Treasures of Britain、Buried Treasure、Sunken Treasure；另依實際 `unitTypes` 接受Mortal。Gem與Rune，以及美術主題但非名稱分類仍未核實。不要用全神器皆可犧牲或任意字符串猜測掩蓋缺口。

## 已核規則來源（2026-10-30）

本地官方快照 `data/official-cards.json`、原始清單 `data/final-101-baseline.json`；以下動態FAQ以瀏覽器展開讀取：

- [Led Astray 卡面](https://sorcerytcg.com/cards/led_astray)。
- [Joust! 卡面](https://sorcerytcg.com/cards/joust)；[官方 AL FAQ](https://sorcerytcg.com/news/arthurian-legends-faq)：走完後從新位置戰鬥，任一未動就沒有joust。
- [Earthquake 卡面與3 FAQ](https://sorcerytcg.com/cards/earthquake)：正常大小恰一location，多格單位及aura不搬，void不可被site佔據。
- [Dhol Chants 卡面與FAQ](https://sorcerytcg.com/cards/dhol_chants)：召喚失調盟友仍可橫置，但已橫置者不能再次橫置。
- [Corpse Explosion 卡面與FAQ](https://sorcerytcg.com/cards/corpse_explosion)：任意cemetery、逐張分配、不enter realm、同時damage。
- [Chaos Twister 卡面與7 FAQ](https://sorcerytcg.com/cards/chaos_twister)：傳送、void、重疊、代用牌、攜帶、單口氣、棋盤外結果。
- [Demonic Contract 卡面與2 FAQ](https://sorcerytcg.com/cards/demonic_contract)：小字有效；稀有度Unique > Elite > Exceptional > Ordinary。
- [Step Codex](https://sorcerytcg.com/codex/0f53b70d-d13a-4982-8c16-20bb4ab1aa9d)：take a step是自行移動，可用移動能力；與push/pull/drag強制移動有別。
- [Burrowing Codex](https://sorcerytcg.com/codex/16ed5006-40f3-4df2-8b60-6d0b13bb35a8)：burrow從表面進入陸地下方；佔任一water site的多格單位不能被強制埋地。
- [There Codex](https://sorcerytcg.com/codex/91fbd78b-46d3-4497-890f-4796e4ee9310)：site的there同時包括surface與subsurface。
- [For Free Codex](https://sorcerytcg.com/codex/6c4c8d4d-e954-4018-bc7b-e32b85a6829b)：0 mana且免額外代價；threshold保留；自行選X為0。
- [Casting Spells Codex](https://sorcerytcg.com/codex/43a73161-4f77-46b1-a23a-f916223a748c)：施放時選擇受控Spellcaster。
- [Pay Life Codex](https://sorcerytcg.com/codex/b9cdd997-5404-466c-9fad-97ac278c8a59)：支付life前必須至少有該數量life。

多區域交互：Dhol Chants與Joust使用共同region判定；Dodge Roll及Wave of Eviction同樣使用region集合，Wave先保存洪水前區域再逐步比較。四個本代理模組合併執行99項測試全通過（含Corpse墓地保護、Dhol scope/free、Chimera多目標Dodge與Chaoswish虛擬複製）。

### Accord 人工核實模式（正式，human-confirmed-classification）

新增完整人工核實流程：額外代價畫面選「人工核實另一個 accord」，選我方可犧牲的永久物，再依實體卡核實 coin、egg、frog、gem、goat、rune 或 treasure，最後明確確認。Mortal soul 仍以實際動態 Mortal 類型自動判定。不能僅因卡圖畫有某物就推定類別，程式未自動證實未知 Gem／Rune。

三個人工選擇畫面皆 `manual=true`，AI 暫停等待人類，不能隨機猜分類。直到最後確認前，原施法 mana 與額外代價均未支付；取消保留原卡與永久物。最後一次性 permission 保存 uid/card/category/caster/hand，commit 重驗物件仍由我方控制且仍有 Demon；成功把 `human-physical-card-category` 寫入 `finalContractAccordAudit`。可犧牲的site用引擎真正 sacrifice API，其餘走既有犧牲／離場流程。

新增4項真dispatch驗證：Gem人工確認後犧牲且留下明確人工紀錄；取消與AI不捏造結果；敵方神器不列候選；最後確認前Demon失效則原子拒絕且不扣代價。此模式可處理實體人工判定，**不代表已獲官方完整自動分類表**，已正式可用；主執行者仍將本機完整UI驗收列待辦。
