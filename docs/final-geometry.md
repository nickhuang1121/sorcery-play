> 2026-10-30最新：使用者已批准Globe留原Aura格／等值投影去重、Snowball單圈、雙Throne當前回合玩家勝；這些是專案裁定，取代本文相應舊未決描述。Globe已正式開放；Chaoswish可真正免費conjure Globe，僅Book結果仍阻擋。最新原生、同步、實際UI證據見FINAL_FIVE_RULINGS_IMPLEMENTATION.md。Book的target算choose已確認，single／Ward時點仍未選家規。

# 最後 101 張：幾何卡牌驗收

2026-10-30 最新狀態：原九張及後續 The Rack 共十張，**九張核心完成並已正式註冊；Magellan Globe 部分完成，未正式開放**。`geometryPassives`存在helper不等於完成，不能整張表直接展開。以本頁與實際`src/definitions.js`一致的註冊為準。

## 逐張效果與證據

| 卡牌 | 核心狀態 | 實作位置與涵蓋效果 | 有意義的驗證 |
|---|---|---|---|
| Felbog Frog Men | 完成 | `geography.locations`→`geometryLeap`；直線跨一個相鄰Site計一步，不進入中間Site | 真Move越Bottomless Pit、缺中間Site、silence、Movement、Immobile、disabled、跳躍攻擊／防守 |
| Cerberus in Chains | 完成 | `geometrySummonAllowed`、`followGeometryAvatars`、`geometryOwnMoveAllowed`；同Avatar位置召喚、跟隨、不能自己離開 | 真手cast及非手召喚限制、Move、Teleport、silence、新位置連續效果重算 |
| Putrid Presence | 完成 | `canAttackSubsurface`與核心逐location攻擊／防守；附近下層可攻擊Site | 真地下及水下Site攻擊、雙方、距離、silence、正確下層防守者、Ward |
| Edge of the World | 完成 | Site放置／移動／交換／效果／移除Globe投影guard及`geometryViolations`；不合法變更不結算，失去抑制後失去相鄰void自毀 | 真手Site放置、Cloud City、Smokestacks、Earthquake、Clay Golem／Sow不能吃掉Atlas、最後Globe移除限制 |
| The Void | 完成 | `isVoidCell`保留Site；`regionNames/regionsOverlap`雙region；安全／施放／移動入口 | 真敵方Voidwalker手cast、普通minion不能敵方cast、silence撤權、跨layer Voidwalk需目的terrain能力、強制Teleport普通minion放逐；同格兩layer共有void但不是相同實體位置 |
| Yog-Sothoth | 完成 | `geometryEverywhere`40records、全區域安全、`geometryViolations.banish`、集中`siteEffectAllowed`自然Protected From Sites | 真手cast、Site-origin傷害被忽略、silence失安全放逐、少五void checkpoint放逐；授Spellcaster真40起點、同格上下層區別、copy permit存檔pin及偽造起點拒絕 |
| Aethermoeba | 完成 | canonical `geometryLocations`、`commitGeometryLocations`、`growthLocations`、按void location計power | 真手cast→兩方正常end/draw→下一回合長入void，保原Site且power1；多來源通用幾何測試與Megamoeba共模型 |
| Megamoeba | 完成 | 同上，全部location計power；跨layer記錄、silence整形平移、逐分肢推拉、Site帶相應分肢 | 真Move／遠端Teleport保舊部位、Burrow同格上下2loc、silence平移、既占remote位置搬gear不增power、由舊部位攻擊、任一非anchor部位失安全死亡、Gnome Hollows每一步先量進入前power；Scatter、Maelstrom、Windblast、Whirlwind分肢真選擇及牆邊界 |
| The Rack | 完成 | `geometryRackStrike/Options`、`resolveGeometry`、固定layer-aware shape、逐location entry-only history、`refreshGeometryWorld`fall | 真strike→選new adjacent location→依location數失life；不能跨region／重選舊位置；silence裝備不觸發；遵守oversized不能同時占surface/subsurface；另以Megamoeba跨層Troll Bridge事件證實entry source正確；整shape移動不增長；Site不攜oversized；Globe移除controller選最近合法shape／無fit縮小選舊loc／存檔還原 |
| Magellan Globe | 部分 | 全域state-bound metric、矩陣／投射物／Area／border wrap、2x2召喚與移動、移除後fall選擇均已接 | 真手cast與Mountain Giant跨邊cast；Airborne角落、water connectivity、projectiles與多種矩陣跨邊；fall正確controller、偽造actor拒絕、JSONrestore、minion死亡／Avatar縮小。保留以下規則疑義 |

