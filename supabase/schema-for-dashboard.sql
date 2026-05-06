-- הרצה חד־פעמית: Supabase → SQL Editor → הדבקה → Run
-- (תואם ל־migrations/20260507100000_profiles_and_state.sql)

-- פרופיל משתמש + מצב אפליקציה (JSON) + הרשאות RLS + Realtime
-- Authentication → Email: הפעילו; לפיתוח אפשר לכבות Confirm email.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.mom_manager_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.mom_manager_state enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

drop policy if exists "state_select_own" on public.mom_manager_state;
create policy "state_select_own"
  on public.mom_manager_state for select
  using (auth.uid() = user_id);

drop policy if exists "state_insert_own" on public.mom_manager_state;
create policy "state_insert_own"
  on public.mom_manager_state for insert
  with check (auth.uid() = user_id);

drop policy if exists "state_update_own" on public.mom_manager_state;
create policy "state_update_own"
  on public.mom_manager_state for update
  using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do update
    set full_name = coalesce(excluded.full_name, public.profiles.full_name),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Realtime (אם מתקבלת שגיאה שהטבלה כבר בפרסום — אפשר להתעלם)
alter publication supabase_realtime add table public.mom_manager_state;
