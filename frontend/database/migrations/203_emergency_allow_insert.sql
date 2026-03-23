-- ==============================================================================
-- 203_emergency_allow_insert.sql
-- FIX: Allow Upsert (Insert) for Authenticated Users
-- This fixes the "Update failed" error by allowing the frontend to auto-create the profile.
-- ==============================================================================

-- 1. Create INSERT Policy for Profiles
-- This allows the user to Insert their own profile if it's missing.
DROP POLICY IF EXISTS "User Insert Self" ON public.profiles;
CREATE POLICY "User Insert Self"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- 2. Ensure Update Policy exists
DROP POLICY IF EXISTS "User Update Self" ON public.profiles;
CREATE POLICY "User Update Self"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 3. Ensure Select Policy exists
DROP POLICY IF EXISTS "User View Self" ON public.profiles;
CREATE POLICY "User View Self"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Grant Permissions just in case
GRANT ALL ON public.profiles TO authenticated;

SELECT 'Upsert enabled: Users can now auto-create their profiles.' as result;
