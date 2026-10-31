# Infusion Factory：持續 Artifact / Minion 雙型

2026-10-30。與 units 批共用 `src/artifact-animation.js`；本模組 `src/final-factory.js` 提供目前相鄰 Artifact 的持續 claims。root 已套 `/tmp/final-factory-integration.patch`，6/6 真工作區測試通過。

同一實體保留一個 uid，runtime 保留 Artifact 原 slug 與原卡 ID，同時加入 unit 索引；2 是基礎 power，自己的 bearer 能力仍可加力量、保護或提供其他作用。Factory 不奪控制，不限定敵我。相鄰關係失效或 Site 沉默後移除該 claim；原生 Automaton 保留原本 unit 索引、傷害、橫置與印刷力量，不會變成掉地上的普通 Artifact。多個 Factory 及 Grosse effects 由共用底層個別 key 管理。

Key 自己被 Factory 動畫後成為自身 bearer，取得對 Site 的保護，不會反過來讓創造它的那個 Factory 效果自行移除；已有 Key 保護的 Minion 不接受新的 Site 修改。這遵循現有 `siteEffectAllowed` 來源 gate 與既有生效效果不移除自己的規則。

6 項測試：敵我相鄰與原地不算相鄰、Sword 自身 +2 與 Amulet 自身保護、真移動離開相鄰恢復實體、原生 Wicker Manikin 還原保留傷害與 unit、死亡只送一張原實體卡、清空 runtime registry 後 JSON 單一身分還原、Key 自身動畫持續。其中部分測試包含多個效果斷言。

此處不宣稱所有 29 個 bearer 入口均已完成全面交互驗收；該部分與 Grosse Bil​​lehart 共用，由 units／root 審核。Factory 基礎與 six tests 已落地，涉及尚未接入的特殊 bearer 語義應保留明確限制。

官方 primary：[Infusion Factory](https://sorcerytcg.com/cards/infusion_factory) 已 CUA 直接讀取，頁面無 FAQ，卡文為相鄰 Artifacts 變成 2 power Automatons 並有自己的 bearer abilities。[Cards with Multiple Types](https://sorcerytcg.com/codex/f1858871-f558-41d3-a540-76df43b35a5e) 經 Aura Minion 連結核實 Minion 特徵優先；普通 Artifact 的可攜帶特徵不能把動畫後的 Minion 當一般物件帶走。
