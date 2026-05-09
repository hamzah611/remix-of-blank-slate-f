-- Ensure the profiles SELECT policy exists (re-add it if it was ever dropped).
-- Without this policy, authenticated users can't read their own plan directly,
-- which causes the frontend to silently fall back to 'free'.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- get_my_plan: SECURITY DEFINER so it bypasses RLS and always returns the
-- correct plan for the calling user, even if direct table access is blocked.
CREATE OR REPLACE FUNCTION public.get_my_plan()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(plan, 'free')
  FROM public.profiles
  WHERE user_id = auth.uid();
$$;
