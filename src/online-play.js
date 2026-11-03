// Historical Firebase lockstep prototype, retained for regression fixtures only.
// Production online-play.html runs app.js + net/online-client.js and /api authority.
import {showNotice} from './popup.js?v=20261103-draggable';
import {finalDecisionController,dispatchFinalControlledEntry,finalControlledPlayer} from './final-control.js';
import {choiceAction,choiceToken} from './choice-context.js';
import { loadCards, card } from './cards.js';
import { newGame, dispatch, legalActions, observation } from './engine.js';
import {
  firebaseConfig,
  createFirebaseTransport,
  createRoomSession,
  createMatchSync,
  ensureAnonymousPlayerId,
  checksumState,
  ENGINE_BUILD,
  PROTOCOL_VERSION,
  sweepExpiredRooms,
  roomPaths,
  randomPlayerId,
} from './net/index.js';

const $ = (s) => document.querySelector(s);
const MATCH_KEY = 'sorcery.onlineMatch';

function acting(s) {
  if (s.choice) return s.choice.player;
  if (s.phase === 'mulligan') return s.mulligan;
  return s.pending?.player ?? s.active;
}

function deckFromWire(d) {
  return {
    name: d.name,
    avatar: d.avatar,
    atlas: [...(d.atlas || [])],
    spells: [...(d.spells || [])],
    ...(d.format ? { format: d.format } : {}),
  };
}

function pidKey(roomId, seat) {
  return `sorcery.onlinePid.${roomId}.${seat}`;
}

function stablePlayerId(roomId, seat, fallback) {
  const k = pidKey(roomId, seat);
  let id = localStorage.getItem(k);
  if (!id) {
    id = fallback || randomPlayerId();
    localStorage.setItem(k, id);
  }
  return id;
}

function saveHandoff(h) {
  localStorage.setItem(MATCH_KEY, JSON.stringify(h));
}

function readHandoff() {
  try { return JSON.parse(localStorage.getItem(MATCH_KEY) || 'null'); }
  catch { return null; }
}

function queryHandoff() {
  const q = new URLSearchParams(location.search);
  const roomId = (q.get('room') || '').toUpperCase();
  if (!roomId) return null;
  const seat = q.get('seat') === '1' ? 1 : 0;
  return { roomId, seat, fromQuery: true };
}

let rawLog='';
function logLine(msg) {
  const el = $('#log');
  if (!el) return;
  rawLog = `${msg}\n` + rawLog;
  el.textContent = rawLog;
}

function showBootError(msg) {
  const el = $('#boot-error');
  el.hidden = false;
  el.textContent = msg;
  $('#turn-hint').textContent = '無法啟動';
}

function setSyncBanner(desync) {
  const el = $('#sync-banner');
  el.hidden = false;
  if (desync) {
    el.className = 'banner err';
    el.textContent = '⚠ DESYNC：' + desync + ' — 請雙方硬重整或回大廳重開';
  } else {
    el.className = 'banner ok';
    el.textContent = 'sync ok · build ' + ENGINE_BUILD;
  }
}

function renderBoard(state) {
  const box = $('#board');
  box.innerHTML = '';
  for (let at = 0; at < 20; at++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    const site = state.board[at];
    const units = state.units.filter((u) => u.at === at);
    const arts = (state.artifacts || []).filter((o) => o.at === at && !o.bearer);
    let html = `<div class="at">#${at}</div>`;
    if (site) {
      try { html += `<div class="site">${card(site.card).name} · P${site.controller}</div>`; }
      catch { html += `<div class="site">${site.card}</div>`; }
    } else html += `<div class="site">∅</div>`;
    for (const u of units) {
      let name = u.card;
      try { name = card(u.card).name; } catch { /* */ }
      const flags = [u.tapped ? '橫' : '', u.damage ? `傷${u.damage}` : '', u.ward ? 'W' : '', u.stealth ? 'S' : '', u.layer === 'below' ? '下' : '']
        .filter(Boolean).join(' ');
      html += `<div class="u${u.controller}">${name} ${flags}</div>`;
    }
    for (const o of arts) {
      try { html += `<div>⚒ ${card(o.card).name}</div>`; }
      catch { html += `<div>⚒</div>`; }
    }
    cell.innerHTML = html;
    box.append(cell);
  }
}

