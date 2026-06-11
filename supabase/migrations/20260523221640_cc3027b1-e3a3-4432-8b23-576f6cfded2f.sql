
create type public.app_role as enum ('lead','student');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role app_role,
  created_at timestamptz not null default now()
);

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  institution text,
  expected_count int not null default 2,
  invite_code text not null unique,
  roster_lock_enabled boolean not null default false,
  identifier_type text default 'roll',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.roster_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  identifier text not null,
  identifier_type text not null default 'roll',
  claimed_by uuid references auth.users(id),
  claimed_at timestamptz,
  unique(class_id, identifier)
);

create table public.class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  identifier text,
  joined_at timestamptz not null default now(),
  unique(class_id, student_id)
);

create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  submitted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique(class_id, student_id)
);

create table public.match_results (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  result_data jsonb not null,
  generated_at timestamptz not null default now(),
  unique(class_id, student_id)
);

-- security definer helpers
create or replace function public.is_class_member(_class_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.class_members where class_id = _class_id and student_id = _user_id);
$$;

create or replace function public.is_class_lead(_class_id uuid, _user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.classes where id = _class_id and lead_id = _user_id);
$$;

-- handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- enable RLS
alter table public.profiles enable row level security;
alter table public.classes enable row level security;
alter table public.roster_entries enable row level security;
alter table public.class_members enable row level security;
alter table public.survey_responses enable row level security;
alter table public.match_results enable row level security;

-- profiles
create policy "profiles self read" on public.profiles for select using (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles read peers in published class" on public.profiles for select using (
  exists (
    select 1 from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.student_id = profiles.id
      and c.is_published = true
      and public.is_class_member(cm.class_id, auth.uid())
  )
);

-- classes
create policy "lead manage classes" on public.classes for all using (auth.uid() = lead_id) with check (auth.uid() = lead_id);
create policy "auth can read classes" on public.classes for select to authenticated using (true);

-- roster_entries
create policy "lead manage roster" on public.roster_entries for all using (public.is_class_lead(class_id, auth.uid())) with check (public.is_class_lead(class_id, auth.uid()));
create policy "auth can read roster" on public.roster_entries for select to authenticated using (true);
create policy "auth can claim roster" on public.roster_entries for update to authenticated using (true) with check (true);

-- class_members
create policy "lead read members" on public.class_members for select using (public.is_class_lead(class_id, auth.uid()));
create policy "student read own membership" on public.class_members for select using (auth.uid() = student_id);
create policy "student read peers when published" on public.class_members for select using (
  exists(select 1 from public.classes c where c.id = class_id and c.is_published = true)
  and public.is_class_member(class_id, auth.uid())
);
create policy "student self insert" on public.class_members for insert to authenticated with check (auth.uid() = student_id);

-- survey_responses
create policy "student own response" on public.survey_responses for all using (auth.uid() = student_id) with check (auth.uid() = student_id);
create policy "lead read responses" on public.survey_responses for select using (public.is_class_lead(class_id, auth.uid()));

-- match_results
create policy "student read own results when published" on public.match_results for select using (
  auth.uid() = student_id
  and exists(select 1 from public.classes c where c.id = class_id and c.is_published = true)
);
create policy "lead read all results" on public.match_results for select using (public.is_class_lead(class_id, auth.uid()));
create policy "lead write results" on public.match_results for all using (public.is_class_lead(class_id, auth.uid())) with check (public.is_class_lead(class_id, auth.uid()));
