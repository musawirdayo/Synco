-- Platform-wide admin control plane.
--
-- Access is intentionally gated by either:
--   1. a row in public.platform_admins, or
--   2. a Supabase Auth JWT app_metadata claim: {"platform_admin": true}
--
-- Do not expose service-role keys to the frontend. All broad reads and destructive
-- controls run through SECURITY DEFINER RPCs that first call admin_assert().

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  note text
);

create table if not exists public.admin_presence (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_seen_at timestamptz not null default now(),
  last_path text not null default '/',
  user_agent text,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb
);

alter table public.platform_admins enable row level security;
alter table public.admin_presence enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.admin_has_platform_access(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    _user_id is not null
    and (
      exists (
        select 1
        from public.platform_admins pa
        where pa.user_id = _user_id
      )
      or exists (
        select 1
        from auth.users au
        where au.id = _user_id
          and lower(coalesce(au.raw_app_meta_data ->> 'platform_admin', 'false')) in ('true', '1', 'yes')
      )
    );
$$;

create or replace function public.is_platform_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select _user_id is not null and _user_id = auth.uid() and public.admin_has_platform_access(_user_id);
$$;

create or replace function public.admin_assert()
returns void
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.admin_has_platform_access(auth.uid()) then
    raise exception 'platform_admin_required' using errcode = '42501';
  end if;
end;
$$;

drop policy if exists "platform admins read platform admins" on public.platform_admins;
create policy "platform admins read platform admins"
on public.platform_admins
for select
to authenticated
using (public.admin_has_platform_access(auth.uid()));

drop policy if exists "platform admins manage platform admins" on public.platform_admins;
create policy "platform admins manage platform admins"
on public.platform_admins
for all
to authenticated
using (public.admin_has_platform_access(auth.uid()))
with check (public.admin_has_platform_access(auth.uid()));

drop policy if exists "users upsert own presence" on public.admin_presence;
create policy "users upsert own presence"
on public.admin_presence
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "users update own presence" on public.admin_presence;
create policy "users update own presence"
on public.admin_presence
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "platform admins read presence" on public.admin_presence;
create policy "platform admins read presence"
on public.admin_presence
for select
to authenticated
using (public.admin_has_platform_access(auth.uid()));

drop policy if exists "platform admins read audit log" on public.admin_audit_log;
create policy "platform admins read audit log"
on public.admin_audit_log
for select
to authenticated
using (public.admin_has_platform_access(auth.uid()));

create or replace function public.record_presence(_path text, _user_agent text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then
    return;
  end if;

  insert into public.admin_presence (user_id, last_seen_at, last_path, user_agent, updated_at)
  values (
    _uid,
    now(),
    left(coalesce(nullif(btrim(_path), ''), '/'), 240),
    nullif(left(coalesce(_user_agent, ''), 240), ''),
    now()
  )
  on conflict (user_id) do update
  set last_seen_at = excluded.last_seen_at,
      last_path = excluded.last_path,
      user_agent = excluded.user_agent,
      updated_at = excluded.updated_at;
end;
$$;

create or replace function public.admin_write_audit(
  _action text,
  _target_type text,
  _target_id uuid default null,
  _details jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), _action, _target_type, _target_id, coalesce(_details, '{}'::jsonb));
end;
$$;

create or replace function public.admin_get_overview()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _active_now jsonb;
  _recent_signups jsonb;
  _recent_classes jsonb;
  _recent_submissions jsonb;
  _recent_audit jsonb;
begin
  perform public.admin_assert();

  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  into _active_now
  from (
    select
      ap.user_id,
      au.email,
      p.full_name,
      p.role,
      ap.last_seen_at,
      ap.last_path
    from public.admin_presence ap
    left join auth.users au on au.id = ap.user_id
    left join public.profiles p on p.id = ap.user_id
    where ap.last_seen_at >= now() - interval '15 minutes'
    order by ap.last_seen_at desc
    limit 25
  ) row_data;

  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  into _recent_signups
  from (
    select
      au.id as user_id,
      au.email,
      au.created_at,
      au.last_sign_in_at,
      p.full_name,
      p.role
    from auth.users au
    left join public.profiles p on p.id = au.id
    order by au.created_at desc
    limit 12
  ) row_data;

  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  into _recent_classes
  from (
    select
      c.id,
      c.name,
      c.institution,
      c.created_at,
      c.is_published,
      c.invite_code,
      c.expected_count,
      lead_profile.full_name as lead_name,
      lead_user.email as lead_email,
      (select count(*) from public.class_members cm where cm.class_id = c.id) as member_count,
      (select count(*) from public.survey_responses sr where sr.class_id = c.id and sr.completed) as completed_count
    from public.classes c
    left join public.profiles lead_profile on lead_profile.id = c.lead_id
    left join auth.users lead_user on lead_user.id = c.lead_id
    order by c.created_at desc
    limit 12
  ) row_data;

  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  into _recent_submissions
  from (
    select
      sr.class_id,
      c.name as class_name,
      sr.student_id,
      cm.display_name,
      u.email,
      sr.completed,
      sr.submitted_at,
      sr.updated_at
    from public.survey_responses sr
    left join public.classes c on c.id = sr.class_id
    left join public.class_members cm on cm.class_id = sr.class_id and cm.student_id = sr.student_id
    left join auth.users u on u.id = sr.student_id
    order by coalesce(sr.submitted_at, sr.updated_at) desc
    limit 12
  ) row_data;

  select coalesce(jsonb_agg(to_jsonb(row_data)), '[]'::jsonb)
  into _recent_audit
  from (
    select
      aal.id,
      aal.created_at,
      aal.action,
      aal.target_type,
      aal.target_id,
      aal.details,
      actor.email as actor_email
    from public.admin_audit_log aal
    left join auth.users actor on actor.id = aal.actor_id
    order by aal.created_at desc
    limit 12
  ) row_data;

  return jsonb_build_object(
    'generated_at', now(),
    'counts', jsonb_build_object(
      'users', (select count(*) from auth.users),
      'profiles', (select count(*) from public.profiles),
      'platform_admins', (select count(*) from public.platform_admins),
      'classes', (select count(*) from public.classes),
      'published_classes', (select count(*) from public.classes where is_published),
      'class_members', (select count(*) from public.class_members),
      'survey_responses', (select count(*) from public.survey_responses),
      'completed_surveys', (select count(*) from public.survey_responses where completed),
      'match_results', (select count(*) from public.match_results),
      'feedback_total', (select count(*) from public.match_results where result_data ? 'feedback_after_week'),
      'feedback_useful', (select count(*) from public.match_results where result_data ->> 'feedback_after_week' = 'Useful'),
      'feedback_unsure', (select count(*) from public.match_results where result_data ->> 'feedback_after_week' = 'Unsure'),
      'feedback_not_useful', (select count(*) from public.match_results where result_data ->> 'feedback_after_week' = 'Not useful'),
      'active_5m', (select count(*) from public.admin_presence where last_seen_at >= now() - interval '5 minutes'),
      'active_15m', (select count(*) from public.admin_presence where last_seen_at >= now() - interval '15 minutes'),
      'active_60m', (select count(*) from public.admin_presence where last_seen_at >= now() - interval '60 minutes')
    ),
    'active_now', _active_now,
    'recent_signups', _recent_signups,
    'recent_classes', _recent_classes,
    'recent_submissions', _recent_submissions,
    'recent_audit', _recent_audit
  );
end;
$$;

create or replace function public.admin_search_users(_query text default '', _limit int default 100)
returns table (
  user_id uuid,
  email text,
  full_name text,
  role public.app_role,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  class_count bigint,
  led_class_count bigint,
  response_count bigint,
  completed_response_count bigint,
  last_seen_at timestamptz,
  last_path text,
  is_admin boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _needle text := lower(btrim(coalesce(_query, '')));
  _safe_limit int := least(greatest(coalesce(_limit, 100), 1), 200);
begin
  perform public.admin_assert();

  return query
  select
    au.id,
    au.email::text,
    p.full_name,
    p.role,
    au.created_at,
    au.last_sign_in_at,
    (select count(*) from public.class_members cm where cm.student_id = au.id),
    (select count(*) from public.classes c where c.lead_id = au.id),
    (select count(*) from public.survey_responses sr where sr.student_id = au.id),
    (select count(*) from public.survey_responses sr where sr.student_id = au.id and sr.completed),
    ap.last_seen_at,
    ap.last_path,
    public.admin_has_platform_access(au.id)
  from auth.users au
  left join public.profiles p on p.id = au.id
  left join public.admin_presence ap on ap.user_id = au.id
  where _needle = ''
    or lower(coalesce(au.email, '') || ' ' || coalesce(p.full_name, '') || ' ' || au.id::text) like '%' || _needle || '%'
  order by coalesce(ap.last_seen_at, au.last_sign_in_at, au.created_at) desc nulls last
  limit _safe_limit;
end;
$$;

create or replace function public.admin_list_classes(_query text default '', _limit int default 100)
returns table (
  class_id uuid,
  name text,
  institution text,
  lead_id uuid,
  lead_name text,
  lead_email text,
  expected_count int,
  invite_code text,
  is_published boolean,
  team_size int,
  created_at timestamptz,
  member_count bigint,
  completed_count bigint,
  result_count bigint,
  feedback_count bigint
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _needle text := lower(btrim(coalesce(_query, '')));
  _safe_limit int := least(greatest(coalesce(_limit, 100), 1), 200);
begin
  perform public.admin_assert();

  return query
  select
    c.id,
    c.name,
    c.institution,
    c.lead_id,
    p.full_name,
    au.email::text,
    c.expected_count,
    c.invite_code,
    c.is_published,
    c.team_size,
    c.created_at,
    (select count(*) from public.class_members cm where cm.class_id = c.id),
    (select count(*) from public.survey_responses sr where sr.class_id = c.id and sr.completed),
    (select count(*) from public.match_results mr where mr.class_id = c.id),
    (select count(*) from public.match_results mr where mr.class_id = c.id and mr.result_data ? 'feedback_after_week')
  from public.classes c
  left join public.profiles p on p.id = c.lead_id
  left join auth.users au on au.id = c.lead_id
  where _needle = ''
    or lower(c.name || ' ' || coalesce(c.institution, '') || ' ' || c.invite_code || ' ' || coalesce(p.full_name, '') || ' ' || coalesce(au.email, '')) like '%' || _needle || '%'
  order by c.created_at desc
  limit _safe_limit;
end;
$$;

create or replace function public.admin_get_user_detail(_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return jsonb_build_object(
    'auth_user', (
      select jsonb_build_object(
        'id', au.id,
        'email', au.email,
        'created_at', au.created_at,
        'email_confirmed_at', au.email_confirmed_at,
        'last_sign_in_at', au.last_sign_in_at,
        'raw_user_meta_data', au.raw_user_meta_data,
        'raw_app_meta_data', au.raw_app_meta_data
      )
      from auth.users au
      where au.id = _user_id
    ),
    'profile', (
      select to_jsonb(p)
      from public.profiles p
      where p.id = _user_id
    ),
    'presence', (
      select to_jsonb(ap)
      from public.admin_presence ap
      where ap.user_id = _user_id
    ),
    'is_platform_admin', public.admin_has_platform_access(_user_id),
    'led_classes', coalesce((
      select jsonb_agg(to_jsonb(row_data))
      from (
        select
          c.*,
          (select count(*) from public.class_members cm where cm.class_id = c.id) as member_count,
          (select count(*) from public.survey_responses sr where sr.class_id = c.id and sr.completed) as completed_count
        from public.classes c
        where c.lead_id = _user_id
        order by c.created_at desc
      ) row_data
    ), '[]'::jsonb),
    'memberships', coalesce((
      select jsonb_agg(to_jsonb(row_data))
      from (
        select cm.*, c.name as class_name, c.is_published, c.invite_code
        from public.class_members cm
        join public.classes c on c.id = cm.class_id
        where cm.student_id = _user_id
        order by cm.joined_at desc
      ) row_data
    ), '[]'::jsonb),
    'survey_responses', coalesce((
      select jsonb_agg(to_jsonb(sr) order by coalesce(sr.submitted_at, sr.updated_at) desc)
      from public.survey_responses sr
      where sr.student_id = _user_id
    ), '[]'::jsonb),
    'match_results', coalesce((
      select jsonb_agg(to_jsonb(mr) order by mr.generated_at desc)
      from public.match_results mr
      where mr.student_id = _user_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_get_class_detail(_class_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  return jsonb_build_object(
    'class', (
      select to_jsonb(c)
      from public.classes c
      where c.id = _class_id
    ),
    'lead', (
      select jsonb_build_object(
        'id', au.id,
        'email', au.email,
        'full_name', p.full_name,
        'role', p.role
      )
      from public.classes c
      left join auth.users au on au.id = c.lead_id
      left join public.profiles p on p.id = c.lead_id
      where c.id = _class_id
    ),
    'members', coalesce((
      select jsonb_agg(to_jsonb(row_data) order by row_data.joined_at desc)
      from (
        select cm.*, au.email, p.full_name, p.role
        from public.class_members cm
        left join auth.users au on au.id = cm.student_id
        left join public.profiles p on p.id = cm.student_id
        where cm.class_id = _class_id
      ) row_data
    ), '[]'::jsonb),
    'roster_entries', coalesce((
      select jsonb_agg(to_jsonb(re) order by re.identifier)
      from public.roster_entries re
      where re.class_id = _class_id
    ), '[]'::jsonb),
    'survey_responses', coalesce((
      select jsonb_agg(to_jsonb(sr) order by coalesce(sr.submitted_at, sr.updated_at) desc)
      from public.survey_responses sr
      where sr.class_id = _class_id
    ), '[]'::jsonb),
    'match_results', coalesce((
      select jsonb_agg(to_jsonb(mr) order by mr.generated_at desc)
      from public.match_results mr
      where mr.class_id = _class_id
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.admin_list_audit_log(_limit int default 60)
returns table (
  id uuid,
  created_at timestamptz,
  actor_id uuid,
  actor_email text,
  action text,
  target_type text,
  target_id uuid,
  details jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  _safe_limit int := least(greatest(coalesce(_limit, 60), 1), 200);
begin
  perform public.admin_assert();

  return query
  select
    aal.id,
    aal.created_at,
    aal.actor_id,
    au.email::text,
    aal.action,
    aal.target_type,
    aal.target_id,
    aal.details
  from public.admin_audit_log aal
  left join auth.users au on au.id = aal.actor_id
  order by aal.created_at desc
  limit _safe_limit;
end;
$$;

create or replace function public.admin_set_user_role(_user_id uuid, _role public.app_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  insert into public.profiles (id, role, full_name)
  values (
    _user_id,
    _role,
    coalesce((select raw_user_meta_data ->> 'full_name' from auth.users where id = _user_id), '')
  )
  on conflict (id) do update
  set role = excluded.role;

  perform public.admin_write_audit(
    'set_user_role',
    'user',
    _user_id,
    jsonb_build_object('role', _role)
  );
end;
$$;

create or replace function public.admin_grant_platform_admin(_user_id uuid, _note text default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  insert into public.platform_admins (user_id, created_by, note)
  values (_user_id, auth.uid(), nullif(btrim(coalesce(_note, '')), ''))
  on conflict (user_id) do update
  set note = excluded.note;

  perform public.admin_write_audit(
    'grant_platform_admin',
    'user',
    _user_id,
    jsonb_build_object('note', nullif(btrim(coalesce(_note, '')), ''))
  );
end;
$$;

create or replace function public.admin_revoke_platform_admin(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.admin_assert();

  if _user_id = auth.uid() and (select count(*) from public.platform_admins) <= 1 then
    raise exception 'cannot_revoke_last_table_admin' using errcode = '42501';
  end if;

  delete from public.platform_admins
  where user_id = _user_id;

  perform public.admin_write_audit('revoke_platform_admin', 'user', _user_id, '{}'::jsonb);
end;
$$;

create or replace function public.admin_delete_class(_class_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _class_name text;
begin
  perform public.admin_assert();

  select name into _class_name from public.classes where id = _class_id;
  if _class_name is null then
    raise exception 'class_not_found' using errcode = 'P0002';
  end if;

  perform public.admin_write_audit(
    'delete_class',
    'class',
    _class_id,
    jsonb_build_object('name', _class_name)
  );

  delete from public.classes
  where id = _class_id;
end;
$$;

create or replace function public.admin_delete_user_account(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _email text;
begin
  perform public.admin_assert();

  if _user_id = auth.uid() then
    raise exception 'cannot_delete_self' using errcode = '42501';
  end if;

  select email into _email from auth.users where id = _user_id;
  if _email is null then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  perform public.admin_write_audit(
    'delete_user_account',
    'user',
    _user_id,
    jsonb_build_object('email', _email)
  );

  delete from auth.users
  where id = _user_id;
end;
$$;

revoke all on function public.admin_has_platform_access(uuid) from public;

revoke all on function public.is_platform_admin(uuid) from public;
grant execute on function public.is_platform_admin(uuid) to authenticated;

revoke all on function public.admin_assert() from public;
revoke all on function public.admin_write_audit(text, text, uuid, jsonb) from public;

revoke all on function public.record_presence(text, text) from public;
grant execute on function public.record_presence(text, text) to authenticated;

revoke all on function public.admin_get_overview() from public;
grant execute on function public.admin_get_overview() to authenticated;

revoke all on function public.admin_search_users(text, int) from public;
grant execute on function public.admin_search_users(text, int) to authenticated;

revoke all on function public.admin_list_classes(text, int) from public;
grant execute on function public.admin_list_classes(text, int) to authenticated;

revoke all on function public.admin_get_user_detail(uuid) from public;
grant execute on function public.admin_get_user_detail(uuid) to authenticated;

revoke all on function public.admin_get_class_detail(uuid) from public;
grant execute on function public.admin_get_class_detail(uuid) to authenticated;

revoke all on function public.admin_list_audit_log(int) from public;
grant execute on function public.admin_list_audit_log(int) to authenticated;

revoke all on function public.admin_set_user_role(uuid, public.app_role) from public;
grant execute on function public.admin_set_user_role(uuid, public.app_role) to authenticated;

revoke all on function public.admin_grant_platform_admin(uuid, text) from public;
grant execute on function public.admin_grant_platform_admin(uuid, text) to authenticated;

revoke all on function public.admin_revoke_platform_admin(uuid) from public;
grant execute on function public.admin_revoke_platform_admin(uuid) to authenticated;

revoke all on function public.admin_delete_class(uuid) from public;
grant execute on function public.admin_delete_class(uuid) to authenticated;

revoke all on function public.admin_delete_user_account(uuid) from public;
grant execute on function public.admin_delete_user_account(uuid) to authenticated;
