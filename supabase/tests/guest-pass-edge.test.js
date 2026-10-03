import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, generateToken, hashToken, TOKEN_PATTERN, OWNER_ID } from '../functions/_shared/guest-pass.js';
import { guestPassDatabase } from './guest-pass-harness.js';
const siteOrigin = 'https://room.example.test';
function request(body = {}, jwt, method = 'POST', origin = siteOrigin) {
  return new Request(`${siteOrigin}/functions/v1/action`, { method, headers: {
    origin, 'content-type': 'application/json', ...(jwt ? { authorization: `Bearer ${jwt}` } : {}),
  }, ...(method === 'POST' ? { body: JSON.stringify(body) } : {}) });
}

test('Edge owner identity is verified for every owner action, before database work', async () => {
  for (const action of ['create-invitation', 'list-invitations', 'revoke-invitation']) {
    let calls = 0;
    const handler = createHandler({ action, siteOrigin, getUser: async jwt => jwt === 'stranger' ? { id: 'other' } : null, rpc: async () => { calls++; } });
    assert.equal((await handler(request({ isOwner: true, created_by: OWNER_ID }))).status, 401);
    assert.equal((await handler(request({}, 'forged-owner-jwt'))).status, 401);
    assert.equal((await handler(request({}, 'stranger'))).status, 403);
    assert.equal(calls, 0);
  }
});

test('Edge handlers with actual SQL: hashes only, one-time links, session validation and Leave Room', async () => {
  const { db, rpc } = await guestPassDatabase();
  try {
    await db.exec('set role service_role');
    const call = (action, body = {}, jwt) => createHandler({ action, siteOrigin, rpc,
      getUser: async token => token === 'owner-verified-by-auth' ? { id: OWNER_ID } : null,
    })(request(body, jwt));
    const created = await call('create-invitation', { expires_at: '2099-01-01' }, 'owner-verified-by-auth');
    assert.equal(created.status, 201); assert.equal(created.headers.get('cache-control'), 'no-store');
    const invitation = await created.json(), url = new URL(invitation.invitation_url), token = url.hash.slice(1);
    assert.equal(url.pathname, '/room/invite'); assert.equal(url.search, ''); assert.match(token, TOKEN_PATTERN);
    assert.equal(Buffer.from(token, 'base64url').length, 32);
    assert.equal((await call('redeem-invitation', { token: 'bad' })).status, 400);
    assert.equal((await call('redeem-invitation', { token: generateToken() })).status, 409);
    const redeemed = await call('redeem-invitation', { token }); assert.equal(redeemed.status, 200);
    const visit = await redeemed.json(); assert.match(visit.token, TOKEN_PATTERN); assert.notEqual(visit.token, token);
    assert.equal((await (await call('validate-room-session', { token: visit.token })).json()).valid, true);
    assert.deepEqual(await (await call('redeem-invitation', { token })).json(), { error: 'already_used' });
    assert.equal((await call('revoke-room-session', { token: visit.token })).status, 200);
    assert.deepEqual(await (await call('validate-room-session', { token: visit.token })).json(), { valid: false });
    const list = await (await call('list-invitations', {}, 'owner-verified-by-auth')).json();
    assert.equal(list.invitations[0].status, 'used'); assert.ok(!JSON.stringify(list).includes(token));
    const second = await (await call('create-invitation', {}, 'owner-verified-by-auth')).json();
    await call('revoke-invitation', { id: second.id }, 'owner-verified-by-auth');
    assert.equal((await call('redeem-invitation', { token: new URL(second.invitation_url).hash.slice(1) })).status, 409);
    await db.exec('reset role');
    const invitations = (await db.query('select * from room_invitations')).rows;
    const sessions = (await db.query('select * from room_visit_sessions')).rows;
    assert.equal(invitations.length, 2); assert.equal(sessions.length, 1);
    assert.equal(invitations.find(r => r.id === invitation.id).token_hash, await hashToken(token));
    assert.equal(sessions[0].session_hash, await hashToken(visit.token));
    assert.ok(!JSON.stringify({ invitations, sessions }).includes(token));
    assert.ok(!JSON.stringify({ invitations, sessions }).includes(visit.token));
  } finally { await db.close(); }
});

test('Public endpoints reject previews, malformed/large bodies and origins without database calls; errors are sanitized', async () => {
  for (const action of ['redeem-invitation', 'validate-room-session', 'revoke-room-session']) {
    let calls = 0;
    const handler = createHandler({ action, siteOrigin, getUser: async () => null, rpc: async () => { calls++; throw new Error('secret raw token credential'); } });
    for (const method of ['GET', 'HEAD', 'PUT']) assert.equal((await handler(request({}, null, method))).status, 405);
    assert.equal((await handler(request({}, null, 'OPTIONS'))).status, 204);
    for (const token of ['', 'x'.repeat(43), 'a'.repeat(10000), {}, null]) assert.equal((await handler(request({ token }))).status, 400);
    assert.equal((await handler(new Request(siteOrigin, { method: 'POST', body: '{' }))).status, 400);
    assert.equal((await handler(request({ token: generateToken() }, null, 'POST', 'https://evil.test'))).status, 403);
    assert.equal(calls, 0);
    const failure = await handler(request({ token: generateToken() }));
    assert.equal(failure.status, 503); assert.deepEqual(await failure.json(), { error: 'temporarily_unavailable' });
  }
});

test('256-bit tokens and SHA-256 are stable and canonical', async () => {
  const tokens = new Set(Array.from({ length: 128 }, generateToken));
  assert.equal(tokens.size, 128); for (const token of tokens) assert.match(token, TOKEN_PATTERN);
  assert.equal(await hashToken('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});
