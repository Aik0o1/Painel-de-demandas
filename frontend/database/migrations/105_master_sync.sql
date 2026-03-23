-- ==============================================================================
-- 105_master_sync.sql
-- MASTER REPAIR: Rebuilds Triggers, Permissions, and Backfills ALL Missing Data
-- ==============================================================================

-- 1. DROP EXISTING HANDLERS (Clean start)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 2. CREATE ROBUST TRIGGER FUNCTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'user';
    v_full_name TEXT;
BEGIN
    -- Master Admin Logic
    IF new.email = 'matheushsc1999@gmail.com' THEN
        v_role := 'admin_master';
    END IF;

    -- Extract full name safely
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário');

    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        status
    )
    VALUES (
        new.id,
        new.email,
        v_full_name,
        v_role,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = CASE 
            WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = 'Novo Usuário' THEN EXCLUDED.full_name 
            ELSE public.profiles.full_name -- Keep existing name if good
        END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. BIND TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. BACKFILL DATA (The Sync)
-- Insert everyone who exists in Auth but missing in Profiles
INSERT INTO public.profiles (id, email, full_name, role, status, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Usuário Recuperado'),
    CASE 
        WHEN email = 'matheushsc1999@gmail.com' THEN 'admin_master'
        ELSE 'user' 
    END,
    'active',
    created_at
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE public.profiles.id = auth.users.id
);

-- 5. REPAIR EXISTENT DATA
-- Fix 'Novo Usuário' or NULL names if real name is in Metadata
UPDATE public.profiles p
SET full_name = au.raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE p.id = au.id
AND (p.full_name IS NULL OR p.full_name = 'Novo Usuário' OR p.full_name = '')
AND au.raw_user_meta_data->>'full_name' IS NOT NULL;

-- 6. REINFORCE PERMISSIONS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to see only basic info (or everything if public team logic applies, but here we keep it simple)
-- DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles; ... (Adjust as needed)
-- Assuming we want authenticated users to see others for the list:
CREATE POLICY "Authenticated can view profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

-- Ensure Update Policy Exists (from previous task)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING ( auth.uid() = id )
WITH CHECK ( auth.uid() = id );

-- 7. CONFIRMATION
SELECT count(*) as total_synced_profiles FROM public.profiles;
