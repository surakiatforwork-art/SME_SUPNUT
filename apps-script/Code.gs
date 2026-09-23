/** Google Apps Script backend for SME SUPNUT. Deploy as a Web app. */
const SPREADSHEET_ID = '1RukQXEHcSTDYH4O9nRKa4qVie6UDi84hGGOJxKQLqgE';
const SHEET_NAME = 'ชีต1';
// โฟลเดอร์ "smecvs" ที่เปิดได้ด้วยบัญชีเดียวกับ Apps Script
const PHOTO_FOLDER_ID = '1P2BSJkx2CjQF8T5dUyvKHLa7kgnJW9gr';
const HEADERS = { district: 'เขต', account: 'Account', name: 'ชื่อร้าน', branch: 'รหัสสาขา', sku: 'SKU', value: 'ซื้อออกแล้ว' };

function doGet(e) { return e && e.parameter.action === 'list' ? reply_({ ok: true, rows: list_() }) : reply_({ ok: true, service: 'SME SUPNUT API' }); }
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (body.action === 'debug') return reply_({ ok: true, effectiveUser: Session.getEffectiveUser().getEmail(), auth: ScriptApp.getAuthorizationInfo(ScriptApp.AuthMode.FULL).getAuthorizationStatus().toString() });
    if (body.action === 'list') return reply_({ ok: true, rows: list_() });
    if (body.action === 'save') return reply_(save_(body));
    if (body.action === 'upload') return reply_(upload_(body));
    return reply_({ ok: false, error: 'Unknown action' });
  } catch (err) { console.error(err && err.stack ? err.stack : err); return reply_({ ok: false, error: err.message || 'Server error' }); }
}
function sheet_() { return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME); }

// เลือกฟังก์ชันนี้แล้วกด Run หนึ่งครั้งจาก Apps Script เพื่ออนุญาต Sheets และ Drive
function authorize() {
  SpreadsheetApp.openById(SPREADSHEET_ID).getId();
  DriveApp.getFolderById(PHOTO_FOLDER_ID).getId();
  DriveApp.getFolderById(PHOTO_FOLDER_ID).createFile('.sme-drive-scope-check.txt', 'Drive write access verified');
}
// Apps Script scans method calls to determine OAuth scopes. This explicit call
// makes the required write scope visible without creating any authorization file.
function requireDriveWriteScope_() {
  if (false) DriveApp.createFile('scope-check.txt', '');
}
function columns_(headers) {
  const found = {};
  Object.keys(HEADERS).forEach(k => {
    const index = headers.indexOf(HEADERS[k]);
    if (index < 0) throw new Error(`ไม่พบหัวคอลัมน์: ${HEADERS[k]}`);
    found[k] = index;
  });
  return found;
}
function table_() {
  const sh = sheet_();
  const range = sh.getDataRange();
  const values = range.getDisplayValues();
  const headerIndex = values.findIndex(row => row.includes(HEADERS.district) && row.includes(HEADERS.value));
  if (headerIndex < 0) throw new Error('ไม่พบแถวหัวตาราง');
  return { sh, range, values, headerIndex, c: columns_(values[headerIndex]) };
}
function list_() {
  const { sh, range, values, headerIndex, c } = table_();
  const firstDataRow = range.getRow() + headerIndex + 1;
  const photoRows = new Set(sh.getImages().filter(image => image.getAnchorCell().getColumn() === c.value + 1).map(image => image.getAnchorCell().getRow()));
  const rawValues = range.getValues();
  return values.slice(headerIndex + 1).map((r, i) => ({
    row: firstDataRow + i,
    identity: Utilities.base64EncodeWebSafe([firstDataRow + i, encodeURIComponent(r[c.branch]), encodeURIComponent(r[c.name])].join('|')),
    district: r[c.district], account: r[c.account], name: r[c.name], branch: r[c.branch], sku: r[c.sku], value: r[c.value], hasPhoto: photoRows.has(firstDataRow + i) || (rawValues[headerIndex + i + 1][c.value] && rawValues[headerIndex + i + 1][c.value].valueType === SpreadsheetApp.ValueType.IMAGE)
  }));
}
function save_(body) {
  if (!body.identity || typeof body.value !== 'string') throw new Error('ข้อมูลไม่ครบถ้วน');
  if (body.value !== 'ของหมด') throw new Error('กรุณาเลือกรายการ');
  const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(body.identity)).getDataAsString().split('|');
  const row = Number(decoded[0]);
  const branch = decodeURIComponent(decoded[1]);
  const name = decodeURIComponent(decoded.slice(2).join('|'));
  const { sh, c } = table_();
  if (row < 2 || sh.getRange(row, c.branch + 1).getDisplayValue() !== branch || sh.getRange(row, c.name + 1).getDisplayValue() !== name) throw new Error('รายการถูกเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่ก่อนบันทึก');
  const lock = LockService.getDocumentLock();
  lock.waitLock(15000);
  try {
    sh.getImages().filter(image => image.getAnchorCell().getRow() === row && image.getAnchorCell().getColumn() === c.value + 1).forEach(image => image.remove());
    sh.getRange(row, c.value + 1).setValue(body.value);
  } finally { lock.releaseLock(); }
  return { ok: true, value: body.value };
}
function upload_(body) {
  if (!body.identity || !body.image || typeof body.image.dataUrl !== 'string') throw new Error('ข้อมูลรูปภาพไม่ครบถ้วน');
  if (body.image.dataUrl.length > 3500000) throw new Error('รูปมีขนาดใหญ่เกินไป');
  const decoded = Utilities.newBlob(Utilities.base64DecodeWebSafe(body.identity)).getDataAsString().split('|');
  const row = Number(decoded[0]); const branch = decodeURIComponent(decoded[1]); const name = decodeURIComponent(decoded.slice(2).join('|'));
  const { sh, c } = table_();
  if (!Number.isInteger(row) || row < 2 || sh.getRange(row, c.branch + 1).getDisplayValue() !== branch || sh.getRange(row, c.name + 1).getDisplayValue() !== name) throw new Error('รายการถูกเปลี่ยนแปลง กรุณาโหลดข้อมูลใหม่ก่อนบันทึก');
  const lock = LockService.getDocumentLock(); lock.waitLock(15000);
  try { const cell = sh.getRange(row, c.value + 1); sh.getImages().filter(image => image.getAnchorCell().getRow() === row && image.getAnchorCell().getColumn() === c.value + 1).forEach(image => image.remove()); cell.clearContent(); const blob = Utilities.newBlob(Utilities.base64Decode(body.image.dataUrl.split(',')[1]), body.image.type || 'image/jpeg', body.image.name || `store-${row}.jpg`); const file = DriveApp.getFolderById(PHOTO_FOLDER_ID).createFile(blob); file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); const cellImage = SpreadsheetApp.newCellImage().setSourceUrl(`https://drive.google.com/uc?export=view&id=${file.getId()}`).setAltTextTitle(`รูปสาขา ${branch}`).build(); cell.setValue(cellImage); sh.setColumnWidth(c.value + 1, 160); sh.setRowHeight(row, 220); } finally { lock.releaseLock(); }
  return { ok: true };
}
function reply_(object) { return ContentService.createTextOutput(JSON.stringify(object)).setMimeType(ContentService.MimeType.JSON); }
