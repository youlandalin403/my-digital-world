import test from 'node:test';
import assert from 'node:assert/strict';
import { localDateKey, parseDateKey, shiftDate } from './date.js';

test('daily keys use local calendar fields, including near midnight', () => {
  assert.equal(localDateKey(new Date(2026, 8, 28, 0, 1)), '2026-09-28');
  assert.equal(localDateKey(new Date(2026, 8, 28, 23, 59)), '2026-09-28');
});
test('navigation crosses months, years and leap days without UTC arithmetic', () => {
  assert.equal(shiftDate('2024-03-01', -1), '2024-02-29');
  assert.equal(shiftDate('2026-01-01', -1), '2025-12-31');
  assert.equal(shiftDate('2026-12-31', 1), '2027-01-01');
  assert.equal(shiftDate('2026-03-08', 1), '2026-03-09');
  assert.throws(() => parseDateKey('2026-02-30'));
  assert.throws(() => parseDateKey('2026-9-28'));
});
