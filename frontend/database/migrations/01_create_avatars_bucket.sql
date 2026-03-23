-- Create a new storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Policy to allow authenticated users to upload their own avatar
-- (Assuming the filename includes the user_id or is generated uniquely. 
-- For stricter security, you can enforce path checks, but for now we allow authenticated uploads)
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'avatars' );

-- Policy to allow everyone to view avatars
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

-- Policy to allow users to update/delete their own avatars would also be good
-- but let's start with basic upload/read for the fix.
