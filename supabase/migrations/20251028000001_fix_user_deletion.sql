-- Fix user deletion issues

-- 1. Add DELETE policy for profiles (users can delete their own profile)
drop policy if exists "Users can delete own profile" on public.profiles;
create policy "Users can delete own profile"
  on public.profiles for delete
  using (auth.uid() = id);

-- 2. Fix deletion for admin/service role
-- Allow service role to delete any profile
drop policy if exists "Service role can delete any profile" on public.profiles;
create policy "Service role can delete any profile"
  on public.profiles for delete
  to service_role
  using (true);

-- 3. Add function to delete user completely (both auth and profile)
create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  user_id uuid;
begin
  user_id := auth.uid();
  
  if user_id is null then
    raise exception 'Not authenticated';
  end if;
  
  -- Delete from auth.users (will cascade to profiles and all related data)
  delete from auth.users where id = user_id;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.delete_user_account() to authenticated;

comment on function public.delete_user_account is 'Allows users to delete their own account (auth + profile + all related data)';

-- 4. Add admin function to delete any user
create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Only allow if current user is admin (you can add admin check here)
  -- For now, only service role can execute this
  
  -- Delete from auth.users (will cascade to profiles and all related data)
  delete from auth.users where id = target_user_id;
end;
$$;

-- Only grant to service role (for admin operations)
grant execute on function public.admin_delete_user(uuid) to service_role;

comment on function public.admin_delete_user is 'Admin function to delete any user account';
