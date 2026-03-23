-- EMERGENCY FIX FOR PROFILE UPDATES
-- Run this in Supabase SQL Editor

-- 1. Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop the policy if it exists to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Create the policy explicitly allowing UPDATE for the owner
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 4. Grant necessary permissions (just in case)
GRANT UPDATE ON public.profiles TO authenticated;

-- Confirmation
SELECT 'Policy created successfully' as result;
