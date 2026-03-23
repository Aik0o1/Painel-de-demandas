-- Add avatar_url to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512) NULL;

-- Create or Replace the profiles view to map to users
-- This ensures the frontend code using 'profiles' works correctly
CREATE OR REPLACE VIEW profiles AS
SELECT 
    id,
    id as user_id, -- Supabase auth often uses UUID, but our schema uses INT. Adjust if necessary.
    full_name,
    email,
    avatar_url,
    created_at,
    updated_at
FROM users;

-- Note: In a real Supabase setup, 'profiles' is often a separate table linked to auth.users.
-- Since we are using a custom 'users' table in this schema, we map it here.
-- Ideally, the frontend should probably update 'users' directly, but this view might allow reads.
-- For updates to work via the view, we might need an INSTEAD OF trigger or just update the table directly.
