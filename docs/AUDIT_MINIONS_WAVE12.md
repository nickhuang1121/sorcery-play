# 第十二批 Minion 原生規則稽核（只/tmp候選）

2026-10-30 UTC。按slug下6未查，已先向root回報避免重疊：Haast Eagle、Harassing Ruffians、Hauntless Head、Headless Haunt、Hearkening Kraken、Hellhounds。只新增 `/tmp/catalog-minions-wave12-candidate.mjs` 與本draft，正式src/tests/docs/JSON未碰，不問使用者、不啟或重啟模擬/server。

## 最新結果

`node --test /tmp/catalog-minions-wave12-candidate.mjs` **27項、18通過、9個保留真紅、0跳過**，session94548 exit1，2026-10-30T22:17:33Z讀結果。log `/tmp/catalog-minions-wave12-candidate.log`。初26項17過9紅（6977 exit1），只再補了Hauntless Head作另一caster的Hounds來源位置/Charge expiry正控，該正控通過，未刪除或放寬九紅。

九紅分屬五個根因，下列均有實際原生操作，不是單靠static registry掃描：Haast split弱者比較2紅、Ruffians Site defense1紅、Headless非法random teleport2紅、Kraken oversized水域折扣1紅、Release Hounds collection3紅。待root統一修引擎，子代理不改runtime。候選與本draft現穩定，無子集仍在跑。

## 六張共同基本覆蓋

每張各有native hand→legalActions→dispatch、mana不足拒絕、各印刷threshold不足拒絕、實扣cost、離手、真unit owner/controller/power、cold JSON。Kraken必須below；其Water不足例特別保留Pond12（仍可submerge、仍waterSite），只留Water1而不足印刷2，隔離真正threshold不足，避免把沒有可用水下位置誤當門檻拒絕。

## 逐卡效果證據與未驗範圍

| 卡牌 | 實際操作及已通過邊界 | 確認失敗／尚未驗 |
| --- | --- | --- |
| Haast Eagle | 真cast後原生Pick Up；拒enemy/equal普通3power/Avatar/容量2；選真正弱盟友2power；JSON；Eagle成熟後真Airborne斜走12→6，乘客跟隨且獲Airborne；真Silence罩Eagle後失Carry能力，乘客自動drop、留6且失Airborne | **BlueKnight3/2應可carry卻不給pickup；Priamus2/4等於3應拒卻允許**。更多弱者動態變化、障礙/drop及UI未驗 |
| Harassing Ruffians | 真cast/成熟後攻擊敵4power unit，無defense window，造成3、己同步被4殺；旁邊可defend的敵bear保持原地/untapped | **攻Site也被noDefend錯封**。應允許敵bear進場defend、Site不失life；目前pending直接消失。更多獲得能力/multiattack/intercept及UI未驗 |
| Hauntless Head | 真新生Spellcaster可當回合cast付費Zap並傷1、不tap；經己end/敵draw/end到自己的start，真敵Black Cat替換random決定，JSON保20格；選void0可Voidwalk存活，選GnomeHollows7也可（power2）；真DwarvenDiggingTeam授Burrowing後，Head真step地下13，再own-start random7，合法到top surface | 本批未驗移動中其他持續效果/多random modifiers/多部位與UI |
| Headless Haunt | 真cast、進自己start的完整native turn流程及BlackCat random choice；選void0能存活，20格樣本不應刪非法目的地重抽 | **power4選GnomeHollows7竟移到7，應失敗留12；原本地下13時選非法7也被搬走/換層，應留13 below**。更多禁止entry/不同random控制來源與UI未驗 |
| Hearkening Kraken | 真cast全合法選項均below；connected Water2/7/12中敵Avatar2、surface敵7及underwater敵7共3折扣，己盟友及不相連Water4敵不算，實付3；JSON；7個敵同body使折扣clamp0，available mana0也可真cast | **敵MountainGiant anchor6 land、part7/12 water應只折1付5，實付6**。更多水域斷連/控制改變/多部位caster與UI未驗 |
| Hellhounds | 真一般手牌cast並原生3power攻擊，敵4power受3、己同步死入墓；limited空collection的真Release Hounds可external召2，位置Avatar且有Charge；HauntlessHead本人cast Release也到Avatar17（不是caster12），真end後Charge消失 | **constructed collection0仍製2、只有1也製2、有2未消耗collection**。這是取得本非Token card的相關原生來源缺陷；完整tax/zone禁制等更多交互與UI未驗 |

## 五個根因及修補界線

