# 原101剩餘七張優先實作

## 正式收尾節點：23:10:31Z 完整2678通過

使用者／parent明確批准可重入且無外部副作用的原生完整測試寫入新唯一目錄。已檢查npmtest及全部test imports：無寫檔／外部網路／服務啟動。`tools/run-isolated-full-tests.mjs`僅寫本次獨立/tmp成果，未覆寫62668可能使用的TAP，也未再查ps。

第一次完整2678/2677/1失敗是wave3殘留人工Twister期待；保留原檔／紅TAP，僅更新已獲批准的落點輸入方式，保留所有split-power/傷害/死亡/費用斷言並新增完整20格及JSON斷言，81/81通過。第二次完整 **2026-10-30T23:10:31.146Z，2678/2678、0失敗、0跳過、exit0、程式指紋前後一致**。穩定TAP：`data/all-cards-audit/logs/full-sorcery-full-regression-NljQ40.tap`；validation/manifest另存同目錄。

`node tools/update-progress.mjs --validated-run /tmp/sorcery-full-regression-NljQ40/validation.json`嚴格核對全test清單／TAP統計／目前程式指紋後，直接採用這次實測結果更新，未多跑另一套測試。原101正式 **96核心／5部分／0未開始**，fullyVerified仍0。Twister明示user-authorized-digital-rule-variant；Contract明示human-confirmed-classification，真人分類資訊是外部輸入，不再當成未寫程式。驗收不等於官方實體吹牌或自動實體分類，也未宣稱liveFirebase雙瀏覽器網路測試。

五張部分：Book、Globe、Snowball、Throne、Chaoswish。無歧義正常流程的實際證據已完成本批核對；Book/Globe仍未正式開放，裁定後還須接入／驗收完整正式施放流程，不能把prototype/fixture當開放完成。Snowball閉環與雙Throne明確阻擋待裁定；Chaoswish固定保留抽到Book/Globe而暫停，不重抽。五項決策見PLAYER_RULE_DECISIONS.md，未選家規。保持七張範圍，未回403張批次。全庫仍697不同程度已查／403未查，完整驗收0。

## 最新覆蓋：使用者已批准數位 Twister

先讀本節，以下人工Twister段落為歷史。使用者明確將Twister改為全部20格隨機數位替代，不涵蓋其他五項家規。`finalTwisterDigitalResults`保存單次落點，shared RNG含BlackCat/Kythera正常干涉，無過濾空格／void。無干涉時均勻20格，受控制時不假稱仍均勻。i18n中英明示數位替代並保留原牌差異。舊待人工落點存檔改為單一數位續行，不接受outside/failed當新結果；舊物理紀錄仍是歷史。

原9項人工Twister測試逐一改為新批准行為，項數未刪／未skip，原檔保存`data/all-cards-audit/logs/final-effects-before-user-digital-twister.test.js`。新增27項digital專用，含全20格void、基準一次LCG、真隨機控制、JSON、重送、舊存檔遷移。十一套七張相關原生／context／同步聯跑**334/334，0fail/skip，exit0**；不是全tests目錄完整回歸。log `data/all-cards-audit/logs/final-seven-scoped-334-latest.log`。

實際5500數位Twister：手cast→取消→重cast→目標Bears，無人工落點；實付4、隨機2/C4，Bears自傷死亡、reload後單筆digitalrecord，原對局已還原。`data/ui5500-twister-digital-resolved.{json,png}`。

新增`choice-context.js`，供現UI捕獲opaque choice token、engine在mutation前拒絕舊token；online保留原player、token及inFlight/flush。舊無token actionlog仍相容，raw transport不提供一般冪等，不能當安全認證。Memory雙peer和真正online提交函式body驗證，不宣稱liveFirebase／雙瀏覽器網路UI。ENGINE_BUILD已改為`lockstep-20261030-digital-twister-choice-v2`避免新舊客戶端混規則。

真UI進一步dblclick曾暴露第二擊落在新選單／背景取消，保存before證據；新增400ms人類跨選單連點防護並把cancelDialog納入同guard，再真dblclick已保留搜尋選單，最後正常選卡只付2、audit1、入手1張。`data/ui5500-contract-doubleclick-after.{json,png}`。非法index、wrongplayer、錯token、跨phase重送／JSON、雙端一致與重連都有具體測試。真人分類是Contract外部輸入，不再當成程式未實作；自動分類未宣稱。

Twister數位軟體與Contract人工輔助軟體範圍已實作且有targeted/UI證據。正式全量接受數仍94/7/0，因62668完整run結果未確認，未手改成96/5；audit generator已準備於成功新完整回歸後以明示執行模式驗收這兩張。其他五張的無歧義正常流程已有原生／UI（Book/Globe僅fixture/prototype）證據，剩餘真裁定及依賴詳PLAYER_RULE_DECISIONS.md。沒有恢復403張批次。

本輪依最新指示只再試一次`ps -A -o pid,ppid,etime,comm`，仍被環境拒絕`operation not permitted: ps`，已停止且不換途徑查程序；62668結束仍無法證實，未重啟完整同套。最新完整接受仍22:28:35Z的2627。瀏覽器工具曾暫時失效，reset控制工作階段後同browser2/tab5已恢復，所有本節UI實際完成，無新server。

