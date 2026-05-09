-- Idempotent: safe to run even if 20260505_user_plans.sql was already run.
-- Ensures the plan column exists, all profiles have a row, and the RPCs are present.

-- 1. Add plan column if it doesn't exist yet
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free'
  CHECK (plan IN ('free', 'premium'));

-- 2. Backfill: create a profiles row for any auth user that somehow has none
INSERT INTO public.profiles (user_id, display_name)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'display_name', split_part(u.email, '@', 1))
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- 3. Re-create get_all_users_for_admin (idempotent)
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

-- 4. Re-create set_user_plan — allow both super_admin and admin roles to upgrade
CREATE OR REPLACE FUNCTION public.set_user_plan(target_user_id uuid, new_plan text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  caller_role text;
BEGIN
  SELECT raw_app_meta_data->>'role'
  INTO caller_role
  FROM auth.users
  WHERE id = auth.uid();

  IF caller_role NOT IN ('super_admin', 'admin') THEN
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
