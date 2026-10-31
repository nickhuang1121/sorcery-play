# Sacrifice 成本：原生時序回歸

2026-10-30 UTC。正式檔 `tests/catalog-sacrifice-cost-timing.test.js`，命令：`node --test tests/catalog-sacrifice-cost-timing.test.js > /tmp/catalog-sacrifice-cost-timing.log 2>&1`。

此批驗證 root 整合的通用成本 bundle／LIFO 完成界線；子任務只新增專屬 test/doc，未改共享引擎或 JSON。四個情境都由真正 `activateArtifact`／`activateSite`／`choose`／`restoreGame` 執行，不注入 effect helper，也不以讀取內部 bundle 代替 zone 結果。

## 四個實際場景

1. **Holy Water：Artifact cost／取消／子選擇／JSON**。真正 conjure 給 Brown Bears，方向確認前可取消，bearer不tap、Potion不離場、不入墓。再真正啟動，確認北向；前方同格 Ghoul與Wild Boars造成多命中 `holyWaterHit` 選擇。此時Potion已不在Realm、bearer已tap，但Potion尚未進cemetery。中途JSON，選Ghoul後真正banish Ghoul、保留另一目標，Potion此時才恰好入墓一次。
2. **Sinkhole：Site立即移除／nested替代／JSON**。真正啟動，target宣告可取消而Site與墓地不變。再確認摧毀附近Roots of Yggdrasil；Roots觸發Armageddon，場上Brown Bears有Gilded Aegis與Lady Iseult而出現真正死亡替代選擇。此時source Sinkhole已是新UID Rubble，原Site實體確實離Realm，但墓中還沒有Sinkhole。JSON後選非Aegis替代並完成其餘子流程，Sinkhole才入墓一次，target也成Rubble。這個子選擇使測試能觀察「整個effect結束」與單個resolveStep結束的差異，避免只驗最後畫面。
3. **Temple of Moloch：unit付款／Ward與替代無效／Deathrite／重複實體**。Sacred Stag帶Ward、真conjure Gilded Aegis，附近有Lady Iseult；另有同名live Stag，以及一張早已在墓的同名Stag。原生付款宣告可取消，mana與victim不變。確認犧牲後Sacred Stag的真正Deathrite開啟可選WardSite；此時墓中仍只有舊的一張Stag，Temple的+2 mana尚未發生，Aegis未被放逐、同名live unit與Iseult仍在。JSON後選執行Deathrite，Site獲Ward，犧牲的Stag才進墓（共2張），mana才+2；Aegis仍在地上、bearer為null。證明cost確實繞過Ward／Aegis／Iseult，沒有混淆同名實體，也沒有先得到效果再付unit cost。
4. **墓地替代按真正入墓時點**。Sinkhole真正啟動摧毀附近Kor Crematory；直接斷言對方Fire資源至少4，確保付費前Crematory啟用。結算後兩Site為Rubble，Sinkhole進owner墓且不banish。若錯在付款時就送墓／快照替代，Sinkhole會被當時仍在的Crematory放逐；因此不是只有最後墓地數量的弱測試。

最新正式結果：**4/4通過、0跳過、exit0**（`/tmp/catalog-sacrifice-cost-timing.log`）。原本Willing Tribute的嚴格cost墓地時序紅測仍在 `tests/catalog-minions-tail3.test.js`，本批沒有修改它。完整專案結果由root統一執行，不能用這4項宣稱全套或所有sacrifice已正確。

## 規則來源

- 官方 October 2026 Rulebook p34：sacrifice移除Realm中的己方卡；若作為ability成本，在ability結束後才進墓；minion死亡並觸發Deathrite；Site變Rubble；dying unit不可用來犧牲。來源指紋見 `data/final-101-official-source-index.json`。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 已實讀：Sacrifice `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`（2025-12-21），明定成本延後入墓及犧牲不被死亡防止／替代挽救；Deathrite `7bd846a2-c55b-42cc-915a-9861f2080202`（2025-07-10），Deathrite在入墓前結算；Dead Minion `04c09db6-71f6-42ee-8bd1-1dba23e6af02`（2025-06-28），dead minion是cemetery中的minion；Activated Ability `c7f83847-8d96-4d13-a8df-a510ba603f1e`（2025-07-10）。
- 實際卡文及場景數值取 `data/official-cards.json`：Holy Water、Sinkhole、Roots of Yggdrasil、Temple of Moloch、Sacred Stag、Gilded Aegis、Lady Iseult、Kor Crematory。沒有修改快照。
- 沒有重新刷新所有周邊卡的官網頁，不能宣稱最新卡頁全面核對。

## 限制與誤用更正

最初測試草稿把Holy Water多命中選擇泛稱`projectileImpact`，實際操作使用專屬`holyWaterHit`；把Stag的optional WardSite錯當另一個Site picker，實際為執行／略過boolean。已按真實選單更正操作契約，原有zone時點、取消、傷害／banish、mana及數量斷言均保留，這兩個草稿操作錯誤沒有算成引擎缺陷。

本批不證明所有Babel複合Site／animated Artifact付款、所有非成本sacrifice、任意nested free cast、game-over時未結算bundle策略或待裁定Globe幾何。這些須各自原生案例。UI由root在已許可5500服務獨立驗證，本批不操作UI、不發問或打擾使用者，不把Node測試當瀏覽器驗收。
