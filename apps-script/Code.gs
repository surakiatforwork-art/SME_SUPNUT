/** Google Apps Script backend for SME SUPNUT. Deploy as a Web app. */
const SPREADSHEET_ID = '1RukQXEHcSTDYH4O9nRKa4qVie6UDi84hGGOJxKQLqgE';
const SHEET_NAME = 'ชีต1';
const HEADERS = { district: 'เขต', account: 'Account', name: 'ชื่อร้าน', branch: 'รหัสสาขา', sku: 'SKU', value: 'ซื้อออกแล้ว' };

function doGet(e) { return e && e.parameter.action === 'list' ? reply_({ ok: true, rows: list_() }) : reply_({ ok: true, service: 'SME SUPNUT API' }); }
function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (body.action === 'list') return reply_({ ok: true, rows: list_() });
    if (body.action === 'save') return reply_(save_(body));
    if (body.action === 'upload') return reply_(upload_(body));
    return reply_({ ok: false, error: 'Unknown action' });
  } catch (err) { return reply_({ ok: false, error: err.message || 'Server error' }); }
}
function sheet_() { return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME); }
function columns_(headers) {
  const found = {};
  Object.keys(HEADERS).forEach(k => {
    const index = headers.indexOf(HEADERS[k]);
    if (index < 0) throw new Error(`ไม่พบหัวคอลัมน์: ${HEADERS[k]}`);
    found[k] = index;
  });
  return found;
}
function list_() {
  const sh = sheet_();
  const values = sh.getDataRange().getDisplayValues();
  const c = columns_(values.shift());
  const photoRows = new Set(sh.getImages().filter(image => image.getAnchorColumn() === c.value + 1).map(image => image.getAnchorRow()));
  return values.map((r, i) => ({
    row: i + 2,
    identity: Utilities.base64EncodeWebSafe([i + 2, encodeURIComponent(r[c.branch]), encodeURIComponent(r[c.name])].join('|')),
    district: r[c.district], account: r[c.account], name: r[c.name], branch: r[c.branch], sku: r[c.sku], value: r[c.value], hasPhoto: photoRows.has(i + 2)
  }));
}
function save_(body) {
  if (!body.identity || typeof body.value !== 'string') throw new Error('ข้อมูลไม่ครบถ้วน');
  if (body.value !== 'ของหมด') throw new Error('กรุณาเลือกรายการ');
  const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(body.identity)).getDataAsString().split('|');
  const row = Number(decoded[0]);
  const branch = decodeURIComponent(decoded[1]);
  const name = decodeURIComponent(decoded.slice(2).join('|'));
  const sh = sheet_();
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0];
  const c = columns_(headers);
  if (row < 2 || sh.getRange(row, c.branch + 1).getDisplayValue() !== branch || sh.getRange(row, c.name + 1).getDisplayValue() !== name) throw new Error('รายการถูกเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่ก่อนบันทึก');
  const lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try { sh.getRange(row, c.value + 1).setValue(body.value); } finally { lock.releaseLock(); }
  return { ok: true, value: body.value };
}
function upload_(body) {
  if (!body.identity || !body.image || typeof body.image.dataUrl !== 'string') throw new Error('ข้อมูลรูปภาพไม่ครบถ้วน');
  if (body.image.dataUrl.length > 3500000) throw new Error('รูปมีขนาดใหญ่เกินไป');
  const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(body.identity)).getDataAsString().split('|');
  const row = Number(decoded[0]); const branch = decodeURIComponent(decoded[1]); const name = decodeURIComponent(decoded.slice(2).join('|'));
  const sh = sheet_(); const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getDisplayValues()[0]; const c = columns_(headers);
  if (row < 2 || sh.getRange(row, c.branch + 1).getDisplayValue() !== branch || sh.getRange(row, c.name + 1).getDisplayValue() !== name) throw new Error('รายการถูกเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่ก่อนบันทึก');
  const lock = LockService.getDocumentLock(); lock.waitLock(15000);
  try { sh.getImages().filter(image => image.getAnchorRow() === row && image.getAnchorColumn() === c.value + 1).forEach(image => image.remove()); sh.getRange(row, c.value + 1).clearContent(); const blob = Utilities.newBlob(Utilities.base64Decode(body.image.dataUrl.split(',')[1]), body.image.type || 'image/jpeg', body.image.name || `store-${row}.jpg`); sh.insertImage(blob, c.value + 1, row).setWidth(160).setHeight(220); sh.setRowHeight(row, 220); } finally { lock.releaseLock(); }
  return { ok: true };
}
function reply_(object) { return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON); }
