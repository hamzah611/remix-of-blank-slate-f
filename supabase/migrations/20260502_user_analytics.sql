-- user_sessions: tracks time spent per stage visit
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id   uuid REFERENCES public.stages(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at   timestamptz
);
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_sessions_insert" ON public.user_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_sessions_update" ON public.user_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_sessions_select_own" ON public.user_sessions FOR SELECT USING (auth.uid() = user_id);

-- get_user_analytics: SECURITY DEFINER so admin can aggregate across all users
CREATE OR REPLACE FUNCTION public.get_user_analytics()
RETURNS TABLE (
  user_id             uuid,
  display_name        text,
  lessons_completed   bigint,
  total_minutes_spent numeric,
  total_xp            int,
  last_active         timestamptz
)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT
    p.user_id,
    p.display_name,
    COUNT(DISTINCT up.stage_id) FILTER (WHERE up.completed = true) AS lessons_completed,
    ROUND(COALESCE(
      SUM(EXTRACT(EPOCH FROM (us.ended_at - us.started_at)) / 60.0)
        FILTER (WHERE us.ended_at IS NOT NULL), 0
    )::numeric, 1) AS total_minutes_spent,
    COALESCE(ux.total_xp, 0) AS total_xp,
    GREATEST(MAX(up.completed_at), MAX(us.ended_at)) AS last_active
  FROM public.profiles p
  LEFT JOIN public.user_progress up ON up.user_id = p.user_id
  LEFT JOIN public.user_sessions  us ON us.user_id = p.user_id
  LEFT JOIN public.user_xp        ux ON ux.user_id = p.user_id
  GROUP BY p.user_id, p.display_name, ux.total_xp
  ORDER BY lessons_completed DESC, p.display_name;
$$;
