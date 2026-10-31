# 最後 101 張：四張地點卡的進度

範圍：Orpheus' Crossing、Mount Ussar Sanctuary、Darkest Dungeon、Mudslide。程式：`src/final-sites.js`；正式引擎測試：`tests/final-sites.test.js`。

## 2026-10-30 官方核對證據

以 CUA 背景瀏覽器直接開啟官方卡頁並展開 FAQ，沒有連線遊戲 Firebase。

| 卡牌與來源 | 實際核對內容 |
| --- | --- |
| [Orpheus' Crossing](https://sorcerytcg.com/cards/orpheus_crossing)，1 FAQ | 暫時在 Death's Door 不代表生命歸零；傷害及失去生命仍會減少實際正生命值。當回合不能因傷害輸遊戲。 |
| [Mount Ussar Sanctuary](https://sorcerytcg.com/cards/mount_ussar_sanctuary)，3 FAQs | Flee 是逐步移動而非傳送；如果沒有抵達 Sanctuary，不獲 Ward。路徑依指定目的地的移動規則。 |
| [Darkest Dungeon](https://sorcerytcg.com/cards/darkest_dungeon)，3 FAQs | 若沒有能讓兩者抵達的合法路徑，不把任何移動放入 Storyline，兩者均原地不動；若打出 Strike 的盟友在該戰鬥中死亡，Avatar 不移動。 |
| [Mudslide](https://sorcerytcg.com/cards/mudslide)，2 FAQs | 選一個左／右方向，套用整列全部符合單位，不能每單位各選；效果可跨越虛空涵蓋整列。 |
| [指定目的地的特殊移動](https://sorcerytcg.com/codex/248f42b3-ce6e-422d-9c27-c3072f192811?sub=facd143fe69d) | 必須採最少步數的完整合法路徑；多條等長最短路徑由效果操控者選，沒有完整路徑則完全不動。 |
| [Death's Door](https://sorcerytcg.com/codex/8dd871eb-65ec-4f9a-be06-4e81e417d1a2) | 在 Door 時不能治療或將生命設定更高；到達 Door 的當回合有死亡保護，其後傷害即 death blow。 |
| [Step](https://sorcerytcg.com/codex/0f53b70d-d13a-4982-8c16-20bb4ab1aa9d) 與 [Forced Movement](https://sorcerytcg.com/codex/8ffdae56-1aef-44f7-b9af-cdcbc334a377) | 推／拉／拖不屬單位自己的 step；使用 cardinal 距離，預設不能跨 region。外力可移動 Immobile，而 own step 不能。這與 Led Astray 的 own-step 行為不同。 |

## 實際實作

- **Orpheus' Crossing**：保留原生命值，只建立可存檔的暫時 Door；召喚任一墓地可用僕從、保留原擁有者但由自己控制、執行 Genesis 與召喚稅。下次自己回合開始移除暫時 Door；原已永久在 Door 的狀態不被清除，生命已到零也不會被恢復為安全狀態。修正一般 `loseLife` 在 Door 直接忽略正生命扣減的共用問題是必要整合。
- **Mount Ussar Sanctuary**：實際進入 Door 時依觸發當下 earth≥4 檢查；宣告最短路徑後逐步放入 Storyline，每一步後可結算地點進出效果，只有實際抵達才 Ward。
- **Darkest Dungeon**：Genesis 只設本回合一次性的下一個友軍 Strike 監聽；Avatar 的 Ward 防止傷害也不等於沒有被 Strike。戰鬥結算後重驗雙方存活；先宣告雙方最短完整路徑，任何一方無法抵達則兩者都不移。採 forced cardinal 步距、不跨 region、不因 Immobile 被阻止。路徑逐步結算，途中死亡／失敗後不能跳越未完成步驟。
- **Mudslide**：單次選左或右；快照規劃整列陸地地點上單位的同方向 forced 一步，符合者同時移動；排除水地點、不同列、不能強移者及非法／越界／跨 region 落點。Immobile 可滑動；Voidwalk 不允許被推過陸地／虛空界線。攜帶神器由既有連續更新跟隨。

## 共用引擎整合點

1. `definitions` 混入 `finalSiteDefinitions`／`finalSitePassives`，Storyline 加入 `finalSiteOperations`，`resolveStep` 呼叫 `resolveFinalSites(s,frame,fiftyAPI)`。
2. 在實際初次到 Door 的入口（`loseLife` 令 life=0 並設 doorTurn，以及直接交換生命的對應分支）呼叫 `finalSiteDoorArrived(s,p,fiftyAPI)`。Orpheus 自己的暫時 Door 轉換已在模組呼叫。
3. `finishTurn` 切換 active／turn 後、己方 start triggers 前呼叫 `startFinalSites(s,s.active)`。
4. `strikeMany` 對每次 Avatar Strike 呼叫 `finalSiteAvatarStruck(s,source,target,fiftyAPI)`；安排延後的觸發，不能在傷害尚未結算時直接移動。
5. `finalSiteMove` 為明確經過驗證的逐步移動，在 movement bookkeeping／pendingMovement 保留沿途逐步效果；不可將它當傳送。

## 驗證與限制

檢查指令：`node --test tests/final-sites.test.js`，2026-10-30 實測 **18 通過、0 失敗**。測試寫在正式 `site` 行動與 `dispatch` 效果流程上，不只直接呼叫模組。Darkest 的死亡邊界亦以正式 `attack → pass → fight` 測試。當次全套 `npm test` **315 通過、0 失敗**；其他代理持續新增測試，最終全套數字以最後執行為準。

所有新卡仍沿用本專案「部分支援」等級，不宣稱完成全卡交互與官方裁定驗收。路徑規劃借用目前的 `locations(...,stepOnly=true)` 合法一步模型；對途中能力依存改變、Megamoeba 等會隨移動改變自身占格的完整 lookahead，仍依賴引擎通用路徑能力。Darkest 對非同處的遠程 Strike 以雙方各自最短路徑宣告並逐拍結算；官方卡 FAQ 未明示這種額外情境必須共用單一路線，應另外驗收，不能據此宣稱所有遠程／多格交互完整。

續作墓地交互：Orpheus 已驗證 Bureau 拒付仍先成為暫時 Door、付費一次後召喚，以及 Mortuary 改視角後 Wormelow 保護實體墓地的候選過濾與復活所有權保留。
