# 第十一批 Minion 原生規則稽核（/tmp候選）

## 最新穩定結果：25/25通過

2026-10-30T22:04:14Z讀取結果，session2288 exit0，`node --test /tmp/catalog-minions-wave11-candidate.mjs` **25/25通過、0失敗、0跳過**，log `/tmp/catalog-minions-wave11-candidate.log`。root已修Guardian mandatory及真正weaker比較、Guile per-pod toward與共地stay；原三個嚴格真紅完整保留且已通過。

本輪依root要求僅新增四個必要控制：鏡像Sirens與Giant anchor同格6，逐次真選north1、west5、stay6；每項嚴格驗選單正好[1,5,6]、cold JSON、真位置、不tap、無intercept。另Guardian只有共地weaker ally時，官方FAQ明文不是fly-to，故不提供zero-step飛行，也不Ward；此case通過。沒有未決Guardian共地裁定。

原21項中Guardian排除equal/here/enemy、兩步最短flight choice及抵達才Ward、mandatory不能skip，現在都完成實際操作並通過；Guile原非anchor共地stay與三鏡像方向均完成。不得繼續把它們算為僅baseline通過。

候選25項與本draft現停止寫入，無執行中子集，root可轉正式及跑完整安全節點。以下21項18過3紅與待根修敘述保留為修補前歷史；目前並無該三紅。仍不宣稱全UI或窮盡交互。

2026-10-30 UTC。按slug排序的下一6未查，先向root報名避免重疊：Grigori Rasputin、Grim Reaper、Grösse Poltergeist、Guardian Angel、Guile Sirens、Gyre Hippogriffs。只建立 `/tmp/catalog-minions-wave11-candidate.mjs` 與本draft；沒有改正式src/tests/docs/JSON、沒有啟模擬、沒有操作5500或問睡覺使用者。

## 最新可驗狀態

命令 `node --test /tmp/catalog-minions-wave11-candidate.mjs`：**21項、18通過、3個嚴格真紅、0跳過**，session73486 exit1，log `/tmp/catalog-minions-wave11-candidate.log`。原始17項15過2，其中初稿將Guardian錯誤optional當預期，已按實際卡文改為mandatory負控（強化而非放寬）。不以排除三紅的子集稱全部完成。

候選imports為workspace絕對路徑；無其他/tmp helper依賴。等待root統一修engine與通知才可promote。本候選現穩定、無測試仍在跑。

## 六張共同與逐卡效果覆蓋

每張各有native hand→legalActions→dispatch、實扣印刷cost、mana不足拒絕、各印刷threshold不足拒絕、離手、unit owner/controller/power、cold JSON。Guardian基礎無其他minion時只驗進場，不能把有合法弱盟友時的可skip當規則。