function renderHands(state, seat) {
  const v=observation(state,seat),controlled=finalControlledPlayer(state,seat);
  const mine = v.players[seat];
  const opp = state.players[1 - seat];
  const myCards = (mine.hand || []).map((h) => {
    try { return card(h.card).name; } catch { return '?'; }
  });
  $('#hands').textContent = [
    `你（席${seat}）${mine.life} 命 · 手牌 ${myCards.length}`,
    myCards.length ? myCards.map((n, i) => `  ${i + 1}. ${n}`).join('\n') : '  （空手）',
    '',
    `對手（席${1 - seat}）${opp.life} 命 · 手牌 ${opp.hand?.length ?? 0} 張（內容隱藏）`,
    `墓地 你 ${mine.cemetery?.length ?? 0} / 對手 ${opp.cemetery?.length ?? 0}`,
    ...(controlled===null?[]:['Thaïs · 被控玩家所有牌（唯讀）','hand: '+v.players[controlled].hand.map(h=>card(h.card).name).join('、'),...['atlas','spells','collection'].map(zone=>zone+': '+v.players[controlled][zone].map(id=>card(id).name).join('、'))]),
  ].join('\n');
}

function render(state, seat, desync, peerOnline) {
  $('#meta').textContent = [
    `turn ${state.turn} · phase ${state.phase} · 行動席 ${acting(state)} · active ${state.active}`,
    `先手 ${state.firstPlayer} · winner ${state.winner ?? '—'} · cursor 已套用見 log`,
    `checksum ${checksumState(state)} · rng ${state.rng}`,
    `單位 ${state.units.length} · 地點 ${state.board.filter(Boolean).length}`,
    peerOnline == null ? '對手心跳：—' : (peerOnline ? '對手：在線' : '對手：離線'),
  ].join('\n');
  renderBoard(state);
  renderHands(state, seat);
  setSyncBanner(desync);
  $('#peer-hint').textContent = peerOnline == null ? '對手：—' : (peerOnline ? '對手：在線' : '對手：離線');

  const me = finalDecisionController(state,acting(state)) === seat && !desync;
  $('#turn-hint').textContent = state.winner !== null
    ? `對局結束 · 勝者席 ${state.winner}`
    : (me ? '輪到你：選擇合法動作' : `等待席 ${acting(state)}…`);
  const box = $('#actions');
  box.innerHTML = '';
  if (!me || state.winner !== null) return;
  const list = legalActions(state, acting(state)).filter((a) => a.type !== 'concede');
  for (const [i, a] of list.entries()) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = summarize(a, state);
    const submission=a.type==='choose'?{...a,...choiceAction(state,a.option)}:a;
    b.onclick = () => window.__submitAction?.(submission);
    box.append(b);
  }
}

function summarize(a, state) {
  if (a.type === 'mulligan') return `重抽 (${(a.cards || []).length})`;
  if (a.type === 'end') return '結束回合';
  if (a.type === 'pass') return '讓過';
  if (a.type === 'draw') return `抽 ${a.deck}`;
  if (a.type === 'site') {
    try {
      const id = state.players[a.player].hand.find((h) => h.uid === a.hand)?.card;
      return `放置 ${id ? card(id).name : '地點'} → #${a.at}`;
    } catch { return `放置 → #${a.at}`; }
  }
  if (a.type === 'cast') {
    try {
      const id = state.players[a.player].hand.find((h) => h.uid === a.hand)?.card;
      return `施放 ${id ? card(id).name : a.hand} @#${a.at}`;
    } catch { return `施放 @#${a.at}`; }
  }
  if (a.type === 'attack') return `攻擊 ${a.unit} → ${a.target}`;
  if (a.type === 'move') return `移動 ${a.unit} → #${a.at}`;
  if (a.type === 'choose') return `選擇 #${a.option}`;
  if (a.type === 'ability') return `能力 ${a.mode || a.index}`;
  return a.type;
}

