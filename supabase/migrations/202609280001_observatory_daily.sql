-- Run this entire file in the Supabase SQL Editor as postgres, once.
-- Owner UUID matches VITE_OBSERVATORY_OWNER_ID; it is not a secret.
begin;

create table public.daily_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade
    check (owner_id = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid),
  date date not null,
  reflection text not null default '',
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, date)
);

create table public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  record_id uuid not null references public.daily_records(id) on delete cascade,
  text text not null check (length(btrim(text)) > 0 and length(text) <= 2000),
  done boolean not null default false,
  position bigint not null default 0 check (position >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index daily_tasks_record_order on public.daily_tasks(record_id, position, id);

create function public.observatory_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.created_at = old.created_at;
  new.updated_at = clock_timestamp();
  return new;
end;
$$;
create trigger daily_records_updated_at before update on public.daily_records
  for each row execute function public.observatory_touch_updated_at();
create trigger daily_tasks_updated_at before update on public.daily_tasks
  for each row execute function public.observatory_touch_updated_at();

alter table public.daily_records enable row level security;
alter table public.daily_records force row level security;
alter table public.daily_tasks enable row level security;
alter table public.daily_tasks force row level security;

revoke all on public.daily_records, public.daily_tasks from public, anon, authenticated;
grant select on public.daily_records, public.daily_tasks to anon, authenticated;
grant insert, update, delete on public.daily_records, public.daily_tasks to authenticated;

create policy daily_records_read on public.daily_records for select to anon, authenticated
  using (visibility = 'public' or owner_id = (select auth.uid()));
create policy daily_records_insert on public.daily_records for insert to authenticated
  with check (owner_id = (select auth.uid()));
create policy daily_records_update on public.daily_records for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy daily_records_delete on public.daily_records for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy daily_tasks_read on public.daily_tasks for select to anon, authenticated
  using (exists (select 1 from public.daily_records r where r.id = record_id
    and (r.visibility = 'public' or r.owner_id = (select auth.uid()))));
create policy daily_tasks_insert on public.daily_tasks for insert to authenticated
  with check (exists (select 1 from public.daily_records r where r.id = record_id
    and r.owner_id = (select auth.uid())));
create policy daily_tasks_update on public.daily_tasks for update to authenticated
  using (exists (select 1 from public.daily_records r where r.id = record_id
    and r.owner_id = (select auth.uid())))
  with check (exists (select 1 from public.daily_records r where r.id = record_id
    and r.owner_id = (select auth.uid())));
create policy daily_tasks_delete on public.daily_tasks for delete to authenticated
  using (exists (select 1 from public.daily_records r where r.id = record_id
    and r.owner_id = (select auth.uid())));

-- Invoker security retains RLS. Reordering is one transaction, never a partial swap.
create function public.reorder_daily_tasks(target_record uuid, task_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform 1 from public.daily_records where id = target_record and owner_id = auth.uid() for update;
  if not found then raise exception 'Record unavailable'; end if;
  if task_ids is null or cardinality(task_ids) <> (
      select count(*) from public.daily_tasks where record_id = target_record)
    or cardinality(task_ids) <> (select count(distinct id) from unnest(task_ids) as t(id))
    or exists (select 1 from unnest(task_ids) as t(id) where not exists (
      select 1 from public.daily_tasks d where d.id = t.id and d.record_id = target_record))
  then raise exception 'Task list changed. Reload before reordering.'; end if;
  update public.daily_tasks d set position = t.ordinality - 1
    from unnest(task_ids) with ordinality as t(id, ordinality)
    where d.id = t.id and d.record_id = target_record;
end;
$$;
revoke all on function public.reorder_daily_tasks(uuid, uuid[]) from public, anon;
grant execute on function public.reorder_daily_tasks(uuid, uuid[]) to authenticated;
revoke all on function public.observatory_touch_updated_at() from public, anon, authenticated;

commit;
