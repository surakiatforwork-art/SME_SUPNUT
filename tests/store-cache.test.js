import test from 'node:test';
import assert from 'node:assert/strict';
import { readStoreCache, writeStoreCache } from '../src/store-cache.js';

const storage = { value: null, getItem(){ return this.value; }, setItem(_, value){ this.value = value; } };
const row = { identity: 'row-2', district: 'CVSE19', account: '7-Eleven', name: 'ร้านทดสอบ', branch: '00123', sku: '', value: '' };

test('stores and restores locally cached store rows', () => {
  assert.equal(writeStoreCache(storage, [row], 100), true);
  assert.deepEqual(readStoreCache(storage), { rows: [row], updatedAt: 100 });
});

test('ignores invalid cached rows', () => {
  storage.value = JSON.stringify({ rows: [{ identity: 'missing-fields' }] });
  assert.equal(readStoreCache(storage), null);
});
