# Pallid 空間／施法 passive 消費入口審計

2026-10-30；針對本次101張所需借用效果，僅審 movement/entry/casting/summoning，combat與control交由其他任務。這是讀碼審計，不是逐卡效果測試通過證明；root同時修改中，行號以本次產檔快照為準。

判讀：**L** 已由完整source views消費；**M** 部分layered但下游仍static；**S** 活體static缺口；**Z** 未入場／墓地／召喚card的zone-only規則，不能把realm bearer借來的效果永久帶出realm；**E** enter-time入口，拿到Bust不應追溯觸發；**H** hardcoded marker/slug。

| key | 分類 | 實際消費入口 | 判斷 |
|---|---|---|---|
| `adjacentUnitDiscount` | Z | [engine.js:1778](../src/engine.js:1778) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `ambushAbove` | E | [engine.js:352](../src/engine.js:352)<br>[engine.js:1651](../src/engine.js:1651)<br>[engine.js:1653](../src/engine.js:1653)<br>[engine.js:1870](../src/engine.js:1870)<br>[engine.js:2193](../src/engine.js:2193) | enter-only；先確認觸發時已具有來源，不能拿到Bust立即補發Genesis/入場物件 |
| `artifactSpellcaster` | M | [final-malleus.js:13](../src/final-malleus.js:13)<br>[dreams.js:6](../src/dreams.js:6)<br>[engine.js:437](../src/engine.js:437)<br>[engine.js:1733](../src/engine.js:1733) | refresh已從source展開；caster eligibility/restrictions仍有static讀取 |
| `cannotForce` | S | [final-passives.js:215](../src/final-passives.js:215)<br>[fifty-cards.js:52](../src/fifty-cards.js:52) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `carriedByType` | S | [transport.js:10](../src/transport.js:10) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `carryUnits` | S | [transport.js:9](../src/transport.js:9) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `castAnySite` | Z | [engine.js:1802](../src/engine.js:1802) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `castClearSite` | Z | [engine.js:1802](../src/engine.js:1802) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `castCornerVoid` | Z | [engine.js:1795](../src/engine.js:1795) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `castEliteSite` | Z | [engine.js:1802](../src/engine.js:1802) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `castFromGrave` | Z | [engine.js:1856](../src/engine.js:1856) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `castMinionsHere` | S | [engine.js:1800](../src/engine.js:1800) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `castRiverGenesis` | S | [engine.js:2185](../src/engine.js:2185) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `cemeteryAllyCast` | Z | [final-units.js:304](../src/final-units.js:304)<br>[final-units.js:313](../src/final-units.js:313) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `cornerOnly` | Z | [engine.js:1798](../src/engine.js:1798) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `cornerPilgrim` | S | [engine.js:351](../src/engine.js:351) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `denyAlliedEntry` | S | [geography.js:56](../src/geography.js:56) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `discount` | Z | [engine.js:1779](../src/engine.js:1779) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `enterChosenSiteDraw` | S | [engine.js:341](../src/engine.js:341) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `enterCopy` | E | [copying.js:8](../src/copying.js:8) | enter-only；先確認觸發時已具有來源，不能拿到Bust立即補發Genesis/入場物件 |
| `entryLances` | E | [engine.js:360](../src/engine.js:360) | enter-only；先確認觸發時已具有來源，不能拿到Bust立即補發Genesis/入場物件 |
| `evadeTeleport` | S | [attack-reactions.js:16](../src/attack-reactions.js:16) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `excludeCastElements` | S | [final-units.js:425](../src/final-units.js:425)<br>[engine.js:1867](../src/engine.js:1867) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `fiftyAnchor` | H | 見右側hardcoded入口 | fiftyForceAllowed直接比old_salt_anchorman slug，marker未被讀 |
| `fiftyForceImmune` | H | 見右側hardcoded入口 | fiftyForceAllowed/finalForceAllowed直接比talamh_dreig slug，marker未被讀 |
| `fiftyMaze` | H | 見右側hardcoded入口 | geography.locations直接比maze_minotaur slug，marker未被讀 |
| `finalCastToMortal` | Z | 見右側hardcoded入口 | finalUnitCastActions與beforeCast/prepareEntry直接比jack_the_ripper slug，marker未讀；屬pre-entry cast |
| `finalMimicEntry` | E | [final-units.js:470](../src/final-units.js:470)<br>[final-units.js:695](../src/final-units.js:695) | deferFinalUnitEntry使用hasAbilitySource(card,mimic)，不是unitPrintedAbilityRecord；enter-time，不能中途retro-trigger |
| `finalUnitExtraCost` | Z | 見右側hardcoded入口 | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `freeAfterMortalDeath` | Z | [engine.js:1770](../src/engine.js:1770) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `freeAxis` | S | [geography.js:95](../src/geography.js:95) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `freeClearLand` | S | [geography.js:95](../src/geography.js:95) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `freeWater` | S | [geography.js:95](../src/geography.js:95) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `geometryEverywhere` | S | [final-geometry.js:92](../src/final-geometry.js:92)<br>[final-geometry.js:112](../src/final-geometry.js:112)<br>[final-geometry.js:125](../src/final-geometry.js:125)<br>[final-geometry.js:147](../src/final-geometry.js:147)<br>[final-geometry.js:162](../src/final-geometry.js:162)<br>[final-geometry.js:231](../src/final-geometry.js:231)<br>[final-geometry.js:334](../src/final-geometry.js:334)<br>[engine.js:363](../src/engine.js:363) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `geometryFollowAvatar` | S | [final-geometry.js:176](../src/final-geometry.js:176)<br>[final-geometry.js:183](../src/final-geometry.js:183)<br>[final-geometry.js:193](../src/final-geometry.js:193) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `geometryGrowth` | S | [final-geometry.js:148](../src/final-geometry.js:148)<br>[final-geometry.js:153](../src/final-geometry.js:153)<br>[final-geometry.js:171](../src/final-geometry.js:171)<br>[final-geometry.js:172](../src/final-geometry.js:172)<br>[final-geometry.js:244](../src/final-geometry.js:244)<br>[final-geometry.js:273](../src/final-geometry.js:273) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `geometryLeap` | S | [final-geometry.js:198](../src/final-geometry.js:198) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `giveOnSiteEntry` | S | [engine.js:338](../src/engine.js:338) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `heirCopy` | Z | [engine.js:2151](../src/engine.js:2151) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `lifeDiscount` | Z | [engine.js:1779](../src/engine.js:1779) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `moveAxis` | L | [geography.js:88](../src/geography.js:88)<br>[geography.js:89](../src/geography.js:89)<br>[geography.js:90](../src/geography.js:90)<br>[engine.js:431](../src/engine.js:431)<br>[engine.js:518](../src/engine.js:518) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `movementShot` | S | [beta-completion.js:16](../src/beta-completion.js:16)<br>[final-units.js:392](../src/final-units.js:392)<br>[engine.js:999](../src/engine.js:999)<br>[engine.js:1000](../src/engine.js:1000)<br>[engine.js:2055](../src/engine.js:2055)<br>[engine.js:2060](../src/engine.js:2060) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `mustBelow` | Z | [engine.js:1869](../src/engine.js:1869) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `mustWaterSite` | Z | [engine.js:1795](../src/engine.js:1795) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `needEnemySite` | Z | [engine.js:1799](../src/engine.js:1799) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `needsSpellcaster` | L | [engine.js:500](../src/engine.js:500) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `floodOccupiedSite` | 完整views轉`spatialFloodSources`，每來源保ability timestamp，geography依序與Drought競合；bearer silence保gained，跟隨實際位置，不永久改Site旗標。 |
| `noForcedSubmergeNearby` | S | [remaining-rules.js:42](../src/remaining-rules.js:42) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `noMoveDefend` | S | [engine.js:1820](../src/engine.js:1820) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `noSiteThreshold` | S | [engine.js:189](../src/engine.js:189) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `nonOrdinaryCaster` | M | [final-units.js:425](../src/final-units.js:425)<br>[engine.js:438](../src/engine.js:438)<br>[engine.js:1867](../src/engine.js:1867) | refresh已從source展開；caster eligibility/restrictions仍有static讀取 |
| `outerColumn` | Z | [engine.js:1797](../src/engine.js:1797) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `oversized` | H | 見右側hardcoded入口 | makeUnit/cast/copyFits直接比mountain_giant slug；size是characteristic，不應因借能力直接複製尺寸 |
| `pickupCarriedCost` | S | [engine.js:145](../src/engine.js:145) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `projectileOver` | L | [engine.js:431](../src/engine.js:431)<br>[engine.js:521](../src/engine.js:521)<br>[engine.js:537](../src/engine.js:537)<br>[engine.js:1610](../src/engine.js:1610)<br>[fifty-cards.js:220](../src/fifty-cards.js:220) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `pushAfterMagic` | S | [engine.js:2183](../src/engine.js:2183) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `randomDiscardCost` | Z | [engine.js:1860](../src/engine.js:1860)<br>[engine.js:2160](../src/engine.js:2160) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `realmVerticalWrap` | L | [engine.js:527](../src/engine.js:527) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `revealHandsInMotion` | S | [engine.js:2205](../src/engine.js:2205) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `revealOnMove` | S | [engine.js:344](../src/engine.js:344) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `shackled` | S | [engine.js:454](../src/engine.js:454)<br>[engine.js:1895](../src/engine.js:1895) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `shareProjectileOver` | L | [engine.js:537](../src/engine.js:537) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `shareVerticalWrap` | L | [engine.js:536](../src/engine.js:536) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `skeletonOnMoveHurt` | S | [engine.js:345](../src/engine.js:345)<br>[final-borrowed-combat.js:11](../src/final-borrowed-combat.js:11) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `skeletonReturnCost` | Z | [engine.js:1851](../src/engine.js:1851)<br>[engine.js:2045](../src/engine.js:2045)<br>[app.js:208](../src/app.js:208)<br>[app.js:254](../src/app.js:254) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `spellElement` | L | [engine.js:478](../src/engine.js:478)<br>[engine.js:510](../src/engine.js:510) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `spellElements` | M | [final-malleus.js:13](../src/final-malleus.js:13)<br>[dreams.js:6](../src/dreams.js:6)<br>[final-units.js:426](../src/final-units.js:426)<br>[final-units.js:428](../src/final-units.js:428)<br>[engine.js:431](../src/engine.js:431)<br>[engine.js:478](../src/engine.js:478)<br>[engine.js:510](../src/engine.js:510)<br>[engine.js:511](../src/engine.js:511) | refresh已從source展開；caster eligibility/restrictions仍有static讀取 |
| `stealthOnVoidEntry` | S | [engine.js:346](../src/engine.js:346) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `stepAfterRanged` | S | [engine.js:595](../src/engine.js:595) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `tapSummonedNearby` | S | [engine.js:348](../src/engine.js:348) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `tetherSite` | S | [engine.js:364](../src/engine.js:364) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `threshold` | S | [metamorphosis.js:17](../src/metamorphosis.js:17)<br>[engine.js:191](../src/engine.js:191)<br>[engine.js:195](../src/engine.js:195)<br>[engine.js:1843](../src/engine.js:1843)<br>[collection.js:72](../src/collection.js:72) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `topMagic` | S | [top-casting.js:6](../src/top-casting.js:6) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `towerLich` | L | [engine.js:435](../src/engine.js:435) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `unburrowDesertGenesis` | S | [engine.js:345](../src/engine.js:345) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `uniqueVanguard` | L | [engine.js:517](../src/engine.js:517) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `verticalWrap` | L | [geography.js:60](../src/geography.js:60)<br>[geography.js:93](../src/geography.js:93)<br>[engine.js:431](../src/engine.js:431)<br>[engine.js:519](../src/engine.js:519)<br>[engine.js:527](../src/engine.js:527)<br>[engine.js:536](../src/engine.js:536) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `voidEntryKill` | S | [engine.js:347](../src/engine.js:347)<br>[engine.js:930](../src/engine.js:930) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `voidSummoning` | S | [engine.js:1795](../src/engine.js:1795)<br>[engine.js:2193](../src/engine.js:2193) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `waterEnemyDiscount` | Z | [engine.js:1771](../src/engine.js:1771) | spell/墓地card靜態讀取可保留；realm borrowed abilities不應跨zone存活 |
| `topEvil` | S | [top-casting.js:6](../src/top-casting.js:6) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `enemyAvatarMana` | S | [engine.js:197](../src/engine.js:197) | 仍依card slug／static passive或static ownPassive，活體Bust來源不會被消費 |
| `grantNearbyKeyword` | L | [engine.js:540](../src/engine.js:540) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `grantOnSite` | L | [engine.js:540](../src/engine.js:540) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `chargeIfDead` | L | [engine.js:509](../src/engine.js:509) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `avengePreviousTurn` | L | [engine.js:515](../src/engine.js:515) | unitPassiveLayerViews已展開，應保每source條件與instance |
| `finalShark` | H | [final-units.js:412](../src/final-units.js:412) | special movement/plunder helper多用hasAbilitySource(card,slug)，需另查是否含activePrintedSources，不能僅憑card.abilitySlugs算Bust已支援 |
| `finalSeaRaider` | H | [final-units.js:286](../src/final-units.js:286) | special movement/plunder helper多用hasAbilitySource(card,slug)，需另查是否含activePrintedSources，不能僅憑card.abilitySlugs算Bust已支援 |
| `finalCaptain` | H | [final-units.js:282](../src/final-units.js:282) | special movement/plunder helper多用hasAbilitySource(card,slug)，需另查是否含activePrintedSources，不能僅憑card.abilitySlugs算Bust已支援 |

