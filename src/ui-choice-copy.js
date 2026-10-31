// Translate display strings only; option values and the engine choice stay intact.
export function localizeChoice(choice,cards,titleForCard){
 const names=new Map(cards.map(c=>[c.name,titleForCard(c)]).filter(([name,title])=>name&&title&&name!==title));
 if(!names.size)return choice;
 const pattern=[...names.keys()].sort((a,b)=>b.length-a.length).map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
 const references=new RegExp(`(^|[^A-Za-z0-9])(${pattern})(?=$|[^A-Za-z0-9])`,'g');
 const translate=text=>String(text??'').replace(references,(_,before,name)=>before+names.get(name));
 return {...choice,title:translate(choice.title),options:choice.options.map(o=>({...o,label:translate(o.label)}))};
}
