# Site 原生效果補驗第二批候選

2026-10-30 UTC。六張仍是 `code-reviewed-awaiting-tests` 的加強驗證，不是6張新unreviewed清除：Desecrated Ground、Dome of Osiros、Donnybrook Inn、Dozmary Pool、Dragonlord's Lair、Dread Thicket。既有code review／正式證據必須保留。

候選 `/tmp/catalog-sites-wave2-candidate.mjs`。本批只寫 `/tmp`，未改正式 src/tests/docs/JSON，不碰full36138或任何模擬session。

## 執行結果與缺陷演進

- 有效17項候選：16過1真紅，`/tmp/catalog-sites-wave2-valid.log`；Dozmary Pool缺印刷Water3 gate，在實際Water1仍提供Artifact選項。
- root加入requiresThreshold並在選擇前／resume檢查後，前17項通過；加入第18項發現Automaton被錯誤排除，`/tmp/catalog-sites-wave2-valid18.log`：17過1紅。
- 第19項進一步驗證Hemogolem進水下的即時unit死亡／JSON一致性。root修hand Artifact selector含artifactUnit，Pool以真Minion makeUnit／Below／summonedGenesis路徑處理，保留合法召喚與額外召喚稅檢查。
- 最新：`node --test /tmp/catalog-sites-wave2-candidate.mjs > /tmp/catalog-sites-wave2-current19.log 2>&1`，**19/19通過，exit0、0跳過**。原始真紅與新規則斷言保留，沒有刪除或放寬。此結果不能代替root完整回歸。

## 逐卡實際覆蓋

六張共同：真正Avatar合法play Site（不是直接放進board），不扣spell mana、不需spell elemental threshold；owner/controller、Avatar tap與JSON恢復。Dozmary附帶optional Genesis在基本play測試中正確略過。

| 卡牌 | 真實操作／效果與邊界 | 尚未驗收 |
| --- | --- | --- |
| Desecrated Ground | 真play後，己方Ghoul從鄰Site surface、Barrow Wight從鄰Site underground，各以原生move進入，兩層Evil各+1；非Evil Brown Bears真移入仍4 power；JSON保留。 | 對方控制的Evil、contextual Persecutor/Evil視角、所有modifier及大型多Site疊加；本批UI未驗。 |
| Dome of Osiros | 真play後敵方不能合法attack Site、surface Minion、underground Minion；但真Zap可傷Minion。另一場真推進回合，己Avatar原生move到Dome，下一敵方回合仍可被攻擊；己Wild Boars從外面真Defend、取代Avatar進戰鬥並死亡，敵收2反擊，Avatar不掉life；反應中JSON。 | 直接以Leap Attack／Spin Attack測名字不等於attack、地點能力保護例外、所有飛行／大型defender；本批UI未驗。 |
| Donnybrook Inn | 真play後下一敵回合，敵人從自己的手牌合法cast Brown Bears到此，恰付3（原4減1），owner/controller仍敵方；普通loose Artifact不能藉此permission放到此。真Acid Rain沉默Inn後，己方cast不再減費、敵方不再可cast此處。 | 多種額外稅／discount排序、可選原價付款模式、非手牌cast與Artifact-Minions、Below召喚；本批UI未驗。 |
| Dozmary Pool | 真play自身提供Water1，加另外Water2恰達3，手牌Ruby Core才可選；Magic不能選。JSON後實體Core移除手牌、無spell付款、水下本Site、無bearer且正確owner。可decline保留hand。真Water1不能提供Core選項。Automaton Hemogolem仍是Artifact，應可選；真選擇後即作unit進入，因無Submerge立即死亡入墓，不是留在artifact陣列等restore才變型，且沒有damage所以Hemogolem不扣owner life；restore前後同樣已死且恰一墓卡。 | Mock Court實際額外稅正負案例、其他Automaton Genesis／survival／保護、進場後閾值變化；本批UI未驗。安全普通神器正控是Ruby Core，沒有虛構安全水下Automaton。 |
| Dragonlord's Lair | 所有己Site改提供Fire，實際Earth0；真play後Wyvern在其他Site不可cast，非Dragon Brown Bears在此也不可免Earth；同回合兩張Wyvern各真cast至Lair，均免Earth且各付5（原6減1），證明不是next一次性；JSON。 | 多層discount、借型別／Mortal-Dragon、from-grave與大型跨Site；本批UI未驗。 |
| Dread Thicket | 真play後Phantom Steed從17經12再一步離開到7attack，證明進Thicket之前已走過一步不影響；第一個合格attack直接結算、不給defend，敵defender仍ready；同回合第二個合格attack可defend。另一場從Thicket12到遠2，因離開後又走一步，該attack可defend且不消耗後續12→7的真正one-step保護。JSON保留第一合格使用狀態。 | 敵方使用己Site、跨回合重置、source沉默、更多oversized路線及真選擇defender後的所有combat；本批UI未驗。 |

