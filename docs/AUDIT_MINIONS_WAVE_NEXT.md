# Minion 稽核下一批：D 六張

日期：2026-10-30 UTC。此批只新增 `tests/catalog-minions-wave-next.test.js` 與本文件，沒有修改共用引擎、卡牌快照、逐卡JSON或既有測試。六張來自原始 minions ledger 順序中的第一批 unreviewed，排除另在處理的 Monks/Megamoeba。由 root 統一整合引擎與更新 ledger。

命令：`node --test tests/catalog-minions-wave-next.test.js`。本批最後執行結果 **16測、14過、2失敗、0跳過**，完整輸出 `/tmp/minions-wave-next.log`。兩個失敗是保留的明確規則紅測，不能排除後稱全套通過。共用引擎後續修補由 root 重新執行及記錄。

## 每張實際覆蓋

六張各有獨立原生 hand cast、真實 mana 扣費、insufficient mana 無合法 cast、每個印刷元素 threshold 不足無合法 cast、離手、unit owner/controller/位置、JSON 後 power/ownership 驗證。Dormant 的基礎施放使用沒有折扣單位的 corner void，故基礎扣費仍嚴格等於7。這六筆「基礎施放」不等同逐卡完整規則驗收。

| 卡牌 | 已通過原生效果及邊界 | 已確認失敗 | 尚未驗收 |
| --- | --- | --- | --- |
| Dirium Fomorians | 原生地下召喚；Burrowing+Submerge 可一步從 land 地下走至相鄰 water 水下；移動後 JSON、6 power與存活 | 無 | 水下原生召喚、全部戰鬥與更複雜特殊移動、實際UI |
| Doctor Demetrius | 本回合剛召喚也可用不tap的 once 能力；另一個同square surface minion 合法；自己、diagonal、同square below 不合法；choice JSON；Ward實際加上；再次啟動不可；後續真Zap破Ward且不受傷 | 無 | 新回合 once 重置、選擇取消／目標在結算前離場、更多Ward交互、實際UI |
| Doomsday Cult | 雙方 top 公開；雙方各自實際從 spellbook top 原生施放 Evil 到 Cult here；正常扣費；實體top移除、下一張非Evil不可施放；中途JSON | 無 | silence/removal與全部多部位here、top變更競態、取消、實際UI |
| Doomsday Prophet | 真Zap對附近敵方受體1→2；兩格外受體仍1；原生近戰 brown4 對 amazon5 打4並留下1生存，證明strike不變8；另一方正常反擊殺4power攻擊者 | 無 | 友軍/本人/雙方各有Prophet、多重替代順序、below區域及實際UI |
| Dormant Monstrosity | 只corner void合法、非corner void與corner Site不合法；同summoning square Voidwalker與大型鄰接unit各只計一次，實付3；正常cost/threshold拒絕 | **diagonal unit誤算折扣：應付5、實付3** | root 修補後全套回歸；更複雜跨region/多來源copy折扣、實際UI |
| Draco Corvus | 原生tap只提供tapped minion；choice JSON；teleport到target後、無Burrowing target真死亡入墓、施術者留surface且tap；water target仍合法teleport但Burrow失敗 | **mixed land/water大型target竟整體Burrow：應surface、實below** | root 修補後全部forcedBurrow/多部位/Ward/死亡時序、實際UI |

## 缺陷及修補建議

1. Dormant：`src/final-vivien.js` `offRealmCostAdjustments` 的 `adjacentUnitDiscount` 使用 `A.nearby(cell,at)`。該函式舊雙參數呼叫採Chebyshev距離，含diagonal。卡文及Adjacent Codex只允許同square或正交。重現：corner0 void、unit5、unit6，只有5正交，應7−2=5，實7−4=3。建議改 state-aware 正交距離 `<=1`，保留 `.some` 每unit只算一次及自己square。
2. Draco：`src/engine.js` `dracoArrive` 只查target anchor非water，直接 `target.layer='below'`，跳過whole-body Burrow條件。重現：tapped Mountain Giant anchor7,size2，water8，且有Burrowing+Submerge以排除致死干擾；Draco teleport7後目標被放below。Burrowing Codex規定任一part在water，整次Burrow失敗，應留surface。建議沿用本輪加入的whole-body forced-layer pipeline；保留teleport先結算，不能用取消teleport掩蓋Burrow失敗。

## 來源與限制

