// Experimental entry label only. The production app owns the scene and pile controls.
import {getUILanguage} from '../../src/ui-language.js';
const banner=document.createElement('a');banner.className='forest-return';banner.href='./index.html';banner.dataset.i18nPreserve='';document.body.append(banner);
function labels(){banner.textContent=getUILanguage()==='en'?'Scene preview ↗':'場景展示 ↗';}
window.addEventListener('sorcery:languagechange',labels);labels();