## 高優先級批次

1. geography：`denyAlliedEntry`目前batchPassives raw；`freeAxis/freeWater/freeClearLand`目前aquaticPassives raw；Maze直接slug。`queries`參數已存在，可供root接source adapters。
2. transport：`carryRule`只有u/api沒有state；`carryUnits`與`carriedByType`為static，須傳state並保capacity／type／ally／pickupEnemy／disable整組條件，不能把其中一個值OR成另一規則。
3. geometry：`rule(u,lookup)`取geometryPassives[rawslug]，Pallid動態source不在這裡。size characteristic與growth／power／安全／跟隨／跳躍等能力須分開，來源cache不可覆寫carrier card／類型。
4. 活體cast：`castMinionsHere`／`voidSummoning`／`topMagic`／`topEvil`、`threshold`／`noSiteThreshold`／`enemyAvatarMana`、`pushAfterMagic`／`castRiverGenesis`。`nonOrdinaryCaster/excludeCastElements/spellElements`refresh部分已有layered，但legalActions及Jack額外cast分支仍raw。
5. stateBased入場／移動：`ownPassive`整體仍raw，影響`giveOnSiteEntry`、`enterChosenSiteDraw`、`fiftyGhost/fiftyEel`、`revealOnMove`、`skeletonOnMoveHurt`、`unburrowDesertGenesis`、`stealthOnVoidEntry/voidEntryKill`；`cornerPilgrim/tapSummonedNearby/tetherSite`另有raw讀取。每次queue應帶實際ability origin／instance，重複source要各自觸發或依該規則採existential。

