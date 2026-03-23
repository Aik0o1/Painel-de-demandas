-- 1. Add column to store the Supabase Auth UUID in our custom users table
-- We need this because our 'id' is likely an Integer (from the MySQL styling), but Auth uses UUIDs.
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- 2. Update the Profiles view to map the UUID correctly
-- This is crucial for 'useProfiles' to find the user by their Auth ID.
CREATE OR REPLACE VIEW profiles AS
SELECT 
    id,
    auth_user_id as user_id, -- Map the UUID column to 'user_id' for the frontend
    full_name,
    email,
    avatar_url,
    created_at,
    updated_at
FROM users;

-- 3. Create a Trigger Function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, email, full_name, status)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'ACTIVE'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the Trigger to auth.users
-- This ensures that whenever a user signs up via Supabase Auth, they are added to our table.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. (Optional) Backfill existing users if needed
-- UPDATE users SET auth_user_id = (SELECT id FROM auth.users WHERE auth.users.email = users.email) WHERE auth_user_id IS NULL;
