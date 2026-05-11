-- ============================================================
-- MIXTURA — Supabase schema (projet yvwgrgwxnrspimsvjewn)
-- À coller dans Supabase → SQL Editor → Run
-- ============================================================

-- 1. PROFILES (1 ligne par utilisateur auth)
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- 2. INGREDIENTS (blob jsonb par ingrédient)
create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null,
  updated_at timestamptz default now()
);
create index if not exists idx_ingredients_user on public.ingredients(user_id);

-- 3. RECIPES
create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  data jsonb not null,
  updated_at timestamptz default now()
);
create index if not exists idx_recipes_user on public.recipes(user_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- Chaque utilisateur ne voit et ne peut modifier que SES lignes.
-- ============================================================
alter table public.profiles    enable row level security;
alter table public.ingredients enable row level security;
alter table public.recipes     enable row level security;

drop policy if exists "own profile"     on public.profiles;
drop policy if exists "own ingredients" on public.ingredients;
drop policy if exists "own recipes"     on public.recipes;

create policy "own profile"
  on public.profiles
  for all
  using  (auth.uid() = id)
  with check (auth.uid() = id);

create policy "own ingredients"
  on public.ingredients
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "own recipes"
  on public.recipes
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- Trigger : créer la ligne profiles automatiquement à l'inscription
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ÉQUIPE — tables de gestion collaborative
-- ============================================================

-- 4. TEAMS
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique not null,
  owner_id uuid references auth.users on delete cascade not null,
  created_at timestamptz default now()
);
create index if not exists idx_teams_owner on public.teams(owner_id);

-- 5. TEAM_MEMBERS
create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  email text,
  display_name text,
  role text check (role in ('admin','manager','user')) default 'user',
  joined_at timestamptz default now(),
  unique(team_id, user_id)
);
create index if not exists idx_team_members_team on public.team_members(team_id);
create index if not exists idx_team_members_user on public.team_members(user_id);

-- 6. TEAM_INVITATIONS
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams on delete cascade not null,
  email text not null,
  role text check (role in ('admin','manager','user')) default 'user',
  token text unique not null,
  invited_by uuid references auth.users,
  created_at timestamptz default now(),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted boolean default false
);
create index if not exists idx_team_invitations_team on public.team_invitations(team_id);

-- 7. TEAM_SHARED_ITEMS
create table if not exists public.team_shared_items (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams on delete cascade not null,
  shared_by uuid references auth.users on delete cascade not null,
  sharer_name text,
  item_type text check (item_type in ('recipe','ingredient','batch')) not null,
  item_id text,
  share_mode text check (share_mode in ('copy','linked')) default 'copy',
  data jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_shared_items_team on public.team_shared_items(team_id);
create index if not exists idx_shared_items_user on public.team_shared_items(shared_by);

-- 8. TEAM_NOTES
create table if not exists public.team_notes (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  author_name text,
  item_id uuid references public.team_shared_items on delete cascade not null,
  content text not null,
  created_at timestamptz default now()
);
create index if not exists idx_team_notes_item on public.team_notes(item_id);

-- ── RLS équipe ──
alter table public.teams              enable row level security;
alter table public.team_members       enable row level security;
alter table public.team_invitations   enable row level security;
alter table public.team_shared_items  enable row level security;
alter table public.team_notes         enable row level security;

-- teams : owner peut tout, membres peuvent lire, tout auth peut lire pour rejoindre par code
drop policy if exists "team owner all"    on public.teams;
drop policy if exists "team member read"  on public.teams;
drop policy if exists "team public read"  on public.teams;
create policy "team owner all"   on public.teams for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "team member read" on public.teams for select using (
  exists(select 1 from public.team_members m where m.team_id = id and m.user_id = auth.uid())
);
-- Bug fix: tout utilisateur connecté peut chercher une équipe par code (pour rejoindre)
create policy "team public read" on public.teams for select using (auth.uid() is not null);

-- team_members : membres voient leur équipe, admin/owner gèrent
drop policy if exists "member select" on public.team_members;
drop policy if exists "member insert" on public.team_members;
drop policy if exists "member update" on public.team_members;
drop policy if exists "member delete" on public.team_members;
create policy "member select" on public.team_members for select using (
  user_id = auth.uid() or
  exists(select 1 from public.team_members m2 where m2.team_id = team_id and m2.user_id = auth.uid())
);
-- Bug fix: user_id = auth.uid() permet l'auto-insertion (rejoindre par code / accepter invite)
create policy "member insert" on public.team_members for insert with check (
  user_id = auth.uid() or
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('admin','manager'))
);
create policy "member update" on public.team_members for update using (
  exists(select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()) or
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('admin','manager'))
);
create policy "member delete" on public.team_members for delete using (
  user_id = auth.uid() or
  exists(select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()) or
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('admin','manager'))
);

-- team_invitations : membres voient, admin/manager créent, tout auth peut lire par token (pour accepter)
drop policy if exists "invite select"        on public.team_invitations;
drop policy if exists "invite select token"  on public.team_invitations;
drop policy if exists "invite insert"        on public.team_invitations;
drop policy if exists "invite update"        on public.team_invitations;
drop policy if exists "invite delete"        on public.team_invitations;
-- Membres voient les invitations de leur équipe
create policy "invite select" on public.team_invitations for select using (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid())
);
-- L'invité peut voir son invitation (email = son email auth) pour l'accepter via token
create policy "invite select token" on public.team_invitations for select using (
  (auth.jwt()->>'email') = email
);
create policy "invite insert" on public.team_invitations for insert with check (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('admin','manager'))
);
-- L'invité (par email) accepte son invitation, ou admin/manager la gère
create policy "invite update" on public.team_invitations for update using (
  (auth.jwt()->>'email') = email
  or exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('admin','manager'))
);
create policy "invite delete" on public.team_invitations for delete using (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role in ('admin','manager'))
);

-- team_shared_items : membres voient, auteur peut modifier/supprimer
drop policy if exists "shared select" on public.team_shared_items;
drop policy if exists "shared insert" on public.team_shared_items;
drop policy if exists "shared update" on public.team_shared_items;
drop policy if exists "shared delete" on public.team_shared_items;
create policy "shared select" on public.team_shared_items for select using (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid())
);
create policy "shared insert" on public.team_shared_items for insert with check (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid())
);
create policy "shared update" on public.team_shared_items for update using (shared_by = auth.uid());
create policy "shared delete" on public.team_shared_items for delete using (
  shared_by = auth.uid() or
  exists(select 1 from public.teams t where t.id = team_id and t.owner_id = auth.uid()) or
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid() and m.role = 'admin')
);

-- team_notes : membres voient/ajoutent, auteur supprime
drop policy if exists "notes select" on public.team_notes;
drop policy if exists "notes insert" on public.team_notes;
drop policy if exists "notes delete" on public.team_notes;
create policy "notes select" on public.team_notes for select using (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid())
);
create policy "notes insert" on public.team_notes for insert with check (
  exists(select 1 from public.team_members m where m.team_id = team_id and m.user_id = auth.uid())
);
create policy "notes delete" on public.team_notes for delete using (user_id = auth.uid());

-- ============================================================
-- PROVIDERS À ACTIVER côté dashboard Supabase :
--   Auth → Providers → Email (Magic Link) : ON
--   Auth → Providers → Google : ON + credentials Google OAuth
--   Auth → URL Configuration → Site URL : https://recalib-six.vercel.app
--   Auth → URL Configuration → Redirect URLs : ajouter
--     https://recalib-six.vercel.app
--     http://localhost:*  (pour dev)
-- ============================================================
