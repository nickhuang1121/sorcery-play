import {loadCards,card,officialBetaDecks} from './cards.js';
import {loadCardImages,cardImage} from './card-images.js';
import {loadCardTranslations,cardTitle,setLang} from './i18n.js';
import {initializeUILanguage,getUILanguage} from './ui-language.js';
import {homeLobbyHTML,modePickerHTML} from './community/home-lobby.js?v=20261101-independent-pages';
import {createHomeIdentity} from './community/home-identity.js';
import {createHomeRankings} from './community/home-rankings.js?v=20261101-independent-pages';
import {pageURL} from './page-routes.js';
const root=document.querySelector('#app'),T=(zh,en)=>getUILanguage()==='en'?en:zh,isModes=document.body.dataset.page==='modes';
const ranks=createHomeRankings({onCard:id=>{location.href=pageURL('library',{card:id});}}),identity=createHomeIdentity({locale:getUILanguage}),media=matchMedia('(max-width:640px)');let loaded=false,expanded=false;
function storedMatch(){try{const s=JSON.parse(localStorage.getItem('sorcery.match'));return s?.version===1&&s.players?.length===2?s:null;}catch{return null;}}
function bindModes(){const list=root.querySelector('.home-mode-list'),position=root.querySelector('[data-mode-position]'),rows=[...list.querySelectorAll('.home-mode-card')];let current=0;const reduce=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const scroll=(index,smooth=true)=>{current=Math.max(0,Math.min(rows.length-1,index));list.scrollTo({left:Math.max(0,rows[current].offsetLeft-(list.clientWidth-rows[current].offsetWidth)/2),behavior:smooth&&!reduce?'smooth':'instant'});position.textContent=(current+1)+' / '+rows.length;};
 list.addEventListener('scroll',()=>{const center=list.scrollLeft+list.clientWidth/2;current=rows.reduce((best,row,i)=>Math.abs(row.offsetLeft+row.offsetWidth/2-center)<Math.abs(rows[best].offsetLeft+rows[best].offsetWidth/2-center)?i:best,0);position.textContent=(current+1)+' / '+rows.length;},{passive:true});
 list.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();scroll(event.key==='Home'?0:event.key==='End'?2:current+(event.key==='ArrowRight'?1:-1));rows[current].focus({preventScroll:true});});
 root.querySelectorAll('[data-mode-scroll]').forEach(b=>b.onclick=()=>scroll(current+Number(b.dataset.modeScroll)));
 root.querySelectorAll('[data-home-mode]').forEach(b=>b.onclick=()=>{location.href=b.dataset.homeMode==='online'?pageURL('lobby'):pageURL('setup',{mode:b.dataset.homeMode});});scroll(0,false);
}
function render(){if(!loaded)return;setLang(getUILanguage()==='en'?'en':'zh');
 if(isModes){const d=officialBetaDecks();root.innerHTML=`<div class="mode-page"><header class="page-top"><a href="./index.html">← ${T('返回大廳','Back to lobby')}</a><button type="button" data-ui-settings-open>${T('設定','Settings')}</button></header>${modePickerHTML({text:T,modes:[{id:'online',title:T('線上對戰','ONLINE PLAY'),description:T('公開房間或邀請朋友。','Public rooms or invite a friend.'),image:cardImage(card(d[0].avatar))},{id:'ai',title:T('單人 VS 電腦','SOLO VS AI'),description:T('選擇牌組與難度，挑戰電腦。','Choose your deck and difficulty.'),image:cardImage(card(d[1].avatar))},{id:'local',title:T('單機雙人','LOCAL TWO-PLAYER'),description:T('在同一台裝置輪流操作。','Take turns on the same device.'),image:cardImage(card(d[2].avatar))}]})}</div>`;bindModes();return;}
 const av=card('sorcerer'),match=storedMatch();root.innerHTML=homeLobbyHTML({text:T,portrait:cardImage(av),featuredCard:cardImage(av),avatarName:cardTitle(av),resume:!!match,finished:match?.winner!==null,expanded:!media.matches||expanded});ranks.mount(root.querySelector('#home-rankings'));identity.mount(root.querySelector('.lobby-profile'));
 root.querySelector('#lobby-play').onclick=()=>location.href=pageURL('modes');root.querySelector('#lobby-tutorial').onclick=()=>location.href=pageURL('tutorial');root.querySelector('#lobby-resume')?.addEventListener('click',()=>location.href=pageURL('play'));
 root.querySelectorAll('[data-home-destination]').forEach(b=>b.onclick=()=>location.href=pageURL(b.dataset.homeDestination));const drawer=root.querySelector('.lobby-rank-drawer');drawer.ontoggle=()=>{if(media.matches)expanded=drawer.open;};drawer.onkeydown=e=>{if(e.key==='Escape'&&media.matches&&drawer.open){drawer.open=false;drawer.querySelector('summary').focus();}};
}
media.addEventListener('change',()=>{const d=root.querySelector('.lobby-rank-drawer');if(d)d.open=!media.matches;});window.addEventListener('sorcery:languagechange',render);window.addEventListener('pagehide',()=>{ranks.close();identity.close();});window.addEventListener('pageshow',e=>{if(e.persisted)render();});
try{await Promise.all([loadCards(),loadCardImages(),loadCardTranslations()]);initializeUILanguage();loaded=true;render();}catch(error){root.textContent=T('無法載入首頁，請檢查連線後重新整理。','Unable to load the page. Check your connection and refresh.');console.error(error);}
