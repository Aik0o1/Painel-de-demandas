-- ==============================================================================
-- 100_full_system_structure.sql
-- COMPLETE SYSTEM RESET & STRUCTURE
-- INCLUDES: Table Creation, Triggers, RLS, and BACKFILL for existing users
-- ==============================================================================

-- 1. SECTORS (BASE TABLE)
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Sectors
INSERT INTO public.sectors (slug, name) VALUES
    ('financeira', 'Diretoria Financeira'),
    ('administrativa', 'Diretoria Administrativa'),
    ('registro', 'Diretoria de Registro'),
    ('comunicacao', 'Comunicação'),
    ('ti', 'Tecnologia da Informação'),
    ('procuradoria', 'Procuradoria')
ON CONFLICT (slug) DO NOTHING;

-- 2. PROFILES (USER TABLE)
-- Strictly named 'profiles'
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('admin_master', 'admin', 'user')),
    sector_id UUID REFERENCES public.sectors(id),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'blocked')),
    must_change_password BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. TRIGGER FUNCTION (Handle Future Signups)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_role TEXT := 'user';
BEGIN
    -- Check for Admin Master specific email
    IF new.email = 'matheushsc1999@gmail.com' THEN
        v_role := 'admin_master';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role, status, sector_id)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
        new.email,
        v_role,
        'active',
        NULL -- No default sector initially
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Definition
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. *** BACKFILL FOR EXISTING USERS ***
-- This matches existing auth.users to profiles to fix empty table issues
INSERT INTO public.profiles (id, email, full_name, role, status, created_at)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Usuário Existente'),
    CASE 
        WHEN email = 'matheushsc1999@gmail.com' THEN 'admin_master'
        ELSE 'user'
    END,
    'active',
    created_at
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role, -- Ensures Admin Master gets role if missed
    email = EXCLUDED.email;


-- 5. MODULE TABLES
-- ============================

-- DEMANDS
CREATE TABLE IF NOT EXISTS public.demands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'Backlog',
    priority TEXT DEFAULT 'Média',
    sector_id UUID REFERENCES public.sectors(id), 
    assigned_to UUID REFERENCES public.profiles(id),
    requester_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- CONTRACTS
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    contractor TEXT NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    status TEXT DEFAULT 'active',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- INVENTORY & EMPLOYEES
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    quantity INTEGER DEFAULT 0,
    category TEXT,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT,
    admission_date DATE,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- REGISTRY
CREATE TABLE IF NOT EXISTS public.registry_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_number TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT DEFAULT 'received',
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.registry_items ENABLE ROW LEVEL SECURITY;

-- COMMUNICATION
CREATE TABLE IF NOT EXISTS public.communication_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'PLANNING',
    priority TEXT DEFAULT 'MEDIUM',
    sector_id UUID REFERENCES public.sectors(id),
    responsible_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.communication_projects ENABLE ROW LEVEL SECURITY;

-- TI
CREATE TABLE IF NOT EXISTS public.ti_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'OPEN',
    sector_id UUID REFERENCES public.sectors(id),
    assigned_technician_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.ti_tickets ENABLE ROW LEVEL SECURITY;

-- LEGAL
CREATE TABLE IF NOT EXISTS public.legal_processes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.legal_processes ENABLE ROW LEVEL SECURITY;

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 6. RLS POLICIES
-- ============================

-- PROFILES
CREATE POLICY "Master Admin sees all profiles" ON public.profiles FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
);
CREATE POLICY "Users see own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "Sector members see colleagues" ON public.profiles FOR SELECT USING (
    sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);

-- GENERIC POLICY FUNCTION REPLACEMENT (Explicit policies for simplicity)
-- Demands
CREATE POLICY "Access Demands" ON public.demands FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Contracts
CREATE POLICY "Access Contracts" ON public.contracts FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Inventory
CREATE POLICY "Access Inventory" ON public.inventory_items FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Employees
CREATE POLICY "Access Employees" ON public.employees FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Registry
CREATE POLICY "Access Registry" ON public.registry_items FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Communication
CREATE POLICY "Access Communication" ON public.communication_projects FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- TI
CREATE POLICY "Access TI" ON public.ti_tickets FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Legal
CREATE POLICY "Access Legal" ON public.legal_processes FOR ALL USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin_master'
    OR sector_id = (SELECT sector_id FROM public.profiles WHERE id = auth.uid())
);
-- Notifications
CREATE POLICY "Own Notifications" ON public.notifications FOR ALL USING (user_id = auth.uid());
