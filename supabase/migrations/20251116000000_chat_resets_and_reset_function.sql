-- Chat Resets and Block Enforcement
-- 1) Create a chat_resets table to track conversation resets between two users
-- 2) Provide a SECURITY DEFINER function to hard reset (delete) the chat for both users
-- 3) Ensure message insert policy blocks when either party has blocked the other

-- Create chat_resets (pair ordered by user_a < user_b for uniqueness)
create table if not exists public.chat_resets (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  reset_at timestamptz not null default now(),
  constraint user_pair_order check (user_a < user_b),
  constraint user_pair_unique unique (user_a, user_b)
);

-- Function to reset conversation: upsert reset and delete all messages between users
create or replace function public.reset_conversation(p_user1 uuid, p_user2 uuid)
returns void
language plpgsql
security definer
as $$
declare
  a uuid;
  b uuid;
begin
  if p_user1 is null or p_user2 is null then
    raise exception 'Users cannot be null';
  end if;
  if p_user1 = p_user2 then
    raise exception 'Users must be different';
  end if;

  if p_user1 < p_user2 then
    a := p_user1; b := p_user2;
  else
    a := p_user2; b := p_user1;
  end if;

  insert into public.chat_resets (user_a, user_b, reset_at)
  values (a, b, now())
  on conflict (user_a, user_b) do update set reset_at = excluded.reset_at;

  -- Physically delete all messages between the two users to ensure a fresh chat
  delete from public.messages
  where (sender_id = a and receiver_id = b)
     or (sender_id = b and receiver_id = a);
end;
$$;

grant execute on function public.reset_conversation(uuid, uuid) to anon, authenticated;

-- Re-assert the blocking policy for message inserts (drop then create)
drop policy if exists "Users can send messages" on public.messages;

create policy "Users can send messages"
on public.messages for insert
with check (
  auth.uid() = sender_id
  and not exists (
    select 1
    from public.blocked_users b
    where (
      (b.blocker_id = auth.uid() and b.blocked_id = receiver_id) or
      (b.blocked_id = auth.uid() and b.blocker_id = receiver_id)
    )
  )
);
