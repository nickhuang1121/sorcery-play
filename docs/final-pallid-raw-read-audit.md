# Pallid native-read audit

2026-10-30。本檔檢查 `final-pallid-passive-index.json` 的全部 213 keys，不只原先欠缺 verification 的 49 項。先搜尋直接 `passives[...].key`／`aquaticPassives[...].key`，再讀取 engine 中 `d`／`p`／`rule` 的 static alias 用途。這是有範圍的實際消費入口審計，不是聲稱文字搜尋可以證明任意新程式分支或所有卡牌組合。

## 找到且已實作的缺口

| key／路徑 | 缺口與改動 | 驗證 |
|---|---|---|
| `wakeFromNearbyDeath` death listener | own condition 已來源化，death listener 卻仍 native。改逐 source instance，保 native 舊存檔；lifetime generation 亦已由 root 套入 | 正式 `pallid-hollow.test.js`；正式 4 項含 re-equip、舊 queued wake、activation bookkeeping 不變 |
| `denyNearbyWard` Site branch | 單位分支已讀來源；Site branch 錯讀 native。改完整來源的存在性判斷 | 正式 `pallid-site-ward.test.js`：Unit＋Site Ward、bearer silence、source detach |
| `cannotDisable` Dream-Quest | 原只拒 native immunity，借得者仍可留下假的 sleep／dream／search | `/tmp/build-cannot-disable-boundaries.py`；root 已套入，正式 native／Pallid 真正 Dream-Quest 施放 |
| `cannotDisable` Immobile exemption | 舊 native `keywords()` 錯將不能 Disabled 當作不能 Immobile。移除錯誤 native 豁免，沒有把 bug 擴散到 gained | 同補丁已套；正式真正 Entangle Terrain，native／Pallid 都不能 step、仍可原地 attack 且未 Disabled |
| `unmodifiable` Tabula preparation | 原只看 host native passive，較晚 Tabula 可誤抹較早 Monks grant | owned `prepareFinalArtifacts` 讀 fresh source plan 與 timestamp；正式 `pallid-tabula.test.js` 真 handcast／反序／只卸掉 Pallid |

## 保留的 native reads 與理由

| consumer | 分類／理由 |
|---|---|
| `cards.validateDeck` → `unlimited` | deck construction；realm bearer 的 grant 不回溯改構築限制 |
| `copying.deferCopyEntry` → `enterCopy` | enter-time；優先讀 context `printedAbilityRecord`，raw 為普通 native fallback。取得 Bust 不 retro-trigger Genesis |
| `geography.siteAffinity` → `floodOccupiedSite` | live units 優先使用完整 `spatialFloodSources`（含空陣列，表示已算而無來源），native fallback 只供無 cache 的原始 helper；正式 engine refresh 建 cache |
| `disabled()` → native `cannotDisable` | native fast path 與 `gainedCannotDisable` 並存，gained cache 由 source views 算出；核心 native／gained immunity 已真測 |
| `kill` equipment `untapAttackKill` | 此 raw branch 只遍歷 artifacts。Minion 的借得能力另由 `combatTriggers` 消費，不將 artifact 自身能力偷偷當作 Minion printed ability |
| intrinsic cleanup → native `wardException` | 此 cleanup 現僅用 intrinsic eligibility。gained Ward exception 由 source plan／transaction guard 處理，不共用清空舊狀態的 native 路徑 |
| legacy `movementShot` block | `resolveStep` 更早呼叫 `resolveSpatialMovementShot`，該 op 無論有效／無效都已 return true；legacy block 不可達。真正 movement shot 已逐 source、每 movement 記錄並真測 |
| start queue → origin `everyStart` | 先取得 `unitDefinitionLayers` 的實際 hook，再讀該 `step.abilityOrigin` 的印刷 timing predicate；不是讀 bearer native slug 取代來源 |
| grave resurrection → `returnToSite` | 由 off-realm context 的 `skeletonReturnCost` source entry 取得 origin 後讀其 sibling location predicate，屬墓地施放，不是 realm bearer 的 union |
| UI `skeletonReturnCost` fallback | 優先用 action 已宣告的 `returnCost`；raw fallback 僅舊 action label，相同控制流程不據此重新收費 |
| engine static aliases | 所讀對象為 Site／Artifact、要施放的 zone card／cost 或特殊來源卡；Minion continuous loops 的 `p` 來自完整 source views。已逐 alias 檢查，沒有把名字叫 `p` 就視為來源化 |

## 驗證誠實度

主索引中 49 個先前缺少明確證據的條目，已加 `source_consumer_refs`、`verification_level`，並明列 grouped integration regression 不等於每 key 專用測試。Hollow 與 Pale Worm 的缺口正是讀取第二個 consumer 才發現，因此不以「第一個分支已來源化」或「全部測試綠」取代完整入口檢查。

當前已知尚未套入的邊界以主索引 `open_consumer_findings` 為準；Pallid registry 已存在，root promotion 仍須等補丁實際套入、正式流程測試與全專案回歸。

## 本輪收斂

Root 已套最後 lifetime 與 cannot-disable 邊界補丁；正式 16 檔交叉回歸 **288/288**，`/tmp/pallid-final-consumer-cross.log`。主索引 `open_consumer_findings=[]` 表示本輪已識別缺口皆完成修復／正式驗證，仍不代替 root 完整專案回歸或任意未出現的卡牌組合認證。
