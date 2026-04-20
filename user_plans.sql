-- ════════════════════════════════════════════════════════════════════
-- MIXTURA — Table user_plans (Phase 1 monétisation)
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════

-- 1) Table user_plans : un plan par utilisateur
CREATE TABLE IF NOT EXISTS public.user_plans (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan                   TEXT NOT NULL DEFAULT 'visitor'   -- visitor | beta | vip
                         CHECK (plan IN ('visitor','beta','vip')),
  status                 TEXT NOT NULL DEFAULT 'active'    -- active | cancelled | past_due | trialing | revoked
                         CHECK (status IN ('active','cancelled','past_due','trialing','revoked')),
  stripe_customer_id     TEXT,                             -- rempli plus tard par le webhook Stripe
  stripe_subscription_id TEXT,
  expires_at             TIMESTAMPTZ,                      -- NULL = pas d'expiration
  notes                  TEXT,                             -- commentaire admin (ex: "Paiement reçu 17/04/26")
  created_at             TIMESTAMPTZ DEFAULT now(),
  updated_at             TIMESTAMPTZ DEFAULT now()
);

-- Index pour recherche par email via auth.users (utile pour l'admin)
CREATE INDEX IF NOT EXISTS user_plans_plan_idx ON public.user_plans(plan);
CREATE INDEX IF NOT EXISTS user_plans_status_idx ON public.user_plans(status);

-- 2) RLS : chaque user lit SON plan uniquement, seul l'admin écrit
ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_reads_own_plan" ON public.user_plans;
CREATE POLICY "user_reads_own_plan"
  ON public.user_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ⚠️ REMPLACE 'TON_USER_ID_ICI' par ton UUID Supabase (celui récupéré via)
--     SELECT id, email FROM auth.users WHERE email = 'monsterxv10@gmail.com';
DROP POLICY IF EXISTS "only_admin_writes_plans" ON public.user_plans;
CREATE POLICY "only_admin_writes_plans"
  ON public.user_plans
  FOR ALL
  TO authenticated
  USING      (auth.uid() = 'TON_USER_ID_ICI'::uuid)
  WITH CHECK (auth.uid() = 'TON_USER_ID_ICI'::uuid);

-- 3) Trigger qui met à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.user_plans_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_plans_updated_at ON public.user_plans;
CREATE TRIGGER user_plans_updated_at
  BEFORE UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.user_plans_set_updated_at();

-- 4) Auto-create : à chaque nouvel user Supabase, on crée son plan 'visitor' par défaut
CREATE OR REPLACE FUNCTION public.create_user_plan_on_signup()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_plans (user_id, plan, status)
  VALUES (NEW.id, 'visitor', 'active')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
CREATE TRIGGER on_auth_user_created_plan
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_user_plan_on_signup();

-- 5) Backfill : créer 'visitor' pour les users déjà existants
INSERT INTO public.user_plans (user_id, plan, status)
SELECT id, 'visitor', 'active' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- 6) (Optionnel) Te donner VIP à toi, l'admin
-- UPDATE public.user_plans
-- SET plan='vip', status='active', notes='admin / fondateur', expires_at=NULL
-- WHERE user_id = 'TON_USER_ID_ICI'::uuid;

-- ════════════════════════════════════════════════════════════════════
-- COMMENT ACTIVER UN CLIENT PAYANT :
--
-- 1) Récupère son user_id :
--    SELECT id, email FROM auth.users WHERE email = 'client@exemple.com';
--
-- 2) Active son plan VIP :
--    UPDATE public.user_plans
--    SET plan='vip', status='active',
--        expires_at = now() + INTERVAL '1 year',   -- ou NULL pour illimité
--        notes = 'Paiement 50€ reçu via Revolut 17/04/2026'
--    WHERE user_id = 'UUID_DU_CLIENT'::uuid;
--
-- 3) Pour révoquer (ex: non-paiement, fin d'abonnement) :
--    UPDATE public.user_plans
--    SET plan='visitor', status='revoked', notes='Abonnement terminé'
--    WHERE user_id = 'UUID_DU_CLIENT'::uuid;
--
-- 4) Pour voir tous les VIP/Beta actifs :
--    SELECT u.email, p.plan, p.status, p.expires_at, p.notes
--    FROM public.user_plans p
--    JOIN auth.users u ON u.id = p.user_id
--    WHERE p.plan IN ('vip','beta') AND p.status='active'
--    ORDER BY p.updated_at DESC;
-- ════════════════════════════════════════════════════════════════════