| 卡牌 | 已通過的實際原生效果／邊界 | 剩餘／確認問題 |
| --- | --- | --- |
| Grigori Rasputin | 真手牌cast、真ArcLightning殺死入墓；真Dreadwing召喚Genesis先strike己Avatar4；真Gigantism把donor4→10；真Teleport到enemy Site7；墓地特殊cast宣告前仍未付款；confirmation JSON；confirm後繼承Genesis真的再出discard/strike選擇，donor仍在Realm未banish；Ras2+donor印刷4=6而非buffed10；繼承Genesis以Ras全power6 strike己Avatar，life16→10；完成才banish donor，實付2；Ras本人真cast Air ArcLightning自傷4再Fatality自殺；第二次用新Ghoul重cast後power5且不再Airborne，驗死後借能力重置；另cancel保留真corpse/donor/mana，grave cast仍要正常mana及Fire閾值 | 控制權／Mortuary墓地視野、特殊保護cost、更多donor複製與Deathrite、UI未驗 |
| Grim Reaper | 真Lethal近戰殺4power bear；Reaper由Ward擋回擊；victim及全Realm複本（雙方皆有）banish；只搜victim owner的墓/手/deck，保留另一方zones與collection；JSON；另Reaper與Ghoul同步戰死，已捕獲kill effect仍banish victim/copies；殺Squeakers改banish、不出Pigs Deathrite；另stolen victim(owner0/controller1)確實搜owner0隱藏zones，不搜controller1 | 複雜damage credit/搜尋限制／墓地保護、多替代順序、UI未驗 |
| Grösse Poltergeist | 真hand cast後自然己end/敵draw，敵方真conjure Sword&Shield給己bearer；再敵end/己draw，Grosse已成熟可activate；取消選擇不tap，重開choice JSON後選敵實體carried gear；同UID變Automaton控制己/owner敵，power cost3+自bearer bonus2=5；舊bearer從6回4；JSON仍同一unit/artifact索引物件；真Silence罩Grosse不罩animated gear，既定animation/control仍在；下個敵回合原bearer真attack殺Grosse（自己選pass不defend），同UID還原地面原Artifact、無bearer/無controller、owner敵 | 多重animation/controller來源、可載minion原bearer、死亡/離Realm其他方式、UI未驗 |
| Guardian Angel | 基礎native cast/cost/threshold/JSON通過；設有distant weaker ally、same-location weak、equal-power ally及enemy；預期只讓distant弱盟友被選，選路徑後應真飛兩步、抵達才Ward、不tap/無intercept | **真紅1：equal Ghoul3也被提供**；**真紅2：卡文無may卻可skip**。因第一個早期斷言卡住，完整flight/Ward後續斷言尚須root修後重跑才算此批效果通過，不能先報已完成。UI未驗 |
| Guile Sirens | 真hand cast後經己end/敵draw/end到己start才觸發；mandatory敵minion選擇，排除far/below/ally、無skip；選Airborne Pegasus，unitStep JSON後可直接斜走到Sirens、不tap/無intercept；敵Ward只破不移、不tap；Immobile GloamToads不能take step（有別於forced movement），無移動/無tap | **真紅3：oversized共地part合法不拉動結果缺失**，見下。更多origin/跨region增強step、動態Power/disabled、UI未驗 |
| Gyre Hippogriffs | 真cast同回合不等turn refresh：Charge立即提供Airborne diagonal move；一例實際執行12→6對角步且tap、JSON仍3power；另一例本回合立即真attack，造成3給4power bear且自身被同時4傷殺死 | 更多defend/intercept/多步與effect timing、UI未驗 |

## 三個確認真紅與建議根因

### Guardian：錯誤weaker過濾

Guardian印刷power3，選單包含己方Ghoul power3。`fiftyCards.guardian_angel` selector使用`weaker:true`，而通用`selectEffects`只認`weakerThanSource`，所以宣告時沒有排除equal或stronger。`fiftyFly`真正resolve又用power比較拒絕，造成玩家可選非法候選但結果不飛。嚴格測試保留equal必須不在選單，root可修正selector key或統一正確語義；不要只把最後效果做成no-op。

### Guardian：沒有may但提供skip

卡文「Genesis → Fly to a weaker allied minion to Ward it.」沒有may。官方Genesis Codex說進場後依文字執行；同系統Guile FAQ也明解無may即mandatory。現definition `optional:true`額外添加null skip，即使有合法弱盟友。候選已從初稿接受decline改為嚴格不許skip，之後仍保留選弱盟友／完整飛行／Ward斷言。這是修正錯誤測例假設，非刪除效果或放寬斷言。

### Guile：oversized占格起點選擇缺失

Mountain Giant anchor6，size2占6/7/11/12；Sirens12。官方Guile FAQ明說pull/push oversized時可選其中一個合資格location，選已在Sirens處的part則不拉動。現target Giant後的`unitStep`只依anchor6→source12算toward，給anchor7或11，沒有可保持anchor6的合法結果。

嚴格case要求實際原生選擇流程能留在anchor6，JSON後也不tap。可以由root設計occupied-origin選擇再得到不動結果，或保持既有API提供等價destination；目前不能用強制dispatch不存在的action來假裝可操作。修補時須保留從其他part可向東／南的合法結果，並區分真正take step受Immobile/disabled限制與單純forced movement。

## 官方來源／版本與刷新限制

