-- ============================================================
-- MIXTURA — Migration schéma v2
-- Exécuter dans Supabase → SQL Editor → Run
-- Idempotent (safe à réexécuter)
-- ============================================================

-- 1. Enum pour le type de recette
do $$ begin
  create type public.recipe_type as enum ('cocktail', 'coffee', 'cuisine');
exception when duplicate_object then null;
end $$;

-- 2. Modifier la table recipes : ajouter type + metadata
alter table public.recipes
  add column if not exists type public.recipe_type not null default 'cocktail',
  add column if not exists metadata jsonb not null default '{}';

-- 3. Modifier profiles : ajouter plan + subscription_id
alter table public.profiles
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro', 'team')),
  add column if not exists subscription_id text;

-- 4. Table teams
create table if not exists public.teams (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid references auth.users on delete cascade not null,
  name       text not null,
  created_at timestamptz default now()
);
create index if not exists idx_teams_owner on public.teams(owner_id);

-- 5. Table team_members
create table if not exists public.team_members (
  team_id   uuid references public.teams(id) on delete cascade not null,
  user_id   uuid references auth.users on delete cascade not null,
  role      text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),
  primary key (team_id, user_id)
);
create index if not exists idx_team_members_user on public.team_members(user_id);

-- 6. RLS sur les nouvelles tables
alter table public.teams        enable row level security;
alter table public.team_members enable row level security;

-- 7. Politiques teams
drop policy if exists "own teams"         on public.teams;
drop policy if exists "member view teams" on public.teams;

create policy "own teams"
  on public.teams for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "member view teams"
  on public.teams for select
  using (
    exists (
      select 1 from public.team_members
      where team_members.team_id = teams.id
        and team_members.user_id = auth.uid()
    )
  );

-- 8. Politiques team_members
drop policy if exists "own membership"    on public.team_members;
drop policy if exists "team owner manage" on public.team_members;

create policy "own membership"
  on public.team_members for select
  using (auth.uid() = user_id);

create policy "team owner manage"
  on public.team_members for all
  using (
    exists (
      select 1 from public.teams
      where teams.id = team_members.team_id
        and teams.owner_id = auth.uid()
    )
  );

-- 9. Lecture croisée équipe : un membre peut lire les recettes du propriétaire de son équipe
drop policy if exists "own recipes"        on public.recipes;
drop policy if exists "team recipe read"   on public.recipes;
drop policy if exists "own recipes write"  on public.recipes;
drop policy if exists "own recipes update" on public.recipes;
drop policy if exists "own recipes delete" on public.recipes;

create policy "team recipe read"
  on public.recipes for select
  using (
    auth.uid() = user_id
    or exists (
      select 1
      from public.team_members tm
      join public.teams t on t.id = tm.team_id
      where tm.user_id = auth.uid()
        and t.owner_id = recipes.user_id
    )
  );

create policy "own recipes write"
  on public.recipes for insert
  with check (auth.uid() = user_id);

create policy "own recipes update"
  on public.recipes for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own recipes delete"
  on public.recipes for delete
  using (auth.uid() = user_id);

-- 10. Mettre à jour le trigger handle_new_user (ajout du plan 'free')
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name, plan)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
