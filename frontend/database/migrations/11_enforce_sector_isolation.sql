-- Enable RLS on core tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
-- Demands table likely already exists, ensure RLS is on
ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
-- Master Admin can see all users
CREATE POLICY "Master Admin sees all users" ON public.users
FOR ALL
USING (
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- Directors can see users in their own sector
CREATE POLICY "Director sees sector users" ON public.users
FOR SELECT
USING (
  sector_id = (SELECT sector_id FROM public.users WHERE id = auth.uid())
);

-- Users can see themselves
CREATE POLICY "Users see themselves" ON public.users
FOR SELECT
USING (
  auth.uid() = id
);

-- 2. Demands Policies (assuming demands table has sector_id)
-- First, add sector_id to demands if not exists
ALTER TABLE public.demands 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id);

-- Enforce isolation on Demands
CREATE POLICY "Sector Isolation for Demands" ON public.demands
FOR ALL
USING (
  -- User matches the sector of the demand
  sector_id = (SELECT sector_id FROM public.users WHERE id = auth.uid()) OR
  -- OR user is MASTER_ADMIN
  (SELECT role FROM public.users WHERE id = auth.uid()) = 'MASTER_ADMIN'
);

-- 3. Force Sector Assignment on Insert (Trigger) for Demands
-- When a user inserts a demand, it MUST have their sector_id
CREATE OR REPLACE FUNCTION public.set_demand_sector()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sector_id IS NULL THEN
    SELECT sector_id INTO NEW.sector_id FROM public.users WHERE id = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_demand_sector ON public.demands;
CREATE TRIGGER tr_set_demand_sector
BEFORE INSERT ON public.demands
FOR EACH ROW EXECUTE FUNCTION public.set_demand_sector();
