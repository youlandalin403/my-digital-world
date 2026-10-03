import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiaryService } from './service.js';

test('Diary validates dates, preserves Markdown and checks owner before every operation', async () => {
  let owner = true, calls = 0, row = null;
  const service = createDiaryService({
    requireOwner: async () => { if (!owner) throw new Error('Denied'); },
    get: async () => { calls++; return row; },
    save: async value => { calls++; row = value; return row; },
    remove: async () => { calls++; row = null; },
  });
  assert.equal(await service.getDiaryEntry('2026-09-28'), null);
  await service.saveDiaryEntry('2026-09-28', '', '# Writing\n\n  unchanged ');
  assert.equal((await service.getDiaryEntry('2026-09-28')).body_markdown, '# Writing\n\n  unchanged ');
  await assert.rejects(service.getDiaryEntry('2026-02-30'), /Invalid date/);
  await assert.rejects(service.saveDiaryEntry('2026-09-28', null, ''), /text/);
  await service.deleteDiaryEntry('2026-09-28'); assert.equal(row, null);
  owner = false; const previous = calls;
  for (const operation of [() => service.getDiaryEntry('2026-09-28'), () => service.saveDiaryEntry('2026-09-28', '', ''), () => service.deleteDiaryEntry('2026-09-28')]) await assert.rejects(operation(), /Denied/);
  assert.equal(calls, previous);
});

test('Diary propagates adapter failures instead of reporting success', async () => {
  const fail = async () => { throw new Error('Offline'); };
  const service = createDiaryService({ requireOwner: async () => {}, get: fail, save: fail, remove: fail });
  await assert.rejects(service.getDiaryEntry('2026-09-28'), /Offline/);
  await assert.rejects(service.saveDiaryEntry('2026-09-28', '', ''), /Offline/);
  await assert.rejects(service.deleteDiaryEntry('2026-09-28'), /Offline/);
});
