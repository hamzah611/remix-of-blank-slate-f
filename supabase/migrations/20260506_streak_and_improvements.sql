-- Add last_activity to user_streaks so we can track consecutive days
ALTER TABLE public.user_streaks
  ADD COLUMN IF NOT EXISTS last_activity date;

-- update_user_streak: call this whenever a user completes a lesson
-- Handles increment / same-day no-op / streak-break reset
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_last  date;
  v_cur   int;
  v_long  int;
BEGIN
  SELECT last_activity, current_streak, longest_streak
  INTO v_last, v_cur, v_long
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_activity)
    VALUES (p_user_id, 1, 1, CURRENT_DATE)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN;
  END IF;

  -- Already active today — nothing to do
  IF v_last = CURRENT_DATE THEN RETURN; END IF;

  IF v_last = CURRENT_DATE - 1 THEN
    -- Consecutive day: increment
    UPDATE public.user_streaks
    SET current_streak  = v_cur + 1,
        longest_streak  = GREATEST(v_cur + 1, v_long),
        last_activity   = CURRENT_DATE
    WHERE user_id = p_user_id;
  ELSE
    -- Streak broken (or first activity): reset to 1
    UPDATE public.user_streaks
    SET current_streak = 1,
        last_activity  = CURRENT_DATE
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