卡文/數值實讀未改的 `data/official-cards.json`。2026-10-30本輪新官方頁 [Grigori Rasputin](https://sorcerytcg.com/cards/grigori_rasputin) 及 [Grim Reaper](https://sorcerytcg.com/cards/grim_reaper) 可讀；其餘四張工具inaccessible，不標當前新頁已核。

採官方October2026 Rulebook與metadata `data/final-101-official-source-index.json`。實際以JSON讀 `/tmp/sorcery-official-embedded-docs.json`，相關來源：

- Rasputin完整順序 `46af8772-38e1-4316-8e8a-da1aa0aaa44e`，更新2026-02-09T06:03:18Z：只墓地能用，Evil ally可在任意Realm位置；用印刷power/abilities；繼承Genesis完成後才真正banish cost。本批每個重要階段真操作驗了。
- Rasputin只能banish Realm的Evil ally，不是墓或手牌：`40f0dd9f-8dcc-42de-ab05-419dbcc95c82`，更新2026-02-09T18:39:43Z；本批沒有另造非法手牌donor，保留更多zone拒絕邊界。
- Grim Reaper kill改banish、Realm copies不限controller、隱藏zones只搜victim owner：`FWsVZ4rxgHCtjTP73mTyJe`，更新2026-08-06T17:11:20Z；實際當前官方卡文另明列cemetery/hand/spellbook，所以按三者驗，不把FAQ摘要漏列當禁止。
- Grosse敵carried artifact變minion不可再由一般bearer攜帶，Grosse controller取得控制：`FWsVZ4rxgHCtjTP73mWCMa`，更新2025-07-10T18:34:36Z。
- 原bearer若可載minion仍由Grosse controller控制：`FWsVZ4rxgHCtjTP73mWCTS`，更新2025-02-20T23:04:25Z；本批一般bearer不具載minion，該分支未專測。
- Guardian不可fly到同location ally：`77206910-b69f-4ad4-9ba8-f0c6986adaa3`，更新2025-12-06T06:23:40Z。
- Guardian等weaker比較只在初選和開始resolve時檢查，移動中不用持續重驗：`5461d189-d707-406e-bcfd-e7ad749abd61`，更新2026-02-09T18:41:17Z；本批同初選equal紅，移動中power變動未測。
- Special movement路徑 `FWsVZ4rxgHCtjTP73mUBwm`，更新2025-12-05T17:31:08Z，指向Moving to a Specific Location；本批Guardian預定最短兩步但先被eligibility紅擋住，不能冒稱已通過。
- Guile target要同region：`eXfZjLHocReFQIApZdNRlk`，2025-02-20T23:04:25Z；實測below排除。
- Guile使用目標自身enhanced step：`eXfZjLHocReFQIApZdNkCK`，同日期；實測Airborne diagonal。
- Guile不tap、不開intercept：`eXfZjLHocReFQIApZdNkNc`，同日期；實測。
- Guile oversized origin：`eXfZjLHocReFQIApZdNkUO`，更新2025-07-10T04:01:06Z；正是第三紅直接依據。
- Guile無may所以mandatory：`ygoDG8fb7HS97qCW69rpkn`，2025-02-20T23:04:25Z。
- Genesis Codex `22b458ed-cb2f-407d-8a66-94fae90eb77e`，更新2025-06-16T20:10:04Z：進Realm執行所述效果，Guardian沒有may不能無故skip。
- Fly Codex `a679bc15-c028-430f-a84a-8b6556b33f0c`，更新2026-10-12T17:46:07Z：Guardian flies itself，不是forced movement；強制fly的邊界與自身Airborne要分清。
- Airborne、Charge、Lethal、Ward、Immobile、Disabled、Storyline等沿既有官方快取版本；基本步/動作按正常時序，不宣稱所有交互窮盡。

## 接續

候選25項與本draft穩定，仍只/tmp。root根修三缺陷後，原21及新增四個控制全數通過。其他六張未驗交互仍精確保留；UI由root另驗，不將generic cast、helper或模擬當逐卡完整玩法證據。沒有本子集session仍在跑（2288已exit0）。

## Promoted stable native candidate

Root preserved all25 strict assertions, portable relative imports/data URL in tests/catalog-minions-wave11.test.js. Mirror Guile choices and Guardian already-here negative are actual native effects, not helper-only. Full formal regression pending.

## Complete formal regression

2026-10-30T22:06:52.391Z: full2533/2533 passed, zero failures/skips, session67898 exit0. Stable data/all-cards-audit/logs/wave11-full-2533*. Actual13 UI scenarios include12 gameplay paths and one authoredThrone-level inspection, not full-card or all-interaction approval.