## 已確認根因與嚴格控制

1. Dozmary印刷門檻是三Water；舊定義只給poolArtifact optional hand selector，沒有任何threshold條件。Root以step requiresThreshold補選單前與resume檢查；測試正向剛好3、負向真1都保留。
2. Engine把Automaton正常化成Minion並保留artifactUnit；舊hand `type:Artifact`只比c.type，漏掉兼具Artifact／Minion的Automaton。Artifact Codex對此明確。Root修候選選項及實際unit進場，不是把Hemogolem硬塞s.artifacts後等restore修正。
3. Underwater Codex明定無Submerge minion在水下立即死亡，所以Hemogolem測試的墓地／無damage／JSON要求有來源，不是自訂裁定。

最初另兩個草稿操作契約曾寫錯：surface move常省略layer（應當surface）；不能defend的attack會自動完成戰鬥，不一定保留pending。已改為標準layer fallback與「已打完／defender仍ready／第二次有defend窗口」的嚴格行為控制，不刪正確規則斷言、不把草稿失敗算成引擎缺陷。

## 可靠來源與刷新限制

- `data/official-cards.json` 實際engine rules/card type/數值；本批未改快照。
- 本輪 [Dread Thicket官方頁](https://sorcerytcg.com/cards/dread_thicket)可讀，與快照一致；其他五張Site頁工具回inaccessible。
- October2026官方Rulebook，來源指紋 `data/final-101-official-source-index.json`。
- 官方嵌入快取 `/tmp/sorcery-official-embedded-docs.json` 實讀：
  - Dread FAQ `6f979ffe-1213-430a-add4-c1fff2c68417`（2025-12-06）：恰走一步離開後attack；進入Thicket以前的步數無關。
  - Dome FAQ `FWsVZ4rxgHCtjTP73mUBAg`（2025-07-10）：Minion here不能當attack target，但攻Avatar時defend者可成合法target；`ygoDG8fb7HS97qCW69iJgn`（2025-02-20）：名字有attack不等於Move and Attack。
  - Artifact Codex `169db6b5-aae8-407e-ae7f-07206707a5eb`（2025-07-11），Automaton子節：Automaton同時是Artifact與Minion。
  - Elemental Threshold and Affinity `fc149f73-4afe-425f-9e73-e8a42fad3e71`（2025-06-17）：某些能力需要threshold，不消耗affinity。
  - Underwater `da576642-eda0-4a44-98ed-e571f9f9a45e`（2025-06-16）：無Submerge minion佔水下即死。
  - Summon `679db7d7-3cb3-4655-b84b-53c4bd6ed637`（2026-10-12）：任何Minion入Realm是Summon，非cast不用一般mana／threshold，但強制額外Summon成本仍須付，不足時banish且不入Realm。
  - Here `8e4684e4-479b-45d1-a75b-a41568ea6e6f`（2026-09-02）；Defend `7bc7a52c-25dc-4c80-8608-89667ef5eed7`（2026-05-19）。

### Driftwood Marrows資料陷阱

未採用它作「印Submerge的安全水下Automaton」正控。快照engine.keywords雖列Submerge，實際rules只有「Nearby allies can't be submerged」，runtime printedKeywords實讀為空。FAQ `132e8a2d-097c-40ca-b8b1-db146606fa06`（2026-02-09）也只說附近盟友包括自身不能被強制submerge，不代表它自己具有Submerge生存能力；其官方頁本輪不可讀。不能從關鍵字索引把一句禁止submerge誤當印有Submerge。

沒有更改五項未決家規、沒有啟server或重啟任何sim，沒有聯絡睡眠使用者。本批沒有操作UI，不能將Node原生流程當完整瀏覽器驗收。由root決定正式納檔並保存完整回歸結果，原code-reviewed狀態／證據與unreviewed總數不可被這批自動清除。

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data path to portable relative URL in tests/catalog-sites-native-wave2.test.js. Full formal regression pending. Actual UI is verified only where separate evidence is recorded.

## Complete formal regression

2026-10-30T22:06:52.391Z: full2533/2533 passed, zero failures/skips, session67898 exit0. Stable data/all-cards-audit/logs/wave11-full-2533*. Actual13 UI scenarios include12 gameplay paths and one authoredThrone-level inspection, not full-card or all-interaction approval.
