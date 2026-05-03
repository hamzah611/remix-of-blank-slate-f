## Problem

After a user signs in, they land on `/course-map` and the page hangs on the loading state forever.

Root cause is in `src/pages/CourseMap.tsx` → `loadAll()`:

1. The function has **no try/catch/finally**. If any single query throws (e.g. a network blip, an RLS denial, an unexpected error), the promise rejects and `setLoading(false)` is never called → infinite spinner.
2. It uses `.single()` on `user_xp` and `user_streaks`. For a brand-new user, no row exists yet, so PostgREST returns a `PGRST116` error. While this doesn't throw, combined with no error handling it makes failures silent and hard to debug.
3. There is no defensive timeout — if a request stalls (cold backend, slow first-query after sign-in), the UI just sits there with no recovery path.
4. The `getSession()` call in the first `useEffect` has no error handling either; if it rejects, `userId` is never set and `loadAll` never runs.

A secondary contributor: the auth listener pattern in `Auth.tsx` and `CourseMap.tsx` doesn't gate queries behind a "session restored" flag, which can race on first paint after sign-in.

## Fix

**`src/pages/CourseMap.tsx`**
- Wrap `loadAll` in `try / catch / finally` so `setLoading(false)` always runs.
- Replace `.single()` with `.maybeSingle()` for `user_xp` and `user_streaks` (zero rows is expected for new users).
- Replace `.single()` with `.maybeSingle()` for the `languages` lookup too (defensive).
- On any caught error, fall back to the hardcoded `FALLBACK_UNITS` view so the user sees *something* instead of a spinner, and toast the error.
- Add a 10s timeout race around the whole `loadAll` so a stalled network can't lock the UI.
- Handle errors in the `getSession()` call in the auth-check `useEffect` and redirect to `/auth` on failure.

**`src/pages/Auth.tsx`** (small hardening)
- The existing `onAuthStateChange` + `getSession` pattern is fine, but ensure the redirect to `/course-map` only fires once (guard against double-navigate during the INITIAL_SESSION event).

**Auto-create user_xp / user_streaks rows on signup**
- Extend the existing `handle_new_user()` trigger function to also insert empty rows into `public.user_xp` and `public.user_streaks` for the new user. This eliminates the "missing row" class of bugs entirely going forward.

## Files touched

- `src/pages/CourseMap.tsx` — error handling, `maybeSingle`, timeout, fallback on error
- `src/pages/Auth.tsx` — guard against double redirect
- new migration — extend `handle_new_user()` to seed `user_xp` and `user_streaks`

No schema changes beyond the trigger update; no RLS changes needed.
