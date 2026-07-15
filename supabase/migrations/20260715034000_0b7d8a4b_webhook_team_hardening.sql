ALTER TABLE public.webhook_events
  ADD COLUMN IF NOT EXISTS processing_state TEXT NOT NULL DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS error_message TEXT,
  ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

UPDATE public.webhook_events
SET
  processing_state = 'completed',
  attempted_at = COALESCE(attempted_at, received_at, now()),
  completed_at = COALESCE(completed_at, received_at, now())
WHERE processing_state IS NULL OR processing_state NOT IN ('pending', 'completed', 'failed');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'webhook_events_processing_state_check'
  ) THEN
    ALTER TABLE public.webhook_events
      ADD CONSTRAINT webhook_events_processing_state_check
      CHECK (processing_state IN ('pending', 'completed', 'failed'));
  END IF;
END $$;

UPDATE public.team_subscriptions
SET status = CASE
  WHEN status IN ('active', 'trialing', 'past_due', 'canceled') THEN status
  ELSE 'canceled'
END;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'team_subscriptions_status_check'
  ) THEN
    ALTER TABLE public.team_subscriptions
      ADD CONSTRAINT team_subscriptions_status_check
      CHECK (status IN ('active', 'trialing', 'past_due', 'canceled'));
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.enforce_team_member_seat_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_team_id UUID := COALESCE(NEW.team_id, OLD.team_id);
  v_seats INT;
  v_reserved INT;
BEGIN
  IF v_team_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT seats INTO v_seats
  FROM public.team_subscriptions
  WHERE id = v_team_id;

  IF v_seats IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COUNT(*) INTO v_reserved
  FROM public.team_memberships
  WHERE team_id = v_team_id
    AND status IN ('invited', 'accepted');

  IF v_reserved > GREATEST(v_seats - 1, 0) THEN
    RAISE EXCEPTION 'Team seat limit exceeded';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_team_memberships_seat_limit ON public.team_memberships;
CREATE CONSTRAINT TRIGGER trg_team_memberships_seat_limit
AFTER INSERT OR UPDATE OR DELETE ON public.team_memberships
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION public.enforce_team_member_seat_limit();

DROP TRIGGER IF EXISTS trg_team_subscriptions_seat_limit ON public.team_subscriptions;
CREATE CONSTRAINT TRIGGER trg_team_subscriptions_seat_limit
AFTER UPDATE OF seats ON public.team_subscriptions
DEFERRABLE INITIALLY IMMEDIATE
FOR EACH ROW
EXECUTE FUNCTION public.enforce_team_member_seat_limit();

CREATE OR REPLACE FUNCTION public.has_active_subscription(
  user_uuid uuid,
  check_env text DEFAULT 'live'
) RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = user_uuid
      AND environment = check_env
      AND (
        (status IN ('active', 'trialing', 'past_due') AND (current_period_end IS NULL OR current_period_end > now()))
        OR (status = 'canceled' AND current_period_end > now())
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.user_has_active_team(_user_id UUID, _env TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_subscriptions ts
    WHERE ts.environment = _env
      AND (
        (ts.status IN ('active', 'trialing', 'past_due') AND (ts.current_period_end IS NULL OR ts.current_period_end > now()))
        OR (ts.status = 'canceled' AND ts.current_period_end > now())
      )
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

CREATE OR REPLACE FUNCTION public.accept_team_invite(_token UUID)
RETURNS TABLE(team_id UUID, accepted BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_email TEXT;
  v_membership_team UUID;
  v_seats INT;
  v_reserved INT;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;

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

  SELECT seats INTO v_seats FROM public.team_subscriptions WHERE id = v_membership_team;
  SELECT COUNT(*) INTO v_reserved
  FROM public.team_memberships
  WHERE team_id = v_membership_team
    AND status IN ('invited', 'accepted')
    AND invite_token <> _token;

  IF v_reserved >= GREATEST(v_seats - 1, 0) THEN
    RAISE EXCEPTION 'Team is full';
  END IF;

  UPDATE public.team_memberships
     SET user_id = v_uid, status = 'accepted', accepted_at = now()
   WHERE invite_token = _token
     AND status = 'invited';

  RETURN QUERY SELECT v_membership_team, TRUE;
END;
$$;
