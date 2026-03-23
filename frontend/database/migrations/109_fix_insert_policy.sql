-- ==============================================================================
-- 109_fix_insert_policy.sql
-- CRITICAL FIX: Allow Users to INSERT their own profile (Required for UPSERT)
-- ==============================================================================

-- 1. Reset RLS to a clean state avoiding "Nuclear" confusion but ensuring access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Ensure we have the standard policies.
-- We previously focused on UPDATE, but because we switched to UPSERT, 
-- we MUST have an INSERT policy too if the row is missing.

-- DROP existing potentially conflicting policies
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "NUCLEAR ALLOW ALL" ON public.profiles; -- Remove the debug one to be clean

-- 3. CREATE EXPLICIT INSERT POLICY
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK ( auth.uid() = id );

-- 4. RE-ENSURE UPDATE POLICY
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 5. RE-ENSURE SELECT POLICY
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
CREATE POLICY "Authenticated can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- 6. GRANT PERMISSIONS (Just in case)
GRANT INSERT, UPDATE, SELECT ON public.profiles TO authenticated;

SELECT 'Insert policy created successfully' as result;
