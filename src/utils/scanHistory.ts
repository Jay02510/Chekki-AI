// The parent's last few scans, image included, kept on this device only
// (IndexedDB: localStorage can't hold the photos). Lets a parent reopen
// yesterday's sheet. Every call swallows storage errors: private mode or
// blocked storage just means no history, never a broken scan.

export interface SavedScan {
  id: string;
  owner: string; // user uid, or 'guest'
  at: number;
  image: string; // data URL
  data: any; // the analyze result, as rendered by SplitView
}

const DB = 'chekki_scans';
const STORE = 'scans';
const KEEP = 5;

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const all = (db: IDBDatabase) =>
  new Promise<SavedScan[]>((resolve, reject) => {
    const req = db.transaction(STORE).objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as SavedScan[]).sort((a, b) => b.at - a.at));
    req.onerror = () => reject(req.error);
  });

export async function listScans(owner: string): Promise<SavedScan[]> {
  try {
    return (await all(await open())).filter((s) => s.owner === owner);
  } catch {
    return [];
  }
}

export async function saveScan(scan: SavedScan): Promise<void> {
  try {
    const db = await open();
    const stale = (await all(db)).filter((s) => s.owner === scan.owner).slice(KEEP - 1);
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(scan);
    stale.forEach((s) => tx.objectStore(STORE).delete(s.id));
  } catch {
    /* no history on this device */
  }
}
