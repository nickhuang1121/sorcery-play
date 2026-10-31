# 尚需裁定或外部驗證的精確邊界

2026-10-30。這是剩餘問題索引，不代表停止不受影響卡牌的實作。最後正式成功節點以 `FINAL_101_PROGRESS.md` 與 `data/final-101-validation.json` 為準。此處沒有擅自詢問外部裁判、撤銷憑證或改設定。

| 卡牌 | 具體問題／阻礙 | 已有證據與候選 | 後續所需 |
| --- | --- | --- | --- |
| Magellan Globe | 普通非 unit Aura 跨邊後 Globe 離場，如何安置；5×5 grid 在 4 row 環面同格重複投影是 4 或 8 | `final-geometry.md` 列九 FAQ、Codex、完整 969 文件重查；unit closest-fit 沒有直接涵蓋 Aura，Oversized 不等於同格重疊 | 官方具體裁定，或使用者明示接受記錄為推導的處理 |
| Snowball／Globe | 全同 region 的環面上，piercing projectile 沒有 region 邊界時如何結束；不能把防無窮迴圈當作停止並傷害 | Projectile Codex 說 piercing 只在 region 邊界停；Path 的不得重複宣告 unit 步驟不足直接授權此停止。原 Giant 保留數量問題已依 Carrying Units 的共享位置關係通則推導解決，並有 Giant／Talus 真測 | 官方閉環裁定；目前使用精確不支援邊界、不能任意 20 步造成傷害 |
| The Immortal Throne | 同一事件令雙方同時符合不同 Throne 的即時勝利條件 | `final-rules-open-questions.md` 已查版本；雙 death blow 的 draw 不能直接當所有雙勝通則 | 官方一般雙勝條款／本例裁定 |
| Book of Blessings | single 指完整 Magic、每個 choose 事件、或指令結構；Suffering 前段 Deathrite 改後選候選時何時賦 Ward | `BOOK_SUFFERING_TIMING.md`；FAQ 只確認 target 算 choose；真 Bitten / Skeleton 後生候選證據 | 明確 single 與判定時機，避免預知／重播未來選擇 |
| Demonic Contract | 核心分類人工確認及實際瀏覽器元件流程已驗，實體分類與完整牌桌未驗 | 真引擎＋共用 `src/effect-choice-ui.js`；取消／確認前不扣費、確認後mana2且移除RubyCore並完成搜尋。見 `data/final-101-manual-contract-ui-validation.json` 與截圖 | 輸入為合成人工分類，不是實體卡分類；仍列部分。舊getTab失效可由fresh browser tab正常操作，不再列為全部UI不可用 |
| Chaos Twister | 使用者已批准全部20格隨機數位替代，不再是待實體操作阻礙 | shared RNG、一次保存、20格/JSON/防重送/同步與真UI已驗；不是官方吹牌程序 | 最新完整回歸仍待確認舊測試程序終止；不把其他家規當已批准 |
| Chaoswish | 完整隨機池包含未開放卡牌 | 已保留抽中結果、阻擋待支援，沒有重抽；詳 `final-chaos.md` | 相關卡牌完成後補全池代表性真測；不把受限池當全規則完成 |

Pallid Bust 與 Vivien 是仍在進行的程式實作，當前沒有列在此表當作規則疑義藉口。來源層／多來源費用等具體待辦保存在 `FINAL_101_HANDOFF.md` 及各 source 文件。正式核心完成不等於完整全卡庫規則驗收；所有 fullyVerified 仍為 0，後續全卡庫稽核必須另行執行。
