export function validEndpoint(url) { return /^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url); }
export async function request(apiUrl, token, action, data = {}) {
  if (!validEndpoint(apiUrl)) throw new Error('กรุณาตั้งค่า URL Apps Script ที่ลงท้ายด้วย /exec');
  const isRead = action === 'list';
  const requestUrl = isRead ? `${apiUrl}?action=list` : apiUrl;
  let response;
  try {
    response = await fetch(requestUrl, { method: isRead ? 'GET' : 'POST', redirect: 'follow', credentials: 'omit', cache: 'no-store',
      ...(isRead ? {} : { headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, token, ...data }) }),
      signal: AbortSignal.timeout(60000) });
  } catch { throw new Error(action === 'upload' ? 'อัปโหลดรูปไม่สำเร็จ กรุณาลอง Sync ใหม่อีกครั้ง' : action === 'save' ? 'ยังยืนยันการบันทึกไม่ได้ กรุณาลอง Sync ใหม่อีกครั้ง' : 'เชื่อมต่อไม่ได้ กรุณาตรวจอินเทอร์เน็ตและการ deploy Apps Script'); }
  let result;
  try { result = await response.json(); } catch { throw new Error('API ไม่ได้ส่ง JSON กลับมา ตรวจว่า deploy เป็น Web app และอนุญาต Anyone'); }
  if (!response.ok || !result.ok) throw new Error(result.error || 'เซิร์ฟเวอร์ไม่สามารถทำรายการได้');
  return result;
}
