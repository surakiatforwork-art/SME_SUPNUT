import test from 'node:test'; import assert from 'node:assert/strict';
import { filterRows, validateValue } from '../src/model.js';
const rows=[{district:'CVSE19',account:'7-Eleven',name:'ร้านทดสอบ',branch:'00123',value:''},{district:'CVSE20',account:'Lotus',name:'ตลาดใหม่',branch:'00456',value:'3'}];
test('filters district and Thai-name search',()=>assert.deepEqual(filterRows(rows,{district:'CVSE19',query:'ทดสอบ'}),[rows[0]]));
test('filters pending values',()=>assert.deepEqual(filterRows(rows,{status:'pending'}),[rows[0]]));
test('allows valid quantity and rejects formula-like value',()=>{assert.equal(validateValue('12','quantity'),'12');assert.throws(()=>validateValue('=1','quantity'));});
