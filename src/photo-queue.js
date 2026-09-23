const DB = 'sme-photo-sync';
const STORE = 'photos';
function open() { return new Promise((resolve, reject) => { const request = indexedDB.open(DB, 1); request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: 'identity' }); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); }); }
async function run(mode, action) { const db = await open(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE, mode); const request = action(tx.objectStore(STORE)); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); tx.oncomplete = () => db.close(); tx.onerror = () => reject(tx.error); }); }
export const allPhotos = () => run('readonly', store => store.getAll());
export const getPhoto = id => run('readonly', store => store.get(id));
export const savePhoto = photo => run('readwrite', store => store.put(photo));
export const removePhoto = id => run('readwrite', store => store.delete(id));
