import test from 'node:test';
import assert from 'node:assert/strict';
import { guestPassDatabase, owner } from './guest-pass-harness.js';
const hash = n => n.toString(16).padStart(64, '0');

test('Guest Pass: grants, RLS, atomic redemption, expiry, revocation and constraints', async () => {
  const { db, rpc } = await guestPassDatabase();
  try {
    const create = n => rpc('room_create_invitation', { p_token_hash: hash(n), p_owner: owner });
    const redeem = (n, s) => rpc('room_redeem_invitation', { p_token_hash: hash(n), p_session_hash: hash(s) });
    const validate = n => rpc('room_validate_session', { p_session_hash: hash(n) });
    const first = await create(1);
    assert.equal(Date.parse(first.expires_at) - Date.parse(first.created_at), 7 * 86400000);
    for (const role of ['anon', 'authenticated']) {
      await db.exec(`set role ${role}`);
      for (const table of ['room_invitations', 'room_visit_sessions']) {
        for (const sql of [`select * from ${table}`, `insert into ${table} default values`, `update ${table} set revoked_at=now()`, `delete from ${table}`, `truncate ${table}`]) {
          await assert.rejects(db.query(sql), /permission denied/);
        }
      }
      for (const [name, args] of [
        ['room_create_invitation', { p_token_hash: hash(9), p_owner: owner }],
        ['room_redeem_invitation', { p_token_hash: hash(1), p_session_hash: hash(2) }],
        ['room_validate_session', { p_session_hash: hash(2) }],
        ['room_revoke_session', { p_session_hash: hash(2) }],
        ['room_revoke_invitation', { p_id: first.id }], ['room_list_invitations', {}],
      ]) await assert.rejects(rpc(name, args), /permission denied/);
      await db.exec('reset role');
    }
    const security = (await db.query("select relrowsecurity, relforcerowsecurity from pg_class where relname in ('room_invitations','room_visit_sessions')")).rows;
    assert.equal(security.length, 2); assert.ok(security.every(row => row.relrowsecurity && row.relforcerowsecurity));
    await db.exec('set role service_role');
    await assert.rejects(db.query('select * from room_invitations'), /permission denied/);
    assert.equal((await redeem(1, 101)).status, 'ok');
    assert.equal((await redeem(1, 102)).status, 'already_used');
    assert.equal((await validate(101)).valid, true);
    await rpc('room_revoke_session', { p_session_hash: hash(101) });
    assert.equal((await validate(101)).valid, false);
    await rpc('room_revoke_session', { p_session_hash: hash(101) }); // idempotent
    assert.equal((await validate(999)).valid, false);
    assert.equal((await redeem(999, 109)).status, 'unavailable');
    await create(2);
    // PGlite queues overlapping submissions; genuine multi-connection test is separate.
    const overlap = await Promise.all([redeem(2, 103), redeem(2, 104)]);
    assert.deepEqual(overlap.map(r => r.status).sort(), ['already_used', 'ok']);
    const cancelled = await create(3);
    await rpc('room_revoke_invitation', { p_id: cancelled.id });
    assert.equal((await redeem(3, 105)).status, 'unavailable');
    await create(4);
    await create(5);
    await db.exec('reset role');
    await db.query("update room_invitations set created_at=now()-interval '8 days', expires_at=now()-interval '1 day' where token_hash=$1", [hash(4)]);
    assert.equal((await redeem(4, 106)).status, 'expired');
    // A failing session insert must roll back used_at as part of the same transaction.
    await assert.rejects(redeem(5, 101), /unique/);
    assert.equal((await db.query('select used_at from room_invitations where token_hash=$1', [hash(5)])).rows[0].used_at, null);
    assert.equal((await redeem(5, 107)).status, 'ok');
    const session = (await db.query('select * from room_visit_sessions where session_hash=$1', [hash(107)])).rows[0];
    assert.equal(session.expires_at - session.created_at, 4 * 3600000);
    await assert.rejects(db.query("insert into room_visit_sessions(invitation_id,session_hash,created_at,expires_at) values($1,$2,now(),now()+interval '4 hours')", [session.invitation_id, hash(120)]), /unique/);
    await assert.rejects(db.query("update room_visit_sessions set expires_at=created_at+interval '5 hours'"), /check constraint/);
    await assert.rejects(db.query("update room_invitations set expires_at=created_at+interval '8 days'"), /check constraint/);
    await assert.rejects(rpc('room_create_invitation', { p_token_hash: hash(200), p_owner: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }), /check constraint|foreign key/);
    await assert.rejects(rpc('room_create_invitation', { p_token_hash: 'raw-token', p_owner: owner }), /check constraint/);
    await db.query("update room_visit_sessions set created_at=now()-interval '5 hours', expires_at=now()-interval '1 hour' where session_hash=$1", [hash(107)]);
    assert.equal((await validate(107)).valid, false);
    const list = await rpc('room_list_invitations');
    assert.ok(list.some(r => r.status === 'expired')); assert.ok(list.some(r => r.status === 'revoked'));
    assert.ok(list.every(r => !('token_hash' in r) && !('session_hash' in r)));
    assert.equal((await db.query('select count(*)::int n from room_visit_sessions')).rows[0].n, 3);
  } finally { await db.close(); }
});
