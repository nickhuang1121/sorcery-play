# Artifact Wave10 候選：Sentinel Trap 至 Spear of Destiny

2026-10-30 UTC。root要求當前固定回歸窗口只寫兩個tmp檔：本文件與 `/tmp/catalog-artifacts-wave10-candidate.mjs`。Imports及catalog讀取均指向workspace絕對路徑。本子代理沒有新增／修改正式tests/docs/JSON/src，沒有操作UI或聯絡睡覺使用者。未知結果的24216模擬不重啟、不干預。

六張按當前未review slug排序（排除Wave8/9）：Sentinel Trap、Seven-League Boots、Shrine of the Dragonlord、Siege Ballista、Silver Bullet、Spear of Destiny。

## 實際來源

- 卡文／費用：現有官方snapshot `data/official-cards.json`；October2026規則書及官方embedded Codex/FAQ快取，以cards slug精確匹配。
- 本輪web[Shrine of the Dragonlord](https://sorcerytcg.com/cards/shrine_of_the_dragonlord)成功，效果文字與snapshot一致。其餘5個官方card頁InternalError，現行source refresh未完成，不反覆重試冒稱成功。
- Sentinel FAQ `00caf85e-1b5e-498d-9240-3d5eca2b0afc` 更新2026-02-09T18:42:55Z：初次conjure選cardinal facing；teleport effect controller可選teleport後facing。`fe620f97-8df1-4484-9eb0-d5d009777175` 更新2026-02-09T18:44:04Z：animated後仍追蹤原facing，不因其他move/actions改變。本輪未驗animation，但實際Displace重新選facing已驗。
- Siege Ballista FAQ `FWsVZ4rxgHCtjTP73mTwea` 更新2025-02-20T23:04:25Z：兩個支付tap成本的unit均須不summoning sick或有Charge。
- Silver Bullet FAQ `f1ba891f-8671-4852-874c-39accc7fbb56` 更新2025-12-06T06:17:51Z：非Spellcaster bearer仍可cast。此為直接card FAQ，非家規，也不表示忽略spell成本／threshold。
- Spear FAQ `FWsVZ4rxgHCtjTP73mU72A` 更新2025-02-20T23:04:25Z：若被殺minion佔多location，由controller選單一實際佔據location。Location／Oversized Codex與既有geometry實際at+layer表示法支援mixed-layer部位，不能把anchor layer投影到所有部位。

## 每張原生覆蓋

六張共同：真正hand cast legalActions→dispatch、印刷費實付、hand移除、insufficient mana拒絕、owner/location、cold JSON。cold是同process JSON存檔後重新install官方catalog再restore，不是已完成全新瀏覽器載入。六張本身threshold0，所以本身threshold拒絕N/A；Silver Bullet所給spell另測Fire2與4mana要求。

|卡|實際候選測試|剩餘限制|
|---|---|---|
|Sentinel Trap|真cast4費Genesis選North，cold後真end0在7Surface對兩方4power Bears致死，Ward保護另一4power者並破，below7／自身12／east13不受；facing順時針變East，敵end1殺13再變South。另真正Displace12→8，cold選擇恢復後由teleport controller選新facing，實際成功。|沒有在end cleanup之後錯斷言殘留damage（該時傷已清）；用真死亡／Ward證據。Animated、跨層/Globe、多Trap排序及UI未驗。|
|Seven-League Boots|真cast3費給Bears0；原無到19合法move，cold後有7step path；真正move0→19、gear同行，經兩次真turn到己方後drop，無返回0長距move但有18普通move。|多Movement來源、被Immobile約束、大型carry與UI未驗。|
|Shrine of the Dragonlord|真cast2費Genesis把自己AncientDragon6、敵Wyvern3都teleport12；nonDragon Bears7保留、force immune TalamhDreig8保留；Site12向己額外mana1及四affinity各1。真正Displace到敵Site8後，資源轉由Sitecontroller1取得，原0減回；不再觸發Genesis，Dragons仍12。cold JSON。|沒有擅測未解跨region全域範圍；多Shrine、Site能力被禁/Key、animated與UI未驗。|
|Siege Ballista|真cast3費給Bears12；選兩step遠14unit合法，4太遠/Below13不在region排除；選target後cold crew宣告確認前兩者未tap；確認helper才雙tap並真傷3。bearer/crew各自sick時都拒絕activate；crew宣告取消不tap、不傷。|其他ready/Charge、stale選擇、特殊site range/crew controller、UI未驗。|
|Silver Bullet|真cast2費給非caster Bears；真activate tap並sacrifice入墓；collection含Fireball Exceptional、Zap Ordinary、AncientDragon Elite，預期僅可選Fireball並以bearer實付4、正常Fire2施放。**目前沒有collectionPermit選單，真紅**。另optional decline原應保留已付tap/sacrifice、不花spell費、不移collection，但同根無選單故紅。負控制：不足Fire2或僅3mana不應藉permission施Fireball。|非caster直接FAQ支持，需root修；取消後paid-cost語義不可把成本倒退。range/物理collection UID/區域存取及UI未驗。|
|Spear of Destiny|真cast5費給Bears，原生untargeted anywhere可殺遠處0Below的Stealth/Burrowing minion，spear留0Below uncarried。Giant6佔6/7/11/12，真target宣告後四location可選；cold後可取消且未tap，重試選12才tap/kill/留12。另mixedMoeba=[8Surface,7Below]，選項應有7Below且無7Surface，現投影錯：**真紅**。|Ward/destroy保護、不能teleport物品、同時觸發、UI未驗。|

## 兩個確認缺陷／三個紅測

- Silver Bullet兩個測試同根：caster-permissions的`entryHasIndependentCasterPermission`目前只認collection permit的`p.malleus`，Silver Bullet非caster明文permission遺漏；因此tap/sacrifice後沒有任何可cast action，collectionPermit直接消失。應依Silver FAQ讓此permission獨立於Spellcaster關鍵字，同時保留Exceptional、mana、threshold等限制，不放寬所有普通cast。
- Spear：commitArtifact用`occupied(target)`配anchor `target.layer`產生location選項，mixedMoeba實際Below7錯成Surface7；Spear解析和commit revalidation也用anchor layer，root需同步改成實際geometryLocationRecords核對。不能只改label而不改結算。

候選嚴格紅測不刪除／放寬。確切命令與最新結果如下。

## 執行紀錄

命令 `node --test /tmp/catalog-artifacts-wave10-candidate.mjs`，輸出由exec直接返回（僅獲准兩tmp檔，所以未另建立log）。初跑19項有一個無效Displace fixture（12→13非法，正確選項6/8/16/18）；已改12→8合法選項，Sentinel telemetry/facing實際通過，不能把原fixture錯誤當引擎缺陷。

修正fixture後19項16過3紅、0skip、exit1；三紅是Silver Bullet兩案與Spear mixed-layer。另補Silver Bullet兩個spell threshold/mana負控制，最新21項結果見下方記錄。


最新候選結果（2026-10-30T21:42:25.203416+00:00）：21項18過3紅、0skip、exit1。Silver Bullet門檻不足與mana不足兩個負控制均通過；非caster可施放的正控制與付費後可decline兩項仍因缺獨立caster permission而失敗；Spear mixed-layer為第三紅。執行程序已結束，沒有尚在執行的本批session；兩個tmp檔案現穩定，待root明確窗口才移正式。沒有建立額外log檔，保留本文件命令／結果與exec工具直接輸出證據。

## Root根修及Sacrifice時序修正後最新結果

Root為Silver Bullet加明確獨立caster permission（未放寬Book/Toolbox或其他cast），並修正Spear actual geometry part的選項/commit/resolve後，候選21/21通過、0skip、exit0。命令仍為 `node --test /tmp/catalog-artifacts-wave10-candidate.mjs`。只有兩個授權tmp檔被本子代理修改，正式檔仍未動。

Root聯合回歸先43項42過1時，最後一個剩餘失敗是候選錯以為Silver Bullet在collectionPermit待選時已入墓。官方Sacrifice Codex `b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3`（更新2025-12-21T07:10:37Z，[官方來源](https://sorcerytcg.com/codex/b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3)）明文支付成本用的犧牲牌要待效果resolved才去cemetery。因此僅把pending墓地斷言改為false，原同一個入墓斷言移到真正Fireball效果完成後；Mana實付4、傷害4、Exceptional過濾、collection物理卡消耗等嚴格斷言全部保留。這項是依直接Codex修正無效fixture，不是引擎缺陷或為通過而放寬。

上表Silver Bullet「tap並sacrifice入墓」描述以此時序更正：支付tap/sacrifice成本後待選時不在墓，自身效果結束才入墓。最新正向Silver非caster真cast Fireball及optional decline、Fire2不足/4mana不足負控制全過；Spear mixedBelow7位置可選且真kill/留spear Below7也過。初始21項18/21的三紅結果與原因在上方保留，最新21/21僅本批subset，不稱全庫full或UI驗收。兩tmp檔現穩定，等root正式移入。

## Promoted stable candidate

Root promoted all21 unchanged strict cases to tests/catalog-artifacts-wave10.test.js with portable relative imports/data URL. Original draft premature cost-cemetery assertion correction and primary basis retained above. Formal full pending; not full-card UI approval.

## Complete formal regression

2026-10-30T21:48:22.719Z: full2450/2450 passed, zero failures/skips, session36138 exit0. Stable TAP/validation under data/all-cards-audit/logs/wave10-full-2450*. This confirms formal regressions only, not full per-card browser/rule coverage or every interaction.
