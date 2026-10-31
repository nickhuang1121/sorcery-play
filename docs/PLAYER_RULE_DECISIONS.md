## Latest accepted Book / original101 status (supersedes older pending notes)

Original101 **101 completed core-effect-tested /0partial /0unstarted**, fullyVerified0. Latest full **2721passed/0failed/0skipped**,2026-10-31T00:16:12.588Z, sourceunchanged; stableTAP `data/all-cards-audit/logs/full-sorcery-full-regression-7eQoDV.tap`. Book user confirmed only alliedMinions count; Duel Ward beforefight. Suffering fully implemented groupedchoices/simultaneoussacrifice/Deathrites/opponentmatching; no prepayment guard remains. Actual5500 BookDuel, Suffering and ChaoswishBookWizardDuel all passed including reload, original browsermatch restored. Evidence/details docs/BOOK_FINAL_ACCEPTANCE.md. These are scoped core acceptances, not exhaustive all-library correctness. Four project rulings/Twister digital remain separately disclosed. No remaining101 decision blocker.

NEXT resume existing authorized wholecatalog audit:698 varying-scope reviewed/402unreviewed, fullyVerified0. Nine known candidate defects and /tmp wave drafts recorded below; do not claim allcatalog done. No runningknown full test. No push/deploy/server/ps/credentials changes. Browser2/tab5 fixturepage markedhandoff.

# 專案裁定：四項已批准，Book仍待最小範圍確認

查核日期：2026-10-30。Twister現已獲使用者明確批准改為全部20格隨機數位替代；這項批准不涵蓋以下五項，前四項現已由使用者明確指定；只保留Book的single／Ward時點問題。已查官方 October 2026 規則書（38頁，官方 Drive 檔案更新於2026-10-12）、216項 Codex（含子條目）及753項 FAQ。以下都是**尚未由已查官方資料確定的候選解釋**，不是新增官方規則。可提供官方裁定；若選暫行處理，會記錄為暫行規則，不宣稱全規則驗收。

## 最新使用者決定（2026-10-30；不是官方FAQ）

1. Globe離場：跨邊Aura留在原實際覆蓋格，只影響覆蓋處，不搬移。
2. Doomsday＋Globe：兩個4映射同格只受4，不相加。現有Doomsday矩陣所有同格碰撞值均相等；不同值不擅採max或sum。
3. Snowball＋Globe：繞一圈回起點停止，結算一次；保存origin與visited，不重複計數同一cargo。
4. 雙Throne同時勝利：當前回合玩家（s.active）獲勝，不依王座owner或網路提交seat。

程式／存檔profile為`user-rulings-20261030-v1`，網路build為`lockstep-20261030-project-rulings-v3`。官方原卡文與FAQ資料未改寫。以下前四項候選為原問題歷史，不再當未決。

## Book目前唯一最小待決

官方FAQ的target算choose已確定且現有真Magic流程已記錄target；不再詢問這一點。重新讀完整Storyline／觸發／Target／Ward條目仍找不到single範圍的明文。最小Duel例：Book持有者選一隻友軍BrownBears及一隻敵軍WildBoars。A：整張Magic選了兩隻minion，不給Ward。B：只計單一友軍／逐次友軍選擇，友軍先得Ward，擋掉該次fight傷害。若選整張最終集合，SymmetricSuffering的後生Deathrite目標還需明確Ward時點；不能預知後續玩家選擇。兩個可觀察結果及來源修訂日期詳`FINAL_FIVE_THRONE_BOOK.md`。

1. **Magellan Globe 離場後，普通 Aura 放在哪裡？**
   Aura 原本跨左右邊界，佔 A3、E3、A4、E4。Globe 離場後，這四格不再是普通2×2。
   - A：類推大型 unit 的處理，移至最近合法2×2，平手由控制者選。
   - B：非 unit Aura 保留原四格，直到其他效果移動或移除（需要一個範圍例外）。
   **需要決定：**Aura是否也適用「最近合法位置」；若不是，其確切安置方式。
   已查：規則書p19／30；[Globe官方FAQ](https://sorcerytcg.com/cards/magellan_globe)的跨邊離場答覆只明寫units。詳見`final-geometry.md`。

2. **Globe 讓傷害圖案的兩格落在同一位置，傷害合計嗎？**
   Doomsday Device 的5×5圖案在4列環面上，兩個印刷值4映射到同一個實際位置。
   - A：該位置傷害為4（視為同一位置一次）。
   - B：該位置傷害為8（兩個圖案格相加）。
   **需要決定：**重複投影採去重或累加。
   已查：規則書p29、Globe九項FAQ、Damage Grid／Oversized Codex；沒有這種映射的合併條款。

3. **Snowball 在 Globe 的完整同區域環線上，何時停止？**
   整條路徑都在surface，沒有void／region邊界或阻擋；雪球可一直繞回起點。
   - A：再次走相同步驟前停止，正常結算雪球傷害。
   - B：沒有region邊界就不算停止；另需裁定無窮循環的處置。
   **需要決定：**能否把閉環當作「停止」，以及停止位置／循環處置。
   已查：規則書p21／30、Projectile與Path Codex。不得重複步驟的宣告規則針對unit movement，不能直接假定雪球因此停止。目前明確阻擋此邊界，不任意跑20步後傷害。

4. **雙方同時符合 The Immortal Throne 勝利條件。**
   兩個王座都至少8級；同一事件完整結束後，雙方Avatar分別在不同王座的位置且各自沒有其他unit。
   - A：雙方同時獲勝，判平局。
   - B：類推非主動方事件優先，先判非主動方獲勝。
   **需要決定：**平局或具體優先序；王座的即時勝利是否屬於可排序的觸發事件。
   已查：規則書p11／27／31／36、[Throne FAQ](https://sorcerytcg.com/cards/the_immortal_throne)、Winning the Game／Storyline／Death Blow Codex。雙death blow平局條文沒有明確擴及王座雙勝。

5. **Book of Blessings 的 single 指整張Magic，還是每個選擇指令？**
   Book持有者施放Symmetric Suffering，先犧牲自己的Bitten；其Deathrite才產生對手的Skeleton，供對手後續選擇。不能在第一次犧牲前就選尚不存在的Skeleton。
   - A：整張Magic最後只選一個不同minion、且是盟友，才符合；需另定跨事件何時判斷並賦Ward。
   - B：每個單獨選擇指令只選一名盟友就符合，可以在該次選擇後賦Ward。
   **需要決定：**single的範圍、是否只計盟友，以及Ward的確切時點。
   已查：規則書p19／31／35、[Book FAQ](https://sorcerytcg.com/cards/book_of_blessings)只確認target也算choose、Suffering FAQ與Sacrifice／Die Codex。不能假設犧牲前的Ward毫無影響，它可能改變力量與Deathrite。詳見`BOOK_SUFFERING_TIMING.md`。

[目前官方規則書](https://drive.google.com/file/d/1sgQo0xf0N2teIR0zlyl91g9j6LVncZnr/view)由[官方玩家教學頁](https://sorcerytcg.com/get-started/player)連出；同一Drive ID會更新，不能只看舊公告標題判版本。精確來源ID／版本保存在`data/final-101-official-source-index.json`與各專項文件。

這些裁定不阻擋其餘卡牌實作與全卡庫稽核。人工分類／實體吹牌／瀏覽器連線等驗證限制另見`FINAL_101_RULE_DECISIONS_REQUIRED.md`，不是以上五項規則裁定。
