# 第七批 Minion 原生規則稽核

2026-10-30 UTC。範圍：Frog token、Frontier Settlers、Frozen Horror、Gargantula、Ghost Ship、Ghoul。原始全庫ledger查核前為unreviewed。此分工只新增專屬 `tests/catalog-minions-wave7.test.js`、本文件；沒有修改runtime/JSON/官方快照或既有89項測試。

先在`/tmp/audit-minions-wave7.test.js`建立，不影響root正在跑的16場來源。Root確認session56095於20:43:55Z完整16/16且sourceUnchanged=true後授權移入正式測試，才建立上述正式檔。沒有啟動server或操作UI，沒有向使用者發問。

正式命令：`node --test tests/catalog-minions-wave7.test.js`。
最新結果 **15項、13通過、2個保留真紅、0跳過**，session7822 exit1，輸出 `/tmp/audit-minions-wave7-formal.log`。紅測是跨region與untargeted ally的Teleport合法操作缺陷，root統一修補後必須重跑，不得排除紅測宣稱全套全綠。

## 每張實際覆蓋

五張非Token各有獨立原生hand cast、實扣印刷cost、mana不足拒絕、每個印刷元素threshold不足拒絕、離手、owner/controller、印刷power、cold JSON恢復。Gargantula此基礎案例明確decline optional Genesis後才驗unit。Frog不宣稱正常hand cast可行，該維度不適用，且明測非法手牌Token無正常cast action。

| 卡牌 | 已通過原生效果／操作 | 未驗／限制 |
| --- | --- | --- |
| Frog token | 真Four Fat Frogs付費、選己water Site12生四個0power token；均有Submerge；一個成熟token原生走水下、JSON仍活；另一個受真Zap致死後banish、不入墓；手牌token不可正常cast | 其他生成/轉型途徑、戰鬥、複雜替代與UI未驗 |
| Frontier Settlers | 真native tap+目標選擇JSON；把真Atlas top AutumnRiver打到adjacent void7，即使該格不鄰任何己方Site（Settlers站敵controlled12，唯一其他己Site17距7二格）；Site Genesis實際keep；Settlers移去、tap；Atlas只移除top；手動untap後仍無能力，驗永久失能；另以真StarSeeds產neutral Rubble7，再由Settlers真top Valley取代並移去 | 無法進入新Site/多部位/不能play限制、取消及UI未驗 |
| Frozen Horror | 本回合剛召即可break Stealth（非tap成本）；當下其他nearby盟/敵minion disable、自己/遠方/below排除；新來者原生move進13後處理真defence pass，保持不disable，驗snapshot非持續光環；JSON；己end→敵draw/end→己start，期間保留、己下回合消失 | Ward/cannot-disable/重複能力來源、更多時序與UI未驗 |
| Gargantula | same-location其他minion也能合法cocoon；choice JSON；disable後普通成熟unit（非Spellcaster）真tap解繭，解除disable且記interactedTurn；另Talamh Dreig「Can't be moved by force」不被拖來，因此不cocoon | 更多拖拽路徑、跨layer/大型/保護、解繭成本失效時序及UI未驗 |
| Ghost Ship | 真hand cast→成熟後原生move進void（不觸發）→明確新move從void回Site才觸發；choice JSON；任何cemetery Spirit可選、非Spirit Ghoul排除；選敵墓Wills保敵owner、己controller、同Ship位置；不付印刷cost、不需Air threshold（真resources.air=0） | **真Teleport從void回Site原生合法動作缺失**；移動觸發已過但Teleport官方FAQ案例被引擎擋；死亡替代/受控/受保護墓地等仍待擴；UI未驗 |
| Ghoul | 無特殊卡文的真3power原生攻擊；對4power bear造成3且己同步死亡入墓 | 其他基本能力/region及UI未驗 |

## 兩個確認缺陷（共用Teleport合法操作）

1. **Ghost Ship在void中，Surface Avatar無法施放Teleport把它送到Site。** 官方Ghost Ship FAQ明說teleport void→Site仍觸發；Teleport卡文為「Teleport an ally to the surface of target site.」只Site是target，ally不限同region。場面真hand cast GhostShip12，真move7 void，真正Teleport入手後legalActions只提供搬Avatar自己的選項，沒有GhostShip→12。正式最後兩測中第一項保留該red。
2. **同region Failed Mutation無法作Teleport的untargeted ally。** Magic保護只禁止Magic target/damage，不是禁止一切Magic影響；Teleport ally是choice（只有Site target），原生legalActions卻排除它。第二項真正先正常施放FailedMutation，再要求Teleport把它從12送13，無action。不可用强制dispatch偽造合法選項。

共同根因 `rawSpellTargets` 先建立 `units = s.units.filter(regionsOverlap(caster,u) && canTarget(...) && !iceMagicProtection && !magicProtected...)`，再 `friends = units.filter(controller===p)`；Teleport沿用這個預設target+region過濾。`src/selector-semantics.js`已有 `teleport:{ally:choice(),site:target(...),declarationPlan:'target-site-then-ally'}`，亦顯示unit不是target。建議Teleport自行使用合法可被選擇的己allies，依其實際位置/能力驗forced teleport目的地；Site依target規則；不要全域放寬其他真正target spells。root整合runtime，此分工沒有直接改它。

