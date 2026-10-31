# Snowball + Globe 使用者批准單圈替代

2026-10-30；root轉達使用者明確授權：「繞一圈後停止並正常結算」，避免無限。這是本產品的批准裁定，並非自行聲稱官方原始未決閉環已有明文。

## 最小修改建議（交root唯一整合）

`finalSnowTravel` continuation持久保存起始location `{at,layer}`；每次先依正常path收集當格所有other units並以uid去重。若已advance且回到起始location，立即queue `finalSnowFinish`，不能再嘗試下一個edge。這讓橫向完整5步、縱向完整4步，實際回起點的entry/replacement trigger先正常結算，再impact一次。不能在重複edge前先再走進第一個非origin地點，也不能重收同uid或對同單位多次impact。

舊存檔若無origin可由visited首edge解析；建議保留visited防異常但把被批准的closed route正常finish，而非throw。非閉環原region邊界、projectile barrier與沒有move則無stop的語義完全維持。

## 嚴格原生候選

`/tmp/final-five-snowball-candidate.mjs`，7測，尚待root確認runtime修改後執行：

- 北東南西四向：真Snowball手牌→legalActions cast→coldJSON方向選擇→dispatch；來源3個unique Brown Bears在單圈最後全部回origin，各傷3；origin caster非cargo但受一次3傷；log僅一次impact，沒有殘留Snow continuation。
- 中間TrollBridge12與回程origin10先後真entry，兩次choice各coldJSON；中途travelled2、返回travelled5且尚未impact，付第二次toll後才一次impact。確保未多走第六步與save後沒有新cycle。
- 原點force-immune Talus不跟隨，在return又遇到，但只作一個cargo計數；另cargo各受2傷，不累乘。
- 有Void邊界的Globe非閉環，先wrap4→0→1後在void2前停止，終點1正常一次傷害2，不強制繞完。

Globe以明示prototype artifact放入合法fixture，測的是既有geometry wrap與Snowball原生施放；不冒稱正式付費Globe施放已驗收，亦不以此替其他兩Globe裁定作主。

共享src/tests/JSON完全未修改，不啟server/模擬，不聯絡使用者。正式來源仍有Projectile/Stops/Carrying Units原有規則證據；單圈終止唯一新增權威為使用者本輪授權。

## runtime後實際結果與只讀審查

root完成origin/visited修改後，本候選原7測已單獨完成 **7/7、0skip、exit0、838ms**，log `/tmp/final-five-snowball-candidate.log`。root另有聯合session55146，由root管理；沒有重啟它。

逐路徑唯讀確認：projectile建立origin；Travel→Advance spread保留；Advance→Travel explicit origin；中間entry暫停序列化保留。舊save無origin時，每次Travel可從visited[0]首edge重建origin；layer固定，因此fallback不會改區域。

依root請求再補2項不同source/相容save（候選現在**9測**）：

- 真Sea Witch作underwater Spellcaster，Snowball原點為她的12/below而非Avatar10/surface；真Drowned兩單位在水下單圈回12，各傷2，Sea Witch非cargo但受2，surface同位置BrownBears不傷，Avatar life不變。原生action不另列casterLayer而沿用unit.layer；最初多篩不存在欄位造成fixture失敗，移除過度篩選後原生below結算正確，非產品紅。
- 舊中間TrollBridge存檔在Travel travelled2時刪掉origin，coldJSON續付toll；從首visited edge恢復，cargo精確回10並只受1傷，沒有多一圈。

額外命令 `node --test --test-name-pattern='Sea Witch|legacy intermediate' /tmp/final-five-snowball-candidate.mjs > /tmp/final-five-snowball-extra.log 2>&1`：**2/2通過、exit0**。因此本9個案例實際皆有通過證據（原7與新增2分開跑，未宣稱有單次完整9測log）。檔案穩定，無active候選session。UI與正式Globe付費流程仍由root驗收。

## 最後直接相關memory同步補驗（候選現10測）

只新增1項memorybus saved direction replay，使用真 `createMemoryBus` / `createMatchSync` / `dispatchFinalControlledEntry` / tokenized `choiceAction`。原生Snowball待選方向coldJSON作baseline；peer0發布east方向完成閉環，peer1稍後從同baseline加入並重播已存在的方向action log。兩端seen=[1]、無error、相同origin10、兩unique cargo各傷2、caster生命18、單一impact、無choice或Snow continuation，`projectRuleProfile===PROJECT_RULE_PROFILE`、checksum以及完整state deepEqual。

`node --test --test-name-pattern='memorybus saved direction replay' /tmp/final-five-snowball-candidate.mjs > /tmp/final-five-snowball-sync.log 2>&1`：**1/1通過、exit0**。沒有執行full或模擬。精確horizontal travelled5已由先前return-entry原生案例證明；本memory案例觀察一圈五格後返回origin，未另宣稱能在已清空continuation讀到travelled計數。

探索版曾嘗試增加origin TrollBridge來讀travelled，但cold baseline沒有觸發該額外choice，雙端已正常同結果完成；這不是確認的產品紅，本最終sync測去掉不屬指定需求的額外Bridge假設。既有9測不變，未藉改引擎或放寬cargo傷害/同步斷言過關。檔案現穩定10測；本輪最後僅跑新1測，待root統一全套。
