CREATE OR REPLACE FUNCTION public.promote_admin_by_email(_email text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Only admins can call this
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can promote users';
  END IF;

  -- Find user by email
  SELECT id INTO _user_id FROM auth.users WHERE lower(email) = lower(trim(_email)) LIMIT 1;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'No user found with email: %', _email;
  END IF;

  -- Check if already admin
  IF public.has_role(_user_id, 'admin'::app_role) THEN
    RAISE EXCEPTION 'User is already an admin';
  END IF;

  -- Remove existing tier roles
  DELETE FROM public.user_roles
  WHERE user_id = _user_id
    AND role IN ('user'::app_role, 'member'::app_role, 'pro'::app_role, 'vip'::app_role, 'admin'::app_role);

  -- Insert admin role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin'::app_role);

  RETURN _user_id;
END;
$$;