export function filterRows(rows, { district = '', account = '', status = '', query = '' }) {
  const words = query.trim().toLocaleLowerCase('th').split(/\s+/).filter(Boolean);
  return rows.filter(r => (!district || r.district === district) && (!account || r.account === account)
    && (!status || (status === 'done' ? r.value !== '' : r.value === ''))
    && words.every(w => [r.district, r.account, r.name, r.branch].join(' ').toLocaleLowerCase('th').includes(w)));
}
export function validateValue(value) {
  if (value !== 'ของหมด') throw new Error('กรุณาเลือกรายการ');
  return value;
}
export function readPreference(storage, key, fallback = '') { try { return storage.getItem(key) ?? fallback; } catch { return fallback; } }
export function writePreference(storage, key, value) { try { storage.setItem(key, value); return true; } catch { return false; } }
