-- REVIEW ONLY: no remote application authorized.
begin;
create table public.room_invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text unique not null check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id)
    check (created_by = '4dde6af0-2fd6-4520-86a7-8241acb9c180'::uuid),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  used_at timestamptz,
  revoked_at timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '7 days')
);
create table public.room_visit_sessions (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid unique not null references public.room_invitations(id),
  session_hash text unique not null check (session_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  check (expires_at > created_at and expires_at <= created_at + interval '4 hours')
);
create index room_invitations_expiry on public.room_invitations(expires_at);
create index room_visit_sessions_expiry on public.room_visit_sessions(expires_at);
alter table public.room_invitations enable row level security;
alter table public.room_invitations force row level security;
alter table public.room_visit_sessions enable row level security;
alter table public.room_visit_sessions force row level security;
-- No client policies, including for the owner. Trusted access uses narrow RPCs.
revoke all on public.room_invitations, public.room_visit_sessions from public, anon, authenticated, service_role;

create function public.room_create_invitation(p_token_hash text, p_owner uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.room_invitations; t timestamptz := clock_timestamp();
begin
  insert into public.room_invitations(token_hash, created_by, created_at, expires_at)
    values (p_token_hash, p_owner, t, t + interval '7 days') returning * into v;
  return jsonb_build_object('id', v.id, 'created_at', v.created_at, 'expires_at', v.expires_at);
end;
$$;

create function public.room_redeem_invitation(p_token_hash text, p_session_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.room_invitations; t timestamptz; expiry timestamptz;
begin
  select * into v from public.room_invitations where token_hash = p_token_hash for update;
  -- Read wall clock AFTER acquiring the lock; a waiting request cannot use stale time.
  t := clock_timestamp();
  if not found then return jsonb_build_object('status', 'unavailable'); end if;
  if v.used_at is not null then return jsonb_build_object('status', 'already_used'); end if;
  if v.revoked_at is not null then return jsonb_build_object('status', 'unavailable'); end if;
  if v.expires_at <= t then return jsonb_build_object('status', 'expired'); end if;
  expiry := t + interval '4 hours';
  update public.room_invitations set used_at = t where id = v.id;
  insert into public.room_visit_sessions(invitation_id, session_hash, created_at, expires_at)
    values (v.id, p_session_hash, t, expiry);
  return jsonb_build_object('status', 'ok', 'expires_at', expiry);
end;
$$;

create function public.room_validate_session(p_session_hash text) returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce((select jsonb_build_object('valid', true, 'expires_at', expires_at)
    from public.room_visit_sessions where session_hash = p_session_hash
    and revoked_at is null and expires_at > clock_timestamp()), jsonb_build_object('valid', false));
$$;

create function public.room_revoke_session(p_session_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  update public.room_visit_sessions set revoked_at = clock_timestamp()
    where session_hash = p_session_hash and revoked_at is null;
  return jsonb_build_object('ok', true);
end;
$$;

create function public.room_revoke_invitation(p_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  -- This UPDATE takes the same row lock as redemption. Used passes stay used.
  update public.room_invitations set revoked_at = clock_timestamp()
    where id = p_id and used_at is null and revoked_at is null;
  return jsonb_build_object('ok', true);
end;
$$;

create function public.room_list_invitations() returns jsonb
language sql security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'created_at', created_at,
    'expires_at', expires_at, 'status', case when used_at is not null then 'used'
    when revoked_at is not null then 'revoked' when expires_at <= clock_timestamp() then 'expired'
    else 'unused' end) order by created_at desc), '[]'::jsonb)
  from (select * from public.room_invitations order by created_at desc limit 100) recent;
$$;

revoke all on function public.room_create_invitation(text, uuid), public.room_redeem_invitation(text, text),
  public.room_validate_session(text), public.room_revoke_session(text), public.room_revoke_invitation(uuid),
  public.room_list_invitations() from public, anon, authenticated;
grant execute on function public.room_create_invitation(text, uuid), public.room_redeem_invitation(text, text),
  public.room_validate_session(text), public.room_revoke_session(text), public.room_revoke_invitation(uuid),
  public.room_list_invitations() to service_role;
commit;
