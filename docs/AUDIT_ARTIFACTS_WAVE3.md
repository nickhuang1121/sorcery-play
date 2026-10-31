# Artifact 第三批：Love Potion 至 Makeshift Barricade

2026-10-30 UTC。正式 `tests/catalog-artifacts-wave3.test.js`，由root確認1942/1942 fullrun結束後才轉入。先於/tmp的12/12通過、exit0、0skip，正式命令與結果見下。

來源：官方快照data/official-cards.json。web open本輪[Magellan Globe](https://sorcerytcg.com/cards/magellan_globe)及[Makeshift Barricade](https://sorcerytcg.com/cards/makeshift_barricade)成功，與快照卡文一致；其餘4頁InternalError，現行卡文未重新確認。官方嵌入Codex/FAQ快取用cards slug精確比對，不僅搜尋名稱。以下為實際覆蓋與限制：

|卡|原生直接覆蓋|剩餘限制|
|---|---|---|
|Love Potion|真cast6費；BearerGranted原生target僅here敵minion，排除鄰格，取消保留物品；確認犧牲Potion並控制原owner1目標；JSON持續；真正Fatality殺原bearer才還control1。|多重控制timestamp、控制bearer變動、region/cancel stale目標及UI未驗。|
|Lucky Charm|真cast1費；carried給我方真正LightningBolt產生兩個random候選，JSON後選一，僅一個物理unit收3傷；looseCharm不給owner能力。|多副本、steal/disabled bearer、BlackCat/Kythera互動及UI未驗。FAQ ygoDG8fb7HS97qCW69iekk(2025-02-20)說以Beta文字為準，snapshot符合Beta效果。|
|Maddening Bells|真cast4費；近caster施放Zap實付原費+2，遠caster原費；不足含tax總費拒絕；JSON。|Sitecaster跨層、成本0/forfree、聚疊減費、UI未驗。Cost Codex a6a73d30…(2025-12-19)加費後減費；FAQ ygo…huut、tDPN(2025-02-20)以caster位置判定；eXf…MWBk(2026-02-09)替代0費不加。未冒稱上述未測邊界已覆蓋。|
|Magellan Globe|官網卡文核對；保留未釋出，原生手牌無cast且不覆寫playable旗標。|**本批沒有原生完整效果驗證**；五項玩家決策中相關Globe移除／grid／Snowball問題仍待答，不擅裁。既有geometry直接回歸另由主代理紀錄，不把negative availability冒充效果完成。|
|Magnetic Muzzle|真cast2費；abandoned於實際turn end由ending player選nearby任一陣營minion，排除遠處；JSON恢復後attach，PlumedPegasus失Airborne，下一己方turn沒有drop該物品action。|所有layers、不能modify、其他物品可drop邊界及UI未驗。Updated Cards Codex bff36deb…(2026-10-19)及Lose7e87d038…(2026-03-09)支持Silenced術語。|
|Makeshift Barricade|真cast3費；兩次分開Zap各防1、保留Barricade；真正Fireball同時防全部allies且破；額外PoisonNova同時對三allies各1(Lethal)，三個都存活且damage0，合計3後Barricade進owner墓地。|多重prevention選序、simultaneous替代與UI未驗。FAQ bd8e6ebf-8bb1-4750-a3a6-08a1a93c4f98(2025-12-06)明確同時1+1+1算3會破。|

除Globe未釋出外，五張皆有印刷費用真扣、資源不足無cast、hand移除、owner/location、JSON基本測試；所有印刷threshold0，threshold不足N/A。

沒有引擎真紅測，沒有修改共用引擎、JSON、既有tests或啟動服務。草稿LuckyCharm曾把bearer設17卻找at12施放，已按真正bearer location修fixture，非放寬遊戲效果。UI全待授權，規則決策不擅定。

正式三批結果：2026-10-30 20:12 UTC，`node --test tests/catalog-artifacts-wave-next.test.js tests/catalog-artifacts-wave2.test.js tests/catalog-artifacts-wave3.test.js > /tmp/catalog-artifacts-waves123.log 2>&1`，44/44通過、exit0、0skip（17＋15＋12）。包含Barricade官方1+1+1 FAQ實際PoisonNova案例。全庫完整回歸由root統一執行，這個subset不冒稱fullrun。
