
-- 1) Webhook event idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  event_id TEXT PRIMARY KEY,
  provider TEXT NOT NULL DEFAULT 'stripe',
  event_type TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT ALL ON public.webhook_events TO service_role;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
-- No policies: service role only.

-- 2) Ensure subscriptions has unique(stripe_subscription_id) for safe upserts (already unique per schema, but idempotent guard)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_stripe_subscription_id_key'
  ) THEN
    ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id);
  END IF;
END $$;

-- 3) Welcome bonus transactional RPC
CREATE OR REPLACE FUNCTION public.grant_welcome_bonus(
  _subscription_id TEXT,
  _env TEXT,
  _bonus INT
) RETURNS TABLE(user_id UUID, display_name TEXT, granted BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_display_name TEXT;
BEGIN
  -- Atomically claim
  UPDATE public.subscriptions
     SET welcome_bonus_granted = TRUE, updated_at = now()
   WHERE stripe_subscription_id = _subscription_id
     AND environment = _env
     AND welcome_bonus_granted = FALSE
   RETURNING subscriptions.user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, NULL::TEXT, FALSE;
    RETURN;
  END IF;

  UPDATE public.profiles
     SET total_xp = COALESCE(total_xp, 0) + _bonus,
         updated_at = now()
   WHERE id = v_user_id
   RETURNING profiles.display_name INTO v_display_name;

  RETURN QUERY SELECT v_user_id, v_display_name, TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.grant_welcome_bonus(TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_welcome_bonus(TEXT, TEXT, INT) TO service_role;

-- 4) Team tables
CREATE TABLE IF NOT EXISTS public.team_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  seats INT NOT NULL DEFAULT 1 CHECK (seats >= 1),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_team_subs_owner ON public.team_subscriptions(owner_user_id);
GRANT SELECT ON public.team_subscriptions TO authenticated;
GRANT ALL ON public.team_subscriptions TO service_role;
ALTER TABLE public.team_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own team subscription"
  ON public.team_subscriptions FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.team_subscriptions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  invite_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','accepted','revoked')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  UNIQUE (team_id, invited_email)
);
CREATE INDEX IF NOT EXISTS idx_team_memberships_team ON public.team_memberships(team_id);
CREATE INDEX IF NOT EXISTS idx_team_memberships_user ON public.team_memberships(user_id);
GRANT SELECT ON public.team_memberships TO authenticated;
GRANT ALL ON public.team_memberships TO service_role;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;

-- Security-definer helpers to avoid recursive RLS between team tables
CREATE OR REPLACE FUNCTION public.is_team_owner(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_subscriptions WHERE id = _team_id AND owner_user_id = _user_id);
$$;

CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.team_memberships WHERE team_id = _team_id AND user_id = _user_id AND status = 'accepted');
$$;

CREATE POLICY "Members can view own memberships"
  ON public.team_memberships FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_team_owner(team_id, auth.uid())
  );

-- Active team access resolver (owner + accepted members)
CREATE OR REPLACE FUNCTION public.user_has_active_team(_user_id UUID, _env TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_subscriptions ts
    WHERE ts.environment = _env
      AND ts.status IN ('active','trialing')
      AND (ts.current_period_end IS NULL OR ts.current_period_end > now())
      AND (
        ts.owner_user_id = _user_id
        OR EXISTS (
          SELECT 1 FROM public.team_memberships tm
          WHERE tm.team_id = ts.id
            AND tm.user_id = _user_id
            AND tm.status = 'accepted'
        )
      )
  );
$$;

-- Accept invite RPC (called by authenticated user with the token)
CREATE OR REPLACE FUNCTION public.accept_team_invite(_token UUID)
RETURNS TABLE(team_id UUID, accepted BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_membership_team UUID;
  v_seats INT;
  v_used INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

  -- Find the pending invite matching this token AND this email (case-insensitive)
  SELECT tm.team_id INTO v_membership_team
  FROM public.team_memberships tm
  WHERE tm.invite_token = _token
    AND tm.status = 'invited'
    AND lower(tm.invited_email) = lower(v_email)
  LIMIT 1;

  IF v_membership_team IS NULL THEN
    RETURN QUERY SELECT NULL::UUID, FALSE;
    RETURN;
  END IF;

  -- Enforce seat cap: owner + accepted members < seats
  SELECT seats INTO v_seats FROM public.team_subscriptions WHERE id = v_membership_team;
  SELECT COUNT(*) INTO v_used FROM public.team_memberships
    WHERE team_id = v_membership_team AND status = 'accepted';
  IF (v_used + 1) > v_seats THEN
    RAISE EXCEPTION 'Team is full';
  END IF;

  UPDATE public.team_memberships
     SET user_id = v_uid, status = 'accepted', accepted_at = now()
   WHERE invite_token = _token
     AND status = 'invited';

  RETURN QUERY SELECT v_membership_team, TRUE;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_team_invite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.accept_team_invite(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_active_team(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_owner(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_team_member(UUID, UUID) TO authenticated, service_role;

-- updated_at trigger for team_subscriptions
DROP TRIGGER IF EXISTS trg_team_subscriptions_updated_at ON public.team_subscriptions;
CREATE TRIGGER trg_team_subscriptions_updated_at
BEFORE UPDATE ON public.team_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
