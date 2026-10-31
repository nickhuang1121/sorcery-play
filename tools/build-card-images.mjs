import fs from 'node:fs';
const root=new URL('../',import.meta.url),files=new Set(fs.readdirSync(new URL('card-images/',root))),raw=JSON.parse(fs.readFileSync(new URL('data/official-cards.json',root)));
const index={};for(const c of raw){const choices=c.printings.filter(p=>files.has(p.slug+'.webp'));const p=choices.find(p=>p.meta?.finish==='Standard')||choices[0];index[c.slug]=p?{front:p.slug+'.webp',back:files.has(p.slug+'-r.webp')?p.slug+'-r.webp':null}:null;}
fs.writeFileSync(new URL('data/card-image-index.json',root),JSON.stringify(index,null,2)+'\n');console.log({mapped:Object.values(index).filter(Boolean).length,missing:Object.entries(index).filter(([,v])=>!v).map(([k])=>k)});

// Keep upload selection synchronized whenever the runtime image index changes.
await import('./update-upload-excludes.mjs');
