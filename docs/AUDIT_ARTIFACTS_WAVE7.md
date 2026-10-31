# Artifact 第七批：Payload Trebuchet 至 Pile of Skulls

2026-10-30 UTC。主代理16場模擬於20:43:55Z完成16/16、sourceUnchanged後，經root穩定窗口指示正式納入專屬tests及本文件；未改runtime、既有tests或JSON。測試 `tests/catalog-artifacts-wave7.test.js`；命令 `node --test tests/catalog-artifacts-wave7.test.js > /tmp/audit-artifacts-wave7.log 2>&1`。含一項已確認Pendulum違反「another」的紅測，不能稱全綠。

來源：官方快照 `data/official-cards.json`、October2026規則書與嵌入Codex/FAQ快取（以cards slug精確比對）。本輪web讀[Payload Trebuchet官方頁](https://sorcerytcg.com/cards/payload_trebuchet)成功，費用之外可見完整效果文字與snapshot一致；其餘5頁InternalError，現行source refresh未完成。沒有反覆重試相同網頁。

六張共同：真正手牌cast找到native legalAction，實付印刷費／手牌移除、insufficient mana沒有cast、正確owner/location、JSON恢復。全部印刷threshold0，拒絕threshold N/A；另Stone測正常四元素門檻有供應，未假裝查全閾值互動。

|卡牌|本輪原生逐卡效果及邊界|來源、尚存限制|
|---|---|---|
|Payload Trebuchet|真cast5費給Bears12；原生activateArtifact選surface14目標（距2），超3step的4不可選；選crew Boars12，選Fireball payload前兩者不tap、不丟牌；JSON後confirm才tap兩人、Fireball進墓，對14全部unit（己/敵）各4傷，below14不受。原生payload取消不tap/不discard；helper和bearer兩個各自summoning sickness都拒絕啟動。|FAQFWsVZ4rxgHCtjTP73mTwea(2025-02-20)：兩者均須ready或Charge。未驗棄Site cost0、其他crew負擔、失效目標／force zone access及UI。|
|Peacemaker Arbalest|真cast3費，賦FootSoldier Ranged；原生north Ranged7種target：普通Bears無bonus；Ghoul Evil+1；Apprentice Spellcaster+1；AajCrabs Voidwalk+Submerge+2；Frog Submerge+Frog+2；CaveTrolls Burrowing+1；由敵真conjure OnyxCore的bearer額外+1。每例JSON且實收1+對應bonus。|卡文對每項類別一次，而非每個keyword副本。無匹配本卡FAQ。未驗七項同一unit全部重疊、Avatar、Site strike不加／多層與UI。|
|Pendragon Banner|真cast4費由己方bearer持；nearby allies+1，far不加，enemy不加；enemy僅在13（nearby非here）不會關閉Banner；enemy真的在12同location則全部加成關閉；JSON。|無匹配本卡FAQ。loose Relic無controller、不同layers、controlling owner/Arthur、動態移動切換與UI未驗。|
|Pendulum of Peril|真cast6費，原生end0選13，當前12及選13的surface minions均死，Avatar與below13／其他7留存；JSON選擇恢復；實際draw到1，再end1由1選7並殺7。**另一獨立嚴格red：選單包含自身12，不符another adjacent location。**|Adjacent Codex1d3363e4…一般adjacent包含本square；卡文明訂another必須排除同physical location，非全域改adjacent。未驗死亡替代／破壞順序／多Pendulum或UI。|
|Philosopher's Stone|真cast1費給Avatar，first KingArthur多元素原價4只減1=3；兩Stone實際cast疊加減2=2，不每元素減4；真cast記錄四元素且JSON保留；同turn之後Zap正常1費、真傷1。|FAQeXfZjLHocReFQIApZdNN4S(2026-05-19)：Arthur算四元素，但單Spell只有一次Stone折扣且用完四元素；FWsVZ4rxgHCtjTP73mTv8g(2025-02-20)：兩Stone可stack。未驗先cast後pickup、drop/steal、其他費用/threshold、所有cost tax與UI。|
|Pile of Skulls|真cast5費Monument；原生grave宣告可取消，不banish/no Skeleton；再選自己墓Magic Zap（非minion）banish，真Skeleton Token出於12 owner0；同turn once拒絕第二次；JSON；經原生兩turn到己方再選敵墓Fireball，歸owner1banish，第二Skeleton於12。|無匹配本卡FAQ。墓地Bureau/Wormelow等成本／保護另有既有系統測試，本批未冒領；summon tax、belowMonument與UI未驗。|

## 確認缺陷：Pendulum可非法選回自身

只有這項為真紅。`src/engine.js` pendulumSwing直接用一般adjacent selector，產生自身12 option，雖然卡文要求另一個位置。修補應只針對本牌過濾同at/layer，不能把Codex一般adjacent改成排除自身。runtime由root統一整合，本子代理未改。

所有UI本子代理尚未驗（root已獲既有5500服務授權，另外處理），不以有授權／載入／模擬當逐卡UI完成。沒有向睡覺使用者提問或報進度。沒有server重試、改憑證、推送部署或擅自裁定家規。

正式before結果：2026-10-30 20:44 UTC，`node --test tests/catalog-artifacts-wave7.test.js > /tmp/catalog-artifacts-wave7-formal-before.log 2>&1`，16項15過1失敗、0skip、exit1，唯一Pendulum自身位置guard。此紅測待root修補，不刪除／放寬斷言；不能把排除此項結果稱最新完整全綠。
