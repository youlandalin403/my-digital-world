// Optional genuine multi-backend PostgreSQL race. NEVER accepts a remote URL.
// Requires an EMPTY, disposable localhost database named room_guest_pass_test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { migration, owner } from './guest-pass-harness.js';
const exec = promisify(execFile);
test('two independent PostgreSQL connections cannot redeem the same invitation', {
  skip: process.env.ROOM_PG_RACE !== '1' && 'Set ROOM_PG_RACE=1 with a disposable local PostgreSQL database.',
}, async () => {
  const port = process.env.ROOM_PG_PORT || '5432';
  if (!/^\d{1,5}$/.test(port)) throw new Error('Invalid local PostgreSQL port');
  const query = async sql => {
    const { stdout } = await exec('psql', ['-X', '-A', '-t', '-q', '-v', 'ON_ERROR_STOP=1',
      '-h', '127.0.0.1', '-p', port, '-d', 'room_guest_pass_test', '-c', sql], {
      timeout: 15000, env: { ...process.env, PGSERVICE: '', PGOPTIONS: '', PGHOSTADDR: '127.0.0.1' },
    });
    return stdout.trim();
  };
  assert.equal(await query('select current_database()'), 'room_guest_pass_test');
  assert.equal(await query("select count(*) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname not in ('pg_catalog','information_schema') and n.nspname not like 'pg_toast%' and c.relkind in ('r','p','v','m','f')"), '0', 'Use an empty disposable database; no existing data is modified.');
  await query(`do $$ begin
    if not exists(select from pg_roles where rolname='anon') then create role anon; end if;
    if not exists(select from pg_roles where rolname='authenticated') then create role authenticated; end if;
    if not exists(select from pg_roles where rolname='service_role') then create role service_role; end if;
    end $$;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${owner}');`);
  await query(migration);
  await query(`select room_create_invitation(repeat('a',64),'${owner}')`);
  // Each call is a separate process/backend. The winner retains its row lock for
  // one second after redeeming, forcing the other transaction to wait at FOR UPDATE.
  const race = await Promise.all(['b', 'c'].map(character => query(`begin;
    set local role service_role;
    select room_redeem_invitation(repeat('a',64),repeat('${character}',64))->>'status';
    select pg_sleep(1); commit;`)));
  assert.deepEqual(race.map(value => value.trim()).sort(), ['already_used', 'ok']);
  assert.equal(await query('select count(*) from room_visit_sessions'), '1');
  assert.equal(await query('select count(*) from room_invitations where used_at is not null'), '1');
  // Keep this disposable DB for inspection. No drop/reset commands run here.
});