## 引擎接入與紀錄

- 生物占格保留`{at,layer}`，同格surface/below分別計數；空void只有一個可選施法location。`occupied`只供需要方格集合的舊介面，不能取代實體location。
- 大小是特徵：silence保留已長身體並以整體平移；不再有growth/power。Globe存在時整形可跨邊。
- `geometryEntryRecords`記錄每個進入location及其layer；`observedPosition.locations`存檔保存。Rack伸展不設justEntered、不執行movement／border／stop triggers，但正常執行各來源Site entry，source帶實際layer。
- 推拉選項明列`來源座標 layer → 目的座標 layer`，保存`from/to`，只長指定pseudopod。Ice阻實際跨越的border；Fire在該border傷一次，不從body anchor推定。
- Windblast／Whirlwind先規劃全部分肢選擇，最後一個frame同時移普通與growth單位。Maelstrom保留原同時規劃流程。
- `moveGeometrySiteParts`供Cloud City、交換Site、Earthquake映射各Site上的pseudopod，保留其他部位，不誤算growth或entry；silenced oversized不被單一Site攜帶。Rack固定oversized亦不被Site帶走。
- 施法proxy不更動entity uid／實體anchor，`action.casterLocation`鎖定起點；app來源去重保location並顯示座標，AI、freeCast、copy permits及JSONrestore保descriptor。實體stealth／gift bookkeeping更新真正unit。

## 驗證

`tests/final-geometry.test.js` **100/100**；其中只有Globe仍為隔離測試worker的prototype註冊，其他九張使用正式註冊。

最近聯合驗證：

```sh
node --test tests/final-geometry.test.js tests/final-grids.test.js tests/final-effects.test.js
```

**189/189**通過（幾何100、圖案44、effects45）。完整專案測試由root統一執行，不以這三檔通過取代完整測試。

## 尚存限制

Globe官方九項FAQ沒有解決普通Aura失去Globe時如何重新安置，也沒有直接規定5×5傷害圖案在4row環面上同格被原始矩陣兩格覆蓋的數值處理。沒有擅自以最大值、去重或累加推定；Globe維持部分，不能因其他九張完成而開放。

以上為已核卡文與列明FAQ的核心實作；整個遊戲所有舊卡牌交互不是本頁測試的完整官方認證。若發現具體未符合規則的交互，應增加反例並修正，不能靠刪除測試或降斷言通過。

## 官方來源

