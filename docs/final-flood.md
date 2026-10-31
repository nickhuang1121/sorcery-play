# The Flood

實作：`src/final-flood.js`。共用整合已由主代理套用，正式 registry 可施放，沒有在測試注入 definition。`tests/final-flood.test.js` **26/26 真 dispatch 通過**；Flood、Book context、geometry、animation、effects、waves 六組 production cross **238/238 通過**。尚未做實際瀏覽器互動驗收，不宣稱全卡所有交互 fully verified。

## 原先虛空問題的直接同措辭來源

[Great Old One](https://sorcerytcg.com/cards/great_old_one) FAQ `ygoDG8fb7HS97qCW69kS5d`，更新 2025-02-20T23:04:25Z，直接解釋與 The Flood 完全相同的「永久洪水、包含虛空」子句：現有地點（含 Rubble）及之後進場地點，整場都被洪水覆蓋。這建立全域持續效果，不創造虛擬 Site 或虛空的 underwater location。

[Void](https://sorcerytcg.com/codex/8371e6b3-dee7-4881-aa6b-063781c97be3)（2025-07-06）仍明定空虛空只有一個 location、沒有上下層。空格保持 `board[at] === null`；在該處的 Voidwalker 不會被放入虛構下層。之後 Site 出現才受到全域 Flooded 效果。

`registerPermanentRealmFlood` 同時供 Great Old One 的既有 `completionFloodRealm` 使用，保留永久、來源離場後仍有效及同一套 timestamp 行為。

## 官方四項例外選擇裁定

[The Flood](https://sorcerytcg.com/cards/the_flood)：

| FAQ ID | 更新時間 | 本實作依據 |
| --- | --- | --- |
| `af445732-63de-4758-b12b-1de74ffb5bf8` | 2026-02-09T18:44:45Z | 所有例外都由施法者的操控者選擇，包含對方僕從 |
| `97293e6c-61ff-46ad-a096-bde43a674254` | 2026-02-09T18:38:47Z | 多型別同時全數有效，不能挑其中一型別來規避與其他已保留僕從的衝突 |
| `937cc4a1-9c28-480b-a030-77e12ea97f9c` | 2026-02-09T18:38:51Z | Caravan 與其他有型別僕從衝突，不能同時保留 |
| `c27990ac-e8f6-4d42-8837-ede26cf204e0` | 2026-02-09T18:44:43Z | 沒有僕從型別的僕從不能作例外 |

選項以引擎 contextual `unitTypes` 為準，包含 Corruptor 或借用能力造成的型別；不把 Evil／Royalty umbrella 當作 minion type。選中的型別集合必須兩兩不相交。因卡文沒有「可省略」措辭，不能提早以空集合結束；選到沒有其他相容型別候選後，顯示完整確認或重選。Caravan 可以選到只有自己；多型別相互排斥的局面以實際可組成的最大化（不可再加入候選）例外集合處理，不捏造能覆蓋所有印刷型別的組合。

型別匹配再與共享 `allMinionCreatureTypes` 的 17 種 creature types 取交集，防止把 Automaton 這種 artifact subtype 當成可保留的 creature type。這是分類通則與目前官方卡目錄的合併解讀，主代理已接受；不是聲稱 The Flood 專屬 FAQ 直接回答 Automaton。[Subtypes](https://sorcerytcg.com/codex/951f9481-d26e-4c81-9a4f-168863efc22e)（`_rev=OVwv9CvZAhvcLZb6pGCa9a`，2025-07-10T00:51:07Z）區分 Artifact 的 Automaton／Monument；[Artifact](https://sorcerytcg.com/codex/169db6b5-aae8-407e-ae7f-07206707a5eb?sub=b75ec26e94ea)（`_rev=OVwv9CvZAhvcLZb6pUEHTW`，2025-07-11T17:47:39Z）及 [Cards with Multiple Types](https://sorcerytcg.com/codex/6ff828a9-0337-42cd-bfa7-8605235a4dd0)（`_rev=Y3ZKz7xA6Z0oNIVqRM94Q1`，2025-07-10T03:27:19Z）確認 Automaton 同時是 Minion／Artifact。17 種的數量並非 Codex 直接列舉，而是本專案 `data/official-cards.json` 中原始 `engine.type=Minion`、排除 Caravan ability 的 typeline distinct 集合；此快照 SHA-256 為 `4f40372d28309edafe679e2814dc15bd78bdae59ce18ea86e387d60b829a0bf1`。原生 Automaton 無 creature type 時不可選為例外，但有取得 creature type 時依實際型別參與。真測分開驗證 Crave Golem 不能豁免而淹死，以及 Talus 不能豁免、僅因 force immunity 留在地表。

每次宣告及最終結算都重驗僕從仍在場、型別非空、沒有重複型別。選擇及重設階段不提前移動或殺死卡牌。Book 的選擇集合以最後確認的例外集合為準，而非被重設的暫存點選。

## 洪水、下潛與時間順序

[Storyline](https://sorcerytcg.com/codex/081fc13c-49fb-4893-90c1-1ba5324e6241?sub=1c214da0a0a8)（2026-05-26）的分事件理由是卡牌進出、移動及明示逐一文字；改變地點 affinity 本身不是分事件理由。因此全域洪水與緊接的整批下潛在同一 apply frame 完成，再讓普通 state-based／進入／死亡事件結算。不能先把原地下僕從因水域變化殺死，再讓玩家選例外。

[Flooded](https://sorcerytcg.com/codex/610226cf-24be-4d6b-885f-b466197672c5)（2025-06-30）只添加至少一個水 affinity，保留其他印刷 affinity；它是 ability，失去地點能力亦失去此能力。不可修改的 Bedrock 不會變為水地點。[Layer System](https://sorcerytcg.com/codex/aa624e74-7c3e-4622-8471-03e05b576c52?sub=f3a79f1ec81e)（2026-08-04）明示 Flood 與 Drought 依 timestamp，後來套用者覆蓋前者。全域洪水有固定 stamp，之後進場的較新 Drought 仍可使其區域乾涸；不每回合重新替全域洪水刷新 stamp。

[Submerge](https://sorcerytcg.com/codex/aaa76e05-0cbc-4114-ad1c-411eeec89eea)（2026-02-09）明定強制從地表到水下，不需先有 Submerge keyword；沒有該 keyword 的僕從其後依普通安全規則死亡。任何部分佔陸地便不能整體強制下潛。既有 Ward 不防止未指定的下潛，也不等同防止窒息死亡。

[Characteristics](https://sorcerytcg.com/codex/30561063-e0e1-41f7-9ab2-903475629dde)（2026-07-20）：Avatar 只能進入 surface，故不下潛；Site 自身不是移到自己地下的物件。Artifact 可下潛，若其 bearer 被保留或是 Avatar，神器仍需獨立下潛並掉落。Aura 的地表／虛空是預設位置而非 only 限制，The Flood 的明示全部下潛可以移動 Aura，前提實際所有部位都可進入水下；普通非 Minion Aura 沒有僕從窒息死亡規則。動畫 Aura 依同一實體 unit 處理一次，不重複移動。

## 大型與擬足

普通 oversized 同方向整體移動，任一部位無法下潛則整體失敗；已混合上下層而失去擬足能力的 Moeba 不能把地下部位再推到不存在的第三層。仍有擬足移動能力者使用 `geometryForcedDiveOptions`／`applyGeometryForcedDive`：操控者選擇一個實際地表擬足，新增同格水下部位，保留舊位置；其餘虛空部位不憑空下移。選定部位仍需通過強制移動及 Driftwood Marrows 來源保護，之後由普通幾何安全檢查決定存活。

所有選項及續接均可 JSON 儲存；沒有用隨機取代操控者選擇。

## 已驗證的邊界

26 項真測涵蓋四項本卡 FAQ、Corruptor 真實型別、原生 Automaton、例外重新選擇與 Book 最終集合（另由 Book context 套件驗證）、虛空不造地形、普通水下生存／窒息、地表 Avatar、神器及普通 Aura、持有神器掉落、未能整體下潛的 Aura／oversized、Ward 不防未指定移動、Bedrock、Talus、Driftwood、後進地點／Rubble、Great Old One 同機制及離場後持續、Drought timestamp、Smokestacks 移除能力與來源毀滅後恢復、永久 marker 的 JSON／雙回合保存、原已地下的例外仍可能因地形變水死亡，以及擬足選部位／JSON／虛空舊部位保留／整體死亡／沉默後不能推第三層。

## October 2026 規則書：效果內立即套用持續效果

[官方現行規則書](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view) October 2026 版（Drive 修改時間 2026-10-12T20:32:30Z）印刷第30頁 Static/Ongoing Effects 明示，持續效果連正在結算其他效果時也須即時套用。這不等於提前執行窒息死亡：實作在永久洪水建立後先 refreshContinuous，然後處理強制移動，最後才由普通 state-based 檢查死亡。

已用真紅例修正：原在陸地失能的 Waterbound Sea Serpent 帶 Pallid Bust 借用 Driftwood Marrows，地點變水後其保護須在下潛前生效，不能讓附近盟友先淹死。例外與擬足選擇亦以深複製、套相同永久 marker、刷新持續效果並透過該複本的 ruleAPI 查詢；不把原局面綁定的 type query 混入投影，也不在確認前突變實際世界。另有真測覆蓋新啟動的借用 Mortal 造成型別衝突、新保護排除過期擬足選項，以及 JSON 中失效例外在任何 marker／移動之前回滾。

若投影刷新本身產生額外 mandatory world choice，目前以 `UNSUPPORTED_FLOOD_PROJECTED_CHOICE` 明確拒絕該次動作，不忽略該選擇。尚未找到會觸發此分支的具體正式卡牌組合；它是保守實作護欄，並非另一個官方裁定問題。實際套用時如產生選擇，則保留續接與已建立的 marker，不重建第二次洪水或繞過該選擇。