1. **Haast split-power**：`transport.fits`用`api.power(target)>=api.power(carrier)`，只看attack。Split Power Codex要求power效果用attack/defense平均、必要向下取整。Blue3/2為2，比Eagle3弱；Priamus2/4為3，不弱。兩個嚴格正反case保留。不可只修某一張卡名，應按實際source carry rule比較雙方目前split power。
2. **Ruffians scope**：card說units attacked不能defend，Site不是unit。`pending.noDefend`卻對任何attack直接取該passive，連Site attack都立即結算。候選從真legal attack行動打enemy Site7，要求native defender8可Defend到7、fight完Site life不變。不要把所有defend封掉或把Site當unit。
3. **randomTeleport entry**：現直接寫`u.at=rollIndex(20);u.layer='surface'`，只enforce borders沒有目的Site entry合法性（GnomeHollows拒power>=3）。官方Headless FAQ明說非法目的地則teleport失敗、原地保留。必須先按實際candidate位置/層驗entry再變更整個位置；**仍保20個random結果，不要filter/重抽**。兩種Head2/Haunt4與原Surface/Below提供正反及層保留控制。
4. **Kraken footprint**：`offRealmCostAdjustments`只用`bodyOfWater.has(u.at)`，漏算oversized非anchor parts。應一個敵unit只算一次、若任何佔據Water Site在body即符合；本case有兩個water parts仍只能折1，不能按part變折2。
5. **Release Hounds collection**：definition仍generic summon非Token Hellhounds兩隻，無視constructed collection。需真named collection取用，保留limited指名external例外；只取可用0/1/2、實體card消耗、原Avatar位置與當turn Charge。現有collectionSummon只用source.at，若直接換會使其他caster召錯位置，所以另以HauntlessHead施放作保護控制；Charge必須在真end移除。這三紅不等於普通Hellhounds手牌效果失敗，但取得路徑未忠實故不能稱整卡玩法全驗。

## 官方來源／版本

逐卡卡文及數值已讀原有 `data/official-cards.json`，未修改。2026-10-30新開官方 [Hearkening Kraken](https://sorcerytcg.com/cards/hearkening_kraken) 成功；其餘五張及Release Hounds官方同名卡頁工具inaccessible，保留fresh-page未核限制。

採October2026官方Rulebook與 `data/final-101-official-source-index.json`；以JSON實讀 `/tmp/sorcery-official-embedded-docs.json`：

- Headless非法目的地失敗不移：FAQ `ygoDG8fb7HS97qCW69l9y0`，更新2025-02-20T23:04:25Z，明舉GnomeHollows。本批正是該場景並加Below保持控制。
- Split Power `7f64db2b-3903-4bbd-8d36-bfa53ce5faa8`，更新2025-07-10T20:57:31Z：power比較取平均並必要向下取整。Haast兩個相反case直接依此。
- Carrying Units `5f6697d3-c0a4-42b3-b682-ce807b9e4cd4`，更新2026-02-09T18:42:26Z：carry能力修改PickUp/Drop；失能力即drop；乘客跟隨且獲Airborne/Burrowing/Submerge/Voidwalk。Haast真Silence自動drop直接驗了。
- Pick Up/Drop既有Codex：pickup選units是target basic ability，容量/己方/體型與weak條件不可偽造；本批invalid payload用正常native pickup行動附選擇驗engine reject，不拿偽造行動作成功證據。
- Body of Water `1122beef-02de-47bd-9aa6-8c471d03fdda`，更新2025-07-10T03:26:19Z：相鄰Water Sites連成，不限controller。
- Enemy `251c23c3-c934-4399-8edf-84fa24dcad8d`，更新2025-07-10T03:23:42Z：敵是對手控制unit，含Avatar；不把敵Site或普通Artifact當敵unit算。
- Oversized Units `7f57fe26-eac3-45a4-b449-994fef47d872`，更新2026-10-12T17:46:11Z：佔據每個location，可同時佔land/water。因此scalar anchor不是唯一位置。
- Collection `78ce4090-a2e1-4893-97c0-6eaafd5c5937`，更新2026-03-25T19:19:53Z：constructed使用註冊collection，limited指名可external。Release兩種模式不能混用。
- Ally `040cd91a-60f2-4a12-bebc-b9bf482b9877`，更新2025-12-05T17:31:08Z；Airborne/Charge/Silenced沿現有官方Codex版本。本批不聲稱全路徑/全部random modifier組合窮盡。

## 接續與穩定狀態

候選27項和本draft已保存，root可根修五項、保留九紅後重測。未自行promote；轉正式時src絕對import改`../src/`、data改`new URL('../data/official-cards.json',import.meta.url)`。本候選無其他/tmp helper依賴。

沒有子集仍在跑（94548 exit1），沒有任何模擬/server操作。UI由root另驗；卡文/代表native效果/完整UI維度分開，不把27個測例等同六張所有遊玩條件完整通過。

## Promoted stable native candidate

Root preserved all strict assertions and converted only imports/data file access to portable relative URLs: tests/catalog-minions-wave12.test.js. Latest full formal regression pending. Actual UI is recorded separately, not inferred from these native cases.

## Complete formal regression

2026-10-30T22:28:35.810Z:2627/2627 passed, zero failures/skips, session3940 exit0. Stable data/all-cards-audit/logs/wave12-full-2627*. Initial2627/2626/1 retained an incorrect old Loner collection-retention expectation; original/TAP preserved, corrected from explicit SummonCodex with stronger physical-card conservation and JSON assertions. See data/loner-summon-tax-test-correction-backup.json. Native scope is not full per-card/UI approval.
