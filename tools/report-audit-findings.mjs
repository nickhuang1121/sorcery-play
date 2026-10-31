import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=p=>JSON.parse(fs.readFileSync(new URL(p,root),'utf8'));
const open=[];
for(const name of fs.readdirSync(new URL('data/all-cards-audit/',root)).filter(n=>n.endsWith('.json'))){
 const data=read('data/all-cards-audit/'+name);
 for(const row of data.cards||[])for(const finding of row.findings||[]){
  if(!finding||typeof finding!=='object'||/^(fixed|representative-regression-passed)/.test(finding.status||''))continue;
  open.push({slug:row.slug,name:row.name,source:'data/all-cards-audit/'+name,...finding});
 }
}
const runtime=read('data/all-cards-runtime-reproductions.json');
const result={checkedAt:new Date().toISOString(),scope:'Open recorded findings, not a claim that unreviewed cards have no defects.',findings:open,runtimeReproductions:runtime,ruleDecisions:'docs/PLAYER_RULE_DECISIONS.md',additionalRuleClarifications:'docs/ALL_CARDS_RULE_CLARIFICATIONS.md'};
fs.writeFileSync(new URL('data/all-cards-open-findings.json',root),JSON.stringify(result,null,2)+'\n');
const lines=['# 全卡庫已知待辦與失敗清單','',`更新：${result.checkedAt}。正式全套通過不代表以下項目已解決，也不代表未查卡牌沒有缺陷。`,'','## 已記錄但尚未關閉的逐卡發現','',...open.map(f=>`- **${f.name}**：${f.status||'未分類'}。${f.description||f.issue||f.topic||f.summary||f.actual||''}（${f.source}）`),'','## 其他重現與操作限制','',...runtime.map(r=>`- **${r.name}**：${r.status}。${r.description} 證據：${r.evidence.join('、')}。`),'','## 獨立規則裁定','','五項玩家裁定見 [PLAYER_RULE_DECISIONS.md](PLAYER_RULE_DECISIONS.md)；Bane／Monks等全庫新增疑義見 [ALL_CARDS_RULE_CLARIFICATIONS.md](ALL_CARDS_RULE_CLARIFICATIONS.md)。不採未經確認的家規。',''];
fs.writeFileSync(new URL('docs/ALL_CARDS_OPEN_FINDINGS.md',root),lines.join('\n'));
console.log(JSON.stringify({openLedgerFindings:open.length,runtimeRecords:runtime.length}));
