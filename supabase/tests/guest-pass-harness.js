import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
export const owner = '4dde6af0-2fd6-4520-86a7-8241acb9c180';
export const migration = readFileSync(new URL('../migrations/202610030001_room_guest_pass.sql', import.meta.url), 'utf8');
export async function guestPassDatabase() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    insert into auth.users values ('${owner}');
    alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
    alter default privileges in schema public grant execute on functions to anon, authenticated;`);
  await db.exec(migration);
  const rpc = async (name, args = {}) => {
    const values = Object.values(args);
    const result = await db.query(`select public.${name}(${values.map((_, i) => `$${i + 1}`).join(',')}) as result`, values);
    return result.rows[0].result;
  };
  return { db, rpc };
}
