import {connectPopup} from './popup.js';
// A separate top-layer dialog preserves any pending game-choice/stack dialog.
export function createCardInfoPopup({getRevision,onStale}){
 const dialog=document.createElement('dialog');dialog.id='card-info';dialog.className='popup card-popup';dialog.setAttribute('aria-labelledby','card-info-title');
 dialog.innerHTML='<button type="button" class="close" id="close-card-info" aria-label="關閉卡牌詳情">×</button><div id="card-info-body" class="popup-body"></div><div class="popup-footer card-popup-actions"><button type="button" id="card-info-use" class="primary"></button><button type="button" id="card-info-close">關閉</button></div>';
 document.body.append(dialog);const body=dialog.querySelector('#card-info-body'),use=dialog.querySelector('#card-info-use');
 const popup=connectPopup(dialog,{closeButton:dialog.querySelector('#close-card-info'),footerButton:dialog.querySelector('#card-info-close'),onDismiss:()=>{use.onclick=null;}});
 function close(focus=true){popup.close({restoreFocus:focus});use.onclick=null;}
 return {close,isOpen:()=>dialog.open,show(html,{action,label='選擇行動',disabledReason}={}){
  close(false);const revision=getRevision();body.innerHTML=html;dialog.scrollTop=0;
  if(disabledReason){const hint=document.createElement('p');hint.className='popup-hint';hint.textContent=disabledReason;body.append(hint);}
  use.hidden=!action&&!disabledReason;use.disabled=!!disabledReason;use.textContent=disabledReason?'目前無法操作':label;use.onclick=action?e=>{if(getRevision()!==revision){close();onStale();return;}close();action(e);}:null;
  popup.open();
 }};
}
