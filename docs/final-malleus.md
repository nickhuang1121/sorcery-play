# The Malleus Maleficarum

狀態：已整合 production definition；`tests/final-malleus.test.js` **20/20 真實 dispatcher 測試通過**，沒有測試定義注入。原始卡文保留於 `data/final-101-baseline.json`，未改官方快照。

## 實際效果與入口

- `src/final-malleus.js` 提供 activated definition、候選可行性、最終 choice 限制、整組 targets 驗證及實際施放後的每回合使用紀錄。
- `src/collection.js` 保存獨立 casting permission：原 bearer、來源實體 UID、collection 區域及 Bureau access scope。`caster-permissions.js` 將此許可與一般 Spellcaster 資格分開，因此非 Spellcaster bearer 也可施放；仍遵守門檻、費用、失能及真正的禁止效果。
- 所有 Magic 直接 targets 中，至少一個須為敵方 Spellcaster、其實際 location 或 site。神器的資格以共用 typed caster permission 判斷，不能只讀原始 artifactSpellcaster/spellElements 或一律排除 Silence；仍保留失能、控制權與真實佔格檢查。資格看當前控制者，含 Avatar 的 Spellcaster characteristic、一般／借得的 Spellcaster、神器及 Site 的有效 casting 能力；大型、多位置與地下位置依實際佔格處理。
- 單目標、legacy Magic、Swap／Backstab、Chain Lightning、Duel／Harpyon Urge／Trial by Water、Grasping Ground、Meteor Shower 都在付款前確認完整宣告可滿足限制。Chain 可先經非合格單位，但須有可負擔路徑；不能未命中合格目標便 commit。Joust／Shatter 的盟友自己 target，以及 projectile 撞擊，不是 Magic 本身直接 target，不能藉此取得許可。
- 每回合次數只在真正 commit Spell 時耗用。取消宣告保留卡牌、法術費用及使用次數。Bureau 費用獨立支付，一張 Malleus 能力所授予的 collection cast 沿用同一票據，不再次扣費。已付 Bureau 後取消後續施法不會退回該已付能力費用。
- 已開始的 permission 固定原 caster。來源掉落不自行取消既有效果；Magic 在 bearer 後續死亡後仍可結算剩餘固定目標。相同實體的使用紀錄保留，沒有把 UI 開關當成實際效果。

## 操作介面

將 Malleus 裝備到自己的單位後，選其「每回合一次」能力；只有 collection 裏確有可完成且費用可負擔的 Magic 才顯示可用。介面先選施放的卡牌，再依卡片宣告全部必要 targets／選擇；任一付款前階段可取消。Bureau 存在時先顯示獨立支付／拒付選擇。保存與恢復保留 permission、原 caster、已付票據與未完成宣告。

## 官方證據與推論界線

- [Malleus 卡頁](https://sorcerytcg.com/cards/the_malleus_maleficarum)：已實際展開唯一 FAQ，確認 bearer 即使沒有 Spellcaster 仍可施放。官方公開 SSR FAQ id：`f1ba891f-8671-4852-874c-39accc7fbb56`；`_updatedAt`：`2025-12-06T06:17:51Z`。版本另與 `/tmp/sorcery-official-faqs-parsed.json` 核對，文件僅摘要，沒有複製整份快取。
- [Casting Magics](https://sorcerytcg.com/codex/43a73161-4f77-46b1-a23a-f916223a748c?sub=15e240391b4d)：直接 targets 在施放前全部宣告；一般 ally 選擇於結算；官方 Joust 例明確是盟友而非 Magic 進行 target。
- Duel／Harpyon Urge／Trial by Water 及 Grasping Ground 的 target 名詞，依上述通則與卡文解釋為 Magic 的直接宣告，並與 Joust／Shatter 的 ally targets 動詞區分。這是明示的卡文推論，不聲稱存在額外逐張 FAQ。
- [Bureau 卡頁](https://sorcerytcg.com/cards/bureau_of_occult_control)：區域讀取與實際移出不同，費用獨立且按整個效果處理；費用規則與 `docs/CEMETERY_INTEGRATION.md` 相同。

## 可稽核驗證

20 項涵蓋：真正從手牌施放並裝備、非 Spellcaster、合格與不合格 Magic、取消與再次嘗試、每回合一次、掉落來源及 JSON 恢復、Bureau 支付／拒付／不重扣、Chain 經非合格單位及 Oak 預算、Swap 第二目標、Meteor 完整三個落點、Grasp 未來 actor／bearer 死亡、Oak 強制不合格目標、silenced bearer 與 silenced artifact、總預算、大型 Spellcaster 各佔格、地下 caster 與 Surface 同格不受傷、沒有敵方 minion 的 River of Flame Site Spellcaster。另驗證真 Vivien 經 Gargoyle 變為 Artifact 後的 generic Spellcaster、實際施放 Fatality 移除來源、原生能力 Silence、獨立外來 Spellcaster 在 Silence 下仍有效及其結束、Pallid 實體 detach 與 JSON 恢復。

目前沒有另列 Malleus 核心效果的已知阻礙。Book 的 single 語義與其多段 Ward 時機仍由 `docs/final-passives.md` 單獨列 partial，沒有因此限制 Malleus 為單目標子集。全專案組合與最終完整測試、模擬結果以主進度審計為準。