async function resolveHandoff() {
  const fromQuery = queryHandoff();
  const stored = readHandoff();
  if (fromQuery) {
    return {
      roomId: fromQuery.roomId,
      seat: fromQuery.seat,
      playerId: stablePlayerId(fromQuery.roomId, fromQuery.seat, stored?.playerId),
      needFetch: true,
      seed: stored?.roomId === fromQuery.roomId ? stored.seed : null,
      decks: stored?.roomId === fromQuery.roomId ? stored.decks : null,
      engineBuild: stored?.engineBuild,
      protocol: stored?.protocol,
    };
  }
  if (stored?.roomId != null && stored.decks && stored.seed != null) {
    return {
      ...stored,
      playerId: stablePlayerId(stored.roomId, stored.seat, stored.playerId),
      needFetch: false,
    };
  }
  return null;
}

async function fetchMatchFromFirebase(transport, roomId) {
  const paths = roomPaths(roomId);
  const meta = await transport.get(paths.meta);
  if (!meta) throw Error('房間不存在：' + roomId);
  if (meta.engineBuild && meta.engineBuild !== ENGINE_BUILD) {
    throw Error(`引擎版本不符：房間 ${meta.engineBuild} / 本機 ${ENGINE_BUILD}\n請雙方 Ctrl+F5 硬重整後再進。`);
  }
  if (meta.protocol && meta.protocol !== PROTOCOL_VERSION) {
    throw Error('協定版本不符');
  }
  if (meta.status !== 'playing' && meta.seed == null) {
    throw Error('此房尚未開始對局（status=' + meta.status + '）');
  }
  const d0 = await transport.get(paths.deck(0));
  const d1 = await transport.get(paths.deck(1));
  if (!d0 || !d1) throw Error('房間牌組不完整');
  return { meta, decks: [d0, d1] };
}

