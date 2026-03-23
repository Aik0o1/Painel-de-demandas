-- Communication Projects / Campaigns Table
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

-- RLS
ALTER TABLE public.communication_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comunicacao and Master Admin Access" ON public.communication_projects
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'comunicacao'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);
