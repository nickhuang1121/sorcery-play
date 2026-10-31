# Magellan Globe：新專案裁定嚴格候選

2026-10-30。只改本文件及 `/tmp/final-five-globe-candidate.mjs`；共享src/正式tests/JSON未改。

使用者已授權：離場跨邊普通Aura保持原實際覆蓋格且不移動；Doomsday兩個4投影同格只4，不擴張任意不同值max/sum。這兩項是明確專案裁定，不冒稱官方FAQ直接解決。

## 實跑與紅測

`node --test /tmp/final-five-globe-candidate.mjs`：3項、0過、3失敗、0skip、exit1。候選穩定等待root根修。

1. **正式註冊未開放**：不使用prototype時，真手牌Magellan Globe無cast action。目標修後真正支付印刷成本並使0→4 Move合法；這是正式開放門檻，不以prototype代替。
2. **Aura離場覆蓋遺失**：隔離worker明確註冊prototype並重裝catalog後，真Globe cast、真Silence cast在4，確認[4,0,9,5]內四個Belmotte Longbowmen均失Ranged、外部8格仍有；真Apply Alkahest target10移Globe，JSON restore後原Aura anchor仍4，但0格恢復Ranged，違保持實際覆蓋裁定。全四格均有嚴格斷言，不僅JSON欄位。
3. **Doomsday重複4錯累8**：真Globe與Doomsday12 cast，將counter設1作近爆初態，JSON後真end。敵Avatar2生命減8，嚴格預期4；己方Avatar13預期減8作單投影正控制。end清除minion傷害，因此使用Avatar生命差作可持續結果，沒有錯用end後damage=4。修前失敗在8≠4，正控制待修後完整跑到。

第二三項prototype僅隔離效果診斷，第一項明確要求正式cast可用。完整six-end countdown已有既有測試；本候選測新投影結算不虛稱驗證six-end。

## 最小修補建議（root唯一改共享）

- 正式passives註冊Globe，再更新卡庫支援狀態；不保留測試prototype作產品入口。
- `refreshGeometryWorld`在最後有效Globe消失時、將aura.geometryWrap=false前，對普通跨邊Aura保存當時實際area四格到明確持久欄位（例如retainedAuraCells）。`objects.inside`優先讀保存格，且不是讓area(anchor,false)變成空集合。不得搬anchor。wall/singleSite不要被誤擴成四格；重新出現Globe不應悄悄改寫已凍結區域。
- 搜尋所有Aura實際範圍消費者，不只inside：`engine.resources`目前abundance直接呼叫area(s,aura.at)，這類路徑亦須共用aura實際佔格解析。UI畫區也須使用同一解析；本輪未瀏覽器驗收。
- Doomsday在final-artifacts的grid投影結果依physical at去重**相同amount的投影**後，再依oversized實際不同location累加。勿修改所有grid成任意max；勿取消oversized跨不同位置應有的總傷害。

## 不同值投影檢查

實讀final-artifacts的5×5 Doomsday矩陣：在4row wrap上只有首尾row相差4而重疊，兩row都[0,2,4,2,0]，因此本卡實際重疊值相等。橫向5column環面不使5column矩陣同列重複。`final-grids.js`其餘目前patterns的方向跨度均不足4，同一pattern內未見不同值自我重疊。Burning Hands選兩方向是不同選擇效果，不擅自當成這次同一矩陣投影裁定。沒有發現需要決定不同值max/sum的原生來源；未新增家規。

## 來源與限制

官方卡文/FAQ既有快取 `/tmp/sorcery-official-embedded-docs.json`，查核2026-10-30。Globe離場FAQ `FWsVZ4rxgHCtjTP73mWtOo`更新2026-03-25T19:17:19Z只明寫units；grid FAQ `FWsVZ4rxgHCtjTP73mWqTs`更新2025-02-20T23:04:25Z只准跨邊，未定本兩疑義。Doomsday印刷矩陣已由專案final-artifacts.js註記官方卡面2026-10-30。新增兩行為依本次使用者裁定，與官方明文分開。

未正式promote、未完整回歸、未UI實機操作。原先/tmp/final-seven-globe-candidate.mjs的雙控制者安置/雙Globe語義2/2通過仍可配合後續根修回歸，未修改。

## Root根修後補核

Root已正式註冊Globe與加入retained cells/等值投影去重。候選新增第四項Abundance原生資源測試：真cast Globe+Abundance4，原覆蓋[0,4,5,9]兩格各屬一方，兩位資源精確各+2；真Alkahest離場→JSON，保留格/anchor與資源；未覆蓋8格更換controller只加Site本身1mana，不額外加Abundance；真Globe重出→JSON→再真移除，retain不改寫、資源仍精確。

本輪獨立跑 `node --test /tmp/final-five-globe-candidate.mjs`：**4/4過、0skip、exit0**。第一項在任何prototype override前已證正式cast開放；第二三項保留早期隔離註冊註記，未靠其取代第一項。Counter1仍是近爆初態，不冒稱本批六輪countdown驗收。

UI靜態路徑核對：app.js objectsHTML依objects.inside列出Aura，現在inside共用objects.auraCells；borders.js的auraCells也轉呼叫objects同函式。因此物件按鈕與border geometry走同一保留格解析。尚未瀏覽器實際覆蓋視覺驗收，不把靜態路徑稱UI完整。

## 雙peer同步補測（未連Firebase）

新增第五項memorybus測試：初態為真Globe+Silence施放後JSON baseline；peer0實際publish手牌Apply Alkahest cast與tokenized targetchoice兩筆actionlog。peer1稍後從同JSON baseline啟動並replay兩筆。兩端seen均[1,2]、無錯誤；retained精確[4,0,9,5]，逐一20格inside僅四格true；覆蓋Longbowmen失Ranged、外部8仍有；projectRuleProfile都等於PROJECT_RULE_PROFILE，最終checksum一致。

只獨立跑新測：`node --test --test-name-pattern=memorybus /tmp/final-five-globe-candidate.mjs`，1/1過、0skip、exit0。未重複完整套件；原四項結果保留上節。本測只有createMemoryBus，**沒有連Firebase、沒有網路端到端驗收**。tmp候選與文件穩定，正式檔未動。
