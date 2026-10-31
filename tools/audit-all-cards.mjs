// Aggregate independently reviewed catalog records without treating registry
// availability, static review, or a generic helper test as full verification.
import fs from 'node:fs';
import assert from 'node:assert/strict';
const path=name=>new URL('../'+name,import.meta.url);
const read=name=>JSON.parse(fs.readFileSync(path(name),'utf8'));
const baseline=read('data/all-cards-rules-audit-baseline.json');
const types={Minion:'minions',Site:'sites',Magic:'magics',Artifact:'artifacts',Aura:'auras',Avatar:'avatars'};
const expected=new Map(baseline.cards.map(c=>[c.id,c])),seen=new Set(),cards=[],byCategory=[];
const dimensions=['cardText','legalActionsAndTargets','costsAndThresholds','choicesAndCancellation','timingAndTriggers','damageAndDeath','regionsAndContinuousEffects','representativeInteractions','saveAndRestore','actualBrowserUI'];
const tally=rows=>Object.fromEntries([...new Set(rows.map(c=>c.reviewStatus))].sort().map(status=>[status,rows.filter(c=>c.reviewStatus===status).length]));
for(const [type,name] of Object.entries(types)){
 const file='data/all-cards-audit/'+name+'.json',part=read(file);
 assert.equal(part.category,type,'Category changed: '+file);
 for(const c of part.cards){
  const original=expected.get(c.id);assert.ok(original,'Unknown printed card: '+c.id);
  assert.ok(!seen.has(c.id),'Duplicate printed card: '+c.id);seen.add(c.id);
  assert.equal(c.slug,original.slug,'Card identity changed');assert.equal(c.printedType,type,'Printed type changed');
  assert.ok(typeof c.reviewStatus==='string'&&c.reviewStatus,'Missing review status: '+c.slug);
  for(const key of dimensions)assert.ok(typeof c.dimensions?.[key]==='string','Missing dimension '+key+': '+c.slug);
  assert.ok(Array.isArray(c.evidence)&&Array.isArray(c.findings)&&Array.isArray(c.limitations),'Malformed evidence arrays: '+c.slug);
  if(c.reviewStatus==='fully-verified'){
   assert.ok(dimensions.every(key=>['verified','not-applicable'].includes(c.dimensions[key])),'Full verification lacks a dimension: '+c.slug);
   assert.equal(c.dimensions.actualBrowserUI,'verified','Full verification lacks actual UI: '+c.slug);
   assert.ok(c.evidence.some(e=>e&&typeof e==='object'&&e.kind==='browser-ui'),'Full verification lacks browser evidence: '+c.slug);
  }
  cards.push({...c,auditFile:file});
 }
 byCategory.push({type,total:part.cards.length,statuses:tally(part.cards),file});
}
assert.equal(seen.size,expected.size,'Catalog coverage is incomplete');
assert.equal(cards.length,baseline.total,'Catalog total changed');
const checkedAt=new Date().toISOString(),sources=read('data/final-101-official-source-index.json');
const result={checkedAt,baselineFile:'data/all-cards-rules-audit-baseline.json',scope:baseline.scope,total:cards.length,tokens:cards.filter(c=>c.category==='Token').length,statuses:tally(cards),fullyVerified:cards.filter(c=>c.reviewStatus==='fully-verified').length,byCategory,sourceVersions:{rulebook:sources.rulebook,codexEntries:sources.codexEntries.length,faqs:sources.faqs.length},limitations:['This is an audit coverage ledger, not a test runner. Each card records its actual evidence.','Static code review and tests of shared helpers do not establish complete card playability.','Existing5500 browser service is now authorized. Only specifically recorded actual UI scenarios are verified; all other card UI remains pending.','Generated runtime copies are not additional printed catalog entries.'],cards};
fs.writeFileSync(path('data/all-cards-rules-audit-progress.json'),JSON.stringify(result,null,2)+'\n');
const md=['# 全卡庫規則稽核覆蓋','',`更新：${checkedAt}。共 ${cards.length} 個原始條目，含 ${result.tokens} 個 token；runtime複本不重複計。`,'','這份文件區分尚未檢查、程式碼審查、逐卡效果測試及實際UI驗證；不是「全部卡牌已驗證」。','',`完整驗收：${result.fullyVerified}。來源：October 2026官方規則書、216項Codex及753項FAQ；每列另記實際核對依據。`,'','| 類別 | 條目 | 目前狀態 | 逐卡證據 |','| --- | ---: | --- | --- |',...byCategory.map(p=>`| ${p.type} | ${p.total} | ${Object.entries(p.statuses).map(([k,n])=>k+': '+n).join('；')} | [${p.file.split('/').at(-1)}](../${p.file}) |`),'','所有維度及具體finding保存在 [彙總JSON](../data/all-cards-rules-audit-progress.json)。未完成維度須保留；特別是實際瀏覽器UI不可由載入成功、預組模擬或helper測試代替。','','原101張的核心實作統計另見 [FINAL_101_PROGRESS](FINAL_101_PROGRESS.md)，兩者驗收範圍不同。尚需裁定的五個場景見 [玩家說明](PLAYER_RULE_DECISIONS.md)。',''];
fs.writeFileSync(path('docs/ALL_CARDS_RULES_AUDIT_PROGRESS.md'),md.join('\n'));
console.log(JSON.stringify({total:result.total,tokens:result.tokens,statuses:result.statuses,fullyVerified:result.fullyVerified,byCategory},null,2));
