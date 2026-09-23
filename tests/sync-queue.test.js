import test from 'node:test'; import assert from 'node:assert/strict';
import { queueValue, readQueue, removeQueuedValue, writeQueue } from '../src/sync-queue.js';
const storage = { value: null, getItem(){ return this.value; }, setItem(_, value){ this.value = value; } };
test('keeps only allowed local status values', () => { storage.value = JSON.stringify({ a: 'ของหมด', b: 'invalid' }); assert.deepEqual(readQueue(storage), { a: 'ของหมด' }); });
test('queues and removes a sync item', () => { const queued = queueValue({}, 'branch-1', 'ของหมด'); assert.equal(writeQueue(storage, queued), true); assert.deepEqual(readQueue(storage), queued); assert.deepEqual(removeQueuedValue(queued, 'branch-1'), {}); });