## 不應誤當立即待補的 static

- `castingCost`的d大多是要施放的c，而不是既有bearer；各種自身召喚限制、額外費、墓地施放與cost不能只因有Bust活體就套到手牌／墓地card。
- `entryLances`／`enterCopy`等入場能力拿到Bust後通常已錯過enter event；需確認來源存在時點，不能以補發效果假裝涵蓋。
- `oversized`是未被直接讀的標記。原Mountain Giant尺寸在makeUnit按slug指定，官方size characteristic不隨一般能力借用自動移植。Yog/Moeba印刷文字含不同部分，須按官方FAQ再拆。
- `hasAbilitySource(card,slug)`只檢card.slug/abilitySlugs；`unitPrintedAbilityRecord`還會看Pallid的activePrintedSources。前者可支援runtime borrowed card，不能直接證明Pallid裝備借用已支援。

本審計未修改engine、artifacts或任何registry。root後續授權owned borrowed-spatial adapters實作，完成後應另列修復與真dispatch證據，而非覆蓋此讀碼基準。

## 後續已授權的實作與驗證

Root在唯讀審計後授權新增`src/borrowed-spatial.js`、修改owned geometry helpers，並由root獨占套入engine/geography/transport/app整合。上表保留為改動前基準，以下是最新實作，不應再將已修項誤算pending。

