import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180', stranger = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('Diary migration: owner CRUD, unique dates, timestamps and direct unauthorized access', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key); insert into auth.users values ('${owner}'),('${stranger}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;`);
    await db.exec(readFileSync(new URL('../migrations/202609280004_diary.sql', import.meta.url), 'utf8'));
    const query = async (sql, args) => (await db.query(sql, args)).rows;
    const as = async (role, id = '') => { await db.exec(`reset role; set role ${role}`); await query("select set_config('request.jwt.claim.sub',$1,false)", [id]); };
    await as('authenticated', owner);
    const [entry] = await query(`insert into diary_entries(owner_id,date,body_markdown) values ('${owner}','2026-09-28','# Private') returning *`);
    const [updated] = await query(`insert into diary_entries(owner_id,date,title,body_markdown) values ('${owner}','2026-09-28','Title','Updated') on conflict(owner_id,date) do update set title=excluded.title,body_markdown=excluded.body_markdown returning *`);
    assert.equal(updated.id, entry.id); assert.deepEqual(updated.created_at, entry.created_at); assert.ok(updated.updated_at >= entry.updated_at);
    await assert.rejects(query(`insert into diary_entries(owner_id,date) values ('${owner}','2026-09-28')`), /unique/);
    assert.equal((await query("select * from diary_entries where date='2026-09-29'")).length, 0);
    for (const id of [stranger, '']) {
      await as('authenticated', id);
      assert.equal((await query('select * from diary_entries')).length, 0);
      assert.equal((await query("update diary_entries set body_markdown='attack' returning id")).length, 0);
      assert.equal((await query('delete from diary_entries returning id')).length, 0);
      for (const spoof of [owner, stranger]) await assert.rejects(query(`insert into diary_entries(owner_id,date) values ('${spoof}','2026-09-29')`), /row-level security|check constraint/);
      await assert.rejects(query('truncate diary_entries'), /permission denied/);
    }
    await as('anon');
    for (const sql of ['select * from diary_entries', `insert into diary_entries(owner_id,date) values ('${owner}','2026-09-29')`, "update diary_entries set title='attack'", 'delete from diary_entries', 'truncate diary_entries']) await assert.rejects(query(sql), /permission denied/);
    await as('authenticated', owner);
    assert.equal((await query('select * from diary_entries'))[0].body_markdown, 'Updated');
    await assert.rejects(query(`update diary_entries set owner_id='${stranger}'`), /row-level security|check constraint/);
    await assert.rejects(query("update diary_entries set created_at=now()"), /permission denied/);
    assert.equal((await query('delete from diary_entries returning id')).length, 1);
  } finally { await db.close(); }
});
