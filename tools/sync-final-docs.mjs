import fs from 'node:fs';
const read=name=>JSON.parse(fs.readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const ledger=read('final-101-progress'),progress=read('card-progress'),{counts,validation}=ledger;
const write=(file,text)=>fs.writeFileSync(new URL('../'+file,import.meta.url),text);
for(const name of ['README.md','docs/PROJECT_PROGRESS.md','docs/KNOWN_ISSUES.md']){
 const archived='docs/'+name.split('/').at(-1).replace('.md','_PRE_FINAL_101.md');
 if(!fs.existsSync(new URL('../'+archived,import.meta.url)))fs.copyFileSync(new URL('../'+name,import.meta.url),new URL('../'+archived,import.meta.url));
}
const browserPath=new URL('../data/final-101-browser-validation.json',import.meta.url);
const browser=fs.existsSync(browserPath)?JSON.parse(fs.readFileSync(browserPath,'utf8')):null;
write('README.md',`# Sorcery: Contested Realm · 本機網頁遊戲

原生 HTML、CSS、JavaScript ES Modules；無框架、無 npm 依賴與建置步驟。核心遊戲使用本機官方卡牌快照；可選 AI、本機雙人與四副官方 Beta 預組，自組牌可匯入、匯出及保存於 localStorage。另有 Firebase 線上房間模組與外部牌組網址匯入，這兩者需要網路。

在根目錄執行 \`python3 -m http.server 8765\`，開啟 \`http://localhost:8765/\`；也可用 VS Code Live Server。

## 目前進度

**尚未完成全部卡牌。** ${progress.total} 筆官方快照中，${progress.playable} 張可選、${progress.runtimeTokens} 種衍生物、${progress.notStarted} 筆尚未開放。

本輪基準101張：**完成核心效果與逐卡效果測試 ${counts.completed} 張／部分實作 ${counts.partial} 張／尚未開始 ${counts.notStarted} 張，合計101。** 完成核心不代表全卡交互或完整官方規則已驗收；所有可選牌仍標為部分支援。不能用瀏覽器載入或預組對戰代替逐卡效果驗證。

[101張逐卡證據、限制與下一步](docs/FINAL_101_PROGRESS.md) · [機器可讀進度](data/final-101-progress.json) · [已知缺口](docs/KNOWN_ISSUES.md) · [官方規則來源](docs/RULE_SOURCES.md)

## 驗證與操作

- \`npm test\`：最新完整 Node 測試 **${validation.passed}/${validation.tests} 通過**，包含既有回歸、新卡效果與未開放 helper。測試數不是完成張數。
- \`npm run test:games\`：16種官方 Beta 預組配對；會更新 [對局結果](data/smoke-game-results.json)。不保證每張新卡在預組中出現。
- 本機 HTTP server 開啟 [瀏覽器整合測試](tests/index.html)：${browser?`${browser.passed}通過、${browser.failed}失敗（${browser.checkedAt}）`:'本輪結果另記，不沿用歷史宣稱'}。
- \`npm run progress:update\`：重新跑完整 Node 測試並同步逐卡進度與文件。失敗時保留測試輸出，不改寫完成統計。

拖曳手牌或點選卡牌後選合法位置；單位可移動、攻擊、啟動、拾取及放下。右鍵／觸控長按看卡；ESC取消。Animist與Avatar of Fire有卡牌用途選單。Chaos Twister依使用者指定採數位替代：全部20格隨機落點（含空格／虛空），結果只產生一次並保存；這不是官方實體吹牌程序。

原官方 Beta 預組為36張Spellbook／16張Atlas，自組牌通常至少60／30，收藏區獨立最多10張。Duplicator另有牌庫限制。舊交付的1708項歷史測試未隨目錄提供，不包含於本輪驗證。

## 資料與權利

原始官方快照保留在 \`data/official-cards.json\`；本輪不可變清單為 \`data/final-101-baseline.json\`。初始完整備份與SHA256見逐卡進度。沒有修改Firebase設定，也沒有推送或部署。

本專案為非官方實作；Sorcery及相關名稱為Erik’s Curiosa Limited所有。卡牌採CSS與文字呈現。前一輪文件已保存在docs的 \`*_PRE_FINAL_101.md\`，僅供歷史參照。
`);
write('docs/PROJECT_PROGRESS.md',`# 專案進度

更新：${ledger.checkedAt}。

本輪原始101張：完成核心效果與逐卡測試 ${counts.completed}、部分 ${counts.partial}、尚未開始 ${counts.notStarted}，合計101；完整官方全卡交互驗收0張。

目前 ${progress.playable} 張可選、${progress.runtimeTokens} 種衍生物、${progress.notStarted} 筆未開放；完整Node測試 ${validation.passed}/${validation.tests} 通過。

以 [FINAL_101_PROGRESS.md](FINAL_101_PROGRESS.md) 的101張逐卡表與各組證據為準；[final-101-progress.json](../data/final-101-progress.json)包含原始狀態、實作位置、效果測試名稱、限制與下一步。前輪第84–88批與舊數字保留於 [歷史進度](PROJECT_PROGRESS_PRE_FINAL_101.md)，不代表現在狀態。

## 繼續執行

1. 讀逐卡表中部分／尚未開始的卡及對應組別文件。
2. 先核實官方卡文、卡面圖與FAQ，補齊實際成本、選擇、結算與必要引擎能力；不可只設可選旗標。
3. 每張加入有效果斷言的真實dispatch測試與邊界案例；不刪測試、不放寬斷言來通過。
4. 執行 \`npm test\`、\`npm run test:games\`、瀏覽器驗證及 \`npm run progress:update\`，保持統計一致。
`);
write('docs/KNOWN_ISSUES.md',`# 尚待處理

本輪101張中 ${counts.completed} 張完成核心效果、${counts.partial} 張部分、${counts.notStarted} 張尚未開始；全部卡牌仍未完成全交互驗收。[逐卡限制與下一步](FINAL_101_PROGRESS.md)。

- Chaos Twister採使用者批准的20格隨機數位替代，無真人吹牌；仍保留官方隨機控制效果與真實移動／傷害限制。Demonic Contract為已實作的人工分類確認流程，不宣稱程式自動分類實體卡。
- Book正式施放與Chaoswish免費Book已驗收核心效果：只計友方Minion，Duel在戰鬥前給Ward；Suffering整組選擇後同時犧牲、處理Deathrite，再由對手匹配。跨全卡所有組合尚未窮盡。
- Globe留原Aura格、等值傷害投影去重、Snowball單圈、雙Throne當前回合玩家勝，均為使用者明確專案裁定，介面與存檔明示版本；不冒稱官方FAQ。
- 幾何多位置、全域墓地交換／保護／存取成本、可暫停傷害替代、動態printed abilities依存層等深層支援尚未齊全；相關未開放卡不會因helper測試通過而算完成。
- 完整Storyline、區域與全卡效果交互未完成驗收；已開放卡的效果測試不代表所有組合均正確。
- Automaton在引擎以Minion加artifactUnit表示，部分舊神器專用入口仍可能只看artifacts陣列；特殊載具、複製與同時觸發順序需持續補測。
- 原交付1708項歷史測試未隨工作目錄提供。本輪只有可重跑的Node、對局與瀏覽器結果算驗證；瀏覽器載入與預組對局不能代替逐卡效果測試。
- 這個工作目錄沒有.git，不能提供本機分支或未提交變更比較。初始tar備份保留復原基準。

各組完整規則來源、實作與測試請看逐卡表所連結文件。先前問題清單保留於 [歷史版本](KNOWN_ISSUES_PRE_FINAL_101.md)。
`);
const batches=read('implementation-batches');
for(const group of [...new Set(ledger.cards.filter(c=>c.playable).map(c=>c.implementation))]){
 const subset=ledger.cards.filter(c=>c.playable&&c.implementation===group),key='final101:'+group;
 let batch=batches.batches.find(b=>b.key===key);
 if(!batch){batch={batch:Math.max(...batches.batches.map(b=>b.batch))+1,key,cards:[]};batches.batches.push(batch);}
 batch.cards=subset.map(c=>({slug:c.slug,name:c.name,playable:true,effectTest:'passed',completionStatus:c.status}));batch.validation=subset[0].testFile;batch.source=subset[0].details;
}
batches.batchCount=batches.batches.length;batches.addedCards=batches.batches.reduce((n,b)=>n+b.cards.length,0);batches.remainingNotStarted=progress.notStarted;batches.checkedAt=ledger.checkedAt;
fs.writeFileSync(new URL('../data/implementation-batches.json',import.meta.url),JSON.stringify(batches,null,2)+'\n');
console.log('Synchronized README, project progress, known issues, and batch metadata.');
