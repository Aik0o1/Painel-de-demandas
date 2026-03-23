-- Create Sectors Table
CREATE TABLE IF NOT EXISTS public.sectors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Default Sectors
INSERT INTO public.sectors (name, slug) VALUES
('Diretoria Financeira', 'financeira'),
('Diretoria Administrativa', 'administrativa'),
('Diretoria de Registro', 'registro'),
('Setor de Comunicação', 'comunicacao'),
('Tecnologia da Informação', 'ti'),
('Procuradoria', 'procuradoria')
ON CONFLICT (slug) DO NOTHING;

-- Add Role and Sector to Users table
-- Roles: MASTER_ADMIN (All access), DIRECTOR (Sector Admin), ANALYST (Standard User)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS sector_id UUID REFERENCES public.sectors(id),
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'ANALYST' CHECK (role IN ('MASTER_ADMIN', 'DIRECTOR', 'ANALYST'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_sector ON public.users(sector_id);

-- Update RLS Helper Function (Optional but good for performance later)
CREATE OR REPLACE FUNCTION public.get_user_sector_id(user_uuid uuid)
RETURNS uuid AS $$
  SELECT sector_id FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;
