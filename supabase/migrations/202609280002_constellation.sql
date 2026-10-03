-- REVIEW AND APPLY MANUALLY in Supabase SQL Editor. Not applied by implementation.
-- Reuses the Observatory owner UUID (public configuration, not a credential).
begin;

create table public.constellation_nodes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id)
    check (owner_id = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid),
  name text not null check (length(btrim(name)) between 1 and 160),
  parent_id uuid,
  description text not null default '' check (length(description) <= 2000),
  status text not null default 'curious' check (status in ('curious','exploring','active','deep')),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, id),
  foreign key (owner_id, parent_id) references public.constellation_nodes(owner_id, id) on delete restrict,
  constraint constellation_sibling_order unique (parent_id, sort_order) deferrable initially immediate
);
create unique index constellation_one_root on public.constellation_nodes(owner_id) where parent_id is null;
create index constellation_parent on public.constellation_nodes(parent_id);

alter table public.constellation_nodes enable row level security;
-- Override any project-wide default grants (TRUNCATE is not governed by RLS).
revoke all on public.constellation_nodes from public, anon, authenticated;
grant select on public.constellation_nodes to anon, authenticated;
grant insert, update, delete on public.constellation_nodes to authenticated;
create policy constellation_read on public.constellation_nodes for select to anon, authenticated using (true);
create policy constellation_insert on public.constellation_nodes for insert to authenticated with check (owner_id = (select auth.uid()));
create policy constellation_update on public.constellation_nodes for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy constellation_delete on public.constellation_nodes for delete to authenticated using (owner_id = (select auth.uid()));

-- Serialize ALL writes, including direct PostgREST writes, before integrity checks.
-- READ COMMITTED gives trigger queries a fresh snapshot after a competing writer commits.
-- Reject stale-snapshot isolation instead of allowing concurrent cycle-producing moves.
create function public.constellation_write_lock() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'Constellation writes require READ COMMITTED isolation';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(20260928, 2);
  return null;
end;
$$;
create trigger constellation_lock before insert or update or delete on public.constellation_nodes
for each statement execute function public.constellation_write_lock();

create function public.constellation_integrity() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if TG_OP = 'DELETE' then
    if old.parent_id is null then raise exception 'The root cannot be deleted'; end if;
    if exists(select 1 from public.constellation_nodes where parent_id = old.id) then
      raise exception 'Move or delete the children first';
    end if;
    return old;
  end if;
  if TG_OP = 'UPDATE' then
    if new.id <> old.id or new.owner_id <> old.owner_id or new.created_at <> old.created_at then
      raise exception 'Node identity is immutable';
    end if;
    if old.parent_id is null and new.parent_id is not null then raise exception 'The root cannot be moved'; end if;
    if old.parent_id is not null and new.parent_id is null then raise exception 'Only the root can have no parent'; end if;
    new.updated_at := clock_timestamp();
  end if;
  if new.parent_id is not null then
    if new.parent_id = new.id then raise exception 'Move would create a cycle'; end if;
    if not exists(select 1 from public.constellation_nodes where id = new.parent_id and owner_id = new.owner_id) then
      raise exception 'Parent unavailable';
    end if;
    if exists (
      with recursive ancestors as (
        select id, parent_id from public.constellation_nodes where id = new.parent_id
        union
        select n.id, n.parent_id from public.constellation_nodes n join ancestors a on n.id = a.parent_id
      ) select 1 from ancestors where id = new.id
    ) then raise exception 'Move would create a cycle'; end if;
  end if;
  return new;
end;
$$;
create trigger constellation_guard before insert or update or delete on public.constellation_nodes
for each row execute function public.constellation_integrity();

