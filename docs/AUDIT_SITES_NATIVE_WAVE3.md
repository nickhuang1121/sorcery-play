# Site 原生補驗第三批候選

2026-10-30 UTC。Dwarven Forge、Edge of the World、Elder Ruins、Endless Fence、Ersatz Platz、Fae City，皆從code-reviewed-awaiting-tests按slug選取；不是新unreviewed清除，原有證據須保留。

只新增 `/tmp/catalog-sites-wave3-candidate.mjs` 與本文件，未動正式src/tests/docs/JSON、full67898或任何sim/server。

有效候選命令：`node --test /tmp/catalog-sites-wave3-candidate.mjs > /tmp/catalog-sites-wave3-valid.log 2>&1`。

修補前 **18測，16過2真紅，0跳過、exit1**。兩紅皆Elder Ruins：成本犧牲提前入墓，以及Site「here」漏掉水下minion。Root已收到，子任務沒有修改引擎，也沒有排除紅測。

## 六張共同

真正Avatar合法play Site、不是手改board冒充play；不扣spell mana、不需spell threshold；owner/controller、Avatar tap與JSON。Edge的基本play場面明確保留一個正交Void，避免用非法位置測基本流程。

| 卡牌 | 已實際通過／候選斷言 | 尚存限制 |
| --- | --- | --- |
| Dwarven Forge | 真play後下一敵方回合，對方真的conjure Sword and Shield及Goswhit Helmet到我控Forge，分別少付1，物品owner仍敵方；普通Ruby Core不能藉此放入，其他敵Site也沒有permission。真Acid Rain沉默Forge後我方付款不再減費、敵方不再可在此conjure。JSON。 | 全部Weapon/Armor、多個modifier與零價、Automaton複合types、off-realm casting；本批UI未驗。 |
| Edge of the World | 沒Void或只有斜角Void不能play；正交Void可真play。隔兩回合Avatar ready後，填它唯一相鄰Void的Site動作被拒；無Edge的對照場面可填，非法dispatch不損hand、不tap、不改state。另真Acid Rain沉默Edge→真play填最後Void成功→真Disenchant移除Aura恢復能力，Edge自毀成Rubble入墓、剛填的Valley保留。 | Globe／多Globe／torus及其他五項未決一概未觸碰；大型Site／移Site全量結果及UI未驗。這是原101既有核心的額外覆蓋，不能重計新增完成。 |
| Elder Ruins | 基本Siteplay通過。負向：實際Water1時不能免門檻cast Shoggoth，constructed沒有Shoggoth不能生出卡。**紅1**：true activate後選surface Ghoul犧牲，collectionCast選單尚未完成，Ghoul已提前在墓；原before在此被阻擋；root修補後19項回歸已實際跑完strict 6 mana／submerged Shoggoth／collection消耗與JSON斷言。**紅2**：真cast Drowned到Ruins水下後，因表面here篩選，完全無可用Site activate。 | 根修後正向與預付款取消／mandatory cast均已通過；Bureau access、額外cast/summon稅、limited collection例外；本批UI未驗。 |
| Endless Fence | 真play後，Void中的Phantom Steed不能一步進自己Site或同land span的另一Site；相反方向真從land移入Void可行，JSON。另一場水包圍的孤立land island可從Void真進入、水Surface也可進；不能直接一步進Fence span，但經水Surface的較長路線可進，沒有把終點相同當非法。 | teleport／summon是否enter、其他水陸連接變化、對方控制的來源、source silence；本批UI未驗。 |
| Ersatz Platz | 真play時Avatar已tap，不能再拿Site能力替換。兩回合後真正activate，collection只列Exceptional Consecrated Ground、排除Ordinary Valley與Unique Lair；JSON後Skip不tap／不banish，重做選擇則真消耗collection卡、Platz進banish、新Site在此、Avatar tap，其他collection保留。 | 非Avatar的不受限playSite來源、collection access稅、控制權／保護Site交互、Genesis稅／Root其他特殊場景；本批UI未驗。 |
| Fae City | 真play後從手牌真cast surface Faerie與underground Bluecap Knocker；本回合fresh minions無法付tap cost。兩回合後兩層都可被選；選surface Faerie再取消方向，不tap。重選below Faerie、JSON、確認北向後才tap該Faerie，原生地下projectile傷敵Barrow Wight1，surface敵人不傷，另一Faerie不tap。 | 敵方／非Faerie／disabled單位成本邊界、被攔projectile／Stealth、water-flooded Fae City及所有多部位；本批UI未驗。 |

## Elder Ruins 兩個確認根因

1. `src/collection.js` 的collectionElder直接kill victim後queue collectionCast，仍是通用sacrifice-cost bundle以外的舊分支。Sacrifice Codex與October2026 Rulebook p34要求作為cost的卡在整個ability結束後才進墓；因此collectionCast尚待選擇時不能把victim作dead minion提供給其他墓地effect。
2. 印刷「minion here」從Site發出，Here Codex明確包含Site的surface與subsurface。`completion-cards.js` Elder first selector缺siteBothLayers，真召水下Drowned且有全部資源／collection時仍不能activate。Drowned的summoning sickness不限制犧牲成本（沒有tap成本），不是可以排除它的理由。