async function boot(handoff) {
  $('#build-badge').textContent = 'build ' + ENGINE_BUILD;
  $('#room').textContent = handoff.roomId;
  $('#seat').textContent = String(handoff.seat);
  $('#resume-panel').hidden = true;

  if (handoff.engineBuild && handoff.engineBuild !== ENGINE_BUILD) {
    throw Error(`引擎版本不符：交接 ${handoff.engineBuild} / 本機 ${ENGINE_BUILD}，請硬重整`);
  }

  logLine('載入卡牌…');
  await loadCards();

  const transport = await createFirebaseTransport({
    ...firebaseConfig,
    appName: 'sorcery-online-' + handoff.seat + '-' + handoff.roomId,
  });
  try {
    const authId = await ensureAnonymousPlayerId(transport);
    if (authId) {
      handoff.playerId = stablePlayerId(handoff.roomId, handoff.seat, authId);
      logLine('匿名 Auth · ' + authId.slice(0, 8) + '…');
    }
  } catch { /* Auth optional on Spark */ }
  try { await sweepExpiredRooms(transport, { preserveRoomId: handoff.roomId }); } catch { /* */ }

  let decks = handoff.decks;
  let seed = handoff.seed;
  let metaBuild = handoff.engineBuild;
  if (handoff.needFetch || !decks || seed == null) {
    logLine('自 Firebase 讀取牌組／seed…');
    const fetched = await fetchMatchFromFirebase(transport, handoff.roomId);
    decks = fetched.decks;
    seed = fetched.meta.seed;
    metaBuild = fetched.meta.engineBuild;
    handoff.seed = seed;
    handoff.decks = decks;
    handoff.engineBuild = metaBuild;
    handoff.protocol = fetched.meta.protocol;
    saveHandoff({
      roomId: handoff.roomId,
      seat: handoff.seat,
      playerId: handoff.playerId,
      seed,
      decks,
      engineBuild: metaBuild || ENGINE_BUILD,
      protocol: handoff.protocol || PROTOCOL_VERSION,
    });
  }

  let state = newGame(decks.map(deckFromWire), seed >>> 0, 'local');
  state.mode = 'online';
  state.players[0].name = '席0';
  state.players[1].name = '席1';
  let desync = null;
  let peerOnline = null;

  logLine(`newGame seed=${state.seed} checksum=${checksumState(state)}（接著重放 action log）`);

  const session = createRoomSession({ transport, playerId: handoff.playerId });
  session.on('peerOnline', () => { peerOnline = true; render(state, handoff.seat, desync, peerOnline); });
  session.on('peerOffline', () => { peerOnline = false; render(state, handoff.seat, desync, peerOnline); });
  if (handoff.seat === 0) await session.reclaimHost(handoff.roomId);
  else await session.joinRoom(handoff.roomId);

  const sync = createMatchSync({
    transport,
    roomId: handoff.roomId,
    seat: handoff.seat,
    playerId: handoff.playerId,
  });

  sync.on('desync', (info) => {
    desync = JSON.stringify(info);
    logLine('DESYNC ' + desync);
    render(state, handoff.seat, desync, peerOnline);
  });
  sync.on('gap', (info) => {
    desync = 'action gap ' + JSON.stringify(info);
    logLine(desync);
    render(state, handoff.seat, desync, peerOnline);
  });

  let replayCount = 0;
  sync.on('action', async (entry) => {
    try {
      state = dispatchFinalControlledEntry(state,entry,dispatch);
      const sum = checksumState(state);
      replayCount++;
      logLine(`#${entry.seq} seat${entry.seat} ${entry.action.type} → ${sum}`);
      const tipPath = roomPaths(handoff.roomId).tip(entry.seq);
      await transport.update(tipPath, { [String(handoff.seat)]: sum });
      const tip = await transport.get(tipPath);
      if (tip?.['0'] && tip?.['1'] && tip['0'] !== tip['1']) {
        desync = `seq ${entry.seq} 席0=${tip['0']} 席1=${tip['1']}`;
        logLine('⚠ ' + desync);
      } else if (tip?.[0] && tip?.[1] && tip[0] !== tip[1]) {
        desync = `seq ${entry.seq} 席0=${tip[0]} 席1=${tip[1]}`;
        logLine('⚠ ' + desync);
      }
      render(state, handoff.seat, desync, peerOnline);
    } catch (e) {
      desync = e.message;
      logLine('dispatch 失敗：' + e.message);
      render(state, handoff.seat, desync, peerOnline);
    }
  });

  sync.start();
  await sync.flush();
  logLine(replayCount ? `已重放 ${replayCount} 筆 action` : '尚無 action（對局剛開始）');
  render(state, handoff.seat, desync, peerOnline);

  let submissionInFlight=false;
  let lastChoiceSubmissionAt=-Infinity;
  window.__submitAction = async (action) => {
    if (desync) return showNotice('已不同步，請雙方重新整理或回大廳。',{title:'連線狀態'});
    if (submissionInFlight) return;
    if (finalDecisionController(state,acting(state)) !== handoff.seat) return showNotice('尚未輪到你。',{title:'行動提示'});
    if(action.type==='choose'&&(action.player!==acting(state)||action.choiceToken!==choiceToken(state)))return;
    if(action.type==='choose'&&performance.now()-lastChoiceSubmissionAt<400)return;
    if(action.type==='choose')lastChoiceSubmissionAt=performance.now();
    submissionInFlight=true;
    try{await sync.publish({ ...action, player:action.player??acting(state),actor:handoff.seat });await sync.flush();}finally{submissionInFlight=false;}
  };

  $('#btn-copy-room').onclick = async () => {
    await navigator.clipboard.writeText(handoff.roomId);
    logLine('已複製房號 ' + handoff.roomId);
  };
  $('#btn-copy-link').onclick = async () => {
    const url = new URL(location.href);
    url.search = `?room=${handoff.roomId}&seat=${handoff.seat}`;
    await navigator.clipboard.writeText(url.toString());
    logLine('已複製進房連結');
  };

  window.addEventListener('beforeunload', () => {
    sync.close();
    session.close();
  });

  logLine('lockstep 就緒。');
}

async function main() {
  $('#build-badge').textContent = 'build ' + ENGINE_BUILD;
  let handoff = await resolveHandoff();
  if (!handoff) {
    $('#resume-panel').hidden = false;
    $('#meta').textContent = '請從大廳開始，或在下方重連。';
    $('#btn-resume').onclick = async () => {
      try {
        const roomId = $('#resume-room').value.trim().toUpperCase();
        const seat = +$('#resume-seat').value;
        if (!roomId) throw Error('請輸入房號');
        handoff = {
          roomId,
          seat,
          playerId: stablePlayerId(roomId, seat),
          needFetch: true,
        };
        await boot(handoff);
      } catch (e) {
        showBootError(e.message);
        console.error(e);
      }
    };
    return;
  }
  await boot(handoff);
}

main().catch((e) => {
  console.error(e);
  showBootError(e.message);
  logLine('✗ ' + e.message);
});
