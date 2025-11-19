-- Function to handle complete account deletion
-- This deletes the auth user which cascades to all related data

create table if not exists public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  email text not null,
  created_at timestamp with time zone default now() not null,
  processed boolean default false,
  processed_at timestamp with time zone
);

-- Enable RLS
alter table public.deletion_requests enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view own deletion requests" on public.deletion_requests;
drop policy if exists "Users can create own deletion requests" on public.deletion_requests;

-- Users can only see their own deletion requests
create policy "Users can view own deletion requests"
  on public.deletion_requests
  for select
  using (auth.uid() = user_id);

-- Users can create their own deletion requests
create policy "Users can create own deletion requests"
  on public.deletion_requests
  for insert
  with check (auth.uid() = user_id);

-- Function to delete user account completely including all related data
create or replace function public.delete_user_account()
returns json
language plpgsql
security definer
as $$
declare
  v_user_id uuid;
  v_email text;
  v_deleted_messages int;
  v_deleted_sessions int;
  v_deleted_exchanges int;
  v_deleted_listings int;
begin
  -- Get current user
  v_user_id := auth.uid();
  
  if v_user_id is null then
    return json_build_object('error', 'Not authenticated');
  end if;
  
  -- Get user email
  select email into v_email
  from auth.users
  where id = v_user_id;
  
  -- Log deletion request
  insert into public.deletion_requests (user_id, email, processed, processed_at)
  values (v_user_id, v_email, true, now());
  
  -- Delete all messages sent or received by user
  delete from public.messages 
  where sender_id = v_user_id or receiver_id = v_user_id;
  get diagnostics v_deleted_messages = row_count;
  
  -- Delete all sessions where user is mentor or mentee
  delete from public.sessions 
  where mentor_id = v_user_id or mentee_id = v_user_id;
  get diagnostics v_deleted_sessions = row_count;
  
  -- Delete all exchanges where user is requester or provider
  delete from public.exchanges 
  where requester_id = v_user_id or provider_id = v_user_id;
  get diagnostics v_deleted_exchanges = row_count;
  
  -- Delete all listings created by user
  delete from public.listings 
  where user_id = v_user_id;
  get diagnostics v_deleted_listings = row_count;
  
  -- Delete profile (will cascade to any other relations)
  delete from public.profiles where id = v_user_id;
  
  -- Delete from auth.users (final step)
  delete from auth.users where id = v_user_id;
  
  -- Return success with deletion counts
  return json_build_object(
    'success', true,
    'message', 'Account and all data deleted successfully',
    'deleted', json_build_object(
      'messages', v_deleted_messages,
      'sessions', v_deleted_sessions,
      'exchanges', v_deleted_exchanges,
      'listings', v_deleted_listings
    )
  );
exception
  when others then
    return json_build_object('error', SQLERRM);
end;
$$;