## 官方依據及來源限制

官方卡文/數值：repository `data/official-cards.json` 原始快照，未改。2026-10-30本輪web新讀[Gargantula](https://sorcerytcg.com/cards/gargantula)成功，確認Genesis及解繭文字。Frog、Frontier、Frozen、GhostShip、Ghoul與Teleport官方同名卡頁工具inaccessible；不宣稱那些新頁已驗。官方October2026 Rulebook及Codex/FAQ快取版本見 `data/final-101-official-source-index.json`，內容以JSON解析`/tmp/sorcery-official-embedded-docs.json`：

- Frontier可play不鄰己方其他Site：FAQ `eXfZjLHocReFQIApZdNRRQ`，更新2025-02-20T23:04:25Z。
- Frozen能力只snapshot啟動時附近minions，新來者不disable：`ae34e8b6-d9fe-4058-889d-1c7b695158d1`，更新2026-02-09T18:39:52Z。
- Gargantula已同location可cocoon；拖不到這裡就不cocoon：`5396e5ca-6ca2-4f6d-be66-39d187f819a8`，更新2026-02-09T18:41:55Z。
- 解繭tap是special ability且算interaction：`09bd5981-658c-493a-a65d-7efaa2e7ea21`，更新2026-02-09T18:43:09Z。
- GhostShip從void teleport至Site也觸發：`FWsVZ4rxgHCtjTP73mYxVe`，更新2025-02-20T23:04:25Z。
- 從敵墓召的Spirit由己控制，明確summon不付印刷mana/threshold：`eXfZjLHocReFQIApZdNRci`，更新2025-02-20T23:04:25Z。
- FailedMutation等Magic不能target或damage，但非Magic仍可target：`a518e001-9551-49b9-b86c-e169597be758`，更新2026-03-25T19:18:05Z。
- Token `c0a4c32b-5894-4821-ae03-172b1358d5d9`：離Realm改banish。Frog直接驗了owner banished；不宣稱無owner的neutral Rubble會進某一玩家pile。
- Rubble `1a435965-bf30-4c8e-8cd7-086e1ae44017`，更新2025-06-30T05:15:26Z：neutral/no controller，可被Site取代如void。
- Nearby/Adjacent採既有Codex：Site/Square可跨region，Nearby/Adjacent minion/location守region。

## 修正過的原型假設

- Landbound新版Codex `64a2cd57-fed4-4ace-a2e5-a5f63a3e576c`是離land才disabled，不是禁止forced movement。因此未把SandWorm被拖到water列engine缺陷；改用真正Can't be moved by force的Talamh。
- Blink只允許nearby location，守region；所以不用Blink從Void跨到Surface來猜規則。官方FAQ使用一般teleport，真正Teleport牌是正確測例。
- Rubble不受任何玩家控制；原型手造「enemy-controlled Rubble」不合法，已改真StarSeeds產中立Rubble再驗取代。
- Frozen新到者移動打開defence/intercept窗口，必須真pass完成才end turn；未繞過pending狀態或改引擎。

沒有將這些fixture修正當作引擎修補，沒有刪除兩個真紅。暫停第八批，正式檔與doc穩定供root整合與全套回歸。沒有UI驗收或server重試，未向睡覺使用者發問或發進度。

## 依root要求補目的地Ward與Earl邊界

正式檔再加入2項，現在 **17項、13過4紅、0跳過**，session4507 exit1，最新輸出仍 `/tmp/audit-minions-wave7-formal.log`。root runtime修補前的四紅均保留，正式檔停止寫供整合。

- **敵方目的Site Ward**：合法宣告Teleport己bear12→敵controlled Site13（Ward）。印刷Site是target，應破Site Ward、己ally留12、仍付印刷cost2並離手入墓。現第一個Ward斷言看到仍true，來源resolveMagic teleport缺少目的地Ward結算。測試同時嚴格保留所有後續效果／付款斷言，修補後須全數通過，不能只改Ward旗標。
- **Earl作untargeted ally**：先正常hand cast Earl，給bearerAvatar一張普通Teleport。Earl文字是不能被Ordinary target/damage，非完全不受Ordinary影響；Site才是Teleport target，故應可選Earl從12送13且無傷害、正常付2。現無legal action，與rawSpellTargets共用 `canTarget` 排除原因一致。

Ward依據官方Codex `ae9b6774-aa8f-45c5-a424-d6d7e58014c3`（2026-10-12T21:55:51Z）：敵方spell/special ability指定有Ward的Site或unit時，Ward替代該效果。Earl依repository官方卡文及Teleport只target Site的明確語法，不需要新增家規。兩case由root明確要求且允許正式加入；未擴下一批、未改runtime或資料。
