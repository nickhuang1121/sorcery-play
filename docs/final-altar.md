# Altar of Malachai

正式入口 `src/final-altar.js`、`src/engine.js` 的死亡打擊、restoreGame、commitSiteCard；`tests/final-altar.test.js` 七項真實dispatch效果測試。

玩家受到死亡打擊時，可選犧牲自己控制、位於有效Altar頂部的Minion替代死亡；可拒絕，Ward不能阻止犧牲。已造成的傷害／生命損失保留，不回復生命或離開Death's Door。不同實體Altar各有一次使用。被操控但不屬自己的祭品進原所有者墓地。

Blaze of Glory 的不死亡期間不提前詢問；等其全部戰鬥完成真正將死亡時才詢問並可替代延遲死亡，新增真dispatch回歸。

每局一次標記附著於實體卡的runtime識別，經Mirage退回手牌、再打出仍已使用；Mirror Realm保留它自己實體的使用狀態，不從複製對象複製已使用旗標。保存／重新install原卡資料後會重建runtime。這不是用printedID把同名實體綁在一起：測試同名兩張各可用一次，以及真Mirage手牌回收、真Mirror複製流程。

來源：原始官方快照 `data/final-101-baseline.json`、先前直接讀取 [Altar官方FAQ](https://sorcerytcg.com/cards/altar_of_malachai)：「替代死亡不防止已造成的傷害」。官方Damage來源見 `docs/final-damage.md`。

範圍：已接入遊戲目前的死亡打擊流程；主動認輸、對手勝利條件不是Altar可替代的死亡事件。Avatar不存在的規則狀態由獨立NoAvatar機制處理，未假造能重建不存在的Avatar。其他尚未完成卡（例如Kairos archive）的跨區域實體交互仍待整體驗收，不列全卡驗收完成。
