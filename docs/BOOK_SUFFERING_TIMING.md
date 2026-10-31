# Book of Blessings / Symmetric Suffering 時機研究

狀態：Book 仍 partial。本文件不是新的官方裁定，也沒有將尚未解決的時機改成完成。

## 已核對的來源

- [Book](https://sorcerytcg.com/cards/book_of_blessings) 唯一公開 FAQ `aa28f077-ea12-4e65-8495-19dd0cb388b3`（2025-12-06）只確認 target allied Minion 亦算 chooses，沒有定義 single 的範圍。
- [Symmetric Suffering](https://sorcerytcg.com/cards/symmetric_suffering) 卡文先自己犧牲、再要求對手匹配。FAQ `57e63752-22f7-4199-9f60-49357885e829`（2025-12-19）允許多卡片型別者選擇一個型別讓對手匹配；同一 Automaton 不能因此要求對手同時犧牲 Minion 和 Artifact。
- [Sacrifice](https://sorcerytcg.com/codex/b6ffd09a-c8fb-4b80-ac24-4900e8fd5ca3) 明示犧牲忽略所有防止摧毀與替代，包含 Ward；仍觸發 Deathrite。
- [Die](https://sorcerytcg.com/codex/56de42f7-3d67-4437-826c-6a89cd356458) 明示標死後不可再次選擇犧牲；Deathrite 在進墓地之前結算，而且可產生進一步死亡。

工作解釋為「整張 Magic 實際選擇的 distinct Minion 恰有一個且是 ally」，由專案明示採用；不能引用成 FAQ 已裁定。

## October 2026 官方 Rulebook 再核對

[官方目前規則書](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view)，38 頁，內文明示 October 2026，取得的檔案修改時間 `2026-10-12T20:32:30Z`；來源是官方 How to Play 目前連結。雖然 December 2025 新聞也曾使用同一 Drive ID，這次讀取的內容不是據此推定的舊版本。本機全文 `/tmp/sorcery-official-rulebook-oct2026.txt`；下列為印刷頁碼。

- p.19 的 Magic 規則是按其文字執行後進墓地，沒有定義 single 或 chooses 的集合範圍。
- p.31 要求 targets 在事件加入 Storyline 時指定；其他細節到結算時才需要。其事件分拆及新觸發插入敘述沒有要求為 Book 提前預選未來 Deathrite 之後的候選，也沒有將全部非 target choices 改成施放時宣告。
- p.35 的 Sacrifice 條文確認犧牲會觸發 Deathrite、已在死亡中的單位不能再次犧牲；沒有允許忽略這些真實後續狀態來提前選對手的牌。
- p.27 的觸發能力定義及 p.31／36 的競爭事件排序，處理已存在的事件如何結算，沒有說明 Book 的 single 是整張 Magic 最終 distinct 集合、單次選擇事件，還是選擇指令結構。

**結論：新版 Rulebook 支持 targets 與後續 choice 的時機區分，但仍未裁定 Book single 的範圍與跨分拆事件的條件判定時點。** 本專案目前的完整 distinct-Minions 集合仍只是明示工作解釋。Suffering 的實際 Deathrite 後生候選不能因此提前猜測；Book 仍 partial，未改引擎或宣稱疑義已解。

## 可直接採用的規則一致 UI 流程

1. 自己的犧牲規劃畫面分列 Minion / Artifact / Aura，可略過每一類。同一實體 UID 最多出現一次；多型別實體選其中一個匹配類別，不能重複用於兩個 slot。暫選不移動牌、不執行任何死亡或隨機效果。
2. 確認自己選擇後才重驗控制者、實體存在、未標死及匹配型別，依規則的實際事件順序執行自己犧牲。不要預先移除對手的候選，不要用初始盤面猜對手之後能選什麼。
3. 正常執行已發生的 Deathrite / 觸發、玩家選擇及抽牌／隨機效果；這些是真結算，沒有 preview / replay。使用原有 Storyline 與保存續接。
4. 對手只在這之後的真實盤面，為仍須匹配的類別選擇犧牲。若前面的 Deathrite 新召喚了 Skeleton，它必須出現在實際合法候選；若原候選已死亡，不得再列入。
5. 對手完整確認後執行其犧牲及正常觸發。保存只存 UID、匹配類別、階段與已實際選擇的快照，不儲存 closures，也不拿有未來資訊的假狀態供 UI 選擇。

上述 own / opponent 的每一階段可以各自採完整集合規劃，但不能把整張 Magic 的所有選擇都從初始盤面提前宣告。自己各類犧牲是否應視為一個同時事件，須依 Storyline event-splitting 通則明確決定；不得為方便 Book 而任意合併現有死亡事件。

## 為何此流程仍不能一般化解決 Book

在上述工作解釋下，第一次犧牲之前未必能知道整張 Magic 最後會選一個還是兩個 Minion。例如，自己犧牲 Bitten 後，其真正 Deathrite 會在對手下一個犧牲選擇前召出由對手控制的 Skeleton。把這個 Skeleton 當成不存在，便錯把兩名判成單一；提前讓對手選它則選了當時尚不存在的實體。

也不能以「犧牲一定會死，所以 Ward 無任何作用」略過正確時機。Ward 有持續特徵依賴：Angel Ascendant 的力量、Faith Incarnate 的力量、Ward 條件能力，以及 Squirming Mass 讀取死者力量，都可能使暫時賦 Ward 成為可觀測的狀態變更。不能先猜會符合、事後撤回，也不能在死亡與 Deathrite 都已完成後補一個成功紀錄冒充提前結算。

若要求完整未來集合的 predicate，而且要求在第一個有關效果前結算 Ward，一般情況就出現對尚未發生選擇的依賴。純規劃可以延後同一階段的副作用，無法跨過必須先真結算、且可能包含玩家決策／隨機性的 Deathrite。回放未來選擇或提前執行 RNG 都不是本方案。

因此可實作並驗證上述 Suffering 選擇流程，但目前不能宣稱它解決了 Book 的所有時機。需要額外明確規則界定 single 是整張 Magic 的最後實際集合、各選擇事件，或該 Magic 的選擇指令結構，以及條件何時判定。這是精確的規則依賴，不是以 UI 凍結或無效果占位代替實作。

## 已加入的真正 dispatcher 證據

`tests/magic-context.test.js` 新增：

- 真正施放 Young Master Damion 並從 collection 召 Ghouls；Fatality 一般摧毀仍被阻擋，Suffering 犧牲必定移入墓地。
- 雙方各實際選一名 Minion：保存兩個 UID，完整集合判斷不觸發 Book。
- Bitten 真 Deathrite 新生成敵方 Skeleton，之後必須由對手實際選該 Skeleton；不能由初始盤面預覽忽略。
- 略過全部犧牲：Book 留場、無 chosen Minion、無 Ward，正常支付法術費用並完成 Magic。

這些案例驗證不受 single 時機疑義影響的實際路徑；它們沒有證明單一盟友犧牲路徑已正確提前觸發 Book。

## 可供整合的純規劃介面（尚未取代現有引擎流程）

`src/magic-suffering.js` 已提供 `createSufferingPlan`、`sufferingPlanOptions`、`chooseSufferingPlan`、`validateSufferingPlan`。只產生／重驗可序列化的 `{player,kinds,required,picks:[{kind,uid}]}`；不執行犧牲、不讀 RNG、不推演 Deathrite，也不修改盤面。同 UID 多型別可匹配一種，已用 slot 不再提供同 UID。對手有合法匹配時不能略過；盤面更新後必須重新以真實當前候選驗證。

`tests/magic-suffering.test.js` 的四項是純 planner 邊界測試，**不是**完整引擎整合或 Book 完成的證據。現有四項新 dispatcher 證據仍在 `tests/magic-context.test.js`。此介面保留可 review 的下一步，沒有把單獨 helper 加入完成數字。

## 正式開放評估：維持暫緩

曾具體評估只在「有有效 Book 的實際 bearer 施放 Symmetric Suffering」時，於 beginCast／commitSpell 第一行拋出具名錯誤，利用既有 immutable dispatch transaction 保留費用、卡牌、RNG 與盤面；其他 bearer 與 Magic 仍可正常施放。純 `unsupportedBookCast`／`assertBookCastSupported` helpers 已寫在 `src/magic-context.js`，**沒有接入引擎**；候選 fresh patch 只在 `/tmp/build-book-production-guard.py`／`/tmp/final-book-production-guard.patch`，未套用。

此組合 guard 仍不足以正式開放 Book：single 的疑義也可能影響整張 Magic 與單個指令、allied-only 與包含 enemy 的計數，並非只有 Suffering 的多事件時機。現有成功案例不能證明其餘所有 Magic 都已獲官方裁定。故 Book 不新增正式 marker、不宣稱完整或全面可玩；Chaoswish 抽到 Book 仍維持同一固定 unsupported 結果，不重抽、不縮池。需有進一步官方裁定或明確接受的規則解釋，才能選定正式 production 語義。
