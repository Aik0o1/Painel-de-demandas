-- ==============================================================================
-- 106_fix_roles_and_admin_permissions.sql
-- CRITICAL FIX: Standardize Role Names & Power Permissions
-- ==============================================================================

-- 1. STANDARDIZE ROLES (DB Data Fix)
-- The Frontend expects 'MASTER_ADMIN', but DB was setting 'admin_master'.
UPDATE public.profiles
SET role = 'MASTER_ADMIN'
WHERE role = 'admin_master';

-- Also ensure standard users are consistent if needed (optional)
-- UPDATE public.profiles SET role = 'ANALYST' WHERE role = 'user'; 
-- (Keeping 'user' as is if that's the intended default, but verifying Admin is priority)

-- 2. UPDATE TRIGGER to use correct Role Name
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'user'; -- Default role
    v_full_name TEXT;
BEGIN
    -- Master Admin Logic - FIXED ROLE NAME
    IF new.email = 'matheushsc1999@gmail.com' THEN
        v_role := 'MASTER_ADMIN'; 
    END IF;

    v_full_name := COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário');

    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (new.id, new.email, v_full_name, v_role, 'active')
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        -- Don't overwrite existing names unless placeholder
        full_name = CASE 
            WHEN public.profiles.full_name = 'Novo Usuário' THEN EXCLUDED.full_name 
            ELSE public.profiles.full_name 
        END,
        -- Self-healing role for Master
        role = CASE 
            WHEN EXCLUDED.role = 'MASTER_ADMIN' THEN 'MASTER_ADMIN'
            ELSE public.profiles.role 
        END;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. GRANT SUPER ADMIN PERMISSIONS (RLS)
-- Allow MASTER_ADMIN to UPDATE ANY ROW
-- Existing policy "Users can update own profile" handles self-update.
-- We add a new one for Admins.

CREATE POLICY "Master Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( 
  -- Check if the REQUESTING user has role 'MASTER_ADMIN'
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role = 'MASTER_ADMIN'
  )
)
WITH CHECK (
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role = 'MASTER_ADMIN'
  )
);

-- Allow Master Admins to DELETE profiles (if needed)
CREATE POLICY "Master Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING ( 
  exists (
    select 1 from public.profiles
    where id = auth.uid() 
    and role = 'MASTER_ADMIN'
  )
);

-- 4. FORCE REFRESH FOR MASTER
UPDATE public.profiles 
SET role = 'MASTER_ADMIN' 
WHERE email = 'matheushsc1999@gmail.com';
