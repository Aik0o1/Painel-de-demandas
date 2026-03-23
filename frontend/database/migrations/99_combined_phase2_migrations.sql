-- ==========================================
-- PHASE 2 CONSOLIDATED MIGRATION SCRIPT
-- Includes: Communication, TI, Legal, Notifications
-- ==========================================

-- 1. COMMUNICATION SECTOR
-- ==========================================
CREATE TABLE IF NOT EXISTS public.communication_projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    status TEXT DEFAULT 'PLANNING' CHECK (status IN ('PLANNING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    sector_id UUID REFERENCES public.sectors(id),
    responsible_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.communication_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comunicacao and Master Admin Access" ON public.communication_projects
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'comunicacao'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- 2. IT SECTOR (TI)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.ti_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requester_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'OTHER')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED')),
    sector_id UUID REFERENCES public.sectors(id),
    assigned_technician_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ti_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TI and Master Admin Access" ON public.ti_tickets
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'ti'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- 3. LEGAL SECTOR (PROCURADORIA)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.legal_processes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    court TEXT,
    party_name TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_ANALYSIS', 'SUSPENDED', 'CLOSED', 'ARCHIVED')),
    deadline_date DATE,
    sector_id UUID REFERENCES public.sectors(id),
    responsible_lawyer_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.legal_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Procuradoria and Master Admin Access" ON public.legal_processes
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'procuradoria'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- 4. NOTIFICATIONS SYSTEM
-- ==========================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO' CHECK (type IN ('INFO', 'SUCCESS', 'WARNING', 'ERROR')),
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications" ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System/Admin can insert notifications" ON public.notifications
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their notifications (mark read)" ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Optional helper function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT DEFAULT 'INFO',
    p_link TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (p_user_id, p_title, p_message, p_type, p_link)
    RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
