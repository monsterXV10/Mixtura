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
-- PROVIDERS À ACTIVER côté dashboard Supabase :
--   Auth → Providers → Email (Magic Link) : ON
--   Auth → Providers → Google : ON + credentials Google OAuth
--   Auth → URL Configuration → Site URL : https://recalib-six.vercel.app
--   Auth → URL Configuration → Redirect URLs : ajouter
--     https://recalib-six.vercel.app
--     http://localhost:*  (pour dev)
-- ============================================================
