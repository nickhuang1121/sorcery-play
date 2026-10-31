# Artifact 第四批：Kairos、Key、Egg、Kythera、Lance、Land Deed

2026-10-30 UTC；經root確認1998/1998 fullrun結束後才轉正式。本批`node --test tests/catalog-artifacts-wave4.test.js > /tmp/audit-artifacts-wave4.log 2>&1`，13/13通過exit0。未動引擎、JSON、既有tests。新增本批專屬正式tests及文件。

來源：既有官方卡文snapshot與October2026規則書；嵌入Codex/FAQ快取用cards slug精確匹配。本輪web讀[Kairos官方頁](https://sorcerytcg.com/cards/kairos_the_archivist)、[Lance官方頁](https://sorcerytcg.com/cards/lance)成功；其餘四頁InternalError，現行卡文source刷新仍待。Lance效果文字一致，但官網typeline Ordinary Weapon vs snapshot categoryToken/subtypes[]，記錄metadata差異未自行改資料。Token一般不可從手牌施放的驗證以目前project官方snapshot分類為準。

|卡|本輪直接原生證據|規則來源與未覆蓋|
|---|---|---|
|Kairos the Archivist|真正手牌7費Genesis archive，JSON後真move令Bears12→13，再真正Zap使Kairos受傷、Fatality殺；Deathrite恢復Bears到12未tap，Kairos banish。|18FAQ匹配；核心archive FAQ7pue…6mZ(2025-08-04)、return非move AYzs…mdKI(2025-08-04)、不enter/genesis AYzs…mdWU(2026-10-12)。本批未窮盡其18FAQ及所有跨zone/同時/多Kairos，既有final-units相關測試不冒認本批新增。|
|Key to the City|真cast1費提供1mana；bearingKey的Bears實際move進BottomlessPit存活，對照無Key者死亡；JSON。|FAQ49e732a0…(2026-10-12)等同Protected from sites。FloodedFAQ452df9a7…(2026-02-09)仍視Water屬性，本批未覆蓋；其他非Site效果不受保護、UI待驗。|
|Koschei's Egg|真Avatar bearer conjure7費Genesis建立bond，JSON及真正過兩turn後drop仍bound；敵真正Dispel毀Egg立即判owner輸。另真enemyZap無法deathblow已DeathDoor的boundAvatar，連續原生end/draw只在第三個己方end輸（對手end不增加）。|卡文與既有source index；本輪無cards slug特定FAQ。其他life loss、轉移control、Avatar非原owner、UI未驗。|
|Kythera Mechanism|真conjure1費由0的bearer持有；1真正LightningBolt，random outcome選擇權為0而非caster1；全部合法結果可選，JSON後指定第二個實際unit受3，第一個0。|FAQygo…oVAv(2025-07-06)最新played優先、oVNw(2025-02-20)drop/pickup不重設timestamp、eXf…IrVY(2025-02-20)不能看敵手牌只選site/spell；本批未覆蓋這三交互，UI待驗。|
|Lance|目前Token不能從手牌cast；真正BlueKnight原生Genesis產生Lance，JSON後Knight原生attack四powerBears，加1先strike擊殺，Knight無反擊傷，Lance banish。|Updated Cards Codex bff36deb…(2026-10-19)只strike units。對Site不加1/不消耗、多人分傷及UI未驗；官網typeline vs snapshot metadata差異如上。|
|Land Deed|真cast4費至敵Site7上己方Bears持有，立刻控7；真move到8，7還1、8變0；經真turn後drop，8還1。額外大Giant6手持非anchor7的Deed只控7，不控6/11/12；JSON、真move後item相對到8只控8、不控7/12/13。|FAQFWs…WyZS(2025-12-05)只控Deed實際所在一Site；ygo…sdrJ(2026-10-12)即時產mana、tDCM(2025-07-06)可控Rubble但無mana，本批未獨立驗全部resource/Rubble；多重control及UI待驗。|

除Lance token外，五張共同有真正手牌cast、印刷費真付、不足費拒絕、owner/location及JSON。所有Spell閾值0，threshold拒絕N/A。Lance成本為null，不偽造印刷費或施放permission。

測試草稿修正：Kairos在archive後使用runtime physical card id，obj helper改按`card(o.card).slug`找真正同名對象；不是強迫覆寫runtime id。Egg的Avatar剛施法屬已interaction不能同turn drop，所以以真end/draw到下個己方turn再drop，不清除interactedTurn騙過操作限制。未改引擎或削弱原斷言。

所有UI待獨立授權／驗證；本批不是全部規則組合驗收。沒有開server、重試bind、改憑證、推送部署或裁定未決家規。


正式結果：2026-10-30 20:20 UTC，`node --test tests/catalog-artifacts-wave4.test.js tests/catalog-artifacts-wave5.test.js > /tmp/catalog-artifacts-waves45-formal.log 2>&1`，28/28通過、exit0、0skip（第四13＋第五15）。root統一完整回歸前不得將此subset稱最新fullrun。