create function public.add_constellation_node(target_parent uuid, node_name text, node_description text default '', node_status text default 'curious')
returns uuid language plpgsql security invoker set search_path = '' as $$
declare new_id uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(20260928, 2);
  if not exists(select 1 from public.constellation_nodes where id = target_parent and owner_id = auth.uid()) then
    raise exception 'Parent unavailable or owner authentication required';
  end if;
  insert into public.constellation_nodes(owner_id,parent_id,name,description,status,sort_order)
    select auth.uid(), target_parent, node_name, node_description, node_status, coalesce(max(sort_order),-1)+1
    from public.constellation_nodes where parent_id = target_parent returning id into new_id;
  return new_id;
end;
$$;

create function public.move_constellation_node(target_node uuid, target_parent uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare current_parent uuid;
begin
  perform pg_catalog.pg_advisory_xact_lock(20260928, 2);
  select parent_id into current_parent from public.constellation_nodes where id = target_node and owner_id = auth.uid();
  if not found then raise exception 'Node unavailable or owner authentication required'; end if;
  if current_parent is null then raise exception 'The root cannot be moved'; end if;
  if not exists(select 1 from public.constellation_nodes where id = target_parent and owner_id = auth.uid()) then raise exception 'Parent unavailable'; end if;
  if current_parent = target_parent then return; end if;
  -- The integrity trigger also validates direct updates and rejects cycles.
  update public.constellation_nodes set parent_id = target_parent,
    sort_order = (select coalesce(max(sort_order),-1)+1 from public.constellation_nodes where parent_id = target_parent)
    where id = target_node;
end;
$$;

create function public.reorder_constellation_nodes(target_parent uuid, node_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(20260928, 2);
  if not exists(select 1 from public.constellation_nodes where id = target_parent and owner_id = auth.uid()) then raise exception 'Parent unavailable or owner authentication required'; end if;
  if node_ids is null or cardinality(node_ids) <> (select count(*) from public.constellation_nodes where parent_id = target_parent)
    or cardinality(node_ids) <> (select count(distinct id) from unnest(node_ids) t(id))
    or exists(select 1 from unnest(node_ids) t(id) where not exists(select 1 from public.constellation_nodes n where n.id = t.id and n.parent_id = target_parent))
  then raise exception 'Sibling list changed. Reload before reordering.'; end if;
  set constraints public.constellation_sibling_order deferred;
  update public.constellation_nodes n set sort_order = t.ordinality - 1
    from unnest(node_ids) with ordinality t(id, ordinality) where n.id = t.id and n.parent_id = target_parent;
  set constraints public.constellation_sibling_order immediate;
end;
$$;
revoke all on function public.constellation_write_lock(), public.constellation_integrity() from public, anon, authenticated;
revoke all on function public.add_constellation_node(uuid,text,text,text), public.move_constellation_node(uuid,uuid), public.reorder_constellation_nodes(uuid,uuid[]) from public, anon;
grant execute on function public.add_constellation_node(uuid,text,text,text), public.move_constellation_node(uuid,uuid), public.reorder_constellation_nodes(uuid,uuid[]) to authenticated;

-- Canonical seed is inserted below in parent-first order, in this same transaction.

insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000001','4dde6af0-2fd6-4520-86a7-8241acb9c180','MY INTERESTS',null,0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000002','4dde6af0-2fd6-4520-86a7-8241acb9c180','Computing','c0000000-0000-4000-8000-000000000001',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000003','4dde6af0-2fd6-4520-86a7-8241acb9c180','Web & App Development','c0000000-0000-4000-8000-000000000002',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000004','4dde6af0-2fd6-4520-86a7-8241acb9c180','Computer Graphics / 3D','c0000000-0000-4000-8000-000000000002',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000005','4dde6af0-2fd6-4520-86a7-8241acb9c180','Game Development','c0000000-0000-4000-8000-000000000002',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000006','4dde6af0-2fd6-4520-86a7-8241acb9c180','Software Engineering','c0000000-0000-4000-8000-000000000002',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000007','4dde6af0-2fd6-4520-86a7-8241acb9c180','Systems & Infrastructure','c0000000-0000-4000-8000-000000000002',4);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000008','4dde6af0-2fd6-4520-86a7-8241acb9c180','Human-Computer Interaction','c0000000-0000-4000-8000-000000000002',5);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000009','4dde6af0-2fd6-4520-86a7-8241acb9c180','AI','c0000000-0000-4000-8000-000000000001',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000010','4dde6af0-2fd6-4520-86a7-8241acb9c180','Machine Learning / Deep Learning','c0000000-0000-4000-8000-000000000009',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000011','4dde6af0-2fd6-4520-86a7-8241acb9c180','LLM & NLP','c0000000-0000-4000-8000-000000000009',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000012','4dde6af0-2fd6-4520-86a7-8241acb9c180','Agents','c0000000-0000-4000-8000-000000000009',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000013','4dde6af0-2fd6-4520-86a7-8241acb9c180','Multimodal & Generative AI','c0000000-0000-4000-8000-000000000009',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000014','4dde6af0-2fd6-4520-86a7-8241acb9c180','World Models','c0000000-0000-4000-8000-000000000009',4);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000015','4dde6af0-2fd6-4520-86a7-8241acb9c180','Embodied AI','c0000000-0000-4000-8000-000000000009',5);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000016','4dde6af0-2fd6-4520-86a7-8241acb9c180','AI Infra','c0000000-0000-4000-8000-000000000009',6);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000017','4dde6af0-2fd6-4520-86a7-8241acb9c180','English','c0000000-0000-4000-8000-000000000001',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000018','4dde6af0-2fd6-4520-86a7-8241acb9c180','Speaking & Natural Expression','c0000000-0000-4000-8000-000000000017',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000019','4dde6af0-2fd6-4520-86a7-8241acb9c180','Listening','c0000000-0000-4000-8000-000000000017',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000020','4dde6af0-2fd6-4520-86a7-8241acb9c180','Reading in English','c0000000-0000-4000-8000-000000000017',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000021','4dde6af0-2fd6-4520-86a7-8241acb9c180','Writing in English','c0000000-0000-4000-8000-000000000017',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000022','4dde6af0-2fd6-4520-86a7-8241acb9c180','Language & Culture','c0000000-0000-4000-8000-000000000017',4);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000023','4dde6af0-2fd6-4520-86a7-8241acb9c180','Finance','c0000000-0000-4000-8000-000000000001',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000024','4dde6af0-2fd6-4520-86a7-8241acb9c180','Personal Finance','c0000000-0000-4000-8000-000000000023',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000025','4dde6af0-2fd6-4520-86a7-8241acb9c180','Investing','c0000000-0000-4000-8000-000000000023',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000026','4dde6af0-2fd6-4520-86a7-8241acb9c180','Financial Markets','c0000000-0000-4000-8000-000000000023',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000027','4dde6af0-2fd6-4520-86a7-8241acb9c180','Economics','c0000000-0000-4000-8000-000000000023',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000028','4dde6af0-2fd6-4520-86a7-8241acb9c180','Quantitative Finance','c0000000-0000-4000-8000-000000000023',4);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000029','4dde6af0-2fd6-4520-86a7-8241acb9c180','Art & Making','c0000000-0000-4000-8000-000000000001',4);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000030','4dde6af0-2fd6-4520-86a7-8241acb9c180','Digital Painting / 板绘','c0000000-0000-4000-8000-000000000029',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000031','4dde6af0-2fd6-4520-86a7-8241acb9c180','Visual Design','c0000000-0000-4000-8000-000000000029',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000032','4dde6af0-2fd6-4520-86a7-8241acb9c180','Crafts / 手作','c0000000-0000-4000-8000-000000000029',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000033','4dde6af0-2fd6-4520-86a7-8241acb9c180','Crochet / 钩织','c0000000-0000-4000-8000-000000000032',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000034','4dde6af0-2fd6-4520-86a7-8241acb9c180','Writing','c0000000-0000-4000-8000-000000000001',5);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000035','4dde6af0-2fd6-4520-86a7-8241acb9c180','Fiction','c0000000-0000-4000-8000-000000000034',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000036','4dde6af0-2fd6-4520-86a7-8241acb9c180','Character','c0000000-0000-4000-8000-000000000035',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000037','4dde6af0-2fd6-4520-86a7-8241acb9c180','Plot','c0000000-0000-4000-8000-000000000035',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000038','4dde6af0-2fd6-4520-86a7-8241acb9c180','Worldbuilding','c0000000-0000-4000-8000-000000000035',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000039','4dde6af0-2fd6-4520-86a7-8241acb9c180','Essays / Non-fiction','c0000000-0000-4000-8000-000000000034',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000040','4dde6af0-2fd6-4520-86a7-8241acb9c180','Journaling','c0000000-0000-4000-8000-000000000034',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000041','4dde6af0-2fd6-4520-86a7-8241acb9c180','Reading','c0000000-0000-4000-8000-000000000001',6);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000042','4dde6af0-2fd6-4520-86a7-8241acb9c180','Literature & Fiction','c0000000-0000-4000-8000-000000000041',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000043','4dde6af0-2fd6-4520-86a7-8241acb9c180','Philosophy & Ideas','c0000000-0000-4000-8000-000000000041',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000044','4dde6af0-2fd6-4520-86a7-8241acb9c180','History & Society','c0000000-0000-4000-8000-000000000041',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000045','4dde6af0-2fd6-4520-86a7-8241acb9c180','Science & Technology','c0000000-0000-4000-8000-000000000041',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000046','4dde6af0-2fd6-4520-86a7-8241acb9c180','Essays / Biography / Non-fiction','c0000000-0000-4000-8000-000000000041',4);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000047','4dde6af0-2fd6-4520-86a7-8241acb9c180','Music','c0000000-0000-4000-8000-000000000001',7);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000048','4dde6af0-2fd6-4520-86a7-8241acb9c180','Piano','c0000000-0000-4000-8000-000000000047',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000049','4dde6af0-2fd6-4520-86a7-8241acb9c180','Classical Music','c0000000-0000-4000-8000-000000000047',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000050','4dde6af0-2fd6-4520-86a7-8241acb9c180','Music Appreciation','c0000000-0000-4000-8000-000000000049',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000051','4dde6af0-2fd6-4520-86a7-8241acb9c180','Music Theory','c0000000-0000-4000-8000-000000000047',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000052','4dde6af0-2fd6-4520-86a7-8241acb9c180','Film & Television','c0000000-0000-4000-8000-000000000001',8);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000053','4dde6af0-2fd6-4520-86a7-8241acb9c180','Film','c0000000-0000-4000-8000-000000000052',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000054','4dde6af0-2fd6-4520-86a7-8241acb9c180','Television','c0000000-0000-4000-8000-000000000052',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000055','4dde6af0-2fd6-4520-86a7-8241acb9c180','Animation','c0000000-0000-4000-8000-000000000052',2);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000056','4dde6af0-2fd6-4520-86a7-8241acb9c180','Film Appreciation / Criticism','c0000000-0000-4000-8000-000000000052',3);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000057','4dde6af0-2fd6-4520-86a7-8241acb9c180','Games','c0000000-0000-4000-8000-000000000001',9);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000058','4dde6af0-2fd6-4520-86a7-8241acb9c180','Playing / Game Experiences','c0000000-0000-4000-8000-000000000057',0);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000059','4dde6af0-2fd6-4520-86a7-8241acb9c180','Game Design','c0000000-0000-4000-8000-000000000057',1);
insert into public.constellation_nodes(id,owner_id,name,parent_id,sort_order) values ('c0000000-0000-4000-8000-000000000060','4dde6af0-2fd6-4520-86a7-8241acb9c180','Game Art & Worlds','c0000000-0000-4000-8000-000000000057',2);

commit;
