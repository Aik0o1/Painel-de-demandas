-- ==============================================================================
-- 202_force_profile_exists.sql
-- EMERGENCY FIX: Upsert the specific user to guarantee row availability
-- ==============================================================================

-- 1. Insert/Update the specific user manually to bypass trigger issues
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
    id, 
    email, 
    'HENRIQUE CARVALHO', -- Name from screenshot
    'MASTER_ADMIN',      -- Grant necessary role
    'active'
FROM auth.users
WHERE email = 'matheushsc1999@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = 'MASTER_ADMIN',
    status = 'active';

-- 2. Verify RLS policy for UPDATE again (Just to be sure)
DROP POLICY IF EXISTS "User Update Self" ON public.profiles;
CREATE POLICY "User Update Self" ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

SELECT 'Profile forced and updated for matheushsc1999@gmail.com' as result;
