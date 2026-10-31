import { FIREBASE_SDK_VERSION } from './firebase-config.js';
import {isGooglePlayer} from './firebase-auth.js';

/**
 * Realtime Database transport — same surface as memory: get / set / update / subscribe.
 * Uses Firebase JS SDK via CDN (no bundler). Not wired into app.js yet.
 *
 * @param {object} config firebaseConfig including databaseURL
 * @returns {Promise<object>}
 */
export async function createFirebaseTransport(config) {
  if (!config?.apiKey || !config?.databaseURL) {
    throw Error('缺少 firebaseConfig（需要 apiKey 與 databaseURL）');
  }
  const v = config.sdkVersion || FIREBASE_SDK_VERSION;
  const [{ initializeApp, getApp, getApps }, dbMod] = await Promise.all([
    import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
    import(`https://www.gstatic.com/firebasejs/${v}/firebase-database.js`),
  ]);
  const { getDatabase, ref, get, set, update, onValue, onDisconnect, runTransaction,serverTimestamp } = dbMod;

  const appName = config.appName || 'sorcery-codex';
  const app = getApps().some((a) => a.name === appName)
    ? getApp(appName)
    : initializeApp(config, appName);
  const db = getDatabase(app);

  let authUser = null;
  let clockOffset=0,connected=false;
  onValue(ref(db,'.info/serverTimeOffset'),snap=>{clockOffset=Number(snap.val())||0;});
  onValue(ref(db,'.info/connected'),snap=>{connected=snap.val()===true;});
  async function transact(path,updater){const result=await runTransaction(ref(db,path),current=>updater(current??null),{applyLocally:false});return {committed:result.committed,value:result.snapshot.exists()?result.snapshot.val():null};}

  async function ensureAuth() {
    if (config.skipAuth) return null;
    try {
      const v = config.sdkVersion || FIREBASE_SDK_VERSION;
      const { getAuth } = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`);
      const auth = getAuth(app);
      await auth.authStateReady();
      authUser = isGooglePlayer(auth.currentUser)?auth.currentUser:null;
      return authUser;
    } catch (err) {
      console.warn('Firebase Google Auth unavailable', err?.code||'unknown');
      return null;
    }
  }

  return {
    kind: 'firebase',
    app,
    db,
    ensureAuth,
    currentUser: () => authUser,
    serverNow:()=>Date.now()+clockOffset,
    serverTimestamp,
    isConnected:()=>connected,
    transact,
    async registerDisconnect(path,value){const handle=onDisconnect(ref(db,path));await handle.set(value);return ()=>handle.cancel();},
    async get(path) {
      const snap = await get(ref(db, path));
      return snap.exists() ? snap.val() : null;
    },
    async set(path, value) {
      await set(ref(db, path), value);
    },
    async update(path, patch) {
      await update(ref(db, path), patch);
      return { ...(await get(ref(db, path))).val() };
    },
    subscribe(path, fn) {
      const r = ref(db, path);
      return onValue(r, (snap) => {
        fn(snap.exists() ? snap.val() : null);
      }, (err) => {
        console.error('Firebase subscribe error', path, err);
        fn(null);
      });
    },
    /** When the client disconnects from Firebase, write `value` at path. */
    onDisconnect(path, value) {
      const handle = onDisconnect(ref(db, path));
      handle.set(value).catch((err) => console.error('onDisconnect set failed', path, err));
      return () => { handle.cancel().catch(() => {}); };
    },
    async flushDisconnect() {
      /* Firebase server handles disconnect; no local flush needed. */
    },
    async list(path) {
      const snap = await get(ref(db, path));
      if (!snap.exists()) return [];
      const keys = [];
      snap.forEach((child) => { keys.push(child.key); });
      return keys;
    },
    async remove(path) {
      await set(ref(db, path), null);
    },
    async transaction(path, updater) {
      return (await transact(path,updater)).value;
    },
  };
}

/** Auth-backed player id (anonymous or otherwise). */
export function firebasePlayerIdFromUser(user) {
  if (!user?.uid) throw Error('需要已登入的 Firebase user');
  return user.uid;
}

/** Legacy name: returns an existing Google player's UID; never signs in anonymously. */
export async function ensureAnonymousPlayerId(transport) {
  if (!transport?.ensureAuth) return null;
  const user = await transport.ensureAuth();
  return user ? firebasePlayerIdFromUser(user) : null;
}
