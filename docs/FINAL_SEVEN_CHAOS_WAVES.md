# 原101優先：Chaoswish / Snowball 正常流程複核

2026-10-30。只讀 `src/final-chaos.js`、`src/final-waves.js`、`tests/final-chaos.test.js` 與 `tests/final-waves.test.js`，未修改共享檔。新增 `/tmp/final-seven-chaos-waves-candidate.mjs` 三項嚴格原生回歸。沒有為湊數宣稱發現缺陷。

最新命令：
`node --test /tmp/final-seven-chaos-waves-candidate.mjs tests/final-chaos.test.js tests/final-waves.test.js > /tmp/final-seven-chaos-waves-combined.log 2>&1`
結果 **60/60通過、0 skip、exit0**，6066ms。無仍在執行session。

## 新增實際覆蓋（3/3）

1. Snowball 經 Gnome Hollows：Brown Bears 真printed4力不能進入3+禁區，停在原11位置且未受終點傷；Cloud Spirit 真printed2力繼續跟隨到14，終點只計剩餘一個cargo、受1傷存活。不是任意手改movement flag或helper直接搬動。
2. Snowball 真施放前方向choice冷JSON後取消：hand完整保留、mana零支出、rng不變、cargo不移不傷、choice清空。
3. Chaoswish 真hand施放→選caster→真Black Cat選固定Zap→選目標→對方拒絕複製；每個公開choice之間cold JSON restore。固定且能合法施放的Zap沒有取消選項，實傷1、free copy沒有額外mana，Zap token banished而原Chaoswish進cemetery；無改activeplayer或自己直接指定random step。

## 既有普通流程已充分代表覆蓋的範圍

Chaoswish：完整官方Spell池、不篩Book/Globe；先鎖施法者再隨機；無合法目標；免費token Magic/Minion與Genesis/離場；對方回合複製；方向宣告與X0、額外cost免除、Bureau不收費；巢狀Chaoswish/Kythera有限次、每次施法trigger與每次對手機會；32次checkpoint冷存檔；施法者死亡與控制來源失效；fixed unsupported結果retry/coldJSON不重抽；錯玩家/out-of-range/stale目標嚴格rollback。

Snowball：含起點、Stealth、終點單位與排除caster；region邊界/維持原region；force immunity、持有artifact跟隨但loose artifact不拾取；Troll Bridge中途trigger+JSON；oversized分享地點仍carry/僅計一次；projectile barrier、Wall of Fire中間傷害；Failed Mutation untargeted搬動/免Magic傷；沒移動不能stop因此零傷不破Ward；終點Talus仍拾取、起點Talus分離drop；Moeba接觸分肢移動；有邊界的Globe正常wrap。另有被中途外力移走後drop/recollect的既有測試，但它直接插入Storyline，不冒稱是完整原生該外力施法整合。

## 實讀官方既存來源

`data/official-cards.json` 兩卡逐字卡文：Chaoswish成本6/Air2Water2；Snowball成本5/Water2。官方embedded快取 `/tmp/sorcery-official-embedded-docs.json`：

- Projectile `c81c8875-ef70-4202-8c98-7ac00ece0cc6` updated2025-07-05T22:17:25Z：起點屬path、保持同region、Snowball依path而非hit，因此含Stealth。
- Stops `a8c1b7eb-e60a-4087-8715-ea6799593ea2` updated2026-02-09T18:39:34Z：明文Snowball沒有進新location便沒有move/stop，不deal damage。
- Carrying Units `5f6697d3-c0a4-42b3-b682-ce807b9e4cd4` updated2026-02-09T18:42:26Z：不能進地點者不移；不再share location才drop。新增GnomeHollows案例依此，卡文3+不能進並實讀。
- Copy `88663410-ac07-4dd6-b2fe-fbecbadf232a` updated2026-05-19T18:39:34Z：copy token resolves後banished，創建者控制並做選擇，明舉Chaoswish。

## 真正剩餘阻礙，不擅定家規

- Globe形成同region完整閉環，Snowball不會自然停；現有明確unsupported error與dispatch rollback、以及中間已commit步驟的存檔error回復測試。仍需官方裁定，不能假設有限步/自動停/無限傷害。
- Chaoswish full pool抽到目前未實作Book/Globe，固定同結果manual retry並非重抽。這是所依賴卡未實作的阻礙，並非Chaoswish正常流程缺陷；不刪池、不過濾、不自訂替代結果。
- 本批無瀏覽器操作；實際UI交付需root驗收。這60個引擎測試不能替代UI，也不能證明所有跨卡組合。

結論：本次未確認額外可確定的引擎缺陷，正常流程新增三個代表負控均通過。剩餘需決策/依賴項如上，不藉未授權家規把原101狀態改為全完成。
