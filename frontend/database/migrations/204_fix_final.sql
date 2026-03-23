-- ==============================================================================
-- 204_fix_final.sql
-- ABSOLUTE FINAL FIX: Reset ALL Policies and Allow Start-to-Finish User Control
-- ==============================================================================

-- 1. Disable RLS temporarily to clear slate
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Drop EVERY existing policy on 'profiles' to avoid conflicts
DROP POLICY IF EXISTS "User Insert Self" ON public.profiles;
DROP POLICY IF EXISTS "User Update Self" ON public.profiles;
DROP POLICY IF EXISTS "User View Self" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin View All" ON public.profiles;
DROP POLICY IF EXISTS "Admin Manage Users" ON public.profiles;
DROP POLICY IF EXISTS "Master Delete Users" ON public.profiles;
DROP POLICY IF EXISTS "Public Read Sectors" ON public.sectors; -- just in case
DROP POLICY IF EXISTS "Admins Manage Sectors" ON public.sectors;

-- 3. Re-Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create UNIFIED Policy for Users (Self-Service)
-- Allows Select, Insert, Update on their own rows.
CREATE POLICY "Users Manage Own Profile"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Create ADMIN Policy
-- Allows Admins to View/Edit others
CREATE POLICY "Admins Manage Others"
ON public.profiles
FOR ALL
TO authenticated
USING (
    exists (select 1 from public.profiles where id = auth.uid() and role IN ('ADMIN', 'MASTER_ADMIN')) 
    AND id != auth.uid()
);

-- 6. Grant Permissions
GRANT ALL ON public.profiles TO authenticated;

SELECT 'Fixed Policies: Users have full control over their own row (Insert/Update/Select)' as result;
