// Shared presentation and dismissal. Closing a popup never submits a game action.
export function connectPopup(dialog,{onDismiss=()=>{},closeButton,footerButton}={}){
 let opener=null;
 function close({restoreFocus=true}={}){if(dialog.open)dialog.close();if(restoreFocus&&opener?.isConnected)opener.focus({preventScroll:true});}
 function dismiss(){close();onDismiss();}
 closeButton?.addEventListener('click',dismiss);
 footerButton?.addEventListener('click',dismiss);
 dialog.addEventListener('cancel',event=>{event.preventDefault();dismiss();});
 let outsideDown=false;
 const outside=event=>{const r=dialog.getBoundingClientRect();return event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom);};
 dialog.addEventListener('pointerdown',event=>{outsideDown=outside(event);});
 dialog.addEventListener('click',event=>{if(outsideDown&&outside(event))dismiss();outsideDown=false;});
 return {close,dismiss,open(){
  if(!dialog.open)opener=document.activeElement;
  dialog.classList.add('popup');
  const title=dialog.querySelector('h2');
  if(title){title.classList.add('popup-title');title.id||=`${dialog.id}-title`;dialog.setAttribute('aria-labelledby',title.id);dialog.removeAttribute('aria-label');}
  else {dialog.removeAttribute('aria-labelledby');dialog.setAttribute('aria-label','資訊');}
  dialog.scrollTop=0;
  if(dialog.open&&!dialog.matches(':modal'))dialog.close();
  if(!dialog.open)dialog.showModal();
 }};
}

export function showNotice(message,{title='提示'}={}){
 const dialog=document.createElement('dialog');dialog.id='notice-popup';dialog.className='popup';
 const closeButton=document.createElement('button');closeButton.className='close';closeButton.type='button';closeButton.setAttribute('aria-label','關閉');closeButton.textContent='×';
 const body=document.createElement('div');body.className='popup-body';const heading=document.createElement('h2');heading.textContent=title;const text=document.createElement('p');text.textContent=message;body.append(heading,text);
 const footer=document.createElement('div');footer.className='popup-footer';const done=document.createElement('button');done.type='button';done.textContent='關閉';footer.append(done);dialog.append(closeButton,body,footer);document.body.append(dialog);
 const popup=connectPopup(dialog,{closeButton,footerButton:done,onDismiss:()=>dialog.remove()});popup.open();return popup;
}
