# 剩餘五張：已批准四項專案裁定的實作與驗收

2026-10-30。使用者明確指定前四項；不是新增官方FAQ。原官方卡文與969項官方Codex／FAQ快照不改寫。原逐項未決問題歷史保存在`PLAYER_RULE_DECISIONS_BEFORE_FOUR_APPROVALS.md`。

## 實作

- **Globe離場Aura**：`refreshGeometryWorld`保存原四個實際覆蓋格到`geometryRetainedCells`，不搬移anchor；`objects.auraCells/inside`、borders及Abundance資源共用覆蓋格。保留格經JSON及Globe重出／再離場不變；正式passive已註冊，可真正手牌施放。
- **Doomsday投影**：只在Doomsday把同一實際格的相同數值去重，兩個4只算4；不同實際格對oversized的傷害仍相加。真實5×5矩陣的首末行相同，因此所有環面重合均等值；程式對假想不同值碰撞明確拒絕，未採任意max/sum。
- **Snowball閉環**：保存施法者原點at/layer及visited，每次Travel在真入境觸發處理後，首次回原點即Finish一次。橫向5步、直向4步；cargo以uid唯一，沒有多走第六／第五步。一般region邊界／阻擋仍照常；legacy無origin的中途存檔由第一條visited edge恢復。
- **雙Throne**：同一事件完成後若兩方都符合，取`s.active`當前回合玩家，不取Artifact owner、宣告者或網路seat；一般單方勝利不改。

存檔`projectRuleProfile=user-rulings-20261030-v1`，網路engine build `lockstep-20261030-project-rulings-v3`。卡面說明附「專案裁定（使用者指定）」；官方原文資料不改。

## 原生及同步證據

`tests/final-five-globe.test.js`5項、`final-five-snowball.test.js`10項、`final-five-throne-book.test.js`4項，合計19/19通過。包括真實施放／移除、覆蓋內外Silence、雙方Abundance精確mana、Doomsday4傷與獨立8傷正控制、四方向單圈、TrollBridge中途及回起點的JSON選擇、SeaWitch水下來源、Talus、舊存檔、active反轉。

MemoryBus＋實際MatchSync／controlled-entry回放驗證Globe真Alkahest施放及tokenized target選擇、雪球保存方向選擇及晚加入peer、雙王座同事件active0/1；兩端profile、具體作用、checksum一致，雪球完整state亦一致。沒有連Firebase或宣稱真雙瀏覽器網路驗證。

Chaoswish新增正式Globe結果：真隨機控制選到Globe後免費conjure tokenCopy，原6mana不增加，立刻啟用wrap，保存choice不重抽，對手仍可複製；Book結果仍固定阻擋。新增同格地點放置與持有者選項標籤不重名斷言，真UI亦修正。

## 真實5500 UI

所有起始局面明示為fixture，後續使用正常production UI，沒有evaluate直接派發遊戲動作；每組完成均還原原始瀏覽器對局。

1. 真手castGlobe2→Silence3 at4→Alkahest4 at10→reload。Globe消失，Aura仍anchor4、覆蓋[4,0,9,5]；0格長弓兵silenced=true、8格false，花費9。`data/ui5500-globe-retained-after.{json,png}`。
2. 真Snowball向東：兩Bears由11、14回10，各damage2、caster life18、花費5、choice/storyline清空，reload不再傷。`data/ui5500-snowball-loop-after.{json,png}`。
3. 兩個預設8級且交叉owner的Throne，真Sjaelstrom一次移除兩Spirit blockers；active0及active1各自贏，reload保留。不是實際玩過八級。`data/ui5500-dual-throne-active{0,1}.{json,png}`。
4. 預設counter1的Doomsday12＋Globe，真End引爆；13格單8使自己life12，2格重複4使敵life16，reload保留。不是實際玩過六回合。`data/ui5500-doomsday-globe-after.{json,png}`。
5. 真Chaoswish6→Wizard→真BlackCat隨機控制選Globe→C2地點放置；tokenCopy/所有units wrap/花費仍6。再新場景驗同格「地點放置」與「攜帶：Apprentice Wizard」清晰分開，實際攜帶選擇及reload成功。`data/ui5500-chaoswish-globe-{after,carried}.json`、`ui5500-chaoswish-globe-placement.png`。

## 完整回歸與剩餘

**最後正式驗收：2026-10-30T23:51:13.161Z，2699/2699通過，0失敗／0跳過，exit0，執行前後程式指紋一致。** 含最後兩項memory同步測試與新放置標籤。已由`update-progress --validated-run`核對全test清單／來源指紋／實際TAP後採用，未額外重跑。穩定輸出`data/all-cards-audit/logs/full-sorcery-full-regression-67HUxP.tap`，驗證`data/final-101-validation.json`。

正式原101仍99核心／2部分／0未開始：Book及Chaoswish的Book依賴。Globe／Snowball／Throne的核心驗收明示automatic-with-explicit-user-project-rulings，不冒稱純官方裁定。全庫698不同程度已查／402未查，fullyVerified0；僅本次優先範圍的Snowball由未查補核，未恢復其他402張批次。

2697/2697完整測試已在23:43:54及23:47:01 UTC通過；第二次涵蓋新放置標籤。最後新增兩個直接相關memory同步測試後，最新完整執行目錄由checkpoint記錄，未完成前不借用2697聲稱新test集全綠。

原101正式99核心／2部分／0未開始。剩餘Book與Chaoswish的Book依賴，不把已批准的前四項重列未決。Book官方target算choose已記錄真Magic；仍需single範圍／跨後續選擇的Ward時點。官方Storyline、TriggeredAbility、Target、Ward重讀版本及最小兩個結果見`FINAL_FIVE_THRONE_BOOK.md`。核心完成不代表1100全卡交互窮盡驗收；仍fullyVerified0。
