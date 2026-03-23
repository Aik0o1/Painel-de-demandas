-- Inventory / Assets Table for Administrativa
CREATE TABLE IF NOT EXISTS public.inventory_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- Asset Tag
    category TEXT NOT NULL, -- Furniture, Electronics, Vehicles
    location TEXT NOT NULL,
    status TEXT DEFAULT 'GOOD' CHECK (status IN ('GOOD', 'DAMAGED', 'MAINTENANCE', 'LOST')),
    acquisition_date DATE,
    value DECIMAL(10, 2),
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrativa and Master Admin Access Inventory" ON public.inventory_items
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'administrativa'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- HR / Employees Table (Simulated for this module, separate from Auth Users for now)
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    full_name TEXT NOT NULL,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    admission_date DATE NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrativa Access Employees" ON public.employees
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'administrativa'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);
