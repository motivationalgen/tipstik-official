
-- Function to set a user's tier (admin-only)
CREATE OR REPLACE FUNCTION public.set_user_tier(_user_id uuid, _tier app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can change user tiers';
  END IF;

  -- Validate tier
  IF _tier NOT IN ('member'::app_role, 'pro'::app_role, 'vip'::app_role, 'admin'::app_role, 'user'::app_role) THEN
    RAISE EXCEPTION 'Invalid tier: %', _tier;
  END IF;

  -- Remove existing tier roles for this user (keep only the new one)
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('user'::app_role, 'member'::app_role, 'pro'::app_role, 'vip'::app_role, 'admin'::app_role);

  -- Insert the new tier
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, _tier);
END;
$$;
