# Artifact 第二批：Horn of Caerleon 至 Just a Rock

2026-10-30。正式測試 `tests/catalog-artifacts-wave2.test.js`，由主代理確認完整回歸完成後才轉入。未改引擎或JSON。命令 `node --test tests/catalog-artifacts-wave2.test.js > /tmp/catalog-artifacts-wave2-formal.log 2>&1`。先前暫存12/12通過，正式新增Colossus無donor不足印刷費不能宣告案例，結果另如下。

來源：本機官方卡文快照 `data/official-cards.json`；本輪嘗試六個 `https://sorcerytcg.com/cards/<slug>` 頁面，全部web工具 Internal Error，所以不能宣稱現行官網卡文已更新核實。官方Codex/FAQ嵌入快取中找到 Talus相關 Swap FAQ `70c4ce0a-c575-4e82-985b-b0f3ea49a827`，更新2026-02-09：一目標不能被teleport則兩者均不動；既有remaining-rules有此測試，本批不冒領其覆蓋。後續改用cards slug精確比對，另找到下列三項Horn／Shackles FAQ，不能僅用英文名稱字串搜尋斷言沒有FAQ。

每張實際覆蓋：

- Horn of Caerleon：真正手牌conjure正常4費，Charge給附近我方／敵方剛進場minion；遠處沒有，原生legalActions nearby可移動、遠處召喚失調不能移動；JSON。未涵蓋subsurface／多副本／silence UI。
- I Am Colossus：真正施放的額外費用選擇，場上controlled但owner1的donor、手牌minion、墓地minion各1；每次選擇JSON後仍未扣mana；confirm才各歸owner banish，支付7，進場10powerAutomaton。第二測取消保留所有cards與spent。未新增grave費用、共享墓地、過量折扣全部覆蓋（原有final-units已有許多但本批不冒領）。
- Iron Maiden：真正conjure2費、JSON；enemy draw phase第一抽附近掉1；其後真正Mad Dash再抽掉2；Avatar遠處不掉。未驗Garden阻止抽牌／多Device／below region，UI待驗。
- Iron Man Talus：真正手牌施放4費；原生Freeze指定不能Disable，原生Drown指定water surface不能強迫submerge，兩者後仍有正常移動action；JSON。未驗所有force/disable來源或growing能力借用。
- Iron Shackles：真正3費及原生敵方minion指定conjure，bearer disabled，JSON後仍disabled，對手turn沒有move。未驗co-located ally搬走／大型enemy非anchor放置／免疫Talus及所有targeting邊界。
- Just a Rock：真正1費／JSON；對手unit先經原生施放兩個真artifact，Rock可施於敵方bearer；兩選一前不付費，選Helmet後只有Helmet banish（歸owner1）、Hand of Glory保留，Rock成為該enemy持有。另common基本地上conjure1費、不足費拒絕。未驗多選取消／Giant非anchor或carry位置／borrowed controller。

除Colossus需要額外費用UI外，其餘五張另有common native hand cast、printed payment、insufficient mana rejection、owner/location及JSON測試。Colossus在自身折扣案例驗證實付7與所有原始成本，不盲目要求不足10費就完全無cast（有donor時本來可cast）。

測試草稿修正，不是引擎缺陷：把不存在Insight改真正Mad Dash；Freeze用原生cast.target直接指定、不額外捏造choice；用公開disabled()觀察Shackles，而非假設內部carryDisabled欄位。所有修正保留印刷規則應有斷言，沒有改共用引擎。

全批UI仍未驗；沒有啟動server／重試bind或裁定未決家規。

正式結果：2026-10-30 20:09 UTC，`node --test tests/catalog-artifacts-wave2.test.js tests/catalog-artifacts-wave-next.test.js`，30/30 通過（wave2十三項＋前批十七項）、exit0、0 skipped。log `/tmp/catalog-artifacts-wave2-formal.log`。六張印刷threshold全為0，threshold不足測試不適用，沒有杜撰元素門檻。Colossus無donor時available9無cast，10才可確認並真付10；有3donor則真付7。


補測官方FAQ：Iron Shackles b077fda3-c184-49c6-bf9b-f34a593d1243（2026-02-09）Ward保護目標、Ward破、Shackles落同location未持有；新增原生敵方warded目標施放驗證真付3、ward破、bearer null且minion不disabled、JSON。Shackles FWsVZ4rxgHCtjTP73mU47E（2025-02-20）target須同region，本批尚未補該boundary。Horn eXfZjLHocReFQIApZdMyb2（2025-07-06）離開Horn範圍仍完成已啟動move-and-attack；新增born本turn Bears從13移至14（Horn12不再nearby），失Charge但確實擊殺Boars、收2反擊。兩項均先在/tmp測過後才按root穩定窗口授權轉正式。

補FAQ後，wave2共15項；三批合跑44/44於2026-10-30 20:12 UTC通過，log `/tmp/catalog-artifacts-waves123.log`。未修改引擎或JSON。
