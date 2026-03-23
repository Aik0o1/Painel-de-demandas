-- Create Contracts Table for Financeira Sector
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    supplier TEXT NOT NULL,
    value DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'EXPIRED', 'PENDING', 'CANCELED')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

-- RLS: Only Financeira Sector and Master Admin can see/edit
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financeira and Master Admin Access" ON public.contracts
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'financeira'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    description TEXT NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    category TEXT NOT NULL,
    sector_id UUID REFERENCES public.sectors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES public.users(id)
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Financeira and Master Admin Access Expenses" ON public.expenses
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'financeira'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);
