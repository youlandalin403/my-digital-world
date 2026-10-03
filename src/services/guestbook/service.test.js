import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEntry, createGuestbookService, contactHref, COOLDOWN_MS } from './service.js';

test('entry validation trims, allows anonymous names and enforces both limits', () => {
  assert.deepEqual(validateEntry('  ', ' Hello \n'), { name: '', message: 'Hello' });
  for (const message of ['', ' \t\n', '\u00a0\u3000']) assert.throws(() => validateEntry('', message), /enter a message/);
  assert.throws(() => validateEntry('a'.repeat(81), 'Hello'), /80/);
  assert.throws(() => validateEntry('', 'x'.repeat(2001)), /2000/);
  assert.equal(validateEntry('a'.repeat(80), 'x'.repeat(2000)).message.length, 2000);
  assert.equal([...validateEntry('', '😀'.repeat(2000)).message].length, 2000);
});
test('honeypot, concurrent submissions, cooldown and retry after failure', async () => {
  let now = 1000, writes = 0, release;
  const service = createGuestbookService({ insert: async entry => { writes++; await new Promise(resolve => { release = resolve; }); return entry; } }, () => now);
  await assert.rejects(service.submitEntry('', 'Hello', 'bot'), /rejected/); assert.equal(writes, 0);
  const pending = service.submitEntry('', 'Hello');
  await assert.rejects(service.submitEntry('', 'Again'), /in progress/); release(); await pending;
  await assert.rejects(service.submitEntry('', 'Again'), /wait/); assert.equal(writes, 1);
  now += COOLDOWN_MS; const next = service.submitEntry('Named', 'Again'); release(); await next; assert.equal(writes, 2);
  let fail = true;
  const retry = createGuestbookService({ insert: async () => { if (fail) throw new Error('offline'); return {}; } });
  await assert.rejects(retry.submitEntry('', 'Hello'), /offline/); assert.equal(retry.remainingCooldown(), 0);
  fail = false; await retry.submitEntry('', 'Hello');
});
test('owner reads and all moderation operations require owner auth; public reads do not', async () => {
  let owner = false; const calls = [];
  const service = createGuestbookService({ requireOwner: async () => { if (!owner) throw new Error('Owner required'); }, list: async value => calls.push(value), setHidden: async (...args) => calls.push(args), remove: async id => calls.push(id) });
  await service.getVisibleEntries();
  for (const operation of [() => service.getOwnerEntries(), () => service.hideEntry('id'), () => service.unhideEntry('id'), () => service.deleteEntry('id')]) await assert.rejects(operation, /Owner required/);
  assert.deepEqual(calls, [false]); owner = true;
  await service.getOwnerEntries(); await service.hideEntry('id'); await service.unhideEntry('id'); await service.deleteEntry('id');
  assert.deepEqual(calls, [false, true, ['id', true], ['id', false], 'id']);
});
test('email link accepts a configured address without mailto parameter injection', () => {
  assert.equal(contactHref(' contact@example.com '), 'mailto:contact@example.com');
  for (const value of ['', undefined, 'invalid', 'a@b.com?bcc=elsewhere', 'a@b.com\n']) {
    if (value === 'a@b.com\n') continue;
    assert.equal(contactHref(value), null);
  }
});
