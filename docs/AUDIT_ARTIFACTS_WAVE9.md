# Artifact 第九批：Ring of Morrigan 至 Sensu of the Fang

核查日期2026-10-30 UTC。從當前 `data/all-cards-audit/artifacts.json` 的unreviewed按slug排序選六張，排除Wave8。本批只新增 `tests/catalog-artifacts-wave9.test.js` 與本文件；未改共享引擎、JSON、其他測試或官方snapshot，也未聯絡睡覺使用者或啟服務。

## 實際測試與來源

命令：`node --test tests/catalog-artifacts-wave9.test.js > /tmp/catalog-artifacts-wave9-before.log 2>&1`。**18項17過1紅、0skip、exit1**。最初17項均過，再按Ring的直接redirected-damage FAQ新增嚴格第18項確認失敗；未把17/17稱最新全綠。

六張共同測項是真正手牌legalActions→dispatch cast、實付印刷費、hand移除、insufficient mana沒有cast、正確owner/location與cold JSON。此處cold是同process先JSON序列化、重新install原始官方catalog，再restoreGame，不是宣稱新瀏覽器／Firebase儲存測試。全部印刷threshold0，threshold拒絕N/A，未捏造元素門檻。

卡文／費用來自既有 `data/official-cards.json`，Codex/FAQ來自官方embedded docs快取（用cards slug精確匹配）。本輪web重新讀[Ring of Morrigan](https://sorcerytcg.com/cards/ring_of_morrigan)與[Screaming Skull](https://sorcerytcg.com/cards/screaming_skull)成功，與snapshot效果一致；其他四張card頁InternalError，現行source refresh尚未完成，不重試同查詢冒稱成功。

|卡牌|真實原生效果及邊界|來源及未驗範圍|
|---|---|---|
|Ring of Morrigan|真cast1費至Avatar17；真正bearer施Zap，morriganDamage optional可取消而不heal、原Zap仍實付1且傷1；選unwarded enemy造成額外1並heal1；選Warded enemy則Ward擋Ring傷、無heal，原Zap仍打1。觸發選擇均cold JSON。另敵RoyalBodyguard真正redirect Ring對Avatar傷害後，錯heal1：**確認紅測**。|直接FAQ `3da6b835-0e77-4ffc-a1cd-8b1cc7976b14` 更新2026-02-09T18:45:12Z，問prevented/redirected是否仍gain life，答No且須至少1damage。此為直接來源，非家規。多Ring、其他redirect來源、bearer/control變動與UI未驗。|
|Rolling Boulder|真cast4費loose Relic；真pushBoulder方向宣告取消不tap/不移；cold後north push tap pusher，起始12另一unit、沿途7與2各實收4，pusher免傷、below7不傷，Boulder最後2且uncarried。另敵unit同loose relic可在敵turn真push east到14，非owner0專屬。|FAQ `eXfZjLHocReFQIApZdIIDU`（2025-02-20）同起始site其他unit也受傷；`ygoDG8fb7HS97qCW69iQpL`（同日）cardinal同region；`FWsVZ4rxgHCtjTP73mUCXQ`（同日）Globe循環到重複step前止，本批**未測Globe且不繞未釋出狀態**。所有力學/大型/region/path與UI仍非窮盡。|
|Ruby Core|真cast1費給Bears，cold後resources mana和Fire各+1；真drop移除兩者。|無本卡匹配特定FAQ。本輪未重驗Arthur owner與bearer actor等互動、enemy pickup、below及UI。|
|Scarecrow|真cast2費Genesis返回同Surface12兩方的Airborne Pegasus到各自owner hand；nearby13 Pegasus、同12非Airborne Bears、below12 Pegasus(Burrowing fixture)保留。cold後不能把13飛行者移入12；返回的真手牌Pegasus不能在12conjure，但可13；地面Bears可移動。|無本卡匹配特定FAQ，依here/location/region及can't-enter通則。Teleport/force movement與借能力Airborne/Moeba各部分以及UI未驗。|
|Screaming Skull|真cast3費；AmazonWarriors5 native attack殺4powerBears後untap、可再合法move；Ward令strike不傷且未kill時，bearer仍tap且承受4反擊。另Belmotte真Ranged殺Boars不是Attack，保持tap。cold JSON後效果保留。|官方本輪card頁可讀，無特定FAQ。本批未測非attack其他ability/多victim/source borrowed／因另個傷害來源死亡、UI未驗。|
|Sensu of the Fang|真cast1費給原本非caster Bears，cold後power4→5、取得Air-only Spellcaster，不能以bearer cast Earth Bury；真以bearer施Air LightningBolt付2，敵13受3；cold再經真end/draw到下己turndrop，power回4且無Spellcaster。|無本卡匹配特定FAQ。其他gained/lose/disable/region能力來源、drop後同turn重拿與UI未驗。|

## 確認缺陷：Ring被redirect仍錯誤治療

`tests/catalog-artifacts-wave9.test.js` 最後一項：

1. 真cast Ring由player0 Avatar持有，player0 life10；player1 Avatar12及RoyalBodyguard13，另player0 Bears12。
2. Player0真cast Zap指定自己Bears，依Ring觸發選敵Avatar為target。
3. Player1的native `finalReplacementResume` 選RoyalBodyguard redirect；此選擇cold JSON可恢復。
4. Bodyguard實收1，敵Avatar未掉life，原Zap使自己的Bears收1，這些均正確。
5. Player0 life卻10→11，直接FAQ要求redirected trigger不gain life，故expected10，actual11。

引擎修補線索（本子代理不改）：`src/engine.js` morriganDamage只看`hurt(...)>0`，該返回值包含redirect到其他unit所受傷害；應確認原始target實際受至少1才滿足換取life的條件，保留Ward／取消／正常positive對照。不能為通過而把FAQ負控制刪掉、改斷言11或無差別禁止所有Ring heal。

此為subset，不是全庫full驗收；UI另由root處理，本子代理未操作瀏覽器，不以程式測試或可用服務取代實際UI流程驗證。沒有推送部署、憑證變更或家規裁定。

## Root共用修補後正式結果

2026-10-30 21:25 UTC查證 `/tmp/artifacts-wave9-ring-after.log`：正式Wave9 **18/18通過、0skip、exit0**。Root為hurt增加可選damage receipt並在modifyFinalDamage記錄redirected；Ring僅實際正傷且沒有redirect才heal，同時保留原Magic／其他hurt同步返回值。上述FAQ的RoyalBodyguard重導負控制現life維持10，正常Ring heal、Ward與取消對照全部仍過。初始17/18紅測log `/tmp/catalog-artifacts-wave9-before.log`保留。

本子代理沒有修改runtime或tests以遷就結果；18項維持不變，現檔案穩定供root統一完整回歸。這個18/18是本批效果subset，不能宣稱全庫／實際UI全驗。
