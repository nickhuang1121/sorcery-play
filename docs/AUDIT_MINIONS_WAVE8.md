# 第八批 Minion 原生規則稽核

2026-10-30 UTC。範圍：Giant Killer、Giant Shark、Gibbous Nightgaunts、Gloam Toads、Gnarled Wendigo、Gneissgnath Gnomes。新增檔案只有 `tests/catalog-minions-wave8.test.js` 與本文件；未修改共用runtime、卡牌JSON、官方快照或既有測試。

Root以最新完整2211/2211（21:06:44Z）為接續基準，明確授權本批直接寫入專屬正式檔。正式命令 `node --test tests/catalog-minions-wave8.test.js`，最新 **21/21通過、0失敗、0跳過**，session19250 exit0，2026-10-30T21:13:04Z讀取完成，輸出 `/tmp/audit-minions-wave8.log`。這是本批子集，不能代替root最新完整回歸、全遊戲模擬或UI。

## 六張共同基本施放覆蓋

每張都有獨立native hand cast、mana不足時無cast action、每個印刷元素threshold不足時無cast action、實扣印刷cost、離手、真unit建立、owner/controller、power、cold JSON恢復。Giant Shark基礎施放放在water Site12；Wendigo基礎例明確選confirm且不犧牲，以印刷6cost完成，沒有把尚待付款choice當成功。

## 逐卡實際效果與限制

| 卡牌 | 已驗原生效果／操作及邊界 | 尚未涵蓋 |
| --- | --- | --- |
| Giant Killer | 真Genesis提供nearby Giant；排除高power非Giant Cyclops、far Giant、below同square Giant；保存choice後選敵Mountain Giant，真死入敵墓；另選有Ward敵Giant時只破Ward、不殺，Killer仍正常進場且付3 | 不能被指定/其他免死替代、來源控制變動/大型來源、更多UI流程 |
| Giant Shark | 真hand cast、剛出生仍對新召allied unit觸發forced move+fight、本人不tap；敵Airborne且Stealth unit真移入water仍被fight；同Site surface→below不觸發；真underwater召Shark後，新surface unit進相鄰Site，提供最短兩步（水平+垂直）路徑，JSON選先below13再surface13，真移動及fight；另真cast Silence於13（Shark12當時未silenced），目標14新召後Shark穿13、到14變silenced仍完成fight；嚴格傷害等於受體印刷power、受體真死 | 多Shark同時觸發/多controller排序、移動路徑中其他reaction、disabled中斷、更多大型單位/region/受保護與UI。並未宣稱所有路徑組合窮盡 |
| Gibbous Nightgaunts | 真Voidwalk hand cast到void7後JSON存活，Airborne與Voidwalk皆在；嚴格禁止從void7起步斜走11；真正交走surface12，完成己end/敵draw/end/己draw自然刷新後，才能以Airborne從surface12斜走void6，3power存活 | 直接召喚其他void、更多戰鬥/攔截/射程/多部位及UI |
| Gloam Toads | 成熟後Immobile沒有move actions，但可真tap特殊能力；只提供同square或正交unit、不含斜角；拖敵bear13→12後choice JSON選strike，6power真殺敵且本人damage0（不是fight不受反擊）；same-square unit亦可拖，decline可選strike後敵存活damage0 | 無法被force移動/跨layer/不合法arrival、Ward與其他replacement、更多抵達時序及UI |
| Gnarled Wendigo | 可用potential sacrifice宣告原生cast（只有2mana）；只提供己方exact summoning location、同layer minions，排除enemy/other square/below；選Warded donor後尚不付款/仍活/保Ward；JSON後選第二donor，confirm才真犧牲兩者；Ward不救sacrifice；印刷6−4實付2、Wendigo真進12；另選donor後cancel，手牌/生命體/Ward/mana全部保留 | sacrifice的複雜Deathrite/墓地替代/多個成本來源、異常回復、更多UI。此批不宣稱整個付款內部每個storyline window都驗了 |
| Gneissgnath Gnomes | 本回合剛召在己end確實可選Burrow（非tap/不受summoning sickness限制），保存choice選true後surface→below且Burrowing存活，正常輪到對手；另decline不移動；water Surface end無可執行Burrow選項（只有skip），完成skip後仍surface且活 | 已地下/大型或gained ability、多個end triggers、持續地形變更及UI |

以上是逐卡代表性effect測試，不是只有registry/helper通過；也不等同全卡完整玩法/UI驗收。六張無新確認runtime缺陷。

## 官方依據與版本