### 已接入完整來源消費

| Keys | 最新消費入口與語意 |
|---|---|
| `geometryEverywhere/geometryGrowth/geometryFollowAvatar/geometryLeap/geometryAttackBelow` | `refreshBorrowedSpatial`從完整`unitPassiveLayerViews`建立序列化cache；`geometryRules`每來源讀取。多growth power分別計數；bearer silence只移除printed，保外部gained；失來源保既有尺寸但失growth／安全／跟隨。Yog的Site protection用`geometryIgnoreSites`交給既有集中gate。Yog和Mountain Giant的原size都不因借abilities複製，詳見下方更正。 |
| `denyAlliedEntry/fiftyMaze/freeAxis/freeWater/freeClearLand` | `spatialDenyEntry/spatialMazeAllows/spatialFreeMove`，geography傳入state API；每source保完整條件，移動免費許可OR，不能離開等禁止條件AND。 |
| `cannotForce/fiftyForceImmune/fiftyAnchor` | `spatialCannotForce`；本人免疫及友方附近anchor各自判定，不依來源card slug。 |
| `carryUnits/carriedByType` | `spatialCarryRules/spatialCarriedTypes`；transport保每個來源的完整capacity、ally、weaker、pickupEnemy、disable、immobile條件。每個pickup action帶`carryAbility/carryOrigin`，UI顯示來源；passenger記`carriedAbility`，capacity和持續效果不混成單一大rule。移除來源只放下該來源乘客。 |
| `pickupCarriedCost` | `spatialPickupCarriedLimit`取有效許可最高上限（OR許可），不將兩個上限相加；正常物品owner不改。 |
| `floodOccupiedSite` | 完整views轉`spatialFloodSources`，每來源保ability timestamp，geography依序與Drought競合；bearer silence保gained，跟隨實際位置，不永久改Site旗標。 |
| `noForcedSubmergeNearby` | `spatialForcedSubmergeAllowed`由完整live source views判附近guard。 |
| `castMinionsHere/voidSummoning/topMagic/topEvil` | 活體來源許可；void Summoning的whileVoid條件也由同一live來源判定；top action保存來源instance／origin。 |
| `spellElement/spellElements/nonOrdinaryCaster/excludeCastElements` | Avatar任務的`caster-permissions.js`處理qualified Spellcaster許可OR與獨立禁止AND；本adapter僅delegate `A.casterPermissionAllows`，避免第二道錯誤AND或循環依賴。 |
| `giveOnSiteEntry/enterChosenSiteDraw/fiftyGhost/fiftyEel/revealOnMove/skeletonOnMoveHurt/unburrowDesertGenesis/stealthOnVoidEntry/voidEntryKill/cornerPilgrim` | `spatialMovementEvents`逐source產生事件，攜帶abilityOrigin／instance／nature；quest、corner狀態按instance；入void看regionNames且事件位置是實際新location。 |
| `tapSummonedNearby/ambushAbove` | `spatialSummonEvents/spatialAmbushEvents`保真正summon／移動事件時點；只接活體ambush，沒有因中途獲得Bust就追溯強迫入地下。 |
| `tetherSite/revealHandsInMotion/castRiverGenesis` | live predicate或逐來源事件；River Genesis保實際施法proxy與正確來源，依Storyline結算。 |
| `movementShot` | `resolveSpatialMovementShot`逐source optional choice；`spatialShotsUsed[instance]`每次movement獨立重設；同位置decline不消耗整次movement機會，後一步仍能射；source照舊傳給真正projectile解析，不用單一boolean折疊兩個來源。 |

