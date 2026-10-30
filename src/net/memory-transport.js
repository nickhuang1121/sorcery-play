const clone = (v) => (v == null ? v : JSON.parse(JSON.stringify(v)));

/**
 * In-memory Firebase-shaped document store for local tests.
 * Two sessions share one bus; each gets its own transport handle.
 */
export function createMemoryBus() {
  const docs = new Map(); // path -> value
  const watchers = new Map(); // path -> Set<fn>

  function notify(path) {
    const exact = watchers.get(path);
    if (exact) for (const fn of [...exact]) fn(docs.has(path) ? clone(docs.get(path)) : null);
  }

  function transport(clientLabel = 'client') {
    return {
      kind: 'memory',
      label: clientLabel,
      async get(path) {
        return docs.has(path) ? clone(docs.get(path)) : null;
      },
      async set(path, value) {
        docs.set(path, clone(value));
        notify(path);
      },
      async update(path, patch) {
        const cur = docs.has(path) ? { ...docs.get(path) } : {};
        const next = { ...cur, ...patch };
        docs.set(path, clone(next));
        notify(path);
        return clone(next);
      },
      subscribe(path, fn) {
        if (!watchers.has(path)) watchers.set(path, new Set());
        watchers.get(path).add(fn);
        fn(docs.has(path) ? clone(docs.get(path)) : null);
        return () => watchers.get(path)?.delete(fn);
      },
      /** Memory: run offline write immediately when cancel hook is invoked via returned disposer… 
       *  Actual API: register a value written when `flushDisconnect()` is called (session close). */
      onDisconnect(path, value) {
        let pending = clone(value);
        const entry = { path, get value() { return pending; }, set value(v) { pending = clone(v); } };
        if (!this._disconnects) this._disconnects = [];
        this._disconnects.push(entry);
        return () => {
          const i = this._disconnects.indexOf(entry);
          if (i >= 0) this._disconnects.splice(i, 1);
        };
      },
      async flushDisconnect() {
        const list = this._disconnects || [];
        this._disconnects = [];
        for (const { path, value } of list) {
          docs.set(path, clone(value));
          notify(path);
        }
      },
      /** Child keys under path (e.g. list('rooms') → room ids). */
      async list(path) {
        const prefix = path.replace(/\/$/, '');
        const keys = new Set();
        for (const key of docs.keys()) {
          if (key === prefix) continue;
          if (!key.startsWith(prefix + '/')) continue;
          const rest = key.slice(prefix.length + 1);
          const child = rest.split('/')[0];
          if (child) keys.add(child);
        }
        return [...keys];
      },
      async remove(path) {
        const prefix = path.replace(/\/$/, '');
        const doomed = [];
        for (const key of docs.keys()) {
          if (key === prefix || key.startsWith(prefix + '/')) doomed.push(key);
        }
        for (const key of doomed) {
          docs.delete(key);
          notify(key);
        }
      },
      async transaction(path, updater) {
        const cur = docs.has(path) ? clone(docs.get(path)) : null;
        const next = updater(cur);
        if (next === undefined) return cur;
        docs.set(path, clone(next));
        notify(path);
        return clone(next);
      },
      _debug() {
        return { docs, watchers, clientLabel };
      },
    };
  }

  return {
    transport,
    snapshot() {
      return Object.fromEntries([...docs.entries()].map(([k, v]) => [k, clone(v)]));
    },
  };
}
