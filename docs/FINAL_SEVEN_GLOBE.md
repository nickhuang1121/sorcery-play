# 原101剩餘：Magellan Globe 補核（2026-10-30 UTC）

只新增專屬tmp候選，不改共享來源/正式tests/JSON，Artifact Wave13暫停。exec transport本輪已恢復，pwd、來源讀取及兩次原生測試實際成功執行。

## 可稽核結果

`node --test /tmp/final-seven-globe-candidate.mjs`：**2/2通過、0skip、exit0**。

1. 真Apply Alkahest移除最後Globe，兩位不同控制者的跨界Mountain Giant依序取得自己的強制fall選擇。第一位選3之後第二位仍須選；每次中間JSON restore保留決策，最後兩個位置及geometryWrap=false正確，Globe已移除，choice與finalDecisionPending清空。錯玩家、負數/越界/非整數選項皆拒絕，原始待選transaction完全不變。強制安置沒有null取消選項，不能以取消跳過官方必須安置規則。實際effectChoiceHTML產生可點選索引與Globe標題。
2. 場上兩Globe，真Alkahest先移除一顆，不觸發fall且oversized仍保留跨界四格；最後一顆真移除才取得fall選擇，JSON後選擇正常結算。

兩測皆明確在**隔離worker註冊prototype** `passives.magellan_globe={geometryWrap:true}`，同既有final-geometry測試，這不是正式卡已開放證據。沒有以helper呼叫代替結算。初始board/minions/artifacts為fixture，移除操作是真手牌cast→target choice→dispatch。第一次候選將第二Giant放14，只得到一個待選而測試預期兩個；改成兩個控制者同佔4的明確雙待選場景後通過，未將該fixture差異宣稱引擎缺陷。

## 已讀既有覆蓋

`tests/final-geometry.test.js`已有真Globe手cast、真Mountain Giant跨邊cast、普通/oversized/Airborne跨邊Move、乘客與Wall、water connectivity、離場正確controller及JSON、無合法位置minion死亡/Avatar縮小；本輪只讀核對，未重新跑整檔，不把歷史100/100當本輪結果。

`src/final-geometry.js:refreshGeometryWorld`依每unit控制者呼叫replacement decision，pending保留顯示footprint；`src/final-damage.js:runFinalDecisionAction`驗證actor與整數合法index、重播前次決策，候選實際覆蓋連續兩次決策。`src/app.js`的acting採choice.player，effectChoiceHTML映射button index；cancelDialog僅有null option才送出取消。因此強制fall關閉面板不會偷偷選一側，但**尚未以瀏覽器確認重開選擇操作**，交root UI驗收，不能稱UI全驗。

## 官方來源與日期

實讀已存官方文件 `/tmp/sorcery-official-embedded-docs.json`（JSON解析，九項FAQ），查核2026-10-30；卡頁 https://sorcerytcg.com/cards/magellan_globe 。沒有本輪live刷新宣稱。

- 離場FAQ `FWsVZ4rxgHCtjTP73mWtOo` 更新2026-03-25T19:17:19Z：oversized由其controller放最近合法位置，平手由controller選；全realm無合法位置minion死、Avatar縮至可安置。兩控制者與強制無取消的依據，不涉及未決Aura。
- 上下跨界oversized FAQ `FWsVZ4rxgHCtjTP73mU7aW` 更新2026-03-25T16:13:56Z：兩格在top兩格在bottom，需清楚記錄。
- edge Aura/oversized施放 FAQ `FWsVZ4rxgHCtjTP73mU7hO` 更新2025-07-06T08:21:25Z。
- grid FAQ `FWsVZ4rxgHCtjTP73mWqTs` 更新2025-02-20T23:04:25Z只說grid可跨邊，未解重疊投影合併。

## 阻礙與狀態

Globe仍**部分**，沒有建議擅自開放：普通Aura在Globe離場後安置、重複grid投影仍未批准，維持既有待裁定。新的兩項候選無真紅，不解決這兩個規則阻礙；UI尚未實機驗收。尚未正式promote或完整回歸。
