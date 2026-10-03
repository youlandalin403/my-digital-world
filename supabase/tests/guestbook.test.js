import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180', stranger = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('Guestbook actual SQL migration enforces safe submissions and moderation in isolated PostgreSQL', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;`);
    await db.exec(readFileSync(new URL('../migrations/202609280003_guestbook.sql', import.meta.url), 'utf8'));
    const query = async (sql, args) => (await db.query(sql, args)).rows;
    async function as(role, id = '') { await db.exec(`reset role; set role ${role}`); await query("select set_config('request.jwt.claim.sub',$1,false)", [id]); }
    await as('anon');
    const [entry] = await query("insert into public.guestbook_entries(message) values (' Hello ') returning *");
    const [named] = await query("insert into public.guestbook_entries(name,message) values (' Visitor ',' Named message ') returning *");
    await t.test('anonymous and named submissions use database-generated fields and trim content', async () => {
      assert.equal(entry.name, ''); assert.equal(entry.message, 'Hello'); assert.equal(entry.is_hidden, false);
      assert.ok(entry.id && entry.created_at); assert.equal(named.name, 'Visitor');
      for (const message of ['', ' \t\r\n', '\u00a0\u3000\ufeff', 'x'.repeat(2001)]) await assert.rejects(query('insert into public.guestbook_entries(message) values ($1)', [message]), /check constraint|length limit/);
      await assert.rejects(query('insert into public.guestbook_entries(name,message) values ($1,$2)', ['x'.repeat(81), 'Hello']), /length limit/);
      await query('insert into public.guestbook_entries(name,message) values ($1,$2)', ['x'.repeat(80), 'x'.repeat(2000)]);
    });
    await t.test('anon cannot spoof any server field, edit, delete or truncate', async () => {
      for (const sql of [
        "insert into public.guestbook_entries(message,is_hidden) values ('Attack',true)",
        "insert into public.guestbook_entries(message,is_hidden) values ('Attack',false)",
        "insert into public.guestbook_entries(message,created_at) values ('Attack','2000-01-01')",
        `insert into public.guestbook_entries(message,id) values ('Attack','${stranger}')`,
        "update public.guestbook_entries set is_hidden=true", "update public.guestbook_entries set message='Attack'",
        'delete from public.guestbook_entries', 'truncate public.guestbook_entries',
      ]) await assert.rejects(query(sql), /permission denied/);
    });
    await t.test('owner hide/unhide affects public reads; unrelated accounts cannot moderate', async () => {
      await as('authenticated', owner);
      await query('update public.guestbook_entries set is_hidden=true where id=$1', [entry.id]);
      assert.equal((await query('select * from public.guestbook_entries where id=$1', [entry.id]))[0].is_hidden, true);
      await as('anon'); assert.equal((await query('select * from public.guestbook_entries where id=$1', [entry.id])).length, 0);
      await as('authenticated', stranger);
      assert.equal((await query('select * from public.guestbook_entries where id=$1', [entry.id])).length, 0);
      assert.equal((await query('update public.guestbook_entries set is_hidden=true returning id')).length, 0);
      assert.equal((await query('delete from public.guestbook_entries returning id')).length, 0);
      await assert.rejects(query("insert into public.guestbook_entries(message,is_hidden) values ('Attack',true)"), /permission denied/);
      await as('authenticated', owner);
      await query('update public.guestbook_entries set is_hidden=false where id=$1', [entry.id]);
      await as('anon'); assert.equal((await query('select * from public.guestbook_entries where id=$1', [entry.id])).length, 1);
    });
    await t.test('owner can submit and delete but cannot edit content or timestamps', async () => {
      await as('authenticated', owner);
      await query("insert into public.guestbook_entries(message) values ('Owner note')");
      for (const sql of ["update public.guestbook_entries set message='Edited'", "update public.guestbook_entries set name='Edited'", "update public.guestbook_entries set created_at=now()", 'truncate public.guestbook_entries']) await assert.rejects(query(sql), /permission denied/);
      await query('delete from public.guestbook_entries where id=$1', [entry.id]);
      await as('anon'); assert.equal((await query('select * from public.guestbook_entries where id=$1', [entry.id])).length, 0);
      assert.equal((await query('select * from public.guestbook_entries where id=$1', [named.id])).length, 1);
    });
  } finally { await db.close(); }
});
