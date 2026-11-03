import {translateUI,registerUICardTranslations} from './ui-copy.js';
import {connectPopup} from './popup.js?v=20261103-draggable';
export const UI_LANGUAGE_KEY='sorcery.uiLanguage';
export function normalizeLanguagePreference(value){return ['zh','zh-TW','zh-Hant'].includes(value)?'zh-Hant':value==='en'?'en':'auto';}
export function resolveUILanguage(preference,languages=[]){
 const explicit=normalizeLanguagePreference(preference);if(explicit!=='auto')return explicit;
 for(const value of languages){const language=String(value).toLowerCase();if(/^zh(?:-|$)/.test(language))return 'zh-Hant';if(/^en(?:-|$)/.test(language))return 'en';}
 return 'en';
}
let initialized=false,preference='auto',locale='en',observer,queued=false,languagePopup,settingsMenu;
const textSources=new WeakMap(),attributeSources=new WeakMap();
const devices=()=>navigator.languages?.length?navigator.languages:[navigator.language||'en'];
export const getUILanguage=()=>locale;
export const getUILanguagePreference=()=>preference;
const skip=element=>element?.closest('script,style,textarea,input,code,.card-caption,[data-i18n-preserve]');
export function localizeInterface(root=document.documentElement){
 if(!root)return;
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
  if(skip(node.parentElement))continue;
  let source=textSources.get(node);if(!source||node.nodeValue!==source.rendered)source={raw:node.nodeValue};
  const option=node.parentElement;if(option.tagName==='OPTION'&&!option.hasAttribute('value'))option.setAttribute('value',option.value);
  const rendered=translateUI(source.raw,locale);if(node.nodeValue!==rendered)node.nodeValue=rendered;textSources.set(node,{raw:source.raw,rendered});
 }
 for(const element of [root,...root.querySelectorAll('[aria-label],[title],[placeholder],[alt],optgroup[label]')]){
  if(skip(element)&&element.tagName!=='INPUT'&&element.tagName!=='TEXTAREA')continue;
  let sources=attributeSources.get(element);if(!sources){sources=new Map();attributeSources.set(element,sources);}
  for(const key of ['aria-label','title','placeholder','alt','label'])if(element.hasAttribute(key)){
   const value=element.getAttribute(key);let source=sources.get(key);if(!source||value!==source.rendered)source={raw:value};
   const rendered=translateUI(source.raw,locale);if(value!==rendered)element.setAttribute(key,rendered);sources.set(key,{raw:source.raw,rendered});
  }
 }
}
function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;observer?.disconnect();localizeInterface();observer?.observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','alt','label']});});}
function apply(){
 locale=resolveUILanguage(preference,devices());document.documentElement.lang=locale;
 window.dispatchEvent(new CustomEvent('sorcery:languagechange',{detail:{locale,preference}}));
 if(languagePopup?.dialog.open)updateLanguagePopup();schedule();
}
export function setUILanguagePreference(value){preference=normalizeLanguagePreference(value);try{localStorage.setItem(UI_LANGUAGE_KEY,JSON.stringify(preference));}catch{}apply();}
export function initializeUILanguage(){
 if(initialized)return;initialized=true;
 try{preference=normalizeLanguagePreference(JSON.parse(localStorage.getItem(UI_LANGUAGE_KEY)||'"auto"'));}catch{preference='auto';}
 observer=new MutationObserver(schedule);
 document.addEventListener('click',event=>{if(event.target.closest('[data-ui-settings-open]'))openUISettingsMenu();else if(event.target.closest('[data-ui-language-open]'))openUILanguageDialog();});
 window.addEventListener('languagechange',()=>{if(preference==='auto')apply();});
 window.addEventListener('storage',event=>{if(event.key===UI_LANGUAGE_KEY){try{preference=normalizeLanguagePreference(JSON.parse(event.newValue||'"auto"'));}catch{preference='auto';}apply();}});
 apply();
 fetch(new URL('../language/cards-trans-zh.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Card translation unavailable');return r.json();}).then(data=>{registerUICardTranslations(data);schedule();}).catch(error=>console.warn(error));
}
function updateLanguagePopup(){
 const focused=document.activeElement?.dataset.languageChoice;
 const body=languagePopup.body;body.innerHTML='<div class="eyebrow">Language / 語言</div><h2 id="language-popup-title">介面語言</h2><p>自動選擇繁體中文或英文；手動設定會保留在此裝置。</p><div class="modal-actions" id="language-options"></div>';
 const options=[['auto','跟隨裝置'],['zh-Hant','繁體中文'],['en','English']];
 for(const [value,label] of options){const button=document.createElement('button');button.type='button';button.dataset.languageChoice=value;button.textContent=label;button.setAttribute('aria-pressed',String(preference===value));if(preference===value)button.classList.add('primary');button.onclick=()=>setUILanguagePreference(value);body.querySelector('#language-options').append(button);}
 const note=document.createElement('p');note.className='popup-hint';note.textContent=`目前語言：${locale==='en'?'English':'繁體中文'}`;body.append(note);localizeInterface(languagePopup.dialog);
 if(focused)body.querySelector(`[data-language-choice="${focused}"]`)?.focus({preventScroll:true});
}
export function openUILanguageDialog(){
 initializeUILanguage();
 if(!languagePopup){const dialog=document.createElement('dialog');dialog.id='language-popup';dialog.className='popup';dialog.innerHTML='<button type="button" class="close" aria-label="關閉">×</button><div class="popup-body"></div><div class="popup-footer"><button type="button">關閉</button></div>';document.body.append(dialog);languagePopup={dialog,body:dialog.querySelector('.popup-body'),popup:connectPopup(dialog,{closeButton:dialog.querySelector('.close'),footerButton:dialog.querySelector('.popup-footer button')})};}
 updateLanguagePopup();languagePopup.popup.open();
}

// Language preferences are reached from a menu, never from game-choice footers.
export function openUISettingsMenu(){
 initializeUILanguage();
 if(!settingsMenu){
  const dialog=document.createElement('dialog');dialog.id='settings-menu';dialog.className='popup';
  dialog.innerHTML='<button type="button" class="close" aria-label="關閉">×</button><div class="popup-body"><h2>選單</h2><div class="modal-actions"><button type="button" data-ui-language-open aria-haspopup="dialog">介面語言 / Language</button></div></div><div class="popup-footer"><button type="button">關閉</button></div>';
  document.body.append(dialog);settingsMenu={dialog,popup:connectPopup(dialog,{closeButton:dialog.querySelector('.close'),footerButton:dialog.querySelector('.popup-footer button')})};
 }
 localizeInterface(settingsMenu.dialog);settingsMenu.popup.open();
}
