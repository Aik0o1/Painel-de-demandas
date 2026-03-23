-- ==============================================================================
-- 200_final_architecture_fix.sql
-- COMPREHENSIVE REPAIR: Tables, Sync, RLS, Audit
-- ==============================================================================

-- 0. PRE-FLIGHT CLEANUP (Safety first)
-- We do NOT drop tables to preserve data, but we reset policies and triggers.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TRIGGER IF EXISTS audit_profiles_changes ON public.profiles;

-- ==============================================================================
-- 1. SECTORS TABLE (Foundation)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed Initial Sectors if empty
INSERT INTO public.sectors (name) VALUES 
('Comunicação'), ('Financeira'), ('Procuradoria'), ('Registro'), ('Relatórios'), ('TI'), ('Análises')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 2. PROFILES TABLE (Core)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'MASTER_ADMIN')),
    sector_id UUID REFERENCES public.sectors(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    must_change_password BOOLEAN DEFAULT false,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 3. AUDIT LOGS (Mandatory)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g. 'INSERT', 'UPDATE', 'DELETE'
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Audit Trigger Function
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Try to get user ID from session, default to NULL (system action)
    v_user_id := auth.uid();
    
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (
        v_user_id,
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END
    );
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind Audit Triggers
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles AFTER INSERT OR UPDATE OR DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_sectors ON public.sectors;
CREATE TRIGGER audit_sectors AFTER INSERT OR UPDATE OR DELETE ON public.sectors FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();


-- ==============================================================================
-- 4. SYNC TRIGGER (Auth -> Profiles) (CRITICAL)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'USER';
BEGIN
    -- Master Admin Hardcoded Protection
    IF new.email = 'matheushsc1999@gmail.com' THEN
        v_role := 'MASTER_ADMIN';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, status)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        v_role,
        'active'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        role = CASE WHEN public.profiles.role = 'MASTER_ADMIN' THEN 'MASTER_ADMIN' ELSE EXCLUDED.role END;
        
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind Auth Trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 5. ROW LEVEL SECURITY (Strict Hierarchy)
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 5.1 SECTORS
CREATE POLICY "Public Read Sectors" ON public.sectors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins Manage Sectors" ON public.sectors FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles where id = auth.uid() and role IN ('ADMIN', 'MASTER_ADMIN')));

-- 5.2 AUDIT LOGS
CREATE POLICY "Admins View Logs" ON public.audit_logs FOR SELECT TO authenticated
USING (exists (select 1 from public.profiles where id = auth.uid() and role IN ('ADMIN', 'MASTER_ADMIN')));

-- 5.3 PROFILES (Complex Logic)
-- A. SELECT: Specfic rules
CREATE POLICY "User View Self" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admin View All" ON public.profiles FOR SELECT TO authenticated 
USING (exists (select 1 from public.profiles where id = auth.uid() and role IN ('ADMIN', 'MASTER_ADMIN')));

-- B. UPDATE: Hierarchy
CREATE POLICY "User Update Self" ON public.profiles FOR UPDATE TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id); -- User can only touch own row

CREATE POLICY "Admin Manage Users" ON public.profiles FOR UPDATE TO authenticated
USING (
    exists (select 1 from public.profiles where id = auth.uid() and role IN ('ADMIN', 'MASTER_ADMIN')) 
    AND id != auth.uid() -- Admin updates others (User updates self via other policy)
);

CREATE POLICY "Master Delete Users" ON public.profiles FOR DELETE TO authenticated
USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'MASTER_ADMIN'));

-- ==============================================================================
-- 6. BACKFILL & REPAIR
-- ==============================================================================
-- Sync any missing users
INSERT INTO public.profiles (id, email, full_name, role, status)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Usuário Recuperado'),
    CASE WHEN email = 'matheushsc1999@gmail.com' THEN 'MASTER_ADMIN' ELSE 'USER' END,
    'active'
FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id);

-- Ensure Master Admin Role
UPDATE public.profiles SET role = 'MASTER_ADMIN' WHERE email = 'matheushsc1999@gmail.com';

-- Grant Permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'Final Architecture Fix Applied Successfully' as result;
