-- ==============================================================================
-- 101_fix_profiles_sync.sql
-- ROBUST SYNC FIX: Ensure columns are nullable/defaulted and Trigger is safe
-- ==============================================================================

-- 1. ENSURE COLUMNS ARE NULLABLE OR HAVE DEFAULTS
-- We explicitly drop NOT NULL constraints on optional fields to prevent insert failures.
-- We also ensure defaults are set for required fields.

DO $$
BEGIN
    -- full_name: Optional
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL';
    
    -- avatar_url: Optional
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN avatar_url DROP NOT NULL';
    
    -- sector_id: Optional (initially null for new users)
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN sector_id DROP NOT NULL';

    -- role: Should have default
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT ''user''';
    
    -- status: Should have default
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN status SET DEFAULT ''active''';
    
    -- must_change_password: Should have default
    EXECUTE 'ALTER TABLE public.profiles ALTER COLUMN must_change_password SET DEFAULT false';

EXCEPTION WHEN OTHERS THEN
    -- Ignore errors if columns don't exist (though they should)
    RAISE NOTICE 'Column alteration skipped or failed: %', SQLERRM;
END $$;

-- 2. UPDATE TRIGGER FUNCTION
-- Re-defining the trigger with explicit column list and robust COALESCE usage.
-- This ensures even if metadata is missing, the insert succeeds.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'user';
    v_full_name TEXT;
    v_sector_id UUID;
BEGIN
    -- 1. Determine Role (Admin Master Protection)
    IF new.email = 'matheushsc1999@gmail.com' THEN
        v_role := 'admin_master';
    END IF;

    -- 2. Safely extract metadata (Check for nulls)
    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário');

    -- 3. Perform Insert
    -- We explicitly insert only the fields we know. 
    -- 'sector_id' is omitted (or set to NULL) to rely on table structure.
    -- 'status' and 'must_change_password' rely on DEFAULTs if omitted, but we set status explicitly.
    
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        role, 
        status,
        sector_id
    )
    VALUES (
        new.id,
        new.email, -- Assumed present from auth.users
        v_full_name,
        v_role,
        'active',
        NULL
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = CASE 
            WHEN public.profiles.role = 'admin_master' THEN 'admin_master' -- Don't downgrade master
            ELSE EXCLUDED.role 
        END;

    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- SAFETY NET: Log error but don't block auth user creation if possible (or block it to prevent inconsistency)
    -- In Supabase, raising generic error blocks the signup.
    RAISE LOG 'Error in handle_new_user: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ENSURE TRIGGER IS LINKED
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. VERIFY/BACKFILL AGAIN (Just in case)
-- Rerun backfill for any users that might have been created while trigger was broken
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
ON CONFLICT (id) DO NOTHING;
