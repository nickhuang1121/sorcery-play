# 第九批 Minion 原生規則稽核

## 最新結果：修補後19/19通過

2026-10-30T21:30:58Z讀取子集結果，session87497 exit0，`node --test tests/catalog-minions-wave9.test.js` **19/19通過、0失敗、0跳過**，log `/tmp/audit-minions-wave9.log`。原17測中的Gossamer真紅已由root獨立cannotImmobilize來源層修補，不擴張其他cannotDisable。原嚴格紅測保留，另依root要求加兩個真正控制案例：

- 真Entangle後真Silence移除Gossamer印刷免疫：untapped且未disabled但不能移動，正確受Immobile。
- 真cast Ghost、真ArcLightning致死、真Pallid Bust conjure與Genesis放逐該dead Ghost來借能力。在真Entangle及Silence下，Bear bearer仍原生move12→13；兩回合自然刷新後真drop該Bust失去免疫、不能移動；再真pickup同物件恢復免疫並原生move13→12。包含JSON，未寫unit旗標、未手造pallidPrintedCard、未直接刪artifact。

The Pallid Bust卡文已實讀原官方快照；此case只作Gossamer能力來源交互證據，不額外宣稱Bust整張完整驗收。正式19項檔現穩定，root已啟動完整回歸session19968，子代理不再寫該test。UI與來源新頁刷新限制仍保留。

以下17項16過1紅及尚未補控制的文字為修補前歷史，不代表目前尚有該紅測或控制案例未完成。

2026-10-30 UTC。從 `data/all-cards-audit/minions.json` 的unreviewed按slug排序，排除wave8/tail3/those_who_linger，先向root確認下列六張沒有重疊：Goat for Azazel、Golgor、Gossamer Ghost、Grain Sparrow、Granary Rats、Grand Old Boar。

本分工唯讀共享引擎與來源，只新增 `tests/catalog-minions-wave9.test.js` 與本文件。沒有修改任何runtime、JSON、官方快照、其他測試；沒有操作root的5500 UI、啟動server、推送部署或聯絡睡覺使用者。

## 最新可驗結果與精確剩餘

命令：`node --test tests/catalog-minions-wave9.test.js`。

正式檔已存在且可直接跑，**17項、16通過、1個確認真紅、0跳過**；session89469 exit1，log `/tmp/audit-minions-wave9.log`。未把未穩定結果報完成，亦未以排除紅測的套件稱全綠。

六張的原生施放/成本/threshold/coldJSON都通過，以下代表性效果已實測，唯一當前確認runtime缺陷為 **Gossamer Ghost仍被真Entangle Terrain immobilize，無法走出**，留給root統一修補。修補後仍須跑此17項及完整回歸；實際UI每張均未驗，來源新頁亦全部工具inaccessible，不能將本批稱完整玩法驗收。

## 每張實際覆蓋

共同基礎：每張分別native hand→legalActions→dispatch、insufficient mana無cast action、每個印刷元素threshold不足無cast action、實扣印刷cost、離手、真unit建立、owner/controller/power及cold JSON。沒有只用registry或helper代替真效果。

| 卡牌 | 真實效果／操作及已通過邊界 | 仍未覆蓋 |
| --- | --- | --- |
| Goat for Azazel | 真cast遠處己Site10，己Avatar17不是nearby仍由Goat承受真Zap1，Goat0power致死入墓、Avatar生命不變；後續再Zap Avatar真失1；另一例敵bear受Zap傷1、不由己Goat保護；Warded Goat吸收原Avatar傷害且破Ward、damage0存活，下一次真redirect再致死，Avatar兩次均不失血；中間JSON | 多Goat/多重修改順序、跨層受體、同時戰鬥多event、無法受傷來源等；UI未驗 |
| Golgor | 真cast本回合即用once能力，不需tap；指定相鄰location13，斜角6排除；對該location所有<=2 minions一律banish，包含盟方Stealth Ghost、敵Ward Squeakers與其他弱unit；4power bear與below Gnome保留；Site本身Ward不破（location不是Site target）；banished Squeakers無Deathrite、不留墓；再真cast Boar不獲Charge；使用後當回合無第二能力，Golgor不tap；另same-square location12也是adjacent，真banish己2power unit，自身7power保留 | 新回合once重置、modifying power於結算前、移位/多部位/保護區及UI未驗 |
| Gossamer Ghost | 真cast後，對手真cast Frozen Horror並啟動break-Stealth disable範圍；Ghost不disabled，經對手end→己draw到自己的真回合仍可原生move13→12，中間JSON | **真Entangle Terrain覆蓋後仍無move action，違反不能被immobilized**；修補後須補回歸。Silence移除此能力、借來的能力層、其他immobilize來源、Ward/Stealth狀態細節及UI未驗 |
| Grain Sparrow | 真Genesis從life15→17、19→20（cap max20），不治療敵玩家life14；成熟後真Airborne對角move12→6並存活power1；choice/位置過程JSON | 更多healing replacement/Death's Door/不同Avatar maxlife、多層/攔截及UI未驗 |
| Granary Rats | 真cast在己Valley12，Earth threshold少1但mana不減；真Teleport搬去敵controlled Pond13，己Site threshold恢復、敵water少1但敵mana不減；JSON保存；真cast Silence罩Rat後，Rat silenced、敵Site threshold恢復 | disabled來源、動態site affinity、多部位占據/多Rat、site覆蓋順序與UI未驗 |
| Grand Old Boar | 無dead Squeakers時真cast newborn不帶Charge、無move；分別測己方與敵方Squeakers被真Zap致死入對應墓後，Boar獲Charge，cold JSON後同回合即能原生move12→13；對照Golgor真banish Squeakers不算dead，Boar不獲Charge | Squeakers離墓後是否立刻失Charge的原生交互、變控制/抄牌/死亡替代與UI未驗 |

