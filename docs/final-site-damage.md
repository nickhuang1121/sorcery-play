# Mortal Soil 與 City of Souls

實作：`src/final-site-damage.js`、`src/engine.js` 的 damageSite／hurt，`src/objects.js`／`src/site-cards.js`／`src/definitions.js` 的正式入口。逐卡效果測試：`tests/final-site-damage.test.js`，包含真正 dispatch、施放／地點打出與保存續接。

Mortal Soil：每次受影響地點傷害可暫停選擇墓地 minion，放逐其實體所有者的卡以防止整次傷害；無合法墓地牌／無法支付 Bureau 或拒絕存取時驅散並繼續原傷害。與 Ward 按主動玩家再非主動玩家各自決定其預防順序，已失敗的 Soil 不重用。墓地交換視角、Wormelow 保護、獨立 Bureau 費用、相同卡名不同墓地實體及 JSON 續接皆有測試。

City of Souls：earth threshold 達一時提供額外一 mana（總二），敵方玩家可不轉移或選任意單位承受原傷害；不以 region／target 限制縮小這個非指定選擇。轉移在 Ward／Mortal Soil 預防之前，單位的 Ward 及一般傷害修改仍適用。無 earth threshold／沉默時不提供轉移。

來源：專案原始官方卡文快照 `data/final-101-baseline.json`，以及已讀取的官方 [Damage／Modifying Damage／Preventing Damage](https://sorcerytcg.com/codex/d54c08da-2107-484a-9f68-123bb62581b5)。[Mortal Soil](https://sorcerytcg.com/cards/mortal_soil) 與 [City of Souls](https://sorcerytcg.com/cards/city_of_souls) 的規則依上述原始卡文；未將未檢驗的全卡交互列為完成。City 頁先前已讀，沒有額外 FAQ。

限制：整體傷害引擎仍持續驗收與其他卡的交互；實體識別／能力來源層的剩餘卡不能因這些測試推算為已完成。Altar of Malachai 尚未接入；不能把同名printed ID當實體卡跨區域 once-per-game 身分。
