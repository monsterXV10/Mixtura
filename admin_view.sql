-- ════════════════════════════════════════════════════════════════════
-- MIXTURA — Admin view + helper RPCs (Phase 2a)
-- Nécessite : user_plans.sql déjà exécuté.
-- À exécuter dans Supabase → SQL Editor → Run
-- ════════════════════════════════════════════════════════════════════

-- ⚠️ REMPLACE 'TON_USER_ID_ICI' par ton UUID admin (partout dans ce fichier)
--    Récupère-le via :
--    SELECT id, email FROM auth.users WHERE email = 'monsterxv10@gmail.com';

-- 1) VIEW admin_users_plans_v : jointure users + plans, accessible uniquement à l'admin
CREATE OR REPLACE VIEW public.admin_users_plans_v AS
SELECT
  u.id              AS user_id,
  u.email,
  u.created_at      AS signup_at,
  u.last_sign_in_at AS last_login_at,
  COALESCE(p.plan, 'visitor')    AS plan,
  COALESCE(p.status, 'active')   AS status,
  p.expires_at,
  p.stripe_customer_id,
  p.stripe_subscription_id,
  p.notes,
  p.updated_at      AS plan_updated_at
FROM auth.users u
LEFT JOIN public.user_plans p ON p.user_id = u.id;

-- On sécurise l'accès à la view via une fonction SECURITY DEFINER (la view seule ne peut pas avoir de RLS)
-- 2) RPC admin_list_users : liste tous les users + plans, réservée à l'admin
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  signup_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  plan TEXT,
  status TEXT,
  expires_at TIMESTAMPTZ,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  notes TEXT,
  plan_updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> 'TON_USER_ID_ICI'::uuid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
    SELECT
      u.id,
      u.email::text,
      u.created_at,
      u.last_sign_in_at,
      COALESCE(p.plan, 'visitor'),
      COALESCE(p.status, 'active'),
      p.expires_at,
      p.stripe_customer_id,
      p.stripe_subscription_id,
      p.notes,
      p.updated_at
    FROM auth.users u
    LEFT JOIN public.user_plans p ON p.user_id = u.id
    ORDER BY COALESCE(p.updated_at, u.created_at) DESC;
END;
$$ LANGUAGE plpgsql;

-- 3) RPC admin_set_plan : active / met à jour un plan pour un user donné
CREATE OR REPLACE FUNCTION public.admin_set_plan(
  p_user_id   UUID,
  p_plan      TEXT,
  p_status    TEXT DEFAULT 'active',
  p_expires   TIMESTAMPTZ DEFAULT NULL,
  p_notes     TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> 'TON_USER_ID_ICI'::uuid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  IF p_plan NOT IN ('visitor','beta','vip') THEN
    RAISE EXCEPTION 'invalid plan';
  END IF;
  IF p_status NOT IN ('active','cancelled','past_due','trialing','revoked') THEN
    RAISE EXCEPTION 'invalid status';
  END IF;

  INSERT INTO public.user_plans (user_id, plan, status, expires_at, notes)
  VALUES (p_user_id, p_plan, p_status, p_expires, p_notes)
  ON CONFLICT (user_id) DO UPDATE SET
    plan       = EXCLUDED.plan,
    status     = EXCLUDED.status,
    expires_at = EXCLUDED.expires_at,
    notes      = COALESCE(EXCLUDED.notes, public.user_plans.notes),
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 4) RPC admin_revoke : retire VIP/Beta → revient en 'visitor' avec statut 'revoked'
CREATE OR REPLACE FUNCTION public.admin_revoke(
  p_user_id UUID,
  p_notes   TEXT DEFAULT NULL
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> 'TON_USER_ID_ICI'::uuid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  UPDATE public.user_plans
  SET plan='visitor', status='revoked',
      notes = COALESCE(p_notes, notes),
      expires_at = NULL,
      updated_at = now()
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- 5) RPC admin_extend : prolonge l'expiration d'1 an (ou période custom)
CREATE OR REPLACE FUNCTION public.admin_extend(
  p_user_id UUID,
  p_interval TEXT DEFAULT '1 year'
)
RETURNS TIMESTAMPTZ
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_expiry TIMESTAMPTZ;
BEGIN
  IF auth.uid() <> 'TON_USER_ID_ICI'::uuid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  -- base = max(expires_at actuel, now())
  UPDATE public.user_plans
  SET expires_at = GREATEST(COALESCE(expires_at, now()), now()) + p_interval::interval,
      status = 'active',
      updated_at = now()
  WHERE user_id = p_user_id
  RETURNING expires_at INTO new_expiry;
  RETURN new_expiry;
END;
$$ LANGUAGE plpgsql;

-- 6) RPC admin_set_note : modifie juste la note
CREATE OR REPLACE FUNCTION public.admin_set_note(
  p_user_id UUID,
  p_notes   TEXT
)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() <> 'TON_USER_ID_ICI'::uuid THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  INSERT INTO public.user_plans (user_id, notes)
  VALUES (p_user_id, p_notes)
  ON CONFLICT (user_id) DO UPDATE SET
    notes = EXCLUDED.notes,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 7) Grant execute pour les users authentifiés (la vérif admin est DANS la fonction)
GRANT EXECUTE ON FUNCTION public.admin_list_users()               TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(UUID,TEXT,TEXT,TIMESTAMPTZ,TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke(UUID,TEXT)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_extend(UUID,TEXT)          TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_note(UUID,TEXT)        TO authenticated;

-- ════════════════════════════════════════════════════════════════════
-- USAGE (depuis le front, via supabase-js) :
--
--   // Lister tous les users
--   const { data, error } = await _supa.rpc('admin_list_users');
--
--   // Activer VIP 1 an
--   await _supa.rpc('admin_set_plan', {
--     p_user_id: 'uuid_du_client',
--     p_plan: 'vip',
--     p_status: 'active',
--     p_expires: new Date(Date.now()+365*86400000).toISOString(),
--     p_notes: 'Paiement 50€ reçu 18/04/2026'
--   });
--
--   // Révoquer
--   await _supa.rpc('admin_revoke', { p_user_id:'uuid', p_notes:'non-paiement' });
--
--   // Prolonger 1 an
--   await _supa.rpc('admin_extend', { p_user_id:'uuid', p_interval:'1 year' });
--
--   // Modifier note
--   await _supa.rpc('admin_set_note', { p_user_id:'uuid', p_notes:'...' });
-- ════════════════════════════════════════════════════════════════════
