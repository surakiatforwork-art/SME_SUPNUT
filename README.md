# SME SUPNUT

เว็บสำหรับค้นหาร้านตามเขต, Account, ชื่อร้าน หรือรหัสสาขา และบันทึกสถานะลงคอลัมน์ **ซื้อออกแล้ว** ใน Google Sheet. สถานะมี 3 ค่า: `ซื้อแล้ว 2`, `ซื้อแล้ว 1`, และ `ของหมด`.

## เริ่มใช้งาน

1. เปิด [Apps Script](https://script.new) แล้ววางไฟล์ `apps-script/Code.gs` และ `apps-script/appsscript.json`.
2. Deploy → New deployment → **Web app**. เลือก Execute as: Me และ Who has access: **Anyone**. คัดลอก URL ที่ลงท้าย `/exec`. ทุกครั้งที่แก้ `Code.gs` ให้สร้าง deployment version ใหม่ก่อนใช้งาน.
3. วาง URL ใน `public/config.js` ที่ `apiUrl`.
4. Push ขึ้น GitHub แล้วเปิด Settings → Pages → Build and deployment: **GitHub Actions**. Workflow ใน repository นี้จะเผยแพร่ให้โดยอัตโนมัติ.
