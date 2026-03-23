-- ==============================================================================
-- 110_strict_rls_fix.sql
-- ARCHITECTURAL FIX: Strict Partial Update Policies
-- ==============================================================================

-- 1. Ensure RLS is Enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Clean up ALL existing policies to ensure no "Nuclear" or "Insert" leaks
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "NUCLEAR ALLOW ALL" ON public.profiles;
DROP POLICY IF EXISTS "Master Admins can update any profile" ON public.profiles;

-- 3. Create SELECT Policy (Read Own)
-- Requirement: "The authenticated user can SELECT their own profile"
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING ( auth.uid() = id );

-- 4. Create UPDATE Policy (Write Own)
-- Requirement: "The authenticated user can UPDATE their own profile"
-- Requirement: "Restrict updates to the user's own row only"
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 5. Explicitly Grant ONLY necessary permissions
-- Requirement: "Explicitly block INSERT and DELETE... for anon/authenticated"
-- We do this by revoking ALL, then Granting only SELECT/UPDATE.
REVOKE ALL ON public.profiles FROM authenticated;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- Service Role always needs full access (for triggers/admin functions)
GRANT ALL ON public.profiles TO service_role;

SELECT 'Strict RLS applied successfully' as result;
