-- TI Helpdesk Tickets Table
CREATE TABLE IF NOT EXISTS public.ti_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requester_name TEXT NOT NULL, -- Or link to User ID
    category TEXT NOT NULL CHECK (category IN ('HARDWARE', 'SOFTWARE', 'NETWORK', 'ACCESS', 'OTHER')),
    priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'IN_PROGRESS', 'WAITING_USER', 'RESOLVED', 'CLOSED')),
    sector_id UUID REFERENCES public.sectors(id),
    assigned_technician_id UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE public.ti_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "TI and Master Admin Access" ON public.ti_tickets
FOR ALL
USING (
  (SELECT slug FROM public.sectors WHERE id = (SELECT sector_id FROM public.users WHERE id = auth.uid())) = 'ti'
  OR 
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);
