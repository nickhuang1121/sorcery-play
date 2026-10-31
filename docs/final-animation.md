# Enchantress：單一實體 Aura Minion

2026-10-30。root 已套 shared integration patch。正式工作區單卡 16/16、動畫＋Avatar＋Orb 聯跑 100/100（當時動畫 12 項）通過；最新全套 598 項有 589 通過，9 個失敗均為當時尚未接入的新 Thaïs control 測試，已回報 root。

`src/final-animation.js` 使用同一個物件／同 uid 同時索引於 `s.auras` 和 `s.units`。runtime Card 的 Minion 型態保留原 Aura slug，使 Aura 被動繼續運作；原 Aura card ID 保存在 `finalAuraAnimation.card`。這些索引不代表兩張實體卡；死亡／回手會先移除 Aura 索引，再使用既有 unit 送牌路徑，送一次原始 Aura。JSON 還原重建 runtime 並重新建立單一物件別名。

施放費用、門檻、額外費用與目標先確認，再將原效果延後到 `finalResolveCommittedSpell`，上方排可選動畫。新施放 Aura 尚未入場，不能選它自身。動畫不創造進場事件；保留 Aura 真正入場回合，舊 Aura 可以立即移動，本回合進場者正常有召喚暈眩。敵方 Aura 保留敵方控制權。回到 Enchantress 的下一回合前還原 Aura，攜帶物落地。

初次隔離目錄 `/tmp/sorcery-animation-check` 套 patch 後：`node --test tests/final-animation.test.js` 12/12 通過；既有 `tests/final-avatars.test.js` 77/77 通過。測試涵蓋付費後原效果前的順序、取消、敵方控制、2x2 尺寸、原 Aura 尚未存在、移動與攜帶、Aura 資源被動隨範圍移動、死亡／回手實體去向、JSON／registry reset、到期與攜帶物落地、任意己方施法者、沉默與跨 region 選擇。後續正式工作區新增並通過：Orb 複本不算新施放、固定兩格 wall footprint 真移動、Void 不享普通 Aura 安全豁免、Vestments 讓 Aura Minion Burrow 後到期保留已移動的 below 位置；神器在 below 掉落。完整官方 Aura Characteristics subcodex 1872 的 surface／void 是 by default，並非 Avatar 的 only。Enchantress 全部 FAQ 未列到期移回地表例外；移除 Minion 不撤銷已完成的移動。此更正後正式工作區 16/16 通過。

共享整合由 fresh generator `/tmp/build-animation-integration-patch.py` 產生 `/tmp/final-animation-integration.patch`，不直接修改 shared 檔。

官方一手來源已用 CUA 展開：

- [Enchantress 8 FAQs](https://sorcerytcg.com/cards/enchantress)：已宣告目標後、原法術結算前；任意己方施法者；敵 Aura 保留控制；Aura 尺寸不變。
- [Animate](https://sorcerytcg.com/codex/1235b762-af7e-4007-b51c-557b5d4e4957)：獲得 Minion 類型且保留其他類型。
- [Aura Minion](https://sorcerytcg.com/codex/f1858871-f558-41d3-a540-76df43b35a5e) 連結的 Cards with Multiple Types：尺寸保留，其他特徵 Minion 優先，Aura Minion 可攜帶神器。
- 官方 Codex Summoning Sickness（從上述 Codex 目錄連結）：本回合進入 Realm 的 Minion 才有召喚暈眩；動畫並非新的進場。
