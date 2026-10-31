# Artifact 第八批：Plate、Manuscript、Dagger、Purge、Red Rock、Rhongomyniad

日期2026-10-30 UTC。依root指示只新增 `tests/catalog-artifacts-wave8.test.js` 及本文件，不改runtime、JSON或既有tests。沒有向睡覺使用者詢問或發送進度。

正式初測命令：`node --test tests/catalog-artifacts-wave8.test.js > /tmp/catalog-artifacts-wave8-before.log 2>&1`；**22項19過3紅、0skip、exit1**。三個缺陷保留正式嚴格回歸，root統一修補，不能排除後稱完整全綠。

## 來源

- 卡文/費用：既有官方snapshot `data/official-cards.json`；October2026規則書與官方Codex/FAQ快取。FAQ以cards slug精確比對。
- 本輪web重新讀[Pnakotic Manuscript](https://sorcerytcg.com/cards/pnakotic_manuscript)與[Poisonous Dagger](https://sorcerytcg.com/cards/poisonous_dagger)成功，效果文字與snapshot一致。其餘四張官方card頁InternalError，最新卡文刷新未完成，不重試相同查詢冒稱成功。
- Lethal Codex `47a59bae-9234-404e-8299-efeec4d1c78d`，更新2026-03-25T19:19:34Z：[來源](https://sorcerytcg.com/codex/47a59bae-9234-404e-8299-efeec4d1c78d)。明文任意來自Lethal unit的正傷害足以殺minion；其Magic則由Magic本身造成傷害，不繼承caster Lethal。本批正／負兩種真實操作都測。
- Projectile Codex `c81c8875-ef70-4202-8c98-7ac00ece0cc6`，更新2025-07-05T22:17:25Z：[來源](https://sorcerytcg.com/codex/c81c8875-ef70-4202-8c98-7ac00ece0cc6)。piercing仍每location只hit一unit；多候選由projectile controller選。Rhong無特例允許同格全命中。
- Red Rock FAQ `fe5dbda8-f62a-4482-bba7-fa14cd12cfaa`（2026-02-09T18:45:16Z）：不能carry不是Drop，不能drop的artifact也變loose，且不能PickUp。`83fe510e-5278-4352-9ea3-66b0726bca63`（2026-02-09T18:45:18Z）：bearer不能pull而artifact可pull時將物品拉離手；artifact不能pull則兩者都不pull。
- Rhong FAQ `32080767-7c39-493e-91e2-f18958f0c5ba`（2025-11-25T21:31:38Z）：throw後artifact留最後path location且uncarried。`eXfZjLHocReFQIApZdNLZs`（2025-02-20T23:04:25Z）：雙方first strike同時；本輪尚未加這項雙first專測。Updated Cards Codex `bff36deb-d447-49d9-b909-d64417f6e045`（2026-10-19）確認Purge不殺自己，Rhong必須實際hit且不能傷自己；主要對應操作本批已測。

## 逐卡實際覆蓋

六張共同：真正hand cast之native legalAction，印刷費實付、hand移除、insufficient mana沒有cast、owner/location正確、JSON恢復後實體存在。所有印刷threshold0，因此threshold拒絕N/A；沒有捏造元素門檻。

|卡|本批原生效果與邊界|未涵蓋／限制|
|---|---|---|
|Plate of the Whale|真cast4費；三組2powerBoars/3powerGhoul/4powerBears，公開Immobile與legal move分別true/false/false；敵真正連施兩Zap：2/3power不防，4power第一次防0、第二次收1。JSON。|跨turn防傷重設、在已受傷同turn才equip、Power動態跨門檻、多prevention選序、UI未驗。|
|Pnakotic Manuscript|真cast2費給9powerBears；先真正MadDash抽Zap，再真activateArtifact tap/reveal頂Fireball/attempt draw；正常draw入hand並受4，不能同turn再tap啟動，JSON。Garden全局一抽情境先已抽1，第二抽Fireball應被擋但revealed card仍可指認，卡文下一句傷害應4，實0：**紅**。|沒有直接Manuscript/Garden專用FAQ；此結論根據本輪官方卡文兩個依序動作，沒有「若成功抽到才傷害」條件；需root按card text修補。空牌庫/reveal不存在referent、其他draw replacements及UI未驗。|
|Poisonous Dagger|真cast2費賦Lethal；FootSoldier1power原生strike殺4powerBears，Ward正好擋傷則不殺且Ward消耗；原生caster-avatar持Dagger施Zap，敵只收1不死（Magic不繼承）。真AncientDragon持Dagger啟動unit ability對14power敵造成4，應Lethal殺，實留damage4：**紅**。JSON。|其他免疫/disabled來源、反射傷害/借能力來源與UI未驗。此能力傷害紅測由直接Lethal Codex支持，不是家規。|
|Purge Juggernaut|真cast6費進場，經真正end0/draw1/end1到己方start，Purge tap且native remainingPurge選相鄰surface13；JSON後move13殺該surface敵minion，保留Purge自己、原12minion、below13minion與Avatar。|無合法相鄰路徑、巨大形狀/force免疫、start觸發排序與UI未驗。|
|Red Rock of Ravannis|真cast3費Monument，先用真OnyxCore給Bears18，真正end0選13/JSON使artifact與bearer移1步，end1再到Rock12物品loose且不能pickup；真Muzzle先carry且silencePegasus13，再真conjureRock13，cannot-drop物品也立即loose並恢復Airborne；真Talus18攜Core，end只拉Core到13且detach、Talus不動。|artifact本身force immune時不拉bearer、多Rock、跨region與Giant偏移/根據item而非anchor的更多複雜例、UI未驗。|
|Rhongomyniad|真cast4費，native attack first strike殺同powerBears且bearer0傷；投擲宣告取消不tap不卸裝備；JSON後確認north tap/throw，單列7及2各一unit都收3，source不傷，artifact留2且uncarried。多unit同7時應有native hit選擇，實無choice、兩unit都收3：**紅**。|root修後必須驗hit選擇JSON及繼續到2；Stealth、Globe閉路、雙first等未驗，UI未驗。|

## 三個確認失敗的修補線索

1. Manuscript `src/engine.js` manuscriptDraw以`drawn`成功才hurt；已先reveal的top才是卡文傷害referent，draw prevention不應新增條件。保留真MadDash/Garden與正常draw對照，勿直接改counter繞過。
2. Dagger `hurt`／unit ability damage路徑未普遍繼承unit的Lethal，只在strike等caller單獨帶flag。應依實際傷害來源為unit和當下keyword處理；不能讓caster的Magic無差別Lethal。本批Magic Zap負控制維持。
3. Rhong `src/fifty-cards.js` fiftyBoltTravel spear分支直接對所有hit hurt、繞過一般多候選選擇；需要每location限一合法hit，JSON可續且piercing往前。不能改為對同location所有unit傷害或刪除選擇斷言。

以上是本批subset，不是full；已保留19/22原始紅測log。沒有改共用引擎、JSON、官方snapshot或既有測試，沒有server重試／憑證變更／推送部署。UI仍由root另行驗收，本子代理未操作瀏覽器，不因5500已授權便標UI通過。

## Rhong實際層Moeba新增邊界（root指定）

新增兩個真正Rhong handcast／activate／北向宣告／JSON回歸，射線固定12Surface→7Surface→2Surface；Moeba沒有12Surface部位，避免起點先hit掩蓋問題：

- parts=[8Surface,7Below]，anchor=8Surface，原生初始Burrowing與+20power確保below部位生存。7Below不在Surface projectile實際location，預期0傷，現錯收3。
- parts=[8Below,7Surface]，anchor=8Below，同樣Burrowing／+20power。7Surface確在射線，預期3傷，現錯漏成0。

兩例在真正conjure後與方向宣告前JSON保存恢復，嚴格保留parts，驗bearer不受傷及spear最後留2且uncarried。指向fiftyBoltTravel原本以`occupied`搭配anchor layer篩hit的錯誤，應以每個實際geometry location的at+layer匹配，不改printed rules、不忽略region。

命令：`node --test tests/catalog-artifacts-wave8.test.js > /tmp/catalog-artifacts-wave8-moeba.log 2>&1`。最新before：24項19過5紅、0skip、exit1；除原三紅外，兩個Moeba互為正負控制都紅（分別實3應0／實0應3）。原始22項before log仍保留。runtime由root統一修，本子代理只改本專屬tests/docs，現在檔案穩定。

## Root integration after strict reds

Pnakotic damage uses revealed cost even when Garden prevents drawing; Lethal applies to unit ability damage but not the Magic it casts; Rhong chooses one unit per piercing location and checks each physical part layer. Four-file /tmp/audit-wave8-after.log:90 tests89pass/1Tribute-cost red in another file; this artifact file24/24passed. Subsequent full2305 was2304pass/1samecost failure, retained rather than excluded. Cost later fixed separately, new full pending. Actual per-card UI remains unreviewed.
