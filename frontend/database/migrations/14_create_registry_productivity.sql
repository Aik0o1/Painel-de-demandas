-- Registry (Productivity) Table
CREATE TABLE IF NOT EXISTS public.registry_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    protocol_number TEXT NOT NULL UNIQUE,
    document_type TEXT NOT NULL, -- Deed, Certification, Registration
    party_name TEXT NOT NULL, -- Name of person/company involved
    entry_date DATE DEFAULT CURRENT_DATE,
    deadline_date DATE,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ANALYZING', 'COMPLETED', 'REJECTED')),
    notes TEXT,
    sector_id UUID REFERENCES public.sectors(id),
    assigned_to UUID REFERENCES public.users(id), -- Analyst responsible
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.registry_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Registry and Master Admin Access" ON public.registry_items
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'registro'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- Trigger to auto-set deadline (simplistic: +5 days default)
CREATE OR REPLACE FUNCTION set_default_registry_deadline()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deadline_date IS NULL THEN
        NEW.deadline_date := NEW.entry_date + INTERVAL '5 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_registry_deadline
BEFORE INSERT ON public.registry_items
FOR EACH ROW
EXECUTE FUNCTION set_default_registry_deadline();
