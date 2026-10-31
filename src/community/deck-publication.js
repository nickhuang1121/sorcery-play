// Publication is an explicit owner choice. Importing another player's deck never grants consent.
export function publicationHTML(deck,text){return `<div class="deck-publication" data-i18n-preserve><label class="deck-publish-choice"><input id="deck-published" type="checkbox" ${deck.publishToRankings===true?'checked':''}><span>${text('公開牌表，參與牌組與卡牌排行榜','Publish decklist for deck and card rankings')}</span></label><p class="muted">${text('預設私人。公開需要 Google 登入並同步雲端；已連結雲端的牌組，取消勾選後儲存會同步取消公開。','Private by default. Publishing requires Google sign-in and cloud sync. Uncheck and save linked cloud decks to unpublish.')}</p></div>`;}
export function localDeckCopy(deck,{ownedId,owner,published=false}={}){
 const next=structuredClone(deck);delete next.localId;delete next.cloudId;delete next.cloudOwner;
 next.publishToRankings=ownedId&&owner?published===true:false;
 if(ownedId&&owner){next.cloudId=ownedId;next.cloudOwner=owner;}
 return next;
}
export async function prepareDeckSave({deck,getAuth,getService,newId=()=>crypto.randomUUID()}){
 deck.localId||=newId();const next=structuredClone(deck);next.publishToRankings=next.publishToRankings===true;
 if(next.publishToRankings||next.cloudId){
  const auth=await getAuth();await auth.ready;let user=auth.currentUser();if(!user)user=await auth.signIn();
  if(!user?.uid)throw Error('Google sign-in required');
  if(next.cloudOwner&&next.cloudOwner!==user.uid)throw Error('Use original deck owner');
  const id=next.cloudId||next.localId;
  await(await getService(user.uid)).mutate({type:'deck-save',id,deck:next,published:next.publishToRankings});
  next.cloudId=id;next.cloudOwner=user.uid;
 }
 return next;
}
export function mergeLocalDeck(saved,deck){
 const next=structuredClone(saved),index=next.findIndex(d=>deck.localId&&d.localId===deck.localId||deck.cloudId&&d.cloudId===deck.cloudId&&d.cloudOwner===deck.cloudOwner||!d.localId&&!d.cloudId&&d.name===deck.name);
 if(index<0)next.push(structuredClone(deck));else next[index]={...structuredClone(deck),...(next[index].localId&&!deck.localId?{localId:next[index].localId}:{})};return next;
}
