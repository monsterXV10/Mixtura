-- ════════════════════════════════════════════════════════════════════
-- MIXTURA — Catalogue public d'ingrédients (option A)
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════

-- 1) Table partagée (sans user_id : visible par tous les users authentifiés)
CREATE TABLE IF NOT EXISTS public.public_ingredients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  category        TEXT,
  brand           TEXT,
  bottle_size_cl  NUMERIC,
  bottle_price    NUMERIC,
  supplier        TEXT,
  data            JSONB DEFAULT '{}'::jsonb,   -- pour subRecipe / isMaison / champs futurs
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche rapide par nom + catégorie
CREATE INDEX IF NOT EXISTS public_ingredients_category_idx ON public.public_ingredients(category);
CREATE INDEX IF NOT EXISTS public_ingredients_name_idx     ON public.public_ingredients(name);

-- 2) RLS : lecture pour tous les users authentifiés, écriture réservée à l'admin
ALTER TABLE public.public_ingredients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anyone_authenticated_can_read" ON public.public_ingredients;
CREATE POLICY "anyone_authenticated_can_read"
  ON public.public_ingredients
  FOR SELECT
  TO authenticated
  USING (true);

-- ⚠️ REMPLACE 'TON_USER_ID_ICI' par ton UUID Supabase (table auth.users)
-- Pour le récupérer :  SELECT id, email FROM auth.users WHERE email = 'ton@email.com';
DROP POLICY IF EXISTS "only_admin_can_write" ON public.public_ingredients;
CREATE POLICY "only_admin_can_write"
  ON public.public_ingredients
  FOR ALL
  TO authenticated
  USING      (auth.uid() = 'TON_USER_ID_ICI'::uuid)
  WITH CHECK (auth.uid() = 'TON_USER_ID_ICI'::uuid);

-- 3) (Optionnel) Quelques ingrédients de démarrage
-- Décommente et adapte si tu veux préseed le catalogue
-- INSERT INTO public.public_ingredients (name, category, brand, bottle_size_cl, bottle_price) VALUES
--   ('Vodka',          'spirits', 'Absolut',        70,  18),
--   ('Gin',            'spirits', 'Bombay Sapphire',70,  22),
--   ('Rhum blanc',     'spirits', 'Bacardi',        70,  16),
--   ('Triple sec',     'liqueur', 'Cointreau',      70,  28),
--   ('Sirop de sucre', 'syrup',   'Monin',          70,   8),
--   ('Citron jaune',   'fresh',   '',                0,   0.5);

-- ════════════════════════════════════════════════════════════════════
-- COMMENT ALIMENTER LE CATALOGUE DEPUIS SUPABASE :
--
-- Méthode 1 (UI) :
--   Table Editor → public_ingredients → Insert row → remplir
--
-- Méthode 2 (SQL en masse) :
--   INSERT INTO public.public_ingredients (name, category, brand, bottle_size_cl, bottle_price)
--   VALUES ('Mon ingrédient', 'spirits', 'Marque', 70, 25);
--
-- Méthode 3 (CSV) :
--   Table Editor → public_ingredients → Import data → CSV
-- ════════════════════════════════════════════════════════════════════
