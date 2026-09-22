import './styles.css';
import { request } from './api.js';
import { filterRows, readPreference, validateValue, writePreference } from './model.js';
import { queueValue, readQueue, removeQueuedValue, writeQueue } from './sync-queue.js';
import { readStoreCache, writeStoreCache } from './store-cache.js';

const config = window.APP_CONFIG || {};
const app = document.querySelector('#app');
const state = { rows: [], queue: readQueue(localStorage), filters: { district: readPreference(localStorage, 'sme.selectedDistrict'), account: '', status: '', query: '' } };

app.innerHTML = `
  <main class="shell"><header><div><p class="eyebrow">SME FIELD SALES</p><h1>บันทึกงานหน้าร้าน</h1><p class="sub">เลือกสถานะไว้ในเครื่อง แล้วกด Sync เพื่อส่งลงชีต</p></div><div class="header-actions"><span id="syncCount" class="sync-count">รอ Sync 0 รายการ</span><button id="sync" class="button primary" type="button">Sync ข้อมูล</button><button id="refresh" class="button secondary" type="button">↻ โหลดข้อมูลใหม่</button></div></header>
  <section class="filters" aria-label="ตัวกรองร้านค้า"><label><span>เขต</span><select id="district"><option value="">ทุกเขต</option></select></label><label><span>Account</span><select id="account"><option value="">ทุก Account</option></select></label><label><span>สถานะ</span><select id="status"><option value="">ทั้งหมด</option><option value="pending">ยังไม่กรอก</option><option value="done">กรอกแล้ว</option></select></label><label class="search"><span>ค้นหาร้าน / รหัสสาขา</span><input id="query" type="search" placeholder="พิมพ์ชื่อร้านหรือรหัสสาขา" autocomplete="off"></label></section>
  <section class="summary"><strong id="count">0 รายการ</strong><span id="notice" role="status">กำลังเตรียมข้อมูล…</span></section><section id="results" class="cards" aria-live="polite"></section>
  <dialog id="entryDialog"><form method="dialog" id="entryForm"><button id="closeDialog" class="close" type="button" aria-label="ปิด">×</button><p class="eyebrow">บันทึกข้อมูล</p><h2 id="entryTitle"></h2><dl id="entryDetails"></dl><label id="valueLabel"><span>สถานะการซื้อ</span><select id="value" required><option value="" disabled>เลือกสถานะ</option><option value="ซื้อแล้ว 2">ซื้อแล้ว 2</option><option value="ซื้อแล้ว 1">ซื้อแล้ว 1</option><option value="ของหมด">ของหมด</option></select></label><p id="formError" class="error" hidden></p><div class="actions"><button id="cancelEntry" type="button" class="button secondary">ยกเลิก</button><button id="save" value="default" class="button primary">บันทึก</button></div></form></dialog>
  <footer>ข้อมูลที่บันทึกจะอัปเดตลง Google Sheet โดยตรง</footer></main>`;
