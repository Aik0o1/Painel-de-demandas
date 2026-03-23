-- Enable RLS on profiles if not already enabled (it should be, but safety first)
alter table profiles enable row level security;

-- Drop existing policy if it conflicts or looks wrong (optional, but cleaner)
-- drop policy if exists "Users can update own profile" on profiles;

-- Policy to allow users to update their own profile
create policy "Users can update own profile"
on profiles for update
to authenticated
using ( id = auth.uid() )
with check ( id = auth.uid() );

-- Policy to allow users to insert their own profile (usually handled by triggers, but good for completeness if client does it)
create policy "Users can insert own profile"
on profiles for insert
to authenticated
with check ( id = auth.uid() );
