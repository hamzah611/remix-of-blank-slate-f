-- Add plan column to profiles (free | premium)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'premium'));

-- get_all_users_for_admin: returns every user with their plan for the Approvals page
CREATE OR REPLACE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE (
  user_id      uuid,
  display_name text,
  email        text,
  plan         text,
  created_at   timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.user_id,
    p.display_name,
    u.email,
    p.plan,
    u.created_at
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.user_id
  ORDER BY u.created_at DESC;
$$;

-- set_user_plan: super_admin-only RPC to change a user's plan
CREATE OR REPLACE FUNCTION public.set_user_plan(target_user_id uuid, new_plan text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_role text;
BEGIN
  -- Only super_admin may call this
  SELECT raw_app_meta_data->>'role'
  INTO caller_role
  FROM auth.users
  WHERE id = auth.uid();

  IF caller_role IS DISTINCT FROM 'super_admin' THEN
    RAISE EXCEPTION 'Insufficient privileges';
  END IF;

  IF new_plan NOT IN ('free', 'premium') THEN
    RAISE EXCEPTION 'Invalid plan value';
  END IF;

  UPDATE public.profiles
  SET plan = new_plan
  WHERE user_id = target_user_id;
END;
$$;
