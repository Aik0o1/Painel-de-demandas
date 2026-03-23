-- Legal Processes Table
CREATE TABLE IF NOT EXISTS public.legal_processes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    process_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    description TEXT,
    court TEXT, -- Tribunal de Justiça, etc.
    party_name TEXT NOT NULL, -- Requerente/Requerido
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_ANALYSIS', 'SUSPENDED', 'CLOSED', 'ARCHIVED')),
    deadline_date DATE,
    sector_id UUID REFERENCES public.sectors(id),
    responsible_lawyer_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.legal_processes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Procuradoria and Master Admin Access" ON public.legal_processes
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'procuradoria'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);
