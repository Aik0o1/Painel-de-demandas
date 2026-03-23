-- EMERGENCY FIX: Activate all existing users
-- This fixes the issue where old users have NULL status and get locked out.

UPDATE public.users 
SET status = 'ACTIVE' 
WHERE status IS NULL OR status != 'ACTIVE';

-- Make sure future users default to ACTIVE
ALTER TABLE public.users 
ALTER COLUMN status SET DEFAULT 'ACTIVE';