- [Aethermoeba](https://sorcerytcg.com/cards/aethermoeba)、[Megamoeba](https://sorcerytcg.com/cards/megamoeba)（核13FAQ）
- [Yog-Sothoth](https://sorcerytcg.com/cards/yog_sothoth)（核3FAQ）、[The Void](https://sorcerytcg.com/cards/the_void)（核6FAQ）
- [The Rack](https://sorcerytcg.com/cards/the_rack)（核4FAQ）、[Magellan Globe](https://sorcerytcg.com/cards/magellan_globe)（核9FAQ）
- [Felbog Frog Men](https://sorcerytcg.com/cards/felbog_frog_men)、[Cerberus in Chains](https://sorcerytcg.com/cards/cerberus_in_chains)、[Putrid Presence](https://sorcerytcg.com/cards/putrid_presence)、[Edge of the World](https://sorcerytcg.com/cards/edge_of_the_world)（核2FAQ）
- [Adjacent](https://sorcerytcg.com/codex/1d3363e4-3b12-46fb-99d9-f4319967f484)：adjacent locations不能跨region。
- [Casting Spells](https://sorcerytcg.com/codex/43a73161-4f77-46b1-a23a-f916223a748c?sub=c1d892d55c44)：多location施法者須確定施法location。
- [Step](https://sorcerytcg.com/codex/0f53b70d-d13a-4982-8c16-20bb4ab1aa9d)、[Immobile](https://sorcerytcg.com/codex/7db6da14-a5eb-4dcf-8b3b-4ba4e3ecfbeb)

來源使用背景瀏覽器官方可見卡面與FAQ查核，沒有讀取隱藏應用程式狀態。所有整合patch均由root套入，共用引擎沒有多人直接覆蓋；本任務未推送、部署或變更Firebase。

## 官方規則疑義再查（2026-10-30）

### 查核範圍與可確定結論

- [Globe九FAQ](https://sorcerytcg.com/cards/magellan_globe)：允許Aura與oversized跨邊施放、grid跨邊、鄰近／投射物跨邊；移除時的解答雖以card跨邊為題，但實際安置步驟只指定unit，並分別處理minion與Avatar。沒有給非unit Aura安置步驟。
- [Aura Characteristics](https://sorcerytcg.com/codex/30561063-e0e1-41f7-9ab2-903475629dde?sub=1872ec9038d6)：Aura預設占四個surface／void locations的2×2區域。
- [Moving Auras](https://sorcerytcg.com/codex/1c5c02a4-586e-4bfd-99ce-11e9230ed140?sub=cfade9791284)：非minion Aura可在surface與void之間移動，不能因此進入subsurface；沒有說Globe結束後如何重排。
- [Layer System](https://sorcerytcg.com/codex/aa624e74-7c3e-4622-8471-03e05b576c52)：定義ongoing effect的層與timestamp；Flood/Drought範例只處理Site的water affinity先後。沒有空間形狀的失效後處理。
- [Mandatory Actions](https://sorcerytcg.com/codex/af65379e-7a9a-4d6f-9a9e-99f1434575e8)：唯一一般規則例是Avatar在void時放Site；沒有Aura自動移動或棄置規則。
- [Damage Grid](https://sorcerytcg.com/codex/015d636e-716c-450e-9e17-abef557f3e4c)：grid可旋轉與鏡射、預設同origin region、可部分超界且一般不target各格。沒有同一grid的兩個印刷格投影到同一實體location時的去重／累加步驟。
- [Oversized Units](https://sorcerytcg.com/codex/7f57fe26-eac3-45a4-b449-994fef47d872)：一個unit占多個受影響location時各location傷害相加；這能證明多location單位傷害相加，不能單獨證明同一location被折疊的兩個grid格傷害相加。

### 真正未解問題

1. **普通Aura在Globe移除後如何處理？** 例：Aura原先占A4/E4/A3/E3四格；移除後這四格不再是一般2×2。把unit的closest-fit規則類推給Aura，是合理候選但官方解答只寫unit；凍結四格則需要說明如何豁免Aura的2×2預設；直接刪失效果或棄置同樣無來源。已查頁面不足以選其中之一。
2. **5×5 grid在4row環面重疊如何計數？** Doomsday Device中心C2時，最上／下兩印刷row在環面都投到第4row；C4同時承接兩個值4的印刷格。該location的單格unit應受4還是8？Globe只說grid可跨邊，Damage Grid與Oversized均未指示這種同一location重覆投影的數值結合。不能把oversized多location求和直接冒充此裁定。
3. **The Flood：同詞官方FAQ已找到，原blocker移除。** 全文搜尋官方完整FAQ資料，在[Great Old One](https://sorcerytcg.com/cards/great_old_one) FAQ `ygoDG8fb7HS97qCW69kS5d`找到對永久淹整個realm（包括void）同一用語的直接解釋：全部Sites（包含rubble）整場flooded，之後進場Sites也flooded。這說明including voids是未來Site亦受全域持續效果影響，不須捏造空void的virtual Site或underwater。The Flood執行由Effects任務接續；不是從已有Site的The Void模型推導。來源updated `2025-02-20T23:04:25Z`，revision `OVwv9CvZAhvcLZb6pGC0hS`。

剩餘兩個Globe問題屬**規則依據不足**，不是工具被拒、權限待批或操作結果不確定。上述官方頁均已成功讀取；只能說已查來源未提供足夠答案，不能聲稱所有官方渠道均無裁定。可把以上兩個Globe具體案例交由官方裁判回答；本任務未擅自向外發送詢問。

### 研究帶來的實際修正

Oversized Units另明確禁止一般oversized同時占surface與subsurface，只有特殊卡文能豁免（例如Megamoeba）。The Rack四FAQ沒有豁免。因此已修Rack stretch拒絕與現有Site parts不同layer的候選，即使The Void兩層共有Void region、Avatar有Burrowing/Submerge也一樣。原先允許Rack跨層的測試已按此原始規則更正為拒絕；另外保留Megamoeba真跨層入Troll Bridge、觸發frame來源為below的測試，驗證entry records沒有回退。這不是降低測試要求。

另核[Skeleton Token](https://sorcerytcg.com/codex/4d00cfac-df9c-417c-80c8-40bce04a46a8)：Skeleton是1power、Ordinary、Undead及air minion。已回報root，應以runtime normalization補原始資料缺漏，原始snapshot不變。


官方完整資料補查也確認Globe問題沒有在其他卡FAQ補明：共有216 Codex（含69子條目全文）與753 FAQ的只讀資料，依grid／overlap／span／wrap／aura等關聯查核；Rolling Boulder FAQ只說path不重複location，不能直接類推damage grid合併，故仍不猜4或8。Yog size characteristic FAQ revision `9CUWpgoW5Q44hTUbbHIGbe`、updated `2026-02-09T18:42:48Z`；Skeleton Token revision `LMVXo7FMYpSQSPwXD8K9uU`、updated `2026-02-09T18:39:11Z`。

### October 2026 rulebook recheck

Rechecked the current official rulebook, explicitly labelled **October 2026**, 38 pages; official How to Play target: https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view ; Drive modified timestamp supplied with the fetched source: **2026-10-12T20:32:30Z**. Read the complete extracted text at `/tmp/sorcery-official-rulebook-oct2026.txt`; did not reuse a 2025 edition.

The two remaining Globe questions still have no explicit answer in this edition:

1. **Ordinary Aura after Globe leaves:** printed page 19, Casting Auras, defines the ordinary four-square intersection footprint, including surface sites and voids. It does not specify relocation, clipping, destruction, or a controller placement choice when an Aura's wrapped footprint stops fitting after Globe leaves. The later static-effects paragraph (printed page 30) requires continuous application but supplies no such placement procedure. The complete extracted text contains no Globe-specific or Aura relocation rule. Existing unit-only FAQ cannot silently be extended to non-unit Auras.
2. **Repeated damage-grid cell on a wrapped small dimension:** printed page 29, Damage Grids, gives damage to each unit at affected locations in the same region. It does not define addition versus deduplication when two distinct printed cells map onto the *same* physical location (e.g. Doomsday Device's two outer rows on the four-row wrapped realm). No repeated-cell/wrapping procedure appears elsewhere in the complete text. Oversized accumulation across *different* occupied locations does not itself answer duplicate mappings onto one location.

Consequently this current primary source confirms the baseline footprint and region rules but does not settle either edge case. Globe remains partial for these precise interactions; no shared engine behavior was changed or guessed during this recheck.