`pushAfterMagic/stepAfterRanged/damageOnStop`由Effects任務接source-aware combat triggers，本任務沒有重複接線。資源`threshold/allThreshold/noSiteThreshold`與`cannotDropAll`由Artifacts任務處理。禁止把這些別人完成項誤算本helper獨立覆蓋。

### 真實操作證據

`tests/borrowed-spatial.test.js` **39/39通過**，不是只測presence flag：

- 真的Bust Genesis放逐墓地Felbog，之後bearer獲得跨越一步；未準備前沒有該Move。
- 外部Felbog／Cerberus／Megamoeba／Yog在bearer silence仍工作；detach停止follow、growth／安全，保尺寸／carrier實體card。
- native Mega和gained Aether power獨立累計；借Yog保原尺寸、得安全及少五void放逐；native／真正Selfsame basic copy仍占全部location。
- Maze／Undesirables真Move限制（surface禁止不誤擴到同Site below）；Owl敵方Site真召喚；Lucid Dreamers void真召喚且保whileVoid關鍵字；East-West免費多步。
- Earl禁止Ordinary但仍有Elite真cast action；Merlin真top Magic cast／手牌頂可見權與detach撤銷。
- 兩個carrying來源各capacity1，native ally不disabled，gained captive disabled；detach只掉gained乘客。Sir Tom Thumb借用類型確實可被Beast載。
- 兩個Army移動事件真生兩Skeleton，拆一只生一；Varistus在新void location真殺敵；Phase Assassin真void entry獲Stealth。
- 兩個Skirmishers來源可各射一次；原位置decline後可在下一步射同instance；實際傷害及每來源記憶驗證。
- Fenvale真cast→River Genesis來源→Spring River真正keep/bottom選擇→原Zap結算。
- Magpie真偷敵方已攜物；Driftwood阻真正Nelly activate→projectile target→drag→Submerge，detach後同Submerge允許；Swiven真movement range揭手並隨detach撤銷。

