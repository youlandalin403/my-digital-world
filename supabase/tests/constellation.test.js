import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180', stranger = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
test('Constellation migration in isolated PostgreSQL (never external Supabase)', async t => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated;
      create schema auth; create table auth.users(id uuid primary key);
      insert into auth.users values ('${owner}'), ('${stranger}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
      alter default privileges in schema public grant all on tables to anon,authenticated;`);
    await db.exec(readFileSync(new URL('../migrations/202609280002_constellation.sql', import.meta.url), 'utf8'));
    const query = async (sql, args) => (await db.query(sql, args)).rows;
    async function as(role, id = '') { await db.exec(`reset role; set role ${role}`); await query("select set_config('request.jwt.claim.sub',$1,false)", [id]); }
    const all = () => query('select * from public.constellation_nodes order by id');
    const seeded = await all(), find = name => seeded.find(row => row.name === name);
    const root = find('MY INTERESTS').id, ai = find('AI').id, agents = find('Agents').id, computing = find('Computing').id;
    await t.test('seed matches canonical fixture exactly and default fields are correct', async () => {
      const fixture = JSON.parse(readFileSync(new URL('../../tests/fixtures/constellation.json', import.meta.url)));
      assert.deepEqual(seeded.map(({ created_at, updated_at, ...row }) => row), fixture);
      assert.equal(seeded.filter(n => n.parent_id === null).length, 1);
      assert.ok(seeded.every(n => n.created_at && n.updated_at));
    });
    await as('authenticated', owner);
    await t.test('owner add/edit, atomic subtree move/reorder, leaf delete', async () => {
      const [{ id }] = await query('select public.add_constellation_node($1,$2) as id', [ai, 'AI Safety']);
      let [row] = await query('select * from public.constellation_nodes where id=$1', [id]);
      assert.equal(row.sort_order, 7); assert.equal(row.status, 'curious');
      await query("update public.constellation_nodes set name='Safety',description='Research',status='active' where id=$1", [id]);
      await query('select public.move_constellation_node($1,$2)', [id, computing]);
      [row] = await query('select * from public.constellation_nodes where id=$1', [id]);
      assert.equal(row.parent_id, computing); assert.equal(row.sort_order, 6); assert.equal(row.description, 'Research');
      const childIds = (await query('select id from public.constellation_nodes where parent_id=$1 order by sort_order desc', [computing])).map(n => n.id);
      await query('select public.reorder_constellation_nodes($1,$2::uuid[])', [computing, childIds]);
      assert.deepEqual((await query('select id from public.constellation_nodes where parent_id=$1 order by sort_order', [computing])).map(n => n.id), childIds);
      const before = await all();
      for (const ids of [childIds.slice(1), [childIds[0], ...childIds.slice(0, -1)], [...childIds.slice(1), agents], null]) {
        await assert.rejects(query('select public.reorder_constellation_nodes($1,$2::uuid[])', [computing, ids]), /Sibling list changed/);
        assert.deepEqual(await all(), before);
      }
      await query('select public.move_constellation_node($1,$2)', [ai, computing]);
      assert.equal((await query('select parent_id from public.constellation_nodes where id=$1', [agents]))[0].parent_id, ai);
      await query('select public.move_constellation_node($1,$2)', [ai, root]);
      await query('delete from public.constellation_nodes where id=$1', [id]);
      assert.equal((await all()).length, 60);
    });
    await t.test('direct writes and RPC cannot break root, ancestry, status, identity or sibling order', async () => {
      const before = await all();
      for (const [sql, args, pattern] of [
        ['delete from public.constellation_nodes where id=$1', [root], /root/],
        ['delete from public.constellation_nodes where id=$1', [ai], /children/],
        ['select public.move_constellation_node($1,$2)', [root, ai], /root/],
        ['select public.move_constellation_node($1,$2)', [ai, agents], /cycle/],
        ['update public.constellation_nodes set parent_id=$2 where id=$1', [ai, agents], /cycle/],
        ['update public.constellation_nodes set parent_id=id where id=$1', [agents], /cycle/],
        ['update public.constellation_nodes set parent_id=$2 where id=$1', [root, ai], /root/],
        ['update public.constellation_nodes set parent_id=null where id=$1', [agents], /root/],
        ["insert into public.constellation_nodes(owner_id,name) values ($1,'Second root')", [owner], /unique/],
        ["insert into public.constellation_nodes(owner_id,name,parent_id,sort_order) values ($1,'Orphan',$2,99)", [owner, stranger], /Parent unavailable/],
        ["update public.constellation_nodes set status='completed' where id=$1", [agents], /check constraint/],
        ["update public.constellation_nodes set name=' ' where id=$1", [agents], /check constraint/],
        ['update public.constellation_nodes set id=$2 where id=$1', [agents, stranger], /identity/],
        ['update public.constellation_nodes set owner_id=$2 where id=$1', [agents, stranger], /identity|row-level security/],
        ['update public.constellation_nodes set sort_order=0 where id=$1', [agents], /unique/],
      ]) await assert.rejects(query(sql, args), pattern);
      assert.deepEqual(await all(), before);
    });
    await t.test('anonymous reads all nodes but direct writes and RPC are denied', async () => {
      await as('anon'); assert.equal((await all()).length, 60);
      for (const sql of [
        `insert into public.constellation_nodes(owner_id,name,parent_id) values ('${owner}','Attack','${ai}')`,
        "update public.constellation_nodes set name='Attack'", 'delete from public.constellation_nodes', 'truncate public.constellation_nodes',
        `select public.add_constellation_node('${ai}','Attack')`,
        `select public.move_constellation_node('${agents}','${computing}')`,
        `select public.reorder_constellation_nodes('${ai}',array[]::uuid[])`,
      ]) await assert.rejects(query(sql), /permission denied/);
    });
    await t.test('non-owner authenticated account cannot write or impersonate owner', async () => {
      await as('authenticated', stranger); assert.equal((await all()).length, 60);
      await assert.rejects(query('truncate public.constellation_nodes'), /permission denied/);
      assert.equal((await query("update public.constellation_nodes set name='Attack' returning id")).length, 0);
      assert.equal((await query('delete from public.constellation_nodes returning id')).length, 0);
      await assert.rejects(query('select public.add_constellation_node($1,$2)', [ai, 'Attack']), /authentication required/);
      await assert.rejects(query('select public.move_constellation_node($1,$2)', [agents, computing]), /authentication required/);
      await assert.rejects(query('select public.reorder_constellation_nodes($1,$2::uuid[])', [ai, []]), /authentication required/);
      await assert.rejects(query("insert into public.constellation_nodes(owner_id,name,parent_id,sort_order) values ($1,'Attack',$2,99)", [owner, ai]), /row-level security/);
      await assert.rejects(query("insert into public.constellation_nodes(owner_id,name) values ($1,'Attack')", [stranger]), /check constraint/);
    });
    await t.test('stale-snapshot isolation is rejected before writes', async () => {
      await as('authenticated', owner);
      await db.exec('begin isolation level repeatable read');
      await assert.rejects(query("update public.constellation_nodes set name='Stale' where id=$1", [agents]), /READ COMMITTED/);
      await db.exec('rollback');
      assert.equal((await query('select name from public.constellation_nodes where id=$1', [agents]))[0].name, 'Agents');
    });
  } finally { await db.close(); }
});