官方重疊FAQ另存`data/twister-overlap-official-faq.json`：只取覆蓋最多的一個site，ID FWsVZ4rxgHCtjTP73mU2mm，更新2025-02-20T23:04:25Z；完全等量平手未在該FAQ說明。數位單格批准維持，不因這項詢問改回實體。

2026-10-30：使用者明確要求七張優先。其他全庫草稿暫緩，九項已知紅測保留在 checkpoint，未計入正式完成數。

| 卡名 | 本輪優先補齊 | 保留邊界 |
|---|---|---|
| Book of Blessings | 正常選擇追蹤與正式整合可行範圍 | single範圍、Suffering的Ward時點未裁定；未開放 |
| Chaos Twister | 人工等待、取消、重載、回報與結算UI | 必須真人吹落，不能宣稱數位物理模擬 |
| Chaoswish | 固定結果、複本、取消與JSON | Book／Globe抽中結果保留阻擋，不重抽 |
| Demonic Contract | 人工分類、取消、重載確認、費用與搜尋UI | 合成輸入不是實體分類驗證 |
| Magellan Globe | 正常跨邊與離場單位接續選擇 | Aura離場安置／重複傷害投影未裁定；未開放 |
| Snowball | 正常路徑、入境限制、取消與JSON | Globe全同region閉環未裁定 |
| The Immortal Throne | 印刷費用、抽牌、正常勝利與UI | 同事件雙方勝利未裁定 |

## 本輪已執行

Chaos Twister新增`finalTwisterPhysicalReports`，保存實際玩家輸入的uid/player/turn/result及`human-reported-physical-result`。新增兩項正式回歸：人工等待、AI不代填、JSON恢復、真正自傷死亡，以及outside/failed不捏造落點。`tests/final-effects.test.js`：47/47通過。開發測試最初誤用已被Ward取消的目標，以及不存在的defense mod，已修正fixture；未修改原有斷言或放寬結算。

共用人工選擇UI明示須真人回報、AI不代填、可保留選擇稍後繼續。

現有5500實際UI：Twister手牌→取消→重施放→選BrownBears→人工等待→reload→合成outside回報；spent4、熊仍在12且damage0、choice清空、新人工紀錄持久化。新紀錄也證實服務載入本輪相關程式，不只依fixture版本推測。

Contract實際UI：手牌→人工RubyCore→gem→確認前取消；spent0、法術仍手、Core仍在、無audit。重施放→同分類→確認前reload→合成確認→真搜尋WildBoars；spent2、life20、Core移除、搜尋卡入手、choice清空、人工audit持久化。真UI已見新人工提示。兩項均還原原始瀏覽器對局，未儲存或匯出牌組。

證據：`data/ui5500-twister-pending.png`、`ui5500-twister-resolved.json`、`ui5500-contract-cancel.json`、`ui5500-contract-confirm.png`、`ui5500-contract-resolved.json`。合成輸入不等於真吹牌／實體分類。

分類仍94核心／7部分／0未開始。全庫697不同程度已查／403未查，不是697張完整驗收。

## 後續正常流程成果

三組七張專用候選已保留並升為正式測試：`tests/final-seven-{chaos-waves,passives,globe}.test.js`。初次14/14通過。Globe明確是隔離prototype註冊，不是正式可選／UI完成；Book亦是fixture置入的無歧義單目標，不假稱正式施放已接通。詳見本目錄`FINAL_SEVEN_CHAOS_WAVES.md`、`FINAL_SEVEN_PASSIVES.md`、`FINAL_SEVEN_GLOBE.md`。

Throne真UI：真正手cast成本4、實際Site零印刷費、mandatory Atlas選擇reload、再Zap一印刷費與Spellbook抽牌，最後level2/spent5/enemyLife19。另預設level8後真Avatar由C1移入C2，實際顯示玩家獲勝；不宣稱已操作八次升級或雙勝裁定。證據`data/ui5500-throne-{progression,victory}.json`與victory.png。

Snowball真UI：方向選擇reload→取消→重cast東向。實付5，BrownBears因GnomeHollows留11且damage0，CloudSpirit到14且damage1，choice清空。證據`data/ui5500-snowball-resolved.json`。

Chaoswish真UI：真正cast6、鎖定Wizard、對手真BlackCat控制隨機，完整池含Book/Globe，選Zap後reload固定目標、傷害1、免費不加費、token放逐、對手不複製。發現原選單顯示內部UID，已修`final-avatars.js`為卡名／座標／層／控制者，fresh同流程已見可讀標籤並完成。新增同名不同控制者／位置的嚴格回歸；Chaoswish+Avatar+新chaos-wave聯合106/106通過。證據`data/ui5500-chaoswish-resolved.json`、`ui5500-chaoswish-target-labels.png`。所有UI皆已還原原始對局。

## 完整測試工具結果不確定

最新完整接受仍2627/2627（22:28:35.810Z）。本輪`npm run progress:update`session62668起初確實執行且可poll，後續poll回Unknown process id；validation及TAP仍舊2627，未得到exit或完成結果。狀態**不確定**，未重複啟動完整套件、未重試先前被拒的process inventory。之後另有新測試與標籤修正，故即使舊run遲到也不能當目前版本全綠。分組測試已確實退出成功（47/47、14/14、106/106）；具體記錄`data/final-seven-priority-validation.json`。
