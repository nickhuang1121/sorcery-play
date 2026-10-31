import {firebaseConfig,FIREBASE_SDK_VERSION} from './firebase-config.js';
export const isGooglePlayer=user=>!!user&&!user.isAnonymous&&user.providerData?.some(p=>p.providerId==='google.com');
export function googleAuthMessage(error,locale='zh-Hant'){
 const messages={
  'auth/popup-closed-by-user':['已取消登入。','Sign-in cancelled.'],
  'auth/cancelled-popup-request':['請完成已開啟的 Google 登入視窗。','Complete the Google sign-in window already open.'],
  'auth/popup-blocked':['瀏覽器封鎖了登入視窗，請允許彈出視窗後重試。','Your browser blocked the sign-in window. Allow pop-ups and try again.'],
  'auth/unauthorized-domain':['目前網址尚未開放 Google 登入，請使用正式遊戲網址。','Google sign-in is not enabled for this address. Use the official game URL.'],
  'auth/operation-not-allowed':['Google 登入尚未啟用，請稍後再試。','Google sign-in is not enabled yet. Please try again later.'],
  'auth/configuration-not-found':['Google 登入尚未完成設定，請稍後再試。','Google sign-in setup is not complete yet. Please try again later.'],
  'auth/network-request-failed':['無法連接 Google 登入，請檢查網路後重試。','Unable to connect to Google sign-in. Check your connection and try again.'],
  'auth/user-disabled':['此帳號目前無法登入。','This account cannot sign in.'],
 };
 return messages[error?.code]?.[locale==='en'?1:0]||(locale==='en'?'Google sign-in failed. Please try again.':'Google 登入失敗，請再試一次。');
}
export function createGoogleAuthSession({auth,sdk}){
 const googleUser=()=>isGooglePlayer(auth.currentUser)?auth.currentUser:null;
 const ready=auth.authStateReady().then(googleUser);
 return {auth,ready,currentUser:googleUser,subscribe(fn){return sdk.onAuthStateChanged(auth,user=>fn(isGooglePlayer(user)?user:null));},signIn(){const provider=new sdk.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});return sdk.signInWithPopup(auth,provider).then(result=>{if(!isGooglePlayer(result.user))throw Error('Google sign-in required');return result.user;});},signOut:()=>sdk.signOut(auth)};
}
let shared;
export function getGoogleAuth(){return shared??=(async()=>{const [appSDK,sdk]=await Promise.all([import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app.js`),import(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-auth.js`)]);const name='sorcery-codex',app=appSDK.getApps().some(a=>a.name===name)?appSDK.getApp(name):appSDK.initializeApp(firebaseConfig,name);return createGoogleAuthSession({auth:sdk.getAuth(app),sdk});})().catch(error=>{shared=null;throw error;});}
