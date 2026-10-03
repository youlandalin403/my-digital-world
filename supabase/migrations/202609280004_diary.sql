-- Generated for review only. Do NOT apply until user confirmation.
-- Reuses the existing Observatory owner UUID (not a secret).
begin;
create table public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade
    check (owner_id = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid),
  date date not null,
  title text not null default '',
  body_markdown text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, date)
);
alter table public.diary_entries enable row level security;
alter table public.diary_entries force row level security;
revoke all on public.diary_entries from public, anon, authenticated;
grant select, delete on public.diary_entries to authenticated;
grant insert (owner_id, date, title, body_markdown), update (owner_id, date, title, body_markdown)
  on public.diary_entries to authenticated;
create policy diary_owner on public.diary_entries for all to authenticated
  using (owner_id = (select auth.uid()) and (select auth.uid()) = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid)
  with check (owner_id = (select auth.uid()) and (select auth.uid()) = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid);
create function public.diary_touch_updated_at() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
create trigger diary_updated_at before update on public.diary_entries
  for each row execute function public.diary_touch_updated_at();
revoke all on function public.diary_touch_updated_at() from public, anon, authenticated;
commit;
