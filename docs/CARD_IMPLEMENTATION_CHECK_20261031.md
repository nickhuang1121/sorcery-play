# 卡牌實作狀態檢查（2026-10-31）

範圍：目前工作目錄的官方快照 1100 筆，逐一檢查註冊與效果操作；未聲稱涵蓋快照外的新卡。

## 結論

所有 1093 張非Token卡牌都已註冊且可選用；7 種Token都有處理器。未註冊非Token：0；定義中引用未註冊操作的卡牌：0。

**仍不能認定全部卡牌完整實作。** 1100筆全部標為部分支援；全庫現有稽核完整驗收0筆，其中402筆尚未審查。註冊、可放入牌組、通過測試、完整符合官方效果是不同層次。

## 目前全卡稽核紀錄

| 狀態 | 筆數 |
| --- | ---: |
| basic-tested-awaiting-effect-tests | 24 |
| code-reviewed-awaiting-tests | 158 |
| partially-tested | 393 |
| tested-awaiting-ui | 38 |
| tested-representative-awaiting-ui-and-source-refresh | 84 |
| tested-representative-rule-clarification-required | 1 |
| unreviewed | 402 |

## 文件落差

舊README、KNOWN_ISSUES與final-101-progress仍有Book未接入、Chaoswish遇Book暫停的描述；現行magic-context.js、final-chaos.js及book-final-acceptance／book-chaos-final測試已存在正式施放流程。這是過期紀錄，不應直接當成目前未實作的證據。新的全套測試結果另列如下。

## 本次測試

全套測試：2721/2721通過，0失敗、0略過；退出碼0。來源指紋未變：true。原始輸出：data/card-implementation-check-20261031-tests.tap。

## 查核方式

`node tools/check-card-implementation.mjs` 產生逐卡清單；`node tools/run-isolated-full-tests.mjs` 以獨立/tmp目錄執行全套測試，不改既有完成統計。

[1100筆逐卡資料](../data/card-implementation-check-20261031.json) · [既有完整稽核](ALL_CARDS_RULES_AUDIT_PROGRESS.md)
