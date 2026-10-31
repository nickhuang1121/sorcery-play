// Rebuild the final-101 ledger from the immutable baseline and actual runtime.
// Test results are captured from a real Node run, never a hand-written count.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {testSourceFingerprint} from './test-source-fingerprint.mjs';
import {install,cards} from '../src/cards.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=name=>JSON.parse(fs.readFileSync(new URL('../data/'+name+'.json',import.meta.url),'utf8'));
const write=(name,value)=>fs.writeFileSync(new URL('../data/'+name+'.json',import.meta.url),JSON.stringify(value,null,2)+'\n');
const baseline=read('final-101-baseline');
if(baseline.count!==101||baseline.cards.length!==101)throw Error('The immutable baseline must contain exactly 101 cards');
install(read('official-cards'));
const testFiles=fs.readdirSync(new URL('../tests/',import.meta.url)).filter(f=>f.endsWith('.test.js')).sort();
const isolatedArg=process.argv.indexOf('--validated-run');
let run,isolated,tapFile='data/final-101-test-results.tap';
if(isolatedArg!==-1){
 const validationPath=path.resolve(process.argv[isolatedArg+1]||'');
 isolated=JSON.parse(fs.readFileSync(validationPath,'utf8'));
 const manifest=JSON.parse(fs.readFileSync(path.join(path.dirname(validationPath),'running.json'),'utf8'));
 const expectedFiles=testFiles.map(f=>'tests/'+f),fingerprint=testSourceFingerprint(root,expectedFiles);
 if(isolated.exitCode!==0||!isolated.sourceUnchanged||isolated.sourceBefore!==fingerprint||isolated.sourceAfter!==fingerprint||isolated.tests<=0||isolated.failed!==0||isolated.cancelled!==0||JSON.stringify(manifest.tests)!==JSON.stringify(expectedFiles))throw Error('Isolated full test result does not validate the current complete test/source set');
 run={status:isolated.exitCode,stdout:fs.readFileSync(isolated.resultFile,'utf8'),stderr:fs.readFileSync(isolated.stderrFile,'utf8')};
 tapFile='data/all-cards-audit/logs/full-'+path.basename(path.dirname(validationPath))+'.tap';
}else run=spawnSync(process.execPath,['--test','--test-reporter=tap',...testFiles.map(f=>'tests/'+f)],{cwd:root,encoding:'utf8',maxBuffer:10*1024*1024});
if(run.error)throw run.error;
const tapOutput=new URL('../'+tapFile,import.meta.url);
if(isolated&&fs.existsSync(tapOutput)){if(fs.readFileSync(tapOutput,'utf8')!==run.stdout+run.stderr)throw Error('Refusing to overwrite a different isolated TAP');}else fs.writeFileSync(tapOutput,run.stdout+run.stderr,isolated?{flag:'wx'}:{});
const tap=run.stdout,number=label=>Number(tap.match(new RegExp('^# '+label+' (\\d+)','m'))?.[1]||0);
const checkedAt=isolated?.checkedAt||new Date().toISOString();
const validation={checkedAt,command:'node --test --test-reporter=tap tests/*.test.js',exitCode:run.status,tests:number('tests'),passed:number('pass'),failed:number('fail'),skipped:number('skipped'),resultFile:tapFile,...(isolated?{sourceBefore:isolated.sourceBefore,sourceAfter:isolated.sourceAfter,sourceUnchanged:true,isolatedResult:process.argv[isolatedArg+1]}:{})};
if(isolated&&['tests','passed','failed','skipped'].some(key=>validation[key]!==isolated[key]))throw Error('Isolated TAP counts do not match its actual validation');
write('final-101-validation',validation);
if(run.status!==0)throw Error('Tests failed; progress/README statistics were not updated. See '+validation.resultFile);
const groups=[
 {key:'types',slugs:'corruptor persecutor'},
 {key:'geometry',slugs:'the_rack aethermoeba megamoeba yog_sothoth magellan_globe felbog_frog_men cerberus_in_chains edge_of_the_world the_void putrid_presence'},
 {key:'effects',slugs:'demonic_contract dhol_chants corpse_explosion led_astray joust earthquake chaos_twister'},
 {key:'malleus',slugs:'the_malleus_maleficarum',implementation:'src/final-malleus.js',testFile:'tests/final-malleus.test.js',details:'docs/final-malleus.md'},
 {key:'key',slugs:'key_to_the_city',implementation:'src/final-ability-layers.js',testFile:'tests/final-key.test.js',details:'docs/final-artifacts.md'},
 {key:'artifacts',slugs:'cage_of_sidrak corpse_catapult tabula_rasa the_pallid_bust tombstone_wardens key_to_the_city koscheis_egg doomsday_device'},
 {key:'factory',slugs:'infusion_factory'},
 {key:'animation',slugs:'enchantress'},
 {key:'orb',slugs:'orb_of_baal_berith'},
 {key:'cemetery-access',slugs:'bureau_of_occult_control mismanaged_mortuary wormelow_tump'},
 {key:'site-damage',slugs:'mortal_soil city_of_souls'},
 {key:'control',slugs:'courtesan_thais'},
 {key:'altar',slugs:'altar_of_malachai'},
 {key:'damage',slugs:'royal_bodyguard sir_gawain'},
 {key:'reactions',slugs:'dodge_roll valor'},
 {key:'built-sites',slugs:'the_base_of_babel the_apex_of_babel free_city vindictive_nation rift_valley'},
 {key:'chaos',slugs:'chaoswish'},
 {key:'passives',slugs:'red_rock_of_ravannis the_immortal_throne royal_bodyguard sir_gawain saint_of_redemption order_of_the_white_wing book_of_blessings blasted_oak bureau_of_occult_control mismanaged_mortuary wormelow_tump mortal_soil'},
 {key:'units',slugs:'gnarled_wendigo i_am_colossus karkemish_chimera captain_baldassare sea_raider crave_golem dame_britomart giant_shark monastery_gargoyle grosse_poltergeist jack_the_ripper mimic tringh_constrictor the_inquisition stitched_abomination kairos_the_archivist grigori_rasputin'},
 {key:'ability-sources',slugs:'dragonlord imposter'},
 {key:'avatars',slugs:'corruptor avatar_of_water persecutor realm_eater avatar_of_fire deathspeaker archimago animist pathfinder magician dragonlord imposter enchantress mephistopheles'},
 {key:'grids',slugs:'mester_stoor_worm hellstar day_of_judgment burning_hands firebreathing flame_strike flame_wave lava_flow holy_nova wreathed_in_righteousness meteor_shower'},
 {key:'waves',slugs:'snowball wave_of_eviction'},
 {key:'sites',slugs:'orpheus_crossing mount_ussar_sanctuary darkest_dungeon mudslide'},
];
groups.unshift({key:'pallid',slugs:'the_pallid_bust',implementation:'src/final-artifacts.js',testFile:'tests/gained-unmodifiable.test.js',details:'docs/final-pallid-progress.md'},{key:'vivien',slugs:'vivien_the_enchantress',implementation:'src/final-vivien.js',testFile:'tests/final-vivien.test.js',details:'docs/final-vivien-readiness.md'},{key:'flood',slugs:'the_flood',implementation:'src/final-flood.js',testFile:'tests/final-flood.test.js',details:'docs/final-flood.md'},{key:'oak',slugs:'blasted_oak',implementation:'src/final-passives.js',testFile:'tests/final-passives.test.js',details:'docs/final-oak.md'},{key:'holy',slugs:'holy_nova',implementation:'src/final-grids.js',testFile:'tests/final-holy-locations.test.js',details:'docs/final-rules-open-questions.md'});
const aliases={book_of_blessings:'Book',vivien_the_enchantress:'Vivien',the_pallid_bust:'Pallid',the_flood:'Flood',blasted_oak:'Oak',kairos_the_archivist:'Kairos',cage_of_sidrak:'Cage',corpse_catapult:'Catapult',tabula_rasa:'Tabula',tombstone_wardens:'Tombstone',koscheis_egg:'Egg',doomsday_device:'Doomsday',avatar_of_water:'Avatar of Water',realm_eater:'Realm-Eater',saint_of_redemption:'Saint',order_of_the_white_wing:'Order',monastery_gargoyle:'Gargoyle',tringh_constrictor:'Constrictor',felbog_frog_men:'Felbog',cerberus_in_chains:'Cerberus',jack_the_ripper:'Jack',joust:'Joust'};
Object.assign(aliases,{the_malleus_maleficarum:'Malleus',key_to_the_city:'Key',the_rack:'Rack',grosse_poltergeist:'Grosse',grigori_rasputin:'Rasputin',infusion_factory:'Factory',altar_of_malachai:'Altar',stitched_abomination:'Stitched',courtesan_thais:'Thaïs',orb_of_baal_berith:'Orb',the_inquisition:'Inquisition',bureau_of_occult_control:'Bureau',mismanaged_mortuary:'Mortuary',wormelow_tump:'Worm',gnarled_wendigo:'Wendigo',i_am_colossus:'Colossus',karkemish_chimera:'Chimera',mephistopheles:'Mephisto',the_base_of_babel:'Babel',the_apex_of_babel:'Babel',free_city:'City',rift_valley:'Rift',vindictive_nation:'Vindictive',dodge_roll:'Dodge',captain_baldassare:'Captain',red_rock_of_ravannis:'RedRock',the_immortal_throne:'Throne',dame_britomart:'Dame',giant_shark:'Shark',crave_golem:'Crave',darkest_dungeon:'Dungeon',mount_ussar_sanctuary:'Sanctuary',orpheus_crossing:'Orpheus',wreathed_in_righteousness:'Wreathed'});
const partialReasons={
 aethermoeba:'多位置與多區域尚未整合',megamoeba:'多位置佔格尚未整合',yog_sothoth:'所有區域與地點免疫尚未整合',magellan_globe:'核心距離/跨界移動已驗；仍有兩項未核裁定，詳見final-geometry文件',edge_of_the_world:'全域位置不變量尚未整合',the_void:'同時Site與void尚未整合',putrid_presence:'地下地點攻擊尚未整合',
 demonic_contract:'45項核心分類流程已驗；真引擎與共用選擇UI的合成分類／取消／確認／搜尋流程已在瀏覽器操作，仍需真人實體分類及完整牌桌驗證',royal_bodyguard:'可暫停傷害替代未整合',sir_gawain:'傷害替代與混合傷害死亡抽牌未整合',book_of_blessings:'Magic選擇集合及Recall/Flood有實驗測試；single範圍及Symmetric Suffering的Ward時點仍待裁定，Book未接正式施放，不能把候選解讀當官方規則',blasted_oak:'多目標與追加費用指定優先未整合',bureau_of_occult_control:'全引擎區域存取成本未整合',mismanaged_mortuary:'全引擎墓地實體與視角交換未整合',wormelow_tump:'全墓地影響入口保護未整合',mortal_soil:'可暫停地點傷害替代未整合',corruptor:'全區域contextual types未整合',persecutor:'己方視角Evil待遇未全入口整合',
 snowball:'大型單位與Talus攜帶依官方通則推導已驗；Globe全同region閉環的停止條件仍未核，不任意20步傷害',chaos_twister:'需要真人用實體代用牌吹落並回報結果；不是全自動規則',holy_nova:'地點Ward位於subsurface時替代中心的特定裁定尚待核實',the_immortal_throne:'雙方同一事件同時達勝利條件的裁定未核實，明確阻擋而不任意判勝',
};
for(const completed of ['holy_nova','blasted_oak','putrid_presence','edge_of_the_world','royal_bodyguard','sir_gawain','chaos_twister','demonic_contract','magellan_globe','snowball','the_immortal_throne'])delete partialReasons[completed];
delete partialReasons.book_of_blessings; delete partialReasons.chaoswish;
const priorLedger=read('final-101-progress');
const confirmedCore=new Set(priorLedger.cards.filter(c=>c.status==='completed-core-effect-tested').map(c=>c.slug));
// Scoped acceptance: digital Twister is an explicit user variant; Contract is
// an implemented human-confirmed classification flow, not auto classification.
for(const slug of ['chaos_twister','demonic_contract','magellan_globe','snowball','the_immortal_throne'])confirmedCore.add(slug);
confirmedCore.add('book_of_blessings'); confirmedCore.add('chaoswish');
for(const slug of 'the_pallid_bust vivien_the_enchantress the_flood holy_nova blasted_oak kairos_the_archivist putrid_presence edge_of_the_world royal_bodyguard sir_gawain magician pathfinder archimago mephistopheles gnarled_wendigo i_am_colossus karkemish_chimera the_base_of_babel the_apex_of_babel free_city vindictive_nation rift_valley enchantress the_inquisition dragonlord imposter the_malleus_maleficarum key_to_the_city aethermoeba megamoeba the_rack grosse_poltergeist grigori_rasputin infusion_factory yog_sothoth corruptor persecutor the_void altar_of_malachai stitched_abomination city_of_souls mortal_soil courtesan_thais dodge_roll valor orb_of_baal_berith bureau_of_occult_control mismanaged_mortuary wormelow_tump'.split(' '))confirmedCore.add(slug);
for(const slug of ['aethermoeba','megamoeba','yog_sothoth','corruptor','persecutor','the_void','mortal_soil','bureau_of_occult_control','mismanaged_mortuary','wormelow_tump'])delete partialReasons[slug];
const supplementalEvidence={
 book_of_blessings:['src/magic-context.js','tests/book-final-acceptance.test.js','tests/book-suffering-complete.test.js','tests/book-final-memory.test.js','docs/BOOK_FINAL_ACCEPTANCE.md','data/all-cards-audit/logs/book-real-duel-ui.json','data/all-cards-audit/logs/book-suffering-ui.json'],
 chaoswish:['tests/book-chaos-final.test.js','data/all-cards-audit/logs/book-chaoswish-ui.json','docs/BOOK_CHAOS_FINAL.md'],
 magellan_globe:['tests/final-five-globe.test.js','tests/final-seven-globe.test.js','docs/FINAL_FIVE_GLOBE.md','data/ui5500-globe-retained-after.json'],
 snowball:['tests/final-five-snowball.test.js','docs/FINAL_FIVE_SNOWBALL.md','data/ui5500-snowball-loop-after.json'],
 the_immortal_throne:['tests/final-five-throne-book.test.js','docs/FINAL_FIVE_THRONE_BOOK.md','data/ui5500-dual-throne-active0.json','data/ui5500-dual-throne-active1.json'],
 chaos_twister:['tests/final-seven-twister-digital.test.js','tests/final-seven-sync.test.js','docs/FINAL_SEVEN_TWISTER_DIGITAL.md','data/ui5500-twister-digital-resolved.json'],
 demonic_contract:['tests/final-seven-sync.test.js','docs/FINAL_SEVEN_SYNC.md','data/ui5500-contract-resolved.json'],
 the_pallid_bust:['tests/final-artifacts.test.js','tests/ability-sources.test.js','tests/final-ability-layers.test.js','tests/borrowed-spatial.test.js','tests/final-borrowed-combat.test.js','tests/final-all-types.test.js','tests/final-gained-global.test.js','tests/gained-unmodifiable.test.js','tests/modification-layers.test.js','tests/final-units.test.js','docs/final-pallid-passive-index.json','docs/final-pallid-spatial-audit.md'],
 vivien_the_enchantress:['tests/ability-sources.test.js','tests/runtime-hydration.test.js','tests/caster-permissions.test.js','tests/final-units.test.js','tests/final-malleus.test.js','tests/final-geometry.test.js','docs/final-vivien-readiness.md'],
 grigori_rasputin:['tests/ability-sources.test.js','tests/runtime-hydration.test.js','tests/final-vivien.test.js','tests/gained-unmodifiable.test.js']
};
const records=baseline.cards.map(original=>{
 const c=cards.find(c=>c.slug===original.slug);if(!c)throw Error('Missing baseline card '+original.slug);
 const group=groups.find(g=>g.slugs.split(' ').includes(c.slug));
 const module=group?.implementation||(group?(group.key==='ability-sources'?'src/ability-sources.js':group.key==='cemetery-access'?'src/cemetery-access.js':'src/final-'+group.key+'.js'):null),tests=group?.testFile||(group?(group.key==='ability-sources'?'tests/ability-sources.test.js':group.key==='cemetery-access'?'tests/cemetery-access.test.js':'tests/final-'+group.key+'.test.js'):null),doc=group?.details||(group?(group.key==='factory'?'docs/final-animation.md':group.key==='ability-sources'?'docs/final-avatars.md':group.key==='cemetery-access'?'docs/final-passives.md':'docs/final-'+group.key+'.md'):null);
 const exists=p=>!!p&&fs.existsSync(new URL('../'+p,import.meta.url));
 const testSource=exists(tests)?fs.readFileSync(new URL('../'+tests,import.meta.url),'utf8'):'';
 const terms=[aliases[c.slug]||c.name,c.slug],normalize=x=>x.toLowerCase().replace(/[^a-z0-9]/g,'');
 const testCases=[...testSource.matchAll(/test\(['"]([^'"\n]+)['"]/g)].map(m=>m[1]).filter(name=>terms.some(term=>normalize(name).includes(normalize(term))));
 if(c.playable&&confirmedCore.has(c.slug)&&!partialReasons[c.slug]&&!testCases.length)throw Error('Missing per-card effect-test evidence: '+c.slug);
 return {slug:c.slug,name:c.name,originalStatus:original.status,originalPlayable:original.playable,status:partialReasons[c.slug]?'partial':c.playable&&confirmedCore.has(c.slug)?'completed-core-effect-tested':c.playable?'partial':'not-started',playable:c.playable,fullyVerified:false,executionMode:c.slug==='chaos_twister'?'user-authorized-digital-rule-variant':c.slug==='demonic_contract'?'human-confirmed-classification':['magellan_globe','snowball','the_immortal_throne'].includes(c.slug)?'automatic-with-explicit-user-project-rulings':'automatic-rules-with-player-choices',implementation:exists(module)?module:null,testFile:exists(tests)?tests:null,testCases,supplementalEvidence:(supplementalEvidence[c.slug]||[]).filter(exists),details:exists(doc)?doc:null,remaining:(['magellan_globe','snowball','the_immortal_throne'].includes(c.slug)?'已按使用者明確專案裁定實作並驗證，非新增官方FAQ；規則版本user-rulings-20261030-v1，完整全卡交互驗收尚未完成。':c.slug==='chaos_twister'?'使用者批准20格隨機數位替代已驗收，非官方實體吹牌；完整全卡交互驗收尚未完成。':c.slug==='demonic_contract'?'人工輔助分類／取消／恢復／支付／搜尋與防重送軟體已驗收；分類事實由真人提供，不宣稱自動分類或完整全卡交互驗收。':partialReasons[c.slug])||(c.playable&&!confirmedCore.has(c.slug)?'新登錄尚待完整逐卡效果及共用整合驗收，不列完成；詳見組別文件。':c.playable?'完整官方規則及全卡交互驗收尚未完成；特定限制見details。':'尚未有可操作核心效果；逐張下一步見details。')};
});
const counts={baseline:101,completed:records.filter(c=>c.status==='completed-core-effect-tested').length,partial:records.filter(c=>c.status==='partial').length,notStarted:records.filter(c=>c.status==='not-started').length,coreImplemented:records.filter(c=>c.playable).length,notReleased:records.filter(c=>!c.playable).length,fullyVerified:0};
if(counts.completed+counts.partial+counts.notStarted!==101)throw Error('Completion categories must sum to 101');
write('final-101-progress',{checkedAt,baselineFile:'data/final-101-baseline.json',counts,validation,cards:records});
const progress=read('card-progress');
const browserValidationPath=new URL('../data/final-101-browser-validation.json',import.meta.url);
const browserValidation=fs.existsSync(browserValidationPath)?JSON.parse(fs.readFileSync(browserValidationPath,'utf8')):null;
progress.playable=cards.filter(c=>c.playable).length;progress.runtimeTokens=cards.filter(c=>c.category==='Token'&&c.handler==='token').length;progress.notStarted=cards.filter(c=>c.status==='未開始').length;progress.partiallyImplemented=progress.playable+progress.runtimeTokens;progress.fullyImplemented=0;progress.checkedAt=checkedAt;
progress.notReleased=progress.notStarted;progress.final101Counts=counts;
progress.testResults={passed:validation.passed,failed:validation.failed,command:'npm test',scope:'目前完整工作目錄，含既有回歸、最終101張效果與未開放helper測試；helper數不等於已完成卡牌數',integrationMatches:read('smoke-game-results').matches,browserSmokePassed:browserValidation?.passed??null,browserSmokeFailed:browserValidation?.failed??null};
progress.cards=cards.map(c=>{const old=progress.cards.find(x=>x.slug===c.slug)||{};const r=records.find(r=>r.slug===c.slug);return {...old,id:c.id,slug:c.slug,name:c.name,status:c.status,playable:c.playable,handler:c.handler,...(r?{final101Status:r.status,effectTest:c.playable?'passed':'not-released',evidence:r.details}:{}),remaining:r?.remaining||old.remaining||'完整官方交互驗收尚未完成'};});write('card-progress',progress);
const plan=read('remaining-completion-plan');for(const r of records){const entry=plan.entries.find(e=>e.slug===r.slug);if(entry){entry.status=r.playable?'effect-tested':'pending';entry.final101Status=r.status;entry.evidence=r.details;}}
plan.remaining=plan.entries.filter(e=>e.status==='pending').length;plan.verifiedEffectCases=plan.entries.filter(e=>e.status==='effect-tested').length;plan.fullyVerified=0;plan.status='in-progress';plan.checkedAt=checkedAt;plan.note='最終101張逐張進度及剩餘限制見data/final-101-progress.json與docs/FINAL_101_PROGRESS.md；不可把已開放或helper測試當成完整官方驗收。';write('remaining-completion-plan',plan);
const lines=['# 最終 101 張卡牌持續實作進度','',`更新：${checkedAt}。**尚未完成全部101張。** 本輪已接入實際效果並通過測試 ${counts.coreImplemented} 張，${counts.notReleased} 張未開放；完整官方全交互驗收 0 張。`,'',`目前 ${progress.playable} 張可選、${progress.runtimeTokens} 種衍生物、${progress.notStarted} 筆未開始。完整 Node 測試 ${validation.passed}/${validation.tests} 通過；測試包含未開放 helper，不能以測試數推算完成張數。`,'','## 回復基準','','- 初始完整目錄備份：`/tmp/sorcery-play-baselines/sorcery-play-20261030T120940Z.tar.gz`','- SHA-256：`03cecc5116d7c716fb9767d574c06649dee605a8980890a1fc9950d9b79b15db`','- 不可變原始清單：`data/final-101-baseline.json`（101張，每張原始卡文、狀態及可選旗標）','- 此目錄沒有Git；未推送或部署，也未更動Firebase設定。','','## 下一步','','1. 依下面未開放清單與每組詳情補齊核心效果；每張必須包含施放成本、選擇、結算與真實dispatch測試。','2. 優先完成已有草稿的卡，核實其官方FAQ；沒有可靠規則證據就維持不可選。','3. 全部完成後執行完整Node測試、16配對對局與瀏覽器互動驗證；目前不能宣稱全卡規則完成。','','## 101 張逐張追蹤','','狀態「核心已接入」表示實際效果已進遊戲流程與效果測試，仍屬部分支援；「未開放」包含純helper及未實作。每組詳情有特定限制。','','| 卡牌 | 原始 | 本輪狀態 | 實作／測試／詳情 |','| --- | --- | --- | --- |',...records.map(r=>`| ${r.name} (${r.slug}) | 未開始 | ${r.playable?'核心已接入，未全交互驗收':'未開放'} | ${[r.implementation,r.testFile,r.details].filter(Boolean).map(p=>`[${p}](../${p})`).join(' · ')||'待實作'} |`),'','機器可讀完整證據：`data/final-101-progress.json`；真實測試輸出：`data/final-101-test-results.tap`。',''];
lines.splice(2,1,`更新：${checkedAt}。**尚未完成全部101張。** 完成核心效果＋逐卡效果測試 ${counts.completed} 張、部分實作 ${counts.partial} 張、尚未開始 ${counts.notStarted} 張，合計101。完整官方全卡交互驗收0張。`);
lines[4]=`目前 ${progress.playable} 張可選、${progress.runtimeTokens} 種衍生物、${progress.notStarted} 筆未開放（包括已有部分程式但不可選的卡，與上述「尚未開始」分類不同）。完整 Node 測試 ${validation.passed}/${validation.tests} 通過；包含未開放helper，不能以測試數推算完成張數。`;
const statusNote=lines.findIndex(x=>x.startsWith('狀態「核心已接入」'));
lines[statusNote]='完成＝卡面核心效果已接入真實流程且有效果測試，不代表所有官方全卡交互驗收。部分＝核心整合、必要裁定或自動執行仍缺；尚未開始＝未有可操作核心效果（可能已有研究）。Chaos Twister依使用者指定採20格隨機數位替代，非官方實體吹牌；Demonic Contract為人工確認分類的已實作流程，不宣稱自動分類。瀏覽器與預組對局不取代逐卡效果測試。';
for(let i=0;i<lines.length;i++){const r=records.find(r=>lines[i].startsWith('| '+r.name+' ('));if(r)lines[i]=`| ${r.name} (${r.slug}) | 未開始 | ${r.status==='completed-core-effect-tested'?'完成核心＋效果測試':r.status==='partial'?'部分實作':'尚未開始'}${r.playable?'（可選）':'（未開放）'} | ${[r.implementation,r.testFile,r.details].filter(Boolean).map(p=>`[${p}](../${p})`).join(' · ')||'待實作'} |`;}
fs.writeFileSync(new URL('../docs/FINAL_101_PROGRESS.md',import.meta.url),lines.join('\n'));
console.log(JSON.stringify({counts,validation,project:{playable:progress.playable,notStarted:progress.notStarted}},null,2));
