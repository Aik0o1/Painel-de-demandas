-- EMERGENCY DEBUG: DISABLE RLS
-- This is to confirm if the issue is strictly Permissions related.
-- Run this, then try to save the profile.

-- 1. Disable Row Level Security on profiles table
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. (Optional) If we really need RLS but want to allow everything:
-- DROP POLICY IF EXISTS "Allow All" ON public.profiles;
-- CREATE POLICY "Allow All" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- But simply disabling it is the fastest test.
