# Dragonlord / Imposter：能力來源與實體身分

2026-10-30，已由 root 套 `/tmp/final-ability-sources-integration.patch` 及 NoAvatar patch。正式工作區 `node --test tests/ability-sources.test.js`：31/31 通過。原 Avatar 與 Animation 測試持續保留。

- Dragonlord 的 `deck.dragon` 在組牌時選定，驗證 Unique Dragon，setup 存 `players[p].setAsideDragon`，HUD 公開顯示。該設定牌不移出牌庫、不占集合／主牌稀有度額外名額，JSON 匯出與匯入保留。啟動檢查門檻與 3 魔力、每己回合一次，當回合結束還原。
- Imposter 從自己的實體 collection 宣告選 Avatar，可取消不付款；支付 3 後放逐那張牌並取得能力。Bureau permission 保持單一 effect scope。確實受到正傷害才失去面具，零傷害與 Ward 不會。換面具及傷害還原保留 uid、原力量／生命／元素與持續效果。
- `registerBorrowedCard` 使用 `buildAbilityRecord` 保留每個 printed origin／instance。動態 definitions/passives 只套原 Avatar 和一個外來源；現兩個 base 沒有被動衝突，不以覆蓋假裝支援多來源重複被動。多來源通用消費由 `final-ability-layers.js` 後續負責。
- runtime card 保留原 Avatar 特徵，printed keywords 從借用能力合併；Avatar 不得獲得 Stealth，不因 Voidwalk／Submerge／Burrowing 進其他區域。activated、end、passive Stop 傷害保存原能力來源，因此中性 Dragonlord 借用 Ignis Rex 仍造成火傷害。
- 同時列在 printed card 的 Genesis／Deathrite 是能力，取得時不創造新進場或死亡事件。Kairos 可設為公開參考，取得其卡文不會回溯觸發 Genesis；Kairos 的原始完整檔案效果由 units 批處理。
- `restoreAbilitySources` 在其他派生卡查詢之前重建 runtime／dynamic registry，包含只存在於 suspended frame 或歷史裡的來源。

31 項真 dispatch／setup／validation 測試覆蓋：必選合法 Dragon、門檻與魔力、只借能力不借特徵、全部 10 張 Unique Dragon 設定、Stealth／surface 限制、runtime registry reset、回合到期、Imposter 取消與實體放逐、Ward／零傷害、忽略 setup 能力、Bureau 一次 permission、Realm-Eater 面具消失後 Immobile 保留、Druid 面具翻面後敗北、legacy setupComplete 還原、Talamh 鄰 Site 力量、Moonsong／Grey Wolves 雙向力量、Adtonitum 真 Stop 傷害及氣元素來源、Caelestis 真零費 Dragon 並付 Mock Court 召喚稅、Draco 真傳送／埋葬、Bonekite 傷害與 Skeleton 計數、Vatn 真 end submerge（Avatar 不進 below）、Xeraphine 真 end 三張墓地實體選擇／放逐兩張回手一張。部分測試一項含多個斷言。

官方來源以 CUA 展開：[Dragonlord 6 FAQs](https://sorcerytcg.com/cards/dragonlord)、[Imposter 4 FAQs](https://sorcerytcg.com/cards/imposter)。Imposter FAQ 明確 Druid-mask 翻面後因沒有 Avatar 即敗北；不是從其他規則猜出來。雙方同時沒有 Avatar 的勝負未在本輪確認，root hook 明確 blocked／unsupportedRule，不猜和局。

Vivien 官方 FAQ 與逐項 readiness 證據見 [final-vivien-readiness.md](final-vivien-readiness.md)。正式工作區已有 41 項 Vivien 真效果測試；root 已核准啟用正式註冊；100 項核心交叉測試全過，最終整體發布檢查點由 root 管理。

來源補充：31 項來源測試包括 gained／Silence、Sorcerer legacy draw、實體 Imposter 被 Mephistopheles 替換，以及 Kairos 不回溯 Genesis／無檔案 Deathrite。qualified Spellcaster 的多權限 OR、獨立禁止句 AND 是一般規則與印刷卡文的推論，並非宣稱有逐牌多來源 FAQ。
