
-- Promote three users to super_admin
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb)
  || jsonb_build_object('role', 'super_admin', 'is_admin', true)
WHERE email IN ('aleena.sangi@gmail.com','hammadag9@gmail.com','hamzahag41@gmail.com');

INSERT INTO public.admin_users (user_id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email IN ('aleena.sangi@gmail.com','hammadag9@gmail.com','hamzahag41@gmail.com')
ON CONFLICT DO NOTHING;

UPDATE public.profiles
SET is_admin = true
WHERE user_id IN (
  SELECT id FROM auth.users
  WHERE email IN ('aleena.sangi@gmail.com','hammadag9@gmail.com','hamzahag41@gmail.com')
);