- 實際卡文/數值：`data/official-cards.json` 每張 `engine`；本機來源為原有官方快照，未修改。
- 2026-10-30 本輪新開官方 [Dirium Fomorians](https://sorcerytcg.com/cards/dirium_fomorians) 成功，確認兩個keyword。其餘五張相應官方 URL 本輪工具回 inaccessible；不能標為新鮮官方卡頁已核。
- Official October 2026 Rulebook：`/tmp/sorcery-official-rulebook-oct2026.txt`，版本/來源見 `data/final-101-official-source-index.json`。
- 官方 Codex/FAQ 內容快取：`/tmp/sorcery-official-embedded-docs.json`，本輪以 JSON 解析讀取，不是憑空推斷：
  - Adjacent `1d3363e4-3b12-46fb-99d9-f4319967f484`，更新2025-07-14：含自己square及正交，不含斜角；相鄰minion要同region。
  - Nearby `7de60b0a-855c-4bab-95a7-7e6f172ba4a0`，更新2025-07-14：含自己與8格。
  - Burrowing `16ed5006-40f3-4df2-8b60-6d0b13bb35a8`，更新2026-02-09：與Submerge雙能力可跨land地下/water水下；forced Burrow任一waterpart全失敗，不賦予生存能力。
  - Submerge `aaa76e05-0cbc-4114-ad1c-411eeec89eea`，更新2026-02-09。
  - Corner `8ea4ca44-ea21-4dd0-94a0-02ffee19b2d9`，更新2025-07-10：四角square。
  - Ward `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`，更新2026-10-12。
  - Strike `8bb6e5a1-6989-4ec1-98d7-ef50283cccf6`，更新2026-02-09。
  - Dormant FAQ `8e7365e8-dd99-499c-a3c0-7b5e4eee1c40`，更新2025-12-06：含召喚square，每unit只計一次，即使占據多個鄰接square。
- 新6張都沒有實際瀏覽器操作驗收；UI待root所記錄的服務權限。未啟動或重試任何server。
- 未宣稱窮盡全部卡牌組合，未改或決定任何待裁定家規。

## 第二批六張（同一正式測試檔追加15項）

Root 已在20:08:10Z完成前一階段完整1899/1899，允許本檔再新增；因此不再只存在/tmp。共用引擎修補仍由 root 負責。現在本檔合計31項（舊16＋新15），本批初始14項13過1真紅（tmp log `/tmp/audit-minions-wave2.log`），後加一項Earl原生Fireball操作，最終正式命令輸出 `/tmp/minions-waves-next-current.log`。此處未將 root 後續全套結果預先稱成功。

六張各有獨立原生 hand cast、印刷cost、insufficient mana、每個元素threshold不足拒絕、離手、ownership/controller、power、JSON。Drowned 的一般施放case使用water12 below；Dreadwing基礎case明選strike完成Genesis，不能忽略未結算choice。

| 卡牌 | 實際測試覆蓋 | 已確認缺陷/限制 |
| --- | --- | --- |
| Draconian Bonekite | 真tap選自己surface location、choice JSON；自己不傷；surface ally及enemy 3power各死；4power受3存活；同square below不傷；每個死者各生成1個真Skeleton，共2個、同location且己方控制 | 尚未驗死亡替代/多部位受體/召喚稅與UI |
| Dreadwing | distant10施放而己Avatar17，真Genesis strike4、己life16敵20；選擇JSON；另選真手牌Zap棄入己墓則不strike | 尚未驗Ward/多重Genesis/替代、UI |
| Drowned | 真合法cast全為water12 below，surface與land below皆不允許；JSON存活、Submerge | 尚未驗強制/特殊免費施放與UI |
| Dwarven Digging Team | nearby ally獲Burrowing，enemy/far不獲；FAQ不允許無印刷Burrowing的hand minion提前地下召喚 | **確認紅測**：ally獲Burrowing原生move13 below後失去關鍵字而死，應仍被nearby Site授予；尚待root修補與全回歸；UI未驗 |
| Earl of the Ivory Towers | Earl本人可施放non-Ordinary Fireball但不可施放Ordinary Zap；對方Zap不能指定；普通bear真strike傷Earl0，Earl反擊3；補Earl真正付4施放Fireball、存檔、方向宣告、impact選擇並殺敵 | 尚未驗全部untargeted Ordinary Magic/物品rarity、Ward交互、UI |
| East-West Dragon | 真native move一次向東兩格12→14；不能向上兩格或斜上兩列；後JSON、tap、Airborne | 尚未驗所有有限步與免費步混合路徑/牆/Globe、UI |

Dwarven根因：`src/engine.js` 授予 `grantNearbyKeyword` 位於共同 `if(!regionsOverlap(s,source,u))continue` 之後，將「occupying nearby sites」誤當「nearby minions」。Nearby Codex明確Site可跨region；地下仍占Site，不應因此失去Burrowing。建議只將 `grantOnSite` 分支提前至region guard前，依來源/受體實際佔格處理nearby Site；一般Rebecks/WildHunt等nearby minions仍需region，且Void不應因相近獲得Site授予。測試明確assert ally必須活著，沒有用undefined TypeError當唯一斷言。

本批FAQ來源（官方快取，於2026-10-30解析核對）：

- Dreadwing `dbb68059-94b4-4221-a7e3-1beb66dade84`，更新2026-02-09T18:43:12Z：遠方召喚仍strike自己的Avatar。
- Dwarven Digging Team `ygoDG8fb7HS97qCW69iIMM`，更新2025-07-10T18:35:06Z：召喚選地點時尚未獲得Burrowing，不能直接地下召喚。
- East-West Dragon `ygoDG8fb7HS97qCW69id4c`，更新2025-02-20T23:04:25Z：diagonal不是sideways。
- Nearby、Burrowing、Submerge、Strike採前段相同Codex ID與版本。

六張官方卡頁本輪web open全部回 inaccessible；因此卡文/數值採官方原有repository快照，未宣稱新鮮卡頁全部已驗。沒有server啟動、UI操作或裁定待決問題。

## 第三批六張（同檔追加17項）

Root通知20:11:32Z完整1942/1942成功後，才從/tmp移入第三批。正式檔現在 **48項，最新44通過/4失敗/0跳過**，四個失敗皆Estranged Loner的真collection/召喚稅規則缺陷。結果 `/tmp/minions-waves-next-current.log`，root尚須整合修補與全套回歸。沒有在這裡更動引擎或JSON。

| 卡牌 | 已測原生流程 | 未驗/缺陷 |
| --- | --- | --- |
| Eltham Townsfolk | 真施放、cost1/earth1不足拒絕、JSON；真攻擊普通bear，造成印刷2並同時被4打死進墓 | 更多戰鬥/target/UI未驗；無特殊文字 |
| Enraged Familiar | 真施放/費用threshold/JSON；真Zap自己Avatar失1life使power2→4；真DivineHealing回滿仍4；真end換回合移除bonus回2 | 非damage失血/多層替代等未驗；UI未驗 |
| Entombed | 真施放/費用threshold/JSON；只land below可cast，surface或water below不許；真地下存活/Burrowing | 特殊免費cast、強制位移更多交互未驗；UI未驗 |
| Escyllion Cyclops | 真施放/費用threshold/JSON；被bear原生攻擊受4而不反擊，bear damage0；自己原生attack則正常6殺bear並承4 | 為隔離攻守案例，攻擊分支前明確重置active/born/damage；不是宣稱完整自然回合流程；strike以外fight/多方戰鬥/UI未驗 |
| Estranged Loner | 真施放/費用threshold/JSON；真ArcLightning殺死才觸發Deathrite；optional decline保存collection；limited empty collection指名外部Hybrids允許；中間choice JSON | **constructed空collection仍憑空召1；有card不消耗；MockCourt召喚稅沒付；無mana仍召**四真紅；需root修補；UI未驗 |
| Evil Twin | 真施放/費用threshold/JSON；copyEntry只能enemy；選bear模型，複製印刷4但不複製3damage；變Evil；真對模型攻擊先制殺掉，不受model報復 | 非surface召喚FAQ限制另待直接測、多部位/已獲能力/ward等；UI未驗 |

Loner根因：`definitions` death使用通用 `summon horrible_hybrids`，engine該分支不取collection也不付召喚稅。需用 `collectionEntries`/`takeCollection`（保留limited external named-card例外），並在真召喚前檢查site/layer與`paySummoningTax`；不能先消耗collection再發現付不起。MockCourt兩測從原生ArcLightning付4後檢查：可付者應總增spent5，實4；不可付者應不召且保留collection，現仍召。沒有將基礎minion成本3當作Deathrite召喚成本，僅要求額外召喚稅1。

官方來源：

- Collection Codex `78ce4090-a2e1-4893-97c0-6eaafd5c5937` 更新2026-03-25T19:19:53Z，constructed collection最多10且遵rarity；limited未用pool且指名卡可取external；兩者不能混同。採本機官方快取已解析全文。
- Evil Twin FAQ `01cc23b7-4dfb-4d98-900c-c0b773a75306` 更新2026-02-09T18:40:01Z：非surface位置選擇在copy能力獲得之前，因此不能以未來copy的keyword來選非surface召喚。已核來源，另未新增此FAQ直接case，不能冒稱已測。
- 2026-10-30本輪官方 [Entombed](https://sorcerytcg.com/cards/entombed) 與 [Evil Twin](https://sorcerytcg.com/cards/evil_twin) 卡文頁可讀；Eltham、Enraged、Cyclops、Loner同名卡頁工具inaccessible，卡文/數值仍以repository官方快照為準。
- UI全部待root已記錄的權限；沒有重試server，沒有待裁定規則擅定。

## 第四批六張（暫存 /tmp，等待正式測試寫入窗口）

`/tmp/audit-minions-wave4.test.js` **12/12通過**，2026-10-30T20:15:53Z讀取結果；log `/tmp/audit-minions-wave4.log`。正式48項檔未因本批而更動，需root通知才移入，不能將/tmp 12過冒稱已包含在此前完整全套。

六張各有原生 hand cast、實扣費用、insufficient mana、所有印刷元素threshold不足拒絕、離手、owner/controller、power、JSON恢復。Faith在沒有Ward的基礎場面維持0power；並未捏造額外關鍵字。

| 卡牌 | 已通過的實際效果／操作 | 剩餘限制 |
| --- | --- | --- |
| Failed Mutation | 真cast於己方Site7；Magic Zap不能指定；真Fireball命中同location別的bear時splash不傷Mutation；後續真物理近戰4傷仍能殺它，它也反擊4 | 更多非Magic指定能力/區域／替代/UI未驗 |
| Faith Incarnate | 真cast；雙方各1unit Ward＋兩端Site Ward共4，power8；真Zap打己Ward bear使Ward破、傷害0，Faith隨即降6；JSON | 多Ward建立移除順序、其他copy能力/UI未驗 |
| Fallen Angel | nearby allied Demon加1，遠方/敵方/below Demon不加，Angel自身非Demon維持3；silence來源後加成消失，JSON | 多部位來源、交互依存/UI未驗 |
| Far East Assassin | 真cast並原生conjure AmethystCore到bearer；選目標再選物品，中途JSON；真投擲造成印刷cost1傷、來源tap失Stealth；item落在敵受體location且不再carried/controller null；敵原生pickup拿走 | 不同費用/不可攜帶物、Ward/取消、超大型受體落點/UI未驗 |
| Felbog Frog Men | 真cast後一步12→2越過Pit7、不進Pit，JSON仍活；Site7缺失則不能跨越 | 其他leap路徑/多部位/Globe/UI未驗；既有geometry測試不是代替本批原生施放 |
| Fenvale Muse | 真cast；本人實際cast Zap；選敵River7觸發Genesis、遠River4不提供；Genesis由River controller1看牌並選bottom；只移動敵deck，不移自己deck；choice JSON及Zap真傷害1 | 重複cast/拒絕觸發/複數River或below等/UI未驗 |

官方FAQ快取已讀取：

- Failed Mutation保護不只target，還包括Magic無指定傷害：`a518e001-9551-49b9-b86c-e169597be758`，更新2026-03-25T19:18:05Z。非Magic效果仍可target。
- Faith計算realm所有unit/site Ward、不限己方：`c743033b-1d06-4613-8bcc-a7ae678a317c`，更新2025-12-06T06:19:52Z。
- Assassin投擲後物品不再carried且無controller、任何同地點unit可pick up：`eXfZjLHocReFQIApZdIrj6`，更新2025-02-20T23:04:25Z。
- Assassin使用特殊能力失Stealth：`ygoDG8fb7HS97qCW69jpOK`，同更新日期。
- Muse觸發敵Site由Site的controller結算Genesis：`4382f474-50bc-4556-bd4c-7d1789736b9b`，更新2026-05-19T18:39:57Z。

六張官方卡頁本輪web open全部inaccessible，因此卡文/數值仍採repository官方快照。沒有新增裁定假設。初稿fixture曾誤將Core mana cost當2（印刷為1）、以enemy Site7召喚己minion、以及預期單一物件pickup還開choice；已按真卡文/原生action修正合法fixture，未更改任何引擎或規則斷言以掩蓋缺陷。

## 第五批六張（/tmp 原生測試，尚未移入正式檔）

`/tmp/audit-minions-wave5.test.js` 14測 **13通過/1真紅**；log `/tmp/audit-minions-wave5.log`。正式測試仍保持48項穩定。本批六張皆有原生施放/實扣cost、mana不足、所有印刷threshold不足拒絕、JSON/ownership/controller/power。Fey基礎施放明確拒絕optional Genesis後驗unit，沒有把未結算choice當成功。

| 卡牌 | 原生效果及邊界 | 未驗／缺陷 |
| --- | --- | --- |
| Fey Changeling | 真付3cast敵方Site7；same-location被對手控制但己方擁有的minion回己owner手，非controller手；below同square minion排除；non-surface非法召喚拒絕；choice JSON | 更多site/void/multi-part例外、取消付費/UI |
| Field Laborers | 剛召不能tap付成本；成熟後真native tap令available mana+2；JSON；真end turn清除bonus | 額外untap與連用/稅/UI |
| Fine Courser | 真cast本回合即Charge；原生pickup真盟友，JSON後帶盟友12→14兩步移動，持續carriedBy | 容量/敵方/多層/drop/牆及UI |
| Finwife | 真cast Submerge minion；敵Avatar原先遠方不加mana，移近+2；Finwife原生下潛後離開敵Avatar區域、bonus歸零；JSON | 複數Avatar/巨型身體/UI |
| Fisherman’s Family | 真cast提供W1；無Water Site/bonusAffinity仍允許原生cast Water閾值1的FrogMen | **原生Philosopher’sStone首Water施放折扣錯誤：Fisher應付1、實付2**。不能只看cost/threshold0當無色；修補元素分類不應增加印刷threshold要求；UI未驗 |
| Flagellant | 真Ward擋Zap完全不heal；下一次Zap實傷1 heal1；另一次ArcLightning4致死也只heal1；JSON | 多個獨立同時傷害/重導/臨死時序及UI |

Fisherman真紅不是static資料掃描：先將Philosopher’s Stone原生conjure至己Avatar，該bearer本回合尚未cast任何Water spell，接著原生cast Family；印刷cost2應享first Water折扣1，實付2。`src/cards.js hasElement`因snapshot threshold0/elementsNone誤判無色。官方同一FAQ亦提Castle Servants/Air、Common Cottagers/Earth、Blacksmith Family/Fire，建議root查這幾張一致修補元素，不改卡牌原始快照或閾值。

官方快取來源：

- Family四張算各色spell：`ygoDG8fb7HS97qCW69pP1D`，更新2025-07-06T06:56:10Z。
- Fey不能未具keyword就先選地下/水下/void：`eXfZjLHocReFQIApZdIErk`，更新2025-02-20T23:04:25Z。
- Fey的可召任一Site只是額外位置，不是免費cast：`ygoDG8fb7HS97qCW69mWI9`，更新2025-07-06T07:02:51Z。
- Flagellant被預防傷害不heal：`c94b73e6-a44f-4675-b5f6-f73d16001bfd`，更新2025-12-06T06:19:47Z。
- Flagellant一個5傷event只heal1，分開5個1傷event則各heal：`ea3c82f1-fd6f-47f6-be2b-b4a12dc2c6f5`，更新2025-12-06T06:18:00Z。

本批卡文/數值採repository官方快照；未冒稱本輪新官方卡頁已核。尚無實際UI驗收，無server重試或裁定待決問題。

## 第四／第五批移入正式測試（root允許的新窗口）

Root於完整1998/1998、2026-10-30T20:19:08Z成功後通知可移入，因此第四12＋第五14已正式追加同一測試檔。另依root要求增加四色family各自真實Philosopher’s Stone施放折扣回歸，共4項。正式檔合計 **78項**，不是原本48；這4項只是既有/本批Family元素分類交互補證，不憑此增加新卡整體驗收數。

四色測試都從真Stone conjure給Avatar開始，再由bearer原生cast對應Family，嚴格驗實付cost−1、Avatar真castElements包含對應元素及JSON後保留；同時斷言該印刷元素threshold仍0，防止把顏色修正誤作增加閾值。四張名稱：Castle Servants/Air、Common Cottagers/Earth、Blacksmith Family/Fire、Fisherman’s Family/Water。官方依據皆FAQ `ygoDG8fb7HS97qCW69pP1D`。本輪未修改原始官方snapshot、共用runtime或ledger。

## 第六批六張（/tmp，11/11通過，正式78項維持穩定）

`/tmp/audit-minions-wave6.test.js` 最新 **11/11通過**，log `/tmp/audit-minions-wave6.log`；包含Token明確進banished的強斷言。只有其餘5張非Token各有正常hand cast、mana不足、所有印刷threshold不足、實cost、JSON/owner/controller/power。Foot Soldier是Token，不捏造手牌正常可cast，cost/threshold hand-cast維度不適用。

| 卡牌 | 原生實際效果覆蓋 | 尚未驗 |
| --- | --- | --- |
| Flaming Skull | 真原生Fireball由Skull施放、付費／方向／impact JSON、殺敵；本人不tap；Air Zap不可由它施放；Airborne | 混合元素等其他caster限制／UI |
| Flayer | 真Genesis傷己方及敵方nearby minion各1、己Avatar也1；自己/far/below排除 | 代表替代/多部位/Ward／UI |
| Foot Soldier | 手中Token不能正常cast；真BorderMilitia在邊界5個己Site10..14各生1個token；power1/JSON；真Zap致死後unit消失、不入墓且確實banished | token轉型/控制權等其他途徑／UI |
| Forsaken | 原生cast只outercolumn，不因限制額外允許敵Site；真Voidwalk從己outerSite10走進void5、JSON仍活 | 任意其他void召喚位置/多層／UI |
| Fowl Bones | 真NoviceNecromancer Genesis取得Skeleton；真cast Fowl13、Zap致死進墓；真墓地resurrect action付1、犧牲該Skeleton、Fowl從墓消失並回到Skeleton位置12；Air閾值0仍可summon；中途JSON | 缺Skeleton/不合法subsurface、額外召喚稅等／UI |
| Frisky Red Squirrel | 真Genesis指定附近對方bearer攜帶物，far gear不提供；choice JSON；物品離原bearer13，放到sourceSite12 below、controller null；原bearer留13 | 無法攜帶物/水Site/目標Ward/多部位source／UI |

來源已讀本機官方快取：

- Forsaken FAQ `1aceb478-4cdb-41dc-a1ab-d89d43884c26`，更新2026-02-09T18:39:55Z：outercolumn是額外cast限制，不授權平常不可召的位置。
- Token Codex `c0a4c32b-5894-4821-ae03-172b1358d5d9`，更新2025-06-30T04:10:13Z：Realm內如一般卡；離Realm改banish；不將其稱為進cemetery。
- Sacrifice Codex `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`，更新2025-12-21T07:10:37Z：只可犧牲控制且在Realm的卡；破壞防止不能救犧牲。此批只測普通Skeleton付費，未冒稱所有replacement都測。
- Spellcaster Codex `89067d2f-058b-4c86-b3ae-3aebf1c3895a`，更新2025-06-26T20:52:37Z；Fireball有Fire閾值，Zap只有Air，符合本例限制。
- 卡文/數值採repository官方快照；本批沒有宣稱重新讀取六張官方卡頁。沒有UI或server動作。

原型曾誤認BoneRabble會Genesis生Skeleton，實卡無此文字；現用真正NoviceNecromancer Genesis生成，沒有捏造token或放寬Fowl祭品斷言。

## 第六批已正式移入

Root明確通知目前無完整回歸在跑，已將第六11項從/tmp加入正式tests/catalog-minions-wave-next.test.js。正式檔現在89項，所有第1至第6批共36張的代表效果證據均已在正式測試檔，沒有以此宣稱完整規則/UI驗收。停止擴第七批，交由root整合既知紅測；本子代理不操作5500 UI、不向睡覺使用者發問或發進度。

### 六批正式子集最新結果

2026-10-30T20:23:41Z讀取完整結果：`node --test tests/catalog-minions-wave-next.test.js` **89/89通過、0失敗、0跳過**，session17848 exit0，log `/tmp/minions-waves-next-current.log`。本輪前述Dormant/Draco/Digging/Loner/四色family的before紅測在root整合修補後皆通過；沒有刪除或放寬斷言。這是本專屬正式子集結果，不等同root最新完整全套或實際UI驗收。此檔與test停止寫入，交由root納入全套及逐卡ledger。
