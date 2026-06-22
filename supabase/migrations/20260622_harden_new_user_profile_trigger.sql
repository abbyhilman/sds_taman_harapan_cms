-- Harden auth user trigger so invalid or missing metadata does not block user creation.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
  safe_role public.user_role := 'viewer'::public.user_role;
BEGIN
  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IN ('super_admin', 'admin', 'editor', 'viewer') THEN
    safe_role := requested_role::public.user_role;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    safe_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    updated_at = now();

  RETURN NEW;
END;
$$;
