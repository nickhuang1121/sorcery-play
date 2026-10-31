"""Parse public Next.js data as JSON only. Never execute downloaded JavaScript.
Usage: python3 tools/extract-official-rules.py /tmp/sorcery-critical-strike-public.html
Full text stays in an internal /tmp cache; repository output is metadata only.
"""
import sys, re, json, hashlib, datetime
from pathlib import Path
html_path=Path(sys.argv[1]); html=html_path.read_text(); docs={}
def walk(value):
    if isinstance(value,dict):
        if value.get('_type') in ('codex','faq') and value.get('_id'): docs[value['_id']]=value
        for child in value.values(): walk(child)
    elif isinstance(value,list):
        for child in value: walk(child)
for match in re.finditer(r'self\.__next_f\.push\((\[.*?\])\)</script>',html,re.S):
    try: payload=json.loads(match.group(1))
    except json.JSONDecodeError: continue
    if len(payload)<2 or not isinstance(payload[1],str): continue
    for line in payload[1].splitlines():
        try: record=json.loads(line.split(':',1)[1])
        except (IndexError,json.JSONDecodeError): continue
        walk(record)
if not docs: raise RuntimeError('No official rules data parsed; leave prior metadata unchanged')
Path('/tmp/sorcery-official-embedded-docs.json').write_text(json.dumps(list(docs.values()),ensure_ascii=False))
Path('/tmp/sorcery-official-faqs-parsed.json').write_text(json.dumps([d for d in docs.values() if d['_type']=='faq'],ensure_ascii=False))
index={'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'publicSourceURL':'https://sorcerytcg.com/cards/critical_strike','sourceHTMLSHA256':hashlib.sha256(html_path.read_bytes()).hexdigest(),'method':'Public HTML embedded JSON, parsed without script execution; no login or private data','fullTextInternalCache':'/tmp/sorcery-official-embedded-docs.json','codexEntries':[],'faqs':[]}
for d in docs.values():
    record={'id':d['_id'],'revision':d.get('_rev'),'updatedAt':d.get('_updatedAt')}
    if d['_type']=='codex':
        record.update(title=d.get('title'),url='https://sorcerytcg.com/codex/'+d['_id'],subsections=[{'key':v.get('_key'),'title':v.get('title'),'url':'https://sorcerytcg.com/codex/'+d['_id']+'?sub='+v['_key']} for v in (d.get('subcodexes') or []) if v.get('_key')]);index['codexEntries'].append(record)
    else: record.update(cards=d.get('cards',[]));index['faqs'].append(record)
root=Path(__file__).resolve().parent.parent
metadata_path=root/'data/final-101-official-source-index.json'
if metadata_path.exists():
    previous=json.loads(metadata_path.read_text())
    if previous.get('rulebook'): index['rulebook']=previous['rulebook']
metadata_path.write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'codexEntries':len(index['codexEntries']),'faqRecords':len(index['faqs']),'metadata':'data/final-101-official-source-index.json'}))
