import test from 'node:test'; import assert from 'node:assert/strict';
import { filterRows, validateValue } from '../src/model.js';
const rows=[{district:'CVSE19',account:'7-Eleven',name:'ร้านทดสอบ',branch:'00123',value:''},{district:'CVSE20',account:'Lotus',name:'ตลาดใหม่',branch:'00456',value:'3'}];
test('filters district and Thai-name search',()=>assert.deepEqual(filterRows(rows,{district:'CVSE19',query:'ทดสอบ'}),[rows[0]]));
test('filters pending values',()=>assert.deepEqual(filterRows(rows,{status:'pending'}),[rows[0]]));
test('allows only the three purchase-status choices',()=>{assert.equal(validateValue('ซื้อแล้ว 2'),'ซื้อแล้ว 2');assert.equal(validateValue('ซื้อแล้ว 1'),'ซื้อแล้ว 1');assert.equal(validateValue('ของหมด'),'ของหมด');assert.throws(()=>validateValue('2'));});
