export const DB_NAME = 'caprompt';
export const DB_VERSION = 1;
export const STORES = ['templates', 'presets', 'runs', 'projects', 'kv'];

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const name of STORES) {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: name === 'kv' ? 'key' : 'id' });
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function wrap(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function store(name, mode) {
  const db = await openDB();
  return db.transaction(name, mode).objectStore(name);
}

export async function putRecord(storeName, record) {
  return wrap((await store(storeName, 'readwrite')).put(record));
}

export async function getAll(storeName) {
  return wrap((await store(storeName, 'readonly')).getAll());
}

export async function getRecord(storeName, key) {
  return wrap((await store(storeName, 'readonly')).get(key));
}

export async function deleteRecord(storeName, key) {
  return wrap((await store(storeName, 'readwrite')).delete(key));
}

export async function countAll(storeName) {
  return wrap((await store(storeName, 'readonly')).count());
}