最近聯合執行：

```sh
node --test tests/borrowed-spatial.test.js tests/final-geometry.test.js tests/final-ability-integration.test.js
```

**164/164**通過。此數字只表示這三檔當下結果；完整專案測試由root統一執行。

### Zone／enter-time排除仍有效

本次沒有把既有bearer的Pallid來源永久寫回physical card或手牌／墓地card。自己的cost、召喚位置限制、墓地施放、入場copy／lance、extra cost等仍須依事件時點與所處zone判定，不能因raw讀取就一律改成realm bearer's union。`hasAbilitySource(card,slug)`亦不自動等於active Pallid來源，後續如再發現活體讀取仍應個別修。


### 尺寸界線更正

先前root與本實作把借Yog的occupies-all部分也當能力，暫時授40location；這不是已核Pallid專例。重新核官方Yog FAQ `07764c06-99a2-42a2-b0bb-b7fd1c63e13f`（updated 2026-02-09T18:42:48Z）明示size為characteristic，現依同一通用界線更正：Pallid／Grigori／Vivien只借安全、少五void放逐與忽略Site能力，不借Yog尺寸；與Mountain Giant一致。native及真正基本複製仍40，silence不縮size。已保留原native40測試，加真Selfsame copy40及一格borrowed bearer安全／少五void放逐測試。


### 額外同範圍驗收