建議root讓此特殊collection續程也走共用queuePaidAbility成本boundary，而非另寫延後kill特判；同時補Site兩層的victim選擇。子任務不改共享程式。

## 兩個已排除的fixture操作問題

最初18測是14過4失敗，其中兩個不是引擎缺陷：

- Acid Rain下的Site有runtime silenced mask，檢查剛play的Valley／原Edge實體須讀baseCard再判名字，不能拿mask的slug當印刷卡名。
- Endless Fence限制「從Void進land span」的一步region crossing，不禁止先走入water Surface再繞進land。Phantom Steed Movement+2可走更長合法路線；已改成檢查direct path length1而非只看終點，保留合法water與孤島的實際move控制。

修正以上操作契約後，只有前述兩個Elder真紅；未刪或放寬正確規則斷言。

## 實讀來源與版本

- `data/official-cards.json` 六張現有官方engine card rules／數值，未改快照。
- 本輪 [Elder Ruins官方頁](https://sorcerytcg.com/cards/elder_ruins)可讀，明列sacrifice a minion here→cast Shoggoth submerged fromcollection；其他五頁工具回inaccessible。
- October2026官方Rulebook（來源指紋見 `data/final-101-official-source-index.json`），尤其p34 sacrifice-as-cost延後入墓。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 已實讀：
  - Edge FAQ `eXfZjLHocReFQIApZdI4Iu`（2025-02-20）：會使Edge失去Void相鄰的效果不結算，Site留hand；本批不使用該FAQ的多Globe案例。
  - Edge FAQ `FWsVZ4rxgHCtjTP73mTxeQ`（2025-02-20）：能力失去後被圍住、再恢復時，Edge自毀。
  - Ersatz FAQ `3e58e4a4-8859-4518-90b4-42c44d10d2f3`（2025-12-06）：使用Avatar或其他不受限playSite能力時，可改為collection Site並banish Platz。
  - Span of Land `b00b6e30-c6f2-4744-96f1-82a41119e4a6`（2025-06-09）：正交連接的land Sites，不分controller，water不是land span。
  - Here `8e4684e4-479b-45d1-a75b-a41568ea6e6f`（2026-09-02）：Site的here包含surface/subsurface。
  - Summoning Sickness `6d43aa10-e794-463a-a5ea-93e6f0807e00`（2025-07-15）：新minion不能tap或被tap付任何能力cost；Tap `4b73c89d-914a-4911-a73b-1ae905e4a398`（2026-02-09）同義。
  - Sacrifice `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`（2025-12-21）、Collection `78ce4090-a2e1-4893-97c0-6eaafd5c5937`（2026-03-25）。

沒有碰五項未決家規、不聯絡使用者、不啟或重啟server／模擬。正式納檔及完整回歸由root統一完成；Node候選不能當實際UI或完整全庫驗收。


## Root修補後與第19項嚴格邊界

Root將Elder改成declare+sacrificeSelected、siteBothLayers與untargeted cost，透過通用commitSite成本bundle付款；動畫Site走commitAbility的selected-unit cost同樣支援。collectionElder只接collectionCast續程，不重複殺victim。原18項修後全綠。

第19項真正流程：初次activate只開付款前commitSite，沒有cost window；JSON後取消，victim活、無入墓、mana／collection不動、仍無cost window。重做確認victim後，collectionCast有合法且付得起的Shoggoth，選單沒有Skip；victim還不在墓、spell mana尚未付。JSON後仍不能Skip；確認真正cast後付6、collection消耗、Shoggoth在本Site水下、victim恰入墓一次，cost window清空。沒有把付款後的mandatory效果誤當可退成本。

來源另實讀Collection Codex 78ce4090...（2026-03-25）：collection是hidden zone；但Search Codex fc2e5653-d210-4ba9-9280-57f2baeaedfd（2026-02-09）明定只有使用search字的效果才算search、private fail-to-find適用search。Elder沒有search／may，未找到可在合法且付得起時拒cast的明文，沒有自行擴張private search例外。

最新命令：`node --test /tmp/catalog-sites-wave3-candidate.mjs > /tmp/catalog-sites-wave3-after19.log 2>&1`。
**19/19 passed、0 skipped、exit0，2026-10-30 22:23 UTC**。只代表這些原生代表流程；完整回歸與正式納檔由root統一。子任務只改/tmp，原始18項沒有刪除或放寬，before的兩紅紀錄保留。

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data file access to portable relative URLs: tests/catalog-sites-native-wave3.test.js. Latest full formal regression pending. Actual UI is recorded separately, not inferred from these native cases.

## Complete formal regression

2026-10-30T22:28:35.810Z:2627/2627 passed, zero failures/skips, session3940 exit0. Stable data/all-cards-audit/logs/wave12-full-2627*. Initial2627/2626/1 retained an incorrect old Loner collection-retention expectation; original/TAP preserved, corrected from explicit SummonCodex with stronger physical-card conservation and JSON assertions. See data/loner-summon-tax-test-correction-backup.json. Native scope is not full per-card/UI approval.
