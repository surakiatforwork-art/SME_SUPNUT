const QUEUE_KEY = 'sme.purchaseStatusQueue.v1';
const ALLOWED_VALUES = new Set(['ของหมด']);

export function readQueue(storage) {
  try {
    const data = JSON.parse(storage.getItem(QUEUE_KEY) || '{}');
    return Object.fromEntries(Object.entries(data).filter(([id, value]) => id && ALLOWED_VALUES.has(value)));
  } catch { return {}; }
}

export function writeQueue(storage, queue) {
  try { storage.setItem(QUEUE_KEY, JSON.stringify(queue)); return true; } catch { return false; }
}

export function queueValue(queue, identity, value) { return { ...queue, [identity]: value }; }
export function removeQueuedValue(queue, identity) { const next = { ...queue }; delete next[identity]; return next; }