- Megamoeba官方Whirling Blades FAQ `eXfZjLHocReFQIApZdOpQi`要求只沿實際兩個pseudopod的starting/destination locations出手。已新增兩階段小選單宣告完整兩步（宣告期間實體不動），而非生成數萬條路徑；`fiftyRoute`只記真正分肢起終點。native及Pallid-borrowed Mega真cast兩項均證：remote 0→1、19→18敵人被擊殺，未參與的anchor12敵人不受傷。
- Perceval annotated Genesis的definition instance帶`:genesis:0`，現`spatialSetQuest`對齊來源record instance；兩個相同Perceval來源各自選7／13並保獨立quest，真移動到7只觸發該來源抽牌與重新選點，不改另一來源。拿Bust本身仍不會retro-trigger Genesis。


Tide Naiads補驗兩項通過：外部能力於bearer silence仍flood且隨Move轉移，拆Bust撤銷、不永久寫site.flooded；兩個來源stamp5／20與Drought10按timestamp排序，拆20後只留5時變dry，撤Drought後5重新flood。另保native Winter Nymph自己被召喚也會tap的回歸測試。


### Cult 實際召喚位置權限

`topEvil`的「here」是對指定位置的明確許可，可在另一玩家控制的來源 Site 召喚；不是把所有獨立召喚限制一併略過。核心 `canSummonAt` 新增獨立 `explicitSitePermission` 參數，只在 outer／corner／敵方位置等卡牌限制判定後略過通常的己方 Site 所有權要求。三項真 dispatch 測試分別驗證：借 Cult 從 library 頂在敵方 Site 真召喚 Ghoul；Dormant Monstrosity 仍不能召喚於非 corner 的敵方 Site，移到合法 corner void 則可召喚；選單產生後移除來源時，舊 action 被拒且不消耗頂牌或 mana。

驗證快照：`borrowed-spatial` 36/36；與 geometry100 及 ability-integration28 聯合 164/164。實際執行記錄保存在 `/tmp/borrowed-spatial-latest.log` 與 `/tmp/spatial-combined-latest.log`（本機暫存，非永久來源）。

### Consumer follow-up after Cult

- Dream-Quest's unit candidate loop previously rejected every silenced unit before checking its actual Spellcaster qualification. Root removed that blanket guard, preserving controller, disabled, dying, region, and actual keyword checks. Three real dispatch tests now cover gained Skeleton Mage under bearer Silence actually falling asleep; native silenced Mage and a bearer whose grant was detached both absent from the real choice; and a silenced Avatar casting Dream-Quest on another eligible Mage. This does not claim Avatars can be put to sleep. Latest source suite: 39/39.
- Normal casters retain Avatar characteristics and gained Spellcaster. The qualified permission helper excludes silenced printed records while retaining gained records. Core top-casting injects spatialLayers; its raw fallback is not the normal engine path. All production carryRule callers pass state and source instance. The early movementShot resolver consumes the op before the obsolete raw branch.
- Reported two off-realm VV ambushAbove scalar consumers to root: below-cast eligibility and entry placement. Duplicate source records may omit the runtime scalar key, so these must consume full offRealmPassiveEntries.
- Owned geometrySummonAllowed now reads all contextual printedAbilityRecord/abilityLayerRecord records for Cerberus's self-summoning restriction, retaining native fallback. Two equal source instances still require the actual allied Avatar location and layer. Geometry suite: 101/101. Avatar owner is adding the real VV cast integration case separately.

Latest combined execution after Dream-Quest and Cerberus source follow-up: borrowed-spatial39 + geometry101 + ability-integration28 = 168/168 passed. Full project results remain root's responsibility.

Spell-specific casting permission follow-up: normal casters had another redundant early Silence gate before d.casterTypes/d.casters. Root removed only that gate; the full positive qualification remains. Burning Hands and Firebreathing each now have a true silenced qualified-body cast and actual grid damage test; a third test excludes silenced native Skeleton Mage, wrong creature types, and unqualified Zap casts. Grid suite 47/47 passed.
