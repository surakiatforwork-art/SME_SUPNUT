const KEY = 'sme.storeRows.v1';

function isRow(value) {
  return value && typeof value === 'object' && typeof value.identity === 'string'
    && typeof value.district === 'string' && typeof value.account === 'string'
    && typeof value.name === 'string' && typeof value.branch === 'string';
}

export function readStoreCache(storage) {
  try {
    const saved = JSON.parse(storage.getItem(KEY) || 'null');
    if (!saved || !Array.isArray(saved.rows)) return null;
    const rows = saved.rows.filter(isRow);
    return rows.length ? { rows, updatedAt: Number(saved.updatedAt) || 0 } : null;
  } catch { return null; }
}

export function writeStoreCache(storage, rows, updatedAt = Date.now()) {
  try {
    storage.setItem(KEY, JSON.stringify({ rows, updatedAt }));
    return true;
  } catch { return false; }
}
