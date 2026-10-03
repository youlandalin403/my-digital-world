import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180';
const stranger = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

test('actual migration enforces record and task access in PostgreSQL', async t => {
  const db = new PGlite();
  try {
    // Only Auth infrastructure is stubbed. Tables, functions, grants and RLS are the real migration.
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      insert into auth.users values ('${owner}'), ('${stranger}');
      create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema auth to anon, authenticated;
      grant execute on function auth.uid() to anon, authenticated;`);
    await db.exec(readFileSync(new URL('../migrations/202609280001_observatory_daily.sql', import.meta.url), 'utf8'));
    async function as(role, id = '') {
      await db.exec(`reset role; set role ${role};`);
      await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
    }
    const rows = async sql => (await db.query(sql)).rows;
    await as('authenticated', owner);
    const [today] = await rows(`insert into public.daily_records(owner_id,date,reflection)
      values ('${owner}','2026-09-28','Private reflection') returning *`);
    const [yesterday] = await rows(`insert into public.daily_records(owner_id,date,reflection,visibility)
      values ('${owner}','2026-09-27','Public reflection','public') returning *`);
    const [task] = await rows(`insert into public.daily_tasks(record_id,text) values ('${today.id}','Private task') returning *`);
    const [second] = await rows(`insert into public.daily_tasks(record_id,text,position) values ('${today.id}','Second',1) returning *`);
    const [publicTask] = await rows(`insert into public.daily_tasks(record_id,text) values ('${yesterday.id}','Public task') returning *`);

    await t.test('private default, date uniqueness, validation and confirmed writes', async () => {
      assert.equal(today.visibility, 'private');
      await assert.rejects(rows(`insert into public.daily_records(owner_id,date) values ('${owner}','2026-09-28')`), /unique/);
      await assert.rejects(rows(`insert into public.daily_tasks(record_id,text) values ('${today.id}','  ')`), /check constraint/);
      await assert.rejects(rows(`update public.daily_records set visibility='friends' where id='${today.id}'`), /check constraint/);
      await rows(`update public.daily_tasks set done=true,text='Edited' where id='${task.id}'`);
      const [saved] = await rows(`select * from public.daily_tasks where id='${task.id}'`);
      assert.equal(saved.done, true); assert.equal(saved.text, 'Edited');
      assert.ok(new Date(saved.updated_at) >= new Date(saved.created_at));
      await rows(`update public.daily_records set reflection='Today saved' where id='${today.id}'`);
      assert.equal((await rows(`select reflection from public.daily_records where id='${yesterday.id}'`))[0].reflection, 'Public reflection');
    });
    await t.test('atomic reorder rejects foreign, duplicate and stale lists', async () => {
      await db.query('select public.reorder_daily_tasks($1,$2::uuid[])', [today.id, [second.id, task.id]]);
      assert.deepEqual((await rows(`select id from public.daily_tasks where record_id='${today.id}' order by position`)).map(r => r.id), [second.id, task.id]);
      for (const ids of [[task.id], [task.id, task.id], [task.id, publicTask.id]]) {
        await assert.rejects(db.query('select public.reorder_daily_tasks($1,$2::uuid[])', [today.id, ids]), /Task list changed/);
      }
    });
    await t.test('anonymous direct queries return only public records and tasks; no writes', async () => {
      await as('anon');
      assert.deepEqual((await rows('select id from public.daily_records')).map(r => r.id), [yesterday.id]);
      assert.deepEqual((await rows('select id from public.daily_tasks')).map(r => r.id), [publicTask.id]);
      for (const sql of [
        `insert into public.daily_records(owner_id,date) values ('${owner}','2026-09-29')`,
        `update public.daily_records set reflection='Attack' where id='${yesterday.id}'`,
        `delete from public.daily_records where id='${yesterday.id}'`,
        `insert into public.daily_tasks(record_id,text) values ('${yesterday.id}','Attack')`,
        `update public.daily_tasks set done=true where id='${publicTask.id}'`,
        `delete from public.daily_tasks where id='${publicTask.id}'`,
        `select public.reorder_daily_tasks('${yesterday.id}',array['${publicTask.id}']::uuid[])`
      ]) await assert.rejects(rows(sql), /permission denied/);
    });
    await t.test('another signed-in account cannot impersonate owner or mutate public data', async () => {
      await as('authenticated', stranger);
      assert.equal((await rows('select * from public.daily_records')).length, 1);
      assert.equal((await rows('select * from public.daily_tasks')).length, 1);
      await assert.rejects(rows(`insert into public.daily_records(owner_id,date) values ('${owner}','2026-09-29')`), /row-level security/);
      await assert.rejects(rows(`insert into public.daily_records(owner_id,date) values ('${stranger}','2026-09-29')`), /check constraint/);
      await assert.rejects(rows(`insert into public.daily_tasks(record_id,text) values ('${yesterday.id}','Attack')`), /row-level security/);
      assert.equal((await rows(`update public.daily_records set reflection='Attack' returning id`)).length, 0);
      assert.equal((await rows(`delete from public.daily_records returning id`)).length, 0);
      assert.equal((await rows(`update public.daily_tasks set done=true returning id`)).length, 0);
      assert.equal((await rows(`delete from public.daily_tasks returning id`)).length, 0);
      await assert.rejects(db.query('select public.reorder_daily_tasks($1,$2::uuid[])', [yesterday.id, [publicTask.id]]), /Record unavailable/);
    });
    await t.test('visibility changes apply immediately to child reads and owner can delete', async () => {
      await as('authenticated', owner);
      await assert.rejects(rows(`update public.daily_records set owner_id='${stranger}' where id='${today.id}'`), /row-level security|check constraint/);
      await rows(`update public.daily_records set visibility='private' where id='${yesterday.id}'`);
      await as('anon');
      assert.equal((await rows('select * from public.daily_records')).length, 0);
      assert.equal((await rows('select * from public.daily_tasks')).length, 0);
      await as('authenticated', owner);
      assert.equal((await rows('select * from public.daily_records')).length, 2);
      await rows(`delete from public.daily_tasks where id='${task.id}'`);
      await rows(`delete from public.daily_records where id='${today.id}'`);
      assert.equal((await rows(`select * from public.daily_tasks where record_id='${today.id}'`)).length, 0);
    });
  } finally { await db.close(); }
});
