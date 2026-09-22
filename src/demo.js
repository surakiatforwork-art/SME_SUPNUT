// ข้อมูลสมมติสำหรับทดสอบหน้าจอ ไม่ใช่รายการจากชีตจริง
export const demoRows = [
  ['DEMO19', '7-Eleven', 'ร้านตัวอย่าง สาขาสวนหลวง', '00101', ''],
  ['DEMO19', '7-Eleven', 'ร้านตัวอย่าง สาขาริมคลอง', '00102', '12'],
  ['DEMO19', 'Lotus’s', 'ร้านตัวอย่าง สาขาตลาดใหม่', '00103', ''],
  ['DEMO20', '7-Eleven', 'ร้านตัวอย่าง สาขาสถานีรถไฟ', '00201', '0'],
  ['DEMO20', 'Lotus’s', 'ร้านตัวอย่าง สาขาสุขุมวิท', '00202', ''],
  ['DEMO21', '7-Eleven', 'ร้านตัวอย่าง สาขาพระราม 9', '00301', ''],
].map(([district, account, name, branch, value], i) => ({ row: i + 2, identity: `demo-${i}`, district, account, name, branch, sku: 'SMOOTH E SUN ZEROFEEL SACHET 5 G', value }));
