-- Change avatar_url to TEXT to allow storing Base64 images directly
-- This bypasses the need for a Storage Bucket if it doesn't exist.

ALTER TABLE users ALTER COLUMN avatar_url TYPE text;

-- Re-create the view to ensure it picks up the change (if needed by Postgres versions)
CREATE OR REPLACE VIEW profiles AS
SELECT 
    id,
    id as user_id, 
    full_name,
    email,
    avatar_url,
    created_at,
    updated_at
FROM users;
