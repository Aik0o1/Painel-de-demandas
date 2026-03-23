-- 108_nuclear_permissions.sql
-- "MODO DEUS": Libera tudo para usuários autenticados na tabela profiles.
-- Use isso para garantir que o erro não é permissão.

-- 1. Reset RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop all restrictive policies
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Master Admins can update any profile" ON public.profiles;

-- 3. Create "ALLOW ALL" Policy for Authenticated Users
-- Warning: This allows any logged-in user to Edit/Delete ANY profile.
-- Use only for debugging or if you are the only user.
CREATE POLICY "NUCLEAR ALLOW ALL"
ON public.profiles
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Grant All Privileges
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

SELECT 'Nuclear permissions applied' as status;
