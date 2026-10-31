# Artifact Wave11 候選：Sunken Treasure 至 The Pallid Bust

2026-10-30 UTC。僅寫root授權的 `/tmp/catalog-artifacts-wave11-candidate.mjs` 與本文件，絕對workspace imports；正式tests/docs/JSON/src未動，不啟動模擬、不干預既有full或未知模擬、不聯絡睡覺使用者。六張依當前未review slug挑選並先報root。

## 最新實際結果

`node --test /tmp/catalog-artifacts-wave11-candidate.mjs`：**19/19通過、0skip、exit0**，約4.8秒。exec直接回傳結果；依只准兩tmp檔限制，未另產log。此前兩個草稿fixture錯誤已按實際操作與卡文修正，沒有確認引擎紅測。

六張共同測項：真正hand cast legalActions→dispatch、印刷費實付、hand移除、insufficient mana無cast、owner/location與cold JSON。cold是同process JSON序列化後重install原始官方catalog再restoreGame，非已完成新瀏覽器驗收。六張自身印刷threshold0，threshold拒絕N/A；另Malleus所施Magic驗正常mana/threshold仍必需。

## 來源

- 卡文/費用用現有官方snapshot `data/official-cards.json`、October2026規則書與官方embedded Codex/FAQ快取；FAQ按cards slug精確比對，不把純名稱搜尋當完整核對。
- 本輪六個官方card頁web open全為InternalError，故沒有宣稱本輪最新官網卡文刷新成功；沒有反覆重試。
- Sunken Treasure FAQ `eXfZjLHocReFQIApZdIEFM`，更新2025-02-20T23:04:25Z：一到surface即處理Treasure，即使在movement/attack/defend中途。本批用真movement在travelStop/Finish前出draw choice驗證。
- Immortal Throne FAQ `FWsVZ4rxgHCtjTP73mTtTc`（2025-02-20）：alone要求同location無其他units；`FWsVZ4rxgHCtjTP73mTtso`（同日）：playing包含Site0與cast spell；`ygoDG8fb7HS97qCW69htj8`（同日）：檢查printed cost，非modified payment。`ygoDG8fb7HS97qCW69kaCv`（2025-12-21）alpha foil印錯卡文應用正常版，本批沿用官方snapshot正常文字，不另測印刷錯誤。
- Malleus FAQ `f1ba891f-8671-4852-874c-39accc7fbb56`，更新2025-12-06T06:17:51Z：非Spellcaster bearer仍可cast。本批真手牌conjure再使用，非只注入artifact。
- Sword and Shield、Tabula Rasa、Pallid Bust沒有本輪cards-slug匹配特定FAQ。對Tabula僅測明確power修改/printed keyword與damage/drop，未擅定Bane、control等待答「status」範圍。
- Tabula修改限制依Can't be Modified／Characteristics與既有source-aware ability layers；Pallid依printed abilities與特徵區別：printed types是卡文明確賦予，printed power不在賦予範圍。沒有移植其他遊戲的規則。

## 每張原生證據

|卡|實際覆蓋|未驗／限制|
|---|---|---|
|Sunken Treasure|真cast3費，有己Water12/13、敵Water0，原生對手1選項只12/13；cold選12使Treasure於Below。真具Submerge bearer移動下潛12、pickup，經真兩turn再surface；物品立即sacrifice入墓，drawCards2出現時bearer仍inBasicTravel，cold選1Atlas+1Spell後hand+2。無己Water時無合法cast且不扣費。|高級墓地替代/多Treasure/controller變動、完整大型表面轉換、UI未驗。|
|Sword and Shield|真cast3費給Bears4，cold後power6；native attack殺4powerBears且自身收4但存活，證明加成實際進入戰鬥；經真turn後drop，power回4且gear loose。|多份裝備、Silence/不能modify、同時死亡及UI未驗。|
|Tabula Rasa|真cast2費到敵Pegasus，cold後silenced、失Airborne但printed3power保留；到敵真turn，真正己方Overpower指定bearer仍不能+2，正常Zap可造成1，不能drop唯一Tabula。|Ward/Stealth/跨region的「may cast any minion」細節本批未裁；Bane/control等既有規則未決仍保持，不能把power案例當全部unmodifiable範圍已驗；UI未驗。|
|The Immortal Throne|**三個完整原生升級流程**：先真cast4費Throne，再真Site0使counter0→1，依序真cast printed1到7各實draw+counter（不直接寫level8），每次cold保存。單一Throne level8時真Blink把Avatar移入空12則勝；12有另一unit時不勝，真Fatality殺最後blocker才勝。另一流程先真Cradle/Vermis，最後printed7 Dragon真正從spellbook以4費施放，仍觸發7→8，證明printed cost不以支付4替代。|**雙Throne同時勝裁定不測、不選家規**；所有其他多副本/替代draw/盤面投影及UI未驗。單Throne通過不能宣稱原101該卡全部爭議解決。|
|The Malleus Maleficarum|真cast5費給非caster Bears，collection含Zap/Overpower/Fireball，僅提供合法敵Spellcaster（Merlin與敵Avatar）的Zap選項，普通敵Bears不合資格；cold後真正以bearer cast Zap，實付1、傷1、消耗collection card與once use。另選Apply Alkahest後的真target declaration可取消，不扣mana、不消耗collection或once；mana0／Air0各自拒絕activate。|多目標/特殊caster/built site及Bureau等原有完整回歸另有證據，不冒領本批新增覆蓋；UI未驗。|
|The Pallid Bust|真cast4費給Bears，Genesis只提供dead minion，排除墓Zap；cold選對手墓ApprenticeWizard歸owner1 banish；bearer得Mortal/Spellcaster而仍原power4，並不立即觸發新獲Genesis draw（hand與top均不變）。真正bearer cast Zap傷1，經真turndrop後失Spellcaster；另一Boars真pickup同Bust得Spellcaster仍power2。另真cast至Avatar、真Genesis banish CloudSpirit後，Avatar不獲minion-only Airborne/Spirit或power。|複數Bust、所有借能力、自身reference/MinionType變換及UI未驗；這是代表printed能力/類型和restriction，不宣稱窮盡所有copy組合。|

## 草稿修正與限制

- Tabula測Overpower初稿錯假設dispatch後還有unit choice，實際該legacy spell在native cast action的target已指定，已改挑確切bearer UID再dispatch，保留power仍3斷言；不是引擎缺陷。
- Malleus初稿只允許Merlin作Zap目標，忽略敵Avatar也是Spellcaster且Zap卡文本來無距離限制，正確可有兩個合法enemy caster。已把嚴格集合改為Merlin和敵Avatar兩者，仍排除普通敵minion、Overpower與非targeting Fireball；沒有放寬資格規則。
- 所有成本/傷害/collection消耗/once/JSON斷言保留，沒有改source讓測試通過。最新19/19為本批候選subset，不稱full／UI驗收。

兩tmp檔現穩定，等待root通知才由root移正式；沒有自行改ledger分類或原101完成數。

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data path to portable relative URL in tests/catalog-artifacts-wave11.test.js. Full formal regression pending. Actual UI is verified only where separate evidence is recorded.

## Complete formal regression

2026-10-30T22:06:52.391Z: full2533/2533 passed, zero failures/skips, session67898 exit0. Stable data/all-cards-audit/logs/wave11-full-2533*. Actual13 UI scenarios include12 gameplay paths and one authoredThrone-level inspection, not full-card or all-interaction approval.
