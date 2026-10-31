# 六張既有 Site 審查的原生效果補驗

2026-10-30 UTC。候選 `/tmp/catalog-sites-next.test.js`，只在 `/tmp` 新增，未改正式 src/tests/docs/JSON。

## 選取與計數範圍

實查 `data/all-cards-audit/sites.json` 沒有 `reviewStatus=unreviewed` 的記錄：208張之中137張為code-reviewed-awaiting-tests、71張partially-tested。經root同意，改取slug排序前6張code-reviewed-awaiting-tests：Brocéliande、Bureau of Occult Control、Consecrated Ground、Dark Tower、Defiler Spire、Den of Evil。

這是加強已有審查／測試證據，不是新增6筆unreviewed清除。尤其Brocéliande、Bureau已在其他正式檔有原生案例，本批保留並補新邊界，不能覆蓋原證據或將這批全部當首次驗證。

候選命令：`node --test /tmp/catalog-sites-next.test.js > /tmp/catalog-sites-next.log 2>&1`。

修補前16測，**15過1紅、0跳過**；真紅為Dark Tower被實際Acid Rain沉默後仍觸發印刷Genesis。root已通知加入source active guard，修補後結果由root保留；此文件不把舊2366完整全綠當本候選已驗證。

## 實際逐卡覆蓋

六張共同：真正Avatar的合法Site play、不是Minion/Magic的cast；不扣spell mana、不需印刷元素門檻；正確owner/controller、Avatar tap、離手與cold JSON。不是直接修改board來假裝已play這六張。

| 卡牌 | 原生效果與邊界 | 尚未驗收 |
| --- | --- | --- |
| Brocéliande | 先真conjure Fourberie Knot使Field Laborers同時為Faerie/Mortal，再原生play Site：Faerie untap後Mortal tap，最終tapped；另一方nearby Faerie untap、Beast獲Stealth、遠處Faerie不變、不同region的地下Mortal不tap；JSON。 | 更多複合type、變成Site/借能力的source、多部位nearby；實際UI。本批不是取代既有catalog-sites效果測試。 |
| Bureau of Occult Control | 真play Bureau後才從cemetery原生施放Ghostfire；宣告階段取消不扣費、不移墓；重做並JSON後確認，恰付2 access+1 spell共3，Ghostfire結算後banish、不再二次收費。 | 多Bureau、collection與多個effect scopes、view/decline與off-turn等沿用既有cemetery-access正式證據，本批沒有冒領全部入口；實際UI。 |
| Consecrated Ground | 真play後Ghoul從鄰Site surface真移入、Barrow Wight從鄰Site地下真移入，Evil兩層power都為0，非Evil Brown Bears保持4，JSON。另一真play場景：合法既在場Lance token由Ghoul持有，對同Site敵Phantom Steed原生attack，zero-power加Lance仍打1且Lance破，符合FAQ。 | 所有modifier/ward/power替代順序、contextual Evil／Persecutor、oversized跨Site；實際UI。沒有把Lance token當可施放的普通手牌。 |
| Dark Tower | 原生play時敵方同名Tower不阻Gen；只有自己的同名duplicate阻止+1；沒有自己的duplicate時bonusMana+1。有真Acid Rain先cast後再play DarkTower，確認Site.silenced=true，Genesis仍給1的紅測保留。 | root修後正式完整回歸、其他tower-handler、Genesis複製／重觸發、turn後bonus清理；實際UI。 |
| Defiler Spire | 原生play，兩個己方Site各有Evil（含另一方控制的Evil；另一Site同時surface與below多個Evil仍只計Site一次）；own end扣2；下一enemy end才扣對方被Evil佔據的Site1。另一真cast Acid Rain沉默source，source外的Site11不再獲全域end-loss；JSON及真end/draw。 | 多Spire疊加、grant與target Site silence互相時戳、控場變更及source中途離場；實際UI。 |
| Den of Evil | 真Genesis後先cast不匹配的Brown Bears不消耗buff；實際Fire資源0時，Lesser Blood Demon在別Site不可cast，在此Site可忽略threshold並少付1；施放完成後第二張同名不再可免threshold，JSON後仍不能。 | buff過回合／同Site多個不同門檻、cast取消與copy權限／cost tax及source後續silence；實際UI。 |

## Dark Tower 確認缺陷

Root source `enterSite` 末尾 `handler==='towerMana'` 特判在一般Genesis的 `!silenced&&!disabled` guard之外。實際操作：先用正常手牌cast Acid Rain到12，再用Avatar正常play Dark Tower12；Site有silenced=true，但bonusMana增加1。卡文明確是Genesis，silence使新Site沒有該印刷能力，應增加0。

候選嚴格斷言保留0，沒有覆寫playable、卡文、mana或刪測。Root已通知把active guard加到tower特判，未改印刷數值；root負責修補／全套結果。

## 實讀來源

- `data/official-cards.json` 六張現有官方快照的實際rules/affinity/card type。
- 本輪 [Brocéliande官方頁](https://sorcerytcg.com/cards/broceliande)可讀；其他五頁工具回inaccessible，不能稱全部最新頁已核。
- October2026 Rulebook，版本／來源指紋 `data/final-101-official-source-index.json`。
- 官方快取 `/tmp/sorcery-official-embedded-docs.json` 已JSON解析並讀正文：
  - Bureau FAQ `8cb6085f-4ff6-4421-8fd1-823f6e683c9b`（2026-03-25）：access為離開collection/cemetery；獨立付款，不是casting cost；整個effect共用存取。
  - Bureau/Ghostfire FAQ `6aa14135-1255-4005-971d-2b1131a2f544`（2026-03-25）：先付access再cast，不能靠拒付免除self-banish。
  - Bureau/Wormelow FAQ `348cc453-8993-4f9c-939e-56005219feb9`（2026-03-25），已讀但本批沒有新增Wormelow交互測試。
  - Consecrated FAQ `56d1e09b-b54d-4710-9f39-3c7465b5cbdd`（2025-12-06）：power0後Lance仍+1 damage。
  - Genesis `22b458ed-cb2f-407d-8a66-94fae90eb77e`（2025-06-16）、Nearby `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`（2025-07-14）、Site `5e633a96-c807-4915-be05-e83cacfcbfd6`（2026-07-15）、Region `aecd74a9-a6fd-41f2-8734-9d1f1c8ace1e`（2025-06-30）、Here `8e4684e4-479b-45d1-a75b-a41568ea6e6f`（2026-09-02）。

沒有操作UI或server、不聯絡睡眠使用者、不更改家規、不啟動或重啟模擬。sim24216的uncertain outcome由root查證，子任務沒有碰該session或結果檔。

## Promoted stable candidate

Root promoted this candidate to tests/catalog-sites-native-wave1.test.js with relative imports and portable data URL; assertions unchanged. Source fixes have native subset evidence, full formal regression is pending. Representative cases do not establish full card UI or all interactions.

## Complete formal regression

2026-10-30T21:48:22.719Z: full2450/2450 passed, zero failures/skips, session36138 exit0. Stable TAP/validation under data/all-cards-audit/logs/wave10-full-2450*. This confirms formal regressions only, not full per-card browser/rule coverage or every interaction.
