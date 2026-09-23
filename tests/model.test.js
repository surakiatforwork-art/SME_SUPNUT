import test from 'node:test'; import assert from 'node:assert/strict';
import { filterRows, validateValue } from '../src/model.js';
const rows=[{district:'CVSE19',account:'7-Eleven',name:'ร้านทดสอบ',branch:'00123',value:''},{district:'CVSE20',account:'Lotus',name:'ตลาดใหม่',branch:'00456',value:'3'}];
test('filters district and Thai-name search',()=>assert.deepEqual(filterRows(rows,{district:'CVSE19',query:'ทดสอบ'}),[rows[0]]));
test('filters pending values',()=>assert.deepEqual(filterRows(rows,{status:'pending'}),[rows[0]]));
test('counts a photo as completed work',()=>{const photoRow={...rows[0],hasPhoto:true};assert.deepEqual(filterRows([photoRow],{status:'done'}),[photoRow]);});
test('allows only the out-of-stock choice',()=>{assert.equal(validateValue('ของหมด'),'ของหมด');assert.throws(()=>validateValue('ซื้อแล้ว 1'));});
