-- ==============================================================================
-- 201_sector_tables_fix.sql
-- SECTOR DATA: Tables, RLS, & Audits
-- ==============================================================================

-- 0. DEPENDENCY CHECK (Ensure function exists)
CREATE OR REPLACE FUNCTION public.log_audit_event()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
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


-- 1. COMMUNICATION PROJECTS
CREATE TABLE IF NOT EXISTS public.communication_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    priority TEXT CHECK (priority IN ('HIGH', 'MEDIUM', 'LOW')),
    status TEXT CHECK (status IN ('PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED')),
    start_date DATE,
    end_date DATE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.communication_projects ENABLE ROW LEVEL SECURITY;

-- 2. TI TICKETS
CREATE TABLE IF NOT EXISTS public.ti_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    requester_name TEXT,
    category TEXT,
    priority TEXT CHECK (priority IN ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW')),
    status TEXT CHECK (status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.ti_tickets ENABLE ROW LEVEL SECURITY;

-- 3. ADMINISTRATIVE EMPLOYEES (RH)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    position TEXT,
    department TEXT,
    admission_date DATE,
    status TEXT CHECK (status IN ('ACTIVE', 'VACATION', 'LEAVE', 'INACTIVE')),
    email TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- 4. ADMINISTRATIVE INVENTORY
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    category TEXT,
    location TEXT,
    status TEXT CHECK (status IN ('GOOD', 'DAMAGED', 'MAINTENANCE', 'LOST')),
    purchase_date DATE,
    value DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 5. RLS POLICIES (Team Access)
-- ==============================================================================
-- For now, allow authenticated users to view/edit sector data.
-- Refine this later to be Sector-Specific restrictions if needed.

-- Communication
CREATE POLICY "Auth Users Manage Projects" ON public.communication_projects
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TI
CREATE POLICY "Auth Users Manage Tickets" ON public.ti_tickets
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Employees
CREATE POLICY "Auth Users Manage Employees" ON public.employees
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Inventory
CREATE POLICY "Auth Users Manage Inventory" ON public.inventory_items
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==============================================================================
-- 6. AUDIT TRIGGERS
-- ==============================================================================
-- Attach the existing log_audit_event() function to these tables

DROP TRIGGER IF EXISTS audit_communication_projects ON public.communication_projects;
CREATE TRIGGER audit_communication_projects AFTER INSERT OR UPDATE OR DELETE ON public.communication_projects FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_ti_tickets ON public.ti_tickets;
CREATE TRIGGER audit_ti_tickets AFTER INSERT OR UPDATE OR DELETE ON public.ti_tickets FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_employees ON public.employees;
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

DROP TRIGGER IF EXISTS audit_inventory_items ON public.inventory_items;
CREATE TRIGGER audit_inventory_items AFTER INSERT OR UPDATE OR DELETE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();

SELECT 'Sector tables created/updated and secured via RLS' as result;
