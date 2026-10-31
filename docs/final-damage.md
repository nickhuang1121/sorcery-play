# 傷害替代：逐卡證據

## Royal Bodyguard、Sir Gawain：已接入核心效果

實作：`src/final-damage.js`、`src/engine.js` 的 hurt／kill／dispatch。測試：`tests/final-damage.test.js`，10項真實dispatch測試全數通過。

- Royal Bodyguard由其操控者決定是否代受附近Avatar或Royalty的傷害，包含敵方；不會自動選擇或偷偷消耗Ward。
- Sir Gawain強制代受其他相鄰友軍傷害；每個替代效果在同一傷害事件最多一次，避免兩個Gawain無限互相轉移。
- 傷害修改按主動玩家、非主動玩家順序處理，各自可選修改順序；修改後再計算實際受傷者的傷害預防與Ward。
- Gawain因該事件轉移傷害死亡時只抽一次；同事件同時有一般傷害也可觸發。先前事件受轉移但存活，之後別次一般傷害死亡不會誤抽。
- 抽牌保留Atlas／Spellbook選擇；強度加值、死亡替代、strike heal皆依真正傷害收據，不先回傳假的零傷害再補傷。

決策透過可保存的動作重播交易暫停，不將未完成傷害當已結算；存檔可以續選，給AI的observation刪除內含完整世界的私人重播基準。測試包含雙次傷害、取消轉移、跨區域／沉默／斜角排除、Ward、真strike治療、同時傷害、保存恢復與隱藏資訊遮蔽。

## 官方來源

2026-10-30背景瀏覽器直接讀取：

- [Damage及Modifying Damage／Preventing Damage](https://sorcerytcg.com/codex/d54c08da-2107-484a-9f68-123bb62581b5)：主動玩家先宣告其修改，然後非主動玩家；每個替代每事件最多一次；預防在修改之後，兩者皆不使用Storyline。
- [Royal Bodyguard](https://sorcerytcg.com/cards/royal_bodyguard)：卡文與royalty／nearby條件。
- [Sir Gawain](https://sorcerytcg.com/cards/sir_gawain)：卡文與本輪已核同時一般及轉移傷害FAQ。
- [Altar of Malachai FAQ](https://sorcerytcg.com/cards/altar_of_malachai)：救下Avatar不會阻止實際傷害，只替代因此敗北。本卡仍待後續實作，不因查過規則算完成。

Mortal Soil、City of Souls已接入相同交易與Bureau／墓地實體API，逐卡證據見 `docs/final-site-damage.md`。Altar仍待實體身分與once-per-game跨區域追蹤；完整全卡交互驗收仍未完成。
