-- Review and apply manually. This migration has NOT been applied externally.
-- Owner UUID reuses Observatory configuration; it is not a secret.
begin;
create table public.guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null default '' check (char_length(name) <= 80),
  message text not null check (char_length(message) <= 2000 and message !~ '^[[:space:]]*$'),
  is_hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index guestbook_recent on public.guestbook_entries(created_at desc, id desc);
alter table public.guestbook_entries enable row level security;
-- Remove project default privileges, especially TRUNCATE (which bypasses RLS).
revoke all on public.guestbook_entries from public, anon, authenticated;
grant select on public.guestbook_entries to anon, authenticated;
-- Column grants are the narrow public submission API. No definer function needed.
-- Clients can never supply id, is_hidden or created_at, even at insert time.
grant insert (name, message) on public.guestbook_entries to anon, authenticated;
grant update (is_hidden) on public.guestbook_entries to authenticated;
grant delete on public.guestbook_entries to authenticated;
create policy guestbook_read on public.guestbook_entries for select to anon, authenticated
  using (not is_hidden or (select auth.uid()) = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid);
create policy guestbook_submit on public.guestbook_entries for insert to anon, authenticated
  with check (is_hidden = false);
create policy guestbook_moderate on public.guestbook_entries for update to authenticated
  using ((select auth.uid()) = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid)
  with check ((select auth.uid()) = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid);
create policy guestbook_delete on public.guestbook_entries for delete to authenticated
  using ((select auth.uid()) = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid);

-- Trim the same whitespace set as JavaScript String.trim(), including Unicode.
create function public.guestbook_trim_submission() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare whitespace text := E' \t\n\r\f\v' || U&'\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF';
begin
  -- Validate raw lengths too: padding must not bypass submission limits.
  if char_length(new.name) > 80 or char_length(new.message) > 2000 then raise exception 'Guestbook length limit exceeded'; end if;
  new.name := btrim(new.name, whitespace);
  new.message := btrim(new.message, whitespace);
  return new;
end;
$$;
create trigger guestbook_trim before insert on public.guestbook_entries
  for each row execute function public.guestbook_trim_submission();
revoke all on function public.guestbook_trim_submission() from public, anon, authenticated;
commit;
