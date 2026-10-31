// Build only the experimental presentation entrypoints. The rules remain shared.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=new URL('../../',import.meta.url),here=new URL('./',import.meta.url);
const hash=s=>createHash('sha256').update(s).digest('hex');
export function scopePresentation(source){
 if(source.includes('import.meta.url'))throw Error('New module-relative asset URL requires review before generating this entry.');
 return source.replace(/(from\s*|import\s*)'(\.\/[^']+)'/g,(_,prefix,path)=>`${prefix}'../../src/${path.slice(2)}'`)
  .replace(/'sorcery\.(match|decks|effects|aiDifficulty|aiOmniscient)'/g,"'sorcery.tabletop.$1'")
  .replace(/store\.(get|set)\(TUTORIAL_KEY/g,"store.$1('sorcery.tabletop.tutorial.v1'")
  .replaceAll("location.href='./index.html'","location.href='./battle.html'");
}
export function battleHTML(source,{lobby=false}={}){
 let s=source.replaceAll('href="./index.html"','href="./battle.html"')
  .replace(/(href|src)="\.\/(styles|src|docs|tests)\//g,'$1="../../$2/')
  .replace(/src="\.\.\/\.\.\/src\/app\.js[^\"]*"/g,'src="./battle-app.js?v=20261031-forest-rules"')
  .replace(/src="\.\.\/\.\.\/src\/online-lobby\.js[^\"]*"/g,'src="./lobby-app.js?v=20261031-forest-rules"')
  .replace('<body class="','<body class="forest-runtime ')
  .replace('</head>','<link rel="stylesheet" href="./battle-skin.css?v=20261031-forest-rules"></head>')
  .replace('</body>','<script type="module" src="./battle-adapter.js?v=20261031-forest-rules"></script></body>');
 return s.replace(/<title>[^<]+<\/title>/,'<title data-i18n-preserve>Sorcery · 森境對戰'+(lobby?'大廳':'')+'</title>');
}
export async function syncBattle({check=false}={}){
 const sources={};for(const path of ['src/app.js','src/online-lobby.js','index.html','online-play.html','lobby.html'])sources[path]=await readFile(new URL(path,root),'utf8');
 let app=scopePresentation(sources['src/app.js']);
 const publicCounts='data-player="${p}"';if(app.split(publicCounts).length!==2)throw Error('Player HUD markup changed; review public pile counts.');
 app=app.replace(publicCounts,'data-player="${p}" data-atlas-count="${pl.atlas.length}" data-spell-count="${pl.spells.length}" data-grave-count="${pl.cemetery.length}"');
 const outputs={
  'battle-app.js':`// GENERATED from src/app.js; run node experiments/tabletop/sync-battle.mjs.\n// Shared engine and legal actions are unchanged. Local saves are scoped.\n${app}`,
  'lobby-app.js':`// GENERATED from src/online-lobby.js; shared Firebase modules and room protocol.\n${scopePresentation(sources['src/online-lobby.js'])}`,
  'battle.html':battleHTML(sources['index.html']),
  'online-play.html':battleHTML(sources['online-play.html']),
  'lobby.html':battleHTML(sources['lobby.html'],{lobby:true}),
  'runtime-manifest.json':JSON.stringify({description:'Generated UI entrypoints only; no copied rule engine. Existing production files are not modified.',sources:Object.fromEntries(Object.entries(sources).map(([p,s])=>[p,hash(s)])),storage:{match:'sorcery.tabletop.match',decks:'sorcery.tabletop.decks',tutorial:'sorcery.tabletop.tutorial.v1'},network:'Same Firebase Auth, room credentials, protocol and engine modules as production.'},null,2)+'\n'
 };
 for(const [path,content]of Object.entries(outputs)){if(check){if(await readFile(new URL(path,here),'utf8')!==content)throw Error('Experimental presentation is stale: '+path);}else await writeFile(new URL(path,here),content);}
 return outputs;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){await syncBattle({check:process.argv.includes('--check')});console.log(process.argv.includes('--check')?'Experimental presentation matches production sources.':'Generated experimental battle, online battle and lobby entrypoints.');}
