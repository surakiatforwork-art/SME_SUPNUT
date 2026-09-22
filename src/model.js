export function filterRows(rows, { district = '', account = '', status = '', query = '' }) {
  const words = query.trim().toLocaleLowerCase('th').split(/\s+/).filter(Boolean);
  return rows.filter(r => (!district || r.district === district) && (!account || r.account === account)
    && (!status || (status === 'done' ? r.value !== '' : r.value === ''))
    && words.every(w => [r.district, r.account, r.name, r.branch].join(' ').toLocaleLowerCase('th').includes(w)));
}
export function validateValue(value, mode) {
  if (mode === 'quantity' && !/^(0|[1-9]\d{0,6})$/.test(value)) throw new Error('กรุณากรอกจำนวนเต็มตั้งแต่ 0 ถึง 9,999,999');
  if (mode === 'status' && !['ซื้อแล้ว', 'ยังไม่ซื้อ'].includes(value)) throw new Error('กรุณาเลือกสถานะ');
  if (mode === 'text' && (!value.trim() || value.length > 200 || /^[=+@-]/.test(value))) throw new Error('กรอกข้อความ 1–200 ตัวอักษร และไม่ขึ้นต้นด้วย = + - @');
  return value;
}
export function readPreference(storage, key, fallback = '') { try { return storage.getItem(key) ?? fallback; } catch { return fallback; } }
export function writePreference(storage, key, value) { try { storage.setItem(key, value); return true; } catch { return false; } }