const $ = (s) => document.querySelector(s);
const dialog = $('#entryDialog'); let activeRow;
$('#closeDialog').addEventListener('click', () => dialog.close());
$('#cancelEntry').addEventListener('click', () => dialog.close());
function unique(key, rows = state.rows) { return [...new Set(rows.map(r => r[key]).filter(Boolean))].sort((a,b) => a.localeCompare(b, 'th')); }
function optionize(select, values, first) { const keep = select.value; select.innerHTML = `<option value="">${first}</option>${values.map(v => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join('')}`; select.value = values.includes(keep) ? keep : ''; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function setupFilters() {
  const districts = unique('district');
  const accounts = unique('account');
  if (!districts.includes(state.filters.district)) state.filters.district = '';
  if (!accounts.includes(state.filters.account)) state.filters.account = '';
  optionize($('#district'), districts, 'ทุกเขต');
  $('#district').value = state.filters.district;
  optionize($('#account'), accounts, 'ทุก Account');
  $('#account').value = state.filters.account;
  $('#status').value = state.filters.status;
  $('#query').value = state.filters.query;
  render();
}
function render() { const rows = filterRows(state.rows, state.filters); const queued = Object.keys(state.queue).length; $('#count').textContent = `${rows.length} รายการ`; $('#syncCount').textContent = `รอ Sync ${queued} รายการ`; $('#sync').disabled = queued === 0; $('#results').innerHTML = rows.length ? rows.map(r => `<article class="card"><div class="tag">${escapeHtml(r.district)} · ${escapeHtml(r.account)}</div><h2>${escapeHtml(r.name)}</h2><p class="branch">สาขา ${escapeHtml(r.branch)}</p><p class="sku">${escapeHtml(r.sku || '—')}</p><div class="card-footer"><span class="${r.pendingSync ? 'waiting' : r.value !== '' ? 'complete' : 'pending'}">${r.pendingSync ? `รอ Sync: ${escapeHtml(r.value)}` : r.value !== '' ? `ซื้อออกแล้ว: ${escapeHtml(r.value)}` : 'ยังไม่กรอก'}</span><button class="button primary entry" data-id="${escapeHtml(r.identity)}" type="button">${r.value !== '' ? 'แก้ไข' : 'กรอกข้อมูล'}</button></div></article>`).join('') : '<div class="empty">ไม่พบร้านที่ตรงกับเงื่อนไข</div>'; document.querySelectorAll('.entry').forEach(b => b.addEventListener('click', () => openEntry(b.dataset.id))); }
function openEntry(id) { activeRow = state.rows.find(r => r.identity === id); if (!activeRow) return; $('#entryTitle').textContent = activeRow.name; $('#entryDetails').innerHTML = `<div><dt>เขต</dt><dd>${escapeHtml(activeRow.district)}</dd></div><div><dt>Account</dt><dd>${escapeHtml(activeRow.account)}</dd></div><div><dt>รหัสสาขา</dt><dd>${escapeHtml(activeRow.branch)}</dd></div>`; const input = $('#value'); input.value = ['ซื้อแล้ว 2', 'ซื้อแล้ว 1', 'ของหมด'].includes(activeRow.value) ? activeRow.value : ''; $('#formError').hidden = true; dialog.showModal(); input.focus(); }
function applyRows(rows) { state.rows = rows.map(row => state.queue[row.identity] ? { ...row, value: state.queue[row.identity], pendingSync: true } : row); }
function timeLabel(timestamp) { return new Date(timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }); }
function loadCachedRows() {
  const cached = readStoreCache(localStorage);
  if (!cached) return false;
  applyRows(cached.rows);
  $('#notice').textContent = `แสดงข้อมูลในเครื่อง ${cached.rows.length} รายการ (บันทึก ${timeLabel(cached.updatedAt)}) กำลังตรวจข้อมูลใหม่…`;
  setupFilters();
  return true;
}
async function load() { const hasCachedRows = state.rows.length > 0; $('#notice').textContent = hasCachedRows ? 'กำลังตรวจข้อมูลใหม่…' : 'กำลังโหลดข้อมูล…'; try { const data = await request(config.apiUrl, '', 'list'); if (!Array.isArray(data.rows)) throw new Error('API ส่งข้อมูลรายการร้านไม่ถูกต้อง'); applyRows(data.rows); writeStoreCache(localStorage, data.rows); $('#notice').textContent = `อัปเดตล่าสุด ${timeLabel(Date.now())} · เก็บ ${data.rows.length} รายการไว้ในเครื่องแล้ว`; } catch (error) { if (state.rows.length) $('#notice').textContent = `ใช้ข้อมูลในเครื่องชั่วคราว · ตรวจข้อมูลใหม่ไม่สำเร็จ: ${error.message}`; else $('#notice').textContent = `โหลดข้อมูลไม่สำเร็จ: ${error.message}`; } setupFilters(); }
$('#district').addEventListener('change', e => { state.filters.district = e.target.value; writePreference(localStorage, 'sme.selectedDistrict', e.target.value); render(); });
$('#account').addEventListener('change', e => { state.filters.account = e.target.value; render(); }); $('#status').addEventListener('change', e => { state.filters.status = e.target.value; render(); }); $('#query').addEventListener('input', e => { state.filters.query = e.target.value; render(); }); $('#refresh').addEventListener('click', load);
$('#entryForm').addEventListener('submit', event => { event.preventDefault(); const error = $('#formError'); try { const value = validateValue($('#value').value); state.queue = queueValue(state.queue, activeRow.identity, value); if (!writeQueue(localStorage, state.queue)) throw new Error('บันทึกในเครื่องไม่สำเร็จ'); activeRow.value = value; activeRow.pendingSync = true; dialog.close(); $('#notice').textContent = 'บันทึกในเครื่องแล้ว กรุณากด Sync เพื่อส่งลงชีต'; render(); } catch (e) { error.textContent = e.message; error.hidden = false; } });
$('#sync').addEventListener('click', async () => { const items = Object.entries(state.queue); if (!items.length) return; const button = $('#sync'); button.disabled = true; button.textContent = 'กำลัง Sync…'; let sent = 0; for (const [identity, value] of items) { try { await request(config.apiUrl, '', 'save', { identity, value }); state.queue = removeQueuedValue(state.queue, identity); const row = state.rows.find(item => item.identity === identity); if (row) row.pendingSync = false; sent++; } catch { /* Keep failed entries in local storage for the next Sync. */ } } writeQueue(localStorage, state.queue); const remaining = Object.keys(state.queue).length; $('#notice').textContent = remaining ? `ส่งสำเร็จ ${sent} รายการ, คงค้าง ${remaining} รายการ` : `Sync สำเร็จ ${sent} รายการ`; button.textContent = 'Sync ข้อมูล'; render(); });
loadCachedRows();
load();
