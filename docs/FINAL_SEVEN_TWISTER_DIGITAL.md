# Chaos Twister 使用者批准數位替代驗收

2026-10-30。依root轉達的使用者明確授權，實體吹牌程序改成全部20格等機率的基準隨機落點，void/occupied均不過濾，不再有人工作實體結果。這是使用者採用的數位替代規則，不冒稱官方實體程序。

只新增 `/tmp/final-seven-twister-digital-candidate.mjs`；共享runtime由root修改。讀取 `src/final-effects.js`、既有 `tests/final-effects.test.js`、`src/choice-context.js` 與 shared `rollIndex`，確認實際數位實作後才跑。

命令 `node --test /tmp/final-seven-twister-digital-candidate.mjs > /tmp/final-seven-twister-digital-candidate.log 2>&1`：**26/26通過、0skip、exit0**，2843ms；目前檔案穩定，沒有active session。

## 覆蓋

- 20個nativecast→選真正target→真Black Cat隨機控制choice，各落點逐格走一次。每一格特意設為void，仍完整顯示0..19，沒有只選合法地形或occupied的隱性過濾。選中真Voidwalk minion能到該格且無impact damage、Ward保留；保存exact `{uid,player,turn,landing,rule:'digital-uniform-board-v1'}`，cold JSON保留，沒有physical report。
- void0原BlackCat與void17原Avatar會因不合法起始地形失能，因此fixture把它們放到鄰近正常格；void10時target從11出發。這是保持原生隨機控制與合法施法者，不是略過0/10/17結果；全部20格仍各自驗證。
- Talus force immunity仍產生且只記一次真landing，停原位置不傷害。
- 真oversized Mountain Giant在landing12後可選包含12的placement；在placement choice冷JSON保留已定落點與結果，再選anchor6，Ward承受impact而破，沒有重新random；帶真choiceToken的duplicate action拒絕且state不變，不重複record。
- 選target前取消：不支付、不移除手牌、不改rng、不建立result。
- void非Voidwalk minion真banish，不製造傷害。
- **無隨機控制來源時**，從真cast待選target的rng驗證一次shared LCG進位與`floor(value*20)`結果，cold JSON不再抽，結果只一筆。
- 真Kythera持有者以latest stamp超過BlackCat，random choice確為Kythera玩家，完整20選項，可固定13且不額外rng進位，只一筆record。這是官方隨機控制介入後有意變更結果，**不能把受BlackCat/Kythera控制的分布仍稱均勻**；均勻是無干涉時20格相同權重，PRNG並非本批做統計獨立性證明。

## 限制

本批未操作UI，root負責實際介面；未跑全套或遊戲模擬。舊正式physical-report測試必須由root依已批准數位行為更新，不能把舊物理期待的失敗稱新的產品bug。舊實體未決阻礙已由使用者選擇替代解決；其他Snowball/Globe閉環、Book等裁定不在本批准內。本26測沒有更改這些規則，也未改任何正式檔。
