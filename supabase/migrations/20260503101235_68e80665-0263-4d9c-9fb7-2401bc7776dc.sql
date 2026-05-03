CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (user_id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;

  insert into public.user_xp (user_id, total_xp)
  values (new.id, 0)
  on conflict (user_id) do nothing;

  insert into public.user_streaks (user_id, current_streak, longest_streak)
  values (new.id, 0, 0)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;

-- Ensure unique constraints exist for ON CONFLICT to work
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_xp_user_id_key') THEN
    ALTER TABLE public.user_xp ADD CONSTRAINT user_xp_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_streaks_user_id_key') THEN
    ALTER TABLE public.user_streaks ADD CONSTRAINT user_streaks_user_id_key UNIQUE (user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_user_id_key') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill existing users
INSERT INTO public.user_xp (user_id, total_xp)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.user_streaks (user_id, current_streak, longest_streak)
SELECT id, 0, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;