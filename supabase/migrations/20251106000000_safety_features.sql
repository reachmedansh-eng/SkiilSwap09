-- Add date of birth to profiles for age verification
alter table public.profiles add column if not exists date_of_birth date;

-- Create blocked_users table for safety
create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  reason text,
  -- Ensure a user can't block the same person twice
  unique(blocker_id, blocked_id)
);

-- Enable RLS on blocked_users
alter table public.blocked_users enable row level security;

-- Users can view their own blocks
create policy "Users can view own blocks"
  on public.blocked_users
  for select
  using (auth.uid() = blocker_id);

-- Users can create their own blocks
create policy "Users can create blocks"
  on public.blocked_users
  for insert
  with check (auth.uid() = blocker_id);

-- Users can delete their own blocks (unblock)
create policy "Users can delete own blocks"
  on public.blocked_users
  for delete
  using (auth.uid() = blocker_id);

-- Create indexes for performance
create index if not exists blocked_users_blocker_idx on public.blocked_users(blocker_id);
create index if not exists blocked_users_blocked_idx on public.blocked_users(blocked_id);

-- Function to check if user is blocked
create or replace function public.is_user_blocked(target_user_id uuid)
returns boolean
language plpgsql
security definer
stable
as $$
declare
  v_current_user uuid;
begin
  v_current_user := auth.uid();
  
  if v_current_user is null then
    return false;
  end if;
  
  -- Check if current user blocked target OR target blocked current user
  return exists (
    select 1 from public.blocked_users
    where (blocker_id = v_current_user and blocked_id = target_user_id)
       or (blocker_id = target_user_id and blocked_id = v_current_user)
  );
end;
$$;

-- Function to get age from date of birth
create or replace function public.calculate_age(dob date)
returns integer
language sql
immutable
as $$
  select extract(year from age(dob))::integer;
$$;