卡文/數值採repository `data/official-cards.json` 原有官方快照，未改。2026-10-30本輪新讀官方 [Giant Shark](https://sorcerytcg.com/cards/giant_shark) 成功，確認Submerge/Waterbound與進Site/跨Site追獵fight文字。其餘五張官方同名URL工具inaccessible，未標記新頁已核。

採現有官方October2026 Rulebook與`data/final-101-official-source-index.json` metadata。本批以JSON解析 `/tmp/sorcery-official-embedded-docs.json` 實際讀取相關FAQ及Codex，沒有憑卡名猜規則：

- Shark會fight Airborne/Stealth（不是attack）：FAQ `FWsVZ4rxgHCtjTP73mUBcA`，2025-02-20T23:04:25Z。
- Shark會fight己方unit：`eXfZjLHocReFQIApZdIFzk`，2025-02-20T23:04:25Z。
- 進Site包含summon：`eXfZjLHocReFQIApZdIGB2`，同日期。
- 同Site的surface/subsurface移動不觸發：`eXfZjLHocReFQIApZdIGHo`，同日期。
- Shark最短路徑可含surface/underwater換層：`ygoDG8fb7HS97qCW69iL1E`，同日期。
- Shark通過Silence仍繼續已在Storyline的movement/fight：`ygoDG8fb7HS97qCW69iLMv`，同日期。
- Shark路徑一般規則：`FWsVZ4rxgHCtjTP73mUBwm`，更新2025-12-05T17:31:08Z，指向 [Moving to a Specific Location Via a Special Ability or Magic](https://sorcerytcg.com/codex/248f42b3-ce6e-422d-9c27-c3072f192811?sub=facd143fe69d)。本批實測兩步最短並確認選項每條皆兩步，未冒稱所有特殊路徑均已驗。
- Shark與Genesis storyline交互FAQ `eXfZjLHocReFQIApZdIHA0`，更新2025-07-06T06:41:55Z：已查來源，尚未在本批增加對方Genesis與Shark多觸發排序case，保留限制。
- Airborne Codex `c7c182e2-629c-4e65-a9a0-97feff983a3d`，更新2025-07-10T01:24:28Z：僅起點surface才可斜走，void/underground/underwater起點不能用Airborne斜走。
- Voidwalk Codex `b0d18273-8870-4c0b-a8dd-1bda6e75e6bf`，更新2025-06-30T04:06:17Z：可在void召喚/生存，site與void間可step。本批不把召void7的單一案例誤稱已查所有void召喚位置。
- Immobile Codex `7db6da14-a5eb-4dcf-8b3b-4ba4e3ecfbeb`：不能take steps，不妨礙原地特殊能力及被迫移動。
- Burrowing Codex `16ed5006-40f3-4df2-8b60-6d0b13bb35a8`，更新2026-02-09T18:42:32Z：forced Burrow在water失敗，不憑空賦予Burrowing。Gnomes本來有印刷Burrowing，在land地下存活。
- Adjacent `1d3363e4-3b12-46fb-99d9-f4319967f484`、Nearby `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`：含目前square，普通minion/unit/location範圍尊重region。Site/Square範圍與此不同。
- Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`（更新2026-10-12）：敵特殊能力指定時破Ward替代效果。
- Sacrifice `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`，更新2025-12-21T07:10:37Z：只有己控制Realm物件可付犧牲，Ward等不救sacrifice。

## 初稿測例修正紀錄

1. 起初誤要求Gibbous從Void起點斜走，讀Airborne Codex後確認不可；已改成更有區辨力的負向Void起步斜走拒絕及自然turn刷新後正向Surface起步斜走進Void。沒有改runtime去迎合錯誤假設。
2. Gnomes在water end會開只有skip的optional menu。沒有可執行Burrow、也沒有錯移動，因此不是已確認規則缺陷；測試保留「每個選項均null」與最終surface存活，而非要求UI完全不顯示menu。
3. Shark只有一條最短路徑時既有引擎會自動結算，不必多選一次；多路徑案例明確驗choice+JSON，Silence案例嚴格驗最終移動/傷害/死亡，不把多餘選單當規則必要條件。

沒有刪除/放寬真紅斷言。本批無新真紅；若root後續整合出現回歸，須保留fail並診斷。

實際UI由root在既有5500服務驗收，本分工沒有操作UI、啟動/重試server、推送部署、修改憑證或向睡覺使用者發問/發進度。正式test與本文件現停止寫入，供root納入完整回歸及逐卡ledger。
