import test from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_KEY, readVisit, saveVisit, clearVisit, checkStorage, createGuestPassService } from './service.js';
const token = 'A'.repeat(43);
test('Visit storage is injected tab storage; corrupt or unavailable storage fails closed', () => {
  const values = new Map();
  const storage = { getItem: k => values.get(k), setItem: (k, v) => values.set(k, v), removeItem: k => values.delete(k) };
  assert.equal(readVisit(storage), null); checkStorage(storage); assert.equal(values.size, 0);
  saveVisit(storage, token); assert.equal(readVisit(storage), token);
  assert.equal(values.get(SESSION_KEY), token); clearVisit(storage); assert.equal(readVisit(storage), null);
  assert.throws(() => saveVisit(storage, 'invalid')); storage.setItem(SESSION_KEY, 'corrupt'); assert.equal(readVisit(storage), null);
  assert.equal(readVisit({ getItem() { throw new Error('disabled'); } }), null);
});
test('Client sends tokens only in POST bodies and adds Auth JWT only to owner requests', async () => {
  const requests = [];
  const api = createGuestPassService({ url: 'https://example.test/', key: 'sb_publishable_test',
    getSession: async () => ({ access_token: 'owner-jwt' }), fetcher: async (url, options) => {
      requests.push({ url, ...options }); return new Response(JSON.stringify({ valid: true }));
    } });
  await api('validate-room-session', { token }); await api('create-invitation', {}, true);
  assert.equal(requests[0].method, 'POST'); assert.equal(requests[0].headers.Authorization, undefined);
  assert.equal(requests[0].body, JSON.stringify({ token })); assert.ok(!requests[0].url.includes(token));
  assert.equal(requests[0].referrerPolicy, 'no-referrer'); assert.equal(requests[0].cache, 'no-store');
  assert.equal(requests[1].headers.Authorization, 'Bearer owner-jwt');
});
test('Client exposes safe statuses, not backend diagnostics', async () => {
  const api = createGuestPassService({ url: 'https://example.test', key: 'public', getSession: async () => null,
    fetcher: async () => new Response(JSON.stringify({ error: 'secret diagnostics' }), { status: 500 }) });
  await assert.rejects(api('list-invitations', {}, true), /Owner sign-in/);
  await assert.rejects(api('redeem-invitation', { token }), /service unavailable/);
});
