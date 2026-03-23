-- Force PostgREST to refresh the schema cache
-- This is necessary after adding new columns or changing table structure
-- so that the API knows about the changes.

NOTIFY pgrst, 'reload config';