## 真紅與建議根因

`wave9 Gossamer Ghost: actual Entangle Terrain must not immobilize the Ghost or prohibit its native step`：

1. 真hand cast Gossamer Ghost於12，設定為已成熟（合法前置場面），真hand cast Entangle Terrain於12罩它。
2. `disabled(ghost)`仍false，cold JSON後查 `legalActions`，卻沒有任何到11的native move。
3. 卡文直接說不能被immobilized；Entangle所授Immobile的唯一相關效果是禁止take steps，因此應有可執行步行動並真移至11。正式嚴格斷言保留，不用強制dispatch假動作。

目前 `gossamer_ghost` passive只綁 `cannotDisable:true`；`keywords`/movement仍接受Aura賦的Immobile。Onslaught已另做`deniedKeywords.push('Immobile')`，但Gossamer沒有。建議由root按實際印刷／借能力來源加專屬cannot-immobilize層，並在Silence後失去印刷保護；不能把所有cannotDisable（如Iron Man Talus）都推成cannotImmobile。唯讀檢查原官方卡文含“immobiliz”的只有Gossamer與Onslaught，沒有來源支持一概擴給其他cannotDisable。

本分工未改runtime。尚未補Silence或borrowed layer紅測，避免root完整回歸安全窗口期間不斷改檔；這兩項是精確剩餘，不冒稱已驗。

## 官方來源／版本與刷新限制

卡文及數值：原有 `data/official-cards.json` 官方快照，每張engine欄已實讀，未改。2026-10-30本輪六張官方同名卡頁全部web工具inaccessible，故保留「當前新卡頁未刷新」；不能將inaccessible當成卡片不存在。

官方October2026 Rulebook與來源metadata在 `data/final-101-official-source-index.json`。以下以JSON解析 `/tmp/sorcery-official-embedded-docs.json`，實際讀原文，並非卡名推斷：

- Golgor FAQ `6e2ff865-fad5-4994-ac27-c6497bd43c25`，更新2026-02-09T18:45:48Z：若使用能力，該location全部<=2的minions都要banish，不能挑其中幾張。本批真正同時涵蓋盟/敵/Stealth/Ward。
- Immobile Codex `7db6da14-a5eb-4dcf-8b3b-4ba4e3ecfbeb`，更新2026-03-25T16:14:52Z：不能take steps，forced movement仍正常；Gossamer的印刷「Can't be immobilized」不能僅忽略disabled而留下Immobile造成停步。
- Disabled Codex `08fff20b-76c1-45c3-b13f-989202cdacf0`，更新2026-10-12T20:18:52Z：失去abilities/steps/成本tap等；Gossamer文字明確禁止disabled，本批真Frozen Horror情境驗了仍可native step。
- Healing `f980ed60-def7-4a2d-87ca-589573087481`，更新2025-06-30T04:38:09Z：healing Avatar等同gain life，不能超過max。本批兩起始life分支各實測。
- Charge `4cff66bd-45c0-452b-aaa8-18119accf443`，更新2025-06-16T20:13:27Z：不受summoning sickness；本批Boar在真Squeakers死後當回合立即move。
- Dead Minion `04c09db6-71f6-42ee-8bd1-1dba23e6af02`：dead minion是位於cemetery的minion，所以banished Squeakers不符合。原文已實讀，非把death history與grave任意混同。
- Cemetery `5ea9c063-3158-4476-a261-04eb0a43d43e`，更新2025-07-10T03:28:42Z；Damage `d54c08da-2107-484a-9f68-123bb62581b5`，更新2026-03-05T23:37:16Z。
- Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`、Adjacent `1d3363e4-3b12-46fb-99d9-f4319967f484`、Nearby `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`、Airborne `c7c182e2-629c-4e65-a9a0-97feff983a3d`沿現有官方快取版本；普通location/unit範圍守region，Site target與location target不能混同。

## 可接續狀態

- `tests/catalog-minions-wave9.test.js` 現19項穩定，原真紅與新增兩個來源控制均已通過；root已納完整套件。
- 本文件完整保留所有尚未測邊界、source-refresh與UI差異，不將6張標fully verified。
- 沒有正在執行的本子集session（87497已exit0）。
- 下一步：root完整回歸、ledger及UI整合；正式19測停止修改。其他表列未驗邊界保持保留，不冒稱全驗。
