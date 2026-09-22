import './styles.css';
import { request } from './api.js';
import { demoRows } from './demo.js';
import { filterRows, readPreference, validateValue, writePreference } from './model.js';

const config = window.APP_CONFIG || {};
const app = document.querySelector('#app');
const state = { rows: [], demo: false, filters: { district: readPreference(localStorage, 'sme.selectedDistrict'), account: '', status: '', query: '' } };

app.innerHTML = `
  <main class="shell"><header><div><p class="eyebrow">SME FIELD SALES</p><h1>บันทึกงานหน้าร้าน</h1><p class="sub">ค้นหาร้าน แล้วกรอกจำนวนที่ซื้อออก</p></div><button id="refresh" class="button secondary" type="button">↻ โหลดข้อมูลใหม่</button></header>
  <section class="filters" aria-label="ตัวกรองร้านค้า"><label><span>เขต</span><select id="district"><option value="">ทุกเขต</option></select></label><label><span>Account</span><select id="account"><option value="">ทุก Account</option></select></label><label><span>สถานะ</span><select id="status"><option value="">ทั้งหมด</option><option value="pending">ยังไม่กรอก</option><option value="done">กรอกแล้ว</option></select></label><label class="search"><span>ค้นหาร้าน / รหัสสาขา</span><input id="query" type="search" placeholder="พิมพ์ชื่อร้านหรือรหัสสาขา" autocomplete="off"></label></section>
  <section class="summary"><strong id="count">0 รายการ</strong><span id="notice" role="status">กำลังเตรียมข้อมูล…</span></section><section id="results" class="cards" aria-live="polite"></section>
  <dialog id="entryDialog"><form method="dialog" id="entryForm"><button class="close" value="cancel" aria-label="ปิด">×</button><p class="eyebrow">บันทึกข้อมูล</p><h2 id="entryTitle"></h2><dl id="entryDetails"></dl><label id="valueLabel"><span>จำนวนที่ซื้อออก</span><input id="value" inputmode="numeric" maxlength="7" required></label><p id="formError" class="error" hidden></p><div class="actions"><button value="cancel" class="button secondary">ยกเลิก</button><button id="save" value="default" class="button primary">บันทึก</button></div></form></dialog>
  <footer>ข้อมูลที่บันทึกจะอัปเดตลง Google Sheet โดยตรง</footer></main>`;
const $ = (s) => document.querySelector(s);
const dialog = $('#entryDialog'); let activeRow;
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
function render() { const rows = filterRows(state.rows, state.filters); $('#count').textContent = `${rows.length} รายการ`; $('#results').innerHTML = rows.length ? rows.map(r => `<article class="card"><div class="tag">${escapeHtml(r.district)} · ${escapeHtml(r.account)}</div><h2>${escapeHtml(r.name)}</h2><p class="branch">สาขา ${escapeHtml(r.branch)}</p><p class="sku">${escapeHtml(r.sku || '—')}</p><div class="card-footer"><span class="${r.value !== '' ? 'complete' : 'pending'}">${r.value !== '' ? `ซื้อออกแล้ว: ${escapeHtml(r.value)}` : 'ยังไม่กรอก'}</span><button class="button primary entry" data-id="${escapeHtml(r.identity)}" type="button">${r.value !== '' ? 'แก้ไข' : 'กรอกข้อมูล'}</button></div></article>`).join('') : '<div class="empty">ไม่พบร้านที่ตรงกับเงื่อนไข</div>'; document.querySelectorAll('.entry').forEach(b => b.addEventListener('click', () => openEntry(b.dataset.id))); }
function openEntry(id) { activeRow = state.rows.find(r => r.identity === id); if (!activeRow) return; $('#entryTitle').textContent = activeRow.name; $('#entryDetails').innerHTML = `<div><dt>เขต</dt><dd>${escapeHtml(activeRow.district)}</dd></div><div><dt>Account</dt><dd>${escapeHtml(activeRow.account)}</dd></div><div><dt>รหัสสาขา</dt><dd>${escapeHtml(activeRow.branch)}</dd></div>`; const input = $('#value'); const label = $('#valueLabel span'); input.value = activeRow.value; input.type = config.valueMode === 'status' ? 'text' : 'text'; input.inputMode = config.valueMode === 'quantity' ? 'numeric' : 'text'; label.textContent = config.valueMode === 'status' ? 'สถานะ (ซื้อแล้ว / ยังไม่ซื้อ)' : config.valueMode === 'text' ? 'ข้อมูลซื้อออกแล้ว' : 'จำนวนที่ซื้อออก'; $('#formError').hidden = true; dialog.showModal(); input.focus(); }
async function load() { $('#notice').textContent = 'กำลังโหลดข้อมูล…'; try { const data = await request(config.apiUrl, '', 'list'); state.rows = data.rows; state.demo = false; $('#notice').textContent = `อัปเดตล่าสุด ${new Date().toLocaleTimeString('th-TH', {hour:'2-digit', minute:'2-digit'})}`; } catch (error) { state.rows = demoRows; state.demo = true; $('#notice').textContent = `โหมดตัวอย่าง: ${error.message}`; } setupFilters(); }
$('#district').addEventListener('change', e => { state.filters.district = e.target.value; writePreference(localStorage, 'sme.selectedDistrict', e.target.value); render(); });
$('#account').addEventListener('change', e => { state.filters.account = e.target.value; render(); }); $('#status').addEventListener('change', e => { state.filters.status = e.target.value; render(); }); $('#query').addEventListener('input', e => { state.filters.query = e.target.value; render(); }); $('#refresh').addEventListener('click', load);
$('#entryForm').addEventListener('submit', async event => { event.preventDefault(); const error = $('#formError'); try { const value = validateValue($('#value').value.trim(), config.valueMode || 'quantity'); if (state.demo) throw new Error('กำลังอยู่ในโหมดตัวอย่าง กรุณาตั้งค่า Apps Script URL ก่อนบันทึกจริง'); $('#save').disabled = true; $('#save').textContent = 'กำลังบันทึก…'; const data = await request(config.apiUrl, '', 'save', { identity: activeRow.identity, value }); activeRow.value = data.value; dialog.close(); $('#notice').textContent = 'บันทึกเรียบร้อย'; render(); } catch (e) { error.textContent = e.message; error.hidden = false; } finally { $('#save').disabled = false; $('#save').textContent = 'บันทึก'; } });
load();
