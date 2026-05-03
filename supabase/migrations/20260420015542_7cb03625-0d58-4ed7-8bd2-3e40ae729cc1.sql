-- Add tier expiration to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tier_expires_at timestamptz;

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tier app_role NOT NULL,
  amount integer NOT NULL,
  reference text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER set_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Activate paid tier for N days
CREATE OR REPLACE FUNCTION public.activate_paid_tier(_user_id uuid, _tier app_role, _days int)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF _tier NOT IN ('pro'::app_role, 'vip'::app_role) THEN
    RAISE EXCEPTION 'Invalid paid tier: %', _tier;
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('user'::app_role, 'member'::app_role, 'pro'::app_role, 'vip'::app_role);

  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _tier);

  UPDATE public.profiles
  SET tier_expires_at = now() + (_days || ' days')::interval
  WHERE id = _user_id;
END;
$$;

-- Expire lapsed tiers (called by cron)
CREATE OR REPLACE FUNCTION public.expire_lapsed_tiers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Downgrade roles for expired users
  DELETE FROM public.user_roles
  WHERE role IN ('pro'::app_role, 'vip'::app_role)
    AND user_id IN (
      SELECT id FROM public.profiles
      WHERE tier_expires_at IS NOT NULL AND tier_expires_at < now()
    );

  -- Add member role for those who don't already have admin/member
  INSERT INTO public.user_roles (user_id, role)
  SELECT p.id, 'member'::app_role
  FROM public.profiles p
  WHERE p.tier_expires_at IS NOT NULL
    AND p.tier_expires_at < now()
    AND NOT EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = p.id
        AND ur.role IN ('admin'::app_role, 'member'::app_role)
    );

  -- Clear timestamp
  UPDATE public.profiles
  SET tier_expires_at = NULL
  WHERE tier_expires_at IS NOT NULL AND tier_expires_at < now();
END;
$$;

-- Schedule daily expiry
CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
  'expire-lapsed-tiers-daily',
  '0 * * * *',
  $$ SELECT public.expire_lapsed_tiers(); $$
);